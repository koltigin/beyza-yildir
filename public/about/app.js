const languageButton = document.querySelector(".page-language-toggle");
let language = "tr";
function renderSharedFooter() { const footer = document.querySelector("footer"); if (!footer) return; const copy = language === "en" ? { contact: "Contact", message: "Send a message" } : { contact: "İletişim", message: "Mesaj gönder" }; footer.className = "site-footer"; footer.innerHTML = `<p class="footer-name">Beyza Yıldır</p><div><p class="eyebrow">${copy.contact}</p><a href="/contact/">${copy.message}</a></div><div class="socials" aria-label="Sosyal medya"><a href="https://www.instagram.com/yildirworks" target="_blank" rel="noreferrer">Instagram &#8599;&#65038;</a><a href="https://vimeo.com/beyzayildir" target="_blank" rel="noreferrer">Vimeo &#8599;&#65038;</a><a href="https://youtube.com/@beyzayildir" target="_blank" rel="noreferrer">YouTube &#8599;&#65038;</a></div><p class="copyright">© ${new Date().getFullYear()} Beyza Yıldır</p>`; }

function renderLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-tr][data-en]").forEach((element) => { element.textContent = element.dataset[language]; });
  document.querySelectorAll(".bilingual-about section").forEach((section) => { section.hidden = section.lang !== language; });
  languageButton.innerHTML = language === "tr" ? "TR <span>/</span> EN" : "TR <span>/</span> EN";
  renderSharedFooter();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

languageButton.addEventListener("click", () => { language = language === "tr" ? "en" : "tr"; renderLanguage(); });
renderLanguage();
