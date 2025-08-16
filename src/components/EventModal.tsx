import React, { useState, useCallback, useMemo, memo } from 'react';
import { Modal, Form, Input, Switch, App } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent, msToDate, dateToMs } from '../types';
import TimeSlotSelector from './TimeSlotSelector';

interface EventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (event: Partial<CalendarEvent>) => Promise<void>;
  event?: Partial<CalendarEvent> | null;
  selectedDate?: Date;
}

const EventModal: React.FC<EventModalProps> = ({
  visible,
  onClose,
  onSubmit,
  event,
  selectedDate
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const isEditing = useMemo(() => !!event?.id, [event?.id]);
  
  const initialValues = useMemo(() => {
    if (event) {
      const startDate = event.startMs ? msToDate(event.startMs) : new Date();
      const endDate = event.endMs ? msToDate(event.endMs) : new Date();
      
      return {
        title: event.title || '',
        description: event.description || '',
        timeSlot: (event.isAllDay || (!event.startMs && !event.endMs)) ? undefined : { 
          start: dayjs(startDate), 
          end: dayjs(endDate) 
        },
        isAllDay: event.isAllDay || false
      };
    }

    return {
      title: '',
      description: '',
      timeSlot: undefined,
      isAllDay: false
    };
  }, [event]);

  const currentDate = useMemo(() => {
    if (initialValues.timeSlot?.start) {
      return initialValues.timeSlot.start.toDate();
    }
    if (event?.startMs) {
      return msToDate(event.startMs);
    }
    return selectedDate || new Date();
  }, [initialValues.timeSlot, event?.startMs, selectedDate]);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      let startTime, endTime;
      
      if (values.isAllDay) {
        const selectedDay = dayjs(currentDate);
        startTime = selectedDay.startOf('day').toDate();
        endTime = selectedDay.endOf('day').toDate();
      } else {
        if (!values.timeSlot) {
          message.error('请选择时间段');
          return;
        }
        startTime = values.timeSlot.start.toDate();
        endTime = values.timeSlot.end.toDate();
      }
      
      const eventData: Partial<CalendarEvent> = {
        id: event?.id,
        title: values.title.trim(),
        startMs: dateToMs(startTime),
        endMs: dateToMs(endTime),
        description: values.description?.trim() || '',
        color: event?.color || '#1890ff',
        isAllDay: values.isAllDay || false
      };

      await onSubmit(eventData);
      onClose();
      message.success(isEditing ? '事件已更新' : '事件已创建');
    } catch (error) {
      console.error('提交事件失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [form, onSubmit, onClose, message, isEditing, currentDate]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleAfterClose = useCallback(() => {
    form.resetFields();
  }, [form]);

  const handleTimeSlotChange = useCallback((timeSlot: { start: Dayjs; end: Dayjs }) => {
    form.setFieldValue('timeSlot', timeSlot);
  }, [form]);

  const handleAllDayChange = useCallback((checked: boolean) => {
    form.setFieldValue('isAllDay', checked);
    if (checked) {
      form.setFieldValue('timeSlot', undefined);
    }
  }, [form]);

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(initialValues);
    }
  }, [visible, form, initialValues]);

  React.useEffect(() => {
    if (!visible) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleSubmit, handleCancel]);


  return (
    <Modal
      title={isEditing ? "编辑事件" : "新建事件"}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      afterClose={handleAfterClose}
      okText="保存"
      cancelText="取消"
      confirmLoading={loading}
      maskClosable={!loading}
      keyboard={!loading}
      destroyOnClose={false}
      forceRender={false}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        preserve={false}
      >
        <Form.Item
          name="title"
          label="事件标题"
          rules={[
            { required: true, message: '请输入事件标题' },
            { max: 100, message: '标题不能超过100个字符' }
          ]}
        >
          <Input placeholder="请输入事件标题" autoFocus />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
          rules={[{ max: 500, message: '描述不能超过500个字符' }]}
        >
          <Input.TextArea
            placeholder="请输入事件描述（可选）"
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="isAllDay"
          label="全天事件"
          valuePropName="checked"
        >
          <Switch onChange={handleAllDayChange} />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.isAllDay !== currentValues.isAllDay}>
          {({ getFieldValue }) => {
            const isAllDay = getFieldValue('isAllDay');
            
            if (isAllDay) return null;
            
            return (
              <Form.Item
                name="timeSlot"
                label="时间"
                rules={[{ required: true, message: '请选择时间段' }]}
              >
                <TimeSlotSelector
                  date={currentDate}
                  value={form.getFieldValue('timeSlot')}
                  onChange={handleTimeSlotChange}
                />
              </Form.Item>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default memo(EventModal);