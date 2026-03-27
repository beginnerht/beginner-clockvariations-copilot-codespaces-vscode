/**
 * Clock Variations App — clock.js
 * Designs: digital, analog, loading-bar, sundial, led, planet, sun, moon, timezone
 */

"use strict";

// ─── Timezone helpers ─────────────────────────────────────────────────────────
let selectedTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function nowInTZ(tz) {
    const d = new Date();
    const parts = {};
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric", minute: "numeric", second: "numeric",
        hour12: false, year: "numeric", month: "numeric", day: "numeric",
        weekday: "long"
    });
    fmt.formatToParts(d).forEach(p => { parts[p.type] = p.value; });
    let h = parseInt(parts.hour, 10);
    if (h === 24) h = 0;
    return {
        h, m: parseInt(parts.minute, 10), s: parseInt(parts.second, 10),
        year: parseInt(parts.year, 10),
        month: parseInt(parts.month, 10),
        day: parseInt(parts.day, 10),
        weekday: parts.weekday
    };
}

function fmtTime(t, pad = true) {
    const p = n => String(n).padStart(2, "0");
    return `${p(t.h)}:${p(t.m)}:${p(t.s)}`;
}

// ─── Design registry ──────────────────────────────────────────────────────────
const DESIGNS = ["digital", "analog", "loading-bar", "sundial", "led", "planet", "sun", "moon", "timezone"];
const ALIASES = {
    "digital": "digital",
    "dig": "digital",
    "analog": "analog",
    "analogue": "analog",
    "clock": "analog",
    "loading": "loading-bar",
    "loadingbar": "loading-bar",
    "loading-bar": "loading-bar",
    "loadbar": "loading-bar",
    "bar": "loading-bar",
    "progress": "loading-bar",
    "sundial": "sundial",
    "sun dial": "sundial",
    "led": "led",
    "planet": "planet",
    "moon": "moon",
    "lunar": "moon",
    "sun": "sun",
    "solar": "sun",
    "timezone": "timezone",
    "tz": "timezone",
    "timezones": "timezone",
    "world": "timezone"
};

let currentDesign = "digital";
let animFrame = null;

function setDesign(name) {
    const resolved = ALIASES[name.toLowerCase().trim()] || name.toLowerCase().trim();
    if (!DESIGNS.includes(resolved)) return false;
    currentDesign = resolved;
    document.querySelectorAll(".design-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.design === resolved);
    });
    document.querySelectorAll(".clock-panel").forEach(p => {
        p.classList.toggle("active", p.id === `panel-${resolved}`);
    });
    if (animFrame) cancelAnimationFrame(animFrame);
    startDesign(resolved);
    return true;
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────
function startDesign(name) {
    switch (name) {
        case "digital":     tickDigital();     break;
        case "analog":      tickAnalog();      break;
        case "loading-bar": tickLoadbar();     break;
        case "sundial":     tickSundial();     break;
        case "led":         tickLED();         break;
        case "planet":      tickPlanet();      break;
        case "sun":         tickSun();         break;
        case "moon":        tickMoon();        break;
        case "timezone":    tickTimezone();    break;
    }
}

// ─── 1. Digital ───────────────────────────────────────────────────────────────
function tickDigital() {
    const t = nowInTZ(selectedTZ);
    document.getElementById("digital-display").textContent = fmtTime(t);
    document.getElementById("digital-date").textContent =
        `${t.weekday}, ${t.year}-${String(t.month).padStart(2,"0")}-${String(t.day).padStart(2,"0")}`;
    document.getElementById("digital-tz").textContent = selectedTZ;
    animFrame = requestAnimationFrame(tickDigital);
}

// ─── 2. Analog ────────────────────────────────────────────────────────────────
function tickAnalog() {
    const canvas = document.getElementById("canvas-analog");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 10;
    const t = nowInTZ(selectedTZ);

    ctx.clearRect(0, 0, W, H);

    // Face
    const grad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
    grad.addColorStop(0, "#1e1e3a");
    grad.addColorStop(1, "#0a0a18");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "#7c6af7";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Hour ticks
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const outer = R * 0.92, inner = (i % 3 === 0) ? R * 0.78 : R * 0.86;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
        ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
        ctx.strokeStyle = i % 3 === 0 ? "#fff" : "#555";
        ctx.lineWidth = i % 3 === 0 ? 3 : 1;
        ctx.stroke();
    }

    // Numbers
    ctx.fillStyle = "#ccc";
    ctx.font = `${R * 0.13}px 'Segoe UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 1; i <= 12; i++) {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        ctx.fillText(i, cx + Math.cos(angle) * R * 0.7, cy + Math.sin(angle) * R * 0.7);
    }

    // Hour hand
    const hAngle = ((t.h % 12) + t.m / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    drawHand(ctx, cx, cy, hAngle, R * 0.5, 7, "#f7a26a");

    // Minute hand
    const mAngle = (t.m + t.s / 60) / 60 * Math.PI * 2 - Math.PI / 2;
    drawHand(ctx, cx, cy, mAngle, R * 0.72, 4, "#7c6af7");

    // Second hand
    const sAngle = t.s / 60 * Math.PI * 2 - Math.PI / 2;
    drawHand(ctx, cx, cy, sAngle, R * 0.82, 2, "#ff4488");

    // Centre dot
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    animFrame = requestAnimationFrame(tickAnalog);
}

function drawHand(ctx, cx, cy, angle, len, width, color) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// ─── 3. Loading bar ───────────────────────────────────────────────────────────
function tickLoadbar() {
    const t = nowInTZ(selectedTZ);
    const totalSecs = t.h * 3600 + t.m * 60 + t.s;
    const pct = (totalSecs / 86400) * 100;
    document.getElementById("loadbar-fill").style.width = pct.toFixed(4) + "%";
    document.getElementById("loadbar-pct").textContent = pct.toFixed(2) + "% of day elapsed";
    document.getElementById("loadbar-time").textContent = fmtTime(t);
    animFrame = requestAnimationFrame(tickLoadbar);
}

// ─── 4. Sundial ───────────────────────────────────────────────────────────────
function tickSundial() {
    const canvas = document.getElementById("canvas-sundial");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H * 0.62, R = Math.min(W, H) * 0.38;
    const t = nowInTZ(selectedTZ);

    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0d1a3a");
    sky.addColorStop(1, "#1a3060");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Ground
    const gnd = ctx.createLinearGradient(0, cy, 0, H);
    gnd.addColorStop(0, "#3b2a1a");
    gnd.addColorStop(1, "#1a0e00");
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * 1.4, R * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = gnd;
    ctx.fill();

    // Dial face (ellipse)
    ctx.beginPath();
    ctx.ellipse(cx, cy, R, R * 0.25, 0, Math.PI, 0, true);
    ctx.fillStyle = "#c8a870";
    ctx.fill();
    ctx.strokeStyle = "#8b6914";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hour lines on dial
    for (let hour = 6; hour <= 18; hour++) {
        const frac = (hour - 6) / 12;
        const angle = Math.PI - frac * Math.PI;
        const rx = cx + Math.cos(angle) * R * 0.9;
        const ry = cy - Math.sin(angle) * R * 0.25 * 0.9;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(rx, ry);
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#5a3e00";
        ctx.font = `${R * 0.1}px serif`;
        ctx.textAlign = "center";
        ctx.fillText(hour, rx + Math.cos(angle) * R * 0.06, ry - Math.sin(angle) * R * 0.06 * 0.25);
    }

    // Gnomon (shadow caster)
    const gnomonH = R * 0.55;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - gnomonH);
    ctx.strokeStyle = "#c8a870";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Shadow of gnomon based on current hour
    const hourFrac = (t.h + t.m / 60 + t.s / 3600);
    const shadowFrac = Math.max(0, Math.min(1, (hourFrac - 6) / 12));
    const shadowAngle = Math.PI - shadowFrac * Math.PI;
    const shadowLen = gnomonH * 1.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(shadowAngle) * shadowLen, cy - Math.sin(shadowAngle) * R * 0.25 * 1.4);
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Sun in sky
    const sunFrac = (hourFrac - 6) / 12;
    const sunAngle = Math.PI - sunFrac * Math.PI;
    const sunX = cx + Math.cos(sunAngle) * R * 1.1;
    const sunY = cy - Math.sin(sunAngle) * R * 1.5;
    const sunR = 22;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, sunR);
    sunGrad.addColorStop(0, "#fff7aa");
    sunGrad.addColorStop(0.4, "#ffd700");
    sunGrad.addColorStop(1, "rgba(255,120,0,0)");
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // Time label
    ctx.fillStyle = "#ffd700";
    ctx.font = `bold ${R * 0.14}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(fmtTime(t), cx, 28);
    ctx.fillStyle = "#aaa";
    ctx.font = `${R * 0.09}px sans-serif`;
    ctx.fillText(selectedTZ, cx, 46);

    animFrame = requestAnimationFrame(tickSundial);
}

// ─── 5. LED Clock ─────────────────────────────────────────────────────────────
// 7-segment display map (segments a-g)
const SEG_MAP = {
    0: [1,1,1,1,1,1,0],
    1: [0,1,1,0,0,0,0],
    2: [1,1,0,1,1,0,1],
    3: [1,1,1,1,0,0,1],
    4: [0,1,1,0,0,1,1],
    5: [1,0,1,1,0,1,1],
    6: [1,0,1,1,1,1,1],
    7: [1,1,1,0,0,0,0],
    8: [1,1,1,1,1,1,1],
    9: [1,1,1,1,0,1,1]
};

function drawSegment(ctx, x, y, w, h, segs, color) {
    const gap = 3, thick = w * 0.16;
    const [a,b,c,d,e,f,g] = segs;
    ctx.fillStyle = color;

    function rect(rx, ry, rw, rh) {
        ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, 2); ctx.fill();
    }
    // top
    if (a) rect(x + gap + thick*0.5, y, w - gap*2 - thick, thick);
    // top-right
    if (b) rect(x + w - thick, y + gap + thick*0.5, thick, h/2 - gap - thick*0.5);
    // bot-right
    if (c) rect(x + w - thick, y + h/2 + thick*0.5, thick, h/2 - gap - thick*0.5);
    // bottom
    if (d) rect(x + gap + thick*0.5, y + h - thick, w - gap*2 - thick, thick);
    // bot-left
    if (e) rect(x, y + h/2 + thick*0.5, thick, h/2 - gap - thick*0.5);
    // top-left
    if (f) rect(x, y + gap + thick*0.5, thick, h/2 - gap - thick*0.5);
    // middle
    if (g) rect(x + gap + thick*0.5, y + h/2 - thick/2, w - gap*2 - thick, thick);
}

function tickLED() {
    const canvas = document.getElementById("canvas-led");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const t = nowInTZ(selectedTZ);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, W, H);

    const sw = 52, sh = 90, gap = 12;
    // positions: 2 digits, colon-space, 2 digits, colon-space, 2 digits
    const totalW = 6 * sw + 2 * (gap * 3) + gap;
    let ox = (W - totalW) / 2;
    const oy = (H - sh) / 2;

    const digits = [t.h, t.m, t.s];

    for (let group = 0; group < 3; group++) {
        const val = digits[group];
        const d1 = Math.floor(val / 10), d2 = val % 10;

        // dim background segments
        drawSegment(ctx, ox, oy, sw, sh, [1,1,1,1,1,1,1], "rgba(255,80,80,0.08)");
        drawSegment(ctx, ox, oy, sw, sh, SEG_MAP[d1] || [0,0,0,0,0,0,0], "#ff3333");
        ctx.shadowColor = "#ff3333"; ctx.shadowBlur = 14;
        drawSegment(ctx, ox, oy, sw, sh, SEG_MAP[d1] || [0,0,0,0,0,0,0], "#ff6666");
        ctx.shadowBlur = 0;
        ox += sw + gap;

        drawSegment(ctx, ox, oy, sw, sh, [1,1,1,1,1,1,1], "rgba(255,80,80,0.08)");
        drawSegment(ctx, ox, oy, sw, sh, SEG_MAP[d2] || [0,0,0,0,0,0,0], "#ff3333");
        ctx.shadowColor = "#ff3333"; ctx.shadowBlur = 14;
        drawSegment(ctx, ox, oy, sw, sh, SEG_MAP[d2] || [0,0,0,0,0,0,0], "#ff6666");
        ctx.shadowBlur = 0;
        ox += sw + gap;

        // Colon between groups
        if (group < 2) {
            const dotR = 5;
            ctx.fillStyle = t.s % 2 === 0 ? "#ff4444" : "#331111";
            ctx.shadowColor = "#ff4444"; ctx.shadowBlur = t.s % 2 === 0 ? 10 : 0;
            ctx.beginPath(); ctx.arc(ox + gap, oy + sh * 0.3, dotR, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(ox + gap, oy + sh * 0.7, dotR, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
            ox += gap * 3;
        }
    }

    // Label
    ctx.fillStyle = "#ff3333aa";
    ctx.font = "13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(selectedTZ, W / 2, H - 14);

    animFrame = requestAnimationFrame(tickLED);
}

// ─── 6. Planet Clock ──────────────────────────────────────────────────────────
function tickPlanet() {
    const canvas = document.getElementById("canvas-planet");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const t = nowInTZ(selectedTZ);

    ctx.clearRect(0, 0, W, H);

    // Starfield (static seed so stars don't move)
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, W, H);
    const rng = mulberry32(42);
    for (let i = 0; i < 120; i++) {
        const sx = rng() * W, sy = rng() * H, sr = rng() * 1.5 + 0.3;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${rng() * 0.7 + 0.2})`;
        ctx.fill();
    }

    const R = Math.min(W, H) * 0.22;

    // Rings behind planet
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.35);
    ctx.scale(1, 0.35);
    for (let i = 3; i >= 0; i--) {
        const rrOuter = R * (1.9 - i * 0.12), rrInner = R * (1.6 - i * 0.12);
        const ringColors = ["#a08840","#c8aa50","#e0cc70","#f0e090"];
        ctx.beginPath();
        ctx.arc(0, 0, rrOuter, 0, Math.PI*2);
        ctx.arc(0, 0, rrInner, 0, Math.PI*2, true);
        ctx.fillStyle = ringColors[i] + "88";
        ctx.fill();
    }
    ctx.restore();

    // Planet body
    const planetGrad = ctx.createRadialGradient(cx - R*0.3, cy - R*0.3, R*0.1, cx, cy, R);
    planetGrad.addColorStop(0, "#a0c8ff");
    planetGrad.addColorStop(0.5, "#4060c0");
    planetGrad.addColorStop(1, "#0a102a");
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI*2);
    ctx.fillStyle = planetGrad;
    ctx.fill();
    ctx.strokeStyle = "#5070e0";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Atmospheric bands
    for (let band = 0; band < 5; band++) {
        const bandY = cy - R * 0.6 + band * R * 0.28;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R - 1, 0, Math.PI*2);
        ctx.clip();
        ctx.fillStyle = `rgba(100,160,255,${0.07 - band * 0.01})`;
        ctx.fillRect(cx - R, bandY, R*2, R * 0.1);
        ctx.restore();
    }

    // Clock hands on planet face
    const hAngle = ((t.h % 12) + t.m / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const mAngle = (t.m + t.s / 60) / 60 * Math.PI * 2 - Math.PI / 2;
    const sAngle = t.s / 60 * Math.PI * 2 - Math.PI / 2;

    // Tick marks
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a)*R*0.82, cy + Math.sin(a)*R*0.82);
        ctx.lineTo(cx + Math.cos(a)*R*0.92, cy + Math.sin(a)*R*0.92);
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawHand(ctx, cx, cy, hAngle, R * 0.5, 5, "#fff");
    drawHand(ctx, cx, cy, mAngle, R * 0.72, 3, "#adf");
    drawHand(ctx, cx, cy, sAngle, R * 0.82, 1.5, "#ff8");

    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2);
    ctx.fillStyle = "#fff"; ctx.fill();

    // Time label
    ctx.fillStyle = "#adf";
    ctx.font = `bold ${R*0.22}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(fmtTime(t), cx, H - 18);

    animFrame = requestAnimationFrame(tickPlanet);
}

// ─── 7. Sun Clock ─────────────────────────────────────────────────────────────
function tickSun() {
    const canvas = document.getElementById("canvas-sun");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.28;
    const t = nowInTZ(selectedTZ);
    const now = performance.now() / 1000;

    ctx.clearRect(0, 0, W, H);

    // Deep space bg
    ctx.fillStyle = "#07070f";
    ctx.fillRect(0, 0, W, H);

    // Outer glow halo
    const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 2.2);
    halo.addColorStop(0, "rgba(255,160,0,0.22)");
    halo.addColorStop(1, "rgba(255,80,0,0)");
    ctx.beginPath(); ctx.arc(cx, cy, R * 2.2, 0, Math.PI*2);
    ctx.fillStyle = halo; ctx.fill();

    // Animated sun rays
    const nRays = 16;
    for (let i = 0; i < nRays; i++) {
        const a = (i / nRays) * Math.PI * 2 + now * 0.2;
        const wobble = 1 + 0.12 * Math.sin(now * 1.5 + i * 0.9);
        const inner = R * 1.05, outer = R * (1.4 + 0.15 * Math.sin(now + i)) * wobble;
        const halfW = 0.06;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a - halfW) * inner, cy + Math.sin(a - halfW) * inner);
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
        ctx.lineTo(cx + Math.cos(a + halfW) * inner, cy + Math.sin(a + halfW) * inner);
        ctx.fillStyle = `rgba(255,${160 + Math.floor(Math.sin(now + i) * 40)},0,0.6)`;
        ctx.fill();
    }

    // Sun body
    const sunGrad = ctx.createRadialGradient(cx - R*0.3, cy - R*0.3, R*0.1, cx, cy, R);
    sunGrad.addColorStop(0, "#fff8d0");
    sunGrad.addColorStop(0.3, "#ffd000");
    sunGrad.addColorStop(0.7, "#ff8800");
    sunGrad.addColorStop(1, "#cc3300");
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
    ctx.fillStyle = sunGrad; ctx.fill();

    // Solar surface texture (spots)
    const rng = mulberry32(99);
    for (let i = 0; i < 6; i++) {
        const sx = cx + (rng()*0.6 - 0.3) * R;
        const sy = cy + (rng()*0.6 - 0.3) * R;
        const sr = rng() * R * 0.1 + R * 0.04;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2);
        ctx.fillStyle = "rgba(180,40,0,0.35)"; ctx.fill();
    }

    // Tick marks
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a)*R*0.78, cy + Math.sin(a)*R*0.78);
        ctx.lineTo(cx + Math.cos(a)*R*0.92, cy + Math.sin(a)*R*0.92);
        ctx.strokeStyle = "rgba(255,240,180,0.8)";
        ctx.lineWidth = i%3===0 ? 3 : 1;
        ctx.stroke();
    }

    // Hands
    const hAngle = ((t.h % 12) + t.m / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const mAngle = (t.m + t.s / 60) / 60 * Math.PI * 2 - Math.PI / 2;
    const sAngle = t.s / 60 * Math.PI * 2 - Math.PI / 2;
    drawHand(ctx, cx, cy, hAngle, R * 0.5, 6, "#fff5c0");
    drawHand(ctx, cx, cy, mAngle, R * 0.72, 3, "#ffe080");
    drawHand(ctx, cx, cy, sAngle, R * 0.82, 1.5, "#ffffff");

    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI*2);
    ctx.fillStyle = "#fff"; ctx.fill();

    // Time label
    ctx.fillStyle = "#ffe";
    ctx.font = `bold ${R*0.22}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(fmtTime(t), cx, H - 18);

    animFrame = requestAnimationFrame(tickSun);
}

// ─── 8. Moon Clock ────────────────────────────────────────────────────────────
function tickMoon() {
    const canvas = document.getElementById("canvas-moon");
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.28;
    const t = nowInTZ(selectedTZ);

    ctx.clearRect(0, 0, W, H);

    // Night sky
    ctx.fillStyle = "#03030c";
    ctx.fillRect(0, 0, W, H);
    const rng = mulberry32(17);
    for (let i = 0; i < 150; i++) {
        const sx = rng()*W, sy = rng()*H, sr = rng()*1.2+0.2;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${rng()*0.8+0.1})`; ctx.fill();
    }

    // Soft glow
    const glow = ctx.createRadialGradient(cx, cy, R*0.6, cx, cy, R*2);
    glow.addColorStop(0, "rgba(200,220,255,0.15)");
    glow.addColorStop(1, "rgba(100,130,200,0)");
    ctx.beginPath(); ctx.arc(cx, cy, R*2, 0, Math.PI*2);
    ctx.fillStyle = glow; ctx.fill();

    // Moon body
    const moonGrad = ctx.createRadialGradient(cx - R*0.2, cy - R*0.25, R*0.05, cx, cy, R);
    moonGrad.addColorStop(0, "#f0f4ff");
    moonGrad.addColorStop(0.5, "#c8d0e8");
    moonGrad.addColorStop(1, "#8090b0");
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
    ctx.fillStyle = moonGrad; ctx.fill();

    // Craters
    const craters = [[0.3,0.2,0.09],[-0.2,0.4,0.07],[0.1,-0.3,0.12],[-0.4,-0.1,0.06],[0.45,0.45,0.05]];
    craters.forEach(([dx,dy,cr]) => {
        const ccx = cx + dx*R, ccy = cy + dy*R;
        ctx.beginPath(); ctx.arc(ccx, ccy, cr*R, 0, Math.PI*2);
        ctx.fillStyle = "rgba(100,120,160,0.45)"; ctx.fill();
        ctx.strokeStyle = "rgba(60,80,120,0.3)"; ctx.lineWidth = 1; ctx.stroke();
    });

    // Shadow (phase — always half-lit crescent from left)
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2);
    ctx.clip();
    const shadow = ctx.createRadialGradient(cx + R*0.5, cy, 0, cx + R*0.5, cy, R*1.2);
    shadow.addColorStop(0, "rgba(5,5,20,0.75)");
    shadow.addColorStop(1, "rgba(5,5,20,0)");
    ctx.fillStyle = shadow;
    ctx.fillRect(cx, cy - R, R*1.2, R*2);
    ctx.restore();

    // Tick marks
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a)*R*0.80, cy + Math.sin(a)*R*0.80);
        ctx.lineTo(cx + Math.cos(a)*R*0.92, cy + Math.sin(a)*R*0.92);
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = i%3===0 ? 2.5 : 1;
        ctx.stroke();
    }

    // Hands
    const hAngle = ((t.h % 12) + t.m / 60) / 12 * Math.PI * 2 - Math.PI / 2;
    const mAngle = (t.m + t.s / 60) / 60 * Math.PI * 2 - Math.PI / 2;
    const sAngle = t.s / 60 * Math.PI * 2 - Math.PI / 2;
    drawHand(ctx, cx, cy, hAngle, R * 0.5, 6, "#ddeeff");
    drawHand(ctx, cx, cy, mAngle, R * 0.72, 3, "#aaccff");
    drawHand(ctx, cx, cy, sAngle, R * 0.82, 1.5, "#88bbff");

    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2);
    ctx.fillStyle = "#fff"; ctx.fill();

    // Time label
    ctx.fillStyle = "#cde";
    ctx.font = `bold ${R*0.22}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(fmtTime(t), cx, H - 18);

    animFrame = requestAnimationFrame(tickMoon);
}

// ─── 9. Timezone Grid ─────────────────────────────────────────────────────────
const TZ_CITIES = [
    { tz: "Pacific/Honolulu",       label: "Honolulu" },
    { tz: "America/Los_Angeles",    label: "Los Angeles" },
    { tz: "America/Denver",         label: "Denver" },
    { tz: "America/Chicago",        label: "Chicago" },
    { tz: "America/New_York",       label: "New York" },
    { tz: "America/Sao_Paulo",      label: "São Paulo" },
    { tz: "Europe/London",          label: "London" },
    { tz: "Europe/Paris",           label: "Paris" },
    { tz: "Europe/Moscow",          label: "Moscow" },
    { tz: "Asia/Dubai",             label: "Dubai" },
    { tz: "Asia/Kolkata",           label: "Mumbai" },
    { tz: "Asia/Bangkok",           label: "Bangkok" },
    { tz: "Asia/Shanghai",          label: "Shanghai" },
    { tz: "Asia/Tokyo",             label: "Tokyo" },
    { tz: "Australia/Sydney",       label: "Sydney" },
    { tz: "Pacific/Auckland",       label: "Auckland" },
];

function tickTimezone() {
    const grid = document.getElementById("tz-clocks-grid");
    TZ_CITIES.forEach(({ tz, label }) => {
        const t = nowInTZ(tz);
        let card = document.getElementById(`tz-card-${tz.replace(/\//g,"-")}`);
        if (!card) {
            card = document.createElement("div");
            card.className = "tz-mini";
            card.id = `tz-card-${tz.replace(/\//g,"-")}`;
            card.innerHTML = `<div class="tz-mini-name">${label}<br><small>${tz}</small></div>
                              <div class="tz-mini-time"></div>
                              <div class="tz-mini-date"></div>`;
            grid.appendChild(card);
        }
        card.querySelector(".tz-mini-time").textContent = fmtTime(t);
        card.querySelector(".tz-mini-date").textContent =
            `${t.year}-${String(t.month).padStart(2,"0")}-${String(t.day).padStart(2,"0")}`;
    });
    animFrame = requestAnimationFrame(tickTimezone);
}

// ─── Utility: seeded RNG ──────────────────────────────────────────────────────
function mulberry32(seed) {
    return function() {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Timezone selector
    const tzSelect = document.getElementById("tz-select");
    tzSelect.value = selectedTZ;
    tzSelect.addEventListener("change", () => {
        selectedTZ = tzSelect.value;
    });

    // Design buttons
    document.querySelectorAll(".design-btn").forEach(btn => {
        btn.addEventListener("click", () => setDesign(btn.dataset.design));
    });

    // Type-to-switch
    const typeInput = document.getElementById("type-input");
    typeInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            const val = typeInput.value.trim();
            if (!setDesign(val)) {
                typeInput.style.borderColor = "#f44";
                setTimeout(() => typeInput.style.borderColor = "", 600);
            } else {
                typeInput.value = "";
            }
        }
    });

    // Start default design
    setDesign("digital");
});
