// Drawing code for the illuminated plate and the bound book on the homepage.
// Everything is generated as SVG/canvas in the browser so it stays crisp and costs no image downloads.

const NS = "http://www.w3.org/2000/svg";
export const Q = {
  green: "#053400",
  paper: "#F7F1E8",
  gold: "#B8860B",
  goldLt: "#D9B45A",
  leather: "#0C4108",
};

type Attrs = Record<string, string | number>;

export function el(tag: string, attrs: Attrs, parent?: Element): SVGElement {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}

export function star8(cx: number, cy: number, r: number): string {
  let d = "";
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8 - Math.PI / 2;
    const rr = i % 2 ? r * 0.62 : r;
    d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(2) + "," + (cy + rr * Math.sin(a)).toFixed(2);
  }
  return d + "Z";
}

function rosette(parent: Element, cx: number, cy: number, r: number, petals: number, fill: string) {
  for (let i = 0; i < petals; i++)
    el("ellipse", { cx, cy: cy - r * 0.62, rx: r * 0.2, ry: r * 0.42, fill, transform: `rotate(${(i * 360) / petals} ${cx} ${cy})` }, parent);
}

/** The illuminated verse plate, in a viewBox of 0 0 520 660. */
export function drawPlate(svg: SVGSVGElement, uid: string) {
  svg.replaceChildren();
  const { gold: G, goldLt: GL, green: GREEN, paper: PAPER } = Q;
  const X0 = 10, Y0 = 10, W = 500, H = 640;
  const line = (tag: string, a: Attrs) => el(tag, { fill: "none", stroke: G, ...a }, svg);

  el("rect", { x: X0, y: Y0, width: W, height: H, fill: GREEN }, svg);
  const defs = el("defs", {}, svg);
  const pat = el("pattern", { id: "khatam" + uid, width: 40, height: 40, patternUnits: "userSpaceOnUse" }, defs);
  el("path", { d: star8(20, 20, 15), fill: "none", stroke: "#1B5E12", "stroke-width": 1 }, pat);
  el("path", { d: "M0,0L8,8M40,0L32,8M0,40L8,32M40,40L32,32", stroke: "#1B5E12", "stroke-width": 1 }, pat);
  el("rect", { x: 56, y: 56, width: 408, height: 548, fill: `url(#khatam${uid})` }, svg);

  line("rect", { x: X0 + 4, y: Y0 + 4, width: W - 8, height: H - 8, "stroke-width": 2 });
  line("rect", { x: X0 + 12, y: Y0 + 12, width: W - 24, height: H - 24, "stroke-width": 0.8 });
  line("rect", { x: X0 + 40, y: Y0 + 40, width: W - 80, height: H - 80, "stroke-width": 0.8 });
  line("rect", { x: X0 + 46, y: Y0 + 46, width: W - 92, height: H - 92, "stroke-width": 2 });

  // border band: alternating quatrefoils and dots
  const band = el("g", {}, svg);
  const motif = (x: number, y: number, i: number) => {
    if (i % 2) { el("circle", { cx: x, cy: y, r: 2.2, fill: GL }, band); return; }
    for (let k = 0; k < 4; k++) el("ellipse", { cx: x, cy: y - 5, rx: 3.2, ry: 5, fill: G, transform: `rotate(${k * 90} ${x} ${y})` }, band);
    el("circle", { cx: x, cy: y, r: 2, fill: GREEN }, band);
  };
  const bx0 = X0 + 26, by0 = Y0 + 26, bx1 = X0 + W - 26, by1 = Y0 + H - 26;
  for (let i = 0; i <= 18; i++) { const x = bx0 + ((bx1 - bx0) * i) / 18; motif(x, by0, i); motif(x, by1, i); }
  for (let i = 1; i < 24; i++) { const y = by0 + ((by1 - by0) * i) / 24; motif(bx0, y, i); motif(bx1, y, i); }

  ([[56, 56, 0], [464, 56, 90], [464, 604, 180], [56, 604, 270]] as const).forEach(([x, y, rot]) => {
    line("path", { d: `M${x + 46},${y} A46,46 0 0 1 ${x},${y + 46}`, "stroke-width": 1.5, transform: `rotate(${rot} ${x} ${y})` });
    line("path", { d: `M${x + 30},${y} A30,30 0 0 1 ${x},${y + 30}`, "stroke-width": 1, transform: `rotate(${rot} ${x} ${y})` });
    const g = el("g", { transform: `rotate(${rot} ${x} ${y})` }, svg);
    el("circle", { cx: x + 38 * Math.SQRT1_2, cy: y + 38 * Math.SQRT1_2, r: 2.6, fill: GL }, g);
  });

  // star medallions above and below the verse
  [[260, 150], [260, 512]].forEach(([cx, cy]) => {
    const r = 44;
    line("circle", { cx, cy, r: r + 10, "stroke-width": 1 });
    line("path", { d: star8(cx, cy, r), "stroke-width": 2 });
    el("path", { d: star8(cx, cy, r - 7), fill: G }, svg);
    el("circle", { cx, cy, r: r * 0.42, fill: GREEN }, svg);
    el("path", { d: star8(cx, cy, r * 0.34), fill: GL }, svg);
  });

  const panel = "M92,262 C92,240 196,238 260,216 C324,238 428,240 428,262 L428,402 C428,424 324,426 260,448 C196,426 92,424 92,402 Z";
  el("path", { d: panel, fill: PAPER }, svg);
  line("path", { d: panel, "stroke-width": 3 });
  line("path", { d: "M100,266 C100,248 198,246 260,226 C322,246 420,248 420,266 L420,398 C420,416 322,418 260,438 C198,418 100,416 100,398 Z", "stroke-width": 0.8 });

  const fo = el("foreignObject", { x: 100, y: 240, width: 320, height: 190 }, svg);
  const div = document.createElement("div");
  div.setAttribute("style", `height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;direction:rtl;font-family:var(--font-amiri),serif;font-weight:700;color:${GREEN};font-size:31px;line-height:1.95;text-align:center`);
  div.innerHTML = `<div>نٓ ۚ وَالْقَلَمِ وَمَا يَسْطُرُونَ <span style="color:${G};font-weight:400">۝١</span></div><div>مَا أَنتَ بِنِعْمَةِ رَبِّكَ بِمَجْنُونٍ <span style="color:${G};font-weight:400">۝٢</span></div>`;
  fo.appendChild(div);
}

/** Green leather with lit grain, filling a 400x520 viewBox. */
export function drawLeather(svg: SVGSVGElement, uid: string) {
  const defs = el("defs", {}, svg);
  defs.innerHTML = `
    <filter id="lth${uid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="1.1 .9" numOctaves="4" seed="11" result="g"/>
      <feDiffuseLighting in="g" surfaceScale="1.4" diffuseConstant="1.15" lighting-color="#fff" result="lit"><feDistantLight azimuth="235" elevation="60"/></feDiffuseLighting>
      <feComposite in="lit" in2="SourceGraphic" operator="arithmetic" k1="1.12" k2="0" k3="0" k4="0"/>
    </filter>
    <filter id="mot${uid}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="3" seed="4"/>
      <feColorMatrix values="0 0 0 0 .01  0 0 0 0 .07  0 0 0 0 .01  0 0 0 -1.6 1.05"/>
    </filter>
    <radialGradient id="wear${uid}" cx="55%" cy="48%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".45"/>
    </radialGradient>
    <linearGradient id="au${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7a5410"/><stop offset=".3" stop-color="#e6c470"/><stop offset=".5" stop-color="#b8860b"/>
      <stop offset=".68" stop-color="#f4dc98"/><stop offset="1" stop-color="#8a6111"/></linearGradient>
    <filter id="tool${uid}" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation=".7" result="b"/>
      <feSpecularLighting in="b" surfaceScale="2.6" specularConstant="1.1" specularExponent="20" lighting-color="#fff3c8" result="sp"><feDistantLight azimuth="235" elevation="42"/></feSpecularLighting>
      <feComposite in="sp" in2="SourceAlpha" operator="in" result="sp2"/>
      <feOffset in="SourceAlpha" dx=".7" dy="1" result="off"/>
      <feFlood flood-color="#000" flood-opacity=".6"/><feComposite in2="off" operator="in" result="sh"/>
      <feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/><feMergeNode in="sp2"/></feMerge>
    </filter>`;
  el("rect", { width: 400, height: 520, fill: Q.leather, filter: `url(#lth${uid})` }, svg);
  el("rect", { width: 400, height: 520, filter: `url(#mot${uid})`, opacity: 0.55 }, svg);
  el("rect", { width: 400, height: 520, fill: `url(#wear${uid})` }, svg);
}

/** Gold tooling for the front cover: frames, dotted band, corner fans and the almond medallion. */
export function drawCoverTooling(svg: SVGSVGElement, uid: string) {
  el("line", { x1: 20, y1: 0, x2: 20, y2: 520, stroke: "rgba(0,0,0,.45)", "stroke-width": 2.5 }, svg);
  el("line", { x1: 23, y1: 0, x2: 23, y2: 520, stroke: "rgba(255,255,255,.07)", "stroke-width": 1 }, svg);
  const g = el("g", { filter: `url(#tool${uid})` }, svg);
  const au = `url(#au${uid})`;
  const rule = (x: number, y: number, w: number, h: number, sw: number) =>
    el("rect", { x, y, width: w, height: h, fill: "none", stroke: au, "stroke-width": sw }, g);
  rule(40, 22, 340, 476, 2.4);
  rule(47, 29, 326, 462, 0.9);
  for (let x = 58; x <= 362; x += 9.5) { el("circle", { cx: x, cy: 38, r: 1.5, fill: au }, g); el("circle", { cx: x, cy: 482, r: 1.5, fill: au }, g); }
  for (let y = 47.5; y <= 474; y += 9.5) { el("circle", { cx: 56, cy: y, r: 1.5, fill: au }, g); el("circle", { cx: 364, cy: y, r: 1.5, fill: au }, g); }
  rule(65, 47, 290, 426, 0.9);
  rule(70, 52, 280, 416, 2.2);
  ([[70, 52, 0], [350, 52, 90], [350, 468, 180], [70, 468, 270]] as const).forEach(([x, y, rot]) => {
    const c = el("g", { transform: `rotate(${rot} ${x} ${y})` }, g);
    el("path", { d: `M${x},${y} L${x + 62},${y} Q${x + 52},${y + 22} ${x + 30},${y + 30} Q${x + 22},${y + 52} ${x},${y + 62} Z M${x + 8},${y + 8} L${x + 8},${y + 42} Q${x + 20},${y + 36} ${x + 24},${y + 24} Q${x + 36},${y + 20} ${x + 42},${y + 8} Z`, fill: au, "fill-rule": "evenodd" }, c);
    el("circle", { cx: x + 15, cy: y + 15, r: 3.2, fill: au }, c);
  });
  const cx = 210, cy = 236, rx = 74, ry = 116;
  const almond = (sx: number, sy: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 64; i++) {
      const t = i / 64, side = t < 0.5 ? 1 : -1, u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
      const y0 = side > 0 ? -ry : ry, y2 = -y0, x1 = side * rx * 1.3;
      pts.push([cx + 2 * (1 - u) * u * x1 * sx, cy + ((1 - u) * (1 - u) * y0 + u * u * y2) * sy]);
    }
    return pts;
  };
  const poly = (pts: [number, number][]) => `M${pts[0][0]},${pts[0][1]}` + pts.slice(1).map((p) => `L${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("") + "Z";
  const outer = almond(1, 1);
  let d = `M${outer[0][0]},${outer[0][1]}`;
  for (let i = 1; i <= outer.length; i++) {
    const p = outer[i % outer.length], q = outer[i - 1];
    const rr = Math.hypot(p[0] - q[0], p[1] - q[1]) * 0.56;
    d += ` A${rr},${rr} 0 0 1 ${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  }
  d += " " + poly(almond(0.8, 0.84));
  el("path", { d, fill: au, "fill-rule": "evenodd" }, g);
  el("path", { d: poly(almond(0.72, 0.77)), fill: "none", stroke: au, "stroke-width": 0.8 }, g);
  el("path", { d: star8(cx, cy, 40) + star8(cx, cy, 31), fill: au, "fill-rule": "evenodd" }, g);
  el("circle", { cx, cy, r: 16, fill: au }, g);
  const cut = el("g", {}, svg);
  rosette(cut, cx, cy, 15, 8, "#0A3807");
  el("circle", { cx, cy, r: 3, fill: "#0A3807" }, cut);
  [-1, 1].forEach((s) => {
    el("path", { d: `M${cx},${cy + s * 58} q12,${s * 14} 0,${s * 34} q-12,${-s * 20} 0,${-s * 34}z`, fill: au }, g);
    el("line", { x1: cx, y1: cy + s * (ry + 6), x2: cx, y2: cy + s * (ry + 18), stroke: au, "stroke-width": 1.6 }, g);
    el("path", { d: `M${cx},${cy + s * (ry + 18)} l5,${s * 7} l-5,${s * 7} l-5,${-s * 7}z`, fill: au }, g);
  });
}

/** Battal (stone) marbling for the endpaper. */
export function drawEbru(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const w = c.width, h = c.height, img = ctx.createImageData(w, h);
  const pal = [[38, 84, 34], [200, 164, 92], [124, 50, 44], [226, 214, 186], [62, 104, 56], [176, 138, 64], [24, 62, 22]];
  let rnd = 7;
  const rand = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  const seeds: [number, number, number[], number][] = [];
  for (let i = 0; i < 260; i++) seeds.push([rand() * w, rand() * h, pal[Math.floor(rand() * pal.length)], 0.8 + rand() * 0.5]);
  const hash = (x: number, y: number) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), cc = hash(xi, yi + 1), dd = hash(xi + 1, yi + 1);
    return a + (b - a) * sx + (cc - a) * sy + (a - b - cc + dd) * sx * sy;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const wx = x + 9 * (vn(x / 22, y / 22) - 0.5) + 4 * (vn(x / 7, y / 7) - 0.5);
    const wy = y + 9 * (vn(x / 22 + 9, y / 22 + 9) - 0.5) + 4 * (vn(x / 7 + 3, y / 7 + 3) - 0.5);
    let d1 = 1e9, d2 = 1e9, col = pal[0];
    for (const [sx, sy, cc, wt] of seeds) {
      const dd = Math.hypot(wx - sx, wy - sy) / wt;
      if (dd < d1) { d2 = d1; d1 = dd; col = cc; } else if (dd < d2) d2 = dd;
    }
    const edge = d2 - d1, vein = edge < 1.6 ? 0.35 + 0.4 * (edge / 1.6) : 1;
    const rim = Math.min(1, d1 / 26);
    const tone = (v: number) => (v * 0.7 + 232 * 0.3) * (1.04 - 0.12 * (1 - rim)) * (0.9 + 0.1 * rim);
    const o = (y * w + x) * 4;
    img.data[o] = tone(col[0]) * vein; img.data[o + 1] = tone(col[1]) * vein; img.data[o + 2] = tone(col[2]) * vein; img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
