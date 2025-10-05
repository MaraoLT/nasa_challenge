import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import musicManager from '../utils/MusicManager';
import audioContextManager from '../utils/AudioContextManager';

export default function WarningScreen() {
  const [showContinue, setShowContinue] = useState(false);
  const [blinkOn, setBlinkOn] = useState(false);
  const navigate = useNavigate();

  // Start music when component mounts
  useEffect(() => {
    // Initialize audio context manager
    audioContextManager.init();
    
    const playResult = musicManager.playTrack('/resources/sounds/Eternal Horizon.mp3', true);
    if (!playResult) {
      console.log('Music will play after user interaction');
    }
    
    return () => {
      // Fade out music when leaving the component
      musicManager.fadeOut(500);
    };
  }, []);

  // Exactly two blinks, 1.5s apart, then show continue
  useEffect(() => {
    const timers = [];
    const FIRST_BLINK_DELAY = 600; // wait for pop-in (600ms) then start
    const BLINK_INTERVAL = 1500; // ms between blinks
    const BLINK_DURATION = 360; // how long it stays fully faded for better visibility

    const scheduleBlink = (atMs) => {
      const t1 = setTimeout(() => {
        setBlinkOn(true);
        // ensure state flush before scheduling off
        const t2 = setTimeout(() => setBlinkOn(false), BLINK_DURATION);
        timers.push(t2);
      }, atMs);
      timers.push(t1);
    };

    // Blink 1 and Blink 2
    scheduleBlink(FIRST_BLINK_DELAY);
    scheduleBlink(FIRST_BLINK_DELAY + BLINK_INTERVAL);

    // Reveal continue shortly after second blink completes
  const showAt = FIRST_BLINK_DELAY + BLINK_INTERVAL + BLINK_DURATION + 80;
    const tC = setTimeout(() => setShowContinue(true), showAt);
    timers.push(tC);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const onClick = () => {
    if (!showContinue) return;
    navigate('/terminal');
  };

  return (
    <div onClick={onClick} style={styles.root}>
      <style>{css}</style>
      <div className={`warn__card warn__anim ${blinkOn ? 'is-faded' : ''}`}>
        <div className="warn__title">WARNING</div>
        <div className="warn__message">
          A large object is approaching. Immediate attention required.
        </div>
        <div className={`warn__continue ${showContinue ? 'is-visible' : ''}`}>
          Click to continue
        </div>
      </div>
    </div>
  );
}

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    background: '#000',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontFamily: "'Segoe UI', Roboto, Arial, Helvetica, sans-serif",
    userSelect: 'none',
    cursor: 'pointer',
  },
};

const css = `
.warn__card {
  width: min(900px, 90vw);
  min-height: min(520px, 78vh);
  background: rgba(20, 0, 0, 0.9);
  border: 3px solid #ff3b3b;
  border-radius: 16px;
  box-shadow: 0 20px 80px rgba(255, 0, 0, 0.35), inset 0 0 40px rgba(255, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 36px);
  text-align: center;
  transition: opacity 200ms ease, transform 140ms ease, box-shadow 140ms ease;
}

.warn__card.is-faded { opacity: 0; }

.warn__title {
  font-size: clamp(40px, 9vw, 96px);
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #ff5555;
  text-shadow: 0 0 24px rgba(255, 0, 0, 0.55);
  margin-bottom: clamp(12px, 2.4vw, 20px);
}

.warn__message {
  font-size: clamp(16px, 2.2vw, 22px);
  line-height: 1.5;
  color: #ffd6d6;
  max-width: 56ch;
  margin: 0 auto clamp(18px, 3.2vw, 28px);
}

.warn__continue {
  font-size: clamp(14px, 1.8vw, 18px);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 260ms ease, transform 260ms ease;
  color: #ffb3b3;
}
.warn__continue.is-visible {
  opacity: 1;
  transform: none;
}

.warn__anim { animation: warnPopIn 600ms cubic-bezier(0.2, 0.9, 0.2, 1.0) both; }
@keyframes warnPopIn {
  0% { opacity: 0; transform: scale(0.86); filter: blur(2px); }
  60% { opacity: 1; transform: scale(1.03); filter: none; }
  100% { opacity: 1; transform: scale(1.0); }
}
`;
