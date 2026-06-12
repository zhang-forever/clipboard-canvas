import { useState, useEffect, useCallback, useRef } from "react";

export interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const PAN_SPEED = 12;

export function useCanvasTransform() {
  const [transform, setTransform] = useState<CanvasTransform>({ x: 0, y: 0, scale: 1 });
  const keysRef = useRef<Set<string>>(new Set());
  const tRef = useRef(transform);
  tRef.current = transform;

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "?" || e.ctrlKey) return;
      keysRef.current.add(e.key.toLowerCase());
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    let last = performance.now();
    let cancelled = false;
    const loop = (now: number) => {
      if (cancelled) return;
      const dt = Math.min((now - last) / 16.67, 5);
      last = now;
      const k = keysRef.current;
      let dx = 0;
      let dy = 0;
      const speed = PAN_SPEED * (1 / tRef.current.scale);
      if (k.has("w") || k.has("arrowup")) dy += speed * dt;
      if (k.has("s") || k.has("arrowdown")) dy -= speed * dt;
      if (k.has("a") || k.has("arrowleft")) dx += speed * dt;
      if (k.has("d") || k.has("arrowright")) dx -= speed * dt;

      if (dx !== 0 || dy !== 0) {
        setTransform((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
      }
      requestAnimationFrame(loop);
    };
    const raf = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setTransform((prev) => {
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
      return {
        x: mx - (mx - prev.x) * (ns / prev.scale),
        y: my - (my - prev.y) * (ns / prev.scale),
        scale: ns,
      };
    });
  }, []);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - transform.x) / transform.scale,
      y: (sy - transform.y) / transform.scale,
    }),
    [transform]
  );

  const resetView = useCallback(() => setTransform({ x: 0, y: 0, scale: 1 }), []);

  return { transform, handleWheel, screenToWorld, resetView };
}
