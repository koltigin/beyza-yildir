const list = document.querySelector(".list");
let exhibitions = [];
const localePrefix = location.pathname.match(/^\/(tr|en)(?:\/|$)/)?.[1] || "tr";

const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const plainText = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const formatDate = (value, locale) => value ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "";

function render() {
  const language = localePrefix;
  if (!exhibitions.length) {
    list.innerHTML = `<p class="archive-empty">${language === "tr" ? "Henüz yayınlanmış etkinlik yok." : "There are no published events yet."}</p>`;
    return;
  }
  list.innerHTML = exhibitions.map((event) => {
    const locale = language === "tr" ? "tr-TR" : "en-GB";
    const start = formatDate(event.event_start, locale);
    const end = formatDate(event.event_end, locale);
    const dates = end ? `${start} — ${end}` : start;
    const title = language === "tr" ? event.title_tr : event.title_en;
    const summary = plainText(language === "tr" ? event.body_tr : event.body_en);
    return `<a class="entry" href="/${localePrefix}/e/${encodeURIComponent(event.id)}"><time>${escapeHtml(dates)}</time><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(summary)}</p></div></a>`;
  }).join("");
}

fetch("/api/public/exhibitions")
  .then((response) => response.ok ? response.json() : Promise.reject())
  .then((payload) => { exhibitions = Array.isArray(payload.exhibitions) ? payload.exhibitions : []; render(); })
  .catch(() => { list.innerHTML = '<p class="archive-empty">Etkinlikler şu anda yüklenemedi.</p>'; });

document.addEventListener("beyza-language-change", render);
