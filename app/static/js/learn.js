// Meta ma'lumotlar
const meta = JSON.parse(document.getElementById("learnMeta").textContent);
const allWords = JSON.parse(document.getElementById("wordsData").textContent);

const STEPS = ["flashcard", "quiz", "pronunciation", "writing"];

let words = [];
let current = 0;
let currentStep = "flashcard";
let recognition = null;
let isListening = false;
let quizAnswered = false;
let fcFlipped = false;
let wrChecked = false;

// ========================
// Init
// ========================
async function init() {
  try {
    const res = await fetch(meta.state_url);
    const state = await res.json();

    if (state.completed_count > 0 && state.completed_count < state.total) {
      const resume = confirm(
        `Siz ${state.completed_count}/${state.total} so'zni o'rgangansiz. Davom ettirasizmi?`
      );
      if (resume) {
        // Tugallanmagan so'zlardan boshlash
        const completedIds = new Set();
        const progressRes = await fetch(meta.state_url);
        const progressData = await progressRes.json();

        words = allWords.filter((w) => {
          if (w.id === state.resume_word_id) {
            currentStep = state.resume_step;
            return true;
          }
          return false;
        });

        // Tugallanmagan va boshlanmagan so'zlarni qo'shish
        const resumeIdx = allWords.findIndex(
          (w) => w.id === state.resume_word_id
        );
        words = allWords.slice(resumeIdx);
        currentStep = state.resume_step;
        current = 0;
      } else {
        await resetProgress();
        words = [...allWords];
        current = 0;
        currentStep = "flashcard";
      }
    } else if (state.completed_count === state.total && state.total > 0) {
      // Hammasi tugallangan
      words = [...allWords];
      showFinalResult();
      return;
    } else {
      words = [...allWords];
      current = 0;
      currentStep = "flashcard";
    }
  } catch (e) {
    words = [...allWords];
    current = 0;
    currentStep = "flashcard";
  }

  updateProgress();
  renderStep();
}

async function resetProgress() {
  // Serverda progress reset — yangi boshlash
  for (const w of allWords) {
    await saveProgress(w.id, "flashcard");
  }
}

// ========================
// Progress
// ========================
async function saveProgress(vocab_id, step) {
  try {
    await fetch(meta.save_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocab_id, current_step: step }),
    });
  } catch (e) {}
}

// ========================
// UI helpers
// ========================
function updateProgress() {
  const globalIdx = allWords.findIndex((w) => w.id === words[current]?.id);
  const percent = ((globalIdx + 1) / allWords.length) * 100;
  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("currentNum").textContent = globalIdx + 1;
}

function updateStepIndicator() {
  STEPS.forEach((s) => {
    const el = document.getElementById(`step-${s}`);
    if (el) {
      el.className =
        s === currentStep ? "badge bg-primary" : "badge bg-secondary opacity-50";
    }
  });
}

function hideAllSteps() {
  document.getElementById("stepFlashcard").classList.add("d-none");
  document.getElementById("stepQuiz").classList.add("d-none");
  document.getElementById("stepPronunciation").classList.add("d-none");
  document.getElementById("stepWriting").classList.add("d-none");
}

function setMainBtn(text, color = "#4a90d9", disabled = false) {
  const btn = document.getElementById("mainBtn");
  btn.innerHTML = text;
  btn.style.background = color;
  btn.style.borderColor = color;
  btn.disabled = disabled;
  btn.classList.remove("d-none");
}

function setCardBorder(type) {
  const card = document.getElementById("learnCard");
  card.classList.remove("border-success-custom", "border-danger-custom");
  if (type === "correct") card.classList.add("border-success-custom");
  if (type === "wrong") card.classList.add("border-danger-custom");
  if (type === "reset") card.style.border = "";
}

// ========================
// Sound & Vibrate
// ========================
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

function speakWord() {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const w = words[current];
    const utterance = new SpeechSynthesisUtterance(w.word);
    utterance.lang = "en-US";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  } catch (e) {}
}

// ========================
// Render step
// ========================
function renderStep() {
  hideAllSteps();
  updateStepIndicator();
  setCardBorder("reset");

  const w = words[current];

  if (currentStep === "flashcard") renderFlashcard(w);
  else if (currentStep === "quiz") renderQuiz(w);
  else if (currentStep === "pronunciation") renderPronunciation(w);
  else if (currentStep === "writing") renderWriting(w);
}

// ========================
// Flashcard
// ========================
function renderFlashcard(w) {
  fcFlipped = false;

  document.getElementById("stepFlashcard").classList.remove("d-none");
  document.getElementById("fc-word").textContent = w.word;
  document.getElementById("fc-ipa").textContent = w.ipa ? `/${w.ipa}/` : "";
  document.getElementById("fc-category").textContent = w.category || "";
  document.getElementById("fc-category").style.display = w.category
    ? "inline"
    : "none";
  document.getElementById("fc-translation").textContent = w.translation;
  document.getElementById("fc-example").textContent = w.example || "";
  document.getElementById("fc-back").classList.add("d-none");
  document.getElementById("fc-front-hint").classList.remove("d-none");

  document
    .getElementById("stepFlashcard")
    .querySelector(".card, #learnCard, [id='learnCard']");

  document.getElementById("learnCard").onclick = flipFlashcard;

  setMainBtn(
    'Bilaman <i class="bi bi-check-lg"></i>',
    "#4a90d9",
    true
  );
}

function flipFlashcard() {
  if (fcFlipped) return;
  fcFlipped = true;

  document.getElementById("fc-back").classList.remove("d-none");
  document.getElementById("fc-front-hint").classList.add("d-none");
  document.getElementById("learnCard").onclick = null;

  setMainBtn('Bilaman <i class="bi bi-check-lg"></i>', "#58cc02", false);
  document.getElementById("mainBtn").onclick = () => {
    saveProgress(words[current].id, "quiz");
    nextStep();
  };
}

// ========================
// Quiz
// ========================
function renderQuiz(w) {
  quizAnswered = false;

  document.getElementById("stepQuiz").classList.remove("d-none");
  document.getElementById("quiz-word").textContent = w.word;
  document.getElementById("learnCard").onclick = null;

  const container = document.getElementById("quiz-options");
  container.innerHTML = "";

  // 4 ta variant — 1 to'g'ri, 3 noto'g'ri
  const wrong = allWords
    .filter((x) => x.id !== w.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((x) => x.translation);

  const options = [...wrong, w.translation].sort(() => Math.random() - 0.5);

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = opt;

    btn.onclick = () => {
      if (quizAnswered) return;
      quizAnswered = true;

      const isCorrect = opt === w.translation;

      container.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
        b.style.cursor = "default";
      });

      if (isCorrect) {
        btn.classList.add("correct");
        setCardBorder("correct");
        playSound("correct");
        vibrate("correct");
        setMainBtn(
          'Davom etish <i class="bi bi-arrow-right"></i>',
          "#58cc02"
        );
      } else {
        btn.classList.add("wrong");
        setCardBorder("wrong");
        playSound("wrong");
        vibrate("wrong");
        container.querySelectorAll("button").forEach((b) => {
          if (b.textContent === w.translation) b.classList.add("correct");
        });
        setMainBtn(
          'Davom etish <i class="bi bi-arrow-right"></i>',
          "#ff4b4b"
        );
      }

      document.getElementById("mainBtn").onclick = () => {
        saveProgress(words[current].id, "pronunciation");
        nextStep();
      };
    };

    container.appendChild(btn);
  });

  setMainBtn(
    'Variantni tanlang',
    "#4a90d9",
    true
  );
}

// ========================
// Pronunciation
// ========================
function renderPronunciation(w) {
  document.getElementById("stepPronunciation").classList.remove("d-none");
  document.getElementById("pr-word").textContent = w.word;
  document.getElementById("pr-ipa").textContent = w.ipa ? `/${w.ipa}/` : "";
  document.getElementById("learnCard").onclick = null;

  // Reset
  document.getElementById("pr-mic").classList.remove("d-none");
  document.getElementById("pr-result").classList.add("d-none");
  const micBtn = document.getElementById("micBtn");
  micBtn.classList.remove("btn-danger");
  micBtn.classList.add("btn-success");
  micBtn.innerHTML = '<i class="bi bi-mic-fill"></i>';
  document.getElementById("micHint").textContent =
    "Mikrofon tugmasini bosib so'zni ayting";

  // Web Speech API qo'llab-quvvatlanmasa — o'tkazib yuborish
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    setMainBtn(
      'O\'tkazib yuborish <i class="bi bi-arrow-right"></i>',
      "#6c757d"
    );
    document.getElementById("mainBtn").onclick = () => {
      saveProgress(words[current].id, "writing");
      nextStep();
    };
    return;
  }

  setMainBtn(
    'O\'tkazib yuborish <i class="bi bi-skip-end-fill"></i>',
    "#6c757d"
  );
  document.getElementById("mainBtn").onclick = () => {
    stopListening();
    saveProgress(words[current].id, "writing");
    nextStep();
  };
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
  document.getElementById("micHint").textContent = "Tinglayapman...";

  recognition.onresult = (event) => {
    isListening = false;
    const results = Array.from(event.results[0]).map((r) =>
      r.transcript.trim().toLowerCase()
    );
    const target = words[current].word.toLowerCase().trim();
    const isCorrect = results.some(
      (r) => r === target || r.includes(target) || target.includes(r)
    );
    showPronunciationResult(isCorrect, results[0]);
  };

  recognition.onerror = () => {
    isListening = false;
    const micBtn = document.getElementById("micBtn");
    micBtn.classList.remove("btn-danger");
    micBtn.classList.add("btn-success");
    micBtn.innerHTML = '<i class="bi bi-mic-fill"></i>';
    document.getElementById("micHint").textContent =
      "Xatolik. Qayta urinib ko'ring.";
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
    try { recognition.stop(); } catch (e) {}
    recognition = null;
  }
  isListening = false;
}

function showPronunciationResult(isCorrect, spoken) {
  document.getElementById("pr-mic").classList.add("d-none");
  document.getElementById("pr-result").classList.remove("d-none");
  document.getElementById("pr-spoken").textContent = spoken || "—";

  if (isCorrect) {
    setCardBorder("correct");
    document.getElementById("pr-result-text").textContent = "To'g'ri talaffuz!";
    document.getElementById("pr-result-text").className = "fw-bold text-success";
    playSound("correct");
    vibrate("correct");
    setMainBtn(
      'Davom etish <i class="bi bi-arrow-right"></i>',
      "#58cc02"
    );
  } else {
    setCardBorder("wrong");
    document.getElementById("pr-result-text").textContent =
      "Noto'g'ri. Keyingisi!";
    document.getElementById("pr-result-text").className = "fw-bold text-danger";
    playSound("wrong");
    vibrate("wrong");
    setMainBtn(
      'Davom etish <i class="bi bi-arrow-right"></i>',
      "#ff4b4b"
    );
  }

  document.getElementById("mainBtn").onclick = () => {
    saveProgress(words[current].id, "writing");
    nextStep();
  };
}

// ========================
// Writing
// ========================
function renderWriting(w) {
  wrChecked = false;

  document.getElementById("stepWriting").classList.remove("d-none");
  document.getElementById("wr-translation").textContent = w.translation;
  document.getElementById("learnCard").onclick = null;

  const input = document.getElementById("wr-input");
  input.value = "";
  input.disabled = false;
  input.className = "form-control form-control-lg text-center mb-3";
  input.style.borderRadius = "14px";

  document.getElementById("wr-hint").textContent = "";
  document.getElementById("wr-result").classList.add("d-none");
  document.getElementById("wr-hint-section").classList.remove("d-none");

  setMainBtn('Tekshirish <i class="bi bi-check-lg"></i>', "#4a90d9");
  document.getElementById("mainBtn").onclick = checkWriting;

  setTimeout(() => input.focus(), 100);
}

function showWritingHint() {
  const word = words[current].word;
  const hint = word[0] + "_ ".repeat(word.length - 1).trim();
  document.getElementById("wr-hint").textContent =
    `Maslahat: ${hint} (${word.length} harf)`;
}

function checkWriting() {
  if (wrChecked) {
    saveProgress(words[current].id, "completed");
    nextWord();
    return;
  }

  const w = words[current];
  const input = document.getElementById("wr-input");
  const userAnswer = input.value.trim().toLowerCase();
  const correct = w.word.trim().toLowerCase();

  if (!userAnswer) {
    input.focus();
    return;
  }

  wrChecked = true;
  input.disabled = true;
  document.getElementById("wr-hint-section").classList.add("d-none");
  document.getElementById("wr-result").classList.remove("d-none");

  const isCorrect = userAnswer === correct;

  if (isCorrect) {
    setCardBorder("correct");
    input.classList.add("is-valid");
    document.getElementById("wr-result-text").textContent = "To'g'ri!";
    document.getElementById("wr-result-text").className = "fw-bold text-success";
    document.getElementById("wr-correct-answer").textContent = "";
    playSound("correct");
    vibrate("correct");
    setMainBtn(
      'Keyingi so\'z <i class="bi bi-arrow-right"></i>',
      "#58cc02"
    );
  } else {
    setCardBorder("wrong");
    input.classList.add("is-invalid");
    document.getElementById("wr-result-text").textContent = "Noto'g'ri!";
    document.getElementById("wr-result-text").className = "fw-bold text-danger";
    document.getElementById("wr-correct-answer").textContent =
      `To'g'ri: ${w.word}`;
    playSound("wrong");
    vibrate("wrong");
    setMainBtn(
      'Keyingi so\'z <i class="bi bi-arrow-right"></i>',
      "#ff4b4b"
    );
  }

  document.getElementById("mainBtn").onclick = () => {
    saveProgress(words[current].id, "completed");
    nextWord();
  };
}

// ========================
// Navigation
// ========================
function handleMainBtn() {
  // Default — flashcard flip
  if (currentStep === "flashcard" && !fcFlipped) {
    flipFlashcard();
  }
}

function nextStep() {
  const stepIdx = STEPS.indexOf(currentStep);
  if (stepIdx < STEPS.length - 1) {
    currentStep = STEPS[stepIdx + 1];
    renderStep();
  } else {
    nextWord();
  }
}

function nextWord() {
  stopListening();
  current++;

  if (current >= words.length) {
    showFinalResult();
  } else {
    currentStep = "flashcard";
    updateProgress();
    renderStep();
  }
}

function showFinalResult() {
  document.getElementById("learnCard").classList.add("d-none");
  document.getElementById("mainBtn").classList.add("d-none");
  document.getElementById("stepIndicator").classList.add("d-none");
  document.getElementById("progressBar").style.width = "100%";
  document.getElementById("finalResult").classList.remove("d-none");

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.connect(gain);
      osc.frequency.value = freq;
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  } catch (e) {}
}

async function restartLearn() {
  current = 0;
  currentStep = "flashcard";
  words = [...allWords];

  // Progress reset
  for (const w of words) {
    await saveProgress(w.id, "flashcard");
  }

  document.getElementById("learnCard").classList.remove("d-none");
  document.getElementById("mainBtn").classList.remove("d-none");
  document.getElementById("stepIndicator").classList.remove("d-none");
  document.getElementById("finalResult").classList.add("d-none");
  document.getElementById("progressBar").style.width = "0%";

  updateProgress();
  renderStep();
}

// Klaviatura
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const btn = document.getElementById("mainBtn");
    if (!btn.disabled) btn.click();
  }
});

// Boshlash
init();