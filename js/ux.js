const $root = document.getElementById("toast-root");
const $pageLoader = document.getElementById("page-loader");

let loaderCount = 0;

function updateLoaderVisibility() {
  if ($pageLoader) $pageLoader.hidden = loaderCount === 0;
}

export function showToast(message, type = "default", timeout = 3000) {
  if (!$root) { alert(message); return; }
  const div = document.createElement("div");
  div.className = `toast ${type === "error" ? "error" : type === "success" ? "success" : ""}`;
  div.textContent = message;
  $root.appendChild(div);
  const t = setTimeout(() => div.remove(), timeout);
  div.addEventListener("click", () => { clearTimeout(t); div.remove(); });
}

/** Global page loader with reference counting */
export function setPageLoading(on) {
  if (on) loaderCount++;
  else loaderCount = Math.max(0, loaderCount - 1);
  updateLoaderVisibility();
}

/** Wrap a promise or thunk and manage loaderCount safely */
export async function withPageLoader(promiseOrFn) {
  setPageLoading(true);
  try {
    const p = (typeof promiseOrFn === "function") ? promiseOrFn() : promiseOrFn;
    return await p;
  } finally {
    setPageLoading(false);
  }
}

/** Disable/enable button during async action */
export async function withBtnLoading(btn, fn) {
  if (!btn) return fn();
  btn.disabled = true;
  try { return await fn(); }
  finally { btn.disabled = false; }
}

/* Debug helper (opcjonalnie w dev) */
export function __debugResetLoader() {
  loaderCount = 0;
  updateLoaderVisibility();
}
