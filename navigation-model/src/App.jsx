import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-darkbg)] text-white overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;