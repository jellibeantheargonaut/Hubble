const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const icns = require('icns');
const { execSync, exec, spawn } = require('child_process');
const sanitize = require('sanitize-filename');

const { searchSystem, createDB, createTable, createIndex  } = require('./indexer');
let mainWindow;
let tray = null;

//=============================================================
// function to create a system files cache
// this function will be called only once
// to create the cache
//=============================================================


// creating an index for the cache
//=============================================================
// function to open settings window from tray icon menu
//const openSettings = () => {
//    const settingsWindow = new BrowserWindow({
//        width: 800,
//        height: 600,
//        webPreferences: {
//            nodeIntegration: true,
//            contextIsolation: true,
//            preload: path.join(__dirname, 'preload.js')
//        }
//    });
//    //settingsWindow.loadFile('settings.html');
//};
const openSettings = () => { console.log('Settings opened'); };

const createWindow = () => {
    mainWindow = new BrowserWindow({
        // the size is set to almost full screen
        // so that html event listeners can be added
        width: 1400,
        height: 950,
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

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.whenReady().then(() => {
    createWindow();
});

// IPC handles for the functions
ipcMain.handle('close-app', (event) => {
    app.quit();
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
});

// ipc handle for searching the system
ipcMain.handle('search', (event, query) => {
    return searchSystem(query);
});