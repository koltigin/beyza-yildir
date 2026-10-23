from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto("http://127.0.0.1:4173", wait_until="networkidle")
    assert page.locator("h1").inner_text() == "Beyza\nYıldır"
    page.get_by_role("button", name="Collages").click()
    assert page.locator(".work-card").count() == 1
    page.get_by_role("button", name="Switch language").click()
    assert "Visual artist" in page.locator(".eyebrow").first.inner_text()
    page.get_by_role("button", name="Menu +").click()
    assert page.locator("#site-nav").evaluate("node => node.classList.contains('is-open')")
    page.screenshot(path="/tmp/beyza-home-mobile.png", full_page=True)
    page.goto("http://127.0.0.1:4173/studio/", wait_until="networkidle")
    page.get_by_role("button", name="New work ↗").click()
    assert not page.locator(".editor").is_hidden()
    assert not errors, errors
    browser.close()
