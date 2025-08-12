import { SOCIAL_BASE } from "./config.js";
import { apiFetch } from "./http.js";
import { getProfile } from "./storage.js";
import { showToast, withBtnLoading, withPageLoader } from "./ux.js";

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

/* helpers */
function escapeHtml(s) {
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}
function tagsToStr(tags) { return Array.isArray(tags) ? tags.join(", ") : ""; }
function strToTags(str) { return String(str||"").split(",").map(t=>t.trim()).filter(Boolean); }
function getIdFromQuery() { const id = new URLSearchParams(location.search).get("id"); return id ? id.trim() : ""; }
function setLoading(is) {
  if (is) {
    if ($content) $content.textContent = "Loading…";
    if ($meta) $meta.textContent = "";
    if ($fallback) $fallback.hidden = true;
  }
}

/* render */
function render(post) {
  const title = post?.title || "(no title)";
  const body = post?.body || "";
  const authorName = post?.author?.name || post?._author?.name || "unknown";

  if ($title) $title.textContent = title;
  if ($content) $content.innerHTML = body ? `<p>${escapeHtml(body)}</p>` : `<em>(no content)</em>`;
  if ($meta) $meta.textContent = `by ${authorName}`;
  if ($fallback) $fallback.hidden = true;

  // Actions (Edit/Delete only for author, case-insensitive)
  if ($actions) {
    $actions.innerHTML = "";
    const me = getProfile()?.name?.toLowerCase();
    const author = (post?.author?.name || post?._author?.name || "").toLowerCase();
    if (me && author && me === author) {
      const btnEdit = document.createElement("button");
      btnEdit.textContent = "Edit";
      btnEdit.addEventListener("click", () => openEdit(post));
      $actions.appendChild(btnEdit);

      const btnDelete = document.createElement("button");
      btnDelete.textContent = "Delete";
      btnDelete.style.marginLeft = "0.5rem";
      btnDelete.addEventListener("click", () => onDelete(post.id));
      $actions.appendChild(btnDelete);
    }
  }

  // Prefill editor (if open)
  if ($editForm) {
    $editForm.title.value = title;
    $editForm.body.value = body;
    $editForm.tags.value = tagsToStr(post?.tags || []);
  }
}

/* edit */
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

  await withBtnLoading(e.submitter, async () => {
    try {
      const res = await withPageLoader(
        apiFetch(`${SOCIAL_BASE}/posts/${encodeURIComponent(currentPostId)}`, {
          method: "PUT",
          json: { title, body, tags },
        })
      );
      const data = res?.data ?? res;
      currentPostData = data;
      render(data);
      if ($editSection) $editSection.hidden = true;
      showToast("Updated", "success");
    } catch (err) {
      showToast(err?.message || "Update failed", "error");
    }
  });
}

/* delete */
async function onDelete(id) {
  if (!id) return;
  const ok = confirm("Are you sure you want to delete this post?");
  if (!ok) return;

  try {
    await withPageLoader(apiFetch(`${SOCIAL_BASE}/posts/${encodeURIComponent(id)}`, { method: "DELETE" }));
    showToast("Deleted", "success");
    location.href = "./index.html";
  } catch (err) {
    showToast(err?.message || "Delete failed", "error");
  }
}

/* load */
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

/* init */
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
