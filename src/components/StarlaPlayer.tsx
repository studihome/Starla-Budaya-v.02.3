import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useContent } from '../context/ContentContext';
import {
  transformStorylineProvideData,
  syncContentToLiveDom,
  protectStarlaLocalStorage,
  loadLastActiveSlideState,
  saveLastActiveSlideState,
  navigateStorylineToSlide,
} from '../utils/contentRuntimeBridge';
import { ContentSchema, CanvasElement } from '../data/defaultContent';
import { getSmartSlideMeta, SLIDE_EXACT_META } from '../utils/slideExactMeta';

type GlobalProvideDataFn = (dataType: string, rawJson: string) => void;

interface StarlaWindow extends Window {
  globalProvideData?: GlobalProvideDataFn & {
    __starlaWrapped?: boolean;
    __starlaOrig?: GlobalProvideDataFn;
  };
  __STARLA_CONTENT__?: ContentSchema;
  __STARLA_CONTENT_CONTEXT__?: ReturnType<typeof useContent>;
  __starlaFrontOpened?: boolean;
  __starlaNavigateToSlide?: (slideId: string) => boolean;
  StarlaCoreEngine?: Record<string, unknown>;
  StarlaEngine?: Record<string, unknown>;
  StarlaBudaya?: Record<string, unknown>;
  DS?: any;
  GetPlayer?: () => {
    GetVar?: (name: string) => any;
    SetVar?: (name: string, val: any) => void;
  };
}

// Protect `starla_*` localStorage keys immediately when module loads
protectStarlaLocalStorage();

/**
 * Komponen Player Utama STARLA BUDAYA.
 * - Menyinkronkan `ContentContext` secara non-intrusif dengan engine Articulate Storyline.
 * - Menyimpan & memulihkan halaman slide terakhir pengguna saat browser di-refresh atau ditutup.
 * - Mencegah slide macet/lag (anti-stuck slide watchdog).
 * - Merender tombol bergambar (`canvasElements`) & slide 360° Budaya tambahan secara live di `#slide-window`.
 */
export const StarlaPlayer: React.FC = () => {
  const contextApi = useContent();
  const { content, storageSource, isUsingFallback } = contextApi;
  const latestContentRef = useRef<ContentSchema>(content);
  latestContentRef.current = content;

  const [activePublicSlideId, setActivePublicSlideId] = useState<string>(() => {
    const saved = loadLastActiveSlideState();
    return saved?.slideId || content.slideOrder[0] || '6AR4SV4ZYat';
  });
  const [inline360OverlayUrl, setInline360OverlayUrl] = useState<string | null>(
    null
  );
  const [slideWindowEl, setSlideWindowEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    protectStarlaLocalStorage();
    const win = window as unknown as StarlaWindow;

    win.__STARLA_CONTENT__ = latestContentRef.current;
    win.__STARLA_CONTENT_CONTEXT__ = contextApi;
    win.__starlaNavigateToSlide = (targetSlideId: string) =>
      navigateStorylineToSlide(targetSlideId, latestContentRef.current);

    syncContentToLiveDom(latestContentRef.current);

    if (win.StarlaCoreEngine) {
      win.StarlaCoreEngine.getContent = () => latestContentRef.current;
      win.StarlaCoreEngine.updateContent = contextApi.updateContent;
      win.StarlaCoreEngine.updateSlideContent = contextApi.updateSlideContent;
      win.StarlaCoreEngine.updateQuizQuestion = contextApi.updateQuizQuestion;
      win.StarlaCoreEngine.saveContentToCloud = contextApi.saveContentToCloud;
      win.StarlaCoreEngine.uploadMediaToCloud = contextApi.uploadMediaToCloud;
      win.StarlaCoreEngine.refreshContentFromCloud =
        contextApi.refreshContentFromCloud;
      win.StarlaCoreEngine.resetContent = contextApi.resetContent;
    }

    const wrapGlobalProvideData = () => {
      if (
        typeof win.globalProvideData === 'function' &&
        !win.globalProvideData.__starlaWrapped
      ) {
        const origFn = win.globalProvideData;
        const wrappedFn: GlobalProvideDataFn & {
          __starlaWrapped?: boolean;
          __starlaOrig?: GlobalProvideDataFn;
        } = function (this: unknown, dataType: string, rawJson: string) {
          const transformedJson = transformStorylineProvideData(
            dataType,
            rawJson,
            latestContentRef.current
          );
          return origFn.call(this, dataType, transformedJson);
        };
        wrappedFn.__starlaWrapped = true;
        wrappedFn.__starlaOrig = origFn;
        win.globalProvideData = wrappedFn;
      }
    };

    wrapGlobalProvideData();
  }, [contextApi, content]);

  // Resume Last Active Slide on Browser Refresh / Reopen & Continuous Slide Tracker + Anti-Stuck Watchdog
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const win = window as unknown as StarlaWindow;

    let restoredSession = false;
    let restoreCompleted = false;
    let restoreAttempts = 0;
    const initialSaved = loadLastActiveSlideState();

    const unlockFrontStageNow = () => {
      const frontStage = document.getElementById('starla-front-stage');
      if (frontStage) {
        frontStage.style.opacity = '0';
        frontStage.style.pointerEvents = 'none';
        frontStage.style.display = 'none';
        frontStage.classList.add(
          'hidden-stage',
          'is-hidden',
          'is-Unlocked',
          'is-Hidden'
        );
      }
      if (document.body) {
        document.body.classList.add('starla-started');
      }
      win.__starlaFrontOpened = true;
    };

    // If user already unlocked front stage in their previous session before refreshing,
    // unlock #starla-front-stage and restore their exact slide as soon as Storyline initializes.
    if (initialSaved && initialSaved.frontOpened && initialSaved.slideId) {
      unlockFrontStageNow();
      setActivePublicSlideId(initialSaved.slideId);
    } else {
      restoreCompleted = true;
    }

    // Listen for custom navigation events triggered by Admin Studio or custom buttons
    const onCustomSlideChanged = (ev: Event) => {
      const customEv = ev as CustomEvent<{
        slideId: string;
        slideIndex: number;
      }>;
      if (customEv.detail?.slideId) {
        restoreCompleted = true;
        setActivePublicSlideId(customEv.detail.slideId);
        setInline360OverlayUrl(null);
      }
    };
    window.addEventListener('starla:slide-changed', onCustomSlideChanged);

    // Also listen for #starla-access-btn click so we immediately persist frontOpened = true
    const accessBtn = document.getElementById('starla-access-btn');
    const onAccessBtnClick = () => {
      restoreCompleted = true;
      saveLastActiveSlideState({
        slideId: activePublicSlideId || '6AR4SV4ZYat',
        frontOpened: true,
      });
    };
    accessBtn?.addEventListener('click', onAccessBtnClick);

    let stuckLoaderTicks = 0;

    const intervalId = window.setInterval(() => {
      const sw = document.getElementById('slide-window');
      if (sw && sw !== slideWindowEl) {
        setSlideWindowEl(sw);
      }

      // Anti-stuck watchdog: prevent Storyline's .slide-loader from freezing a slide indefinitely
      const loaderEl = document.querySelector<HTMLElement>('.slide-loader');
      if (
        loaderEl &&
        loaderEl.style.display !== 'none' &&
        window.getComputedStyle(loaderEl).display !== 'none'
      ) {
        stuckLoaderTicks += 1;
        if (stuckLoaderTicks >= 3) {
          loaderEl.style.display = 'none';
          stuckLoaderTicks = 0;
        }
      } else {
        stuckLoaderTicks = 0;
      }

      // Restore saved slide once Storyline's DS.windowManager & pubSub have mounted the initial slide
      if (
        !restoreCompleted &&
        initialSaved &&
        initialSaved.frontOpened &&
        initialSaved.slideId
      ) {
        unlockFrontStageNow();

        // If target slide is a custom 360 slide (not in native Storyline), we are already on it via portal!
        if (!SLIDE_EXACT_META[initialSaved.slideId]) {
          restoredSession = true;
          restoreCompleted = true;
          setActivePublicSlideId(initialSaved.slideId);
          return;
        }

        const currentStorylineSlide =
          win.DS?.windowManager?.getCurrentWindowSlide?.();
        const currentId: string | undefined = currentStorylineSlide?.id;

        if (win.DS?.pubSub && currentId) {
          try {
            const player = win.GetPlayer?.();
            if (player && typeof player.SetVar === 'function') {
              if (initialSaved.studentName) {
                player.SetVar('TextEntry4', initialSaved.studentName);
              }
              if (initialSaved.studentSchool) {
                player.SetVar('TextEntry5', initialSaved.studentSchool);
              }
            }
          } catch {
            // ignore player variable restore errors
          }

          if (currentId === initialSaved.slideId) {
            restoredSession = true;
            restoreCompleted = true;
            setActivePublicSlideId(initialSaved.slideId);
          } else if (!restoredSession || restoreAttempts < 3) {
            restoredSession = true;
            restoreAttempts += 1;
            navigateStorylineToSlide(
              initialSaved.slideId,
              latestContentRef.current
            );
            if (restoreAttempts >= 3) {
              restoreCompleted = true;
            }
          }
        }
        return;
      }

      // Track live Storyline slide changes when user clicks Next/Back/Menu inside Storyline
      try {
        const curSlide = win.DS?.windowManager?.getCurrentWindowSlide?.();
        const curId: string | undefined = curSlide?.id;
        if (curId && typeof curId === 'string') {
          setActivePublicSlideId((prevId) => {
            // If user is currently viewing a custom non-native slide (e.g., tur360_custom_2),
            // keep that custom slide active until they navigate to another slide.
            if (!SLIDE_EXACT_META[prevId] && latestContentRef.current.slides[prevId]) {
              return prevId;
            }
            if (prevId !== curId) {
              const idx = Math.max(
                0,
                latestContentRef.current.slideOrder.indexOf(curId)
              );
              let studentName: string | undefined;
              let studentSchool: string | undefined;
              try {
                const pl = win.GetPlayer?.();
                studentName = pl?.GetVar?.('TextEntry4') || undefined;
                studentSchool = pl?.GetVar?.('TextEntry5') || undefined;
              } catch {
                // ignore
              }
              const frontStage = document.getElementById('starla-front-stage');
              const isFrontUnlocked = Boolean(
                win.__starlaFrontOpened ||
                  frontStage?.classList.contains('hidden-stage') ||
                  frontStage?.classList.contains('is-hidden') ||
                  frontStage?.classList.contains('is-Hidden') ||
                  frontStage?.classList.contains('is-Unlocked')
              );
              if (isFrontUnlocked) {
                saveLastActiveSlideState({
                  slideId: curId,
                  slideIndex: idx,
                  frontOpened: true,
                  studentName,
                  studentSchool,
                });
              }
              window.dispatchEvent(
                new CustomEvent('starla:public-slide-synced', {
                  detail: { slideId: curId, slideIndex: idx },
                })
              );
            }
            return curId;
          });
        }
      } catch {
        // ignore
      }
    }, 350);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('starla:slide-changed', onCustomSlideChanged);
      accessBtn?.removeEventListener('click', onAccessBtnClick);
    };
  }, [activePublicSlideId, slideWindowEl]);

  const currentSlide = content.slides[activePublicSlideId];
  const currentMeta = getSmartSlideMeta(activePublicSlideId, currentSlide);
  const isCustomSlide = Boolean(
    currentSlide && !SLIDE_EXACT_META[activePublicSlideId]
  );
  const customCanvasElements: CanvasElement[] =
    currentSlide?.canvasElements?.filter((el) => !el.hidden) || [];

  const handlePublicCanvasElementClick = (el: CanvasElement) => {
    if (el.action?.type === 'goto-slide' && el.action.targetSlideId) {
      const targetId = el.action.targetSlideId;
      setActivePublicSlideId(targetId);
      navigateStorylineToSlide(targetId, content);
      return;
    }
    if (el.action?.type === 'external-url' && el.action.externalUrl) {
      setInline360OverlayUrl(el.action.externalUrl);
      return;
    }
    if (el.action?.type === 'play-audio' && (el.action.audioUrl || el.audioUrl)) {
      const audioSrc = el.action.audioUrl || el.audioUrl;
      if (audioSrc) {
        const audio = new Audio(audioSrc);
        void audio.play().catch(() => {});
      }
    }
  };

  return (
    <>
      <div
        id="starla-content-context-bridge"
        data-starla-player-ready="true"
        data-starla-version={content.version}
        data-starla-title={content.appMeta.title}
        data-starla-slides-count={content.slideOrder.length}
        data-starla-quiz-count={content.quizzes.kuisBudaya.questions.length}
        data-starla-audio-count={Object.keys(content.audioCatalog).length}
        data-starla-storage-source={storageSource}
        data-starla-fallback-active={String(isUsingFallback)}
        data-starla-active-slide={activePublicSlideId}
        hidden
        aria-hidden="true"
      />

      {/* LIVE OVERLAY PORTAL INSIDE #slide-window FOR CUSTOM 360° SLIDES & IMAGE BUTTONS */}
      {slideWindowEl &&
        (isCustomSlide ||
          customCanvasElements.length > 0 ||
          Boolean(inline360OverlayUrl)) &&
        createPortal(
          <div
            data-starla-live-stage-layer="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 999,
            }}
          >
            {/* 1. Custom 360° Budaya Slide or Custom Materi Slide Full Stage */}
            {isCustomSlide && currentSlide && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'auto',
                  backgroundColor: '#0F172A',
                  overflow: 'hidden',
                }}
              >
                {currentSlide.backgroundUrl && (
                  <img
                    src={currentSlide.backgroundUrl}
                    alt={currentMeta.smartTitle}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'fill',
                    }}
                  />
                )}

                {currentMeta.category === 'tur360' ? (
                  <>
                    <iframe
                      src={
                        currentSlide.webObjectUrl ||
                        currentMeta.webObjectUrl ||
                        content.appMeta.canonicalUrl ||
                        'https://faryzt.github.io/starla-360/'
                      }
                      title={currentMeta.smartTitle}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        border: 0,
                      }}
                      allow="accelerometer; gyroscope; fullscreen; vr; xr-spatial-tracking"
                    />
                    {/* Top-Right Back Button matching Slide 8 (5jTlwgcUi8o) */}
                    <button
                      type="button"
                      onClick={() => {
                        setActivePublicSlideId('5iew2M44w24');
                        navigateStorylineToSlide('5iew2M44w24', content);
                      }}
                      title="Kembali ke Menu Pilihan Materi Budaya"
                      style={{
                        position: 'absolute',
                        left: `${(1126 / 1280) * 100}%`,
                        top: `${(21 / 720) * 100}%`,
                        width: `${(69 / 1280) * 100}%`,
                        height: `${(67 / 720) * 100}%`,
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        zIndex: 20,
                      }}
                    >
                      <img
                        src="story_content/6U2dfGPp24I.png"
                        alt="Kembali"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4%',
                      background:
                        'linear-gradient(135deg, rgba(16,35,114,0.88), rgba(15,23,42,0.92))',
                      color: '#ffffff',
                      textAlign: 'center',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        background: 'rgba(255,255,255,0.12)',
                        backdropFilter: 'blur(12px)',
                        border: '2px solid rgba(255,255,255,0.25)',
                        borderRadius: '20px',
                        padding: '28px 36px',
                      }}
                    >
                      <h2
                        style={{
                          fontSize: '26px',
                          fontWeight: 800,
                          color: '#FDE047',
                          marginBottom: '12px',
                        }}
                      >
                        {currentMeta.smartTitle}
                      </h2>
                      <p
                        style={{
                          fontSize: '16px',
                          lineHeight: 1.6,
                          color: '#F8FAFC',
                        }}
                      >
                        {currentMeta.smartSummary}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePublicSlideId('5iew2M44w24');
                        navigateStorylineToSlide('5iew2M44w24', content);
                      }}
                      style={{
                        marginTop: '20px',
                        padding: '10px 22px',
                        borderRadius: '9999px',
                        background: '#2563EB',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '14px',
                        border: '2px solid rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                      }}
                    >
                      Kembali ke Menu Materi
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. Inline 360° Embed Overlay (when a button has action.type === 'external-url') */}
            {inline360OverlayUrl && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'auto',
                  backgroundColor: '#0F172A',
                  zIndex: 50,
                }}
              >
                <iframe
                  src={inline360OverlayUrl}
                  title="Eksplorasi 360 Budaya"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 0,
                  }}
                  allow="accelerometer; gyroscope; fullscreen; vr; xr-spatial-tracking"
                />
                <button
                  type="button"
                  onClick={() => setInline360OverlayUrl(null)}
                  title="Tutup 360° & Kembali ke Slide"
                  style={{
                    position: 'absolute',
                    left: `${(1126 / 1280) * 100}%`,
                    top: `${(21 / 720) * 100}%`,
                    width: `${(69 / 1280) * 100}%`,
                    height: `${(67 / 720) * 100}%`,
                    border: 0,
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    zIndex: 60,
                  }}
                >
                  <img
                    src="story_content/6U2dfGPp24I.png"
                    alt="Kembali"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </button>
              </div>
            )}

            {/* 3. Custom Interactive Canvas Elements (Image Buttons & Text Overlays) */}
            {customCanvasElements.map((el) => {
              const isImageOnly =
                Boolean(el.imageUrl) && el.style?.textPosition === 'hidden';
              return (
                <div
                  key={el.id}
                  onClick={() => handlePublicCanvasElementClick(el)}
                  title={el.label || 'Tombol Interaktif'}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                    pointerEvents: 'auto',
                    cursor:
                      el.action?.type && el.action.type !== 'none'
                        ? 'pointer'
                        : 'default',
                    backgroundColor: isImageOnly
                      ? 'transparent'
                      : el.style?.backgroundColor || '#2563EB',
                    color: el.style?.textColor || '#FFFFFF',
                    borderRadius: `${el.style?.borderRadius ?? 14}px`,
                    fontSize: `${el.style?.fontSize ?? 14}px`,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: isImageOnly ? 0 : '6px 12px',
                    boxShadow: isImageOnly
                      ? 'none'
                      : '0 8px 20px rgba(15, 23, 42, 0.35)',
                    border: isImageOnly
                      ? 'none'
                      : '2px solid rgba(255,255,255,0.35)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    zIndex: el.zIndex || 30,
                    overflow: 'hidden',
                  }}
                >
                  {el.imageUrl && (
                    <img
                      src={el.imageUrl}
                      alt={el.label || 'Tombol'}
                      style={{
                        width: isImageOnly ? '100%' : '28px',
                        height: isImageOnly ? '100%' : '28px',
                        objectFit: isImageOnly ? 'contain' : 'cover',
                        borderRadius: isImageOnly ? 0 : '6px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {!isImageOnly && el.label && (
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {el.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>,
          slideWindowEl
        )}
    </>
  );
};

export default StarlaPlayer;
