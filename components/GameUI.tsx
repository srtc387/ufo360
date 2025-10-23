import React, { useState, useEffect } from 'react';
import { GameState } from '../types';
import { AudioControls, AudioControlButton } from './AudioControls';

interface GameUIProps {
  score: number;
  level: number;
  lives: number;
  starCoins: number;
  gameState: GameState;
  onRestartFromBeginning: () => void;
  onRestartLevel: () => void;
  onNextLevel: () => void;
  onPause: () => void;
  onFlapButton: () => void;
  onConfirmCamera: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onEnterPauseCameraSetup: () => void;
  onReturnToPauseWithoutUpdate: () => void;
  onReturnToPauseWithUpdate: () => void;
  isMusicEnabled: boolean;
  isSfxEnabled: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ 
  score, level, lives, starCoins, gameState, 
  onRestartFromBeginning, onRestartLevel, onNextLevel, 
  onPause, onFlapButton, onConfirmCamera, onZoomIn, onZoomOut,
  onEnterPauseCameraSetup, onReturnToPauseWithoutUpdate, onReturnToPauseWithUpdate,
  isMusicEnabled, isSfxEnabled, onToggleMusic, onToggleSfx
}) => {
  const [showNextLevelButton, setShowNextLevelButton] = useState(false);

  useEffect(() => {
    if (gameState === 'levelComplete') {
      setShowNextLevelButton(false);
      const timer = setTimeout(() => setShowNextLevelButton(true), 2000); // Show button after 2s animation
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const getMessage = () => {
    switch (gameState) {
      case 'cameraSetup':
        return (
          <div className="message-container">
            <h1>UFO Flap</h1>
            <p>Drag to rotate. Use buttons or pinch to zoom.</p>
            <button onClick={onConfirmCamera}>Start Flight</button>
          </div>
        );
      case 'ready':
        return (
          <div className="message-container" style={{ pointerEvents: 'none', background: 'transparent', boxShadow: 'none' }}>
            <h2>Level {level}</h2>
            <p>Click or Tap to Fly</p>
          </div>
        );
      case 'gameOver':
        return (
          <div className="message-container">
            <h1>Game Over</h1>
            <h2>Final Score: {score}</h2>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <button onClick={onRestartLevel} style={{width: '80%'}}>Retry Level {level}</button>
                <button onClick={onRestartFromBeginning} style={{width: '80%'}}>Main Menu</button>
            </div>
          </div>
        );
      case 'levelComplete':
        return (
          <div className="message-container">
            <h1>Level {level} Complete!</h1>
            {showNextLevelButton && <button onClick={onNextLevel}>Next Level</button>}
          </div>
        );
      case 'victory':
        return (
          <div className="message-container">
            <h1>Congratulations!</h1>
            <h2>You've completed the game!</h2>
            <h3>Final Score: {score}</h3>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                <button onClick={onRestartLevel} style={{width: '80%'}}>Play Final Level</button>
                <button onClick={onRestartFromBeginning} style={{width: '80%'}}>Main Menu</button>
            </div>
          </div>
        );
      case 'paused':
        return (
          <div className="message-container">
            <h1>Paused</h1>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <button onClick={onPause} style={{width: '80%'}}>Resume</button>
              <button onClick={onEnterPauseCameraSetup} style={{width: '80%'}}>Adjust Camera</button>
              <button onClick={onRestartFromBeginning} style={{width: '80%'}}>Quit</button>
            </div>
          </div>
        );
      case 'pausedCameraSetup':
        return (
          <div className="message-container">
            <h2>Adjust Camera</h2>
            <p>Drag to rotate. Use buttons or pinch to zoom.</p>
             <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'row', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={onReturnToPauseWithoutUpdate}>Return to Game</button>
                <button onClick={onReturnToPauseWithUpdate}>Update</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="game-ui">
        {(gameState === 'playing' || gameState === 'paused' || gameState === 'pausedCameraSetup' || gameState === 'gameOver' || gameState === 'levelComplete') && (
          <div className="hud">
            <div className="score">
              <div>Score: {score}</div>
              <div>❤️ {lives}</div>
            </div>
            <div className="level">
              <div>Level: {level}</div>
              <div>⭐ {starCoins}/25</div>
            </div>
          </div>
        )}
        <div className="ingame-audio-controls">
          <AudioControlButton isEnabled={isMusicEnabled} onToggle={onToggleMusic} type="music" />
          <AudioControlButton isEnabled={isSfxEnabled} onToggle={onToggleSfx} type="sfx" />
        </div>
        {getMessage()}
      </div>

      {(gameState === 'cameraSetup' || gameState === 'pausedCameraSetup') && (
        <>
            <div className="arrow-indicator arrow-left">‹</div>
            <div className="arrow-indicator arrow-right">›</div>
            <div className="zoom-controls">
                <button className="zoom-button" onClick={onZoomIn} aria-label="Zoom In">+</button>
                <button className="zoom-button" onClick={onZoomOut} aria-label="Zoom Out">-</button>
            </div>
        </>
      )}

      {gameState === 'playing' && (
        <button className="pause-button" onClick={onPause} aria-label="Pause Game">
          ❚❚
        </button>
      )}
      {(gameState === 'playing' || gameState === 'ready') && (
        <button
          className="arcade-button"
          onMouseDown={(e) => { e.preventDefault(); onFlapButton(); }}
          onTouchStart={(e) => { e.preventDefault(); onFlapButton(); }}
          aria-label="Flap UFO"
        />
      )}
    </>
  );
};

export default GameUI;