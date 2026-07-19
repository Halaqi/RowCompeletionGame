import { socket } from '../socket';
import { CheckCircle2, MessageSquare, Flag } from 'lucide-react';

export default function Review({ room, isArabic }) {
  const isReady = room.round.readyPlayers?.includes(socket.id);
  const currentPlayer = room.players.find(p => p.id === socket.id);
  const isHost = currentPlayer?.isHost;
  const myScores = room.round.scores[socket.id];
  
  const handleEditScore = (column, newPoints) => {
    socket.emit('editScore', { roomId: room.id, column, points: newPoints });
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
        {isArabic 
          ? 'ناقش الإجابات مع المضيف. تم حساب النقاط تلقائياً (10 للفريدة، 5 للمكررة). يمكنك تعديل نقاطك إذا كانت إجابتك خاطئة.' 
          : 'Discuss answers with the host. Points were auto-calculated (10 for unique, 5 for duplicate). You can edit your points if your answer was invalid.'}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
        {room.players.map(player => {
          const isMe = player.id === socket.id;
          const playerScores = room.round.scores[player.id];
          const totalPoints = playerScores 
            ? Object.values(playerScores).reduce((sum, item) => sum + item.points, 0)
            : 0;

          return (
            <div key={player.id} className="glass-panel" style={{ 
              border: isMe ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)'
            }}>
              <div className="flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>
                  {player.name} {isMe && (isArabic ? '(أنت)' : '(You)')}
                  {room.round.readyPlayers?.includes(player.id) && (
                    <CheckCircle2 size={20} color="var(--success-color)" style={{ verticalAlign: 'middle', margin: '0 0.5rem' }} />
                  )}
                </h3>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {totalPoints} {isArabic ? 'نقطة' : 'pts'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                {allColumns.map(col => {
                  const item = playerScores?.[col] || { answer: '', points: 0 };
                  
                  return (
                    <div key={col} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{col}</div>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', minHeight: '1.5rem' }}>
                        {item.answer || (isArabic ? '--- فارغ ---' : '--- empty ---')}
                      </div>
                      
                      {isMe && !isReady ? (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {[0, 5, 10].map(pt => (
                            <button
                              key={pt}
                              onClick={() => handleEditScore(col, pt)}
                              style={{
                                flex: 1,
                                padding: '0.25rem',
                                border: 'none',
                                borderRadius: '4px',
                                background: item.points === pt ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                            >
                              {pt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          color: item.points === 10 ? 'var(--success-color)' : item.points === 5 ? 'var(--secondary-color)' : 'var(--danger-color)',
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
        })}
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
