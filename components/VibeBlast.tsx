
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface VibeBlastProps {
  trigger: number; // Increment to trigger
  color: string;
  intensity: 'LOW' | 'MED' | 'HIGH';
}

export const VibeBlast: React.FC<VibeBlastProps> = ({ trigger, color, intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const requestRef = useRef<number>();

  const createBlast = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const count = intensity === 'HIGH' ? 100 : intensity === 'MED' ? 50 : 20;
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (intensity === 'HIGH' ? 15 : 8) + 2;
      particles.current.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  };

  useEffect(() => {
    if (trigger > 0) createBlast();
  }, [trigger]);

  // Fixed: Removed unused 'time' parameter to fix "Expected 1 arguments, but got 0" errors
  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.current = particles.current.filter(p => p.life > 0);
    
    particles.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.vy += 0.1; // Gravity effect

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-50"
      width={window.innerWidth} 
      height={window.innerHeight}
    />
  );
};
