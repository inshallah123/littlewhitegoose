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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.1),
    0 6px 24px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  min-height: 650px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.4), transparent);
  }

  .rbc-calendar {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    background: transparent;
  }

  .rbc-event {
    border: none;
    border-radius: 10px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin: 1px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
    
    &:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      z-index: 10;
    }
  }

  .rbc-selected {
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
    transform: scale(1.05);
  }

  .rbc-today {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
      animation: gentle-pulse 2s ease-in-out infinite;
    }
  }

  .rbc-day-bg {
    transition: all 0.3s ease;
    border-right: 1px solid rgba(102, 126, 234, 0.08);
    border-bottom: 1px solid rgba(102, 126, 234, 0.08);
    
    &:hover {
      background: rgba(102, 126, 234, 0.05);
    }
  }

  .selected-date-bg {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%) !important;
    border: 2px solid #667eea !important;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      bottom: 2px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    }
  }

  .rbc-toolbar {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 2px solid rgba(102, 126, 234, 0.1);
    align-items: center;
    
    .rbc-btn-group {
      button {
        background: rgba(102, 126, 234, 0.08);
        border: 1px solid rgba(102, 126, 234, 0.2);
        color: #667eea;
        padding: 10px 18px;
        border-radius: 12px;
        font-weight: 600;
        margin-right: 6px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        backdrop-filter: blur(10px);
        font-size: 14px;
        
        &:hover {
          background: rgba(102, 126, 234, 0.15);
          border-color: rgba(102, 126, 234, 0.4);
          color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
        }
        
        &.rbc-active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          color: white;
          box-shadow: 
            0 8px 24px rgba(102, 126, 234, 0.3),
            0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }
      }
    }
    
    .rbc-toolbar-label {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      padding: 0 24px;
      white-space: nowrap;
      letter-spacing: -0.5px;
    }
  }

  .rbc-header {
    padding: 16px 8px;
    font-weight: 700;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
    color: #667eea;
    text-align: center;
    font-size: 14px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .rbc-month-view {
    border: none;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }

  .rbc-time-view {
    border: none;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }
  
  .rbc-date-cell {
    padding: 4px;
    
    > a {
      color: #4a5568;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      margin: 4px auto;
      border-radius: 50%;
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 14px;
      
      &:hover {
        background: rgba(102, 126, 234, 0.1);
        transform: scale(1.1);
        color: #667eea;
      }
    }
    
    &.rbc-off-range-bg {
      background: rgba(0, 0, 0, 0.02);
      
      > a {
        color: #a0aec0;
        
        &:hover {
          background: rgba(102, 126, 234, 0.05);
          color: #718096;
        }
      }
    }
  }
  
  @keyframes gentle-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
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