import { CONFIG } from './config.js';
export function get(k, d) { try { const v = localStorage.getItem(CONFIG.prefix + k); return v === null ? d : JSON.parse(v); } catch { return d; } }
export function set(k, v) { try { localStorage.setItem(CONFIG.prefix + k, JSON.stringify(v)); } catch { /* storage full or blocked */ } }
export function clearAll() { try { Object.keys(localStorage).filter(k => k.startsWith(CONFIG.prefix)).forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ } }
