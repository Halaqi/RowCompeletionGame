import { socket, playerId } from '../socket';
import { CheckCircle2, MessageSquare, Flag } from 'lucide-react';

export default function Review({ room, isArabic }) {
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

  const getLocalizedColumn = (colName) => {
    const ar = ['اسم', 'حيوان', 'نبات', 'جماد', 'بلاد/عاصمة'];
    const en = ['Name', 'Animal', 'Plant', 'Object', 'Country/Capital'];
    if (isArabic) {
      const idx = en.indexOf(colName);
      if (idx !== -1) return ar[idx];
    } else {
      const idx = ar.indexOf(colName);
      if (idx !== -1) return en[idx];
    }
    return colName;
  };

  // Group columns from the host's settings
  const allColumns = [...(room.settings.standardColumns || []), ...room.settings.customColumns];

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

      {/* Table UI */}
      <div className="glass-panel fade-in" style={{ overflowX: 'auto', marginBottom: '3rem', padding: '1rem' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '1rem', borderBottom: '2px solid rgba(168, 85, 247, 0.3)', textAlign: isArabic ? 'right' : 'left', color: 'var(--text-secondary)' }}>
                {isArabic ? 'الفئة' : 'Category'}
              </th>
              {room.players.map(player => {
                const playerScores = room.round.scores[player.id];
                const totalPoints = playerScores 
                  ? Object.values(playerScores).reduce((sum, item) => sum + item.points, 0)
                  : 0;
                
                return (
                  <th key={player.id} style={{ padding: '1rem', borderBottom: '2px solid rgba(168, 85, 247, 0.3)', textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 'bold', color: player.id === playerId ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                        {player.name} {player.id === playerId && (isArabic ? '(أنت)' : '(You)')}
                      </span>
                      <span style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                        {totalPoints} {isArabic ? 'نقطة' : 'pts'}
                      </span>
                      {room.round.readyPlayers?.includes(player.id) && (
                        <CheckCircle2 size={16} style={{ color: 'var(--success-color)' }} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {allColumns.map(col => (
              <tr key={col} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                  {getLocalizedColumn(col)}
                </td>
                {room.players.map(player => {
                  const playerScores = room.round.scores[player.id];
                  const item = playerScores?.[col] || { answer: '', points: 0 };
                  
                  return (
                    <td key={player.id} style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: item.answer ? 'var(--text-primary)' : 'var(--danger-color)', wordBreak: 'break-word' }}>
                          {item.answer || (isArabic ? '--- فارغ ---' : '--- empty ---')}
                        </div>
                        
                        {isHost && !isReady ? (
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            {[0, 5, 10].map(pt => (
                              <button
                                key={pt}
                                onClick={() => handleEditScore(player.id, col, pt)}
                                style={{
                                  flex: 1,
                                  maxWidth: '40px',
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
                            fontWeight: 'bold',
                            marginTop: 'auto'
                          }}>
                            {item.points} {isArabic ? 'نقطة' : 'pts'}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
