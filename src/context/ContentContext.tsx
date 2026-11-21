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
  CANVAS_SAVE_DEBOUNCE_MS,
  createCanvasStateSaveDebouncer,
} from '../features/canvas/canvasMath';
import {
  duplicateSlideItem,
  getConfiguredAdminPin,
  addSlideItem,
  deleteSlideItem,
  applyStarlaMenuAndPameranUpdate,
} from '../features/admin/adminHelpers';
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

export const ADMIN_PIN: string = getConfiguredAdminPin();

export interface ActiveSlideView extends SlideContentItem {
  elements: CanvasElementItem[];
}

export interface ContentContextValue {
  content: ContentSchema;
  isUsingFallback: boolean;
  storageSource: 'supabase' | 'localStorage' | 'default';
  isSyncing: boolean;
  isSaving: boolean;
  lastSyncError: string | null;
  isCanvasEditMode: boolean;
  setIsCanvasEditMode: (enabled: boolean) => void;
  isEditMode: boolean;
  setIsEditMode: (enabled: boolean) => void;
  isGridSnapEnabled: boolean;
  setIsGridSnapEnabled: (enabled: boolean) => void;
  snapEnabled: boolean;
  setSnapEnabled: (enabled: boolean) => void;
  selectedCanvasItemId: string | null;
  setSelectedCanvasItemId: (id: string | null) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  activeCanvasSlideId: string;
  setActiveCanvasSlideId: (slideId: string) => void;
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  activeSlide: ActiveSlideView;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
  undoContent: () => void;
  redoContent: () => void;
  undo: () => void;
  redo: () => void;
  updateContent: (updater: ContentUpdater) => void;
  updateContentTransient: (updater: ContentUpdater) => void;
  flushPendingSave: () => void;
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
  addElement: (
    type: CanvasElementType,
    customPatch?: Partial<CanvasElementItem>
  ) => CanvasElementItem;
  updateCanvasElement: (
    slideId: string,
    elementId: string,
    patch: Partial<CanvasElementItem>
  ) => void;
  commitElementUpdate: (
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
  deleteElement: (elementId: string) => void;
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
  addSlide: () => string;
  deleteSlide: (index: number) => void;
  saveContentToCloud: (
    newContent?: ContentSchema | Partial<ContentSchema>
  ) => Promise<SaveContentResult>;
  saveToCloud: () => Promise<boolean>;
  uploadMediaToCloud: (
    file: File | Blob,
    customFileName?: string
  ) => Promise<UploadMediaResult>;
  uploadMediaFile: (file: File | Blob) => Promise<string>;
  refreshContentFromCloud: () => Promise<FetchContentResult>;
  resetContent: () => void;
}

const defaultFirstSlideId = defaultContent.slideOrder[0] || '5dLAzY4SKGI';
const defaultFirstSlide = defaultContent.slides[defaultFirstSlideId];

export const ContentContext = createContext<ContentContextValue>({
  content: defaultContent,
  isUsingFallback: true,
  storageSource: 'default',
  isSyncing: false,
  isSaving: false,
  lastSyncError: null,
  isCanvasEditMode: false,
  setIsCanvasEditMode: () => {},
  isEditMode: false,
  setIsEditMode: () => {},
  isGridSnapEnabled: true,
  setIsGridSnapEnabled: () => {},
  snapEnabled: true,
  setSnapEnabled: () => {},
  selectedCanvasItemId: null,
  setSelectedCanvasItemId: () => {},
  selectedElementId: null,
  setSelectedElementId: () => {},
  activeCanvasSlideId: defaultFirstSlideId,
  setActiveCanvasSlideId: () => {},
  activeSlideIndex: 0,
  setActiveSlideIndex: () => {},
  activeSlide: {
    ...defaultFirstSlide,
    elements: defaultFirstSlide?.canvasElements || [],
  },
  canUndo: false,
  canRedo: false,
  undoCount: 0,
  redoCount: 0,
  undoContent: () => {},
  redoContent: () => {},
  undo: () => {},
  redo: () => {},
  updateContent: () => {},
  updateContentTransient: () => {},
  flushPendingSave: () => {},
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
  addElement: (type, customPatch) =>
    createDefaultCanvasElement(type, 0, customPatch),
  updateCanvasElement: () => {},
  commitElementUpdate: () => {},
  updateElementTransient: () => {},
  commitToHistory: () => {},
  deleteCanvasElement: () => {},
  deleteElement: () => {},
  duplicateCanvasElement: () => null,
  reorderCanvasElementLayer: () => {},
  toggleCanvasElementLock: () => {},
  resetSlideContent: () => {},
  duplicateSlide: () => null,
  addSlide: () => defaultFirstSlideId,
  deleteSlide: () => {},
  saveContentToCloud: async (newContent) => ({
    success: true,
    source: 'localStorage',
    content: (newContent as ContentSchema) ?? defaultContent,
  }),
  saveToCloud: async () => true,
  uploadMediaToCloud: async () => ({
    success: false,
    url: '',
    path: '',
    source: 'localStorage',
  }),
  uploadMediaFile: async () => '',
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
    const initial = applyStarlaMenuAndPameranUpdate(
      initialSupabaseContent ?? loadContentFromLocalStorage() ?? activeContent
    );
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

  // Debouncer penyimpanan state & sinkronisasi DOM untuk mencegah lag saat drag-and-drop 60fps / edit properti cepat
  const saveDebouncerRef = useRef(
    createCanvasStateSaveDebouncer<ContentSchema>(CANVAS_SAVE_DEBOUNCE_MS)
  );

  const schedulePersistAndSync = useCallback((nextContent: ContentSchema) => {
    saveDebouncerRef.current.schedule(nextContent, (latest) => {
      saveContentToLocalStorage(latest);
      syncContentToLiveDom(latest);
    });
  }, []);

  const flushPendingSave = useCallback(() => {
    saveDebouncerRef.current.flush();
  }, []);

  const commitContentChange = useCallback(
    (
      nextResolver: (prev: ContentSchema) => ContentSchema,
      recordHistory = true
    ) => {
      setHistoryState((prevHist) => {
        const next = nextResolver(prevHist.present);
        if (next === prevHist.present) return prevHist;
        transientBaselineRef.current = null;
        contentRef.current = next;
        schedulePersistAndSync(next);
        if (!recordHistory) {
          return {
            ...prevHist,
            present: next,
          };
        }
        return pushHistoryState(prevHist, next);
      });
    },
    [schedulePersistAndSync]
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
        schedulePersistAndSync(next);
        return updateTransientHistoryState(prevHist, next);
      });
    },
    [schedulePersistAndSync]
  );

  const commitToHistory = useCallback(() => {
    setHistoryState((prevHist) => {
      const baseline = transientBaselineRef.current;
      transientBaselineRef.current = null;
      if (!baseline || baseline === prevHist.present) {
        return prevHist;
      }
      schedulePersistAndSync(prevHist.present);
      return commitTransientHistoryState(prevHist, baseline);
    });
  }, [schedulePersistAndSync]);

  const undoContent = useCallback(() => {
    saveDebouncerRef.current.cancel();
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
    saveDebouncerRef.current.cancel();
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
        const hydratedContent = applyStarlaMenuAndPameranUpdate(result.content);
        if (result.supabaseContent) {
          setSupabaseContent(
            applyStarlaMenuAndPameranUpdate(result.supabaseContent)
          );
        }
        setHistoryState(createInitialHistoryState(hydratedContent));
        contentRef.current = hydratedContent;
        setStorageSource(result.source);
        setLastSyncError(result.error ?? null);
        syncContentToLiveDom(hydratedContent);
        return {
          ...result,
          content: hydratedContent,
        };
      } catch (err) {
        const fallback = applyStarlaMenuAndPameranUpdate(
          loadContentFromLocalStorage() ?? defaultContent
        );
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
      const hydrated = applyStarlaMenuAndPameranUpdate(initialSupabaseContent);
      setSupabaseContent(hydrated);
      setHistoryState(createInitialHistoryState(hydrated));
      contentRef.current = hydrated;
      setStorageSource('supabase');
      syncContentToLiveDom(hydrated);
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

  const updateContentTransient = useCallback(
    (updater: ContentUpdater) => {
      applyTransientChange((prev) => resolveUpdatedContent(prev, updater));
    },
    [applyTransientChange]
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
      contentRef.current = nextSchema;
      commitContentChange(
        (prev) => applyAddCanvasElement(prev, slideId, createdElement).nextSchema
      );
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
        saveDebouncerRef.current.flush();
        const resolved = newContent
          ? resolveUpdatedContent(contentRef.current, newContent)
          : contentRef.current;

        commitContentChange(() => resolved, false);
        saveDebouncerRef.current.flush();

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
    saveDebouncerRef.current.cancel();
    clearContentFromLocalStorage();
    setSupabaseContent(null);
    setHistoryState(createInitialHistoryState(defaultContent));
    contentRef.current = defaultContent;
    setStorageSource('default');
    setLastSyncError(null);
    setSelectedCanvasItemId(null);
    syncContentToLiveDom(defaultContent);
  }, []);

  const activeSlideIndex = useMemo(() => {
    const idx = content.slideOrder.indexOf(activeCanvasSlideId);
    return idx >= 0 ? idx : 0;
  }, [content.slideOrder, activeCanvasSlideId]);

  const setActiveSlideIndex = useCallback(
    (index: number) => {
      const targetId = contentRef.current.slideOrder[index];
      if (targetId) {
        setActiveCanvasSlideId(targetId);
        setSelectedCanvasItemId(null);
      }
    },
    []
  );

  const activeSlide = useMemo<ActiveSlideView>(() => {
    const slideObj =
      content.slides[activeCanvasSlideId] ||
      content.slides[content.slideOrder[0]] ||
      defaultFirstSlide;
    return {
      ...slideObj,
      elements: slideObj?.canvasElements || [],
    };
  }, [content.slides, content.slideOrder, activeCanvasSlideId]);

  const addElement = useCallback(
    (
      type: CanvasElementType,
      customPatch?: Partial<CanvasElementItem>
    ): CanvasElementItem => {
      const targetSlideId =
        activeCanvasSlideId || contentRef.current.slideOrder[0];
      return addCanvasElement(targetSlideId, {
        ...customPatch,
        type,
      });
    },
    [activeCanvasSlideId, addCanvasElement]
  );

  const commitElementUpdate = useCallback(
    (elementId: string, patch: Partial<CanvasElementItem>) => {
      const targetSlideId =
        activeCanvasSlideId || contentRef.current.slideOrder[0];
      updateCanvasElement(targetSlideId, elementId, patch);
    },
    [activeCanvasSlideId, updateCanvasElement]
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      const targetSlideId =
        activeCanvasSlideId || contentRef.current.slideOrder[0];
      deleteCanvasElement(targetSlideId, elementId);
    },
    [activeCanvasSlideId, deleteCanvasElement]
  );

  const addSlide = useCallback((): string => {
    const nextNum = contentRef.current.slideOrder.length + 1;
    const { nextSchema, createdSlideId } = addSlideItem(contentRef.current, {
      title: `Slide Eksplorasi #${nextNum}`,
      instructions: [`Slide Eksplorasi #${nextNum}`],
    });
    contentRef.current = nextSchema;
    commitContentChange(() => nextSchema);
    setActiveCanvasSlideId(createdSlideId);
    return createdSlideId;
  }, [commitContentChange]);

  const deleteSlide = useCallback(
    (index: number) => {
      const targetId = contentRef.current.slideOrder[index];
      if (!targetId) return;
      const nextSchema = deleteSlideItem(contentRef.current, targetId);
      contentRef.current = nextSchema;
      commitContentChange(() => nextSchema);
      const fallbackId =
        nextSchema.slideOrder[Math.max(0, index - 1)] ||
        nextSchema.slideOrder[0];
      if (fallbackId) {
        setActiveCanvasSlideId(fallbackId);
      }
    },
    [commitContentChange]
  );

  const saveToCloud = useCallback(async (): Promise<boolean> => {
    const res = await saveContentToCloud();
    return res.source === 'supabase';
  }, [saveContentToCloud]);

  const uploadMediaFile = useCallback(
    async (file: File | Blob): Promise<string> => {
      const fileName =
        'name' in file && typeof file.name === 'string'
          ? file.name
          : 'media-upload';
      const res = await uploadMediaToCloud(file, fileName);
      return res.url;
    },
    [uploadMediaToCloud]
  );

  // Sinkronisasi awal & pastikan setiap perubahan debounced di-flush saat tab ditutup / unmount
  useEffect(() => {
    const debouncer = saveDebouncerRef.current;
    syncContentToLiveDom(contentRef.current);
    const handleBeforeUnload = () => {
      debouncer.flush();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
      debouncer.flush();
    };
  }, []);

  const contextValue = useMemo<ContentContextValue>(
    () => ({
      content,
      isUsingFallback: storageSource !== 'supabase',
      storageSource,
      isSyncing,
      isSaving: isSyncing,
      lastSyncError,
      isCanvasEditMode,
      setIsCanvasEditMode,
      isEditMode: isCanvasEditMode,
      setIsEditMode: setIsCanvasEditMode,
      isGridSnapEnabled,
      setIsGridSnapEnabled,
      snapEnabled: isGridSnapEnabled,
      setSnapEnabled: setIsGridSnapEnabled,
      selectedCanvasItemId,
      setSelectedCanvasItemId,
      selectedElementId: selectedCanvasItemId,
      setSelectedElementId: setSelectedCanvasItemId,
      activeCanvasSlideId,
      setActiveCanvasSlideId,
      activeSlideIndex,
      setActiveSlideIndex,
      activeSlide,
      canUndo: historyState.past.length > 0,
      canRedo: historyState.future.length > 0,
      undoCount: historyState.past.length,
      redoCount: historyState.future.length,
      undoContent,
      redoContent,
      undo: undoContent,
      redo: redoContent,
      updateContent,
      updateContentTransient,
      flushPendingSave,
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
      addElement,
      updateCanvasElement,
      commitElementUpdate,
      updateElementTransient,
      commitToHistory,
      deleteCanvasElement,
      deleteElement,
      duplicateCanvasElement,
      reorderCanvasElementLayer,
      toggleCanvasElementLock,
      resetSlideContent,
      duplicateSlide,
      addSlide,
      deleteSlide,
      saveContentToCloud,
      saveToCloud,
      uploadMediaToCloud,
      uploadMediaFile,
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
      activeSlideIndex,
      setActiveSlideIndex,
      activeSlide,
      historyState.past.length,
      historyState.future.length,
      undoContent,
      redoContent,
      updateContent,
      updateContentTransient,
      flushPendingSave,
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
      addElement,
      updateCanvasElement,
      commitElementUpdate,
      updateElementTransient,
      commitToHistory,
      deleteCanvasElement,
      deleteElement,
      duplicateCanvasElement,
      reorderCanvasElementLayer,
      toggleCanvasElementLock,
      resetSlideContent,
      duplicateSlide,
      addSlide,
      deleteSlide,
      saveContentToCloud,
      saveToCloud,
      uploadMediaToCloud,
      uploadMediaFile,
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

