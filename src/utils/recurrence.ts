import { CalendarEvent, RecurrenceRule } from '../types';
import { addMonths, addQuarters, addYears, addDays, setDate, lastDayOfMonth } from 'date-fns';

const calculateNextOccurrence = (
  currentDate: Date,
  rule: RecurrenceRule,
  originalDay: number
): Date => {
  let nextDate = new Date(currentDate);
  switch (rule.type) {
    case 'monthly':
      nextDate = addMonths(nextDate, rule.interval);
      if (nextDate.getDate() !== originalDay) {
        nextDate = lastDayOfMonth(nextDate);
      }
      break;
    case 'quarterly':
      nextDate = addQuarters(nextDate, rule.interval);
      if (nextDate.getDate() !== originalDay) {
        nextDate = lastDayOfMonth(nextDate);
      }
      break;
    case 'yearly':
      nextDate = addYears(nextDate, rule.interval);
      if (nextDate.getDate() !== originalDay) {
        nextDate = lastDayOfMonth(nextDate);
      }
      break;
    case 'custom':
      nextDate = addDays(nextDate, rule.interval);
      break;
  }
  return nextDate;
};

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
    nextOccurrence = calculateNextOccurrence(nextOccurrence, recurrenceRule, originalDay);
    
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
    nextOccurrence = calculateNextOccurrence(nextOccurrence, recurrenceRule, originalDay);
    
    if (currentOccurrence.getTime() === nextOccurrence.getTime()) {
        return null; // Prevent infinite loop
    }
  }

  // Now we have an occurrence after `afterDate`, but we need to check for exceptions
  while (exceptionDates?.includes(nextOccurrence.getTime())) {
     const currentOccurrence = new Date(nextOccurrence);
     nextOccurrence = calculateNextOccurrence(nextOccurrence, recurrenceRule, originalDay);

    if (currentOccurrence.getTime() === nextOccurrence.getTime()) {
        return null; // Prevent infinite loop
    }
  }

  return nextOccurrence;
};
