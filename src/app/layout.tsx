// src/app/layout.tsx
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import ControlsPanel from "@/components/ControlsPanel";
import { useState } from "react";

export const metadata = {
  title: "Boids → Text (Next.js + Anime.js)",
  description: "Flocking boids that morph into text and back.",
  metadataBase: new URL("https://next-boids-text.vercel.app/"), // ← update with your actual domain
  openGraph: {
    title: "Boids → Text (Next.js + Anime.js)",
    description: "Flocking boids morph seamlessly into text.",
    url: "https://next-boids-text.vercel.app/",
    siteName: "BoidsText",
    images: [
      {
        url: "/og-image.png", // place your OG image in /public/og-image.png
        width: 1200,
        height: 630,
        alt: "Boids morphing into text visualization",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Boids → Text (Next.js + Anime.js)",
    description: "Flocking boids that morph into text and back.",
    creator: "@yourhandle", // optional
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showControls, setShowControls] = useState(true);

  return (
    <html lang="en">
      <body>
        {/* Toggle button (bottom-left corner) */}
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

        {/* Main content */}
        {children}

        {/* Conditional controls panel */}
        {showControls && <ControlsPanel />}

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
