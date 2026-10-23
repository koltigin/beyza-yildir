const labels = { work: "New work", post: "New writing", exhibition: "New exhibition" };
const editor = document.querySelector(".editor");
let currentType = "work";
document.querySelectorAll("[data-type]").forEach((button) => button.addEventListener("click", () => { currentType = button.dataset.type; editor.hidden = false; document.querySelector("#editor-label").textContent = labels[currentType]; document.querySelector("#category").closest("label").hidden = currentType !== "work"; document.querySelector("#project-field").hidden = currentType !== "work"; document.querySelector("#event-fields").hidden = currentType !== "exhibition"; editor.scrollIntoView({ behavior: "smooth", block: "start" }); }));
document.querySelector("#close-editor").addEventListener("click", () => { editor.hidden = true; });
function notify(message) { const output = document.querySelector(".empty"); output.textContent = message; }
function escapeHtml(value) { return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
function renderManagedContent(content) {
  const target = document.querySelector("#content-items");
  target.innerHTML = content.length ? content.map((item) => `<article><p>${escapeHtml(item.status)} · ${escapeHtml(item.type)}</p><h3>${escapeHtml(item.title_tr)}</h3><button data-toggle-id="${item.id}" data-next-status="${item.status === "published" ? "draft" : "published"}">${item.status === "published" ? "Unpublish" : "Publish"}</button><button data-delete-id="${item.id}">Delete</button></article>`).join("") : `<p class="empty">Your published works, writing and exhibitions will appear here.</p>`;
  target.querySelectorAll("[data-toggle-id]").forEach((button) => button.addEventListener("click", async () => { await fetch(`/api/admin/content/${button.dataset.toggleId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: button.dataset.nextStatus }) }); loadPublishedContent(); }));
  target.querySelectorAll("[data-delete-id]").forEach((button) => button.addEventListener("click", async () => { if (!confirm("Delete this content and its media?")) return; await fetch(`/api/admin/content/${button.dataset.deleteId}`, { method: "DELETE" }); loadPublishedContent(); }));
}
async function loadPublishedContent() {
  try {
    const response = await fetch("/api/admin/content");
    if (!response.ok) return;
    const { content } = await response.json();
    renderManagedContent(content || []);
  } catch (_) { /* The local preview remains intentionally usable offline. */ }
}
function saveLocal(status) {
  const data = new FormData(document.querySelector("#content-form"));
  const entries = JSON.parse(localStorage.getItem("beyza-studio-preview") || "[]");
  entries.unshift({ id: crypto.randomUUID(), status, type: currentType, title: data.get("titleTr") || "Untitled", updatedAt: new Date().toISOString() });
  localStorage.setItem("beyza-studio-preview", JSON.stringify(entries));
}
async function optimiseImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Only image files can be uploaded.");
  const image = await new Promise((resolve, reject) => { const preview = new Image(); const objectUrl = URL.createObjectURL(file); preview.onload = () => { URL.revokeObjectURL(objectUrl); resolve(preview); }; preview.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("This image could not be read.")); }; preview.src = objectUrl; });
  const scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", .82));
  return blob || file;
}
document.querySelectorAll(".editor-tools button").forEach((button) => button.addEventListener("click", () => {
  const editorForLanguage = button.closest("fieldset").querySelector(".rich-editor"); editorForLanguage.focus();
  document.execCommand(button.dataset.command, false, button.dataset.value || null);
}));
async function submit(status) {
  const form = document.querySelector("#content-form");
  const data = new FormData(form);
  const descriptionTr = document.querySelector('[data-editor="descriptionTr"]').innerHTML.trim();
  const descriptionEn = document.querySelector('[data-editor="descriptionEn"]').innerHTML.trim();
  if (!descriptionTr || !descriptionEn) throw new Error("Please complete both Turkish and English descriptions.");
  const images = [...(form.querySelector('input[type="file"]')?.files || [])];
  const media = await Promise.all(images.map(async (image) => {
    const optimised = await optimiseImage(image);
    const uploaded = await fetch("/api/admin/media", { method: "POST", headers: { "content-type": optimised.type || "image/webp" }, body: optimised });
    if (!uploaded.ok) throw new Error("Image upload failed.");
    return uploaded.json();
  }));
  const response = await fetch("/api/admin/content", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: currentType, status, category: currentType === "work" ? document.querySelector("#category").value : null,
      projectId: data.get("projectId") || null, titleTr: data.get("titleTr"), titleEn: data.get("titleEn"),
      bodyTr: descriptionTr, bodyEn: descriptionEn, eventStart: data.get("eventStart") || null, eventEnd: data.get("eventEnd") || null, media })
  });
  if (!response.ok) throw new Error("The protected publishing API is not available yet.");
}
document.querySelector("#save-draft").addEventListener("click", async () => { try { await submit("draft"); notify("Draft saved."); } catch (_) { saveLocal("draft"); notify("Draft saved locally for preview."); } });
document.querySelector("#content-form").addEventListener("submit", async (event) => { event.preventDefault(); try { await submit("published"); notify("Published successfully."); } catch (_) { saveLocal("published"); notify("Published locally for preview."); } });
loadPublishedContent();
