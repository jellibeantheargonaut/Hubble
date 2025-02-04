const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('hubbleAPI', {
    // api to expose to the main window
    //=================================================================
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
    searchWeb:  (query) => {
        return ipcRenderer.invoke('search-web', query);
    },
    openWebLink: (url) => {
        return ipcRenderer.invoke('open-web-link', url);
    },
});

ipcRenderer.on('theme-changed', (event, isDarkMode) => {
    if(isDarkMode){
        document.body.setAttribute('system-theme', 'dark');
    }
    else{
        document.body.setAttribute('system-theme', 'light');
    }
});
