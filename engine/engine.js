function normalize(str){
  return str.toLowerCase().replace(/[^\w\s]/g,'').replace(/\s+/g, ' ').trim();
}

// TEXT INPUT
function checkText(){
  let score = 0;

  document.querySelectorAll("[data-type='text']").forEach(el=>{
    if(!el.value.trim()){
      el.classList.add("wrong");
      el.classList.remove("correct");

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

// SENTENCE WITH A FIXED WORD BETWEEN TWO INPUTS
function checkSplitText(){
  let score = 0;

  document.querySelectorAll("[data-type='split-text']").forEach(group=>{
    const inputs = [...group.querySelectorAll("input[data-answer]")];
    const isCorrect = inputs.length > 0 && inputs.every(input=>
      normalize(input.value) === normalize(input.dataset.answer)
    );

    inputs.forEach(input=>{
      input.classList.toggle("correct", isCorrect);
      input.classList.toggle("wrong", !isCorrect);
      input.disabled = true;
    });

    if(!group.querySelector(".answer-text")){
      const ans = document.createElement("div");
      ans.className = "answer-text";
      ans.innerText = "Answer: " + group.dataset.answer;
      group.appendChild(ans);
    }

    if(isCorrect) score++;
  });

  return score;
}

// BUILD A SENTENCE BY SELECTING WORDS IN ORDER
function updateWordConnect(group){
  const selected = [...group.querySelectorAll(".word-choice.selected")]
    .sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
  const output = group.querySelector(".constructed-sentence");
  if(output) output.textContent = selected.map(button => button.dataset.word).join(" ");
}

function checkWordConnect(){
  let score = 0;

  document.querySelectorAll("[data-type='word-connect']").forEach(group=>{
    const output = group.querySelector(".constructed-sentence");
    const isCorrect = output && normalize(output.textContent) === normalize(group.dataset.answer);
    group.classList.toggle("correct", isCorrect);
    group.classList.toggle("wrong", !isCorrect);
    group.querySelectorAll(".word-choice").forEach(button => { button.disabled = true; });

    if(!group.querySelector(".answer-text")){
      const ans = document.createElement("div");
      ans.className = "answer-text";
      ans.innerText = "Answer: " + group.dataset.answer;
      group.appendChild(ans);
    }

    if(isCorrect) score++;
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
  document.querySelectorAll("input, textarea, select").forEach(el=>{
    el.classList.remove("correct","wrong");
  });

  // remove old answers
  document.querySelectorAll(".answer-text").forEach(el=> el.remove());

  score += checkText();
  score += checkSplitText();
  score += checkWordConnect();
  score += checkMCQ();
  score += checkSelect();

  document.getElementById("result").innerText = "Score: " + score;
  document.getElementById("result").scrollIntoView({behavior:"smooth"});

  // show predefined answers in section C
  document.querySelectorAll('.answer-line').forEach(el=>{
    el.style.display = 'block';
  });
}

function resetAll(){
  document.querySelectorAll("input, textarea").forEach(el=>{
    if(el.type === "radio" || el.type === "checkbox"){
      el.checked = false;
    } else {
      el.value = "";
    }
    el.disabled = false;
    el.classList.remove("correct","wrong");
  });

  document.querySelectorAll("select").forEach(el=>{
    el.selectedIndex = 0;
    el.disabled = false;
    el.classList.remove("correct","wrong");
  });

  document.querySelectorAll(".answer-text").forEach(el=> el.remove());
  document.querySelectorAll(".word-search-table td.selected").forEach(el=> el.classList.remove("selected"));
  document.querySelectorAll("canvas.draw-box").forEach(canvas=>{
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
  document.querySelectorAll('.answer-line').forEach(el=>{
    el.style.display = 'none';
  });
  document.querySelectorAll("[data-type='word-connect']").forEach(group=>{
    group.classList.remove("correct", "wrong");
    group.querySelectorAll(".word-choice").forEach(button=>{
      button.disabled = false;
      button.classList.remove("selected");
      delete button.dataset.order;
    });
    updateWordConnect(group);
  });

  const result = document.getElementById("result");
  if(result){
    result.innerText = "";
  }
}

let currentQuestion = null;

document.addEventListener("DOMContentLoaded", () => {
  let isSelectingWordSearch = false;

  document.querySelectorAll("[data-type='word-connect']").forEach(group=>{
    group.querySelectorAll(".word-choice").forEach(button=>{
      button.addEventListener("click", ()=>{
        if(button.classList.contains("selected")){
          const removedOrder = Number(button.dataset.order);
          button.classList.remove("selected");
          delete button.dataset.order;
          group.querySelectorAll(".word-choice.selected").forEach(selected=>{
            if(Number(selected.dataset.order) > removedOrder){
              selected.dataset.order = String(Number(selected.dataset.order) - 1);
            }
          });
        } else {
          button.classList.add("selected");
          button.dataset.order = String(group.querySelectorAll(".word-choice.selected").length);
        }
        updateWordConnect(group);
      });
    });
  });

  document.querySelectorAll(".word-search-table td").forEach(cell=>{
    cell.addEventListener("mousedown", event=>{
      event.preventDefault();
      isSelectingWordSearch = true;
      cell.classList.toggle("selected");
    });

    cell.addEventListener("mouseenter", ()=>{
      if(isSelectingWordSearch){
        cell.classList.add("selected");
      }
    });

    cell.addEventListener("click", event=>{
      event.preventDefault();
    });
  });

  document.addEventListener("mouseup", ()=>{
    isSelectingWordSearch = false;
  });

  document.querySelectorAll("canvas.draw-box").forEach(canvas=>{
    const ctx = canvas.getContext("2d");
    let isDrawing = false;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";

    function getPoint(event){
      const rect = canvas.getBoundingClientRect();
      const source = event.touches ? event.touches[0] : event;
      return {
        x: (source.clientX - rect.left) * (canvas.width / rect.width),
        y: (source.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function startDrawing(event){
      event.preventDefault();
      const point = getPoint(event);
      isDrawing = true;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }

    function draw(event){
      if(!isDrawing) return;
      event.preventDefault();
      const point = getPoint(event);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    function stopDrawing(){
      isDrawing = false;
      ctx.beginPath();
    }

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing, {passive:false});
    canvas.addEventListener("touchmove", draw, {passive:false});
    canvas.addEventListener("touchend", stopDrawing);
  });

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
