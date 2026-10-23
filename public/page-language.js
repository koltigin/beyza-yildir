(() => {
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
    document.dispatchEvent(new CustomEvent("beyza-language-change", { detail: { language } }));
  };
  toggle.addEventListener("click", () => setLanguage(language === "tr" ? "en" : "tr"));
  document.addEventListener("beyza-content-ready", () => setLanguage(language));
  setLanguage(language);
})();
