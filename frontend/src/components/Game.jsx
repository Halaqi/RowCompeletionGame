import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket';
import { Clock, Send } from 'lucide-react';

const ARABIC_LETTERS = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];
const ENGLISH_LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export default function Game({ room, isArabic }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const inputsRef = useRef({});

  const currentPlayer = room.players.find(p => p.id === socket.id);
  const isMyTurn = room.players[room.currentTurnIndex]?.id === socket.id;
  const turnPlayer = room.players[room.currentTurnIndex];

  const standardColumns = isArabic 
    ? ['اسم', 'حيوان', 'نبات', 'جماد', 'بلاد/عاصمة'] 
    : ['Name', 'Animal', 'Plant', 'Object', 'Country/Capital'];
  
  const allColumns = [...standardColumns, ...room.settings.customColumns];

  useEffect(() => {
    if (room.round.endTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((room.round.endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        
        if (remaining === 0 && !submitted) {
          handleSubmit();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [room.round.endTime, submitted]);

  const handleSelectLetter = (letter) => {
    socket.emit('selectLetter', { roomId: room.id, letter });
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    
    // Capture raw input values directly from the DOM using refs
    const finalAnswers = {};
    for (const col of allColumns) {
      finalAnswers[col] = inputsRef.current[col]?.value || '';
    }
    
    socket.emit('submitAnswers', { roomId: room.id, answers: finalAnswers });
  };

  if (!room.round.letter) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column' }}>
        <h2 className="gradient-text" style={{ marginBottom: '2rem' }}>
          {isMyTurn 
            ? (isArabic ? 'اختر حرفاً لتبدأ الجولة' : 'Select a letter to start the round') 
            : (isArabic ? `في انتظار ${turnPlayer?.name} لاختيار حرف...` : `Waiting for ${turnPlayer?.name} to select a letter...`)}
        </h2>

        {isMyTurn && (
      <div className="glass-panel fade-in-up" style={{ maxWidth: '800px', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        {(isArabic ? ARABIC_LETTERS : ENGLISH_LETTERS).map(letter => (
          <button
            key={letter}
            onClick={() => handleSelectLetter(letter)}
            className="btn btn-secondary"
            disabled={room.usedLetters?.includes(letter)}
            style={{ 
              fontSize: '1.5rem', 
              width: '60px', 
              height: '60px', 
              padding: 0,
              opacity: room.usedLetters?.includes(letter) ? 0.3 : 1
            }}
          >
            {letter}
          </button>
        ))}
      </div>
        )}
      </div>
    );
  }

  // The Playing View
  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="flex-between fade-in-up" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel flex-center pulse-glow" style={{ width: '100px', height: '100px', borderRadius: '50%', padding: 0 }}>
          <span style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            {room.round.letter}
          </span>
        </div>

        <div className="glass-panel flex-center" style={{ gap: '1rem', padding: '1rem 2rem' }}>
          <Clock size={32} color={timeLeft <= 10 ? 'var(--danger-color)' : 'white'} />
          <span style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            color: timeLeft <= 10 ? 'var(--danger-color)' : 'white'
          }}>
            {timeLeft}
          </span>
        </div>
      </div>

      <div className="glass-panel fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>{isArabic ? 'أدخل إجاباتك:' : 'Enter your answers:'}</h3>
        
        {submitted ? (
          <div className="flex-center animate-pulse" style={{ padding: '3rem 0', color: 'var(--success-color)', fontSize: '1.5rem' }}>
            {isArabic ? 'تم إرسال إجاباتك! في انتظار باقي اللاعبين...' : 'Answers submitted! Waiting for other players...'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {allColumns.map(col => (
              <div key={col}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  {col}
                </label>
                <input
                  type="text"
                  className="input-field"
                  ref={(el) => (inputsRef.current[col] = el)}
                  placeholder={`${isArabic ? 'يبدأ بحرف' : 'Starts with'} ${room.round.letter}...`}
                  autoComplete="off"
                />
              </div>
            ))}
          </div>
        )}

        {!submitted && (
          <div style={{ marginTop: '2rem', textAlign: isArabic ? 'left' : 'right' }}>
            <button className="btn btn-primary" onClick={handleSubmit}>
              <Send size={20} />
              {isArabic ? 'إرسال الإجابات' : 'Submit Answers'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
