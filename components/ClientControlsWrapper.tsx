"use client";

import { useEffect, useRef, useState } from "react";
import ControlsPanel from "@/components/ControlsPanel";

/**
 * Floating toggle + animated mount/unmount for the controls.
 * When closed, we animate opacity/transform/max-height, then unmount so there
 * are zero event handlers or visual artifacts ("ghosts").
 */
export default function ClientControlsWrapper() {
  const [open, setOpen] = useState(true);
  const [renderPanel, setRenderPanel] = useState(true);
  const innerRef = useRef<HTMLDivElement>(null);

  // Close → wait for transition end → unmount
  useEffect(() => {
    if (open) {
      setRenderPanel(true);
      return;
    }
    const el = innerRef.current;
    if (!el) return;

    const onEnd = (e: TransitionEvent) => {
      if (e.target === el) setRenderPanel(false);
    };
    el.addEventListener("transitionend", onEnd);
    const t = setTimeout(() => setRenderPanel(false), 350); // fallback

    return () => {
      el.removeEventListener("transitionend", onEnd);
      clearTimeout(t);
    };
  }, [open]);

  return (
    <>
      {/* Toggle button (bottom-left) */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={toggleBtnStyle}
        aria-controls="controls-panel"
        aria-expanded={open}
      >
        {open ? "Hide Controls" : "Show Controls"}
      </button>

      {/* Dock (bottom-right). Stays mounted; inner content animates/unmounts */}
      <div style={dockStyle} aria-hidden={!open}>
        <div
          id="controls-panel"
          ref={innerRef}
          style={{
            transition: "opacity 220ms ease, transform 220ms ease, max-height 220ms ease",
            maxHeight: open ? 1200 : 0,
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0px)" : "translateY(8px)",
            overflow: "hidden",
            // prevent hit-testing & “ghost” blending during the fade
            pointerEvents: open ? "auto" : "none",
            visibility: open ? "visible" : "hidden",
          }}
        >
          {renderPanel && <ControlsPanel floating={false} />}
        </div>
      </div>
    </>
  );
}

const dockStyle: React.CSSProperties = {
  position: "fixed",
  right: 12,
  bottom: 12,
  zIndex: 20,
};

const toggleBtnStyle: React.CSSProperties = {
  position: "fixed",
  left: 12,
  bottom: 12,
  zIndex: 30,
  background: "rgba(15,18,25,0.7)",
  color: "#cbd5e1",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 10,
  padding: "6px 10px",
  fontSize: 13,
  cursor: "pointer",
  backdropFilter: "blur(6px)",
};
