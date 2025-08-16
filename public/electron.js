const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const DatabaseService = require('./database-service');

let mainWindow;
let dbService;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    // icon: path.join(__dirname, 'favicon.ico'), // App icon
    show: false, // Don't show until ready-to-show
  });

  // Load the app
  const port = process.env.PORT || 3002;
  const startUrl = isDev 
    ? `http://localhost:${port}` 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development - 注释掉以减少内存占用
    // if (isDev) {
    //   mainWindow.webContents.openDevTools();
    // }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建日程',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Send message to renderer process to create new event
            mainWindow.webContents.send('new-event');
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '月视图',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('change-view', 'month');
          }
        },
        {
          label: '周视图',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('change-view', 'week');
          }
        },
        {
          label: '日视图',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('change-view', 'day');
          }
        },
        { type: 'separator' },
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于桌面日历',
          click: () => {
            // Show about dialog
            require('electron').dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于桌面日历',
              message: '桌面日历',
              detail: '一个基于 Electron 和 React 构建的美观桌面日历应用程序。'
            });
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'About ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Initialize database and IPC handlers
function initializeDatabase() {
  dbService = new DatabaseService();
  console.log('Database initialized');
}

// IPC handlers for database operations
function setupIPCHandlers() {
  // Get all events
  ipcMain.handle('db:getAllEvents', async () => {
    try {
      return dbService.getAllEvents();
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  });

  // Create event
  ipcMain.handle('db:createEvent', async (event, eventData) => {
    try {
      return dbService.createEvent(eventData);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  });

  // Update event
  ipcMain.handle('db:updateEvent', async (event, id, updates) => {
    try {
      return dbService.updateEvent(id, updates);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  });

  // Delete event
  ipcMain.handle('db:deleteEvent', async (event, id) => {
    try {
      return dbService.deleteEvent(id);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  });

  // Get stats
  ipcMain.handle('db:getStats', async () => {
    try {
      return dbService.getStats();
    } catch (error) {
      console.error('Error getting stats:', error);
      return { events: 0, reminders: 0 };
    }
  });
}

// App event handlers
app.whenReady().then(() => {
  initializeDatabase();
  setupIPCHandlers();
  createWindow();
});

// Graceful shutdown handler
function gracefulShutdown() {
  console.log('Graceful shutdown initiated...');
  
  // Close database
  if (dbService) {
    console.log('Closing database...');
    dbService.close();
  }
  
  // Simple cleanup - let concurrently handle process management
  
  console.log('Shutdown complete');
}

// Handle app quit with graceful shutdown
app.on('before-quit', (event) => {
  gracefulShutdown();
});

app.on('window-all-closed', () => {
  gracefulShutdown();
  
  // On macOS, apps typically stay active until the user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  gracefulShutdown();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  gracefulShutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
  process.exit(1);
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});