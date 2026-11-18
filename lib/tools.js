'use strict';

const crypto = require('crypto');

const HASH_ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512'];
const CASE_TARGETS = ['camel', 'pascal', 'snake', 'kebab', 'constant', 'title', 'lower', 'upper'];

function requireString(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${name} is required and must be a non-empty string`);
  }
  return value;
}

function base64Encode(text) {
  return Buffer.from(requireString(text, 'text'), 'utf8').toString('base64');
}

function base64Decode(text) {
  const input = requireString(text, 'text').trim();
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(input) || input.length % 4 !== 0) {
    throw new Error('text is not valid Base64');
  }
  return Buffer.from(input, 'base64').toString('utf8');
}

function hashText(text, algorithm = 'sha256') {
  requireString(text, 'text');
  const algo = String(algorithm).toLowerCase();
  if (!HASH_ALGORITHMS.includes(algo)) {
    throw new Error(`algorithm must be one of: ${HASH_ALGORITHMS.join(', ')}`);
  }
  return crypto.createHash(algo).update(text, 'utf8').digest('hex');
}

function uuids(count = 1) {
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1 || n > 50) {
    throw new Error('count must be an integer between 1 and 50');
  }
  return Array.from({ length: n }, () => crypto.randomUUID());
}

function convertTimestamp(value) {
  if (value === undefined || value === null || value === '') {
    const now = new Date();
    return {
      input: 'now',
      unix_seconds: Math.floor(now.getTime() / 1000),
      unix_ms: now.getTime(),
      iso_utc: now.toISOString()
    };
  }
  if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
    let ms = Number(value);
    // Treat large values as milliseconds.
    if (ms >= 1e12) {
      return {
        input: value,
        interpreted_as: 'unix_ms',
        unix_seconds: Math.floor(ms / 1000),
        unix_ms: ms,
        iso_utc: new Date(ms).toISOString()
      };
    }
    return {
      input: value,
      interpreted_as: 'unix_seconds',
      unix_seconds: ms,
      unix_ms: ms * 1000,
      iso_utc: new Date(ms * 1000).toISOString()
    };
  }
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('value must be unix seconds, unix milliseconds, or a date/time string like 2026-11-18T10:00:00Z');
  }
  return {
    input: value,
    interpreted_as: 'date_string',
    unix_seconds: Math.floor(parsed.getTime() / 1000),
    unix_ms: parsed.getTime(),
    iso_utc: parsed.toISOString()
  };
}

function decodeBase64Url(part) {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function jwtDecode(token) {
  const input = requireString(token, 'token').trim();
  const parts = input.split('.');
  if (parts.length !== 3) {
    throw new Error('token must be a JWT with three dot-separated parts');
  }
  let header;
  let payload;
  try {
    header = JSON.parse(decodeBase64Url(parts[0]));
    payload = JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    throw new Error('token header or payload is not valid Base64URL-encoded JSON');
  }
  return { header, payload, note: 'Decoded only. The signature is never verified.' };
}

function formatJson(text) {
  const input = requireString(text, 'text');
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }
  return JSON.stringify(parsed, null, 2);
}

function splitWords(text) {
  requireString(text, 'text');
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function convertCase(text, target) {
  const words = splitWords(text);
  if (words.length === 0) throw new Error('text contains no words');
  const t = String(target || '').toLowerCase();
  switch (t) {
    case 'camel':
      return words[0] + words.slice(1).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
    case 'pascal':
      return words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
    case 'snake':
      return words.join('_');
    case 'kebab':
      return words.join('-');
    case 'constant':
      return words.join('_').toUpperCase();
    case 'title':
      return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
    case 'lower':
      return words.join(' ');
    case 'upper':
      return words.join(' ').toUpperCase();
    default:
      throw new Error(`target must be one of: ${CASE_TARGETS.join(', ')}`);
  }
}

function generatePassword(options = {}) {
  const length = Number(options.length ?? 16);
  if (!Number.isInteger(length) || length < 4 || length > 128) {
    throw new Error('length must be an integer between 4 and 128');
  }
  const useNumbers = options.numbers !== false;
  const useSymbols = options.symbols !== false;
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}';
  const pools = [lower, upper];
  if (useNumbers) pools.push(digits);
  if (useSymbols) pools.push(symbols);
  const all = pools.join('');
  const chars = pools.map((pool) => pool[crypto.randomInt(pool.length)]);
  while (chars.length < length) {
    chars.push(all[crypto.randomInt(all.length)]);
  }
  // Fisher-Yates shuffle with cryptographic randomness.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

module.exports = {
  HASH_ALGORITHMS,
  CASE_TARGETS,
  base64Encode,
  base64Decode,
  hashText,
  uuids,
  convertTimestamp,
  jwtDecode,
  formatJson,
  convertCase,
  generatePassword
};
