// C:\Users\sgins\OneDrive\Documents\GitHub\AI-PC-Stack\void\ai-dashboard\ai-dashboard-gui\main.js

const path = require('path'); // Ensure path is imported, as it provides path.delimiter

// CRITICAL FIX: Ensure Java path is available for child processes
const javaPath = 'C:\\Program Files\\Java\\jdk-24\\bin';

// Use path.delimiter (which is ';' on Windows) and ensure PATH is a string
process.env.PATH = [process.env.PATH, javaPath]
    .filter(Boolean) // Filters out null/undefined entries
    .join(path.delimiter);
    
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ServiceManager = require('./ServiceManager');

let mainWindow;
const serviceManager = new ServiceManager();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        title: 'AI Services Dashboard GUI',
        webPreferences: {
            // IMPORTANT: Context isolation needs to be false or you need a preload script
            // Based on your previous code, nodeIntegration is true, which usually requires 
            // contextIsolation: false for simplicity.
            nodeIntegration: true,
            contextIsolation: false // Assuming this is needed for your renderer to work
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

    // Start the service management backend with robust error catching
    serviceManager.start().then(() => {
        console.log('Service Manager initialized successfully.');
        
        // *** CRITICAL FIX: Explicitly send initial data to the renderer ***
        if (mainWindow) {
            // Send the first official data package to the renderer
            mainWindow.webContents.send('service-data-update', serviceManager.getServiceData());
        }
        
    }).catch(err => {
        console.error('CRITICAL ERROR: Service Manager failed to start:', err);
        
        if (mainWindow) {
             // If the main process fails to initialize, send an error to the renderer
             mainWindow.webContents.send('backend-error', err.message);
        }
    });
    
    // Optional: Open DevTools for debugging
    // mainWindow.webContents.openDevTools(); 
}

// --- IPC HANDLERS (API for the Renderer Process) ---

ipcMain.handle('get-all-services', () => {
    return serviceManager.getServiceData();
});

ipcMain.handle('get-service-log', (event, serviceName) => {
    return serviceManager.getServiceLog(serviceName);
});

ipcMain.handle('restart-service', (event, serviceName) => {
    return serviceManager.restartService(serviceName);
});

ipcMain.handle('restart-all-services', () => {
    return serviceManager.restartAllServices();
});

ipcMain.handle('launch-void', () => {
    return serviceManager.launchVoidAI();
});

// --- APPLICATION LIFECYCLE ---

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        serviceManager.shutdown(); // Ensure all services are stopped
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});