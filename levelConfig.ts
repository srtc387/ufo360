export interface LevelConfig {
  gameSpeed: number;
  gapHeight: number;
  pipeSpacing: number;
  pipeCount: number;
  color: string;
  trapChance: number;
}

const levels: LevelConfig[] = [
  // Level 1: Gentle Introduction
  { gameSpeed: 3.2, gapHeight: 4.5, pipeSpacing: 10, pipeCount: 10, color: '#4CAF50', trapChance: 0.1 },
  // Level 2: Slightly Faster
  { gameSpeed: 3.4, gapHeight: 4.3, pipeSpacing: 9.8, pipeCount: 12, color: '#8BC34A', trapChance: 0.12 },
  // Level 3: Gaps Tighten
  { gameSpeed: 3.6, gapHeight: 4.1, pipeSpacing: 9.6, pipeCount: 14, color: '#CDDC39', trapChance: 0.15 },
  // Level 4: Traps Become More Common
  { gameSpeed: 3.8, gapHeight: 3.9, pipeSpacing: 9.4, pipeCount: 16, color: '#FFEB3B', trapChance: 0.18 },
  // Level 5: Mid-game Challenge
  { gameSpeed: 4.0, gapHeight: 3.7, pipeSpacing: 9.2, pipeCount: 18, color: '#FFC107', trapChance: 0.22 },
  // Level 6: Noticeably Quicker
  { gameSpeed: 4.2, gapHeight: 3.5, pipeSpacing: 9.0, pipeCount: 20, color: '#FF9800', trapChance: 0.26 },
  // Level 7: Entering Hard Mode
  { gameSpeed: 4.4, gapHeight: 3.4, pipeSpacing: 8.8, pipeCount: 22, color: '#F44336', trapChance: 0.30 },
  // Level 8: Precision Required
  { gameSpeed: 4.6, gapHeight: 3.3, pipeSpacing: 8.6, pipeCount: 24, color: '#E91E63', trapChance: 0.35 },
  // Level 9: Nearing the End
  { gameSpeed: 4.8, gapHeight: 3.2, pipeSpacing: 8.4, pipeCount: 26, color: '#9C27B0', trapChance: 0.40 },
  // Level 10: Final Boss
  { gameSpeed: 5.0, gapHeight: 3.1, pipeSpacing: 8.2, pipeCount: 30, color: '#3F51B5', trapChance: 0.45 },
];

export const MAX_LEVELS = levels.length;

export const getLevelConfig = (level: number): LevelConfig => {
  // Return the config for the given level, clamping to the last defined level if the requested level is higher.
  return levels[Math.min(level - 1, levels.length - 1)];
};