function normalize(str){
  return str.toLowerCase().replace(/[^\w\s]/g,'').trim();
}

// TEXT INPUT
function checkText(){
  let score = 0;

  document.querySelectorAll("[data-type='text']").forEach(el=>{
    if(!el.value.trim()){
      el.classList.remove("correct","wrong");
    } else if(normalize(el.value).includes(normalize(el.dataset.answer))){
      el.classList.add("correct");
      el.classList.remove("wrong");

      let existing = el.parentElement.querySelector(".answer-text");
      if(!el.nextElementSibling || !el.nextElementSibling.classList.contains("answer-text")){
        const ans = document.createElement("div");
        ans.className = "answer-text";
        ans.innerText = "Answer: " + el.dataset.answer;
        const lineSentence = el.closest(".line-sentence");
        if(lineSentence){
          lineSentence.insertAdjacentElement("afterend", ans);
        } else {
          el.insertAdjacentElement("afterend", ans);
        }
      }

      el.disabled = true;
      score++;
    } else {
      el.classList.add("wrong");
      el.classList.remove("correct");

      // show correct answer
      let existing = el.parentElement.querySelector(".answer-text");
      if(!el.nextElementSibling || !el.nextElementSibling.classList.contains("answer-text")){
        const ans = document.createElement("div");
        ans.className = "answer-text";
        ans.innerText = "Answer: " + el.dataset.answer;
        const lineSentence = el.closest(".line-sentence");
        if(lineSentence){
          lineSentence.insertAdjacentElement("afterend", ans);
        } else {
          el.insertAdjacentElement("afterend", ans);
        }
      }

      el.disabled = true;
    }
  });

  return score;
}

// MCQ
function checkMCQ(){
  let score = 0;

  document.querySelectorAll("[data-type='mcq']").forEach(group=>{
    const correct = group.dataset.answer;
    const checked = group.querySelector("input:checked");

    // disable all radios
    group.querySelectorAll("input").forEach(r=> r.disabled = true);

    // show answer
    let existing = group.querySelector(".answer-text");
    if(!existing){
      const ans = document.createElement("div");
      ans.className = "answer-text";
      if(checked && checked.value === correct){
        ans.innerText = "Correct";
      } else {
        ans.innerText = "Correct answer: " + correct;
      }
      group.appendChild(ans);
    }

    if(checked && checked.value === correct){
      score++;
    }
  });

  return score;
}

function checkSelect(){
  let score = 0;

  document.querySelectorAll("[data-type='select']").forEach(el=>{
    if(el.value === el.dataset.answer){
      score++;
      el.classList.add("correct");
      el.classList.remove("wrong");

      let existing = el.parentElement.querySelector(".answer-text");
      if(!existing){
        const ans = document.createElement("div");
        ans.className = "answer-text";
        ans.innerText = "Answer: " + el.dataset.answer;
        el.parentElement.appendChild(ans);
      }

      el.disabled = true;

    } else {
      el.classList.add("wrong");
      el.classList.remove("correct");

      let existing = el.parentElement.querySelector(".answer-text");
      if(!existing){
        const ans = document.createElement("div");
        ans.className = "answer-text";
        ans.innerText = "Answer: " + el.dataset.answer;
        el.parentElement.appendChild(ans);
      }

      el.disabled = true;
    }
  });

  return score;
}

// MATCH D
function checkMatchD(){
  let score = 0;

  document.querySelectorAll('.question').forEach(q=>{
    if(q.dataset.selected === q.dataset.match){
      score++;
    }
  });

  return score;
}

// MAIN
function checkAll(){
  let score = 0;

  // Reset visual feedback before checking
  document.querySelectorAll("input, select").forEach(el=>{
    el.classList.remove("correct","wrong");
  });

  // remove old answers
  document.querySelectorAll(".answer-text").forEach(el=> el.remove());

  score += checkText();
  score += checkMCQ();
  score += checkSelect();

  document.getElementById("result").innerText = "Score: " + score;
  document.getElementById("result").scrollIntoView({behavior:"smooth"});

  // show predefined answers in section C
  document.querySelectorAll('.answer-line').forEach(el=>{
    el.style.display = 'block';
  });
}

let currentQuestion = null;

document.addEventListener("DOMContentLoaded", () => {
  // cache original text if not provided
  document.querySelectorAll('.question').forEach(q=>{
    if(!q.dataset.text){
      q.dataset.text = q.innerText.trim();
    }
  });

  // click question to activate
  document.querySelectorAll('.question').forEach(q=>{
    q.addEventListener('click', ()=>{
      document.querySelectorAll('.question').forEach(el=>el.classList.remove('active'));
      q.classList.add('active');
      currentQuestion = q;
    });
  });

  // click option to assign answer
  document.querySelectorAll('.option').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const value = btn.dataset.value;

      if(currentQuestion){
        currentQuestion.dataset.selected = value;
        currentQuestion.innerText = currentQuestion.dataset.text + " → " + value;
      }
    });
  });

  // SELECT change (no auto-fill)
  document.querySelectorAll("[data-type='select']").forEach(select=>{
    select.addEventListener("change", ()=>{
      // selection only, do NOT auto-fill input
    });
  });
});