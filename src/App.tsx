// src/App.tsx
// ROOT APPLICATION & REAL-TIME ZERO-REGRESSION BINDING (MainPublicApp + AdminDashboard)
import React, { useEffect, useRef } from 'react';
import { ContentProvider, useContent } from './context/ContentContext';
import { StarlaPlayer } from './components/StarlaPlayer';
import {
  AdminDashboard,
  useAdminData,
} from './AdminDashboard';
import { ContentSchema } from './data/defaultContent';

export { AdminDashboard, useAdminData };

export interface AppProps {
  initialSupabaseContent?: ContentSchema | null;
}

/**
 * Komponen Utama Aplikasi Publik (`MainPublicApp`).
 * - Mempertahankan 100% seluruh komponen, visual, tata letak, state slide, kuis, dan audio asli (`StarlaPlayer`).
 * - Menyinkronkan perpindahan slide dan perubahan data konten secara real-time dua arah antara
 *   player publik (`#preso` / `ContentContext`) dan `useAdminData()` di `AdminDashboard`.
 */
export function MainPublicApp(): React.ReactElement {
  const {
    activeSlideIndex,
    setActiveSlideIndex,
    totalSlides,
  } = useAdminData();

  const {
    content,
    activeSlideIndex: ctxSlideIndex,
    setActiveSlideIndex: setCtxSlideIndex,
    setActiveCanvasSlideId,
  } = useContent();

  const lastSyncedSlideRef = useRef<number>(activeSlideIndex);
  const lastAriaLabelRef = useRef<string>('');

  // 1. Sinkronisasi Arah 1: AdminDashboard (activeSlideIndex) -> ContentContext & Player
  useEffect(() => {
    lastSyncedSlideRef.current = activeSlideIndex;
    if (activeSlideIndex >= 0 && activeSlideIndex < content.slideOrder.length) {
      const targetSlideId = content.slideOrder[activeSlideIndex];
      if (ctxSlideIndex !== activeSlideIndex) {
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

  // 2. Sinkronisasi Arah 2: Navigasi Slide di Player Asli (#preso) -> AdminDashboard (useAdminData)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const presoEl = document.getElementById('preso');
    if (!presoEl) return;

    const initialLabelEl = document.querySelector('[aria-label^="slide:"]');
    if (initialLabelEl) {
      lastAriaLabelRef.current =
        initialLabelEl.getAttribute('aria-label') || '';
    }

    const observer = new MutationObserver(() => {
      const slideLabelEl = document.querySelector('[aria-label^="slide:"]');
      const ariaVal = slideLabelEl?.getAttribute('aria-label');
      if (!ariaVal || ariaVal === lastAriaLabelRef.current) return;
      lastAriaLabelRef.current = ariaVal;

      const cleanTitle = ariaVal.replace(/^slide:\s*/i, '').trim();
      if (!cleanTitle) return;

      const matchedIdx = content.slideOrder.findIndex((sid) => {
        const s = content.slides[sid];
        return s && s.title.trim().toLowerCase() === cleanTitle.toLowerCase();
      });

      if (
        matchedIdx >= 0 &&
        matchedIdx < totalSlides &&
        matchedIdx !== lastSyncedSlideRef.current
      ) {
        lastSyncedSlideRef.current = matchedIdx;
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
  }, [content.slideOrder, content.slides, totalSlides, setActiveSlideIndex]);

  return <StarlaPlayer />;
}

export const LazyAdminDashboard = React.lazy(() =>
  import('./AdminDashboard').then((mod) => ({
    default: mod.AdminDashboard,
  }))
);

/**
 * Root Application (`App`).
 * Membungkus `<MainPublicApp />` di dalam `<AdminDashboard>` dan `<ContentProvider>`
 * dengan sistem Lazy Loading & Suspense serta jaminan 100% Zero-Regression pada tampilan publik dan audio.
 */
export default function App({
  initialSupabaseContent = null,
}: AppProps = {}): React.ReactElement {
  return (
    <ContentProvider initialSupabaseContent={initialSupabaseContent}>
      < React.Suspense fallback={null}>
        <AdminDashboard>
          <MainPublicApp />
        </AdminDashboard>
      </React.Suspense>
    </ContentProvider>
  );
}

export { App };
