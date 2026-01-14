"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 1000,
      height: 1000,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      scale: 2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.2, 0.6, 1],
      markerColor: [1, 1, 1],
      glowColor: [0.2, 0.6, 1],
      markers: [
        // Algeria / Oran
        { location: [35.6971, -0.6308], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.002;
      },
    });

    return () => globe.destroy();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[1000px]"
      style={{ contain: "layout paint size" }}
    />
  );
}
