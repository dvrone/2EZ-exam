const questions = JSON.parse(
  document.getElementById("questionsData").textContent,
);

questions.forEach((q) => {
  // To'g'ri javob mavjudligini tekshirish
  const correctOption = q.options.find((o) => o.value === q.correct);

  // Faqat mavjud variantlarni qoldirish
  q.options = q.options.filter((o) => o.text && o.text.trim() !== "");

  // To'g'ri javob o'chirilib ketgan bo'lsa qaytarish
  if (correctOption && !q.options.find((o) => o.value === q.correct)) {
    q.options.push(correctOption);
  }

  // Aralashtirish
  q.options.sort(() => Math.random() - 0.5);
});

let current = 0;
let answers = {};
let answered = false;

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
  const percent = (current / questions.length) * 100;
  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("currentNum").textContent = current + 1;
}

function renderQuestion() {
  answered = false;
  const q = questions[current];
  const card = document.getElementById("questionCard");
  const continueBtn = document.getElementById("continueBtn");

  card.classList.remove("slide-in");
  void card.offsetWidth;
  card.classList.add("slide-in");

  document.getElementById("questionText").textContent = q.text;
  continueBtn.classList.add("d-none");
  continueBtn.style.background = "#4a90d9";
  continueBtn.style.borderColor = "#4a90d9";

  const container = document.getElementById("optionsContainer");
  container.innerHTML = "";

  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = opt.text;
    btn.setAttribute("data-value", opt.value);

    btn.onclick = () => {
      if (answered) return;
      answered = true;

      answers[q.id] = opt.value;
      const isCorrect = opt.value === q.correct;

      container.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
        b.style.cursor = "default";
      });

      if (isCorrect) {
        btn.classList.add("correct");
        playSound("correct");
        vibrate("correct");
        continueBtn.style.background = "#58cc02";
        continueBtn.style.borderColor = "#58cc02";
      } else {
        btn.classList.add("wrong");
        playSound("wrong");
        vibrate("wrong");

        container.querySelectorAll("button").forEach((b) => {
          if (b.getAttribute("data-value") === q.correct) {
            b.classList.add("correct");
          }
        });

        continueBtn.style.background = "#ff4b4b";
        continueBtn.style.borderColor = "#ff4b4b";
      }

      continueBtn.classList.remove("d-none");
    };

    container.appendChild(btn);
  });

  updateProgress();
}

document.getElementById("continueBtn").onclick = () => {
  current++;
  if (current >= questions.length) {
    finishExam();
  } else {
    renderQuestion();
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

document.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    const continueBtn = document.getElementById("continueBtn");
    if (!continueBtn.classList.contains("d-none")) {
      continueBtn.click();
    }
  }
});

renderQuestion();
