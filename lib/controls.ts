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

  // NEW — density & spacing controls
  autoDensity: boolean;
  densityFactor: number;     // scales boids from sampled points
  letterSpacingPx: number;   // manual extra spacing when autoDensity=false
};

export const defaultCfg: Cfg = {
  count: 740,
  speed: 3.0,
  maxForce: 0.06,
  separationRadius: 48,
  alignRadius: 87,
  cohesionRadius: 106,
  alignStrength: 0.8,
  cohesionStrength: 0.35,
  separationStrength: 1.2,
  orbitRadius: 18,
  repelRadius: 20,

  autoDensity: true,
  densityFactor: 0.55,   // ~55% of sampled points becomes boids
  letterSpacingPx: 0,
};

export function useBoidsControls() {
  const [text, setText] = useState("THIS IS A TEST");
  const [cfg, setCfg] = useState<Cfg>(defaultCfg);
  const formingRef = useRef(false);
  const [forming, setForming] = useState(false);
  const [pulse, setPulse] = useState(false);

  const dispatch = (name: string, detail?: any) =>
    window.dispatchEvent(new CustomEvent(name, { detail }));

  const formText = useCallback(() => {
    formingRef.current = true;
    setForming(true);
    // pass all relevant cfg so the field can compute auto density/spacing
    dispatch("boids/form", { text, cfg });
  }, [text, cfg]);

  const disperse = useCallback(() => {
    formingRef.current = false;
    setForming(false);
    dispatch("boids/disperse");
  }, []);

  // keep sim in sync when sliders move
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
