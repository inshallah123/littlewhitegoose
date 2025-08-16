import React, { memo } from 'react';
import { Modal, Button, Popconfirm, Space, Typography, Divider } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { CalendarEvent, msToDate } from '../types';

const { Text, Title } = Typography;

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
      font-size: 18px;
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
      padding: 0 20px;
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
      }
      
      &.ant-btn-dangerous {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        border: none;
        color: white;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255, 107, 107, 0.3);
        }
      }
    }
  }
`;

const EventContent = styled.div`
  .event-title {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 24px;
    line-height: 1.3;
  }
  
  .info-section {
    background: rgba(102, 126, 234, 0.03);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(102, 126, 234, 0.08);
    margin-bottom: 16px;
    
    .info-label {
      font-weight: 700;
      color: #667eea;
      font-size: 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .info-content {
      color: #4a5568;
      font-size: 15px;
      line-height: 1.6;
      white-space: pre-wrap;
    }
  }
  
  .time-badge {
    display: inline-flex;
    align-items: center;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    color: #667eea;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
    border: 1px solid rgba(102, 126, 234, 0.2);
  }
`;

interface EventDetailProps {
  visible: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => Promise<void>;
}

const EventDetail: React.FC<EventDetailProps> = ({
  visible,
  event,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!event) return null;

  const handleDelete = async () => {
    try {
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('删除事件失败:', error);
    }
  };

  const handleEdit = () => {
    onEdit(event);
    onClose();
  };

  const formatEventTime = (start: Date, end: Date, isAllDay?: boolean) => {
    if (isAllDay) {
      const startDay = dayjs(start);
      const endDay = dayjs(end);
      if (startDay.isSame(endDay, 'day')) {
        return `${startDay.format('YYYY年M月D日')} 全天`;
      } else {
        return `${startDay.format('YYYY年M月D日')} 至 ${endDay.format('YYYY年M月D日')} 全天`;
      }
    } else {
      const startTime = dayjs(start);
      const endTime = dayjs(end);
      if (startTime.isSame(endTime, 'day')) {
        return `${startTime.format('YYYY年M月D日')} ${startTime.format('HH:mm')} - ${endTime.format('HH:mm')}`;
      } else {
        return `${startTime.format('YYYY年M月D日 HH:mm')} 至 ${endTime.format('YYYY年M月D日 HH:mm')}`;
      }
    }
  };

  return (
    <StyledModal
      title="📋 事件详情"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          ❌ 关闭
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={handleEdit}
        >
          ✏️ 编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="🗑️ 确定要删除这个事件吗？"
          onConfirm={handleDelete}
          okText="确定删除"
          cancelText="取消"
          placement="top"
        >
          <Button danger icon={<DeleteOutlined />}>
            🗑️ 删除
          </Button>
        </Popconfirm>
      ]}
      width={560}
      centered
    >
      <EventContent>
        <div className="event-title">
          {event.title}
        </div>
        
        <div className="info-section">
          <div className="info-label">
            ⏰ 时间安排
          </div>
          <div className="time-badge">
            {formatEventTime(msToDate(event.startMs), msToDate(event.endMs), event.isAllDay)}
          </div>
        </div>

        {event.description && (
          <div className="info-section">
            <div className="info-label">
              📝 详细描述
            </div>
            <div className="info-content">
              {event.description}
            </div>
          </div>
        )}
      </EventContent>
    </StyledModal>
  );
};

export default memo(EventDetail);