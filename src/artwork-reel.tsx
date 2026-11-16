import { useEffect, useRef, useState } from "react";
import { artworks } from "./artworks";

const total = artworks.length;
const file = (id: string, small = false) => `/assets/portfolio/3d/${id}${small ? "-480" : ""}.webp`;

export function ArtworkReel() {
  const viewport = useRef<HTMLDivElement>(null);
  const sequence = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [copies, setCopies] = useState(2);
  const [reduceMotion, setReduceMotion] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [hovered, setHovered] = useState(false);
  const [touching, setTouching] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [inView, setInView] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const selected = current === null ? null : artworks[current];

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!keyboardFocus) return;
    const resumePointerInput = () => setKeyboardFocus(false);
    window.addEventListener("pointermove", resumePointerInput, { passive: true, once: true });
    return () => window.removeEventListener("pointermove", resumePointerInput);
  }, [keyboardFocus]);

  useEffect(() => {
    const view = viewport.current!;
    const group = sequence.current!;
    const resize = new ResizeObserver(() => {
      if (group.offsetWidth) setCopies(1 + Math.ceil(view.clientWidth / group.offsetWidth));
    });
    resize.observe(group);
    resize.observe(view);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(view);
    return () => { resize.disconnect(); observer.disconnect(); };
  }, []);

  useEffect(() => {
    if (!inView || reduceMotion || hovered || touching || keyboardFocus || current !== null) return;
    const view = viewport.current!;
    const group = sequence.current!;
    let position = view.scrollLeft;
    let previous = 0;
    let frame: number;
    let lastWritten = view.scrollLeft;
    function advance(now: number) {
      if (view.scrollLeft !== lastWritten) position = view.scrollLeft;
      const distance = previous ? Math.min(now - previous, 64) * 0.072 : 0;
      const period = group.getBoundingClientRect().width;
      if (period > 0) {
        position = (position + distance) % period;
        view.scrollLeft = position;
        lastWritten = view.scrollLeft;
      }
      previous = now;
      frame = requestAnimationFrame(advance);
    }
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, hovered, touching, keyboardFocus, current]);

  function openArt(index: number) {
    setCurrent(index);
    dialog.current?.showModal();
  }
  function step(direction: number) {
    setCurrent(index => ((index ?? 0) + total + direction) % total);
  }

  return <>
    <div ref={viewport} className="art-reel-viewport" data-lenis-prevent-horizontal=""
      onPointerEnter={e => setHovered(e.pointerType === "mouse" || e.pointerType === "pen")}
      onPointerLeave={() => { setHovered(false); setTouching(false); }}
      onPointerDown={e => setTouching(e.pointerType !== "mouse")}
      onPointerUp={() => setTouching(false)} onPointerCancel={() => setTouching(false)}
      onFocus={e => setKeyboardFocus(e.target.matches(":focus-visible"))}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setKeyboardFocus(false); }}>
      {Array.from({ length: copies }, (_, copy) => <div className="art-sequence" key={copy}
        ref={copy === 0 ? sequence : undefined} aria-hidden={copy > 0 || undefined}>
        {artworks.map((art, index) => <button type="button" className="art-card" key={art.id}
          tabIndex={copy === 0 ? 0 : -1} aria-label={`查看大图，${art.title}`}
          onClick={() => openArt(index)}>
          <img src={file(art.id, true)} srcSet={`${file(art.id, true)} 480w, ${file(art.id)} ${art.width}w`}
            sizes="auto, (max-width: 991px) 32vw, 45vh" width={art.width} height={art.height}
            alt={art.title} loading="lazy" decoding="async" draggable={false} />
        </button>)}
      </div>)}
    </div>
    <dialog ref={dialog} className="art-viewer" aria-label="作品大图" data-lenis-prevent=""
      onClose={() => setCurrent(null)}
      onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}
      onKeyDown={e => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault(); step(e.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      <button type="button" className="art-viewer-close" aria-label="关闭大图" autoFocus
        onClick={() => dialog.current?.close()}>×</button>
      {selected && <>
        <img className="art-viewer-image" key={selected.id} src={file(selected.id)}
          width={selected.width} height={selected.height} alt={selected.title} />
        <footer className="art-viewer-bar">
          <div aria-live="polite"><small>3D / {selected.id}</small><p>{selected.title}</p></div>
          <div className="art-viewer-controls">
            <button type="button" aria-label="上一张" onClick={() => step(-1)}>←</button>
            <button type="button" aria-label="下一张" onClick={() => step(1)}>→</button>
          </div>
        </footer>
      </>}
    </dialog>
  </>;
}
