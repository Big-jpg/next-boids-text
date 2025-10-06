// src/app/boidsField.tsx
"use client";

import { useEffect, useRef } from "react";
import { Cfg, defaultCfg } from "@/lib/controls";

type Vec = { x: number; y: number };
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const TWO_PI = Math.PI * 2;

class Boid {
  p: Vec; v: Vec; a: Vec = { x: 0, y: 0 };
  trail?: Vec[];

  constructor(p: Vec, v: Vec, trailCap: number) {
    this.p = { ...p };
    this.v = { ...v };
    if (trailCap > 0) this.trail = new Array(trailCap).fill(0).map(() => ({ x: p.x, y: p.y }));
  }

  addForce(f: Vec) { this.a.x += f.x; this.a.y += f.y; }
  limitForce(max: number) {
    const m = Math.hypot(this.a.x, this.a.y);
    if (m > max && m > 0) { this.a.x = (this.a.x / m) * max; this.a.y = (this.a.y / m) * max; }
  }

  steerHeading(desired: Vec, cfg: Cfg, assist: boolean) {
    const m = Math.hypot(desired.x, desired.y) || 1;
    const ds = { x: (desired.x / m) * cfg.speed, y: (desired.y / m) * cfg.speed };
    const vAng = Math.atan2(this.v.y, this.v.x), dsAng = Math.atan2(ds.y, ds.x);
    let dAng = ((dsAng - vAng + Math.PI) % TWO_PI) - Math.PI;
    const cap = assist ? cfg.maxTurnFormRad : cfg.maxTurnFreeRad;
    const turn = clamp(dAng, -cap, cap);
    const vMag = Math.hypot(this.v.x, this.v.y) || cfg.speed;
    const newV = { x: Math.cos(vAng + turn) * vMag, y: Math.sin(vAng + turn) * vMag };
    return { x: newV.x - this.v.x, y: newV.y - this.v.y };
  }

  flock(neighbors: Boid[], cfg: Cfg) {
    // Alignment / Cohesion / Separation accumulators
    let sumA = { x: 0, y: 0 }, cntA = 0;
    let sumC = { x: 0, y: 0 }, cntC = 0;
    let sumS = { x: 0, y: 0 }, cntS = 0;

    for (const other of neighbors) {
      if (other === this) continue;
      const dx = other.p.x - this.p.x, dy = other.p.y - this.p.y;
      const d = Math.hypot(dx, dy);
      if (d < cfg.alignRadius)   { sumA.x += other.v.x; sumA.y += other.v.y; cntA++; }
      if (d < cfg.cohesionRadius){ sumC.x += other.p.x; sumC.y += other.p.y; cntC++; }
      if (d < cfg.separationRadius && d > 0.0001) { sumS.x -= dx / d; sumS.y -= dy / d; cntS++; }
    }

    if (cntA) { sumA.x /= cntA; sumA.y /= cntA; this.addForce({ x: sumA.x * cfg.alignStrength,   y: sumA.y * cfg.alignStrength   }); }
    if (cntC) { sumC.x = sumC.x / cntC - this.p.x; sumC.y = sumC.y / cntC - this.p.y; this.addForce({ x: sumC.x * cfg.cohesionStrength, y: sumC.y * cfg.cohesionStrength }); }
    if (cntS) { sumS.x /= cntS; sumS.y /= cntS; this.addForce({ x: sumS.x * cfg.separationStrength, y: sumS.y * cfg.separationStrength }); }
  }

  pdAssist(target: Vec, cfg: Cfg) {
    const k = cfg.pdLockK, d = cfg.pdLockDamp;
    const spring = { x: (target.x - this.p.x) * k, y: (target.y - this.p.y) * k };
    const damp   = { x: -this.v.x * d, y: -this.v.y * d };
    this.addForce({ x: spring.x + damp.x, y: spring.y + damp.y });
  }

  orbitField(target: Vec, cfg: Cfg) {
    const dx = target.x - this.p.x, dy = target.y - this.p.y;
    const dist = Math.hypot(dx, dy) || 1; const dir = { x: dx / dist, y: dy / dist };
    if (dist < cfg.repelRadius) { this.addForce({ x: -dir.x * (cfg.repelRadius - dist), y: -dir.y * (cfg.repelRadius - dist) }); return; }
    if (dist > cfg.orbitRadius * 1.2) {
      const t = { x: -dir.y, y: dir.x };
      this.addForce({ x: t.x * cfg.speed * 0.8, y: t.y * cfg.speed * 0.8 });
    } else {
      this.pdAssist(target, cfg);
    }
  }

  integrate(cfg: Cfg, disciplined: boolean, frame: number, sampleEvery: number) {
    this.limitForce(cfg.maxForce);
    this.v.x += this.a.x; this.v.y += this.a.y;

    const vmag = Math.hypot(this.v.x, this.v.y) || 1;
    if (disciplined && cfg.exactSpeedForming) {
      const f = cfg.speed / vmag; this.v.x *= f; this.v.y *= f;
    } else {
      const vmax = cfg.speed * 1.5;
      if (vmag > vmax) { this.v.x = (this.v.x / vmag) * vmax; this.v.y = (this.v.y / vmag) * vmax; }
    }

    if (this.trail && frame % sampleEvery === 0) {
      this.trail.pop(); this.trail.unshift({ x: this.p.x, y: this.p.y });
    }

    this.p.x += this.v.x; this.p.y += this.v.y;
    this.a.x = 0; this.a.y = 0;
  }

  borders(w: number, h: number) {
    if (this.p.x < -8) this.p.x = w + 8;
    if (this.p.y < -8) this.p.y = h + 8;
    if (this.p.x > w + 8) this.p.x = -8;
    if (this.p.y > h + 8) this.p.y = -8;
  }
}

export default function BoidsField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const wRef = useRef(0); const hRef = useRef(0);
  const cfgRef = useRef<Cfg>(defaultCfg);
  const boidsRef = useRef<Boid[]>([]);
  const pulseRef = useRef(false); const pulsePhaseRef = useRef(0);
  const frameRef = useRef(0);

  // mouse field
  const mouse = useRef({ x: 0, y: 0, inside: false });

  function neighborsOf(b: Boid, all: Boid[], radius: number): Boid[] {
    const r2 = radius * radius, out: Boid[] = [];
    for (let i = 0; i < all.length; i++) {
      const o = all[i]; if (o === b) continue;
      const dx = o.p.x - b.p.x, dy = o.p.y - b.p.y;
      if (dx * dx + dy * dy <= r2) out.push(o);
    }
    return out;
  }

  function resize() {
    const c = canvasRef.current!; const DPR = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    wRef.current = Math.max(320, Math.floor(rect.width));
    hRef.current = Math.max(240, Math.floor(rect.height));
    c.width = Math.floor(wRef.current * DPR); c.height = Math.floor(hRef.current * DPR);
    const ctx = c.getContext("2d")!; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctxRef.current = ctx;
  }

  function spawn(count: number) {
    const w = wRef.current, h = hRef.current;
    const trailCap = cfgRef.current.drawMode === "trail" ? cfgRef.current.trailLength : 0;
    const arr: Boid[] = [];
    for (let i = 0; i < count; i++) {
      const p = { x: Math.random() * w, y: Math.random() * h };
      const a = Math.random() * TWO_PI;
      const v = { x: Math.cos(a) * cfgRef.current.speed, y: Math.sin(a) * cfgRef.current.speed };
      arr.push(new Boid(p, v, trailCap));
    }
    boidsRef.current = arr;
  }

  function ensurePopulation() {
    const need = cfgRef.current.count, cur = boidsRef.current.length;
    if (cur === need) return;
    const trailCap = cfgRef.current.drawMode === "trail" ? cfgRef.current.trailLength : 0;
    const w = wRef.current, h = hRef.current;
    if (cur < need) {
      for (let i = 0; i < need - cur; i++) {
        const p = { x: Math.random() * w, y: Math.random() * h };
        const a = Math.random() * TWO_PI;
        const v = { x: Math.cos(a) * cfgRef.current.speed, y: Math.sin(a) * cfgRef.current.speed };
        boidsRef.current.push(new Boid(p, v, trailCap));
      }
    } else {
      boidsRef.current.splice(need);
    }
  }

  function applyMouseField(b: Boid, cfg: Cfg) {
    if (!cfg.mouseEnabled || !mouse.current.inside || cfg.mouseStrength <= 0) return;
    const dx = mouse.current.x - b.p.x, dy = mouse.current.y - b.p.y;
    const d = Math.hypot(dx, dy) || 1; if (d > cfg.mouseFalloff) return;
    const fall = 1 - d / cfg.mouseFalloff; const s = cfg.mouseStrength * fall;
    const dir = { x: dx / d, y: dy / d };
    if (cfg.mouseMode === "attract") b.addForce({ x: dir.x * s, y: dir.y * s });
    else b.addForce({ x: -dir.x * s, y: -dir.y * s });
  }

  function drawTrail(ctx: CanvasRenderingContext2D, b: Boid, cfg: Cfg) {
    if (!b.trail || b.trail.length < 2) return;
    ctx.lineWidth = 1;
    for (let i = b.trail.length - 1; i >= 1; i--) {
      const p1 = b.trail[i - 1], p2 = b.trail[i];
      const alpha = cfg.trailOpacity * (i / b.trail.length);
      ctx.strokeStyle = `rgba(220,230,250,${alpha})`;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
  }

  function drawBoid(ctx: CanvasRenderingContext2D, b: Boid, cfg: Cfg) {
    if (cfg.drawMode === "trail") {
      drawTrail(ctx, b, cfg);
      ctx.fillStyle = "rgba(220,230,250,0.92)";
      ctx.beginPath(); ctx.arc(b.p.x, b.p.y, cfg.boidSize * 0.75, 0, TWO_PI); ctx.fill();
      return;
    }

    if (cfg.drawMode === "dot") {
      ctx.fillStyle = "rgba(220,230,250,0.92)";
      ctx.beginPath(); ctx.arc(b.p.x, b.p.y, cfg.boidSize * 0.6, 0, TWO_PI); ctx.fill();
      return;
    }

    // triangle
    const ang = Math.atan2(b.v.y, b.v.x), s = cfg.boidSize;
    const tip = { x: b.p.x + Math.cos(ang) * (2.0 * s), y: b.p.y + Math.sin(ang) * (2.0 * s) };
    const left = { x: b.p.x + Math.cos(ang + 2.5) * (1.2 * s), y: b.p.y + Math.sin(ang + 2.5) * (1.2 * s) };
    const right= { x: b.p.x + Math.cos(ang - 2.5) * (1.2 * s), y: b.p.y + Math.sin(ang - 2.5) * (1.2 * s) };
    ctx.fillStyle = "rgba(220,230,250,0.92)";
    ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.closePath(); ctx.fill();
  }

  function drawRays(ctx: CanvasRenderingContext2D, b: Boid, all: Boid[], cfg: Cfg) {
    if (cfg.rayMode === "off") return;

    ctx.lineWidth = cfg.rayThickness;

    if (cfg.rayMode === "neighbours" || cfg.rayMode === "both") {
      // K nearest by Euclidean distance within max of radii
      const r = Math.max(cfg.alignRadius, cfg.cohesionRadius);
      const neigh = neighborsOf(b, all, r)
        .map(nb => ({ nb, d2: (nb.p.x - b.p.x) ** 2 + (nb.p.y - b.p.y) ** 2 }))
        .sort((a, z) => a.d2 - z.d2)
        .slice(0, cfg.rayNearestK);

      ctx.strokeStyle = `rgba(160,200,255,${cfg.rayOpacity})`;
      for (const { nb } of neigh) {
        ctx.beginPath(); ctx.moveTo(b.p.x, b.p.y); ctx.lineTo(nb.p.x, nb.p.y); ctx.stroke();
      }
    }

    if (cfg.rayMode === "forces" || cfg.rayMode === "both") {
      // Visualise current force components approximations:
      //   separation (red-ish), cohesion (green-ish), alignment (blue-ish)
      // Compute simple local estimates using a small neighbourhood
      const neigh = neighborsOf(b, all, Math.max(cfg.cohesionRadius, cfg.alignRadius));
      let sep = { x: 0, y: 0 }, coh = { x: 0, y: 0 }, ali = { x: 0, y: 0 };
      let cSep = 0, cCoh = 0, cAli = 0;

      for (const o of neigh) {
        const dx = o.p.x - b.p.x, dy = o.p.y - b.p.y;
        const d = Math.hypot(dx, dy);
        if (d < cfg.separationRadius && d > 0.0001) { sep.x -= dx / d; sep.y -= dy / d; cSep++; }
        if (d < cfg.cohesionRadius)                 { coh.x += o.p.x;  coh.y += o.p.y;  cCoh++; }
        if (d < cfg.alignRadius)                    { ali.x += o.v.x;  ali.y += o.v.y;  cAli++; }
      }
      if (cCoh) { coh.x = coh.x / cCoh - b.p.x; coh.y = coh.y / cCoh - b.p.y; }

      const drawVec = (v: Vec, color: string, scale: number) => {
        const len = Math.hypot(v.x, v.y);
        if (len < 1e-3) return;
        const s = (cfg.rayLengthScale * scale) / len;
        const to = { x: b.p.x + v.x * s, y: b.p.y + v.y * s };
        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(b.p.x, b.p.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      };

      const alpha = cfg.rayOpacity;
      drawVec(sep, `rgba(255,120,120,${alpha})`, cfg.separationStrength);
      drawVec(coh, `rgba(120,255,140,${alpha})`, cfg.cohesionStrength);
      drawVec(ali, `rgba(120,180,255,${alpha})`, cfg.alignStrength);
    }
  }

  function loop() {
    const ctx = ctxRef.current!; const w = wRef.current; const h = hRef.current;
    const cfg = cfgRef.current; const boids = boidsRef.current;
    frameRef.current++;

    if (pulseRef.current) {
      pulsePhaseRef.current += 0.02;
      const bias = 0.02 * Math.sin(pulsePhaseRef.current);
      cfg.speed = clamp(defaultCfg.speed * (1 + bias), 1.0, 6.0);
    }

    ensurePopulation();

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];

      b.flock(neighborsOf(b, boids, Math.max(cfg.cohesionRadius, cfg.alignRadius)), cfg);
      applyMouseField(b, cfg);

      if (cfg.regime === "assist") {
        const forward = { x: b.p.x + b.v.x * 0.6, y: b.p.y + b.v.y * 0.6 };
        b.pdAssist(forward, cfg);
        b.addForce(b.steerHeading(b.v, cfg, true));
      } else if (cfg.regime === "orbit" && mouse.current.inside) {
        b.orbitField({ x: mouse.current.x, y: mouse.current.y }, cfg);
      }

      b.integrate(cfg, cfg.regime !== "pure", frameRef.current, Math.max(1, cfg.trailSampleEvery));
      b.borders(w, h);
    }

    // Draw pass
    ctx.lineWidth = 1;
    for (let i = 0; i < boids.length; i++) {
      drawBoid(ctx, boids[i], cfg);
    }

    // Overlay rays (draw on top for legibility)
    if (cfg.rayMode !== "off") {
      for (let i = 0; i < boids.length; i++) {
        drawRays(ctx, boids[i], boids, cfg);
      }
    }

    // HUD
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "rgba(220,230,250,0.75)";
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Inter";
    ctx.textBaseline = "top";
    ctx.fillText("Boids — Flocking Bench", 12, 12);
    ctx.fillText("• F: toggle mouse-field  • Click: burst  • Rays: neighbours/forces", 12, 28);
    ctx.globalAlpha = 1;

    requestAnimationFrame(loop);
  }

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.style.width = "100%"; canvas.style.height = "100%";
    canvas.style.display = "block";
    const host = document.getElementById("boids-canvas-host");
    host?.appendChild(canvas);

    resize();
    spawn(defaultCfg.count);
    requestAnimationFrame(loop);

    // listeners
    const onResize = () => resize();

    const onCfg = (e: Event) => {
      const next = (e as CustomEvent).detail as Cfg;
      const prevDraw = cfgRef.current.drawMode;
      cfgRef.current = { ...cfgRef.current, ...next };
      if (prevDraw !== cfgRef.current.drawMode) spawn(cfgRef.current.count);
    };

    const onPulse = (e: Event) => {
      const { enabled } = (e as CustomEvent).detail ?? { enabled: false };
      pulseRef.current = !!enabled; if (!enabled) pulsePhaseRef.current = 0;
    };

    const rectFromEvent = (ev: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    };

    const onMouseMove = (ev: MouseEvent) => {
      const p = rectFromEvent(ev);
      mouse.current.x = p.x; mouse.current.y = p.y; mouse.current.inside = true;
    };
    const onMouseLeave = () => { mouse.current.inside = false; };
    const onMouseEnter = () => { mouse.current.inside = true; };

    const onClick = (ev: MouseEvent) => {
      const p = rectFromEvent(ev);
      const boids = boidsRef.current;
      for (let i = 0; i < boids.length; i++) {
        const b = boids[i]; const dx = b.p.x - p.x, dy = b.p.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 160) {
          const s = (160 - d) / 160 * 0.9;
          b.addForce({ x: (dx / d) * s, y: (dy / d) * s });
        }
      }
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key.toLowerCase() === "f") {
        const next = { ...cfgRef.current, mouseEnabled: !cfgRef.current.mouseEnabled };
        cfgRef.current = next; window.dispatchEvent(new CustomEvent("boids/cfg", { detail: next }));
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("boids/cfg", onCfg as EventListener);
    window.addEventListener("boids/pulse", onPulse as EventListener);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("mouseenter", onMouseEnter);
    canvas.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("boids/cfg", onCfg as EventListener);
      window.removeEventListener("boids/pulse", onPulse as EventListener);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("mouseenter", onMouseEnter);
      canvas.removeEventListener("click", onClick);
      host?.removeChild(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id="boids-canvas-host" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />;
}
