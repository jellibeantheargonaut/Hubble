const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('hubbleAPI', {
    openApp: async (appName) => {
        ipcRenderer.send('open-app', appName);
    },
    closeApp: async () => {
        ipcRenderer.send('close-app');
    },
    getApps: async () => {
        return ipcRenderer.invoke('get-apps');
    }
});
