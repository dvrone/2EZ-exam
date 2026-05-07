const percentage = parseInt(
  document.getElementById("percentageData").textContent,
);

// Foiz animatsiyasi
let current = 0;
const step = Math.max(1, Math.floor(percentage / 60));
const interval = setInterval(() => {
  current = Math.min(current + step, percentage);
  document.getElementById("percentText").textContent = current + "%";
  if (current >= percentage) clearInterval(interval);
}, 25);

// Sound
window.addEventListener("load", () => {
  setTimeout(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      if (percentage >= 70) {
        [523, 659, 784, 1047].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.connect(gain);
          osc.frequency.value = freq;
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
      } else {
        const osc = ctx.createOscillator();
        osc.connect(gain);
        osc.frequency.value = 400;
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {}
  }, 300);
});
