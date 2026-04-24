// XP Portfolio window manager (open/minimize/maximize/close + focus + drag + taskbar)

const windows = [...document.querySelectorAll(".window")];
const taskbarApps = document.getElementById("taskbarApps");
const startBtn = document.getElementById("startBtn");
const startMenu = document.getElementById("startMenu");
const allProgramsBtn = document.getElementById("allProgramsBtn");
const allProgramsMenu = document.getElementById("allProgramsMenu");

const login = document.getElementById("loginScreen");
const welcome = document.getElementById("welcomeScreen");
const desktop = document.getElementById("desktop");
const shutdownScreen = document.getElementById("shutdownScreen");
const goodbyeScreen = document.getElementById("goodbyeScreen");
const loginBtn = document.querySelector(".login__icon");
const shutdown = document.querySelector(".turn__off");

const accomItem = document.querySelector(".accom__item");
const projItem = document.querySelector(".accom__item.proj__item");
const accomWindow = document.getElementById("successes");

let z = 100;
let closedId = null;

function showShutdownScreen() {
  if (login) login.hidden = true;
  if (welcome) welcome.hidden = true;
  if (desktop) desktop.hidden = true;
  if (goodbyeScreen) goodbyeScreen.hidden = false;
  setStartMenuOpen(false);

  setTimeout(() => {
    if (shutdownScreen) 
      if (shutdownScreen) shutdownScreen.hidden = true;
      shutdownScreen.hidden = false;
  }, 2000);
}

function shutdownPortfolio() {
  // Browsers only allow closing tabs opened via JS. If close is blocked,
  // fall back to an XP-style shutdown screen so the button still works.
  // window.open("", "_self");
  // window.close();

  setTimeout(() => {
    if (!window.closed) showShutdownScreen();
  }, 60);
}

function initLoginFlow() {
  if (login) login.hidden = true; //temp: skip login for now (toggle when neded)
  if (welcome) welcome.hidden = true;
  if (desktop) desktop.hidden = false; // temp (toggle when needed)
  if (shutdownScreen) shutdownScreen.hidden = true;

  loginBtn?.addEventListener("click", () => {
    if (login) login.hidden = true;
    if (welcome) welcome.hidden = false;
    if (desktop) desktop.hidden = true;

    // XP-like short welcome delay before showing desktop
    setTimeout(() => {
      if (welcome) welcome.hidden = true;
      if (desktop) desktop.hidden = false;
      window.dispatchEvent(new Event("desktop-shown"));
    }, 1500);
  });

  shutdown?.addEventListener("click", shutdownPortfolio);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLoginFlow, { once: true });
} else {
  initLoginFlow();
}

// ---------- helpers ----------
function isStartMenuOpen() {
  return Boolean(startMenu && !startMenu.hidden);
}

function isAllProgramsOpen() {
  return Boolean(allProgramsMenu && !allProgramsMenu.hidden);
}

function positionAllProgramsMenu() {
  if (!allProgramsBtn || !allProgramsMenu) return;

  // Place flyout to the right of the button, aligned to its bottom edge.
  const btnRect = allProgramsBtn.getBoundingClientRect();

  allProgramsMenu.style.left = "0px";
  allProgramsMenu.style.top = "0px";

  const menuRect = allProgramsMenu.getBoundingClientRect();

  let left = btnRect.right - 2;
  let top = btnRect.bottom - menuRect.height;

  const pad = 8;
  const taskbarH = 34;
  left = Math.max(pad, Math.min(left, window.innerWidth - menuRect.width - pad));
  top = Math.max(pad, Math.min(top, window.innerHeight - taskbarH - menuRect.height - pad));

  allProgramsMenu.style.left = `${Math.round(left)}px`;
  allProgramsMenu.style.top = `${Math.round(top)}px`;
}

function setAllProgramsOpen(open) {
  if (!allProgramsBtn || !allProgramsMenu) return;
  allProgramsMenu.hidden = !open;
  allProgramsBtn.setAttribute("aria-expanded", String(open));
  if (open) positionAllProgramsMenu();
}

function setStartMenuOpen(open) {
  if (!startBtn || !startMenu) return;
  if (!open) setAllProgramsOpen(false);
  startMenu.hidden = !open;
  startBtn.setAttribute("aria-expanded", String(open));
  startBtn.classList.toggle("active", open);
}

function bringToFront(win) {
  win.style.zIndex = String(++z);
  windows.forEach(w => w.classList.remove("active"));
  win.classList.add("active");
  setActiveTask(win, true);
}

function ensureTaskButton(win) {
  if (!taskbarApps) return;
  if (taskbarApps.querySelector(`[data-win="${win.id}"]`)) return;

  const title = win.querySelector(".titlebar__title")?.textContent || win.id;
  const icon = win.querySelector(".titlebar__icon")?.textContent || "🗔";

  const btn = document.createElement("button");
  btn.className = "taskbtn";
  btn.dataset.win = win.id;
  btn.innerHTML = `<span aria-hidden="true">${icon}</span><span>${title}</span>`;

  btn.addEventListener("click", () => {
    const isOpen = win.dataset.open === "true" && win.style.display !== "none";
    const isActive = win.classList.contains("active");

    if (!isOpen) {
      openWindow(win.id);
      return;
    }
    if (isActive) {
      minimizeWindow(win);
      return;
    }
    bringToFront(win);
  });

  taskbarApps.appendChild(btn);
}

function removeTaskButton(id) {
  const btn = taskbarApps?.querySelector(`[data-win="${id}"]`);
  if (btn) btn.remove();
}

function setActiveTask(win, active) {
  const btn = taskbarApps?.querySelector(`[data-win="${win.id}"]`);
  if (!btn) return;
  btn.classList.toggle("active", active);
}

// ---------- window actions ----------
function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  setStartMenuOpen(false);
  win.dataset.open = "true";
  win.style.display = "block"; // override default .window{display:none}
  ensureTaskButton(win);
  bringToFront(win);
}

function closeWindow(win) {
  if (!win) return;
  win.dataset.open = "false";
  win.style.display = "none";
  win.classList.remove("active");
  closedId = win.id;
  setActiveTask(win, false);
  // optional: remove from taskbar on close
  removeTaskButton(win.id);
}

function minimizeWindow(win) {
  if (!win) return;
  win.dataset.open = "false";
  win.style.display = "none";
  win.classList.remove("active");
  setActiveTask(win, false);
}

function toggleMaximize(win) {
  if (!win) return;

  const isMax = win.dataset.max === "true";
  if (isMax) {
    // restore
    win.style.top = win.dataset.prevTop || "70px";
    win.style.left = win.dataset.prevLeft || "170px";
    win.style.width = win.dataset.prevW || "";
    win.style.height = win.dataset.prevH || "";
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
    win.style.height = "calc(100% - 64px)"; // keep taskbar visible
    win.dataset.max = "true";
  }

  bringToFront(win);
}

function minimizeAllWindows() {
  windows.forEach((win) => minimizeWindow(win));
}

function closeAllWindows() {
  windows.forEach((win) => closeWindow(win));
}

// ---------- start menu ----------
startBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  setStartMenuOpen(!isStartMenuOpen());
});

startMenu?.addEventListener("click", (e) => {
  const target = e.target.closest("[data-open], [data-href], [data-action]");
  if (!target || !startMenu.contains(target)) return;

  if (target.dataset.open) {
    // "My Recent Documents" uses a placeholder open id.
    // Resolve it to the real last closed window id at click time.
    if (target.dataset.open === "lastClosedWindow") {
      if (closedId) openWindow(closedId);
      return;
    }
    openWindow(target.dataset.open);
    return;
  }

  if (target.dataset.href) {
    window.open(target.dataset.href, "_blank", "noopener");
    setStartMenuOpen(false);
    return;
  }

  const action = target.dataset.action;
  if (action === "all-programs") {
    setAllProgramsOpen(!isAllProgramsOpen());
    return;
  }
  if (action === "logoff") {
    desktop.hidden = true;
    login.hidden = false;
  }
  if (action === "shutdown") {
    shutdownPortfolio();
  }
});

allProgramsMenu?.addEventListener("click", (e) => {
  const target = e.target.closest("[data-open], [data-href]");
  if (!target || !allProgramsMenu.contains(target)) return;

  if (target.dataset.open) {
    openWindow(target.dataset.open);
    return;
  }

  if (target.dataset.href) {
    window.open(target.dataset.href, "_blank", "noopener");
    setStartMenuOpen(false);
  }
});

document.addEventListener("click", (e) => {
  if (!isStartMenuOpen()) return;
  if (e.target.closest("#startMenu") || e.target.closest("#allProgramsMenu") || e.target.closest("#startBtn")) return;
  setStartMenuOpen(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !isStartMenuOpen()) return;
  if (isAllProgramsOpen()) {
    setAllProgramsOpen(false);
    allProgramsBtn?.focus();
    return;
  }
  setStartMenuOpen(false);
  startBtn?.focus();
});

window.addEventListener("resize", () => {
  if (isAllProgramsOpen()) positionAllProgramsMenu();
});

// ---------- desktop icon opening (DOUBLE CLICK) ----------
const iconsContainer = document.querySelector(".icons");

// Double-click opens (XP-style)
iconsContainer?.addEventListener("dblclick", (e) => {
  const icon = e.target.closest(".icon");
  if (!icon) return;

  if (icon.dataset.open) {
    openWindow(icon.dataset.open);
    return;
  }
  if (icon.dataset.href) {
    window.open(icon.dataset.href, "_blank", "noopener")
  }
});

// (Optional) For single-click to open:
// iconsContainer?.addEventListener("click", (e) => {
//   const icon = e.target.closest(".icon[data-open]");
//   if (!icon) return;
//   openWindow(icon.dataset.open);
// });

// ---------- window controls (min/max/close) ----------
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".winbtn[data-action]");
  if (!btn) return;

  const win = btn.closest(".window");
  if (!win) return;

  e.stopPropagation();

  const action = btn.dataset.action;
  if (action === "close") closeWindow(win);
  if (action === "minimize") minimizeWindow(win);
  if (action === "maximize") toggleMaximize(win);
});

// Focus window on mousedown
document.addEventListener("mousedown", (e) => {
  const win = e.target.closest(".window");
  if (!win) return;
  if (win.style.display === "none" || win.dataset.open !== "true") return;
  bringToFront(win);
});

// ---------- dragging (titlebar only) ----------
let drag = null;

document.addEventListener("mousedown", (e) => {
  const bar = e.target.closest("[data-drag]");
  if (!bar) return;
  if (e.target.closest(".winbtn")) return;

  const win = bar.closest(".window");
  if (!win || win.dataset.max === "true") return;

  bringToFront(win);

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

  const pad = 8;
  x = Math.max(pad, Math.min(x, window.innerWidth - win.offsetWidth - pad));
  y = Math.max(pad, Math.min(y, window.innerHeight - win.offsetHeight - 52)); // taskbar

  win.style.left = `${x}px`;
  win.style.top = `${y}px`;
});

document.addEventListener("mouseup", () => {
  drag = null;
});

// ---------- clock ----------
function updateClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
updateClock();
setInterval(updateClock, 1000 * 15);

// Open About by default (comment out if you don't want auto-open)
//openWindow("aboutWindow");

// ---------- desktop icon dragging (Safari-friendly) ----------
(function setupDraggableDesktopIcons() {
  const container = document.querySelector(".icons");
  if (!container) return;

  const icons = [...container.querySelectorAll(".icon")];
  const PAD = 16;        // keep away from edges
  const STEP_Y = 92;     // default vertical spacing
  const DRAG_THRESHOLD = 4;

  const setPos = (el, x, y) => {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  };

  // Initial placement: always reset to default positions on page load.
  // Special-case: Recycle Bin defaults to bottom-right.
  const placeDefaults = () => {
    const maxW = container.clientWidth || window.innerWidth;
    const maxH = container.clientHeight || (window.innerHeight - 44);

    const leftColumnOrder = ["about", "projects", "accom", "contact", "resume"];

    icons.forEach((icon, i) => {
      const id = (icon.dataset.iconId || `icon-${i}`).toLowerCase();

      // Default positions
      if (id === "recycle") {
        // bottom-right
        const x = Math.max(PAD, maxW - icon.offsetWidth - PAD);
        const y = Math.max(PAD, maxH - icon.offsetHeight - PAD);
        setPos(icon, x, y);
        return;
      } // else {
      //   setPos(icon, PAD, PAD + i * STEP_Y);
      // }

      if (id === "counterstrike") {
        // upper right
        const x = Math.max(PAD, maxW - icon.offsetWidth - PAD);
        const y = PAD;
        setPos(icon, x, y);
        return;
      }

      const row = leftColumnOrder.indexOf(id);
      if (row !== -1) {
        // middle right
        const x = PAD;
        const y = PAD + row * STEP_Y;
        // const y = Math.max(PAD, (maxH - icon.offsetHeight) / 2) - maxH * 0.1 + icon.offsetHeight / 2.4;
        setPos(icon, x, y);
        return;
      }

      setPos(icon, PAD, PAD + i * STEP_Y);
    });
  };

  // If images affect size, wait one frame so offsetWidth/Height are correct
  requestAnimationFrame(placeDefaults);
  window.addEventListener("desktop-shown", () => {
    requestAnimationFrame(placeDefaults);
  });

  let drag = null;
  let suppressClick = false;

  container.addEventListener("pointerdown", (e) => {
    const icon = e.target.closest(".icon");
    if (!icon) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Stop link navigation / text selection while dragging
    e.preventDefault();

    icon.setPointerCapture?.(e.pointerId);

    const startLeft = parseFloat(icon.style.left) || 0;
    const startTop  = parseFloat(icon.style.top) || 0;

    drag = {
      icon,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft,
      startTop,
      moved: false
    };

    icon.classList.add("dragging");
  });

  container.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    drag.moved = true;
    suppressClick = true;

    const maxX = container.clientWidth - drag.icon.offsetWidth - PAD;
    const maxY = container.clientHeight - drag.icon.offsetHeight - PAD;

    let x = drag.startLeft + dx;
    let y = drag.startTop + dy;

    x = Math.max(PAD, Math.min(x, maxX));
    y = Math.max(PAD, Math.min(y, maxY));

    setPos(drag.icon, x, y);
  });

  const endDrag = () => {
    if (!drag) return;

    drag.icon.classList.remove("dragging");

    drag = null;

    // Let normal clicks happen again (next tick)
    setTimeout(() => { suppressClick = false; }, 0);
  };

  container.addEventListener("pointerup", endDrag);
  container.addEventListener("pointercancel", endDrag);

  // If you dragged, prevent click/dblclick so icons don't "open" after a drag.
  container.addEventListener("click", (e) => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  container.addEventListener("dblclick", (e) => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);
})();

// document.addEventListener("DOMContentLoaded", () => {
//   if (!dialog) return;
//   if (!dialog.open) dialog.show();

//   dialog.addEventListener("click", (e) => {
//     if (e.target === popupclose) {
//       dialog.hidden = true;
//     }
//   });
// });

const popup = document.getElementById("antivirusPopup");
const shield = document.querySelector(".tray .antivirus");
const closeBtn = popup?.querySelector(".antiv__close");

function placePopupAboveShield() {
  if (!popup || !shield || !popup.open) return;

  const tray = shield.closest(".tray");
  if (!tray) return;

  // Move the whole dialog only.
  const OFFSET_RIGHT = 66;
  const OFFSET_UP = 2;

  const trayRect = tray.getBoundingClientRect();
  const right = Math.max(8, window.innerWidth - trayRect.right + 8 + OFFSET_RIGHT);
  const bottom = Math.max(8, window.innerHeight - trayRect.top + OFFSET_UP);

  popup.style.left = "auto";
  popup.style.top = "auto";
  popup.style.right = `${Math.round(right)}px`;
  popup.style.bottom = `${Math.round(bottom)}px`;
}

document.addEventListener("DOMContentLoaded", () => {
  if (!popup) return;
  popup.show(); // non-modal
  requestAnimationFrame(placePopupAboveShield);
});

window.addEventListener("resize", placePopupAboveShield);
window.addEventListener("desktop-shown", placePopupAboveShield);
const tray = document.querySelector(".tray");
if (tray) {
  new ResizeObserver(placePopupAboveShield).observe(tray);
}

closeBtn?.addEventListener("click", () => popup.hidden = true);

accomItem?.addEventListener("click", () => {
  if (!accomItem) return;

  const url = accomItem.dataset.href;
  if (!url) return;

  window.open(url, "_blank", "noopener");
});

projItem?.addEventListener("click", () => {
  if (!projItem) return;

  const url = projItem.dataset.href;
  if (!url) return;

  window.open(url, "_blank", "noopener");
});
