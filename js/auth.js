// CLIENT-SIDE ACCESS GATE ONLY. Not a security boundary (see README).
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const unhex = h => Uint8Array.from(h.match(/../g) || [], x => parseInt(x, 16));
export const mask = n => n.slice(0, 4) + '*'.repeat(Math.max(0, n.length - 4));
export async function verify(users, name, pin) {
  const u = users.find(x => x.name.toLowerCase() === name.toLowerCase());
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: u ? unhex(u.salt) : new Uint8Array(16), iterations: u ? u.iterations : 100000 }, key, 256);
  return u && hex(bits) === u.hash ? u.name : null;
}
