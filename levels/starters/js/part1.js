const imageCanvas = document.getElementById("imageCanvas");
const imgCtx = imageCanvas.getContext("2d");

const drawCanvas = document.getElementById("drawCanvas");
const ctx = drawCanvas.getContext("2d");

const answerCanvas = document.getElementById("answerCanvas");
const answerCtx = answerCanvas.getContext("2d");

const canvasWrap = document.getElementById("canvasWrap");

const audioEl = document.getElementById("audioPlayer");
const answerBtn = document.getElementById("answerBtn");
const undoBtn = document.querySelector(".undo-btn");

let answerVisible = false;
let interactionLocked = false;
let answerUsed = false;
let allowSeek = false;

ctx.lineCap = "round";
ctx.lineJoin = "round";

let history = [];
let arrows = [];

const MAX_ARROWS = 5;
let arrowCount = 0;

const arrowColors = [
  "#fbc02d",
  "#43a047",
  "#1e88e5",
  "#f3b6d8",
  "#e53935"
];

const STORAGE_KEY = window.location.pathname + "_part1_state";

if (audioEl && answerBtn) {
  answerBtn.disabled = true;
  audioEl.addEventListener("ended", () => {
    allowSeek = true;
    answerBtn.disabled = false;
    answerBtn.classList.add("audio-finished");
    answerUsed = false;
    answerBtn.textContent = "🔒";
    saveToStorage();
  });
}

function saveState(){
  history.push(drawCanvas.toDataURL());
  if(history.length>30) history.shift();
}

function undo(){
  if(history.length===0) return;
  if(arrowCount>0){
    arrowCount--;
    if(arrows.length>0) arrows.pop();
  }
  updateArrowCounter();
  const imgState = new Image();
  imgState.src = history.pop();
  imgState.onload = () => {
    ctx.clearRect(0,0,drawCanvas.width,drawCanvas.height);
    ctx.drawImage(imgState,0,0);
    saveToStorage();
  };
}

function getMousePos(canvas,evt){
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width/rect.width;
  const scaleY = canvas.height/rect.height;
  return{
    x:(evt.clientX-rect.left)*scaleX,
    y:(evt.clientY-rect.top)*scaleY
  };
}

const img = document.getElementById("questionImage");
const answerImg = document.getElementById("answerImage");

function saveToStorage(){
  const state = {
    drawData:drawCanvas.toDataURL(),
    arrowCount,
    history,
    answerVisible,
    audioTime:audioEl?audioEl.currentTime:0,
    audioPlayed:allowSeek
  };
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}

function loadFromStorage(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return;
  try{
    const state = JSON.parse(raw);
    arrowCount = state.arrowCount || 0;
    history = Array.isArray(state.history)?state.history.slice():[];
    if(state.drawData){
      const imgState = new Image();
      imgState.src = state.drawData;
      imgState.onload = () => {
        ctx.clearRect(0,0,drawCanvas.width,drawCanvas.height);
        ctx.drawImage(imgState,0,0);
      };
    }
    allowSeek=false;
    answerBtn.disabled=true;
  }
  catch(e){
    console.warn("restore error",e);
  }
}

function resizeCanvases(){
  if(arrowCount>0) return;
  const canvasArea = document.querySelector(".canvas-area");
  const frameMaxW = canvasArea.offsetWidth-10;
  const frameMaxH = window.innerHeight-120;
  const scaleW = frameMaxW/img.width;
  const scaleH = frameMaxH/img.height;
  const scale = Math.min(scaleW,scaleH);
  const displayW = Math.round(img.width*scale);
  const displayH = Math.round(img.height*scale);
  [imageCanvas,drawCanvas,answerCanvas].forEach(c=>{
    c.width = displayW;
    c.height = displayH;
    c.style.width = displayW+"px";
    c.style.height = displayH+"px";
  });
  canvasWrap.style.width = displayW+"px";
  canvasWrap.style.height = displayH+"px";

  const answerBox = document.querySelector(".answer-box");
  if(answerBox){
    answerBox.style.width = displayW+"px";
    answerBox.style.maxWidth = "100%";
  }

  imgCtx.clearRect(0,0,displayW,displayH);
  imgCtx.drawImage(img,0,0,displayW,displayH);

  // IMPORTANT: always draw answer image like original HTML logic
  answerCtx.clearRect(0,0,displayW,displayH);
  answerCtx.drawImage(answerImg,0,0,displayW,displayH);
}

let drawingArrow=false;
let startX=0;
let startY=0;

function updateArrowCounter(){
  if(arrowCount===MAX_ARROWS){
    window.parent.postMessage({
      type:"LISTENING_PART_DONE",
      part:1
    },"*");
  }
  else{
    window.parent.postMessage({
      type:"PART_RESET",
      part:1
    },"*");
  }
}

function drawArrow(ctx,fromX,fromY,toX,toY,color){
  const headLength=16;
  const dx=toX-fromX;
  const dy=toY-fromY;
  const angle=Math.atan2(dy,dx);
  ctx.lineWidth=4;
  ctx.strokeStyle=color;
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(fromX,fromY);
  ctx.lineTo(toX,toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX,toY);
  ctx.lineTo(
    toX-headLength*Math.cos(angle-Math.PI/6),
    toY-headLength*Math.sin(angle-Math.PI/6)
  );
  ctx.lineTo(
    toX-headLength*Math.cos(angle+Math.PI/6),
    toY-headLength*Math.sin(angle+Math.PI/6)
  );
  ctx.closePath();
  ctx.fill();
}

drawCanvas.addEventListener("mousedown",e=>{
  if(interactionLocked) return;
  if(arrowCount>=MAX_ARROWS) return;
  const pos=getMousePos(drawCanvas,e);
  startX=pos.x;
  startY=pos.y;
  drawingArrow=true;
  saveState();
});

drawCanvas.addEventListener("mouseup",e=>{
  if(!drawingArrow) return;
  if(arrowCount>=MAX_ARROWS){
    drawingArrow=false;
    return;
  }
  const pos=getMousePos(drawCanvas,e);
  const color=arrowColors[arrowCount];
  drawArrow(ctx,startX,startY,pos.x,pos.y,color);
  arrows.push({fromX:startX,fromY:startY,toX:pos.x,toY:pos.y});
  arrowCount++;
  updateArrowCounter();
  drawingArrow=false;
  saveToStorage();
});

function resetCanvas(){
  ctx.clearRect(0,0,drawCanvas.width,drawCanvas.height);
  history=[];
  arrowCount=0;
  arrows=[];
  updateArrowCounter();
  document.querySelector(".answer-box").style.display="none";
  document.getElementById("explanationPanel").style.display="none";
  if(audioEl){
    audioEl.pause();
    audioEl.currentTime=0;
  }
  answerBtn.disabled=true;
  answerBtn.classList.remove("audio-finished");
  localStorage.removeItem(STORAGE_KEY);
  interactionLocked=false;
  drawCanvas.style.pointerEvents="auto";
  undoBtn.disabled=false;
}

function toggleAnswer(){
  if(answerUsed) return;
  answerUsed = true;
  answerVisible = true;
  const box = document.querySelector(".answer-box");
  if(!box) return;
  // Just reveal — image already drawn by resizeCanvases
  box.style.display = "flex";
  const side = document.getElementById("explanationSide");
  if(side) side.style.display = "block";
  const explainPanel = document.getElementById("explanationPanel");
  if(explainPanel) explainPanel.style.display = "block";
  requestAnimationFrame(()=>showExplain(1));
  interactionLocked = true;
  drawCanvas.style.pointerEvents = "none";
  undoBtn.disabled = true;
  answerBtn.disabled = true;
  answerBtn.textContent = "🔓";
  window.parent.postMessage({
    type:"LISTENING_PART_DONE",
    part:1
  },"*");
  saveToStorage();
}

window.addEventListener("resize",resizeCanvases);

window.addEventListener("load",()=>{
  loadFromStorage();
  updateArrowCounter();
});

if (img.complete) {
  resizeCanvases();
} else {
  img.onload = resizeCanvases;
}

let explainData = {};
const explainNode = document.getElementById("explainData");
if (explainNode) {
  try {
    explainData = JSON.parse(explainNode.textContent);
  } catch (e) {
    console.warn("Invalid explainData JSON", e);
  }
}

function showExplain(n){
  const panel = document.getElementById("explanationPanel");
  const explainText = document.getElementById("explainText");
  if(!panel || !explainText) return;
  panel.classList.remove("answer-1","answer-2","answer-3","answer-4","answer-5");
  panel.classList.add("answer-"+n);
  const tabs=document.querySelectorAll(".answer-tab");
  tabs.forEach(t=>t.classList.remove("active"));
  if(tabs[n-1]) tabs[n-1].classList.add("active");
  let text = explainData[n] || "";
  text = text.replace(/^([A-Za-z]+):/gm,"<strong>$1:</strong>");
  explainText.innerHTML =
  `<strong style="font-size:24px;display:block;margin-bottom:12px;">Answer ${n}</strong>` + text;
}