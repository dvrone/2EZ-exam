const words = JSON.parse(document.getElementById("wordsData").textContent);
const submitUrl = document
  .getElementById("submitUrl")
  .textContent.trim()
  .replace(/"/g, "");

let questions = [];
let total = 0;
let current = 0;
let furthest = 0;
const answers = {}; // index -> selected option text

const wordText = document.getElementById("wordText");
const optionsContainer = document.getElementById("optionsContainer");
const continueBtn = document.getElementById("continueBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const reviewBadge = document.getElementById("reviewBadge");
const progressBar = document.getElementById("progressBar");
const currentNum = document.getElementById("currentNum");
const totalNum = document.getElementById("totalNum");
const navRow = document.getElementById("navRow");
const questionCard = document.getElementById("questionCard");

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

function buildQuestions() {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  questions = shuffled.map((w) => {
    const wrong = words
      .filter((x) => x.id !== w.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((x) => x.translation);
    const options = [...wrong, w.translation].sort(() => Math.random() - 0.5);
    return { word: w.word, correct: w.translation, options };
  });

  total = questions.length;
  totalNum.textContent = total;
}

function updateProgress() {
  const answeredCount = Object.keys(answers).length;
  const percent = (answeredCount / total) * 100;
  progressBar.style.width = percent + "%";
  currentNum.textContent = current + 1;
}

function updateNavButtons() {
  prevBtn.disabled = current === 0;
  nextBtn.disabled = !(current < furthest);
}

function renderQuestion() {
  const q = questions[current];

  questionCard.classList.remove("slide-in");
  void questionCard.offsetWidth;
  questionCard.classList.add("slide-in");

  wordText.textContent = q.word;
  optionsContainer.innerHTML = "";

  const isAnswered = answers.hasOwnProperty(current);
  const isReview = current < furthest || (current === furthest && isAnswered);

  if (current < furthest) {
    reviewBadge.classList.remove("d-none");
  } else {
    reviewBadge.classList.add("d-none");
  }

  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.setAttribute("data-value", opt);

    if (isReview) {
      btn.disabled = true;
      btn.style.cursor = "default";

      if (isAnswered && answers[current] === opt) {
        btn.classList.add(opt === q.correct ? "correct" : "wrong");
      }
      if (opt === q.correct) {
        btn.classList.add("correct");
      }
    } else {
      btn.onclick = () => {
        answers[current] = opt;
        const isCorrect = opt === q.correct;

        if (isCorrect) {
          playSound("correct");
          vibrate("correct");
        } else {
          playSound("wrong");
          vibrate("wrong");
        }

        renderQuestion();
        updateProgress();
        updateNavButtons();
      };
    }

    optionsContainer.appendChild(btn);
  });

  // Davom etish tugmasi
  if (current === furthest && isAnswered) {
    continueBtn.classList.remove("d-none");
    const isCorrect = answers[current] === q.correct;

    continueBtn.style.background = isCorrect ? "#58cc02" : "#ff4b4b";
    continueBtn.style.borderColor = isCorrect ? "#58cc02" : "#ff4b4b";

    continueBtn.innerHTML =
      furthest === total - 1
        ? 'Yakunlash <i class="bi bi-check-lg"></i>'
        : 'Davom etish <i class="bi bi-arrow-right"></i>';
  } else {
    continueBtn.classList.add("d-none");
  }
}

prevBtn.onclick = () => {
  if (current > 0) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    current--;
    renderQuestion();
    updateProgress();
    updateNavButtons();
  }
};

nextBtn.onclick = () => {
  if (current < furthest) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    current++;
    renderQuestion();
    updateProgress();
    updateNavButtons();
  }
};

continueBtn.onclick = () => {
  try { window.speechSynthesis.cancel(); } catch (e) {}

  if (furthest < total - 1) {
    furthest++;
    current = furthest;
    renderQuestion();
    updateProgress();
    updateNavButtons();
  } else {
    showResult();
  }
};

async function showResult() {
  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correct) score++;
  });

  questionCard.classList.add("d-none");
  continueBtn.classList.add("d-none");
  navRow.classList.add("d-none");
  reviewBadge.classList.add("d-none");
  progressBar.style.width = "100%";

  const percentage = Math.round((score / total) * 100);
  document.getElementById("scoreText").textContent =
    `${score} / ${total} to'g'ri javob`;

  try {
    const res = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, total }),
    });
    const data = await res.json();
    if (data.xp) {
      document.getElementById("xpEarned").textContent = `+${data.xp} XP qo'shildi!`;
      document.getElementById("xpInfo").classList.remove("d-none");
    }
  } catch (e) {}

  let curr = 0;
  const interval = setInterval(() => {
    curr = Math.min(curr + 2, percentage);
    document.getElementById("percentText").textContent = curr + "%";
    const dasharray = (curr / 100) * 439.8;
    document.getElementById("resultCircle").setAttribute(
      "stroke-dasharray", `${dasharray} 439.8`
    );
    const color =
      percentage >= 70 ? "#58cc02" : percentage >= 50 ? "#ffc800" : "#ff4b4b";
    document.getElementById("resultCircle").setAttribute("stroke", color);
    document.getElementById("percentText").style.color = color;
    if (curr >= percentage) clearInterval(interval);
  }, 20);

  document.getElementById("resultDiv").classList.remove("d-none");

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
}

function restartQuiz() {
  current = 0;
  furthest = 0;
  Object.keys(answers).forEach((k) => delete answers[k]);

  questionCard.classList.remove("d-none");
  navRow.classList.remove("d-none");
  document.getElementById("resultDiv").classList.add("d-none");
  document.getElementById("xpInfo").classList.add("d-none");
  progressBar.style.width = "0%";

  buildQuestions();
  renderQuestion();
  updateProgress();
  updateNavButtons();
}

// Klaviatura
document.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    if (!continueBtn.classList.contains("d-none")) continueBtn.click();
  } else if (e.key === "ArrowLeft") {
    if (!prevBtn.disabled) prevBtn.click();
  } else if (e.key === "ArrowRight") {
    if (!nextBtn.disabled) nextBtn.click();
  }
});

buildQuestions();
renderQuestion();
updateProgress();
updateNavButtons();