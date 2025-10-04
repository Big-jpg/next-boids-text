"use client";

import "./globals.css";
import BoidsField from "./boidsField";            // ← direct client import
import ControlsPanel from "@/components/ControlsPanel";

export default function Page() {
  return (
    <>
      <div
        id="hud"
        style={{
          position: "fixed",
          left: 12,
          top: 12,
          zIndex: 10,
          padding: "10px 12px",
          borderRadius: 12,
          background: "rgba(20,24,32,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
          color: "#cbd5e1",
          fontSize: 12,
          lineHeight: 1.35,
          backdropFilter: "blur(8px)",
        }}
      >
        <div><strong>Boids → Text</strong></div>
        <div>• Press <kbd>F</kbd> to toggle mouse-follow in free mode</div>
        <div>• Tune Orbit / Repel for legibility vs motion</div>
      </div>

      <BoidsField />
      <ControlsPanel />
    </>
  );
}
