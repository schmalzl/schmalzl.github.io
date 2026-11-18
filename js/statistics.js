import * as S from './storage.js';
import { esc, fmt } from './config.js';
const fresh = () => ({ total: 0, plays: 0, tracks: {}, artists: {}, days: {}, recent: [], sessions: [] });
let d = { ...fresh(), ...S.get('stats', {}) }, sess;
const day = (o = 0) => new Date(Date.now() - o * 864e5).toLocaleDateString('sv');
function newSession() { sess = { t: Date.now(), s: 0 }; d.sessions.push(sess); d.sessions = d.sessions.slice(-30); }
newSession();
const save = () => S.set('stats', d);
export function startTrack(t) {
  d.plays++; d.tracks[t.id] = (d.tracks[t.id] || 0) + 1; d.artists[t.artist] = (d.artists[t.artist] || 0) + 1;
  d.recent.unshift({ id: t.id, at: Date.now() }); d.recent = d.recent.slice(0, 15); save();
}
export function add(sec) { d.total += sec; d.days[day()] = (d.days[day()] || 0) + sec; sess.s += sec; save(); }
export function reset() { d = fresh(); newSession(); save(); }
const top = o => Object.entries(o).sort((a, b) => b[1] - a[1])[0];
export function render(el) {
  const wk = [0, 1, 2, 3, 4, 5, 6].reduce((n, i) => n + (d.days[day(i)] || 0), 0), t = top(d.tracks), a = top(d.artists);
  const row = (l, x) => `<tr><td>${esc(l)}</td><td>${esc(x)}</td></tr>`;
  el.innerHTML = `<div class="panel"><h2>LISTENING</h2><table>${row('Total listening time', fmt(d.total))}${row('Today', fmt(d.days[day()] || 0))}${row('Last 7 days', fmt(wk))}${row('Tracks played', d.plays)}${row('Unique tracks', Object.keys(d.tracks).length)}${row('Most played track', t ? `${t[0]} (${t[1]}x)` : '-')}${row('Most played artist', a ? `${a[0]} (${a[1]}x)` : '-')}</table></div>
  <div class="panel"><h2>RECENT</h2><table>${d.recent.map(r => row(r.id, new Date(r.at).toLocaleString())).join('') || row('Nothing played yet', '')}</table></div>
  <div class="panel"><h2>SESSIONS</h2><table>${[...d.sessions].reverse().map(s => row(new Date(s.t).toLocaleString(), fmt(s.s))).join('')}</table></div>
  <p class="dim">Stored locally in this browser. Not synchronized across devices. Only active playback time is counted.</p>`;
}
