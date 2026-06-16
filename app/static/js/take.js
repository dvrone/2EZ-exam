const questions = JSON.parse(
  document.getElementById("questionsData").textContent,
);

// Bo'sh variantlarni olib tashlash, to'g'ri javobni saqlab qolish
questions.forEach((q) => {
  const correctOption = q.options.find((o) => o.value === q.correct);
  q.options = q.options.filter((o) => o.text && o.text.trim() !== "");
  if (correctOption && !q.options.find((o) => o.value === q.correct)) {
    q.options.push(correctOption);
  }
  q.options.sort(() => Math.random() - 0.5);
});

const total = questions.length;
let current = 0; // hozir ko'rsatilayotgan savol
let furthest = 0; // eng oxirgi yetilgan (faol) savol

const answers = {};

const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const continueBtn = document.getElementById("continueBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const reviewBadge = document.getElementById("reviewBadge");
const progressBar = document.getElementById("progressBar");
const currentNum = document.getElementById("currentNum");

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
  const card = document.getElementById("questionCard");

  card.classList.remove("slide-in");
  void card.offsetWidth;
  card.classList.add("slide-in");

  renderInto(questionText, q.text);
  optionsContainer.innerHTML = "";

  const isAnswered = answers.hasOwnProperty(q.id);
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
    renderInto(btn, opt.text);
    btn.setAttribute("data-value", opt.value);

    if (isReview) {
      btn.disabled = true;
      btn.style.cursor = "default";

      if (isAnswered && answers[q.id] === opt.value) {
        btn.classList.add(opt.value === q.correct ? "correct" : "wrong");
      }
      if (opt.value === q.correct) {
        btn.classList.add("correct");
      }
    } else {
      btn.onclick = () => {
        answers[q.id] = opt.value;
        const isCorrect = opt.value === q.correct;

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
    const isCorrect = answers[q.id] === q.correct;

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
    current--;
    renderQuestion();
    updateProgress();
    updateNavButtons();
  }
};

nextBtn.onclick = () => {
  if (current < furthest) {
    current++;
    renderQuestion();
    updateProgress();
    updateNavButtons();
  }
};

continueBtn.onclick = () => {
  if (furthest < total - 1) {
    furthest++;
    current = furthest;
    renderQuestion();
    updateProgress();
    updateNavButtons();
  } else {
    finishExam();
  }
};

function finishExam() {
  const form = document.getElementById("submitForm");
  Object.entries(answers).forEach(([qId, val]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = `question_${qId}`;
    input.value = val;
    form.appendChild(input);
  });
  form.submit();
}

// Timer
const duration = parseInt(document.getElementById("timerData").textContent);
let minutes = duration;
let seconds = 0;
const timerEl = document.getElementById("timer");

const countdown = setInterval(() => {
  if (seconds === 0) {
    if (minutes === 0) {
      clearInterval(countdown);
      finishExam();
      return;
    }
    minutes--;
    seconds = 59;
  } else {
    seconds--;
  }
  timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (minutes === 0 && seconds <= 30) {
    timerEl.parentElement.classList.add("timer-warning");
  }
}, 1000);

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

renderQuestion();
updateProgress();
updateNavButtons();