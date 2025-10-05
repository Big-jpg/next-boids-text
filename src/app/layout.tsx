import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import ClientControlsWrapper from "@/components/ClientControlsWrapper";

export const metadata = {
  title: "Boids → Text (Next.js + Anime.js)",
  description: "Flocking boids that morph into text and back.",
  metadataBase: new URL("https://next-boids-text.vercel.app/"),
  openGraph: {
    title: "Boids → Text (Next.js + Anime.js)",
    description: "Flocking boids morph seamlessly into text.",
    url: "https://next-boids-text.vercel.app/",
    siteName: "BoidsText",
    images: [
      {
        url: "/og-image.png",
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
    creator: "@yourhandle",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Toggle + ControlsPanel client-side */}
        <ClientControlsWrapper />
        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
