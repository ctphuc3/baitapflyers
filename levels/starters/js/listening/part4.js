


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

// ===== Palette toggle =====
const paletteBtn = document.getElementById("paletteBtn");
const palettePanel = document.getElementById("palettePanel");

if (paletteBtn && palettePanel) {

  paletteBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    const rect = paletteBtn.getBoundingClientRect();
    // place bubble to the right of palette button and vertically center it
    const panelHeight = palettePanel.offsetHeight || 180;

    palettePanel.style.left = rect.right + 18 + "px"; // add more space between palette button and bubble
    palettePanel.style.top = rect.top + rect.height/2 - panelHeight/2 + "px";

    if (palettePanel.style.display === "block") {
      palettePanel.style.display = "none";
      palettePanel.classList.remove("show");
    } else {
      palettePanel.style.display = "block";
      palettePanel.style.pointerEvents = "auto";
      requestAnimationFrame(()=>palettePanel.classList.add("show"));
    }
  });

  // click outside → hide palette
  document.addEventListener("click", (e) => {
    if (!palettePanel.contains(e.target) && e.target !== paletteBtn) {
      palettePanel.style.display = "none";
      palettePanel.classList.remove("show");
    }
  });
}

// Chỉ cho bấm Show answer sau khi audio kết thúc
if (audioEl && answerBtn) {
  answerBtn.disabled = true;

  audioEl.addEventListener("ended", () => {
    answerBtn.disabled = false;
    answerBtn.classList.add("audio-finished");
    answerUsed = false;

    // change icon to key when audio finished
    answerBtn.textContent = "🔑";
  });
}
ctx.lineCap = "round";
ctx.lineJoin = "round";

let history = [];

function saveState() {
  history.push(drawCanvas.toDataURL());
  if (history.length > 30) history.shift();
}

function undo() {
  if (history.length === 0) return;
  const imgState = new Image();
  imgState.src = history.pop();
  imgState.onload = () => {
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    ctx.drawImage(imgState, 0, 0);
  };
}

function getMousePos(drawCanvas, evt) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = drawCanvas.width / rect.width;
  const scaleY = drawCanvas.height / rect.height;

  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY
  };
}

function toggleUsage() {
  const usage = document.querySelector(".usage-guide");
  if (!usage) return;
  usage.classList.toggle("collapsed");
}

const img = new Image();
const answerImg = new Image();
// === Dynamic JSON loader ===
async function loadPartData() {
  try {
    const params = new URLSearchParams(window.location.search);
    let jsonPath = params.get("data");

    // If no direct data param → build path from index.html params
    if (!jsonPath) {
      const set = params.get("set");
      const test = params.get("test");
      const type = params.get("type");
      const unit = params.get("unit");

      // Skill-builder mode
      if (type === "skill-builder" && unit) {
        jsonPath = `../set-${set || "05"}/test-${String(unit).padStart(2, "0")}/listening/part4.json`;
      }
      // Exam mode
      else if (set && test) {
        jsonPath = `../set-${set}/test-${test}/listening/part4.json`;
      }
      // fallback
      else {
        jsonPath = "../set-05/test-01/listening/part4.json";
      }
    }

    console.log("Loading JSON from:", jsonPath);

    const res = await fetch(jsonPath + "?t=" + Date.now()); // cache bust

    if (!res.ok) {
      throw new Error("JSON not found: " + jsonPath);
    }

    const data = await res.json();

    // RESET previous state (VERY IMPORTANT)
    img.src = "";
    answerImg.src = "";
    window.dynamicExplain = [];

    // AUDIO
    const audioSource = document.getElementById("audioSource");
    if (data.audio && audioSource) {
      audioSource.src = data.audio;
      audioEl.load();
    }

    // IMAGES (force reload)
    if (data.image) {
      img.src = data.image + "?t=" + Date.now();
    }

    if (data.answerImage) {
      answerImg.src = data.answerImage + "?t=" + Date.now();
    }

    // COLORS
    if (data.colors) {
      Object.keys(data.colors).forEach(i => {
        document.documentElement.style.setProperty(`--answer${i}-bg`, data.colors[i].bg);
        document.documentElement.style.setProperty(`--answer${i}-pill`, data.colors[i].pill);
      });
    }

    // EXPLANATIONS
    if (data.explanations) {
      window.dynamicExplain = data.explanations;
    }

  } catch (e) {
    console.error("Load JSON failed:", e);

    alert("Không load được file JSON:\n" + e.message);
  }
}
// Khi ảnh đáp án load xong thì luôn resize và vẽ lại canvas
// Không phụ thuộc vào việc ảnh nền đã load trước hay chưa
answerImg.onload = () => {
  resizeCanvases();
};

// ==== LOCALSTORAGE HELPERS ====
// Use dynamic key based on URL so each test/unit is saved separately
const STORAGE_KEY = "part4_state_" + window.location.pathname + window.location.search;

function saveToStorage() {
  const state = {
    drawData: drawCanvas.width > 0 && drawCanvas.height > 0 ? drawCanvas.toDataURL() : null,
    imageSrc: img.src,
    currentColor,
    textInput: textInput.value,
    answerVisible,
    activeExplain: document.querySelector(".answer-tab.active")?.textContent || null
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const state = JSON.parse(raw);

    // Restore drawing ONLY if same image (avoid mismatch between different tests)
    if (state.drawData && state.imageSrc === img.src) {
      // Delay restore until canvas & base image are fully ready
      const restoreDrawing = () => {
        const imgState = new Image();
        imgState.src = state.drawData;
        imgState.onload = () => {
          ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
          ctx.drawImage(imgState, 0, 0, drawCanvas.width, drawCanvas.height);
        };
      };

      // ALWAYS restore AFTER resize (avoid canvas being cleared)
      const doRestore = () => {
        resizeCanvases();
        restoreDrawing();
      };

      // Ensure BOTH image + canvas size are ready before restoring
      const waitForCanvasReady = () => {
        if (drawCanvas.width > 0 && drawCanvas.height > 0) {
          doRestore();
        } else {
          requestAnimationFrame(waitForCanvasReady);
        }
      };

      if (img.complete) {
        waitForCanvasReady();
      } else {
        img.addEventListener("load", waitForCanvasReady, { once: true });
      }
    }

    // Restore color
    if (state.currentColor) {
      currentColor = state.currentColor;
      document.querySelectorAll(".color").forEach(c => {
        c.classList.toggle("active", c.dataset.color === currentColor);
      });
    }

    // Restore text input
    if (state.textInput !== undefined) {
      textInput.value = state.textInput;
    }

    // Restore answer + explanation
    if (state.answerVisible) {
      if (state.activeExplain) {
        const idx = parseInt(state.activeExplain.replace("Answer ", ""), 10);
        if (!isNaN(idx)) showExplain(idx);
      }
    }

  } catch (e) {
    console.warn("Cannot restore state:", e);
  }
}


function resizeCanvases() {
  // Preserve current drawing before resizing (otherwise canvas resize clears it)
  // IMPORTANT: do NOT capture empty canvas (prevents overwriting saved data)
  let savedDrawing = null;
  if (
    drawCanvas &&
    drawCanvas.width > 0 &&
    drawCanvas.height > 0
  ) {
    try {
      const data = drawCanvas.toDataURL();
      // Only keep if not blank (basic check)
      if (data.length > 1000) {
        savedDrawing = data;
      }
    } catch(e) {}
  }
  const canvasArea = document.querySelector(".canvas-area");

  // Fixed frame that always fits inside viewport (allow larger scaling and centering)
  const frameMaxW = Math.min(canvasArea.offsetWidth - 20, 1400);
  const frameMaxH = Math.min(window.innerHeight - 160, 900);

  const scaleW = frameMaxW / img.width;
  const scaleH = frameMaxH / img.height;
  const scale = Math.min(scaleW, scaleH);

  const displayW = Math.round(img.width * scale);
  const displayH = Math.round(img.height * scale);

  [imageCanvas, drawCanvas, answerCanvas].forEach(c => {
    c.width = displayW;
    c.height = displayH;
    c.style.width = displayW + "px";
    c.style.height = displayH + "px";
  });

  canvasWrap.style.width = displayW + "px";
  canvasWrap.style.height = displayH + "px";

  const answerBox = document.querySelector(".answer-box");
  answerBox.style.width = displayW + "px";
  answerBox.style.height = displayH + "px";

  answerCanvas.width = displayW;
  answerCanvas.height = displayH;
  answerCanvas.style.width = displayW + "px";
  answerCanvas.style.height = displayH + "px";

  imgCtx.clearRect(0, 0, displayW, displayH);
  imgCtx.drawImage(img, 0, 0, displayW, displayH);

  // Restore drawing after resize ONLY if no saved state exists
  if (!localStorage.getItem(STORAGE_KEY) && savedDrawing) {
    const restoreImg = new Image();
    restoreImg.src = savedDrawing;
    restoreImg.onload = () => {
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      ctx.drawImage(restoreImg, 0, 0, drawCanvas.width, drawCanvas.height);
    };
  }

  // Draw answer image aligned to the SAME aspect ratio as the question image
  answerCtx.clearRect(0, 0, displayW, displayH);
  if (answerVisible && answerImg.complete) {

    const baseRatio = img.width / img.height;
    const ansRatio = answerImg.width / answerImg.height;

    let sx = 0;
    let sy = 0;
    let sw = answerImg.width;
    let sh = answerImg.height;

    // crop answer image if ratios differ so it matches the question image frame
    if (ansRatio > baseRatio) {
      sw = answerImg.height * baseRatio;
      sx = (answerImg.width - sw) / 2;
    } else if (ansRatio < baseRatio) {
      sh = answerImg.width / baseRatio;
      sy = (answerImg.height - sh) / 2;
    }

    answerCtx.drawImage(
      answerImg,
      sx, sy, sw, sh,
      0, 0, displayW, displayH
    );
  }

  // Ensure drawing is restored from localStorage after resize (prevents losing color on reload)
  const rawState = localStorage.getItem(STORAGE_KEY);
  if (rawState) {
    try {
      const state = JSON.parse(rawState);
      if (state.drawData) {
        const restoreImg = new Image();
        restoreImg.src = state.drawData;
        restoreImg.onload = () => {
          ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
          ctx.drawImage(restoreImg, 0, 0, drawCanvas.width, drawCanvas.height);
        };
      }
    } catch (e) {
      console.warn("Resize restore failed:", e);
    }
  }
}

let painting = false;
let currentColor = "red";
let mode = "draw"; // draw | text

// unlimited colouring
let colorCount = 0;

img.onload = () => {
  resizeCanvases();
  history = [];

  // DO NOT save empty state on load (this was overwriting stored drawing)

  // Nếu ảnh đáp án đã load trước đó thì vẽ lại
  if (answerImg.complete) {
    answerCtx.clearRect(0, 0, answerCanvas.width, answerCanvas.height);
    answerCtx.drawImage(answerImg, 0, 0, answerCanvas.width, answerCanvas.height);
  }
};
window.addEventListener("resize", resizeCanvases);

document.querySelectorAll(".color").forEach(c => {
  c.addEventListener("click", () => {
    currentColor = c.dataset.color;
    document.querySelectorAll(".color").forEach(x => x.classList.remove("active"));
    c.classList.add("active");
    saveToStorage();
  });
});

drawCanvas.addEventListener("mousedown", () => {
  if (interactionLocked) return;

  saveState();
  painting = true;
});
  
drawCanvas.addEventListener("mouseup", () => {
  painting = false;
  saveToStorage();
});

// Extra safety: save continuously while drawing (prevents data loss on reload)
drawCanvas.addEventListener("mousemove", () => {
  if (painting) {
    saveToStorage();
  }
});
drawCanvas.addEventListener("mouseleave", () => painting = false);

drawCanvas.addEventListener("mousemove", e => {
  if (!painting || mode !== "draw") return;

  const pos = getMousePos(drawCanvas, e);

  ctx.fillStyle = currentColor;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
});

function resetCanvas() {
    // 1. Xóa nét vẽ
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    history = [];

    // 2. Reset text
    mode = "draw";

    // 3. Reset màu về mặc định
    currentColor = "red";
    document.querySelectorAll(".color").forEach(c => {
      c.classList.toggle("active", c.dataset.color === "red");
    });

    // 4. Ẩn đáp án & giải thích
    answerVisible = false;
    document.querySelector(".answer-box").style.display = "none";
    document.getElementById("explanationPanel").style.display = "none";

    // 5. Reset audio + khóa lại Show answer
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
    answerBtn.disabled = true;
    answerBtn.classList.remove("audio-finished");

    // 6. Xóa toàn bộ dữ liệu lưu
    // Only clear when user explicitly resets (keep correct key)
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('skillbuilder_unit1_listening_part4_done');

    // 7. Mở khóa tương tác
    interactionLocked = false;
    drawCanvas.style.pointerEvents = "auto";
    textToolBtn.style.pointerEvents = "auto";
    textInput.disabled = false;
    undoBtn.disabled = false;
}

let answerVisible = false;
let interactionLocked = false; // khóa vẽ & nhập chữ khi show answer
let answerUsed = false; // Show answer chỉ được dùng 1 lần

function toggleAnswer() {
  // Đã bấm Show answer rồi thì cấm bấm lại
  if (answerUsed) return;

  answerUsed = true;
  answerVisible = true;

  const box = document.querySelector(".answer-box");
  const explainPanel = document.getElementById("explanationPanel");

  // === SHOW ANSWER (CHỈ 1 LẦN) ===
  box.style.display = "flex";
  explainPanel.style.display = "block";
  // Ép render + load Answer 1 ngay lần đầu để tránh lỗi layout
  requestAnimationFrame(() => {
    showExplain(1);
  });

  answerCanvas.width = imageCanvas.width;
  answerCanvas.height = imageCanvas.height;
  answerCanvas.style.width = imageCanvas.style.width;
  answerCanvas.style.height = imageCanvas.style.height;

  // Ensure answer image always matches current canvas size
  resizeCanvases();
  answerCtx.clearRect(0, 0, answerCanvas.width, answerCanvas.height);
  if (answerImg.complete) {

    const baseRatio = img.width / img.height;
    const ansRatio = answerImg.width / answerImg.height;

    let sx = 0;
    let sy = 0;
    let sw = answerImg.width;
    let sh = answerImg.height;

    if (ansRatio > baseRatio) {
      sw = answerImg.height * baseRatio;
      sx = (answerImg.width - sw) / 2;
    } else if (ansRatio < baseRatio) {
      sh = answerImg.width / baseRatio;
      sy = (answerImg.height - sh) / 2;
    }

    answerCtx.drawImage(
      answerImg,
      sx, sy, sw, sh,
      0, 0, answerCanvas.width, answerCanvas.height
    );
  }

  // Khóa toàn bộ tương tác
  interactionLocked = true;
  drawCanvas.style.pointerEvents = "none";

  // Khóa Undo
  undoBtn.disabled = true;

  // Khóa luôn nút Show answer
  answerBtn.disabled = true;
  answerBtn.classList.remove("audio-finished");
  // change icon to unlocked lock after clicking
  answerBtn.textContent = "🔓";
  localStorage.setItem('skillbuilder_unit1_listening_part4_done', 'true');

  explainPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  saveToStorage();
}

function showExplain(n) {
  const explainText = document.getElementById("explainText");

  const panel = document.getElementById("explanationPanel");
  panel.classList.remove("answer-1","answer-2","answer-3","answer-4","answer-5");
  panel.classList.add("answer-" + n);

  const tabs = document.querySelectorAll(".answer-tab");
  tabs.forEach(t => t.classList.remove("active"));
  tabs[n - 1].classList.add("active");

  const explainScripts = window.dynamicExplain
    ? window.dynamicExplain.reduce((acc, text, idx) => {
        acc[idx + 1] = text;
        return acc;
      }, {})
    : {};

  let script = explainScripts[n] || "";

  // Bold speaker names
  script = script.replace(/(Woman:|Girl:)/g, '<strong>$1</strong>');

  // Convert line breaks to <br>
  script = script.replace(/\n/g, '<br>');

  // Add answer heading on top
  explainText.innerHTML = `<strong>Answer ${n}</strong><br>${script}`;
  saveToStorage();
}

// Restore state when page loads
window.addEventListener("load", async () => {
  await loadPartData();

  // Always ensure resize happens BEFORE restore
  const doLoad = () => {
    resizeCanvases();

    // Delay restore slightly to ensure canvas is fully stable
    setTimeout(() => {
      loadFromStorage();
    }, 50);
  };

  if (img.complete) {
    doLoad();
  } else {
    img.addEventListener("load", doLoad, { once: true });
  }
});

// Ensure state is saved before page reload / close
window.addEventListener("beforeunload", () => {
  saveToStorage();
});