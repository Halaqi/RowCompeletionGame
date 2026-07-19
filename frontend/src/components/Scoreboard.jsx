import { Trophy, Medal, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Scoreboard({ room, isArabic }) {
  const navigate = useNavigate();
  
  // Sort players by total score in descending order
  const sortedPlayers = [...room.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];

  return (
    <div className="flex-center fade-in-up" style={{ minHeight: '80vh', flexDirection: 'column', gap: '2rem' }}>
      
      <div className="glass-panel text-center pulse-glow" style={{ maxWidth: '600px', width: '100%', padding: '3rem 2rem' }}>
        <Crown size={80} color="#fbbf24" style={{ marginBottom: '1rem' }} className="animate-pulse" />
        
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
              background: index === 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
              border: index === 0 ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '1.2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: index === 0 ? '#fbbf24' : 'var(--text-secondary)' }}>
                  #{index + 1}
                </span>
                <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                  {player.name}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                {player.totalScore} {isArabic ? 'نقطة' : 'pts'}
                {index === 0 ? <Trophy size={20} color="#fbbf24" /> : <Medal size={20} color="var(--text-secondary)" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ padding: '1rem 3rem' }}>
        {isArabic ? 'العودة إلى الصفحة الرئيسية' : 'Return to Home'}
      </button>
      
    </div>
  );
}
