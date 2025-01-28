const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('hubbleAPI', {
    openApp: async (appName) => {
        return ipcRenderer.invoke('open-app', appName);
    },
    openFile: async (filePath) => {
        return ipcRenderer.invoke('open-file', filePath);
    },
    hideHubble:  () => {
        return ipcRenderer.invoke('hide-hubble');
    },
    getApps:  () => {
        return ipcRenderer.invoke('get-apps');
    },

    search:  (query) => {
        return ipcRenderer.invoke('search', query);
    },
});
