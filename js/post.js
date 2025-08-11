import { SOCIAL_BASE } from "./config.js";
import { apiFetch } from "./http.js";
import { getProfile } from "./storage.js";

const $title = document.getElementById("title");
const $content = document.getElementById("content");
const $meta = document.getElementById("meta");
const $fallback = document.getElementById("fallback");
const $actions = document.getElementById("actions");
const $editSection = document.getElementById("edit-section");
const $editForm = document.getElementById("edit-form");
const $cancelEdit = document.getElementById("cancel-edit");

let currentPostId = null;
let currentPostData = null;

/* ---------- helpers ---------- */
function escapeHtml(s) {
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}
function tagsToStr(tags) { return Array.isArray(tags) ? tags.join(", ") : ""; }
function strToTags(str) { return String(str||"").split(",").map(t=>t.trim()).filter(Boolean); }
function getIdFromQuery() { const id = new URLSearchParams(location.search).get("id"); return id ? id.trim() : ""; }
function setLoading(is) { if (is) { if ($content) $content.textContent="Loading…"; if ($meta) $meta.textContent=""; if ($fallback) $fallback.hidden=true; } }

/* ---------- view render ---------- */
function render(post) {
  const title = post?.title || "(no title)";
  const body = post?.body || "";
  const authorName = post?.author?.name || post?._author?.name || "unknown";

  console.log("Rendering post:", post);
  console.log("Current profile:", getProfile());

  if ($title) $title.textContent = title;
  if ($content) $content.innerHTML = body ? `<p>${escapeHtml(body)}</p>` : `<em>(no content)</em>`;
  if ($meta) $meta.textContent = `by ${authorName}`;
  if ($fallback) $fallback.hidden = true;

  // Actions (Edit tylko dla autora — case-insensitive)
  if ($actions) {
    $actions.innerHTML = "";
    const me = getProfile()?.name?.toLowerCase();
    const author = (post?.author?.name || post?._author?.name || "").toLowerCase();
    console.log("Comparing names:", { me, author });
    if (me && author && me === author) {
      const btn = document.createElement("button");
      btn.textContent = "Edit";
      btn.addEventListener("click", () => openEdit(post));
      $actions.appendChild(btn);
    }
  }

  // Prefill edytora
  if ($editForm) {
    $editForm.title.value = title;
    $editForm.body.value = body;
    $editForm.tags.value = tagsToStr(post?.tags || []);
  }
}

/* ---------- edit flow ---------- */
function openEdit(post) {
  currentPostData = post;
  currentPostId = post?.id;
  if (!currentPostId) return;
  if ($editSection) $editSection.hidden = false;
}

async function saveEdit(e) {
  e.preventDefault();
  if (!currentPostId) return;

  const form = e.currentTarget;
  const title = form.title.value.trim();
  const body = form.body.value.trim();
  const tags = strToTags(form.tags.value);

  try {
    const res = await apiFetch(`${SOCIAL_BASE}/posts/${encodeURIComponent(currentPostId)}`, {
      method: "PUT",
      json: { title, body, tags },
    });
    const data = res?.data ?? res;
    currentPostData = data;
    render(data);
    if ($editSection) $editSection.hidden = true;
    alert("Updated");
  } catch (err) {
    alert(err?.message || "Update failed");
  }
}

/* ---------- load ---------- */
async function load() {
  const id = getIdFromQuery();
  if (!id) {
    if ($title) $title.textContent = "Invalid post id";
    if ($content) $content.textContent = "";
    if ($fallback) $fallback.hidden = false;
    return;
  }

  setLoading(true);
  try {
    const url = `${SOCIAL_BASE}/posts/${encodeURIComponent(id)}?_author=true`;
    const res = await apiFetch(url);
    const data = res?.data ?? res;

    console.log("Fetched post data:", data);

    if (!data || !data.id) {
      if ($title) $title.textContent = "Post not found";
      if ($content) $content.textContent = "";
      if ($fallback) $fallback.hidden = false;
      return;
    }

    currentPostId = data.id;
    currentPostData = data;
    render(data);
  } catch (err) {
    console.error(err);
    if ($title) $title.textContent = "Error";
    if ($content) $content.textContent = err?.message || "Failed to load post";
    if ($fallback) $fallback.hidden = false;
  }
}

/* ---------- init ---------- */
load();
$editForm?.addEventListener("submit", saveEdit);
$cancelEdit?.addEventListener("click", () => {
  if ($editSection) $editSection.hidden = true;
  if (currentPostData && $editForm) {
    $editForm.title.value = currentPostData.title || "";
    $editForm.body.value = currentPostData.body || "";
    $editForm.tags.value = tagsToStr(currentPostData.tags || []);
  }
});
