"use client";

import { useEffect, useRef, useState } from "react";
import ControlsPanel from "@/components/ControlsPanel";

/** Renders a floating toggle button. When open=false, we animate collapse,
 * then unmount the panel (freeing event listeners). */
export default function ClientControlsWrapper() {
  const [open, setOpen] = useState(true);
  const [renderPanel, setRenderPanel] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  // When closing, wait for transition to finish, then unmount.
  useEffect(() => {
    if (open) {
      setRenderPanel(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const onEnd = (e: TransitionEvent) => {
      if (e.target === el) setRenderPanel(false);
    };
    el.addEventListener("transitionend", onEnd);
    // Fallback unmount if transition not fired
    const t = setTimeout(() => setRenderPanel(false), 400);
    return () => {
      el.removeEventListener("transitionend", onEnd);
      clearTimeout(t);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen((p) => !p)}
        style={toggleBtn()}
      >
        {open ? "Hide Controls" : "Show Controls"}
      </button>

      {/* Floating container at bottom-right that we animate ourselves */}
      <div style={dock()} aria-hidden={!open}>
        <div
          ref={ref}
          style={{
            transition: "opacity 220ms ease, transform 220ms ease, max-height 220ms ease",
            maxHeight: open ? 1000 : 0,
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0px)" : "translateY(8px)",
            overflow: "hidden",
          }}
        >
          {renderPanel && <ControlsPanel floating={false} />}
        </div>
      </div>
    </>
  );
}

const dock = () => ({
  position: "fixed" as const,
  right: 12,
  bottom: 12,
  zIndex: 20,
  // Let inner div handle the animation; this container stays put
});

const toggleBtn = () => ({
  position: "fixed" as const,
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
});
