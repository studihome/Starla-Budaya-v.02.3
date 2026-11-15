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
  ElementOverrideConfig,
  CanvasElementItem,
  CanvasElementType,
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
  applyElementOverridePatch,
  applyHideNativeElement,
  applyRestoreNativeElement,
  applyAddCanvasElement,
  applyUpdateCanvasElement,
  applyDeleteCanvasElement,
  applyDuplicateCanvasElement,
  applyReorderCanvasElementLayer,
  applyToggleCanvasElementLock,
  applyResetSingleSlide,
  createDefaultCanvasElement,
  HistoryStackState,
  createInitialHistoryState,
  pushHistoryState,
  undoHistoryState,
  redoHistoryState,
  updateTransientHistoryState,
  commitTransientHistoryState,
} from '../features/canvas/canvasMath';
import { duplicateSlideItem } from '../features/admin/adminHelpers';
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
  isCanvasEditMode: boolean;
  setIsCanvasEditMode: (enabled: boolean) => void;
  isGridSnapEnabled: boolean;
  setIsGridSnapEnabled: (enabled: boolean) => void;
  selectedCanvasItemId: string | null;
  setSelectedCanvasItemId: (id: string | null) => void;
  activeCanvasSlideId: string;
  setActiveCanvasSlideId: (slideId: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  undoContent: () => void;
  redoContent: () => void;
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
  updateElementOverride: (
    slideId: string,
    elementId: string,
    patch: Partial<ElementOverrideConfig>
  ) => void;
  updateElementOverrideTransient: (
    slideId: string,
    elementId: string,
    patch: Partial<ElementOverrideConfig>
  ) => void;
  hideNativeElement: (slideId: string, elementId: string) => void;
  restoreNativeElement: (slideId: string, elementId: string) => void;
  addCanvasElement: (
    slideId: string,
    elementInput: Partial<CanvasElementItem> & { type: CanvasElementType }
  ) => CanvasElementItem;
  updateCanvasElement: (
    slideId: string,
    elementId: string,
    patch: Partial<CanvasElementItem>
  ) => void;
  updateElementTransient: (
    slideId: string,
    elementId: string,
    patch: Partial<CanvasElementItem>
  ) => void;
  commitToHistory: () => void;
  deleteCanvasElement: (slideId: string, elementId: string) => void;
  duplicateCanvasElement: (
    slideId: string,
    elementId: string
  ) => CanvasElementItem | null;
  reorderCanvasElementLayer: (
    slideId: string,
    elementId: string,
    direction: 'forward' | 'backward'
  ) => void;
  toggleCanvasElementLock: (slideId: string, elementId: string) => void;
  resetSlideContent: (slideId: string) => void;
  duplicateSlide: (slideId: string) => string | null;
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
  isCanvasEditMode: false,
  setIsCanvasEditMode: () => {},
  isGridSnapEnabled: true,
  setIsGridSnapEnabled: () => {},
  selectedCanvasItemId: null,
  setSelectedCanvasItemId: () => {},
  activeCanvasSlideId: defaultContent.slideOrder[0] || '5dLAzY4SKGI',
  setActiveCanvasSlideId: () => {},
  canUndo: false,
  canRedo: false,
  undoCount: 0,
  redoCount: 0,
  undoContent: () => {},
  redoContent: () => {},
  updateContent: () => {},
  updateSlideContent: () => {},
  updateQuizQuestion: () => {},
  updateSvgText: () => {},
  updateAudioUrl: () => {},
  updateImageUrl: () => {},
  updateElementOverride: () => {},
  updateElementOverrideTransient: () => {},
  hideNativeElement: () => {},
  restoreNativeElement: () => {},
  addCanvasElement: (_slideId, elementInput) =>
    createDefaultCanvasElement(elementInput.type, 0, elementInput),
  updateCanvasElement: () => {},
  updateElementTransient: () => {},
  commitToHistory: () => {},
  deleteCanvasElement: () => {},
  duplicateCanvasElement: () => null,
  reorderCanvasElementLayer: () => {},
  toggleCanvasElementLock: () => {},
  resetSlideContent: () => {},
  duplicateSlide: () => null,
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

  const [historyState, setHistoryState] = useState<
    HistoryStackState<ContentSchema>
  >(() => {
    const initial =
      initialSupabaseContent ?? loadContentFromLocalStorage() ?? activeContent;
    return createInitialHistoryState(initial);
  });

  const content = historyState.present;

  const [storageSource, setStorageSource] = useState<
    'supabase' | 'localStorage' | 'default'
  >(() => {
    if (initialSupabaseContent) return 'supabase';
    return loadContentFromLocalStorage() ? 'localStorage' : 'default';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [isCanvasEditMode, setIsCanvasEditMode] = useState<boolean>(false);
  const [isGridSnapEnabled, setIsGridSnapEnabled] = useState<boolean>(true);
  const [selectedCanvasItemId, setSelectedCanvasItemId] = useState<
    string | null
  >(null);
  const [activeCanvasSlideId, setActiveCanvasSlideId] = useState<string>(
    () => defaultContent.slideOrder[0] || '5dLAzY4SKGI'
  );

  const contentRef = useRef<ContentSchema>(content);
  contentRef.current = content;

  // Menyimpan snapshot awal sebelum drag/resize 60fps dimulai agar `commitToHistory()` menyimpan 1 langkah Undo utuh
  const transientBaselineRef = useRef<ContentSchema | null>(null);

  const commitContentChange = useCallback(
    (
      nextResolver: (prev: ContentSchema) => ContentSchema,
      recordHistory = true
    ) => {
      setHistoryState((prevHist) => {
        const next = nextResolver(prevHist.present);
        if (next === prevHist.present) return prevHist;
        transientBaselineRef.current = null;
        saveContentToLocalStorage(next);
        syncContentToLiveDom(next);
        contentRef.current = next;
        if (!recordHistory) {
          return {
            ...prevHist,
            present: next,
          };
        }
        return pushHistoryState(prevHist, next);
      });
    },
    []
  );

  const applyTransientChange = useCallback(
    (nextResolver: (prev: ContentSchema) => ContentSchema) => {
      setHistoryState((prevHist) => {
        const next = nextResolver(prevHist.present);
        if (next === prevHist.present) return prevHist;
        if (!transientBaselineRef.current) {
          transientBaselineRef.current = prevHist.present;
        }
        contentRef.current = next;
        return updateTransientHistoryState(prevHist, next);
      });
    },
    []
  );

  const commitToHistory = useCallback(() => {
    setHistoryState((prevHist) => {
      const baseline = transientBaselineRef.current;
      transientBaselineRef.current = null;
      if (!baseline || baseline === prevHist.present) {
        return prevHist;
      }
      saveContentToLocalStorage(prevHist.present);
      syncContentToLiveDom(prevHist.present);
      return commitTransientHistoryState(prevHist, baseline);
    });
  }, []);

  const undoContent = useCallback(() => {
    setHistoryState((prevHist) => {
      if (prevHist.past.length === 0) return prevHist;
      const nextHist = undoHistoryState(prevHist);
      saveContentToLocalStorage(nextHist.present);
      syncContentToLiveDom(nextHist.present);
      contentRef.current = nextHist.present;
      return nextHist;
    });
  }, []);

  const redoContent = useCallback(() => {
    setHistoryState((prevHist) => {
      if (prevHist.future.length === 0) return prevHist;
      const nextHist = redoHistoryState(prevHist);
      saveContentToLocalStorage(nextHist.present);
      syncContentToLiveDom(nextHist.present);
      contentRef.current = nextHist.present;
      return nextHist;
    });
  }, []);

  const refreshContentFromCloud =
    useCallback(async (): Promise<FetchContentResult> => {
      setIsSyncing(true);
      try {
        const result = await fetchMainContentFromCloud();
        if (result.supabaseContent) {
          setSupabaseContent(result.supabaseContent);
        }
        setHistoryState(createInitialHistoryState(result.content));
        contentRef.current = result.content;
        setStorageSource(result.source);
        setLastSyncError(result.error ?? null);
        syncContentToLiveDom(result.content);
        return result;
      } catch (err) {
        const fallback = loadContentFromLocalStorage() ?? defaultContent;
        setHistoryState(createInitialHistoryState(fallback));
        contentRef.current = fallback;
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
      setHistoryState(createInitialHistoryState(initialSupabaseContent));
      contentRef.current = initialSupabaseContent;
      setStorageSource('supabase');
      syncContentToLiveDom(initialSupabaseContent);
      return;
    }
    void refreshContentFromCloud();
  }, [initialSupabaseContent, refreshContentFromCloud]);

  const updateContent = useCallback(
    (updater: ContentUpdater) => {
      commitContentChange((prev) => resolveUpdatedContent(prev, updater));
    },
    [commitContentChange]
  );

  const updateSlideContent = useCallback(
    (slideId: string, patch: Partial<SlideContentItem>) => {
      commitContentChange((prev) => applySlidePatch(prev, slideId, patch));
    },
    [commitContentChange]
  );

  const updateQuizQuestion = useCallback(
    (slideId: string, patch: Partial<QuizQuestionItem>) => {
      commitContentChange((prev) =>
        applyQuizQuestionPatch(prev, slideId, patch)
      );
    },
    [commitContentChange]
  );

  const updateSvgText = useCallback(
    (commandSetId: string, lines: string[]) => {
      commitContentChange((prev) => {
        const existing = prev.svgTextCommandSets[commandSetId];
        return {
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
      });
    },
    [commitContentChange]
  );

  const updateAudioUrl = useCallback(
    (assetId: number, url: string) => {
      commitContentChange((prev) => {
        const existing = prev.audioCatalog[assetId];
        return {
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
      });
    },
    [commitContentChange]
  );

  const updateImageUrl = useCallback(
    (assetId: number, url: string) => {
      commitContentChange((prev) => {
        const existing = prev.imageCatalog[assetId];
        return {
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
      });
    },
    [commitContentChange]
  );

  const updateElementOverride = useCallback(
    (
      slideId: string,
      elementId: string,
      patch: Partial<ElementOverrideConfig>
    ) => {
      commitContentChange((prev) =>
        applyElementOverridePatch(prev, slideId, elementId, patch)
      );
    },
    [commitContentChange]
  );

  const updateElementOverrideTransient = useCallback(
    (
      slideId: string,
      elementId: string,
      patch: Partial<ElementOverrideConfig>
    ) => {
      applyTransientChange((prev) =>
        applyElementOverridePatch(prev, slideId, elementId, patch)
      );
    },
    [applyTransientChange]
  );

  const hideNativeElement = useCallback(
    (slideId: string, elementId: string) => {
      commitContentChange((prev) =>
        applyHideNativeElement(prev, slideId, elementId)
      );
      setSelectedCanvasItemId((curr) => (curr === elementId ? null : curr));
    },
    [commitContentChange]
  );

  const restoreNativeElement = useCallback(
    (slideId: string, elementId: string) => {
      commitContentChange((prev) =>
        applyRestoreNativeElement(prev, slideId, elementId)
      );
    },
    [commitContentChange]
  );

  const addCanvasElement = useCallback(
    (
      slideId: string,
      elementInput: Partial<CanvasElementItem> & { type: CanvasElementType }
    ): CanvasElementItem => {
      const { nextSchema, createdElement } = applyAddCanvasElement(
        contentRef.current,
        slideId,
        elementInput
      );
      commitContentChange(() => nextSchema);
      setSelectedCanvasItemId(createdElement.id);
      return createdElement;
    },
    [commitContentChange]
  );

  const updateCanvasElement = useCallback(
    (
      slideId: string,
      elementId: string,
      patch: Partial<CanvasElementItem>
    ) => {
      commitContentChange((prev) =>
        applyUpdateCanvasElement(prev, slideId, elementId, patch)
      );
    },
    [commitContentChange]
  );

  const updateElementTransient = useCallback(
    (
      slideId: string,
      elementId: string,
      patch: Partial<CanvasElementItem>
    ) => {
      applyTransientChange((prev) =>
        applyUpdateCanvasElement(prev, slideId, elementId, patch)
      );
    },
    [applyTransientChange]
  );

  const deleteCanvasElement = useCallback(
    (slideId: string, elementId: string) => {
      commitContentChange((prev) =>
        applyDeleteCanvasElement(prev, slideId, elementId)
      );
      setSelectedCanvasItemId((curr) => (curr === elementId ? null : curr));
    },
    [commitContentChange]
  );

  const duplicateCanvasElement = useCallback(
    (slideId: string, elementId: string): CanvasElementItem | null => {
      const { nextSchema, duplicatedElement } = applyDuplicateCanvasElement(
        contentRef.current,
        slideId,
        elementId
      );
      if (duplicatedElement) {
        commitContentChange(() => nextSchema);
        setSelectedCanvasItemId(duplicatedElement.id);
      }
      return duplicatedElement;
    },
    [commitContentChange]
  );

  const reorderCanvasElementLayer = useCallback(
    (
      slideId: string,
      elementId: string,
      direction: 'forward' | 'backward'
    ) => {
      commitContentChange((prev) =>
        applyReorderCanvasElementLayer(prev, slideId, elementId, direction)
      );
    },
    [commitContentChange]
  );

  const toggleCanvasElementLock = useCallback(
    (slideId: string, elementId: string) => {
      commitContentChange((prev) =>
        applyToggleCanvasElementLock(prev, slideId, elementId)
      );
    },
    [commitContentChange]
  );

  const resetSlideContent = useCallback(
    (slideId: string) => {
      commitContentChange((prev) =>
        applyResetSingleSlide(prev, slideId, defaultContent.slides[slideId])
      );
      setSelectedCanvasItemId(null);
    },
    [commitContentChange]
  );

  const duplicateSlide = useCallback(
    (slideId: string): string | null => {
      const { nextSchema, duplicatedSlideId } = duplicateSlideItem(
        contentRef.current,
        slideId
      );
      if (duplicatedSlideId) {
        commitContentChange(() => nextSchema);
        setActiveCanvasSlideId(duplicatedSlideId);
      }
      return duplicatedSlideId;
    },
    [commitContentChange]
  );

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

        commitContentChange(() => resolved, false);

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
    [commitContentChange]
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
    setHistoryState(createInitialHistoryState(defaultContent));
    contentRef.current = defaultContent;
    setStorageSource('default');
    setLastSyncError(null);
    setSelectedCanvasItemId(null);
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
      isCanvasEditMode,
      setIsCanvasEditMode,
      isGridSnapEnabled,
      setIsGridSnapEnabled,
      selectedCanvasItemId,
      setSelectedCanvasItemId,
      activeCanvasSlideId,
      setActiveCanvasSlideId,
      canUndo: historyState.past.length > 0,
      canRedo: historyState.future.length > 0,
      undoCount: historyState.past.length,
      redoCount: historyState.future.length,
      undoContent,
      redoContent,
      updateContent,
      updateSlideContent,
      updateQuizQuestion,
      updateSvgText,
      updateAudioUrl,
      updateImageUrl,
      updateElementOverride,
      updateElementOverrideTransient,
      hideNativeElement,
      restoreNativeElement,
      addCanvasElement,
      updateCanvasElement,
      updateElementTransient,
      commitToHistory,
      deleteCanvasElement,
      duplicateCanvasElement,
      reorderCanvasElementLayer,
      toggleCanvasElementLock,
      resetSlideContent,
      duplicateSlide,
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
      isCanvasEditMode,
      isGridSnapEnabled,
      selectedCanvasItemId,
      activeCanvasSlideId,
      historyState.past.length,
      historyState.future.length,
      undoContent,
      redoContent,
      updateContent,
      updateSlideContent,
      updateQuizQuestion,
      updateSvgText,
      updateAudioUrl,
      updateImageUrl,
      updateElementOverride,
      updateElementOverrideTransient,
      hideNativeElement,
      restoreNativeElement,
      addCanvasElement,
      updateCanvasElement,
      updateElementTransient,
      commitToHistory,
      deleteCanvasElement,
      duplicateCanvasElement,
      reorderCanvasElementLayer,
      toggleCanvasElementLock,
      resetSlideContent,
      duplicateSlide,
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

