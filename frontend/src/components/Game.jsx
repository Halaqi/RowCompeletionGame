import { useState, useEffect, useRef } from 'react';
import { socket, playerId } from '../socket';
import { Clock, Send } from 'lucide-react';

const ARABIC_LETTERS = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'هـ', 'و', 'ي'];
const ENGLISH_LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export default function Game({ room, isArabic }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const inputsRef = useRef({});

  const currentPlayer = room.players.find(p => p.id === playerId);
  const isMyTurn = room.players[room.currentTurnIndex]?.id === playerId;
  const turnPlayer = room.players[room.currentTurnIndex];

  const allColumns = [...(room.settings.standardColumns || []), ...room.settings.customColumns];

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

  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="flex-between" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>
          {isArabic ? 'حرف الجولة:' : 'Round Letter:'}{' '}
          <span className="glow-text float" style={{ display: 'inline-block', fontSize: '3rem', color: 'var(--primary-color)', marginLeft: isArabic ? 0 : '1rem', marginRight: isArabic ? '1rem' : 0 }}>
            {room.round.letter}
          </span>
        </h2>
        
        <div className={`glass-panel ${timeLeft <= 10 ? 'timer-critical' : ''}`} style={{ padding: '1rem 2rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            {isArabic ? 'الوقت المتبقي' : 'Time Remaining'}
          </div>
          <span style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: timeLeft <= 10 ? 'var(--danger-color)' : 'var(--success-color)'
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
                  {getLocalizedColumn(col)}
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
