import type { InkMark } from "@/components/ui/ink-reveal";

const ns = "http://www.w3.org/2000/svg";
const surfaces = [
  ".taxi-w .s", ".taxi-w .utility__page--w", ".taxi-w .footer-layout-clip", ".nav-menu-w",
  "body:not(:has(.rain-opening)) :is(.transition-w, .mob-landscape-block)",
].join(",");

// All surfaces reference the same brush geometry. Each mask translates viewport
// coordinates into its own background box, including while scrolling.
export function createSnowBrush() {
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position: absolute; top: 0; left: 0; width: 0; height: 0; overflow: hidden; pointer-events: none;";
  svg.innerHTML = '<defs><radialGradient id="snow-ink-edge" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1"><stop offset=".2" stop-color="white" stop-opacity=".95"/><stop offset=".6" stop-color="white" stop-opacity=".88"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient><g id="snow-ink-stroke" fill="url(#snow-ink-edge)"></g></defs>';
  document.body.append(svg);
  const defs = svg.querySelector("defs")!;
  const stroke = svg.querySelector("g")!;
  const active = new Map<HTMLElement, SVGMaskElement>();
  const paths = new Map<InkMark["outline"], SVGPolygonElement>();
  let nextId = 0;
  // Decode once; all CSS layers share this resource.
  const image = new Image();
  image.src = "/assets/ink/snow-reveal.png";

  return (marks: InkMark[]) => {
    const live = new Set(marks.map(mark => mark.outline));
    for (const [shape, path] of paths) {
      if (!live.has(shape)) { path.remove(); paths.delete(shape); }
    }
    for (const mark of marks) {
      let path = paths.get(mark.outline);
      if (!path) {
        path = document.createElementNS(ns, "polygon");
        path.setAttribute("points", mark.outline.map(([x, y]) => x + "," + y).join(" "));
        paths.set(mark.outline, path);
        stroke.append(path);
      }
      path.setAttribute("transform", `translate(${mark.x} ${mark.y}) scale(${mark.radius})`);
      path.setAttribute("opacity", String(mark.alpha));
    }

    const visible = new Set<HTMLElement>();
    if (marks.length) {
      for (const surface of Array.from(document.querySelectorAll<HTMLElement>(surfaces))) {
        const box = surface.getBoundingClientRect();
        if (!box.width || !box.height || !marks.some(m => m.x + m.radius > box.left &&
          m.x - m.radius < box.right && m.y + m.radius > box.top && m.y - m.radius < box.bottom)) continue;
        visible.add(surface);
        let mask = active.get(surface);
        if (!mask) {
          mask = document.createElementNS(ns, "mask");
          mask.id = "snow-ink-mask-" + nextId++;
          mask.setAttribute("maskUnits", "objectBoundingBox");
          mask.setAttribute("x", "0");
          mask.setAttribute("y", "0");
          mask.setAttribute("width", "1");
          mask.setAttribute("height", "1");
          const use = document.createElementNS(ns, "use");
          use.setAttribute("href", "#snow-ink-stroke");
          mask.append(use);
          defs.append(mask);
          active.set(surface, mask);
          if (getComputedStyle(surface).position === "static") surface.classList.add("snow-ink-relative");
          surface.style.setProperty("--snow-brush-mask", `url("#${mask.id}")`);
          surface.classList.add("snow-ink-active");
        }
        const sx = surface.offsetWidth / box.width;
        const sy = surface.offsetHeight / box.height;
        mask.firstElementChild!.setAttribute("transform",
          `translate(${-surface.clientLeft} ${-surface.clientTop}) scale(${sx} ${sy}) translate(${-box.left} ${-box.top})`);
      }
    }
    for (const [surface, mask] of active) {
      if (visible.has(surface)) continue;
      surface.classList.remove("snow-ink-active", "snow-ink-relative");
      surface.style.removeProperty("--snow-brush-mask");
      mask.remove();
      active.delete(surface);
    }
  };
}
