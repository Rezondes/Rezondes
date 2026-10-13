"use strict";

const $ = sel => document.querySelector(sel);
const out = $("#out");
const form = $("#cmd");
const input = $("#cmd-input");
const rig = $("#rig");
const screen = $("#screen");
const PROMPT = "root@rezondes:~$";

// --- Inhalte (Projekte kommen aus projects.json) -----------------------------
const profile = [
  ["NAME", "Rezondes"],
  ["ROLLE", "Systems Analyst und Application Developer"],
  ["FOKUS", "C# / .NET"],
  ["PROGRAMMIERT", "seit 2019"],
  ["AUSBILDUNG", "Fachinformatiker Anwendungsentwicklung, abgeschlossen 2022"],
  ["MOTTO", "Just a dude who loves programming."],
];

const skills = [
  ["--core", ["C#", ".NET", "ASP.NET Core", "Blazor", "Entity Framework"]],
  ["--data", ["MySQL"]],
  ["--web", ["TypeScript", "JavaScript", "React"]],
  ["--more", ["Python", "Flutter"]],
  ["--ops", ["Docker", "Linux (Ubuntu, Debian)"]],
];

const contact = [["GITHUB", "https://github.com/Rezondes"]];

let projects = null;
const projectsLoaded = fetch("projects.json", { cache: "no-cache" })
  .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
  .then(list => { projects = list; })
  .catch(() => {});

// --- Matrix-Regen im Hintergrund -------------------------------------------
const rain = (() => {
  const canvas = $("#rain");
  const ctx = canvas.getContext("2d");
  const glyphs = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789{}<>=;#ABCDEF";
  const size = 16;
  const glyph = () => glyphs[(Math.random() * glyphs.length) | 0];
  let rows = 0;
  let drops = [];
  let timer = null;

  // Ein Tropfen pro Spalte: Kopf bei Zeile y, dahinter eine Spur, die nach oben hin verlischt.
  // Startet oberhalb des Bildes, darum ist der Regen beim Laden leer und setzt nach und nach ein.
  const newDrop = (spread = 1) => ({
    y: -Math.random() * rows * spread,
    speed: 0.5 + Math.random() * 0.6,
    length: 8 + ((Math.random() * 22) | 0),
    cells: [],
  });

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    rows = Math.ceil(canvas.height / size);
    drops = Array.from({ length: Math.ceil(canvas.width / size) }, () => newDrop());
  }

  // Jedes Bild wird komplett neu gezeichnet, darum bleibt kein grauer Rest stehen
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${size}px "Share Tech Mono", monospace`;
    drops.forEach((d, col) => {
      const head = Math.floor(d.y);
      d.y += d.speed;
      if (Math.floor(d.y) !== head) d.cells[Math.floor(d.y)] = glyph();
      if (Math.random() < 0.05 && head >= 0) d.cells[head - ((Math.random() * d.length) | 0)] = glyph();
      for (let k = 0; k < d.length; k++) {
        const row = head - k;
        if (row < 0 || row >= rows || !d.cells[row]) continue;
        ctx.globalAlpha = 1 - k / d.length;
        ctx.fillStyle = k === 0 ? "#39FF14" : "#1E9E0F";
        ctx.fillText(d.cells[row], col * size, (row + 1) * size);
      }
      if (head - d.length > rows) drops[col] = newDrop(0.5);
    });
    ctx.globalAlpha = 1;
  }

  addEventListener("resize", resize);
  resize();
  return {
    on() { if (!timer) timer = setInterval(frame, 50); canvas.classList.remove("off"); },
    off() { clearInterval(timer); timer = null; canvas.classList.add("off"); },
    get running() { return timer !== null; },
  };
})();

rain.on();

// --- 3D-Monitor (nur Desktop und Tablet) -----------------------------------------
const wide = matchMedia("(min-width: 720px)");

// Jedes .box3d bekommt Seiten, Deckel, Boden und Rückwand; die Vorderseite ist das Element selbst
document.querySelectorAll(".box3d").forEach(box => {
  for (const side of ["l", "r", "t", "b", "k"]) box.append(Object.assign(document.createElement("div"), { className: `face ${side}` }));
});

// Drehen per Ziehen neben dem Bildschirm; der Winkel läuft dem Ziel weich hinterher
const tilt = (() => {
  const model = $("#model");
  const MAX = 40;
  let current = 0;
  let target = 0;
  let frame = 0;
  let dragX = null;
  let dragStart = 0;

  function animate() {
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.01) current = target;
    model.style.setProperty("--ry", `${current.toFixed(2)}deg`);
    frame = current === target ? 0 : requestAnimationFrame(animate);
  }

  function set(deg) {
    target = Math.max(-MAX, Math.min(MAX, deg));
    if (!frame) frame = requestAnimationFrame(animate);
  }

  // Ziehen geht überall, auch auf Knöpfen; gedreht wird erst ab 5 px Bewegung,
  // und dann löst der Klick am Ende nichts aus. Ausgenommen: Eingabe und Scrollbalken.
  const onScrollbar = e => e.target === out && e.offsetX > out.clientWidth;
  const grabbable = e => wide.matches && !e.target.closest("input") && !onScrollbar(e);
  let dragging = false;

  addEventListener("pointerdown", e => {
    dragging = false;
    if (e.button !== 0 || !grabbable(e)) return;
    dragX = e.clientX;
    dragStart = target;
  });
  addEventListener("pointermove", e => {
    if (dragX === null) return;
    if (!dragging && Math.abs(e.clientX - dragX) < 5) return;
    dragging = true;
    document.body.classList.add("dragging");
    set(dragStart + (e.clientX - dragX) * 0.15);
  });
  const end = () => { dragX = null; document.body.classList.remove("dragging"); };
  addEventListener("pointerup", end);
  addEventListener("pointercancel", () => { dragging = false; end(); });
  addEventListener("click", e => {
    if (!dragging) return;
    dragging = false;
    e.stopPropagation();
    e.preventDefault();
  }, true);
  addEventListener("dblclick", e => { if (grabbable(e) && !e.target.closest("button, a")) set(0); });

  function snap(deg) {
    current = target = deg;
    model.style.setProperty("--ry", `${deg}deg`);
  }

  return { set, snap, MAX };
})();

const crt = {
  get on() { return rig.classList.contains("crt"); },
  set(on) {
    rig.classList.toggle("crt", on);
    try { localStorage.setItem("crt", on ? "1" : "0"); } catch {}
  },
};
try { crt.set(localStorage.getItem("crt") !== "0"); } catch { crt.set(true); }

// --- Ausgabe -------------------------------------------------------------------
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function print(node) {
  out.append(node);
  out.scrollTop = out.scrollHeight;
  return node;
}

const line = (text = "", className) => print(el("div", className, text));
const error = text => line(`!! ${text}`, "error");

function link(href, text, className) {
  const a = el("a", className, text);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  a.draggable = false;
  return a;
}

// Akte: Schlüssel, Punkte bis Spalte 16, dann ": Wert"
function dossier(key, value, href) {
  if (!value) return;
  const row = el("div");
  row.append(key, el("span", "muted", ".".repeat(Math.max(2, 16 - key.length))), ": ");
  row.append(href ? link(href, value) : value);
  print(row);
}

// --- Zeitsteuerung, die ein übersprungenes Intro sofort abschliesst ----------
let skipping = false;
let skipSignal;
let skipped;
function resetSkip() {
  skipping = false;
  skipped = new Promise(resolve => { skipSignal = resolve; });
}
resetSkip();

const sleep = ms => (skipping ? Promise.resolve() : Promise.race([new Promise(r => setTimeout(r, ms)), skipped]));

const inIntro = () => document.body.classList.contains("intro");

// Befehle laufen nacheinander, auch wenn mehrere Tasten schnell gedrückt werden.
// ESC während einer Ausgabe zeigt sie sofort ganz; danach animiert der nächste Befehl wieder.
let queue = Promise.resolve();
const enqueue = job => (queue = queue.then(() => { if (!inIntro()) resetSkip(); return job(); }).catch(console.error));

async function typeCommand(cmd) {
  input.value = "";
  for (const ch of cmd) {
    input.value += ch;
    await sleep(45);
  }
  await sleep(150);
  input.value = "";
  await run(cmd);
}

// Arbeitszeile mit rotierendem Schrägstrich, verschwindet wenn die Ausgabe kommt
async function busy(text) {
  const node = line(`${text} --/`, "muted");
  const frames = "/-\\|";
  let i = 0;
  const timer = setInterval(() => { node.textContent = node.textContent.slice(0, -1) + frames[++i % 4]; }, 120);
  await sleep(350 + Math.random() * 300);
  clearInterval(timer);
  node.remove();
}

async function typeText(node, text, msPerChar) {
  const step = Math.max(1, Math.round(16 / msPerChar));
  for (let i = step; i < text.length; i += step) {
    node.textContent = text.slice(0, i);
    out.scrollTop = out.scrollHeight;
    await sleep(16);
  }
  node.textContent = text;
}

// Neue Ausgabe Zeile für Zeile drucken: reine Textzeilen werden getippt,
// Zeilen mit Links oder Knöpfen erscheinen ganz. Fehler stehen sofort da.
async function reveal(nodes) {
  const typed = n => !n.children.length && n.textContent && !n.classList.contains("error");
  nodes.forEach(n => { n.hidden = true; });
  const chars = nodes.filter(typed).reduce((sum, n) => sum + n.textContent.length, 0);
  const msPerChar = Math.min(8, 800 / Math.max(chars, 1));
  for (const n of nodes) {
    n.hidden = false;
    if (typed(n) && !skipping) await typeText(n, n.textContent, msPerChar);
    out.scrollTop = out.scrollHeight;
    await sleep(25);
  }
}

// --- Befehle ---------------------------------------------------------------------
function findProject(arg) {
  if (!projects || !arg) return undefined;
  const nr = Number(arg);
  if (Number.isInteger(nr)) return projects[nr - 1];
  const name = arg.toLowerCase();
  return projects.find(p => p.name.toLowerCase().startsWith(name));
}

function listProjects() {
  if (!projects) return error("Projekte konnten nicht geladen werden.");
  line(`  NR  ${"NAME".padEnd(24)}STATUS`, "muted");
  projects.forEach((p, i) => {
    const row = print(el("button", "row-btn", `${String(i + 1).padStart(2, "0")}  ${p.name.toUpperCase().padEnd(24)}${p.status ?? ""}`));
    row.type = "button";
    row.addEventListener("click", () => enqueue(() => typeCommand(`project ${i + 1}`)));
  });
  line(`GESAMT: ${projects.length}`, "muted");
  line(">> Details mit 'project <nr>' oder Zeile anklicken.");
}

function showProject([arg]) {
  const p = findProject(arg);
  if (!p) return error(`Projekt nicht gefunden: ${arg ?? ""}. Liste mit 'projects'.`);
  line(`+== ${p.name.toUpperCase()} ==`);
  dossier("STATUS", p.status);
  dossier("STACK", p.stack?.join(", "));
  dossier("WEB", p.url, p.url);
  dossier("CODE", p.repo, p.repo);
  line(p.description);
  const actions = el("div", "actions");
  if (p.url) actions.append(link(p.url, "[ ÖFFNEN ]", "btn primary"));
  if (p.repo) actions.append(link(p.repo, "[ QUELLCODE ]", "btn"));
  print(actions);
}

function openProject([arg]) {
  const p = findProject(arg);
  if (!p?.url) return error(`Projekt nicht gefunden: ${arg ?? ""}. Liste mit 'projects'.`);
  window.open(p.url, "_blank", "noopener");
  const row = line("> ÖFFNE ");
  row.append(link(p.url, p.url));
}

const commands = {
  help: {
    desc: "Zeigt alle Befehle",
    run() {
      line("VERFÜGBARE BEFEHLE:");
      for (const [name, cmd] of Object.entries(commands)) line(`  ${(cmd.usage ?? name).padEnd(18)}${cmd.desc}`);
      line(">> Pfeiltasten blättern im Verlauf, Tab ergänzt Befehle.", "muted");
      if (wide.matches) line(">> Neben dem Bildschirm ziehen dreht den Monitor, Doppelklick stellt ihn gerade.", "muted");
    },
  },
  whoami: { desc: "Wer ich bin", busy: "LESE AKTE", run: () => profile.forEach(([k, v]) => dossier(k, v)) },
  skills: {
    desc: "Was ich kann",
    busy: "LESE skills.cfg",
    run() {
      line("# skills.cfg", "muted");
      for (const [param, list] of skills) line(`[X] ${param}=${list.map(s => `"${s}"`).join(" ")}`);
    },
  },
  projects: { desc: "Listet alle Projekte", busy: "DURCHSUCHE /projects", run: listProjects },
  project: { usage: "project <nr>", desc: "Details zu einem Projekt", busy: "LADE PROJEKT", run: showProject },
  open: { usage: "open <nr>", desc: "Öffnet ein Projekt im neuen Tab", run: openProject },
  contact: { desc: "Kontaktwege", busy: "LADE KONTAKTE", run: () => contact.forEach(([k, v]) => dossier(k, v.replace(/^https:\/\//, ""), v)) },
  matrix: {
    usage: "matrix [on|off]",
    desc: "Matrix-Regen an oder aus",
    run([arg]) {
      const on = arg ? arg === "on" : !rain.running;
      on ? rain.on() : rain.off();
      line(`> MATRIX: ${on ? "AN" : "AUS"}`);
    },
  },
  crt: {
    usage: "crt [on|off]",
    desc: "Röhrenmonitor-Effekt an oder aus",
    run([arg]) {
      if (!wide.matches) return line(">> Nur auf Desktop und Tablet verfügbar.");
      const on = arg ? arg === "on" : !crt.on;
      crt.set(on);
      line(`> CRT: ${on ? "AN" : "AUS"}`);
    },
  },
  rotate: {
    usage: "rotate <grad>",
    desc: `Dreht den Monitor (-${tilt.MAX} bis ${tilt.MAX}, 0 = gerade)`,
    run([arg]) {
      if (!wide.matches) return line(">> Nur auf Desktop und Tablet verfügbar.");
      const deg = Number(arg ?? 0);
      if (!Number.isFinite(deg)) return error("Winkel muss eine Zahl sein, zum Beispiel 'rotate -20'.");
      tilt.set(deg);
      line(`> WINKEL: ${Math.max(-tilt.MAX, Math.min(tilt.MAX, deg))}°`);
    },
  },
  clear: { desc: "Leert den Bildschirm", run: () => out.replaceChildren() },
  reboot: {
    desc: "Startet das Terminal neu",
    busy: "FAHRE SYSTEM HERUNTER",
    async run() {
      await powerOnScreen();
      await startTerminal();
    },
  },
};

const aliases = { ls: "projects", cat: "project", "?": "help", cls: "clear", about: "whoami" };

const history = [];
let historyPos = 0;

async function run(raw) {
  const text = raw.trim();
  line(`${PROMPT} ${text}`, "echo");
  if (!text) return;
  history.push(text);
  historyPos = history.length;
  const [name, ...args] = text.split(/\s+/);
  const key = name.toLowerCase();
  const cmd = commands[aliases[key] ?? key];
  if (!cmd) return error(`Befehl nicht gefunden: ${name}. Alle Befehle mit 'help'.`);
  if (cmd.busy) await busy(cmd.busy);
  const before = out.children.length;
  const result = cmd.run(args);
  // Befehle mit eigenem Ablauf (reboot) zeichnen selbst; alle anderen werden zeilenweise gedruckt
  if (result instanceof Promise) return result;
  await reveal([...out.children].slice(before));
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const text = input.value;
  input.value = "";
  enqueue(() => run(text));
});

input.addEventListener("keydown", e => {
  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    historyPos = Math.max(0, Math.min(history.length, historyPos + (e.key === "ArrowUp" ? -1 : 1)));
    input.value = history[historyPos] ?? "";
  } else if (e.key === "Tab" && input.value && !input.value.includes(" ")) {
    e.preventDefault();
    const match = [...Object.keys(commands), ...Object.keys(aliases)].filter(c => c.startsWith(input.value.toLowerCase()));
    if (match.length === 1) input.value = match[0] + " ";
    else if (match.length > 1) line(match.join("  "), "muted");
  }
});

document.querySelectorAll("[data-cmd]").forEach(btn =>
  btn.addEventListener("click", () => enqueue(() => typeCommand(btn.dataset.cmd))));

// Klick auf den Bildschirm setzt den Fokus in die Eingabe, ausser beim Markieren von Text
screen.addEventListener("click", e => {
  if (!document.body.classList.contains("intro") && !e.target.closest("a, button") && !getSelection().toString()) input.focus();
});

// --- Intro: Monitor heranzoomen, einschalten, booten, erste Befehle --------------
function skipIntro() {
  if (!document.body.classList.contains("intro") || skipping) return;
  skipping = true;
  skipSignal();
  document.body.classList.add("instant");
  tilt.snap(0);
  rig.classList.add("zoomed", "on");
  screen.classList.add("on");
}

addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (inIntro()) skipIntro();
  else { skipping = true; skipSignal(); }
});
$("#skip").addEventListener("click", skipIntro);

async function boot() {
  const lines = [
    "REZONDES BIOS v19.22",
    "(C) 2019-2026 REZONDES SYSTEMS",
    "",
    "CPU: C# / .NET RUNTIME ............ OK",
    "MEM: 640K ......................... GENUG",
    "DISK: /home/rezondes/projects ..... OK",
  ];
  for (const text of lines) {
    line(text);
    await sleep(140);
  }
  const bar = line();
  for (let i = 0; i <= 20; i++) {
    bar.textContent = `LADE SYSTEM [${"#".repeat(i)}${".".repeat(20 - i)}] ${i * 5}%`;
    await sleep(55);
  }
  await projectsLoaded;
  line(`PROJEKTE GEFUNDEN: ${projects ? projects.length : 0}`);
  line("SYSTEM BEREIT");
  await sleep(600);
}

function setLocked(locked) {
  input.readOnly = locked;
  document.querySelectorAll("[data-cmd]").forEach(btn => { btn.disabled = locked; });
}

async function powerOnScreen() {
  screen.classList.remove("on", "powering");
  void screen.offsetWidth; // Animation neu starten
  screen.classList.add("powering");
  await sleep(450);
  screen.classList.add("on");
  await sleep(300);
}

// Terminal hochfahren: BIOS, Logo, erste Befehle. Läuft im Intro und bei 'reboot'.
async function startTerminal() {
  setLocked(true);
  out.replaceChildren();
  await boot();
  out.replaceChildren();
  const logo = print(el("pre", "logo", $("#logo-src").textContent.replace(/^\n/, "")));
  logo.setAttribute("aria-label", "REZONDES");
  line("SYSTEMS ANALYST // APPLICATION DEVELOPER // C# .NET", "muted");
  await sleep(500);
  await typeCommand("whoami");
  await sleep(700);
  await typeCommand("projects");
  line(">> Tippe 'help' für alle Befehle oder nutze die Tasten unten.");
  setLocked(false);
  if (matchMedia("(pointer: fine)").matches) input.focus();
}

// Monitor fliegt ohne Pause heran und dreht sich dabei gerade, dann geht der Bildschirm an
async function intro() {
  if (wide.matches) tilt.snap(-28);
  await sleep(150);
  rig.classList.add("zoomed");
  tilt.set(0);
  await sleep(2300);
  rig.classList.add("on");
  await powerOnScreen();
  await startTerminal();
  resetSkip();
  document.body.classList.remove("intro", "instant");
}

enqueue(intro);
