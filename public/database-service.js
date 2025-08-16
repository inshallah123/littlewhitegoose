const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class DatabaseService {
  constructor() {
    // Get user data path for database storage
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'calendar.db');
    
    this.db = new Database(dbPath);
    this.initTables();
  }

  initTables() {
    // Create events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        color TEXT,
        is_all_day INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s','now')),
        updated_at INTEGER DEFAULT (strftime('%s','now'))
      )
    `);

    // --- MIGRATIONS ---
    const columns = this.db.prepare("PRAGMA table_info(events)").all();
    const columnNames = columns.map(col => col.name);

    if (!columnNames.includes('tags')) {
      this.db.exec('ALTER TABLE events ADD COLUMN tags TEXT');
    }
    if (!columnNames.includes('recurrence_rule')) {
      this.db.exec('ALTER TABLE events ADD COLUMN recurrence_rule TEXT');
    }
    if (!columnNames.includes('exception_dates')) {
      this.db.exec('ALTER TABLE events ADD COLUMN exception_dates TEXT');
    }
    if (!columnNames.includes('series_id')) {
      this.db.exec('ALTER TABLE events ADD COLUMN series_id TEXT');
    }
    // --- END MIGRATIONS ---

    // Create reminders table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        minutes INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'notification',
        FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
      )
    `);

    // Create index for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_events_start_time ON events (start_time);
      CREATE INDEX IF NOT EXISTS idx_reminders_event_id ON reminders (event_id);
    `);
  }

  // Optimized: Get all events with reminders in single query
  getAllEventsWithReminders() {
    // Get all events
    const eventsStmt = this.db.prepare(`
      SELECT 
        id, title, description, start_time, end_time, color, is_all_day,
        created_at, updated_at, tags, recurrence_rule, exception_dates, series_id
      FROM events 
      ORDER BY start_time ASC
    `);
    
    // Get all reminders
    const remindersStmt = this.db.prepare(`
      SELECT id, event_id, minutes, type 
      FROM reminders
    `);

    const events = eventsStmt.all();
    const reminders = remindersStmt.all();

    return { events, reminders };
  }

  // Keep legacy method for compatibility
  getAllEvents() {
    const { events, reminders } = this.getAllEventsWithReminders();
    
    // Build reminder map for O(1) lookup
    const reminderMap = new Map();
    reminders.forEach(r => {
      if (!reminderMap.has(r.event_id)) {
        reminderMap.set(r.event_id, []);
      }
      reminderMap.get(r.event_id).push({
        id: r.id,
        minutes: r.minutes,
        type: r.type
      });
    });

    // Map events with reminders
    return events.map(event => this.mapRowToEvent(event, reminderMap.get(event.id)));
  }

  getEventById(id) {
    const stmt = this.db.prepare('SELECT * FROM events WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) return null;
    return this.mapRowToEvent(row);
  }

  // Unified save method - handles both create and update
  saveEvent(event) {
    if (event.id && this.getEventById(event.id)) {
      return this.updateEvent(event.id, event);
    } else {
      return this.createEvent(event);
    }
  }

  createEvent(event) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const now = Math.floor(Date.now() / 1000);
    
    const stmt = this.db.prepare(`
      INSERT INTO events (
        id, title, description, start_time, end_time, color, is_all_day, 
        created_at, updated_at, tags, recurrence_rule, exception_dates, series_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const startTime = event.startMs ? Math.floor(event.startMs / 1000) : Math.floor(new Date(event.start).getTime() / 1000);
    const endTime = event.endMs ? Math.floor(event.endMs / 1000) : Math.floor(new Date(event.end).getTime() / 1000);

    stmt.run(
      id,
      event.title,
      event.description || null,
      startTime,
      endTime,
      event.color || '#1890ff',
      event.isAllDay ? 1 : 0,
      now,
      now,
      event.tags ? JSON.stringify(event.tags) : null,
      event.recurrenceRule ? JSON.stringify(event.recurrenceRule) : null,
      event.exceptionDates ? JSON.stringify(event.exceptionDates) : null,
      event.seriesId || null
    );

    // Add reminders if any
    if (event.reminders && event.reminders.length > 0) {
      this.addReminders(id, event.reminders);
    }

    return this.getEventById(id);
  }

  updateEvent(id, updates) {
    const now = Math.floor(Date.now() / 1000);
    
    const fields = [];
    const values = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    // Handle both legacy and new timestamp formats
    if (updates.startMs !== undefined) {
      fields.push('start_time = ?');
      values.push(Math.floor(updates.startMs / 1000));
    } else if (updates.start !== undefined) {
      fields.push('start_time = ?');
      values.push(Math.floor(new Date(updates.start).getTime() / 1000));
    }
    if (updates.endMs !== undefined) {
      fields.push('end_time = ?');
      values.push(Math.floor(updates.endMs / 1000));
    } else if (updates.end !== undefined) {
      fields.push('end_time = ?');
      values.push(Math.floor(new Date(updates.end).getTime() / 1000));
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.isAllDay !== undefined) {
      fields.push('is_all_day = ?');
      values.push(updates.isAllDay ? 1 : 0);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.recurrenceRule !== undefined) {
      fields.push('recurrence_rule = ?');
      values.push(updates.recurrenceRule ? JSON.stringify(updates.recurrenceRule) : null);
    }
    if (updates.exceptionDates !== undefined) {
      fields.push('exception_dates = ?');
      values.push(updates.exceptionDates ? JSON.stringify(updates.exceptionDates) : null);
    }
    if (updates.seriesId !== undefined) {
      fields.push('series_id = ?');
      values.push(updates.seriesId);
    }

    if (fields.length === 0) return this.getEventById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE events SET ${fields.join(', ')} WHERE id = ?
    `);

    const result = stmt.run(...values);
    
    if (result.changes === 0) return null;

    // Update reminders if provided
    if (updates.reminders !== undefined) {
      this.deleteRemindersByEventId(id);
      if (updates.reminders.length > 0) {
        this.addReminders(id, updates.reminders);
      }
    }

    return this.getEventById(id);
  }

  deleteEvent(id) {
    const stmt = this.db.prepare('DELETE FROM events WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  deleteAllEvents() {
    const stmt = this.db.prepare('DELETE FROM events');
    const result = stmt.run();
    // Also clear reminders to avoid orphaned data
    this.db.exec('DELETE FROM reminders');
    return result.changes > 0;
  }

  // Reminder operations
  addReminders(eventId, reminders) {
    const stmt = this.db.prepare(`
      INSERT INTO reminders (id, event_id, minutes, type) VALUES (?, ?, ?, ?)
    `);

    for (const reminder of reminders) {
      const reminderId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      stmt.run(reminderId, eventId, reminder.minutes, reminder.type);
    }
  }

  deleteRemindersByEventId(eventId) {
    const stmt = this.db.prepare('DELETE FROM reminders WHERE event_id = ?');
    stmt.run(eventId);
  }

  getRemindersByEventId(eventId) {
    const stmt = this.db.prepare('SELECT * FROM reminders WHERE event_id = ?');
    return stmt.all(eventId);
  }

  // Optimized helper method to convert database row to CalendarEvent
  mapRowToEvent(row, reminders = []) {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      startMs: row.start_time * 1000,  // Convert seconds to milliseconds
      endMs: row.end_time * 1000,      // Convert seconds to milliseconds
      color: row.color || '#1890ff',
      isAllDay: Boolean(row.is_all_day),
      tags: row.tags ? JSON.parse(row.tags) : [],
      reminders: reminders && reminders.length > 0 ? reminders : undefined,
      recurrenceRule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : undefined,
      exceptionDates: row.exception_dates ? JSON.parse(row.exception_dates) : undefined,
      seriesId: row.series_id || undefined,
    };
  }

  // Legacy method for backward compatibility
  mapRowToEventLegacy(row) {
    const reminders = this.getRemindersByEventId(row.id).map(r => ({
      id: r.id,
      minutes: r.minutes,
      type: r.type
    }));

    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      start: new Date(row.start_time * 1000).toISOString(),
      end: new Date(row.end_time * 1000).toISOString(),
      color: row.color || '#1890ff',
      isAllDay: Boolean(row.is_all_day),
      reminders: reminders.length > 0 ? reminders : undefined,
    };
  }

  // Close database connection
  close() {
    this.db.close();
  }

  // Get database statistics
  getStats() {
    const eventCount = this.db.prepare('SELECT COUNT(*) as count FROM events').get();
    const reminderCount = this.db.prepare('SELECT COUNT(*) as count FROM reminders').get();
    
    return {
      events: eventCount.count,
      reminders: reminderCount.count,
    };
  }
}

module.exports = DatabaseService;