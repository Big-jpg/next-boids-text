// lib/textField.ts
export type SampleOptions = {
  width: number;
  height: number;
  text: string;
  font: string;          // e.g. "bold 200px Inter, sans-serif"
  sampleEvery: number;   // px grid step
  threshold: number;     // alpha threshold 0..255
  mode?: "fill" | "outline";
  strokeWidth?: number;
  letterSpacingPx?: number; // NEW
};

export type SampleResult = {
  points: { x: number; y: number }[];
  fontPx: number;
  textWidth: number;
  box: { w: number; h: number };
};

export function sampleTextToPoints(opts: SampleOptions): SampleResult {
  const oc = document.createElement("canvas");
  oc.width = opts.width;
  oc.height = opts.height;
  const octx = oc.getContext("2d")!;
  octx.clearRect(0, 0, oc.width, oc.height);

  octx.textAlign = "left";
  octx.textBaseline = "alphabetic";

  // Fit font to width (rough pass)
  let fontPx = Number(opts.font.match(/(\d+)px/)?.[1] ?? 160);
  const measureTextWidth = (px: number, spacing: number) => {
    octx.font = opts.font.replace(/\d+px/, `${px}px`);
    let w = 0;
    for (let i = 0; i < opts.text.length; i++) {
      const ch = opts.text[i];
      const m = octx.measureText(ch);
      w += m.width;
      if (i < opts.text.length - 1) w += spacing;
    }
    return w;
  };
  const spacingInit = Math.max(0, opts.letterSpacingPx ?? 0);
  while (measureTextWidth(fontPx, spacingInit) > opts.width * 0.92 && fontPx > 12) fontPx -= 4;
  octx.font = opts.font.replace(/\d+px/, `${fontPx}px`);

  // Compose string manually with spacing, centered
  const spacing = Math.max(0, spacingInit);
  const totalWidth = measureTextWidth(fontPx, spacing);
  const startX = (opts.width - totalWidth) / 2;
  const baselineY = opts.height / 2 + fontPx * 0.35; // decent visual centering

  if (opts.mode === "outline") {
    octx.strokeStyle = "#fff";
    octx.lineWidth = opts.strokeWidth ?? 4;
  } else {
    octx.fillStyle = "#fff";
  }

  let penX = startX;
  for (let i = 0; i < opts.text.length; i++) {
    const ch = opts.text[i];
    if (opts.mode === "outline") octx.strokeText(ch, penX, baselineY);
    else octx.fillText(ch, penX, baselineY);
    penX += octx.measureText(ch).width;
    if (i < opts.text.length - 1) penX += spacing;
  }

  const { data } = octx.getImageData(0, 0, oc.width, oc.height);
  const pts: { x: number; y: number }[] = [];
  const step = Math.max(1, opts.sampleEvery);

  for (let y = 0; y < oc.height; y += step) {
    for (let x = 0; x < oc.width; x += step) {
      const idx = (y * oc.width + x) * 4;
      const a = data[idx + 3];
      if (a >= opts.threshold) {
        pts.push({
          x: x + (Math.random() - 0.5) * step * 0.35,
          y: y + (Math.random() - 0.5) * step * 0.35
        });
      }
    }
  }

  return { points: pts, fontPx, textWidth: totalWidth, box: { w: oc.width, h: oc.height } };
}
