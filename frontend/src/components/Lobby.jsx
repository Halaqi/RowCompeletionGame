import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { socket, playerId } from '../socket';
import { Users, Clock, Plus, Play, Copy, CheckCircle2, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Game from './Game';
import Review from './Review';
import Scoreboard from './Scoreboard';

export default function Lobby({ isArabic }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(location.state?.room || null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  const standardColumns = room?.settings?.standardColumns || (isArabic 
    ? ['اسم', 'حيوان', 'نبات', 'جماد', 'بلاد/عاصمة'] 
    : ['Name', 'Animal', 'Plant', 'Object', 'Country/Capital']);

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }

    // We expect the room state to be populated if we joined from Home
    // If not, we might need to emit a join event again or redirect
    socket.on('roomUpdated', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    // Rejoin the room silently in case this was a page refresh
    if (socket.connected) {
      socket.emit('rejoinRoom', { roomId });
    } else {
      socket.on('connect', () => {
        socket.emit('rejoinRoom', { roomId });
      });
    }

    return () => {
      socket.off('roomUpdated');
      socket.off('connect');
    };
  }, []);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!room) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh' }}>
        <div className="glass-panel text-center">
          <h2 className="animate-pulse">{isArabic ? 'جاري التحميل...' : 'Loading...'}</h2>
        </div>
      </div>
    );
  }

  const currentPlayer = room.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost;

  const handleTimeChange = (e) => {
    if (isHost) {
      socket.emit('updateSettings', { 
        roomId, 
        settings: { timeLimit: parseInt(e.target.value) } 
      });
    }
  };

  const handleAddColumn = (e) => {
    e.preventDefault();
    if (isHost && newColumnName.trim()) {
      socket.emit('updateSettings', {
        roomId,
        settings: { customColumns: [...room.settings.customColumns, newColumnName.trim()] }
      });
      setNewColumnName('');
    }
  };

  const handleRemoveColumn = (indexToRemove) => {
    if (isHost) {
      socket.emit('updateSettings', {
        roomId,
        settings: { 
          customColumns: room.settings.customColumns.filter((_, i) => i !== indexToRemove) 
        }
      });
    }
  };

  const handleStartGame = () => {
    if (isHost) {
      socket.emit('startGame', { roomId });
    }
  };

  if (room.status === 'playing') {
    return <Game room={room} isArabic={isArabic} />;
  }

  if (room.status === 'reviewing') {
    return <Review room={room} isArabic={isArabic} />;
  }

  if (room.status === 'finished') {
    return <Scoreboard room={room} isArabic={isArabic} />;
  }

  return (
    <div className="lobby-container" style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      
      {/* Players Panel */}
      <div className="glass-panel fade-in-up">
        <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}><Users style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> 
            {isArabic ? 'اللاعبون' : 'Players'} ({room.players.length})
          </h2>
          <div className="flex-center" style={{ gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '20px' }}>
            <span style={{ fontWeight: 'bold', letterSpacing: '2px' }}>{roomId}</span>
            <button onClick={copyRoomCode} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title="Copy Code">
              {copied ? <CheckCircle2 size={18} color="var(--success-color)" /> : <Copy size={18} />}
            </button>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
            <button onClick={() => setShowQR(!showQR)} style={{ background: 'none', border: 'none', color: showQR ? 'var(--primary-color)' : 'white', cursor: 'pointer' }} title="Show QR Code">
              <QrCode size={18} />
            </button>
          </div>
        </div>

        {showQR && (
          <div className="flex-center fade-in" style={{ marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '12px' }}>
            <QRCodeCanvas 
              value={`${window.location.origin}/?room=${roomId}`} 
              size={150} 
              fgColor="#0f172a" 
              level="H" 
            />
          </div>
        )}

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {room.players.map((player, index) => (
            <li key={player.id} className="staggered-item" style={{ 
              animationDelay: `${index * 0.1}s`,
              padding: '1rem', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: player.isHost ? '4px solid var(--primary-color)' : 'none',
              borderRight: (isArabic && player.isHost) ? '4px solid var(--primary-color)' : 'none'
            }}>
              <span style={{ fontWeight: player.id === playerId ? 'bold' : 'normal' }}>
                {player.name} {player.id === playerId && (isArabic ? '(أنت)' : '(You)')}
              </span>
              {player.isHost && <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>{isArabic ? 'المضيف' : 'HOST'}</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Settings Panel */}
      <div className="glass-panel fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>{isArabic ? 'إعدادات الغرفة' : 'Room Settings'}</h2>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={20} />
            {isArabic ? 'وقت الجولة' : 'Round Time Limit'}
          </label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[20, 40, 60].map(time => (
              <button
                key={time}
                onClick={() => isHost && handleTimeChange({ target: { value: time } })}
                disabled={!isHost}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: room.settings.timeLimit === time ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)',
                  background: room.settings.timeLimit === time ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0,0,0,0.2)',
                  color: 'white',
                  cursor: isHost ? 'pointer' : 'default',
                  opacity: (!isHost && room.settings.timeLimit !== time) ? 0.5 : 1
                }}
              >
                {time}s
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              {isArabic ? 'الأعمدة الحالية:' : 'Current Columns:'}
            </label>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.5' }}>
              {isArabic 
                ? `الأعمدة الأساسية هي (${standardColumns.map(getLocalizedColumn).join('، ')}). إذا كنت ترغب في إضافة عمود جديد، يمكنك إضافته من هنا:`
                : `The standard columns are (${standardColumns.map(getLocalizedColumn).join(', ')}). If you wish to add a custom column, add it from here:`}
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {room.settings.customColumns.map((col, index) => (
              <div key={index} style={{ 
                background: 'rgba(255, 145, 0, 0.15)', 
                padding: '0.5rem 1rem', 
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid rgba(255, 145, 0, 0.4)'
              }}>
                {col}
                {isHost && (
                  <button onClick={() => handleRemoveColumn(index)} style={{ background: 'none', border: 'none', color: '#ff9100', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>
                    &times;
                  </button>
                )}
              </div>
            ))}
            {room.settings.customColumns.length === 0 && (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {isArabic ? 'لا توجد أعمدة إضافية' : 'No custom columns added'}
              </span>
            )}
          </div>
          
          {isHost && (
            <form onSubmit={handleAddColumn} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder={isArabic ? 'اسم العمود...' : 'Column name...'}
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-secondary" style={{ padding: '0 1rem' }}>
                <Plus size={20} />
              </button>
            </form>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {isHost ? (
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={handleStartGame}>
              <Play size={24} />
              {isArabic ? 'بدء اللعبة' : 'Start Game'}
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
              <span className="animate-pulse">
                {isArabic ? 'في انتظار المضيف لبدء اللعبة...' : 'Waiting for host to start the game...'}
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
