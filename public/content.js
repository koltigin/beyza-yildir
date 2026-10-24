const contentId = new URLSearchParams(location.search).get("id");
const contentRoot = document.querySelector("main");

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function renderRelatedPosts(currentId, posts) {
  const locale = location.pathname.match(/^\/(tr|en)(?:\/|$)/)?.[1] || "tr";
  const related = posts.filter((post) => post.id !== currentId).slice(0, 3);
  if (!related.length) return "";
  const heading = locale === "tr" ? "Diğer yazılar" : "More writing";
  const linkLabel = locale === "tr" ? "Yazıyı oku" : "Read post";
  return `<aside class="related-posts" aria-label="${heading}"><p class="kicker">${heading}</p><div>${related.map((post) => `<a href="/${locale}/p/${encodeURIComponent(post.id)}"><span>${escapeHtml(String(post.created_at || "").slice(0, 10))}</span><strong>${escapeHtml(locale === "tr" ? post.title_tr : post.title_en)}</strong><small>${linkLabel} ↗</small></a>`).join("")}</div></aside>`;
}

if (contentId && contentRoot) {
  fetch(`/api/public/content/${encodeURIComponent(contentId)}`)
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then(({ content }) => {
      document.title = `${content.title_en} — Beyza Yıldır`;
      const artClass = { Photography: "photography", Collages: "collages", Drawings: "drawings", Films: "films", "Video art": "video-art" }[String(content.category)] || "default";
      const image = content.cover_key ? `<img class="content-image" src="/media/${encodeURIComponent(content.cover_key).replace(/%2F/g, "/")}" alt="${escapeHtml(content.title_en)}" />` : content.type === "work" ? `<div class="content-art content-art-${artClass}" role="img" aria-label="${escapeHtml(content.title_en)}"></div>` : "";
      const date = content.type === "exhibition" && content.event_start ? `${escapeHtml(content.event_start)}${content.event_end ? ` — ${escapeHtml(content.event_end)}` : ""}` : escapeHtml(String(content.created_at || "").slice(0, 10));
      const context = content.type === "exhibition" ? `<p class="kicker" data-language="tr">Etkinlik · ${date}</p><p class="kicker" data-language="en" hidden>Event · ${date}</p>` : `<p class="kicker">${escapeHtml(content.category || content.type)} · ${date}</p>`;
      contentRoot.innerHTML = `<section class="page-head">${context}<h1 data-language="tr">${escapeHtml(content.title_tr)}<em>.</em></h1><h1 data-language="en" hidden>${escapeHtml(content.title_en)}<em>.</em></h1></section>${image}<article class="prose"><section class="language-section" data-language="tr">${content.body_tr}</section><section class="language-section" data-language="en" hidden>${content.body_en}</section></article><div id="related-posts"></div>`;
      document.dispatchEvent(new CustomEvent("beyza-content-ready"));
      if (content.type === "post") {
        fetch("/api/public/posts")
          .then((response) => response.ok ? response.json() : Promise.reject())
          .then((payload) => {
            const target = document.querySelector("#related-posts");
            if (target && Array.isArray(payload.posts)) target.innerHTML = renderRelatedPosts(content.id, payload.posts);
          })
          .catch(() => {});
      }
    })
    .catch(() => {});
}
