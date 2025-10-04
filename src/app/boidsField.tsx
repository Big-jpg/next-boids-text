// app/boidsField.tsx
"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";
import { sampleTextToPoints } from "@/lib/textField";
import { defaultCfg, Cfg } from "@/lib/controls";

type Vec = { x: number; y: number };
type Mode = "free" | "forming";

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const TWO_PI = Math.PI * 2;

export default function BoidsField() {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const DPRRef = useRef<number>(1);
  const sizeRef = useRef({ w: 0, h: 0 });

  const cfgRef = useRef<Cfg>(defaultCfg);

  const hueRef = useRef({ hue: 200 });
  const attractorRef = useRef({ x: 0, y: 0, strength: 0.18 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const followAttractorRef = useRef(true);
  const modeRef = useRef<Mode>("free");
  const textTargetsRef = useRef<Vec[]>([]);
  const mappingRef = useRef<number[]>([]);
  const pulseRef = useRef(false);

  class Boid {
    pos: Vec; vel: Vec; acc: Vec;
    constructor(x: number, y: number) {
      const ang = Math.random() * TWO_PI;
      this.pos = { x, y };
      this.vel = { x: Math.cos(ang) * cfgRef.current.speed, y: Math.sin(ang) * cfgRef.current.speed };
      this.acc = { x: 0, y: 0 };
    }
    applyForce(f: Vec) { this.acc.x += f.x; this.acc.y += f.y; }
    steerTowards(target: Vec, strength = 1) {
      const v = { x: target.x - this.pos.x, y: target.y - this.pos.y };
      const desired = scale(normalize(v), cfgRef.current.speed);
      let steer = { x: desired.x - this.vel.x, y: desired.y - this.vel.y };
      this.applyForce(limit(steer, cfgRef.current.maxForce * strength));
    }
    flockWeighted(neighbors: Boid[], wAlign: number, wCoh: number, wSep: number) {
      const cfg = cfgRef.current;
      let align = { x: 0, y: 0 }, cohesion = { x: 0, y: 0 }, separation = { x: 0, y: 0 };
      let aC = 0, cC = 0, sC = 0;
      for (let other of neighbors) if (other !== this) {
        const dx = other.pos.x - this.pos.x, dy = other.pos.y - this.pos.y;
        const d = Math.hypot(dx, dy);
        if (d < cfg.alignRadius) { align.x += other.vel.x; align.y += other.vel.y; aC++; }
        if (d < cfg.cohesionRadius) { cohesion.x += other.pos.x; cohesion.y += other.pos.y; cC++; }
        if (d < cfg.separationRadius && d > 0) { separation.x -= dx / d; separation.y -= dy / d; sC++; }
      }
      if (aC && wAlign) {
        align.x /= aC; align.y /= aC;
        this.applyForce(limit({ x: align.x - this.vel.x, y: align.y - this.vel.y }, cfg.maxForce * cfg.alignStrength * wAlign));
      }
      if (cC && wCoh) {
        cohesion.x /= cC; cohesion.y /= cC;
        const desired = scale(normalize({ x: cohesion.x - this.pos.x, y: cohesion.y - this.pos.y }), cfg.speed);
        this.applyForce(limit({ x: desired.x - this.vel.x, y: desired.y - this.vel.y }, cfg.maxForce * cfg.cohesionStrength * wCoh));
      }
      if (sC && wSep) {
        separation.x /= sC; separation.y /= sC;
        this.applyForce(limit({ x: separation.x - this.vel.x, y: separation.y - this.vel.y }, cfg.maxForce * cfg.separationStrength * wSep));
      }
    }
    borders(w: number, h: number) {
      const m = 12 + cfgRef.current.speed * 4;
      if (this.pos.x < -m) this.pos.x = w + m;
      if (this.pos.y < -m) this.pos.y = h + m;
      if (this.pos.x > w + m) this.pos.x = -m;
      if (this.pos.y > h + m) this.pos.y = -m;
    }
    update() {
      const cfg = cfgRef.current;
      this.vel.x += this.acc.x; this.vel.y += this.acc.y;
      this.vel = limit(this.vel, cfg.speed);
      this.pos.x += this.vel.x; this.pos.y += this.vel.y;
      this.acc.x = 0; this.acc.y = 0;
    }
    draw(ctx: CanvasRenderingContext2D, hue: number) {
      const s = 2.6;
      const ang = Math.atan2(this.vel.y, this.vel.x);
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(s * 2.4, 0);
      ctx.lineTo(-s * 1.2, s);
      ctx.lineTo(-s * 1.2, -s);
      ctx.closePath();
      ctx.fillStyle = `hsl(${hue}, 75%, 65%)`;
      ctx.fill();
      ctx.restore();
    }
  }

  const boidsRef = useRef<Boid[]>([]);

  /* helpers */
  function limit(v: Vec, max: number): Vec { const m = Math.hypot(v.x, v.y); return m > max && m > 0 ? { x: v.x / m * max, y: v.y / m * max } : v; }
  function normalize(v: Vec): Vec { const m = Math.hypot(v.x, v.y) || 1; return { x: v.x / m, y: v.y / m }; }
  function scale(v: Vec, s: number): Vec { return { x: v.x * s, y: v.y * s }; }

  useEffect(() => {
    const c = document.createElement("canvas");
    c.id = "c";
    document.body.appendChild(c);
    const ctx = c.getContext("2d", { alpha: false })!;
    ctxRef.current = ctx;

    // --- spawn ring reseed on large resizes (for drama) ---
    function reseedAroundCenter() {
      const { w, h } = sizeRef.current;
      const cx = w * 0.5, cy = h * 0.5;
      const radius = Math.min(w, h) * 0.35;
      for (const b of boidsRef.current) {
        const ang = Math.random() * TWO_PI;
        const r = radius * (0.85 + Math.random() * 0.15);
        b.pos.x = cx + Math.cos(ang) * r;
        b.pos.y = cy + Math.sin(ang) * r;
        const tAngle = ang + Math.PI / 2;
        b.vel.x = Math.cos(tAngle) * cfgRef.current.speed;
        b.vel.y = Math.sin(tAngle) * cfgRef.current.speed;
        b.acc.x = 0; b.acc.y = 0;
      }
    }

    function seed() {
      const { w, h } = sizeRef.current;
      const N = cfgRef.current.count;
      const b: Boid[] = [];
      for (let i = 0; i < N; i++) b.push(new Boid(Math.random() * w, Math.random() * h));
      boidsRef.current = b;
    }

    const doResize = () => {
      const prev = sizeRef.current;
      const DPR = clamp(window.devicePixelRatio || 1, 1, 2);
      DPRRef.current = DPR;
      const w = window.innerWidth, h = window.innerHeight;
      const sizeDelta = Math.abs(w - prev.w) + Math.abs(h - prev.h);

      sizeRef.current = { w, h };
      c.width = Math.floor(w * DPR);
      c.height = Math.floor(h * DPR);
      c.style.width = w + "px";
      c.style.height = h + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      if (!boidsRef.current.length) seed();
      else if (sizeDelta > 120) reseedAroundCenter();
    };

    doResize();
    let resizeTimer: number | null = null;
    const onResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(doResize, 120);
    };
    window.addEventListener("resize", onResize);

    const onMove = (e: MouseEvent) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY; };
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "f") followAttractorRef.current = !followAttractorRef.current; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onKey);

    anime({
      targets: hueRef.current,
      hue: [{ value: 20, duration: 4000 }, { value: 280, duration: 4000 }],
      easing: "easeInOutQuad", loop: true, direction: "alternate"
    });

    const wander = () => {
      const { w, h } = sizeRef.current;
      anime({
        targets: attractorRef.current,
        x: Math.random() * w, y: Math.random() * h,
        easing: "easeInOutSine", duration: 3500
      });
    };
    attractorRef.current.x = sizeRef.current.w * 0.5;
    attractorRef.current.y = sizeRef.current.h * 0.5;
    const wanderId = setInterval(wander, 3600);

    /* live cfg update & count adjustment */
    const onCfg = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<Cfg>;
      const before = cfgRef.current;
      cfgRef.current = { ...cfgRef.current, ...detail };

      // adjust boid count smoothly
      const target = cfgRef.current.count;
      const diff = target - boidsRef.current.length;
      const { w, h } = sizeRef.current;
      if (diff > 0) for (let i = 0; i < diff; i++) boidsRef.current.push(new Boid(Math.random() * w, Math.random() * h));
      else if (diff < 0) boidsRef.current.length = Math.max(0, boidsRef.current.length + diff);

      if ((detail.separationRadius ?? before.separationRadius) > before.separationRadius + 10) {
        for (const b of boidsRef.current) { b.vel.x *= 0.9; b.vel.y *= 0.9; }
      }
    };

    /* density pulse (unchanged) */
    const onPulse = (e: Event) => {
      const { enabled } = (e as CustomEvent).detail as { enabled: boolean };
      pulseRef.current = enabled;
      if (enabled) startPulse(); else stopPulse();
    };
    let pulseAnim: anime.AnimeInstance | null = null;
    function startPulse() {
      stopPulse();
      pulseAnim = anime({
        targets: cfgRef.current,
        count: [{ value: cfgRef.current.count + 80, duration: 5000 }, { value: Math.max(80, cfgRef.current.count - 60), duration: 5000 }],
        round: 1, easing: "easeInOutSine", loop: true, direction: "alternate",
        update: () => onCfg(new CustomEvent("x", { detail: {} }) as any)
      });
    }
    function stopPulse() { if (pulseAnim) { pulseAnim.pause(); pulseAnim = null; } }

    /* form / disperse */
    const onForm = (e: Event) => {
      const { text, cfg } = (e as CustomEvent).detail as { text: string; cfg: Cfg };
      const { w, h } = sizeRef.current;

      const boxW = Math.floor(w * 0.8);
      const boxH = Math.floor(h * 0.6);

      // First pass: sample with current spacing (manual or zero)
      const first = sampleTextToPoints({
        width: boxW, height: boxH, text,
        font: "bold 200px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        sampleEvery: 6, threshold: 40, mode: "outline", strokeWidth: 5,
        letterSpacingPx: cfg.autoDensity ? 0 : cfg.letterSpacingPx
      });

      let spacingPx = cfg.letterSpacingPx;
      let desiredCount = cfg.count;

      if (cfg.autoDensity) {
        // auto spacing grows with font size and desired density
        const densityGuess = Math.max(0.4, Math.min(0.9, cfg.densityFactor));
        desiredCount = clamp(Math.round(first.points.length * densityGuess), 120, 1200);

        // spacing ~ 12–28% of fontPx scaled by density; keeps outlines readable
        spacingPx = clamp(first.fontPx * (0.12 + (densityGuess - 0.4) * 0.2), 2, first.fontPx * 0.3);
      }

      // Second pass: resample with final spacing so points follow spacing
      const final = sampleTextToPoints({
        width: boxW, height: boxH, text,
        font: "bold 200px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        sampleEvery: 6, threshold: 40, mode: "outline", strokeWidth: 5,
        letterSpacingPx: spacingPx
      });

      const points = final.points.map(p => ({ x: p.x + w * 0.1, y: p.y + h * 0.2 }));
      textTargetsRef.current = points;

      // tell the sim the new desired count (auto) and let onCfg adjust boids
      if (cfg.autoDensity) {
        window.dispatchEvent(new CustomEvent("boids/cfg", { detail: { count: desiredCount } }));
      }

      // (Re)map boids to targets
      const N = boidsRef.current.length;
      const M = points.length;
      const map: number[] = new Array(N).fill(-1);
      const indices = Array.from({ length: M }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [indices[i], indices[j]] = [indices[j], indices[i]]; }
      const use = indices.slice(0, Math.min(N, M));
      for (let i = 0; i < use.length; i++) map[i] = use[i];
      mappingRef.current = map;
      modeRef.current = "forming";
    };

    const onDisperse = () => {
      modeRef.current = "free";
      mappingRef.current = [];
      textTargetsRef.current = [];
    };

    window.addEventListener("boids/cfg", onCfg as EventListener);
    window.addEventListener("boids/pulse", onPulse as EventListener);
    window.addEventListener("boids/form", onForm as EventListener);
    window.addEventListener("boids/disperse", onDisperse as EventListener);

    // main loop
    let raf = 0;
    const step = () => {
      raf = requestAnimationFrame(step);
      const ctx = ctxRef.current!;
      const { w, h } = sizeRef.current;
      ctx.fillStyle = "#0b0f13";
      ctx.fillRect(0, 0, w, h);

      const hue = hueRef.current.hue;
      const boids = boidsRef.current;
      const mode = modeRef.current;
      const targets = textTargetsRef.current;
      const mapping = mappingRef.current;

      let target: Vec = attractorRef.current;
      const md = Math.hypot(mouseRef.current.x - target.x, mouseRef.current.y - target.y);
      if (followAttractorRef.current && mode === "free" && md < Math.min(w, h) * 0.5) {
        target = mouseRef.current;
      }

      for (let i = 0; i < boids.length; i++) {
        const b = boids[i];
        if (mode === "free") {
          b.flockWeighted(boids, 0.8, 0.4, 1.0);
          b.steerTowards(target, attractorRef.current.strength);
        } else {
          const idx = mapping[i];
          if (idx !== undefined && idx >= 0 && idx < targets.length) {
            const t = targets[idx];
            const toT = { x: t.x - b.pos.x, y: t.y - b.pos.y };
            const dist = Math.hypot(toT.x, toT.y);

            const orbitRadius = cfgRef.current.orbitRadius;
            const repelRadius = cfgRef.current.repelRadius;
            const orbitStrength = 0.6;
            const repelStrength = 0.9;

            if (dist > orbitRadius) {
              b.steerTowards(t, 1.0);
              b.flockWeighted(boids, 0.25, 0.15, 0.6);
            } else if (dist > repelRadius) {
              const tangent = normalize({ x: -toT.y, y: toT.x });
              b.applyForce(scale(tangent, orbitStrength));
              b.flockWeighted(boids, 0.2, 0.1, 0.4);
            } else {
              const away = normalize({ x: -toT.x, y: -toT.y });
              b.applyForce(scale(away, repelStrength));
              b.flockWeighted(boids, 0.0, 0.0, 0.25);
            }
          } else {
            b.steerTowards({ x: w * 0.5, y: h * 0.5 }, 0.12);
            b.flockWeighted(boids, 0.2, 0.1, 0.5);
          }
        }
        b.update();
        b.borders(w, h);
        b.draw(ctx, hue);
      }
    };
    requestAnimationFrame(step);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("boids/cfg", onCfg as EventListener);
      window.removeEventListener("boids/pulse", onPulse as EventListener);
      window.removeEventListener("boids/form", onForm as EventListener);
      window.removeEventListener("boids/disperse", onDisperse as EventListener);
      clearInterval(wanderId);
      c.remove();
    };
  }, []);

  return null;
}
