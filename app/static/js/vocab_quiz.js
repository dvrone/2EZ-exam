const words = JSON.parse(document.getElementById("wordsData").textContent);

let questions = [];
let current = 0;
let score = 0;
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
  if (!navigator.vibrate) return;
  navigator.vibrate(type === "correct" ? 100 : [100, 50, 100]);
}

function buildQuestions() {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  questions = shuffled.map((w) => {
    // To'g'ri javobdan tashqari 3 ta noto'g'ri variant
    const wrong = words
      .filter((x) => x.id !== w.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((x) => x.translation);

    const options = [...wrong, w.translation].sort(() => Math.random() - 0.5);

    return {
      word: w.word,
      correct: w.translation,
      options: options,
    };
  });

  document.getElementById("totalNum").textContent = questions.length;
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

  document.getElementById("wordText").textContent = q.word;
  continueBtn.classList.add("d-none");
  continueBtn.style.background = "#4a90d9";
  continueBtn.style.borderColor = "#4a90d9";

  const container = document.getElementById("optionsContainer");
  container.innerHTML = "";

  q.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.setAttribute("data-value", opt);

    btn.onclick = () => {
      if (answered) return;
      answered = true;

      const isCorrect = opt === q.correct;

      container.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
        b.style.cursor = "default";
      });

      if (isCorrect) {
        score++;
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
    showResult();
  } else {
    renderQuestion();
  }
};

function showResult() {
  document.getElementById("questionCard").classList.add("d-none");
  document.getElementById("continueBtn").classList.add("d-none");
  document.getElementById("progressBar").style.width = "100%";

  const percentage = Math.round((score / questions.length) * 100);

  document.getElementById("scoreText").textContent =
    `${score} / ${questions.length} to'g'ri javob`;

  // Doira animatsiyasi
  let curr = 0;
  const interval = setInterval(() => {
    curr = Math.min(curr + 2, percentage);
    document.getElementById("percentText").textContent = curr + "%";
    const dasharray = (curr / 100) * 439.8;
    document.getElementById("resultCircle").setAttribute(
      "stroke-dasharray",
      `${dasharray} 439.8`
    );
    const color =
      percentage >= 70 ? "#58cc02" : percentage >= 50 ? "#ffc800" : "#ff4b4b";
    document.getElementById("resultCircle").setAttribute("stroke", color);
    document.getElementById("percentText").style.color = color;
    if (curr >= percentage) clearInterval(interval);
  }, 20);

  document.getElementById("resultDiv").classList.remove("d-none");

  // Ovoz
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
  score = 0;
  answered = false;

  document.getElementById("questionCard").classList.remove("d-none");
  document.getElementById("resultDiv").classList.add("d-none");
  document.getElementById("progressBar").style.width = "0%";

  buildQuestions();
  renderQuestion();
}

buildQuestions();
renderQuestion();