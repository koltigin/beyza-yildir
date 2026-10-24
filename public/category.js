(() => {
  const root = document.querySelector("[data-category]");
  const archive = document.querySelector(".archive");
  if (!root || !archive) return;
  const category = root.dataset.category;
  const title = root.dataset.title || category;
  const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const render = (works, language) => {
    if (!works.length) {
      archive.innerHTML = `<p class="archive-empty" data-tr="${escapeHtml(title)} kategorisinde henüz yayınlanmış eser yok." data-en="There are no published works in ${escapeHtml(title)} yet.">${language === "tr" ? `${escapeHtml(title)} kategorisinde henüz yayınlanmış eser yok.` : `There are no published works in ${escapeHtml(title)} yet.`}</p>`;
      return;
    }
    archive.innerHTML = works.map((work) => {
      const image = work.cover_key ? ` style="background-image:url('/media/${encodeURIComponent(work.cover_key).replace(/%2F/g, "/")}')"` : "";
      const workTitle = language === "tr" ? work.title_tr : work.title_en;
      return `<a class="tile" href="../w/${encodeURIComponent(work.id)}"><figure${image}></figure><p>${escapeHtml(work.category)} / ${escapeHtml(String(work.created_at).slice(0, 4))}</p><h2>${escapeHtml(workTitle)}</h2></a>`;
    }).join("");
  };
  let works = [];
  let language = localStorage.getItem("beyza-language") || "tr";
  fetch(`/api/public/works?category=${encodeURIComponent(category)}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => { works = data.works || []; render(works, language); }).catch(() => render([], language));
  document.addEventListener("beyza-language-change", (event) => { language = event.detail.language; render(works, language); });
})();
