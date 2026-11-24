// src/utils/pwaInstallScheduler.ts
// Pure decoupled PWA hybrid install detection, embed handling, and 40s / 100s session prompt scheduler.

export const PWA_INSTALL_STORAGE_KEY = 'starla_pwa_installed_v1';

/** Exact per-load / per-refresh popup trigger checkpoints in seconds (40s and 100s). */
export const DEFAULT_PROMPT_SCHEDULE_SECONDS = [40, 100] as const;

/** Exact per-load / per-refresh popup trigger checkpoints in milliseconds (40_000ms and 100_000ms). */
export const DEFAULT_PROMPT_SCHEDULE_MS = [40_000, 100_000] as const;

export const DEFAULT_INITIAL_PROMPT_DELAY_MS = DEFAULT_PROMPT_SCHEDULE_MS[0];
export const DEFAULT_RECURRING_PROMPT_DELAY_MS =
  DEFAULT_PROMPT_SCHEDULE_MS[1] - DEFAULT_PROMPT_SCHEDULE_MS[0];

export interface PwaEnvironmentSnapshot {
  displayModeStandalone?: boolean;
  displayModeFullscreen?: boolean;
  navigatorStandalone?: boolean;
  installedStorageFlag?: string | null;
  hasDeferredPrompt?: boolean;
  isInIframe?: boolean;
  userAgent?: string;
}

export type PwaInstallActionMode =
  | 'already-installed'
  | 'native-prompt'
  | 'embed-standalone-launch'
  | 'ios-guide'
  | 'manual-browser-guide';

export interface PwaScheduleGuardState {
  isInstalled: boolean;
  isAdminRoute: boolean;
  isMobileRotateGuardVisible: boolean;
  isNoticeCurrentlyOpen: boolean;
}

export function detectStandaloneInstalled(
  env: PwaEnvironmentSnapshot
): boolean {
  return Boolean(
    env.displayModeStandalone ||
      env.displayModeFullscreen ||
      env.navigatorStandalone ||
      env.installedStorageFlag === '1'
  );
}

export function detectIOSDevice(userAgent: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgent || '');
}

export function resolveInstallActionMode(
  env: PwaEnvironmentSnapshot
): PwaInstallActionMode {
  if (detectStandaloneInstalled(env)) {
    return 'already-installed';
  }
  if (env.hasDeferredPrompt) {
    return 'native-prompt';
  }
  if (env.isInIframe) {
    return 'embed-standalone-launch';
  }
  if (detectIOSDevice(env.userAgent || '')) {
    return 'ios-guide';
  }
  return 'manual-browser-guide';
}

export function shouldScheduleInstallNotice(
  state: PwaScheduleGuardState
): boolean {
  if (state.isInstalled) return false;
  if (state.isAdminRoute) return false;
  if (state.isMobileRotateGuardVisible) return false;
  if (state.isNoticeCurrentlyOpen) return false;
  return true;
}

/**
 * Computes the remaining delay (in ms) until the next scheduled PWA popup mark
 * within the current page load (default: 40s and 100s).
 * Returns `null` once all checkpoints for the current load have been triggered.
 * Refreshing/reloading the page resets `elapsedMs` and `triggeredSlotCount` to 0,
 * so the popup naturally re-appears at 40s and 100s on every fresh load.
 */
export function getNextScheduledPromptDelayMs(
  elapsedMs: number,
  triggeredSlotCount: number,
  scheduleMs: readonly number[] = DEFAULT_PROMPT_SCHEDULE_MS
): number | null {
  if (!Array.isArray(scheduleMs) || scheduleMs.length === 0) return null;
  const safeSlot = Math.max(0, Math.floor(triggeredSlotCount));
  if (safeSlot >= scheduleMs.length) return null;
  const targetMs = scheduleMs[safeSlot];
  const safeElapsed = Math.max(0, Number(elapsedMs) || 0);
  return Math.max(0, targetMs - safeElapsed);
}

/**
 * Advances the slot index past any checkpoints that already elapsed while the
 * user had a previous popup open, preventing an immediate re-open on dismiss.
 */
export function advanceScheduleSlotOnDismiss(
  elapsedMs: number,
  currentTriggeredSlotCount: number,
  scheduleMs: readonly number[] = DEFAULT_PROMPT_SCHEDULE_MS
): number {
  const safeElapsed = Math.max(0, Number(elapsedMs) || 0);
  let nextSlot = Math.max(0, Math.floor(currentTriggeredSlotCount));
  while (nextSlot < scheduleMs.length && scheduleMs[nextSlot] <= safeElapsed) {
    nextSlot += 1;
  }
  return nextSlot;
}

export function computeNextPromptDelayMs(
  dismissCount: number,
  initialDelayMs: number = DEFAULT_INITIAL_PROMPT_DELAY_MS,
  recurringDelayMs: number = DEFAULT_RECURRING_PROMPT_DELAY_MS
): number {
  const safeInitial = Math.max(
    500,
    Number(initialDelayMs) || DEFAULT_INITIAL_PROMPT_DELAY_MS
  );
  const safeRecurring = Math.max(
    1000,
    Number(recurringDelayMs) || DEFAULT_RECURRING_PROMPT_DELAY_MS
  );
  return dismissCount <= 0 ? safeInitial : safeRecurring;
}

export function buildStandaloneInstallUrl(currentHref: string): string {
  try {
    const parsed = new URL(currentHref);
    parsed.searchParams.set('install_pwa', '1');
    return parsed.toString();
  } catch {
    return '/?install_pwa=1';
  }
}
