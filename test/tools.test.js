'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const tools = require('../lib/tools');

test('base64 round trip handles unicode', () => {
  const original = 'Hello, DevToolbox - ₹ and é';
  assert.equal(tools.base64Decode(tools.base64Encode(original)), original);
});

test('base64Decode rejects invalid input', () => {
  assert.throws(() => tools.base64Decode('!!!not-base64!!!'), /Base64/);
});

test('hashText matches a known SHA-256 vector', () => {
  assert.equal(
    tools.hashText('hello', 'sha256'),
    '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
  );
});

test('hashText rejects unknown algorithms', () => {
  assert.throws(() => tools.hashText('x', 'rot13'), /algorithm/);
});

test('uuids returns the requested count of valid v4 UUIDs', () => {
  const ids = tools.uuids(10);
  assert.equal(ids.length, 10);
  assert.equal(new Set(ids).size, 10);
  for (const id of ids) {
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  }
});

test('uuids rejects out-of-range counts', () => {
  assert.throws(() => tools.uuids(0), /count/);
  assert.throws(() => tools.uuids(51), /count/);
});

test('convertTimestamp handles unix seconds', () => {
  const r = tools.convertTimestamp(0);
  assert.equal(r.iso_utc, '1970-01-01T00:00:00.000Z');
  assert.equal(r.interpreted_as, 'unix_seconds');
});

test('convertTimestamp handles date strings', () => {
  const r = tools.convertTimestamp('2026-11-18T00:00:00Z');
  assert.equal(r.unix_ms, Date.UTC(2026, 10, 18));
});

test('convertTimestamp rejects garbage', () => {
  assert.throws(() => tools.convertTimestamp('not a date'), /value/);
});

test('jwtDecode decodes header and payload', () => {
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const token = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: '123' })}.sig`;
  const decoded = tools.jwtDecode(token);
  assert.equal(decoded.header.alg, 'HS256');
  assert.equal(decoded.payload.sub, '123');
});

test('jwtDecode rejects malformed tokens', () => {
  assert.throws(() => tools.jwtDecode('only.two'), /three/);
  assert.throws(() => tools.jwtDecode('a.b.c'), /Base64URL/);
});

test('formatJson pretty prints and validates', () => {
  assert.equal(tools.formatJson('{"a":1}'), '{\n  "a": 1\n}');
  assert.throws(() => tools.formatJson('{bad'), /Invalid JSON/);
});

test('convertCase converts across styles', () => {
  assert.equal(tools.convertCase('hello wide world', 'camel'), 'helloWideWorld');
  assert.equal(tools.convertCase('helloWideWorld', 'snake'), 'hello_wide_world');
  assert.equal(tools.convertCase('hello_world', 'kebab'), 'hello-world');
  assert.equal(tools.convertCase('hello world', 'constant'), 'HELLO_WORLD');
  assert.equal(tools.convertCase('hello world', 'title'), 'Hello World');
});

test('convertCase rejects unknown targets', () => {
  assert.throws(() => tools.convertCase('hi', 'shouty'), /target/);
});

test('generatePassword honors length and character classes', () => {
  const pw = tools.generatePassword({ length: 32, numbers: true, symbols: true });
  assert.equal(pw.length, 32);
  assert.match(pw, /[a-z]/);
  assert.match(pw, /[A-Z]/);
  assert.match(pw, /[0-9]/);
  assert.match(pw, /[!@#$%^&*()_+\-=\[\]{}]/);
});

test('generatePassword can exclude numbers and symbols', () => {
  const pw = tools.generatePassword({ length: 24, numbers: false, symbols: false });
  assert.match(pw, /^[A-Za-z]{24}$/);
});
