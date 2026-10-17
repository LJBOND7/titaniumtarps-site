'use strict';
(() => {
  const CARD_URL = 'https://titaniumtarps.com/momo.html';
  const shareDialog = document.querySelector('#share-dialog');
  async function copy(text, status) {
    try { await navigator.clipboard.writeText(text); status.textContent = 'Copied. Ready to paste.'; }
    catch { status.textContent = 'Copy manually: ' + text; }
  }
  async function share(url, title, status) {
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    await copy(url, status);
  }
  document.querySelector('[data-share="card"]')?.addEventListener('click', () => shareDialog.showModal());
  shareDialog?.querySelector('.close').addEventListener('click', () => shareDialog.close());
  document.querySelector('#native-share')?.addEventListener('click', () => share(CARD_URL, 'Momo · Titanium Tarps', document.querySelector('#share-status')));
  document.querySelector('#copy-card')?.addEventListener('click', () => copy(CARD_URL, document.querySelector('#share-status')));
  document.querySelectorAll('[data-roof-comparison]').forEach(comparison => {
    const slider = comparison.querySelector('input[type="range"]');
    const update = () => {
      comparison.style.setProperty('--split', slider.value + '%');
      slider.setAttribute('aria-valuetext', slider.value + '% before photo shown');
    };
    slider.addEventListener('input', update);
    update();
  });
  const upload = document.querySelector('#open-upload');
  if (upload && new URLSearchParams(location.search).get('crew') !== 'momo') {
    const url = new URL(upload.href); url.searchParams.delete('entry.1604513406'); upload.href = url.href;
  }
})();
