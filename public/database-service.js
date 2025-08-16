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

  // Event CRUD operations
  getAllEvents() {
    const stmt = this.db.prepare(`
      SELECT 
        id, title, description, start_time, end_time, color, is_all_day,
        created_at, updated_at
      FROM events 
      ORDER BY start_time ASC
    `);

    const rows = stmt.all();
    return rows.map(this.mapRowToEvent.bind(this));
  }

  getEventById(id) {
    const stmt = this.db.prepare('SELECT * FROM events WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) return null;
    return this.mapRowToEvent(row);
  }

  createEvent(event) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const now = Math.floor(Date.now() / 1000);
    
    const stmt = this.db.prepare(`
      INSERT INTO events (
        id, title, description, start_time, end_time, color, is_all_day, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      event.title,
      event.description || null,
      Math.floor(new Date(event.start).getTime() / 1000),
      Math.floor(new Date(event.end).getTime() / 1000),
      event.color || '#1890ff',
      event.isAllDay ? 1 : 0,
      now,
      now
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
    if (updates.start !== undefined) {
      fields.push('start_time = ?');
      values.push(Math.floor(new Date(updates.start).getTime() / 1000));
    }
    if (updates.end !== undefined) {
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

  // Helper method to convert database row to CalendarEvent
  mapRowToEvent(row) {
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