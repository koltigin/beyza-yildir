const category = new URLSearchParams(location.search).get("category");
const query = category ? `?category=${encodeURIComponent(category.replace("-", " "))}` : "";
fetch(`/api/public/works${query}`).then((response) => response.ok ? response.json() : Promise.reject()).then(({ works }) => {
  if (!works?.length) return;
  document.querySelector(".archive").innerHTML = works.map((work) => `<a class="tile" href="../work/?id=${work.id}"><figure></figure><p>${work.category} / ${String(work.created_at).slice(0, 4)}</p><h2>${work.title_en}</h2></a>`).join("");
}).catch(() => {});
