import { useCallback } from "react";
import { createRoot, type Root } from "react-dom/client";
import InkReveal from "@/components/ui/ink-reveal";

import { createSnowBrush } from "./snow-brush";
import { useBrushRadius } from "./brush-radius";
import { ArtworkReel } from "./artwork-reel";

function OpeningBrush({ hero }: { hero: HTMLElement }) {
  const radius = useBrushRadius();
  const ready = useCallback(() => hero.classList.add("ink-ready"), [hero]);
  return <InkReveal viewportInput maskImage="/assets/opening/ink.png" onMaskReady={ready}
    brushSize={radius} lifetime={650} rStart={radius * 0.5} rVary={0.1}
    stampStep={Math.max(18, radius * 0.16)} maxStamps={36}
    style={{ cursor: "default" }} />;

}

function PageBrush({ paint }: { paint: ReturnType<typeof createSnowBrush> }) {
  const radius = useBrushRadius();
  return <InkReveal viewportInput onBrushFrame={paint} brushSize={radius} lifetime={650}
    rStart={radius * 0.5} rVary={0.1} stampStep={Math.max(18, radius * 0.16)}
    maxStamps={36} />;
}

let mounted: { hero: HTMLElement; host: HTMLElement; root: Root } | undefined;
let reel: { host: HTMLElement; root: Root } | undefined;
let frameObserver: ResizeObserver | undefined;
function sync() {
  const reelHost = document.querySelector<HTMLElement>("[data-art-reel]");
  if (reelHost !== (reel?.host ?? null)) {
    reel?.root.unmount();
    reel = undefined;
    if (reelHost) {
      reel = { host: reelHost, root: createRoot(reelHost) };
      reel.root.render(<ArtworkReel />);
    }
  }
  const hero = document.querySelector<HTMLElement>(".rain-opening");
  if (hero === mounted?.hero) return;
  frameObserver?.disconnect();
  if (mounted) {
    mounted.root.unmount();
    mounted.host.remove();
    mounted.hero.classList.remove("ink-ready");
    mounted = undefined;
  }
  if (!hero) return;
  const trainingFrame = document.querySelector<HTMLElement>("#zhengwen-lora .lora-frame");
  const workflows = document.querySelector<HTMLElement>("#comfyui-workflow");
  if (trainingFrame && workflows) {
    frameObserver = new ResizeObserver(([entry]) => {
      workflows.style.setProperty("--training-frame-height", `${entry.borderBoxSize[0].blockSize}px`);
    });
    frameObserver.observe(trainingFrame, { box: "border-box" });
  }
  // Taxi may restore a cached HTML snapshot containing an inert canvas.
  hero.querySelectorAll(":scope > .ink-canvas-host").forEach(node => node.remove());
  hero.classList.remove("ink-ready");
  const host = document.createElement("div");
  host.className = "ink-canvas-host absolute inset-0";
  hero.append(host);
  const root = createRoot(host);
  mounted = { hero, host, root };
  root.render(<OpeningBrush hero={hero} />);
}
const runtimeKey = Symbol.for("hm.inkReveal.runtime");
if (!Reflect.has(window, runtimeKey)) {
  Reflect.set(window, runtimeKey, true);
  const wash = document.createElement("div");
  wash.className = "viewport-ink";
  document.body.append(wash);
  createRoot(wash).render(<PageBrush paint={createSnowBrush()} />);
  sync();
  const main = document.querySelector("[data-taxi]");
  if (main) new MutationObserver(sync).observe(main, {childList:true});
}
