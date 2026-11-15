import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  getSupabaseEnvConfig,
  isSupabaseConfigured,
  fetchMainContentFromCloud,
  saveMainContentToCloud,
  uploadMediaAssetToCloud,
  loadContentFromLocalStorage,
  saveContentToLocalStorage,
  clearContentFromLocalStorage,
  FetchContentResult,
  SaveContentResult,
  UploadMediaResult,
} from '../lib/supabase';

export { getSupabaseEnvConfig, isSupabaseConfigured };

export interface ContentContextValue {
  content: ContentSchema;
  isUsingFallback: boolean;
  storageSource: 'supabase' | 'localStorage' | 'default';
  isSyncing: boolean;
  lastSyncError: string | null;
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
  saveContentToCloud: (
    newContent?: ContentSchema | Partial<ContentSchema>
  ) => Promise<SaveContentResult>;
  uploadMediaToCloud: (
    file: File | Blob,
    customFileName?: string
  ) => Promise<UploadMediaResult>;
  refreshContentFromCloud: () => Promise<FetchContentResult>;
  resetContent: () => void;
}

export const ContentContext = createContext<ContentContextValue>({
  content: defaultContent,
  isUsingFallback: true,
  storageSource: 'default',
  isSyncing: false,
  lastSyncError: null,
  updateContent: () => {},
  updateSlideContent: () => {},
  updateQuizQuestion: () => {},
  updateSvgText: () => {},
  updateAudioUrl: () => {},
  updateImageUrl: () => {},
  saveContentToCloud: async (newContent) => ({
    success: true,
    source: 'localStorage',
    content: (newContent as ContentSchema) ?? defaultContent,
  }),
  uploadMediaToCloud: async () => ({
    success: false,
    url: '',
    path: '',
    source: 'localStorage',
  }),
  refreshContentFromCloud: async () => ({
    content: defaultContent,
    supabaseContent: null,
    source: 'default',
  }),
  resetContent: () => {},
});

export interface ContentProviderProps {
  children: React.ReactNode;
  initialSupabaseContent?: ContentSchema | null;
}

export const ContentProvider: React.FC<ContentProviderProps> = ({
  children,
  initialSupabaseContent = null,
}) => {
  const [supabaseContent, setSupabaseContent] = useState<ContentSchema | null>(
    initialSupabaseContent
  );

  // Guardrail 2: Wajib gunakan pola Fallback `const activeContent = supabaseContent ?? defaultContent;`
  const activeContent = supabaseContent ?? defaultContent;

  const [content, setContent] = useState<ContentSchema>(() => {
    if (initialSupabaseContent) return initialSupabaseContent;
    const localBackup = loadContentFromLocalStorage();
    return localBackup ?? activeContent;
  });

  const [storageSource, setStorageSource] = useState<
    'supabase' | 'localStorage' | 'default'
  >(() => {
    if (initialSupabaseContent) return 'supabase';
    return loadContentFromLocalStorage() ? 'localStorage' : 'default';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const contentRef = useRef<ContentSchema>(content);
  contentRef.current = content;

  const refreshContentFromCloud =
    useCallback(async (): Promise<FetchContentResult> => {
      setIsSyncing(true);
      try {
        const result = await fetchMainContentFromCloud();
        if (result.supabaseContent) {
          setSupabaseContent(result.supabaseContent);
        }
        setContent(result.content);
        setStorageSource(result.source);
        setLastSyncError(result.error ?? null);
        syncContentToLiveDom(result.content);
        return result;
      } catch (err) {
        const fallback = loadContentFromLocalStorage() ?? defaultContent;
        setContent(fallback);
        setStorageSource(
          loadContentFromLocalStorage() ? 'localStorage' : 'default'
        );
        setLastSyncError(err instanceof Error ? err.message : String(err));
        syncContentToLiveDom(fallback);
        return {
          content: fallback,
          supabaseContent: null,
          source: loadContentFromLocalStorage() ? 'localStorage' : 'default',
        };
      } finally {
        setIsSyncing(false);
      }
    }, []);

  // Saat aplikasi dimuat, ambil data JSON konten terbaru dari tabel Supabase `app_contents` (slug = 'main')
  useEffect(() => {
    if (initialSupabaseContent) {
      setSupabaseContent(initialSupabaseContent);
      setContent(initialSupabaseContent);
      setStorageSource('supabase');
      syncContentToLiveDom(initialSupabaseContent);
      return;
    }
    void refreshContentFromCloud();
  }, [initialSupabaseContent, refreshContentFromCloud]);

  const updateContent = useCallback((updater: ContentUpdater) => {
    setContent((prev) => {
      const next = resolveUpdatedContent(prev, updater);
      saveContentToLocalStorage(next);
      syncContentToLiveDom(next);
      return next;
    });
  }, []);

  const updateSlideContent = useCallback(
    (slideId: string, patch: Partial<SlideContentItem>) => {
      setContent((prev) => {
        const next = applySlidePatch(prev, slideId, patch);
        saveContentToLocalStorage(next);
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
        saveContentToLocalStorage(next);
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
      saveContentToLocalStorage(next);
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
      saveContentToLocalStorage(next);
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
      saveContentToLocalStorage(next);
      syncContentToLiveDom(next);
      return next;
    });
  }, []);

  /**
   * Menyimpan perubahan konten ke Supabase (`app_contents`, `slug = 'main'`)
   * dengan fallback otomatis ke `localStorage` jika Supabase belum dikonfigurasi atau gagal.
   */
  const saveContentToCloud = useCallback(
    async (
      newContent?: ContentSchema | Partial<ContentSchema>
    ): Promise<SaveContentResult> => {
      setIsSyncing(true);
      try {
        const resolved = newContent
          ? resolveUpdatedContent(contentRef.current, newContent)
          : contentRef.current;

        setContent(resolved);
        syncContentToLiveDom(resolved);

        const result = await saveMainContentToCloud(resolved);
        if (result.source === 'supabase') {
          setSupabaseContent(resolved);
        }
        setStorageSource(result.source);
        setLastSyncError(result.error ?? null);
        return result;
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  /**
   * Mengunggah file audio/gambar baru ke Supabase Storage bucket `media-assets`
   * dengan fallback otomatis ke Data URL + `localStorage` jika Supabase belum dikonfigurasi atau gagal.
   */
  const uploadMediaToCloud = useCallback(
    async (
      file: File | Blob,
      customFileName?: string
    ): Promise<UploadMediaResult> => {
      setIsSyncing(true);
      try {
        const result = await uploadMediaAssetToCloud(file, customFileName);
        if (result.error) {
          setLastSyncError(result.error);
        }
        return result;
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const resetContent = useCallback(() => {
    clearContentFromLocalStorage();
    setSupabaseContent(null);
    setContent(defaultContent);
    setStorageSource('default');
    setLastSyncError(null);
    syncContentToLiveDom(defaultContent);
  }, []);

  useEffect(() => {
    syncContentToLiveDom(content);
  }, [content]);

  const contextValue = useMemo<ContentContextValue>(
    () => ({
      content,
      isUsingFallback: storageSource !== 'supabase',
      storageSource,
      isSyncing,
      lastSyncError,
      updateContent,
      updateSlideContent,
      updateQuizQuestion,
      updateSvgText,
      updateAudioUrl,
      updateImageUrl,
      saveContentToCloud,
      uploadMediaToCloud,
      refreshContentFromCloud,
      resetContent,
    }),
    [
      content,
      storageSource,
      isSyncing,
      lastSyncError,
      updateContent,
      updateSlideContent,
      updateQuizQuestion,
      updateSvgText,
      updateAudioUrl,
      updateImageUrl,
      saveContentToCloud,
      uploadMediaToCloud,
      refreshContentFromCloud,
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
