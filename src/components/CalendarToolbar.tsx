import React, { memo } from 'react';
// Linus式优化：按需引入，减少bundle体积
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import AutoComplete from 'antd/es/auto-complete';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const ToolbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  padding: 20px 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
`;

const LeftSection = styled(Space)`
  align-items: center;
  flex-grow: 1;

  .ant-space-item:last-child {
    flex-grow: 1;
  }
`;

const NewEventButton = styled(Button)`
  &.ant-btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 14px;
    height: 48px;
    padding: 0 24px;
    font-weight: 700;
    font-size: 15px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
    }
    
    &:disabled {
      background: rgba(102, 126, 234, 0.3);
      transform: none;
      box-shadow: none;
    }
    
    .anticon {
      font-size: 16px;
    }
  }
`;

const ViewButtonGroup = styled(Space)`
  .ant-btn {
    height: 42px;
    border-radius: 12px;
    font-weight: 600;
    padding: 0 20px;
    font-size: 14px;
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
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
      }
    }
  }
`;

interface CalendarToolbarProps {
  view: 'month' | 'week';
  isLoading: boolean;
  onAddEvent: () => void;
  onViewChange: (view: 'month' | 'week') => void;
  searchValue: string;
  searchOptions: { value: string; label: React.ReactNode; event: any }[];
  onSearch: (query: string) => void;
  onSelect: (value: string, option: any) => void;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  view,
  isLoading,
  onAddEvent,
  onViewChange,
  searchValue,
  searchOptions,
  onSearch,
  onSelect
}) => {
  return (
    <ToolbarContainer>
      <LeftSection size={16}>
        <NewEventButton
          type="primary"
          icon={isLoading ? <LoadingOutlined spin /> : <PlusOutlined />}
          onClick={onAddEvent}
          disabled={isLoading}
        >
          ✨ 新建事件
        </NewEventButton>
        <AutoComplete
          options={searchOptions}
          value={searchValue}
          onSearch={onSearch}
          onSelect={onSelect}
          style={{ width: '100%', maxWidth: 400 }}
          placeholder="搜索并跳转到事件..."
          allowClear
        />
      </LeftSection>

      <ViewButtonGroup size={8}>
        <Button
          type={view === 'month' ? 'primary' : 'default'}
          onClick={() => onViewChange('month')}
        >
          📅 月视图
        </Button>
        <Button
          type={view === 'week' ? 'primary' : 'default'}
          onClick={() => onViewChange('week')}
        >
          📊 周视图
        </Button>
      </ViewButtonGroup>
    </ToolbarContainer>
  );
};

export default memo(CalendarToolbar);