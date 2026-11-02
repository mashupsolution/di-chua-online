const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const net = require('node:net');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { _electron: electron } = require('playwright');
const { expect } = require('playwright/test');

const argIndex = process.argv.indexOf('--app');
const executablePath = argIndex < 0 ? process.env.DESKTOP_APP_PATH : process.argv[argIndex + 1];
if (!executablePath) throw new Error('Set DESKTOP_APP_PATH or pass --app with the packaged application executable.');
const invocationDirectory = process.env.INIT_CWD || process.cwd();
const launchPath = path.resolve(invocationDirectory, executablePath);
const output = process.env.SMOKE_OUTPUT_DIR
  ? path.resolve(invocationDirectory, process.env.SMOKE_OUTPUT_DIR)
  : path.join(__dirname, '../dist/smoke');
const env = { ...process.env };
for (const key of ['ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS', 'NODE_PATH', 'BUN_OPTIONS']) delete env[key];
// The packaged process must not depend on the build machine's installed Node runtime.
const pathKey = Object.keys(env).find(key => key.toLowerCase() === 'path') || 'PATH';
const nodeDirectory = path.dirname(process.execPath);
env[pathKey] = (env[pathKey] || '').split(path.delimiter)
  .filter(directory => directory && path.resolve(directory).toLowerCase() !== nodeDirectory.toLowerCase())
  .join(path.delimiter);

function deadline(promise, ms, message) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })])
    .finally(() => clearTimeout(timer));
}

function portIsOpen(port) {
  return new Promise(resolve => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.setTimeout(500);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
  });
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'chanh-dien-smoke-'));
  const appArgs = [`--user-data-dir=${userData}`];
  // Occupy the preferred port to exercise automatic fallback in a real package.
  const blocker = net.createServer(socket => socket.destroy());
  await new Promise((resolve, reject) => {
    blocker.once('error', error => error.code === 'EADDRINUSE' ? resolve() : reject(error));
    blocker.listen(3000, '127.0.0.1', resolve);
  });
  let application;
  let duplicate;
  const pageErrors = [];
  try {
    application = await electron.launch({ executablePath: launchPath, args: appArgs, env, timeout: 60000 });
    const watch = page => page.on('pageerror', error => pageErrors.push(error.message));
    application.on('window', watch);
    const control = await application.firstWindow();
    watch(control);
    await expect(control.locator('#srv')).toHaveText('Server: đang chạy', { timeout: 30000 });
    const origin = new URL(control.url()).origin;
    assert.equal(new URL(origin).hostname, '127.0.0.1');
    assert.notEqual(new URL(origin).port, '3000', 'The desktop app must recover from an occupied preferred port.');
    assert.equal(await control.evaluate(() => typeof window.require), 'undefined');

    await control.locator('[data-fill="15"]').click();
    await expect(control.locator('#cnt')).toHaveText('15 người');
    const opened = application.waitForEvent('window');
    await control.locator('#btnOverlay').click();
    const overlay = await opened;
    await overlay.waitForURL(`${origin}/live/overlay.html`);
    await expect(overlay.locator('#count')).toHaveText('15/24');
    const dimensions = await overlay.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    assert.ok(Math.abs(dimensions.width / dimensions.height - 9 / 16) < 0.002, 'Overlay content must stay 9:16 on smaller displays.');
    await overlay.waitForFunction(() => Object.values(A).every(image => image.complete && image.naturalWidth > 0));
    const preferences = await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().map(window => ({
      pathname: new URL(window.webContents.getURL()).pathname,
      preferences: window.webContents.getLastWebPreferences(),
      backgroundThrottling: window.webContents.getBackgroundThrottling(),
    })));
    for (const { preferences: prefs } of preferences) {
      assert.equal(prefs.nodeIntegration, false);
      assert.equal(prefs.contextIsolation, true);
      assert.equal(prefs.sandbox, true);
    }
    assert.equal(preferences.find(window => window.pathname === '/live/overlay.html').backgroundThrottling, false);

    await control.locator('#btnOverlay').click();
    assert.equal(await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length), 2);
    await control.locator('#btnCopyOverlay').click();
    await expect(control.locator('#btnCopyOverlay')).toHaveText('Đã sao chép liên kết');
    assert.equal(await application.evaluate(({ clipboard }) => clipboard.readText()), `${origin}/live/overlay.html`);
    await overlay.locator('#unmute').click();
    await overlay.waitForFunction(() => AC?.state === 'running');
    await control.locator('#btnBell').click();

    // All required media must be shipped; no network download is needed for demo mode.
    const media = await control.evaluate(async () => Promise.all(['/assets/music/music1.mp3', '/assets/music/music2.mp3']
      .map(async route => ({ route, status: (await fetch(route, { method: 'HEAD' })).status }))));
    for (const result of media) assert.equal(result.status, 200, result.route);
    await control.screenshot({ path: path.join(output, 'control.png') });
    await overlay.screenshot({ path: path.join(output, 'overlay.png') });

    duplicate = spawn(launchPath, appArgs, { env, stdio: 'ignore' });
    await deadline(new Promise((resolve, reject) => {
      duplicate.once('error', reject);
      duplicate.once('exit', code => code === 0 ? resolve() : reject(new Error(`Second instance exited with ${code}`)));
    }), 15000, 'The second app instance did not exit.');
    duplicate = null;
    assert.equal(await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length), 2);

    const closing = application.waitForEvent('close');
    await control.close();
    await deadline(closing, 15000, 'Closing the control panel did not exit the app.');
    application = null;
    await expect.poll(() => portIsOpen(Number(new URL(origin).port)), { timeout: 5000 }).toBe(false);
    assert.deepEqual(pageErrors, [], 'Renderer errors occurred.');
    console.log('Packaged smoke passed: runtime bundled, port fallback, controls, overlay, media, isolation, single instance, shutdown.');
  } finally {
    if (duplicate) duplicate.kill();
    if (application) await application.close().catch(() => {});
    if (blocker.listening) await new Promise(resolve => blocker.close(resolve));
    await fs.rm(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
