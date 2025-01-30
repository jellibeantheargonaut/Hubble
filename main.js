const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, globalShortcut } = require('electron');
const { nativeTheme } = require('electron');
const fs = require('fs');
const path = require('path');
const icns = require('icns');
const { execSync, exec, spawn } = require('child_process');
const sanitize = require('sanitize-filename');

const { searchSystem, reindexSystem, getSettings  } = require('./indexer');
let mainWindow;
let settingsWindow;
let tray = null;

//=============================================================

const createWindow = () => {
    mainWindow = new BrowserWindow({
        // the size is set to almost full screen
        // so that html event listeners can be added
        width: 1400,
        height: 950,
        show: false,
        transparent: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // setting icons
    if(process.platform === 'darwin') {
        const iconPath = path.join(__dirname, 'resources/icons/appIcons/icons/png/512x512.png');
        app.dock.setIcon(iconPath);
    }

    // native theme
    nativeTheme.on('updated', () => {
        mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors);
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.whenReady().then(() => {
    createWindow();

    // create tray icon
    const iconPath = path.join(__dirname, 'resources/icons/appIcons/icons/png/24x24.png');
    const trayIcon = nativeImage.createFromPath(iconPath);
    tray = new Tray(trayIcon);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Reindex System', type: 'normal', click: reindexSystem },
        { label: 'Show Hubble', type: 'normal', click: () => mainWindow.show() },
        { label: 'Quit', type: 'normal', click: app.quit }
    ]);
    tray.setToolTip('Hubble');
    tray.setContextMenu(contextMenu);
    
    // register global shortcut
    globalShortcut.register('CommandOrControl+Shift+Space', () => {
        mainWindow.show();
    });

});

// IPC handles for the functions
ipcMain.handle('hide-hubble', (event) => {
    mainWindow.hide();
    mainWindow.reload();
});

ipcMain.handle('get-apps', (event) => {
    const apps = fs.readdirSync('/Applications');
    return apps
        .filter(app => app.endsWith('.app'))
        .map(app => {
            const appName = app.replace('.app', '');
            return { name: appName };
        });
});

ipcMain.handle('open-app', (event, app) => {
    const appPath = path.join('/Applications/', app + '.app');
    // open the app
    execSync("open -a '" + appPath + "'");
    mainWindow.hide();
});

ipcMain.handle('open-file', (event, file) => {
    execSync("open '" + file + "'");
    mainWindow.hide();
});



//ipc handles related to indexing
//=============================================================
// ipc handle for searching the system for files
ipcMain.handle('search', (event, query) => {
    return searchSystem(query);
});

// ipc handle for get settings
ipcMain.handle('get-settings', (event) => {
    return getSettings();
});