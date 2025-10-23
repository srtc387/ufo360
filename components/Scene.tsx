import React, { useRef, Suspense, useEffect, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import UFO from './UFO';
import PipeSystem, { PipeSegment } from './PipeSystem';
import ParticleSystem, { ParticleSystemRef } from './ParticleSystem';
import { GameState } from '../types';

// --- New Arcade Physics ---
const JUMP_FORCE = 7;           // The immediate upward velocity applied on tap.
const GRAVITY = -15;         // Constant downward force. Lighter for more glide.

// --- Collision Radii ---
const UFO_RADIUS = 0.8;
const COIN_RADIUS = 0.6;


interface SceneProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  level: number;
  cameraRotation: { azimuth: number; polar: number };
  zoomLevel: number;
  onPipePass: () => void;
  onCoinCollect: () => void;
  onTrapHit: () => void;
  onCrash: () => void;
  onFlap: () => void;
  flapRef: React.MutableRefObject<() => void>;
}

const DynamicCamera: React.FC<{ 
    ufoRef: React.RefObject<THREE.Group>, 
    gameState: GameState, 
    zoomLevel: number,
    cameraRotation: { azimuth: number; polar: number }
}> = ({ ufoRef, gameState, zoomLevel, cameraRotation }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null!);
  const DEFAULT_FOV = 75;

  useFrame(() => {
    if (!ufoRef.current || !cameraRef.current) return;
    
    const isInitialStatic = gameState === 'cameraSetup' || gameState === 'ready';
    const isPausedStatic = gameState === 'paused' || gameState === 'pausedCameraSetup';
    
    // Only update camera if game is playing or in a static (setup/paused) state
    if (gameState !== 'playing' && !isInitialStatic && !isPausedStatic) {
      return;
    }
    
    let ufoTargetPosition;
    if (isInitialStatic) {
      ufoTargetPosition = new THREE.Vector3(0, 2, 0); // Start position
    } else {
      ufoTargetPosition = ufoRef.current.position; // Current position
    }
    
    const lookAtPosition = ufoTargetPosition.clone();
    
    const distance = 7 * zoomLevel;
    const spherical = new THREE.Spherical(distance, cameraRotation.polar, cameraRotation.azimuth);
    const targetPosition = new THREE.Vector3().setFromSpherical(spherical).add(lookAtPosition);

    const lerpFactor = (gameState === 'cameraSetup' || gameState === 'pausedCameraSetup') ? 1 : 0.1;
    
    cameraRef.current.position.lerp(targetPosition, lerpFactor);
    
    const lookAtTarget = cameraRef.current.userData.lookAtTarget || new THREE.Vector3();
    lookAtTarget.lerp(lookAtPosition, lerpFactor);
    cameraRef.current.userData.lookAtTarget = lookAtTarget;
    cameraRef.current.lookAt(lookAtTarget);

    if (cameraRef.current.fov !== DEFAULT_FOV) {
      cameraRef.current.fov = DEFAULT_FOV;
      cameraRef.current.updateProjectionMatrix();
    }
  });
  
  // Set initial position without lerping when states change
  useEffect(() => {
    if (!cameraRef.current || !ufoRef.current) return;
    
    if (gameState === 'start' || gameState === 'ready' || gameState === 'cameraSetup') {
        const lookAt = new THREE.Vector3(0, 2, 0);
        const distance = 7 * zoomLevel;
        const spherical = new THREE.Spherical(distance, cameraRotation.polar, cameraRotation.azimuth);
        const position = new THREE.Vector3().setFromSpherical(spherical).add(lookAt);

        cameraRef.current.position.copy(position);
        cameraRef.current.lookAt(lookAt);
        cameraRef.current.userData.lookAtTarget = lookAt.clone();
        cameraRef.current.updateProjectionMatrix();
    }
  }, [gameState, cameraRotation, zoomLevel, ufoRef]);

  return <PerspectiveCamera ref={cameraRef} makeDefault fov={DEFAULT_FOV} />;
};


const Scene: React.FC<SceneProps> = ({ 
  gameState, setGameState, level, cameraRotation, zoomLevel,
  onPipePass, onCoinCollect, onTrapHit, onCrash, onFlap, flapRef 
}) => {
  const ufoRef = useRef<THREE.Group>(null!);
  const pipeSystemRef = useRef<{ movePipes: (delta: number, onPipePass: () => void) => void; segments: PipeSegment[]; }>(null!);
  const particleSystemRef = useRef<ParticleSystemRef>(null!);
  const ufoVelocity = useRef(0);
  const [isCrashing, setIsCrashing] = useState(false);

  const handleImmediateCrash = (position: THREE.Vector3) => {
    if (isCrashing) return;
    setIsCrashing(true);
    
    if (ufoRef.current) ufoRef.current.visible = false;
    
    // Trigger a more dramatic explosion
    particleSystemRef.current?.trigger(position, new THREE.Color('#c0c0c0'), 40); // Metal
    particleSystemRef.current?.trigger(position, new THREE.Color('#FFFF00'), 20); // Light
    particleSystemRef.current?.trigger(position, new THREE.Color('#FF4500'), 30); // Fire
    
    setTimeout(() => {
        onCrash();
        setIsCrashing(false);
    }, 1000); // Wait for explosion animation to be seen
  };

  const resetUFO = useCallback(() => {
    if (ufoRef.current) {
      ufoRef.current.position.set(0, 2, 0);
      ufoRef.current.rotation.set(0, 0, 0);
      ufoRef.current.visible = true;
    }
    ufoVelocity.current = 0;
  }, []);

  useEffect(() => {
    if (gameState === 'ready') {
      resetUFO();
    }
  }, [gameState, level, resetUFO]);

  flapRef.current = () => {
    ufoVelocity.current = JUMP_FORCE;
    onFlap();
  };

  useFrame((state, delta) => {
    if (!ufoRef.current || isCrashing) return;

    if (gameState === 'playing') {
      // --- New Arcade Physics Engine ---
      // Apply gravity
      ufoVelocity.current += GRAVITY * delta;
      
      // Update position
      ufoRef.current.position.y += ufoVelocity.current * delta;

      // Ensure UFO stays level, no tilting!
      ufoRef.current.rotation.z = 0;

      pipeSystemRef.current?.movePipes(delta, onPipePass);
      
      const ufoPos = ufoRef.current.position;
      const ufoBounds = new THREE.Sphere(ufoPos, UFO_RADIUS);

      if (ufoPos.y < -5 || ufoPos.y > 10) {
        handleImmediateCrash(ufoPos);
        return;
      }
      
      if (pipeSystemRef.current) {
        for (const segment of pipeSystemRef.current.segments) {
          if (Math.abs(segment.group.position.z - ufoPos.z) < UFO_RADIUS + 1.2) {
            for (const pipe of segment.pipes) {
              const pipeBox = new THREE.Box3().setFromObject(pipe);
              if (ufoBounds.intersectsBox(pipeBox)) {
                handleImmediateCrash(ufoPos);
                return;
              }
            }

            if (segment.coin.visible) {
                const coinPos = new THREE.Vector3();
                segment.coin.getWorldPosition(coinPos);
                const coinBounds = new THREE.Sphere(coinPos, COIN_RADIUS);
                
                if (ufoBounds.intersectsSphere(coinBounds)) {
                    segment.coin.visible = false;
                    if (segment.isTrap) {
                        particleSystemRef.current?.trigger(coinPos, new THREE.Color('#DC143C'), 30);
                        onTrapHit();
                    } else {
                        particleSystemRef.current?.trigger(coinPos, new THREE.Color('#FFD700'), 30);
                        onCoinCollect();
                    }
                }
            }
          }
        }
      }
    } else if (gameState === 'ready' || gameState === 'cameraSetup') {
      ufoRef.current.position.y = 2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      ufoRef.current.rotation.z = 0; // Keep it level while hovering
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight 
        position={[10, 15, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Suspense fallback={null}>
        <UFO ref={ufoRef} gameState={gameState} />
        <PipeSystem ref={pipeSystemRef} level={level} gameState={gameState} />
        <ParticleSystem ref={particleSystemRef} />
      </Suspense>

      <DynamicCamera ufoRef={ufoRef} gameState={gameState} zoomLevel={zoomLevel} cameraRotation={cameraRotation} />
    </>
  );
};

export default Scene;