/* =========================
   PREVENT MULTIPLE EXECUTION (LIVE SERVER LOOP GUARD)
========================= */
if (window.__PART2_LOADED__) {
  console.warn("part2.js already loaded → prevent duplicate execution");
} else {
  window.__PART2_LOADED__ = true;

/* =========================
   GET PARAMS
========================= */
function getParams(){
  const params = new URLSearchParams(window.location.search);
  return {
    set: params.get("set"),
    test: params.get("test")
  };
}

let DATA = [];
let finalSet, finalTest;

let { set, test } = getParams();

// fallback: try to detect from path if params missing
if(!set || !test){
  const path = window.location.pathname;

  const setMatch = path.match(/set-(\d+)/);
  const testMatch = path.match(/test-(\d+)/);

  if(setMatch) set = setMatch[1];
  if(testMatch) test = testMatch[1];
}

finalSet = set;
finalTest = test;

/* fallback nếu mở trực tiếp */
if(!finalSet || !finalTest){
  finalSet = finalSet || "05";
  finalTest = finalTest || "01";
}
const STORAGE_KEY = `listening_part2_set-${finalSet}_test-${finalTest}`;

/* =========================
   DOM
========================= */
const container = document.getElementById("questions");
const progressBar = document.getElementById("progressBar");

/* =========================
   HELPERS
========================= */
function normalizeAnswers(answer){
  if(Array.isArray(answer)) return answer.map(a => a.toLowerCase());
  if(typeof answer === "string") return [answer.toLowerCase()];
  return [];
}

function buildInputHTML(text){
  return text.replace(/_+/g, "<input type='text' class='inline-input'>");
}

function saveProgress() {
  const allQuestions = document.querySelectorAll(".question");

  const answers = [];

  allQuestions.forEach(q => {
    const inputs = q.querySelectorAll("input");
    const values = Array.from(inputs).map(i => i.value.trim());
    answers.push(values);
  });

  const data = {
    answers: answers,
    completed: true
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* =========================
   RENDER QUESTIONS
========================= */
function renderQuestions(){
  container.innerHTML = "";

  DATA.forEach((item, index) => {

    const answers = normalizeAnswers(item.answer);

    const div = document.createElement("div");
    div.className = "question";

    const questionHtml = buildInputHTML(item.question || "");

    const hasBlank = (item.question || "").includes("______");

    div.innerHTML = `
      <h3>${questionHtml}</h3>
      <div class="answer-row">
        ${hasBlank ? "" : "<input type='text'>"}
        <button class="show-answer">🔑</button>
        <button class="script-btn">🎧</button>
      </div>
      <div class="result"></div>
      <div class="script-box" style="display:none;"></div>
    `;

    const inputs = div.querySelectorAll("input");
    const answerBtn = div.querySelector(".show-answer");
    const result = div.querySelector(".result");
    const scriptBtn = div.querySelector(".script-btn");
    const scriptBox = div.querySelector(".script-box");

    scriptBtn.onclick = () => {
      if(!item.script) return;

      const formatted = item.script
        .replaceAll("\n", "<br>")
        .replace(/(Woman:|Girl:|Boy:)/g, "<strong>$1</strong>");

      scriptBox.innerHTML = formatted;
      scriptBox.style.display = "block";

      scriptBtn.disabled = true;
    };

    answerBtn.disabled = true;
    scriptBtn.disabled = true;
    inputs.forEach(input => {
      input.addEventListener("input", () => {
        const allFilled = Array.from(inputs).every(i => i.value.trim() !== "");
        answerBtn.disabled = !allFilled;
      });
    });

    answerBtn.onclick = () => {
      const userAnswers = Array.from(inputs).map(i => i.value.trim().toLowerCase());
      if(userAnswers.some(v => !v)) return;

      inputs.forEach(i => i.disabled = true);
      answerBtn.disabled = true;

      const combinedUser = userAnswers.join(" ");
      const isCorrect = answers.includes(combinedUser);

      result.textContent = isCorrect
        ? "✓ Correct"
        : "✗ Correct answer: " + answers[0];

      result.style.display = "block";
      scriptBtn.disabled = false;

      // 🔥 CHECK ALL QUESTIONS DONE
      const allAnswered = document.querySelectorAll(".question input:disabled").length === document.querySelectorAll(".question input").length;

      // message sending removed
      saveProgress();
    };

    container.appendChild(div);
  });

  // 🔥 RESTORE DATA
const saved = loadProgress();

if (saved && saved.answers) {
  const allQuestions = document.querySelectorAll(".question");

  allQuestions.forEach((q, i) => {
    const inputs = q.querySelectorAll("input");
    const savedValues = saved.answers[i];

    if (!savedValues) return;

    inputs.forEach((input, idx) => {
      if (savedValues[idx]) {
        input.value = savedValues[idx];
        input.disabled = true;
      }
    });

    const result = q.querySelector(".result");
    const answerBtn = q.querySelector(".show-answer");
    const scriptBtn = q.querySelector(".script-btn");

    // Do not show restored message, just keep UI clean
    result.style.display = "none";
    result.textContent = "";

    answerBtn.disabled = true;
    scriptBtn.disabled = false;
  });
}
}

/* =========================
   LOAD JSON
========================= */
const jsonPath = `../../exams/set-${finalSet}/test-${finalTest}/listening/part2.json`;

fetch(jsonPath)
  .then(res => res.json())
  .then(data => {

    /* AUDIO */
    if(data.audio){
      const audioEl = document.getElementById("mainAudio");
      const sourceEl = audioEl.querySelector("source");
      if(sourceEl){
        sourceEl.src = data.audio;
        audioEl.load();
      }
    }

    /* IMAGE */
    if(data.image){
      const imgEl = document.querySelector(".main-image");
      if(imgEl) imgEl.src = data.image;
    }

    /* EXAMPLES */
    if(data.examples){
      const exampleBox = document.querySelector(".example");
      if(exampleBox){
        let html = "<h3>Examples</h3>";
        data.examples.forEach(e => {
          html += `<p>${e.question} → <b>${e.answer}</b></p>`;
        });
        exampleBox.innerHTML = html;
      }
    }

    /* QUESTIONS */
    if(Array.isArray(data.questions)){
      DATA = data.questions;
    }

    renderQuestions();
  })
  .catch(err => console.error("Error loading JSON:", err));

/* =========================
   RESET FUNCTION
========================= */
function resetTest(){
  localStorage.removeItem(STORAGE_KEY);
  // clear container
  const container = document.getElementById("questions");
  if(container){
    container.innerHTML = "";
  }

  // clear progress bar (if used later)
  const progressBar = document.getElementById("progressBar");
  if(progressBar){
    progressBar.textContent = "";
  }

  // re-render questions
  renderQuestions();
}
}
