// --- Basic XP-like window system: open/close/minimize + focus + drag + taskbar ---

const windows = [...document.querySelectorAll(".window")];
const taskbarApps = document.getElementById("taskbarApps");
let topZ = 10;

function setTop(win) {
  topZ += 1;
  win.style.zIndex = topZ;
  windows.forEach(w => w.classList.remove("active"));
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  win.dataset.open = "true";
  setTop(win);
  ensureTaskButton(win);
  setActiveTask(win, true);
}

function closeWindow(win) {
  win.dataset.open = "false";
  removeTaskButton(win.id);
}

function minimizeWindow(win) {
  win.dataset.open = "false";
  setActiveTask(win, false);
}

function toggleMaximize(win) {
  const isMax = win.dataset.max === "true";
  if (isMax) {
    // restore
    win.style.top = win.dataset.prevTop || "70px";
    win.style.left = win.dataset.prevLeft || "170px";
    win.style.width = win.dataset.prevW || "720px";
    win.style.height = win.dataset.prevH || "420px";
    win.dataset.max = "false";
  } else {
    // save + maximize
    win.dataset.prevTop = win.style.top || getComputedStyle(win).top;
    win.dataset.prevLeft = win.style.left || getComputedStyle(win).left;
    win.dataset.prevW = win.style.width || getComputedStyle(win).width;
    win.dataset.prevH = win.style.height || getComputedStyle(win).height;

    win.style.top = "10px";
    win.style.left = "10px";
    win.style.width = "calc(100% - 20px)";
    win.style.height = "calc(100% - 64px)"; // taskbar space
    win.dataset.max = "true";
  }
  setTop(win);
}

function ensureTaskButton(win) {
  if (taskbarApps.querySelector(`[data-win="${win.id}"]`)) return;

  const title = win.querySelector(".titlebar__title")?.textContent || win.id;
  const icon = win.querySelector(".titlebar__icon")?.textContent || "🗔";

  const btn = document.createElement("button");
  btn.className = "taskbtn";
  btn.dataset.win = win.id;
  btn.innerHTML = `<span aria-hidden="true">${icon}</span><span>${title}</span>`;

  btn.addEventListener("click", () => {
    // If minimized/closed -> open, else bring to front
    if (win.dataset.open !== "true") {
      win.dataset.open = "true";
    }
    setTop(win);
    setActiveTask(win, true);
  });

  taskbarApps.appendChild(btn);
}

function removeTaskButton(id) {
  const btn = taskbarApps.querySelector(`[data-win="${id}"]`);
  if (btn) btn.remove();
}

function setActiveTask(win, active) {
  const btn = taskbarApps.querySelector(`[data-win="${win.id}"]`);
  if (!btn) return;
  btn.classList.toggle("active", active);
}

// Desktop icons open windows
document.querySelectorAll("[data-open]").forEach(el => {
  el.addEventListener("dblclick", () => openWindow(el.dataset.open));
  // single click also okay on web:
  el.addEventListener("click", () => openWindow(el.dataset.open));
});

// Window controls + focus
windows.forEach(win => {
  win.style.zIndex = ++topZ;

  win.addEventListener("mousedown", () => {
    setTop(win);
    setActiveTask(win, true);
  });

  win.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === "close") closeWindow(win);
      if (action === "minimize") minimizeWindow(win);
      if (action === "maximize") toggleMaximize(win);
    });
  });

  // initial task buttons for windows that start open
  if (win.dataset.open === "true") ensureTaskButton(win);
});

// Simple drag (titlebar only)
let drag = null;

document.addEventListener("mousedown", (e) => {
  const bar = e.target.closest("[data-drag]");
  if (!bar) return;

  const win = bar.closest(".window");
  if (!win || win.dataset.max === "true") return;

  setTop(win);
  setActiveTask(win, true);

  const rect = win.getBoundingClientRect();
  drag = {
    win,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top
  };
});

document.addEventListener("mousemove", (e) => {
  if (!drag) return;
  const { win, offsetX, offsetY } = drag;

  let x = e.clientX - offsetX;
  let y = e.clientY - offsetY;

  // keep within viewport a bit
  const pad = 8;
  x = Math.max(pad, Math.min(x, window.innerWidth - win.offsetWidth - pad));
  y = Math.max(pad, Math.min(y, window.innerHeight - win.offsetHeight - 52)); // taskbar

  win.style.left = `${x}px`;
  win.style.top = `${y}px`;
});

document.addEventListener("mouseup", () => {
  drag = null;
});

// Clock
function updateClock() {
  const el = document.getElementById("clock");
  const now = new Date();
  el.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
updateClock();
setInterval(updateClock, 1000 * 15);

// Open About by default
openWindow("aboutWindow");