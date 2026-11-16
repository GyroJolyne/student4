"use client";
import { useEffect, useRef, useCallback } from "react";

interface InkRevealProps {
  /** RGB color of the mask overlay, e.g. [252, 250, 248] */
  maskImage?: string;
  /** Send viewport brush marks to a background renderer. */
  onBrushFrame?: (marks: InkMark[]) => void;
  /** Receive viewport pointer events and leave underlying links interactive. */
  viewportInput?: boolean;
  onMaskReady?: () => void;
  maskColor?: [number, number, number];
  /** Radius of each ink stamp in px */
  brushSize?: number;
  /** How long each stamp lives before fading (ms) */
  lifetime?: number;
  /** Initial radius before the stamp expands */
  rStart?: number;
  /** Random variation factor for stamp radius (0–1) */
  rVary?: number;
  /** Min pixel distance between stamps along a stroke */
  stampStep?: number;
  /** Max stamps alive at once (oldest are pruned) */
  maxStamps?: number;
  /** Number of segments on the wobble circle (higher = smoother) */
  segments?: number;
  /** Wobble amplitude weights [primary, secondary, tertiary] */
  wobble?: [number, number, number];
  /** Gradient inner-radius factor (0–1, relative to stamp radius) */
  gradientInnerRadius?: number;
  /** Gradient opacity stops [center, mid, edge] */
  gradientStops?: [number, number, number];
  /** Extra CSS class for the canvas element */
  className?: string;
  /** Extra inline styles for the canvas element */
  style?: React.CSSProperties;
}

export interface InkMark {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  outline: [number, number][];
}

interface Stamp {
  x: number;
  y: number;
  born: number;
  outline: InkMark["outline"];
  rmax: number;
}

const defaultMaskColor: [number, number, number] = [252, 250, 248];

const defaultWobble: [number, number, number] = [0.14, 0.08, 0.05];

const defaultGradientStops: [number, number, number] = [0.95, 0.88, 0];

export default function InkReveal({
  maskImage,
  onBrushFrame,
  viewportInput = false,
  onMaskReady,
  maskColor = defaultMaskColor,
  brushSize = 128,
  lifetime = 600,
  rStart = 10,
  rVary = 0.45,
  stampStep = 10,
  maxStamps = 200,
  segments = 36,
  wobble = defaultWobble,
  gradientInnerRadius = 0.2,
  gradientStops = defaultGradientStops,
  className,
  style,
}: InkRevealProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stampsRef = useRef<Stamp[]>([]);
  const runningRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const dimsRef = useRef({ w: 0, h: 0 });

  const mc = maskColor;
  const frame = useRef(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const surface = useRef<HTMLCanvasElement | null>(null);



  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    if (onBrushFrame) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    dimsRef.current = { w, h };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgb(${mc[0]},${mc[1]},${mc[2]})`;
    ctx.fillRect(0, 0, w, h);
    const image = imageRef.current;
    if (image && w && h) {
      const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
      const iw = image.naturalWidth * scale;
      const ih = image.naturalHeight * scale;
      const top = window.matchMedia("(min-width: 992px)").matches ? 0 : (h - ih) / 2;
      ctx.drawImage(image, (w - iw) / 2, top, iw, ih);
    }
    const snapshot = surface.current ?? document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    snapshot.getContext("2d")?.drawImage(canvas, 0, 0);
    surface.current = snapshot;
  }, [mc, onBrushFrame]);

  const carveInk = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      outline: InkMark["outline"],
      alpha: number
    ) => {
      const g = ctx.createRadialGradient(
        x, y, r * gradientInnerRadius,
        x, y, r
      );
      g.addColorStop(0, `rgba(0,0,0,${gradientStops[0] * alpha})`);
      g.addColorStop(0.5, `rgba(0,0,0,${gradientStops[1] * alpha})`);
      g.addColorStop(1, `rgba(0,0,0,${gradientStops[2] * alpha})`);
      ctx.fillStyle = g;

      ctx.beginPath();
      outline.forEach(([dx, dy], i) => {
        const px = x + dx * r;
        const py = y + dy * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
    },
    [gradientInnerRadius, gradientStops]
  );

  const addStamp = useCallback(
    (x: number, y: number) => {
      const stamps = stampsRef.current;
      if (stamps.length >= maxStamps) stamps.shift();
      const seed = Math.random() * Math.PI * 2;
      const outline: InkMark["outline"] = [];
      for (let i = 0; i < segments; i++) {
        const a = i / segments * Math.PI * 2;
        const edge = 0.78 + wobble[0] * Math.sin(3 * a + seed)
          + wobble[1] * Math.sin(5 * a + seed * 2.1)
          + wobble[2] * Math.sin(7 * a + seed * 0.7);
        outline.push([Math.cos(a) * edge, Math.sin(a) * edge]);
      }
      stamps.push({
        x,
        y,
        born: performance.now(),
        outline,
        rmax: brushSize * (1 - rVary + Math.random() * rVary),
      });
    },
    [brushSize, rVary, maxStamps, segments, wobble]
  );

  const stampAlong = useCallback(
    (x: number, y: number) => {
      const last = lastPosRef.current;
      if (!last) {
        addStamp(x, y);
      } else {
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(dist / stampStep));
        for (let i = 1; i <= steps; i++) {
          addStamp(last.x + (dx * i) / steps, last.y + (dy * i) / steps);
        }
      }
      lastPosRef.current = { x, y };
    },
    [addStamp, stampStep]
  );

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = onBrushFrame ? null : canvas.getContext("2d");
    const { w, h } = dimsRef.current;
    const now = performance.now();
    const stamps = stampsRef.current;
    const marks: InkMark[] = [];
    if (ctx) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgb(${mc[0]},${mc[1]},${mc[2]})`;
      if (surface.current) ctx.drawImage(surface.current, 0, 0, w, h);
      else ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-out";
    }
    for (let i = stamps.length - 1; i >= 0; i--) {
      const t = (now - stamps[i].born) / lifetime;
      if (t >= 1) {
        stamps.splice(i, 1);
        continue;
      }
      const ease = 1 - Math.pow(1 - t, 3);
      const r = rStart + (stamps[i].rmax - rStart) * ease;
      const alpha = 1 - t * t;
      const { x, y, outline } = stamps[i];
      if (ctx) carveInk(ctx, x, y, r, outline, alpha);
      else marks.push({ x, y, radius: r, outline, alpha });
    }

    onBrushFrame?.(marks);
    if (stamps.length) {
      frame.current = requestAnimationFrame(loop);
    } else {
      runningRef.current = false;
    }
  }, [carveInk, mc, lifetime, rStart, onBrushFrame]);

  const startLoop = useCallback(() => {
    if (!runningRef.current) {
      runningRef.current = true;
      frame.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  useEffect(() => {
    resize();
    const parent = canvasRef.current?.parentElement;
    const observer = new ResizeObserver(resize);
    if (parent) observer.observe(parent);
    let active = true;
    if (maskImage) {
      const image = new Image();
      image.src = maskImage;
      image.decode().then(() => {
        if (!active) return;
        imageRef.current = image;
        resize();
        onMaskReady?.();
      }).catch(() => { /* Keep the original HTML image visible on a load failure. */ });
    }
    return () => {
      active = false;
      observer.disconnect();
      onBrushFrame?.([]);
      cancelAnimationFrame(frame.current);
      runningRef.current = false;
      stampsRef.current.length = 0;
      lastPosRef.current = null;
    };
  }, [resize, maskImage, onMaskReady, onBrushFrame, loop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const target: EventTarget = viewportInput ? window : canvas;
    const boundsHost = onBrushFrame ? canvas.parentElement : canvas;
    function reset() { lastPosRef.current = null; }
    function draw(event: Event) {
      const e = event as PointerEvent;
      if (!e.isPrimary || !boundsHost) return;
      const bounds = boundsHost.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      if (x < 0 || y < 0 || x >= bounds.width || y >= bounds.height) { reset(); return; }
      if (onBrushFrame) {
        const snowTop = document.querySelector("#creator-world")?.getBoundingClientRect().top;
        if (snowTop !== undefined && e.clientY + brushSize < snowTop &&
            !(e.target instanceof Element && e.target.closest(".nav-menu-w"))) { reset(); return; }
      }
      stampAlong(x, y);
      startLoop();
    }
    function leave(event: Event) { if (!(event as PointerEvent).relatedTarget) reset(); }
    const events = ["pointerdown", "pointermove"];
    for (const type of events) target.addEventListener(type, draw, {capture:true, passive:true});
    target.addEventListener("pointerout", leave);
    target.addEventListener("pointercancel", reset);
    window.addEventListener("blur", reset);
    return () => {
      for (const type of events) target.removeEventListener(type, draw, true);
      target.removeEventListener("pointerout", leave);
      target.removeEventListener("pointercancel", reset);
      window.removeEventListener("blur", reset);
    };
  }, [viewportInput, onBrushFrame, brushSize, stampAlong, startLoop]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        cursor: "none",
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
