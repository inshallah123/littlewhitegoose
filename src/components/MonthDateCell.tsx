import React, { memo } from 'react';
import dayjs from 'dayjs';
import { getMonthCellDisplay } from '../utils/lunarCalendar';

interface MonthDateCellProps {
  value?: Date;
  label?: string;
  date?: Date;
  children?: React.ReactNode;
}

const MonthDateCell: React.FC<MonthDateCellProps> = ({ value, label, date, children }) => {
  // react-big-calendar might pass date or value
  const displayDate = value || date;
  
  if (!displayDate) {
    return <div className="rbc-date-cell">{label || children}</div>;
  }
  
  const dateDisplay = getMonthCellDisplay(displayDate);
  const isToday = dayjs(displayDate).isSame(dayjs(), 'day');
  const isWeekend = displayDate.getDay() === 0 || displayDate.getDay() === 6;
  
  return (
    <div className={`rbc-date-cell ${isToday ? 'rbc-today' : ''}`}>
      <div className="date-content">
        <div className={`date-number ${isWeekend ? 'weekend' : ''}`}>
          {displayDate.getDate()}
        </div>
        <div className="lunar-info">
          {dateDisplay.festival && (
            <div className="festival-text">{dateDisplay.festival}</div>
          )}
          {!dateDisplay.festival && (
            <div className="lunar-text">{dateDisplay.lunar}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default memo(MonthDateCell);