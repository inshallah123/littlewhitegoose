import React, { useCallback, useEffect, forwardRef, useImperativeHandle, useMemo, useState, memo, ForwardedRef } from 'react';
import { Calendar as BigCalendar, dayjsLocalizer, View } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import Spin from 'antd/es/spin';
import { LoadingOutlined } from '@ant-design/icons';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import useCalendarStore from '../store/calendarStore';
import { CalendarEvent, ReactCalendarEvent, toReactEvent, fromReactEvent, msToDate, dateToMs } from '../types';
import EventModal from './EventModal';
import EventDetail from './EventDetail';
import CalendarToolbar from './CalendarToolbar';
import '../styles/calendar.css';
import { useRenderProfiler } from '../utils/performance';
import { getNextOccurrence } from '../utils/recurrence';

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
  
  const allEvents = useCalendarStore(state => state.events);
  const getEventsInView = useCalendarStore(state => state.getEventsInView);
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
  const [editScope, setEditScope] = useState<'one' | 'all'>('all');
  
  // State for the new AutoComplete search
  const [searchValue, setSearchValue] = useState('');
  const [searchOptions, setSearchOptions] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const currentDate = useMemo(() => msToDate(viewMs), [viewMs]);

  const eventsInView = useMemo(() => {
    const viewDate = new Date(viewMs);
    const startDate = view === 'month' ? startOfMonth(viewDate) : startOfWeek(viewDate, { weekStartsOn: 1 });
    const endDate = view === 'month' ? endOfMonth(viewDate) : endOfWeek(viewDate, { weekStartsOn: 1 });
    return getEventsInView(startDate, endDate);
  }, [viewMs, view, getEventsInView, allEvents]); // Depend on allEvents to recompute when exceptions are added

  const reactEvents = useMemo(() => 
    eventsInView.map(toReactEvent),
    [eventsInView]
  );

  const handleSearch = useCallback((text: string) => {
    setSearchValue(text);
    if (!text) {
      setSearchOptions([]);
      return;
    }

    const lowerCaseText = text.toLowerCase();
    const now = new Date();

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
        
        const eventDate = dayjs(msToDate(eventToShow.startMs)).format('YYYY-MM-DD');
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

  const handleViewChange = useCallback((newView: View) => {
    if (newView === 'month' || newView === 'week') {
      setView(newView);
    }
  }, [setView]);

  const handleNavigate = useCallback((newDate: Date) => {
    setViewMs(dateToMs(newDate));
  }, [setViewMs]);

  const showEventModal = useCallback((eventData: Partial<CalendarEvent>, scope: 'one' | 'all' = 'all') => {
    setModalEventData(eventData);
    setEditScope(scope);
    setEventModalVisible(true);
  }, []);

  const hideEventModal = useCallback(() => {
    setEventModalVisible(false);
    setModalEventData(null);
    setEditScope('all');
  }, []);

  const handleSelectEvent = useCallback((reactEvent: ReactCalendarEvent) => {
    let event = fromReactEvent(reactEvent);
    // If it's a recurring instance, find the original event to get all data
    if (event.seriesId) {
      const masterEvent = allEvents.find(e => e.id === event.seriesId);
      if (masterEvent) {
        // Combine master data with instance-specific timing
        event = { ...masterEvent, startMs: event.startMs, endMs: event.endMs, id: masterEvent.id };
      }
    }
    setSelectedEvent(event);
    setEventDetailVisible(true);
  }, [allEvents]);

  const handleEditEvent = useCallback((event: CalendarEvent, scope: 'one' | 'all') => {
    showEventModal(event, scope);
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
      // For 'one' scope, we need the original start time to create the exception
      const eventWithContext = { ...modalEventData, ...eventData };
      await saveEvent(eventWithContext, editScope);
      hideEventModal();
    } catch (error) {
      console.error('Failed to save event:', error);
      throw error;
    }
  }, [modalEventData, saveEvent, hideEventModal, editScope]);

  const handleDeleteEvent = useCallback(async (eventId: string, scope: 'one' | 'all', startMs?: number) => {
    try {
      await deleteEvent(eventId, scope, startMs);
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