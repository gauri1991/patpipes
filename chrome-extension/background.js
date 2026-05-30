// Service worker: handles token storage, refresh, and tab screenshot capture.

const STORAGE_KEY = 'pat_auth';

export async function getStoredAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (res) => resolve(res[STORAGE_KEY] || null));
  });
}

export async function setStoredAuth(auth) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: auth }, resolve);
  });
}

export async function clearStoredAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(STORAGE_KEY, resolve);
  });
}

async function refreshToken(backendUrl, refresh) {
  const res = await fetch(`${backendUrl}/api/v1/accounts/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}

// Returns a valid access token, refreshing if needed. Throws if not authenticated.
export async function getValidToken() {
  const auth = await getStoredAuth();
  if (!auth) throw new Error('NOT_AUTHENTICATED');

  const now = Date.now();
  if (auth.accessExpiry && now < auth.accessExpiry - 30_000) {
    return { token: auth.access, backendUrl: auth.backendUrl };
  }

  // Refresh — response is { access: "..." } (simplejwt shape)
  try {
    const data = await refreshToken(auth.backendUrl, auth.refresh);
    const newAccess = data.access || data.tokens?.accessToken;
    if (!newAccess) throw new Error('No access token in refresh response');
    const updated = {
      ...auth,
      access: newAccess,
      accessExpiry: now + 55 * 60 * 1000, // 55 min
    };
    await setStoredAuth(updated);
    return { token: updated.access, backendUrl: updated.backendUrl };
  } catch {
    await clearStoredAuth();
    throw new Error('NOT_AUTHENTICATED');
  }
}

// Capture the visible tab and optionally crop to a rect {x,y,width,height} in CSS pixels.
async function captureTab(tabId, cropRect) {
  const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

  if (!cropRect) return dataUrl;

  // Crop using OffscreenCanvas (available in service workers in Chrome 109+)
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  const bitmap = await createImageBitmap(blob);

  const { x, y, width, height } = cropRect;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
  const outBlob = await canvas.convertToBlob({ type: 'image/png' });

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(outBlob);
  });
}

// Message listener
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'capture_tab') {
    const tabId = sender.tab?.id ?? null;
    captureTab(tabId, msg.cropRect ?? null)
      .then((dataUrl) => {
        // If message came from a content script (region select), write result
        // to storage so the popup can pick it up when it reopens.
        if (sender.tab) {
          chrome.storage.local.set({ pending_capture: { dataUrl } });
          sendResponse({ ok: true });
        } else {
          sendResponse({ ok: true, dataUrl });
        }
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (msg.action === 'region_cancelled') {
    // Content script was cancelled — nothing to do
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === 'get_valid_token') {
    getValidToken()
      .then(({ token, backendUrl }) => sendResponse({ ok: true, token, backendUrl }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (msg.action === 'clear_auth') {
    clearStoredAuth().then(() => sendResponse({ ok: true }));
    return true;
  }
});
