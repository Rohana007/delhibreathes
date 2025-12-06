// Level Engine - based on total green points
// Level increases every 500 points

import { getPoints } from './pointsEngine';

const LEVEL_SIZE = 500;

export function getLevel() {
  const totalPoints = getPoints();
  return Math.floor(totalPoints / LEVEL_SIZE) + 1;
}

export function getXPProgress() {
  const totalPoints = getPoints();
  const level = getLevel();
  const currentLevelStart = (level - 1) * LEVEL_SIZE;
  const nextLevelStart = level * LEVEL_SIZE;

  const current = totalPoints - currentLevelStart;
  const next = nextLevelStart - currentLevelStart;
  const percent = next > 0 ? Math.min(100, Math.max(0, (current / next) * 100)) : 0;

  return {
    level,
    current,
    next,
    percent,
  };
}


