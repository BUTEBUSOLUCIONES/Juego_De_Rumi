const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const rutaConfig = path.join(__dirname, 'config.json');
let ventanaPrincipal;

function crearVentana() {
  ventanaPrincipal = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Gestión Partidas de Rumi',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ventanaPrincipal.loadFile('index.html');
}

// Leer configuración
ipcMain.handle('leer-config', () => {
  if (fs.existsSync(rutaConfig)) {
    const datos = fs.readFileSync(rutaConfig, 'utf8');
    return JSON.parse(datos);
  }
  return {};
});

// Guardar configuración
ipcMain.handle('guardar-config', (_, config) => {
  fs.writeFileSync(rutaConfig, JSON.stringify(config, null, 2));
  return true;
});

app.whenReady().then(() => {
  crearVentana();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});