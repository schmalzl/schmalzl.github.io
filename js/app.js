import { CONFIG as C, esc } from './config.js';
import * as S from './storage.js';
import * as St from './settings.js';
import * as Stats from './statistics.js';
import { verify, mask } from './auth.js';
import { loadLibrary } from './library.js';
import { initPlayer } from './player.js';
const $ = id => document.getElementById(id);
const json = async u => { const r = await fetch(u, { cache: 'no-cache' }); if (!r.ok) throw new Error(u + ' HTTP ' + r.status); return r.json(); };
const frame = () => new Promise(r => requestAnimationFrame(r));
document.querySelectorAll('[data-ver]').forEach(e => { e.textContent = C.version; });

function applyLook() {
  document.documentElement.style.setProperty('--fs', St.get('font') + 'px');
  document.body.classList.toggle('compact', St.get('compact'));
  document.body.classList.toggle('fx', St.get('fx'));
}
St.onChange(applyLook); applyLook();

let users = [];
(async () => {
  try { users = (await json('data/users.json')).users; } catch { $('le').textContent = 'Access database unavailable.'; }
  $('ul').innerHTML = users.length ? users.map(u => esc(mask(u.name))).join('<br>') : 'No users registered.';
  try {
    const n = (await json('data/news.json')).news.sort((a, b) => b.date.localeCompare(a.date));
    if (n.length) { $('nw').hidden = false; $('nl').innerHTML = n.map(x => `<p><b>${esc(x.date)}</b> ${esc(x.title)}<br><span class="dim">${esc(x.message)}</span></p>`).join(''); }
  } catch { /* news is optional */ }
})();

$('lf').onsubmit = async e => {
  e.preventDefault();
  const name = $('lu').value.trim(), pin = $('lp').value;
  if (!name || !pin) { $('le').textContent = 'Enter username and PIN.'; return; }
  $('lb').disabled = true; $('le').textContent = 'CHECKING...';
  try {
    const ok = await verify(users, name, pin);
    if (ok) { $('lp').value = ''; boot(); return; }
    $('le').textContent = 'Login failed. Check username and PIN.';
  } catch { $('le').textContent = 'Login unavailable (HTTPS and Web Crypto required).'; }
  $('lb').disabled = false;
};

async function boot() {
  $('login').hidden = true; $('loading').hidden = false;
  const log = t => { $('log').textContent += t + '\n'; };
  const prog = p => { $('pb').style.width = p + '%'; $('pct').textContent = Math.round(p) + '%'; };
  try {
    log('[SUBSONIC] INITIALIZING...'); await frame(); prog(10);
    log('[SUBSONIC] CHECKING LOCAL CONFIGURATION...'); applyLook(); prog(25);
    log('[SUBSONIC] CONNECTING TO MUSIC LIBRARY...');
    const flat = await loadLibrary(); prog(45);
    log('[SUBSONIC] LOADING ARTIST DATABASE... ' + new Set(flat.map(t => t.artist)).size + ' ARTISTS');
    log('[SUBSONIC] SCANNING TRACK MANIFEST...');
    for (let k = 0; k < flat.length; k++) { log('[LOAD] ' + flat[k].artist + ' - ' + decodeURIComponent(flat[k].file.split('/').pop())); prog(45 + 40 * (k + 1) / flat.length); if (k % 10 === 9) await frame(); }
    prog(85);
    try { const r = await fetch('data/changelog.txt', { cache: 'no-cache' }); $('cl').textContent = r.ok ? await r.text() : 'Changelog unavailable.'; } catch { $('cl').textContent = 'Changelog unavailable.'; }
    initPlayer(flat); prog(100); log('[SUBSONIC] READY.'); await frame();
    $('loading').hidden = true; $('app').hidden = false;
  } catch (err) { log('[ERROR] ' + err.message); log('[SUBSONIC] ABORTED. Reload to retry.'); }
}

$('nav').onclick = e => {
  const t = e.target.dataset.t; if (!t) return;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b === e.target));
  document.querySelectorAll('.tab').forEach(s => s.classList.toggle('on', s.id === t));
  if (t === 'settings') St.render($('set'), { reset: St.reset, stats: Stats.reset, all: () => { S.clearAll(); location.reload(); } });
  if (t === 'stats') { Stats.render($('st')); $('st').insertAdjacentHTML('beforeend', '<button id="rs" class="danger">RESET STATISTICS</button>'); $('rs').onclick = () => { if (confirm('Delete all listening statistics?')) { Stats.reset(); Stats.render($('st')); } }; }
};
