const category = new URLSearchParams(location.search).get("category");
const query = category ? `?category=${encodeURIComponent(category.replace("-", " "))}` : "";
const locale = location.pathname.match(/^\/(tr|en)(?:\/|$)/)?.[1] || "tr";
const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
let works = [];
function render() {
  const language = locale;
  const archive = document.querySelector(".archive");
  if (!works.length) { archive.innerHTML = `<p class="archive-empty">${language === "tr" ? "Henüz yayınlanmış eser yok." : "There are no published works yet."}</p>`; return; }
  archive.innerHTML = works.map((work) => {
    const mediaUrl = work.cover_key ? `/media/${encodeURIComponent(work.cover_key).replace(/%2F/g, "/")}` : "";
    const isVideo = /\.(mp4|webm|mov|ogv)$/i.test(String(work.cover_key || ""));
    const image = mediaUrl && !isVideo ? ` style="background-image:url('${mediaUrl}')"` : "";
    return `<a class="tile" href="/${locale}/w/${encodeURIComponent(work.id)}"><figure${image}>${isVideo ? `<video src="${mediaUrl}" muted playsinline preload="metadata"></video>` : ""}</figure><p>${escapeHtml(work.category)} / ${escapeHtml(String(work.created_at).slice(0, 4))}</p><h2>${escapeHtml(language === "tr" ? work.title_tr : work.title_en)}</h2></a>`;
  }).join("");
}
fetch(`/api/public/works${query}`).then((response) => response.ok ? response.json() : Promise.reject()).then((payload) => { works = payload.works || []; render(); }).catch(render);
