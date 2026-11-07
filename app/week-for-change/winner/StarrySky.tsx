"use client";

import { useEffect, useRef } from "react";

/*
 * A Starry Night style sky: short brushstroke streaks that follow a flow
 * field bent into whirlpools, drawn once per width, with a separate
 * light layer of twinkling stars on top. Seeded so the sky looks the
 * same on every visit.
 */

type Vortex = { x: number; y: number; r: number; spin: 1 | -1; gold: boolean };
type Star = { x: number; y: number; size: number; phase: number; speed: number };

const BLUES = ["#163A70", "#1F4C8F", "#2D63AD", "#4A80C6", "#7FA8DD", "#B9D0EE"];
const GOLDS = ["#C9A24A", "#E8C878", "#F4DFA4"];
const STROKE_STEP = 3;
const MAX_DPR = 1.5;

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function makeVortices(width: number, height: number): Vortex[] {
  const vortices: Vortex[] = [
    { x: width * 0.78, y: 170, r: Math.min(220, width * 0.28), spin: 1, gold: true },
    { x: width * 0.18, y: 430, r: Math.min(180, width * 0.24), spin: -1, gold: false },
  ];

  // Keep whirlpools coming down the page so a long poem isn't left on flat sky.
  for (let y = 800, i = 0; y < height; y += 520, i++) {
    vortices.push({
      x: width * (i % 2 === 0 ? 0.85 : 0.12),
      y,
      r: Math.min(190, width * 0.26),
      spin: i % 2 === 0 ? 1 : -1,
      gold: false,
    });
  }

  return vortices;
}

function flowAngle(x: number, y: number, vortices: Vortex[]) {
  const base = 0.35 * Math.sin(y / 170 + x / 420);
  let vx = Math.cos(base);
  let vy = Math.sin(base);

  for (const v of vortices) {
    const dx = x - v.x;
    const dy = y - v.y;
    const weight = Math.exp(-(dx * dx + dy * dy) / (v.r * v.r)) * 4;
    const tangent = Math.atan2(dy, dx) + (v.spin * Math.PI) / 2;
    vx += Math.cos(tangent) * weight;
    vy += Math.sin(tangent) * weight;
  }

  return Math.atan2(vy, vx);
}

function nearGoldVortex(x: number, y: number, vortices: Vortex[]) {
  return vortices.some((v) => {
    if (!v.gold) return false;
    const d = Math.hypot(x - v.x, y - v.y);
    return d > v.r * 0.35 && d < v.r * 0.75;
  });
}

function drawSky(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#04203F");
  background.addColorStop(1, "#00142A");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const random = seededRandom(29112026);
  const vortices = makeVortices(width, height);

  // Bucket strokes by colour so each colour is a single path and stroke.
  const buckets = new Map<string, Path2D>();
  const strokeCount = Math.round((width * height) / 260);

  for (let i = 0; i < strokeCount; i++) {
    let x = random() * width;
    let y = random() * height;
    const steps = 6 + Math.floor(random() * 14);
    const gold = nearGoldVortex(x, y, vortices) && random() < 0.55;
    const palette = gold ? GOLDS : BLUES;
    const colour = palette[Math.floor(random() * palette.length)];

    let path = buckets.get(colour);
    if (!path) {
      path = new Path2D();
      buckets.set(colour, path);
    }

    path.moveTo(x, y);
    for (let s = 0; s < steps; s++) {
      const angle = flowAngle(x, y, vortices);
      x += Math.cos(angle) * STROKE_STEP;
      y += Math.sin(angle) * STROKE_STEP;
      path.lineTo(x, y);
    }
  }

  ctx.lineCap = "round";
  ctx.lineWidth = 1.4;
  for (const [colour, path] of buckets) {
    ctx.strokeStyle = colour;
    ctx.globalAlpha = GOLDS.includes(colour) ? 0.75 : 0.5;
    ctx.stroke(path);
  }
  ctx.globalAlpha = 1;
}

function makeStars(width: number, height: number): Star[] {
  const random = seededRandom(1330);
  const stars: Star[] = [];

  // A drifting trail of stars across the top, like the poster's.
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    stars.push({
      x: width * (0.08 + t * 0.75) + (random() - 0.5) * 40,
      y: 60 + t * 520 + (random() - 0.5) * 50,
      size: 1.6 + random() * 2.4,
      phase: random() * Math.PI * 2,
      speed: 0.6 + random() * 1.2,
    });
  }

  for (let i = 0; i < Math.round(height / 90); i++) {
    stars.push({
      x: random() * width,
      y: random() * height,
      size: 1 + random() * 1.8,
      phase: random() * Math.PI * 2,
      speed: 0.4 + random() * 1,
    });
  }

  return stars;
}

function drawStars(
  canvas: HTMLCanvasElement,
  stars: Star[],
  width: number,
  height: number,
  time: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  for (const star of stars) {
    const twinkle = 0.55 + 0.45 * Math.sin(time * star.speed + star.phase);
    const glow = star.size * 6;

    const halo = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glow);
    halo.addColorStop(0, `rgba(255, 244, 210, ${0.5 * twinkle})`);
    halo.addColorStop(1, "rgba(255, 244, 210, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(star.x - glow, star.y - glow, glow * 2, glow * 2);

    // Four-point sparkle.
    ctx.strokeStyle = `rgba(255, 250, 235, ${0.85 * twinkle})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(star.x - star.size * 2.5, star.y);
    ctx.lineTo(star.x + star.size * 2.5, star.y);
    ctx.moveTo(star.x, star.y - star.size * 2.5);
    ctx.lineTo(star.x, star.y + star.size * 2.5);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 252, 240, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default function StarrySky() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const sky = skyRef.current;
    const starCanvas = starsRef.current;
    if (!wrapper || !sky || !starCanvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let drawnWidth = 0;
    let drawnHeight = 0;
    let stars: Star[] = [];

    function render() {
      const width = wrapper!.clientWidth;
      const height = wrapper!.clientHeight;

      // Only redraw on real size changes, not mobile URL-bar jitter.
      if (width === drawnWidth && Math.abs(height - drawnHeight) < 80) return;
      drawnWidth = width;
      drawnHeight = height;

      drawSky(sky!, width, height);

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      starCanvas!.width = Math.round(width * dpr);
      starCanvas!.height = Math.round(height * dpr);
      starCanvas!.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars(width, height);
      drawStars(starCanvas!, stars, width, height, 0);
    }

    function animate(timestamp: number) {
      drawStars(starCanvas!, stars, drawnWidth, drawnHeight, timestamp / 1000);
      frame = requestAnimationFrame(animate);
    }

    render();
    if (!reduceMotion) frame = requestAnimationFrame(animate);

    const observer = new ResizeObserver(render);
    observer.observe(wrapper);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={wrapperRef} aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
      <canvas ref={skyRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={starsRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
