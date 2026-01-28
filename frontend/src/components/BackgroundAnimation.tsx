import { useEffect, useRef } from 'react';
import { MoodCategory } from '../backend';

interface BackgroundAnimationProps {
  mood: MoodCategory | null;
  intensity: number;
}

export default function BackgroundAnimation({ mood, intensity }: BackgroundAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = Math.floor(50 + (intensity / 100) * 50);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      canvasWidth: number;
      canvasHeight: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = Math.random() * this.canvasWidth;
        this.y = Math.random() * this.canvasHeight;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * (intensity / 50);
        this.speedY = (Math.random() - 0.5) * (intensity / 50);
        this.color = getMoodColor(mood, intensity);
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > this.canvasWidth) this.x = 0;
        if (this.x < 0) this.x = this.canvasWidth;
        if (this.y > this.canvasHeight) this.y = 0;
        if (this.y < 0) this.y = this.canvasHeight;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Update particle canvas dimensions
      particles.forEach(particle => {
        particle.canvasWidth = canvas.width;
        particle.canvasHeight = canvas.height;
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mood, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-30"
      style={{ zIndex: 0 }}
    />
  );
}

function getMoodColor(mood: MoodCategory | null, intensity: number): string {
  if (!mood) return `rgba(168, 85, 247, ${intensity / 200})`;

  const alpha = intensity / 200;
  const colorMap: Record<MoodCategory, string> = {
    [MoodCategory.happy]: `rgba(251, 191, 36, ${alpha})`,
    [MoodCategory.sad]: `rgba(96, 165, 250, ${alpha})`,
    [MoodCategory.energetic]: `rgba(248, 113, 113, ${alpha})`,
    [MoodCategory.calm]: `rgba(52, 211, 153, ${alpha})`,
    [MoodCategory.angry]: `rgba(239, 68, 68, ${alpha})`,
    [MoodCategory.romantic]: `rgba(236, 72, 153, ${alpha})`,
    [MoodCategory.focused]: `rgba(139, 92, 246, ${alpha})`,
  };

  return colorMap[mood] || `rgba(168, 85, 247, ${alpha})`;
}
