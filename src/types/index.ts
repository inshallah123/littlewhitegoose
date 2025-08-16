export interface CalendarEvent {
  id: string;
  title: string;
  startMs: number;  // Unix timestamp in milliseconds
  endMs: number;    // Unix timestamp in milliseconds
  description?: string;
  color?: string;
  isAllDay?: boolean;
}

// Legacy interface for react-big-calendar compatibility
export interface ReactCalendarEvent {
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
  selectedMs: number;  // Selected timestamp
  viewMs: number;      // Current view timestamp
  view: 'month' | 'week';
  isLoading: boolean;
  
  // Actions
  loadEvents: () => Promise<void>;
  saveEvent: (event: Partial<CalendarEvent>) => Promise<CalendarEvent | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  setSelectedMs: (ms: number) => void;
  setViewMs: (ms: number) => void;
  setView: (view: 'month' | 'week') => void;
  cleanup: () => void;
}

// Database row interface (internal)
export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  start_time: number;  // Unix timestamp in seconds
  end_time: number;    // Unix timestamp in seconds
  color: string;
  is_all_day: number;
  created_at: number;
  updated_at: number;
}

export interface ReminderRow {
  id: string;
  event_id: string;
  minutes: number;
  type: string;
}

// Electron API types
declare global {
  interface Window {
    electronAPI?: {
      db: {
        getAllEventsWithReminders: () => Promise<{ events: EventRow[], reminders: ReminderRow[] }>;
        saveEvent: (eventData: Partial<CalendarEvent>) => Promise<CalendarEvent>;
        deleteEvent: (id: string) => Promise<boolean>;
        getStats: () => Promise<{ events: number }>;
      };
      onNewEvent: (callback: () => void) => (() => void);
      onChangeView: (callback: (event: any, view: string) => void) => (() => void);
    };
  }
}

// Utility functions for time conversion
export const msToDate = (ms: number): Date => new Date(ms);
export const dateToMs = (date: Date): number => date.getTime();
export const nowMs = (): number => Date.now();

// Convert between internal and legacy formats
export const toReactEvent = (event: CalendarEvent): ReactCalendarEvent => ({
  ...event,
  start: msToDate(event.startMs),
  end: msToDate(event.endMs)
});

export const fromReactEvent = (event: ReactCalendarEvent): CalendarEvent => ({
  ...event,
  startMs: dateToMs(event.start),
  endMs: dateToMs(event.end)
});