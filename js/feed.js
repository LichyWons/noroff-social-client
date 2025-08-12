import { SOCIAL_BASE } from "./config.js";
import { apiFetch } from "./http.js";
import { getProfile } from "./storage.js";

const $list = document.getElementById("list");
const $search = document.getElementById("search");
const $filter = document.getElementById("filter");

let lastQuery = "";
let lastFilter = "";

/** Prosty loader */
function setLoading(isLoading) {
  if (isLoading) {
    $list.innerHTML = `<div class="loader">Loading…</div>`;
  }
}

/** Render pojedynczej karty */
function renderCard(post) {
  const id = post?.id;
  const title = post?.title || "(no title)";
  const body = post?.body || "";
  const author = post?._author?.name || "unknown";
  const tags = Array.isArray(post?.tags) ? post.tags : [];

  return `
    <article class="post">
      <h3><a href="./post.html?id=${encodeURIComponent(id)}">${escapeHtml(title)}</a></h3>
      <p>${escapeHtml(body).slice(0, 180)}${body.length > 180 ? "…" : ""}</p>
      <div class="meta">
        <span>by ${escapeHtml(author)}</span>
        ${tags.length ? `<span class="tags">${tags.map(t => `#${escapeHtml(t)}`).join(" ")}</span>` : ""}
      </div>
    </article>
  `;
}

/** Escaper minimalny do tekstów */
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Pobierz listę postów z API */
async function fetchPosts() {
  const url = `${SOCIAL_BASE}/posts?limit=50&offset=0&_author=true`;
  const res = await apiFetch(url);
  // v2 zwykle zwraca { data, meta }, ale obsłużmy też, gdy przyjdzie tablica:
  const items = Array.isArray(res) ? res : (res?.data ?? []);
  return items;
}

/** Zastosuj lokalne filtrowanie/wyszukiwanie */
function filterPosts(items, q, filter) {
  const qNorm = q.trim().toLowerCase();
  const me = getProfile()?.name?.toLowerCase();

  let out = items;

  if (qNorm) {
    out = out.filter(p => {
      const title = (p?.title || "").toLowerCase();
      const body = (p?.body || "").toLowerCase();
      const author = (p?._author?.name || "").toLowerCase();
      const tags = (Array.isArray(p?.tags) ? p.tags.join(" ") : "").toLowerCase();
      return title.includes(qNorm) || body.includes(qNorm) || author.includes(qNorm) || tags.includes(qNorm);
    });
  }

  if (filter) {
    if (filter.startsWith("tag:")) {
      const tag = filter.slice(4).toLowerCase();
      out = out.filter(p => Array.isArray(p?.tags) && p.tags.some(t => String(t).toLowerCase() === tag));
    } else if (filter === "author:me" && me) {
      out = out.filter(p => (p?._author?.name || "").toLowerCase() === me);
    }
  }

  return out;
}

/** Render listy */
function renderList(items) {
  if (!items.length) {
    $list.innerHTML = `<p>No results.</p>`;
    return;
  }
  $list.innerHTML = items.map(renderCard).join("");
}

/** Główna ścieżka: pobierz → przefiltruj → renderuj */
async function loadAndRender() {
  setLoading(true);
  try {
    const items = await fetchPosts();
    const filtered = filterPosts(items, lastQuery, lastFilter);
    renderList(filtered);
  } catch (err) {
    console.error(err);
    $list.innerHTML = `<p class="error">Failed to load posts: ${escapeHtml(err.message || "Error")}</p>`;
  }
}

/** Debounce dla search */
function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Handlery UI */
const onSearch = debounce((e) => {
  lastQuery = e.target.value || "";
  loadAndRender();
}, 300);

function onFilter(e) {
  lastFilter = e.target.value || "";
  loadAndRender();
}

/** Inicjalizacja */
(function init() {
  $search?.addEventListener("input", onSearch);
  $filter?.addEventListener("change", onFilter);
  loadAndRender();
})();
