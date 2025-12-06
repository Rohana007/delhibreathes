// Green Points System - localStorage-based, backend-ready
// Keys: greenPoints, greenLevel, greenHistory

const POINTS_KEYS = {
  POINTS: 'greenPoints',
  LEVEL: 'greenLevel',
  HISTORY: 'greenHistory',
};

const LEVEL_SIZE = 500;

function safeParse(json, fallback) {
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function getPoints() {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(POINTS_KEYS.POINTS);
  const pts = Number(raw);
  return Number.isFinite(pts) && pts >= 0 ? pts : 0;
}

function savePoints(points) {
  if (typeof window === 'undefined') return;
  const safePoints = Math.max(0, Math.floor(points));
  window.localStorage.setItem(POINTS_KEYS.POINTS, String(safePoints));
  // Also update level cache for quick access
  const level = Math.floor(safePoints / LEVEL_SIZE) + 1;
  window.localStorage.setItem(POINTS_KEYS.LEVEL, String(level));
}

function appendHistory(entry) {
  if (typeof window === 'undefined') return;
  const history = safeParse(
    window.localStorage.getItem(POINTS_KEYS.HISTORY),
    []
  );
  history.push({
    ...entry,
    date: entry.date || new Date().toISOString(),
  });
  window.localStorage.setItem(
    POINTS_KEYS.HISTORY,
    JSON.stringify(history)
  );
}

export function addPoints(amount, metadata = {}) {
  if (!amount || typeof amount !== 'number') return getPoints();
  const current = getPoints();
  const updated = current + amount;
  savePoints(updated);
  appendHistory({
    type: metadata.type || 'generic',
    amount,
    label: metadata.label || 'Points added',
  });
  return updated;
}

export function getLevel() {
  const points = getPoints();
  return Math.floor(points / LEVEL_SIZE) + 1;
}

export function getProgressToNextLevel() {
  const points = getPoints();
  const level = getLevel();
  const currentLevelStart = (level - 1) * LEVEL_SIZE;
  const nextLevelStart = level * LEVEL_SIZE;
  const current = points - currentLevelStart;
  const needed = nextLevelStart - currentLevelStart;
  const percent = needed > 0 ? Math.min(100, Math.max(0, (current / needed) * 100)) : 0;

  return {
    currentPointsInLevel: current,
    pointsForNextLevel: needed,
    percent,
  };
}

export function getHistory() {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(POINTS_KEYS.HISTORY), []);
}

export function resetPoints() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(POINTS_KEYS.POINTS);
  window.localStorage.removeItem(POINTS_KEYS.LEVEL);
  window.localStorage.removeItem(POINTS_KEYS.HISTORY);
}

// Daily login points with streak support
export function addDailyLoginPoints() {
  if (typeof window === 'undefined') return;
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const metaRaw = window.localStorage.getItem('greenMeta');
  const meta = safeParse(metaRaw, {}) || {};

  if (meta.lastLoginDate === todayKey) {
    // Already counted for today
    return;
  }

  // Daily login +10
  addPoints(10, { type: 'daily_login', label: 'Daily login' });

  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  let streak = meta.loginStreak || 0;
  if (meta.lastLoginDate === yesterdayKey) {
    streak += 1;
  } else {
    streak = 1;
  }

  const newMeta = {
    ...meta,
    lastLoginDate: todayKey,
    loginStreak: streak,
  };

  window.localStorage.setItem('greenMeta', JSON.stringify(newMeta));
}

// Helper to expose streak for achievements engine
export function getLoginStreak() {
  if (typeof window === 'undefined') return 0;
  const meta = safeParse(window.localStorage.getItem('greenMeta'), {}) || {};
  return meta.loginStreak || 0;
}

// Event helpers for specific actions (backwards-compatible and backend-ready)
export function recordSafeRouteUse() {
  return addPoints(5, { type: 'safe_route', label: 'Viewed Safe Route' });
}

export function recordReportSubmitted() {
  return addPoints(50, { type: 'report', label: 'Pollution report submitted' });
}


