import React, { useMemo } from 'react';
import { Select, Space, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

interface TimeSlotSelectorProps {
  date: Date;
  value?: { start: Dayjs; end: Dayjs };
  onChange?: (timeSlot: { start: Dayjs; end: Dayjs }) => void;
}

const { Text } = Typography;

const timeSlots = [
  { label: '00:00 - 02:00', start: 0, end: 2 },
  { label: '02:00 - 04:00', start: 2, end: 4 },
  { label: '04:00 - 06:00', start: 4, end: 6 },
  { label: '06:00 - 08:00', start: 6, end: 8 },
  { label: '08:00 - 10:00', start: 8, end: 10 },
  { label: '10:00 - 12:00', start: 10, end: 12 },
  { label: '12:00 - 14:00', start: 12, end: 14 },
  { label: '14:00 - 16:00', start: 14, end: 16 },
  { label: '16:00 - 18:00', start: 16, end: 18 },
  { label: '18:00 - 20:00', start: 18, end: 20 },
  { label: '20:00 - 22:00', start: 20, end: 22 },
  { label: '22:00 - 24:00', start: 22, end: 24 },
];

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  date,
  value,
  onChange,
}) => {
  const selectedDay = useMemo(() => dayjs(date), [date]);
  
  const currentSlotKey = useMemo(() => {
    if (!value) return undefined;
    const startHour = value.start.hour();
    const endHour = value.end.hour() === 0 && value.end.date() > value.start.date() ? 24 : value.end.hour();
    return `${startHour}-${endHour}`;
  }, [value]);

  const handleSlotChange = (slotKey: string) => {
    const [startStr, endStr] = slotKey.split('-');
    const startHour = parseInt(startStr);
    const endHour = parseInt(endStr);
    
    const start = selectedDay.hour(startHour).minute(0).second(0);
    const end = selectedDay.hour(endHour === 24 ? 0 : endHour).minute(0).second(0);
    
    onChange?.({ start, end: endHour === 24 ? end.add(1, 'day') : end });
  };

  const selectOptions = useMemo(() => 
    timeSlots.map(slot => ({
      label: slot.label,
      value: `${slot.start}-${slot.end}`,
    })), []
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text strong>
        选择时间段 ({selectedDay.format('YYYY年MM月DD日')})
      </Text>
      <Select
        style={{ width: '100%' }}
        placeholder="请选择时间段"
        value={currentSlotKey}
        onChange={handleSlotChange}
        options={selectOptions}
      />
    </Space>
  );
};

export default TimeSlotSelector;