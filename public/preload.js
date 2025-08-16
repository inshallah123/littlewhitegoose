const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  db: {
    getAllEvents: () => ipcRenderer.invoke('db:getAllEvents'),
    createEvent: (eventData) => ipcRenderer.invoke('db:createEvent', eventData),
    updateEvent: (id, updates) => ipcRenderer.invoke('db:updateEvent', id, updates),
    deleteEvent: (id) => ipcRenderer.invoke('db:deleteEvent', id),
    getStats: () => ipcRenderer.invoke('db:getStats'),
  },
  
  // Menu events
  onNewEvent: (callback) => ipcRenderer.on('new-event', callback),
  onChangeView: (callback) => ipcRenderer.on('change-view', callback),
});