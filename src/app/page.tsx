"use client";

import "./globals.css";
import BoidsField from "./boidsField";

export default function Page() {
  return (
    <>
      {/* Tiny helper card (top-left). Safe to remove if you like. */}
      <div
        style={{
          position: "fixed",
          left: 16,
          top: 16,
          zIndex: 5,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(20,24,32,0.55)",
          backdropFilter: "blur(6px)",
          color: "#cbd5e1",
          fontSize: 13,
          lineHeight: 1.3,
          pointerEvents: "none",
        }}
      >
        <div>Boids → Text</div>
        <div>• Press F to toggle mouse-follow</div>
        <div>• Tune Orbit / Repel for legibility vs motion</div>
      </div>

      <BoidsField />
    </>
  );
}
