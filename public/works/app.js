const category = new URLSearchParams(location.search).get("category");
const query = category ? `?category=${encodeURIComponent(category.replace("-", " "))}` : "";
const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
fetch(`/api/public/works${query}`).then((response) => response.ok ? response.json() : Promise.reject()).then(({ works }) => {
  if (!works?.length) return;
  document.querySelector(".archive").innerHTML = works.map((work) => {
    const image = work.cover_key ? ` style="background-image:url('/media/${encodeURIComponent(work.cover_key).replace(/%2F/g, "/")}')"` : "";
    return `<a class="tile" href="../work/?id=${encodeURIComponent(work.id)}"><figure${image}></figure><p>${escapeHtml(work.category)} / ${escapeHtml(String(work.created_at).slice(0, 4))}</p><h2>${escapeHtml(work.title_en)}</h2></a>`;
  }).join("");
}).catch(() => {});
