import React, { useEffect, useRef } from 'react';
import { useContent } from '../context/ContentContext';
import {
  transformStorylineProvideData,
  syncContentToLiveDom,
} from '../utils/contentRuntimeBridge';
import { ContentSchema } from '../data/defaultContent';

type GlobalProvideDataFn = (dataType: string, rawJson: string) => void;

interface StarlaWindow extends Window {
  globalProvideData?: GlobalProvideDataFn & {
    __starlaWrapped?: boolean;
    __starlaOrig?: GlobalProvideDataFn;
  };
  __STARLA_CONTENT__?: ContentSchema;
  __STARLA_CONTENT_CONTEXT__?: ReturnType<typeof useContent>;
  StarlaCoreEngine?: Record<string, unknown>;
  StarlaEngine?: Record<string, unknown>;
  StarlaBudaya?: Record<string, unknown>;
}

/**
 * Komponen Player Utama STARLA BUDAYA.
 * Membaca data dari `ContentContext` (dengan nilai awal `defaultContent` / `localStorage` / Supabase)
 * dan menyinkronkannya secara non-intrusif dengan engine Articulate Storyline
 * tanpa mengubah satu pun class CSS, layout, animasi, atau logika trigger audio.
 */
export const StarlaPlayer: React.FC = () => {
  const contextApi = useContent();
  const { content, storageSource, isUsingFallback } = contextApi;
  const latestContentRef = useRef<ContentSchema>(content);
  latestContentRef.current = content;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as StarlaWindow;

    // Sinkronkan konten aktif ke global window dan DOM
    win.__STARLA_CONTENT__ = latestContentRef.current;
    win.__STARLA_CONTENT_CONTEXT__ = contextApi;
    syncContentToLiveDom(latestContentRef.current);

    // Integrasikan ke StarlaCoreEngine tanpa mengubah metode bawaan
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

    // Pasang interceptor zero-regression pada window.globalProvideData
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

  return (
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
      hidden
      aria-hidden="true"
    />
  );
};

export default StarlaPlayer;
