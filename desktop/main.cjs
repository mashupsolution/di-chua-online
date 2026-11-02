const { app, BrowserWindow, dialog, screen, utilityProcess } = require('electron');
const path = require('node:path');

app.setName('Chánh Điện Tịnh Tâm');
let backend, mainWindow, overlayWindow, origin, startupTimer, quitting = false;
const root = app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..');
const icon = path.join(__dirname, 'icons', 'icon.png');
const windowOptions = { webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } };
function isPage(url, pathname) {
  try { const parsed = new URL(url); return parsed.origin === origin && parsed.pathname === pathname && !parsed.search && !parsed.hash; }
  catch { return false; }
}
function protect(window, pathname) {
  const restrictNavigation = (event, url) => { if (!isPage(url, pathname)) event.preventDefault(); };
  window.webContents.on('will-navigate', restrictNavigation);
  window.webContents.on('will-redirect', restrictNavigation);
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (pathname === '/live/control.html' && isPage(url, '/live/overlay.html')) openOverlay();
    return { action: 'deny' };
  });
}
function openOverlay() {
  if (overlayWindow && !overlayWindow.isDestroyed()) { overlayWindow.focus(); return; }
  const available = screen.getDisplayMatching(mainWindow.getBounds()).workAreaSize;
  const unit = Math.max(1, Math.floor(Math.min(60, (available.width - 48) / 9, (available.height - 64) / 16)));
  overlayWindow = new BrowserWindow({ ...windowOptions, width: unit * 9, height: unit * 16, useContentSize: true, title: 'Chánh Điện Tịnh Tâm — Overlay', icon,
    webPreferences: { ...windowOptions.webPreferences, backgroundThrottling: false } });
  overlayWindow.setMenu(null);
  overlayWindow.setAspectRatio(9 / 16);
  protect(overlayWindow, '/live/overlay.html');
  overlayWindow.on('closed', () => { overlayWindow = null; });
  overlayWindow.loadURL(`${origin}/live/overlay.html`).catch(error => fail(`Không thể mở overlay: ${error.message}`));
}
function openMain() {
  mainWindow = new BrowserWindow({ ...windowOptions, width: 1280, height: 850, minWidth: 800, minHeight: 600, title: 'Chánh Điện Tịnh Tâm', icon });
  protect(mainWindow, '/live/control.html');
  mainWindow.on('closed', () => { mainWindow = null; app.quit(); });
  mainWindow.loadURL(`${origin}/live/control.html`).catch(error => fail(`Không thể mở bảng điều khiển: ${error.message}`));
}
function fail(message) {
  if (quitting) return;
  console.error('Desktop startup failed:', message);
  clearTimeout(startupTimer);
  dialog.showErrorBox('Không thể khởi động Chánh Điện Tịnh Tâm', `Máy chủ nội bộ gặp lỗi.\n\n${message}`);
  app.quit();
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
  app.whenReady().then(() => {
    backend = utilityProcess.fork(path.join(__dirname, 'backend-worker.cjs'), [], { serviceName: 'Chánh Điện Tịnh Tâm backend' });
    startupTimer = setTimeout(() => fail('Máy chủ khởi động quá lâu.'), 30000);
    backend.on('message', message => {
      if (message.type === 'ready') { clearTimeout(startupTimer); origin = message.origin; openMain(); }
      else if (message.type === 'error') fail(message.message);
    });
    backend.on('error', error => fail(error.message));
    backend.on('exit', code => { backend = null; if (!quitting) fail(`Máy chủ đã dừng (mã ${code}).`); });
    backend.postMessage({ type: 'start', root, ttsDir: path.join(app.getPath('userData'), 'Cache', 'tts') });
  }).catch(error => fail(error.message));
  app.on('before-quit', event => {
    if (backend && !quitting) {
      event.preventDefault(); quitting = true; clearTimeout(startupTimer);
      const child = backend;
      child.once('exit', () => app.quit());
      child.postMessage({ type: 'stop' });
      setTimeout(() => { if (backend) child.kill(); }, 3000).unref();
    }
  });
  app.on('window-all-closed', () => app.quit());
}
