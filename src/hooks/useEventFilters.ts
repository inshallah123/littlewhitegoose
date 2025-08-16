import { useMemo } from 'react';
import { CalendarEvent, msToDate } from '../types';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

const PRESET_TAGS = ['私', '工作', '班次', 'balance'];

interface UseEventFiltersProps {
  events: CalendarEvent[];
  searchQuery?: string;
}

// 解析搜索查询中的日期
const parseDateQuery = (term: string): Dayjs | null => {
  const today = dayjs();
  if (term === '今天') return today;
  if (term === '明天') return today.add(1, 'day');
  if (term === '昨天') return today.subtract(1, 'day');
  
  // 支持 YYYY-MM-DD, YYYY/MM/DD, MM-DD, MM/DD
  const formats = ['YYYY-MM-DD', 'YYYY/MM/DD', 'MM-DD', 'MM/DD'];
  const parsedDate = dayjs(term, formats, 'zh-cn', true);
  
  return parsedDate.isValid() ? parsedDate : null;
};