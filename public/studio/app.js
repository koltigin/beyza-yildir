const contentTypes = {
  work: { label: "Yeni eser", help: "Bir resim, fotoğraf, kolaj, film ya da video art çalışması ekle. Kategori ve varsa seri bilgisini belirt.", media: "Eser görselleri" },
  post: { label: "Yeni blog yazısı", help: "Beyza'nın blogunda yayınlanacak iki dilli yazıyı ekle. Kapak görseli isteğe bağlıdır.", media: "Kapak görseli (isteğe bağlı)" },
  exhibition: { label: "Yeni sergi / etkinlik", help: "Sergi, gösterim, konuşma veya etkinlik duyurusunu tarihleriyle birlikte ekle.", media: "Etkinlik görseli / afişi (isteğe bağlı)" }
};
const editor = document.querySelector(".editor");
let currentType = "work";
document.querySelectorAll("[data-type]").forEach((button) => button.addEventListener("click", () => {
  currentType = button.dataset.type; const details = contentTypes[currentType]; editor.hidden = false;
  document.querySelector("#editor-label").textContent = details.label;
  document.querySelector("#editor-help").textContent = details.help;
  document.querySelector("#media-label").childNodes[0].nodeValue = `${details.media} `;
  document.querySelector("#category-field").hidden = currentType !== "work";
  document.querySelector("#project-field").hidden = currentType !== "work";
  document.querySelector("#event-fields").hidden = currentType !== "exhibition";
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}));
document.querySelector("#close-editor").addEventListener("click", () => { editor.hidden = true; });
function notify(message) { const output = document.querySelector(".empty"); output.textContent = message; }
function escapeHtml(value) { return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character])); }
function renderManagedContent(content) {
  const target = document.querySelector("#content-items");
  target.innerHTML = content.length ? content.map((item) => `<article><p>${item.status === "published" ? "yayında" : "taslak"} · ${contentTypes[item.type]?.label || escapeHtml(item.type)}</p><h3>${escapeHtml(item.title_tr)}</h3><button data-toggle-id="${item.id}" data-next-status="${item.status === "published" ? "draft" : "published"}">${item.status === "published" ? "Taslağa al" : "Yayınla"}</button><button data-delete-id="${item.id}">Sil</button></article>`).join("") : `<p class="empty">Eklediğin eserler, blog yazıları ve sergi duyuruları burada görünecek.</p>`;
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
  const value = button.dataset.command === "createLink" ? window.prompt("Bağlantı adresini yapıştır:") : (button.dataset.value || null);
  if (button.dataset.command !== "createLink" || value) document.execCommand(button.dataset.command, false, value);
}));
async function submit(status) {
  const form = document.querySelector("#content-form");
  const data = new FormData(form);
  const descriptionTr = document.querySelector('[data-editor="descriptionTr"]').innerHTML.trim();
  const descriptionEn = document.querySelector('[data-editor="descriptionEn"]').innerHTML.trim();
  if (!descriptionTr || !descriptionEn) throw new Error("Türkçe ve İngilizce açıklamaların ikisini de doldur.");
  const images = [...(form.querySelector('input[type="file"]')?.files || [])];
  const media = await Promise.all(images.map(async (image) => {
    const optimised = await optimiseImage(image);
    const uploaded = await fetch("/api/admin/media", { method: "POST", headers: { "content-type": optimised.type || "image/webp" }, body: optimised });
    if (!uploaded.ok) throw new Error("Görsel yüklenemedi.");
    return uploaded.json();
  }));
  const response = await fetch("/api/admin/content", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: currentType, status, category: currentType === "work" ? document.querySelector("#category").value : null,
      projectId: data.get("projectId") || null, titleTr: data.get("titleTr"), titleEn: data.get("titleEn"),
      bodyTr: descriptionTr, bodyEn: descriptionEn, eventStart: data.get("eventStart") || null, eventEnd: data.get("eventEnd") || null, media })
  });
  if (!response.ok) throw new Error("Yayınlama bağlantısı kurulamadı.");
}
document.querySelector("#save-draft").addEventListener("click", async () => { try { await submit("draft"); notify("Taslak kaydedildi."); loadPublishedContent(); } catch (error) { saveLocal("draft"); notify(error.message || "Taslak yalnızca bu tarayıcıda kaydedildi."); } });
document.querySelector("#content-form").addEventListener("submit", async (event) => { event.preventDefault(); try { await submit("published"); notify("İçerik yayınlandı."); loadPublishedContent(); } catch (error) { saveLocal("published"); notify(error.message || "İçerik yalnızca bu tarayıcıda kaydedildi."); } });
loadPublishedContent();
