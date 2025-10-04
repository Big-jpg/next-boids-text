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
  count: 180,
  speed: 2.2,
  maxForce: 0.06,
  alignRadius: 70,
  cohesionRadius: 70,
  separationRadius: 24,
  alignStrength: 0.8,
  cohesionStrength: 0.35,
  separationStrength: 1.2
};

export function useBoidsControls() {
  const [text, setText] = useState("HELLO, ROSS");
  const [cfg, setCfg] = useState<Cfg>(defaultCfg);
  const formingRef = useRef(false);
  const [forming, setForming] = useState(false);
  const [pulse, setPulse] = useState(false);

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

  return { text, setText, forming, formText, disperse, cfg, setCfg, pulse, togglePulse };
}
