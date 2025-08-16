import React from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const ToolbarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 0;
`;

const ViewButtonGroup = styled(Space)`
  .ant-btn {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
    }
  }
`;

interface CalendarToolbarProps {
  view: 'month' | 'week';
  isLoading: boolean;
  onAddEvent: () => void;
  onViewChange: (view: 'month' | 'week') => void;
  selectedDate?: Date | null;
}

const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  view,
  isLoading,
  onAddEvent,
  onViewChange,
  selectedDate
}) => {
  return (
    <ToolbarContainer>
      <Space>
        <Button
          type="primary"
          icon={isLoading ? <LoadingOutlined spin /> : <PlusOutlined />}
          onClick={onAddEvent}
          disabled={isLoading}
          size="large"
          style={{
            borderRadius: '8px',
            height: '40px',
            paddingLeft: '20px',
            paddingRight: '20px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          新建事件
        </Button>
        
        <div style={{ color: '#666', fontSize: '13px', lineHeight: '1.4' }}>
          {selectedDate ? (
            <span>
              已选择: <strong>{selectedDate.toLocaleDateString('zh-CN')}</strong>
              <br />
              <span style={{ fontSize: '12px', opacity: 0.8 }}>
                双击日期快速创建事件
              </span>
            </span>
          ) : (
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              单击选择日期，双击日期创建事件
            </span>
          )}
        </div>
      </Space>

      <ViewButtonGroup>
        <Button
          type={view === 'month' ? 'primary' : 'default'}
          onClick={() => onViewChange('month')}
          style={{
            borderRadius: '6px',
            fontWeight: view === 'month' ? 600 : 400,
          }}
        >
          月视图
        </Button>
        <Button
          type={view === 'week' ? 'primary' : 'default'}
          onClick={() => onViewChange('week')}
          style={{
            borderRadius: '6px',
            fontWeight: view === 'week' ? 600 : 400,
          }}
        >
          周视图
        </Button>
      </ViewButtonGroup>
    </ToolbarContainer>
  );
};

export default CalendarToolbar;