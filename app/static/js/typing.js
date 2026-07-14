const words = JSON.parse(document.getElementById("wordsData").textContent);

let current = 0;
let correct = 0;
let wrong = 0;
let hintShown = false;

const answerInput = document.getElementById("answerInput");
const checkBtn = document.getElementById("checkBtn");
const continueBtn = document.getElementById("continueBtn");
const resultSection = document.getElementById("resultSection");
const hintText = document.getElementById("hintText");

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
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
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

function renderWord() {
  const w = words[current];
  document.getElementById("translationText").textContent = w.translation;

  // Reset
  answerInput.value = "";
  answerInput.disabled = false;
  answerInput.className = "form-control form-control-lg text-center";
  answerInput.style.borderRadius = "14px";
  answerInput.style.fontSize = "1.2rem";

  resultSection.classList.add("d-none");
  checkBtn.classList.remove("d-none");
  continueBtn.classList.add("d-none");
  hintText.textContent = "";
  hintShown = false;

  checkBtn.style.background = "#4a90d9";
  checkBtn.style.borderColor = "#4a90d9";

  updateProgress();

  // Avtomatik fokus
  setTimeout(() => answerInput.focus(), 100);
}

function showHint() {
  const word = words[current].word;
  // Birinchi harfni ko'rsatish
  const hint = word[0] + "_ ".repeat(word.length - 1).trim();
  hintText.textContent = `Maslahat: ${hint} (${word.length} harf)`;
  hintShown = true;
}

function checkAnswer() {
  const w = words[current];
  const userAnswer = answerInput.value.trim().toLowerCase();
  const correctAnswer = w.word.trim().toLowerCase();

  if (!userAnswer) {
    answerInput.focus();
    return;
  }

  const isCorrect = userAnswer === correctAnswer;

  answerInput.disabled = true;
  checkBtn.classList.add("d-none");
  continueBtn.classList.remove("d-none");
  resultSection.classList.remove("d-none");

  if (isCorrect) {
    correct++;
    answerInput.classList.add("is-valid");
    document.getElementById("resultIcon").textContent = "✅";
    document.getElementById("resultText").textContent = "To'g'ri!";
    document.getElementById("resultText").className = "fw-bold text-success";
    document.getElementById("correctAnswer").textContent = "";
    continueBtn.style.background = "#58cc02";
    continueBtn.style.borderColor = "#58cc02";
    playSound("correct");
    vibrate("correct");
  } else {
    wrong++;
    answerInput.classList.add("is-invalid");
    document.getElementById("resultIcon").textContent = "❌";
    document.getElementById("resultText").textContent = "Noto'g'ri!";
    document.getElementById("resultText").className = "fw-bold text-danger";
    document.getElementById("correctAnswer").textContent =
      `To'g'ri javob: ${w.word}`;
    continueBtn.style.background = "#ff4b4b";
    continueBtn.style.borderColor = "#ff4b4b";
    playSound("wrong");
    vibrate("wrong");
  }

  // Oxirgi so'z bo'lsa tugma matnini o'zgartirish
  if (current === words.length - 1) {
    continueBtn.innerHTML = 'Yakunlash <i class="bi bi-check-lg"></i>';
  }
}

function nextWord() {
  current++;
  if (current >= words.length) {
    showFinalResult();
  } else {
    renderWord();
  }
}

function showFinalResult() {
  document.getElementById("wordCard").classList.add("d-none");
  checkBtn.classList.add("d-none");
  continueBtn.classList.add("d-none");
  document.getElementById("progressBar").style.width = "100%";

  document.getElementById("correctCount").textContent = correct;
  document.getElementById("wrongCount").textContent = wrong;
  document.getElementById("finalResult").classList.remove("d-none");

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    if (correct > wrong) {
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
}

function restartTyping() {
  current = 0;
  correct = 0;
  wrong = 0;

  words.sort(() => Math.random() - 0.5);

  document.getElementById("wordCard").classList.remove("d-none");
  document.getElementById("finalResult").classList.add("d-none");
  checkBtn.classList.remove("d-none");
  continueBtn.classList.add("d-none");
  document.getElementById("progressBar").style.width = "0%";

  renderWord();
}

// Enter tugmasi bilan tekshirish
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (!checkBtn.classList.contains("d-none")) {
      checkAnswer();
    } else if (!continueBtn.classList.contains("d-none")) {
      nextWord();
    }
  }
});

renderWord();