const form = document.querySelector("#contact-form");
const status = document.querySelector("#form-status");
const locale = location.pathname.match(/^\/(tr|en)(?:\/|$)/)?.[1] || "tr";
const copy = locale === "en" ? {
  menu: "Menu", home: "Home", contact: "Contact", intro: "Leave a message for a project, exhibition, collaboration or simply a note.", name: "Your name", email: "Your email", message: "Your message", send: "Send message ↗", ready: "Your message will be sent directly to Beyza.", sending: "Sending…", sent: "Thank you — your message has been sent to Beyza.", failed: "Message could not be sent. Please try again."
} : { menu: "Menü", home: "Ana sayfa", contact: "İletişim", intro: "Bir proje, sergi, iş birliği ya da sadece bir not için mesaj bırak.", name: "Adın", email: "E-posta adresin", message: "Mesajın", send: "Mesaj gönder ↗", ready: "Mesajın doğrudan Beyza’ya iletilir.", sending: "Gönderiliyor…", sent: "Teşekkürler — mesajın Beyza’ya iletildi.", failed: "Mesaj gönderilemedi. Lütfen tekrar dene." };
document.documentElement.lang = locale;
document.querySelector(".contact h1").innerHTML = locale === "en" ? "Say<br />hello<em>.</em>" : "Merhaba<br />de<em>.</em>";
document.querySelector(".contact-intro").textContent = copy.intro;
const labels = form.querySelectorAll("label");
labels[0].childNodes[0].textContent = `${copy.name} `; labels[1].childNodes[0].textContent = `${copy.email} `; labels[2].childNodes[0].textContent = `${copy.message} `;
form.querySelector("button[type=submit]").textContent = copy.send;
status.textContent = copy.ready;
const footerMarkup = `<p class="footer-name">Beyza Yıldır</p><a class="footer-contact" href="/${locale}/contact/">${copy.contact}</a><nav class="social-icons" aria-label="${locale === "en" ? "Social media" : "Sosyal medya"}"><a href="https://www.instagram.com/yildirworks" target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="social-fill"/></svg></a><a href="https://vimeo.com/beyzayildir" target="_blank" rel="noreferrer" aria-label="Vimeo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5c2.2-2.6 4.8-3.9 6.5-3.9 2 0 2.4 1.5 3 4.7.7 3.8 1.1 5.3 1.7 5.3.7 0 2.1-1.7 4.4-5.1 1.1-1.7-.1-2.5-2.3-1.7.9-3.1 2.7-4.6 5-4.6 2.2 0 2.7 1.5 1.6 4.3-2.5 5.8-7.5 12.4-10.7 12.4-2.4 0-3.4-2-4.3-5.8C7 10.6 6.6 9.3 5.9 9.3c-.6 0-1.6.7-2.9 1.9Z"/></svg></a><a href="https://youtube.com/@beyzayildir" target="_blank" rel="noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="m10 9 5 3-5 3Z" class="social-fill"/></svg></a></nav><p class="copyright">© ${new Date().getFullYear()} Beyza Yıldır</p>`;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  status.textContent = copy.sending;
  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data))
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Mesaj gönderilemedi.");
    form.reset();
    status.textContent = copy.sent;
  } catch (error) {
    status.textContent = error.message || copy.failed;
  } finally {
    button.disabled = false;
  }
});
