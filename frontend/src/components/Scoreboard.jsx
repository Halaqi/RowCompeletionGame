import { Trophy, Medal, Crown, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { socket, playerId } from '../socket';

export default function Scoreboard({ room, isArabic }) {
  const navigate = useNavigate();
  
  // Sort players by total score in descending order
  const sortedPlayers = [...room.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];
  const isHost = room.hostId === playerId;

  const handlePlayAgain = () => {
    socket.emit('playAgain', { roomId: room.id });
  };

  return (
    <div className="flex-center fade-in-up" style={{ minHeight: '80vh', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="glass-panel text-center pulse-glow" style={{ maxWidth: '600px', width: '100%', padding: '3rem 2rem' }}>
        <Crown size={80} color="var(--secondary-color)" style={{ marginBottom: '1rem' }} className="float" />
        
        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          {isArabic ? 'انتهت اللعبة!' : 'Game Over!'}
        </h1>
        
        <h2 style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
          {isArabic ? `الفائز هو ${winner.name}!` : `The winner is ${winner.name}!`}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sortedPlayers.map((player, index) => (
            <div key={player.id} className="staggered-item" style={{
              animationDelay: `${index * 0.15}s`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              background: index === 0 ? 'rgba(255, 145, 0, 0.15)' : 'rgba(255,255,255,0.05)',
              border: index === 0 ? '2px solid var(--secondary-color)' : '1px solid rgba(168, 85, 247, 0.1)',
              borderRadius: '12px',
              fontSize: '1.2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: index === 0 ? 'var(--secondary-color)' : 'var(--text-secondary)' }}>
                  #{index + 1}
                </span>
                <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                  {player.name}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                {player.totalScore} {isArabic ? 'نقطة' : 'pts'}
                {index === 0 ? <Trophy size={20} color="var(--secondary-color)" /> : <Medal size={20} color="var(--text-secondary)" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {isHost && (
          <button className="btn btn-primary" onClick={handlePlayAgain} style={{ padding: '1rem 3rem' }}>
            <Play size={20} />
            {isArabic ? 'العب مرة أخرى' : 'Play Again'}
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '1rem 3rem' }}>
          {isArabic ? 'العودة إلى الصفحة الرئيسية' : 'Return to Home'}
        </button>
      </div>
      
    </div>
  );
}
