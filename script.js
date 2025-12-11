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

let names = [];
let angleCurrent = 0;
let spinning = false;

// ---------- Funciones de dibujo de la ruleta ----------

function getColor(i, total) {
  const hue = (i * 360) / total;
  return `hsl(${hue}, 75%, 65%)`;
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
    ctx.fillStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#6b7280";
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

    // Segmento
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = getColor(i, names.length);
    ctx.fill();
    ctx.strokeStyle = "#f9fafb";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texto
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

// ---------- Ruleta (spin) ----------

function spinWheel() {
  if (spinning) return;
  if (names.length === 0) {
    alert("Primero agrega al menos un nombre ✍️");
    return;
  }

  spinning = true;
  spinBtn.disabled = true;
  spinBtn.style.opacity = "0.6";

  const num = names.length;
  const arcSize = (2 * Math.PI) / num;

  // Elegimos un índice ganador al azar
  const randomIndex = Math.floor(Math.random() * num);

  // Queremos que ese índice quede arriba (en la punta)
  const pointerAngle = (3 * Math.PI) / 2; // hacia arriba
  const targetAngleBase =
    pointerAngle - (randomIndex * arcSize + arcSize / 2);

  const current = normalizeAngle(angleCurrent);
  const diff = normalizeAngle(targetAngleBase - current);

  const extraTurns = 5; // vueltas extra
  const totalRotation = diff + extraTurns * 2 * Math.PI;

  const duration = 4000; // ms
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
      spinBtn.disabled = false;
      spinBtn.style.opacity = "1";

      const selectedName = names[randomIndex];
      lastResult.innerHTML =
        `Último seleccionado: <strong>${selectedName}</strong>`;
      showConfetti();
      alert("Nombre seleccionado: " + selectedName);

      // Eliminar el nombre ganador
      names.splice(randomIndex, 1);
      angleCurrent = 0;
      updateNameList();
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
  const value = nameInput.value.trim();
  if (!value) return;
  names.push(value);
  nameInput.value = "";
  updateNameList();
  drawWheel();
  nameInput.focus();
}

function clearAll() {
  if (!names.length) return;
  if (!confirm("¿Seguro que quieres eliminar todos los nombres?")) return;
  names = [];
  lastResult.textContent = "";
  angleCurrent = 0;
  updateNameList();
  drawWheel();
}

// Eventos
addBtn.addEventListener("click", addName);

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addName();
  }
});

spinBtn.addEventListener("click", spinWheel);
clearBtn.addEventListener("click", clearAll);

// Dibujo inicial
updateNameList();
drawWheel();
