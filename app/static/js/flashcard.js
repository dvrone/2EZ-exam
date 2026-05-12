const words = JSON.parse(document.getElementById("wordsData").textContent);

let current = 0;
let known = 0;
let unknown = 0;
let flipped = false;

// TTS — xavfsiz
function speak(text) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } catch (e) {}
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "correct") {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
}

function vibrate(type) {
  try {
    if (!navigator.vibrate) return;
    navigator.vibrate(type === "correct" ? 100 : [100, 50, 100]);
  } catch (e) {}
}

function updateProgress() {
  const percent = (current / words.length) * 100;
  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("currentNum").textContent = current + 1;
}

function renderCard() {
  flipped = false;
  const w = words[current];
  const card = document.getElementById("flashcard");

  card.classList.remove("slide-in");
  void card.offsetWidth;
  card.classList.add("slide-in");

  document.getElementById("wordText").textContent = w.word;
  document.getElementById("translationText").textContent = w.translation;
  document.getElementById("exampleText").textContent = w.example || "";

  // Front ko'rsatish, back yashirish
  document.getElementById("cardFront").style.display = "block";
  document.getElementById("cardBack").style.display = "none";
  document.getElementById("actionBtns").classList.add("d-none");

  card.style.borderColor = "";
  updateProgress();
}

function flipCard() {
  if (flipped) return;
  flipped = true;

  document.getElementById("cardFront").style.display = "none";
  document.getElementById("cardBack").style.display = "block";
  document.getElementById("actionBtns").classList.remove("d-none");

  document.getElementById("flashcard").style.borderColor = "#4a90d9";
}

function nextWord(didKnow) {
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}

  if (didKnow) {
    known++;
    playSound("correct");
    vibrate("correct");
  } else {
    unknown++;
    playSound("wrong");
    vibrate("wrong");
  }

  current++;

  if (current >= words.length) {
    showResult();
  } else {
    renderCard();
  }
}

function showResult() {
  document.getElementById("flashcard").classList.add("d-none");
  document.getElementById("actionBtns").classList.add("d-none");
  document.getElementById("progressBar").style.width = "100%";
  document.getElementById("knownCount").textContent = known;
  document.getElementById("unknownCount").textContent = unknown;
  document.getElementById("resultDiv").classList.remove("d-none");

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.frequency.value = freq;
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  } catch (e) {}
}

function restartFlashcard() {
  current = 0;
  known = 0;
  unknown = 0;
  words.sort(() => Math.random() - 0.5);
  document.getElementById("flashcard").classList.remove("d-none");
  document.getElementById("resultDiv").classList.add("d-none");
  document.getElementById("progressBar").style.width = "0%";
  renderCard();
}

document.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    if (!flipped) flipCard();
  } else if (e.key === "ArrowLeft") {
    if (flipped) nextWord(false);
  } else if (e.key === "ArrowRight") {
    if (flipped) nextWord(true);
  }
});

renderCard();
