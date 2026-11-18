# DevToolbox

A small developer utility API and web UI, built with Node.js and Express. Eight everyday tools in one place, with no sign-up and no external services: Base64 encoding, cryptographic hashes, UUID generation, timestamp conversion, JWT decoding, JSON formatting, text case conversion and password generation.

The web UI is a single static page. Every tool on it calls the same JSON API you can use directly.

## Quick start

```bash
npm install
npm start
# open http://localhost:3000
```

Run the tests:

```bash
npm test
```

## API

All endpoints live under `/api`. POST endpoints take a JSON body and return `{ "result": ... }`, or a `400` with `{ "error": "..." }` on bad input.

| Endpoint | Method | Body / query | Returns |
| --- | --- | --- | --- |
| `/api/health` | GET | - | Service status and tool list |
| `/api/base64` | POST | `{ "text": "...", "mode": "encode" \| "decode" }` | Encoded or decoded string |
| `/api/hash` | POST | `{ "text": "...", "algorithm": "sha256" }` | Hex digest (`md5`, `sha1`, `sha256`, `sha512`) |
| `/api/uuid` | GET | `?count=5` (1-50) | Array of random v4 UUIDs |
| `/api/timestamp` | POST | `{ "value": 1731931200 }` | Unix seconds, ms and ISO 8601. Empty body returns "now" |
| `/api/jwt/decode` | POST | `{ "token": "..." }` | Decoded header and payload (signature never verified) |
| `/api/json/format` | POST | `{ "text": "..." }` | Pretty-printed JSON |
| `/api/case` | POST | `{ "text": "...", "target": "camel" }` | Converted text (`camel`, `pascal`, `snake`, `kebab`, `constant`, `title`, `lower`, `upper`) |
| `/api/password` | POST | `{ "length": 16, "numbers": true, "symbols": true }` | Random password from `crypto.randomInt` |

### Example

```bash
curl -X POST http://localhost:3000/api/hash \
  -H 'Content-Type: application/json' \
  -d '{"text": "hello", "algorithm": "sha256"}'
```

```json
{ "result": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" }
```

## Project layout

```
server.js          Express app: routes, validation, static hosting
lib/tools.js       Pure functions behind every endpoint
public/            Single-page UI (vanilla HTML/CSS/JS)
test/              Unit tests for the tools plus API integration tests (node:test)
```

## Deployment

Configured for Render (`render.yaml`): Node runtime, `npm install && npm test` as the build command so a failing test stops the deploy, and `npm start` to serve. No database or environment variables required.

A project by Sandeep Sagar
