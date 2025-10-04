import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ThreeDemo from './ThreeDemo';
import Page1 from './components/page1';
import BlueprintPage from './components/BlueprintPage';

function Home() {
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
      {/* Parallax layers */}
      <div className="layer layer-far" style={{ transform: translate(10) }} />
      <div className="layer layer-mid" style={{ transform: translate(20) }} />
      <div className="layer layer-near" style={{ transform: translate(35) }} />

      {/* Content */}
      <div className="content">
        <h1>Welcome to the space experience</h1>
        <Link to="/ThreeDemo" className="cta">Open 3D Model</Link>
        <Link to="/page1" className="cta">Open slides</Link>
        <Link to="/blueprint" className="cta">Blueprint page</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ThreeDemo" element={<ThreeDemo />} />
        <Route path="/page1" element={<Page1 />} />
        <Route path="/blueprint" element={<BlueprintPage />} />
      </Routes>
    </BrowserRouter>
  );
}
