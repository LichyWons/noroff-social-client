import { API_BASE_URL } from "./config.js";
import { getToken, getApiKey } from "./storage.js";

/**
 * @typedef {Object} ApiErrorItem
 * @property {string} message
 * @property {string} [code]
 * @property {string} [path]
 */

/**
 * @typedef {Object} ApiErrorPayload
 * @property {number} [status]
 * @property {number} [statusCode]
 * @property {string} [message]
 * @property {ApiErrorItem[]} [errors]
 */

/**
 * @typedef {Object} ApiEnvelope<T>
 * @property {T} [data]   - Most v2 endpoints return { data: ... }
 * @property {any} [meta] - Optional pagination/metadata
 */

/**
 * @typedef {Object} FetchOptions
 * @property {RequestInit["method"]} [method]
 * @property {Record<string, string>} [headers]
 * @property {any} [body]
 * @property {any} [json] - If provided, will be JSON.stringify-ed and Content-Type set
 */

/**
 * apiFetch – fetch wrapper adding JSON handling, JWT and X-Noroff-API-Key headers.
 * Automatically:
 *  - builds a full URL from API_BASE_URL for relative paths,
 *  - serializes `options.json`,
 *  - adds `Authorization: Bearer <token>` and `X-Noroff-API-Key: <key>` if available,
 *  - throws an Error for non-OK responses, attaching `err.data` with v2 error payload.
 *
 * @template T
 * @param {string} path - relative path (e.g. "/auth/login") or absolute URL
 * @param {FetchOptions} [options]
 * @returns {Promise<T>} - typically `ApiEnvelope<TData>` or raw JSON
 *
 * @example
 * // Login:
 * const res = await apiFetch/** @type {ApiEnvelope<{ accessToken: string, name: string }>} *\/(
 *   "/auth/login",
 *   { method: "POST", json: { email, password } }
 * );
 * const token = res.data.accessToken;
 *
 * @example
 * // Get posts:
 * const list = await apiFetch/** @type {ApiEnvelope<Array<{ id:number, title:string }>>} *\/(
 *   "/social/posts?limit=50"
 * );
 * console.log(list.data.length);
 */
export async function apiFetch(path, options = {}) {
  const isAbsolute = /^https?:\/\//i.test(path);
  const url = isAbsolute
    ? path
    : `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const headers = new Headers(options.headers || {});

  // Default JSON header if using `json`
  if (!headers.has("Content-Type") && options.body === undefined && options.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  // Auth headers
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const apiKey = getApiKey();
  if (apiKey) headers.set("X-Noroff-API-Key", apiKey);

  // Build body
  let body = options.body;
  if (body === undefined && options.json !== undefined) {
    body = JSON.stringify(options.json);
  }

  const res = await fetch(url, { ...options, headers, body });

  // 204 No Content
  if (res.status === 204) return /** @type {any} */ (null);

  const text = await res.text();
  /** @type {any} */
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

  if (!res.ok) {
    /** @type {Error & { status?: number, data?: ApiErrorPayload }} */
    const err = new Error(
      (data && (data.message || data.errors?.[0]?.message)) || `HTTP ${res.status}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return /** @type {any} */ (data);
}
