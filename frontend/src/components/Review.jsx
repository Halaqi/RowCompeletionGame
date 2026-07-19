import { useState } from 'react';
import { socket, playerId } from '../socket';
import { CheckCircle2, MessageSquare, Flag } from 'lucide-react';

export default function Review({ room, isArabic }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(room.players[0]?.id);
  
  const isReady = room.round.readyPlayers?.includes(playerId);
  const currentPlayer = room.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost;
  
  const handleEditScore = (targetPlayerId, column, newPoints) => {
    socket.emit('editScore', { roomId: room.id, targetPlayerId, column, points: newPoints });
  };

  const handleReady = () => {
    socket.emit('playerReady', { roomId: room.id });
  };

  const handleEndGame = () => {
    if (confirm(isArabic ? 'هل أنت متأكد من إنهاء اللعبة؟' : 'Are you sure you want to end the game?')) {
      socket.emit('endGame', { roomId: room.id });
    }
  };

  // Group columns from the host's settings
  const standardColumns = isArabic 
    ? ['اسم', 'حيوان', 'نبات', 'جماد', 'بلاد/عاصمة'] 
    : ['Name', 'Animal', 'Plant', 'Object', 'Country/Capital'];
  const allColumns = [...standardColumns, ...room.settings.customColumns];

  return (
    <div style={{ padding: '2rem 0' }}>
      <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <MessageSquare size={32} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
        {isArabic ? 'وقت المراجعة!' : 'Review Time!'}
      </h2>
      
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        {isHost 
          ? (isArabic ? 'بصفتك المضيف، أنت وحدك من يمكنه تعديل نقاط اللاعبين إذا كانت إجاباتهم غير صحيحة.' : 'As the Host, only you can edit player points if their answers are invalid.')
          : (isArabic ? 'ناقش الإجابات مع المضيف لتعديل النقاط إذا لزم الأمر.' : 'Discuss answers with the Host to adjust points if necessary.')}
      </p>

      {/* Tab Bar */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', paddingBottom: '1rem', marginBottom: '2rem' }}>
        {room.players.map(player => (
          <button
            key={player.id}
            onClick={() => setSelectedPlayerId(player.id)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: selectedPlayerId === player.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
              color: selectedPlayerId === player.id ? '#0a0e1a' : 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            {player.name} {player.id === playerId && (isArabic ? '(أنت)' : '(You)')}
            {room.round.readyPlayers?.includes(player.id) && (
              <CheckCircle2 size={16} style={{ color: selectedPlayerId === player.id ? '#0a0e1a' : 'var(--success-color)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Selected Player Content */}
      <div style={{ marginBottom: '3rem' }}>
        {(() => {
          const player = room.players.find(p => p.id === selectedPlayerId) || room.players[0];
          if (!player) return null;
          
          const playerScores = room.round.scores[player.id];
          const totalPoints = playerScores 
            ? Object.values(playerScores).reduce((sum, item) => sum + item.points, 0)
            : 0;

          return (
            <div className="glass-panel fade-in" style={{ border: '1px solid rgba(168, 85, 247, 0.25)' }}>
              <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>
                  {isArabic ? `إجابات ${player.name}` : `${player.name}'s Answers`}
                </h3>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {totalPoints} {isArabic ? 'نقطة' : 'pts'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {allColumns.map(col => {
                  const item = playerScores?.[col] || { answer: '', points: 0 };
                  
                  return (
                    <div key={col} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{col}</div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', minHeight: '1.5rem', color: item.answer ? 'white' : 'var(--danger-color)' }}>
                        {item.answer || (isArabic ? '--- فارغ ---' : '--- empty ---')}
                      </div>
                      
                      {isHost && !isReady ? (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {[0, 5, 10].map(pt => (
                            <button
                              key={pt}
                              onClick={() => handleEditScore(player.id, col, pt)}
                              style={{
                                flex: 1,
                                padding: '0.25rem',
                                border: 'none',
                                borderRadius: '4px',
                                background: item.points === pt ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                                color: item.points === pt ? '#0a0e1a' : 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {pt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          color: item.points === 10 ? 'var(--success-color)' : item.points === 5 ? 'var(--primary-color)' : 'var(--danger-color)',
                          fontWeight: 'bold'
                        }}>
                          {item.points} {isArabic ? 'نقطة' : 'pts'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="flex-center" style={{ position: 'sticky', bottom: '2rem', gap: '1rem' }}>
        <button 
          className={`btn ${isReady ? 'btn-secondary' : 'btn-primary'}`} 
          onClick={handleReady}
          disabled={isReady}
          style={{ padding: '1rem 3rem', fontSize: '1.2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
        >
          {isReady 
            ? (isArabic ? 'في انتظار الباقين...' : 'Waiting for others...') 
            : (isArabic ? 'موافق ومستعد' : 'Okay, I am ready!')}
        </button>

        {isHost && (
          <button 
            className="btn" 
            onClick={handleEndGame}
            style={{ padding: '1rem 2rem', fontSize: '1.2rem', background: 'var(--danger-color)', color: 'white', border: 'none' }}
          >
            <Flag size={20} />
            {isArabic ? 'إنهاء اللعبة' : 'End Game'}
          </button>
        )}
      </div>
    </div>
  );
}
