const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('hubbleAPI', {
    openApp: async (appName) => {
        return ipcRenderer.invoke('open-app', appName);
    },
    closeApp:  () => {
        return ipcRenderer.invoke('close-app');
    },
    getApps:  () => {
        return ipcRenderer.invoke('get-apps');
    },

    search:  (query) => {
        return ipcRenderer.invoke('search', query);
    },
});
