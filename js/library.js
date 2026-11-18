import { esc, fmt } from './config.js';
export async function loadLibrary() {
  const r = await fetch('data/music.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('music.json: HTTP ' + r.status);
  const out = [];
  [...(await r.json()).artists].sort((a, b) => a.name.localeCompare(b.name)).forEach(ar =>
    [...ar.tracks].sort((a, b) => a.title.localeCompare(b.title)).forEach(t =>
      out.push({ artist: ar.name, title: t.title, file: t.file, format: t.format || '', duration: t.duration || 0, id: ar.name + ' / ' + t.title })));
  return out;
}
export function renderLibrary(el, flat, onPick) {
  let h = '', cur = null;
  flat.forEach((t, i) => {
    if (t.artist !== cur) { if (cur !== null) h += '</details>'; cur = t.artist; h += `<details open><summary>${esc(cur)}</summary>`; }
    h += `<button class="trk" data-i="${i}" data-s="${esc((t.artist + ' ' + t.title).toLowerCase())}"><span>${esc(t.title)}</span><em>${esc(t.format.toUpperCase())}${t.duration ? ' ' + fmt(t.duration) : ''}</em></button>`;
  });
  el.innerHTML = flat.length ? h + '</details>' : '<p class="dim">No tracks in data/music.json yet. Run admin/generate_manifest.py.</p>';
  el.onclick = e => { const b = e.target.closest('.trk'); if (b) onPick(+b.dataset.i); };
  return {
    mark: i => el.querySelectorAll('.trk').forEach(b => b.classList.toggle('on', +b.dataset.i === i)),
    filter: q => { q = q.trim().toLowerCase(); el.querySelectorAll('.trk').forEach(b => { b.hidden = !b.dataset.s.includes(q); });
      el.querySelectorAll('details').forEach(x => { x.hidden = !x.querySelector('.trk:not([hidden])'); if (q) x.open = true; }); }
  };
}
