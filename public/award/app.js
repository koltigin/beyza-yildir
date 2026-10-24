(() => {
  const root = document.querySelector("main");
  const id = new URLSearchParams(location.search).get("id");
  const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  if (!id || !root) return;
  fetch(`/api/public/award/${encodeURIComponent(id)}`)
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then(({ award }) => {
      const year = escapeHtml(award.award_year || String(award.created_at || "").slice(0, 4));
      root.innerHTML = `<section class="page-head"><p class="kicker">${year}</p><h1 data-language="tr">${escapeHtml(award.title_tr)}<em>.</em></h1><h1 data-language="en" hidden>${escapeHtml(award.title_en)}<em>.</em></h1></section><article class="prose"><section class="language-section" data-language="tr">${award.body_tr}</section><section class="language-section" data-language="en" hidden>${award.body_en}</section></article>`;
      document.dispatchEvent(new CustomEvent("beyza-content-ready"));
    })
    .catch(() => { root.innerHTML = '<section class="prose"><p>Ödül bulunamadı.</p></section>'; });
})();
