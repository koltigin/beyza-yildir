const contentTypes = {
  work: { label: "Yeni eser", help: "Bir resim, fotoğraf, kolaj, film ya da video art çalışması ekle. Kategori ve varsa seri bilgisini belirt.", media: "Eser görselleri" },
  post: { label: "Yeni blog yazısı", help: "Beyza'nın blogunda yayınlanacak iki dilli yazıyı ekle. Kapak görseli isteğe bağlıdır.", media: "Kapak görseli (isteğe bağlı)" },
  exhibition: { label: "Yeni sergi / etkinlik", help: "Sergi, gösterim, konuşma veya etkinlik duyurusunu tarihleriyle birlikte ekle. Tarihler sayfada otomatik görünür; açıklama içindeki tarihleri de gerekirse güncelle.", media: "Etkinlik görseli / afişi (isteğe bağlı)" },
  award: { label: "Yeni ödül", help: "Ödülün veya seçkinin adını, yılını ve kısa açıklamasını iki dilde ekle.", media: "" },
  about: { label: "Hakkında sayfasını düzenle", help: "Bu metin Hakkında sayfasında seçili dile göre görünür. İki dili de güncelle.", media: "" }
};

const editor = document.querySelector(".editor");
const form = document.querySelector("#content-form");
const mediaLabel = document.querySelector("#media-label");
const mediaPreview = document.createElement("section");
mediaPreview.className = "existing-media";
mediaPreview.hidden = true;
mediaLabel.after(mediaPreview);
const categoryField = document.querySelector("#category-field");
const projectField = document.querySelector("#project-field");
const eventFields = document.querySelector("#event-fields");
const editorNotice = document.createElement("p");
editorNotice.className = "editor-notice";
editorNotice.hidden = true;
editorNotice.setAttribute("role", "status");
document.querySelector("#editor-help").after(editorNotice);
const toastRegion = document.createElement("div");
toastRegion.className = "studio-toasts";
toastRegion.setAttribute("aria-live", "polite");
toastRegion.setAttribute("aria-label", "İşlem bildirimleri");
document.body.append(toastRegion);
let currentType = "work";
let editingItem = null;
let managedItems = new Map();
let allManagedContent = [];
let activeContentFilter = "all";
let activeStatusFilter = "all";
let activeWorkCategory = null;
let removeExistingMedia = false;

const libraryLabels = {
  all: "Tüm içerikler",
  work: "Eserler",
  post: "Blog yazıları",
  exhibition: "Sergi ve etkinlikler",
  award: "Ödüller"
};
const workCategoryLabels = { Photography: "Fotoğraf", Collages: "Kolajlar", Drawings: "Çizimler", Films: "Filmler", "Video art": "Video sanatı" };

const workFilter = document.querySelector('[data-content-filter="work"]');
if (workFilter) {
  workFilter.outerHTML = `<p class="studio-category-label">Kategoriler</p>${Object.entries(workCategoryLabels).map(([category, label]) => `<button type="button" data-content-filter="work" data-work-category="${category}">${label} <span data-count-category="${category}">0</span></button>`).join("")}`;
}

const awardYearField = document.createElement("label");
awardYearField.id = "award-year-field";
awardYearField.hidden = true;
awardYearField.innerHTML = 'Ödül yılı <input name="awardYear" inputmode="numeric" maxlength="4" placeholder="2026" />';
eventFields.after(awardYearField);

function notify(message, tone = "success") {
  const toast = document.createElement("p");
  toast.className = `studio-toast studio-toast-${tone}`;
  toast.textContent = message;
  toastRegion.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 250);
  }, 3600);
  if (!editor.hidden) {
    editorNotice.textContent = message;
    editorNotice.hidden = false;
    return;
  }
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

function renderExistingMedia(item) {
  mediaPreview.hidden = true;
  mediaPreview.innerHTML = "";
  if (!item?.cover_key || !contentTypes[currentType].media) return;
  const imageUrl = `/media/${encodeURIComponent(item.cover_key).replace(/%2F/g, "/")}`;
  const state = removeExistingMedia
    ? `<p>Bu görsel, kaydettiğinizde kaldırılacak.</p><button type="button" data-undo-media>Vazgeç</button>`
    : `<img src="${imageUrl}" alt="Mevcut görsel" /><div><p>Mevcut görsel</p><small>Yeni bir dosya seçerseniz bu görsel onunla değiştirilir.</small><button type="button" data-remove-media>Görseli kaldır</button></div>`;
  mediaPreview.innerHTML = state;
  mediaPreview.hidden = false;
  mediaPreview.querySelector("[data-remove-media]")?.addEventListener("click", () => { removeExistingMedia = true; renderExistingMedia(item); });
  mediaPreview.querySelector("[data-undo-media]")?.addEventListener("click", () => { removeExistingMedia = false; renderExistingMedia(item); });
}

async function populateAbout() {
  const response = await fetch("/studio/api/admin/page/about", { credentials: "same-origin", headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(response.status === 401 ? "Hakkında metni yüklenemedi: Cloudflare Access oturumu API için yetkili değil." : "Hakkında metni yüklenemedi.");
  let payload;
  try { payload = await response.json(); } catch { throw new Error("Hakkında metni beklenmeyen bir Access giriş sayfası döndürdü. Studio oturumunu yenileyin."); }
  const { page } = payload;
  if (!page) return;
  form.elements.titleTr.value = page.title_tr;
  form.elements.titleEn.value = page.title_en;
  editorContent("Tr").innerHTML = page.body_tr;
  editorContent("En").innerHTML = page.body_en;
}

async function openEditor(type, item = null) {
  currentType = type;
  editingItem = item;
  removeExistingMedia = false;
  mediaPreview.hidden = true;
  editorNotice.hidden = true;
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
  renderExistingMedia(item);
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll("[data-type]").forEach((button) => button.addEventListener("click", () => openEditor(button.dataset.type).catch((error) => notify(error.message))));
document.querySelector("#close-editor").addEventListener("click", () => { editor.hidden = true; });

function updateLibraryControls() {
  document.querySelectorAll("[data-content-filter]").forEach((button) => {
    const type = button.dataset.contentFilter;
    button.classList.toggle("is-active", type === activeContentFilter);
    const count = allManagedContent.filter((item) => type === "all" || item.type === type).length;
    const countElement = button.querySelector("[data-count]");
    if (countElement) countElement.textContent = count;
  });
  document.querySelectorAll("[data-status-filter]").forEach((button) => button.classList.toggle("is-active", button.dataset.statusFilter === activeStatusFilter));
  document.querySelector("#library-kicker").textContent = activeStatusFilter === "all" ? "İçerik arşivi" : activeStatusFilter === "published" ? "Yayında" : "Taslaklar";
  document.querySelector("#library-heading").textContent = activeContentFilter === "work" && activeWorkCategory ? workCategoryLabels[activeWorkCategory] : libraryLabels[activeContentFilter];
  document.querySelectorAll("[data-work-category]").forEach((button) => {
    const category = button.dataset.workCategory;
    button.classList.toggle("is-active", activeContentFilter === "work" && activeWorkCategory === category);
    const count = allManagedContent.filter((item) => item.type === "work" && item.category === category).length;
    const countElement = button.querySelector("[data-count-category]");
    if (countElement) countElement.textContent = count;
  });
  const actionType = activeContentFilter === "all" ? "work" : activeContentFilter;
  document.querySelector("#new-category-content").textContent = `${contentTypes[actionType].label} ekle ↗`;
}

function renderFilteredContent() {
  const target = document.querySelector("#content-items");
  const content = allManagedContent.filter((item) => (activeContentFilter === "all" || item.type === activeContentFilter) && (!activeWorkCategory || item.category === activeWorkCategory) && (activeStatusFilter === "all" || item.status === activeStatusFilter));
  target.innerHTML = content.length ? content.map((item) => {
    const resource = item.type === "award" ? "awards" : "content";
    return `<article><p>${item.status === "published" ? "yayında" : "taslak"} · ${contentTypes[item.type]?.label || escapeHtml(item.type)}</p><h3>${escapeHtml(item.title_tr)}</h3><button data-edit-id="${item.id}">Düzenle</button><button data-toggle-id="${item.id}" data-resource="${resource}" data-next-status="${item.status === "published" ? "draft" : "published"}">${item.status === "published" ? "Taslağa al" : "Yayınla"}</button><button data-delete-id="${item.id}" data-resource="${resource}">Sil</button></article>`;
  }).join("") : `<p class="empty">${libraryLabels[activeContentFilter]} içinde ${activeStatusFilter === "published" ? "yayınlanmış" : activeStatusFilter === "draft" ? "taslak" : "henüz"} içerik yok.</p>`;
  target.querySelectorAll("[data-edit-id]").forEach((button) => button.addEventListener("click", () => {
    const item = managedItems.get(button.dataset.editId);
    if (item) openEditor(item.type, item).catch((error) => notify(error.message));
  }));
  target.querySelectorAll("[data-toggle-id]").forEach((button) => button.addEventListener("click", async () => {
    const response = await fetch(`/studio/api/admin/${button.dataset.resource}/${button.dataset.toggleId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: button.dataset.nextStatus }) });
    if (!response.ok) { notify("İçerik durumu değiştirilemedi.", "error"); return; }
    notify(button.dataset.nextStatus === "published" ? "İçerik yayınlandı." : "İçerik taslağa alındı.");
    loadPublishedContent();
  }));
  target.querySelectorAll("[data-delete-id]").forEach((button) => button.addEventListener("click", async () => {
    if (!confirm("Bu içerik silinsin mi?")) return;
    const response = await fetch(`/studio/api/admin/${button.dataset.resource}/${button.dataset.deleteId}`, { method: "DELETE" });
    if (!response.ok) { notify("İçerik silinemedi.", "error"); return; }
    notify("İçerik silindi.");
    loadPublishedContent();
  }));
}

function renderManagedContent(content) {
  allManagedContent = content;
  managedItems = new Map(content.map((item) => [item.id, item]));
  updateLibraryControls();
  renderFilteredContent();
}

document.querySelectorAll("[data-content-filter]").forEach((button) => button.addEventListener("click", () => {
  activeContentFilter = button.dataset.contentFilter;
  activeWorkCategory = button.dataset.workCategory || null;
  updateLibraryControls();
  renderFilteredContent();
}));

document.querySelectorAll("[data-status-filter]").forEach((button) => button.addEventListener("click", () => {
  activeStatusFilter = button.dataset.statusFilter;
  updateLibraryControls();
  renderFilteredContent();
}));

document.querySelector("#new-category-content").addEventListener("click", () => openEditor(activeContentFilter === "all" ? "work" : activeContentFilter).catch((error) => notify(error.message)));

async function loadPublishedContent() {
  try {
    const [contentResponse, awardsResponse] = await Promise.all([fetch("/studio/api/admin/content", { credentials: "same-origin", headers: { accept: "application/json" } }), fetch("/studio/api/admin/awards", { credentials: "same-origin", headers: { accept: "application/json" } })]);
    if (!contentResponse.ok || !awardsResponse.ok) {
      notify(contentResponse.status === 401 || awardsResponse.status === 401 ? "İçerikler yüklenemedi: Cloudflare Access oturumu API için yetkili değil." : "İçerikler yüklenemedi. Lütfen sayfayı yenileyin.");
      return;
    }
    const [{ content }, { awards }] = await Promise.all([contentResponse.json(), awardsResponse.json()]);
    renderManagedContent([...(content || []), ...(awards || []).map((award) => ({ ...award, type: "award" }))]);
  } catch (_) { notify("İçerikler okunamadı: Access oturumunu yenileyin. Sorun sürerse Access politikasında oturum açtığınız e-postayı kontrol edin."); }
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
    const response = await fetch("/studio/api/admin/page/about", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(common) });
    if (!response.ok) throw new Error("Hakkında sayfası kaydedilemedi.");
    return;
  }
  if (currentType === "award") {
    const response = await fetch(editingItem ? `/studio/api/admin/awards/${editingItem.id}` : "/studio/api/admin/awards", { method: editingItem ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...common, awardYear: data.get("awardYear") }) });
    if (!response.ok) throw new Error("Ödül kaydedilemedi.");
    return;
  }
  const images = [...(form.querySelector('input[type="file"]')?.files || [])];
  const media = await Promise.all(images.map(async (image) => {
    const optimised = await optimiseImage(image);
    const uploaded = await fetch("/studio/api/admin/media", { method: "POST", headers: { "content-type": optimised.type || "image/webp" }, body: optimised });
    if (!uploaded.ok) throw new Error("Görsel yüklenemedi.");
    return uploaded.json();
  }));
  const payload = { ...common, type: currentType, category: currentType === "work" ? document.querySelector("#category").value : null, projectId: data.get("projectId") || null, eventStart: data.get("eventStart") || null, eventEnd: data.get("eventEnd") || null, ...(media.length ? { media } : removeExistingMedia ? { media: [] } : {}) };
  const response = await fetch(editingItem ? `/studio/api/admin/content/${editingItem.id}` : "/studio/api/admin/content", { method: editingItem ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error("Yayınlama bağlantısı kurulamadı.");
}

document.querySelector("#save-draft").addEventListener("click", async () => { try { const wasEditing = Boolean(editingItem); await submit("draft"); notify(currentType === "about" ? "Hakkında sayfası kaydedildi." : wasEditing ? "İçerik düzenlendi ve taslak olarak kaydedildi." : "Taslak kaydedildi."); loadPublishedContent(); } catch (error) { notify(error.message || "Taslak kaydedilemedi.", "error"); } });
form.addEventListener("submit", async (event) => { event.preventDefault(); try { const wasEditing = Boolean(editingItem); await submit("published"); notify(currentType === "about" ? "Hakkında sayfası güncellendi." : wasEditing ? "İçerik düzenlendi ve yayınlandı." : "İçerik yayınlandı."); loadPublishedContent(); } catch (error) { notify(error.message || "İçerik yayınlanamadı.", "error"); } });
loadPublishedContent();
