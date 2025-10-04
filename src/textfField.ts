export type SampleOptions = {
  width: number;
  height: number;
  text: string;
  font: string;        // e.g. "bold 180px Inter, sans-serif"
  sampleEvery: number; // px grid step
  threshold: number;   // alpha threshold 0..255
};

export function sampleTextToPoints(opts: SampleOptions): { x: number; y: number }[] {
  // Offscreen canvas
  const oc = document.createElement("canvas");
  oc.width = opts.width;
  oc.height = opts.height;
  const octx = oc.getContext("2d")!;
  octx.clearRect(0,0,oc.width,oc.height);

  // Draw centered text
  octx.fillStyle = "#fff";
  octx.textAlign = "center";
  octx.textBaseline = "middle";
  octx.font = opts.font;

  // If text too wide, shrink font to fit (very rough)
  let fontPx = Number(opts.font.match(/(\d+)px/)?.[1] ?? 160);
  const measure = (px: number) => {
    octx.font = opts.font.replace(/\d+px/, `${px}px`);
    return octx.measureText(opts.text).width;
  };
  while (measure(fontPx) > opts.width * 0.9 && fontPx > 12) fontPx -= 4;
  octx.font = opts.font.replace(/\d+px/, `${fontPx}px`);

  octx.fillText(opts.text, opts.width/2, opts.height/2);

  const { data } = octx.getImageData(0, 0, oc.width, oc.height);
  const pts: { x: number; y: number }[] = [];
  const step = Math.max(1, opts.sampleEvery);

  for (let y = 0; y < oc.height; y += step) {
    for (let x = 0; x < oc.width; x += step) {
      const idx = (y * oc.width + x) * 4;
      const a = data[idx + 3];
      if (a >= opts.threshold) {
        // jitter a hair to avoid rigid grid look
        pts.push({ x: x + (Math.random()-0.5)*step*0.4, y: y + (Math.random()-0.5)*step*0.4 });
      }
    }
  }
  return pts;
}
