import { useEffect, useState } from "react";

function measure() {
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  return 1.5 * Math.max(70, Math.min(225, shortSide * 0.19));
}
export function useBrushRadius() {
  const [radius, setRadius] = useState(measure);
  useEffect(() => {
    function resize() { setRadius(measure()); }
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return radius;
}
