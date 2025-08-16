import { create } from 'zustand';
import { CalendarEvent, CalendarStore } from '../types';
import electronDB from '../services/electronDB';

const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  selectedDate: new Date(),
  view: 'month',
  isLoading: false,

  // Load events from database
  loadEvents: async () => {
    set({ isLoading: true });
    try {
      const events = await electronDB.getAllEvents();
      set({ events, isLoading: false });
    } catch (error) {
      console.error('Failed to load events:', error);
      set({ isLoading: false });
    }
  },

  addEvent: async (event) => {
    try {
      const newEvent = await electronDB.createEvent(event);
      if (newEvent) {
        set((state) => ({
          events: [...state.events, newEvent],
        }));
        return newEvent;
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
    return null;
  },

  updateEvent: async (id, updatedEvent) => {
    try {
      const updated = await electronDB.updateEvent(id, updatedEvent);
      if (updated) {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? updated : event
          ),
        }));
        return updated;
      }
    } catch (error) {
      console.error('Failed to update event:', error);
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

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setView: (view) => {
    set({ view });
  },
}));

export default useCalendarStore;