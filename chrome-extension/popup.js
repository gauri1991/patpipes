// popup.js — auth, case loading, capture, upload

const DEFAULT_BACKEND = 'http://localhost:8000';

// ─── Helpers ────────────────────────────────────────────────────────────────

function $(id) { return document.getElementById(id); }
function show(id) { const el = $(id); if (el) el.style.display = 'block'; }
function hide(id) { const el = $(id); if (el) el.style.display = 'none'; }
function showMsg(id, text) { const el = $(id); el.textContent = text; el.style.display = 'block'; }
function hideMsg(id) { hide(id); }

function setLoading(btnId, textId, loading, label) {
  const btn = $(btnId);
  btn.disabled = loading;
  $(textId).innerHTML = loading ? '<span class="spinner"></span>' : label;
}

async function getBackendUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get('backendUrl', (res) => resolve((res.backendUrl || DEFAULT_BACKEND).replace(/\/$/, '')));
  });
}
async function setBackendUrl(url) {
  return new Promise((resolve) => chrome.storage.local.set({ backendUrl: url.replace(/\/$/, '') }, resolve));
}
async function getStoredAuth() {
  return new Promise((resolve) => chrome.storage.local.get('pat_auth', (res) => resolve(res.pat_auth || null)));
}
async function setStoredAuth(auth) {
  return new Promise((resolve) => chrome.storage.local.set({ pat_auth: auth }, resolve));
}

// Ask background for a valid (possibly refreshed) access token.
async function getValidToken() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'get_valid_token' }, (res) => {
      if (chrome.runtime.lastError || !res?.ok) reject(new Error(res?.error || 'Not authenticated'));
      else resolve({ token: res.token, backendUrl: res.backendUrl });
    });
  });
}

async function apiFetch(path, options = {}) {
  const { token, backendUrl } = await getValidToken();
  const res = await fetch(`${backendUrl}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (res.status === 401) throw Object.assign(new Error('Session expired — please sign in again.'), { status: 401 });
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch {}
    throw new Error(`API error ${res.status}: ${detail}`);
  }
  return res.status === 204 ? null : res.json();
}

function captureTab(cropRect) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'capture_tab', cropRect }, (res) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else if (!res?.ok) reject(new Error(res?.error || 'Capture failed'));
      else resolve(res.dataUrl);
    });
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, b64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return new Blob([buf], { type: mime });
}

// ─── State ───────────────────────────────────────────────────────────────────

let capturedDataUrl = null;
let pendingOtpUserId = null;
let pendingBackendUrl = null;
let pendingEmail = null;

// ─── View helpers ─────────────────────────────────────────────────────────────

function showView(viewId) {
  ['loginView', 'otpView', 'captureView'].forEach((id) => hide(id));
  show(viewId);
  if (viewId === 'captureView') show('headerActions');
  else hide('headerActions');
}

// ─── Auto-login on popup open ─────────────────────────────────────────────────

async function init() {
  const pending = await checkPendingCapture();
  try {
    await getValidToken();
    await enterCaptureView();
    if (pending) showPreview(pending.dataUrl);
  } catch {
    const url = await getBackendUrl();
    $('loginBackendUrl').value = url;
    $('backendUrlInput').value = url;
    // Dev defaults
    $('loginEmail').value = 'admin@patpipes.com';
    $('loginPassword').value = 'admin123';
    showView('loginView');
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function doLogin() {
  hideMsg('loginError');
  const backendUrl = ($('loginBackendUrl').value || DEFAULT_BACKEND).replace(/\/$/, '');
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;

  if (!email || !password) { showMsg('loginError', 'Email and password are required.'); return; }

  // Auto-add http:// if missing, then keep only the origin (strip any path the user typed)
  const rawUrl = backendUrl.startsWith('http') ? backendUrl : `http://${backendUrl}`;
  let apiBase;
  try {
    const parsed = new URL(rawUrl);
    apiBase = parsed.origin; // e.g. http://localhost:8000 — strips /admin, /api, etc.
  } catch {
    apiBase = rawUrl.replace(/\/$/, '');
  }
  $('loginBackendUrl').value = apiBase;

  setLoading('btnLogin', 'loginBtnText', true, 'Sign In');
  try {
    await setBackendUrl(apiBase);

    const res = await fetch(`${apiBase}/api/v1/accounts/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Backend at ${apiBase} returned an unexpected response (HTTP ${res.status}). ` +
        `Make sure the Django server is running and the URL is correct.`
      );
    }

    if (!res.ok) {
      throw new Error(data.detail || data.message || data.non_field_errors?.[0] || 'Invalid credentials');
    }

    // 2FA required
    if (data.requiresOtp) {
      pendingOtpUserId = data.userId;
      pendingBackendUrl = apiBase;
      pendingEmail = email;
      showView('otpView');
      $('otpCode').focus();
      return;
    }

    // No 2FA — tokens returned directly
    await saveTokens(data, apiBase, email);
    await enterCaptureView();
  } catch (err) {
    showMsg('loginError', err.message || 'Login failed.');
  } finally {
    setLoading('btnLogin', 'loginBtnText', false, 'Sign In');
  }
}

$('btnLogin').addEventListener('click', doLogin);
$('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

// ─── OTP verify ───────────────────────────────────────────────────────────────

async function doVerifyOtp() {
  hideMsg('otpError');
  const code = $('otpCode').value.trim();
  if (!code) { showMsg('otpError', 'Enter the 6-digit code.'); return; }

  setLoading('btnVerifyOtp', 'otpBtnText', true, 'Verify');
  try {
    const res = await fetch(`${pendingBackendUrl}/api/v1/accounts/auth/2fa/verify-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: pendingOtpUserId, code }),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch {
      throw new Error(`Unexpected response from server (HTTP ${res.status})`);
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Invalid code.');
    }

    await saveTokens(data, pendingBackendUrl, pendingEmail);
    await enterCaptureView();
  } catch (err) {
    showMsg('otpError', err.message || 'Verification failed.');
  } finally {
    setLoading('btnVerifyOtp', 'otpBtnText', false, 'Verify');
  }
}

$('btnVerifyOtp').addEventListener('click', doVerifyOtp);
$('otpCode').addEventListener('keydown', (e) => { if (e.key === 'Enter') doVerifyOtp(); });
$('btnBackToLogin').addEventListener('click', () => showView('loginView'));

// ─── Token storage ────────────────────────────────────────────────────────────

async function saveTokens(data, backendUrl, email) {
  // Response shape: { tokens: { accessToken, refreshToken } } OR direct { access, refresh }
  const access = data.tokens?.accessToken ?? data.access;
  const refresh = data.tokens?.refreshToken ?? data.refresh;
  if (!access || !refresh) throw new Error('No tokens in response.');

  await setStoredAuth({
    access,
    refresh,
    accessExpiry: Date.now() + 55 * 60 * 1000,
    backendUrl,
    email,
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────

$('btnLogout').addEventListener('click', async () => {
  await new Promise((res) => chrome.runtime.sendMessage({ action: 'clear_auth' }, res));
  capturedDataUrl = null;
  const url = await getBackendUrl();
  $('loginBackendUrl').value = url;
  showView('loginView');
});

// ─── Settings ─────────────────────────────────────────────────────────────────

$('btnSettings').addEventListener('click', () => $('settingsPanel').classList.toggle('open'));

$('btnSaveSettings').addEventListener('click', async () => {
  const url = $('backendUrlInput').value.trim();
  if (url) {
    await setBackendUrl(url);
    const auth = await getStoredAuth();
    if (auth) { auth.backendUrl = url.replace(/\/$/, ''); await setStoredAuth(auth); }
    $('settingsPanel').classList.remove('open');
  }
});

// ─── Capture view ─────────────────────────────────────────────────────────────

async function enterCaptureView() {
  showView('captureView');
  resetPreview();
  const auth = await getStoredAuth();
  if (auth?.email) $('userBadge').textContent = auth.email;
  const url = await getBackendUrl();
  $('backendUrlInput').value = url;
  await loadCases();
}

async function loadCases() {
  const sel = $('caseSelect');
  sel.innerHTML = '<option value="">Loading…</option>';
  try {
    const data = await apiFetch('/api/v1/infringement/cases/?limit=200&ordering=-created_at');
    const cases = Array.isArray(data) ? data : (data?.results ?? []);
    if (cases.length === 0) { sel.innerHTML = '<option value="">No cases found</option>'; return; }
    sel.innerHTML = '<option value="">— Select a case —</option>';
    cases.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      const patent = c.patent_number ? ` [${c.patent_number}]` : '';
      const accused = c.accused_party_name ? ` vs ${c.accused_party_name}` : '';
      opt.textContent = `${c.case_name || c.name || 'Untitled'}${patent}${accused}`;
      sel.appendChild(opt);
    });
  } catch (err) {
    sel.innerHTML = '<option value="">Failed to load cases</option>';
    if (err.status === 401) { await new Promise((r) => chrome.runtime.sendMessage({ action: 'clear_auth' }, r)); showView('loginView'); }
  }
}

// ─── Preview ──────────────────────────────────────────────────────────────────

function resetPreview() {
  capturedDataUrl = null;
  hide('previewSection');
  hide('savedMsg');
  hide('saveError');
  hide('captureMsg');
  $('captionInput').value = '';
}

function showPreview(dataUrl) {
  capturedDataUrl = dataUrl;
  $('previewImg').src = dataUrl;
  show('previewSection');
  hide('savedMsg');
  hide('saveError');
  $('btnSave').disabled = false;
  $('saveBtnText').textContent = 'Save to Case';
}

$('btnClearPreview').addEventListener('click', resetPreview);

// ─── Capture ──────────────────────────────────────────────────────────────────

$('btnFullCapture').addEventListener('click', async () => {
  $('btnFullCapture').disabled = true;
  try {
    const dataUrl = await captureTab(null);
    showPreview(dataUrl);
  } catch (err) {
    alert('Capture failed: ' + err.message);
  } finally {
    $('btnFullCapture').disabled = false;
  }
});

$('btnRegionCapture').addEventListener('click', async () => {
  $('btnRegionCapture').disabled = true;
  show('captureMsg');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content.css'] });
    window.close();
  } catch (err) {
    $('btnRegionCapture').disabled = false;
    hide('captureMsg');
    alert('Could not inject capture overlay: ' + err.message);
  }
});

// ─── Save ─────────────────────────────────────────────────────────────────────

$('btnSave').addEventListener('click', async () => {
  const caseId = $('caseSelect').value;
  if (!caseId) { alert('Please select an infringement case first.'); return; }
  if (!capturedDataUrl) { alert('No screenshot to save.'); return; }

  hideMsg('saveError');
  setLoading('btnSave', 'saveBtnText', true, 'Save to Case');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageUrl = tab?.url || '';
    const pageTitle = tab?.title || 'Web Page Screenshot';
    const caption = $('captionInput').value.trim();

    const blob = dataUrlToBlob(capturedDataUrl);
    const fd = new FormData();
    fd.append('case', caseId);
    fd.append('title', caption || pageTitle);
    fd.append('description', `Screenshot captured from ${pageUrl}`);
    fd.append('evidence_type', 'webpage');
    fd.append('url', pageUrl);
    fd.append('relevance_score', '7');
    fd.append('file', blob, `screenshot-${Date.now()}.png`);

    const { token, backendUrl } = await getValidToken();
    const res = await fetch(`${backendUrl}/api/v1/infringement/evidence/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (!res.ok) {
      let detail = '';
      try { detail = JSON.stringify(await res.json()); } catch {}
      throw new Error(`Save failed (${res.status}): ${detail}`);
    }

    const evidence = await res.json();
    $('btnSave').disabled = true;
    $('saveBtnText').textContent = '✓ Saved';
    $('openMapperLink').href = `http://localhost:3000/dashboard/infringement/${caseId}/evidence/${evidence.id}/map`;
    show('savedMsg');
  } catch (err) {
    setLoading('btnSave', 'saveBtnText', false, 'Save to Case');
    showMsg('saveError', err.message || 'Save failed.');
  }
});

// ─── Region capture result (written to storage by background) ─────────────────

async function checkPendingCapture() {
  return new Promise((resolve) => chrome.storage.local.get('pending_capture', (res) => resolve(res.pending_capture || null)));
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.pending_capture?.newValue) {
    chrome.storage.local.remove('pending_capture');
    showPreview(changes.pending_capture.newValue.dataUrl);
    $('btnRegionCapture').disabled = false;
    hide('captureMsg');
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

init();
