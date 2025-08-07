import React, { useState, useEffect } from "react";
import "./Flashcard.css";
import Confetti from "react-confetti";

function Flashcard({
  question,
  answer,
  distractors = [],
  flip,
  setFlip,
  mode,
  goToPrevCard,
  goToNextCard,
  handleShuffle,
  currentIndex,
  totalCards,
  score,
  setScore,
  onRestart,
}) {
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const isFinished = currentIndex >= totalCards;

  useEffect(() => {
    if (mode === "multiple" && !isFinished) {
      const safeDistractors = Array.isArray(distractors) ? distractors : [];
      const all = shuffleArray([...safeDistractors, answer]);
      setOptions(all);
      setSelected(null);
      setCorrect(null);
    }
  }, [mode, question, answer, distractors, currentIndex, isFinished]);

  const handleOptionClick = (option) => {
    setSelected(option);
    const isCorrect = option === answer;
    setCorrect(isCorrect);
    if (isCorrect) {
      setScore((prev) => prev + 1);
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 1500);
    }
  };

  const renderNavigationButtons = () => (
    <div className="nav-buttons">
      <button onClick={(e) => { e.stopPropagation(); goToPrevCard(); }}>← Prev</button>
      <button onClick={(e) => { e.stopPropagation(); goToNextCard(); }}>Next →</button>
      <button onClick={(e) => { e.stopPropagation(); handleShuffle(); }}>🔀 Shuffle</button>
    </div>
  );

  if (isFinished) {
    return (
      <div className="flashcard-container">
        <Confetti recycle={false} numberOfPieces={300} />
        <div className="completion-card">
          <h2>🎉 All done!</h2>
          <p>Your score: {score} / {totalCards}</p>
          <button className="restart-button" onClick={onRestart}>Restart</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcard-container">
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

      <div className="card-meta">
        <span className="progress">📍 {currentIndex + 1} / {totalCards}</span>
        {mode === "multiple" && <span className="score">✅ Score: {score}</span>}
      </div>

      {mode === "flashcard" ? (
        <div className="flip-wrapper" onClick={() => setFlip(!flip)}>
          <div className={`flashcard ${flip ? "flipped" : ""}`}>
            <div className="front">
              <p>{question}</p>
            </div>
            <div className="back">
              <p>{answer}</p>
            </div>
          </div>
          {renderNavigationButtons()}
        </div>
      ) : (
        <div className="multiple-choice-card">
          <p className="question-text">{question}</p>
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(option)}
              className={`option-button ${
                selected === option
                  ? option === answer
                    ? "correct"
                    : "incorrect"
                  : option === answer && selected
                  ? "correct"
                  : ""
              }`}
              disabled={!!selected}
            >
              {option}
            </button>
          ))}

          {selected && (
            <p className={`result-message ${correct ? "correct" : "incorrect"}`}>
              {correct ? "✅ Correct!" : `❌ Incorrect. Correct: ${answer}`}
            </p>
          )}

          {renderNavigationButtons()}
        </div>
      )}
    </div>
  );
}

export default Flashcard;

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}