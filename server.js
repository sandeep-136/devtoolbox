'use strict';

const path = require('path');
const express = require('express');
const tools = require('./lib/tools');

const app = express();
const startedAt = Date.now();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Wraps a pure tool function: body in, JSON result out, 400 on validation errors.
function handle(fn) {
  return (req, res) => {
    try {
      res.json({ result: fn(req.body || {}) });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
    tools: ['base64', 'hash', 'uuid', 'timestamp', 'jwt', 'json', 'case', 'password']
  });
});

app.post('/api/base64', handle((b) => {
  const mode = String(b.mode || 'encode').toLowerCase();
  if (mode === 'encode') return tools.base64Encode(b.text);
  if (mode === 'decode') return tools.base64Decode(b.text);
  throw new Error('mode must be "encode" or "decode"');
}));

app.post('/api/hash', handle((b) => tools.hashText(b.text, b.algorithm)));

app.get('/api/uuid', (req, res) => {
  try {
    res.json({ result: tools.uuids(req.query.count ?? 1) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/timestamp', handle((b) => tools.convertTimestamp(b.value)));

app.post('/api/jwt/decode', handle((b) => tools.jwtDecode(b.token)));

app.post('/api/json/format', handle((b) => tools.formatJson(b.text)));

app.post('/api/case', handle((b) => tools.convertCase(b.text, b.target)));

app.post('/api/password', handle((b) => tools.generatePassword({
  length: b.length,
  numbers: b.numbers,
  symbols: b.symbols
})));

// 404 for unknown API routes.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Unknown API route' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`DevToolbox listening on http://localhost:${port}`);
  });
}

module.exports = app;
