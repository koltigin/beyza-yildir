fetch("/api/public/page/about")
  .then((response) => response.ok ? response.json() : Promise.reject())
  .then(({ page }) => {
    document.querySelector("#about-tr").innerHTML = page.body_tr;
    document.querySelector("#about-en").innerHTML = page.body_en;
  })
  .catch(() => {})
  .finally(() => document.dispatchEvent(new CustomEvent("beyza-content-ready")));
