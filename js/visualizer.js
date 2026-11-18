// All modes read the live AnalyserNode. Colors: user color, then orange, then red for peaks.
export function startVis(cv, an, opt) {
  const g = cv.getContext('2d'), f = new Uint8Array(an.frequencyBinCount), t = new Uint8Array(an.fftSize);
  let last = 0, raf = 0, cleared = false;
  const clear = () => { g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height); };
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    const o = opt();
    if (!o.on) { if (!cleared) { clear(); cleared = true; } return; }
    if (document.hidden || ts - last < 1000 / o.fps) return;
    last = ts; cleared = false;
    const w = cv.clientWidth | 0, h = cv.clientHeight | 0;
    if (w && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; }
    an.getByteFrequencyData(f); an.getByteTimeDomainData(t);
    const W = cv.width, H = cv.height, s = o.sens;
    if (o.type === 'spectrogram') {
      g.drawImage(cv, -2, 0); g.fillStyle = '#000'; g.fillRect(W - 2, 0, 2, H); g.fillStyle = o.color;
      for (let y = 0; y < H; y++) { g.globalAlpha = Math.min(1, f[Math.floor((1 - y / H) ** 2 * f.length * 0.6)] / 255 * s); g.fillRect(W - 2, y, 2, 1); }
      g.globalAlpha = 1; return;
    }
    clear();
    if (o.type === 'meter') {
      let r = 0; for (const v of t) r += ((v - 128) / 128) ** 2;
      const lv = Math.min(1, Math.sqrt(r / t.length) * s * 2.5), n = 24, bw = W / n;
      for (let i = 0; i < n; i++) { g.fillStyle = i < n * 0.6 ? o.color : i < n * 0.85 ? '#2D7BFF' : '#FF3030'; g.globalAlpha = i / n < lv ? 1 : 0.15; g.fillRect(i * bw + 1, H * 0.2, bw - 2, H * 0.6); }
      g.globalAlpha = 1;
    } else if (o.type === 'spectrum') {
      const n = 40, bw = W / n, max = f.length * 0.7;
      for (let i = 0; i < n; i++) { const v = Math.min(1, f[Math.floor(i / n * max)] / 255 * s), bh = v * H; g.fillStyle = v > 0.9 ? '#FF3030' : v > 0.7 ? '#2D7BFF' : o.color; g.fillRect(i * bw + 1, H - bh, bw - 2, bh); }
    } else if (o.type === 'waveform') {
      g.fillStyle = o.color; const step = Math.max(1, Math.floor(t.length / (W / 3)));
      for (let x = 0, i = 0; x < W && i + step <= t.length; x += 3, i += step) { let m = 0; for (let k = 0; k < step; k++) m = Math.max(m, Math.abs(t[i + k] - 128)); const bh = Math.min(H, m / 128 * H * s); g.fillRect(x, (H - bh) / 2, 2, Math.max(1, bh)); }
    } else {
      g.strokeStyle = '#2a2a2a'; g.lineWidth = 1; g.beginPath();
      for (let i = 1; i < 8; i++) { g.moveTo(W * i / 8, 0); g.lineTo(W * i / 8, H); g.moveTo(0, H * i / 8); g.lineTo(W, H * i / 8); }
      g.stroke(); g.strokeStyle = o.color; g.lineWidth = 2; g.beginPath();
      for (let x = 0; x < W; x++) { const y = H / 2 + (t[Math.floor(x / W * t.length)] - 128) / 128 * H / 2 * s; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
  }
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}
