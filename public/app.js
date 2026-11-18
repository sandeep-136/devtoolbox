'use strict';

async function callApi(path, body, method = 'POST') {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (method === 'POST') options.body = JSON.stringify(body);
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
  return data.result;
}

function show(outputId, value, isError = false) {
  const out = document.getElementById(outputId);
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  out.hidden = false;
  out.classList.toggle('error', isError);
  out.innerHTML = '';
  out.appendChild(document.createTextNode(text));
  const copy = document.createElement('button');
  copy.className = 'copy-btn';
  copy.textContent = 'Copy';
  copy.addEventListener('click', () => {
    navigator.clipboard.writeText(text);
    copy.textContent = 'Copied';
    setTimeout(() => { copy.textContent = 'Copy'; }, 1200);
  });
  out.appendChild(copy);
}

const runners = {
  base64: () => callApi('/api/base64', {
    text: document.getElementById('base64-input').value,
    mode: document.getElementById('base64-mode').value
  }),
  hash: () => callApi('/api/hash', {
    text: document.getElementById('hash-input').value,
    algorithm: document.getElementById('hash-algorithm').value
  }),
  uuid: () => {
    const count = document.getElementById('uuid-count').value || 1;
    return callApi(`/api/uuid?count=${encodeURIComponent(count)}`, null, 'GET')
      .then((ids) => ids.join('\n'));
  },
  timestamp: () => callApi('/api/timestamp', {
    value: document.getElementById('timestamp-input').value.trim()
  }),
  jwt: () => callApi('/api/jwt/decode', {
    token: document.getElementById('jwt-input').value
  }),
  json: () => callApi('/api/json/format', {
    text: document.getElementById('json-input').value
  }),
  case: () => callApi('/api/case', {
    text: document.getElementById('case-input').value,
    target: document.getElementById('case-target').value
  }),
  password: () => callApi('/api/password', {
    length: Number(document.getElementById('password-length').value),
    numbers: document.getElementById('password-numbers').checked,
    symbols: document.getElementById('password-symbols').checked
  })
};

document.querySelectorAll('button[data-tool]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const tool = btn.dataset.tool;
    btn.disabled = true;
    try {
      const result = await runners[tool]();
      show(`${tool}-output`, result);
    } catch (err) {
      show(`${tool}-output`, err.message, true);
    } finally {
      btn.disabled = false;
    }
  });
});
