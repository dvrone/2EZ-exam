const toggle = document.getElementById("themeToggle");
const html = document.documentElement;

// Saqlangan temani yuklash
const saved = localStorage.getItem("theme") || "light";
html.setAttribute("data-bs-theme", saved);
updateIcon(saved);

toggle.addEventListener("click", () => {
  const current = html.getAttribute("data-bs-theme");
  const next = current === "light" ? "dark" : "light";
  html.setAttribute("data-bs-theme", next);
  localStorage.setItem("theme", next);
  updateIcon(next);
});

function updateIcon(theme) {
  toggle.innerHTML =
    theme === "dark"
      ? '<i class="bi bi-sun-fill"></i>'
      : '<i class="bi bi-moon-fill"></i>';
}
