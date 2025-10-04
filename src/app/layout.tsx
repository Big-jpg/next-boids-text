export const metadata = {
  title: "Boids → Text (Next.js + Anime.js)",
  description: "Flocking boids that morph into text and back."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
