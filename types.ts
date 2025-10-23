// FIX: The manual JSX augmentation was causing conflicts with React's native JSX types.
// Importing '@react-three/fiber' for its side-effects allows its own type
// definitions to correctly augment the global JSX namespace, making TypeScript
// aware of both standard HTML elements and react-three-fiber components.
import 'react';
import '@react-three/fiber';

export type GameState = 'cameraSetup' | 'ready' | 'playing' | 'paused' | 'pausedCameraSetup' | 'gameOver' | 'levelComplete' | 'victory';