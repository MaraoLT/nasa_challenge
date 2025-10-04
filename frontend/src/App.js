import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ThreeDemo from './ThreeDemo';
import Home from './components/Home';
import TerminalLanding from './components/TerminalLanding';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TerminalLanding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/ThreeDemo" element={<ThreeDemo />} />
      </Routes>
    </BrowserRouter>
  );
}
