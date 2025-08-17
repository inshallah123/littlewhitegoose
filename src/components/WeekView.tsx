import React, { useState, useMemo, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { CalendarEvent } from '../types';
import '../styles/WeekView.css';

// --- Constants ---
const MAX_VISIBLE_EVENTS = 2;

// --- Interfaces ---
interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onAddEvent: (event: Partial<CalendarEvent>) => void;
  createDefaultEvent: (startDate: Date, options?: { isAllDay?: boolean }) => Partial<CalendarEvent>;
  setSelectedMs: (ms: number) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

interface MorePopoverState {
  key: string;
  anchorElement: HTMLElement;
  events: CalendarEvent[];
}

// --- Color & Style Helpers ---
const TAG_COLORS: { [key:string]: string } = {
  '私': '#eb2f96',
  '工作': '#1890ff',
  '班次': '#722ed1',
  'balance': '#52c41a',
};
const DEFAULT_EVENT_COLOR = '#1890ff';
const NO_TAG_COLOR = '#FFF5F7';

const getEventBaseStyle = (event: CalendarEvent) => {
  let color = DEFAULT_EVENT_COLOR;
  if (event.tags && event.tags.length > 0) {
    color = TAG_COLORS[event.tags[0]] || DEFAULT_EVENT_COLOR;
  } else {
    color = NO_TAG_COLOR;
  }
  return {
    backgroundColor: color,
    color: color === NO_TAG_COLOR ? '#595959' : 'white',
  };
};

// --- More Events Popover Component ---
const MoreEventsPopover: React.FC<{
  popoverState: MorePopoverState | null;
  onClose: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}> = ({ popoverState, onClose, onSelectEvent, containerRef }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!popoverState || !containerRef.current) return null;

  const { anchorElement, events } = popoverState;
  const containerRect = containerRef.current.getBoundingClientRect();
  const anchorRect = anchorElement.getBoundingClientRect();

  const style = {
    top: anchorRect.top - containerRect.top + anchorRect.height,
    left: anchorRect.left - containerRect.left,
  };

  return (
    <div
      ref={popoverRef}
      className="more-events-popover"
      style={style}
    >
      {events.map(event => (
        <div
          key={event.id}
          className="event-item"
          style={getEventBaseStyle(event)}
          onClick={() => {
            onSelectEvent(event);
            onClose();
          }}
        >
          {event.title}
        </div>
      ))}
    </div>
  );
};


// --- Main WeekView Component ---
const WeekView: React.FC<WeekViewProps> = ({ 
  currentDate, 
  events, 
  onAddEvent, 
  createDefaultEvent, 
  setSelectedMs,
  onSelectEvent
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [morePopover, setMorePopover] = useState<MorePopoverState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startOfWeek = dayjs(currentDate).startOf('week');
  const days = Array.from({ length: 7 }).map((_, i) => startOfWeek.add(i, 'day').toDate());

  const timeSlots = Array.from({ length: 8 }).map((_, i) => {
    const hour = 8 + i * 2;
    return { hour, label: `${hour}:00 - ${hour + 2}:00` };
  });

  const handleSlotClick = (day: Date, hour: number) => {
    setSelectedSlot({ day, hour });
    const selectedTimestamp = dayjs(day).hour(hour).minute(0).second(0).valueOf();
    setSelectedMs(selectedTimestamp);
  };

  const handleSlotDoubleClick = (day: Date, hour: number) => {
    const startDate = dayjs(day).hour(hour).minute(0).second(0).toDate();
    onAddEvent(createDefaultEvent(startDate));
  };

  const eventsBySlot = useMemo(() => {
    const result: { [dayKey: string]: { [slotKey: string]: CalendarEvent[] } } = {};

    days.forEach(day => {
      const dayKey = day.toISOString().split('T')[0];
      result[dayKey] = {};

      const dayStart = dayjs(day).startOf('day');
      const dayEnd = dayjs(day).endOf('day');

      const dayEvents = events.filter(event => 
        dayjs(event.startMs).isBefore(dayEnd) && dayjs(event.endMs).isAfter(dayStart)
      );

      result[dayKey]['all-day'] = dayEvents.filter(e => e.isAllDay);
      
      const timedEvents = dayEvents.filter(e => !e.isAllDay);
      timeSlots.forEach(slot => {
        const slotStartMs = dayjs(day).hour(slot.hour).valueOf();
        const slotEndMs = dayjs(day).hour(slot.hour + 2).valueOf();
        result[dayKey][slot.hour] = timedEvents.filter(event => 
          event.startMs < slotEndMs && event.endMs > slotStartMs
        );
      });
    });

    return result;
  }, [events, days, timeSlots]);

  const handleShowMore = (e: React.MouseEvent, key: string, events: CalendarEvent[]) => {
    e.stopPropagation();
    setMorePopover({
      key,
      anchorElement: e.currentTarget as HTMLElement,
      events,
    });
  };

  const renderEventsForSlot = (day: Date, slotKey: string | number, slotEvents: CalendarEvent[]) => {
    const visibleEvents = slotEvents.slice(0, MAX_VISIBLE_EVENTS);
    const hiddenEvents = slotEvents.slice(MAX_VISIBLE_EVENTS);
    const hiddenEventsCount = hiddenEvents.length;

    return (
      <>
        {visibleEvents.map(event => (
          <div
            key={event.id}
            className="event-item"
            style={getEventBaseStyle(event)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectEvent(event);
            }}
          >
            {event.title}
          </div>
        ))}
        {hiddenEventsCount > 0 && (
          <div
            className="more-events-button"
            onClick={(e) => handleShowMore(e, `${day.toISOString().split('T')[0]}-${slotKey}`, hiddenEvents)}
          >
            + {hiddenEventsCount} 查看更多
          </div>
        )}
      </>
    );
  };

  return (
    <div className="week-view" ref={containerRef}>
      <div className="time-axis">
        <div className="header-spacer" />
        <div className="all-day-label">全天</div>
        {timeSlots.map(slot => (
          <div key={slot.label} className="time-slot-label">{slot.label}</div>
        ))}
      </div>
      <div className="days-container">
        {days.map(day => {
          const dayKey = day.toISOString().split('T')[0];
          const daySlots = eventsBySlot[dayKey] || {};

          return (
            <div key={day.toISOString()} className="day-column">
              <div className="day-header">
                {dayjs(day).format('ddd D')}
              </div>
              <div 
                className="all-day-area"
                onClick={() => handleSlotClick(day, 0)}
                onDoubleClick={() => onAddEvent(createDefaultEvent(day, { isAllDay: true }))}
              >
                {renderEventsForSlot(day, 'all-day', daySlots['all-day'] || [])}
              </div>
              <div className="day-content">
                {timeSlots.map(slot => {
                  const isSelected = selectedSlot && dayjs(selectedSlot.day).isSame(day, 'day') && selectedSlot.hour === slot.hour;
                  const slotEvents = daySlots[slot.hour] || [];
                  return (
                    <div
                      key={slot.label}
                      className={`time-slot ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSlotClick(day, slot.hour)}
                      onDoubleClick={() => handleSlotDoubleClick(day, slot.hour)}
                    >
                      {renderEventsForSlot(day, slot.hour, slotEvents)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <MoreEventsPopover
        popoverState={morePopover}
        onClose={() => setMorePopover(null)}
        onSelectEvent={onSelectEvent}
        containerRef={containerRef}
      />
    </div>
  );
};

export default WeekView;