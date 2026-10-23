(() => {
  const renderSharedFooter = (language) => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const copy = language === "en" ? { contact: "Contact", message: "Send a message" } : { contact: "İletişim", message: "Mesaj gönder" };
    footer.className = "site-footer";
    footer.innerHTML = `<p class="footer-name">Beyza Yıldır</p><div><p class="eyebrow">${copy.contact}</p><a href="/contact/">${copy.message}</a></div><div class="socials" aria-label="Sosyal medya"><a href="https://www.instagram.com/yildirworks" target="_blank" rel="noreferrer">Instagram &#8599;&#65038;</a><a href="https://vimeo.com/beyzayildir" target="_blank" rel="noreferrer">Vimeo &#8599;&#65038;</a><a href="https://youtube.com/@beyzayildir" target="_blank" rel="noreferrer">YouTube &#8599;&#65038;</a></div><p class="copyright">© ${new Date().getFullYear()} Beyza Yıldır</p>`;
  };
  const publicStyles = document.querySelector('link[href*="pages.css"]');
  if (publicStyles) publicStyles.setAttribute("href", "/pages.css?v=20261023-mobile4");
  const toggle = document.querySelector(".page-language-toggle");
  if (!toggle) return;
  let language = localStorage.getItem("beyza-language") || "tr";
  const setLanguage = (next) => {
    language = next;
    localStorage.setItem("beyza-language", language);
    document.documentElement.lang = language;
    document.querySelectorAll("[data-tr][data-en]").forEach((element) => {
      const copy = element.dataset[language];
      element.innerHTML = element.matches("h1") ? `${copy}<em>.</em>` : copy;
    });
    document.querySelectorAll("[data-language]").forEach((element) => { element.hidden = element.dataset.language !== language; });
    toggle.setAttribute("aria-pressed", String(language === "en"));
    toggle.innerHTML = "TR <span>/</span> EN";
    renderSharedFooter(language);
    document.dispatchEvent(new CustomEvent("beyza-language-change", { detail: { language } }));
  };
  toggle.addEventListener("click", () => setLanguage(language === "tr" ? "en" : "tr"));
  document.addEventListener("beyza-content-ready", () => setLanguage(language));
  setLanguage(language);

  // The public blog is driven by the same D1 records that appear in Studio.
  // This makes every demo item removable from the publishing panel.
  if (location.pathname.replace(/\/$/, "") === "/blog") {
    const list = document.querySelector(".list");
    let posts = [];
    const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
    const plainText = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const renderPosts = () => {
      if (!posts.length) {
        list.innerHTML = `<p class="archive-empty">${language === "tr" ? "Henüz yayınlanmış yazı yok." : "There are no published posts yet."}</p>`;
        return;
      }
      list.innerHTML = posts.map((post) => { const copy = plainText(language === "tr" ? post.body_tr : post.body_en); const summary = copy.length > 118 ? `${copy.slice(0, 118).trimEnd()}…` : copy; return `<a class="entry" href="../post/?id=${encodeURIComponent(post.id)}"><time>${escapeHtml(String(post.created_at || "").slice(0, 10))}</time><div><h2>${escapeHtml(language === "tr" ? post.title_tr : post.title_en)}</h2><p>${escapeHtml(summary)}</p></div></a>`; }).join("");
    };
    fetch("/api/public/posts").then((response) => response.ok ? response.json() : Promise.reject()).then((payload) => { posts = Array.isArray(payload.posts) ? payload.posts : []; renderPosts(); }).catch(() => {});
    document.addEventListener("beyza-language-change", renderPosts);
  }
})();
