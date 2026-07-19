import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socket } from '../socket';
import { Gamepad2, Users, ArrowRight } from 'lucide-react';

export default function Home({ isArabic }) {
  const [searchParams] = useSearchParams();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(searchParams.get('room') || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    </div>
  );
}
