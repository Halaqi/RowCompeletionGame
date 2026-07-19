import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Globe, Sun, Moon } from 'lucide-react';
import Home from './components/Home';
import Lobby from './components/Lobby';

function App() {
  const [isArabic, setIsArabic] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = isArabic ? 'ar' : 'en';
  }, [isArabic]);

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: isArabic ? 'flex-start' : 'flex-end', marginBottom: '2rem', gap: '0.75rem' }}>
          <button 
            className="modern-lang-btn"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? (isArabic ? 'فاتح' : 'Light') : (isArabic ? 'داكن' : 'Dark')}</span>
          </button>
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
