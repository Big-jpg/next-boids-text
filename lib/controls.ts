// lib/controls.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Regime = "pure" | "assist" | "orbit";
export type DrawMode = "dot" | "triangle" | "trail";
export type MouseMode = "attract" | "repel";

export type Cfg = {
  // Core flocking
  count: number;
  speed: number;
  maxForce: number;

  // Sensing radii
  alignRadius: number;
  cohesionRadius: number;
  separationRadius: number;

  // Force weights
  alignStrength: number;
  cohesionStrength: number;
  separationStrength: number;

  // Targeting aids (still useful for “orbit” regime demos)
  orbitRadius: number;
  repelRadius: number;

  // Steering behaviour
  exactSpeedForming: boolean; // now just “exact speed discipline” toggle
  pdLockK: number;            // used by orbit/assist modes
  pdLockDamp: number;

  // Per-mode turn limits (radians per frame)
  maxTurnFreeRad: number;
  maxTurnFormRad: number;

  // Regime
  regime: Regime;

  // Visuals
  drawMode: DrawMode;
  boidSize: number;          // px
  trailLength: number;       // frames for trail mode (<= 40 sensible)

  // Mouse interaction
  mouseEnabled: boolean;
  mouseMode: MouseMode;
  mouseStrength: number;     // 0..1 scalar
  mouseFalloff: number;      // px influence radius

  // Pulse (density/speed modulation)
  pulseEnabledDefault: boolean;
};

export const defaultCfg: Cfg = {
  // tuned for a lively, stable flock
  count: 620,
  speed: 3.2,
  maxForce: 0.06,

  separationRadius: 48,
  alignRadius: 96,
  cohesionRadius: 110,

  alignStrength: 0.85,
  cohesionStrength: 0.42,
  separationStrength: 1.15,

  orbitRadius: 18,
  repelRadius: 32,

  exactSpeedForming: true,
  pdLockK: 0.28,
  pdLockDamp: 0.52,

  maxTurnFreeRad: 0.22,  // ~12.6°
  maxTurnFormRad: 0.35,  // ~20.1°

  regime: "pure",

  drawMode: "triangle",
  boidSize: 3.0,
  trailLength: 16,

  mouseEnabled: true,
  mouseMode: "attract",
  mouseStrength: 0.8,
  mouseFalloff: 180,

  pulseEnabledDefault: false,
};

export function useBoidsControls() {
  const [cfg, setCfg] = useState<Cfg>(defaultCfg);
  const [pulse, setPulse] = useState(defaultCfg.pulseEnabledDefault);

  const dispatch = (name: string, detail?: any) =>
    window.dispatchEvent(new CustomEvent(name, { detail }));

  const togglePulse = useCallback(() => {
    setPulse((p) => {
      const next = !p;
      dispatch("boids/pulse", { enabled: next });
      return next;
    });
  }, []);

  // push cfg on change
  useEffect(() => {
    dispatch("boids/cfg", cfg);
  }, [cfg]);

  return {
    cfg, setCfg,
    pulse, togglePulse,
  };
}
