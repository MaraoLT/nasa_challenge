import React from 'react';
import { Link } from 'react-router-dom';
import musicManager from '../utils/MusicManager';
import audioContextManager from '../utils/AudioContextManager';
import MovingBalls from './lpmeteor';


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
        <div className="stars-layer"></div>
        <div className="dust-layer"></div>
      </div>
      
      {/* Falling meteors layer */}
      <div className="meteors-layer" style={{ transform: translate(1.5) }}>
        <MovingBalls />
      </div>
      
      {/* Main Interface */}
      <div className="main-interface" style={{ transform: translate(1) }}>
        {/* Title */}
        <h1 className="main-title">BEWARE OF THE ROCKS</h1>
        
        {/* Main Action Buttons */}
        <div className="action-buttons">
          <Link to="/space-bodies" className="main-action-btn">
            TRAINING COURSE
          </Link>
          
          <Link to="/meteor-impact-simulator" className="main-action-btn">
            EARTH IMPACT SIMULATION
          </Link>
          
          <Link to="/ThreeDemo" state={{ loadMeteors: false }} className="main-action-btn">
            EARTH ORBIT SIMULATION
          </Link>
        </div>
        
        {/* Credits Button */}
        <Link to="/credits" className="credits-btn">CREDITS</Link>
      </div>

      <style jsx>{`
        .space-home-container {
          width: 100vw;
          height: 100vh;
          background: #000000;
          position: relative;
          overflow: hidden;
          font-family: 'Arial', monospace;
          color: #ffffff;
        }

        .background-layer {
          position: absolute;
          width: 120%;
          height: 120%;
          top: -10%;
          left: -10%;
        }

        .meteors-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 5;
          pointer-events: auto;
        }

        .stars-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(2px 2px at 20px 30px, #ffffff, transparent),
            radial-gradient(1px 1px at 40px 70px, #ffffff, transparent),
            radial-gradient(1px 1px at 90px 40px, #ffffff, transparent),
            radial-gradient(2px 2px at 130px 80px, #ffffff, transparent),
            radial-gradient(1px 1px at 160px 30px, #ffffff, transparent),
            radial-gradient(1px 1px at 200px 120px, #ffffff, transparent),
            radial-gradient(2px 2px at 250px 60px, #ffffff, transparent),
            radial-gradient(1px 1px at 300px 90px, #ffffff, transparent);
          background-repeat: repeat;
          background-size: 350px 200px;
          animation: twinkle 4s infinite;
        }

        .dust-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 70% 30%, rgba(255,255,255,0.25), transparent),
            radial-gradient(1px 1px at 90% 80%, rgba(255,255,255,0.15), transparent),
            radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 20% 90%, rgba(255,255,255,0.3), transparent);
          background-repeat: repeat;
          background-size: 800px 600px;
          animation: floating-dust 15s linear infinite;
          opacity: 0.6;
        }

        .main-interface {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .main-title {
          font-size: 4rem;
          font-weight: bold;
          color: #ffffff;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          margin: 0 0 3rem 0;
          letter-spacing: 4px;
          text-align: center;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 3rem;
          align-items: center;
        }

        .main-action-btn {
          background: linear-gradient(135deg, #0080ff 0%, #0066cc 100%);
          border: 2px solid #0080ff;
          border-radius: 12px;
          padding: 1.5rem 3rem;
          text-decoration: none;
          color: #ffffff;
          font-size: 1.3rem;
          font-weight: bold;
          letter-spacing: 2px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          min-width: 400px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 128, 255, 0.3);
        }

        .main-action-btn:hover {
          background: linear-gradient(135deg, #0099ff 0%, #0080ff 100%);
          box-shadow: 0 6px 25px rgba(0, 128, 255, 0.5);
          transform: translateY(-3px);
        }

        .main-action-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
          transition: left 0.5s ease;
        }

        .main-action-btn:hover::before {
          left: 100%;
        }

        .credits-btn {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 0.8rem 1.5rem;
          color: #ffffff;
          text-decoration: none;
          font-size: 1rem;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .credits-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes floating-dust {
          0% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(10px) translateY(-5px); }
          50% { transform: translateX(-5px) translateY(-10px); }
          75% { transform: translateX(-10px) translateY(5px); }
          100% { transform: translateX(0) translateY(0); }
        }

        @media (max-width: 768px) {
          .main-title {
            font-size: 2.5rem;
            letter-spacing: 2px;
          }
          
          .main-action-btn {
            min-width: 300px;
            font-size: 1.1rem;
            padding: 1.2rem 2rem;
          }
          
          .credits-btn {
            bottom: 1rem;
            right: 1rem;
            font-size: 0.9rem;
            padding: 0.6rem 1.2rem;
          }
        }

        @media (max-width: 480px) {
          .main-title {
            font-size: 2rem;
          }
          
          .main-action-btn {
            min-width: 250px;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}