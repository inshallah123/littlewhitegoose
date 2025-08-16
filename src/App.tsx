import React, { useEffect, useRef } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import styled from 'styled-components';
import CalendarComponent from './components/Calendar';
import 'antd/dist/reset.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
`;

const Header = styled.div`
  background: white;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  h1 {
    margin: 0;
    color: #1890ff;
    font-size: 24px;
    font-weight: 600;
  }
`;

function App() {
  const calendarRef = useRef<any>(null);

  useEffect(() => {
    // 监听菜单的新建日程事件
    if (window.electronAPI) {
      const handleNewEvent = () => {
        if (calendarRef.current && calendarRef.current.handleMenuNewEvent) {
          calendarRef.current.handleMenuNewEvent();
        }
      };

      const handleViewChange = (_event: any, view: string) => {
        if (calendarRef.current && calendarRef.current.handleMenuViewChange) {
          calendarRef.current.handleMenuViewChange(view);
        }
      };

      window.electronAPI.onNewEvent(handleNewEvent);
      window.electronAPI.onChangeView(handleViewChange);
    }
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AntdApp>
        <AppContainer>
          <Header>
            <h1>桌面日历</h1>
          </Header>
          <CalendarComponent ref={calendarRef} />
        </AppContainer>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;