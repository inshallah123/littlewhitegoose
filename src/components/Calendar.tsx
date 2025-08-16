import React, { useCallback, useEffect, forwardRef, useImperativeHandle, useMemo, useState, memo } from 'react';
import { Calendar as BigCalendar, dayjsLocalizer, View } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import styled from 'styled-components';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import useCalendarStore from '../store/calendarStore';
import { CalendarEvent, ReactCalendarEvent, toReactEvent, fromReactEvent, msToDate, dateToMs, nowMs } from '../types';
import EventModal from './EventModal';
import EventDetail from './EventDetail';
import CalendarToolbar from './CalendarToolbar';

// Configure dayjs
dayjs.locale('zh-cn');
dayjs.extend(utc);
dayjs.extend(timezone);

const localizer = dayjsLocalizer(dayjs);

const CalendarContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 600px;

  .rbc-calendar {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  }

  .rbc-event {
    background-color: #1890ff;
    border: none;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
    
    &:hover {
      background-color: #0050b3;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
    }
  }

  .rbc-selected {
    background-color: #0050b3;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }

  .rbc-today {
    background-color: #f0f9ff;
    border: 1px solid #bae7ff;
  }

  .rbc-day-bg {
    transition: background-color 0.2s ease;
    
    &:hover {
      background-color: #fafafa;
    }
  }

  .selected-date-bg {
    background-color: #e6f4ff !important;
    border: 2px solid #1890ff !important;
    box-sizing: border-box;
  }

  .rbc-toolbar {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
    
    .rbc-btn-group {
      button {
        border: 1px solid #d9d9d9;
        background: white;
        color: #262626;
        padding: 6px 16px;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        
        &:hover {
          border-color: #1890ff;
          color: #1890ff;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
        }
        
        &.rbc-active {
          background: #1890ff;
          color: white;
          border-color: #1890ff;
        }
      }
    }
  }

  .rbc-header {
    padding: 12px 8px;
    font-weight: 600;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
  }

  .rbc-month-view {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .rbc-time-view {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
`;

const Calendar = forwardRef<any, {}>((props, ref) => {
  const { events, view, isLoading, selectedMs, viewMs, setView, saveEvent, deleteEvent, loadEvents, setSelectedMs, setViewMs } = useCalendarStore();
  
  // Modal states - simplified
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventDetailVisible, setEventDetailVisible] = useState(false);
  const [modalEventData, setModalEventData] = useState<Partial<CalendarEvent> | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Memoized conversions for react-big-calendar
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

  const eventStyleGetter = useCallback((reactEvent: ReactCalendarEvent) => {
    const event = fromReactEvent(reactEvent);
    return {
      style: {
        backgroundColor: event.color || '#1890ff',
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  }, []);

  const selectedDate = useMemo(() => msToDate(selectedMs), [selectedMs]);

  const dayPropGetter = useCallback((date: Date) => {
    const dateMs = dateToMs(date);
    const sameDaySelected = Math.abs(dateMs - selectedMs) < 24 * 60 * 60 * 1000 &&
                            msToDate(dateMs).getDate() === msToDate(selectedMs).getDate();
    
    return sameDaySelected ? {
      className: 'selected-date-bg',
      style: {
        backgroundColor: '#bae7ff',
        border: '2px solid #1890ff',
      }
    } : {};
  }, [selectedMs]);

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
    <CalendarContainer>
      <CalendarToolbar
        view={view}
        isLoading={isLoading}
        onAddEvent={handleAddEvent}
        onViewChange={setView}
        selectedDate={selectedDate}
      />
      <div style={{ position: 'relative' }}>
        {isLoading && (
          <LoadingOverlay>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          </LoadingOverlay>
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
          messages={useMemo(() => ({
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
          }), [])}
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
    </CalendarContainer>
  );
});

Calendar.displayName = 'Calendar';

// Memoize the entire component to prevent unnecessary re-renders
export default memo(Calendar);