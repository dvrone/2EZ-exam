const meta = JSON.parse(document.getElementById("learnMeta").textContent);
const allWords = JSON.parse(document.getElementById("wordsData").textContent);

let words = [];
let current = 0;
let revealed = false;

async function init() {
  try {
    const res = await fetch(meta.state_url);
    const state = await res.json();

    if (state.completed_count > 0 && state.completed_count < state.total) {
      const resume = confirm(
        `Siz ${state.completed_count}/${state.total} so'zni o'rgangansiz. Davom ettirasizmi?`
      );
      if (resume) {
        const resumeIdx = allWords.findIndex((w) => w.id === state.resume_word_id);
        words = allWords.slice(resumeIdx >= 0 ? resumeIdx : 0);
        current = 0;
      } else {
        await resetProgress();
        words = [...allWords];
        current = 0;
      }
    } else if (state.completed_count === state.total && state.total > 0) {
      words = [...allWords];
      showFinalResult();
      return;
    } else {
      words = [...allWords];
      current = 0;
    }
  } catch (e) {
    words = [...allWords];
    current = 0;
  }

  updateProgress();
  renderCard();
}

async function resetProgress() {
  for (const w of allWords) {
    await saveProgress(w.id, "intro");
  }
}

async function saveProgress(vocab_id, step) {
  try {
    await fetch(meta.save_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocab_id, current_step: step }),
    });
  } catch (e) {}
}

function updateProgress() {
  const globalIdx = allWords.findIndex((w) => w.id === words[current]?.id);
  const percent = allWords.length > 0 ? ((globalIdx + 1) / allWords.length) * 100 : 0;
  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("currentNum").textContent = globalIdx + 1;
}

function setMainBtn(text) {
  const btn = document.getElementById("mainBtn");
  btn.innerHTML = text;
  btn.classList.remove("d-none");
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

function getCategoryLabel(category) {
  const map = {
    noun: "Noun",
    verb: "Verb",
    adj: "Adjective",
    adv: "Adverb",
    phrase: "Phrase",
    prep: "Preposition",
    pron: "Pronoun",
    conj: "Conjunction",
    other: "Other",
  };
  return category && map[category] ? map[category] : "Part of speech";
}

function renderCard() {
  const w = words[current];
  if (!w) {
    showFinalResult();
    return;
  }

  revealed = false;
  document.getElementById("learnWord").textContent = w.word;
  document.getElementById("learnCategory").textContent = getCategoryLabel(w.category);
  document.getElementById("learnTranslation").textContent = w.translation;
  document.getElementById("learnExample").textContent = w.example ? `“${w.example}”` : "";
  document.getElementById("learnTranslation").classList.add("d-none");
  document.getElementById("learnExample").classList.add("d-none");
  document.getElementById("learnHint").classList.remove("d-none");
  document.getElementById("learnCard").onclick = revealMeaning;
  document.getElementById("mainBtn").onclick = handleMainBtn;
  setMainBtn("Reveal meaning");

  document.getElementById("learnCard").classList.remove("d-none");
  document.getElementById("mainBtn").classList.remove("d-none");
  document.getElementById("finalResult").classList.add("d-none");
}

function revealMeaning() {
  if (revealed) {
    nextWord();
    return;
  }

  const w = words[current];
  if (!w) return;

  revealed = true;
  document.getElementById("learnTranslation").classList.remove("d-none");
  document.getElementById("learnExample").classList.toggle("d-none", !w.example);
  document.getElementById("learnHint").classList.add("d-none");
  document.getElementById("learnCard").onclick = nextWord;
  setMainBtn("Next word");
}

function handleMainBtn() {
  if (revealed) {
    nextWord();
  } else {
    revealMeaning();
  }
}

function nextWord() {
  saveProgress(words[current]?.id, "intro");
  current += 1;

  if (current >= words.length) {
    showFinalResult();
  } else {
    updateProgress();
    renderCard();
  }
}

function showFinalResult() {
  document.getElementById("learnCard").classList.add("d-none");
  document.getElementById("mainBtn").classList.add("d-none");
  document.getElementById("progressBar").style.width = "100%";
  document.getElementById("finalResult").classList.remove("d-none");
}

async function restartLearn() {
  current = 0;
  words = [...allWords];

  for (const w of words) {
    await saveProgress(w.id, "intro");
  }

  document.getElementById("learnCard").classList.remove("d-none");
  document.getElementById("mainBtn").classList.remove("d-none");
  document.getElementById("finalResult").classList.add("d-none");
  document.getElementById("progressBar").style.width = "0%";

  updateProgress();
  renderCard();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const btn = document.getElementById("mainBtn");
    if (!btn.disabled) btn.click();
  }
});

init();
