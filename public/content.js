const contentId = new URLSearchParams(location.search).get("id");
const contentRoot = document.querySelector("main");

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

if (contentId && contentRoot) {
  fetch(`/api/public/content/${encodeURIComponent(contentId)}`)
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then(({ content }) => {
      document.title = `${content.title_en} — Beyza Yıldır`;
      const artClass = { Photography: "photography", Collages: "collages", Drawings: "drawings", Films: "films", "Video art": "video-art" }[String(content.category)] || "default";
      const image = content.cover_key ? `<img class="content-image" src="/media/${encodeURIComponent(content.cover_key).replace(/%2F/g, "/")}" alt="${escapeHtml(content.title_en)}" />` : content.type === "work" ? `<div class="content-art content-art-${artClass}" role="img" aria-label="${escapeHtml(content.title_en)}"></div>` : "";
      const date = content.type === "exhibition" && content.event_start ? `${escapeHtml(content.event_start)}${content.event_end ? ` — ${escapeHtml(content.event_end)}` : ""}` : escapeHtml(String(content.created_at || "").slice(0, 10));
      contentRoot.innerHTML = `<section class="page-head"><p class="kicker">${escapeHtml(content.category || content.type)} · ${date}</p><h1 data-language="tr">${escapeHtml(content.title_tr)}<em>.</em></h1><h1 data-language="en" hidden>${escapeHtml(content.title_en)}<em>.</em></h1></section>${image}<article class="prose"><section class="language-section" data-language="tr"><p class="kicker">Türkçe</p><h2>${escapeHtml(content.title_tr)}</h2>${content.body_tr}</section><section class="language-section" data-language="en" hidden><p class="kicker">English</p><h2>${escapeHtml(content.title_en)}</h2>${content.body_en}</section></article>`;
      document.dispatchEvent(new CustomEvent("beyza-content-ready"));
    })
    .catch(() => {});
}
