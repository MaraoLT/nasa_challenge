import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/nav.css';

export default function IntroSlide({ topLeft = 'First, calm down. There\'s no need to worry! For now, at least. Every year, several PHAs (Potentially Hazardous Asteroids) and NEOs (Near-Earth Objects) are detected by state-of-the-art technology.', bottomRight = 'Here on Earth, we like to overly cautious. An asteroid or comet is considered "near" when it approaches our planet less than 1.3 times the distance from Earth to Sun. Thus, most of them aren\'t really a danger.' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, sans-serif',
    }}>
      <div style={{
        position: 'absolute',
        top: 20,
        left: 24,
        fontSize: 'clamp(16px, 2.4vw, 24px)',
        opacity: 0.95,
        maxWidth: 'min(70ch, 46vw)',
        padding: '12px 16px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 0 10px rgba(255,255,255,0.08)',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.45,
        background: 'transparent',
      }}>
        {topLeft}
      </div>

      <div style={{
        position: 'absolute',
        right: 24,
        bottom: 20,
        fontSize: 'clamp(16px, 2.4vw, 24px)',
        opacity: 0.95,
        textAlign: 'right',
        maxWidth: 'min(70ch, 46vw)',
        padding: '12px 16px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 0 10px rgba(255,255,255,0.08)',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.45,
        background: 'transparent',
      }}>
        {bottomRight}
      </div>

      {/* SpaceBodies-like nav arrows */}
      <Link to="/home" className="sb-nav__btn left" aria-label="Back">‹</Link>
      <Link to="/cards" className="sb-nav__btn right" aria-label="Next">›</Link>
    </div>
  );
}
