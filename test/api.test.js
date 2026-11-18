'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(() => server.close());

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

test('GET /api/health reports ok', async () => {
  const res = await fetch(`${base}/api/health`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.status, 'ok');
  assert.ok(Array.isArray(data.tools));
});

test('POST /api/base64 encodes and decodes', async () => {
  const enc = await post('/api/base64', { text: 'hello world', mode: 'encode' });
  assert.equal(enc.status, 200);
  assert.equal(enc.data.result, 'aGVsbG8gd29ybGQ=');
  const dec = await post('/api/base64', { text: enc.data.result, mode: 'decode' });
  assert.equal(dec.data.result, 'hello world');
});

test('POST /api/base64 returns 400 on invalid mode', async () => {
  const r = await post('/api/base64', { text: 'x', mode: 'sideways' });
  assert.equal(r.status, 400);
  assert.match(r.data.error, /mode/);
});

test('GET /api/uuid honors count', async () => {
  const res = await fetch(`${base}/api/uuid?count=3`);
  const data = await res.json();
  assert.equal(data.result.length, 3);
});

test('POST /api/hash defaults to sha256', async () => {
  const r = await post('/api/hash', { text: 'hello' });
  assert.equal(r.data.result.length, 64);
});

test('POST /api/timestamp with no value returns now', async () => {
  const before = Math.floor(Date.now() / 1000);
  const r = await post('/api/timestamp', {});
  assert.ok(Math.abs(r.data.result.unix_seconds - before) < 5);
});

test('POST /api/json/format rejects invalid JSON', async () => {
  const r = await post('/api/json/format', { text: '{oops' });
  assert.equal(r.status, 400);
  assert.match(r.data.error, /Invalid JSON/);
});

test('POST /api/case converts to kebab', async () => {
  const r = await post('/api/case', { text: 'Hello There World', target: 'kebab' });
  assert.equal(r.data.result, 'hello-there-world');
});

test('POST /api/password generates requested length', async () => {
  const r = await post('/api/password', { length: 20, numbers: true, symbols: false });
  assert.equal(r.data.result.length, 20);
});

test('unknown API route returns 404 JSON', async () => {
  const res = await fetch(`${base}/api/nope`);
  assert.equal(res.status, 404);
});

test('index page is served', async () => {
  const res = await fetch(`${base}/`);
  const html = await res.text();
  assert.match(html, /DevToolbox/);
});
