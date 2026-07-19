import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Globe } from 'lucide-react';
import Home from './components/Home';
import Lobby from './components/Lobby';

function App() {
  const [isArabic, setIsArabic] = useState(true);

  useEffect(() => {
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = isArabic ? 'ar' : 'en';
  }, [isArabic]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: isArabic ? 'flex-start' : 'flex-end', marginBottom: '2rem' }}>
          <button 
            className="modern-lang-btn"
            onClick={() => setIsArabic(!isArabic)}
          >
            <Globe size={18} />
            <span>{isArabic ? 'English' : 'عربي'}</span>
          </button>
        </div>

        <Routes>
          <Route path="/" element={<Home isArabic={isArabic} />} />
          <Route path="/room/:roomId" element={<Lobby isArabic={isArabic} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
