import React, { useEffect, useRef } from 'react';
import ConfigProvider from 'antd/es/config-provider';
import { App as AntdApp } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import styled, { createGlobalStyle } from 'styled-components';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import CalendarComponent from './components/Calendar';
import Goose from './components/Goose';
import useCalendarStore from './store/calendarStore';
import 'antd/dist/reset.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/calendar.css';

dayjs.extend(isBetween);

const GlobalStyle = createGlobalStyle<{ $hasCustomBg: boolean }>`
  /* 引入外部字体，并建立优雅的中英文混排字体栈 */
  
  * {
    box-sizing: border-box;
  }
  
  body {
    /* Poppins 用于英文/数字，后面是备用的中文系统字体栈 */
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    padding: 0;
    background: ${({ $hasCustomBg }) => $hasCustomBg 
      ? 'none' 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
    min-height: 100vh;
    color: #333;
  }
  
  .ant-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .ant-modal {
    backdrop-filter: blur(10px);
  }
`;

const CalendarWrapper = styled.div<{ $hasCustomBg: boolean }>`
  .calendar-container, .week-view {
    background: ${({ $hasCustomBg }) => $hasCustomBg ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.95)'};
    transition: background 0.5s ease-in-out;
  }
`;

const AppContainer = styled.div<{ $bgImage?: string | null; $bgFit?: 'cover' | 'contain' | 'stretch' | 'tile' }>`
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
    background-image: ${({ $bgImage }) => $bgImage ? `url("${$bgImage}")` : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'};
    background-size: ${({ $bgFit }) => {
      switch ($bgFit) {
        case 'cover': return 'cover';
        case 'contain': return 'contain';
        case 'stretch': return '100% 100%';
        case 'tile': return 'auto';
        default: return 'contain';
      }
    }};
    background-position: center;
    background-repeat: ${({ $bgFit }) => $bgFit === 'tile' ? 'repeat' : 'no-repeat'};
    background-attachment: fixed;
    pointer-events: none;
    z-index: -1;
    transition: background-image 0.5s ease-in-out;
  }
`;

const Header = styled.div<{ $hasCustomBg: boolean }>`
  background: ${({ $hasCustomBg }) => $hasCustomBg ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(10px);
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
  transition: background 0.5s ease-in-out;
  
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
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -0.5px;
    text-align: center;
    position: relative;
    text-shadow: 0 2px 8px rgba(0,0,0,0.05);
    
    &::after {
      content: '🦢';
      margin-left: 16px;
      -webkit-text-fill-color: initial;
      font-size: 30px;
      display: inline-block;
      animation: gentle-float 3s ease-in-out infinite;
      vertical-align: middle;
    }
  }
  
  @keyframes gentle-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
  }
`;

function App() {
  const calendarRef = useRef<any>(null);
  const viewMs = useCalendarStore(state => state.viewMs);
  const setViewMs = useCalendarStore(state => state.setViewMs);
  const cleanup = useCalendarStore(state => state.cleanup);
  const clearAllEvents = useCalendarStore(state => state.clearAllEvents);
  const backgroundImage = useCalendarStore(state => state.backgroundImage);
  const backgroundFit = useCalendarStore(state => state.backgroundFit);
  const setBackgroundImage = useCalendarStore(state => state.setBackgroundImage);
  const setBackgroundFit = useCalendarStore(state => state.setBackgroundFit);
  const loadBackgroundImage = useCalendarStore(state => state.loadBackgroundImage);

  useEffect(() => {
    loadBackgroundImage();
  }, [loadBackgroundImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentDate = new Date(viewMs);
      let newDate: Date | null = null;

      switch (e.key) {
        case 'ArrowLeft':
          newDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
          break;
        case 'ArrowRight':
          newDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
          break;
        case 'ArrowUp':
          newDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));
          break;
        case 'ArrowDown':
          newDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
          break;
        case ' ': // Spacebar
          newDate = new Date(); // Go to today's date
          break;
        default:
          break;
      }

      if (newDate) {
        e.preventDefault();
        setViewMs(newDate.getTime());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewMs]);


  useEffect(() => {
    // Global cleanup on unmount
    return () => {
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    // Electron event listeners
    if (!window.electronAPI) return;

    const onNewEvent = () => calendarRef.current?.handleMenuNewEvent?.();
    const onChangeView = (view: string) => calendarRef.current?.handleMenuViewChange?.(view);
    const onEventsCleared = () => clearAllEvents();
    const onSetBackgroundImage = (imageUrl: string | null) => {
      console.log('Received background image URL:', imageUrl); // 在这里添加日志
      setBackgroundImage(imageUrl);
    };
    
    const onSetBackgroundFit = (fit: 'cover' | 'contain' | 'stretch' | 'tile') => {
      console.log('Received background fit mode:', fit);
      setBackgroundFit(fit);
    };

    const unregisterOnNewEvent = window.electronAPI.onNewEvent(onNewEvent);
    const unregisterOnChangeView = window.electronAPI.onChangeView((_event, view: string) => {
      calendarRef.current?.handleMenuViewChange?.(view);
    });
    const unregisterOnEventsCleared = window.electronAPI.onEventsCleared(onEventsCleared);
    const unregisterOnSetBackgroundImage = window.electronAPI.onSetBackgroundImage((imageUrl) => onSetBackgroundImage(imageUrl));
    const unregisterOnSetBackgroundFit = window.electronAPI.onSetBackgroundFit?.((fit) => onSetBackgroundFit(fit));


    return () => {
      unregisterOnNewEvent?.();
      unregisterOnChangeView?.();
      unregisterOnEventsCleared?.();
      unregisterOnSetBackgroundImage?.();
      unregisterOnSetBackgroundFit?.();
    };
  }, [clearAllEvents, setBackgroundImage, setBackgroundFit]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#667eea',
          borderRadius: 16,
          colorBgContainer: `rgba(255, 255, 255, ${backgroundImage ? 0.8 : 0.95})`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <AntdApp>
        <GlobalStyle $hasCustomBg={!!backgroundImage} />
        <AppContainer $bgImage={backgroundImage} $bgFit={backgroundFit}>
          <Header $hasCustomBg={!!backgroundImage}>
            <h1>Goose Calendar <span style={{ fontWeight: 400, fontSize: '32px' }}>鹅日历</span></h1>
          </Header>
          <CalendarWrapper $hasCustomBg={!!backgroundImage}>
            <CalendarComponent ref={calendarRef} />
          </CalendarWrapper>
          <Goose />
        </AppContainer>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
