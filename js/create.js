import { SOCIAL_BASE } from "./config.js";
import { apiFetch } from "./http.js";

const $form = document.getElementById("create-form");

function parseTags(raw) {
  return raw
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);
}

async function handleCreate(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const title = form.title.value.trim();
  const body = form.body.value.trim();
  const tags = parseTags(form.tags.value);

  try {
    const res = await apiFetch(`${SOCIAL_BASE}/posts`, {
      method: "POST",
      json: { title, body, tags },
    });
    const data = res?.data ?? res;
    if (!data?.id) throw new Error("Brak ID nowego posta w odpowiedzi");
    location.href = `./post.html?id=${encodeURIComponent(data.id)}`;
  } catch (err) {
    alert(err.message || "Create failed");
  }
}

$form?.addEventListener("submit", handleCreate);
