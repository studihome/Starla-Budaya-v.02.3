import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ContentSchema,
  SlideContentItem,
  QuizQuestionItem,
  defaultContent,
} from '../data/defaultContent';
import {
  ContentUpdater,
  resolveUpdatedContent,
  applySlidePatch,
  applyQuizQuestionPatch,
  syncContentToLiveDom,
} from '../utils/contentRuntimeBridge';

export interface ContentContextValue {
  content: ContentSchema;
  isUsingFallback: boolean;
  updateContent: (updater: ContentUpdater) => void;
  updateSlideContent: (
    slideId: string,
    patch: Partial<SlideContentItem>
  ) => void;
  updateQuizQuestion: (
    slideId: string,
    patch: Partial<QuizQuestionItem>
  ) => void;
  updateSvgText: (commandSetId: string, lines: string[]) => void;
  updateAudioUrl: (assetId: number, url: string) => void;
  updateImageUrl: (assetId: number, url: string) => void;
  resetContent: () => void;
}

export const ContentContext = createContext<ContentContextValue>({
  content: defaultContent,
  isUsingFallback: true,
  updateContent: () => {},
  updateSlideContent: () => {},
  updateQuizQuestion: () => {},
  updateSvgText: () => {},
  updateAudioUrl: () => {},
  updateImageUrl: () => {},
  resetContent: () => {},
});

export interface ContentProviderProps {
  children: React.ReactNode;
  initialSupabaseContent?: ContentSchema | null;
}

/**
 * Safely reads environment variables across both Next.js (Vercel) and Vite (AI Studio)
 * without throwing if undefined.
 */
export function getSupabaseEnvConfig(): {
  url: string | null;
  anonKey: string | null;
} {
  let url: string | null = null;
  let anonKey: string | null = null;

  try {
    if (typeof process !== 'undefined' && process.env) {
      url =
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        null;
      anonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        null;
    }
  } catch {
    // Ignore process access errors in strict browser sandboxes
  }

  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> })
      ?.env;
    if (metaEnv) {
      url =
        url ||
        metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
        metaEnv.VITE_SUPABASE_URL ||
        null;
      anonKey =
        anonKey ||
        metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        metaEnv.VITE_SUPABASE_ANON_KEY ||
        null;
    }
  } catch {
    // Ignore import.meta access errors in CommonJS environments
  }

  return { url, anonKey };
}

export const ContentProvider: React.FC<ContentProviderProps> = ({
  children,
  initialSupabaseContent = null,
}) => {
  const [supabaseContent] = useState<ContentSchema | null>(
    initialSupabaseContent
  );

  // Guardrail 2: Wajib gunakan pola Fallback `const activeContent = supabaseContent ?? defaultContent;`
  const activeContent = supabaseContent ?? defaultContent;

  const [content, setContent] = useState<ContentSchema>(activeContent);

  useEffect(() => {
    setContent(supabaseContent ?? defaultContent);
  }, [supabaseContent]);

  const updateContent = useCallback((updater: ContentUpdater) => {
    setContent((prev) => {
      const next = resolveUpdatedContent(prev, updater);
      syncContentToLiveDom(next);
      return next;
    });
  }, []);

  const updateSlideContent = useCallback(
    (slideId: string, patch: Partial<SlideContentItem>) => {
      setContent((prev) => {
        const next = applySlidePatch(prev, slideId, patch);
        syncContentToLiveDom(next);
        return next;
      });
    },
    []
  );

  const updateQuizQuestion = useCallback(
    (slideId: string, patch: Partial<QuizQuestionItem>) => {
      setContent((prev) => {
        const next = applyQuizQuestionPatch(prev, slideId, patch);
        syncContentToLiveDom(next);
        return next;
      });
    },
    []
  );

  const updateSvgText = useCallback((commandSetId: string, lines: string[]) => {
    setContent((prev) => {
      const existing = prev.svgTextCommandSets[commandSetId];
      const next: ContentSchema = {
        ...prev,
        svgTextCommandSets: {
          ...prev.svgTextCommandSets,
          [commandSetId]: {
            commandSetId,
            index: existing
              ? existing.index
              : Number(commandSetId.replace('commandset-', '')) || 0,
            lines: [...lines],
          },
        },
      };
      syncContentToLiveDom(next);
      return next;
    });
  }, []);

  const updateAudioUrl = useCallback((assetId: number, url: string) => {
    setContent((prev) => {
      const existing = prev.audioCatalog[assetId];
      const next: ContentSchema = {
        ...prev,
        audioCatalog: {
          ...prev.audioCatalog,
          [assetId]: {
            assetId,
            url,
            durationMs: existing ? existing.durationMs : 0,
            fileSize: existing ? existing.fileSize : 0,
          },
        },
      };
      syncContentToLiveDom(next);
      return next;
    });
  }, []);

  const updateImageUrl = useCallback((assetId: number, url: string) => {
    setContent((prev) => {
      const existing = prev.imageCatalog[assetId];
      const next: ContentSchema = {
        ...prev,
        imageCatalog: {
          ...prev.imageCatalog,
          [assetId]: {
            assetId,
            url,
            imageType: existing ? existing.imageType : 'normal',
            width: existing ? existing.width : 0,
            height: existing ? existing.height : 0,
            fileSize: existing ? existing.fileSize : 0,
          },
        },
      };
      syncContentToLiveDom(next);
      return next;
    });
  }, []);

  const resetContent = useCallback(() => {
    const fallback = supabaseContent ?? defaultContent;
    setContent(fallback);
    syncContentToLiveDom(fallback);
  }, [supabaseContent]);

  useEffect(() => {
    syncContentToLiveDom(content);
  }, [content]);

  const contextValue = useMemo<ContentContextValue>(
    () => ({
      content,
      isUsingFallback: supabaseContent === null,
      updateContent,
      updateSlideContent,
      updateQuizQuestion,
      updateSvgText,
      updateAudioUrl,
      updateImageUrl,
      resetContent,
    }),
    [
      content,
      supabaseContent,
      updateContent,
      updateSlideContent,
      updateQuizQuestion,
      updateSvgText,
      updateAudioUrl,
      updateImageUrl,
      resetContent,
    ]
  );

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
};

export function useContent(): ContentContextValue {
  return useContext(ContentContext);
}

export default ContentContext;
