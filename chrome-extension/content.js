// Content script: draws a region-selection overlay. Injected on demand.
// Sends the selected rect back to background via chrome.runtime.sendMessage.

(function () {
  // Prevent double-injection
  if (window.__patentCapturActive) return;
  window.__patentCapturActive = true;

  const overlay = document.createElement('div');
  overlay.id = '__patent-capture-overlay';
  overlay.innerHTML = `
    <div class="__pce-hint">Click and drag to select a region — press Escape to cancel</div>
    <div class="__pce-selection" id="__pce-sel"></div>
  `;
  document.body.appendChild(overlay);

  // Inject CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('content.css');
  document.head.appendChild(link);

  let startX = 0, startY = 0, dragging = false;
  const sel = overlay.querySelector('#__pce-sel');

  function cleanup() {
    overlay.remove();
    link.remove();
    window.__patentCapturActive = false;
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      cleanup();
      chrome.runtime.sendMessage({ action: 'region_cancelled' });
    }
  }

  overlay.addEventListener('mousedown', (e) => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    sel.style.left = startX + 'px';
    sel.style.top = startY + 'px';
    sel.style.width = '0';
    sel.style.height = '0';
    sel.style.display = 'block';
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    sel.style.left = x + 'px';
    sel.style.top = y + 'px';
    sel.style.width = w + 'px';
    sel.style.height = h + 'px';
  });

  overlay.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);

    cleanup();

    if (w < 10 || h < 10) {
      chrome.runtime.sendMessage({ action: 'region_cancelled' });
      return;
    }

    // Account for device pixel ratio for accurate screenshot crop
    const dpr = window.devicePixelRatio || 1;
    chrome.runtime.sendMessage({
      action: 'capture_tab',
      cropRect: {
        x: Math.round(x * dpr),
        y: Math.round(y * dpr),
        width: Math.round(w * dpr),
        height: Math.round(h * dpr),
      },
    });
  });

  document.addEventListener('keydown', onKey);
})();
