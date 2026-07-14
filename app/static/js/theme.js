/**
 * theme.js — Dark / Light mavzu boshqaruvi
 * Bootstrap 5.3 data-bs-theme atributiga asoslangan.
 */
document.addEventListener("DOMContentLoaded", function () {
  const html = document.documentElement;
  const btn = document.getElementById("themeToggle");

  function syncIcon() {
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (!icon) return;
    icon.className =
      html.getAttribute("data-bs-theme") === "dark"
        ? "bi bi-sun-fill"
        : "bi bi-moon-fill";
  }

  function syncThemeColor(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.setAttribute(
      "content",
      theme === "dark" ? "#1a2f38" : "#4a90d9"
    );
  }

  // Sahifa yuklanganda
  syncIcon();
  syncThemeColor(html.getAttribute("data-bs-theme"));

  if (btn) {
    btn.addEventListener("click", function () {
      const next =
        html.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
      html.setAttribute("data-bs-theme", next);
      localStorage.setItem("theme", next);
      syncIcon();
      syncThemeColor(next);
    });
  }

  // Bootstrap tooltiplarni ishga tushirish
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach(function (el) {
      new bootstrap.Tooltip(el);
    });
});
