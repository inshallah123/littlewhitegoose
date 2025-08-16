import React, { useCallback, useEffect, forwardRef, useImperativeHandle, useMemo, useState, memo } from 'react';
import { Calendar as BigCalendar, dayjsLocalizer, View } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import Spin from 'antd/es/spin';
import { LoadingOutlined } from '@ant-design/icons';
import useCalendarStore from '../store/calendarStore';
import { CalendarEvent, ReactCalendarEvent, toReactEvent, fromReactEvent, msToDate, dateToMs, nowMs } from '../types';
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

// Linus式优化：将messages移到组件外部，消除重复创建
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

// 预定义样式对象，避免运行时创建
const SELECTED_DAY_STYLE = {
  backgroundColor: '#bae7ff',
  border: '2px solid #1890ff',
};

const EMPTY_STYLE = {};


// Linus式优化：使用更细粒度的状态选择器
const Calendar = forwardRef<any, {}>((props, ref) => {
  useRenderProfiler('Calendar');
  // 消除不必要的重渲染 - 只订阅需要的状态
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
  
  // Modal states - simplified
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventDetailVisible, setEventDetailVisible] = useState(false);
  const [modalEventData, setModalEventData] = useState<Partial<CalendarEvent> | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const reactEvents = useMemo(() => 
    events.map(toReactEvent), 
    [events]
  );

  const currentDate = useMemo(() => msToDate(viewMs), [viewMs]);

  const handleViewChange = useCallback((newView: View) => {
    if (newView === 'month' || newView === 'week') {
      setView(newView);
    }
  }, [setView]);

  const handleNavigate = useCallback((newDate: Date) => {
    setViewMs(dateToMs(newDate));
  }, [setViewMs]);

  // Unified event modal handlers
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

  // Linus式优化：预定义样式对象，避免重复创建
  const eventStyleCache = useMemo(() => new Map<string, any>(), []);
  
  const eventStyleGetter = useCallback((reactEvent: ReactCalendarEvent) => {
    const event = fromReactEvent(reactEvent);
    const color = event.color || '#1890ff';
    
    if (!eventStyleCache.has(color)) {
      eventStyleCache.set(color, {
        style: {
          backgroundColor: color,
          borderRadius: '4px',
          opacity: 0.8,
          color: 'white',
          border: 'none',
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

  // Linus式优化：预定义返回对象
  const SELECTED_DAY_PROPS = useMemo(() => ({
    className: 'selected-date-bg',
    style: SELECTED_DAY_STYLE
  }), []);
  
  const dayPropGetter = useCallback((date: Date) => {
    const dayStart = new Date(date).setHours(0, 0, 0, 0);
    return dayStart === selectedDayStart ? SELECTED_DAY_PROPS : EMPTY_STYLE;
  }, [selectedDayStart, SELECTED_DAY_PROPS]);

  // Linus式改进：消除嵌套，单一职责  
  const createDefaultEvent = useCallback((startDate: Date): Partial<CalendarEvent> => {
    return {
      title: '',
      color: '#1890ff'
    };
  }, []);

  const handleAddEvent = useCallback(() => {
    const eventData = createDefaultEvent(selectedDate);
    showEventModal(eventData);
  }, [selectedDate, createDefaultEvent, showEventModal]);

  const handleSlotDoubleClick = useCallback((start: Date) => {
    const eventData = createDefaultEvent(start);
    showEventModal(eventData);
  }, [createDefaultEvent, showEventModal]);

  const handleSlotSelect = useCallback((start: Date) => {
    setSelectedMs(dateToMs(start));
  }, [setSelectedMs]);

  const handleSelectSlot = useCallback(({ start, action }: { start: Date; end: Date; slots: Date[]; action: string }) => {
    if (action === 'doubleClick') {
      handleSlotDoubleClick(start);
    } else {
      handleSlotSelect(start);
    }
  }, [handleSlotDoubleClick, handleSlotSelect]);

  // Unified event handling - no special cases
  const handleModalSubmit = useCallback(async (eventData: Partial<CalendarEvent>) => {
    try {
      await saveEvent({
        ...modalEventData,
        ...eventData
      });
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

  // Expose methods to parent component
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
        selectedDate={selectedDate}
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
});

Calendar.displayName = 'Calendar';

// Memoize the entire component to prevent unnecessary re-renders
export default memo(Calendar);