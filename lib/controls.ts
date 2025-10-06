// lib/controls.ts
"use client";

import { useCallback, useEffect, useState } from "react";

export type Regime = "pure" | "assist" | "orbit";
export type DrawMode = "dot" | "triangle" | "trail";
export type MouseMode = "attract" | "repel";
export type RayMode = "off" | "neighbours" | "forces" | "both";

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

  // Targeting/assist
  orbitRadius: number;
  repelRadius: number;
  exactSpeedForming: boolean;
  pdLockK: number;
  pdLockDamp: number;

  // Turn limits
  maxTurnFreeRad: number;
  maxTurnFormRad: number;

  // Regime
  regime: Regime;

  // Rendering
  drawMode: DrawMode;
  boidSize: number;
  trailLength: number;
  trailSampleEvery: number; // frames between trail updates
  trailOpacity: number;     // 0..1 stroke alpha

  // Mouse interaction
  mouseEnabled: boolean;
  mouseMode: MouseMode;
  mouseStrength: number;    // 0..1
  mouseFalloff: number;     // px

  // Raycasting viz
  rayMode: RayMode;
  rayNearestK: number;      // K nearest neighbours to draw
  rayOpacity: number;       // 0..1
  rayThickness: number;     // px
  rayLengthScale: number;   // scale for force arrows

  // Pulse
  pulseEnabledDefault: boolean;

  // HUD
  showHud: boolean;
};

export const defaultCfg: Cfg = {
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

  maxTurnFreeRad: 0.22,   // ~12.6°
  maxTurnFormRad: 0.35,   // ~20.1°

  regime: "pure",

  drawMode: "trail",
  boidSize: 3.0,
  trailLength: 16,
  trailSampleEvery: 2,
  trailOpacity: 0.55,

  mouseEnabled: true,
  mouseMode: "attract",
  mouseStrength: 0.8,
  mouseFalloff: 180,

  // Rays OFF by default → no “grid lines”
  rayMode: "off",
  rayNearestK: 3,
  rayOpacity: 0.35,
  rayThickness: 0.75,
  rayLengthScale: 18,

  pulseEnabledDefault: false,

  // HUD is opt-in (toggle with H)
  showHud: false,
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

  useEffect(() => {
    dispatch("boids/cfg", cfg);
  }, [cfg]);

  return { cfg, setCfg, pulse, togglePulse };
}
