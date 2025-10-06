// components/ControlsPanel.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  Cfg, Regime, DrawMode, MouseMode, RayMode,
  defaultCfg, useBoidsControls, type PresetName
} from "@/lib/controls";

type Props = { floating?: boolean; style?: React.CSSProperties };
type Tab = "Flocking" | "Steering" | "Rendering" | "Mouse" | "Rays" | "About";

export default function ControlsPanel({ floating = true, style }: Props) {
  const { cfg, setCfg, pulse, togglePulse, applyPreset, presetNames } = useBoidsControls();
  const [tab, setTab] = useState<Tab>("Flocking");
  const [collapsed, setCollapsed] = useState(false);
  const outerStyle = floating ? floatingWrapStyle : embeddedWrapStyle;

  const rad2deg = (r: number) => (r * 180) / Math.PI;
  const deg2rad = (d: number) => (d * Math.PI) / 180;

  const tabs: Tab[] = useMemo(
    () => ["Flocking", "Steering", "Rendering", "Mouse", "Rays", "About"],
    []
  );

  return (
    <div style={{ ...outerStyle, ...style, width: collapsed ? 64 : "min(520px, 92vw)" }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: collapsed ? "1fr" : "auto auto auto 1fr auto", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => setCollapsed(!collapsed)} style={iconButton} title="Collapse / Expand">
          {collapsed ? "⤢" : "⤡"}
        </button>

        {!collapsed && (
          <>
            <button onClick={togglePulse} style={buttonStyle}>
              {pulse ? "Stop Pulse" : "Start Pulse"}
            </button>
            <button onClick={() => setCfg(defaultCfg)} style={{ ...buttonStyle, opacity: 0.85 }}>
              Reset
            </button>

            {/* Spacer */}
            <div />

            {/* Regime */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 12, opacity: 0.85 }}>Regime</label>
              <select
                value={cfg.regime}
                onChange={(e) => setCfg({ ...cfg, regime: e.target.value as Regime })}
                style={selectStyle}
              >
                <option value="pure">Pure</option>
                <option value="assist">Assist</option>
                <option value="orbit">Orbit</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Presets row */}
      {!collapsed && (
        <div style={{ ...fieldsetStyle, display: "grid", gridTemplateColumns: "100px 1fr", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ opacity: 0.9 }}>Preset</div>
          <select
            onChange={(e) => applyPreset(e.target.value as PresetName)}
            style={{ ...selectStyle, width: "100%" }}
            defaultValue={"Gravity Wells"}
            title="Load a named preset"
          >
            {presetNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      {!collapsed && (
        <div style={tabbarStyle}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...tabButton,
                ...(tab === t ? activeTabButton : {}),
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      {!collapsed && (
        <div style={{ maxHeight: "60vh", overflow: "auto", paddingTop: 8 }}>
          {tab === "Flocking" && (
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
                <input type="range" min={30} max={220} step={1}
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
          )}

          {tab === "Steering" && (
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
                <input type="range" min={0.05} max={1.2} step={0.01}
                  value={cfg.pdLockK}
                  onChange={(e) => setCfg({ ...cfg, pdLockK: Number(e.target.value) })} />
              </Row>
              <Row label={`PD Damping (d = ${cfg.pdLockDamp.toFixed(2)})`}>
                <input type="range" min={0.05} max={1.2} step={0.01}
                  value={cfg.pdLockDamp}
                  onChange={(e) => setCfg({ ...cfg, pdLockDamp: Number(e.target.value) })} />
              </Row>
              <Row label={`Max Turn (Free) ${Math.round(rad2deg(cfg.maxTurnFreeRad))}°`}>
                <input type="range" min={5} max={45} step={1}
                  value={Math.round(rad2deg(cfg.maxTurnFreeRad))}
                  onChange={(e) => setCfg({ ...cfg, maxTurnFreeRad: deg2rad(Number(e.target.value)) })} />
              </Row>
              <Row label={`Max Turn (Assist/Orbit) ${Math.round(rad2deg(cfg.maxTurnFormRad))}°`}>
                <input type="range" min={5} max={45} step={1}
                  value={Math.round(rad2deg(cfg.maxTurnFormRad))}
                  onChange={(e) => setCfg({ ...cfg, maxTurnFormRad: deg2rad(Number(e.target.value)) })} />
              </Row>
            </fieldset>
          )}

          {tab === "Rendering" && (
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
                <>
                  <Row label={`Trail Length (${cfg.trailLength})`}>
                    <input type="range" min={4} max={40} step={1}
                      value={cfg.trailLength}
                      onChange={(e) => setCfg({ ...cfg, trailLength: Number(e.target.value) })} />
                  </Row>
                  <Row label={`Trail Sample Every (${cfg.trailSampleEvery} f)`}>
                    <input type="range" min={1} max={6} step={1}
                      value={cfg.trailSampleEvery}
                      onChange={(e) => setCfg({ ...cfg, trailSampleEvery: Number(e.target.value) })} />
                  </Row>
                  <Row label={`Trail Opacity (${cfg.trailOpacity.toFixed(2)})`}>
                    <input type="range" min={0.1} max={1} step={0.05}
                      value={cfg.trailOpacity}
                      onChange={(e) => setCfg({ ...cfg, trailOpacity: Number(e.target.value) })} />
                  </Row>
                </>
              )}
            </fieldset>
          )}

          {tab === "Mouse" && (
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
          )}

          {tab === "Rays" && (
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Raycasting</legend>
              <Row label="Mode">
                <select
                  value={cfg.rayMode}
                  onChange={(e) => setCfg({ ...cfg, rayMode: e.target.value as RayMode })}
                  style={selectStyle}
                >
                  <option value="off">Off</option>
                  <option value="neighbours">Neighbours</option>
                  <option value="forces">Forces</option>
                  <option value="both">Both</option>
                </select>
              </Row>
              <Row label={`Nearest K (${cfg.rayNearestK})`}>
                <input type="range" min={1} max={6} step={1}
                  value={cfg.rayNearestK}
                  onChange={(e) => setCfg({ ...cfg, rayNearestK: Number(e.target.value) })} />
              </Row>
              <Row label={`Ray Opacity (${cfg.rayOpacity.toFixed(2)})`}>
                <input type="range" min={0.1} max={1} step={0.05}
                  value={cfg.rayOpacity}
                  onChange={(e) => setCfg({ ...cfg, rayOpacity: Number(e.target.value) })} />
              </Row>
              <Row label={`Ray Thickness (${cfg.rayThickness.toFixed(2)} px)`}>
                <input type="range" min={0.25} max={3} step={0.05}
                  value={cfg.rayThickness}
                  onChange={(e) => setCfg({ ...cfg, rayThickness: Number(e.target.value) })} />
              </Row>
              <Row label={`Force Length Scale (${cfg.rayLengthScale}px)`}>
                <input type="range" min={6} max={40} step={1}
                  value={cfg.rayLengthScale}
                  onChange={(e) => setCfg({ ...cfg, rayLengthScale: Number(e.target.value) })} />
              </Row>
              <p style={{ opacity: 0.7, fontSize: 12, marginTop: 8 }}>
                Tip: press <b>R</b> to toggle Rays globally.
              </p>
            </fieldset>
          )}

          {tab === "About" && (
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Shortcuts</legend>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6, opacity: 0.85 }}>
                <li><b>F</b>: toggle mouse field</li>
                <li><b>R</b>: toggle rays on/off</li>
                <li><b>H</b>: toggle HUD</li>
                <li><b>M</b>: collapse/expand controls</li>
                <li>Click on canvas: burst impulse</li>
              </ul>
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}

/* components */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gridTemplateColumns: "180px 1fr", alignItems: "center", gap: 10, margin: "6px 0" }}>
      <span style={{ opacity: 0.85 }}>{label}</span>
      {children}
    </label>
  );
}

/* styles */

const floatingWrapStyle: React.CSSProperties = {
  position: "fixed", right: 12, bottom: 12, zIndex: 10,
  width: "min(520px, 92vw)", padding: 10, borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(20,24,32,0.6)", backdropFilter: "blur(8px)",
  color: "#cbd5e1", fontSize: 13,
};
const embeddedWrapStyle = { ...floatingWrapStyle, position: "static" as const };
const buttonStyle: React.CSSProperties = { appearance: "none", border: "1px solid rgba(255,255,255,0.06)", background: "#11151c", color: "#cbd5e1", padding: "8px 10px", borderRadius: 10, cursor: "pointer" };
const iconButton: React.CSSProperties = { ...buttonStyle, width: 36, padding: "6px 0", textAlign: "center" };
const fieldsetStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 10, marginBottom: 12 };
const legendStyle: React.CSSProperties = { padding: "0 6px", opacity: 0.9 };
const selectStyle: React.CSSProperties = { background: "#11151c", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "6px 8px" };

const tabbarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: 6,
};
const tabButton: React.CSSProperties = {
  ...buttonStyle,
  padding: "6px 6px",
  fontSize: 12,
  opacity: 0.75,
  borderRadius: 8,
};
const activeTabButton: React.CSSProperties = {
  opacity: 1,
  background: "#171b23",
  borderColor: "rgba(255,255,255,0.12)",
};
