export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  color?: string;
  isAllDay?: boolean;
}

export interface CalendarStore {
  events: CalendarEvent[];
  selectedDate: Date;
  view: 'month' | 'week';
  isLoading: boolean;
  
  // Actions
  loadEvents: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<CalendarEvent | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  setSelectedDate: (date: Date) => void;
  setView: (view: 'month' | 'week') => void;
}

// Electron API types
declare global {
  interface Window {
    electronAPI?: {
      db: {
        getAllEvents: () => Promise<CalendarEvent[]>;
        createEvent: (eventData: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
        updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent>;
        deleteEvent: (id: string) => Promise<boolean>;
        getStats: () => Promise<{ events: number }>;
      };
      onNewEvent: (callback: () => void) => void;
      onChangeView: (callback: (event: any, view: string) => void) => void;
    };
  }
}