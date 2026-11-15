// src/App.tsx
// ROOT APPLICATION & TWO-WAY SLIDE SYNCHRONIZATION (MainArticulatePlayer + StarlaAdminStudio)
import React, { useEffect, useRef } from 'react';
import { ContentProvider, useContent } from './context/ContentContext';
import { StarlaPlayer } from './components/StarlaPlayer';
import { CanvasStageOverlay } from './features/canvas/CanvasStageOverlay';
import {
  StarlaAdminStudio,
  CanvaStudio,
  useStarlaStudio,
  useCanvaStudio,
  ORIGINAL_SLIDE_COUNT,
} from './StarlaAdminStudio';
import { ContentSchema, defaultContent } from './data/defaultContent';

export {
  StarlaAdminStudio,
  CanvaStudio,
  useStarlaStudio,
  useCanvaStudio,
  ORIGINAL_SLIDE_COUNT,
};

export interface AppProps {
  initialSupabaseContent?: ContentSchema | null;
}

/**
 * Komponen Internal Player Utama (`MainArticulatePlayer`).
 * - Mempertahankan 100% komponen, gambar, tata letak, kuis, dan logika audio asli (`StarlaPlayer` & `CanvasStageOverlay`).
 * - Menghubungkan state navigasi slide/halaman asli secara Dua Arah (Two-Way Sync) dengan
 *   `activeSlideIndex` dan `setActiveSlideIndex` dari hook `useStarlaStudio()`.
 * - Menangani tampilan slide asli (1..43) maupun kanvas slide kustom baru (> 43) yang ditambahkan oleh Admin.
 */
export const MainArticulatePlayer: React.FC = () => {
  const {
    activeSlideIndex,
    setActiveSlideIndex,
    totalSlides,
    originalSlideCount,
    activeSlide,
    isStudioOpen,
  } = useStarlaStudio();

  const {
    content,
    activeSlideIndex: ctxSlideIndex,
    setActiveSlideIndex: setCtxSlideIndex,
    setActiveCanvasSlideId,
  } = useContent();

  const lastSyncedIndexRef = useRef<number>(activeSlideIndex);
  const prevCtxSlideIndexRef = useRef<number>(ctxSlideIndex);
  const lastObservedAriaLabelRef = useRef<string>('');

  // 1. SINKRONISASI ARAH 1: Studio Admin (activeSlideIndex) -> Player & ContentContext
  useEffect(() => {
    lastSyncedIndexRef.current = activeSlideIndex;
    if (activeSlideIndex < content.slideOrder.length) {
      const targetSlideId = content.slideOrder[activeSlideIndex];
      if (ctxSlideIndex !== activeSlideIndex) {
        prevCtxSlideIndexRef.current = activeSlideIndex;
        setCtxSlideIndex(activeSlideIndex);
      }
      if (targetSlideId) {
        setActiveCanvasSlideId(targetSlideId);
      }
    }
  }, [
    activeSlideIndex,
    content.slideOrder,
    ctxSlideIndex,
    setCtxSlideIndex,
    setActiveCanvasSlideId,
  ]);

  // 2. SINKRONISASI ARAH 2: Navigasi Player Asli / ContentContext -> Studio Admin (setActiveSlideIndex)
  useEffect(() => {
    if (prevCtxSlideIndexRef.current !== ctxSlideIndex) {
      prevCtxSlideIndexRef.current = ctxSlideIndex;
      if (
        ctxSlideIndex !== lastSyncedIndexRef.current &&
        ctxSlideIndex >= 0 &&
        ctxSlideIndex < totalSlides
      ) {
        lastSyncedIndexRef.current = ctxSlideIndex;
        setActiveSlideIndex(ctxSlideIndex);
      }
    }
  }, [ctxSlideIndex, totalSlides, setActiveSlideIndex]);

  // Pantau perubahan judul slide dari DOM Articulate Storyline (#preso) saat pengguna menekan tombol Next/Prev asli
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const presoEl = document.getElementById('preso');
    if (!presoEl) return;

    const initialSlideLabelEl = document.querySelector('[aria-label^="slide:"]');
    if (initialSlideLabelEl) {
      lastObservedAriaLabelRef.current =
        initialSlideLabelEl.getAttribute('aria-label') || '';
    }

    const observer = new MutationObserver(() => {
      const slideLabelEl = document.querySelector('[aria-label^="slide:"]');
      const ariaVal = slideLabelEl?.getAttribute('aria-label');
      if (!ariaVal || ariaVal === lastObservedAriaLabelRef.current) return;
      lastObservedAriaLabelRef.current = ariaVal;

      const cleanTitle = ariaVal.replace(/^slide:\s*/i, '').trim();
      if (!cleanTitle) return;

      const matchedIdx = content.slideOrder.findIndex((sid) => {
        const s = content.slides[sid];
        return (
          s &&
          s.title.trim().toLowerCase() === cleanTitle.toLowerCase()
        );
      });

      if (
        matchedIdx >= 0 &&
        matchedIdx !== lastSyncedIndexRef.current
      ) {
        lastSyncedIndexRef.current = matchedIdx;
        setActiveSlideIndex(matchedIdx);
      }
    });

    observer.observe(presoEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label'],
    });

    return () => observer.disconnect();
  }, [content.slideOrder, content.slides, setActiveSlideIndex]);

  const goToPrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx = Math.max(0, activeSlideIndex - 1);
    lastSyncedIndexRef.current = prevIdx;
    setActiveSlideIndex(prevIdx);
  };

  const goToNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = Math.min(totalSlides - 1, activeSlideIndex + 1);
    lastSyncedIndexRef.current = nextIdx;
    setActiveSlideIndex(nextIdx);
  };

  const isCustomAddedSlide =
    Boolean(activeSlide?.isCustomBlank) ||
    activeSlideIndex >= originalSlideCount;

  const currentSlideId =
    activeSlide?.id ||
    content.slideOrder[activeSlideIndex] ||
    content.slideOrder[0];
  const rawSlideDef =
    content.slides[currentSlideId] || defaultContent.slides[currentSlideId];

  return (
    <>
      {/* Engine & Portal Asli (100% Zero-Regression untuk Mode Publik) */}
      <StarlaPlayer />
      <CanvasStageOverlay mode="player-portal" />

      {/* Tampilan Kanvas Utama saat StarlaAdminStudio Dibuka */}
      {isStudioOpen && (
        <div
          data-testid="main-articulate-player-stage"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* KASUS 1: SLIDE BAWAAN ASLI (1 .. ORIGINAL_SLIDE_COUNT) */}
          {!isCustomAddedSlide && rawSlideDef ? (
            <div
              data-testid={`native-slide-view-${currentSlideId}`}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 16,
                pointerEvents: 'auto',
              }}
            >
              {/* Galeri Gambar & Video Asli Slide (Dapat Diklik & Digeser via Direct DOM Inspector) */}
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  overflow: 'hidden',
                }}
              >
                {(rawSlideDef.images || []).slice(0, 6).map((img, i) => (
                  <img
                    key={`${currentSlideId}-img-${img.objectId || i}`}
                    data-testid={`canvas-el-native:native-${i}-img`}
                    src={img.url}
                    alt={
                      img.objectId ||
                      `${activeSlide?.title || rawSlideDef.title} aset ${i + 1}`
                    }
                    draggable={false}
                    style={{
                      maxWidth: i === 0 ? '86%' : '28%',
                      maxHeight: i === 0 ? '70%' : '32%',
                      objectFit: 'contain',
                      borderRadius: 8,
                    }}
                  />
                ))}

                {(rawSlideDef.images || []).length === 0 &&
                  (rawSlideDef.videos || []).map((vid, i) => (
                    <img
                      key={`${currentSlideId}-vid-${vid.objectId || i}`}
                      data-testid={`canvas-el-native:native-${i}-img`}
                      src={
                        vid.posterUrl ||
                        rawSlideDef.backgroundUrl ||
                        'mobile/Slide5WPRbcJDCqY.jpg'
                      }
                      alt={`Video Slide: ${
                        activeSlide?.title || rawSlideDef.title
                      }`}
                      draggable={false}
                      style={{
                        maxWidth: '86%',
                        maxHeight: '70%',
                        objectFit: 'contain',
                        borderRadius: 8,
                      }}
                    />
                  ))}
              </div>

              {/* Baris Teks Bawaan Slide & Navigasi Dua Arah (Sebelumnya / Selanjutnya) */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.94)',
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <h2
                    data-testid="canvas-el-native:native-heading"
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0f172a',
                      padding: '2px 8px',
                    }}
                  >
                    {activeSlide?.title || rawSlideDef.title}
                  </h2>
                  {(rawSlideDef.texts || []).slice(0, 5).map((tb, idx) => (
                    <p
                      key={`${currentSlideId}-txt-${tb.objectId || idx}`}
                      data-testid={`canvas-el-native:native-text-${idx}`}
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#334155',
                        backgroundColor: '#f1f5f9',
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {tb.lines.join(' ')}
                    </p>
                  ))}
                </div>

                {/* Bar Navigasi Slide Dua Arah di Dalam Kanvas */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: 6,
                  }}
                >
                  <button
                    type="button"
                    data-studio-nav-ignore="true"
                    data-testid="player-btn-prev-slide"
                    disabled={activeSlideIndex <= 0}
                    onClick={goToPrevSlide}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: activeSlideIndex <= 0 ? 'not-allowed' : 'pointer',
                      opacity: activeSlideIndex <= 0 ? 0.4 : 1,
                    }}
                  >
                    ◀ Sebelumnya
                  </button>

                  <span
                    data-testid="canvas-slide-counter"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#64748b',
                    }}
                  >
                    Halaman {activeSlideIndex + 1} dari {totalSlides} —{' '}
                    {activeSlide?.title || rawSlideDef.title}
                  </span>

                  <button
                    type="button"
                    data-studio-nav-ignore="true"
                    data-testid="player-btn-next-slide"
                    disabled={activeSlideIndex >= totalSlides - 1}
                    onClick={goToNextSlide}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid #1677ff',
                      backgroundColor: '#1677ff',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor:
                        activeSlideIndex >= totalSlides - 1
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: activeSlideIndex >= totalSlides - 1 ? 0.4 : 1,
                    }}
                  >
                    Selanjutnya ▶
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* KASUS 2: SLIDE BARU / TAMBAHAN ADMIN (MELEBIHI SLIDE BAWAAN ASLI) */
            <div
              data-testid="custom-slide-canvas"
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 20,
                background:
                  activeSlide?.bgColor && activeSlide.bgColor !== '#FFFFFF'
                    ? activeSlide.bgColor
                    : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 12,
                  padding: 24,
                  backgroundColor: 'rgba(255, 255, 255, 0.75)',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: 999,
                    backgroundColor: '#eff6ff',
                    color: '#1677ff',
                    fontSize: 11,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Slide Kustom Baru #{activeSlideIndex + 1}
                </span>
                <h2
                  data-testid="canvas-el-native:custom-slide-heading"
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {activeSlide?.title || `Slide ${activeSlideIndex + 1}`}
                </h2>
                <p
                  style={{
                    marginTop: 6,
                    marginBottom: 0,
                    fontSize: 12,
                    color: '#64748b',
                    maxWidth: 420,
                  }}
                >
                  Kanvas slide kustom bersih — silakan tambahkan Teks, Tombol
                  Bergambar, Gambar, atau Audio dari toolbar atas.
                </p>
              </div>

              {/* Bar Navigasi Slide Dua Arah pada Slide Kustom */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.94)',
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                }}
              >
                <button
                  type="button"
                  data-studio-nav-ignore="true"
                  data-testid="player-btn-prev-slide"
                  disabled={activeSlideIndex <= 0}
                  onClick={goToPrevSlide}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: activeSlideIndex <= 0 ? 'not-allowed' : 'pointer',
                    opacity: activeSlideIndex <= 0 ? 0.4 : 1,
                  }}
                >
                  ◀ Sebelumnya
                </button>

                <span
                  data-testid="canvas-slide-counter"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#64748b',
                  }}
                >
                  Halaman {activeSlideIndex + 1} dari {totalSlides} —{' '}
                  {activeSlide?.title || `Slide ${activeSlideIndex + 1}`}
                </span>

                <button
                  type="button"
                  data-studio-nav-ignore="true"
                  data-testid="player-btn-next-slide"
                  disabled={activeSlideIndex >= totalSlides - 1}
                  onClick={goToNextSlide}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #1677ff',
                    backgroundColor: '#1677ff',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor:
                      activeSlideIndex >= totalSlides - 1
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: activeSlideIndex >= totalSlides - 1 ? 0.4 : 1,
                  }}
                >
                  Selanjutnya ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

/**
 * Top-level Application Root (`App`).
 * Membungkus `MainArticulatePlayer` di dalam `<StarlaAdminStudio>` dan `<ContentProvider>`
 * sehingga sinkronisasi slide dua arah berjalan otomatis tanpa mengubah tampilan publik.
 */
export const App: React.FC<AppProps> = ({ initialSupabaseContent = null }) => {
  return (
    <ContentProvider initialSupabaseContent={initialSupabaseContent}>
      <StarlaAdminStudio>
        <MainArticulatePlayer />
      </StarlaAdminStudio>
    </ContentProvider>
  );
};

export default App;
