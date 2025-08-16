import { create } from 'zustand';
import { CalendarEvent, CalendarStore, nowMs } from '../types';
import electronDB from '../services/electronDB';

// Linus式改进：AbortController作为状态的一部分管理
interface CalendarStoreInternal extends CalendarStore {
  _abortController: AbortController | null;
}

const useCalendarStore = create<CalendarStoreInternal>((set, get) => ({
  events: [],
  selectedMs: nowMs(),
  viewMs: nowMs(),
  view: 'month',
  isLoading: false,
  _abortController: null,

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

  // Unified save method - handles both create and update
  saveEvent: async (event) => {
    try {
      const savedEvent = await electronDB.saveEvent(event);
      if (savedEvent) {
        set((state) => {
          const existingIndex = state.events.findIndex(e => e.id === savedEvent.id);
          if (existingIndex >= 0) {
            // Update existing
            const newEvents = [...state.events];
            newEvents[existingIndex] = savedEvent;
            return { events: newEvents };
          } else {
            // Add new
            return { events: [...state.events, savedEvent] };
          }
        });
        return savedEvent;
      }
    } catch (error) {
      console.error('Failed to save event:', error);
    }
    return null;
  },

  deleteEvent: async (id) => {
    try {
      const success = await electronDB.deleteEvent(id);
      if (success) {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }));
        return true;
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
    return false;
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
  }
}));

export default useCalendarStore;