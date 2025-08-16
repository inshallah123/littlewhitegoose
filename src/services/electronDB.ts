import { CalendarEvent, EventRow, ReminderRow } from '../types';

class ElectronDatabaseService {
  // Check if running in Electron environment
  private get hasElectron(): boolean {
    return !!window.electronAPI?.db;
  }

  async getAllEvents(): Promise<CalendarEvent[]> {
    if (!this.hasElectron) {
      console.warn('Not running in Electron, returning empty events');
      return [];
    }

    try {
      // Use optimized query if available
      if (typeof window.electronAPI!.db.getAllEventsWithReminders === 'function') {
        const { events, reminders } = await window.electronAPI!.db.getAllEventsWithReminders();
        return this.mapEventsWithReminders(events, reminders);
      } else {
        // Fallback - this shouldn't happen with updated preload
        console.warn('Using legacy getAllEvents method');
        return [];
      }
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  // Map database rows to CalendarEvent objects
  private mapEventsWithReminders(events: EventRow[], reminders: ReminderRow[]): CalendarEvent[] {
    const reminderMap = new Map<string, any[]>();
    reminders.forEach(r => {
      if (!reminderMap.has(r.event_id)) {
        reminderMap.set(r.event_id, []);
      }
      reminderMap.get(r.event_id)!.push({
        id: r.id,
        minutes: r.minutes,
        type: r.type
      });
    });

    return events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      startMs: event.start_time * 1000,
      endMs: event.end_time * 1000,
      color: event.color || '#1890ff',
      isAllDay: Boolean(event.is_all_day),
      tags: event.tags ? JSON.parse(event.tags) : [],
      reminders: reminderMap.get(event.id) || undefined,
    }));
  }

  async saveEvent(eventData: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    if (!this.hasElectron) {
      console.warn('Not running in Electron, cannot save event');
      return null;
    }

    try {
      const event = await window.electronAPI!.db.saveEvent(eventData);
      return event;
    } catch (error) {
      console.error('Failed to save event:', error);
      return null;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    if (!this.hasElectron) {
      console.warn('Not running in Electron, cannot delete event');
      return false;
    }

    try {
      return await window.electronAPI!.db.deleteEvent(id);
    } catch (error) {
      console.error('Failed to delete event:', error);
      return false;
    }
  }

  async getStats(): Promise<{ events: number }> {
    if (!this.hasElectron) {
      return { events: 0 };
    }

    try {
      return await window.electronAPI!.db.getStats();
    } catch (error) {
      console.error('Failed to get stats:', error);
      return { events: 0 };
    }
  }

  // Setup menu event listeners and return a cleanup function
  setupMenuListeners(
    onNewEvent: () => void, 
    onChangeView: (view: string) => void,
    onEventsCleared: () => void
  ): () => void {
    if (!this.hasElectron) {
      return () => {}; // Return an empty function if not in Electron
    }

    const cleanups = [
      window.electronAPI!.onNewEvent(onNewEvent),
      window.electronAPI!.onChangeView((view) => onChangeView(view)),
      window.electronAPI!.onEventsCleared(onEventsCleared)
    ];

    // Return a function that calls all cleanup functions
    return () => {
      cleanups.forEach(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup();
        }
      });
    };
  }
}

export default new ElectronDatabaseService();