const form = document.querySelector("#contact-form");
const footer = document.querySelector("footer");
const status = document.querySelector("#form-status");

if (footer) {
  footer.className = "site-footer";
  footer.innerHTML = `<p class="footer-name">Beyza Yıldır</p><div><p class="eyebrow">İletişim</p><a href="/contact/">Mesaj gönder</a></div><div class="socials" aria-label="Sosyal medya"><a href="https://www.instagram.com/yildirworks" target="_blank" rel="noreferrer">Instagram ↗</a><a href="https://vimeo.com/beyzayildir" target="_blank" rel="noreferrer">Vimeo ↗</a><a href="https://youtube.com/@beyzayildir" target="_blank" rel="noreferrer">YouTube ↗</a></div><p class="copyright">© ${new Date().getFullYear()} Beyza Yıldır</p>`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  status.textContent = "Gönderiliyor…";
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data))
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Mesaj gönderilemedi.");
    form.reset();
    status.textContent = "Teşekkürler — mesajın Beyza’ya iletildi.";
  } catch (error) {
    status.textContent = error.message || "Mesaj gönderilemedi. Lütfen tekrar dene.";
  } finally {
    button.disabled = false;
  }
});
