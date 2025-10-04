import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ThreeDemo from './ThreeDemo';
import Home from './components/Home';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ThreeDemo" element={<ThreeDemo />} />
      </Routes>
    </BrowserRouter>
  );
}
