// src/utils/mobileOrientationGuard.ts
// Pure, side-effect-free mobile orientation & minimized-screen evaluator for STARLA BUDAYA.

export interface MobileViewportSnapshot {
  width: number;
  height: number;
  userAgent: string;
  maxTouchPoints?: number;
  hasCoarsePointer?: boolean;
  isMobileFlag?: boolean;
  isHidden?: boolean;
  isFullscreen?: boolean;
  wasFullscreen?: boolean;
  returningFromPortrait?: boolean;
  fullscreenSupported?: boolean;
  screenWidth?: number;
  screenHeight?: number;
  orientationType?: string;
}

export type MobileGuardReason =
  | 'desktop'
  | 'portrait'
  | 'minimized'
  | 'exited-fullscreen'
  | 'landscape-ready';

export interface MobileOrientationGuardResult {
  isMobileDevice: boolean;
  isPortrait: boolean;
  isMinimized: boolean;
  shouldShowBlackRotateNotice: boolean;
  shouldRequestFullscreen: boolean;
  reason: MobileGuardReason;
}

const MOBILE_UA_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i;

export function detectMobileViewport(snapshot: MobileViewportSnapshot): boolean {
  const width = Math.max(0, Number(snapshot.width) || 0);
  const height = Math.max(0, Number(snapshot.height) || 0);

  if (snapshot.isMobileFlag === true) {
    return true;
  }

  if (MOBILE_UA_REGEX.test(snapshot.userAgent || '')) {
    return true;
  }

  const hasTouch =
    snapshot.hasCoarsePointer === true || (snapshot.maxTouchPoints ?? 0) > 0;
  const shortestSide = Math.min(width, height);
  if (hasTouch && shortestSide > 0 && shortestSide <= 920) {
    return true;
  }

  // Narrow portrait viewport (e.g. mobile browser resize / DevTools mobile preview)
  if (width > 0 && height > width && width <= 768) {
    return true;
  }

  return false;
}

export function evaluateMobileOrientationGuard(
  snapshot: MobileViewportSnapshot
): MobileOrientationGuardResult {
  const width = Math.max(0, Number(snapshot.width) || 0);
  const height = Math.max(0, Number(snapshot.height) || 0);
  const isMobileDevice = detectMobileViewport(snapshot);

  if (!isMobileDevice) {
    return {
      isMobileDevice: false,
      isPortrait: false,
      isMinimized: false,
      shouldShowBlackRotateNotice: false,
      shouldRequestFullscreen: false,
      reason: 'desktop',
    };
  }

  const orientationType = (snapshot.orientationType || '').toLowerCase();
  const isPortrait =
    height > width ||
    (height === width && orientationType.startsWith('portrait'));

  const screenHeight = Math.max(0, Number(snapshot.screenHeight) || 0);
  const isSplitOrCompactMinimized =
    width > height &&
    ((screenHeight > 0 && height < Math.min(260, screenHeight * 0.45)) ||
      (width < 460 && height < 240));

  const isMinimized =
    snapshot.isHidden === true || isSplitOrCompactMinimized;

  const exitedFullscreen =
    snapshot.wasFullscreen === true &&
    snapshot.returningFromPortrait !== true &&
    snapshot.fullscreenSupported === true &&
    snapshot.isFullscreen === false;

  if (isPortrait) {
    return {
      isMobileDevice: true,
      isPortrait: true,
      isMinimized,
      shouldShowBlackRotateNotice: true,
      shouldRequestFullscreen: false,
      reason: 'portrait',
    };
  }

  if (isMinimized) {
    return {
      isMobileDevice: true,
      isPortrait: false,
      isMinimized: true,
      shouldShowBlackRotateNotice: true,
      shouldRequestFullscreen: false,
      reason: 'minimized',
    };
  }

  if (exitedFullscreen) {
    return {
      isMobileDevice: true,
      isPortrait: false,
      isMinimized: true,
      shouldShowBlackRotateNotice: true,
      shouldRequestFullscreen: true,
      reason: 'exited-fullscreen',
    };
  }

  return {
    isMobileDevice: true,
    isPortrait: false,
    isMinimized: false,
    shouldShowBlackRotateNotice: false,
    shouldRequestFullscreen: snapshot.isFullscreen !== true,
    reason: 'landscape-ready',
  };
}
