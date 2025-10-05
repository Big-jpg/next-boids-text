"use client";

import { useState } from "react";
import ControlsPanel from "@/components/ControlsPanel";

export default function ClientControlsWrapper() {
  const [showControls, setShowControls] = useState(true);

  return (
    <>
      <button
        onClick={() => setShowControls((prev) => !prev)}
        style={{
          position: "fixed",
          left: 12,
          bottom: 12,
          zIndex: 20,
          background: "rgba(15,18,25,0.7)",
          color: "#cbd5e1",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          padding: "6px 10px",
          fontSize: 13,
          cursor: "pointer",
          backdropFilter: "blur(6px)",
        }}
      >
        {showControls ? "Hide Controls" : "Show Controls"}
      </button>

      {showControls && <ControlsPanel />}
    </>
  );
}
