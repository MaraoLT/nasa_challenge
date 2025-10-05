import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StarTransition() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, dpr = Math.max(1, window.devicePixelRatio || 1);

    // Initialize warp sound
    const initAudio = () => {
      const audio = new Audio('/resources/sounds/Warp Sound.wav');
      audio.preload = 'auto';
      audio.volume = 0.7; // Adjust volume as needed
      audioRef.current = audio;
      
      // Play the warp sound with a slight delay to sync with visual
      setTimeout(() => {
        audio.play().catch(e => {
          console.log('Audio play prevented:', e.message);
        });
      }, 500); // 500ms delay for better sync with star animation
    };

  const FADE_MS = 2000; // stars render in
  const ZOOM_MS = 2000; // longer zoom to go further before proceeding
    const TOTAL_MS = FADE_MS + ZOOM_MS;
    const STAR_COUNT = 80;

    const stars = [];
    const center = { x: 0, y: 0 };

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      width = innerWidth;
      height = innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      center.x = width / 2;
      center.y = height / 2;
    };

    const randRange = (min, max) => Math.random() * (max - min) + min;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeInCubic = (t) => t * t * t;

    // Initialize stars on first mount
    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const z = randRange(0.35, 1.0); // near -> lower z, moves faster
        const size = randRange(1.0, 3.0) * (1.2 - z * 0.6); // nearer -> bigger
        stars.push({
          x, y, z, size,
          baseX: x, baseY: y,
        });
      }
    };

    const draw = (tsStart) => (tsNow) => {
      const t = Math.max(0, tsNow - tsStart);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      // Phase 1: fade-in
      const fadeT = Math.min(1, t / FADE_MS);
      const fadeAlpha = easeOutCubic(fadeT);

      // Phase 2: zoom/outward travel with parallax
      const zoomPhase = Math.max(0, t - FADE_MS);
      const zoomT = Math.min(1, zoomPhase / ZOOM_MS);
      const zoomEase = easeInCubic(zoomT);
  const ZOOM_STRENGTH = 10.0; // stronger magnification for deeper zoom

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // radial vector from center
        const rx = s.baseX - center.x;
        const ry = s.baseY - center.y;
        // parallax: nearer (smaller z) moves more
        const parallax = (1 / s.z);
        const scale = 1 + ZOOM_STRENGTH * zoomEase * parallax;
        const px = center.x + rx * scale;
        const py = center.y + ry * scale;
        const starSize = Math.max(0.5, s.size * (1 + 0.8 * zoomEase * parallax));

        // Skip drawing if off-screen (minor optimization)
        if (px + starSize < 0 || px - starSize > width || py + starSize < 0 || py - starSize > height) {
          continue;
        }

        ctx.beginPath();
        ctx.arc(px, py, starSize, 0, Math.PI * 2);
        // alpha combines fade-in and a slight boost for nearer stars
        const a = Math.max(0, Math.min(1, fadeAlpha * (0.7 + 0.3 * parallax)));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }

      if (t < TOTAL_MS) {
        rafRef.current = requestAnimationFrame(draw(tsStart));
      } else {
        // Stop audio before navigating
        if (audioRef.current) {
          audioRef.current.pause();
        }
        // Done — navigate to home
        navigate('/home');
      }
    };

    const start = () => {
      resize();
      initStars();
      initAudio(); // Initialize and play warp sound
      const tsStart = performance.now();
      rafRef.current = requestAnimationFrame(draw(tsStart));
    };

    window.addEventListener('resize', resize);
    start();
    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Cleanup audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [navigate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        background: '#000'
      }}
    />
  );
}
