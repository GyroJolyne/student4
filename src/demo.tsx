import { createRoot } from "react-dom/client";
import InkReveal from "@/components/ui/ink-reveal";
import { useBrushRadius } from "./brush-radius";

function FullScreenDemo() {
  const radius = useBrushRadius();
  return <main className="fixed inset-0 overflow-hidden">
    <img src="/assets/opening/reveal.png" alt="风雪中的斗笠人物"
      className="absolute inset-0 h-full w-full object-cover" />
    <InkReveal viewportInput brushSize={radius} rStart={radius * 0.5} rVary={0.1}
      stampStep={radius * 0.16} maxStamps={36} style={{pointerEvents:"none"}} />
  </main>;
}
const host = document.querySelector("#demo");
if (host) createRoot(host).render(<FullScreenDemo />);
