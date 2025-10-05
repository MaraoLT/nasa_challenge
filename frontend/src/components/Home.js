import React from 'react';
import LPMeteor from './lpmeteor';
import { Link } from 'react-router-dom';
import musicManager from '../utils/MusicManager';
import audioContextManager from '../utils/AudioContextManager';


export default function Home() {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = React.useCallback((e) => {
    const { innerWidth: w, innerHeight: h } = window;
    const x = ((e.clientX / w) - 0.5) * 2;
    const y = ((e.clientY / h) - 0.5) * 2;
    setOffset({ x, y });
  }, []);

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

  const translate = (m) => `translate3d(${offset.x * m}px, ${offset.y * m}px, 0)`;

  return (  
    <div className="scene fade-in" style={{
    }} onMouseMove={handleMouseMove}>
      {/* Parallax layers */}
      <div className="" style={{ transform: translate(5) }} />
      <div className="layer layer-far" style={{ 
      backgroundImage: "url('/earth_landing_page.jpg')",
        backgroundSize: "cover",      // cobre toda a área
        backgroundPosition: "center", // centraliza a imagem
        backgroundRepeat: "no-repeat", transform: translate(10) }} />

      {/* Content */}
      <LPMeteor />
      <div className="content">
        <h1>Welcome to the space experience</h1>
        <Link to="/ThreeDemo" className="cta">Open 3D Model</Link>
        <Link to="/blueprint" className="cta">Open Blueprint</Link>
        <Link to="/space-bodies" className="cta">Comet × Asteroid × Meteor (3D)</Link>
        <Link to="/more-data" className="cta">More data (counters)</Link>
        <Link to="/meteor-impact-simulator" className="cta">Meteor Impact Simulator</Link>
      </div>
    </div>
  );
}