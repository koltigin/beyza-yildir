const categories = ["All", "Photography", "Collages", "Drawings", "Films", "Video art"];
const categoryLabels = { Photography: { tr: "Fotoğraf", en: "Photography" }, Collages: { tr: "Kolajlar", en: "Collages" }, Drawings: { tr: "Çizimler", en: "Drawings" }, Films: { tr: "Filmler", en: "Films" }, "Video art": { tr: "Video sanatı", en: "Video art" } };
const works = [
  { category: "Photography", year: "2026", tr: "Kırık Saatler", en: "Broken Clocks", className: "art-red" },
  { category: "Collages", year: "2026", tr: "İnce Sesler", en: "Thin Noises", className: "art-blue" },
  { category: "Drawings", year: "2025", tr: "Kendi Kendine", en: "To Itself", className: "art-paper" },
  { category: "Films", year: "2025", tr: "Kısa Devre", en: "Short Circuit", className: "art-film" },
  { category: "Video art", year: "2024", tr: "Daha Yüksek", en: "Louder", className: "art-lime" },
  { category: "Photography", year: "2024", tr: "Yüzey Gerilimi", en: "Surface Tension", className: "art-black" }
];
const posts = [
  { date: "18.09.2026", tr: "Punk, arşiv ve tekrar", en: "Punk, archive, repetition", trSummary: "Sesin ve görüntünün hafızası üzerine notlar.", enSummary: "Notes on the memory of sound and image." },
  { date: "02.08.2026", tr: "Stüdyoda bir gün", en: "A day in the studio", trSummary: "Yüzey, boya ve bekleme üzerine kısa bir günlük.", enSummary: "A short diary of surface, paint, and waiting." },
  { date: "16.06.2026", tr: "Kesip tekrar bakmak", en: "Cutting and looking again", trSummary: "Kolajın düşünme biçimleri hakkında.", enSummary: "On collage as a way of thinking." }
];
const plainText = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const excerpt = (value, limit = 118) => {
  const text = plainText(value);
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
};
let language = localStorage.getItem("beyza-language") || "tr";
let activeCategory = "All";
const $ = (selector) => document.querySelector(selector);

function renderWorks() {
  const grid = $("#works-grid");
  const template = $("#work-template");
  grid.innerHTML = "";
  works.filter((work) => activeCategory === "All" || work.category === activeCategory).forEach((work, index) => {
    const node = template.content.cloneNode(true);
    const art = node.querySelector(".art");
    art.classList.add(work.className);
    if (work.cover_key) {
      art.classList.add("has-image");
      art.style.backgroundImage = `url(/media/${encodeURIComponent(work.cover_key).replace(/%2F/g, "/")})`;
    }
    art.querySelector(".work-index").textContent = String(index + 1).padStart(2, "0");
    node.querySelector(".work-category").textContent = work.category;
    node.querySelector("h3").textContent = work[language];
    node.querySelector(".work-year").textContent = work.year;
    const categoryPath = { Photography: "photography", Collages: "collages", Drawings: "drawings", Films: "films", "Video art": "video-art" }[work.category];
    node.querySelector(".work-link").href = work.id ? `/work/?id=${encodeURIComponent(work.id)}` : `/${categoryPath}/`;
    grid.append(node);
  });
}
function renderCategories() {
  const nav = $("#category-nav");
  nav.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category === "All" ? (language === "tr" ? "Tümü" : "All") : categoryLabels[category][language];
    button.classList.toggle("is-active", category === activeCategory);
    button.addEventListener("click", () => { activeCategory = category; renderCategories(); renderWorks(); });
    nav.append(button);
  });
}
function renderPosts() {
  const list = $("#posts"); const template = $("#post-template"); list.innerHTML = "";
  posts.forEach((post) => { const node = template.content.cloneNode(true); node.querySelector(".post-date").textContent = post.date; node.querySelector("h3").textContent = post[language]; node.querySelector(".post-summary").textContent = excerpt(post[`${language}Summary`]); node.querySelector(".post-link").href = post.id ? `/post/?id=${encodeURIComponent(post.id)}` : "/post/"; list.append(node); });
}
function changeLanguage() {
  language = language === "tr" ? "en" : "tr";
  localStorage.setItem("beyza-language", language);
  document.documentElement.lang = language;
  document.querySelectorAll("[data-tr][data-en]").forEach((el) => { el.textContent = el.dataset[language]; });
  $(".language-toggle").innerHTML = language === "tr" ? "TR <span>/</span> EN" : "TR <span>/</span> EN";
  renderCategories(); renderWorks(); renderPosts();
}
$(".language-toggle").addEventListener("click", changeLanguage);
$(".menu-toggle").addEventListener("click", (event) => { const expanded = event.currentTarget.getAttribute("aria-expanded") === "true"; event.currentTarget.setAttribute("aria-expanded", String(!expanded)); $(".site-nav").classList.toggle("is-open", !expanded); });
document.querySelectorAll("[data-category-link]").forEach((link) => link.addEventListener("click", () => { activeCategory = link.dataset.categoryLink; renderCategories(); renderWorks(); }));
$("#year").textContent = new Date().getFullYear(); document.documentElement.lang = language; renderCategories(); renderWorks(); renderPosts();

// In local preview this keeps the authored sample content visible. On the
// production domain the Worker replaces it with published D1 content.
async function hydratePublishedContent() {
  try {
    const [worksResponse, postsResponse] = await Promise.all([
      fetch("/api/public/works"), fetch("/api/public/posts")
    ]);
    if (worksResponse.ok) {
      const payload = await worksResponse.json();
      if (Array.isArray(payload.works)) {
        works.splice(0, works.length, ...payload.works.map((item, index) => ({
          category: item.category,
          id: item.id,
          cover_key: item.cover_key,
          year: String(item.created_at || "").slice(0, 4),
          tr: item.title_tr,
          en: item.title_en,
          className: ["art-red", "art-blue", "art-paper", "art-film", "art-lime", "art-black"][index % 6]
        })));
        renderWorks();
      }
    }
    if (postsResponse.ok) {
      const payload = await postsResponse.json();
      if (Array.isArray(payload.posts)) {
        posts.splice(0, posts.length, ...payload.posts.map((item) => ({
          date: String(item.created_at || "").slice(0, 10), tr: item.title_tr, en: item.title_en,
          id: item.id,
          trSummary: item.body_tr, enSummary: item.body_en
        })));
        renderPosts();
      }
    }
  } catch (_) { /* Static GitHub Pages preview intentionally falls back to samples. */ }
}
hydratePublishedContent();
