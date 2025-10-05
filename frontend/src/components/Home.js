import React from 'react';
import LPMeteor from './lpmeteor';
import { Link } from 'react-router-dom';


export default function Home() {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = React.useCallback((e) => {
    const { innerWidth: w, innerHeight: h } = window;
    const x = ((e.clientX / w) - 0.5) * 2;
    const y = ((e.clientY / h) - 0.5) * 2;
    setOffset({ x, y });
  }, []);

  const translate = (m) => `translate3d(${offset.x * m}px, ${offset.y * m}px, 0)`;

  return (  
    <div className="scene" onMouseMove={handleMouseMove}>
      <div className="home-fade-layer fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        {/* Parallax layers */}
        <div className="" style={{ transform: translate(5) }} />
        <div className="layer layer-far" style={{ 
          backgroundImage: "url('/earth_landing_page.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat", transform: translate(10) }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem', zIndex: 2 }}>
          <LPMeteor />
          <div className="content">
            <h1>Welcome to the space experience</h1>
            <Link to="/ThreeDemo" className="cta">Open 3D Model</Link>
            <Link to="/blueprint" className="cta">Open Blueprint</Link>
            <Link to="/space-bodies" className="cta">Comet × Asteroid × Meteor (3D)</Link>
            <Link to="/more-data" className="cta">More data (counters)</Link>
            <Link to="/credits" className="cta secondary">Credits</Link>
             <Link to="/cards" className="cta">Draggable Cards</Link>
            <Link to="/intro" className="cta">Introduction Slide</Link>
          </div>
        </div>
      </div>
    </div>
  );
}