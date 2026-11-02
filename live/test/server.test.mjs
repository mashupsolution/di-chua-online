import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { WebSocket } from 'ws';
import { startLiveServer } from '../server.mjs';

test('server lifecycle, fallback port, routes and socket security', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'live-test-'));
  const first = await startLiveServer({ port: 0, ttsDir: dir });
  const second = await startLiveServer({ port: Number(new URL(first.origin).port), fallbackPort: true, ttsDir: dir });
  t.after(async () => { await Promise.all([first.close(), second.close()]); await rm(dir, { recursive: true, force: true }); });
  assert.notEqual(first.origin, second.origin);
  await writeFile(path.join(dir, 'tts_1_1.mp3'), 'audio');
  let hasSymlink = true;
  try { await symlink(path.join(dir, 'tts_1_1.mp3'), path.join(dir, 'tts_2_2.mp3')); }
  catch (error) { if (process.platform !== 'win32' || !['EPERM', 'EACCES'].includes(error.code)) throw error; hasSymlink = false; }
  for (const [route, status] of [['/live/control.html', 200], ['/live/server.mjs', 404], ['/live/tts/tts_1_1.mp3', 200], ['/live/tts/no.mp3', 404], ['/live/node_modules/ws/package.json', 404]]) {
    assert.equal((await fetch(first.origin + route)).status, status, route);
  }
  if (hasSymlink) assert.equal((await fetch(first.origin + '/live/tts/tts_2_2.mp3')).status, 404);
  await assert.rejects(startLiveServer({ port: Number(new URL(first.origin).port), ttsDir: dir }), { code: 'EADDRINUSE' });
  const wrongHost = await new Promise(resolve => http.get(first.origin, { headers: { Host: 'evil.test:3000' } }, response => { response.resume(); resolve(response.statusCode); }));
  assert.equal(wrongHost, 421);
  const activeSocket = await new Promise((resolve, reject) => {
    const ws = new WebSocket(first.origin.replace('http', 'ws') + '/ws?role=control', { headers: { Origin: first.origin } });
    ws.once('message', data => { try { assert.equal(JSON.parse(data).t, 'state'); ws.send(JSON.stringify({t:'ctl', cmd:'bots', on:true, n:2})); resolve(ws); } catch (error) { reject(error); } });
    ws.on('error', reject);
  });
  for (const origin of ['http://evil.test', second.origin, first.origin.replace('http:', 'https:')]) await new Promise((resolve, reject) => {
    const ws = new WebSocket(first.origin.replace('http', 'ws') + '/ws', { headers: { Origin: origin } });
    ws.on('unexpected-response', (_request, response) => { response.resume(); try { assert.equal(response.statusCode, 401); resolve(); } catch (error) { reject(error); } });
    ws.on('open', () => reject(new Error('Unexpected WebSocket connection')));
    ws.on('error', () => {});
  });
  const socketClosed = new Promise(resolve => activeSocket.once('close', resolve));
  await first.close();
  await socketClosed;
});
