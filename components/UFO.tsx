import React, { forwardRef, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import * as THREE from 'three';
import { GameState } from '../types';

interface UFOProps {
  gameState: GameState;
}

const UFO = forwardRef<Group, UFOProps>(({ gameState }, ref) => {
  const bodyRef = useRef<Group>(null!);
  const cockpitRef = useRef<Mesh>(null!);

  const targetScale = useRef(new THREE.Vector3(1, 1, 1));
  const targetIntensity = useRef(0.5);

  // Define colors for different states
  const defaultCockpitColor = useMemo(() => new THREE.Color("#87CEEB"), []);
  const playingCockpitColor = useMemo(() => new THREE.Color("#FF0000"), []); // Red
  const defaultEmissiveColor = useMemo(() => new THREE.Color("#00FFFF"), []);
  const playingEmissiveColor = useMemo(() => new THREE.Color("#FF0000"), []);

  // Hover and continuous engine pulse animations
  useFrame(({ clock }) => {
    if (!bodyRef.current || !cockpitRef.current) return;
    const material = cockpitRef.current.material as MeshStandardMaterial;

    // Handle idle hover
    if (gameState === 'ready' || gameState === 'start' || gameState === 'cameraSetup') {
        bodyRef.current.position.y = Math.sin(clock.getElapsedTime() * 4) * 0.1;
    }

    // Handle engine pulse and color when playing
    if (gameState === 'playing') {
      const time = clock.getElapsedTime() * 5; 
      const pulse = (Math.sin(time) + 1) / 2; // Normalize sine wave to 0-1

      const scale = 1.0 + pulse * 0.05; // 5% pulse from base scale
      targetScale.current.set(scale, scale, scale);

      targetIntensity.current = 0.5 + pulse * 2.0; // Pulse intensity
      
      // Lerp to playing colors
      material.color.lerp(playingCockpitColor, 0.1);
      material.emissive.lerp(playingEmissiveColor, 0.1);
    } else {
      // If not playing, reset to base state
      targetScale.current.set(1, 1, 1);
      targetIntensity.current = 0.5;

      // Lerp to default colors
      material.color.lerp(defaultCockpitColor, 0.1);
      material.emissive.lerp(defaultEmissiveColor, 0.1);
    }

    // Smoothly interpolate (lerp) towards target values for seamless transitions
    bodyRef.current.scale.lerp(targetScale.current, 0.1);
    
    material.emissiveIntensity += (targetIntensity.current - material.emissiveIntensity) * 0.1;
  });

  // Reset state instantly when a new level starts
  useEffect(() => {
    if (gameState === 'ready') {
        if(bodyRef.current) {
            bodyRef.current.scale.set(1, 1, 1);
        }
        if (cockpitRef.current) {
            const material = cockpitRef.current.material as MeshStandardMaterial;
            material.emissiveIntensity = 0.5;
            // Instantly set colors
            material.color.copy(defaultCockpitColor);
            material.emissive.copy(defaultEmissiveColor);
        }
    }
  }, [gameState, defaultCockpitColor, defaultEmissiveColor]);


  return (
    <group ref={ref} scale={0.8}>
        <group ref={bodyRef}>
            {/* Main Saucer Body */}
            <mesh position={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[1, 1, 0.4, 32]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Cockpit Dome */}
            <mesh ref={cockpitRef} position={[0, 0.2, 0]} castShadow>
                <sphereGeometry args={[0.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#87CEEB" transparent opacity={0.6} emissive="#00FFFF" emissiveIntensity={0.5} />
            </mesh>
            {/* Underside Light */}
            <mesh position={[0, -0.2, 0]}>
                <cylinderGeometry args={[0.3, 0.5, 0.2, 32]} />
                <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={1} />
            </mesh>
        </group>
    </group>
  );
});

export default UFO;
