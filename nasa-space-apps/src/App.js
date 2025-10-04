import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ThreeDemo from './ThreeDemo';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/ThreeDemo" element={<ThreeDemo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
