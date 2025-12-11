const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const spinBtn = document.getElementById("spinBtn");
const addBtn = document.getElementById("addBtn");
const clearBtn = document.getElementById("clearBtn");
const nameInput = document.getElementById("nameInput");
const nameListDiv = document.getElementById("nameList");
const countLabel = document.getElementById("countLabel");
const lastResult = document.getElementById("lastResult");
const confetti = document.getElementById("confetti");
const spinLimitMsg = document.getElementById("spinLimitMsg");
const themeToggle = document.getElementById("themeToggle");
const keyInput = document.getElementById("keyInput");
const authBtn = document.getElementById("authBtn");
const lockHint = document.getElementById("lockHint");

const SECRET_KEY = "navidad2024"; // Ajusta esta clave para ti
const SPIN_LIMIT_KEY = "roulette-spin-used";

let names = [];
let angleCurrent = 0;
let spinning = false;
let controlsUnlocked = false;

const palette = ["#b91c1c", "#22c55e", "#f59e0b", "#0ea5e9", "#a855f7"];

// ---------- Funciones de dibujo de la ruleta ----------
function getColor(i) {
  return palette[i % palette.length];
}

function drawWheel() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) - 10;

  ctx.clearRect(0, 0, w, h);

  if (names.length === 0) {
    ctx.save();
    ctx.fillStyle = "#f1f5f9";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.font = "16px system-ui";
    ctx.fillText("Agrega nombres para empezar", cx, cy);
    ctx.restore();
    return;
  }

  const arcSize = (2 * Math.PI) / names.length;

  for (let i = 0; i < names.length; i++) {
    const startAngle = angleCurrent + i * arcSize;
    const endAngle = startAngle + arcSize;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = getColor(i);
    ctx.fill();
    ctx.strokeStyle = "#fef2f2";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arcSize / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#0f172a";
    ctx.font = "15px system-ui";
    ctx.fillText(names[i], radius - 14, 5);
    ctx.restore();
  }
}

function normalizeAngle(angle) {
  const twoPi = 2 * Math.PI;
  angle = angle % twoPi;
  if (angle < 0) angle += twoPi;
  return angle;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ---------- Límite de giro ----------
function hasSpinAvailable() {
  return localStorage.getItem(SPIN_LIMIT_KEY) !== "true";
}

function markSpinUsed() {
  localStorage.setItem(SPIN_LIMIT_KEY, "true");
  updateSpinLimitState();
}

function updateSpinLimitState() {
  const used = !hasSpinAvailable();
  spinBtn.disabled = spinning || used;
  spinBtn.style.opacity = spinBtn.disabled ? "0.6" : "1";
  spinLimitMsg.textContent = used
    ? "Este dispositivo ya usó su único giro disponible."
    : "";
}

// ---------- Ruleta (spin) ----------
function spinWheel() {
  if (spinning) return;
  if (!hasSpinAvailable()) {
    alert("Solo se permite un giro por dispositivo en este enlace.");
    updateSpinLimitState();
    return;
  }
  if (names.length === 0) {
    alert("Primero agrega al menos un nombre ✍️");
    return;
  }

  spinning = true;
  updateSpinLimitState();

  const num = names.length;
  const arcSize = (2 * Math.PI) / num;
  const randomIndex = Math.floor(Math.random() * num);
  const pointerAngle = (3 * Math.PI) / 2;
  const targetAngleBase = pointerAngle - (randomIndex * arcSize + arcSize / 2);
  const current = normalizeAngle(angleCurrent);
  const diff = normalizeAngle(targetAngleBase - current);
  const extraTurns = 5;
  const totalRotation = diff + extraTurns * 2 * Math.PI;
  const duration = 4000;
  const startTime = performance.now();

  function animate(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(t);

    angleCurrent = current + totalRotation * eased;
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;

      const selectedName = names[randomIndex];
      lastResult.innerHTML =
        `Último seleccionado: <strong>${selectedName}</strong>`;
      showConfetti();
      alert("Nombre seleccionado: " + selectedName);

      names.splice(randomIndex, 1);
      angleCurrent = 0;
      updateNameList();
      markSpinUsed();
      drawWheel();
    }
  }

  requestAnimationFrame(animate);
}

// ---------- Confetti sencillo ----------
function showConfetti() {
  confetti.classList.remove("hidden");
  confetti.classList.add("show");

  setTimeout(() => {
    confetti.classList.remove("show");
    confetti.classList.add("hidden");
  }, 700);
}

// ---------- Manejo de lista de nombres ----------
function updateNameList() {
  nameListDiv.innerHTML = "";

  if (names.length === 0) {
    nameListDiv.innerHTML =
      '<p class="empty-text">No hay nombres todavía. ¡Empieza añadiendo uno! ✨</p>';
  } else {
    names.forEach((name, index) => {
      const pill = document.createElement("span");
      pill.className = "name-pill";
      pill.innerHTML = `
        <span title="${name}">${name}</span>
        <button title="Eliminar">✕</button>
      `;
      const btn = pill.querySelector("button");
      btn.addEventListener("click", () => {
        names.splice(index, 1);
        updateNameList();
        drawWheel();
      });
      nameListDiv.appendChild(pill);
    });
  }

  countLabel.textContent = String(names.length);
}

// ---------- Acciones de botones / inputs ----------
function addName() {
  if (!controlsUnlocked) {
    alert("Solo el anfitrión puede añadir nombres. Desbloquea primero.");
    return;
  }
  const value = nameInput.value.trim();
  if (!value) return;
  names.push(value);
  nameInput.value = "";
  updateNameList();
  drawWheel();
  nameInput.focus();
}

function clearAll() {
  if (!controlsUnlocked) {
    alert("Solo el anfitrión puede limpiar la lista.");
    return;
  }
  if (!names.length) return;
  if (!confirm("¿Seguro que quieres eliminar todos los nombres?")) return;
  names = [];
  lastResult.textContent = "";
  angleCurrent = 0;
  updateNameList();
  drawWheel();
}

function setLockState(unlocked) {
  controlsUnlocked = unlocked;
  addBtn.disabled = !unlocked;
  clearBtn.disabled = !unlocked;
  nameInput.disabled = !unlocked;
  const statusText = unlocked
    ? "Controles desbloqueados. Ya puedes añadir o limpiar nombres."
    : "Las acciones están bloqueadas. Introduce la clave para activar los controles.";
  lockHint.textContent = statusText;
  authBtn.textContent = unlocked ? "Bloquear" : "Desbloquear";
}

function handleAuth() {
  if (controlsUnlocked) {
    setLockState(false);
    keyInput.value = "";
    return;
  }

  const attempt = keyInput.value.trim();
  if (!attempt) {
    alert("Ingresa tu clave secreta.");
    return;
  }

  if (attempt === SECRET_KEY) {
    setLockState(true);
    keyInput.value = "";
    alert("Controles desbloqueados. ¡Felices fiestas!");
  } else {
    lockHint.textContent = "Clave incorrecta. Inténtalo de nuevo.";
  }
}

// ---------- Tema ----------
function applyTheme(dark) {
  document.body.classList.toggle("dark", dark);
  themeToggle.textContent = dark ? "☀️ Modo día" : "🌙 Modo noche";
  localStorage.setItem("roulette-theme", dark ? "dark" : "light");
}

function initTheme() {
  const saved = localStorage.getItem("roulette-theme");
  applyTheme(saved === "dark");
}

// Eventos
addBtn.addEventListener("click", addName);

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addName();
  }
});

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark");
  applyTheme(!isDark);
});

authBtn.addEventListener("click", handleAuth);

keyInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleAuth();
  }
});

spinBtn.addEventListener("click", spinWheel);
clearBtn.addEventListener("click", clearAll);

// Dibujo inicial
setLockState(false);
updateNameList();
initTheme();
updateSpinLimitState();
drawWheel();
