import { CalendarEvent } from '../types';
import { addMonths, addQuarters, addYears, addDays, setDate, lastDayOfMonth } from 'date-fns';

/**
 * Generates instances of a recurring event within a given date range.
 * @param recurringEvent The original recurring event (the series master).
 *- @param viewStart The start of the date range to generate events for.
 * @param viewEnd The end of the date range to generate events for.
 * @returns An array of CalendarEvent instances for the given range.
 */
export const generateRecurringEvents = (
  recurringEvent: CalendarEvent,
  viewStart: Date,
  viewEnd: Date
): CalendarEvent[] => {
  if (!recurringEvent.recurrenceRule) {
    return [];
  }

  const instances: CalendarEvent[] = [];
  const { recurrenceRule, startMs, exceptionDates } = recurringEvent;
  
  let nextOccurrence = new Date(startMs);
  const originalDay = nextOccurrence.getDate();

  while (nextOccurrence <= viewEnd) {
    if (nextOccurrence >= viewStart && !exceptionDates?.includes(nextOccurrence.getTime())) {
      const duration = recurringEvent.endMs - recurringEvent.startMs;
      const instance: CalendarEvent = {
        ...recurringEvent,
        id: `${recurringEvent.id}_${nextOccurrence.getTime()}`, // Unique ID for the instance
        seriesId: recurringEvent.id,
        startMs: nextOccurrence.getTime(),
        endMs: nextOccurrence.getTime() + duration,
        // Mark it as a recurring instance to handle clicks differently
        recurrenceRule: undefined, 
      };
      instances.push(instance);
    }

    const currentOccurrence = new Date(nextOccurrence);
    switch (recurrenceRule.type) {
      case 'monthly':
        nextOccurrence = addMonths(nextOccurrence, recurrenceRule.interval);
        // Handle months with fewer days (e.g., event on 31st, next month has 30)
        if (nextOccurrence.getDate() !== originalDay) {
          nextOccurrence = lastDayOfMonth(nextOccurrence);
        }
        break;
      case 'quarterly':
        nextOccurrence = addQuarters(nextOccurrence, recurrenceRule.interval);
        if (nextOccurrence.getDate() !== originalDay) {
          nextOccurrence = lastDayOfMonth(nextOccurrence);
        }
        break;
      case 'yearly':
        nextOccurrence = addYears(nextOccurrence, recurrenceRule.interval);
        if (nextOccurrence.getDate() !== originalDay) {
          nextOccurrence = lastDayOfMonth(nextOccurrence);
        }
        break;
      case 'custom':
        nextOccurrence = addDays(nextOccurrence, recurrenceRule.interval);
        break;
      default:
        // Stop if rule is unknown
        return instances;
    }
    
    // Break if the date is not advancing to prevent infinite loops
    if (currentOccurrence.getTime() === nextOccurrence.getTime()) {
        break;
    }
  }

  return instances;
};

/**
 * Calculates the next occurrence of a recurring event after a given date.
 * @param recurringEvent The recurring event series.
 * @param afterDate The date after which to find the next occurrence.
 * @returns The Date of the next occurrence, or null if it cannot be calculated.
 */
export const getNextOccurrence = (
  recurringEvent: CalendarEvent,
  afterDate: Date = new Date()
): Date | null => {
  if (!recurringEvent.recurrenceRule) {
    return null;
  }

  const { recurrenceRule, startMs, exceptionDates } = recurringEvent;
  let nextOccurrence = new Date(startMs);
  const originalDay = nextOccurrence.getDate();

  // Find the first occurrence that is after the `afterDate`
  while (nextOccurrence <= afterDate) {
    const currentOccurrence = new Date(nextOccurrence);
    switch (recurrenceRule.type) {
      case 'monthly':
        nextOccurrence = addMonths(nextOccurrence, recurrenceRule.interval);
        if (nextOccurrence.getDate() !== originalDay) {
          nextOccurrence = lastDayOfMonth(nextOccurrence);
        }
        break;
      case 'quarterly':
        nextOccurrence = addQuarters(nextOccurrence, recurrenceRule.interval);
        if (nextOccurrence.getDate() !== originalDay) {
          nextOccurrence = lastDayOfMonth(nextOccurrence);
        }
        break;
      case 'yearly':
        // The user requested 365 days, not a calendar year
        nextOccurrence = addDays(nextOccurrence, 365 * recurrenceRule.interval);
        break;
      case 'custom':
        nextOccurrence = addDays(nextOccurrence, recurrenceRule.interval);
        break;
      default:
        return null;
    }
    
    if (currentOccurrence.getTime() === nextOccurrence.getTime()) {
        return null; // Prevent infinite loop
    }
  }

  // Now we have an occurrence after `afterDate`, but we need to check for exceptions
  while (exceptionDates?.includes(nextOccurrence.getTime())) {
     const currentOccurrence = new Date(nextOccurrence);
     switch (recurrenceRule.type) {
      case 'monthly':
        nextOccurrence = addMonths(nextOccurrence, recurrenceRule.interval);
        if (nextOccurrence.getDate() !== originalDay) {
          nextOccurrence = lastDayOfMonth(nextOccurrence);
        }
        break;
      case 'quarterly':
        nextOccurrence = addQuarters(nextOccurrence, recurrenceRule.interval);
        if (nextOccurrence.getDate() !== originalDay) {
          nextOccurrence = lastDayOfMonth(nextOccurrence);
        }
        break;
      case 'yearly':
        nextOccurrence = addDays(nextOccurrence, 365 * recurrenceRule.interval);
        break;
      case 'custom':
        nextOccurrence = addDays(nextOccurrence, recurrenceRule.interval);
        break;
      default:
        return null;
    }
    if (currentOccurrence.getTime() === nextOccurrence.getTime()) {
        return null; // Prevent infinite loop
    }
  }

  return nextOccurrence;
};
