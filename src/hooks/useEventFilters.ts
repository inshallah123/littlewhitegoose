import { useMemo } from 'react';
import { CalendarEvent, msToDate } from '../types';
import dayjs from 'dayjs';

interface UseEventFiltersProps {
  events: CalendarEvent[];
  searchTerm?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export const useEventFilters = ({ events, searchTerm, dateRange }: UseEventFiltersProps) => {
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // 搜索过滤
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(term) ||
        (event.description && event.description.toLowerCase().includes(term))
      );
    }

    // 日期范围过滤
    if (dateRange) {
      const startDay = dayjs(dateRange.start);
      const endDay = dayjs(dateRange.end);
      
      filtered = filtered.filter(event => {
        const eventStart = dayjs(msToDate(event.startMs));
        const eventEnd = dayjs(msToDate(event.endMs));
        
        // 事件与日期范围有交集
        return (
          eventStart.isBefore(endDay.add(1, 'day')) &&
          eventEnd.isAfter(startDay.subtract(1, 'day'))
        );
      });
    }

    // 按开始时间排序
    return filtered.sort((a, b) => 
      a.startMs - b.startMs
    );
  }, [events, searchTerm, dateRange]);

  const eventStats = useMemo(() => {
    const total = events.length;
    const filtered = filteredEvents.length;
    const today = dayjs().startOf('day');
    
    const todayEvents = events.filter(event => 
      dayjs(msToDate(event.startMs)).isSame(today, 'day') || 
      dayjs(msToDate(event.endMs)).isSame(today, 'day') ||
      (dayjs(msToDate(event.startMs)).isBefore(today) && dayjs(msToDate(event.endMs)).isAfter(today))
    ).length;

    const upcomingEvents = events.filter(event => 
      dayjs(msToDate(event.startMs)).isAfter(today)
    ).length;

    return {
      total,
      filtered,
      today: todayEvents,
      upcoming: upcomingEvents
    };
  }, [events, filteredEvents]);

  return {
    filteredEvents,
    eventStats
  };
};