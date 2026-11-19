import * as St from './settings.js';
import * as S from './storage.js';
import * as Stats from './statistics.js';
import { startVis } from './visualizer.js';
import { renderLibrary } from './library.js';
import { fmt } from './config.js';
const $ = id => document.getElementById(id);
export function initPlayer(flat) {
  const a = new Audio(); a.preload = 'none'; 
  const lib = renderLibrary($('lib'), flat, n => go(n, true));
  let errT = 0, i = -1, ctx = null, lastT = 0, seeking = false, pos = 0, saved = 0;
  const err = m => { $('err').textContent = m; clearTimeout(errT); errT = setTimeout(() => { $('err').textContent = ''; }, 4000); };
  const label = () => { const m = St.get('repeat'); $('mode').textContent = 'RPT ' + m.toUpperCase(); $('mode').setAttribute('aria-label', 'Repeat mode: ' + m); };
  function initAudio() {
    if (!ctx) {
      try {
        if (navigator.audioSession) navigator.audioSession.type = 'playback';
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctx.onstatechange = () => { if (ctx.state !== 'running' && !a.paused) ctx.resume().catch(() => {}); };
        const an = ctx.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0.8;
        ctx.createMediaElementSource(a).connect(an); an.connect(ctx.destination);
        startVis($('vis'), an, () => ({ type: St.get('vis'), on: St.get('visOn'), sens: St.get('sens'), color: St.get('color'), fps: St.get('fps') }));
      } catch (e) { err('Visualizer unavailable: ' + e.message); }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }
  function show(n) {
    i = n; const t = flat[n]; a.src = t.file; lib.mark(n);
    $('title').textContent = t.title; $('artist').textContent = t.artist; $('err').textContent = '';
    if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist });
  }
  function go(n, play) {
    if (!flat.length) return; show(n);
    if (play) { initAudio(); Stats.startTrack(flat[n]); a.play().catch(e => { err('Playback failed: ' + e.message); }); }
  }
  const step = d => go((i + d + flat.length) % flat.length, true);
  const toggle = () => { if (i < 0) return go(0, true); if (a.paused) { initAudio(); a.play().catch(() => {}); } else a.pause(); };
  $('pp').onclick = toggle; $('next').onclick = () => step(1);
  $('prev').onclick = () => (a.currentTime > 3 ? (a.currentTime = 0) : step(-1));
  $('mode').onclick = () => { const m = ['one', 'all', 'none']; St.set('repeat', m[(m.indexOf(St.get('repeat')) + 1) % 3]); };
  St.onChange(k => { if (k === 'repeat' || k === '*') label(); });
  label();
  $('seek').onpointerdown = () => { seeking = true; };
  $('seek').onpointerup = () => { seeking = false; };
  $('seek').oninput = e => { if (a.duration) a.currentTime = e.target.value / 1000 * a.duration; };
  $('q').oninput = e => lib.filter(e.target.value);
  a.onplaying = () => { lastT = performance.now(); $('pp').textContent = 'PAUSE'; };
  a.onpause = () => { lastT = 0; $('pp').textContent = 'PLAY'; };
  a.onwaiting = () => { lastT = 0; };
  a.ondurationchange = () => { $('tdur').textContent = fmt(a.duration); };
  a.onloadedmetadata = () => { if (pos) { a.currentTime = Math.min(pos, Math.max(0, a.duration - 1)); pos = 0; } };
  a.onerror = () => { lastT = 0; if (i >= 0) err('File unavailable: ' + flat[i].file); };
  a.ontimeupdate = () => {
    const n = performance.now();
    if (lastT && !a.paused && !a.ended) Stats.add(Math.min((n - lastT) / 1000, 1.5));
    lastT = a.paused ? 0 : n;
    $('tcur').textContent = fmt(a.currentTime);
    if (!seeking && a.duration) $('seek').value = a.currentTime / a.duration * 1000;
    if (St.get('remember') && i >= 0 && n - saved > 3000) { saved = n; S.set('last', { id: flat[i].id, pos: a.currentTime }); }
  };
  a.onended = () => {
    lastT = 0; const m = St.get('repeat');
    if (m === 'one') { a.currentTime = 0; Stats.startTrack(flat[i]); a.play(); }
    else if (m === 'all') step(1);
    else if (St.get('autonext') && i < flat.length - 1) step(1);
    else { $('pp').textContent = 'PLAY'; }
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && !a.paused && ctx.state !== 'running') ctx.resume(); });
  if ('mediaSession' in navigator) {
    const h = { play: toggle, pause: toggle, previoustrack: () => step(-1), nexttrack: () => step(1) };
    for (const k in h) { try { navigator.mediaSession.setActionHandler(k, h[k]); } catch { /* unsupported */ } }
  }
  const last = St.get('remember') && S.get('last', null), li = last ? flat.findIndex(t => t.id === last.id) : -1;
  if (li >= 0) { show(li); pos = last.pos || 0; }
}
