const languageButton = document.querySelector(".page-language-toggle");
let language = "tr";

function renderLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-tr][data-en]").forEach((element) => { element.textContent = element.dataset[language]; });
  document.querySelectorAll(".bilingual-about section").forEach((section) => { section.hidden = section.lang !== language; });
  languageButton.innerHTML = language === "tr" ? "TR <span>/</span> EN" : "TR <span>/</span> EN";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

languageButton.addEventListener("click", () => { language = language === "tr" ? "en" : "tr"; renderLanguage(); });
renderLanguage();
