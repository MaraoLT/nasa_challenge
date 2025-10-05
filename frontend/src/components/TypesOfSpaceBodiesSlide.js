import React from 'react';
import { Link } from 'react-router-dom';
import musicManager from '../utils/MusicManager';
import audioContextManager from '../utils/AudioContextManager';
import '../styles/nav.css';

export default function TypesOfSpaceBodiesSlide() {
  // Start music when component mounts
  React.useEffect(() => {
    // Initialize audio context manager
    audioContextManager.init();
    
    const playResult = musicManager.playTrack('/resources/sounds/Eternal Horizon.mp3', true);
    if (!playResult) {
      console.log('Music will play after user interaction');
    }
    
    return () => {
      // Fade out music when leaving the component
      musicManager.fadeOut(500);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0 24px',
      fontFamily: "'Share Tech Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    }}>
      <div style={{
        width: '50%',
        margin: '0 auto',
      }}>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 88px)',
          letterSpacing: '0.5px',
          lineHeight: 1.15,
          margin: 0,
          textShadow: '0 0 24px rgba(0, 255, 200, 0.15), 0 0 8px rgba(255,255,255,0.15)'
        }}>
          What are the types of space bodies?
        </h1>
      </div>

      {/* Nav arrows consistent with SpaceBodies/Intro */}
      <Link to="/intro" className="sb-nav__btn left" aria-label="Back">‹</Link>
      <Link to="/space-bodies" className="sb-nav__btn right" aria-label="Next">›</Link>
    </div>
  );
}
