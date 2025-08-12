const $root = document.getElementById("toast-root");
const $pageLoader = document.getElementById("page-loader");

let loaderCount = 0;

function updateLoaderVisibility() {
  if ($pageLoader) $pageLoader.hidden = loaderCount === 0;
}

/**
 * Show a toast message.
 * @param {string} message
 * @param {"default"|"error"|"success"} [type="default"]
 * @param {number} [timeout=3000]
 */
export function showToast(message, type = "default", timeout = 3000) {
  if (!$root) { alert(message); return; }
  const div = document.createElement("div");
  div.className = `toast ${type === "error" ? "error" : type === "success" ? "success" : ""}`;
  div.textContent = message;
  $root.appendChild(div);
  const t = setTimeout(() => div.remove(), timeout);
  div.addEventListener("click", () => { clearTimeout(t); div.remove(); });
}

/** Increment/decrement global page loader counter. */
export function setPageLoading(on) {
  if (on) loaderCount++;
  else loaderCount = Math.max(0, loaderCount - 1);
  updateLoaderVisibility();
}

/**
 * Wrap a promise or thunk and manage the page loader.
 * @template T
 * @param {Promise<T> | (() => Promise<T>)} promiseOrFn
 * @returns {Promise<T>}
 */
export async function withPageLoader(promiseOrFn) {
  setPageLoading(true);
  try {
    const p = (typeof promiseOrFn === "function") ? promiseOrFn() : promiseOrFn;
    return await p;
  } finally {
    setPageLoading(false);
  }
}

/**
 * Disable a button while the async function runs.
 * @template T
 * @param {HTMLButtonElement | undefined | null} btn
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withBtnLoading(btn, fn) {
  if (!btn) return fn();
  btn.disabled = true;
  try { return await fn(); }
  finally { btn.disabled = false; }
}

/** Dev helper to reset loader (optional). */
export function __debugResetLoader() {
  loaderCount = 0;
  updateLoaderVisibility();
}
