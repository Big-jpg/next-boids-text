// components/ControlsPanel.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
  Cfg, Regime, DrawMode, MouseMode, RayMode,
  defaultCfg, useBoidsControls, type PresetName
} from "@/lib/controls";

type Props = { floating?: boolean; style?: React.CSSProperties };
type Tab = "Flocking" | "Steering" | "Rendering" | "Mouse" | "Rays" | "Predator" | "About";

// Small rect type to compose sprite frame sets from a grid
type Rect = { x: number; y: number; w: number; h: number };

// Helper: build frames from a grid on the atlas (game-dev style)
function buildGridFrames(opts: {
  startX: number; startY: number; frameW: number; frameH: number;
  cols: number; rows: number; strideX?: number; strideY?: number;
}): Rect[] {
  const { startX, startY, frameW, frameH, cols, rows, strideX = frameW, strideY = frameH } = opts;
  const out: Rect[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ x: startX + c * strideX, y: startY + r * strideY, w: frameW, h: frameH });
    }
  }
  return out;
}

export default function ControlsPanel({ floating = true, style }: Props) {
  const { cfg, setCfg, pulse, togglePulse, applyPreset, presetNames } = useBoidsControls();
  const [tab, setTab] = useState<Tab>("Flocking");
  const [collapsed, setCollapsed] = useState(false);
  const outerStyle = floating ? floatingWrapStyle : embeddedWrapStyle;

  const rad2deg = (r: number) => (r * 180) / Math.PI;
  const deg2rad = (d: number) => (d * Math.PI) / 180;

  const tabs: Tab[] = useMemo(
    () => ["Flocking", "Steering", "Rendering", "Mouse", "Rays", "Predator", "About"],
    []
  );

  return (
    <div style={{ ...outerStyle, ...style, width: collapsed ? 64 : "min(560px, 92vw)" }}>
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

            <div />

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

      {/* Presets */}
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
              style={{ ...tabButton, ...(tab === t ? activeTabButton : {}) }}
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
                  <option value="sprite">Sprite (Atlas)</option>
                </select>
              </Row>

              {/* Vector sizes */}
              {cfg.drawMode !== "sprite" && (
                <Row label={`Boid Size (${cfg.boidSize.toFixed(1)} px)`}>
                  <input type="range" min={1} max={8} step={0.1}
                    value={cfg.boidSize}
                    onChange={(e) => setCfg({ ...cfg, boidSize: Number(e.target.value) })} />
                </Row>
              )}

              {/* Sprite settings */}
              {cfg.drawMode === "sprite" && (
                <>
                  <Row label="Atlas URL">
                    <input
                      style={{ ...selectStyle, width: "100%" }}
                      type="text"
                      value={cfg.spriteAtlasUrl}
                      onChange={(e) => setCfg({ ...cfg, spriteAtlasUrl: e.target.value })}
                      placeholder="https://…/fish_shark_atlas.png"
                    />
                  </Row>

                  <Row label={`Sprite Scale (${cfg.spriteScale.toFixed(2)}×)`}>
                    <input type="range" min={0.4} max={3} step={0.05}
                      value={cfg.spriteScale}
                      onChange={(e) => setCfg({ ...cfg, spriteScale: Number(e.target.value) })} />
                  </Row>

                  <Row label={`Anim FPS (${cfg.spriteAnimFps} fps)`}>
                    <input type="range" min={0} max={24} step={1}
                      value={cfg.spriteAnimFps}
                      onChange={(e) => setCfg({ ...cfg, spriteAnimFps: Number(e.target.value) })} />
                  </Row>

                  {/* Quick grid composer for demo/dev atlases */}
                  <div style={{ marginTop: 6, padding: 10, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <div style={{ marginBottom: 8, opacity: 0.9, fontSize: 12 }}>Grid Composer (build frames from an atlas grid)</div>
                    <GridComposer
                      onApply={(fish, shark) => setCfg({ ...cfg, spriteFish: fish, spriteShark: shark })}
                    />
                  </div>
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
                <input type="range" min={0} max={2} step={0.05}
                  value={cfg.mouseStrength}
                  onChange={(e) => setCfg({ ...cfg, mouseStrength: Number(e.target.value) })} />
              </Row>
              <Row label={`Falloff Radius (${cfg.mouseFalloff}px)`}>
                <input type="range" min={40} max={360} step={5}
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
                <input type="range" min={1} max={12} step={1}
                  value={cfg.rayNearestK}
                  onChange={(e) => setCfg({ ...cfg, rayNearestK: Number(e.target.value) })} />
              </Row>
              <Row label={`Ray Opacity (${cfg.rayOpacity.toFixed(2)})`}>
                <input type="range" min={0} max={1} step={0.05}
                  value={cfg.rayOpacity}
                  onChange={(e) => setCfg({ ...cfg, rayOpacity: Number(e.target.value) })} />
              </Row>
              <Row label={`Ray Thickness (${cfg.rayThickness.toFixed(2)} px)`}>
                <input type="range" min={0.5} max={4} step={0.1}
                  value={cfg.rayThickness}
                  onChange={(e) => setCfg({ ...cfg, rayThickness: Number(e.target.value) })} />
              </Row>
              <Row label={`Force Length Scale (${cfg.rayLengthScale}px)`}>
                <input type="range" min={4} max={120} step={1}
                  value={cfg.rayLengthScale}
                  onChange={(e) => setCfg({ ...cfg, rayLengthScale: Number(e.target.value) })} />
              </Row>
            </fieldset>
          )}

          {tab === "Predator" && (
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Predator</legend>
              <Row label="Enable Predator">
                <input
                  type="checkbox"
                  checked={cfg.enablePredator}
                  onChange={(e) => setCfg({ ...cfg, enablePredator: e.target.checked })}
                />
              </Row>

              <Row label="Pick Predator">
                <button
                  style={{ ...buttonStyle, width: "100%" }}
                  onClick={() => setCfg({ ...cfg, predatorPickMode: true })}
                  title="Shift-click or use this to select a predator by clicking on the canvas"
                >
                  Click on a boid…
                </button>
              </Row>

              <Row label="Pick Random">
                <button
                  style={{ ...buttonStyle, width: "100%" }}
                  onClick={() => window.dispatchEvent(new CustomEvent("boids/predator/random"))}
                  title="Randomly select a predator"
                >
                  Random Predator
                </button>
              </Row>

              <Row label={`Range (${cfg.predatorRange} px)`}>
                <input type="range" min={20} max={220} step={1}
                  value={cfg.predatorRange}
                  onChange={(e) => setCfg({ ...cfg, predatorRange: Number(e.target.value) })} />
              </Row>
              <Row label={`Predator Chase (${cfg.predatorChase.toFixed(2)})`}>
                <input type="range" min={0} max={4} step={0.05}
                  value={cfg.predatorChase}
                  onChange={(e) => setCfg({ ...cfg, predatorChase: Number(e.target.value) })} />
              </Row>
              <Row label={`Prey Flee (${cfg.preyFlee.toFixed(2)})`}>
                <input type="range" min={0} max={4} step={0.05}
                  value={cfg.preyFlee}
                  onChange={(e) => setCfg({ ...cfg, preyFlee: Number(e.target.value) })} />
              </Row>
              <Row label={`Speed Multiplier (${cfg.predatorSpeedMul.toFixed(2)}×)`}>
                <input type="range" min={0.6} max={3.0} step={0.05}
                  value={cfg.predatorSpeedMul}
                  onChange={(e) => setCfg({ ...cfg, predatorSpeedMul: Number(e.target.value) })} />
              </Row>
              <Row label={`Size Scale (${cfg.predatorSizeScale.toFixed(2)}×)`}>
                <input type="range" min={1} max={3} step={0.05}
                  value={cfg.predatorSizeScale}
                  onChange={(e) => setCfg({ ...cfg, predatorSizeScale: Number(e.target.value) })} />
              </Row>

              <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>Elimination</div>
              <Row label={`Kill Distance (${cfg.killDistance}px)`}>
                <input type="range" min={4} max={40} step={1}
                  value={cfg.killDistance}
                  onChange={(e) => setCfg({ ...cfg, killDistance: Number(e.target.value) })} />
              </Row>
              <Row label={`Fade Seconds (${cfg.fadeSeconds.toFixed(2)}s)`}>
                <input type="range" min={0.1} max={3} step={0.05}
                  value={cfg.fadeSeconds}
                  onChange={(e) => setCfg({ ...cfg, fadeSeconds: Number(e.target.value) })} />
              </Row>
              <Row label={`Kill Cooldown (${cfg.killCooldown.toFixed(2)}s)`}>
                <input type="range" min={0.05} max={3} step={0.05}
                  value={cfg.killCooldown}
                  onChange={(e) => setCfg({ ...cfg, killCooldown: Number(e.target.value) })} />
              </Row>
              <Row label="Respawn After Fade">
                <input
                  type="checkbox"
                  checked={cfg.respawnAfterFade}
                  onChange={(e) => setCfg({ ...cfg, respawnAfterFade: e.target.checked })}
                />
              </Row>
            </fieldset>
          )}

          {tab === "About" && (
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>About</legend>
              <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9 }}>
                <p><strong>Boids Flocking Bench</strong> — vector &amp; sprite rendering, rays, predator/prey, trails.</p>
                <p>Hotkeys: <code>F</code> mouse, <code>R</code> rays, <code>M</code> panel, <code>H</code> HUD, <code>Shift+Click</code> to set predator.</p>
                <p>Sprite mode uses an <em>atlas</em>: set the image URL and build frames with the Grid Composer above.</p>
              </div>
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}

/* ——————————————————— Grid Composer (inline, minimal) ——————————————————— */
function GridComposer({ onApply }: { onApply: (fish: Rect[], shark: Rect[]) => void }) {
  const [fish, setFish] = useState({ x: 0, y: 0, w: 48, h: 32, cols: 4, rows: 1, sx: 48, sy: 32 });
  const [shark, setShark] = useState({ x: 0, y: 40, w: 72, h: 40, cols: 4, rows: 1, sx: 72, sy: 40 });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <div>
        <div style={{ marginBottom: 6, opacity: 0.9 }}>Fish Grid</div>
        <GridInputs v={fish} onChange={setFish} />
      </div>
      <div>
        <div style={{ marginBottom: 6, opacity: 0.9 }}>Shark Grid</div>
        <GridInputs v={shark} onChange={setShark} />
      </div>
      <div style={{ gridColumn: "1 / span 2", display: "flex", gap: 8, marginTop: 8 }}>
        <button
          style={buttonStyle}
          onClick={() => {
            const fishFrames = buildGridFrames({
              startX: fish.x, startY: fish.y, frameW: fish.w, frameH: fish.h,
              cols: fish.cols, rows: fish.rows, strideX: fish.sx, strideY: fish.sy
            });
            const sharkFrames = buildGridFrames({
              startX: shark.x, startY: shark.y, frameW: shark.w, frameH: shark.h,
              cols: shark.cols, rows: shark.rows, strideX: shark.sx, strideY: shark.sy
            });
            onApply(fishFrames, sharkFrames);
          }}
        >
          Apply Frames
        </button>
        <div style={{ alignSelf: "center", fontSize: 12, opacity: 0.8 }}>
          Tip: set columns/rows/strides to match your sprite sheet layout.
        </div>
      </div>
    </div>
  );
}

function GridInputs({ v, onChange }: {
  v: { x: number; y: number; w: number; h: number; cols: number; rows: number; sx: number; sy: number };
  onChange: (n: any) => void;
}) {
  const num = (label: string, key: keyof typeof v, min: number, max: number, step = 1) => (
    <Row label={label}>
      <input
        type="number"
        value={v[key] as number}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange({ ...v, [key]: Number(e.target.value) })}
        style={{ ...selectStyle, width: 90, padding: "6px 8px" }}
      />
    </Row>
  );
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 8 }}>
      {num("Start X", "x", 0, 4096)}
      {num("Start Y", "y", 0, 4096)}
      {num("Frame W", "w", 1, 2048)}
      {num("Frame H", "h", 1, 2048)}
      {num("Cols", "cols", 1, 64)}
      {num("Rows", "rows", 1, 64)}
      {num("Stride X", "sx", 1, 4096)}
      {num("Stride Y", "sy", 1, 4096)}
    </div>
  );
}

/* ——————————————————— UI bits ——————————————————— */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", alignItems: "center", gap: 10, margin: "10px 0" }}>
      <div style={{ fontSize: 13, opacity: 0.9 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

const floatingWrapStyle: React.CSSProperties = {
  position: "absolute",
  right: 16,
  top: 16,
  zIndex: 10,
  background: "rgba(10,12,16,0.82)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
  borderRadius: 16,
  padding: 12,
  color: "#DCE6FA",
  backdropFilter: "blur(10px)",
};

const embeddedWrapStyle: React.CSSProperties = { padding: 12 };

const fieldsetStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
};

const legendStyle: React.CSSProperties = { padding: "0 6px", opacity: 0.9, fontSize: 13 };

const tabbarStyle: React.CSSProperties = { display: "flex", gap: 6, margin: "8px 0 6px" };

const tabButton: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#dfe7fb",
  fontSize: 13,
};

const activeTabButton: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.22)",
};

const selectStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  color: "#e6eeff",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 13,
};

const buttonStyle: React.CSSProperties = {
  background: "rgba(120,80,220,0.28)",
  border: "1px solid rgba(120,80,220,0.45)",
  color: "#e9e6ff",
  padding: "6px 10px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 13,
};

const iconButton: React.CSSProperties = {
  ...buttonStyle,
  width: 34,
  textAlign: "center",
  padding: "6px 0",
};
