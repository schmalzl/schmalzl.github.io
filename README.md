# SUBSONIC 0.1.1

Underground music player for lifters. Static site: HTML, CSS, vanilla JS (ES modules). No backend, no build step.

## Features
Invite-style login, curated library by artist (MP3/WAV), repeat modes, seek/volume, five live visualizers (Web Audio + Canvas), settings, local stats, news, changelog, Media Session.

## Structure
`index.html`, `css/main.css`, `js/*.js` (config, storage, auth, settings, library, player, visualizer, statistics, app), `sound/<Artist>/`, `data/` (users.json, music.json, news.json, changelog.txt), `admin/` (Python tools, run locally only).

## Deploy
Push to GitHub, then Settings > Pages > deploy from branch `main`, folder `/ (root)`. All paths are relative, so `user.github.io/repo/` works.

## Add songs
Put files in `sound/Artist Name/Track.mp3`, then run `python3 admin/generate_manifest.py` and commit `data/music.json`. Audio is fetched only when a track is played.

## Users
```
python3 admin/manage_users.py add Kian
python3 admin/manage_users.py remove Kian
python3 admin/manage_users.py list
python3 admin/manage_users.py set-pin Kian
```
Passwords are stored as salted PBKDF2-SHA256 hashes in `data/users.json`.

## News and changelog
Edit `data/news.json` (newest shown first) and `data/changelog.txt`. For each release bump the version in `js/config.js` and `data/changelog.txt` (the login screen and About read it from config).

## Local storage
Settings, statistics and last track are kept in the browser's localStorage under the prefix `subsonic.`. Nothing is synced between devices. Clear via Settings.

## Security limitations (important)
The login is a client-side access gate, not security. GitHub Pages serves every file publicly: `users.json` can be downloaded (a short numeric PIN can be brute-forced offline), the audio files in `sound/` can be fetched directly by URL, and the JavaScript can be bypassed. Real private access needs a trusted server-side layer, which this project deliberately does not include.
