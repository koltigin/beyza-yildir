(() => {
  const footerMarkup = (contact, socialLabel) => `<p class="footer-name">Beyza Yıldır</p><a class="footer-contact" href="/contact/">${contact}</a><nav class="social-icons" aria-label="${socialLabel}"><a href="https://www.instagram.com/yildirworks" target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="social-fill"/></svg></a><a href="https://vimeo.com/beyzayildir" target="_blank" rel="noreferrer" aria-label="Vimeo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5c2.2-2.6 4.8-3.9 6.5-3.9 2 0 2.4 1.5 3 4.7.7 3.8 1.1 5.3 1.7 5.3.7 0 2.1-1.7 4.4-5.1 1.1-1.7-.1-2.5-2.3-1.7.9-3.1 2.7-4.6 5-4.6 2.2 0 2.7 1.5 1.6 4.3-2.5 5.8-7.5 12.4-10.7 12.4-2.4 0-3.4-2-4.3-5.8C7 10.6 6.6 9.3 5.9 9.3c-.6 0-1.6.7-2.9 1.9Z"/></svg></a><a href="https://youtube.com/@beyzayildir" target="_blank" rel="noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10 9 5 3-5 3Z" class="social-fill"/></svg></a></nav><p class="copyright">© ${new Date().getFullYear()} Beyza Yıldır</p>`;
  const renderSharedFooter = (language) => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const copy = language === "en" ? { contact: "Contact", social: "Social media" } : { contact: "İletişim", social: "Sosyal medya" };
    footer.className = "site-footer";
    footer.innerHTML = footerMarkup(copy.contact, copy.social);
  };
  const publicStyles = document.querySelector('link[href*="pages.css"]');
  if (publicStyles) publicStyles.setAttribute("href", "/pages.css?v=20261024-page-menu");
  const toggle = document.querySelector(".page-language-toggle");
  if (!toggle) return;
  const actions = document.querySelector(".page-actions");
  const back = actions?.querySelector(".back");
  const header = document.querySelector(".bar");
  let menuToggle;
  let pageMenu;
  if (actions && back && header) {
    menuToggle = document.createElement("button");
    menuToggle.type = "button";
    menuToggle.className = "page-menu-toggle";
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-controls", "page-menu");
    menuToggle.innerHTML = '<span data-tr="Menü" data-en="Menu">Menü</span>';
    pageMenu = document.createElement("nav");
    pageMenu.id = "page-menu";
    pageMenu.className = "page-menu";
    pageMenu.setAttribute("aria-label", "Site navigation");
    pageMenu.innerHTML = '<a href="/" data-tr="Ana sayfa" data-en="Home">Ana sayfa</a><a href="/about/" data-tr="Hakkında" data-en="About">Hakkında</a><a href="/#works" data-tr="Çalışmalar" data-en="Works">Çalışmalar</a><a href="/blog/" data-tr="Blog" data-en="Blog">Blog</a><a href="/exhibitions/" data-tr="Sergiler" data-en="Exhibitions">Sergiler</a><a href="/awards/" data-tr="Ödüller" data-en="Awards">Ödüller</a><a href="/contact/" data-tr="İletişim" data-en="Contact">İletişim</a>';
    back.replaceWith(menuToggle);
    header.after(pageMenu);
    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!open));
      pageMenu.classList.toggle("is-open", !open);
    });
  }
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
    toggle.setAttribute("aria-label", language === "tr" ? "Aktif dil Türkçe. İngilizceye geç." : "Current language English. Switch to Turkish.");
    toggle.innerHTML = `<span class="${language === "tr" ? "is-active" : ""}">TR</span><span class="${language === "en" ? "is-active" : ""}">EN</span>`;
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
