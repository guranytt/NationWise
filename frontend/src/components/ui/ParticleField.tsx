import React, { useEffect, useRef } from 'react';

export interface ParticleFieldProps {
  className?: string;
  particleCount?: number;
  color?: string;
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseOpacity: number;
  color: string;

  constructor(canvasWidth: number, canvasHeight: number, color: string) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * 0.5; // Slight horizontal drift
    this.vy = -Math.random() * 0.5 - 0.2; // Slow upward movement
    this.radius = Math.random() * 2 + 1;
    this.baseOpacity = Math.random() * 0.3 + 0.1;
    this.color = color;
  }

  update(canvasWidth: number, canvasHeight: number) {
    this.x += this.vx;
    this.y += this.vy;

    // Wrap around horizontally
    if (this.x < 0) this.x = canvasWidth;
    if (this.x > canvasWidth) this.x = 0;

    // Respawn at bottom when it goes above top
    if (this.y < -this.radius) {
      this.y = canvasHeight + this.radius;
      this.x = Math.random() * canvasWidth;
    }
  }

  draw(ctx: CanvasRenderingContext2D, canvasHeight: number) {
    // Fade out at the top (top 20% of canvas)
    let opacity = this.baseOpacity;
    const fadeThreshold = canvasHeight * 0.2;
    if (this.y < fadeThreshold) {
      opacity = Math.max(0, this.baseOpacity * (this.y / fadeThreshold));
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.hexToRgba(this.color, opacity);
    ctx.fill();
  }

  hexToRgba(hex: string, alpha: number): string {
    // Basic hex to rgba conversion
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Parse hex values
    let r = 5;
    let g = 150;
    let b = 105;
    
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    
    // Fallback if parsing fails
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      r = 5; g = 150; b = 105;
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

const ParticleField: React.FC<ParticleFieldProps> = ({
  className = '',
  particleCount = 50,
  color = '#059669',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return; // Do not animate
    }

    let animationFrameId: number;
    let particles: Particle[] = [];

    const initParticles = () => {
      particles = [];
      const { width, height } = canvas;
      
      // Adjust count based on screen width
      const isMobile = window.innerWidth < 768;
      const count = isMobile ? Math.floor(particleCount / 2) : particleCount;

      for (let i = 0; i < count; i++) {
        particles.push(new Particle(width, height, color));
      }
    };

    const resizeCanvas = () => {
      // Set actual size in memory based on parent element
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      initParticles();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawLines = () => {
      const { height } = canvas;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            // Fade out at top for lines too
            const avgY = (particles[i].y + particles[j].y) / 2;
            let lineOpacity = 1 - (distance / 120);
            
            const fadeThreshold = height * 0.2;
            if (avgY < fadeThreshold) {
              lineOpacity *= Math.max(0, avgY / fadeThreshold);
            }
            
            // Limit max opacity
            lineOpacity *= 0.15; 
            
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[0].hexToRgba(color, lineOpacity);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx, canvas.height);
      });
      
      drawLines();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default ParticleField;
