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
let currentMedia = [];
let inlineMedia = [];

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
  currentMedia = [];
  inlineMedia = [];
}

function mediaEntries(item) {
  try { return JSON.parse(item?.media_json || "[]").filter((media) => media?.key); } catch { return []; }
}

function uniqueMedia(entries) {
  return [...new Map(entries.filter((media) => media?.key).map((media) => [media.key, media])).values()];
}

function mediaKeysInHtml(html) {
  return [...String(html || "").matchAll(/\/media\/([^"'\s?#]+)/g)].map((match) => decodeURIComponent(match[1]).replace(/%2F/g, "/"));
}

function isVideoKey(key) {
  return /\.(mp4|webm|mov|ogv)$/i.test(String(key || ""));
}

function hasHiddenFallback(item) {
  try { return JSON.parse(item?.media_json || "[]").some((media) => media?.hidden === true); } catch { return false; }
}

function renderExistingMedia(item) {
  mediaPreview.hidden = true;
  mediaPreview.innerHTML = "";
  if (!contentTypes[currentType].media || !item) return;
  const fallbackHidden = hasHiddenFallback(item);
  if (!item.cover_key && currentType !== "work") return;
  const imageUrl = item.cover_key ? `/media/${encodeURIComponent(item.cover_key).replace(/%2F/g, "/")}` : "";
  const demoArtClass = { Photography: "photography", Collages: "collages", Drawings: "drawings", Films: "films", "Video art": "video-art" }[item.category] || "default";
  const state = removeExistingMedia
    ? `<p>Bu görsel, kaydettiğinizde kaldırılacak.</p><button type="button" data-undo-media>Vazgeç</button>`
    : item.cover_key
      ? `${isVideoKey(item.cover_key) ? `<video src="${imageUrl}" controls playsinline preload="metadata"></video>` : `<img src="${imageUrl}" alt="Mevcut görsel" />`}<div><p>Mevcut ${isVideoKey(item.cover_key) ? "video" : "görsel"}</p><small>Yeni bir dosya seçerseniz bu medya onunla değiştirilir.</small><button type="button" data-remove-media>${isVideoKey(item.cover_key) ? "Videoyu kaldır" : "Görseli kaldır"}</button></div>`
      : fallbackHidden
        ? `<div><p>Görsel kaldırıldı</p><small>Bu çalışma için yeni bir dosya seçerek yeniden görsel ekleyebilirsin.</small></div>`
        : `<div class="existing-media-art existing-media-art-${demoArtClass}" aria-hidden="true"></div><div><p>Mevcut demo görseli</p><small>Bu yer tutucu görsel kamu sayfasında görünür. Yeni bir dosya seçerek değiştirebilir veya kaldırabilirsin.</small><button type="button" data-remove-media>Görseli kaldır</button></div>`;
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
    currentMedia = mediaEntries(item);
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

async function prepareMedia(file) {
  if (file.type.startsWith("video/")) return file;
  return optimiseImage(file);
}

async function makeVideoThumbnail(file) {
  const video = document.createElement("video");
  const objectUrl = URL.createObjectURL(file);
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  try {
    const metadata = new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = () => reject(new Error("Video karesi okunamadı.")); });
    video.src = objectUrl;
    video.load();
    await metadata;
    video.currentTime = Math.min(Math.max(.15, video.duration * .15), Math.max(.15, video.duration - .15));
    await new Promise((resolve, reject) => { video.onseeked = resolve; video.onerror = () => reject(new Error("Video karesi okunamadı.")); });
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", .82));
    if (!blob) throw new Error("Video karesi oluşturulamadı.");
    return blob;
  } finally { URL.revokeObjectURL(objectUrl); }
}

async function uploadMedia(blob) {
  const uploaded = await fetch("/studio/api/admin/media", { method: "POST", headers: { "content-type": blob.type || "image/webp" }, body: blob });
  if (!uploaded.ok) {
    const payload = await uploaded.json().catch(() => null);
    throw new Error(payload?.error || "Medya yüklenemedi.");
  }
  return uploaded.json();
}

function drawShareTitle(context, title) {
  const words = String(title || "Beyza Yıldır").toLocaleUpperCase("tr-TR").split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > 880 && line) { lines.push(line); line = word; } else line = candidate;
  });
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function embedSource(value, provider) {
  try {
    const url = new URL(value);
    if (provider === "youtube") {
      const host = url.hostname.replace(/^www\./, "");
      const id = host === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    const id = url.hostname.replace(/^www\./, "") === "vimeo.com" ? url.pathname.split("/").filter(Boolean).pop() : url.pathname.match(/\/video\/(\d+)/)?.[1];
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  } catch (_) { return null; }
}

function insertEmbed(editable, provider) {
  const label = provider === "youtube" ? "YouTube" : "Vimeo";
  const source = embedSource(window.prompt(`${label} video bağlantısını yapıştır:`) || "", provider);
  if (!source) throw new Error(`Geçerli bir ${label} bağlantısı girin.`);
  editable.focus();
  document.execCommand("insertHTML", false, `<figure class="embed-video"><iframe src="${source}" title="${label} video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></figure><p></p>`);
}

async function createShareCard(title, locale) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  context.fillStyle = "#0a0b08";
  context.fillRect(0, 0, 1200, 630);
  context.fillStyle = "#283314";
  context.fillRect(735, 0, 465, 630);
  context.fillStyle = "#d69a25";
  context.fillRect(0, 546, 1200, 14);
  context.fillStyle = "#eee9d9";
  context.font = "900 82px Arial Black, Arial, sans-serif";
  context.fillText("BEYZA", 68, 122);
  context.fillText("YILDIR.", 68, 198);
  context.fillStyle = "#9ab936";
  context.font = "500 22px monospace";
  context.fillText(locale === "en" ? "BLOG · WRITING" : "BLOG · YAZI", 72, 270);
  context.fillStyle = "#eee9d9";
  context.font = "900 64px Arial Black, Arial, sans-serif";
  drawShareTitle(context, title).forEach((line, index) => context.fillText(line, 70, 370 + index * 72));
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Paylaşım görseli oluşturulamadı.");
  return { ...(await uploadMedia(blob)), role: `share-${locale}`, title };
}

async function insertEditorImage(editable) {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/jpeg,image/png,image/webp";
  picker.hidden = true;
  document.body.append(picker);
  picker.addEventListener("change", async () => {
    try {
      const file = picker.files?.[0];
      if (!file) return;
      const alt = window.prompt("Görsel açıklaması (isteğe bağlı):") || "";
      const image = await uploadMedia(await optimiseImage(file));
      inlineMedia.push(image);
      editable.focus();
      document.execCommand("insertHTML", false, `<figure class="inline-image"><img src="/media/${encodeURIComponent(image.key).replace(/%2F/g, "/")}" alt="${escapeHtml(alt)}" /></figure><p></p>`);
      notify("Görsel metne eklendi. Kaydettiğinizde yayınlanır.");
    } catch (error) { notify(error.message || "Görsel eklenemedi.", "error"); }
    finally { picker.remove(); }
  }, { once: true });
  picker.click();
}

document.querySelectorAll(".editor-tools button").forEach((button) => button.addEventListener("click", async () => {
  const editable = button.closest("fieldset").querySelector(".rich-editor");
  if (button.dataset.command === "insertImage") {
    await insertEditorImage(editable);
    return;
  }
  if (button.dataset.command === "insertYoutube" || button.dataset.command === "insertVimeo") {
    try { insertEmbed(editable, button.dataset.command === "insertYoutube" ? "youtube" : "vimeo"); }
    catch (error) { notify(error.message, "error"); }
    return;
  }
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
  const files = [...(form.querySelector('input[type="file"]')?.files || [])];
  const uploadGroups = await Promise.all(files.map(async (file) => {
    const uploaded = await uploadMedia(await prepareMedia(file));
    if (!file.type.startsWith("video/")) return [uploaded];
    try {
      const thumbnail = await uploadMedia(await makeVideoThumbnail(file));
      return [uploaded, { ...thumbnail, role: "thumbnail", videoKey: uploaded.key }];
    } catch (_) {
      // A rare unsupported codec still publishes the video; its card uses a
      // muted moving preview until the author replaces it with an MP4/WebM.
      notify("Video yüklendi; önizleme karesi oluşturulamadı. MP4 veya WebM ile tekrar deneyebilirsiniz.", "error");
      return [uploaded];
    }
  }));
  const uploadedMedia = uploadGroups.flat();
  const bodyMediaKeys = new Set([...mediaKeysInHtml(bodyTr), ...mediaKeysInHtml(bodyEn)]);
  const retainedInlineMedia = currentMedia.filter((media) => bodyMediaKeys.has(media.key));
  let nextMedia = uniqueMedia(removeExistingMedia ? inlineMedia : uploadedMedia.length ? [...uploadedMedia, ...retainedInlineMedia, ...inlineMedia] : [...currentMedia, ...inlineMedia]);
  let shouldUpdateMedia = uploadedMedia.length > 0 || inlineMedia.length > 0 || removeExistingMedia;
  if (currentType === "post" && !nextMedia.some((media) => media.role !== "share-tr" && media.role !== "share-en")) {
    const shareCards = await Promise.all(["tr", "en"].map(async (locale) => {
      const title = locale === "tr" ? common.titleTr : common.titleEn;
      return currentMedia.find((media) => media.role === `share-${locale}` && media.title === title) || createShareCard(title, locale);
    }));
    nextMedia = uniqueMedia([...nextMedia.filter((media) => media.role !== "share-tr" && media.role !== "share-en"), ...shareCards]);
    shouldUpdateMedia = true;
  }
  const payload = { ...common, type: currentType, category: currentType === "work" ? document.querySelector("#category").value : null, projectId: data.get("projectId") || null, eventStart: data.get("eventStart") || null, eventEnd: data.get("eventEnd") || null, ...(shouldUpdateMedia ? { media: nextMedia, hideFallbackVisual: removeExistingMedia && nextMedia.length === 0 && currentType === "work" } : {}) };
  const response = await fetch(editingItem ? `/studio/api/admin/content/${editingItem.id}` : "/studio/api/admin/content", { method: editingItem ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error("Yayınlama bağlantısı kurulamadı.");
}

document.querySelector("#save-draft").addEventListener("click", async () => { try { const wasEditing = Boolean(editingItem); await submit("draft"); notify(currentType === "about" ? "Hakkında sayfası kaydedildi." : wasEditing ? "İçerik düzenlendi ve taslak olarak kaydedildi." : "Taslak kaydedildi."); loadPublishedContent(); } catch (error) { notify(error.message || "Taslak kaydedilemedi.", "error"); } });
form.addEventListener("submit", async (event) => { event.preventDefault(); try { const wasEditing = Boolean(editingItem); await submit("published"); notify(currentType === "about" ? "Hakkında sayfası güncellendi." : wasEditing ? "İçerik düzenlendi ve yayınlandı." : "İçerik yayınlandı."); loadPublishedContent(); } catch (error) { notify(error.message || "İçerik yayınlanamadı.", "error"); } });
loadPublishedContent();
