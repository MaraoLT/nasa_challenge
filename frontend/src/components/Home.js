import React from 'react';
import { Link } from 'react-router-dom';
import musicManager from '../utils/MusicManager';
import audioContextManager from '../utils/AudioContextManager';
import MovingBalls from './lpmeteor';
import StarField from './StarField';
import '../styles/home.css';


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
    <div className="space-home-container" onMouseMove={handleMouseMove}>
      {/* Background layers with parallax */}
      <div className="background-layer" style={{ transform: translate(2) }}>
        <div className="stars-layer"><StarField count={140} /></div>
        <div className="dust-layer"></div>
      </div>
      
      {/* Falling meteors layer */}
      <div className="meteors-layer" style={{ transform: translate(1.5) }}>
        <MovingBalls />
      </div>
      
      {/* Main Interface */}
      <div className="main-interface" style={{ transform: translate(1) }}>
        <div className="home-content">
          {/* Title */}
          <h1 className="main-title">BEWARE OF THE ROCKS</h1>
          <p className="main-subtitle">The ultimate training in space objects.</p>
          
          {/* Scanner-styled console wrapping buttons */}
          <div className="home-console">
              <div className="home-console__screen">
                {/* Primary action on its own row */}
                <div className="primary-action">
                  <Link to="/intro" className="main-action-btn">TRAINING COURSE</Link>
                </div>

                {/* Divider with centered label */}
                <div className="home-divider"><span>Simulations</span></div>

                {/* Trainings row: two buttons side-by-side */}
                <div className="trainings-row">
                  <Link to="/meteor-impact-simulator" className="main-action-btn">EARTH IMPACT</Link>
                  <Link to="/ThreeDemo" className="main-action-btn">EARTH ORBIT</Link>
                </div>
              </div>
          </div>
        </div>
        
        {/* Credits Button */}
        <Link to="/credits" className="credits-btn">CREDITS</Link>
      </div>

      
    </div>
  );
}