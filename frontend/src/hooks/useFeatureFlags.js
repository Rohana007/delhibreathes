import { CURRENT_ROUND } from '../config/appConfig';
import { featureFlags } from '../config/featureFlags';

export function useFeatureFlags() {
  const flags = featureFlags[CURRENT_ROUND] || featureFlags[1];
  return flags;
}

