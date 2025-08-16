import React, { useEffect, useRef } from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import styled, { createGlobalStyle } from 'styled-components';
import CalendarComponent from './components/Calendar';
import 'antd/dist/reset.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }
  
  .ant-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .ant-modal {
    backdrop-filter: blur(10px);
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  background: transparent;
  padding: 24px;
  position: relative;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    pointer-events: none;
    z-index: -1;
  }
`;

const Header = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 24px 32px;
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 4px 16px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
  }
  
  h1 {
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
    text-align: center;
    position: relative;
    
    &::after {
      content: '🦢';
      margin-left: 12px;
      -webkit-text-fill-color: initial;
      font-size: 28px;
      display: inline-block;
      animation: gentle-float 3s ease-in-out infinite;
    }
  }
  
  @keyframes gentle-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-3px); }
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
          colorPrimary: '#667eea',
          borderRadius: 16,
          colorBgContainer: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <AntdApp>
        <GlobalStyle />
        <AppContainer>
          <Header>
            <h1>Goose's Calendar</h1>
          </Header>
          <CalendarComponent ref={calendarRef} />
        </AppContainer>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;