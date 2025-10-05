"use client";

import React from "react";
import { useBoidsControls } from "@/lib/controls";

type Props = {
  /** When true (default), panel uses fixed/floating chrome.
      When false, caller provides outer positioning/animation. */
  floating?: boolean;
  style?: React.CSSProperties;
};

export default function ControlsPanel({ floating = true, style }: Props) {
  const {
    text, setText,
    cfg, setCfg,
    forming, formText, disperse,
    pulse, togglePulse
  } = useBoidsControls();

  const outerStyle = floating ? floatingWrapStyle : embeddedWrapStyle;

  return (
    <div style={{ ...outerStyle, ...style }}>
      <label style={{ display: "block", marginBottom: 8 }}>
        <div style={smallLabel}>Target Text</div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something…"
          style={textInput}
        />
      </label>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={formText} disabled={forming} style={buttonStyle}>Form Text</button>
        <button onClick={disperse} disabled={!forming} style={buttonStyle}>Disperse</button>
        <button onClick={togglePulse} style={buttonStyle}>
          {pulse ? "Stop Density Pulse" : "Start Density Pulse"}
        </button>
      </div>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Flocking</legend>

        <Row label={`Count (${cfg.count})`}>
          <input type="range" min={60} max={1200} step={1}
                 value={cfg.count}
                 onChange={(e) => setCfg({ ...cfg, count: Number(e.target.value) })}/>
        </Row>

        <Row label={`Speed (${cfg.speed.toFixed(2)})`}>
          <input type="range" min={1} max={5} step={0.1}
                 value={cfg.speed}
                 onChange={(e) => setCfg({ ...cfg, speed: Number(e.target.value) })}/>
        </Row>

        <Row label={`Sep (${cfg.separationRadius})`}>
          <input type="range" min={10} max={60} step={1}
                 value={cfg.separationRadius}
                 onChange={(e) => setCfg({ ...cfg, separationRadius: Number(e.target.value) })}/>
        </Row>

        <Row label={`Align (${cfg.alignRadius})`}>
          <input type="range" min={30} max={140} step={1}
                 value={cfg.alignRadius}
                 onChange={(e) => setCfg({ ...cfg, alignRadius: Number(e.target.value) })}/>
        </Row>

        <Row label={`Coh (${cfg.cohesionRadius})`}>
          <input type="range" min={30} max={140} step={1}
                 value={cfg.cohesionRadius}
                 onChange={(e) => setCfg({ ...cfg, cohesionRadius: Number(e.target.value) })}/>
        </Row>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Orbit Targeting</legend>

        <Row label={`Orbit Radius (${cfg.orbitRadius})`}>
          <input type="range" min={12} max={120} step={1}
                 value={cfg.orbitRadius}
                 onChange={(e) => setCfg({ ...cfg, orbitRadius: Number(e.target.value) })}/>
        </Row>

        <Row label={`Repel Radius (${cfg.repelRadius})`}>
          <input type="range" min={4} max={60} step={1}
                 value={cfg.repelRadius}
                 onChange={(e) => setCfg({ ...cfg, repelRadius: Number(e.target.value) })}/>
        </Row>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Density & Spacing</legend>

        <Row label={`Auto Density`}>
          <input
            type="checkbox"
            checked={cfg.autoDensity}
            onChange={(e) => setCfg({ ...cfg, autoDensity: e.target.checked })}
          />
        </Row>

        <Row label={`Density Factor (${cfg.densityFactor.toFixed(2)})`}>
          <input type="range" min={0.30} max={0.90} step={0.01}
                 value={cfg.densityFactor}
                 onChange={(e) => setCfg({ ...cfg, densityFactor: Number(e.target.value) })}/>
        </Row>
      </fieldset>
    </div>
  );
}

/* --- styles & helpers --- */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gridTemplateColumns: "180px 1fr", alignItems: "center", gap: 10, margin: "6px 0" }}>
      <span style={{ opacity: 0.85 }}>{label}</span>
      {children}
    </label>
  );
}

const floatingWrapStyle: React.CSSProperties = {
  position: "fixed",
  right: 12,
  bottom: 12,
  zIndex: 10,
  width: "min(480px, 92vw)",
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(20,24,32,0.6)",
  backdropFilter: "blur(8px)",
  color: "#cbd5e1",
  fontSize: 13,
};

const embeddedWrapStyle: React.CSSProperties = {
  width: "min(480px, 92vw)",
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(20,24,32,0.6)",
  backdropFilter: "blur(8px)",
  color: "#cbd5e1",
  fontSize: 13,
};

const smallLabel: React.CSSProperties = { fontSize: 12, opacity: 0.8, marginBottom: 6 };

const textInput: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "#0f1319",
  color: "#cbd5e1",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  appearance: "none",
  border: "1px solid rgba(255,255,255,0.06)",
  background: "#11151c",
  color: "#cbd5e1",
  padding: "8px 10px",
  borderRadius: 10,
  cursor: "pointer",
};

const fieldsetStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 12,
  padding: 10,
  marginBottom: 12,
};

const legendStyle: React.CSSProperties = { padding: "0 6px", opacity: 0.9 };
