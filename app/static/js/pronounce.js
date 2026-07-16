const words = JSON.parse(document.getElementById("wordsData").textContent);

let current = 0;
let correct = 0;
let wrong = 0;
let recognition = null;
let isListening = false;

function checkSupport() {
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    document.getElementById("notSupported").classList.remove("d-none");
    document.getElementById("micSection").classList.add("d-none");
    return false;
  }
  return true;
}

function speakWord() {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(words[current].word);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } catch (e) { }
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
  } catch (e) { }
}

function vibrate(type) {
  try {
    if (!navigator.vibrate) return;
    navigator.vibrate(type === "correct" ? 100 : [100, 50, 100]);
  } catch (e) { }
}

function updateProgress() {
  const percent = (current / words.length) * 100;
  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("currentNum").textContent = current + 1;
}

function renderWord() {
  const w = words[current];

  // So'z va tarjima
  document.getElementById("wordText").textContent = w.word;
  document.getElementById("translationText").textContent = w.translation;

  // Border reset
  const card = document.getElementById("wordCard");
  card.style.border = "";
  card.style.transition = "border 0.3s ease";

  // Elementlarni ko'rsatish/yashirish
  document.getElementById("resultSection").classList.add("d-none");
  document.getElementById("actionBtns").classList.add("d-none");
  document.getElementById("micSection").classList.remove("d-none");

  // Mikrofon tugmasini reset
  const micBtn = document.getElementById("micBtn");
  micBtn.classList.remove("btn-danger");
  micBtn.classList.add("btn-success");
  micBtn.innerHTML = '<i class="bi bi-mic-fill"></i>';
  micBtn.disabled = false;

  document.getElementById("micHint").textContent =
    "Mikrofon tugmasini bosib so'zni ayting";

  // Result matnlarni tozalash
  document.getElementById("resultText").textContent = "";
  document.getElementById("spokenText").textContent = "";

  updateProgress();
}

function startListening() {
  if (isListening) {
    stopListening();
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;

  isListening = true;

  const micBtn = document.getElementById("micBtn");
  micBtn.classList.remove("btn-success");
  micBtn.classList.add("btn-danger");
  micBtn.innerHTML = '<i class="bi bi-stop-fill"></i>';
  document.getElementById("micHint").textContent =
    "Tinglayapman... So'zni ayting";

  recognition.onresult = (event) => {
    isListening = false;
    const results = Array.from(event.results[0]).map((r) =>
      r.transcript.trim().toLowerCase()
    );
    const target = words[current].word.toLowerCase().trim();
    const isCorrect = results.some(
      (r) => r === target || r.includes(target) || target.includes(r)
    );
    showResult(isCorrect, results[0]);
  };

  recognition.onerror = (event) => {
    isListening = false;
    stopListening();
    const micBtn = document.getElementById("micBtn");
    micBtn.classList.remove("btn-danger");
    micBtn.classList.add("btn-success");
    micBtn.innerHTML = '<i class="bi bi-mic-fill"></i>';

    if (event.error === "no-speech") {
      document.getElementById("micHint").textContent =
        "Ovoz eshitilmadi. Qayta urinib ko'ring.";
    } else if (event.error === "not-allowed") {
      document.getElementById("micHint").textContent =
        "Mikrofonga ruxsat berilmagan!";
    }
  };

  recognition.onend = () => {
    isListening = false;
    const micBtn = document.getElementById("micBtn");
    micBtn.classList.remove("btn-danger");
    micBtn.classList.add("btn-success");
    micBtn.innerHTML = '<i class="bi bi-mic-fill"></i>';
  };

  recognition.start();
}

function stopListening() {
  if (recognition) {
    try { recognition.stop(); } catch (e) { }
    recognition = null;
  }
  isListening = false;
}

function showResult(isCorrect, spoken) {
  // Mikrofon yashirish
  document.getElementById("micSection").classList.add("d-none");

  // Natija ko'rsatish
  document.getElementById("resultSection").classList.remove("d-none");
  document.getElementById("actionBtns").classList.remove("d-none");
  document.getElementById("spokenText").textContent = spoken || "—";

  const card = document.getElementById("wordCard");

  if (isCorrect) {
    correct++;
    card.style.border = "2.5px solid #58cc02";
    card.style.borderRadius = "16px";
    document.getElementById("resultText").textContent = "To'g'ri talaffuz!";
    document.getElementById("resultText").className = "fw-bold text-success";
    playSound("correct");
    vibrate("correct");
  } else {
    wrong++;
    card.style.border = "2.5px solid #ff4b4b";
    card.style.borderRadius = "16px";
    document.getElementById("resultText").textContent = "Noto'g'ri. Qayta urinib ko'ring!";
    document.getElementById("resultText").className = "fw-bold text-danger";
    playSound("wrong");
    vibrate("wrong");
  }
}

function nextWord() {
  stopListening();
  current++;
  if (current >= words.length) {
    showFinalResult();
  } else {
    renderWord();
  }
}

function showFinalResult() {
  document.getElementById("wordCard").classList.add("d-none");
  document.getElementById("actionBtns").classList.add("d-none");
  document.getElementById("micSection").classList.add("d-none");
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
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.frequency.value = freq;
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  } catch (e) { }
}

function restartPronounce() {
  current = 0;
  correct = 0;
  wrong = 0;

  words.sort(() => Math.random() - 0.5);

  document.getElementById("wordCard").classList.remove("d-none");
  document.getElementById("finalResult").classList.add("d-none");
  document.getElementById("progressBar").style.width = "0%";

  renderWord();
}

// Boshlash
if (checkSupport()) {
  renderWord();
}

function retryWord() {
  stopListening();
  // Joriy so'zni qayta ko'rsatish — current o'zgarmaydi
  renderWord();
}