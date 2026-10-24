const form = document.querySelector("#contact-form");
const footer = document.querySelector("footer");
const status = document.querySelector("#form-status");
const footerMarkup = `<p class="footer-name">Beyza Yıldır</p><a class="footer-contact" href="/contact/">İletişim</a><nav class="social-icons" aria-label="Sosyal medya"><a href="https://www.instagram.com/yildirworks" target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="social-fill"/></svg></a><a href="https://vimeo.com/beyzayildir" target="_blank" rel="noreferrer" aria-label="Vimeo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5c2.2-2.6 4.8-3.9 6.5-3.9 2 0 2.4 1.5 3 4.7.7 3.8 1.1 5.3 1.7 5.3.7 0 2.1-1.7 4.4-5.1 1.1-1.7-.1-2.5-2.3-1.7.9-3.1 2.7-4.6 5-4.6 2.2 0 2.7 1.5 1.6 4.3-2.5 5.8-7.5 12.4-10.7 12.4-2.4 0-3.4-2-4.3-5.8C7 10.6 6.6 9.3 5.9 9.3c-.6 0-1.6.7-2.9 1.9Z"/></svg></a><a href="https://youtube.com/@beyzayildir" target="_blank" rel="noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10 9 5 3-5 3Z" class="social-fill"/></svg></a></nav><p class="copyright">© ${new Date().getFullYear()} Beyza Yıldır</p>`;

const header = document.querySelector(".bar");
const back = header?.querySelector(".back");
if (header && back) {
  const menuToggle = document.createElement("button");
  menuToggle.type = "button";
  menuToggle.className = "page-menu-toggle";
  menuToggle.textContent = "Menü";
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-controls", "page-menu");
  const pageMenu = document.createElement("nav");
  pageMenu.id = "page-menu";
  pageMenu.className = "page-menu";
  pageMenu.setAttribute("aria-label", "Site navigation");
  pageMenu.innerHTML = '<a href="/">Ana sayfa</a><a href="/about/">Hakkında</a><a href="/#works">Çalışmalar</a><a href="/blog/">Blog</a><a href="/exhibitions/">Sergiler</a><a href="/awards/">Ödüller</a><a href="/contact/">İletişim</a>';
  back.replaceWith(menuToggle);
  header.after(pageMenu);
  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!open));
    pageMenu.classList.toggle("is-open", !open);
  });
}

if (footer) {
  footer.className = "site-footer";
  footer.innerHTML = footerMarkup;
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
