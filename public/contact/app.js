const form = document.querySelector("#contact-form");
const footer = document.querySelector("footer");
if (footer) footer.className = "site-footer", footer.innerHTML = `<p class="footer-name">Beyza Yıldır</p><div><p class="eyebrow">İletişim</p><a href="/contact/">Mesaj gönder</a></div><div class="socials" aria-label="Sosyal medya"><a href="https://www.instagram.com/yildirworks" target="_blank" rel="noreferrer">Instagram &#8599;&#65038;</a><a href="https://vimeo.com/beyzayildir" target="_blank" rel="noreferrer">Vimeo &#8599;&#65038;</a><a href="https://youtube.com/@beyzayildir" target="_blank" rel="noreferrer">YouTube &#8599;&#65038;</a></div><p class="copyright">© ${new Date().getFullYear()} Beyza Yıldır</p>`;
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const subject = `Website message from ${data.get("name")}`;
  const body = `Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\n${data.get("message")}`;
  window.location.href = `mailto:yildirbeyza@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
