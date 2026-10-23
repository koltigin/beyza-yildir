const footer = document.querySelector("footer");
if (footer) footer.className = "site-footer", footer.innerHTML = `<p class="footer-name">Beyza Yıldır</p><div><p class="eyebrow">İletişim</p><a href="/contact/">Mesaj gönder</a></div><div class="socials" aria-label="Sosyal medya"><a href="https://www.instagram.com/yildirworks" target="_blank" rel="noreferrer">Instagram &#8599;&#65038;</a><a href="https://vimeo.com/beyzayildir" target="_blank" rel="noreferrer">Vimeo &#8599;&#65038;</a><a href="https://youtube.com/@beyzayildir" target="_blank" rel="noreferrer">YouTube &#8599;&#65038;</a></div><p class="copyright">© ${new Date().getFullYear()} Beyza Yıldır</p>`;
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
