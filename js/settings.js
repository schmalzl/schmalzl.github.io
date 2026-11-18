import * as S from './storage.js';
import { esc, ask } from './config.js';
const D = { repeat: 'one', autonext: true, remember: true, vis: 'spectrum', visOn: true, sens: 1.5, color: '#27B33F', fps: 30, font: 14, compact: true };
const SCHEMA = [
  ['PLAYBACK', [['repeat', 'Repeat mode', 'sel', ['one', 'all', 'none']], ['autonext', 'Play next track when finished (no repeat)', 'chk'], ['remember', 'Remember last track and position', 'chk']]],
  ['VISUALIZER', [['visOn', 'Visualizer enabled', 'chk'], ['vis', 'Type', 'sel', ['meter', 'spectrum', 'waveform', 'spectrogram', 'scope']], ['sens', 'Sensitivity', 'rng', 0.5, 3, 0.1], ['color', 'Color', 'sel', ['#27B33F', '#1D56B8', '#FF3030', '#E6E6E6']], ['fps', 'FPS limit', 'sel', [15, 30, 60]]]],
  ['APPEARANCE', [['font', 'Font size', 'sel', [12, 14, 16]], ['compact', 'Compact layout', 'chk']]]
];
let v = { ...D, ...S.get('settings', {}) };
v.color = { '#B7FF00': '#27B33F', '#2D7BFF': '#1D56B8' }[v.color] || v.color;
const subs = [];
export const get = k => v[k];
export const onChange = f => subs.push(f);
export function set(k, x) { v[k] = x; S.set('settings', v); subs.forEach(f => f(k)); }
export function reset() { v = { ...D }; S.set('settings', v); subs.forEach(f => f('*')); }
export function render(el, actions) {
  el.innerHTML = SCHEMA.map(([g, items]) => `<div class="panel"><h2>${g}</h2>${items.map(([k, l, t, a, b, s]) => {
    const c = t === 'chk' ? `<input type="checkbox" data-k="${k}" ${v[k] ? 'checked' : ''}>` : t === 'rng' ? `<input type="range" data-k="${k}" min="${a}" max="${b}" step="${s}" value="${v[k]}">` : `<select data-k="${k}">${a.map(o => `<option ${String(o) === String(v[k]) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    return `<label class="row">${esc(l)}${c}</label>`; }).join('')}</div>`).join('') +
    `<div class="panel"><h2>GENERAL</h2><button data-a="reset">RESET SETTINGS</button><button data-a="stats" class="danger">CLEAR STATISTICS</button><button data-a="all" class="danger">CLEAR ALL LOCAL DATA</button></div>`;
  el.oninput = e => {
    const k = e.target.dataset.k; if (!k) return;
    const sc = SCHEMA.flatMap(x => x[1]).find(i => i[0] === k);
    set(k, sc[2] === 'chk' ? e.target.checked : sc[2] === 'rng' ? Number(e.target.value) : sc[3].find(o => String(o) === e.target.value));
  };
  el.onclick = async e => {
    const a = e.target.dataset.a; if (!a) return;
    const msg = { reset: 'Reset all settings to defaults?', stats: 'Delete all listening statistics?', all: 'Delete ALL local SUBSONIC data (settings, statistics, last track)?' }[a];
    if (await ask(msg)) { actions[a](); render(el, actions); }
  };
}
