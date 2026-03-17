"use client";

import { useRef, useLayoutEffect, useEffect } from "react";
import { drawGrid } from "@/lib/drawGrid";

export default function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw grid on mount (before paint)
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawGrid(canvas, { viewportOnly: true, isDark: true });
  }, []);

  // Handle resize with debounce
  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimer: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimer) return;
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        drawGrid(canvas, { viewportOnly: true, isDark: true });
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <>
      {/* Layer 1: Solid opaque background */}
      <div className="page-background" />
      {/* Layer 2: Canvas grid */}
      <canvas ref={canvasRef} className="page-grid-canvas" />
      {/* Layer 3: Blue-tinted overlay glow */}
      <div className="page-overlay" />
    </>
  );
}
