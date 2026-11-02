const path = require('node:path');
const { pathToFileURL } = require('node:url');

let server;
process.parentPort.on('message', async event => {
  const message = event.data;
  if (message.type === 'start') {
    try {
      const { startLiveServer } = await import(pathToFileURL(path.join(message.root, 'live', 'server.mjs')).href);
      server = await startLiveServer({ host: '127.0.0.1', port: 3000, fallbackPort: true, staticRoot: message.root, ttsDir: message.ttsDir });
      process.parentPort.postMessage({ type: 'ready', origin: server.origin });
    } catch (error) {
      process.parentPort.postMessage({ type: 'error', message: error.stack || String(error) });
    }
  } else if (message.type === 'stop') {
    try { if (server) await server.close(); } finally { process.exit(0); }
  }
});
