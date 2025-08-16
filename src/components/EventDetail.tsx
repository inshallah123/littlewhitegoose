import React, { memo, useMemo } from 'react';
// Linus式优化：按需引入，减少bundle体积
import Modal from 'antd/es/modal';
import Button from 'antd/es/button';
import Popconfirm from 'antd/es/popconfirm';
import Space from 'antd/es/space';
import Typography from 'antd/es/typography';
import Divider from 'antd/es/divider';
import Tag from 'antd/es/tag';
import { EditOutlined, DeleteOutlined, RedoOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { CalendarEvent, msToDate } from '../types';
import { getNextOccurrence } from '../utils/recurrence';

const { Text, Title } = Typography;

const TAG_COLORS: { [key: string]: string } = {
  '私': '#eb2f96',
  '工作': '#1890ff',
  '班次': '#722ed1',
  'balance': '#52c41a',
};

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
  onEdit: (event: CalendarEvent, scope: 'one' | 'all') => void;
  onDelete: (eventId: string, scope: 'one' | 'all', startMs?: number) => Promise<void>;
}

const EventDetail: React.FC<EventDetailProps> = ({
  visible,
  event,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!event) return null;

  const isRecurring = !!event.recurrenceRule;

  const handleDelete = async (scope: 'one' | 'all') => {
    try {
      await onDelete(event.id, scope, event.startMs);
      onClose();
    } catch (error) {
      console.error('删除事件失败:', error);
    }
  };

  const handleEdit = (scope: 'one' | 'all') => {
    onEdit(event, scope);
    onClose();
  };

  const showDeleteConfirm = () => {
    Modal.confirm({
      title: '请选择删除范围',
      content: '您想如何删除这个周期性事件？',
      okText: '仅删除这一个',
      cancelText: '删除整个系列',
      onOk: () => handleDelete('one'),
      onCancel: () => handleDelete('all'),
      centered: true,
    });
  };

  const showEditConfirm = () => {
    Modal.confirm({
      title: '请选择编辑范围',
      content: '您想如何编辑这个周期性事件？',
      okText: '仅编辑这一个',
      cancelText: '编辑整个系列',
      onOk: () => handleEdit('one'),
      onCancel: () => handleEdit('all'),
      centered: true,
    });
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

  const recurrenceText = useMemo(() => {
    if (!event.recurrenceRule) return '';
    const { type, interval } = event.recurrenceRule;
    switch (type) {
      case 'monthly': return '每月重复';
      case 'quarterly': return '每季度重复';
      case 'yearly': return '每年重复';
      case 'custom': 
        if (interval === 365) return '每年重复 (365天)';
        return `每 ${interval} 天重复`;
      default: return '周期性事件';
    }
  }, [event.recurrenceRule]);

  const nextOccurrenceDate = useMemo(() => {
    if (!event.recurrenceRule) return null;
    // We need the original event to calculate from its start date
    const next = getNextOccurrence(event, new Date(event.startMs));
    return next ? dayjs(next).format('YYYY年M月D日') : '无';
  }, [event]);

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
          onClick={() => isRecurring ? showEditConfirm() : handleEdit('all')}
        >
          ✏️ 编辑
        </Button>,
        isRecurring ? (
          <Button danger icon={<DeleteOutlined />} onClick={showDeleteConfirm}>
            🗑️ 删除
          </Button>
        ) : (
          <Popconfirm
            key="delete"
            title="🗑️ 确定要删除这个事件吗？"
            onConfirm={() => handleDelete('all')}
            okText="确定删除"
            cancelText="取消"
            placement="top"
          >
            <Button danger icon={<DeleteOutlined />}>
              🗑️ 删除
            </Button>
          </Popconfirm>
        )
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

        {isRecurring && (
          <div className="info-section">
            <div className="info-label">
              <RedoOutlined /> 重复规则
            </div>
            <div className="info-content">
              {recurrenceText}
              <br />
              <Text type="secondary">下一个周期日: {nextOccurrenceDate}</Text>
            </div>
          </div>
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="info-section">
            <div className="info-label">
              🏷️ 标签
            </div>
            <Space size={[0, 8]} wrap>
              {event.tags.map(tag => (
                <Tag key={tag} color={TAG_COLORS[tag] || 'default'}>
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}

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