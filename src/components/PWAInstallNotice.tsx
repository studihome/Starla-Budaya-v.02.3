import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  PWA_INSTALL_STORAGE_KEY,
  DEFAULT_PROMPT_SCHEDULE_MS,
  DEFAULT_PROMPT_SCHEDULE_SECONDS,
  advanceScheduleSlotOnDismiss,
  buildStandaloneInstallUrl,
  detectStandaloneInstalled,
  getNextScheduledPromptDelayMs,
  resolveInstallActionMode,
  shouldScheduleInstallNotice,
} from '../utils/pwaInstallScheduler';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface StarlaPwaWindow extends Window {
  __STARLA_DEFERRED_INSTALL_PROMPT__?: BeforeInstallPromptEvent | null;
  __STARLA_PWA_NOTICE__?: {
    open: () => void;
    dismiss: () => void;
    getState: () => {
      isInstalled: boolean;
      isOpen: boolean;
      dismissCount: number;
      triggeredSlotCount: number;
      scheduleSeconds: readonly number[];
      nextDelayMs: number | null;
      mode: string;
      isOnline: boolean;
    };
  };
}

const EXIT_ANIMATION_MS = 240;

const STARLA_PWA_SCOPED_CSS = `
@keyframes starlaPwaBackdropIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes starlaPwaBackdropOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes starlaPwaCardIn {
  0% {
    opacity: 0;
    transform: translate3d(0, 18px, 0) scale(0.955);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}
@keyframes starlaPwaCardOut {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate3d(0, 12px, 0) scale(0.965);
  }
}
@keyframes starlaPwaStarLevitate {
  0%, 100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, -4.5px, 0) scale(1.025);
  }
}
@keyframes starlaPwaAuraBreath {
  0%, 100% {
    opacity: 0.42;
    transform: scale(0.94);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.08);
  }
}
@keyframes starlaPwaHaloOrbit {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes starlaPwaFadeRise {
  0% {
    opacity: 0;
    transform: translate3d(0, 9px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
@keyframes starlaPwaBorderTrace {
  0% {
    stroke-dashoffset: 1200;
  }
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes starlaPwaBtnSheen {
  0%, 62% {
    transform: translate3d(-150%, 0, 0) skewX(-24deg);
    opacity: 0;
  }
  72% {
    opacity: 0.55;
  }
  94% {
    transform: translate3d(280%, 0, 0) skewX(-24deg);
    opacity: 0;
  }
  100% {
    transform: translate3d(280%, 0, 0) skewX(-24deg);
    opacity: 0;
  }
}
.starla-pwa-backdrop {
  animation: starlaPwaBackdropIn 320ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.starla-pwa-backdrop.is-closing {
  animation: starlaPwaBackdropOut ${EXIT_ANIMATION_MS}ms cubic-bezier(0.4, 0, 1, 1) forwards;
  pointer-events: none !important;
}
.starla-pwa-card {
  animation: starlaPwaCardIn 460ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  will-change: transform, opacity;
}
.starla-pwa-card.is-closing {
  animation: starlaPwaCardOut ${EXIT_ANIMATION_MS}ms cubic-bezier(0.4, 0, 1, 1) forwards;
}
.starla-pwa-star-stage {
  animation: starlaPwaFadeRise 380ms cubic-bezier(0.16, 1, 0.3, 1) 40ms both;
}
.starla-pwa-star-float {
  animation: starlaPwaStarLevitate 4.4s ease-in-out 460ms infinite;
  will-change: transform;
}
.starla-pwa-aura {
  animation: starlaPwaAuraBreath 5.2s ease-in-out infinite;
  will-change: transform, opacity;
}
.starla-pwa-orbit {
  animation: starlaPwaHaloOrbit 26s linear infinite;
  will-change: transform;
}
.starla-pwa-copy {
  animation: starlaPwaFadeRise 380ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both;
}
.starla-pwa-btn-wrap {
  animation: starlaPwaFadeRise 380ms cubic-bezier(0.16, 1, 0.3, 1) 155ms both;
}
.starla-pwa-border-trace {
  stroke-dasharray: 110 1090;
  stroke-dashoffset: 1200;
  animation: starlaPwaBorderTrace 7.5s linear infinite;
}
.starla-pwa-close-btn {
  transition: background-color 180ms ease, color 180ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
}
.starla-pwa-close-btn:hover {
  background-color: rgba(251, 191, 36, 0.16) !important;
  color: #FFFBEB !important;
  transform: scale(1.06);
}
.starla-pwa-close-btn:active {
  transform: scale(0.94);
}
.starla-pwa-close-btn:focus-visible {
  outline: 2px solid #FDE047;
  outline-offset: 2px;
}
.starla-pwa-download-btn {
  position: relative;
  overflow: hidden;
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 200ms cubic-bezier(0.22, 1, 0.36, 1),
              filter 200ms ease;
}
.starla-pwa-download-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 42%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,251,235,0.72) 50%, rgba(255,255,255,0) 100%);
  pointer-events: none;
  animation: starlaPwaBtnSheen 4.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}
.starla-pwa-download-btn:hover {
  transform: translate3d(0, -1.5px, 0);
  box-shadow: 0 14px 28px rgba(217, 119, 6, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.78), inset 0 -1.5px 0 rgba(120, 53, 15, 0.45) !important;
  filter: brightness(1.04);
}
.starla-pwa-download-btn:active {
  transform: translate3d(0, 0.5px, 0) scale(0.975);
}
.starla-pwa-download-btn:focus-visible {
  outline: 2px solid #FEF08A;
  outline-offset: 3px;
}
.starla-pwa-hint {
  animation: starlaPwaFadeRise 260ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@media (max-height: 440px) {
  .starla-pwa-card {
    max-width: 264px !important;
    padding: 24px 24px 22px !important;
  }
  .starla-pwa-star-stage {
    width: 68px !important;
    height: 68px !important;
    margin-bottom: 8px !important;
  }
  .starla-pwa-star-stage svg[data-testid="starla-pwa-star-icon"] {
    width: 52px !important;
    height: 52px !important;
  }
  .starla-pwa-btn-wrap {
    margin-top: 14px !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .starla-pwa-backdrop,
  .starla-pwa-backdrop.is-closing,
  .starla-pwa-card,
  .starla-pwa-card.is-closing,
  .starla-pwa-star-stage,
  .starla-pwa-star-float,
  .starla-pwa-aura,
  .starla-pwa-orbit,
  .starla-pwa-copy,
  .starla-pwa-btn-wrap,
  .starla-pwa-border-trace,
  .starla-pwa-download-btn::after,
  .starla-pwa-hint {
    animation: none !important;
    transition: none !important;
  }
}
`;

function readInstalledFlag(): string | null {
  try {
    return window.localStorage.getItem(PWA_INSTALL_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistInstalledFlag(): void {
  try {
    window.localStorage.setItem(PWA_INSTALL_STORAGE_KEY, '1');
  } catch {
    // ignore storage errors in restricted iframes
  }
}

function isEmbeddedIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isAdminPath(): boolean {
  try {
    return (
      window.location.pathname.startsWith('/admin') ||
      (window.location.search || '').includes('mode=admin')
    );
  } catch {
    return false;
  }
}

function isMobileRotateGuardOpen(): boolean {
  try {
    const el = document.getElementById('starla-mobile-rotate-guard');
    return Boolean(el && el.classList.contains('is-visible'));
  } catch {
    return false;
  }
}

function isFrontStageVisible(): boolean {
  try {
    const stage = document.getElementById('starla-front-stage');
    if (!stage) return false;
    return !stage.classList.contains('hidden-stage');
  } catch {
    return false;
  }
}

/**
 * STARLA BUDAYA Hybrid PWA Install Notice + subtle Offline indicator.
 * - Mounted via dedicated `document.body` portal (strictly outside `#preso`).
 * - Visual design harmonized with STARLA BUDAYA: royal teak-mahogany obsidian glass,
 *   sculpted Nusantara pendopo/gunungan & sulur corner filigree gold frame,
 *   exact transparent yellow star favicon with celestial aura, and smooth GPU motion.
 * - Exact per-load / per-refresh schedule: appears at 40s and 100s on every page load
 *   whenever the app is not yet installed.
 */
export const PWAInstallNotice: React.FC = React.memo(() => {
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(() => {
      if (typeof window === 'undefined') return null;
      return (
        (window as StarlaPwaWindow).__STARLA_DEFERRED_INSTALL_PROMPT__ ?? null
      );
    });
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return detectStandaloneInstalled({
      displayModeStandalone: window.matchMedia?.(
        '(display-mode: standalone)'
      )?.matches,
      displayModeFullscreen: window.matchMedia?.(
        '(display-mode: fullscreen)'
      )?.matches,
      navigatorStandalone:
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true,
      installedStorageFlag: readInstalledFlag(),
    });
  });

  // In-memory per-page-load clock & slot tracker so browser refresh resets to 40s and 100s
  const sessionStartMsRef = useRef<number>(Date.now());
  const [triggeredSlotCount, setTriggeredSlotCount] = useState<number>(0);
  const [frontStageTick, setFrontStageTick] = useState<number>(0);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [dismissCount, setDismissCount] = useState<number>(0);
  const [inlineHint, setInlineHint] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const closeTimerRef = useRef<number | null>(null);

  const actionMode = useMemo(() => {
    if (typeof window === 'undefined') return 'manual-browser-guide';
    return resolveInstallActionMode({
      displayModeStandalone: isInstalled,
      hasDeferredPrompt: Boolean(deferredPrompt),
      isInIframe: isEmbeddedIframe(),
      userAgent: window.navigator.userAgent || '',
    });
  }, [isInstalled, deferredPrompt]);

  // Mount portal host strictly on document.body (never inside #preso)
  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return;
    let host = document.getElementById(
      'starla-pwa-portal-host'
    ) as HTMLElement | null;
    if (!host || host.parentElement !== document.body) {
      if (!host) {
        host = document.createElement('div');
        host.id = 'starla-pwa-portal-host';
      }
      host.style.position = 'fixed';
      host.style.inset = '0';
      host.style.width = '0';
      host.style.height = '0';
      host.style.pointerEvents = 'none';
      host.style.zIndex = '2147483645';
      document.body.appendChild(host);
    }
    setPortalHost(host);

    // Inject or refresh scoped motion styles once in document.head
    if (document.head) {
      let styleEl = document.getElementById(
        'starla-pwa-motion-styles'
      ) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'starla-pwa-motion-styles';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = STARLA_PWA_SCOPED_CSS;
    }
  }, []);

  // Synchronize smooth enter / exit animation lifecycle
  useEffect(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (!isInstalled && isOpen) {
      setIsClosing(false);
      setIsMounted(true);
      return;
    }

    if (isMounted) {
      setIsClosing(true);
      closeTimerRef.current = window.setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
        closeTimerRef.current = null;
      }, EXIT_ANIMATION_MS);
    }

    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen, isInstalled, isMounted]);

  // Listen for browser install lifecycle & online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as StarlaPwaWindow;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEv = e as BeforeInstallPromptEvent;
      win.__STARLA_DEFERRED_INSTALL_PROMPT__ = promptEv;
      setDeferredPrompt(promptEv);
    };

    const handleAppInstalled = () => {
      persistInstalledFlag();
      win.__STARLA_DEFERRED_INSTALL_PROMPT__ = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsOpen(false);
      setInlineHint(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If launched via explicit standalone install handoff (?install_pwa=1), open promptly
    const qs = window.location.search || '';
    if (
      !isInstalled &&
      !isAdminPath() &&
      /(?:^|[?&])install_pwa=1(?:&|$)/i.test(qs)
    ) {
      const quickTimer = window.setTimeout(() => {
        if (!isMobileRotateGuardOpen() && !isFrontStageVisible()) {
          setIsOpen(true);
        }
      }, 900);
      return () => {
        window.clearTimeout(quickTimer);
        window.removeEventListener(
          'beforeinstallprompt',
          handleBeforeInstallPrompt
        );
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isInstalled]);

  // Exact 40s & 100s per-load scheduler (automatically resets on every browser refresh)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canSchedule = shouldScheduleInstallNotice({
      isInstalled,
      isAdminRoute: isAdminPath(),
      isMobileRotateGuardVisible: false,
      isNoticeCurrentlyOpen: isOpen,
    });
    if (!canSchedule) return;

    const elapsedMs = Date.now() - sessionStartMsRef.current;
    const scheduledDelayMs = getNextScheduledPromptDelayMs(
      elapsedMs,
      triggeredSlotCount,
      DEFAULT_PROMPT_SCHEDULE_MS
    );
    if (scheduledDelayMs === null) return;

    const delayMs =
      frontStageTick > 0 && scheduledDelayMs === 0 ? 1500 : scheduledDelayMs;

    const timerId = window.setTimeout(() => {
      if (isAdminPath()) return;
      if (isMobileRotateGuardOpen() || isFrontStageVisible()) {
        // Defer gracefully without consuming the 40s/100s slot until user is past front-stage & in landscape
        setFrontStageTick((prev) => prev + 1);
        return;
      }
      setFrontStageTick(0);
      setTriggeredSlotCount((prev) => prev + 1);
      setInlineHint(null);
      setIsOpen(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isInstalled, isOpen, triggeredSlotCount, frontStageTick]);

  const handleDismiss = useCallback(() => {
    const elapsedMs = Date.now() - sessionStartMsRef.current;
    setIsOpen(false);
    setInlineHint(null);
    setDismissCount((prev) => prev + 1);
    setTriggeredSlotCount((prev) =>
      advanceScheduleSlotOnDismiss(elapsedMs, prev, DEFAULT_PROMPT_SCHEDULE_MS)
    );
  }, []);

  // Support Escape key dismissal while open
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleDismiss]);

  const handleInstallTrigger = useCallback(async () => {
    const win = window as StarlaPwaWindow;
    const activePrompt =
      deferredPrompt || win.__STARLA_DEFERRED_INSTALL_PROMPT__ || null;

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          persistInstalledFlag();
          win.__STARLA_DEFERRED_INSTALL_PROMPT__ = null;
          setDeferredPrompt(null);
          setIsInstalled(true);
          setIsOpen(false);
          setInlineHint(null);
          return;
        }
        handleDismiss();
        return;
      } catch {
        // Fall through to hybrid guidance
      }
    }

    if (actionMode === 'embed-standalone-launch') {
      const standaloneUrl = buildStandaloneInstallUrl(window.location.href);
      const a = document.createElement('a');
      a.href = standaloneUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setInlineHint('Membuka tab baru untuk memasang Starla Budaya...');
      return;
    }

    if (actionMode === 'ios-guide') {
      setInlineHint('Ketuk Bagikan (Share) → Tambah ke Layar Utama');
      return;
    }

    setInlineHint('Buka menu browser (⋮) → Instal Aplikasi');
  }, [deferredPrompt, actionMode, handleDismiss]);

  // Expose lightweight runtime controller for verification & clean programmatic control
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as StarlaPwaWindow;
    win.__STARLA_PWA_NOTICE__ = {
      open: () => {
        if (!isInstalled && !isAdminPath()) {
          setInlineHint(null);
          setIsOpen(true);
        }
      },
      dismiss: handleDismiss,
      getState: () => ({
        isInstalled,
        isOpen,
        dismissCount,
        triggeredSlotCount,
        scheduleSeconds: DEFAULT_PROMPT_SCHEDULE_SECONDS,
        nextDelayMs: getNextScheduledPromptDelayMs(
          Date.now() - sessionStartMsRef.current,
          triggeredSlotCount,
          DEFAULT_PROMPT_SCHEDULE_MS
        ),
        mode: actionMode,
        isOnline,
      }),
    };
    return () => {
      delete win.__STARLA_PWA_NOTICE__;
    };
  }, [
    isInstalled,
    isOpen,
    dismissCount,
    triggeredSlotCount,
    actionMode,
    isOnline,
    handleDismiss,
  ]);

  if (!portalHost) return null;

  return createPortal(
    <>
      {isMounted && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mainkan Offline"
          data-testid="starla-pwa-install-notice"
          className={`starla-pwa-backdrop${isClosing ? ' is-closing' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDismiss();
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483645,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(10, 6, 4, 0.66)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            pointerEvents: 'auto',
            fontFamily:
              "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          <div
            className={`starla-pwa-card${isClosing ? ' is-closing' : ''}`}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '300px',
              padding: '34px 30px 30px',
              textAlign: 'center',
              color: '#FFFBEB',
              filter:
                'drop-shadow(0 28px 54px rgba(0, 0, 0, 0.74)) drop-shadow(0 0 28px rgba(217, 119, 6, 0.14))',
            }}
          >
            {/* STARLA Royal Mahogany & Sculpted Nusantara Gold Frame */}
            <svg
              aria-hidden="true"
              data-testid="starla-pwa-nusantara-border"
              viewBox="0 0 300 264"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',
              }}
            >
              <defs>
                {/* Warm STARLA Teak-Mahogany Obsidian Surface */}
                <linearGradient
                  id="starlaRoyalSurface"
                  x1="150"
                  y1="0"
                  x2="150"
                  y2="264"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#2A190E" stopOpacity="0.97" />
                  <stop offset="52%" stopColor="#190F09" stopOpacity="0.985" />
                  <stop offset="100%" stopColor="#100905" stopOpacity="0.99" />
                </linearGradient>

                {/* Warm Radial Sunbeam Glow Behind Star */}
                <radialGradient
                  id="starlaRoyalTopGlow"
                  cx="50%"
                  cy="24%"
                  r="58%"
                >
                  <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.2" />
                  <stop offset="52%" stopColor="#D97706" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#190F09" stopOpacity="0" />
                </radialGradient>

                {/* Subtle Architectural Batik Kawung Pattern */}
                <pattern
                  id="starlaKawungSilk"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M12 2 C15 6, 15 10, 12 12 C9 10, 9 6, 12 2 Z M12 22 C15 18, 15 14, 12 12 C9 14, 9 18, 12 22 Z M2 12 C6 15, 10 15, 12 12 C10 9, 6 9, 2 12 Z M22 12 C18 15, 14 15, 12 12 C14 9, 18 9, 22 12 Z"
                    fill="none"
                    stroke="#FDE68A"
                    strokeWidth="0.6"
                    opacity="0.06"
                  />
                </pattern>

                {/* Burnished Royal Gold Border Gradient */}
                <linearGradient
                  id="starlaNusantaraGold"
                  x1="0"
                  y1="0"
                  x2="300"
                  y2="264"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
                  <stop offset="32%" stopColor="#D97706" stopOpacity="0.72" />
                  <stop offset="68%" stopColor="#FBBF24" stopOpacity="0.88" />
                  <stop offset="100%" stopColor="#B45309" stopOpacity="0.78" />
                </linearGradient>

                {/* Animated Specular Gold Shimmer Trace */}
                <linearGradient
                  id="starlaNusantaraTrace"
                  x1="0"
                  y1="0"
                  x2="300"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0" />
                  <stop offset="50%" stopColor="#FEF9C3" stopOpacity="0.98" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>

                <clipPath id="starlaCardClip">
                  <path d="M 30 12 L 126 12 L 139 4.5 L 150 0 L 161 4.5 L 174 12 L 270 12 L 278 20 L 286 20 L 286 28 L 294 36 L 294 228 L 286 236 L 286 244 L 278 244 L 270 252 L 174 252 L 161 259.5 L 150 264 L 139 259.5 L 126 252 L 30 252 L 22 244 L 14 244 L 14 236 L 6 228 L 6 36 L 14 28 L 14 20 L 22 20 Z" />
                </clipPath>
              </defs>

              {/* Base Royal Mahogany Surface */}
              <path
                d="M 30 12 L 126 12 L 139 4.5 L 150 0 L 161 4.5 L 174 12 L 270 12 L 278 20 L 286 20 L 286 28 L 294 36 L 294 228 L 286 236 L 286 244 L 278 244 L 270 252 L 174 252 L 161 259.5 L 150 264 L 139 259.5 L 126 252 L 30 252 L 22 244 L 14 244 L 14 236 L 6 228 L 6 36 L 14 28 L 14 20 L 22 20 Z"
                fill="url(#starlaRoyalSurface)"
              />

              {/* Clipped Interior Batik Kawung Silk + Golden Sunbeam Radiance */}
              <g clipPath="url(#starlaCardClip)">
                <rect width="300" height="264" fill="url(#starlaKawungSilk)" />
                <rect width="300" height="264" fill="url(#starlaRoyalTopGlow)" />
              </g>

              {/* Sculpted Outer Nusantara Pendopo & Gunungan Gold Stroke */}
              <path
                d="M 30 12 L 126 12 L 139 4.5 L 150 0 L 161 4.5 L 174 12 L 270 12 L 278 20 L 286 20 L 286 28 L 294 36 L 294 228 L 286 236 L 286 244 L 278 244 L 270 252 L 174 252 L 161 259.5 L 150 264 L 139 259.5 L 126 252 L 30 252 L 22 244 L 14 244 L 14 236 L 6 228 L 6 36 L 14 28 L 14 20 L 22 20 Z"
                fill="none"
                stroke="url(#starlaNusantaraGold)"
                strokeWidth="1.6"
                strokeLinejoin="miter"
                vectorEffect="non-scaling-stroke"
              />

              {/* Smooth Animated Specular Gold Trace Gliding Around the Frame */}
              <path
                className="starla-pwa-border-trace"
                d="M 30 12 L 126 12 L 139 4.5 L 150 0 L 161 4.5 L 174 12 L 270 12 L 278 20 L 286 20 L 286 28 L 294 36 L 294 228 L 286 236 L 286 244 L 278 244 L 270 252 L 174 252 L 161 259.5 L 150 264 L 139 259.5 L 126 252 L 30 252 L 22 244 L 14 244 L 14 236 L 6 228 L 6 36 L 14 28 L 14 20 L 22 20 Z"
                fill="none"
                stroke="url(#starlaNusantaraTrace)"
                strokeWidth="2.1"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />

              {/* Inner Prada Emas Recessed Double Hairline */}
              <path
                d="M 35 19 L 265 19 L 279 33 L 279 40 L 287 42 L 287 222 L 279 224 L 279 231 L 265 245 L 35 245 L 21 231 L 21 224 L 13 222 L 13 42 L 21 40 L 21 33 Z"
                fill="none"
                stroke="rgba(253, 224, 71, 0.25)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Non-Distorting Top & Bottom Mahkota Teratai / Wajikan Finials */}
            <svg
              aria-hidden="true"
              width="34"
              height="14"
              viewBox="0 0 34 14"
              style={{
                position: 'absolute',
                top: '3px',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
            >
              <path
                d="M 4 10 Q 10 9 13 5.5 M 30 10 Q 24 9 21 5.5"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="1.15"
                strokeLinecap="round"
                opacity="0.72"
              />
              <polygon
                points="17,1.5 22,6.5 17,11.5 12,6.5"
                fill="#FEF08A"
                stroke="#D97706"
                strokeWidth="0.9"
              />
            </svg>
            <svg
              aria-hidden="true"
              width="28"
              height="12"
              viewBox="0 0 28 12"
              style={{
                position: 'absolute',
                bottom: '3px',
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
            >
              <path
                d="M 4 3 Q 8 4 10.5 6.5 M 24 3 Q 20 4 17.5 6.5"
                fill="none"
                stroke="#D97706"
                strokeWidth="1.05"
                strokeLinecap="round"
                opacity="0.7"
              />
              <polygon
                points="14,1.5 18.5,6 14,10.5 9.5,6"
                fill="#FBBF24"
                opacity="0.9"
              />
            </svg>

            {/* Non-Distorting Four-Corner STARLA Ukiran Sulur Emas Filigree */}
            {(
              [
                { top: '16px', left: '14px', rotate: '0deg' },
                { top: '16px', right: '14px', rotate: '90deg' },
                { bottom: '16px', right: '14px', rotate: '180deg' },
                { bottom: '16px', left: '14px', rotate: '270deg' },
              ] as Array<{
                top?: string;
                bottom?: string;
                left?: string;
                right?: string;
                rotate: string;
              }>
            ).map((corner, idx) => (
              <svg
                key={idx}
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                style={{
                  position: 'absolute',
                  top: corner.top,
                  bottom: corner.bottom,
                  left: corner.left,
                  right: corner.right,
                  transform: `rotate(${corner.rotate})`,
                  pointerEvents: 'none',
                }}
              >
                <path
                  d="M 3 14 C 3 8, 8 3, 14 3 M 6 15 C 6.5 10.5, 10.5 6.5, 15 6"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="1.05"
                  strokeLinecap="round"
                  opacity="0.62"
                />
                <polygon
                  points="7,5 9.2,7.2 7,9.4 4.8,7.2"
                  fill="#FDE047"
                  opacity="0.88"
                />
              </svg>
            ))}

            {/* Quiet Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Tutup pemberitahuan instalasi"
              data-testid="starla-pwa-dismiss-btn"
              className="starla-pwa-close-btn"
              style={{
                position: 'absolute',
                top: '22px',
                right: '24px',
                zIndex: 2,
                width: '30px',
                height: '30px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'rgba(254, 243, 199, 0.54)',
                fontSize: '18px',
                lineHeight: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>

            {/* Harmonious Centered Content */}
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* Celestial Star Emblem Stage — Exact Transparent Favicon Star */}
              <div
                className="starla-pwa-star-stage"
                style={{
                  position: 'relative',
                  width: '86px',
                  height: '86px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '2px',
                  marginBottom: '12px',
                }}
              >
                {/* Soft Breathing Warm Golden Radiance */}
                <div
                  aria-hidden="true"
                  className="starla-pwa-aura"
                  style={{
                    position: 'absolute',
                    width: '84px',
                    height: '84px',
                    borderRadius: '9999px',
                    background:
                      'radial-gradient(circle, rgba(251, 191, 36, 0.34) 0%, rgba(217, 119, 6, 0.08) 54%, transparent 74%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Gossamer Orbital Gold Ring */}
                <svg
                  aria-hidden="true"
                  className="starla-pwa-orbit"
                  viewBox="0 0 86 86"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '86px',
                    height: '86px',
                    pointerEvents: 'none',
                  }}
                >
                  <circle
                    cx="43"
                    cy="43"
                    r="39"
                    fill="none"
                    stroke="rgba(253, 224, 71, 0.24)"
                    strokeWidth="0.9"
                    strokeDasharray="3 5"
                  />
                  <circle cx="43" cy="4" r="1.8" fill="#FEF08A" opacity="0.85" />
                  <circle
                    cx="43"
                    cy="82"
                    r="1.4"
                    fill="#F59E0B"
                    opacity="0.7"
                  />
                </svg>

                {/* Exact Favicon Yellow Star Icon — 100% Transparent Background */}
                <div className="starla-pwa-star-float">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 64 64"
                    fill="none"
                    aria-hidden="true"
                    data-testid="starla-pwa-star-icon"
                    style={{
                      width: '66px',
                      height: '66px',
                      background: 'transparent',
                      filter:
                        'drop-shadow(0 8px 18px rgba(245, 158, 11, 0.44))',
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="starlaPwaAmberStar"
                        x1="12"
                        y1="8"
                        x2="52"
                        y2="56"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop offset="0%" stopColor="#fde047" />
                        <stop offset="50%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M32 6.5c1.6 0 3 .9 3.7 2.3l5.9 12 13.2 1.9c1.6.2 2.9 1.3 3.4 2.8.5 1.5.1 3.2-1 4.3l-9.6 9.3 2.3 13.1c.3 1.6-.4 3.2-1.7 4.1-1.3.9-3 1.1-4.4.3L32 50.4l-11.8 6.2c-1.4.8-3.1.6-4.4-.3-1.3-.9-2-2.5-1.7-4.1l2.3-13.1-9.6-9.3c-1.1-1.1-1.5-2.8-1-4.3.5-1.5 1.8-2.6 3.4-2.8l13.2-1.9 5.9-12C29 7.4 30.4 6.5 32 6.5Z"
                      fill="url(#starlaPwaAmberStar)"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="starla-pwa-copy">
                <h2
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    letterSpacing: '-0.015em',
                    color: '#FFFBEB',
                    lineHeight: 1.3,
                  }}
                >
                  Mainkan Offline
                </h2>
              </div>

              {/* Signature STARLA Royal Gold Primary Button */}
              <div
                className="starla-pwa-btn-wrap"
                style={{ width: '100%', marginTop: '20px' }}
              >
                <button
                  type="button"
                  onClick={handleInstallTrigger}
                  data-testid="starla-pwa-install-btn"
                  className="starla-pwa-download-btn"
                  style={{
                    width: '100%',
                    minHeight: '46px',
                    padding: '11px 22px',
                    borderRadius: '11px',
                    border: '1px solid rgba(254, 240, 138, 0.65)',
                    background:
                      'linear-gradient(180deg, #FEF08A 0%, #FBBF24 46%, #D97706 100%)',
                    boxShadow:
                      '0 10px 24px rgba(217, 119, 6, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.68), inset 0 -1.5px 0 rgba(120, 53, 15, 0.45)',
                    color: '#1C0F06',
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '0.015em',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 20h14" />
                  </svg>
                  <span>Unduh</span>
                </button>
              </div>

              {inlineHint && (
                <div
                  data-testid="starla-pwa-inline-hint"
                  className="starla-pwa-hint"
                  style={{
                    marginTop: '14px',
                    paddingTop: '10px',
                    width: '100%',
                    borderTop: '1px solid rgba(253, 224, 71, 0.18)',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    color: '#FEF08A',
                    lineHeight: 1.45,
                  }}
                >
                  {inlineHint}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          data-testid="starla-offline-indicator"
          style={{
            position: 'fixed',
            bottom: '12px',
            left: '12px',
            zIndex: 2147483644,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 12px',
            borderRadius: '10px',
            backgroundColor: 'rgba(25, 15, 9, 0.94)',
            border: '1px solid rgba(251, 191, 36, 0.45)',
            color: '#FEF08A',
            fontSize: '11.5px',
            fontWeight: 600,
            pointerEvents: 'none',
            fontFamily:
              "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          Mode Offline
        </div>
      )}
    </>,
    portalHost
  );
});
