// src/utils/viewportFitEngine.ts
// Pure decoupled Auto-Rotate & Auto-Scale Fit-to-Screen math and mobile guard evaluation.

export interface ViewportSnapshot {
  innerWidth: number;
  innerHeight: number;
  visualViewportWidth?: number;
  visualViewportHeight?: number;
  screenWidth?: number;
  screenHeight?: number;
  orientationType?: string;
  userAgent?: string;
  maxTouchPoints?: number;
  hasCoarsePointer?: boolean;
  isMobileFlag?: boolean;
  isDocumentHidden?: boolean;
  isFullscreen?: boolean;
  isFullscreenSupported?: boolean;
  wasInFullscreen?: boolean;
  lastReason?: string;
  isTextInputFocused?: boolean;
}

export interface AutoRotateGuardDecision {
  isMobileDevice: boolean;
  isPortrait: boolean;
  isMinimized: boolean;
  shouldShowBlackRotateNotice: boolean;
  shouldRequestFullscreen: boolean;
  shouldResetWasInFullscreen: boolean;
  viewportWidth: number;
  viewportHeight: number;
  reason: 'desktop' | 'portrait' | 'minimized' | 'exited-fullscreen' | 'landscape-ready';
}

export interface StageFitRect {
  width: number;
  height: number;
  left: number;
  top: number;
  scale: number;
}

const MOBILE_UA_RE =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i;

/**
 * Resolves the authoritative live viewport dimensions, preferring VisualViewport
 * when available so mobile toolbars, notches, and orientation animations are exact.
 */
export function resolveEffectiveViewport(
  innerWidth: number,
  innerHeight: number,
  visualViewportWidth?: number,
  visualViewportHeight?: number
): { width: number; height: number } {
  const safeInnerW = Math.max(0, Number(innerWidth) || 0);
  const safeInnerH = Math.max(0, Number(innerHeight) || 0);
  const safeVvW = Math.max(0, Number(visualViewportWidth) || 0);
  const safeVvH = Math.max(0, Number(visualViewportHeight) || 0);

  const width = safeVvW > 0 ? Math.min(safeInnerW || safeVvW, safeVvW) : safeInnerW;
  const height = safeVvH > 0 ? Math.min(safeInnerH || safeVvH, safeVvH) : safeInnerH;
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Evaluates whether a mobile device is in portrait/minimized mode (show black rotate guard)
 * or landscape mode (auto-hide guard & restore fullscreen fit), while safely protecting
 * active text input (mobile soft keyboard in landscape must NEVER trigger black screen).
 */
export function evaluateAutoRotateAndGuardState(
  snap: ViewportSnapshot
): AutoRotateGuardDecision {
  const { width: w, height: h } = resolveEffectiveViewport(
    snap.innerWidth,
    snap.innerHeight,
    snap.visualViewportWidth,
    snap.visualViewportHeight
  );
  const ua = snap.userAgent || '';
  const maxTouch = Number(snap.maxTouchPoints) || 0;
  const hasCoarse = Boolean(snap.hasCoarsePointer);
  const shortestSide = Math.min(w, h);

  const isMobileDevice = Boolean(
    snap.isMobileFlag ||
      MOBILE_UA_RE.test(ua) ||
      ((hasCoarse || maxTouch > 0) && shortestSide > 0 && shortestSide <= 920) ||
      (w > 0 && h > w && w <= 768)
  );

  if (!isMobileDevice) {
    return {
      isMobileDevice: false,
      isPortrait: false,
      isMinimized: false,
      shouldShowBlackRotateNotice: false,
      shouldRequestFullscreen: false,
      shouldResetWasInFullscreen: false,
      viewportWidth: w,
      viewportHeight: h,
      reason: 'desktop',
    };
  }

  const orientLower = (snap.orientationType || '').toLowerCase();
  const isPortrait =
    h > w || (h === w && orientLower.startsWith('portrait'));

  // Never falsely classify mobile landscape soft-keyboard shrinkage as "minimized"
  const isTyping = Boolean(snap.isTextInputFocused);
  const scrH = Math.max(0, Number(snap.screenHeight) || 0);
  const isSplitOrCompact =
    !isTyping &&
    w > h &&
    ((scrH > 0 && h < Math.min(190, scrH * 0.36)) || (w < 380 && h < 200));

  const isMinimized = Boolean(snap.isDocumentHidden) || isSplitOrCompact;
  const isFullscreen = Boolean(snap.isFullscreen);
  const fsSupported = Boolean(snap.isFullscreenSupported);
  const returningFromPortrait =
    snap.lastReason === 'portrait' && !isPortrait;
  const effectiveWasInFs = returningFromPortrait
    ? false
    : Boolean(snap.wasInFullscreen);
  const exitedFullscreen =
    !isTyping && effectiveWasInFs && fsSupported && !isFullscreen;

  if (isPortrait) {
    return {
      isMobileDevice: true,
      isPortrait: true,
      isMinimized,
      shouldShowBlackRotateNotice: true,
      shouldRequestFullscreen: false,
      shouldResetWasInFullscreen: false,
      viewportWidth: w,
      viewportHeight: h,
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
      shouldResetWasInFullscreen: false,
      viewportWidth: w,
      viewportHeight: h,
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
      shouldResetWasInFullscreen: false,
      viewportWidth: w,
      viewportHeight: h,
      reason: 'exited-fullscreen',
    };
  }

  return {
    isMobileDevice: true,
    isPortrait: false,
    isMinimized: false,
    shouldShowBlackRotateNotice: false,
    shouldRequestFullscreen: !isFullscreen && !isTyping,
    shouldResetWasInFullscreen: returningFromPortrait,
    viewportWidth: w,
    viewportHeight: h,
    reason: 'landscape-ready',
  };
}

/**
 * Computes exact aspect-ratio-preserving fit-to-screen geometry for the 1280x720 STARLA stage.
 */
export function computeAutoScaleFitRect(
  viewportWidth: number,
  viewportHeight: number,
  stageWidth: number = 1280,
  stageHeight: number = 720
): StageFitRect {
  const vw = Math.max(1, Number(viewportWidth) || 1);
  const vh = Math.max(1, Number(viewportHeight) || 1);
  const sw = Math.max(1, Number(stageWidth) || 1280);
  const sh = Math.max(1, Number(stageHeight) || 720);

  const scale = Math.min(vw / sw, vh / sh);
  const width = Math.floor(sw * scale);
  const height = Math.floor(sh * scale);
  const left = Math.floor((vw - width) / 2);
  const top = Math.floor((vh - height) / 2);

  return { width, height, left, top, scale };
}

/**
 * Checks whether a live Storyline stage bounding box has drifted out of bounds or
 * stayed stale/undersized after an orientation change or fullscreen transition.
 */
export function needsStageRescaleRecovery(
  stageRect: { left: number; top: number; right: number; bottom: number; width: number; height: number },
  viewportWidth: number,
  viewportHeight: number
): boolean {
  const vw = Math.max(1, Number(viewportWidth) || 1);
  const vh = Math.max(1, Number(viewportHeight) || 1);
  if (stageRect.width <= 0 || stageRect.height <= 0) return true;

  // Stage overflowing viewport edges beyond 8px tolerance
  if (
    stageRect.left < -8 ||
    stageRect.top < -8 ||
    stageRect.right > vw + 8 ||
    stageRect.bottom > vh + 8
  ) {
    return true;
  }

  // Stage stuck significantly smaller than expected 16:9 fit (classic post-rotate stale size)
  const expected = computeAutoScaleFitRect(vw, vh, 1280, 720);
  if (
    stageRect.width < expected.width * 0.78 &&
    stageRect.height < expected.height * 0.78
  ) {
    return true;
  }

  return false;
}

export type FullscreenExpandTrigger =
  | 'fingerprint-access'
  | 'landscape-enter'
  | 'gesture-bridge';

export interface UniversalFullscreenPolicyInput {
  trigger: FullscreenExpandTrigger;
  viewportWidth: number;
  viewportHeight: number;
  isFullscreen: boolean;
  isFullscreenSupported: boolean;
  isMobileDevice: boolean;
  isAdminRoute?: boolean;
  isTextInputFocused?: boolean;
  desktopUserExitedFullscreen?: boolean;
}

export interface UniversalFullscreenPolicyDecision {
  shouldExpandFullscreen: boolean;
  shouldLockLandscape: boolean;
  shouldArmGestureFallback: boolean;
  reason:
    | 'admin-route'
    | 'unsupported'
    | 'already-fullscreen'
    | 'typing-protected'
    | 'desktop-user-exited'
    | 'awaiting-landscape'
    | 'expand-fingerprint'
    | 'expand-landscape'
    | 'expand-gesture-bridge';
}

/**
 * Pure universal auto-fullscreen ("auto perluas layar") policy across ALL devices
 * (Desktop, Laptop, Tablet, Mobile) while preserving 100% native proportional 16:9 scaling:
 * - Tapping the fingerprint / ACCESS stage always expands fullscreen on all devices.
 * - Entering landscape mode automatically expands fullscreen on all devices (and arms
 *   a silent one-shot gesture bridge if passive fullscreen is blocked by browser policy).
 * - Respects desktop users who explicitly press Esc, active text input, and /admin routes.
 */
export function evaluateUniversalFullscreenPolicy(
  input: UniversalFullscreenPolicyInput
): UniversalFullscreenPolicyDecision {
  const baseDeny = (
    reason: UniversalFullscreenPolicyDecision['reason']
  ): UniversalFullscreenPolicyDecision => ({
    shouldExpandFullscreen: false,
    shouldLockLandscape: false,
    shouldArmGestureFallback: false,
    reason,
  });

  if (input.isAdminRoute) {
    return baseDeny('admin-route');
  }
  if (!input.isFullscreenSupported) {
    return baseDeny('unsupported');
  }
  if (input.isFullscreen) {
    return baseDeny('already-fullscreen');
  }
  if (input.isTextInputFocused) {
    return baseDeny('typing-protected');
  }

  const vw = Math.max(0, Number(input.viewportWidth) || 0);
  const vh = Math.max(0, Number(input.viewportHeight) || 0);
  const isLandscape = vw > vh;

  if (input.trigger === 'fingerprint-access') {
    return {
      shouldExpandFullscreen: true,
      shouldLockLandscape: input.isMobileDevice,
      shouldArmGestureFallback: true,
      reason: 'expand-fingerprint',
    };
  }

  if (!isLandscape) {
    return baseDeny('awaiting-landscape');
  }

  if (!input.isMobileDevice && input.desktopUserExitedFullscreen) {
    return baseDeny('desktop-user-exited');
  }

  if (input.trigger === 'gesture-bridge') {
    return {
      shouldExpandFullscreen: true,
      shouldLockLandscape: input.isMobileDevice,
      shouldArmGestureFallback: false,
      reason: 'expand-gesture-bridge',
    };
  }

  return {
    shouldExpandFullscreen: true,
    shouldLockLandscape: input.isMobileDevice,
    shouldArmGestureFallback: true,
    reason: 'expand-landscape',
  };
}
