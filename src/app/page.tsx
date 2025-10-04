"use client";
import "./globals.css";
import dynamic from "next/dynamic";

const BoidsField = dynamic(() => import("./boidsField"), { ssr: false });

export default function Page() {
  return (
    <>
      <div id="hud">
        <div><strong>Boids + Anime.js + Text Morph</strong></div>
        <div>• Mouse near center biases flock in free mode</div>
        <div>• Press <code>F</code> to toggle follow-attractor in free mode</div>
        <div>• Use the panel to form / disperse text</div>
      </div>

      <BoidsField />

      <div id="panel">
        <Controls />
      </div>
    </>
  );
}

import { useBoidsControls } from "@/lib/controls";

function Controls() {
  const {
    text, setText, forming, formText, disperse, togglePulse, pulse,
    cfg, setCfg
  } = useBoidsControls();

  return (
    <>
      <label>
        Target Text
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something…"
        />
      </label>

      <div className="row">
        <button onClick={formText} disabled={forming}>Form Text</button>
        <button onClick={disperse} disabled={!forming}>Disperse</button>
        <button onClick={togglePulse}>{pulse ? "Stop Density Pulse" : "Start Density Pulse"}</button>
      </div>

      <fieldset style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 10 }}>
        <legend style={{ padding: "0 6px" }}>Flocking</legend>
        <div className="row">
          <label>
            Count&nbsp;
            <input
              type="range" min={60} max={600} step={1}
              value={cfg.count}
              onChange={(e) => setCfg({ ...cfg, count: Number(e.target.value) })}
            />
          </label>
          <label>
            Speed&nbsp;
            <input
              type="range" min={1} max={5} step={0.1}
              value={cfg.speed}
              onChange={(e) => setCfg({ ...cfg, speed: Number(e.target.value) })}
            />
          </label>
          <label>
            Sep&nbsp;
            <input
              type="range" min={10} max={60} step={1}
              value={cfg.separationRadius}
              onChange={(e) => setCfg({ ...cfg, separationRadius: Number(e.target.value) })}
            />
          </label>
          <label>
            Align&nbsp;
            <input
              type="range" min={30} max={140} step={1}
              value={cfg.alignRadius}
              onChange={(e) => setCfg({ ...cfg, alignRadius: Number(e.target.value) })}
            />
          </label>
          <label>
            Coh&nbsp;
            <input
              type="range" min={30} max={140} step={1}
              value={cfg.cohesionRadius}
              onChange={(e) => setCfg({ ...cfg, cohesionRadius: Number(e.target.value) })}
            />
          </label>
        </div>
      </fieldset>
    </>
  );
}
