const languageButton = document.querySelector(".page-language-toggle");
let language = localStorage.getItem("beyza-language") || "tr";

const footerMarkup = (contact, socialLabel) => `<p class="footer-name">Beyza Yıldır</p><a class="footer-contact" href="/contact/">${contact}</a><nav class="social-icons" aria-label="${socialLabel}"><a href="https://www.instagram.com/yildirworks" target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="social-fill"/></svg></a><a href="https://vimeo.com/beyzayildir" target="_blank" rel="noreferrer" aria-label="Vimeo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5c2.2-2.6 4.8-3.9 6.5-3.9 2 0 2.4 1.5 3 4.7.7 3.8 1.1 5.3 1.7 5.3.7 0 2.1-1.7 4.4-5.1 1.1-1.7-.1-2.5-2.3-1.7.9-3.1 2.7-4.6 5-4.6 2.2 0 2.7 1.5 1.6 4.3-2.5 5.8-7.5 12.4-10.7 12.4-2.4 0-3.4-2-4.3-5.8C7 10.6 6.6 9.3 5.9 9.3c-.6 0-1.6.7-2.9 1.9Z"/></svg></a><a href="https://youtube.com/@beyzayildir" target="_blank" rel="noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10 9 5 3-5 3Z" class="social-fill"/></svg></a></nav><p class="copyright">© ${new Date().getFullYear()} Beyza Yıldır</p>`;

function renderSharedFooter() {
  const footer = document.querySelector("footer");
  if (!footer) return;
  const copy = language === "en" ? { contact: "Contact", social: "Social media" } : { contact: "İletişim", social: "Sosyal medya" };
  footer.className = "site-footer";
  footer.innerHTML = footerMarkup(copy.contact, copy.social);
}

function renderLanguage({ scroll = false } = {}) {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-tr][data-en]").forEach((element) => { const copy = element.dataset[language]; element.innerHTML = element.matches("h1") ? `${copy}<em>.</em>` : copy; });
  document.querySelectorAll(".bilingual-about section").forEach((section) => { section.hidden = section.lang !== language; });
  languageButton.innerHTML = "TR <span>/</span> EN";
  renderSharedFooter();
  if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

languageButton.addEventListener("click", () => { language = language === "tr" ? "en" : "tr"; localStorage.setItem("beyza-language", language); renderLanguage({ scroll: true }); });
fetch("/api/public/page/about").then((response) => response.ok ? response.json() : Promise.reject()).then(({ page }) => {
  document.querySelector("#about-tr").innerHTML = page.body_tr;
  document.querySelector("#about-en").innerHTML = page.body_en;
  renderLanguage();
}).catch(() => renderLanguage());
