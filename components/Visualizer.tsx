
import React, { useEffect, useRef } from 'react';
import { getAnalyserData } from '../services/audioService';

interface VisualizerProps {
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  // Fixed: Removed the unused 'time' parameter to resolve "Expected 1 arguments, but got 0" errors during requestAnimationFrame cycles
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frequencyData = getAnalyserData();
    
    // Clear with slight trail for motion blur effect
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!frequencyData || !isPlaying) {
        const bars = 16;
        const barWidth = (canvas.width / bars) - 2;
        
        for (let i = 0; i < bars; i++) {
             ctx.fillStyle = 'rgba(51, 65, 85, 0.4)';
             const h = 4;
             ctx.fillRect(i * (barWidth + 2), canvas.height - h, barWidth, h);
        }
        
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    const barCount = 16; 
    const step = Math.floor(frequencyData.length / barCount);
    const barWidth = (canvas.width / barCount) - 2;

    for (let i = 0; i < barCount; i++) {
        const dataIndex = i * step;
        const value = frequencyData[dataIndex]; 
        
        // Dynamic scaling
        let percent = (value + 90) / 60;
        percent = Math.max(0.1, Math.min(1, percent));
        
        const barHeight = percent * canvas.height;
        
        // Gradient creation - Dynamic colors based on height
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        if (percent > 0.8) {
            gradient.addColorStop(0, '#22c55e');
            gradient.addColorStop(0.6, '#facc15');
            gradient.addColorStop(1, '#ef4444');
        } else {
            gradient.addColorStop(0, '#15803d');
            gradient.addColorStop(0.5, '#22c55e');
            gradient.addColorStop(1, '#84cc16');
        }
        
        ctx.fillStyle = gradient;
        
        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;
        
        // Bloom/Glow effect for peaks
        if (percent > 0.6) {
            ctx.shadowBlur = 15 * percent;
            ctx.shadowColor = percent > 0.8 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)';
        } else {
            ctx.shadowBlur = 0;
        }
        
        // Rounded bars
        ctx.beginPath();
        const radius = 3;
        if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth, barHeight, radius);
        } else {
            ctx.fillRect(x, y, barWidth, barHeight);
        }
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  return (
    <canvas 
        ref={canvasRef}
        width={300} 
        height={40} 
        className="w-32 md:w-64 h-10 bg-black/40 rounded-xl border border-slate-700/50 shadow-inner backdrop-blur-sm"
    />
  );
};
