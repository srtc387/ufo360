
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import GameUI from './components/GameUI';
import { GameState } from './types';
import { useSounds } from './hooks/useSounds';
import { getLevelConfig, MAX_LEVELS } from './levelConfig';
import { useBackgroundMusic } from './hooks/useBackgroundMusic';
import { usePersistentState } from './hooks/usePersistentState';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_SENSITIVITY = 0.001;
const ZOOM_BUTTON_STEP = 0.25;
const ROTATION_SENSITIVITY = 0.01;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('cameraSetup');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(5); // Requirement: Start with 5 lives.
  const [starCoins, setStarCoins] = useState(0);
  const [pipesPassed, setPipesPassed] = useState(0);
  
  // Refactored state management with custom hook for persistence
  const [isMusicEnabled, setIsMusicEnabled] = usePersistentState('ufo-music-enabled', true);
  const [isSfxEnabled, setIsSfxEnabled] = usePersistentState('ufo-sfx-enabled', true);
  const [zoomLevel, setZoomLevel] = usePersistentState('ufo-zoom', 1.0);
  const [cameraRotation, setCameraRotation] = usePersistentState('ufo-camera-rotation', { azimuth: 0.5, polar: 1.2 });

  // Temporary state for mid-game camera adjustments
  const [tempZoomLevel, setTempZoomLevel] = useState(zoomLevel);
  const [tempCameraRotation, setTempCameraRotation] = useState(cameraRotation);

  // Update temp state when persistent state changes (e.g., on initial load)
  useEffect(() => {
    setTempZoomLevel(zoomLevel);
  }, [zoomLevel]);
  useEffect(() => {
    setTempCameraRotation(cameraRotation);
  }, [cameraRotation]);

  const { playSound } = useSounds({ isSfxEnabled });
  useBackgroundMusic({ gameState, level, isEnabled: isMusicEnabled });
  
  const flapRef = useRef<() => void>(() => {});
  const pinchDistRef = useRef<number | null>(null);
  const dragStateRef = useRef<{ isDragging: boolean; lastX: number; lastY: number; }>({ isDragging: false, lastX: 0, lastY: 0 });

  const handleToggleMusic = useCallback(() => setIsMusicEnabled(p => !p), [setIsMusicEnabled]);
  const handleToggleSfx = useCallback(() => setIsSfxEnabled(p => !p), [setIsSfxEnabled]);

  const startGame = useCallback((startLevel = 1) => {
    setScore(0);
    setLives(5); // Requirement: A fresh start always begins with 5 lives.
    setLevel(startLevel);
    setStarCoins(0);
    setPipesPassed(0);
    setGameState('ready');
  }, []);
  
  const handleConfirmCamera = useCallback(() => {
    startGame(1);
  }, [startGame]);

  const handleRestartFromBeginning = useCallback(() => {
    setGameState('cameraSetup'); 
  }, []);

  const handleRestartLevel = useCallback(() => {
    startGame(level);
  }, [startGame, level]);

  const handlePipePass = useCallback(() => {
    playSound('score');
    setScore(s => s + 1);
    setPipesPassed(p => {
      const newPipesPassed = p + 1;
      const config = getLevelConfig(level);
      if (config.pipeCount > 0 && newPipesPassed >= config.pipeCount) {
        playSound('levelComplete');
        setGameState('levelComplete');
      }
      return newPipesPassed;
    });
  }, [playSound, level]);
  
  const handleCoinCollect = useCallback(() => {
    playSound('coin');
    setScore(s => s + 5);
    setStarCoins(sc => {
      const newStarCoins = sc + 1;
      if (newStarCoins >= 25) {
        setLives(l => l + 1);
        playSound('lifeUp');
        return newStarCoins - 25; // Reset star coin count after gaining a life
      }
      return newStarCoins;
    });
  }, [playSound]);
  
  const handleTrapHit = useCallback(() => {
    playSound('trap');
    setScore(s => Math.max(0, s - 3));
  }, [playSound]);
  
  const handleCrash = useCallback(() => {
    playSound('crash');
    setLives(l => {
      const newLives = l - 1;
      if (newLives > 0) {
        // Still has lives, restart current level
        setPipesPassed(0);
        setGameState('ready');
      } else {
        // No lives left, check for level demotion
        if (level > 1) {
          playSound('trap'); // Demotion sound
          setLevel(currentLevel => currentLevel - 1);
          setLives(3); // Gets 3 lives on the demoted level
          setPipesPassed(0);
          setGameState('ready');
        } else {
          // Was on level 1, true game over
          setGameState('gameOver');
        }
      }
      return newLives;
    });
  }, [playSound, level]);

  const handleNextLevel = useCallback(() => {
    if (level >= MAX_LEVELS) {
      setGameState('victory');
    } else {
      playSound('lifeUp');
      setLives(l => l + 1); // Requirement: Gain a life on level up
      setLevel(l => l + 1);
      setPipesPassed(0);
      setGameState('ready');
    }
  }, [level, playSound]);

  const handlePauseToggle = useCallback(() => {
    if (gameState === 'playing') {
      playSound('pause');
      setGameState('paused');
    } else if (gameState === 'paused') {
      playSound('pause');
      setGameState('playing');
    }
  }, [gameState, playSound]);

  const handleEnterPauseCameraSetup = useCallback(() => {
    setTempCameraRotation(cameraRotation);
    setTempZoomLevel(zoomLevel);
    setGameState('pausedCameraSetup');
  }, [cameraRotation, zoomLevel]);

  const handleReturnToPauseWithoutUpdate = useCallback(() => {
    setGameState('paused');
  }, []);

  const handleReturnToPauseWithUpdate = useCallback(() => {
    setCameraRotation(tempCameraRotation);
    setZoomLevel(tempZoomLevel);
    setGameState('paused');
  }, [tempCameraRotation, tempZoomLevel, setCameraRotation, setZoomLevel]);

  const handleFlapSound = useCallback(() => {
    playSound('flap');
  }, [playSound]);

  const handleInput = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (gameState === 'cameraSetup' || gameState === 'pausedCameraSetup') return;
    if (e && 'touches' in e && e.touches.length > 1) return;
    
    if (gameState === 'ready') {
      setGameState('playing');
    }
    if (gameState === 'ready' || gameState === 'playing') {
      flapRef.current?.();
    }
  }, [gameState]);

  const handleZoom = useCallback((deltaY: number) => {
    const zoomUpdater = (prevZoom: number) => {
        const newZoom = prevZoom + deltaY * ZOOM_SENSITIVITY;
        return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));
    };
    if (gameState === 'pausedCameraSetup') {
        setTempZoomLevel(zoomUpdater);
    } else {
        setZoomLevel(zoomUpdater);
    }
  }, [gameState, setZoomLevel]);

  const handleZoomIn = useCallback(() => {
    const zoomUpdater = (prev: number) => Math.max(ZOOM_MIN, prev - ZOOM_BUTTON_STEP);
    if (gameState === 'pausedCameraSetup') {
        setTempZoomLevel(zoomUpdater);
    } else {
        setZoomLevel(zoomUpdater);
    }
  }, [gameState, setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    const zoomUpdater = (prev: number) => Math.min(ZOOM_MAX, prev + ZOOM_BUTTON_STEP);
    if (gameState === 'pausedCameraSetup') {
        setTempZoomLevel(zoomUpdater);
    } else {
        setZoomLevel(zoomUpdater);
    }
  }, [gameState, setZoomLevel]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (gameState === 'cameraSetup' || gameState === 'pausedCameraSetup') {
        handleZoom(e.deltaY);
    }
  };
  
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((gameState !== 'cameraSetup' && gameState !== 'pausedCameraSetup') || (e.pointerType === 'touch' && e.isPrimary === false)) return;
    dragStateRef.current = { isDragging: true, lastX: e.clientX, lastY: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging || (gameState !== 'cameraSetup' && gameState !== 'pausedCameraSetup') || (e.pointerType === 'touch' && e.isPrimary === false)) return;
    
    const deltaX = e.clientX - dragStateRef.current.lastX;
    const deltaY = e.clientY - dragStateRef.current.lastY;
    
    const rotationUpdater = (prev: {azimuth: number, polar: number}) => {
      const newAzimuth = (prev.azimuth - deltaX * ROTATION_SENSITIVITY) % (Math.PI * 2);
      const newPolar = Math.max(0.1, Math.min(Math.PI - 0.1, prev.polar + deltaY * ROTATION_SENSITIVITY));
      return { azimuth: newAzimuth, polar: newPolar };
    };

    if (gameState === 'pausedCameraSetup') {
        setTempCameraRotation(rotationUpdater);
    } else {
        setCameraRotation(rotationUpdater);
    }
    
    dragStateRef.current.lastX = e.clientX;
    dragStateRef.current.lastY = e.clientY;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' && e.isPrimary === false) return;
    dragStateRef.current.isDragging = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && (gameState === 'cameraSetup' || gameState === 'pausedCameraSetup')) {
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      pinchDistRef.current = dist;
    } else if (e.touches.length === 1) {
      handleInput(e);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchDistRef.current !== null && (gameState === 'cameraSetup' || gameState === 'pausedCameraSetup')) {
      e.preventDefault();
      const newDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      const delta = pinchDistRef.current - newDist;
      handleZoom(delta * 2);
      pinchDistRef.current = newDist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) pinchDistRef.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePauseToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, handlePauseToggle]);

  return (
    <>
      <GameUI 
        score={score}
        level={level}
        lives={lives}
        starCoins={starCoins}
        gameState={gameState} 
        onRestartFromBeginning={handleRestartFromBeginning}
        onRestartLevel={handleRestartLevel}
        onNextLevel={handleNextLevel}
        onPause={handlePauseToggle}
        onFlapButton={handleInput}
        onConfirmCamera={handleConfirmCamera}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onEnterPauseCameraSetup={handleEnterPauseCameraSetup}
        onReturnToPauseWithoutUpdate={handleReturnToPauseWithoutUpdate}
        onReturnToPauseWithUpdate={handleReturnToPauseWithUpdate}
        isMusicEnabled={isMusicEnabled}
        isSfxEnabled={isSfxEnabled}
        onToggleMusic={handleToggleMusic}
        onToggleSfx={handleToggleSfx}
      />
      <div 
        id="canvas-container"
        onMouseDown={(e) => { if (gameState !== 'cameraSetup' && gameState !== 'pausedCameraSetup') handleInput(e); }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ touchAction: (gameState === 'cameraSetup' || gameState === 'pausedCameraSetup') ? 'none' : 'auto' }}
      >
        <Canvas shadows>
          <Scene
            gameState={gameState}
            setGameState={setGameState}
            level={level}
            cameraRotation={gameState === 'pausedCameraSetup' ? tempCameraRotation : cameraRotation}
            zoomLevel={gameState === 'pausedCameraSetup' ? tempZoomLevel : zoomLevel}
            onPipePass={handlePipePass}
            onCoinCollect={handleCoinCollect}
            onTrapHit={handleTrapHit}
            onCrash={handleCrash}
            onFlap={handleFlapSound}
            flapRef={flapRef}
          />
        </Canvas>
      </div>
    </>
  );
};

export default App;
