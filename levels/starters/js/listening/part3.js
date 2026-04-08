document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const set = params.get('set');
  const test = params.get('test');
  const part = "part3.json";

  let jsonPath;

  let finalSet = set;
  let finalTest = test;

  if (set && !set.startsWith("set-")) {
    finalSet = "set-" + set;
  }

  if (test && !test.startsWith("test-")) {
    finalTest = "test-" + test;
  }

  if (finalSet && finalTest) {
    jsonPath = `../${finalSet}/${finalTest}/listening/${part}`;
  } else {
    jsonPath = './part3.json';
  }

  fetch(jsonPath)
    .then(res => {
      if (!res.ok) throw new Error("Cannot load JSON: " + jsonPath);
      return res.json();
    })
    .then(data => {
      const container = document.getElementById('questionContainer');

      const audio = document.getElementById('mainAudio');
      const source = document.createElement('source');
      source.src = data.audio;
      source.type = 'audio/mpeg';
      audio.appendChild(source);

      container.innerHTML += renderQuestion(data.example, true);

      data.questions.forEach((q, i) => {
        container.innerHTML += renderQuestion(q, false, i+1);
      });

      initPart3(finalSet, finalTest);
    })
    .catch(err => {
      console.error(err);
      document.getElementById('questionContainer').innerHTML =
        "<p style='color:red'>Không load được dữ liệu JSON</p>";
    });
});

function renderQuestion(q, isExample=false, index=null){
  return `
  <div class="question ${isExample ? 'example' : ''}" data-answer="${q.answer}" data-script="${q.script}">
    <h3>${isExample ? 'Example' : index + '.'} ${q.question}</h3>

    <div class="options">
      ${q.options.map(opt => `
        <div class="option" data-choice="${opt.choice}">
          <img src="${opt.image}">
          <span>${opt.choice}</span>
        </div>
      `).join('')}
    </div>

    <div class="result correct">✓ Correct</div>
    <div class="result wrong">✗ Wrong</div>
    <div class="script-box" style="display:none;"></div>
    <button class="script-btn" disabled>🎧</button>
  </div>
  `;
}
function initPart3(finalSet, finalTest){
const STORAGE_KEY = `listening_part3_${finalSet}_${finalTest}`;
const DONE_KEY = `listening_part3_done_${finalSet}_${finalTest}`;

const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

const questions = Array.from(document.querySelectorAll(".question:not(.example)"));

function updateProgress(){
  const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const answeredCount = Object.values(state)
    .filter(v => v && v.answered)
    .length;

  if (answeredCount === questions.length) {
    localStorage.setItem(DONE_KEY, 'true');
    // message sending removed
  }
}

// Expose resetTest globally
window.resetTest = function(){
  doResetTest();
};

const example = document.querySelector(".question.example");

// Lock example
if (example) {
  example.classList.add("locked");
  const correctAnswer = example.dataset.answer;
  const options = example.querySelectorAll(".option");

  options.forEach(o => {
    if (o.dataset.choice === correctAnswer) {
      o.classList.add("correct");
    }
    o.style.pointerEvents = "none";
  });

  example.querySelector(".result.correct").style.display = "block";

  const exBtn = example.querySelector('.script-btn');
  const exBox = example.querySelector('.script-box');

  exBtn.disabled = false;
  exBtn.style.cursor = 'pointer';
  exBtn.style.background = '#42a5f5';

  exBtn.onclick = () => {
    exBox.innerHTML = example.dataset.script
      .replace(/^([A-Za-z]+:)/gm, '<strong>$1</strong>');
    exBox.style.display = 'block';
    exBtn.disabled = true;
    exBtn.style.opacity = 0.6;
  };
}

// QUESTIONS
questions.forEach((q, qIndex) => {
  const correctAnswer = q.dataset.answer;
  const options = q.querySelectorAll(".option");
  const correctBox = q.querySelector(".result.correct");
  const wrongBox = q.querySelector(".result.wrong");

  const scriptBtn = q.querySelector('.script-btn');
  const scriptBox = q.querySelector('.script-box');
  const scriptText = q.dataset.script;

  // restore state
  if (saved[qIndex] && saved[qIndex].answered && saved[qIndex].value) {
    checkAnswer(saved[qIndex].value, false);
  }

  options.forEach(opt => {
    opt.onclick = () => {
      if (q.classList.contains("locked")) return;
      checkAnswer(opt.dataset.choice, true);
    };
  });

  function checkAnswer(choice, save) {
    q.classList.add("locked");

    options.forEach(o => {
      if (o.dataset.choice === correctAnswer) {
        o.classList.add("correct");
      } else if (o.dataset.choice === choice) {
        o.classList.add("wrong");
      }
      o.style.pointerEvents = "none";
    });

    if (choice === correctAnswer) {
      correctBox.style.display = "block";
    } else {
      wrongBox.style.display = "block";
    }

    if (save) {
      saved[qIndex] = { value: choice, answered: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      updateProgress();
    }

    // enable script
    scriptBtn.disabled = false;
    scriptBtn.style.cursor = 'pointer';
    scriptBtn.style.background = '#42a5f5';
  }

  scriptBtn.onclick = () => {
    scriptBox.innerHTML = scriptText
      .replace(/^([A-Za-z]+:)/gm, '<strong>$1</strong>');
    scriptBox.style.display = 'block';
    scriptBtn.disabled = true;
    scriptBtn.style.cursor = 'not-allowed';
    scriptBtn.style.opacity = 0.6;
  };
});

// check on load
// updateProgress();  <-- removed as per instructions

function doResetTest() {

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DONE_KEY);

  // message sending removed

  questions.forEach(q => {
    q.classList.remove("locked");

    const options = q.querySelectorAll(".option");
    options.forEach(o => {
      o.classList.remove("correct", "wrong");
      o.style.pointerEvents = "auto";
    });

    q.querySelector(".result.correct").style.display = "none";
    q.querySelector(".result.wrong").style.display = "none";

    const sb = q.querySelector('.script-box');
    const sbtn = q.querySelector('.script-btn');

    sb.style.display = 'none';
    sbtn.disabled = true;
    sbtn.style.cursor = 'not-allowed';
    sbtn.style.opacity = 1;
    sbtn.style.background = '#90caf9';
  });

  if (example) {
    example.classList.add("locked");
    const correctAnswer = example.dataset.answer;
    const options = example.querySelectorAll(".option");

    options.forEach(o => {
      if (o.dataset.choice === correctAnswer) {
        o.classList.add("correct");
      }
      o.style.pointerEvents = "none";
    });

    example.querySelector(".result.correct").style.display = "block";

    const exBtn = example.querySelector('.script-btn');
    const exBox = example.querySelector('.script-box');

    exBtn.disabled = false;
    exBtn.style.cursor = 'pointer';
    exBtn.style.background = '#42a5f5';

    exBtn.onclick = () => {
      exBox.innerHTML = example.dataset.script
        .replace(/^([A-Za-z]+:)/gm, '<strong>$1</strong>');
      exBox.style.display = 'block';
      exBtn.disabled = true;
      exBtn.style.opacity = 0.6;
    };
  }
}
}
