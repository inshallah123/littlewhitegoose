import React from 'react';
import { Modal, Button, Popconfirm, Space, Typography, Divider } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { CalendarEvent } from '../types';

const { Text, Title } = Typography;

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
    <Modal
      title="事件详情"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={handleEdit}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个事件吗？"
          onConfirm={handleDelete}
          okText="确定"
          cancelText="取消"
          placement="top"
        >
          <Button danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ]}
      width={500}
    >
      <div>
        <Title level={4} style={{ marginBottom: 16 }}>
          {event.title}
        </Title>
        
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>时间：</Text>
            <br />
            <Text>{formatEventTime(event.start, event.end, event.isAllDay)}</Text>
          </div>

          {event.description && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text strong>描述：</Text>
                <br />
                <Text style={{ whiteSpace: 'pre-wrap' }}>{event.description}</Text>
              </div>
            </>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default EventDetail;