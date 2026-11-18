#!/usr/bin/env python3
"""Scan sound/<Artist>/*.mp3|wav and write data/music.json."""
import json, os
from urllib.parse import quote
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
snd, artists = os.path.join(root, 'sound'), []
for a in sorted(os.listdir(snd), key=str.lower):
    p = os.path.join(snd, a)
    if not os.path.isdir(p): continue
    tr = [{'title': os.path.splitext(f)[0], 'file': 'sound/%s/%s' % (quote(a), quote(f)), 'format': f.rsplit('.', 1)[1].lower()}
          for f in sorted(os.listdir(p), key=str.lower) if f.lower().endswith(('.mp3', '.wav'))]
    if tr: artists.append({'name': a, 'tracks': tr})
with open(os.path.join(root, 'data', 'music.json'), 'w', encoding='utf-8') as f:
    json.dump({'artists': artists}, f, indent=2, ensure_ascii=False)
print('%d artists, %d tracks' % (len(artists), sum(len(x['tracks']) for x in artists)))
