(() => {
  const list = document.querySelector(".list");
  let awards = [];
  const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const plainText = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const urlLocale = location.pathname.match(/^\/(tr|en)(?:\/|$)/)?.[1];
  const language = () => urlLocale || localStorage.getItem("beyza-language") || "tr";
  const render = () => {
    const currentLanguage = language();
    if (!awards.length) { list.innerHTML = `<p class="archive-empty">${currentLanguage === "tr" ? "Henüz yayınlanmış bir ödül eklenmedi." : "No published awards have been added yet."}</p>`; return; }
    const locale = currentLanguage === "en" ? "en" : "tr";
    list.innerHTML = awards.map((award) => `<a class="entry award-entry" href="/${locale}/award/?id=${encodeURIComponent(award.id)}"><time>${escapeHtml(award.award_year || String(award.created_at || "").slice(0, 4))}</time><div><h2>${escapeHtml(currentLanguage === "tr" ? award.title_tr : award.title_en)}</h2><p>${escapeHtml(plainText(currentLanguage === "tr" ? award.body_tr : award.body_en))}</p><small>${currentLanguage === "tr" ? "Detayı aç ↗" : "Open detail ↗"}</small></div></a>`).join("");
  };
  fetch("/api/public/awards").then((response) => response.ok ? response.json() : Promise.reject()).then((payload) => { awards = Array.isArray(payload.awards) ? payload.awards : []; render(); }).catch(() => { list.innerHTML = '<p class="archive-empty">Ödüller şu anda yüklenemedi.</p>'; });
  document.addEventListener("beyza-language-change", render);
})();
