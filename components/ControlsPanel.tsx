// components/ControlsPanel.tsx
"use client";

import React from "react";
import { Cfg, Regime, DrawMode, MouseMode, defaultCfg, useBoidsControls } from "@/lib/controls";

type Props = { floating?: boolean; style?: React.CSSProperties };

export default function ControlsPanel({ floating = true, style }: Props) {
  const { cfg, setCfg, pulse, togglePulse } = useBoidsControls();
  const outerStyle = floating ? floatingWrapStyle : embeddedWrapStyle;

  const rad2deg = (r: number) => (r * 180) / Math.PI;
  const deg2rad = (d: number) => (d * Math.PI) / 180;

  return (
    <div style={{ ...outerStyle, ...style }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={togglePulse} style={buttonStyle}>
          {pulse ? "Stop Density Pulse" : "Start Density Pulse"}
        </button>
        <button
          onClick={() => setCfg(defaultCfg)}
          style={{ ...buttonStyle, opacity: 0.85 }}
          title="Reset to defaults"
        >
          Reset
        </button>
      </div>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Regime</legend>
        <Row label="Mode">
          <select
            value={cfg.regime}
            onChange={(e) => setCfg({ ...cfg, regime: e.target.value as Regime })}
            style={selectStyle}
          >
            <option value="pure">Pure Boids</option>
            <option value="assist">Assist (tighter turn/PD)</option>
            <option value="orbit">Orbit &amp; Arrive</option>
          </select>
        </Row>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Flocking</legend>

        <Row label={`Count (${cfg.count})`}>
          <input type="range" min={60} max={1500} step={1}
            value={cfg.count}
            onChange={(e) => setCfg({ ...cfg, count: Number(e.target.value) })} />
        </Row>

        <Row label={`Speed (${cfg.speed.toFixed(2)})`}>
          <input type="range" min={1} max={6} step={0.1}
            value={cfg.speed}
            onChange={(e) => setCfg({ ...cfg, speed: Number(e.target.value) })} />
        </Row>

        <Row label={`Sep (${cfg.separationRadius})`}>
          <input type="range" min={10} max={80} step={1}
            value={cfg.separationRadius}
            onChange={(e) => setCfg({ ...cfg, separationRadius: Number(e.target.value) })} />
        </Row>

        <Row label={`Align (${cfg.alignRadius})`}>
          <input type="range" min={30} max={180} step={1}
            value={cfg.alignRadius}
            onChange={(e) => setCfg({ ...cfg, alignRadius: Number(e.target.value) })} />
        </Row>

        <Row label={`Coh (${cfg.cohesionRadius})`}>
          <input type="range" min={30} max={200} step={1}
            value={cfg.cohesionRadius}
            onChange={(e) => setCfg({ ...cfg, cohesionRadius: Number(e.target.value) })} />
        </Row>

        <Row label={`Align Wgt (${cfg.alignStrength.toFixed(2)})`}>
          <input type="range" min={0.1} max={2.0} step={0.05}
            value={cfg.alignStrength}
            onChange={(e) => setCfg({ ...cfg, alignStrength: Number(e.target.value) })} />
        </Row>

        <Row label={`Coh Wgt (${cfg.cohesionStrength.toFixed(2)})`}>
          <input type="range" min={0.1} max={2.0} step={0.05}
            value={cfg.cohesionStrength}
            onChange={(e) => setCfg({ ...cfg, cohesionStrength: Number(e.target.value) })} />
        </Row>

        <Row label={`Sep Wgt (${cfg.separationStrength.toFixed(2)})`}>
          <input type="range" min={0.1} max={2.2} step={0.05}
            value={cfg.separationStrength}
            onChange={(e) => setCfg({ ...cfg, separationStrength: Number(e.target.value) })} />
        </Row>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Steering</legend>

        <Row label={`Exact Speed Discipline`}>
          <input
            type="checkbox"
            checked={cfg.exactSpeedForming}
            onChange={(e) => setCfg({ ...cfg, exactSpeedForming: e.target.checked })}
          />
        </Row>

        <Row label={`PD Spring (k = ${cfg.pdLockK.toFixed(2)})`}>
          <input
            type="range"
            min={0.05} max={1.2} step={0.01}
            value={cfg.pdLockK}
            onChange={(e) => setCfg({ ...cfg, pdLockK: Number(e.target.value) })}
          />
        </Row>

        <Row label={`PD Damping (d = ${cfg.pdLockDamp.toFixed(2)})`}>
          <input
            type="range"
            min={0.05} max={1.2} step={0.01}
            value={cfg.pdLockDamp}
            onChange={(e) => setCfg({ ...cfg, pdLockDamp: Number(e.target.value) })}
          />
        </Row>

        <Row label={`Max Turn (Free) ${Math.round(rad2deg(cfg.maxTurnFreeRad))}°`}>
          <input
            type="range" min={5} max={45} step={1}
            value={Math.round(rad2deg(cfg.maxTurnFreeRad))}
            onChange={(e) => setCfg({ ...cfg, maxTurnFreeRad: deg2rad(Number(e.target.value)) })}
          />
        </Row>

        <Row label={`Max Turn (Assist/Orbit) ${Math.round(rad2deg(cfg.maxTurnFormRad))}°`}>
          <input
            type="range" min={5} max={45} step={1}
            value={Math.round(rad2deg(cfg.maxTurnFormRad))}
            onChange={(e) => setCfg({ ...cfg, maxTurnFormRad: deg2rad(Number(e.target.value)) })}
          />
        </Row>
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Rendering</legend>

        <Row label="Draw Mode">
          <select
            value={cfg.drawMode}
            onChange={(e) => setCfg({ ...cfg, drawMode: e.target.value as DrawMode })}
            style={selectStyle}
          >
            <option value="dot">Dot</option>
            <option value="triangle">Triangle</option>
            <option value="trail">Trail</option>
          </select>
        </Row>

        <Row label={`Boid Size (${cfg.boidSize.toFixed(1)} px)`}>
          <input type="range" min={1} max={8} step={0.1}
            value={cfg.boidSize}
            onChange={(e) => setCfg({ ...cfg, boidSize: Number(e.target.value) })} />
        </Row>

        {cfg.drawMode === "trail" && (
          <Row label={`Trail Length (${cfg.trailLength})`}>
            <input type="range" min={4} max={40} step={1}
              value={cfg.trailLength}
              onChange={(e) => setCfg({ ...cfg, trailLength: Number(e.target.value) })} />
          </Row>
        )}
      </fieldset>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>Mouse Field</legend>

        <Row label="Enabled">
          <input
            type="checkbox"
            checked={cfg.mouseEnabled}
            onChange={(e) => setCfg({ ...cfg, mouseEnabled: e.target.checked })}
          />
        </Row>

        <Row label="Mode">
          <select
            value={cfg.mouseMode}
            onChange={(e) => setCfg({ ...cfg, mouseMode: e.target.value as MouseMode })}
            style={selectStyle}
          >
            <option value="attract">Attract</option>
            <option value="repel">Repel</option>
          </select>
        </Row>

        <Row label={`Strength (${cfg.mouseStrength.toFixed(2)})`}>
          <input type="range" min={0} max={1} step={0.01}
            value={cfg.mouseStrength}
            onChange={(e) => setCfg({ ...cfg, mouseStrength: Number(e.target.value) })} />
        </Row>

        <Row label={`Falloff Radius (${cfg.mouseFalloff}px)`}>
          <input type="range" min={60} max={420} step={5}
            value={cfg.mouseFalloff}
            onChange={(e) => setCfg({ ...cfg, mouseFalloff: Number(e.target.value) })} />
        </Row>
      </fieldset>
    </div>
  );
}

/* styles & helpers */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gridTemplateColumns: "180px 1fr", alignItems: "center", gap: 10, margin: "6px 0" }}>
      <span style={{ opacity: 0.85 }}>{label}</span>
      {children}
    </label>
  );
}

const floatingWrapStyle: React.CSSProperties = {
  position: "fixed", right: 12, bottom: 12, zIndex: 10,
  width: "min(480px, 92vw)", padding: 12, borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(20,24,32,0.6)", backdropFilter: "blur(8px)",
  color: "#cbd5e1", fontSize: 13,
};
const embeddedWrapStyle = { ...floatingWrapStyle, position: "static" as const };
const buttonStyle: React.CSSProperties = { appearance: "none", border: "1px solid rgba(255,255,255,0.06)", background: "#11151c", color: "#cbd5e1", padding: "8px 10px", borderRadius: 10, cursor: "pointer" };
const fieldsetStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 10, marginBottom: 12 };
const legendStyle: React.CSSProperties = { padding: "0 6px", opacity: 0.9 };
const selectStyle: React.CSSProperties = { background: "#11151c", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "6px 8px" };
