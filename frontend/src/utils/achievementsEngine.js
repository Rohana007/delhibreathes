// Achievements Engine - localStorage based, backend-upgrade ready
// Keys: achievementsUnlocked, achievementsProgress

import { addPoints, getLoginStreak } from './pointsEngine';

const UNLOCKED_KEY = 'achievementsUnlocked';
const PROGRESS_KEY = 'achievementsProgress';

function safeParse(json, fallback) {
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

// Static achievement catalog
export const ACHIEVEMENTS = [
  {
    id: 1,
    title: 'Pollution Warrior',
    description: 'Submitted your first pollution report.',
    icon: '🏆',
    conditionType: 'reports_count',
    threshold: 1,
    rewardPoints: 50,
  },
  {
    id: 2,
    title: 'Neighborhood Guardian',
    description: 'Reported 10 pollution incidents in your area.',
    icon: '🛡️',
    conditionType: 'reports_count',
    threshold: 10,
    rewardPoints: 200,
  },
  {
    id: 3,
    title: 'Clean Air Hero',
    description: 'Filed 25 detailed pollution reports.',
    icon: '🌬️',
    conditionType: 'reports_count',
    threshold: 25,
    rewardPoints: 500,
  },
  {
    id: 4,
    title: 'AQI Scholar',
    description: 'Checked AQI more than 20 times.',
    icon: '📘',
    conditionType: 'aqi_views',
    threshold: 20,
    rewardPoints: 100,
  },
  {
    id: 5,
    title: 'Safe Journey',
    description: 'Used low-pollution safe routes 5 times.',
    icon: '🛣️',
    conditionType: 'safe_routes',
    threshold: 5,
    rewardPoints: 80,
  },
  {
    id: 6,
    title: 'Streak Master',
    description: 'Logged in 7 days in a row.',
    icon: '🔥',
    conditionType: 'login_streak',
    threshold: 7,
    rewardPoints: 150,
  },
  {
    id: 7,
    title: 'Eco Saint',
    description: 'Recognized for helping reduce pollution (admin validated).',
    icon: '🌿',
    conditionType: 'eco_saint_validated',
    threshold: 1,
    rewardPoints: 800,
  },
];

export function getAllAchievements() {
  return ACHIEVEMENTS;
}

export function getUnlockedAchievements() {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(UNLOCKED_KEY), []);
}

function saveUnlocked(list) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(UNLOCKED_KEY, JSON.stringify(list));
}

function getProgress() {
  if (typeof window === 'undefined') return {};
  return safeParse(window.localStorage.getItem(PROGRESS_KEY), {});
}

function saveProgress(progress) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function unlockAchievement(achievementId) {
  const all = getAllAchievements();
  const target = all.find(a => a.id === achievementId);
  if (!target) return null;

  const unlocked = getUnlockedAchievements();
  if (unlocked.some(a => a.id === achievementId)) {
    return null; // already unlocked
  }

  const unlockedAt = new Date().toISOString();
  const unlockedEntry = { ...target, unlockedAt };
  unlocked.push(unlockedEntry);
  saveUnlocked(unlocked);

  // Award points
  if (target.rewardPoints) {
    addPoints(target.rewardPoints, {
      type: 'achievement',
      label: target.title,
    });
  }

  return unlockedEntry;
}

// Main entry point - called by UI when events happen
// triggerEvent: 'report_submitted' | 'daily_login' | 'safe_route' | 'aqi_view' | 'eco_saint'
export function checkAchievements(triggerEvent) {
  const progress = getProgress();

  switch (triggerEvent) {
    case 'report_submitted': {
      const count = (progress.reports_count || 0) + 1;
      progress.reports_count = count;
      // Bonus for completing 5 reports
      if (count === 5) {
        addPoints(100, {
          type: 'bonus',
          label: 'Completed 5 reports (bonus)',
        });
      }
      break;
    }
    case 'safe_route': {
      progress.safe_routes = (progress.safe_routes || 0) + 1;
      break;
    }
    case 'aqi_view': {
      progress.aqi_views = (progress.aqi_views || 0) + 1;
      break;
    }
    case 'daily_login': {
      // streak is tracked in pointsEngine greenMeta, just mirror it here
      progress.login_streak = getLoginStreak();
      break;
    }
    case 'eco_saint': {
      progress.eco_saint_validated = 1;
      break;
    }
    default:
      break;
  }

  saveProgress(progress);

  // Evaluate which achievements have become unlocked
  const unlocked = getUnlockedAchievements();
  const unlockedIds = new Set(unlocked.map(a => a.id));
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlockedIds.has(ach.id)) continue;

    let currentValue = 0;
    if (ach.conditionType === 'reports_count') {
      currentValue = progress.reports_count || 0;
    } else if (ach.conditionType === 'aqi_views') {
      currentValue = progress.aqi_views || 0;
    } else if (ach.conditionType === 'safe_routes') {
      currentValue = progress.safe_routes || 0;
    } else if (ach.conditionType === 'login_streak') {
      currentValue = progress.login_streak || 0;
    } else if (ach.conditionType === 'eco_saint_validated') {
      currentValue = progress.eco_saint_validated || 0;
    }

    if (currentValue >= ach.threshold) {
      const entry = unlockAchievement(ach.id);
      if (entry) {
        newlyUnlocked.push(entry);
      }
    }
  }

  return newlyUnlocked;
}


