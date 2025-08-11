import { SOCIAL_BASE } from "./config.js";
import { apiFetch } from "./http.js";
import { getProfile } from "./storage.js";

const $title = document.getElementById("title");
const $content = document.getElementById("content");
const $meta = document.getElementById("meta");
const $fallback = document.getElementById("fallback");
const $actions = document.getElementById("actions");

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getIdFromQuery() {
  const id = new URLSearchParams(location.search).get("id");
  return id ? id.trim() : "";
}

function setLoading(is) {
  if (is) {
    $content.textContent = "Loading…";
    $meta.textContent = "";
    $fallback.hidden = true;
  }
}

function render(post) {
  const title = post?.title || "(no title)";
  const body = post?.body || "";
  const authorName = post?._author?.name || "unknown";

  $title.textContent = title;
  $content.innerHTML = body ? `<p>${escapeHtml(body)}</p>` : `<em>(no content)</em>`;
  $meta.textContent = `by ${authorName}`;

  // Przygotuj miejsce na akcje edycji w Kroku 7/8 (warunkowe UI)
  $actions.innerHTML = "";
  try {
    const me = getProfile()?.name;
    if (me && me === post?._author?.name) {
      // Na razie nic — przyjdzie w Kroku 7/8
    }
  } catch {}
}

async function load() {
  const id = getIdFromQuery();
  if (!id) {
    $title.textContent = "Invalid post id";
    $content.textContent = "";
    $fallback.hidden = false;
    return;
  }

  setLoading(true);
  try {
    const url = `${SOCIAL_BASE}/posts/${encodeURIComponent(id)}?_author=true`;
    const res = await apiFetch(url);
    const data = res?.data ?? res; // w razie gdy backend zwróci tablicę/obiekt bez data
    if (!data || !data.id) {
      $fallback.hidden = false;
      $content.textContent = "";
      $title.textContent = "Post not found";
      return;
    }
    render(data);
  } catch (err) {
    console.error(err);
    $title.textContent = "Error";
    $content.textContent = err?.message || "Failed to load post";
    $fallback.hidden = false;
  }
}

load();
