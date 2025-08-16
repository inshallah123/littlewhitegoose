import { CalendarEvent } from '../types';

class ElectronDatabaseService {
  // Check if running in Electron environment
  private get isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI && !!window.electronAPI?.db;
  }

  async getAllEvents(): Promise<CalendarEvent[]> {
    if (!this.isElectron) {
      console.warn('Not running in Electron, returning empty events');
      return [];
    }

    try {
      const events = await window.electronAPI!.db.getAllEvents();
      // 确保 start 和 end 字段是真正的 Date 对象
      return events.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  async createEvent(eventData: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> {
    if (!this.isElectron) {
      console.warn('Not running in Electron, cannot create event');
      return null;
    }

    try {
      const event = await window.electronAPI!.db.createEvent(eventData);
      if (event) {
        // 确保返回的事件有正确的 Date 对象
        return {
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to create event:', error);
      return null;
    }
  }

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    if (!this.isElectron) {
      console.warn('Not running in Electron, cannot update event');
      return null;
    }

    try {
      const event = await window.electronAPI!.db.updateEvent(id, updates);
      if (event) {
        // 确保返回的事件有正确的 Date 对象
        return {
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to update event:', error);
      return null;
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    if (!this.isElectron) {
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
    if (!this.isElectron) {
      return { events: 0 };
    }

    try {
      return await window.electronAPI!.db.getStats();
    } catch (error) {
      console.error('Failed to get stats:', error);
      return { events: 0 };
    }
  }

  // Setup menu event listeners
  setupMenuListeners(onNewEvent: () => void, onChangeView: (view: string) => void) {
    if (!this.isElectron) return;

    window.electronAPI!.onNewEvent(onNewEvent);
    window.electronAPI!.onChangeView((event, view) => onChangeView(view));
  }
}

export default new ElectronDatabaseService();