export const CONFIG = { version: '0.1.2', developer: 'Kian Schmalzl', prefix: 'subsonic.' };
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
export function ask(msg) {
  return new Promise(res => {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="panel" role="dialog" aria-modal="true"><h2>CONFIRM</h2><p>${esc(msg)}</p><div class="ctl"><button data-r="0">CANCEL</button><button data-r="1" class="danger">CONFIRM</button></div></div>`;
    m.onclick = e => { const r = e.target.dataset.r; if (r === undefined) return; m.remove(); res(r === '1'); };
    document.body.append(m); m.querySelector('[data-r="0"]').focus();
  });
}
