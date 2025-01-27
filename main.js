const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const icns = require('icns');
const sanitize = require('sanitize-filename');

let mainWindow;
let tray = null;

//=============================================================
// function to create a system files cache
// this function will be called only once
// to create the cache
//=============================================================
const createCache = () => {
    const cacheDir = path.join(__dirname, 'data', 'cache');
    const cacheFilePath = path.join(cacheDir, 'index.txt');
    // return if cache already exists
    if (fs.existsSync(cacheFilePath)) {
        console.log('[Main] Cache already exists');
        return;
    }
    const collectFilePaths = (dir) => {
        const sanitizedDir = sanitize(dir);
        let command;
        if (process.platform === 'darwin'){
            command = `find ${sanitizedDir} -type f > ${cacheFilePath}`;
            console.log('[Main] Creating cache for macOS ');
        }
        else {
            command = `dir /s /b ${sanitizedDir} > ${cacheFilePath}`;
            console.log('[Main] Creating cache for Windows ');
        }
        require('child_process').execSync(command);
    };
    collectFilePaths('~/');
    console.log('[Main] Cache created');
};

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
    setImmediate(createCache);
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
    const appPath = path.join('/Applications', app + '.app');
    // open the app
    require('child_process').exec(`open -a "${appPath}"`);
});

// IPC handles for index caching
ipcMain.handle('reload-cache', (event) => {
    fs.rmSync(path.join(__dirname, 'data', 'cache', 'index.txt'));
    createCache();
});