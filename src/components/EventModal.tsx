import React, { useState, useCallback } from 'react';
import { Modal, Form, Input, Switch, App } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '../types';
import TimeSlotSelector from './TimeSlotSelector';

interface EventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  event?: CalendarEvent | null;
  defaultStart?: Date;
  defaultEnd?: Date;
}

const EventModal: React.FC<EventModalProps> = ({
  visible,
  onClose,
  onSubmit,
  event,
  defaultStart,
  defaultEnd
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const isEditing = !!event;

  const getInitialValues = useCallback(() => {
    if (event) {
      const start = dayjs(event.start);
      const end = dayjs(event.end);
      return {
        title: event.title,
        description: event.description,
        timeSlot: { start, end },
        isAllDay: event.isAllDay
      };
    }
    
    if (defaultStart && defaultEnd) {
      const start = dayjs(defaultStart);
      const end = dayjs(defaultEnd);
      return {
        title: '',
        description: '',
        timeSlot: { start, end },
        isAllDay: false
      };
    }

    const now = dayjs();
    const start = now.hour(9).minute(0).second(0);
    const end = start.add(2, 'hour');
    
    return {
      title: '',
      description: '',
      timeSlot: { start, end },
      isAllDay: false
    };
  }, [event, defaultStart, defaultEnd]);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const eventData: Omit<CalendarEvent, 'id'> = {
        title: values.title.trim(),
        start: values.timeSlot.start.toDate(),
        end: values.timeSlot.end.toDate(),
        description: values.description?.trim() || '',
        color: '#1890ff',
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
  }, [form, onSubmit, onClose, message, isEditing]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleAfterClose = useCallback(() => {
    form.resetFields();
  }, [form]);

  const handleTimeSlotChange = useCallback((timeSlot: { start: Dayjs; end: Dayjs }) => {
    form.setFieldValue('timeSlot', timeSlot);
  }, [form]);

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(getInitialValues());
    }
  }, [visible, form, getInitialValues]);

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

  const formValues = form.getFieldsValue();
  const currentDate = formValues?.timeSlot?.start?.toDate() || defaultStart || new Date();

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
      destroyOnClose
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
          <Switch />
        </Form.Item>

        <Form.Item
          name="timeSlot"
          label="时间"
          rules={[{ required: true, message: '请选择时间段' }]}
        >
          <TimeSlotSelector
            date={currentDate}
            onChange={handleTimeSlotChange}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EventModal;