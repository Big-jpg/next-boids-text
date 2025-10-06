// lib/controls.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Cfg = {
  count: number;
  speed: number;
  maxForce: number;
  alignRadius: number;
  cohesionRadius: number;
  separationRadius: number;
  alignStrength: number;
  cohesionStrength: number;
  separationStrength: number;
  orbitRadius: number;
  repelRadius: number;

  // Steering behaviour
  exactSpeedForming: boolean;
  pdLockK: number;     // spring constant
  pdLockDamp: number;  // damping constant

  // Density & spacing
  autoDensity: boolean;
  densityFactor: number;
  letterSpacingPx: number;

  // NEW — per-mode turn limits (radians per frame)
  maxTurnFreeRad: number;
  maxTurnFormRad: number;
};

export const defaultCfg: Cfg = {
  count: 688,
  speed: 3.0,
  maxForce: 0.06,
  separationRadius: 48,
  alignRadius: 87,
  cohesionRadius: 106,
  alignStrength: 0.8,
  cohesionStrength: 0.35,
  separationStrength: 1.2,
  orbitRadius: 12,
  repelRadius: 28,
  exactSpeedForming: true,
  pdLockK: 0.28,
  pdLockDamp: 0.48,


  autoDensity: true,
  densityFactor: 0.82,
  letterSpacingPx: 0,

  // defaults match what we tested by hand
  maxTurnFreeRad: 0.22,   // ≈ 12.6°
  maxTurnFormRad: 0.35,   // ≈ 20.1°
};

export function useBoidsControls() {
  const [text, setText] = useState("B O I D S");
  const [cfg, setCfg] = useState<Cfg>(defaultCfg);
  const formingRef = useRef(false);
  const [forming, setForming] = useState(false);
  const [pulse, setPulse] = useState(false);

  const dispatch = (name: string, detail?: any) =>
    window.dispatchEvent(new CustomEvent(name, { detail }));

  const formText = useCallback(() => {
    formingRef.current = true;
    setForming(true);
    dispatch("boids/form", { text, cfg }); // pass full cfg so canvas sees turn caps
  }, [text, cfg]);

  const disperse = useCallback(() => {
    formingRef.current = false;
    setForming(false);
    dispatch("boids/disperse");
  }, []);

  useEffect(() => {
    dispatch("boids/cfg", cfg);
  }, [cfg]);

  const togglePulse = useCallback(() => {
    setPulse((p) => {
      const next = !p;
      dispatch("boids/pulse", { enabled: next });
      return next;
    });
  }, []);

  return {
    text, setText,
    cfg, setCfg,
    forming, formText, disperse,
    pulse, togglePulse,
  };
}
