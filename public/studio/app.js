const contentTypes = {
  work: { label: "Yeni eser", help: "Bir resim, fotoğraf, kolaj, film ya da video art çalışması ekle. Kategori ve varsa seri bilgisini belirt.", media: "Eser görselleri" },
  post: { label: "Yeni blog yazısı", help: "Beyza'nın blogunda yayınlanacak iki dilli yazıyı ekle. Kapak görseli isteğe bağlıdır.", media: "Kapak görseli (isteğe bağlı)" },
  exhibition: { label: "Yeni sergi / etkinlik", help: "Sergi, gösterim, konuşma veya etkinlik duyurusunu tarihleriyle birlikte ekle.", media: "Etkinlik görseli / afişi (isteğe bağlı)" },
  award: { label: "Yeni ödül", help: "Ödülün veya seçkinin adını, yılını ve kısa açıklamasını iki dilde ekle.", media: "" },
  about: { label: "Hakkında sayfasını düzenle", help: "Bu metin Hakkında sayfasında seçili dile göre görünür. İki dili de güncelle.", media: "" }
};

const editor = document.querySelector(".editor");
const form = document.querySelector("#content-form");
const mediaLabel = document.querySelector("#media-label");
const categoryField = document.querySelector("#category-field");
const projectField = document.querySelector("#project-field");
const eventFields = document.querySelector("#event-fields");
let currentType = "work";
let editingItem = null;
let managedItems = new Map();

const actions = document.querySelector(".actions");
actions.insertAdjacentHTML("beforeend", '<button type="button" data-type="award"><span>04</span>Yeni ödül <b>↗</b></button><button type="button" data-type="about"><span>05</span>Hakkında sayfasını düzenle <b>↗</b></button>');
const awardYearField = document.createElement("label");
awardYearField.id = "award-year-field";
awardYearField.hidden = true;
awardYearField.innerHTML = 'Ödül yılı <input name="awardYear" inputmode="numeric" maxlength="4" placeholder="2026" />';
eventFields.after(awardYearField);

function notify(message) {
  const output = document.querySelector(".empty");
  if (output) output.textContent = message;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function editorContent(language) {
  return document.querySelector(`[data-editor="description${language}"]`);
}

function clearEditor() {
  form.reset();
  editorContent("Tr").innerHTML = "";
  editorContent("En").innerHTML = "";
}

async function populateAbout() {
  const response = await fetch("/api/admin/page/about");
  if (!response.ok) throw new Error("Hakkında metni yüklenemedi.");
  const { page } = await response.json();
  if (!page) return;
  form.elements.titleTr.value = page.title_tr;
  form.elements.titleEn.value = page.title_en;
  editorContent("Tr").innerHTML = page.body_tr;
  editorContent("En").innerHTML = page.body_en;
}

async function openEditor(type, item = null) {
  currentType = type;
  editingItem = item;
  const details = contentTypes[currentType];
  editor.hidden = false;
  document.querySelector("#editor-label").textContent = details.label;
  document.querySelector("#editor-help").textContent = details.help;
  mediaLabel.hidden = !details.media;
  if (details.media) mediaLabel.childNodes[0].nodeValue = `${details.media} `;
  categoryField.hidden = currentType !== "work";
  projectField.hidden = currentType !== "work";
  eventFields.hidden = currentType !== "exhibition";
  awardYearField.hidden = currentType !== "award";
  clearEditor();
  if (currentType === "about") {
    form.elements.titleTr.value = "Beyza Yıldır";
    form.elements.titleEn.value = "Beyza Yıldır";
    await populateAbout();
  } else if (item) {
    form.elements.titleTr.value = item.title_tr || "";
    form.elements.titleEn.value = item.title_en || "";
    editorContent("Tr").innerHTML = item.body_tr || "";
    editorContent("En").innerHTML = item.body_en || "";
    if (currentType === "work") {
      document.querySelector("#category").value = item.category || "Photography";
      form.elements.projectId.value = item.project_id || "";
    }
    if (currentType === "exhibition") {
      form.elements.eventStart.value = item.event_start || "";
      form.elements.eventEnd.value = item.event_end || "";
    }
    if (currentType === "award") form.elements.awardYear.value = item.award_year || "";
    document.querySelector("#editor-label").textContent = `${details.label} — düzenle`;
  }
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll("[data-type]").forEach((button) => button.addEventListener("click", () => openEditor(button.dataset.type).catch((error) => notify(error.message))));
document.querySelector("#close-editor").addEventListener("click", () => { editor.hidden = true; });

function renderManagedContent(content) {
  const target = document.querySelector("#content-items");
  managedItems = new Map(content.map((item) => [item.id, item]));
  target.innerHTML = content.length ? content.map((item) => {
    const resource = item.type === "award" ? "awards" : "content";
    return `<article><p>${item.status === "published" ? "yayında" : "taslak"} · ${contentTypes[item.type]?.label || escapeHtml(item.type)}</p><h3>${escapeHtml(item.title_tr)}</h3><button data-edit-id="${item.id}">Düzenle</button><button data-toggle-id="${item.id}" data-resource="${resource}" data-next-status="${item.status === "published" ? "draft" : "published"}">${item.status === "published" ? "Taslağa al" : "Yayınla"}</button><button data-delete-id="${item.id}" data-resource="${resource}">Sil</button></article>`;
  }).join("") : '<p class="empty">Eklediğin eserler, blog yazıları, ödüller ve sergi duyuruları burada görünecek.</p>';
  target.querySelectorAll("[data-edit-id]").forEach((button) => button.addEventListener("click", () => {
    const item = managedItems.get(button.dataset.editId);
    if (item) openEditor(item.type, item).catch((error) => notify(error.message));
  }));
  target.querySelectorAll("[data-toggle-id]").forEach((button) => button.addEventListener("click", async () => {
    await fetch(`/api/admin/${button.dataset.resource}/${button.dataset.toggleId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: button.dataset.nextStatus }) });
    loadPublishedContent();
  }));
  target.querySelectorAll("[data-delete-id]").forEach((button) => button.addEventListener("click", async () => {
    if (!confirm("Bu içerik silinsin mi?")) return;
    await fetch(`/api/admin/${button.dataset.resource}/${button.dataset.deleteId}`, { method: "DELETE" });
    loadPublishedContent();
  }));
}

async function loadPublishedContent() {
  try {
    const [contentResponse, awardsResponse] = await Promise.all([fetch("/api/admin/content"), fetch("/api/admin/awards")]);
    if (!contentResponse.ok || !awardsResponse.ok) return;
    const [{ content }, { awards }] = await Promise.all([contentResponse.json(), awardsResponse.json()]);
    renderManagedContent([...(content || []), ...(awards || []).map((award) => ({ ...award, type: "award" }))]);
  } catch (_) { /* Studio remains usable while offline. */ }
}

async function optimiseImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Yalnızca görsel dosyaları yüklenebilir.");
  const image = await new Promise((resolve, reject) => { const preview = new Image(); const objectUrl = URL.createObjectURL(file); preview.onload = () => { URL.revokeObjectURL(objectUrl); resolve(preview); }; preview.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Bu görsel okunamadı.")); }; preview.src = objectUrl; });
  const scale = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", .82));
  return blob || file;
}

document.querySelectorAll(".editor-tools button").forEach((button) => button.addEventListener("click", () => {
  const editable = button.closest("fieldset").querySelector(".rich-editor");
  editable.focus();
  const value = button.dataset.command === "createLink" ? window.prompt("Bağlantı adresini yapıştır:") : (button.dataset.value || null);
  if (button.dataset.command !== "createLink" || value) document.execCommand(button.dataset.command, false, value);
}));

async function submit(status) {
  const data = new FormData(form);
  const bodyTr = editorContent("Tr").innerHTML.trim();
  const bodyEn = editorContent("En").innerHTML.trim();
  if (!bodyTr || !bodyEn) throw new Error("Türkçe ve İngilizce açıklamaların ikisini de doldur.");
  const common = { status, titleTr: data.get("titleTr"), titleEn: data.get("titleEn"), bodyTr, bodyEn };
  if (currentType === "about") {
    const response = await fetch("/api/admin/page/about", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(common) });
    if (!response.ok) throw new Error("Hakkında sayfası kaydedilemedi.");
    return;
  }
  if (currentType === "award") {
    const response = await fetch(editingItem ? `/api/admin/awards/${editingItem.id}` : "/api/admin/awards", { method: editingItem ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...common, awardYear: data.get("awardYear") }) });
    if (!response.ok) throw new Error("Ödül kaydedilemedi.");
    return;
  }
  const images = [...(form.querySelector('input[type="file"]')?.files || [])];
  const media = await Promise.all(images.map(async (image) => {
    const optimised = await optimiseImage(image);
    const uploaded = await fetch("/api/admin/media", { method: "POST", headers: { "content-type": optimised.type || "image/webp" }, body: optimised });
    if (!uploaded.ok) throw new Error("Görsel yüklenemedi.");
    return uploaded.json();
  }));
  const payload = { ...common, type: currentType, category: currentType === "work" ? document.querySelector("#category").value : null, projectId: data.get("projectId") || null, eventStart: data.get("eventStart") || null, eventEnd: data.get("eventEnd") || null, ...(media.length ? { media } : {}) };
  const response = await fetch(editingItem ? `/api/admin/content/${editingItem.id}` : "/api/admin/content", { method: editingItem ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error("Yayınlama bağlantısı kurulamadı.");
}

document.querySelector("#save-draft").addEventListener("click", async () => { try { await submit("draft"); notify(currentType === "about" ? "Hakkında sayfası kaydedildi." : "Taslak kaydedildi."); loadPublishedContent(); } catch (error) { notify(error.message || "Taslak kaydedilemedi."); } });
form.addEventListener("submit", async (event) => { event.preventDefault(); try { await submit("published"); notify(currentType === "about" ? "Hakkında sayfası güncellendi." : "İçerik yayınlandı."); loadPublishedContent(); } catch (error) { notify(error.message || "İçerik yayınlanamadı."); } });
loadPublishedContent();
