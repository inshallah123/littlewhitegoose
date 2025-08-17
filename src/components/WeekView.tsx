import React, { useState } from 'react';
import dayjs from 'dayjs';
import { CalendarEvent } from '../types';
import './WeekView.css';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onAddEvent: (event: Partial<CalendarEvent>) => void;
  createDefaultEvent: (startDate: Date) => Partial<CalendarEvent>;
}

const TAG_COLORS: { [key: string]: string } = {
  '私': '#eb2f96',
  '工作': '#1890ff',
  '班次': '#722ed1',
  'balance': '#52c41a',
};
const DEFAULT_EVENT_COLOR = '#1890ff';
const NO_TAG_COLOR = '#FFF5F7';

const WeekView: React.FC<WeekViewProps> = ({ currentDate, events, onAddEvent, createDefaultEvent }) => {
  const [selectedSlot, setSelectedSlot] = useState<{ day: Date; hour: number } | null>(null);

  const startOfWeek = dayjs(currentDate).startOf('week');

  const days = Array.from({ length: 7 }).map((_, i) => startOfWeek.add(i, 'day').toDate());

  const timeSlots = Array.from({ length: 8 }).map((_, i) => {
    const hour = 8 + i * 2;
    return {
      hour,
      label: `${hour}:00 - ${hour + 2}:00`,
    };
  });

  const handleSlotClick = (day: Date, hour: number) => {
    setSelectedSlot({ day, hour });
  };

  const handleSlotDoubleClick = (day: Date, hour: number) => {
    const startDate = dayjs(day).hour(hour).minute(0).second(0).toDate();
    onAddEvent(createDefaultEvent(startDate));
  };

  const getEventStyle = (event: CalendarEvent) => {
    const startOfDay = dayjs(event.startMs).startOf('day').add(8, 'hours');
    const startOffset = dayjs(event.startMs).diff(startOfDay, 'minute');
    const duration = dayjs(event.endMs).diff(dayjs(event.startMs), 'minute');

    const top = (startOffset / (16 * 60)) * 100;
    const height = (duration / (16 * 60)) * 100;

    let color = DEFAULT_EVENT_COLOR;
    if (event.tags && event.tags.length > 0) {
      color = TAG_COLORS[event.tags[0]] || DEFAULT_EVENT_COLOR;
    } else {
      color = NO_TAG_COLOR;
    }

    return {
      top: `${top}%`,
      height: `${height}%`,
      backgroundColor: color,
      color: color === NO_TAG_COLOR ? '#595959' : 'white',
    };
  };

  return (
    <div className="week-view">
      <div className="time-axis">
        <div className="header-spacer" />
        {timeSlots.map(slot => (
          <div key={slot.label} className="time-slot-label">{slot.label}</div>
        ))}
      </div>
      <div className="days-container">
        {days.map(day => (
          <div key={day.toISOString()} className="day-column">
            <div className="day-header">
              {dayjs(day).format('ddd D')}
            </div>
            <div className="day-content">
              {events
                .filter(event => dayjs(event.startMs).isSame(day, 'day'))
                .map(event => (
                  <div
                    key={event.id}
                    className="event-item"
                    style={getEventStyle(event)}
                  >
                    {event.title}
                  </div>
                ))}
              {timeSlots.map(slot => {
                const isSelected = selectedSlot && dayjs(selectedSlot.day).isSame(day, 'day') && selectedSlot.hour === slot.hour;
                return (
                  <div
                    key={slot.label}
                    className={`time-slot ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSlotClick(day, slot.hour)}
                    onDoubleClick={() => handleSlotDoubleClick(day, slot.hour)}
                  >
                    <button
                      className="add-event-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlotDoubleClick(day, slot.hour);
                      }}
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
