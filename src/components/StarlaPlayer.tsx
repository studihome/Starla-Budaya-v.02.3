import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
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
import {
  ContentSchema,
  CanvasElement,
  ElementOverrideConfig,
  CanvasAnimationType,
} from '../data/defaultContent';
import {
  getSmartSlideMeta,
  SLIDE_EXACT_META,
  loadExactSlideStageData,
  playStudioSoundEffect,
  normalizeSmartEmbedUrl,
  type ExactSlideRuntimeData,
} from '../utils/slideExactMeta';

interface ActivePopupModalState {
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'iframe' | 'image' | 'video' | 'audio' | 'none';
  animation?: CanvasAnimationType;
}

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

function releaseAudioElement(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  try {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  } catch {
    // ignore audio teardown errors
  }
}

/**
 * Komponen Player Utama STARLA BUDAYA (Pillar 2 Optimized).
 * - Menyinkronkan `ContentContext` secara non-intrusif dengan engine Articulate Storyline.
 * - Menyimpan & memulihkan halaman slide terakhir pengguna saat browser di-refresh atau ditutup.
 * - Mencegah slide macet/lag (anti-stuck slide watchdog) dengan interval stabil tanpa re-register per slide.
 * - Merender tombol bergambar (`canvasElements`) & slide 360° Budaya tambahan secara live di `#slide-window`.
 * - Melepaskan buffer audio & event listener secara ketat saat berpindah slide atau unmount.
 */
export const StarlaPlayer: React.FC = React.memo(() => {
  const contextApi = useContent();
  const { content, storageSource, isUsingFallback } = contextApi;
  const latestContentRef = useRef<ContentSchema>(content);
  latestContentRef.current = content;

  const [activePublicSlideId, setActivePublicSlideId] = useState<string>(() => {
    const saved = loadLastActiveSlideState();
    return saved?.slideId || content.slideOrder[0] || '6AR4SV4ZYat';
  });
  const activePublicSlideIdRef = useRef<string>(activePublicSlideId);
  activePublicSlideIdRef.current = activePublicSlideId;

  const [inline360OverlayUrl, setInline360OverlayUrl] = useState<string | null>(
    null
  );
  const [activePopupState, setActivePopupState] =
    useState<ActivePopupModalState | null>(null);
  const [hoveredCustomElId, setHoveredCustomElId] = useState<string | null>(
    null
  );
  const [customRuntimeSlide, setCustomRuntimeSlide] =
    useState<ExactSlideRuntimeData | null>(null);
  const [slideWindowEl, setSlideWindowEl] = useState<HTMLElement | null>(null);
  const slideWindowElRef = useRef<HTMLElement | null>(null);
  slideWindowElRef.current = slideWindowEl;

  const backsoundAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceOverAudioRef = useRef<HTMLAudioElement | null>(null);

  // Release all audio buffers on component unmount
  useEffect(() => {
    return () => {
      releaseAudioElement(backsoundAudioRef.current);
      backsoundAudioRef.current = null;
      releaseAudioElement(voiceOverAudioRef.current);
      voiceOverAudioRef.current = null;
    };
  }, []);

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
  // Stabilized with refs so the interval & event listeners mount once and never churn on slide transitions
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

    if (initialSaved && initialSaved.frontOpened && initialSaved.slideId) {
      unlockFrontStageNow();
      setActivePublicSlideId(initialSaved.slideId);
    } else {
      restoreCompleted = true;
    }

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

    const accessBtn = document.getElementById('starla-access-btn');
    const onAccessBtnClick = () => {
      restoreCompleted = true;
      saveLastActiveSlideState({
        slideId: activePublicSlideIdRef.current || '6AR4SV4ZYat',
        frontOpened: true,
      });
    };
    accessBtn?.addEventListener('click', onAccessBtnClick);

    let stuckLoaderTicks = 0;

    const intervalId = window.setInterval(() => {
      const sw = document.getElementById('slide-window');
      if (sw && sw !== slideWindowElRef.current) {
        slideWindowElRef.current = sw;
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
            if (
              !SLIDE_EXACT_META[prevId] &&
              latestContentRef.current.slides[prevId]
            ) {
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
  }, []);

  const currentSlide = useMemo(
    () => content.slides[activePublicSlideId],
    [content.slides, activePublicSlideId]
  );
  const currentMeta = useMemo(
    () => getSmartSlideMeta(activePublicSlideId, currentSlide),
    [activePublicSlideId, currentSlide]
  );
  const isCustomSlide = useMemo(
    () => Boolean(currentSlide && !SLIDE_EXACT_META[activePublicSlideId]),
    [currentSlide, activePublicSlideId]
  );
  const customCanvasElements: CanvasElement[] = useMemo(
    () => currentSlide?.canvasElements?.filter((el) => !el.hidden) || [],
    [currentSlide?.canvasElements]
  );

  // Load exact runtime objects if activePublicSlideId is a copied slide (copiedFromSlideId) or custom slide
  useEffect(() => {
    if (!isCustomSlide || !currentSlide) {
      setCustomRuntimeSlide(null);
      return;
    }
    let cancelled = false;
    loadExactSlideStageData(activePublicSlideId, currentSlide).then((res) => {
      if (!cancelled) {
        setCustomRuntimeSlide(res);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activePublicSlideId, isCustomSlide, currentSlide]);

  // Slide-level Backsound & Voice Over playback when active slide changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setActivePopupState(null);

    // 1. Backsound handling with strict buffer release
    const bsUrl = currentSlide?.backsoundUrl;
    if (bsUrl) {
      const normalizedBs =
        bsUrl.startsWith('http') ||
        bsUrl.startsWith('data:') ||
        bsUrl.startsWith('/')
          ? bsUrl
          : `/${bsUrl}`;
      if (
        !backsoundAudioRef.current ||
        backsoundAudioRef.current.dataset.srcUrl !== normalizedBs
      ) {
        releaseAudioElement(backsoundAudioRef.current);
        const bsAudio = new Audio(normalizedBs);
        bsAudio.dataset.srcUrl = normalizedBs;
        bsAudio.loop = currentSlide?.backsoundLoop !== false;
        bsAudio.volume = Math.max(
          0.05,
          Math.min(1, currentSlide?.backsoundVolume ?? 0.45)
        );
        backsoundAudioRef.current = bsAudio;
        void bsAudio.play().catch(() => {});
      } else {
        backsoundAudioRef.current.loop = currentSlide?.backsoundLoop !== false;
        backsoundAudioRef.current.volume = Math.max(
          0.05,
          Math.min(1, currentSlide?.backsoundVolume ?? 0.45)
        );
        if (backsoundAudioRef.current.paused) {
          void backsoundAudioRef.current.play().catch(() => {});
        }
      }
    } else if (backsoundAudioRef.current) {
      releaseAudioElement(backsoundAudioRef.current);
      backsoundAudioRef.current = null;
    }

    // 2. Voice Over handling with strict buffer release
    if (voiceOverAudioRef.current) {
      releaseAudioElement(voiceOverAudioRef.current);
      voiceOverAudioRef.current = null;
    }
    const voUrl = currentSlide?.voiceOverUrl;
    if (voUrl && currentSlide?.voiceOverAutoplay !== false) {
      const normalizedVo =
        voUrl.startsWith('http') ||
        voUrl.startsWith('data:') ||
        voUrl.startsWith('/')
          ? voUrl
          : `/${voUrl}`;
      const voAudio = new Audio(normalizedVo);
      voAudio.volume = Math.max(
        0.05,
        Math.min(1, currentSlide?.voiceOverVolume ?? 0.9)
      );
      voiceOverAudioRef.current = voAudio;
      void voAudio.play().catch(() => {});
    }
  }, [
    activePublicSlideId,
    currentSlide?.backsoundUrl,
    currentSlide?.backsoundVolume,
    currentSlide?.backsoundLoop,
    currentSlide?.voiceOverUrl,
    currentSlide?.voiceOverVolume,
    currentSlide?.voiceOverAutoplay,
  ]);

  // Listen for custom triggers fired from native Storyline slide buttons
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onNativeTrigger = (ev: Event) => {
      const customEv = ev as CustomEvent<{
        slideId: string;
        objectId: string;
        override: ElementOverrideConfig;
      }>;
      const ov = customEv.detail?.override;
      if (!ov || !ov.actionType || ov.actionType === 'default') return;

      if (ov.actionType === 'goto-slide' && ov.targetSlideId) {
        setActivePublicSlideId(ov.targetSlideId);
        navigateStorylineToSlide(ov.targetSlideId, latestContentRef.current);
      } else if (ov.actionType === 'external-url' && ov.externalUrl) {
        setInline360OverlayUrl(normalizeSmartEmbedUrl(ov.externalUrl));
      } else if (
        ov.actionType === 'open-popup' ||
        ov.actionType === 'embed-popup'
      ) {
        const effMediaType =
          ov.popupMediaType || (ov.popupMediaUrl ? 'iframe' : 'none');
        setActivePopupState({
          title: ov.popupTitle || 'Informasi Budaya Nusantara',
          content: ov.popupContent || '',
          mediaUrl:
            effMediaType === 'iframe' && ov.popupMediaUrl
              ? normalizeSmartEmbedUrl(ov.popupMediaUrl)
              : ov.popupMediaUrl,
          mediaType: effMediaType,
          animation: ov.popupAnimation || 'pop-zoom',
        });
      } else if (ov.actionType === 'play-audio' && ov.customAudio) {
        playStudioSoundEffect(ov.customAudio, 0.9);
      }
    };
    window.addEventListener('starla:native-element-trigger', onNativeTrigger);
    return () =>
      window.removeEventListener(
        'starla:native-element-trigger',
        onNativeTrigger
      );
  }, []);

  const handlePublicCanvasElementClick = useCallback((el: CanvasElement) => {
    const sfxToPlay =
      el.clickSfxUrl !== undefined
        ? el.clickSfxUrl
        : 'story_content/6cE4jPpZoR1_44100_56_0.mp3';
    if (sfxToPlay && sfxToPlay !== 'none') {
      playStudioSoundEffect(sfxToPlay, 0.8);
    }

    if (el.action?.type === 'goto-slide' && el.action.targetSlideId) {
      const targetId = el.action.targetSlideId;
      setActivePublicSlideId(targetId);
      navigateStorylineToSlide(targetId, latestContentRef.current);
      return;
    }
    if (el.action?.type === 'external-url' && el.action.externalUrl) {
      setInline360OverlayUrl(normalizeSmartEmbedUrl(el.action.externalUrl));
      return;
    }
    if (
      el.action?.type === 'open-popup' ||
      el.action?.type === 'embed-popup'
    ) {
      const rawMediaUrl = el.action.popupMediaUrl || el.action.externalUrl;
      const effMediaType =
        el.action.popupMediaType || (rawMediaUrl ? 'iframe' : 'none');
      setActivePopupState({
        title: el.action.popupTitle || el.label || 'Eksplorasi Media Budaya',
        content: el.action.popupContent || el.action.popupBody || '',
        mediaUrl:
          effMediaType === 'iframe' && rawMediaUrl
            ? normalizeSmartEmbedUrl(rawMediaUrl)
            : rawMediaUrl,
        mediaType: effMediaType,
        animation: el.action.popupAnimation || 'pop-zoom',
      });
      return;
    }
    if (
      el.action?.type === 'play-audio' &&
      (el.action.audioUrl || el.audioUrl)
    ) {
      const audioSrc = el.action.audioUrl || el.audioUrl;
      if (audioSrc) {
        playStudioSoundEffect(audioSrc, 0.9);
      }
    }
  }, []);

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

      {/* LIVE OVERLAY PORTAL INSIDE #slide-window FOR CUSTOM/COPIED SLIDES, IMAGE BUTTONS & ANIMATED POPUP STATE */}
      {slideWindowEl &&
        (isCustomSlide ||
          customCanvasElements.length > 0 ||
          Boolean(inline360OverlayUrl) ||
          Boolean(activePopupState)) &&
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
            {/* 1. Custom 360° Budaya Slide, Copied Slide, or Custom Materi Slide Full Stage */}
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
                {(currentSlide.backgroundUrl ||
                  customRuntimeSlide?.backgroundUrl) && (
                  <img
                    src={
                      currentSlide.backgroundUrl ||
                      customRuntimeSlide?.backgroundUrl ||
                      ''
                    }
                    alt={currentMeta.smartTitle}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.fallbackApplied) {
                        img.dataset.fallbackApplied = 'true';
                        img.src = 'mobile/Slide5znCNCeGBCx.jpg';
                      }
                    }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'fill',
                    }}
                  />
                )}

                {currentMeta.category === 'tur360' ||
                Boolean(currentSlide.webObjectUrl) ? (
                  (() => {
                    const backBtnId = `${currentSlide.id}_back_btn`;
                    const backOv =
                      currentSlide.elementOverrides?.[backBtnId] ||
                      currentSlide.elementOverrides?.['6U38sGT8aLM'];
                    const isBackHidden = Boolean(
                      backOv?.hidden ||
                        currentSlide.hiddenElementIds?.includes(backBtnId) ||
                        currentSlide.hiddenElementIds?.includes('6U38sGT8aLM')
                    );
                    const backLeftPct =
                      (8 / 1280) * 100 + (backOv?.xDeltaPct || 0);
                    const backTopPct =
                      (8 / 720) * 100 + (backOv?.yDeltaPct || 0);
                    const backWidthPct =
                      backOv?.widthPct ?? (95 / 1280) * 100;
                    const backHeightPct =
                      backOv?.heightPct ?? (68 / 720) * 100;
                    const backImgSrc =
                      backOv?.customImage || 'mobile/6UTk9YJ1Rv7.png';
                    const resolved360EmbedUrl = normalizeSmartEmbedUrl(
                      currentSlide.webObjectUrl ||
                        currentMeta.webObjectUrl ||
                        content.appMeta.canonicalUrl,
                      'https://faryzt.github.io/starla-360/'
                    );

                    return (
                      <>
                        <iframe
                          key={`tur360-${currentSlide.id}-${resolved360EmbedUrl}`}
                          src={resolved360EmbedUrl}
                          title={currentMeta.smartTitle}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            border: 0,
                            zIndex: 5,
                          }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; vr; xr-spatial-tracking"
                        />
                        {!isBackHidden && (
                          <button
                            type="button"
                            onMouseEnter={() => {
                              if (
                                backOv?.hoverSfxUrl &&
                                backOv.hoverSfxUrl !== 'none'
                              ) {
                                playStudioSoundEffect(backOv.hoverSfxUrl, 0.45);
                              }
                            }}
                            onClick={() => {
                              playStudioSoundEffect(
                                backOv?.clickSfxUrl ||
                                  'story_content/6cE4jPpZoR1_44100_56_0.mp3',
                                0.75
                              );
                              if (
                                backOv?.actionType &&
                                backOv.actionType !== 'default'
                              ) {
                                if (
                                  backOv.actionType === 'goto-slide' &&
                                  backOv.targetSlideId
                                ) {
                                  setActivePublicSlideId(backOv.targetSlideId);
                                  navigateStorylineToSlide(
                                    backOv.targetSlideId,
                                    content
                                  );
                                } else {
                                  window.dispatchEvent(
                                    new CustomEvent(
                                      'starla:native-element-trigger',
                                      {
                                        detail: {
                                          slideId: currentSlide.id,
                                          objectId: backBtnId,
                                          override: backOv,
                                        },
                                      }
                                    )
                                  );
                                }
                                return;
                              }
                              setActivePublicSlideId('5iew2M44w24');
                              navigateStorylineToSlide('5iew2M44w24', content);
                            }}
                            title="Kembali ke Menu Pilihan Materi Budaya"
                            style={{
                              position: 'absolute',
                              left: `${backLeftPct}%`,
                              top: `${backTopPct}%`,
                              width: `${backWidthPct}%`,
                              height: `${backHeightPct}%`,
                              border: 0,
                              background: 'transparent',
                              padding: 0,
                              cursor: 'pointer',
                              zIndex: 20,
                              transition: 'transform 0.2s ease',
                            }}
                          >
                            <img
                              src={backImgSrc}
                              alt="Kembali"
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (!img.dataset.fallbackApplied) {
                                  img.dataset.fallbackApplied = 'true';
                                  img.src = 'mobile/5dCAlHC5W8Z.png';
                                }
                              }}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          </button>
                        )}
                      </>
                    );
                  })()
                ) : customRuntimeSlide &&
                  currentSlide.copiedFromSlideId &&
                  customRuntimeSlide.objects.length > 0 ? (
                  /* Copied Slide: Render 100% of copied slide objects (webobject, video, images/buttons) + elementOverrides */
                  <>
                    {customRuntimeSlide.objects.map((obj) => {
                      const ov = currentSlide.elementOverrides?.[obj.id];
                      if (
                        ov?.hidden ||
                        currentSlide.hiddenElementIds?.includes(obj.id)
                      ) {
                        return null;
                      }
                      const leftPct =
                        (obj.xPos / 1280) * 100 + (ov?.xDeltaPct || 0);
                      const topPct =
                        (obj.yPos / 720) * 100 + (ov?.yDeltaPct || 0);
                      const widthPct =
                        ov?.widthPct ?? (obj.width / 1280) * 100;
                      const heightPct =
                        ov?.heightPct ?? (obj.height / 720) * 100;

                      if (obj.kind === 'webobject') {
                        const webSrc = normalizeSmartEmbedUrl(
                          currentSlide.webObjectUrl || obj.webUrl
                        );
                        return (
                          <div
                            key={obj.id}
                            style={{
                              position: 'absolute',
                              left: `${leftPct}%`,
                              top: `${topPct}%`,
                              width: `${widthPct}%`,
                              height: `${heightPct}%`,
                              zIndex: obj.depth + 2,
                            }}
                          >
                            <iframe
                              src={webSrc}
                              title={obj.altText || currentMeta.smartTitle}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 0,
                              }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; vr; xr-spatial-tracking"
                            />
                          </div>
                        );
                      }

                      if (obj.kind === 'video' && obj.videoUrl) {
                        return (
                          <div
                            key={obj.id}
                            style={{
                              position: 'absolute',
                              left: `${leftPct}%`,
                              top: `${topPct}%`,
                              width: `${widthPct}%`,
                              height: `${heightPct}%`,
                              zIndex: obj.depth + 2,
                            }}
                          >
                            <video
                              src={obj.videoUrl}
                              poster={obj.posterUrl || undefined}
                              controls
                              autoPlay
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          </div>
                        );
                      }

                      const resolvedImg = ov?.customImage || obj.imageUrl;
                      if (!resolvedImg) return null;
                      return (
                        <div
                          key={obj.id}
                          onMouseEnter={() => {
                            if (ov?.hoverSfxUrl && ov.hoverSfxUrl !== 'none') {
                              playStudioSoundEffect(ov.hoverSfxUrl, 0.45);
                            }
                          }}
                          onClick={() => {
                            if (ov?.clickSfxUrl && ov.clickSfxUrl !== 'none') {
                              playStudioSoundEffect(ov.clickSfxUrl, 0.8);
                            }
                            if (ov?.actionType && ov.actionType !== 'default') {
                              window.dispatchEvent(
                                new CustomEvent(
                                  'starla:native-element-trigger',
                                  {
                                    detail: {
                                      slideId: currentSlide.id,
                                      objectId: obj.id,
                                      override: ov,
                                    },
                                  }
                                )
                              );
                            }
                          }}
                          style={{
                            position: 'absolute',
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: `${widthPct}%`,
                            height: `${heightPct}%`,
                            zIndex: obj.depth + 2,
                            cursor:
                              ov?.actionType && ov.actionType !== 'default'
                                ? 'pointer'
                                : 'default',
                            transition: 'transform 0.2s ease',
                          }}
                        >
                          <img
                            src={resolvedImg}
                            alt={obj.altText || obj.id}
                            draggable={false}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'fill',
                            }}
                          />
                        </div>
                      );
                    })}
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
                      background: currentSlide.backgroundUrl
                        ? 'rgba(15, 23, 42, 0.35)'
                        : 'linear-gradient(135deg, rgba(16,35,114,0.88), rgba(15,23,42,0.92))',
                      color: '#ffffff',
                      textAlign: 'center',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        background: 'rgba(15, 23, 42, 0.68)',
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
                        playStudioSoundEffect(
                          'story_content/6cE4jPpZoR1_44100_56_0.mp3',
                          0.75
                        );
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

            {/* 2. Inline 360° / External Link Embed Overlay */}
            {inline360OverlayUrl && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'auto',
                  backgroundColor: '#0F172A',
                  zIndex: 70,
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
                  onClick={() => {
                    playStudioSoundEffect(
                      'story_content/6cE4jPpZoR1_44100_56_0.mp3',
                      0.75
                    );
                    setInline360OverlayUrl(null);
                  }}
                  title="Tutup Tautan & Kembali ke Slide"
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
                    zIndex: 80,
                  }}
                >
                  <img
                    src="mobile/5dCAlHC5W8Z.png"
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

            {/* 3. Custom Interactive Canvas Elements (100% Pure Image Buttons with Auto-Hover & UI Sound Effects) */}
            {customCanvasElements.map((el) => {
              const hasImage = Boolean(el.imageUrl);
              const isHovered = hoveredCustomElId === el.id;
              const autoHoverEnabled = el.style?.hoverEffect !== 'none';
              return (
                <div
                  key={el.id}
                  onMouseEnter={() => {
                    setHoveredCustomElId(el.id);
                    const hSfx = el.hoverSfxUrl ?? 'sfx:hover-soft';
                    if (hSfx && hSfx !== 'none') {
                      playStudioSoundEffect(hSfx, 0.35);
                    }
                  }}
                  onMouseLeave={() => setHoveredCustomElId(null)}
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
                    backgroundColor: hasImage
                      ? 'transparent'
                      : el.style?.backgroundColor || '#2563EB',
                    color: el.style?.textColor || '#FFFFFF',
                    borderRadius: hasImage
                      ? '0px'
                      : `${el.style?.borderRadius ?? 14}px`,
                    fontSize: `${el.style?.fontSize ?? 14}px`,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: hasImage ? 0 : '6px 12px',
                    boxShadow: hasImage
                      ? 'none'
                      : '0 8px 20px rgba(15, 23, 42, 0.35)',
                    border: hasImage
                      ? 'none'
                      : '2px solid rgba(255,255,255,0.35)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transform:
                      isHovered && autoHoverEnabled
                        ? 'scale(1.07) translateY(-2px)'
                        : 'scale(1)',
                    filter:
                      isHovered && autoHoverEnabled
                        ? 'brightness(1.08) drop-shadow(0 8px 16px rgba(37, 99, 235, 0.42))'
                        : 'none',
                    transition:
                      'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), filter 0.2s ease',
                    zIndex: el.zIndex || 30,
                  }}
                >
                  {hasImage ? (
                    <img
                      src={el.imageUrl}
                      alt={el.label || 'Tombol'}
                      draggable={false}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = 'true';
                          img.src = 'mobile/5dCAlHC5W8Z.png';
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        userSelect: 'none',
                      }}
                    />
                  ) : (
                    el.label && (
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {el.label}
                      </span>
                    )
                  )}
                </div>
              );
            })}

            {/* 4. Animated State Popup Modal with Embedded Media (Iframe / Video / Image / Audio / Text) */}
            {activePopupState && (
              <div
                onClick={() => setActivePopupState(null)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'auto',
                  backgroundColor: 'rgba(15, 23, 42, 0.76)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3.5%',
                  zIndex: 120,
                  animation: 'starlaPopupBackdropFade 0.22s ease-out both',
                }}
              >
                <style>{`
                  @keyframes starlaPopupBackdropFade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                  @keyframes starlaPopupZoomIn {
                    0% { opacity: 0; transform: scale(0.82) translateY(12px); }
                    70% { opacity: 1; transform: scale(1.02) translateY(0); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                  }
                  @keyframes starlaPopupSlideUp {
                    0% { opacity: 0; transform: translateY(48px); }
                    100% { opacity: 1; transform: translateY(0); }
                  }
                  @keyframes starlaPopupBounce {
                    0% { opacity: 0; transform: scale(0.65); }
                    60% { opacity: 1; transform: scale(1.05); }
                    80% { transform: scale(0.97); }
                    100% { opacity: 1; transform: scale(1); }
                  }
                `}</style>
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '86%',
                    maxWidth: '920px',
                    maxHeight: '88%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '24px',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
                    border: '3px solid #2563EB',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    animation:
                      activePopupState.animation === 'slide-up'
                        ? 'starlaPopupSlideUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) both'
                        : activePopupState.animation === 'bounce'
                        ? 'starlaPopupBounce 0.42s cubic-bezier(0.22, 1, 0.36, 1) both'
                        : 'starlaPopupZoomIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
                  }}
                >
                  {/* Popup Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 22px',
                      background:
                        'linear-gradient(90deg, #152C88 0%, #2563EB 100%)',
                      color: '#FFFFFF',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 800,
                      }}
                    >
                      {activePopupState.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        playStudioSoundEffect('sfx:click-crystal', 0.65);
                        setActivePopupState(null);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: '#FFFFFF',
                        border: 0,
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Tutup ✕
                    </button>
                  </div>

                  {/* Popup Body & Media Embed */}
                  <div
                    style={{
                      padding: '18px 22px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      flex: 1,
                    }}
                  >
                    {activePopupState.mediaUrl &&
                      activePopupState.mediaType === 'iframe' && (
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            backgroundColor: '#0F172A',
                            border: '1px solid #E2E8F0',
                          }}
                        >
                          <iframe
                            src={activePopupState.mediaUrl}
                            title={activePopupState.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              border: 0,
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; vr; xr-spatial-tracking"
                          />
                        </div>
                      )}

                    {activePopupState.mediaUrl &&
                      activePopupState.mediaType === 'video' && (
                        <video
                          src={activePopupState.mediaUrl}
                          controls
                          autoPlay
                          style={{
                            width: '100%',
                            maxHeight: '360px',
                            borderRadius: '16px',
                            backgroundColor: '#0F172A',
                          }}
                        />
                      )}

                     {activePopupState.mediaUrl &&
                      activePopupState.mediaType === 'image' && (
                        <img
                          src={activePopupState.mediaUrl}
                          alt={activePopupState.title}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          style={{
                            width: '100%',
                            maxHeight: '360px',
                            objectFit: 'contain',
                            borderRadius: '16px',
                            backgroundColor: '#F8FAFC',
                          }}
                        />
                      )}

                    {activePopupState.mediaUrl &&
                      activePopupState.mediaType === 'audio' && (
                        <audio
                          src={activePopupState.mediaUrl}
                          controls
                          autoPlay
                          style={{ width: '100%' }}
                        />
                      )}

                    {activePopupState.content && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: 1.65,
                          color: '#334155',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {activePopupState.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>,
          slideWindowEl
        )}
    </>
  );
});

export default StarlaPlayer;

