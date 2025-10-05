"use client";
import { useCallback, useEffect, useRef, useState } from "react";

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

const defaultCfg: Cfg = {
  count: 688,
  speed: 3.0,
  maxForce: 0.06,
  alignRadius: 87,
  cohesionRadius: 106,
  separationRadius: 48,
  alignStrength: 0.8,
  cohesionStrength: 0.35,
  separationStrength: 1.2
};

export function useBoidsControls() {
  const [text, setText] = useState("THIS IS A TEST");
  const [cfg, setCfg] = useState<Cfg>(defaultCfg);
  const formingRef = useRef(false);
  const [forming, setForming] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Custom DOM events (so the canvas component stays decoupled)
  const dispatch = (name: string, detail?: any) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  const formText = useCallback(() => {
    formingRef.current = true;
    setForming(true);
    dispatch("boids/form", { text });
  }, [text]);

  const disperse = useCallback(() => {
    formingRef.current = false;
    setForming(false);
    dispatch("boids/disperse");
  }, []);

  // Sync cfg & count to canvas
  useEffect(() => {
    dispatch("boids/cfg", cfg);
  }, [cfg]);

  // Density pulse (handled in canvas with Anime.js or rAF)
  const togglePulse = useCallback(() => {
    setPulse((p) => {
      const next = !p;
      dispatch("boids/pulse", { enabled: next });
      return next;
    });
  }, []);

  return { text, setText, forming, formText, disperse, cfg, setCfg, pulse, togglePulse };
}
