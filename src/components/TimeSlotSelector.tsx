import React, { useMemo } from 'react';
// Linus式优化：按需引入，减少bundle体积
import Select from 'antd/es/select';
import Space from 'antd/es/space';
import Typography from 'antd/es/typography';
import styled from 'styled-components';
import dayjs, { Dayjs } from 'dayjs';

interface TimeSlotSelectorProps {
  date: Date;
  value?: { start: Dayjs; end: Dayjs };
  onChange?: (timeSlot: { start: Dayjs; end: Dayjs }) => void;
}

const { Text } = Typography;

const SelectorContainer = styled(Space)`
  width: 100%;
  
  .time-selector-label {
    font-weight: 600;
    color: #667eea;
    font-size: 14px;
    background: rgba(102, 126, 234, 0.05);
    padding: 8px 16px;
    border-radius: 12px;
    border: 1px solid rgba(102, 126, 234, 0.1);
  }
`;

const StyledSelect = styled(Select)`
  .ant-select-selector {
    border: 2px solid rgba(102, 126, 234, 0.2) !important;
    border-radius: 12px !important;
    padding: 8px 16px !important;
    font-size: 14px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    background: rgba(102, 126, 234, 0.02) !important;
    min-height: 48px !important;
    
    &:hover {
      border-color: rgba(102, 126, 234, 0.4) !important;
      background: rgba(102, 126, 234, 0.04) !important;
    }
    
    &.ant-select-focused {
      border-color: #667eea !important;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
      background: white !important;
    }
    
    .ant-select-selection-placeholder {
      color: #a0aec0 !important;
      font-style: italic !important;
    }
    
    .ant-select-selection-item {
      color: #4a5568 !important;
      font-weight: 600 !important;
    }
  }
  
  &.ant-select-open .ant-select-selector {
    border-color: #667eea !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
  }
`;

const timeSlots = [
  { label: '08:00 - 10:00', start: 8, end: 10 },
  { label: '10:00 - 12:00', start: 10, end: 12 },
  { label: '12:00 - 14:00', start: 12, end: 14 },
  { label: '14:00 - 16:00', start: 14, end: 16 },
  { label: '16:00 - 18:00', start: 16, end: 18 },
  { label: '18:00 - 20:00', start: 18, end: 20 },
  { label: '20:00 - 22:00', start: 20, end: 22 },
  { label: '22:00 - 24:00', start: 22, end: 24 },
  { label: '00:00 - 02:00', start: 0, end: 2 },
  { label: '02:00 - 04:00', start: 2, end: 4 },
  { label: '04:00 - 06:00', start: 4, end: 6 },
  { label: '06:00 - 08:00', start: 6, end: 8 },
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

  const handleSlotChange = (value: unknown) => {
    const slotKey = value as string;
    if (!slotKey) return;
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
    <SelectorContainer direction="vertical">
      <div className="time-selector-label">
        🕐 选择时间段 ({selectedDay.format('YYYY年MM月DD日')})
      </div>
      <StyledSelect
        style={{ width: '100%' }}
        placeholder="⏰ 请选择一个时间段..."
        value={currentSlotKey}
        onChange={handleSlotChange}
        options={selectOptions}
        allowClear
        size="large"
      />
    </SelectorContainer>
  );
};

export default TimeSlotSelector;