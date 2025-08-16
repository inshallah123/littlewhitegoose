const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  db: {
    getAllEvents: () => ipcRenderer.invoke('db:getAllEvents'),
    getAllEventsWithReminders: () => ipcRenderer.invoke('db:getAllEventsWithReminders'),
    saveEvent: (eventData) => ipcRenderer.invoke('db:saveEvent', eventData),
    createEvent: (eventData) => ipcRenderer.invoke('db:createEvent', eventData),
    updateEvent: (id, updates) => ipcRenderer.invoke('db:updateEvent', id, updates),
    deleteEvent: (id) => ipcRenderer.invoke('db:deleteEvent', id),
    getStats: () => ipcRenderer.invoke('db:getStats'),
  },
  
  // Menu events - Linus式修复：提供正确的清理函数
  onNewEvent: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('new-event', subscription);
    return () => ipcRenderer.removeListener('new-event', subscription);
  },
  onChangeView: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('change-view', subscription);
    return () => ipcRenderer.removeListener('change-view', subscription);
  },
});