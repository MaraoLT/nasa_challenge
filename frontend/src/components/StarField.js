import React, { useEffect, useRef } from 'react';

export default function StarField({ count = 120 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = Math.max(1, window.devicePixelRatio || 1);

    const stars = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < Math.max(100, count); i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 0.8 + Math.random() * 2.2; // 0.8..3 px
        const speed = 0.008 + Math.random() * 0.02; // twinkle speed
        const phase = Math.random() * Math.PI * 2; // random phase
        const baseAlpha = 0.6 + Math.random() * 0.35; // base brightness
        stars.push({ x, y, size, speed, phase, baseAlpha });
      }
    };

    const draw = (t) => {
      ctx.clearRect(0, 0, width, height);
      // solid black background is handled by page; just draw stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase); // 0..1
        const alpha = Math.min(1, Math.max(0, s.baseAlpha * (0.85 + 0.3 * tw)));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    const start = () => {
      resize();
      initStars();
      rafRef.current = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    start();
    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        background: 'transparent'
      }}
    />
  );
}
