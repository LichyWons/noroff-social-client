import { API_BASE_URL } from "./config.js";
import { getToken, getApiKey } from "./storage.js";

/**
 * apiFetch – wrapper na fetch z nagłówkami JSON, JWT i X-Noroff-API-Key.
 * @param {string} path - ścieżka względna względem API_BASE_URL lub pełny URL.
 * @param {RequestInit & { json?: any }} [options]
 * @returns {Promise<any>} - sparsowany JSON lub null (204)
 * @example
 * const data = await apiFetch("/auth/login", { method: "POST", json: { email, password } });
 */
export async function apiFetch(path, options = {}) {
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = isAbsolute ? path : `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const headers = new Headers(options.headers || {});

  // JSON default
  if (!headers.has("Content-Type") && options.body === undefined && options.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  // Auth headers
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const apiKey = getApiKey();
  if (apiKey) headers.set("X-Noroff-API-Key", apiKey);

  // Body helper
  let body = options.body;
  if (body === undefined && options.json !== undefined) {
    body = JSON.stringify(options.json);
  }

  const res = await fetch(url, { ...options, headers, body });
  // 204 No Content
  if (res.status === 204) return null;

  let data;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

  if (!res.ok) {
    const err = new Error((data && (data.message || data.errors?.[0])) || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
