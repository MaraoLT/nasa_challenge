import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ThreeDemo from './ThreeDemo';
import Home from './components/Home';
import TerminalLanding from './components/TerminalLanding';
import Page1 from './components/page1';
import BlueprintPage from './components/BlueprintPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TerminalLanding />} />
        <Route path="/home" element={<Home />} />
        <Route path="/ThreeDemo" element={<ThreeDemo />} />
        <Route path="/Page1" element={<Page1 />} />
        <Route path="/blueprint" element={<BlueprintPage />} />
      </Routes>
    </BrowserRouter>
  );
}
