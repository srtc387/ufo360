import React, { forwardRef, useImperativeHandle, useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, CylinderGeometry, MeshStandardMaterial, Shape, ExtrudeGeometry, RingGeometry, MeshBasicMaterial, AdditiveBlending, DoubleSide, CanvasTexture, ConeGeometry } from 'three';
import { getLevelConfig } from '../levelConfig';
import { GameState } from '../types';

const PIPE_RADIUS = 1.2;
const PIPE_BODY_HEIGHT = 20;
const COIN_RADIUS = 0.6;
const COIN_HEIGHT = 0.2;
const INDICATOR_AHEAD_DISTANCE = 5;

// Helper to create a swirling texture for the vortices
const createVortexTexture = (colorStr: string): CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new CanvasTexture(canvas);

    // Create a base gradient that fades at the edges
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.3, colorStr);
    gradient.addColorStop(0.7, colorStr);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add darker, semi-transparent stripes for a swirling illusion
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    for(let i=0; i < canvas.height; i += 8) {
        ctx.fillRect(0, i, canvas.width, 4);
    }
    
    const texture = new CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = 1000; // RepeatWrapping
    return texture;
};


export interface PipeSegment {
  group: Group;
  pipes: Mesh[];
  coin: Mesh;
  warningIndicator: Mesh;
  isTrap: boolean;
  passed: boolean;
  coinCollected: boolean;
}

const PipeSystem = forwardRef<{
    movePipes: (delta: number, onPipePass: () => void) => void;
    segments: PipeSegment[];
}, { level: number; gameState: GameState }>((props, ref) => {
  const { level, gameState } = props;
  const groupRef = useRef<Group>(new Group());
  
  const config = useMemo(() => getLevelConfig(level), [level]);

  // Use ConeGeometry for a vortex shape, open-ended
  const vortexGeometry = useMemo(() => new ConeGeometry(PIPE_RADIUS * 1.5, PIPE_BODY_HEIGHT, 16, 1, true), []);
  
  const vortexMaterial = useMemo(() => {
      const texture = createVortexTexture(config.color);
      texture.repeat.set(4, 2);
      return new MeshBasicMaterial({
          map: texture,
          side: DoubleSide,
          transparent: true,
          blending: AdditiveBlending,
          opacity: 0.9
      });
  }, [config.color]);
  
  const coinGeometry = useMemo(() => {
    const starShape = new Shape();
    const outerRadius = COIN_RADIUS;
    const innerRadius = outerRadius * 0.5;
    const points = 5;
    starShape.moveTo(0, outerRadius);
    for (let i = 1; i <= points * 2; i++) {
        const radius = i % 2 === 1 ? innerRadius : outerRadius;
        const angle = (i * Math.PI) / points;
        starShape.lineTo(Math.sin(angle) * radius, Math.cos(angle) * radius);
    }
    const extrudeSettings = { depth: COIN_HEIGHT, bevelEnabled: false };
    const geom = new ExtrudeGeometry(starShape, extrudeSettings);
    geom.center();
    return geom;
  }, []);
  const goldMaterial = useMemo(() => new MeshStandardMaterial({ color: '#FFD700', emissive: '#B8860B' }), []);
  const trapMaterial = useMemo(() => new MeshStandardMaterial({ color: '#DC143C', emissive: '#8B0000' }), []);

  const indicatorGeometry = useMemo(() => new RingGeometry(config.gapHeight / 2 - 0.2, config.gapHeight / 2, 32), [config.gapHeight]);
  const indicatorMaterial = useMemo(() => new MeshBasicMaterial({
    color: '#00FFFF',
    side: DoubleSide,
    transparent: true,
    opacity: 0.3,
    blending: AdditiveBlending,
  }), []);
  const trapIndicatorMaterial = useMemo(() => new MeshBasicMaterial({
    color: '#FF4500',
    side: DoubleSide,
    transparent: true,
    opacity: 0.4,
    blending: AdditiveBlending,
  }), []);


  const pipeSegments: PipeSegment[] = useMemo(() => {
    return Array.from({ length: config.pipeCount }, () => {
      const topPipe = new Mesh(vortexGeometry, vortexMaterial);
      const bottomPipe = new Mesh(vortexGeometry, vortexMaterial);
      
      // Correctly orient the vortices: wide mouths face each other.
      // The top vortex is standard (tip up), the bottom one is flipped.
      bottomPipe.rotation.x = Math.PI;

      const isTrap = Math.random() < config.trapChance;
      const coin = new Mesh(coinGeometry, isTrap ? trapMaterial : goldMaterial);
      const warningIndicator = new Mesh(indicatorGeometry, isTrap ? trapIndicatorMaterial : indicatorMaterial);
      warningIndicator.rotation.x = Math.PI / 2;

      const pipeGroup = [topPipe, bottomPipe];
      
      const container = new Group();
      container.add(topPipe, bottomPipe, coin, warningIndicator);

      return {
        group: container,
        pipes: pipeGroup,
        coin: coin,
        warningIndicator: warningIndicator,
        isTrap: isTrap,
        passed: false,
        coinCollected: false,
      };
    });
  }, [config, vortexGeometry, vortexMaterial, coinGeometry, goldMaterial, trapMaterial, indicatorGeometry, indicatorMaterial, trapIndicatorMaterial]);
  
  const resetPipe = useCallback((segment: PipeSegment, zPos: number) => {
      segment.group.position.z = zPos;
      segment.passed = false;
      segment.coinCollected = false;
      segment.coin.visible = true;
      
      const GAP_Y_RANGE = [-2 + config.gapHeight / 2, 6 - config.gapHeight / 2];
      const gapCenterY = GAP_Y_RANGE[0] + Math.random() * (GAP_Y_RANGE[1] - GAP_Y_RANGE[0]);
      
      // Position cones correctly. A Cone's origin is at its center.
      // Base is at -height/2, tip is at +height/2.
      // Top cone (not flipped): We want its base at the gap. Base is at -h/2.
      segment.pipes[0].position.y = gapCenterY + config.gapHeight / 2 + PIPE_BODY_HEIGHT / 2;
      // Bottom cone (flipped): Its base is now at its local +h/2. We want it at the gap.
      segment.pipes[1].position.y = gapCenterY - config.gapHeight / 2 - PIPE_BODY_HEIGHT / 2;

      segment.coin.position.y = gapCenterY;
      segment.warningIndicator.position.y = gapCenterY;
      segment.warningIndicator.position.z = INDICATOR_AHEAD_DISTANCE;

  }, [config]);
  
  useEffect(() => {
    while (groupRef.current.children.length) {
      groupRef.current.remove(groupRef.current.children[0]);
    }
    
    const startOffset = config.gameSpeed * 4;
    pipeSegments.forEach((segment, i) => {
      groupRef.current.add(segment.group);
      resetPipe(segment, - (i * config.pipeSpacing) - startOffset);
    });
  }, [pipeSegments, config, gameState, resetPipe]);

  useFrame(({ clock }, delta) => {
    // Animate texture to create swirling effect
    if (vortexMaterial.map) {
        vortexMaterial.map.offset.y -= delta * 1.5;
    }

    // Pulse animation for indicator materials
    const pulse = Math.sin(clock.elapsedTime * 4) * 0.5 + 0.5;
    indicatorMaterial.opacity = 0.2 + pulse * 0.2;
    trapIndicatorMaterial.opacity = 0.3 + pulse * 0.25;
  });


  useImperativeHandle(ref, () => ({
    movePipes: (delta: number, onPipePass: () => void) => {
      pipeSegments.forEach(segment => {
        segment.group.position.z += config.gameSpeed * delta;
        if(segment.coin) {
          segment.coin.rotation.y += 2 * delta;
        }
        
        if (!segment.passed && segment.group.position.z > 0) {
          segment.passed = true;
          onPipePass();
        }
      });
    },
    segments: pipeSegments,
  }));

  return <primitive object={groupRef.current} />;
});

export default PipeSystem;