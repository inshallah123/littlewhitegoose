import { create } from 'zustand';
import { CalendarEvent, CalendarStore, nowMs } from '../types';
import electronDB from '../services/electronDB';
import { generateRecurringEvents } from '../utils/recurrence';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

// Linus式改进：AbortController作为状态的一部分管理
interface CalendarStoreInternal extends CalendarStore {
  backgroundImage: string | null;
  backgroundFit: 'cover' | 'contain' | 'stretch' | 'tile';
  _abortController: AbortController | null;
  getEventsInView: (viewStartDate: Date, viewEndDate: Date) => CalendarEvent[];
  deleteEvent: (id: string, scope: 'one' | 'all', startMs?: number) => Promise<boolean>;
  saveEvent: (event: Partial<CalendarEvent>, scope?: 'one' | 'all') => Promise<CalendarEvent | null>;
  setBackgroundImage: (imageUrl: string | null) => void;
  setBackgroundFit: (fit: 'cover' | 'contain' | 'stretch' | 'tile') => void;
  loadBackgroundImage: () => void;
}

const useCalendarStore = create<CalendarStoreInternal>((set, get) => ({
  events: [],
  selectedMs: nowMs(),
  viewMs: nowMs(),
  view: 'month',
  isLoading: false,
  backgroundImage: null,
  backgroundFit: 'contain',
  _abortController: null,

  // New function to get events for the current view
  getEventsInView: (viewStartDate, viewEndDate) => {
    const { events } = get();
    const normalEvents: CalendarEvent[] = [];
    const recurringEvents: CalendarEvent[] = [];

    for (const event of events) {
      if (event.recurrenceRule) {
        recurringEvents.push(event);
      } else {
        // Check if the non-recurring event is within the view
        if (event.startMs <= viewEndDate.getTime() && event.endMs >= viewStartDate.getTime()) {
          normalEvents.push(event);
        }
      }
    }

    const recurringInstances = recurringEvents.flatMap(recurringEvent =>
      generateRecurringEvents(recurringEvent, viewStartDate, viewEndDate)
    );

    return [...normalEvents, ...recurringInstances];
  },

  // Load events from database - 消除竞态条件
  loadEvents: async () => {
    const state = get();
    
    // Cancel previous load if still in progress
    if (state._abortController) {
      state._abortController.abort();
    }
    
    const controller = new AbortController();
    set({ isLoading: true, _abortController: controller });
    
    try {
      const events = await electronDB.getAllEvents();
      
      // Check if this request was cancelled
      if (controller.signal.aborted) {
        return;
      }
      
      set({ events, isLoading: false, _abortController: null });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      console.error('Failed to load events:', error);
      set({ events: [], isLoading: false, _abortController: null });
    }
  },

  // Unified save method - handles both create and update, now with scope
  saveEvent: async (event, scope = 'all') => {
    const { events, saveEvent } = get();
    
    // Editing a single instance of a recurring event
    if (scope === 'one' && event.id) {
      const originalEvent = events.find(e => e.id === event.id);
      const exceptionDate = event.startMs;
      if (!originalEvent || typeof exceptionDate === 'undefined') return null;

      // 1. Add an exception to the original event
      const updatedOriginalEvent: CalendarEvent = {
        ...originalEvent,
        exceptionDates: [...(originalEvent.exceptionDates || []), exceptionDate],
      };
      await electronDB.saveEvent(updatedOriginalEvent);

      // 2. Create a new, separate event for the edited instance
      const newStandaloneEvent: Partial<CalendarEvent> = {
        ...event,
        id: undefined, // Let DB create a new ID
        recurrenceRule: undefined, // It's no longer recurring
        seriesId: originalEvent.id, // Link back to the original series
      };
      
      const savedStandaloneEvent = await electronDB.saveEvent(newStandaloneEvent);
      
      // 3. Update state
      if (savedStandaloneEvent) {
        set((state): Partial<CalendarStoreInternal> => ({
          events: [
            ...state.events.filter(e => e.id !== originalEvent.id),
            updatedOriginalEvent,
            savedStandaloneEvent
          ]
        }));
      }
      return savedStandaloneEvent;

    } else {
      // Standard save/update for a series or a non-recurring event
      const savedEvent = await electronDB.saveEvent(event);
      if (savedEvent) {
        set((state) => {
          const existingIndex = state.events.findIndex(e => e.id === savedEvent.id);
          if (existingIndex >= 0) {
            const newEvents = [...state.events];
            newEvents[existingIndex] = savedEvent;
            return { events: newEvents };
          } else {
            return { events: [...state.events, savedEvent] };
          }
        });
        return savedEvent;
      }
    }
    return null;
  },

  deleteEvent: async (id, scope = 'all', startMs) => {
    const { events, saveEvent } = get();

    if (scope === 'one' && startMs) {
      const eventToDelete = events.find(e => e.id === id);
      if (eventToDelete) {
        const updatedEvent: CalendarEvent = {
          ...eventToDelete,
          exceptionDates: [...(eventToDelete.exceptionDates || []), startMs],
        };
        await saveEvent(updatedEvent, 'all');
        return true;
      }
      return false;
    } else {
      // Delete the entire series
      try {
        const success = await electronDB.deleteEvent(id);
        if (success) {
          set((state) => ({
            events: state.events.filter((event) => event.id !== id),
          }));
          return true;
        }
      } catch (error) {
        console.error('Failed to delete event series:', error);
      }
      return false;
    }
  },

  // Action to clear all events from the state
  clearAllEvents: () => {
    set({ events: [] });
  },

  setSelectedMs: (ms) => {
    set({ selectedMs: ms });
  },

  setViewMs: (ms) => {
    set({ viewMs: ms });
  },

  setView: (view) => {
    set({ view });
  },
  
  // Cleanup function for unmounting
  cleanup: () => {
    const state = get();
    
    // Cancel any pending loads
    if (state._abortController) {
      state._abortController.abort();
    }
    
    // Reset state
    set({
      events: [],
      isLoading: false,
      _abortController: null
    });
  },

  // Set background image and persist to localStorage
  setBackgroundImage: (imageUrl) => {
    if (imageUrl) {
      localStorage.setItem('backgroundImage', imageUrl);
    } else {
      localStorage.removeItem('backgroundImage');
    }
    set({ backgroundImage: imageUrl });
  },

  // Set background fit mode
  setBackgroundFit: (fit) => {
    localStorage.setItem('backgroundFit', fit);
    set({ backgroundFit: fit });
  },

  // Load background image from localStorage on startup
  loadBackgroundImage: () => {
    const imageUrl = localStorage.getItem('backgroundImage');
    const fit = localStorage.getItem('backgroundFit') as 'cover' | 'contain' | 'stretch' | 'tile' || 'contain';
    if (imageUrl) {
      set({ backgroundImage: imageUrl, backgroundFit: fit });
    }
  }
}));

export default useCalendarStore;