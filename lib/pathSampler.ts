export function sampleSvgPathToPoints(pathD: string, spacing = 6): { x: number; y: number }[] {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", pathD);
  svg.appendChild(path);
  // not attached to DOM; OK for geometry
  const len = (path as SVGPathElement).getTotalLength();
  const pts: {x:number;y:number}[] = [];
  const step = Math.max(1, spacing);
  for (let d = 0; d <= len; d += step) {
    const p = (path as SVGPathElement).getPointAtLength(d);
    pts.push({ x: p.x, y: p.y });
  }
  return pts;
}
