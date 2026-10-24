(() => {
  const root = document.querySelector("[data-category]");
  const archive = document.querySelector(".archive");
  if (!root || !archive) return;
  const category = root.dataset.category;
  const title = root.dataset.title || category;
  const locale = location.pathname.match(/^\/(tr|en)(?:\/|$)/)?.[1] || "tr";
  const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const render = (works, language) => {
    if (!works.length) {
      archive.innerHTML = `<p class="archive-empty" data-tr="${escapeHtml(title)} kategorisinde henüz yayınlanmış eser yok." data-en="There are no published works in ${escapeHtml(title)} yet.">${language === "tr" ? `${escapeHtml(title)} kategorisinde henüz yayınlanmış eser yok.` : `There are no published works in ${escapeHtml(title)} yet.`}</p>`;
      return;
    }
    archive.innerHTML = works.map((work) => {
      const mediaUrl = work.cover_key ? `/media/${encodeURIComponent(work.cover_key).replace(/%2F/g, "/")}` : "";
      const isVideo = /\.(mp4|webm|mov|ogv)$/i.test(String(work.cover_key || ""));
      const image = mediaUrl && !isVideo ? ` style="background-image:url('${mediaUrl}')"` : "";
      const workTitle = language === "tr" ? work.title_tr : work.title_en;
      return `<a class="tile" href="/${locale}/w/${encodeURIComponent(work.id)}"><figure${image}>${isVideo ? `<video src="${mediaUrl}" muted playsinline preload="metadata"></video>` : ""}</figure><p>${escapeHtml(work.category)} / ${escapeHtml(String(work.created_at).slice(0, 4))}</p><h2>${escapeHtml(workTitle)}</h2></a>`;
    }).join("");
  };
  let works = [];
  let language = locale;
  fetch(`/api/public/works?category=${encodeURIComponent(category)}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => { works = data.works || []; render(works, language); }).catch(() => render([], language));
  document.addEventListener("beyza-language-change", (event) => { language = event.detail.language; render(works, language); });
})();
