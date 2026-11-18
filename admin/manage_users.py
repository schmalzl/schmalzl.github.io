#!/usr/bin/env python3
"""Manage data/users.json. Usage: manage_users.py add|remove|list|set-pin [NAME]"""
import getpass, hashlib, json, os, re, secrets, sys
PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'users.json')
ITER = 100000

def load():
    try:
        with open(PATH, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {'users': []}

def save(d):
    d['users'].sort(key=lambda u: u['name'].lower())
    with open(PATH, 'w', encoding='utf-8') as f:
        json.dump(d, f, indent=2)

def find(d, name):
    return next((u for u in d['users'] if u['name'].lower() == name.lower()), None)

def make(name):
    pin = getpass.getpass('PIN (4-12 digits): ')
    if not (pin.isdigit() and 4 <= len(pin) <= 12) or pin != getpass.getpass('Repeat PIN: '):
        sys.exit('Invalid PIN or PINs do not match.')
    salt = secrets.token_bytes(16)
    h = hashlib.pbkdf2_hmac('sha256', pin.encode(), salt, ITER, 32)
    return {'name': name, 'salt': salt.hex(), 'iterations': ITER, 'hash': h.hex()}

def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ('add', 'remove', 'list', 'set-pin'):
        sys.exit(__doc__)
    cmd, d = sys.argv[1], load()
    if cmd == 'list':
        return print('\n'.join(u['name'] for u in d['users']) or '(no users)')
    if len(sys.argv) < 3 or not re.fullmatch(r'[A-Za-z0-9_.-]{1,24}', sys.argv[2]):
        sys.exit('Name required: 1-24 characters of A-Z a-z 0-9 _ . -')
    name, u = sys.argv[2], find(d, sys.argv[2])
    if cmd == 'add':
        if u: sys.exit('User already exists.')
        d['users'].append(make(name))
    elif not u:
        sys.exit('User not found.')
    elif cmd == 'remove':
        d['users'].remove(u)
    else:
        u.update(make(u['name']))
    save(d)
    print('OK: data/users.json updated.')

main()
