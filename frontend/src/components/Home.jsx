import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socket } from '../socket';
import { Gamepad2, Users, ArrowRight, HelpCircle, X, Settings, Type, Timer, Trophy, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function Home({ isArabic }) {
  const [searchParams] = useSearchParams();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(searchParams.get('room') || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let html5QrCode = null;
    
    if (showScanner) {
      html5QrCode = new Html5Qrcode("qr-reader");
      
      html5QrCode.start(
        { facingMode: "environment" }, // Force rear camera
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          let code = decodedText;
          try {
            const url = new URL(decodedText);
            // 1. Check for ?room=XYZ
            const roomParam = url.searchParams.get('room') || url.searchParams.get('ROOM');
            if (roomParam) {
              code = roomParam;
            } else {
              // 2. Fallback to /room/XYZ
              const parts = url.pathname.split('/').filter(Boolean);
              if (parts.length > 0) {
                code = parts[parts.length - 1];
              }
            }
          } catch (e) {
            // Not a valid URL, just use the raw text
          }
          setRoomCode(code.toUpperCase());
          setShowScanner(false);
        },
        (errorMessage) => {
          // ignore continuous scanning errors
        }
      ).catch((err) => {
        console.error("Failed to start scanner:", err);
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.error(e));
      }
    };
  }, [showScanner]);
  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError(isArabic ? 'الرجاء إدخال اسمك' : 'Please enter your name');
      return;
    }
    
    setIsLoading(true);
    socket.emit('createRoom', { playerName, isArabic }, (response) => {
      setIsLoading(false);
      if (response.success) {
        navigate(`/room/${response.roomId}`, { state: { room: response.roomState } });
      } else {
        setError(response.message);
      }
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) {
      setError(isArabic ? 'الرجاء إدخال اسمك ورمز الغرفة' : 'Please enter your name and room code');
      return;
    }

    setIsLoading(true);
    socket.emit('joinRoom', { roomId: roomCode.toUpperCase(), playerName }, (response) => {
      setIsLoading(false);
      if (response.success) {
        navigate(`/room/${roomCode.toUpperCase()}`, { state: { room: response.roomState } });
      } else {
        setError(response.message || (isArabic ? 'الغرفة غير موجودة' : 'Room not found'));
      }
    });
  };

  return (
    <div className="home-container flex-center" style={{ minHeight: '80vh' }}>
      <div className="glass-panel" style={{ maxWidth: '500px', width: '100%' }}>
        <h1 className="gradient-text">
          <Gamepad2 size={48} style={{ display: 'block', margin: '0 auto 1rem' }} />
          {isArabic ? 'اكمل الصف' : 'RowComplete'}
        </h1>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            {isArabic ? 'اسم اللاعب' : 'Player Name'}
          </label>
          <input 
            type="text" 
            className="input-field" 
            placeholder={isArabic ? 'أدخل اسمك هنا...' : 'Enter your name...'}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}
            onClick={handleCreateRoom}
            disabled={isLoading}
          >
            <Users size={24} />
            {isArabic ? 'إنشاء غرفة جديدة' : 'Create New Room'}
          </button>
          
          <div className="flex-center" style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ padding: '0 1rem' }}>{isArabic ? 'أو' : 'OR'}</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder={isArabic ? 'رمز الغرفة...' : 'Room Code...'}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              style={{ flex: 2, textTransform: 'uppercase' }}
            />
            <button 
              className="btn" 
              style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: 'white', borderRadius: '12px' }}
              onClick={() => setShowScanner(true)}
              title={isArabic ? 'مسح رمز QR' : 'Scan QR Code'}
            >
              <Camera size={20} />
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={handleJoinRoom}
              disabled={isLoading}
            >
              {isArabic ? 'انضمام' : 'Join'} <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            onClick={() => setShowGuide(true)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              transition: 'color 0.2s',
              fontFamily: 'inherit'
            }}
            onMouseOver={(e) => e.target.style.color = 'var(--primary-color)'}
            onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
          >
            <HelpCircle size={20} />
            {isArabic ? 'كيف تلعب؟' : 'How to Play'}
          </button>
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isArabic ? 'بناء وتطوير المهندس: ' : 'Built and developed by Eng. '}
          <a 
            href="https://www.abdulrahmanalhalqi.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}
          >
            {isArabic ? 'عبد الرحمن الحلقي' : 'ABDULRAHMAN ALHALQI'}
          </a>
        </div>
      </div>

      {showScanner && (
        <div 
          className="fade-in"
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(10, 14, 26, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowScanner(false)}
        >
          <div 
            className="glass-panel fade-in-up" 
            style={{ 
              maxWidth: '450px', 
              width: '90%', 
              position: 'relative',
              padding: '1.5rem',
              background: 'white' // html5-qrcode works best on white background
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowScanner(false)}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                background: 'var(--danger-color)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <X size={20} />
            </button>
            
            <h3 style={{ textAlign: 'center', color: '#1e1e2e', marginBottom: '1rem' }}>
              {isArabic ? 'قم بمسح رمز الغرفة' : 'Scan Room QR Code'}
            </h3>
            
            <div id="qr-reader" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}

      {showGuide && (
        <div 
          className="flex-center fade-in" 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 100,
            padding: '1rem'
          }}
          onClick={() => setShowGuide(false)}
        >
          <div 
            className="glass-panel" 
            style={{ 
              maxWidth: '600px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              position: 'relative',
              padding: '2.5rem'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowGuide(false)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            >
              <X size={20} />
            </button>
            
            <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2rem' }}>
              {isArabic ? 'كيف تلعب؟' : 'How to Play'}
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              
              {/* Step 1 */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                <div style={{ position: 'absolute', top: '-10px', right: isArabic ? 'auto' : '-10px', left: isArabic ? '-10px' : 'auto', opacity: 0.05, transform: 'scale(2.5)' }}>
                  <Settings size={100} />
                </div>
                <div className="flex-center" style={{ background: 'var(--primary-color)', color: '#0a0e1a', borderRadius: '12px', width: '48px', height: '48px', marginBottom: '1rem', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)' }}>
                  <Settings size={24} />
                </div>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.75rem', fontSize: '1.2rem' }}>1. {isArabic ? 'إعداد الغرفة' : 'Room Setup'}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
                  {isArabic 
                    ? 'يقوم المضيف بإنشاء غرفة وضبط وقت الجولة وإضافة أعمدة مخصصة (اختياري). ثم يشارك الرمز مع الأصدقاء.' 
                    : 'The host creates a room, sets the round time limit, and adds any custom categories. Share the code with friends!'}
                </p>
              </div>

              {/* Step 2 */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                <div style={{ position: 'absolute', top: '-10px', right: isArabic ? 'auto' : '-10px', left: isArabic ? '-10px' : 'auto', opacity: 0.05, transform: 'scale(2.5)' }}>
                  <Type size={100} />
                </div>
                <div className="flex-center" style={{ background: 'var(--secondary-color)', color: '#0a0e1a', borderRadius: '12px', width: '48px', height: '48px', marginBottom: '1rem', boxShadow: '0 4px 15px rgba(255, 145, 0, 0.3)' }}>
                  <Type size={24} />
                </div>
                <h3 style={{ color: 'var(--secondary-color)', marginBottom: '0.75rem', fontSize: '1.2rem' }}>2. {isArabic ? 'اختيار الحرف' : 'Select a Letter'}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
                  {isArabic 
                    ? 'عند بدء اللعبة، يختار أحد اللاعبين حرفاً عشوائياً لتبدأ الجولة به.' 
                    : 'When the game starts, one player selects a letter for the round to begin.'}
                </p>
              </div>

              {/* Step 3 */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                <div style={{ position: 'absolute', top: '-10px', right: isArabic ? 'auto' : '-10px', left: isArabic ? '-10px' : 'auto', opacity: 0.05, transform: 'scale(2.5)' }}>
                  <Timer size={100} />
                </div>
                <div className="flex-center" style={{ background: 'var(--primary-color)', color: '#0a0e1a', borderRadius: '12px', width: '48px', height: '48px', marginBottom: '1rem', boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)' }}>
                  <Timer size={24} />
                </div>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.75rem', fontSize: '1.2rem' }}>3. {isArabic ? 'السباق مع الزمن' : 'Race Against Time'}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
                  {isArabic 
                    ? 'تسابق مع البقية لكتابة كلمات تبدأ بالحرف المختار لكل عمود (اسم، حيوان، نبات...) قبل انتهاء الوقت!' 
                    : 'Race to type words starting with the chosen letter for every column (Name, Animal, Plant...) before the timer runs out!'}
                </p>
              </div>

              {/* Step 4 */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
                <div style={{ position: 'absolute', top: '-10px', right: isArabic ? 'auto' : '-10px', left: isArabic ? '-10px' : 'auto', opacity: 0.05, transform: 'scale(2.5)' }}>
                  <Trophy size={100} />
                </div>
                <div className="flex-center" style={{ background: 'var(--secondary-color)', color: '#0a0e1a', borderRadius: '12px', width: '48px', height: '48px', marginBottom: '1rem', boxShadow: '0 4px 15px rgba(255, 145, 0, 0.3)' }}>
                  <Trophy size={24} />
                </div>
                <h3 style={{ color: 'var(--secondary-color)', marginBottom: '0.75rem', fontSize: '1.2rem' }}>4. {isArabic ? 'المراجعة والنقاط' : 'Review & Scoring'}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
                  {isArabic 
                    ? 'يراجع المضيف الإجابات ويعدل النقاط إذا لزم الأمر. إجابة فريدة = 10 نقاط، إجابة مكررة = 5 نقاط.' 
                    : 'The host reviews the answers and edits points. Unique answer = 10 pts, duplicate answer = 5 pts.'}
                </p>
              </div>

            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowGuide(false)} style={{ padding: '0.75rem 3rem' }}>
                {isArabic ? 'فهمت ذلك! لنلعب' : 'Got it! Let\'s Play'}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
