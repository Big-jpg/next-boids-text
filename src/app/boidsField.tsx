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
  const DPRRef = useRef(1);
  const sizeRef = useRef({ w: 0, h: 0 });
  const cfgRef = useRef<Cfg>(defaultCfg);
  const hueRef = useRef({ hue: 200 });
  const attractorRef = useRef({ x: 0, y: 0, strength: 0.18 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const followAttractorRef = useRef(true);
  const modeRef = useRef<Mode>("free");
  const textTargetsRef = useRef<Vec[]>([]);
  const mappingRef = useRef<number[]>([]);

  class Boid {
    pos: Vec; vel: Vec; acc: Vec; turn = 0;
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
      const steer = { x: desired.x - this.vel.x, y: desired.y - this.vel.y };
      this.applyForce(limit(steer, cfgRef.current.maxForce * strength));
    }
    flockWeighted(neighbors: Boid[], wA: number, wC: number, wS: number) {
      const cfg = cfgRef.current;
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0;
      let aC = 0, cC = 0, sC = 0;
      for (let other of neighbors) if (other !== this) {
        const dx = other.pos.x - this.pos.x, dy = other.pos.y - this.pos.y;
        const d = Math.hypot(dx, dy);
        if (d < cfg.alignRadius) { ax += other.vel.x; ay += other.vel.y; aC++; }
        if (d < cfg.cohesionRadius) { cx += other.pos.x; cy += other.pos.y; cC++; }
        if (d < cfg.separationRadius && d > 0) {
          const sc = (cfg.separationRadius - d) / cfg.separationRadius;
          sx -= (dx / d) * sc; sy -= (dy / d) * sc; sC++;
        }
      }
      if (aC && wA) {
        ax /= aC; ay /= aC;
        this.applyForce(limit({ x: ax - this.vel.x, y: ay - this.vel.y }, cfg.maxForce * cfg.alignStrength * wA));
      }
      if (cC && wC) {
        cx /= cC; cy /= cC;
        const desired = scale(normalize({ x: cx - this.pos.x, y: cy - this.pos.y }), cfg.speed);
        this.applyForce(limit({ x: desired.x - this.vel.x, y: desired.y - this.vel.y }, cfg.maxForce * cfg.cohesionStrength * wC));
      }
      if (sC && wS) {
        sx /= sC; sy /= sC;
        this.applyForce(limit({ x: sx - this.vel.x, y: sy - this.vel.y }, cfg.maxForce * cfg.separationStrength * wS));
      }
    }
    borders(w: number, h: number) {
      const m = 12 + cfgRef.current.speed * 4;
      if (this.pos.x < -m) this.pos.x = w + m;
      if (this.pos.y < -m) this.pos.y = h + m;
      if (this.pos.x > w + m) this.pos.x = -m;
      if (this.pos.y > h + m) this.pos.y = -m;
    }

    // --- NEW update with cfg-driven turn, PD lock, arrival, exact-speed ---
    update() {
      const cfg = cfgRef.current;
      const mode = modeRef.current;

      // integrate forces
      let vx = this.vel.x + this.acc.x;
      let vy = this.vel.y + this.acc.y;

      const nextMag = Math.hypot(vx, vy) || 1;
      const nx = vx / nextMag, ny = vy / nextMag;
      const curAng = Math.atan2(this.vel.y, this.vel.x);
      const tgtAng = Math.atan2(ny, nx);
      let diff = tgtAng - curAng;
      while (diff > Math.PI) diff -= TWO_PI;
      while (diff < -Math.PI) diff += TWO_PI;

      const maxTurn = (mode === "forming")
        ? cfg.maxTurnFormRad
        : cfg.maxTurnFreeRad;
      const clamped = clamp(diff, -maxTurn, maxTurn);
      const newAng = curAng + clamped;
      this.turn = Math.abs(clamped) * 180 / Math.PI;

      const s0 = Math.hypot(this.vel.x, this.vel.y) || cfg.speed;
      vx = Math.cos(newAng) * s0;
      vy = Math.sin(newAng) * s0;

      // damping
      vx *= 0.98; vy *= 0.98;

      const m = Math.hypot(vx, vy) || 1;
      const targetSpeed =
        mode === "forming" && cfg.exactSpeedForming
          ? cfg.speed
          : clamp(m, cfg.speed * 0.8, cfg.speed * 1.2);

      this.vel.x = (vx / m) * targetSpeed;
      this.vel.y = (vy / m) * targetSpeed;

      this.pos.x += this.vel.x;
      this.pos.y += this.vel.y;
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
  function limit(v: Vec, max: number): Vec { const m = Math.hypot(v.x, v.y); return m > max && m > 0 ? { x: (v.x / m) * max, y: (v.y / m) * max } : v; }
  function normalize(v: Vec): Vec { const m = Math.hypot(v.x, v.y) || 1; return { x: v.x / m, y: v.y / m }; }
  function scale(v: Vec, s: number): Vec { return { x: v.x * s, y: v.y * s }; }

  useEffect(() => {
    const c = document.createElement("canvas");
    document.body.appendChild(c);
    const ctx = c.getContext("2d", { alpha: false })!;
    ctxRef.current = ctx;

    const resize = () => {
      DPRRef.current = Math.min(2, window.devicePixelRatio || 1);
      const w = (sizeRef.current.w = window.innerWidth);
      const h = (sizeRef.current.h = window.innerHeight);
      c.width = w * DPRRef.current;
      c.height = h * DPRRef.current;
      c.style.width = w + "px";
      c.style.height = h + "px";
      ctx.setTransform(DPRRef.current, 0, 0, DPRRef.current, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    anime({
      targets: hueRef.current,
      hue: [{ value: 20, duration: 4000 }, { value: 280, duration: 4000 }],
      easing: "easeInOutQuad", loop: true, direction: "alternate"
    });

    const onCfg = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<Cfg>;
      cfgRef.current = { ...cfgRef.current, ...detail };
    };
    window.addEventListener("boids/cfg", onCfg as EventListener);

    const onForm = (e: Event) => {
      const { text, cfg } = (e as CustomEvent).detail as { text: string; cfg: Cfg };
      cfgRef.current = { ...cfgRef.current, ...cfg };
      const { w, h } = sizeRef.current;
      const boxW = w * 0.8, boxH = h * 0.6;
      const pts = sampleTextToPoints({
        width: boxW, height: boxH, text,
        font: "bold 200px Inter, ui-sans-serif",
        sampleEvery: 6, threshold: 40, mode: "outline", strokeWidth: 5,
        letterSpacingPx: cfg.letterSpacingPx
      }).points.map(p => ({ x: p.x + w * 0.1, y: p.y + h * 0.2 }));
      textTargetsRef.current = pts;
      const N = boidsRef.current.length, M = pts.length;
      const map: number[] = new Array(N).fill(-1);
      const indices = Array.from({ length: M }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      for (let i = 0; i < Math.min(N, M); i++) map[i] = indices[i];
      mappingRef.current = map;
      modeRef.current = "forming";
    };
    const onDisperse = () => { modeRef.current = "free"; mappingRef.current = []; textTargetsRef.current = []; };
    window.addEventListener("boids/form", onForm as EventListener);
    window.addEventListener("boids/disperse", onDisperse as EventListener);

    function seed() {
      const { w, h } = sizeRef.current;
      const N = cfgRef.current.count;
      const b: Boid[] = [];
      for (let i = 0; i < N; i++) b.push(new Boid(Math.random() * w, Math.random() * h));
      boidsRef.current = b;
    }
    seed();

    const step = () => {
      requestAnimationFrame(step);
      const ctx = ctxRef.current!;
      const { w, h } = sizeRef.current;
      ctx.fillStyle = "#0b0f13";
      ctx.fillRect(0, 0, w, h);

      const hue = hueRef.current.hue;
      const boids = boidsRef.current;
      const mode = modeRef.current;
      const targets = textTargetsRef.current;
      const mapping = mappingRef.current;

      for (let i = 0; i < boids.length; i++) {
        const b = boids[i];
        if (mode === "free") {
          b.flockWeighted(boids, 0.9, 0.55, 0.6);
          b.steerTowards(attractorRef.current, attractorRef.current.strength);
        } else {
          const idx = mapping[i];
          if (idx >= 0 && idx < targets.length) {
            const t = targets[idx];
            const dx = t.x - b.pos.x, dy = t.y - b.pos.y;
            const dist = Math.hypot(dx, dy);
            const orbitR = cfgRef.current.orbitRadius;
            const repelR = cfgRef.current.repelRadius;
            const k = cfgRef.current.pdLockK;
            const dmp = cfgRef.current.pdLockDamp;

            if (dist > orbitR) {
              b.steerTowards(t, 1.8);
              b.flockWeighted(boids, 0.15, 0.08, 0.25);
            } else if (dist > repelR) {
              const fx = dx * k - b.vel.x * dmp;
              const fy = dy * k - b.vel.y * dmp;
              b.applyForce(limit({ x: fx, y: fy }, cfgRef.current.maxForce * 2.0));
              b.flockWeighted(boids, 0.06, 0.03, 0.12);
            } else {
              const away = normalize({ x: -dx, y: -dy });
              b.applyForce(scale(away, 0.6));
            }
          }
        }
        b.update();
        b.borders(w, h);
        b.draw(ctx, hue);
      }
    };
    step();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("boids/cfg", onCfg as EventListener);
      window.removeEventListener("boids/form", onForm as EventListener);
      window.removeEventListener("boids/disperse", onDisperse as EventListener);
      c.remove();
    };
  }, []);

  return null;
}
