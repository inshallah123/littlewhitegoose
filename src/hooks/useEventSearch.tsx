import { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { CalendarEvent } from '../types';
import { getNextOccurrence } from '../utils/recurrence';

const highlightMatch = (str: string, query: string) => {
  if (!query || !str) return str;
  const index = str.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return str;
  const pre = str.slice(0, index);
  const match = str.slice(index, index + query.length);
  const post = str.slice(index + query.length);
  return (
    <>
      {pre}
      <strong style={{ color: '#f50', fontWeight: 'bold' }}>{match}</strong>
      {post}
    </>
  );
};

export const useEventSearch = (allEvents: CalendarEvent[], setViewMs: (ms: number) => void) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchOptions, setSearchOptions] = useState<any[]>([]);

  const handleSearch = useCallback((text: string) => {
    setSearchValue(text);
    if (!text) {
      setSearchOptions([]);
      return;
    }

    const lowerCaseText = text.toLowerCase();
    const now = new Date();

    const newOptions = allEvents.reduce<any[]>((acc, event) => {
      const titleMatch = event.title.toLowerCase().includes(lowerCaseText);
      const descMatch = event.description && event.description.toLowerCase().includes(lowerCaseText);
      const tagMatch = event.tags && event.tags.some(tag => tag.toLowerCase().includes(lowerCaseText));

      if (titleMatch || descMatch || tagMatch) {
        let eventToShow = event;
        
        if (event.recurrenceRule) {
          const nextOccurrence = getNextOccurrence(event, now);
          if (nextOccurrence) {
            const duration = event.endMs - event.startMs;
            eventToShow = {
              ...event,
              startMs: nextOccurrence.getTime(),
              endMs: nextOccurrence.getTime() + duration,
            };
          } else {
            return acc;
          }
        }
        
        const eventDate = dayjs(new Date(eventToShow.startMs)).format('YYYY-MM-DD');
        const dateMatch = eventDate.includes(lowerCaseText);

        if (titleMatch || descMatch || tagMatch || dateMatch) {
          acc.push({
            value: event.id,
            label: (
              <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>{highlightMatch(event.title, text)}</span>
                  <span style={{ color: '#888' }}>{eventDate}</span>
                </div>
                {descMatch && event.description && (
                  <div style={{ fontSize: '12px', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {highlightMatch(event.description, text)}
                  </div>
                )}
              </div>
            ),
            event: eventToShow,
          });
        }
      }
      return acc;
    }, []);
    setSearchOptions(newOptions);
  }, [allEvents]);

  const handleSelect = useCallback((value: string, option: any) => {
    setViewMs(option.event.startMs);
    setSearchValue('');
    setSearchOptions([]);
  }, [setViewMs]);

  return {
    searchValue,
    searchOptions,
    handleSearch,
    handleSelect,
  };
};
