// lib/controls.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/** Types */
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

/** Helpers */
const deg2rad = (d: number) => (d * Math.PI) / 180;

/** Base (neutral) config — sensible simulation defaults */
export const BASE_CFG: Cfg = {
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

  maxTurnFreeRad: deg2rad(13),
  maxTurnFormRad: deg2rad(20),

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

  rayMode: "off",
  rayNearestK: 3,
  rayOpacity: 0.35,
  rayThickness: 0.75,
  rayLengthScale: 18,

  pulseEnabledDefault: false,
  showHud: false,
};

/** Presets */
export type PresetName =
  | "Gravity Wells"      // your magnetic attractor
  | "Schooling"
  | "Orbit Playground"
  | "Trail Nebula"
  | "Debug Rays";

type PresetMap = Record<PresetName, Partial<Cfg>>;

// NOTE: Only put overrides that differ from BASE_CFG
export const PRESETS: PresetMap = {
  "Gravity Wells": {
    // from your screenshots
    count: 125,
    speed: 3.2,
    separationRadius: 15,
    alignRadius: 96,
    cohesionRadius: 158,

    alignStrength: 0.40,
    cohesionStrength: 1.40,
    separationStrength: 1.15,

    exactSpeedForming: true,
    pdLockK: 0.28,
    pdLockDamp: 0.52,

    maxTurnFreeRad: deg2rad(13),
    maxTurnFormRad: deg2rad(20),

    regime: "pure",

    drawMode: "triangle",
    boidSize: 6.0,

    mouseEnabled: true,
    mouseMode: "attract",
    mouseStrength: 0.80,
    mouseFalloff: 180,

    rayMode: "neighbours",
    rayNearestK: 5,
    rayOpacity: 0.40,
    rayThickness: 0.90,
    rayLengthScale: 7,
  },

  Schooling: {
    count: 900,
    speed: 2.8,
    separationRadius: 24,
    alignRadius: 110,
    cohesionRadius: 140,
    alignStrength: 1.1,
    cohesionStrength: 0.5,
    separationStrength: 0.9,
    drawMode: "triangle",
    boidSize: 4.2,
    rayMode: "off",
  },

  "Orbit Playground": {
    regime: "orbit",
    mouseEnabled: true,
    mouseMode: "attract",
    orbitRadius: 22,
    repelRadius: 40,
    pdLockK: 0.35,
    pdLockDamp: 0.6,
    drawMode: "dot",
    boidSize: 3.0,
    rayMode: "neighbours",
    rayNearestK: 3,
    rayOpacity: 0.28,
    rayThickness: 0.7,
  },

  "Trail Nebula": {
    count: 1200,
    speed: 2.6,
    drawMode: "trail",
    boidSize: 2.8,
    trailLength: 28,
    trailSampleEvery: 3,
    trailOpacity: 0.42,
    rayMode: "off",
  },

  "Debug Rays": {
    rayMode: "both",
    rayNearestK: 4,
    rayOpacity: 0.55,
    rayThickness: 1.0,
    rayLengthScale: 18,
    drawMode: "triangle",
    boidSize: 5.2,
  },
};

/** Build a full Cfg from BASE_CFG + preset override */
export function cfgFromPreset(name: PresetName): Cfg {
  const patch = PRESETS[name] ?? {};
  return { ...BASE_CFG, ...patch };
}

/** Choose the startup preset here (yours) */
const STARTUP_PRESET: PresetName = "Gravity Wells";

/** The exported default config drives initial UI + simulation */
export const defaultCfg: Cfg = cfgFromPreset(STARTUP_PRESET);

/** Hook */
export function useBoidsControls() {
  const [cfg, setCfg] = useState<Cfg>(defaultCfg);
  const [pulse, setPulse] = useState(defaultCfg.pulseEnabledDefault);

  const dispatch = (name: string, detail?: any) =>
    window.dispatchEvent(new CustomEvent(name, { detail }));

  const applyPreset = useCallback((name: PresetName) => {
    const next = cfgFromPreset(name);
    setCfg(next);
    dispatch("boids/cfg", next);
    dispatch("boids/preset", { name });
  }, []);

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

  // for the panel to render the list only once
  const presetNames = useMemo<PresetName[]>(
    () => ["Gravity Wells", "Schooling", "Orbit Playground", "Trail Nebula", "Debug Rays"],
    []
  );

  return { cfg, setCfg, pulse, togglePulse, applyPreset, presetNames };
}
