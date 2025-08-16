import React, { useCallback, useEffect, forwardRef, useImperativeHandle, useMemo, useState, memo, ForwardedRef } from 'react';
import { Calendar as BigCalendar, dayjsLocalizer, View } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import Spin from 'antd/es/spin';
import { LoadingOutlined } from '@ant-design/icons';
import useCalendarStore from '../store/calendarStore';
import { CalendarEvent, ReactCalendarEvent, toReactEvent, fromReactEvent, msToDate, dateToMs } from '../types';
import EventModal from './EventModal';
import EventDetail from './EventDetail';
import CalendarToolbar from './CalendarToolbar';
import '../styles/calendar.css';
import { useRenderProfiler } from '../utils/performance';

// Configure dayjs
dayjs.locale('zh-cn');
dayjs.extend(utc);
dayjs.extend(timezone);

const localizer = dayjsLocalizer(dayjs);

const CALENDAR_MESSAGES = {
  next: "下一个",
  previous: "上一个",
  today: "今天",
  month: "月",
  week: "周",
  agenda: "日程",
  date: "日期",
  time: "时间",
  event: "事件",
  noEventsInRange: "此时间范围内没有事件",
  showMore: (total: number) => `+ 查看更多 (${total})`
};

const SELECTED_DAY_STYLE = {
  backgroundColor: '#bae7ff',
  border: '2px solid #1890ff',
};

const EMPTY_STYLE = {};

const TAG_COLORS: { [key: string]: string } = {
  '私': '#eb2f96',
  '工作': '#1890ff',
  '班次': '#722ed1',
  'balance': '#52c41a',
};
const DEFAULT_EVENT_COLOR = '#1890ff';

interface CalendarProps {}

const CalendarComponent = (props: CalendarProps, ref: ForwardedRef<any>) => {
  useRenderProfiler('Calendar');
  
  const events = useCalendarStore(state => state.events);
  const view = useCalendarStore(state => state.view);
  const isLoading = useCalendarStore(state => state.isLoading);
  const selectedMs = useCalendarStore(state => state.selectedMs);
  const viewMs = useCalendarStore(state => state.viewMs);
  const setView = useCalendarStore(state => state.setView);
  const saveEvent = useCalendarStore(state => state.saveEvent);
  const deleteEvent = useCalendarStore(state => state.deleteEvent);
  const loadEvents = useCalendarStore(state => state.loadEvents);
  const setSelectedMs = useCalendarStore(state => state.setSelectedMs);
  const setViewMs = useCalendarStore(state => state.setViewMs);
  
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventDetailVisible, setEventDetailVisible] = useState(false);
  const [modalEventData, setModalEventData] = useState<Partial<CalendarEvent> | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // State for the new AutoComplete search
  const [searchValue, setSearchValue] = useState('');
  const [searchOptions, setSearchOptions] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // The calendar now always displays all events. Filtering is replaced by navigation.
  const reactEvents = useMemo(() => 
    events.map(toReactEvent),
    [events]
  );

  const handleSearch = useCallback((text: string) => {
    setSearchValue(text);
    if (!text) {
      setSearchOptions([]);
      return;
    }

    const lowerCaseText = text.toLowerCase();

    // Helper to escape regex special characters
    const escapeRegExp = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Helper to highlight text
    const highlightText = (str: string, highlight: string) => {
      if (!highlight.trim() || !str) {
        return str;
      }
      const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
      const parts = str.split(regex);
      return parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} style={{ color: '#1890ff', fontWeight: 'bold' }}>
            {part}
          </span>
        ) : (
          part
        )
      );
    };

    const newOptions = events.reduce<any[]>((acc, event) => {
      const eventDate = dayjs(msToDate(event.startMs)).format('YYYY-MM-DD');
      const titleMatch = event.title.toLowerCase().includes(lowerCaseText);
      const descMatch = event.description && event.description.toLowerCase().includes(lowerCaseText);
      const tagMatch = event.tags && event.tags.some(tag => tag.toLowerCase().includes(lowerCaseText));
      const dateMatch = eventDate.includes(lowerCaseText);

      if (titleMatch || descMatch || tagMatch || dateMatch) {
        let descriptionSnippet = '';
        if (event.description) {
          if (descMatch) {
            // Find the sentence with the keyword
            const sentences = event.description.split(/(?<=[.!?])\s+/);
            const matchedSentence = sentences.find(s => s.toLowerCase().includes(lowerCaseText));
            descriptionSnippet = matchedSentence || (event.description.substring(0, 40) + '...');
          } else {
            // Show the beginning of the first sentence
            descriptionSnippet = event.description.substring(0, 40) + '...';
          }
        }

        acc.push({
          value: event.id,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ flex: '0 1 50%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
                {highlightText(event.title, text)}
              </span>
              <span style={{ flex: '0 1 50%', color: '#888', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {highlightText(descriptionSnippet, text)}
              </span>
            </div>
          ),
          event: event,
        });
      }
      return acc;
    }, []);
    setSearchOptions(newOptions);
  }, [events]);


  const handleSelect = useCallback((value: string, option: any) => {
    setViewMs(option.event.startMs);
    setSearchValue('');
    setSearchOptions([]);
  }, [setViewMs]);

  const currentDate = useMemo(() => msToDate(viewMs), [viewMs]);

  const handleViewChange = useCallback((newView: View) => {
    if (newView === 'month' || newView === 'week') {
      setView(newView);
    }
  }, [setView]);

  const handleNavigate = useCallback((newDate: Date) => {
    setViewMs(dateToMs(newDate));
  }, [setViewMs]);

  const showEventModal = useCallback((eventData: Partial<CalendarEvent>) => {
    setModalEventData(eventData);
    setEventModalVisible(true);
  }, []);

  const hideEventModal = useCallback(() => {
    setEventModalVisible(false);
    setModalEventData(null);
  }, []);

  const handleSelectEvent = useCallback((reactEvent: ReactCalendarEvent) => {
    const event = fromReactEvent(reactEvent);
    setSelectedEvent(event);
    setEventDetailVisible(true);
  }, []);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    showEventModal(event);
  }, [showEventModal]);

  const eventStyleCache = useMemo(() => new Map<string, any>(), []);
  
  const eventStyleGetter = useCallback((reactEvent: ReactCalendarEvent) => {
    const event = fromReactEvent(reactEvent);
    let color = DEFAULT_EVENT_COLOR;
    const noTagColor = '#FFF5F7'; // 更淡的粉色

    if (event.tags && event.tags.length > 0) {
      color = TAG_COLORS[event.tags[0]] || DEFAULT_EVENT_COLOR;
    } else {
      // Linus 优化：为无标签事件设置更淡的粉色
      color = noTagColor; 
    }
    
    if (!eventStyleCache.has(color)) {
      eventStyleCache.set(color, {
        style: {
          backgroundColor: color,
          borderRadius: '4px',
          opacity: 0.9, // 稍微调高不透明度，让颜色更明显一点
          color: color === noTagColor ? '#595959' : 'white', // 淡粉色背景配深色文字
          border: '1px solid #f0f0f0', // 添加一个非常浅的边框以示区分
          display: 'block',
        },
      });
    }
    return eventStyleCache.get(color);
  }, [eventStyleCache]);

  const selectedDate = useMemo(() => msToDate(selectedMs), [selectedMs]);

  const selectedDayStart = useMemo(() => {
    const d = new Date(selectedMs);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [selectedMs]);

  const SELECTED_DAY_PROPS = useMemo(() => ({
    className: 'selected-date-bg',
    style: SELECTED_DAY_STYLE
  }), []);
  
  const dayPropGetter = useCallback((date: Date) => {
    const dayStart = new Date(date).setHours(0, 0, 0, 0);
    return dayStart === selectedDayStart ? SELECTED_DAY_PROPS : EMPTY_STYLE;
  }, [selectedDayStart, SELECTED_DAY_PROPS]);

  const createDefaultEvent = useCallback((startDate: Date): Partial<CalendarEvent> => {
    return { title: '', color: '#1890ff', tags: [] };
  }, []);

  const handleAddEvent = useCallback(() => {
    showEventModal(createDefaultEvent(selectedDate));
  }, [selectedDate, createDefaultEvent, showEventModal]);

  const handleSlotDoubleClick = useCallback((start: Date) => {
    showEventModal(createDefaultEvent(start));
  }, [createDefaultEvent, showEventModal]);

  const handleSlotSelect = useCallback((start: Date) => {
    setSelectedMs(dateToMs(start));
  }, [setSelectedMs]);

  const handleSelectSlot = useCallback(({ start, action }: { start: Date; end: Date; slots: Date[]; action: string }) => {
    if (action === 'doubleClick') handleSlotDoubleClick(start);
    else handleSlotSelect(start);
  }, [handleSlotDoubleClick, handleSlotSelect]);

  const handleModalSubmit = useCallback(async (eventData: Partial<CalendarEvent>) => {
    try {
      await saveEvent({ ...modalEventData, ...eventData });
      hideEventModal();
    } catch (error) {
      console.error('Failed to save event:', error);
      throw error;
    }
  }, [modalEventData, saveEvent, hideEventModal]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEventDetailVisible(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('删除事件失败:', error);
      throw error;
    }
  }, [deleteEvent]);

  useImperativeHandle(ref, () => ({
    handleMenuNewEvent: handleAddEvent,
    handleMenuViewChange: (viewType: string) => {
      if (viewType === 'month' || viewType === 'week') {
        setView(viewType as 'month' | 'week');
      }
    }
  }), [handleAddEvent, setView]);

  const handleCloseEventDetail = useCallback(() => {
    setEventDetailVisible(false);
    setSelectedEvent(null);
  }, []);

  return (
    <div className="calendar-container">
      <CalendarToolbar
        view={view}
        isLoading={isLoading}
        onAddEvent={handleAddEvent}
        onViewChange={setView}
        searchValue={searchValue}
        searchOptions={searchOptions}
        onSearch={handleSearch}
        onSelect={handleSelect}
      />
      <div style={{ position: 'relative' }}>
        {isLoading && (
          <div className="loading-overlay">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </div>
        )}
        
        <BigCalendar
          localizer={localizer}
          events={reactEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600, minHeight: 500 }}
          view={view as View}
          date={currentDate}
          onView={handleViewChange}
          onNavigate={handleNavigate}
          selectable
          onSelectEvent={handleSelectEvent}
  
          onDoubleClickEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          popup
          views={['month', 'week']}
          step={30}
          timeslots={2}
          onSelectSlot={handleSelectSlot}
          messages={CALENDAR_MESSAGES}
          formats={{ dateFormat: 'D' }}
        />
      </div>
      
      <EventModal
        visible={eventModalVisible}
        onClose={hideEventModal}
        onSubmit={handleModalSubmit}
        event={modalEventData}
        selectedDate={selectedDate}
      />

      <EventDetail
        visible={eventDetailVisible}
        event={selectedEvent}
        onClose={handleCloseEventDetail}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};

const Calendar = forwardRef(CalendarComponent);
Calendar.displayName = 'Calendar';

export default memo(Calendar);