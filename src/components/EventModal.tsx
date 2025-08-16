import React, { useState, useCallback, useMemo, memo } from 'react';
import { Modal, Form, Input, Switch, App } from 'antd';
import styled from 'styled-components';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent, msToDate, dateToMs } from '../types';
import TimeSlotSelector from './TimeSlotSelector';

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.15),
      0 10px 30px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    overflow: hidden;
    padding: 0;
  }
  
  .ant-modal-header {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
    padding: 24px 32px;
    border-radius: 24px 24px 0 0;
    
    .ant-modal-title {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }
  }
  
  .ant-modal-body {
    padding: 32px;
  }
  
  .ant-modal-footer {
    padding: 20px 32px 32px;
    border-top: 1px solid rgba(102, 126, 234, 0.1);
    background: rgba(102, 126, 234, 0.02);
    border-radius: 0 0 24px 24px;
    
    .ant-btn {
      height: 44px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      padding: 0 24px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &.ant-btn-default {
        background: rgba(102, 126, 234, 0.08);
        border: 1px solid rgba(102, 126, 234, 0.2);
        color: #667eea;
        
        &:hover {
          background: rgba(102, 126, 234, 0.15);
          border-color: rgba(102, 126, 234, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
        }
      }
      
      &.ant-btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        color: white;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.3);
        }
        
        &:disabled {
          background: rgba(102, 126, 234, 0.3);
          transform: none;
          box-shadow: none;
        }
      }
    }
  }
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 24px;
    
    .ant-form-item-label {
      padding-bottom: 8px;
      
      > label {
        font-weight: 600;
        color: #4a5568;
        font-size: 14px;
        
        &.ant-form-item-required::before {
          color: #667eea;
        }
      }
    }
    
    .ant-input, .ant-input:focus {
      border: 2px solid rgba(102, 126, 234, 0.2);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 14px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(102, 126, 234, 0.02);
      
      &:hover {
        border-color: rgba(102, 126, 234, 0.4);
        background: rgba(102, 126, 234, 0.04);
      }
      
      &:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        background: white;
      }
    }
    
    .ant-input::placeholder {
      color: #a0aec0;
      font-style: italic;
    }
    
    .ant-switch {
      background: rgba(102, 126, 234, 0.2);
      
      &.ant-switch-checked {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    }
  }
`;

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
    <StyledModal
      title={isEditing ? "🎯 编辑事件" : "✨ 新建事件"}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      afterClose={handleAfterClose}
      okText="💾 保存"
      cancelText="❌ 取消"
      confirmLoading={loading}
      maskClosable={!loading}
      keyboard={!loading}
      destroyOnClose={false}
      forceRender={false}
      width={520}
      centered
    >
      <StyledForm
        form={form}
        layout="vertical"
        autoComplete="off"
        preserve={false}
      >
        <Form.Item
          name="title"
          label="📝 事件标题"
          rules={[
            { required: true, message: '请输入事件标题' },
            { max: 100, message: '标题不能超过100个字符' }
          ]}
        >
          <Input placeholder="✨ 输入一个精彩的事件标题..." autoFocus />
        </Form.Item>

        <Form.Item
          name="description"
          label="📋 详细描述"
          rules={[{ max: 500, message: '描述不能超过500个字符' }]}
        >
          <Input.TextArea
            placeholder="📝 添加更多细节，让这个事件更加生动..."
            rows={3}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="isAllDay"
          label="🌅 全天事件"
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
                label="⏰ 时间段"
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
      </StyledForm>
    </StyledModal>
  );
};

export default memo(EventModal);