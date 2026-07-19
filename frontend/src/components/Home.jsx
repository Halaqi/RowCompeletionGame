import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socket } from '../socket';
import { Gamepad2, Users, ArrowRight, HelpCircle, X } from 'lucide-react';

export default function Home({ isArabic }) {
  const [searchParams] = useSearchParams();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(searchParams.get('room') || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError(isArabic ? 'الرجاء إدخال اسمك' : 'Please enter your name');
      return;
    }
    
    setIsLoading(true);
    socket.emit('createRoom', { playerName }, (response) => {
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div className="flex-center" style={{ background: 'var(--primary-color)', color: '#0a0e1a', borderRadius: '50%', width: '40px', height: '40px', flexShrink: 0, fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}>1</div>
                <div>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{isArabic ? 'إعداد الغرفة' : 'Room Setup'}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {isArabic 
                      ? 'يقوم المضيف بإنشاء غرفة وضبط وقت الجولة وإضافة أعمدة مخصصة (اختياري). ثم يشارك الرمز مع الأصدقاء للانضمام.' 
                      : 'The host creates a room, sets the round time limit, and adds any custom categories. Share the code with friends to join!'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div className="flex-center" style={{ background: 'var(--primary-color)', color: '#0a0e1a', borderRadius: '50%', width: '40px', height: '40px', flexShrink: 0, fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}>2</div>
                <div>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{isArabic ? 'اختيار الحرف' : 'Select a Letter'}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {isArabic 
                      ? 'عند بدء اللعبة، يختار أحد اللاعبين حرفاً لتبدأ الجولة به.' 
                      : 'When the game starts, one player selects a letter for the round to begin.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div className="flex-center" style={{ background: 'var(--primary-color)', color: '#0a0e1a', borderRadius: '50%', width: '40px', height: '40px', flexShrink: 0, fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}>3</div>
                <div>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{isArabic ? 'السباق مع الزمن' : 'Race Against Time'}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {isArabic 
                      ? 'يجب على جميع اللاعبين كتابة كلمات تبدأ بالحرف المختار لكل عمود (اسم، حيوان، نبات...) قبل انتهاء الوقت!' 
                      : 'All players race to type words starting with the chosen letter for every column (Name, Animal, Plant...) before the timer runs out!'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div className="flex-center" style={{ background: 'var(--primary-color)', color: '#0a0e1a', borderRadius: '50%', width: '40px', height: '40px', flexShrink: 0, fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}>4</div>
                <div>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>{isArabic ? 'المراجعة والنقاط' : 'Review & Scoring'}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {isArabic 
                      ? 'بعد كل جولة، يراجع المضيف الإجابات ويعدل النقاط إذا لزم الأمر. الإجابة الفريدة = 10 نقاط، الإجابة المكررة = 5 نقاط.' 
                      : 'After each round, the host reviews the answers and can edit points. Unique answer = 10 pts, duplicate answer = 5 pts.'}
                  </p>
                </div>
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
