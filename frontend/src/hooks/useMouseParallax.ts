import { useState, useEffect } from 'react';

export interface ParallaxOffset {
  x: number;
  y: number;
  isSupported: boolean;
}

export function useMouseParallax(intensity = 1): ParallaxOffset {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check prefers-reduced-motion or mobile touch device
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileWidth = window.innerWidth < 768;

    if (prefersReducedMotion || isTouchDevice || isMobileWidth) {
      setIsSupported(false);
      return;
    }

    let requestID: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalized between -1 and 1
      targetX = ((e.clientX / innerWidth) - 0.5) * 2 * intensity;
      targetY = ((e.clientY / innerHeight) - 0.5) * 2 * intensity;
    };

    const updateParallax = () => {
      // Linear interpolation for silky smooth movement
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      setOffset({
        x: Number(currentX.toFixed(4)),
        y: Number(currentY.toFixed(4)),
      });

      requestID = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove);
    requestID = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestID);
    };
  }, [intensity]);

  return { ...offset, isSupported };
}
