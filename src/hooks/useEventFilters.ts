import { useMemo } from 'react';
import { CalendarEvent, msToDate } from '../types';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const PRESET_TAGS = ['私', '工作', '班次', 'balance'];

interface UseEventFiltersProps {
  events: CalendarEvent[];
  searchQuery?: string;
}

// 解析搜索查询中的日期
const parseDateQuery = (term: string): dayjs.Dayjs | null => {
  const today = dayjs();
  if (term === '今天') return today;
  if (term === '明天') return today.add(1, 'day');
  if (term === '昨天') return today.subtract(1, 'day');
  
  // 支持 YYYY-MM-DD, YYYY/MM/DD, MM-DD, MM/DD
  const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'MM-DD', 'MM/DD'];
  const parsedDate = dayjs(term, formats, 'zh-cn', true);
  
  return parsedDate.isValid() ? parsedDate : null;
};

export const useEventFilters = ({ events, searchQuery }: UseEventFiltersProps) => {
  const filteredEvents = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return events.sort((a, b) => a.startMs - b.startMs);
    }

    const queryParts = searchQuery.toLowerCase().trim().split(/\s+/);
    
    const keywords: string[] = [];
    const tags: string[] = [];
    let date: dayjs.Dayjs | null = null;

    queryParts.forEach(part => {
      const parsedDate = parseDateQuery(part);
      if (parsedDate) {
        date = parsedDate;
      } else if (PRESET_TAGS.includes(part)) {
        tags.push(part);
      } else {
        keywords.push(part);
      }
    });

    let filtered = events;

    // 关键字过滤 (标题, 描述)
    if (keywords.length > 0) {
      filtered = filtered.filter(event => 
        keywords.every(keyword =>
          event.title.toLowerCase().includes(keyword) ||
          (event.description && event.description.toLowerCase().includes(keyword))
        )
      );
    }

    // 标签过滤
    if (tags.length > 0) {
      filtered = filtered.filter(event => 
        event.tags && event.tags.some(tag => tags.includes(tag.toLowerCase()))
      );
    }

    // 日期过滤
    if (date) {
      filtered = filtered.filter(event => {
        const eventStart = dayjs(msToDate(event.startMs));
        const eventEnd = dayjs(msToDate(event.endMs));
        return date.isBetween(eventStart, eventEnd, 'day', '[]'); // '[]' includes start and end dates
      });
    }

    // 按开始时间排序
    return filtered.sort((a, b) => a.startMs - b.startMs);
  }, [events, searchQuery]);

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