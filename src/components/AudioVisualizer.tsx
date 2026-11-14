import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

interface AudioVisualizerProps {
  bars?: number;
  height?: number;
  className?: string;
  color?: string;
}

export function AudioVisualizer({
  bars = 24,
  height = 36,
  className = '',
  color = '#FF3B5C',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isPlaying, getFrequencyData } = usePlayer();
  const dataRef = useRef<Uint8Array>(new Uint8Array(64));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const hasAnalyser = getFrequencyData(dataRef.current);
      const gap = 2;
      const barWidth = Math.max(2, (w - gap * (bars - 1)) / bars);

      for (let i = 0; i < bars; i++) {
        let magnitude = 0.08;
        if (isPlaying && hasAnalyser) {
          const binIdx = Math.min(dataRef.current.length - 1, Math.floor((i / bars) * 32));
          magnitude = Math.max(0.08, dataRef.current[binIdx] / 255);
        } else if (isPlaying) {
          magnitude = 0.18 + 0.35 * Math.abs(Math.sin(Date.now() * 0.004 + i * 0.55));
        }

        const barH = Math.max(3, magnitude * (h - 2));
        const x = i * (barWidth + gap);
        const y = h - barH;

        ctx.fillStyle = color;
        ctx.globalAlpha = isPlaying ? 0.45 + magnitude * 0.55 : 0.25;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (isPlaying) {
        rafId = requestAnimationFrame(render);
      }
    };

    render();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, bars, color, getFrequencyData]);

  return (
    <canvas
      ref={canvasRef}
      width={bars * 5}
      height={height}
      aria-hidden="true"
      className={className}
    />
  );
}
