"use client";
import { useEffect, useRef } from "react";
import anime from "animejs";
import { sampleTextToPoints } from "@/lib/textField";

type Vec = { x: number; y: number };
type Mode = "free" | "forming";

type Cfg = {
  count: number;
  speed: number;
  maxForce: number;
  alignRadius: number;
  cohesionRadius: number;
  separationRadius: number;
  alignStrength: number;
  cohesionStrength: number;
  separationStrength: number;
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const TWO_PI = Math.PI * 2;

export default function BoidsField() {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const DPRRef = useRef<number>(1);
  const sizeRef = useRef({ w: 0, h: 0 });

  const cfgRef = useRef<Cfg>({
    count: 180,
    speed: 2.2,
    maxForce: 0.06,
    alignRadius: 70,
    cohesionRadius: 70,
    separationRadius: 24,
    alignStrength: 0.8,
    cohesionStrength: 0.35,
    separationStrength: 1.2
  });

  const hueRef = useRef({ hue: 200 });
  const attractorRef = useRef({ x: 0, y: 0, strength: 0.18 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const followAttractorRef = useRef(true);
  const modeRef = useRef<Mode>("free");
  const textTargetsRef = useRef<Vec[]>([]);
  const mappingRef = useRef<number[]>([]);
  const pulseRef = useRef(false);

  class Boid {
    pos: Vec;
    vel: Vec;
    acc: Vec;
    constructor(x: number, y: number) {
      const ang = Math.random() * TWO_PI;
      this.pos = { x, y };
      this.vel = { x: Math.cos(ang) * cfgRef.current.speed, y: Math.sin(ang) * cfgRef.current.speed };
      this.acc = { x: 0, y: 0 };
    }
    applyForce(f: Vec) { this.acc.x += f.x; this.acc.y += f.y; }
    steerTowards(target: Vec, strength = 1) {
      const v = { x: target.x - this.pos.x, y: target.y - this.pos.y };
      const d = Math.hypot(v.x, v.y);
      if (d === 0) return;
      const desired = scale(normalize(v), cfgRef.current.speed);
      let steer = { x: desired.x - this.vel.x, y: desired.y - this.vel.y };
      steer = limit(steer, cfgRef.current.maxForce * strength);
      this.applyForce(steer);
    }
    flock(neighbors: Boid[]) {
      const cfg = cfgRef.current;
      let align = { x: 0, y: 0 }, cohesion = { x: 0, y: 0 }, separation = { x: 0, y: 0 };
      let aC=0, cC=0, sC=0;
      for (let other of neighbors) {
        if (other === this) continue;
        const dx = other.pos.x - this.pos.x;
        const dy = other.pos.y - this.pos.y;
        const d = Math.hypot(dx, dy);
        if (d < cfg.alignRadius) { align.x += other.vel.x; align.y += other.vel.y; aC++; }
        if (d < cfg.cohesionRadius) { cohesion.x += other.pos.x; cohesion.y += other.pos.y; cC++; }
        if (d < cfg.separationRadius && d > 0) { separation.x -= dx / d; separation.y -= dy / d; sC++; }
      }
      if (aC) {
        align.x /= aC; align.y /= aC;
        align = limit({ x: align.x - this.vel.x, y: align.y - this.vel.y }, cfg.maxForce * cfg.alignStrength);
        this.applyForce(align);
      }
      if (cC) {
        cohesion.x = cohesion.x / cC; cohesion.y = cohesion.y / cC;
        this.steerTowards(cohesion, cfg.cohesionStrength);
      }
      if (sC) {
        separation.x /= sC; separation.y /= sC;
        separation = limit({ x: separation.x - this.vel.x, y: separation.y - this.vel.y }, cfg.maxForce * cfg.separationStrength);
        this.applyForce(separation);
      }
    }
    borders(w: number, h: number) {
      if (this.pos.x < -10) this.pos.x = w + 10;
      if (this.pos.y < -10) this.pos.y = h + 10;
      if (this.pos.x > w + 10) this.pos.x = -10;
      if (this.pos.y > h + 10) this.pos.y = -10;
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
      ctx.moveTo(s*2.4, 0);
      ctx.lineTo(-s*1.2, s);
      ctx.lineTo(-s*1.2, -s);
      ctx.closePath();
      ctx.fillStyle = `hsl(${hue}, 75%, 65%)`;
      ctx.fill();
      ctx.restore();
    }
  }

  const boidsRef = useRef<Boid[]>([]);

  // helpers
  function limit(v: Vec, max: number): Vec {
    const m = Math.hypot(v.x, v.y);
    return (m > max && m > 0) ? { x: (v.x / m) * max, y: (v.y / m) * max } : v;
  }
  function normalize(v: Vec): Vec {
    const m = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / m, y: v.y / m };
  }
  function scale(v: Vec, s: number): Vec { return { x: v.x * s, y: v.y * s }; }

  useEffect(() => {
    const c = document.createElement("canvas");
    c.id = "c";
    document.body.appendChild(c);
    const ctx = c.getContext("2d", { alpha: false })!;
    ctxRef.current = ctx;

    const resize = () => {
      const DPR = clamp(window.devicePixelRatio || 1, 1, 2);
      DPRRef.current = DPR;
      const w = window.innerWidth, h = window.innerHeight;
      sizeRef.current = { w, h };
      c.width = Math.floor(w * DPR);
      c.height = Math.floor(h * DPR);
      c.style.width = w + "px";
      c.style.height = h + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (!boidsRef.current.length) seed();
    };
    resize();
    window.addEventListener("resize", resize);

    function seed() {
      const { w, h } = sizeRef.current;
      const b: Boid[] = [];
      const N = cfgRef.current.count;
      for (let i = 0; i < N; i++) b.push(new Boid(Math.random() * w, Math.random() * h));
      boidsRef.current = b;
    }
    seed();

    const onMove = (e: MouseEvent) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY; };
    const onKey = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "f") followAttractorRef.current = !followAttractorRef.current; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onKey);

    // hue animation
    anime({
      targets: hueRef.current,
      hue: [{ value: 20, duration: 4000 }, { value: 280, duration: 4000 }],
      easing: "easeInOutQuad",
      loop: true,
      direction: "alternate"
    });

    // attractor wander
    const wander = () => {
      const { w, h } = sizeRef.current;
      anime({
        targets: attractorRef.current,
        x: Math.random() * w,
        y: Math.random() * h,
        easing: "easeInOutSine",
        duration: 3500
      });
    };
    attractorRef.current.x = sizeRef.current.w * 0.5;
    attractorRef.current.y = sizeRef.current.h * 0.5;
    const wanderId = setInterval(wander, 3600);

    // wiring: cfg / pulse / form / disperse
    const onCfg = (e: Event) => {
      const detail = (e as CustomEvent).detail as Partial<Cfg>;
      cfgRef.current = { ...cfgRef.current, ...detail };
      const target = cfgRef.current.count;
      const diff = target - boidsRef.current.length;
      const { w, h } = sizeRef.current;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) boidsRef.current.push(new Boid(Math.random()*w, Math.random()*h));
      } else if (diff < 0) {
        boidsRef.current.length = Math.max(0, boidsRef.current.length + diff);
      }
    };

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
        count: [{ value: cfgRef.current.count + 80, duration: 5000 },
                { value: Math.max(80, cfgRef.current.count - 60), duration: 5000 }],
        round: 1, easing: "easeInOutSine", loop: true, direction: "alternate",
        update: () => onCfg(new CustomEvent("x",{detail:{}}) as any)
      });
    }
    function stopPulse() { if (pulseAnim) { pulseAnim.pause(); pulseAnim = null; } }

    const onForm = (e: Event) => {
      const { text } = (e as CustomEvent).detail as { text: string };
      const { w, h } = sizeRef.current;

      const points = sampleTextToPoints({
        width: Math.floor(w * 0.8),
        height: Math.floor(h * 0.6),
        text,
        font: "bold 200px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        sampleEvery: 6,
        threshold: 40
      }).map(p => ({ x: p.x + w*0.1, y: p.y + h*0.2 }));

      textTargetsRef.current = points;

      const N = boidsRef.current.length;
      const M = points.length;
      const map: number[] = new Array(N).fill(-1);
      const indices = Array.from({ length: M }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = (Math.random()* (i+1))|0; [indices[i], indices[j]] = [indices[j], indices[i]];
      }
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
      ctx.fillRect(0,0,w,h);

      const hue = hueRef.current.hue;
      const boids = boidsRef.current;
      const follow = followAttractorRef.current;

      const mode = modeRef.current;
      const targets = textTargetsRef.current;
      const mapping = mappingRef.current;

      let target: Vec = attractorRef.current;
      const md = Math.hypot(mouseRef.current.x - target.x, mouseRef.current.y - target.y);
      if (follow && mode === "free" && md < Math.min(w, h) * 0.5) {
        target = mouseRef.current;
      }

      for (let i = 0; i < boids.length; i++) {
        const b = boids[i];

        if (mode === "free") {
          b.flock(boids);
          b.steerTowards(target, attractorRef.current.strength);
        } else {
          const idx = mapping[i];
          if (idx !== undefined && idx >= 0 && idx < targets.length) {
            b.steerTowards(targets[idx], 0.85);
            b.flock(boids);
          } else {
            b.steerTowards({ x: w * 0.5, y: h * 0.5 }, 0.12);
            b.flock(boids);
          }
        }

        b.update();
        b.borders(w, h);
        b.draw(ctx, hue);
      }
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(wanderId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("boids/cfg", onCfg as EventListener);
      window.removeEventListener("boids/pulse", onPulse as EventListener);
      window.removeEventListener("boids/form", onForm as EventListener);
      window.removeEventListener("boids/disperse", onDisperse as EventListener);
      c.remove();
    };
  }, []);

  return null;
}
