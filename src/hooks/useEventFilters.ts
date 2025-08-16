import { useMemo } from 'react';
import { CalendarEvent } from '../types';
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
        const eventStart = dayjs(event.start);
        const eventEnd = dayjs(event.end);
        
        // 事件与日期范围有交集
        return (
          eventStart.isBefore(endDay.add(1, 'day')) &&
          eventEnd.isAfter(startDay.subtract(1, 'day'))
        );
      });
    }

    // 按开始时间排序
    return filtered.sort((a, b) => 
      dayjs(a.start).valueOf() - dayjs(b.start).valueOf()
    );
  }, [events, searchTerm, dateRange]);

  const eventStats = useMemo(() => {
    const total = events.length;
    const filtered = filteredEvents.length;
    const today = dayjs().startOf('day');
    
    const todayEvents = events.filter(event => 
      dayjs(event.start).isSame(today, 'day') || 
      dayjs(event.end).isSame(today, 'day') ||
      (dayjs(event.start).isBefore(today) && dayjs(event.end).isAfter(today))
    ).length;

    const upcomingEvents = events.filter(event => 
      dayjs(event.start).isAfter(today)
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