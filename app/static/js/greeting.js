/**
 * greeting.js — Soatga qarab salomlashish
 */
document.addEventListener("DOMContentLoaded", function () {
  const el = document.getElementById("greeting");
  if (!el) return;

  const hour = new Date().getHours();
  let greeting;
  let icon;

  if (hour >= 5 && hour < 9) {
    greeting = "Xayrli tong";
    icon = "🌅";
  } else if (hour >= 9 && hour < 12) {
    greeting = "Yaxshi tong";
    icon = "☀️";
  } else if (hour >= 12 && hour < 14) {
    greeting = "Xayrli tush";
    icon = "🌤️";
  } else if (hour >= 14 && hour < 18) {
    greeting = "Xayrli kun";
    icon = "🌞";
  } else if (hour >= 18 && hour < 21) {
    greeting = "Xayrli kechqurun";
    icon = "🌆";
  } else if (hour >= 21 && hour < 24) {
    greeting = "Xayrli oqshom";
    icon = "🌙";
  } else {
    greeting = "Xayrli tun";
    icon = "🌃";
  }

  el.textContent = icon + " " + greeting;
});
