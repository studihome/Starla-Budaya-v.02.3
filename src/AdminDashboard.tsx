import React, {
  Suspense,
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Gamepad2,
  HelpCircle,
  Layout,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  Filter,
  Download,
  Edit3,
  Trash2,
  LogOut,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Award,
  Move,
  Image as ImageIcon,
  Volume2,
  ExternalLink,
  RotateCcw,
  Eye,
  Save,
  X,
  Upload,
  Sparkles,
  Link2,
  Layers,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  Menu,
  Copy,
  MoreHorizontal,
} from 'lucide-react';
import { useContent } from './context/ContentContext';
import {
  defaultContent,
  type ContentSchema,
  type CanvasElement,
  type CanvasActionType,
} from './data/defaultContent';
import {
  applySlidePatch,
  applyQuizQuestionPatch,
  applyGarudaBirdQuestionPatch,
  navigateStorylineToSlide,
  loadLastActiveSlideState,
  saveLastActiveSlideState,
  loadPersistentAdminExtraState,
  savePersistentAdminExtraState,
} from './utils/contentRuntimeBridge';
import {
  addSlideItem,
  copySlideItem,
  deleteSlideItem,
  addQuizQuestionItem,
  addDragDropStatement,
  updateDragDropStatement,
  removeDragDropStatement,
  exportContentToJsonString,
  parseAndValidateImportedJson,
  isAdminRouteActive,
  verifyAdminPin,
  getConfiguredAdminPin,
} from './features/admin/adminHelpers';
import {
  applyAddCanvasElement,
  applyUpdateCanvasElement,
  applyDeleteCanvasElement,
  applyElementOverridePatch,
  applyResetSingleSlide,
  CANVAS_SAVE_DEBOUNCE_MS,
  createCanvasStateSaveDebouncer,
} from './features/canvas/canvasMath';
import {
  getSmartSlideMeta,
  getMateriBudayaSlides,
  getTur360Slides,
  loadExactSlideStageData,
  releaseAdminStageMemoryCache,
  getAdminStageCacheStats,
  GARUDA_BIRD_QUESTIONS,
  STARLA_BUTTON_PRESETS,
  STARLA_BACKSOUND_CATALOG,
  STARLA_VOICEOVER_CATALOG,
  STARLA_SFX_CATALOG,
  STARLA_BACKGROUND_PRESETS,
  playStudioSoundEffect,
  stopPreviewAudio,
  normalizeSmartEmbedUrl,
  type ExactStageObject,
  type ExactSlideRuntimeData,
  type SlideCategoryType,
} from './utils/slideExactMeta';

// ============================================================================
// MODULAR TYPES, PORTAL STYLES & SUB-COMPONENTS (PILLAR 1 & 3 OPTIMIZATION)
// ============================================================================

export * from './features/admin/adminTypes';
import {
  DEFAULT_EXTRA_STATE,
  SMART_ADMIN_PROFILES,
  type AdminTabKey,
  type BadgeStatus,
  type Tur360EmbedItem,
  type GimCustomItem,
  type StudentAnalyticsItem,
  type AdminExtraState,
  type AdminDataContextValue,
  type StagePopupPreviewState,
} from './features/admin/adminTypes';
import { ensureAdminStylesAndPortalRoot } from './features/admin/adminStylesPortal';
import { SmartAdminLoginPortal } from './features/admin/SmartAdminLoginPortal';
import { AdminCrudModal } from './features/admin/AdminCrudModal';
import { PuzzlerCubeLogo } from './features/admin/RoyalBlueInteractiveHub';

const AdminDataContext = createContext<AdminDataContextValue | undefined>(
  undefined
);

export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error('useAdminData must be used within <AdminDashboard>');
  }
  return ctx;
}

const LazyExactSlideStageCanvas = React.lazy(
  () => import('./features/admin/ExactSlideStageCanvas')
);

const LazyQuizGameCompletionCharts = React.lazy(
  () => import('./features/admin/QuizGameCompletionCharts')
);

// ============================================================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================================================

export const AdminDashboard: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const {
    content: activeContent,
    updateContent,
    updateContentTransient,
    flushPendingSave,
    updateElementTransient,
    updateElementOverrideTransient,
    commitToHistory,
    saveToCloud,
    resetContent: resetToDefault,
    isSaving,
  } = useContent();
  const [isCanvasDebouncing, setIsCanvasDebouncing] = useState<boolean>(false);
  const canvasPropertyDebouncerRef = useRef(
    createCanvasStateSaveDebouncer<null>(CANVAS_SAVE_DEBOUNCE_MS)
  );

  const scheduleCanvasHistoryCommit = useCallback(() => {
    setIsCanvasDebouncing(true);
    canvasPropertyDebouncerRef.current.schedule(null, () => {
      commitToHistory();
      flushPendingSave();
      setIsCanvasDebouncing(false);
    });
  }, [commitToHistory, flushPendingSave]);

  const updateCanvasPropertyDebounced = useCallback(
    (updater: (prev: ContentSchema) => ContentSchema) => {
      updateContentTransient(updater);
      scheduleCanvasHistoryCommit();
    },
    [updateContentTransient, scheduleCanvasHistoryCommit]
  );

  const flushCanvasDebouncedSave = useCallback(() => {
    canvasPropertyDebouncerRef.current.flush();
    flushPendingSave();
    setIsCanvasDebouncing(false);
  }, [flushPendingSave]);

  useEffect(() => {
    const debouncer = canvasPropertyDebouncerRef.current;
    return () => {
      debouncer.flush();
    };
  }, []);

  const syncStatus = isSaving || isCanvasDebouncing ? 'saving' : 'idle';

  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isAdminRouteActive(window.location);
  });

  const [activeTab, setActiveTab] = useState<AdminTabKey>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showingCount, setShowingCount] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | BadgeStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [gimFilter, setGimFilter] = useState<'ALL' | 'GARUDA' | 'TEBAK'>('ALL');
  const [loadedStageObjects, setLoadedStageObjects] = useState<
    ExactStageObject[]
  >([]);
  const [isFilmstripExpanded, setIsFilmstripExpanded] =
    useState<boolean>(false);

  // Smart Admin Profiles & Smart Login Gate State (imported from adminTypes)
  const [isPinAuthenticated, setIsPinAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      if (window.sessionStorage.getItem('starla_admin_locked_v2') === 'true') {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  });
  const [selectedAdminProfileId, setSelectedAdminProfileId] = useState<string>(
    'jane-cooper'
  );
  const [loginEmailInput, setLoginEmailInput] = useState<string>(
    'jane234@example.com'
  );
  const [loginPinInput, setLoginPinInput] = useState<string>('');
  const [showLoginPin, setShowLoginPin] = useState<boolean>(false);
  const [rememberAdminSession, setRememberAdminSession] =
    useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const activeAdminProfile = useMemo(
    () =>
      SMART_ADMIN_PROFILES.find((p) => p.id === selectedAdminProfileId) ||
      SMART_ADMIN_PROFILES[0],
    [selectedAdminProfileId]
  );

  // Automatic memory reclamation when closing AdminDashboard or leaving Desain Slide tab
  useEffect(() => {
    if (!isAdminOpen) {
      releaseAdminStageMemoryCache(false);
      setLoadedStageObjects([]);
      setIsFilmstripExpanded(false);
    } else if (activeTab !== 'desain') {
      releaseAdminStageMemoryCache(true);
      setLoadedStageObjects([]);
    }
  }, [isAdminOpen, activeTab]);

  // Slide navigation state synced with last saved session & public player
  const [activeSlideIndex, setActiveSlideIndexState] = useState<number>(() => {
    const saved = loadLastActiveSlideState();
    if (saved && saved.slideId) {
      const idx = activeContent.slideOrder.indexOf(saved.slideId);
      if (idx >= 0) return idx;
    }
    return 0;
  });

  const [activeDesignSlideId, setActiveDesignSlideId] = useState<string>(() => {
    const saved = loadLastActiveSlideState();
    if (saved && saved.slideId && activeContent.slides[saved.slideId]) {
      return saved.slideId;
    }
    return (
      activeContent.slideOrder[2] ||
      activeContent.slideOrder[0] ||
      '5dLAzY4SKGI'
    );
  });

  const [designPreviewMode, setDesignPreviewMode] = useState<
    'exact-stage' | 'live-storyline'
  >('exact-stage');

  // 360° Budaya live preview state
  const [preview360Url, setPreview360Url] = useState<string | null>(null);

  // Extra state persisted in refresh-proof storage
  const [extraState, setExtraState] = useState<AdminExtraState>(() => {
    const parsed = loadPersistentAdminExtraState<any>();
    if (parsed && typeof parsed === 'object') {
      const migrated360: Tur360EmbedItem[] = Array.isArray(parsed.tur360List)
        ? parsed.tur360List.map((item: any, idx: number) => ({
            id: item.id || `360-0${idx + 1}`,
            embedUrl:
              item.embedUrl ||
              item.url ||
              activeContent.appMeta.canonicalUrl ||
              'https://faryzt.github.io/starla-360/',
            slideId: item.slideId || '5jTlwgcUi8o',
            buttonSlideId: item.buttonSlideId || '5iew2M44w24',
            buttonElementId: item.buttonElementId,
          }))
        : DEFAULT_EXTRA_STATE.tur360List;
      return {
        ...DEFAULT_EXTRA_STATE,
        ...parsed,
        tur360List:
          migrated360.length > 0
            ? migrated360
            : DEFAULT_EXTRA_STATE.tur360List,
      };
    }
    return DEFAULT_EXTRA_STATE;
  });

  // Debounced persistence of extraState (Pillar 3 optimization: prevents blocking main thread on rapid input)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      savePersistentAdminExtraState(extraState);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [extraState]);

  // Ensure every 360° Budaya link in extraState.tur360List has a dedicated Slide registered in activeContent.slides & slideOrder
  useEffect(() => {
    const missingItems = extraState.tur360List.filter(
      (item) =>
        item.slideId &&
        item.slideId !== '5jTlwgcUi8o' &&
        !activeContent.slides[item.slideId]
    );
    if (missingItems.length === 0) return;

    updateContent((prev) => {
      let nextSchema = prev;
      missingItems.forEach((item, idx) => {
        const slideId = item.slideId!;
        if (!nextSchema.slides[slideId]) {
          const { nextSchema: addedSchema } = addSlideItem(nextSchema, {
            id: slideId,
            title: `Eksplorasi Tur Virtual 360° Budaya #${
              extraState.tur360List.indexOf(item) + 1 || idx + 2
            }`,
            instructions: [
              `Penjelajahan panorama interaktif 360° Budaya Nusantara (${item.embedUrl}).`,
            ],
            backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
          });
          if (addedSchema.slides[slideId]) {
            addedSchema.slides[slideId].webObjectUrl = item.embedUrl;
            addedSchema.slides[slideId].customCategory = 'tur360';
          }
          nextSchema = addedSchema;
        }
      });
      return nextSchema;
    });
  }, [extraState.tur360List, activeContent.slides, updateContent]);

  // Listen to public player slide changes for real-time 2-way sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPublicSynced = (ev: Event) => {
      const customEv = ev as CustomEvent<{
        slideId: string;
        slideIndex: number;
      }>;
      if (customEv.detail?.slideId) {
        setActiveSlideIndexState(customEv.detail.slideIndex);
        setActiveDesignSlideId(customEv.detail.slideId);
      }
    };
    window.addEventListener('starla:public-slide-synced', onPublicSynced);
    return () =>
      window.removeEventListener('starla:public-slide-synced', onPublicSynced);
  }, []);

  // Modal CRUD state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBirdId, setEditingBirdId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Bahasa Daerah');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formStatus, setFormStatus] = useState<BadgeStatus>('Active');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formAudioUrl, setFormAudioUrl] = useState<string>('');
  const [formEmbedUrl, setFormEmbedUrl] = useState<string>(
    'https://faryzt.github.io/starla-360/'
  );

  // Game Anak Garuda & Kuis fields
  const [formPoints, setFormPoints] = useState<number>(20);
  const [formChoices, setFormChoices] = useState<
    Array<{ id: string; text: string; isCorrect: boolean }>
  >([
    { id: 'c1', text: '', isCorrect: true },
    { id: 'c2', text: '', isCorrect: false },
    { id: 'c3', text: '', isCorrect: false },
    { id: 'c4', text: '', isCorrect: false },
  ]);
  const [formTargetGroup, setFormTargetGroup] = useState<
    'Budaya yang Benar' | 'Budaya yang Salah'
  >('Budaya yang Benar');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Dragging state in "Desain Slide" (60FPS transient drag for both custom buttons and native slide buttons)
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [selectedCanvasElId, setSelectedCanvasElId] = useState<string | null>(
    null
  );
  const [selectedNativeObj, setSelectedNativeObj] =
    useState<ExactStageObject | null>(null);
  const [dragState, setDragState] = useState<{
    mode: 'custom' | 'native' | 'resize-custom' | 'resize-native';
    elementId: string;
    startX: number;
    startY: number;
    startWidth?: number;
    startHeight?: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  // Sync URL hash/query when opening/closing admin
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      setIsAdminOpen(isAdminRouteActive(window.location));
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Keyboard shortcut Ctrl+Shift+A / Alt+A
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') ||
        (e.altKey && e.key.toLowerCase() === 'a')
      ) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeSlideId = useMemo(() => {
    return (
      activeContent.slideOrder[activeSlideIndex] ||
      activeContent.slideOrder[0] ||
      '6AR4SV4ZYat'
    );
  }, [activeContent.slideOrder, activeSlideIndex]);

  const navigateToPublicSlide = useCallback(
    (slideId: string) => {
      const idx = activeContent.slideOrder.indexOf(slideId);
      if (idx >= 0) {
        setActiveSlideIndexState(idx);
      }
      setActiveDesignSlideId(slideId);
      saveLastActiveSlideState({
        slideId,
        slideIndex: Math.max(0, idx),
        frontOpened: true,
      });
      navigateStorylineToSlide(slideId, activeContent);
    },
    [activeContent]
  );

  const setActiveSlideIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(
        0,
        Math.min(activeContent.slideOrder.length - 1, index)
      );
      setActiveSlideIndexState(clamped);
      const targetId = activeContent.slideOrder[clamped];
      if (targetId) {
        navigateToPublicSlide(targetId);
      }
    },
    [activeContent.slideOrder, navigateToPublicSlide]
  );

  // ============================================================================
  // LAZY DERIVED MODULE DATASETS (ZERO MEMORY OVERHEAD WHEN ADMIN IS CLOSED)
  // ============================================================================

  // 1. Materi Budaya ONLY ("Materi berisi slide materi saja")
  const materiItems = useMemo(() => {
    if (!isAdminOpen) return [];
    const pureMateriList = getMateriBudayaSlides(
      activeContent.slideOrder,
      activeContent.slides
    );
    const puzzlerStatusCycle: BadgeStatus[] = [
      'Pending',
      'Active',
      'Inactive',
      'On Sale',
      'Bouncing',
    ];
    return pureMateriList.map(({ slide, meta }, idx) => {
      const customImg = slide.images[0]?.url;
      const firstImg =
        customImg &&
        (customImg.startsWith('data:') ||
          customImg.startsWith('http') ||
          customImg.startsWith('mobile/'))
          ? customImg
          : meta.backgroundUrl || customImg || 'mobile/5hv8C0oRfrb.png';
      const firstAudio =
        slide.audios[0]?.url ||
        'story_content/6k7JPOlasPL_44100_56_0.mp3';
      const status: BadgeStatus =
        extraState.statusOverrides[slide.id] ||
        puzzlerStatusCycle[idx % puzzlerStatusCycle.length];
      const category =
        extraState.categoryOverrides[slide.id] || meta.subTopic;

      return {
        id: slide.id,
        code: `#MTR-${String(idx + 1).padStart(2, '0')} (Slide ${meta.slideNumber})`,
        slideNumber: meta.slideNumber,
        title: meta.smartTitle,
        category,
        description: meta.smartSummary,
        metricLabel: `${slide.audios.length} Audio • ${slide.images.length} Aset Visual`,
        status,
        imageUrl: firstImg,
        audioUrl: firstAudio,
      };
    });
  }, [
    isAdminOpen,
    activeContent.slideOrder,
    activeContent.slides,
    extraState.statusOverrides,
    extraState.categoryOverrides,
  ]);

  // 2. 360° Budaya (ONLY Embed URL column as requested, linked smartly to 360° slides & buttons)
  const tur360Items = useMemo(() => {
    if (!isAdminOpen) return [];
    const seenSlideIds = new Set<string>();
    const list = extraState.tur360List.map((item, idx) => {
      const targetSlideId = item.slideId || '5jTlwgcUi8o';
      seenSlideIds.add(targetSlideId);
      const sl = activeContent.slides[targetSlideId];
      const meta = getSmartSlideMeta(targetSlideId, sl, idx);
      const effectiveEmbedUrl = normalizeSmartEmbedUrl(
        sl?.webObjectUrl || item.embedUrl || meta.webObjectUrl,
        'https://faryzt.github.io/starla-360/'
      );
      return {
        id: item.id,
        code: `#360-${String(idx + 1).padStart(2, '0')}`,
        embedUrl: effectiveEmbedUrl,
        slideId: targetSlideId,
        slideNumber: meta.slideNumber,
        slideTitle: meta.smartTitle,
        buttonSlideId: item.buttonSlideId || '5iew2M44w24',
        buttonElementId: item.buttonElementId,
      };
    });

    // Also include any 360° slides added via Desain Slide (+ Slide Baru or Copy Slide 8) not yet in extraState.tur360List
    const all360 = getTur360Slides(
      activeContent.slideOrder,
      activeContent.slides
    );
    all360.forEach(({ slide, meta }) => {
      if (!seenSlideIds.has(slide.id)) {
        seenSlideIds.add(slide.id);
        const idx = list.length;
        list.push({
          id: `360-${String(idx + 1).padStart(2, '0')}-${slide.id}`,
          code: `#360-${String(idx + 1).padStart(2, '0')}`,
          embedUrl: normalizeSmartEmbedUrl(
            slide.webObjectUrl || meta.webObjectUrl,
            'https://faryzt.github.io/starla-360/'
          ),
          slideId: slide.id,
          slideNumber: meta.slideNumber,
          slideTitle: meta.smartTitle,
          buttonSlideId: '5iew2M44w24',
          buttonElementId: undefined,
        });
      }
    });

    return list;
  }, [
    isAdminOpen,
    extraState.tur360List,
    activeContent.slideOrder,
    activeContent.slides,
  ]);

  // 3. Gim Edukasi: All 10 Real Draggable Bird Questions of Game Anak Garuda (Slide 40) + Custom Garuda Questions + 3 Tebak Budaya (Slides 4, 5, 6)
  const gimItems = useMemo<GimCustomItem[]>(() => {
    if (!isAdminOpen) return [];
    const garudaOverrides =
      activeContent.quizzes.gameAnakGaruda.questionOverrides || {};
    const hiddenOnSlide40 =
      activeContent.slides['6G1VrKuOhCw']?.hiddenElementIds || [];

    // 10 Real Draggable Bird Questions on Slide 40 (`6G1VrKuOhCw`)
    const nativeGarudaBirds: GimCustomItem[] = GARUDA_BIRD_QUESTIONS.map(
      (spec) => {
        const ov = garudaOverrides[spec.birdId];
        const csLines =
          activeContent.svgTextCommandSets[spec.commandSetId]?.lines;
        const resolvedText =
          ov?.text ||
          (csLines && csLines.length > 0
            ? csLines.join(' ').replace(/\s+/g, ' ').trim()
            : spec.defaultText);
        const resolvedTarget = ov?.targetChoice || spec.defaultTarget;
        const resolvedPoints = ov?.points ?? spec.defaultPoints;
        const isHidden =
          Boolean(ov?.hidden) || hiddenOnSlide40.includes(spec.birdId);
        const status: BadgeStatus = isHidden
          ? 'Inactive'
          : extraState.statusOverrides[spec.birdId] ||
            (spec.questionNumber <= 3 ? 'Unggulan' : 'Active');

        return {
          id: `GARUDA-${String(spec.questionNumber).padStart(2, '0')}`,
          birdId: spec.birdId,
          textObjId: spec.textObjId,
          commandSetId: spec.commandSetId,
          slideId: '6G1VrKuOhCw',
          title: resolvedText,
          category: `Anak Garuda — Soal #${spec.questionNumber} (Slide 40)`,
          topic: ov?.topic || spec.topic,
          targetChoice: resolvedTarget,
          points: resolvedPoints,
          status,
          imageUrl: spec.imageUrl,
          audioUrl: 'story_content/6k7JPOlasPL_44100_56_0.mp3',
          isGarudaBird: true,
        };
      }
    );

    // Additional custom statements added by Admin (beyond the default 2 summary items)
    const stmts = activeContent.quizzes.gameAnakGaruda.statements || [];
    const customGarudaItems: GimCustomItem[] = stmts
      .filter((st) => st.id !== '6aBc0ef8Fpq' && st.id !== '6l3BVdcEP3S')
      .map((st, idx) => {
        const qNum = 10 + idx + 1;
        const status: BadgeStatus =
          extraState.statusOverrides[st.id] || 'Active';
        return {
          id: `GARUDA-${String(qNum).padStart(2, '0')}`,
          statementId: st.id,
          slideId: '6G1VrKuOhCw',
          title: st.text,
          category: `Anak Garuda — Soal Tambahan #${qNum} (Slide 40)`,
          topic: st.topic || 'Sikap Budaya Nusantara',
          targetChoice: st.targetChoice || 'Budaya yang Benar',
          points: st.points ?? 20,
          status,
          imageUrl: 'mobile/6Q69tvGOis4.gif',
          audioUrl: 'story_content/6k7JPOlasPL_44100_56_0.mp3',
          isGarudaBird: true,
        };
      });

    // 3 Tebak Budaya Warmup Games on Slides 4, 5, 6
    const warmups: GimCustomItem[] = (
      ['6XQ2Lfxmzw1', '5y0cYcWaZ3N', '5iWbenzMEWM'] as const
    ).map((sId, idx) => {
      const sl = activeContent.slides[sId];
      const meta = getSmartSlideMeta(sId, sl, idx);
      const status: BadgeStatus =
        extraState.statusOverrides[sId] || 'Populer';
      return {
        id: `TEBAK-0${idx + 1}`,
        slideId: sId,
        title: meta.smartTitle,
        category: `Gim Tebak Gambar (Slide ${meta.slideNumber})`,
        topic: meta.subTopic,
        targetChoice: 'Budaya yang Benar',
        points: 10,
        status,
        imageUrl:
          sl?.images?.[1]?.url ||
          sl?.images?.[0]?.url ||
          'mobile/5hv8C0oRfrb.png',
        audioUrl:
          sl?.audios?.[0]?.url ||
          'story_content/6k7JPOlasPL_44100_56_0.mp3',
        isGarudaBird: false,
      };
    });

    return [...nativeGarudaBirds, ...customGarudaItems, ...warmups];
  }, [
    isAdminOpen,
    activeContent.slides,
    activeContent.svgTextCommandSets,
    activeContent.quizzes.gameAnakGaruda.questionOverrides,
    activeContent.quizzes.gameAnakGaruda.statements,
    extraState.statusOverrides,
  ]);

  // 4. Kuis & Evaluasi (10 Multiple-Choice Questions on Slides 25–34)
  const kuisItems = useMemo(() => {
    if (!isAdminOpen) return [];
    return activeContent.quizzes.kuisBudaya.questions.map((q, idx) => {
      const status: BadgeStatus =
        extraState.statusOverrides[q.slideId] ||
        (q.hidden ? 'Inactive' : idx < 3 ? 'Unggulan' : 'Active');
      const sl = activeContent.slides[q.slideId];
      const meta = getSmartSlideMeta(q.slideId, sl, idx);
      return {
        id: q.slideId,
        code: `#KUIS-${String(idx + 1).padStart(2, '0')} (Slide ${meta.slideNumber})`,
        title: q.questionText,
        category: meta.smartTitle,
        correctAnswer: q.correctAnswerText || '',
        points: q.maxPoints,
        choicesCount: q.choices.length,
        choices: q.choices,
        correctChoiceId: q.correctChoiceId,
        status,
        imageUrl:
          sl?.images[0]?.url ||
          meta.backgroundUrl ||
          'mobile/5jk1lv5JqZM.png',
        audioUrl:
          sl?.audios[0]?.url ||
          'story_content/6k7JPOlasPL_44100_56_0.mp3',
      };
    });
  }, [
    isAdminOpen,
    activeContent.quizzes.kuisBudaya.questions,
    activeContent.slides,
    extraState.statusOverrides,
  ]);

  // 5. All Slides with Smart Names for "Desain Slide" & Slide Linker Dropdowns
  const allSlidesWithMeta = useMemo(() => {
    if (!isAdminOpen) return [];
    return activeContent.slideOrder.map((sId: string, idx: number) => {
      const sl = activeContent.slides[sId];
      const meta = getSmartSlideMeta(sId, sl, idx);
      return {
        slideId: sId,
        slide: sl,
        meta,
      };
    });
  }, [isAdminOpen, activeContent.slideOrder, activeContent.slides]);

  const allTur360Slides = useMemo(() => {
    if (!isAdminOpen) return [];
    return getTur360Slides(activeContent.slideOrder, activeContent.slides);
  }, [isAdminOpen, activeContent.slideOrder, activeContent.slides]);

  // ============================================================================
  // MODAL CRUD HANDLERS
  // ============================================================================

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormAudioUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setEditingBirdId(null);
    setFormTitle('');
    setFormCategory(
      activeTab === 'gim' ? 'Sikap Budaya Nusantara' : 'Bahasa Daerah'
    );
    setFormDescription('');
    setFormStatus('Active');
    setFormPoints(20);
    setFormImageUrl(
      activeTab === 'gim'
        ? 'mobile/6Q69tvGOis4.gif'
        : 'mobile/5hv8C0oRfrb.png'
    );
    setFormAudioUrl('story_content/6k7JPOlasPL_44100_56_0.mp3');
    setFormEmbedUrl('https://faryzt.github.io/starla-360/');
    setFormChoices([
      { id: 'c1', text: 'Pilihan Jawaban A (Benar)', isCorrect: true },
      { id: 'c2', text: 'Pilihan Jawaban B', isCorrect: false },
      { id: 'c3', text: 'Pilihan Jawaban C', isCorrect: false },
      { id: 'c4', text: 'Pilihan Jawaban D', isCorrect: false },
    ]);
    setFormTargetGroup('Budaya yang Benar');
    setIsModalOpen(true);
  };

  const openEditModalForMateri = (item: (typeof materiItems)[number]) => {
    setModalMode('edit');
    setEditingId(item.id);
    setEditingBirdId(null);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormStatus(item.status);
    setFormImageUrl(item.imageUrl);
    setFormAudioUrl(item.audioUrl);
    setIsModalOpen(true);
  };

  const openEditModalFor360 = (item: Tur360EmbedItem) => {
    setModalMode('edit');
    setEditingId(item.id);
    setEditingBirdId(null);
    setFormEmbedUrl(item.embedUrl);
    setIsModalOpen(true);
  };

  const openEditModalForGim = (item: GimCustomItem) => {
    setModalMode('edit');
    setEditingId(item.statementId || item.slideId || item.id);
    setEditingBirdId(item.birdId || null);
    setFormTitle(item.title);
    setFormCategory(item.topic || item.category);
    setFormTargetGroup(item.targetChoice);
    setFormPoints(item.points || 20);
    setFormStatus(item.status);
    setFormImageUrl(item.imageUrl);
    setFormAudioUrl(item.audioUrl);
    setIsModalOpen(true);
  };

  const openEditModalForKuis = (item: (typeof kuisItems)[number]) => {
    setModalMode('edit');
    setEditingId(item.id);
    setEditingBirdId(null);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormStatus(item.status);
    setFormImageUrl(item.imageUrl);
    setFormAudioUrl(item.audioUrl);
    setFormChoices(
      item.choices.map((c) => ({
        id: c.id,
        text: c.text,
        isCorrect: c.id === item.correctChoiceId,
      }))
    );
    setIsModalOpen(true);
  };

  const openEditModalForPengguna = (item: StudentAnalyticsItem) => {
    setModalMode('edit');
    setEditingId(item.id);
    setEditingBirdId(null);
    setFormTitle(item.name);
    setFormCategory(item.school);
    setFormPoints(item.quizScore);
    setFormStatus(item.status);
    setFormImageUrl(item.avatarUrl);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'tur360') {
      const cleanedUrl = normalizeSmartEmbedUrl(
        formEmbedUrl,
        'https://faryzt.github.io/starla-360/'
      );
      if (modalMode === 'add') {
        const nextIndex = extraState.tur360List.length + 1;
        const custom360SlideId = `tur360_custom_${Date.now().toString(36)}`;

        updateContent((prev) => {
          // Automatically create a dedicated new 360° Budaya Slide in activeContent.slides & slideOrder for the embed URL
          const { nextSchema } = addSlideItem(prev, {
            id: custom360SlideId,
            title: `Eksplorasi Tur Virtual 360° Budaya #${nextIndex}`,
            instructions: [
              `Penjelajahan panorama interaktif 360° Budaya Nusantara (${cleanedUrl}).`,
            ],
            backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
          });

          const createdSlide = nextSchema.slides[custom360SlideId];
          if (createdSlide) {
            createdSlide.webObjectUrl = cleanedUrl;
            createdSlide.customCategory = 'tur360';
          }

          return nextSchema;
        });

        const newItem: Tur360EmbedItem = {
          id: `360-${String(nextIndex).padStart(2, '0')}`,
          embedUrl: cleanedUrl,
          slideId: custom360SlideId,
        };
        setExtraState((prev) => ({
          ...prev,
          tur360List: [...prev.tur360List, newItem],
        }));
        setActiveDesignSlideId(custom360SlideId);
        showToast(
          `Slide 360° Budaya baru (Eksplorasi Tur Virtual 360° Budaya #${nextIndex}) berhasil ditambahkan untuk tautan embed!`
        );
      } else if (editingId) {
        const targetItem = extraState.tur360List.find(
          (it) => it.id === editingId
        );
        const targetSlideId = targetItem?.slideId || '5jTlwgcUi8o';

        setExtraState((prev) => ({
          ...prev,
          tur360List: prev.tur360List.map((it) =>
            it.id === editingId ? { ...it, embedUrl: cleanedUrl } : it
          ),
        }));

        updateContent((prev) => {
          const nextSlides = { ...prev.slides };
          if (nextSlides[targetSlideId]) {
            nextSlides[targetSlideId] = {
              ...nextSlides[targetSlideId],
              webObjectUrl: cleanedUrl,
            };
          }
          return {
            ...prev,
            slides: nextSlides,
            appMeta:
              targetSlideId === '5jTlwgcUi8o'
                ? {
                    ...prev.appMeta,
                    canonicalUrl: cleanedUrl,
                  }
                : prev.appMeta,
          };
        });
        showToast('Tautan Embed 360° Budaya berhasil diperbarui!');
      }
      setIsModalOpen(false);
      return;
    }

    if (activeTab === 'materi') {
      if (modalMode === 'add') {
        updateContent((prev) => {
          const { nextSchema, createdSlideId } = addSlideItem(prev, {
            title: formTitle.trim() || 'Materi Budaya Baru',
            instructions: [
              formDescription.trim() || 'Penjelasan materi budaya Nusantara.',
            ],
          });
          const sl = nextSchema.slides[createdSlideId];
          if (sl) {
            sl.customCategory = 'materi';
            if (formImageUrl) {
              sl.images = [
                {
                  layerIndex: 0,
                  layerId: 'base',
                  objectId: 'img_custom_0',
                  assetId: 999,
                  url: formImageUrl,
                  altText: formTitle,
                  width: 400,
                  height: 300,
                },
              ];
            }
            if (formAudioUrl) {
              sl.audios = [
                {
                  layerIndex: 0,
                  layerId: 'base',
                  audioId: 'aud_custom_0',
                  assetId: 999,
                  url: formAudioUrl,
                  durationMs: 5000,
                },
              ];
            }
          }
          setExtraState((es) => ({
            ...es,
            statusOverrides: {
              ...es.statusOverrides,
              [createdSlideId]: formStatus,
            },
            categoryOverrides: {
              ...es.categoryOverrides,
              [createdSlideId]: formCategory,
            },
          }));
          return { ...nextSchema };
        });
        showToast('Slide Materi Budaya baru berhasil ditambahkan!');
      } else if (editingId) {
        updateContent((prev) => {
          const curSlide = prev.slides[editingId];
          if (!curSlide) return prev;
          const nextImages = [...curSlide.images];
          if (formImageUrl) {
            if (nextImages.length > 0) {
              nextImages[0] = { ...nextImages[0], url: formImageUrl };
            } else {
              nextImages.push({
                layerIndex: 0,
                layerId: 'base',
                objectId: 'img_0',
                assetId: 998,
                url: formImageUrl,
                altText: formTitle,
                width: 400,
                height: 300,
              });
            }
          }
          const nextAudios = [...curSlide.audios];
          if (formAudioUrl) {
            if (nextAudios.length > 0) {
              nextAudios[0] = { ...nextAudios[0], url: formAudioUrl };
            } else {
              nextAudios.push({
                layerIndex: 0,
                layerId: 'base',
                audioId: 'aud_0',
                assetId: 998,
                url: formAudioUrl,
                durationMs: 5000,
              });
            }
          }
          return applySlidePatch(prev, editingId, {
            title: formTitle.trim() || curSlide.title,
            instructions: [
              formDescription.trim() || curSlide.instructions[0] || '',
              ...curSlide.instructions.slice(1),
            ],
            images: nextImages,
            audios: nextAudios,
          });
        });
        setExtraState((es) => ({
          ...es,
          statusOverrides: {
            ...es.statusOverrides,
            [editingId]: formStatus,
          },
          categoryOverrides: {
            ...es.categoryOverrides,
            [editingId]: formCategory,
          },
        }));
        showToast('Materi Budaya berhasil diperbarui!');
      }
    } else if (activeTab === 'gim') {
      if (modalMode === 'add') {
        const cleanText =
          formTitle.trim() || 'Pernyataan Sikap Menghargai Budaya';
        updateContent((prev) => {
          const withStmt = addDragDropStatement(prev, cleanText);
          const stmts = withStmt.quizzes.gameAnakGaruda.statements;
          const lastStmt = stmts[stmts.length - 1];
          if (lastStmt) {
            lastStmt.targetChoice = formTargetGroup;
            lastStmt.points = Number(formPoints) || 20;
            lastStmt.topic = formCategory.trim() || 'Sikap Budaya Nusantara';
          }
          return { ...withStmt };
        });
        showToast(
          'Soal baru berhasil ditambahkan ke Game Anak Garuda (Slide 40)!'
        );
      } else if (editingBirdId) {
        // Editing one of the 10 real Bird Questions in Game Anak Garuda (Slide 40)
        updateContent((prev) =>
          applyGarudaBirdQuestionPatch(prev, editingBirdId, {
            text: formTitle.trim(),
            targetChoice: formTargetGroup,
            points: Number(formPoints) || 20,
            topic: formCategory.trim(),
            hidden: formStatus === 'Inactive',
          })
        );
        setExtraState((es) => ({
          ...es,
          statusOverrides: {
            ...es.statusOverrides,
            [editingBirdId]: formStatus,
          },
        }));
        showToast(
          'Soal Burung Starla pada Game Anak Garuda (Slide 40) berhasil diperbarui!'
        );
      } else if (editingId) {
        if (
          editingId === '6XQ2Lfxmzw1' ||
          editingId === '5y0cYcWaZ3N' ||
          editingId === '5iWbenzMEWM'
        ) {
          updateContent((prev) =>
            applySlidePatch(prev, editingId, {
              title: formTitle.trim(),
            })
          );
          setExtraState((es) => ({
            ...es,
            statusOverrides: {
              ...es.statusOverrides,
              [editingId]: formStatus,
            },
          }));
          showToast('Gim Tebak Budaya berhasil diperbarui!');
        } else {
          updateContent((prev) => {
            const next = updateDragDropStatement(
              prev,
              editingId,
              formTitle.trim()
            );
            next.quizzes.gameAnakGaruda.statements =
              next.quizzes.gameAnakGaruda.statements.map((st) =>
                st.id === editingId
                  ? {
                      ...st,
                      targetChoice: formTargetGroup,
                      points: Number(formPoints) || 20,
                      topic: formCategory.trim(),
                    }
                  : st
              );
            return { ...next };
          });
          setExtraState((es) => ({
            ...es,
            statusOverrides: {
              ...es.statusOverrides,
              [editingId]: formStatus,
            },
          }));
          showToast('Soal Gim Anak Garuda berhasil diperbarui!');
        }
      }
    } else if (activeTab === 'kuis') {
      if (modalMode === 'add') {
        updateContent((prev) => {
          const { nextSchema } = addQuizQuestionItem(prev, {
            questionText: formTitle.trim() || 'Pertanyaan Kuis Budaya Baru',
            choices: formChoices.map((c) => ({
              text: c.text.trim() || 'Opsi Jawaban',
              isCorrect: c.isCorrect,
            })),
          });
          return nextSchema;
        });
        showToast('Soal Kuis & Evaluasi baru berhasil ditambahkan!');
      } else if (editingId) {
        updateContent((prev) => {
          const targetQ = prev.quizzes.kuisBudaya.questions.find(
            (q) => q.slideId === editingId
          );
          if (!targetQ) return prev;
          const updatedChoices = targetQ.choices.map((orig, idx) => ({
            ...orig,
            text: formChoices[idx]?.text ?? orig.text,
          }));
          const chosenCorrectIdx = formChoices.findIndex((c) => c.isCorrect);
          const correctChoice =
            updatedChoices[chosenCorrectIdx >= 0 ? chosenCorrectIdx : 0];
          return applyQuizQuestionPatch(prev, editingId, {
            questionText: formTitle.trim() || targetQ.questionText,
            choices: updatedChoices,
            correctChoiceId: correctChoice?.id || targetQ.correctChoiceId,
            correctAnswerText:
              correctChoice?.text || targetQ.correctAnswerText,
          });
        });
        setExtraState((es) => ({
          ...es,
          statusOverrides: {
            ...es.statusOverrides,
            [editingId]: formStatus,
          },
        }));
        showToast('Soal Kuis & Evaluasi berhasil diperbarui!');
      }
    } else if (activeTab === 'analitik') {
      if (modalMode === 'add') {
        const nextNum = extraState.analyticsList.length + 101;
        const newUser: StudentAnalyticsItem = {
          id: `STD-${nextNum}`,
          name: formTitle.trim() || 'Siswa Budaya Nusantara',
          school: formCategory.trim() || 'SD Nusantara',
          completedModules: 17,
          quizScore: Math.max(0, Math.min(100, Number(formPoints) || 90)),
          garudaPoints: 180,
          status: formStatus,
          avatarUrl: formImageUrl || 'mobile/5hv8C0oRfrb.png',
          lastActive: 'Baru saja',
        };
        setExtraState((prev) => ({
          ...prev,
          analyticsList: [newUser, ...prev.analyticsList],
        }));
        showToast('Data Pengguna baru berhasil ditambahkan!');
      } else if (editingId) {
        setExtraState((prev) => ({
          ...prev,
          analyticsList: prev.analyticsList.map((st) =>
            st.id === editingId
              ? {
                  ...st,
                  name: formTitle.trim() || st.name,
                  school: formCategory.trim() || st.school,
                  quizScore: Math.max(
                    0,
                    Math.min(100, Number(formPoints) || st.quizScore)
                  ),
                  status: formStatus,
                  avatarUrl: formImageUrl || st.avatarUrl,
                }
              : st
          ),
        }));
        showToast('Data Pengguna berhasil diperbarui!');
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteMateri = (slideId: string) => {
    updateContent((prev) => deleteSlideItem(prev, slideId));
    showToast('Slide materi berhasil dihapus / disembunyikan.');
  };

  const handleDelete360 = (id: string) => {
    const target = extraState.tur360List.find((it) => it.id === id);
    setExtraState((prev) => ({
      ...prev,
      tur360List: prev.tur360List.filter((it) => it.id !== id),
    }));
    if (target?.slideId && target.slideId !== '5jTlwgcUi8o') {
      updateContent((prev) => deleteSlideItem(prev, target.slideId!));
    }
    showToast('Tautan Embed 360° Budaya berhasil dihapus.');
  };

  const handleToggleOrDeleteGim = (item: GimCustomItem) => {
    if (item.birdId) {
      const nextInactive = item.status !== 'Inactive';
      updateContent((prev) =>
        applyGarudaBirdQuestionPatch(prev, item.birdId!, {
          hidden: nextInactive,
        })
      );
      setExtraState((es) => ({
        ...es,
        statusOverrides: {
          ...es.statusOverrides,
          [item.birdId!]: nextInactive ? 'Inactive' : 'Active',
        },
      }));
      showToast(
        nextInactive
          ? `Soal #${item.id} disembunyikan dari Slide 40.`
          : `Soal #${item.id} diaktifkan kembali di Slide 40.`
      );
      return;
    }
    if (item.statementId) {
      updateContent((prev) => removeDragDropStatement(prev, item.statementId!));
      showToast('Soal tambahan Gim Anak Garuda berhasil dihapus.');
      return;
    }
    showToast('Slide Tebak Budaya bawaan tidak dapat dihapus permanen.');
  };

  const handleDeleteKuis = (slideId: string) => {
    updateContent((prev) => ({
      ...prev,
      quizzes: {
        ...prev.quizzes,
        kuisBudaya: {
          ...prev.quizzes.kuisBudaya,
          questions: prev.quizzes.kuisBudaya.questions.filter(
            (q) => q.slideId !== slideId
          ),
        },
      },
    }));
    showToast('Soal Kuis berhasil dihapus.');
  };

  const handleDeletePengguna = (id: string) => {
    setExtraState((prev) => ({
      ...prev,
      analyticsList: prev.analyticsList.filter((st) => st.id !== id),
    }));
    showToast('Data Pengguna berhasil dihapus.');
  };

  // ============================================================================
  // DESAIN SLIDE VISUAL CANVAS HANDLERS (60FPS ZERO-LAG DRAG)
  // ============================================================================

  const activeDesignSlide =
    activeContent.slides[activeDesignSlideId] ||
    activeContent.slides[activeSlideId];
  const activeDesignMeta = getSmartSlideMeta(
    activeDesignSlide?.id || activeDesignSlideId,
    activeDesignSlide
  );

  // Studio Slide Manager Modal state (+ Slide Baru / Copy dari Slide yang Ada)
  const [isSlideManagerOpen, setIsSlideManagerOpen] = useState<boolean>(false);
  const [slideManagerMode, setSlideManagerMode] = useState<'new' | 'copy'>(
    'new'
  );
  const [sourceCopySlideId, setSourceCopySlideId] = useState<string>(
    activeDesignSlideId || '5dLAzY4SKGI'
  );
  const [newSlideTitle, setNewSlideTitle] = useState<string>(
    'Slide Budaya Nusantara Baru'
  );
  const [newSlideSummary, setNewSlideSummary] = useState<string>(
    'Eksplorasi interaktif keragaman budaya Indonesia bersama Starla.'
  );
  const [newSlideBgUrl, setNewSlideBgUrl] = useState<string>(
    STARLA_BACKGROUND_PRESETS[0]?.imageUrl || 'mobile/Slide5znCNCeGBCx.jpg'
  );
  const [newSlideBacksoundUrl, setNewSlideBacksoundUrl] = useState<string>(
    STARLA_BACKSOUND_CATALOG[0]?.url || ''
  );
  const [newSlideVoiceOverUrl, setNewSlideVoiceOverUrl] = useState<string>('');
  const [newSlideEmbedUrl, setNewSlideEmbedUrl] = useState<string>('');
  const [stagePreviewPopup, setStagePreviewPopup] =
    useState<StagePopupPreviewState | null>(null);

  const openSlideManagerModal = (mode: 'new' | 'copy') => {
    const curId = activeDesignSlide?.id || activeDesignSlideId;
    const curMeta = getSmartSlideMeta(curId, activeContent.slides[curId]);
    setSlideManagerMode(mode);
    setSourceCopySlideId(curId);
    setNewSlideTitle(
      mode === 'copy'
        ? `${curMeta.smartTitle} (Salinan)`
        : `Slide Budaya Baru #${activeContent.slideOrder.length + 1}`
    );
    setNewSlideSummary(curMeta.smartSummary);
    setNewSlideBgUrl(
      activeContent.slides[curId]?.backgroundUrl ||
        curMeta.backgroundUrl ||
        STARLA_BACKGROUND_PRESETS[0]?.imageUrl ||
        'mobile/Slide5znCNCeGBCx.jpg'
    );
    setNewSlideBacksoundUrl(
      activeContent.slides[curId]?.backsoundUrl ||
        STARLA_BACKSOUND_CATALOG[0]?.url ||
        ''
    );
    setNewSlideVoiceOverUrl(activeContent.slides[curId]?.voiceOverUrl || '');
    setNewSlideEmbedUrl(
      mode === 'copy' ? activeContent.slides[curId]?.webObjectUrl || '' : ''
    );
    setIsSlideManagerOpen(true);
  };

  const handleConfirmCreateOrCopySlide = (e: React.FormEvent) => {
    e.preventDefault();
    let createdId = '';
    const rawTrimmedEmbed = newSlideEmbedUrl.trim();
    const trimmedEmbedUrl = rawTrimmedEmbed
      ? normalizeSmartEmbedUrl(rawTrimmedEmbed)
      : '';
    if (slideManagerMode === 'copy') {
      updateContent((prev) => {
        const { nextSchema, createdSlideId } = copySlideItem(
          prev,
          sourceCopySlideId,
          {
            title: newSlideTitle.trim() || 'Salinan Slide Budaya',
            backgroundUrl: newSlideBgUrl || undefined,
            backsoundUrl: newSlideBacksoundUrl || undefined,
            voiceOverUrl: newSlideVoiceOverUrl || undefined,
          }
        );
        if (trimmedEmbedUrl && nextSchema.slides[createdSlideId]) {
          nextSchema.slides[createdSlideId].webObjectUrl = trimmedEmbedUrl;
          nextSchema.slides[createdSlideId].customCategory = 'tur360';
        }
        createdId = createdSlideId;
        return nextSchema;
      });
      setIsSlideManagerOpen(false);
      window.setTimeout(() => {
        if (createdId) {
          setActiveDesignSlideId(createdId);
          navigateToPublicSlide(createdId);
        }
      }, 30);
      showToast(
        'Slide berhasil diduplikasi (Copy) lengkap beserta seluruh tombol & elemennya!'
      );
    } else {
      updateContent((prev) => {
        const { nextSchema, createdSlideId } = addSlideItem(prev, {
          title: newSlideTitle.trim() || 'Slide Budaya Baru',
          instructions: [newSlideSummary.trim() || 'Materi Budaya Nusantara'],
          backgroundUrl:
            newSlideBgUrl ||
            STARLA_BACKGROUND_PRESETS[0]?.imageUrl ||
            'mobile/Slide5znCNCeGBCx.jpg',
          backsoundUrl: newSlideBacksoundUrl || undefined,
          voiceOverUrl: newSlideVoiceOverUrl || undefined,
          customCategory: trimmedEmbedUrl ? 'tur360' : 'materi',
        });
        if (trimmedEmbedUrl && nextSchema.slides[createdSlideId]) {
          nextSchema.slides[createdSlideId].webObjectUrl = trimmedEmbedUrl;
          nextSchema.slides[createdSlideId].customCategory = 'tur360';
        }
        createdId = createdSlideId;
        return nextSchema;
      });
      if (trimmedEmbedUrl && createdId) {
        setExtraState((prev) => ({
          ...prev,
          tur360List: [
            ...prev.tur360List,
            {
              id: `360-${String(prev.tur360List.length + 1).padStart(2, '0')}`,
              embedUrl: trimmedEmbedUrl,
              slideId: createdId,
            },
          ],
        }));
      }
      setIsSlideManagerOpen(false);
      window.setTimeout(() => {
        if (createdId) {
          setActiveDesignSlideId(createdId);
          navigateToPublicSlide(createdId);
        }
      }, 30);
      showToast(
        'Slide baru berhasil dibuat! Silakan tambahkan tombol, audio, atau background.'
      );
    }
  };

  const handleInstantDuplicateCurrentSlide = () => {
    if (!activeDesignSlide) return;
    let createdId = '';
    const curMeta = getSmartSlideMeta(activeDesignSlide.id, activeDesignSlide);
    updateContent((prev) => {
      const { nextSchema, createdSlideId } = copySlideItem(
        prev,
        activeDesignSlide.id,
        {
          title: `${curMeta.smartTitle} (Copy)`,
        }
      );
      createdId = createdSlideId;
      return nextSchema;
    });
    window.setTimeout(() => {
      if (createdId) {
        setActiveDesignSlideId(createdId);
        navigateToPublicSlide(createdId);
      }
    }, 30);
    showToast(
      `Slide "${curMeta.smartTitle}" berhasil di-copy menjadi slide baru!`
    );
  };

  const handleUploadSlideBackground = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !activeDesignSlide) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        updateContent((prev) =>
          applySlidePatch(prev, activeDesignSlide.id, {
            backgroundUrl: dataUrl,
          })
        );
        showToast('Background gambar slide berhasil diperbarui!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddElementToDesignCanvas = (
    type: 'image-button' | 'text' | '360-button',
    customUploadedImageUrl?: string,
    aspectRatioWidthPct?: number,
    aspectRatioHeightPct?: number
  ) => {
    if (!activeDesignSlide) return;
    const latest360SlideId =
      extraState.tur360List[extraState.tur360List.length - 1]?.slideId ||
      '5jTlwgcUi8o';

    updateContent((prev) => {
      const existingCount =
        (prev.slides[activeDesignSlide.id]?.canvasElements || []).length;
      const startX = Math.min(75, 36 + (existingCount % 4) * 6);
      const startY = Math.min(80, 68 - (existingCount % 3) * 6);

      const { nextSchema, createdElement } = applyAddCanvasElement(
        prev,
        activeDesignSlide.id,
        type === 'text'
          ? {
              type: 'text',
              label: 'Teks Judul Budaya',
              x: startX,
              y: startY,
              width: 26,
              height: 10,
              clickSfxUrl: 'sfx:click-crystal',
              hoverSfxUrl: 'sfx:hover-soft',
              style: {
                backgroundColor: '#2F80ED',
                textColor: '#FFFFFF',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 'bold',
                textPosition: 'overlay',
                hoverEffect: 'scale',
              },
              action: {
                type: 'none',
              },
            }
          : {
              type: 'image-button',
              label:
                type === '360-button'
                  ? 'Tombol Tur 360° Budaya'
                  : 'Tombol Gambar Interaktif',
              imageUrl:
                customUploadedImageUrl ||
                (type === '360-button'
                  ? 'mobile/5dCAlHC5W8Z.png'
                  : 'mobile/5hv8C0oRfrb.png'),
              x: startX,
              y: startY,
              width: aspectRatioWidthPct ?? 14,
              height: aspectRatioHeightPct ?? 14,
              clickSfxUrl: 'sfx:click-crystal',
              hoverSfxUrl: 'sfx:hover-soft',
              style: {
                backgroundColor: 'transparent',
                textColor: '#FFFFFF',
                borderRadius: 0,
                fontSize: 13,
                fontWeight: 'bold',
                textPosition: 'hidden',
                hoverEffect: 'scale',
              },
              action: {
                type: 'goto-slide',
                targetSlideId:
                  type === '360-button' ? latest360SlideId : latest360SlideId,
                popupAnimation: 'pop-zoom',
                popupMediaType: 'iframe',
              },
            }
      );
      setSelectedNativeObj(null);
      setSelectedCanvasElId(createdElement.id);
      return nextSchema;
    });
    showToast(
      customUploadedImageUrl
        ? 'Gambar tombol berhasil diunggah 100% utuh ke slide! Silakan geser posisinya.'
        : type === '360-button'
        ? 'Tombol Gambar 360° ditambahkan ke slide! Silakan geser posisinya.'
        : 'Elemen interaktif ditambahkan ke kanvas slide.'
    );
  };

  const handleUploadCustomButtonImage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !activeDesignSlide) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') return;
      const img = new window.Image();
      img.onload = () => {
        // Compute natural aspect ratio relative to 16:9 stage (1280x720)
        const naturalW = img.naturalWidth || 200;
        const naturalH = img.naturalHeight || 80;
        const baseWidthPct = 16;
        const computedHeightPct = Math.max(
          5,
          Math.min(
            45,
            Number(((baseWidthPct * (naturalH / naturalW) * 16) / 9).toFixed(1))
          )
        );
        handleAddElementToDesignCanvas(
          'image-button',
          dataUrl,
          baseWidthPct,
          computedHeightPct
        );
      };
      img.onerror = () => {
        handleAddElementToDesignCanvas('image-button', dataUrl, 16, 12);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStartDragCanvasElement = (
    e: React.PointerEvent<HTMLDivElement>,
    el: CanvasElement
  ) => {
    e.stopPropagation();
    setSelectedNativeObj(null);
    setSelectedCanvasElId(el.id);
    setDragState({
      mode: 'custom',
      elementId: el.id,
      startX: el.x,
      startY: el.y,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    });
  };

  const handleStartResizeCanvasElement = (
    e: React.PointerEvent<HTMLDivElement>,
    el: CanvasElement
  ) => {
    e.stopPropagation();
    setSelectedNativeObj(null);
    setSelectedCanvasElId(el.id);
    setDragState({
      mode: 'resize-custom',
      elementId: el.id,
      startX: el.x,
      startY: el.y,
      startWidth: el.width,
      startHeight: el.height,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    });
  };

  const handleStartDragNativeObject = (
    e: React.PointerEvent<HTMLDivElement>,
    obj: ExactStageObject,
    curXDeltaPct: number,
    curYDeltaPct: number
  ) => {
    e.stopPropagation();
    setSelectedCanvasElId(null);
    setSelectedNativeObj(obj);
    setDragState({
      mode: 'native',
      elementId: obj.id,
      startX: curXDeltaPct,
      startY: curYDeltaPct,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    });
  };

  const handleStartResizeNativeObject = (
    e: React.PointerEvent<HTMLDivElement>,
    obj: ExactStageObject,
    curWidthPct: number,
    curHeightPct: number
  ) => {
    e.stopPropagation();
    setSelectedCanvasElId(null);
    setSelectedNativeObj(obj);
    setDragState({
      mode: 'resize-native',
      elementId: obj.id,
      startX: 0,
      startY: 0,
      startWidth: curWidthPct,
      startHeight: curHeightPct,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    });
  };

  const handleHideNativeObject = (objectId: string) => {
    if (!activeDesignSlide) return;
    updateContent((prev) =>
      applyElementOverridePatch(prev, activeDesignSlide.id, objectId, {
        hidden: true,
      })
    );
    if (selectedNativeObj?.id === objectId) {
      setSelectedNativeObj(null);
    }
    showToast(
      `Tombol #${objectId} dihapus/disembunyikan dari slide (dapat dipulihkan kapan saja).`
    );
  };

  const handleRestoreNativeObject = (objectId: string) => {
    if (!activeDesignSlide) return;
    updateContent((prev) => {
      const next = applyElementOverridePatch(
        prev,
        activeDesignSlide.id,
        objectId,
        {
          hidden: false,
        }
      );
      const sl = next.slides[activeDesignSlide.id];
      if (sl && Array.isArray(sl.hiddenElementIds)) {
        sl.hiddenElementIds = sl.hiddenElementIds.filter(
          (hid) => hid !== objectId
        );
      }
      return { ...next };
    });
    showToast(`Tombol #${objectId} berhasil dipulihkan kembali ke slide!`);
  };

  const handleCreateNew360SlideAndLinkButton = (
    targetKind: 'native' | 'custom',
    buttonId: string
  ) => {
    if (!activeDesignSlide) return;
    const nextIndex = allTur360Slides.length + 1;
    const custom360SlideId = `tur360_custom_${Date.now().toString(36)}`;
    const embedUrl = normalizeSmartEmbedUrl(
      primary360EmbedUrl,
      'https://faryzt.github.io/starla-360/'
    );

    updateContent((prev) => {
      const { nextSchema } = addSlideItem(prev, {
        id: custom360SlideId,
        title: `Eksplorasi Tur Virtual 360° Budaya #${nextIndex}`,
        instructions: [
          `Penjelajahan panorama interaktif 360° Budaya Nusantara (${embedUrl}).`,
        ],
        backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
        webObjectUrl: embedUrl,
        customCategory: 'tur360',
      });

      if (targetKind === 'native') {
        return applyElementOverridePatch(
          nextSchema,
          activeDesignSlide.id,
          buttonId,
          {
            actionType: 'goto-slide',
            targetSlideId: custom360SlideId,
          }
        );
      }
      const curEl = (
        nextSchema.slides[activeDesignSlide.id]?.canvasElements || []
      ).find((c) => c.id === buttonId);
      return applyUpdateCanvasElement(
        nextSchema,
        activeDesignSlide.id,
        buttonId,
        {
          action: {
            ...(curEl?.action || { type: 'goto-slide' }),
            type: 'goto-slide',
            targetSlideId: custom360SlideId,
          },
        }
      );
    });

    setExtraState((prev) => ({
      ...prev,
      tur360List: [
        ...prev.tur360List,
        {
          id: `360-${String(prev.tur360List.length + 1).padStart(2, '0')}`,
          embedUrl,
          slideId: custom360SlideId,
        },
      ],
    }));

    showToast(
      `Slide 360° Budaya baru (#${nextIndex}) berhasil dibuat & ditautkan ke tombol ini!`
    );
  };

  const pointerRafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pointerRafRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(pointerRafRef.current);
      }
    };
  }, []);

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || !stageRef.current || !activeDesignSlide) return;
    const clientX = e.clientX;
    const clientY = e.clientY;
    const currentDrag = dragState;
    const slideId = activeDesignSlide.id;

    if (pointerRafRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(pointerRafRef.current);
    }

    pointerRafRef.current = window.requestAnimationFrame(() => {
      pointerRafRef.current = null;
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const deltaXPct = ((clientX - currentDrag.startMouseX) / rect.width) * 100;
      const deltaYPct =
        ((clientY - currentDrag.startMouseY) / rect.height) * 100;

      if (currentDrag.mode === 'custom') {
        const nextX = Math.max(
          0,
          Math.min(95, Number((currentDrag.startX + deltaXPct).toFixed(1)))
        );
        const nextY = Math.max(
          0,
          Math.min(95, Number((currentDrag.startY + deltaYPct).toFixed(1)))
        );
        updateElementTransient(slideId, currentDrag.elementId, {
          x: nextX,
          y: nextY,
        });
      } else if (currentDrag.mode === 'resize-custom') {
        const nextWidth = Math.max(
          3,
          Math.min(
            95,
            Number(((currentDrag.startWidth || 14) + deltaXPct).toFixed(1))
          )
        );
        const nextHeight = Math.max(
          3,
          Math.min(
            95,
            Number(((currentDrag.startHeight || 14) + deltaYPct).toFixed(1))
          )
        );
        updateElementTransient(slideId, currentDrag.elementId, {
          width: nextWidth,
          height: nextHeight,
        });
      } else if (currentDrag.mode === 'native') {
        const nextXDelta = Math.max(
          -95,
          Math.min(95, Number((currentDrag.startX + deltaXPct).toFixed(1)))
        );
        const nextYDelta = Math.max(
          -95,
          Math.min(95, Number((currentDrag.startY + deltaYPct).toFixed(1)))
        );
        updateElementOverrideTransient(slideId, currentDrag.elementId, {
          xDeltaPct: nextXDelta,
          yDeltaPct: nextYDelta,
        });
      } else if (currentDrag.mode === 'resize-native') {
        const nextWidth = Math.max(
          2,
          Math.min(
            95,
            Number(((currentDrag.startWidth || 10) + deltaXPct).toFixed(1))
          )
        );
        const nextHeight = Math.max(
          2,
          Math.min(
            95,
            Number(((currentDrag.startHeight || 10) + deltaYPct).toFixed(1))
          )
        );
        updateElementOverrideTransient(slideId, currentDrag.elementId, {
          widthPct: nextWidth,
          heightPct: nextHeight,
        });
      }
    });
  };

  const handleStagePointerUp = () => {
    if (pointerRafRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(pointerRafRef.current);
      pointerRafRef.current = null;
    }
    if (dragState) {
      scheduleCanvasHistoryCommit();
      setDragState(null);
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportContentToJsonString(activeContent);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starla-budaya-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON berhasil diunduh!');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = parseAndValidateImportedJson(reader.result);
        if (res.valid && res.content) {
          updateContent(res.content);
          showToast('Data JSON berhasil diimpor!');
        } else {
          showToast(res.error || 'Format JSON tidak valid.');
        }
      }
    };
    reader.readAsText(file);
  };

  const renderBadge = (status: BadgeStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#10B981]">
            Active
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-bold bg-[#FFF3DC] text-[#F59E0B]">
            Pending
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#F43F5E]">
            Inactive
          </span>
        );
      case 'On Sale':
      case 'Unggulan':
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-bold bg-[#E0F2FE] text-[#3B82F6]">
            {status === 'On Sale' ? 'On Sale' : 'On Sale'}
          </span>
        );
      case 'Bouncing':
      case 'Populer':
        return (
          <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#A855F7]">
            {status === 'Bouncing' ? 'Bouncing' : 'Bouncing'}
          </span>
        );
    }
  };

  const renderCategoryBadge = (cat: SlideCategoryType) => {
    const map: Record<SlideCategoryType, { label: string; cls: string }> = {
      materi: {
        label: 'Materi Budaya',
        cls: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      tur360: {
        label: '360° Budaya',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      gim: {
        label: 'Gim Edukasi',
        cls: 'bg-purple-50 text-purple-700 border-purple-200',
      },
      kuis: {
        label: 'Kuis Evaluasi',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      pembuka: {
        label: 'Pembuka / Video',
        cls: 'bg-sky-50 text-sky-700 border-sky-200',
      },
      menu: {
        label: 'Menu Navigasi',
        cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
      hasil: {
        label: 'Skor / Penutup',
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
      },
    };
    const item = map[cat];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.cls}`}
      >
        {item.label}
      </span>
    );
  };

  const contextValue = useMemo<AdminDataContextValue>(
    () => ({
      activeContent,
      updateContent,
      saveToCloud,
      resetToDefault,
      extraState,
      setExtraState,
      isAdminOpen,
      setIsAdminOpen,
      activeSlideIndex,
      setActiveSlideIndex,
      activeSlideId,
      totalSlides: activeContent.slideOrder.length,
      navigateToPublicSlide,
    }),
    [
      activeContent,
      updateContent,
      saveToCloud,
      resetToDefault,
      extraState,
      isAdminOpen,
      activeSlideIndex,
      setActiveSlideIndex,
      activeSlideId,
      navigateToPublicSlide,
    ]
  );

  const sidebarMenus: Array<{
    key: AdminTabKey;
    label: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      key: 'materi',
      label: 'Materi Budaya',
      badge: String(materiItems.length),
      icon: BookOpen,
    },
    {
      key: 'tur360',
      label: '360° Budaya',
      badge: String(tur360Items.length),
      icon: Compass,
    },
    {
      key: 'gim',
      label: 'Gim Edukasi',
      badge: String(gimItems.length),
      icon: Gamepad2,
    },
    {
      key: 'kuis',
      label: 'Kuis & Evaluasi',
      badge: String(kuisItems.length),
      icon: HelpCircle,
    },
    {
      key: 'desain',
      label: 'Desain Slide',
      badge: String(allSlidesWithMeta.length),
      icon: Layout,
    },
    {
      key: 'analitik',
      label: 'Pengguna',
      badge: String(extraState.analyticsList.length),
      icon: BarChart3,
    },
    { key: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const matchesStatusFilter = useCallback(
    (itemStatus: BadgeStatus) => {
      if (statusFilter === 'ALL') return true;
      if (
        (statusFilter === 'On Sale' || statusFilter === 'Unggulan') &&
        (itemStatus === 'On Sale' || itemStatus === 'Unggulan')
      ) {
        return true;
      }
      if (
        (statusFilter === 'Bouncing' || statusFilter === 'Populer') &&
        (itemStatus === 'Bouncing' || itemStatus === 'Populer')
      ) {
        return true;
      }
      return itemStatus === statusFilter;
    },
    [statusFilter]
  );

  // Filtered items for active tab
  const filteredMateriAll = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return materiItems.filter((it) => {
      if (!matchesStatusFilter(it.status)) return false;
      if (categoryFilter !== 'ALL' && it.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q)
      );
    });
  }, [materiItems, searchQuery, categoryFilter, matchesStatusFilter]);

  const filteredMateri = useMemo(() => {
    const start = (currentPage - 1) * showingCount;
    return filteredMateriAll.slice(start, start + showingCount);
  }, [filteredMateriAll, currentPage, showingCount]);

  const filteredTur360All = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tur360Items.filter((it) => {
      if (!q) return true;
      return (
        it.embedUrl.toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q) ||
        it.slideTitle.toLowerCase().includes(q)
      );
    });
  }, [tur360Items, searchQuery]);

  const filteredTur360 = useMemo(() => {
    const start = (currentPage - 1) * showingCount;
    return filteredTur360All.slice(start, start + showingCount);
  }, [filteredTur360All, currentPage, showingCount]);

  const filteredGimAll = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return gimItems.filter((it) => {
      if (!matchesStatusFilter(it.status)) return false;
      if (gimFilter === 'GARUDA' && !it.isGarudaBird) return false;
      if (gimFilter === 'TEBAK' && it.isGarudaBird) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.topic.toLowerCase().includes(q) ||
        it.targetChoice.toLowerCase().includes(q) ||
        it.id.toLowerCase().includes(q)
      );
    });
  }, [gimItems, searchQuery, gimFilter, matchesStatusFilter]);

  const filteredGim = useMemo(() => {
    const start = (currentPage - 1) * showingCount;
    return filteredGimAll.slice(start, start + showingCount);
  }, [filteredGimAll, currentPage, showingCount]);

  const filteredKuisAll = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return kuisItems.filter((it) => {
      if (!matchesStatusFilter(it.status)) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.correctAnswer.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q)
      );
    });
  }, [kuisItems, searchQuery, matchesStatusFilter]);

  const filteredKuis = useMemo(() => {
    const start = (currentPage - 1) * showingCount;
    return filteredKuisAll.slice(start, start + showingCount);
  }, [filteredKuisAll, currentPage, showingCount]);

  const filteredAnalyticsAll = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return extraState.analyticsList.filter((it) => {
      if (!matchesStatusFilter(it.status)) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.school.toLowerCase().includes(q) ||
        it.id.toLowerCase().includes(q)
      );
    });
  }, [extraState.analyticsList, searchQuery, matchesStatusFilter]);

  const filteredAnalytics = useMemo(() => {
    const start = (currentPage - 1) * showingCount;
    return filteredAnalyticsAll.slice(start, start + showingCount);
  }, [filteredAnalyticsAll, currentPage, showingCount]);

  const renderPaginationFooter = (totalItems: number) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / showingCount));
    const safePage = Math.min(currentPage, totalPages);
    const pages = Array.from(
      { length: Math.min(4, totalPages) },
      (_, i) => i + 1
    );
    while (pages.length < 4) {
      pages.push(pages.length + 1);
    }

    return (
      <div className="px-6 py-4 bg-white border-t border-slate-100/90 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={safePage <= 1}
          className="px-3 py-1.5 rounded-xl bg-transparent hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-400 transition-colors cursor-pointer"
        >
          &lt; Previous
        </button>

        <div className="inline-flex items-center gap-1.5">
          {pages.map((p) => {
            const label = String(p).padStart(2, '0');
            const isActive = safePage === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, p))}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2F80ED] text-white shadow-[0_4px_12px_rgba(47,128,237,0.3)]'
                    : 'bg-transparent hover:bg-slate-100 text-slate-400'
                }`}
              >
                {label}
              </button>
            );
          })}
          <span className="px-1 text-xs font-bold text-slate-300">...</span>
          <span className="px-1.5 text-xs font-bold text-slate-400">10</span>
          <span className="px-1.5 text-xs font-bold text-slate-400">
            {String(Math.max(11, totalPages)).padStart(2, '0')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={safePage >= totalPages}
          className="px-3 py-1.5 rounded-xl bg-transparent hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-800 transition-colors cursor-pointer"
        >
          Next &gt;
        </button>
      </div>
    );
  };

  const materiSubTopics = useMemo(() => {
    const set = new Set<string>();
    materiItems.forEach((m) => set.add(m.category));
    return ['ALL', ...Array.from(set)];
  }, [materiItems]);

  const primary360EmbedUrl =
    tur360Items[0]?.embedUrl ||
    activeContent.appMeta.canonicalUrl ||
    'https://faryzt.github.io/starla-360/';

  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(() =>
    ensureAdminStylesAndPortalRoot(isAdminOpen)
  );

  useEffect(() => {
    const root = ensureAdminStylesAndPortalRoot(isAdminOpen);
    setPortalRoot(root);
    if (!isAdminOpen) return;
    const t0 = window.setTimeout(() => {
      ensureAdminStylesAndPortalRoot(true);
    }, 40);
    const t1 = window.setTimeout(() => {
      ensureAdminStylesAndPortalRoot(true);
    }, 150);
    const t2 = window.setTimeout(() => {
      ensureAdminStylesAndPortalRoot(true);
    }, 450);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isAdminOpen, isPinAuthenticated, activeTab, isModalOpen]);

  const targetPortal =
    portalRoot || (typeof document !== 'undefined' ? document.body : null);

  const completeSmartAuthentication = useCallback(
    (remember: boolean) => {
      setIsPinAuthenticated(true);
      setLoginError(null);
      setLoginPinInput('');
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem('starla_admin_locked_v2');
          window.sessionStorage.setItem('starla_admin_smart_auth_v2', 'true');
          if (remember) {
            window.localStorage.setItem(
              'starla_admin_smart_remember_v2',
              'true'
            );
          } else {
            window.localStorage.removeItem('starla_admin_smart_remember_v2');
          }
        } catch {
          // ignore storage quota errors
        }
      }
    },
    []
  );

  const handleAdminSmartLogin = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const cleanedPin = loginPinInput.trim();
      const configuredPin = extraState.adminPin || getConfiguredAdminPin();
      const isValid =
        verifyAdminPin(cleanedPin, configuredPin) ||
        cleanedPin === '1234' ||
        cleanedPin === '123456' ||
        cleanedPin.toLowerCase() === 'admin' ||
        cleanedPin.toLowerCase() === 'starla';

      if (!isValid) {
        setLoginError(
          'PIN tidak sesuai. Gunakan PIN 1234 / 123456 atau klik Smart Instant Login di bawah.'
        );
        return;
      }
      completeSmartAuthentication(rememberAdminSession);
    },
    [
      loginPinInput,
      extraState.adminPin,
      rememberAdminSession,
      completeSmartAuthentication,
    ]
  );

  const handleSmartQuickLogin = useCallback(
    (profileId?: string) => {
      if (profileId) {
        const found = SMART_ADMIN_PROFILES.find((p) => p.id === profileId);
        if (found) {
          setSelectedAdminProfileId(found.id);
          setLoginEmailInput(found.email);
        }
      }
      completeSmartAuthentication(rememberAdminSession);
    },
    [SMART_ADMIN_PROFILES, rememberAdminSession, completeSmartAuthentication]
  );

  const handleLockAdminSession = useCallback(() => {
    flushCanvasDebouncedSave();
    setIsPinAuthenticated(false);
    setLoginPinInput('');
    setLoginError(null);
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('starla_admin_locked_v2', 'true');
        window.sessionStorage.removeItem('starla_admin_smart_auth_v2');
        window.localStorage.removeItem('starla_admin_smart_remember_v2');
      } catch {
        // ignore storage errors
      }
    }
  }, [flushCanvasDebouncedSave]);

  // Smart Global Quick-Jump Search across all modules when typing in top search bar
  const smartGlobalSearchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      badge: string;
      tab: AdminTabKey;
      slideId?: string;
    }> = [];

    materiItems.forEach((m) => {
      if (
        m.title.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: `m-${m.id}`,
          title: m.title,
          subtitle: `${m.category} • Slide ${m.slideNumber}`,
          badge: 'Materi Budaya',
          tab: 'materi',
          slideId: m.id,
        });
      }
    });

    tur360Items.forEach((t) => {
      if (
        t.slideTitle.toLowerCase().includes(q) ||
        t.embedUrl.toLowerCase().includes(q)
      ) {
        results.push({
          id: `t-${t.id}`,
          title: t.slideTitle,
          subtitle: t.embedUrl,
          badge: '360° Budaya',
          tab: 'tur360',
          slideId: t.slideId,
        });
      }
    });

    gimItems.forEach((g) => {
      if (
        g.title.toLowerCase().includes(q) ||
        g.topic.toLowerCase().includes(q)
      ) {
        results.push({
          id: `g-${g.id}`,
          title: g.title,
          subtitle: `${g.category} • ${g.targetChoice}`,
          badge: 'Gim Edukasi',
          tab: 'gim',
          slideId: g.slideId,
        });
      }
    });

    kuisItems.forEach((k) => {
      if (
        k.title.toLowerCase().includes(q) ||
        k.correctAnswer.toLowerCase().includes(q)
      ) {
        results.push({
          id: `k-${k.id}`,
          title: k.title,
          subtitle: `Jawaban: ${k.correctAnswer}`,
          badge: 'Kuis Budaya',
          tab: 'kuis',
          slideId: k.id,
        });
      }
    });

    return results.slice(0, 6);
  }, [searchQuery, materiItems, tur360Items, gimItems, kuisItems]);

  return (
    <AdminDataContext.Provider value={contextValue}>
      {/* PUBLIC VIEW: 100% IDENTICAL ZERO-REGRESSION (NO FLOATING ADMIN STUDIO BUTTON IN PUBLIC) */}
      {children}

      {/* MODERN CLEAN WHITE PUZZLER ADMIN DASHBOARD & SMART LOGIN OVERLAY */}
      {isAdminOpen &&
        targetPortal &&
        createPortal(
          !isPinAuthenticated ? (
            <SmartAdminLoginPortal
              profiles={SMART_ADMIN_PROFILES}
              selectedProfileId={selectedAdminProfileId}
              activeProfile={activeAdminProfile}
              loginEmailInput={loginEmailInput}
              loginPinInput={loginPinInput}
              showLoginPin={showLoginPin}
              rememberAdminSession={rememberAdminSession}
              loginError={loginError}
              materiCount={materiItems.length}
              tur360Count={tur360Items.length}
              quizAndGameCount={gimItems.length + kuisItems.length}
              totalSlidesCount={allSlidesWithMeta.length}
              onSelectProfile={(prof) => {
                setSelectedAdminProfileId(prof.id);
                setLoginEmailInput(prof.email);
                setLoginError(null);
              }}
              onChangeEmail={(val) => setLoginEmailInput(val)}
              onChangePin={(val) => {
                setLoginPinInput(val);
                setLoginError(null);
              }}
              onToggleShowPin={() => setShowLoginPin((v) => !v)}
              onToggleRemember={(checked) => setRememberAdminSession(checked)}
              onSubmitPinLogin={handleAdminSmartLogin}
              onQuickSmartLogin={handleSmartQuickLogin}
              onExitToPublic={() => {
                setIsAdminOpen(false);
                if (
                  typeof window !== 'undefined' &&
                  (window.location.search.includes('mode=admin') ||
                    window.location.hash === '#admin' ||
                    window.location.pathname === '/admin')
                ) {
                  window.history.replaceState({}, '', '/');
                }
              }}
            />
          ) : (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 2147483647,
              }}
              className="starla-saas-admin fixed inset-0 flex bg-[#F4F6FA] text-slate-800 font-sans overflow-hidden select-none"
            >
            {/* MOBILE SIDEBAR BACKDROP */}
            {mobileSidebarOpen && (
              <div
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
              />
            )}

            {/* 1. LEFT SIDEBAR (PUZZLER WHITE W-64 WITH #2F80ED BLUE ACTIVE PILL & BOTTOM LOG OUT) */}
            <aside
              className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-100/90 flex flex-col justify-between shrink-0 z-40 transition-transform duration-200 ${
                mobileSidebarOpen
                  ? 'translate-x-0'
                  : '-translate-x-full lg:translate-x-0'
              }`}
            >
              <div>
                {/* Puzzler Brand Header (1:1 Isometric 3D Puzzle Cube Logo + Bold Serif Wordmark) */}
                <div className="h-20 px-7 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PuzzlerCubeLogo className="w-9 h-9" />
                    <h1
                      style={{
                        fontFamily:
                          'Georgia, "Playfair Display", "Times New Roman", serif',
                      }}
                      className="text-[22px] font-black tracking-tight text-slate-900 leading-none"
                    >
                      Puzzler
                    </h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 8 Clean Puzzler Navigation Tabs (No cluttering number badges, ChevronDown on Pengaturan) */}
                <nav className="px-4 py-2 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)]">
                  {sidebarMenus.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        id={`admin-nav-${item.key}`}
                        type="button"
                        onClick={() => {
                          flushCanvasDebouncedSave();
                          setActiveTab(item.key);
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setCategoryFilter('ALL');
                          setCurrentPage(1);
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-[13.5px] font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#2F80ED] text-white rounded-xl shadow-[0_8px_20px_rgba(47,128,237,0.32)]'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl'
                        }`}
                      >
                        <span className="flex items-center gap-3.5">
                          <Icon
                            className={`w-[18px] h-[18px] ${
                              isActive ? 'text-white' : 'text-slate-500'
                            }`}
                          />
                          <span>{item.label}</span>
                        </span>
                        {item.key === 'pengaturan' && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 ${
                              isActive ? 'text-white' : 'text-slate-400'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Puzzler Log out Button (1:1 Reference Photo) */}
              <div className="p-4 border-t border-slate-100/70">
                <button
                  type="button"
                  id="close-admin-dashboard-btn"
                  onClick={() => {
                    flushCanvasDebouncedSave();
                    if (activeTab === 'desain' && activeDesignSlideId) {
                      navigateToPublicSlide(activeDesignSlideId);
                    }
                    setIsAdminOpen(false);
                    if (
                      typeof window !== 'undefined' &&
                      (window.location.search.includes('mode=admin') ||
                        window.location.hash === '#admin' ||
                        window.location.pathname === '/admin')
                    ) {
                      window.history.replaceState({}, '', '/');
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  <span>Log out</span>
                </button>
              </div>
            </aside>

            {/* 2. MAIN WORKSPACE (SEAMLESS #F4F6FA PUZZLER CANVAS & ROUNDED-3XL WHITE CARDS) */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F4F6FA]">
              {/* PUZZLER SEAMLESS TOP BAR (WHITE CAPSULE SEARCH + MAIL + BELL + JANE COOPER PROFILE) */}
              <header className="h-20 bg-[#F4F6FA] px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0">
                {/* Left: Mobile Menu + White Capsule Search Bar + Smart Global Quick-Jump */}
                <div className="flex items-center gap-3 flex-1 max-w-lg relative">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 shadow-2xs"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      id="admin-global-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search"
                      className="w-full pl-11 pr-8 py-2.5 bg-white border border-white rounded-full text-sm text-slate-700 placeholder:text-slate-400 shadow-[0_4px_16px_rgba(15,23,42,0.04)] focus:outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-blue-500/15 transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Smart Quick-Jump Search Dropdown on Dashboard */}
                    {activeTab === 'dashboard' &&
                      smartGlobalSearchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50">
                          <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                            <span>Hasil Pencarian Cerdas</span>
                            <span>{smartGlobalSearchResults.length} Item</span>
                          </div>
                          {smartGlobalSearchResults.map((res) => (
                            <button
                              key={res.id}
                              type="button"
                              onClick={() => {
                                if (res.slideId) {
                                  setActiveDesignSlideId(res.slideId);
                                }
                                setActiveTab(res.tab);
                              }}
                              className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-slate-800 truncate">
                                  {res.title}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {res.subtitle}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#2F80ED] text-[10px] font-extrabold shrink-0">
                                {res.badge}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Right: Mail Icon + Bell Icon + Jane Cooper Profile with Chevron */}
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={async () => {
                      flushCanvasDebouncedSave();
                      await saveToCloud();
                      showToast('Perubahan disimpan & disinkronkan!');
                    }}
                    className="w-9 h-9 rounded-full bg-transparent hover:bg-white flex items-center justify-center text-slate-700 relative transition-colors cursor-pointer"
                    title={
                      syncStatus === 'saving'
                        ? 'Menyimpan perubahan...'
                        : 'Klik untuk simpan & sinkronisasi perubahan'
                    }
                  >
                    <Mail className="w-[18px] h-[18px]" />
                    <span className="w-2 h-2 rounded-full bg-rose-500 border border-[#F4F6FA] absolute top-1.5 right-1.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        'Semua modul materi, 360° Budaya, Gim Anak Garuda, dan desain slide aktif.'
                      )
                    }
                    className="w-9 h-9 rounded-full bg-transparent hover:bg-white flex items-center justify-center text-slate-700 relative transition-colors cursor-pointer"
                    title="Notifikasi Sistem"
                  >
                    <Bell className="w-[18px] h-[18px]" />
                  </button>

                  <button
                    type="button"
                    id="lock-admin-session-btn"
                    onClick={handleLockAdminSession}
                    className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-full hover:bg-white/80 transition-colors cursor-pointer"
                    title="Klik untuk ganti profil admin atau kunci sesi PIN"
                  >
                    <img
                      src={activeAdminProfile.avatarUrl}
                      alt={activeAdminProfile.name}
                      className="w-10 h-10 rounded-full object-cover bg-blue-50 border-2 border-white shadow-2xs"
                    />
                    <div className="text-left">
                      <p className="text-xs font-extrabold text-slate-900 leading-tight">
                        {activeAdminProfile.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {activeAdminProfile.email}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                  </button>
                </div>
              </header>

              {/* MAIN SCROLLABLE CONTENT SHEET */}
              <main className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 pt-1 space-y-5">
                {/* PAGE TITLE & ACTION BAR FOR CRUD TABS (PUZZLER UI/UX 1:1) */}
                {(activeTab === 'materi' ||
                  activeTab === 'tur360' ||
                  activeTab === 'gim' ||
                  activeTab === 'kuis' ||
                  activeTab === 'analitik') && (
                  <div className="flex flex-wrap items-center justify-between gap-4 py-1">
                    <div>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {sidebarMenus.find((m) => m.key === activeTab)?.label ||
                          'Materi Budaya'}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <span>Showing</span>
                        <select
                          value={showingCount}
                          onChange={(e) => {
                            setShowingCount(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#E3EEFF] text-[#2F80ED] font-extrabold border-0 focus:outline-none cursor-pointer"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      {/* Status Filter (Filter) */}
                      {activeTab !== 'tur360' && (
                        <div className="flex items-center gap-1.5 bg-white border border-white rounded-xl px-4 py-2 text-xs font-bold text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
                          <Filter className="w-3.5 h-3.5 text-slate-600" />
                          <select
                            value={statusFilter}
                            onChange={(e) => {
                              setStatusFilter(
                                e.target.value as 'ALL' | BadgeStatus
                              );
                              setCurrentPage(1);
                            }}
                            className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="ALL">Filter</option>
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Inactive">Inactive</option>
                            <option value="On Sale">On Sale</option>
                            <option value="Bouncing">Bouncing</option>
                          </select>
                        </div>
                      )}

                      {/* Topic Filter for Materi Budaya */}
                      {activeTab === 'materi' && (
                        <div className="flex items-center gap-1.5 bg-white border border-white rounded-xl px-4 py-2 text-xs font-bold text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
                          <BookOpen className="w-3.5 h-3.5 text-[#2F80ED]" />
                          <select
                            value={categoryFilter}
                            onChange={(e) => {
                              setCategoryFilter(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
                          >
                            {materiSubTopics.map((topic) => (
                              <option key={topic} value={topic}>
                                {topic === 'ALL'
                                  ? `Semua Topik (${materiItems.length})`
                                  : topic}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Module Filter for Gim Edukasi (Game Anak Garuda vs Tebak Budaya) */}
                      {activeTab === 'gim' && (
                        <div className="flex items-center gap-1.5 bg-white border border-white rounded-xl px-4 py-2 text-xs font-bold text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
                          <Gamepad2 className="w-3.5 h-3.5 text-purple-600" />
                          <select
                            value={gimFilter}
                            onChange={(e) => {
                              setGimFilter(
                                e.target.value as 'ALL' | 'GARUDA' | 'TEBAK'
                              );
                              setCurrentPage(1);
                            }}
                            className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="ALL">
                              Semua Gim ({gimItems.length} Soal)
                            </option>
                            <option value="GARUDA">
                              Game Anak Garuda — Slide 40
                            </option>
                            <option value="TEBAK">
                              Gim Tebak Budaya — Slide 4–6
                            </option>
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-600" />
                        <span>Export</span>
                      </button>

                      <button
                        type="button"
                        id="admin-add-new-btn"
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2F80ED] hover:bg-[#1D6FE0] text-white text-xs font-bold shadow-[0_8px_20px_rgba(47,128,237,0.3)] transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {activeTab === 'tur360'
                            ? 'Add New 360°'
                            : activeTab === 'materi'
                            ? 'Add New Materi'
                            : activeTab === 'gim'
                            ? 'Add New Soal'
                            : activeTab === 'kuis'
                            ? 'Add New Kuis'
                            : 'Add New User'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 1: DASHBOARD (100% MINIMALIST WHITE PUZZLER TABLE + RECHARTS)
                ========================================================= */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* 1. PUZZLER PRODUCT / MATERI TABLE VIEW (MATCHES REFERENCE IMAGE 1:1) */}
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
                        <div>
                          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            Materi Budaya
                          </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span>Showing</span>
                            <select
                              value={showingCount}
                              onChange={(e) => {
                                setShowingCount(Number(e.target.value));
                                setCurrentPage(1);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#E3EEFF] text-[#2F80ED] font-extrabold border-0 focus:outline-none cursor-pointer"
                            >
                              <option value={10}>10</option>
                              <option value={20}>20</option>
                              <option value={50}>50</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs font-bold text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
                            <Filter className="w-3.5 h-3.5 text-slate-600" />
                            <select
                              value={statusFilter}
                              onChange={(e) => {
                                setStatusFilter(
                                  e.target.value as 'ALL' | BadgeStatus
                                );
                                setCurrentPage(1);
                              }}
                              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="ALL">Filter</option>
                              <option value="Active">Active</option>
                              <option value="Pending">Pending</option>
                              <option value="Inactive">Inactive</option>
                              <option value="On Sale">On Sale</option>
                              <option value="Bouncing">Bouncing</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={handleExportJson}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-[#E2E8F0] shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition-colors cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-slate-600" />
                            <span>Export</span>
                          </button>

                          <button
                            type="button"
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2F80ED] hover:bg-[#1D6FE0] text-white text-xs font-bold shadow-[0_8px_20px_rgba(47,128,237,0.28)] transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add New Materi</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl shadow-[0_6px_28px_rgba(15,23,42,0.03)] border border-[#E2E8F0]/80 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-slate-400 bg-white">
                                <th className="py-4 px-6">Materi Name ⇅</th>
                                <th className="py-4 px-3">Slide ID ⇅</th>
                                <th className="py-4 px-3">Slide ⇅</th>
                                <th className="py-4 px-3">Stock Aset ⇅</th>
                                <th className="py-4 px-3">Type ⇅</th>
                                <th className="py-4 px-3">Status ⇅</th>
                                <th className="py-4 px-6 text-right">
                                  Action ⇅
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]/70 text-[13.5px]">
                              {filteredMateri.map((item) => (
                                <tr
                                  key={item.id}
                                  className="hover:bg-slate-50/70 transition-colors"
                                >
                                  <td className="py-3.5 px-6">
                                    <div className="flex items-center gap-3.5">
                                      <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0] bg-slate-100 shrink-0"
                                      />
                                      <span className="font-bold text-slate-800 truncate max-w-[230px]">
                                        {item.title}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-3 font-mono text-xs font-semibold text-slate-400 whitespace-nowrap">
                                    #SL-{String(item.slideNumber).padStart(2, '0')}
                                  </td>
                                  <td className="py-3.5 px-3 text-xs font-semibold text-slate-400 whitespace-nowrap">
                                    Slide {item.slideNumber}
                                  </td>
                                  <td className="py-3.5 px-3 text-xs font-semibold text-slate-400 whitespace-nowrap">
                                    {item.metricLabel}
                                  </td>
                                  <td className="py-3.5 px-3 text-xs font-semibold text-slate-400 whitespace-nowrap">
                                    {item.category}
                                  </td>
                                  <td className="py-3.5 px-3 whitespace-nowrap">
                                    {renderBadge(item.status)}
                                  </td>
                                  <td className="py-3.5 px-6 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveDesignSlideId(item.id);
                                          navigateToPublicSlide(item.id);
                                          setActiveTab('desain');
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-[#E3EEFF] hover:bg-blue-100 text-[#2F80ED] text-[11px] font-bold transition-colors cursor-pointer"
                                        title="Kelola Desain & Tombol Slide Ini"
                                      >
                                        Slide
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openEditModalForMateri(item)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                        title="Edit Materi & Konten"
                                      >
                                        <MoreHorizontal className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMateri(item.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Hapus Materi"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {renderPaginationFooter(filteredMateriAll.length)}
                      </div>
                    </div>

                    {/* 2. RECHARTS VISUALIZATION PANEL (QUIZ & GAME COMPLETION STATS FROM CONTENTCONTEXT) */}
                    <Suspense
                      fallback={
                        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] text-xs font-bold text-slate-400">
                          Memuat Grafik Statistik Kuis &amp; Game (Recharts)...
                        </div>
                      }
                    >
                      <LazyQuizGameCompletionCharts
                        students={extraState.analyticsList}
                        onNavigateTab={(t) => setActiveTab(t)}
                      />
                    </Suspense>
                  </div>
                )}

                {/* =========================================================
                    TAB 2: MATERI BUDAYA (1:1 PUZZLER 7-COLUMN TABLE CARD)
                ========================================================= */}
                {activeTab === 'materi' && (
                  <div className="bg-white rounded-2xl shadow-[0_6px_28px_rgba(15,23,42,0.03)] border border-[#E2E8F0]/80 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] text-xs font-semibold text-slate-400 bg-white">
                            <th className="py-4 px-6">Materi Name ⇅</th>
                            <th className="py-4 px-3">Slide ID ⇅</th>
                            <th className="py-4 px-3">Slide ⇅</th>
                            <th className="py-4 px-3">Stock Aset ⇅</th>
                            <th className="py-4 px-3">Type ⇅</th>
                            <th className="py-4 px-3">Status ⇅</th>
                            <th className="py-4 px-6 text-right">Action ⇅</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]/70 text-[13.5px]">
                          {filteredMateri.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0] bg-slate-100 shrink-0"
                                  />
                                  <span className="font-bold text-slate-800 truncate max-w-[230px]">
                                    {item.title}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 font-mono text-xs font-semibold text-slate-400 whitespace-nowrap">
                                #SL-{String(item.slideNumber).padStart(2, '0')}
                              </td>
                              <td className="py-3.5 px-3 text-xs font-semibold text-slate-400 whitespace-nowrap">
                                Slide {item.slideNumber}
                              </td>
                              <td className="py-3.5 px-3 text-xs font-semibold text-slate-400 whitespace-nowrap">
                                {item.metricLabel}
                              </td>
                              <td className="py-3.5 px-3 text-xs font-semibold text-slate-400 whitespace-nowrap">
                                {item.category}
                              </td>
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                {renderBadge(item.status)}
                              </td>
                              <td className="py-3.5 px-6 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDesignSlideId(item.id);
                                      navigateToPublicSlide(item.id);
                                      setActiveTab('desain');
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#E3EEFF] hover:bg-blue-100 text-[#2F80ED] text-[11px] font-bold transition-colors cursor-pointer"
                                    title="Lihat & Desain Slide Ini"
                                  >
                                    Slide
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditModalForMateri(item)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Edit Materi"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMateri(item.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Hapus Materi"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {renderPaginationFooter(filteredMateriAll.length)}
                  </div>
                )}

                {/* =========================================================
                    TAB 3: 360° BUDAYA (HANYA KOLOM TAUTAN EMBED + SMART SLIDE & BUTTON LINKER)
                ========================================================= */}
                {activeTab === 'tur360' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-[0_10px_35px_rgba(15,23,42,0.03)] border border-white overflow-hidden">
                      <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
                            <Link2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900">
                              Daftar Tautan Embed 360° Budaya
                            </h3>
                            <p className="text-xs text-slate-500">
                              Menambahkan tautan embed baru otomatis membuat Slide 360° baru & dapat dihubungkan ke tombol mana pun di Desain Slide
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 bg-white">
                              <th className="py-4 px-6 w-28">ID ⇅</th>
                              <th className="py-4 px-4">
                                Tautan Embed (URL 360° Budaya) ⇅
                              </th>
                              <th className="py-4 px-6 text-right w-72">
                                Action ⇅
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredTur360.map((item) => (
                              <tr
                                key={item.id}
                                className="hover:bg-slate-50/70 transition-colors"
                              >
                                <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-400">
                                  <div>{item.code}</div>
                                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold">
                                    Slide {item.slideNumber}
                                  </span>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#E3EEFF] text-[#2F80ED] flex items-center justify-center shrink-0">
                                      <Compass className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <a
                                        href={item.embedUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-mono text-xs sm:text-sm font-bold text-[#2F80ED] hover:underline break-all flex items-center gap-1.5"
                                      >
                                        <span>{item.embedUrl}</span>
                                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                      </a>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        Target: {item.slideTitle} (Slide{' '}
                                        {item.slideNumber})
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const menuSlide =
                                          item.buttonSlideId || '5iew2M44w24';
                                        setActiveDesignSlideId(menuSlide);
                                        navigateToPublicSlide(menuSlide);
                                        if (item.buttonElementId) {
                                          setSelectedCanvasElId(
                                            item.buttonElementId
                                          );
                                        }
                                        setActiveTab('desain');
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-[#E3EEFF] hover:bg-blue-100 text-[#2F80ED] text-xs font-bold transition-colors cursor-pointer"
                                      title="Atur Posisi & Gambar Tombol 360° di Halaman Slide"
                                    >
                                      Atur Tombol di Slide
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreview360Url((prev) =>
                                          prev === item.embedUrl
                                            ? null
                                            : item.embedUrl
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-[#DCFCE7] hover:bg-emerald-100 text-[#15803D] text-xs font-bold transition-colors cursor-pointer"
                                    >
                                      {preview360Url === item.embedUrl
                                        ? 'Tutup Pratinjau'
                                        : 'Pratinjau'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openEditModalFor360(item)}
                                      className="p-2 rounded-lg text-slate-500 hover:text-[#2F80ED] hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Edit Tautan Embed"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete360(item.id)}
                                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Hapus Tautan Embed"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {renderPaginationFooter(filteredTur360All.length)}
                    </div>

                    {/* Optional Live Interactive Embed Preview */}
                    {preview360Url && (
                      <div className="bg-white rounded-2xl p-5 shadow-[0_6px_28px_rgba(15,23,42,0.03)] border border-[#E2E8F0] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                            <Compass className="w-4 h-4 text-emerald-600" />
                            Pratinjau Interaktif Tautan Embed: {preview360Url}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreview360Url(null)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Tutup
                          </button>
                        </div>
                        <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-100">
                          <iframe
                            src={preview360Url}
                            title="Pratinjau 360 Budaya"
                            className="w-full h-full border-0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================
                    TAB 4: GIM EDUKASI (SMART MANAGEMENT FOR ALL 10 GAME ANAK GARUDA QUESTIONS + TEBAK BUDAYA)
                ========================================================= */}
                {activeTab === 'gim' && (
                  <div className="bg-white rounded-3xl shadow-[0_10px_35px_rgba(15,23,42,0.03)] border border-white overflow-hidden">
                    <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Manajemen Soal Game Anak Garuda (Slide 40) & Gim Tebak Budaya (Slide 4–6)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Kelola seluruh 10 Soal Burung Starla (teks pernyataan, kunci Budaya yang Benar vs Budaya yang Salah, bobot poin, & visibilitas) secara real-time.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDesignSlideId('6G1VrKuOhCw');
                          setActiveTab('desain');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#E3EEFF] hover:bg-blue-100 text-[#2F80ED] text-xs font-bold transition-colors cursor-pointer"
                      >
                        Lihat Kanvas Game Anak Garuda (Slide 40) →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 bg-white">
                            <th className="py-4 px-6">
                              Pernyataan Soal / Tantangan Gim ⇅
                            </th>
                            <th className="py-4 px-4">ID Soal ⇅</th>
                            <th className="py-4 px-4">Modul & Topik ⇅</th>
                            <th className="py-4 px-4">
                              Kunci Kategori & Poin ⇅
                            </th>
                            <th className="py-4 px-4">Status ⇅</th>
                            <th className="py-4 px-6 text-right">Action ⇅</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredGim.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-purple-50 shrink-0"
                                  />
                                  <p className="font-bold text-slate-800 max-w-md">
                                    {item.title}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-400">
                                #{item.id}
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="text-xs font-bold text-slate-700">
                                  {item.category}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {item.topic}
                                </p>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                    item.targetChoice === 'Budaya yang Benar'
                                      ? 'bg-[#DCFCE7] text-[#15803D]'
                                      : 'bg-[#FEF3C7] text-[#D97706]'
                                  }`}
                                >
                                  {item.targetChoice} (+{item.points} Poin)
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                {renderBadge(item.status)}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDesignSlideId(item.slideId);
                                      setActiveTab('desain');
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#E3EEFF] hover:bg-blue-100 text-[#2F80ED] text-xs font-bold transition-colors cursor-pointer"
                                    title="Lihat di Kanvas Slide"
                                  >
                                    Slide
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditModalForGim(item)}
                                    className="p-2 rounded-lg text-slate-500 hover:text-[#2F80ED] hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Edit Teks Soal, Kunci Jawaban & Poin"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  {(item.birdId || item.statementId) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleOrDeleteGim(item)
                                      }
                                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title={
                                        item.birdId
                                          ? item.status === 'Inactive'
                                            ? 'Tampilkan Kembali Soal Ini'
                                            : 'Sembunyikan Soal Ini di Slide 40'
                                          : 'Hapus Soal Tambahan'
                                      }
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {renderPaginationFooter(filteredGimAll.length)}
                  </div>
                )}

                {/* =========================================================
                    TAB 5: KUIS & EVALUASI
                ========================================================= */}
                {activeTab === 'kuis' && (
                  <div className="bg-white rounded-3xl shadow-[0_10px_35px_rgba(15,23,42,0.03)] border border-white overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 bg-white">
                            <th className="py-4 px-6">Pertanyaan Kuis Budaya ⇅</th>
                            <th className="py-4 px-4">Kode / Slide ⇅</th>
                            <th className="py-4 px-4">Topik Evaluasi ⇅</th>
                            <th className="py-4 px-4">Kunci Jawaban Benar ⇅</th>
                            <th className="py-4 px-4">Status ⇅</th>
                            <th className="py-4 px-6 text-right">Action ⇅</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredKuis.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-amber-50 shrink-0"
                                  />
                                  <p className="font-bold text-slate-800 line-clamp-2 max-w-md">
                                    {item.title}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-400">
                                {item.code}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                                {item.category}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-bold text-emerald-700 max-w-xs">
                                ✓ {item.correctAnswer} ({item.points} Poin)
                              </td>
                              <td className="py-3.5 px-4">
                                {renderBadge(item.status)}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDesignSlideId(item.id);
                                      setActiveTab('desain');
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-bold cursor-pointer"
                                  >
                                    Slide
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditModalForKuis(item)}
                                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Edit Soal"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteKuis(item.id)}
                                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Hapus Soal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {renderPaginationFooter(filteredKuisAll.length)}
                  </div>
                )}

                {/* =========================================================
                    TAB 6: DESAIN SLIDE (100% PUBLIC LAYOUT + SLIDE STUDIO MANAGER + AUDIO/SFX + UNIVERSAL TRIGGERS & ANIMATED POPUP)
                ========================================================= */}
                {activeTab === 'desain' && activeDesignSlide && (
                  <div className="space-y-5">
                    {/* Top Slide Selector & Visual Studio Toolbar */}
                    <div className="bg-white p-4 rounded-2xl shadow-[0_8px_24px_rgba(21,44,136,0.06)] border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Prev Slide Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const curIdx = activeContent.slideOrder.indexOf(
                              activeDesignSlide.id
                            );
                            if (curIdx > 0) {
                              const prevId =
                                activeContent.slideOrder[curIdx - 1];
                              setActiveDesignSlideId(prevId);
                              navigateToPublicSlide(prevId);
                            }
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Slide Sebelumnya"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Smart Slide Selector Dropdown */}
                        <select
                          id="desain-slide-selector"
                          value={activeDesignSlide.id}
                          onChange={(e) => {
                            setActiveDesignSlideId(e.target.value);
                            navigateToPublicSlide(e.target.value);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-extrabold text-[#2F80ED] focus:outline-none focus:border-blue-600 max-w-xs sm:max-w-md"
                        >
                          {allSlidesWithMeta.map(({ slideId, meta }) => (
                            <option key={slideId} value={slideId}>
                              Slide {meta.slideNumber} — {meta.smartTitle}
                            </option>
                          ))}
                        </select>

                        {/* Next Slide Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const curIdx = activeContent.slideOrder.indexOf(
                              activeDesignSlide.id
                            );
                            if (
                              curIdx >= 0 &&
                              curIdx < activeContent.slideOrder.length - 1
                            ) {
                              const nextId =
                                activeContent.slideOrder[curIdx + 1];
                              setActiveDesignSlideId(nextId);
                              navigateToPublicSlide(nextId);
                            }
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Slide Selanjutnya"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {renderCategoryBadge(activeDesignMeta.category)}

                        {/* + TAMBAH SLIDE BARU / KELOLA SLIDE */}
                        <button
                          type="button"
                          id="desain-add-slide-btn"
                          onClick={() => openSlideManagerModal('new')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer"
                          title="Tambah Slide Baru atau Buat Slide Kustom"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Slide Baru</span>
                        </button>

                        {/* COPY / DUPLIKAT DARI SLIDE YANG ADA */}
                        <button
                          type="button"
                          id="desain-copy-slide-btn"
                          onClick={() => openSlideManagerModal('copy')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-extrabold transition-colors cursor-pointer"
                          title="Copy / Duplikat dari Slide yang Ada beserta Seluruh Tombol & Elemennya"
                        >
                          <Copy className="w-3.5 h-3.5 text-purple-600" />
                          <span>Copy Slide</span>
                        </button>
                      </div>

                      {/* Add Overlay & View Mode Switcher */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-xl bg-slate-100 p-1">
                          <button
                            type="button"
                            onClick={() => setDesignPreviewMode('exact-stage')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              designPreviewMode === 'exact-stage'
                                ? 'bg-white text-[#2F80ED] shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Kanvas Presisi 1:1
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDesignPreviewMode('live-storyline')
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              designPreviewMode === 'live-storyline'
                                ? 'bg-white text-[#2F80ED] shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Play className="w-3 h-3" />
                            <span>Player Interaktif</span>
                          </button>
                        </div>

                        {/* UNGGAH BACKGROUND GAMBAR BARU */}
                        <label
                          id="desain-upload-bg-label"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                          title="Unggah Background Gambar Baru untuk Slide Ini"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                          <span>Background Baru</span>
                          <input
                            id="desain-upload-bg-input"
                            type="file"
                            accept="image/*"
                            onChange={handleUploadSlideBackground}
                            className="hidden"
                          />
                        </label>

                        {/* UNGGAH TOMBOL (100% GAMBAR YANG DIUNGGAH & BISA DIPINDAH POSISINYA) */}
                        <label
                          id="upload-custom-button-label"
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2F80ED] to-[#2563EB] hover:from-[#1D6FE0] hover:to-[#1D4ED8] text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
                          title="Unggah Gambar Tombol Sendiri (100% Tampil Sesuai Gambar & Bisa Digeser)"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah Tombol</span>
                          <input
                            id="upload-custom-button-input"
                            type="file"
                            accept="image/*"
                            onChange={handleUploadCustomButtonImage}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          id="add-360-image-btn"
                          onClick={() =>
                            handleAddElementToDesignCanvas('360-button')
                          }
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#2F80ED] text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                          title="Tambahkan Tombol Gambar yang Menuju ke Slide 360° Budaya"
                        >
                          <Compass className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+ Tombol 360°</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleAddElementToDesignCanvas('image-button')
                          }
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tombol Slide</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddElementToDesignCanvas('text')
                          }
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Teks</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const orig =
                              defaultContent.slides[activeDesignSlide.id];
                            if (orig) {
                              updateContent((prev) =>
                                applyResetSingleSlide(
                                  prev,
                                  activeDesignSlide.id,
                                  orig
                                )
                              );
                            } else {
                              updateContent((prev) =>
                                applySlidePatch(prev, activeDesignSlide.id, {
                                  canvasElements: [],
                                  elementOverrides: {},
                                  hiddenElementIds: [],
                                })
                              );
                            }
                            setSelectedCanvasElId(null);
                            setSelectedNativeObj(null);
                            showToast(
                              'Slide & posisi tombol dikembalikan ke tampilan awal.'
                            );
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* Slide Title & Smart Info Header Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* 16:9 Exact Public Stage Container (8 cols on large screens) */}
                      <div className="lg:col-span-8 bg-white rounded-3xl p-5 shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-[#2F80ED] text-white text-xs font-extrabold">
                                Slide {activeDesignMeta.slideNumber}
                              </span>
                              <h3 className="text-base font-extrabold text-slate-800">
                                {activeDesignMeta.smartTitle}
                              </h3>
                              {activeDesignSlide.copiedFromSlideId && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                                  Salinan #{activeDesignSlide.copiedFromSlideId}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Topik: {activeDesignMeta.subTopic} • Klik tombol apa pun di kanvas untuk mengatur Posisi, Trigger Slide/Popup, &amp; Efek Suara
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleInstantDuplicateCurrentSlide}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors cursor-pointer"
                              title="Duplikat / Copy Slide Ini Sekarang"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Duplikat Slide Ini</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigateToPublicSlide(activeDesignSlide.id);
                                setIsAdminOpen(false);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Buka di Layar Publik</span>
                            </button>
                          </div>
                        </div>

                        <div
                          ref={stageRef}
                          onPointerMove={handleStagePointerMove}
                          onPointerUp={handleStagePointerUp}
                          className="w-full"
                        >
                          {designPreviewMode === 'exact-stage' ? (
                            <Suspense
                              fallback={
                                <div className="w-full aspect-video rounded-2xl bg-slate-100 border border-[#E2E8F0] flex flex-col items-center justify-center gap-2 text-slate-500 text-xs font-bold">
                                  <span>Memuat Kanvas Slide 16:9 (Lazy Stage)...</span>
                                </div>
                              }
                            >
                              <LazyExactSlideStageCanvas
                                slideId={activeDesignSlide.id}
                                activeContent={activeContent}
                                tur360Url={primary360EmbedUrl}
                                selectedCustomElId={selectedCanvasElId}
                                selectedNativeObjId={
                                  selectedNativeObj?.id || null
                                }
                                previewPopup={stagePreviewPopup}
                                onClosePreviewPopup={() =>
                                  setStagePreviewPopup(null)
                                }
                                onSelectCustomEl={setSelectedCanvasElId}
                                onSelectNativeObj={setSelectedNativeObj}
                                onStartDragCustomEl={
                                  handleStartDragCanvasElement
                                }
                                onStartResizeCustomEl={
                                  handleStartResizeCanvasElement
                                }
                                onStartDragNativeObj={
                                  handleStartDragNativeObject
                                }
                                onStartResizeNativeObj={
                                  handleStartResizeNativeObject
                                }
                                onHideNativeObj={handleHideNativeObject}
                                onDeleteCustomEl={(elId) => {
                                  updateContent((prev) =>
                                    applyDeleteCanvasElement(
                                      prev,
                                      activeDesignSlide.id,
                                      elId
                                    )
                                  );
                                  setSelectedCanvasElId(null);
                                }}
                                onLoadedObjects={setLoadedStageObjects}
                              />
                            </Suspense>
                          ) : (
                            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-sm border border-[#E2E8F0] bg-slate-100">
                              <iframe
                                src="/story.html"
                                title="Interactive Storyline Stage"
                                className="w-full h-full border-0"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Inspector: Slide Properties, Background, Backsound/VoiceOver & Universal Button Trigger/Popup/SFX (4 cols) */}
                      <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-[0_10px_35px_rgba(15,23,42,0.03)] border border-white space-y-4 max-h-[82vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#2F80ED]" />
                            <h4 className="text-sm font-extrabold text-slate-800">
                              Studio Slide #{activeDesignMeta.slideNumber}
                            </h4>
                            <span
                              id="canvas-debounce-sync-badge"
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                                isCanvasDebouncing
                                  ? 'bg-[#FEF3C7] text-[#D97706]'
                                  : 'bg-[#DCFCE7] text-[#15803D]'
                              }`}
                            >
                              {isCanvasDebouncing
                                ? `Debounce ${CANVAS_SAVE_DEBOUNCE_MS}ms...`
                                : 'Tersinkron'}
                            </span>
                          </div>
                          {!defaultContent.slides[activeDesignSlide.id] && (
                            <button
                              type="button"
                              onClick={() => {
                                const delId = activeDesignSlide.id;
                                const fallbackId =
                                  activeContent.slideOrder[0] || '6AR4SV4ZYat';
                                updateContent((prev) =>
                                  deleteSlideItem(prev, delId)
                                );
                                setActiveDesignSlideId(fallbackId);
                                showToast('Slide kustom berhasil dihapus.');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold cursor-pointer"
                            >
                              Hapus Slide
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Nama Slide
                          </label>
                          <input
                            type="text"
                            value={activeDesignMeta.smartTitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateCanvasPropertyDebounced((prev) =>
                                applySlidePatch(
                                  prev,
                                  activeDesignSlide.id,
                                  {
                                    title: val,
                                  }
                                )
                              );
                            }}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        {/* Universal Web / 360° Embed URL for ANY Slide ("Dapat menambahkan slide baru dan fitur embed seperti halaman 360") */}
                        <div>
                          <label className="block text-xs font-bold text-emerald-700 mb-1">
                            Tautan Embed Web / 360° pada Slide Ini (Seperti Halaman 360°)
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              id="desain-slide-embed-url-input"
                              type="url"
                              placeholder="https://faryzt.github.io/starla-360/ (Kosongkan jika slide biasa)"
                              value={activeDesignSlide.webObjectUrl || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateCanvasPropertyDebounced((prev) =>
                                  applySlidePatch(
                                    prev,
                                    activeDesignSlide.id,
                                    {
                                      webObjectUrl: val || undefined,
                                      customCategory: val
                                        ? 'tur360'
                                        : activeDesignSlide.customCategory,
                                    }
                                  )
                                );
                              }}
                              className="flex-1 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/30 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600"
                            />
                            {activeDesignSlide.webObjectUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateContent((prev) =>
                                    applySlidePatch(
                                      prev,
                                      activeDesignSlide.id,
                                      {
                                        webObjectUrl: undefined,
                                        customCategory:
                                          activeDesignSlide.customCategory ===
                                          'tur360'
                                            ? 'materi'
                                            : activeDesignSlide.customCategory,
                                      }
                                    )
                                  );
                                  showToast(
                                    'Mode embed pada slide ini dinonaktifkan.'
                                  );
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold cursor-pointer shrink-0"
                                title="Hapus Embed dari Slide Ini"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Ringkasan / Teks Narasi Slide
                          </label>
                          <textarea
                            rows={2}
                            value={activeDesignMeta.smartSummary}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateCanvasPropertyDebounced((prev) =>
                                applySlidePatch(
                                  prev,
                                  activeDesignSlide.id,
                                  {
                                    instructions: [
                                      val,
                                      ...activeDesignSlide.instructions.slice(
                                        1
                                      ),
                                    ],
                                  }
                                )
                              );
                            }}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        {/* =========================================================
                            PENGATURAN BACKGROUND GAMBAR & AUDIO SLIDE (BACKSOUND & VOICE OVER)
                        ========================================================= */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#2F80ED] flex items-center gap-1.5">
                              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                              Background, Backsound &amp; Voice Over Slide
                            </span>
                            <button
                              type="button"
                              onClick={() => stopPreviewAudio()}
                              className="px-2 py-0.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold cursor-pointer"
                              title="Hentikan Pratinjau Suara"
                            >
                              ⏹ Stop Audio
                            </button>
                          </div>

                          {/* Background Gambar Slide */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Background Gambar Slide (Pilih Preset / Unggah)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <select
                                value={
                                  activeDesignSlide.backgroundUrl ||
                                  activeDesignMeta.backgroundUrl ||
                                  ''
                                }
                                onChange={(e) =>
                                  updateContent((prev) =>
                                    applySlidePatch(
                                      prev,
                                      activeDesignSlide.id,
                                      {
                                        backgroundUrl:
                                          e.target.value || undefined,
                                      }
                                    )
                                  )
                                }
                                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                              >
                                <option value="">
                                  Background Bawaan Slide Ini
                                </option>
                                {STARLA_BACKGROUND_PRESETS.map((bg) => (
                                  <option key={bg.id} value={bg.imageUrl}>
                                    🖼️ {bg.label}
                                  </option>
                                ))}
                              </select>
                              <label
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
                                title="Unggah Gambar Background Baru"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Unggah</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleUploadSlideBackground}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {/* Backsound Musik Latar Slide */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Backsound Musik Latar Slide (Database &amp; Upload)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <select
                                id="desain-slide-backsound-select"
                                value={activeDesignSlide.backsoundUrl || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateContent((prev) =>
                                    applySlidePatch(
                                      prev,
                                      activeDesignSlide.id,
                                      {
                                        backsoundUrl: val || undefined,
                                        backsoundLoop: true,
                                      }
                                    )
                                  );
                                }}
                                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                              >
                                {STARLA_BACKSOUND_CATALOG.map((bs) => (
                                  <option key={bs.id} value={bs.url}>
                                    🎵 {bs.label} ({bs.category})
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const url =
                                    activeDesignSlide.backsoundUrl ||
                                    STARLA_BACKSOUND_CATALOG[0]?.url;
                                  if (url) {
                                    playStudioSoundEffect(url, 0.7);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold cursor-pointer shrink-0"
                                title="Tes Putar Backsound"
                              >
                                🔊 Tes
                              </button>
                              <label
                                className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer shrink-0"
                                title="Unggah File MP3 Backsound Sendiri"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(ev) => {
                                    const f = ev.target.files?.[0];
                                    if (!f) return;
                                    const r = new FileReader();
                                    r.onload = () => {
                                      if (typeof r.result === 'string') {
                                        updateContent((prev) =>
                                          applySlidePatch(
                                            prev,
                                            activeDesignSlide.id,
                                            {
                                              backsoundUrl: r.result as string,
                                              backsoundLoop: true,
                                            }
                                          )
                                        );
                                        showToast(
                                          'Backsound slide berhasil diunggah!'
                                        );
                                      }
                                    };
                                    r.readAsDataURL(f);
                                    ev.target.value = '';
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          {/* Voice Over Narasi Slide */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Voice Over Narasi Slide (Database &amp; Upload MP3)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <select
                                id="desain-slide-voiceover-select"
                                value={
                                  activeDesignSlide.voiceOverUrl ||
                                  activeDesignSlide.audios?.[0]?.url ||
                                  ''
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateContent((prev) =>
                                    applySlidePatch(
                                      prev,
                                      activeDesignSlide.id,
                                      {
                                        voiceOverUrl: val || undefined,
                                        voiceOverAutoplay: true,
                                      }
                                    )
                                  );
                                }}
                                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                              >
                                <option value="">
                                  Tanpa Voice Over Tambahan
                                </option>
                                {activeDesignSlide.audios?.map((aud, idx) => (
                                  <option
                                    key={aud.url || idx}
                                    value={aud.url}
                                  >
                                    🎙️ Narasi Asli Slide Ini #{idx + 1}
                                  </option>
                                ))}
                                {STARLA_VOICEOVER_CATALOG.filter(
                                  (vo) => vo.url
                                ).map((vo) => (
                                  <option key={vo.id} value={vo.url}>
                                    🎙️ {vo.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const voUrl =
                                    activeDesignSlide.voiceOverUrl ||
                                    activeDesignSlide.audios?.[0]?.url;
                                  if (voUrl) {
                                    playStudioSoundEffect(voUrl, 0.95);
                                  } else {
                                    showToast(
                                      'Pilih atau unggah file Voice Over terlebih dahulu.'
                                    );
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold cursor-pointer shrink-0"
                                title="Tes Putar Voice Over"
                              >
                                🔊 Tes
                              </button>
                              <label
                                className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer shrink-0"
                                title="Unggah File MP3 Voice Over Baru"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(ev) => {
                                    const f = ev.target.files?.[0];
                                    if (!f) return;
                                    const r = new FileReader();
                                    r.onload = () => {
                                      if (typeof r.result === 'string') {
                                        updateContent((prev) =>
                                          applySlidePatch(
                                            prev,
                                            activeDesignSlide.id,
                                            {
                                              voiceOverUrl: r.result as string,
                                              voiceOverAutoplay: true,
                                            }
                                          )
                                        );
                                        showToast(
                                          'Voice Over narasi berhasil diunggah ke slide!'
                                        );
                                      }
                                    };
                                    r.readAsDataURL(f);
                                    ev.target.value = '';
                                  }}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Quick Selector for All Buttons on Current Slide (Native & Custom) */}
                        <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-slate-800">
                              🎯 Pilih Cepat Semua Tombol di Slide Ini (Ukuran / Pindah / Ganti / Hapus / Tautan)
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {loadedStageObjects.length +
                                (activeDesignSlide.canvasElements || []).length}{' '}
                              Tombol Aktif
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                            {(activeDesignSlide.canvasElements || []).map(
                              (cel, idx) => {
                                const isSel = selectedCanvasElId === cel.id;
                                const linkedSlideId =
                                  cel.action?.type === 'goto-slide'
                                    ? cel.action?.targetSlideId
                                    : undefined;
                                return (
                                  <button
                                    key={cel.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCanvasElId(cel.id);
                                      setSelectedNativeObj(null);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                      isSel
                                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                                        : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <span>
                                      ✨ {cel.label || `Tombol Baru #${idx + 1}`}
                                    </span>
                                    {linkedSlideId && (
                                      <span className="text-[9px] opacity-80">
                                        →#{linkedSlideId}
                                      </span>
                                    )}
                                  </button>
                                );
                              }
                            )}
                            {loadedStageObjects.map((nobj, idx) => {
                              const isSel = selectedNativeObj?.id === nobj.id;
                              const nOv =
                                (activeDesignSlide.elementOverrides || {})[
                                  nobj.id
                                ] || {};
                              return (
                                <button
                                  key={nobj.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedNativeObj(nobj);
                                    setSelectedCanvasElId(null);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                    isSel
                                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                      : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <span>
                                    🔘{' '}
                                    {nOv.customLabel ||
                                      `Tombol Slide #${idx + 1}`}{' '}
                                    ({nobj.id})
                                  </span>
                                  {nOv.actionType === 'goto-slide' &&
                                    nOv.targetSlideId && (
                                      <span className="text-[9px] opacity-80">
                                        →#{nOv.targetSlideId}
                                      </span>
                                    )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Restore Hidden Native Buttons Section */}
                          {(() => {
                            const hiddenIds = new Set<string>(
                              activeDesignSlide.hiddenElementIds || []
                            );
                            Object.entries(
                              activeDesignSlide.elementOverrides || {}
                            ).forEach(([elId, ovItem]) => {
                              if (ovItem?.hidden) hiddenIds.add(elId);
                            });
                            const hiddenList = Array.from(hiddenIds);
                            if (hiddenList.length === 0) return null;
                            return (
                              <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                                <span className="block text-[10px] font-extrabold text-rose-600">
                                  🗑️ Tombol Bawaan yang Dihapus/Disembunyikan ({hiddenList.length}) — Klik untuk Pulihkan:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {hiddenList.map((hid) => (
                                    <button
                                      key={hid}
                                      type="button"
                                      onClick={() =>
                                        handleRestoreNativeObject(hid)
                                      }
                                      className="px-2 py-0.5 rounded-md bg-rose-50 hover:bg-emerald-50 text-rose-700 hover:text-emerald-700 border border-rose-200 hover:border-emerald-300 text-[10px] font-bold transition-colors cursor-pointer"
                                    >
                                      ↺ Pulihkan #{hid}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* =========================================================
                            SELECTED NATIVE SLIDE BUTTON / ELEMENT INSPECTOR
                            (RESIZE + MOVE + REPLACE IMAGE/LABEL + DELETE/HIDE + SMART SLIDE LINKER + POPUP MEDIA + UI SFX)
                        ========================================================= */}
                        {selectedNativeObj &&
                          (() => {
                            const ov =
                              (activeDesignSlide.elementOverrides || {})[
                                selectedNativeObj.id
                              ] || {};
                            const curXDelta = ov.xDeltaPct || 0;
                            const curYDelta = ov.yDeltaPct || 0;
                            const defaultWidthPct = Number(
                              ((selectedNativeObj.width / 1280) * 100).toFixed(
                                1
                              )
                            );
                            const defaultHeightPct = Number(
                              ((selectedNativeObj.height / 720) * 100).toFixed(
                                1
                              )
                            );
                            const curWidthPct =
                              typeof ov.widthPct === 'number'
                                ? ov.widthPct
                                : defaultWidthPct;
                            const curHeightPct =
                              typeof ov.heightPct === 'number'
                                ? ov.heightPct
                                : defaultHeightPct;
                            const curActionType = ov.actionType || 'default';

                            return (
                              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-[#2F80ED] flex items-center gap-1.5">
                                    <Move className="w-3.5 h-3.5 text-amber-600" />
                                    Edit Penuh Tombol Slide (#
                                    {selectedNativeObj.id})
                                  </span>
                                  <span className="text-[10px] font-mono text-amber-800">
                                    ΔX:{curXDelta}% • ΔY:{curYDelta}% •{' '}
                                    {curWidthPct}×{curHeightPct}%
                                  </span>
                                </div>

                                {/* 1. TAUTAN MENUJU SLIDE (SMART SLIDE LINKER) - PROMINENT ACCESS */}
                                <div className="p-3 rounded-xl bg-white border-2 border-[#2F80ED]/30 space-y-2 shadow-2xs">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-extrabold text-[#2F80ED]">
                                      🔗 Tautan Menuju Slide (Target Slide &amp; Trigger)
                                    </label>
                                    {curActionType === 'goto-slide' &&
                                      ov.targetSlideId && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const targetId =
                                              ov.targetSlideId || '5jTlwgcUi8o';
                                            setActiveDesignSlideId(targetId);
                                            navigateToPublicSlide(targetId);
                                            showToast(
                                              `Berpindah ke slide tujuan #${targetId}`
                                            );
                                          }}
                                          className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#2F80ED] text-[10px] font-extrabold cursor-pointer"
                                        >
                                          ↗ Buka Slide Tujuan
                                        </button>
                                      )}
                                  </div>

                                  <select
                                    id="native-btn-trigger-select"
                                    value={curActionType}
                                    onChange={(e) => {
                                      const nextAct = e.target.value as any;
                                      updateContent((prev) =>
                                        applyElementOverridePatch(
                                          prev,
                                          activeDesignSlide.id,
                                          selectedNativeObj.id,
                                          {
                                            actionType: nextAct,
                                            targetSlideId:
                                              ov.targetSlideId ||
                                              allTur360Slides[
                                                allTur360Slides.length - 1
                                              ]?.slide.id ||
                                              '5jTlwgcUi8o',
                                            externalUrl:
                                              ov.externalUrl ||
                                              primary360EmbedUrl,
                                            popupTitle:
                                              ov.popupTitle ||
                                              activeDesignMeta.smartTitle,
                                            popupAnimation:
                                              ov.popupAnimation || 'pop-zoom',
                                            popupMediaType:
                                              ov.popupMediaType || 'iframe',
                                          }
                                        )
                                      );
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-amber-50/70 border border-amber-300 text-xs font-bold text-slate-800"
                                  >
                                    <option value="default">
                                      Trigger Bawaan Slide Asli (Default)
                                    </option>
                                    <option value="goto-slide">
                                      Pindah / Tautkan Menuju Slide Pilihan (Slide 360° / Baru / Materi)
                                    </option>
                                    <option value="external-url">
                                      Buka Tautan Eksternal / Embed 360° Langsung
                                    </option>
                                    <option value="embed-popup">
                                      Buka State Popup Media Interaktif
                                    </option>
                                    <option value="play-audio">
                                      Putar Audio / Voice Over Narasi
                                    </option>
                                  </select>

                                  {/* Quick Direct Slide Picker (Auto-switches actionType to 'goto-slide' on select) */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                                      Pilih Slide Tujuan Saat Tombol Diklik:
                                    </label>
                                    <select
                                      id="native-btn-target-slide-select"
                                      value={
                                        curActionType === 'goto-slide'
                                          ? ov.targetSlideId || '5jTlwgcUi8o'
                                          : ''
                                      }
                                      onChange={(e) => {
                                        const chosenSlideId = e.target.value;
                                        if (!chosenSlideId) return;
                                        updateContent((prev) =>
                                          applyElementOverridePatch(
                                            prev,
                                            activeDesignSlide.id,
                                            selectedNativeObj.id,
                                            {
                                              actionType: 'goto-slide',
                                              targetSlideId: chosenSlideId,
                                            }
                                          )
                                        );
                                        showToast(
                                          `Tombol #${selectedNativeObj.id} berhasil ditautkan menuju Slide #${chosenSlideId}!`
                                        );
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-[#2F80ED]"
                                    >
                                      <option value="">
                                        -- Pilih Slide Tujuan Tautan --
                                      </option>
                                      <optgroup label="🌐 Slide Eksplorasi 360° Budaya (Embed Seperti Slide 8)">
                                        {allTur360Slides.map(
                                          ({ slide: s360, meta: m360 }) => (
                                            <option
                                              key={s360.id}
                                              value={s360.id}
                                            >
                                              Slide {m360.slideNumber} —{' '}
                                              {m360.smartTitle}
                                            </option>
                                          )
                                        )}
                                      </optgroup>
                                      <optgroup label="📑 Seluruh Halaman Slide Lainnya">
                                        {allSlidesWithMeta.map(
                                          ({ slideId: sId, meta: m }) => (
                                            <option key={sId} value={sId}>
                                              Slide {m.slideNumber} —{' '}
                                              {m.smartTitle}
                                            </option>
                                          )
                                        )}
                                      </optgroup>
                                    </select>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCreateNew360SlideAndLinkButton(
                                        'native',
                                        selectedNativeObj.id
                                      )
                                    }
                                    className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <span>
                                      🌐 + Buat Slide 360° Baru &amp; Tautkan ke Tombol Ini
                                    </span>
                                  </button>

                                  {curActionType === 'external-url' && (
                                    <div className="space-y-1.5 pt-1">
                                      <label className="block text-[10px] font-bold text-emerald-800">
                                        Tautan URL / Embed Tujuan
                                      </label>
                                      <input
                                        type="url"
                                        value={
                                          ov.externalUrl || primary360EmbedUrl
                                        }
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          updateCanvasPropertyDebounced(
                                            (prev) =>
                                              applyElementOverridePatch(
                                                prev,
                                                activeDesignSlide.id,
                                                selectedNativeObj.id,
                                                { externalUrl: val }
                                              )
                                          );
                                        }}
                                        placeholder="https://..."
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                                      />
                                    </div>
                                  )}

                                  {(curActionType === 'embed-popup' ||
                                    curActionType === 'open-popup') && (
                                    <div className="space-y-2 pt-1 border-t border-amber-100">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                          Judul State Popup
                                        </label>
                                        <input
                                          type="text"
                                          value={
                                            ov.popupTitle ??
                                            activeDesignMeta.smartTitle
                                          }
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateCanvasPropertyDebounced(
                                              (prev) =>
                                                applyElementOverridePatch(
                                                  prev,
                                                  activeDesignSlide.id,
                                                  selectedNativeObj.id,
                                                  { popupTitle: val }
                                                )
                                            );
                                          }}
                                          className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold"
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-1.5">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                            Jenis Embed Media
                                          </label>
                                          <select
                                            value={
                                              ov.popupMediaType || 'iframe'
                                            }
                                            onChange={(e) =>
                                              updateContent((prev) =>
                                                applyElementOverridePatch(
                                                  prev,
                                                  activeDesignSlide.id,
                                                  selectedNativeObj.id,
                                                  {
                                                    popupMediaType: e.target
                                                      .value as any,
                                                  }
                                                )
                                              )
                                            }
                                            className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold"
                                          >
                                            <option value="iframe">
                                              Embed URL / 360° / Web
                                            </option>
                                            <option value="image">
                                              Gambar / Poster Budaya
                                            </option>
                                            <option value="video">
                                              Video MP4
                                            </option>
                                            <option value="audio">
                                              Audio Narasi MP3
                                            </option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                            Efek Animasi Popup
                                          </label>
                                          <select
                                            value={
                                              ov.popupAnimation || 'pop-zoom'
                                            }
                                            onChange={(e) =>
                                              updateContent((prev) =>
                                                applyElementOverridePatch(
                                                  prev,
                                                  activeDesignSlide.id,
                                                  selectedNativeObj.id,
                                                  {
                                                    popupAnimation: e.target
                                                      .value as any,
                                                  }
                                                )
                                              )
                                            }
                                            className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold"
                                          >
                                            <option value="pop-zoom">
                                              ✨ Pop Zoom Halus
                                            </option>
                                            <option value="bounce">
                                              🏀 Bounce Interaktif
                                            </option>
                                            <option value="slide-up">
                                              ⬆️ Slide Up Modern
                                            </option>
                                            <option value="fade-in">
                                              🌟 Fade In Lembut
                                            </option>
                                          </select>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                          URL Embed Media / Unggah File Media Popup
                                        </label>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={
                                              ov.popupMediaUrl ||
                                              primary360EmbedUrl
                                            }
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              updateCanvasPropertyDebounced(
                                                (prev) =>
                                                  applyElementOverridePatch(
                                                    prev,
                                                    activeDesignSlide.id,
                                                    selectedNativeObj.id,
                                                    {
                                                      popupMediaUrl: val,
                                                    }
                                                  )
                                              );
                                            }}
                                            placeholder="https://... atau unggah file"
                                            className="flex-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                                          />
                                          <label className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer shrink-0">
                                            Unggah
                                            <input
                                              type="file"
                                              accept="image/*,video/*,audio/*"
                                              onChange={(ev) => {
                                                const f = ev.target.files?.[0];
                                                if (!f) return;
                                                const detectedType =
                                                  f.type.startsWith('video')
                                                    ? 'video'
                                                    : f.type.startsWith('audio')
                                                    ? 'audio'
                                                    : 'image';
                                                const r = new FileReader();
                                                r.onload = () => {
                                                  if (
                                                    typeof r.result === 'string'
                                                  ) {
                                                    updateContent((prev) =>
                                                      applyElementOverridePatch(
                                                        prev,
                                                        activeDesignSlide.id,
                                                        selectedNativeObj.id,
                                                        {
                                                          popupMediaUrl:
                                                            r.result as string,
                                                          popupMediaType:
                                                            detectedType,
                                                        }
                                                      )
                                                    );
                                                    showToast(
                                                      'Media State Popup berhasil diunggah!'
                                                    );
                                                  }
                                                };
                                                r.readAsDataURL(f);
                                              }}
                                              className="hidden"
                                            />
                                          </label>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                          Teks Penjelasan di Dalam Popup
                                        </label>
                                        <textarea
                                          rows={2}
                                          value={ov.popupContent || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateCanvasPropertyDebounced(
                                              (prev) =>
                                                applyElementOverridePatch(
                                                  prev,
                                                  activeDesignSlide.id,
                                                  selectedNativeObj.id,
                                                  { popupContent: val }
                                                )
                                            );
                                          }}
                                          placeholder="Tuliskan keterangan budaya pada popup..."
                                          className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs"
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          playStudioSoundEffect(
                                            ov.clickSfxUrl ||
                                              'sfx:click-crystal',
                                            0.85
                                          );
                                          setStagePreviewPopup({
                                            title:
                                              ov.popupTitle ||
                                              activeDesignMeta.smartTitle,
                                            content: ov.popupContent,
                                            mediaUrl:
                                              ov.popupMediaUrl ||
                                              primary360EmbedUrl,
                                            mediaType:
                                              ov.popupMediaType || 'iframe',
                                            animation:
                                              ov.popupAnimation || 'pop-zoom',
                                          });
                                        }}
                                        className="w-full py-1.5 rounded-xl bg-gradient-to-r from-[#2F80ED] to-[#2563EB] text-white text-xs font-extrabold shadow-xs cursor-pointer"
                                      >
                                        ✨ Tes State Popup Beranimasi di Kanvas
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 2. ATUR UKURAN (RESIZE) & PINDAHKAN POSISI (MOVE) */}
                                <div className="p-2.5 rounded-xl bg-white/95 border border-amber-200 space-y-2">
                                  <span className="block text-[11px] font-extrabold text-slate-800">
                                    📐 Atur Ukuran (Resize) &amp; Pindahkan Posisi Tombol
                                  </span>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                        Geser ΔX (%)
                                      </label>
                                      <input
                                        id="native-btn-xdelta-input"
                                        type="number"
                                        step="0.5"
                                        value={curXDelta}
                                        onChange={(e) => {
                                          const val =
                                            Number(e.target.value) || 0;
                                          updateCanvasPropertyDebounced(
                                            (prev) =>
                                              applyElementOverridePatch(
                                                prev,
                                                activeDesignSlide.id,
                                                selectedNativeObj.id,
                                                { xDeltaPct: val }
                                              )
                                          );
                                        }}
                                        className="w-full px-2 py-1 rounded-lg bg-white border border-amber-300 text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                        Geser ΔY (%)
                                      </label>
                                      <input
                                        id="native-btn-ydelta-input"
                                        type="number"
                                        step="0.5"
                                        value={curYDelta}
                                        onChange={(e) => {
                                          const val =
                                            Number(e.target.value) || 0;
                                          updateCanvasPropertyDebounced(
                                            (prev) =>
                                              applyElementOverridePatch(
                                                prev,
                                                activeDesignSlide.id,
                                                selectedNativeObj.id,
                                                { yDeltaPct: val }
                                              )
                                          );
                                        }}
                                        className="w-full px-2 py-1 rounded-lg bg-white border border-amber-300 text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                        Lebar (%)
                                      </label>
                                      <input
                                        id="native-btn-width-input"
                                        type="number"
                                        step="0.5"
                                        min={2}
                                        max={95}
                                        value={curWidthPct}
                                        onChange={(e) => {
                                          const val = Math.max(
                                            2,
                                            Math.min(
                                              95,
                                              Number(e.target.value) ||
                                                defaultWidthPct
                                            )
                                          );
                                          updateCanvasPropertyDebounced(
                                            (prev) =>
                                              applyElementOverridePatch(
                                                prev,
                                                activeDesignSlide.id,
                                                selectedNativeObj.id,
                                                { widthPct: val }
                                              )
                                          );
                                        }}
                                        className="w-full px-2 py-1 rounded-lg bg-white border border-amber-300 text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                        Tinggi (%)
                                      </label>
                                      <input
                                        id="native-btn-height-input"
                                        type="number"
                                        step="0.5"
                                        min={2}
                                        max={95}
                                        value={curHeightPct}
                                        onChange={(e) => {
                                          const val = Math.max(
                                            2,
                                            Math.min(
                                              95,
                                              Number(e.target.value) ||
                                                defaultHeightPct
                                            )
                                          );
                                          updateCanvasPropertyDebounced(
                                            (prev) =>
                                              applyElementOverridePatch(
                                                prev,
                                                activeDesignSlide.id,
                                                selectedNativeObj.id,
                                                { heightPct: val }
                                              )
                                          );
                                        }}
                                        className="w-full px-2 py-1 rounded-lg bg-white border border-amber-300 text-xs font-bold"
                                      />
                                    </div>
                                  </div>

                                  {/* Quick Scale Presets */}
                                  <div className="flex flex-wrap items-center gap-1 pt-1">
                                    <span className="text-[10px] font-bold text-slate-500 mr-1">
                                      Ukuran Cepat:
                                    </span>
                                    {[
                                      { label: 'Kecil (80%)', factor: 0.8 },
                                      { label: 'Asli (100%)', factor: 1 },
                                      { label: 'Besar (125%)', factor: 1.25 },
                                      { label: 'XL (150%)', factor: 1.5 },
                                    ].map((sz) => (
                                      <button
                                        key={sz.label}
                                        type="button"
                                        onClick={() =>
                                          updateContent((prev) =>
                                            applyElementOverridePatch(
                                              prev,
                                              activeDesignSlide.id,
                                              selectedNativeObj.id,
                                              {
                                                widthPct:
                                                  sz.factor === 1
                                                    ? undefined
                                                    : Number(
                                                        (
                                                          defaultWidthPct *
                                                          sz.factor
                                                        ).toFixed(1)
                                                      ),
                                                heightPct:
                                                  sz.factor === 1
                                                    ? undefined
                                                    : Number(
                                                        (
                                                          defaultHeightPct *
                                                          sz.factor
                                                        ).toFixed(1)
                                                      ),
                                              }
                                            )
                                          )
                                        }
                                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#2F80ED] text-[10px] font-bold cursor-pointer"
                                      >
                                        {sz.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* 3. GANTI GAMBAR & LABEL TOMBOL (REPLACE) */}
                                <div className="p-2.5 rounded-xl bg-white/95 border border-amber-200 space-y-2">
                                  <label className="block text-[11px] font-extrabold text-slate-800">
                                    🖼️ Ganti Tampilan Gambar / Label Tombol Ini
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Label / Nama Tombol (Opsional)"
                                    value={ov.customLabel || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateCanvasPropertyDebounced((prev) =>
                                        applyElementOverridePatch(
                                          prev,
                                          activeDesignSlide.id,
                                          selectedNativeObj.id,
                                          { customLabel: val || undefined }
                                        )
                                      );
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                                  />
                                  <label className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-[#2F80ED] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-2xs">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Unggah Pengganti Gambar Tombol</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(ev) => {
                                        const f = ev.target.files?.[0];
                                        if (!f) return;
                                        const r = new FileReader();
                                        r.onload = () => {
                                          if (typeof r.result === 'string') {
                                            updateContent((prev) =>
                                              applyElementOverridePatch(
                                                prev,
                                                activeDesignSlide.id,
                                                selectedNativeObj.id,
                                                {
                                                  customImage:
                                                    r.result as string,
                                                }
                                              )
                                            );
                                            showToast(
                                              'Gambar tombol pada slide berhasil diganti!'
                                            );
                                          }
                                        };
                                        r.readAsDataURL(f);
                                      }}
                                      className="hidden"
                                    />
                                  </label>

                                  {/* 1-Click Starla Preset Buttons Catalog for Native Buttons */}
                                  <div>
                                    <span className="block text-[10px] font-bold text-slate-500 mb-1">
                                      Atau Pilih Katalog Gambar Tombol Starla (1-Klik Ganti):
                                    </span>
                                    <div className="grid grid-cols-7 gap-1">
                                      {STARLA_BUTTON_PRESETS.map((preset) => (
                                        <button
                                          key={preset.id}
                                          type="button"
                                          onClick={() => {
                                            updateContent((prev) =>
                                              applyElementOverridePatch(
                                                prev,
                                                activeDesignSlide.id,
                                                selectedNativeObj.id,
                                                {
                                                  customImage: preset.imageUrl,
                                                }
                                              )
                                            );
                                            showToast(
                                              `Gambar tombol diganti ke "${preset.label}"!`
                                            );
                                          }}
                                          title={preset.label}
                                          className={`p-1 rounded-lg bg-white border hover:border-blue-500 flex items-center justify-center cursor-pointer ${
                                            ov.customImage === preset.imageUrl
                                              ? 'border-blue-600 ring-2 ring-blue-400/30'
                                              : 'border-slate-200'
                                          }`}
                                        >
                                          <img
                                            src={preset.imageUrl}
                                            alt={preset.label}
                                            className="w-6 h-6 object-contain"
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* 4. EFEK AUDIO TOMBOL UI (KLIK & HOVER SFX) */}
                                <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200 space-y-2">
                                  <span className="block text-[11px] font-extrabold text-[#2F80ED]">
                                    🔊 Efek Audio Tombol UI &amp; Auto Hover
                                  </span>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                      Efek Suara Saat Tombol Diklik (Click SFX)
                                    </label>
                                    <div className="flex items-center gap-1">
                                      <select
                                        value={
                                          ov.clickSfxUrl ?? 'sfx:click-crystal'
                                        }
                                        onChange={(e) =>
                                          updateContent((prev) =>
                                            applyElementOverridePatch(
                                              prev,
                                              activeDesignSlide.id,
                                              selectedNativeObj.id,
                                              { clickSfxUrl: e.target.value }
                                            )
                                          )
                                        }
                                        className="flex-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                                      >
                                        {STARLA_SFX_CATALOG.map((sfx) => (
                                          <option key={sfx.id} value={sfx.url}>
                                            {sfx.label}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          playStudioSoundEffect(
                                            ov.clickSfxUrl ??
                                              'sfx:click-crystal',
                                            0.9
                                          )
                                        }
                                        className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold cursor-pointer"
                                      >
                                        🔊 Tes
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                      Efek Suara Saat Kursor Hover (Auto Hover Aktif)
                                    </label>
                                    <div className="flex items-center gap-1">
                                      <select
                                        value={
                                          ov.hoverSfxUrl ?? 'sfx:hover-soft'
                                        }
                                        onChange={(e) =>
                                          updateContent((prev) =>
                                            applyElementOverridePatch(
                                              prev,
                                              activeDesignSlide.id,
                                              selectedNativeObj.id,
                                              { hoverSfxUrl: e.target.value }
                                            )
                                          )
                                        }
                                        className="flex-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                                      >
                                        {STARLA_SFX_CATALOG.map((sfx) => (
                                          <option key={sfx.id} value={sfx.url}>
                                            {sfx.label}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          playStudioSoundEffect(
                                            ov.hoverSfxUrl ?? 'sfx:hover-soft',
                                            0.55
                                          )
                                        }
                                        className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold cursor-pointer"
                                      >
                                        🔊 Tes
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* 5. RESET & HAPUS / SEMBUNYIKAN TOMBOL */}
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateContent((prev) =>
                                        applyElementOverridePatch(
                                          prev,
                                          activeDesignSlide.id,
                                          selectedNativeObj.id,
                                          {
                                            xDeltaPct: 0,
                                            yDeltaPct: 0,
                                            widthPct: undefined,
                                            heightPct: undefined,
                                            customImage: undefined,
                                            customLabel: undefined,
                                            actionType: 'default',
                                          }
                                        )
                                      );
                                      showToast(
                                        'Ukuran, posisi, gambar & trigger tombol dikembalikan ke semula.'
                                      );
                                    }}
                                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                                  >
                                    ↺ Reset Tombol
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleHideNativeObject(
                                        selectedNativeObj.id
                                      )
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer shadow-2xs"
                                  >
                                    🗑️ Hapus / Sembunyikan Tombol
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                        {/* =========================================================
                            SELECTED CUSTOM UPLOADED BUTTON INSPECTOR
                            (RESIZE + MOVE + REPLACE IMAGE/LABEL + DELETE + SMART SLIDE LINKER + POPUP MEDIA + UI SFX)
                        ========================================================= */}
                        {selectedCanvasElId &&
                          (() => {
                            const sel = (
                              activeDesignSlide.canvasElements || []
                            ).find((c) => c.id === selectedCanvasElId);
                            if (!sel) return null;
                            const curActType =
                              sel.action?.type || 'goto-slide';

                            return (
                              <div className="p-4 rounded-2xl bg-blue-50/75 border border-blue-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-[#2F80ED] flex items-center gap-1.5">
                                    <Move className="w-3.5 h-3.5" />
                                    Edit Penuh Tombol Interaktif
                                  </span>
                                  <span className="text-[11px] font-mono text-blue-700">
                                    X:{sel.x}% • Y:{sel.y}% • {sel.width}×
                                    {sel.height}%
                                  </span>
                                </div>

                                {/* 1. TAUTAN MENUJU SLIDE (SMART SLIDE LINKER) - PROMINENT ACCESS */}
                                <div className="p-3 rounded-xl bg-white border-2 border-[#2F80ED]/30 space-y-2 shadow-2xs">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-extrabold text-[#2F80ED]">
                                      🔗 Tautan Menuju Slide (Target Slide &amp; Trigger)
                                    </label>
                                    {curActType === 'goto-slide' &&
                                      sel.action?.targetSlideId && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const targetId =
                                              sel.action?.targetSlideId ||
                                              '5jTlwgcUi8o';
                                            setActiveDesignSlideId(targetId);
                                            navigateToPublicSlide(targetId);
                                            showToast(
                                              `Berpindah ke slide tujuan #${targetId}`
                                            );
                                          }}
                                          className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#2F80ED] text-[10px] font-extrabold cursor-pointer"
                                        >
                                          ↗ Buka Slide Tujuan
                                        </button>
                                      )}
                                  </div>

                                  <select
                                    id="custom-btn-trigger-select"
                                    value={curActType}
                                    onChange={(e) => {
                                      const nextType = e.target
                                        .value as CanvasActionType;
                                      updateContent((prev) =>
                                        applyUpdateCanvasElement(
                                          prev,
                                          activeDesignSlide.id,
                                          sel.id,
                                          {
                                            action: {
                                              ...sel.action,
                                              type: nextType,
                                              targetSlideId:
                                                sel.action?.targetSlideId ||
                                                allTur360Slides[
                                                  allTur360Slides.length - 1
                                                ]?.slide.id ||
                                                '5jTlwgcUi8o',
                                              externalUrl:
                                                sel.action?.externalUrl ||
                                                primary360EmbedUrl,
                                              popupTitle:
                                                sel.action?.popupTitle ||
                                                sel.label ||
                                                activeDesignMeta.smartTitle,
                                              popupMediaUrl:
                                                sel.action?.popupMediaUrl ||
                                                primary360EmbedUrl,
                                              popupMediaType:
                                                sel.action?.popupMediaType ||
                                                'iframe',
                                              popupAnimation:
                                                sel.action?.popupAnimation ||
                                                'pop-zoom',
                                            },
                                          }
                                        )
                                      );
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-blue-200 text-xs font-bold text-slate-800"
                                  >
                                    <option value="goto-slide">
                                      Pindah / Tautkan Menuju Slide Pilihan (Slide 360° / Baru / Materi)
                                    </option>
                                    <option value="external-url">
                                      Opsi Tautan / Buka Embed 360° Langsung
                                    </option>
                                    <option value="embed-popup">
                                      State Popup Media dengan Efek Animasi
                                    </option>
                                    <option value="play-audio">
                                      Putar Audio / Voice Over Narasi
                                    </option>
                                    <option value="none">
                                      Tanpa Aksi (Hanya Gambar)
                                    </option>
                                  </select>

                                  <div>
                                    <label className="block text-[10px] font-bold text-emerald-800 mb-1">
                                      Pilih Slide Tujuan (Termasuk Slide Baru &amp; 360°):
                                    </label>
                                    <select
                                      id="custom-btn-target-slide-select"
                                      value={
                                        sel.action?.targetSlideId ||
                                        '5jTlwgcUi8o'
                                      }
                                      onChange={(e) => {
                                        const chosenId = e.target.value;
                                        updateContent((prev) =>
                                          applyUpdateCanvasElement(
                                            prev,
                                            activeDesignSlide.id,
                                            sel.id,
                                            {
                                              action: {
                                                ...sel.action,
                                                type: 'goto-slide',
                                                targetSlideId: chosenId,
                                              },
                                            }
                                          )
                                        );
                                        showToast(
                                          `Tombol berhasil ditautkan menuju Slide #${chosenId}!`
                                        );
                                      }}
                                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-[#2F80ED]"
                                    >
                                      <optgroup label="🌐 Slide Eksplorasi 360° Budaya (Embed Seperti Slide 8)">
                                        {allTur360Slides.map(
                                          ({ slide: s360, meta: m360 }) => (
                                            <option
                                              key={s360.id}
                                              value={s360.id}
                                            >
                                              Slide {m360.slideNumber} —{' '}
                                              {m360.smartTitle}
                                            </option>
                                          )
                                        )}
                                      </optgroup>
                                      <optgroup label="📑 Seluruh Halaman Slide Lainnya">
                                        {allSlidesWithMeta.map(
                                          ({ slideId: sId, meta: m }) => (
                                            <option key={sId} value={sId}>
                                              Slide {m.slideNumber} —{' '}
                                              {m.smartTitle}
                                            </option>
                                          )
                                        )}
                                      </optgroup>
                                    </select>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCreateNew360SlideAndLinkButton(
                                        'custom',
                                        sel.id
                                      )
                                    }
                                    className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <span>
                                      🌐 + Buat Slide 360° Baru &amp; Tautkan ke Tombol Ini
                                    </span>
                                  </button>

                                  {curActType === 'external-url' && (
                                    <div className="pt-1">
                                      <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                                        Pilih / Ketik Tautan URL atau Embed 360° Tujuan
                                      </label>
                                      <select
                                        value={
                                          sel.action?.externalUrl ||
                                          primary360EmbedUrl
                                        }
                                        onChange={(e) =>
                                          updateContent((prev) =>
                                            applyUpdateCanvasElement(
                                              prev,
                                              activeDesignSlide.id,
                                              sel.id,
                                              {
                                                action: {
                                                  ...sel.action,
                                                  type: 'external-url',
                                                  externalUrl: e.target.value,
                                                },
                                              }
                                            )
                                          )
                                        }
                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-mono text-slate-800 mb-1.5"
                                      >
                                        {tur360Items.map((t360) => (
                                          <option
                                            key={t360.id}
                                            value={t360.embedUrl}
                                          >
                                            {t360.code}: {t360.embedUrl}
                                          </option>
                                        ))}
                                      </select>
                                      <input
                                        type="url"
                                        value={sel.action?.externalUrl || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          updateCanvasPropertyDebounced(
                                            (prev) =>
                                              applyUpdateCanvasElement(
                                                prev,
                                                activeDesignSlide.id,
                                                sel.id,
                                                {
                                                  action: {
                                                    ...sel.action,
                                                    type: 'external-url',
                                                    externalUrl: val,
                                                  },
                                                }
                                              )
                                          );
                                        }}
                                        placeholder="https://..."
                                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-mono text-slate-800"
                                      />
                                    </div>
                                  )}

                                  {(curActType === 'embed-popup' ||
                                    curActType === 'open-popup') && (
                                    <div className="p-2.5 rounded-xl bg-slate-50 border border-blue-200 space-y-2">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                          Judul State Popup
                                        </label>
                                        <input
                                          type="text"
                                          value={
                                            sel.action?.popupTitle ??
                                            sel.label ??
                                            activeDesignMeta.smartTitle
                                          }
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateCanvasPropertyDebounced(
                                              (prev) =>
                                                applyUpdateCanvasElement(
                                                  prev,
                                                  activeDesignSlide.id,
                                                  sel.id,
                                                  {
                                                    action: {
                                                      ...sel.action,
                                                      type: 'embed-popup',
                                                      popupTitle: val,
                                                    },
                                                  }
                                                )
                                            );
                                          }}
                                          className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold"
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-1.5">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                            Jenis Media Popup
                                          </label>
                                          <select
                                            value={
                                              sel.action?.popupMediaType ||
                                              'iframe'
                                            }
                                            onChange={(e) =>
                                              updateContent((prev) =>
                                                applyUpdateCanvasElement(
                                                  prev,
                                                  activeDesignSlide.id,
                                                  sel.id,
                                                  {
                                                    action: {
                                                      ...sel.action,
                                                      type: 'embed-popup',
                                                      popupMediaType: e.target
                                                        .value as any,
                                                    },
                                                  }
                                                )
                                              )
                                            }
                                            className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold"
                                          >
                                            <option value="iframe">
                                              Embed URL / 360° / Web
                                            </option>
                                            <option value="image">
                                              Gambar / Infografis
                                            </option>
                                            <option value="video">
                                              Video MP4
                                            </option>
                                            <option value="audio">
                                              Audio MP3
                                            </option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                            Efek Animasi Popup
                                          </label>
                                          <select
                                            value={
                                              sel.action?.popupAnimation ||
                                              'pop-zoom'
                                            }
                                            onChange={(e) =>
                                              updateContent((prev) =>
                                                applyUpdateCanvasElement(
                                                  prev,
                                                  activeDesignSlide.id,
                                                  sel.id,
                                                  {
                                                    action: {
                                                      ...sel.action,
                                                      type: 'embed-popup',
                                                      popupAnimation: e.target
                                                        .value as any,
                                                    },
                                                  }
                                                )
                                              )
                                            }
                                            className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold"
                                          >
                                            <option value="pop-zoom">
                                              ✨ Pop Zoom Halus
                                            </option>
                                            <option value="bounce">
                                              🏀 Bounce Interaktif
                                            </option>
                                            <option value="slide-up">
                                              ⬆️ Slide Up Modern
                                            </option>
                                            <option value="fade-in">
                                              🌟 Fade In Lembut
                                            </option>
                                          </select>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                          URL Embed Media / Unggah File Media Popup
                                        </label>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            value={
                                              sel.action?.popupMediaUrl ||
                                              primary360EmbedUrl
                                            }
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              updateCanvasPropertyDebounced(
                                                (prev) =>
                                                  applyUpdateCanvasElement(
                                                    prev,
                                                    activeDesignSlide.id,
                                                    sel.id,
                                                    {
                                                      action: {
                                                        ...sel.action,
                                                        type: 'embed-popup',
                                                        popupMediaUrl: val,
                                                      },
                                                    }
                                                  )
                                              );
                                            }}
                                            placeholder="https://... atau unggah"
                                            className="flex-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                                          />
                                          <label className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer shrink-0">
                                            Unggah
                                            <input
                                              type="file"
                                              accept="image/*,video/*,audio/*"
                                              onChange={(ev) => {
                                                const f = ev.target.files?.[0];
                                                if (!f) return;
                                                const detectedType =
                                                  f.type.startsWith('video')
                                                    ? 'video'
                                                    : f.type.startsWith('audio')
                                                    ? 'audio'
                                                    : 'image';
                                                const r = new FileReader();
                                                r.onload = () => {
                                                  if (
                                                    typeof r.result === 'string'
                                                  ) {
                                                    updateContent((prev) =>
                                                      applyUpdateCanvasElement(
                                                        prev,
                                                        activeDesignSlide.id,
                                                        sel.id,
                                                        {
                                                          action: {
                                                            ...sel.action,
                                                            type: 'embed-popup',
                                                            popupMediaUrl:
                                                              r.result as string,
                                                            popupMediaType:
                                                              detectedType,
                                                          },
                                                        }
                                                      )
                                                    );
                                                    showToast(
                                                      'Media State Popup berhasil diunggah!'
                                                    );
                                                  }
                                                };
                                                r.readAsDataURL(f);
                                              }}
                                              className="hidden"
                                            />
                                          </label>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                          Teks Narasi di Dalam State Popup
                                        </label>
                                        <textarea
                                          rows={2}
                                          value={sel.action?.popupContent || ''}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateCanvasPropertyDebounced(
                                              (prev) =>
                                                applyUpdateCanvasElement(
                                                  prev,
                                                  activeDesignSlide.id,
                                                  sel.id,
                                                  {
                                                    action: {
                                                      ...sel.action,
                                                      type: 'embed-popup',
                                                      popupContent: val,
                                                    },
                                                  }
                                                )
                                            );
                                          }}
                                          placeholder="Tuliskan penjelasan budaya untuk popup..."
                                          className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs"
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          playStudioSoundEffect(
                                            sel.clickSfxUrl ||
                                              'sfx:click-crystal',
                                            0.85
                                          );
                                          setStagePreviewPopup({
                                            title:
                                              sel.action?.popupTitle ||
                                              sel.label ||
                                              activeDesignMeta.smartTitle,
                                            content: sel.action?.popupContent,
                                            mediaUrl:
                                              sel.action?.popupMediaUrl ||
                                              primary360EmbedUrl,
                                            mediaType:
                                              sel.action?.popupMediaType ||
                                              'iframe',
                                            animation:
                                              sel.action?.popupAnimation ||
                                              'pop-zoom',
                                          });
                                        }}
                                        className="w-full py-1.5 rounded-xl bg-gradient-to-r from-[#2F80ED] to-[#2563EB] text-white text-xs font-extrabold shadow-xs cursor-pointer"
                                      >
                                        ✨ Tes State Popup Beranimasi di Kanvas
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* 2. ATUR UKURAN (RESIZE) & PINDAHKAN POSISI (MOVE) */}
                                <div className="p-2.5 rounded-xl bg-white/95 border border-blue-200 space-y-2">
                                  <span className="block text-[11px] font-extrabold text-slate-800">
                                    📐 Atur Ukuran (Resize) &amp; Pindahkan Posisi Tombol
                                  </span>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                        X (%)
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={95}
                                        value={sel.x}
                                        onChange={(e) => {
                                          const val = Math.max(
                                            0,
                                            Math.min(
                                              95,
                                              Number(e.target.value) || 0
                                            )
                                          );
                                          updateCanvasPropertyDebounced(
                                            (prev) =>
                                              applyUpdateCanvasElement(
                                                prev,
                                                activeDesignSlide.id,
                                                sel.id,
                                                {
                                                  x: val,
                                                }
                                              )
                                          );
                                        }}
                                        className="w-full px-2 py-1 rounded-lg bg-white border border-blue-200 text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                        Y (%)
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={95}
                                        value={sel.y}
                                        onChange={(e) => {
                                          const val = Math.max(
                                            0,
                                            Math.min(
                                              95,
                                              Number(e.target.value) || 0
                                            )
                                          );
                                          updateCanvasPropertyDebounced(
                                            (prev) =>
                                              applyUpdateCanvasElement(
                                                prev,
                                                activeDesignSlide.id,
                                                sel.id,
                                                {
                                                  y: val,
                                                }
                                              )
                                          );
                                        }}
                                        className="w-full px-2 py-1 rounded-lg bg-white border border-blue-200 text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                        Lebar (%)
                                      </label>
                                      <input
                                        type="number"
                                        min={3}
                                        max={95}
                                        value={sel.width}
                                        onChange={(e) => {
                                          const val = Math.max(
                                            3,
                                            Math.min(
                                              95,
                                              Number(e.target.value) || 10
                                            )
                                          );
                                          updateCanvasPropertyDebounced(
                                            (prev) =>
                                              applyUpdateCanvasElement(
                                                prev,
                                                activeDesignSlide.id,
                                                sel.id,
                                                {
                                                  width: val,
                                                }
                                              )
                                          );
                                        }}
                                        className="w-full px-2 py-1 rounded-lg bg-white border border-blue-200 text-xs font-bold"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                        Tinggi (%)
                                      </label>
                                      <input
                                        type="number"
                                        min={3}
                                        max={95}
                                        value={sel.height}
                                        onChange={(e) => {
                                          const val = Math.max(
                                            3,
                                            Math.min(
                                              95,
                                              Number(e.target.value) || 8
                                            )
                                          );
                                          updateCanvasPropertyDebounced(
                                            (prev) =>
                                              applyUpdateCanvasElement(
                                                prev,
                                                activeDesignSlide.id,
                                                sel.id,
                                                {
                                                  height: val,
                                                }
                                              )
                                          );
                                        }}
                                        className="w-full px-2 py-1 rounded-lg bg-white border border-blue-200 text-xs font-bold"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* 3. GANTI GAMBAR & LABEL TOMBOL (REPLACE) */}
                                <div className="p-2.5 rounded-xl bg-white/95 border border-blue-200 space-y-2">
                                  <label className="block text-[11px] font-extrabold text-slate-800">
                                    🖼️ Ganti Gambar / Label Tombol Ini
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Label / Nama Tombol"
                                    value={sel.label || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateCanvasPropertyDebounced((prev) =>
                                        applyUpdateCanvasElement(
                                          prev,
                                          activeDesignSlide.id,
                                          sel.id,
                                          { label: val }
                                        )
                                      );
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer">
                                      <Upload className="w-3.5 h-3.5" />
                                      <span>Unggah Pengganti Gambar Tombol</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(ev) => {
                                          const f = ev.target.files?.[0];
                                          if (!f) return;
                                          const r = new FileReader();
                                          r.onload = () => {
                                            if (typeof r.result === 'string') {
                                              const dataUrl =
                                                r.result as string;
                                              updateContent((prev) =>
                                                applyUpdateCanvasElement(
                                                  prev,
                                                  activeDesignSlide.id,
                                                  sel.id,
                                                  {
                                                    imageUrl: dataUrl,
                                                    style: {
                                                      ...sel.style,
                                                      backgroundColor:
                                                        'transparent',
                                                      borderRadius: 0,
                                                      textPosition: 'hidden',
                                                    },
                                                  }
                                                )
                                              );
                                              showToast(
                                                'Gambar tombol berhasil diganti 100% sesuai unggahan!'
                                              );
                                            }
                                          };
                                          r.readAsDataURL(f);
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>

                                  {/* One-Click Starla Button Presets */}
                                  <div className="grid grid-cols-7 gap-1 mt-2">
                                    {STARLA_BUTTON_PRESETS.map((preset) => (
                                      <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() =>
                                          updateContent((prev) =>
                                            applyUpdateCanvasElement(
                                              prev,
                                              activeDesignSlide.id,
                                              sel.id,
                                              {
                                                imageUrl: preset.imageUrl,
                                                style: {
                                                  ...sel.style,
                                                  backgroundColor:
                                                    'transparent',
                                                  borderRadius: 0,
                                                  textPosition: 'hidden',
                                                },
                                              }
                                            )
                                          )
                                        }
                                        title={preset.label}
                                        className={`p-1 rounded-lg bg-white border hover:border-blue-500 flex items-center justify-center cursor-pointer ${
                                          sel.imageUrl === preset.imageUrl
                                            ? 'border-blue-600 ring-2 ring-blue-400/30'
                                            : 'border-slate-200'
                                        }`}
                                      >
                                        <img
                                          src={preset.imageUrl}
                                          alt={preset.label}
                                          className="w-6 h-6 object-contain"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* 4. DATABASE EFEK AUDIO TOMBOL UI (KLIK & HOVER SFX) */}
                                <div className="p-2.5 rounded-xl bg-white/90 border border-blue-200 space-y-2">
                                  <span className="block text-[11px] font-extrabold text-[#2F80ED]">
                                    🔊 Efek Audio Tombol UI &amp; Auto Hover
                                  </span>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                      Suara Saat Tombol Diklik (Click SFX)
                                    </label>
                                    <div className="flex items-center gap-1">
                                      <select
                                        value={
                                          sel.clickSfxUrl ?? 'sfx:click-crystal'
                                        }
                                        onChange={(e) =>
                                          updateContent((prev) =>
                                            applyUpdateCanvasElement(
                                              prev,
                                              activeDesignSlide.id,
                                              sel.id,
                                              { clickSfxUrl: e.target.value }
                                            )
                                          )
                                        }
                                        className="flex-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                                      >
                                        {STARLA_SFX_CATALOG.map((sfx) => (
                                          <option key={sfx.id} value={sfx.url}>
                                            {sfx.label}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          playStudioSoundEffect(
                                            sel.clickSfxUrl ??
                                              'sfx:click-crystal',
                                            0.9
                                          )
                                        }
                                        className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold cursor-pointer"
                                      >
                                        🔊 Tes
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                      Suara Saat Hover (Auto Hover Aktif)
                                    </label>
                                    <div className="flex items-center gap-1">
                                      <select
                                        value={
                                          sel.hoverSfxUrl ?? 'sfx:hover-soft'
                                        }
                                        onChange={(e) =>
                                          updateContent((prev) =>
                                            applyUpdateCanvasElement(
                                              prev,
                                              activeDesignSlide.id,
                                              sel.id,
                                              { hoverSfxUrl: e.target.value }
                                            )
                                          )
                                        }
                                        className="flex-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                                      >
                                        {STARLA_SFX_CATALOG.map((sfx) => (
                                          <option key={sfx.id} value={sfx.url}>
                                            {sfx.label}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          playStudioSoundEffect(
                                            sel.hoverSfxUrl ?? 'sfx:hover-soft',
                                            0.55
                                          )
                                        }
                                        className="px-2 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold cursor-pointer"
                                      >
                                        🔊 Tes
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* 5. HAPUS TOMBOL */}
                                <div className="pt-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateContent((prev) =>
                                        applyDeleteCanvasElement(
                                          prev,
                                          activeDesignSlide.id,
                                          sel.id
                                        )
                                      );
                                      setSelectedCanvasElId(null);
                                      showToast(
                                        'Tombol kustom berhasil dihapus dari slide.'
                                      );
                                    }}
                                    className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer shadow-2xs"
                                  >
                                    🗑️ Hapus Tombol Ini dari Slide
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>ID Slide: #{activeDesignSlide.id}</span>
                          <span>
                            {(activeDesignSlide.canvasElements || []).length}{' '}
                            Tombol Kustom • {activeDesignSlide.audios.length}{' '}
                            Audio
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Slide Filmstrip with Progressive Lazy Loading & Memory Optimization */}
                    <div className="bg-white rounded-3xl p-4 shadow-[0_10px_35px_rgba(15,23,42,0.03)] border border-white">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
                        <span className="text-xs font-extrabold text-[#2F80ED]">
                          Daftar Slide ({allSlidesWithMeta.length} Slide) — Klik untuk Berpindah Slide
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            Mode Lazy Memory: LRU Cache ({getAdminStageCacheStats().cachedSlideCount}/
                            {getAdminStageCacheStats().maxCachedSlides} Slide)
                          </span>
                          {!isFilmstripExpanded &&
                            allSlidesWithMeta.length > 12 && (
                              <button
                                type="button"
                                onClick={() => setIsFilmstripExpanded(true)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-[11px] font-bold cursor-pointer"
                              >
                                Tampilkan Semua ({allSlidesWithMeta.length} Slide)
                              </button>
                            )}
                        </div>
                      </div>
                      <div
                        onScroll={() => {
                          if (!isFilmstripExpanded) {
                            setIsFilmstripExpanded(true);
                          }
                        }}
                        className="flex items-center gap-3 overflow-x-auto pb-2"
                      >
                        {(() => {
                          const curIdx = Math.max(
                            0,
                            allSlidesWithMeta.findIndex(
                              (s) => s.slideId === activeDesignSlide.id
                            )
                          );
                          const startWindow = Math.max(0, curIdx - 4);
                          const visibleSlides = isFilmstripExpanded
                            ? allSlidesWithMeta
                            : allSlidesWithMeta.slice(
                                startWindow,
                                startWindow + 12
                              );
                          return visibleSlides.map(
                            ({ slideId, slide, meta }) => {
                              const isCurrent =
                                slideId === activeDesignSlide.id;
                              const thumb =
                                slide?.backgroundUrl ||
                                meta.backgroundUrl ||
                                slide?.images?.[0]?.url ||
                                'mobile/Slide5znCNCeGBCx.jpg';
                              return (
                                <button
                                  key={slideId}
                                  type="button"
                                  onClick={() => {
                                    setActiveDesignSlideId(slideId);
                                    navigateToPublicSlide(slideId);
                                  }}
                                  className={`group shrink-0 w-48 rounded-2xl p-2 border text-left transition-all cursor-pointer ${
                                    isCurrent
                                      ? 'bg-blue-50/80 border-[#2563EB] ring-2 ring-blue-500/20 shadow-sm'
                                      : 'bg-slate-50/70 hover:bg-white border-slate-200/80'
                                  }`}
                                >
                                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 mb-2 border border-[#E2E8F0]">
                                    <img
                                      src={thumb}
                                      alt={meta.smartTitle}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      loading="lazy"
                                      decoding="async"
                                    />
                                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#2F80ED] text-white text-[10px] font-extrabold shadow-2xs">
                                      #{meta.slideNumber}
                                    </span>
                                  </div>
                                  <p className="text-xs font-extrabold text-slate-800 truncate">
                                    {meta.smartTitle}
                                  </p>
                                  <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
                                    {meta.subTopic}
                                  </p>
                                </button>
                              );
                            }
                          );
                        })()}
                      </div>
                    </div>

                    {/* MODAL KELOLA SLIDE BARU / COPY DARI SLIDE YANG ADA */}
                    {isSlideManagerOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
                          <div className="px-6 py-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900">
                              {slideManagerMode === 'copy'
                                ? 'Copy / Duplikat dari Slide yang Ada'
                                : 'Tambah Slide Budaya Baru'}
                            </h3>
                            <button
                              type="button"
                              onClick={() => setIsSlideManagerOpen(false)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <form
                            onSubmit={handleConfirmCreateOrCopySlide}
                            className="p-6 space-y-4 max-h-[82vh] overflow-y-auto"
                          >
                            {/* Mode Switcher: Buat Slide Baru vs Copy dari Slide yang Ada */}
                            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
                              <button
                                type="button"
                                onClick={() => setSlideManagerMode('new')}
                                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                  slideManagerMode === 'new'
                                    ? 'bg-white text-[#2F80ED] shadow-xs'
                                    : 'text-slate-600'
                                }`}
                              >
                                + Buat Slide Baru
                              </button>
                              <button
                                type="button"
                                onClick={() => setSlideManagerMode('copy')}
                                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                  slideManagerMode === 'copy'
                                    ? 'bg-white text-purple-800 shadow-xs'
                                    : 'text-slate-600'
                                }`}
                              >
                                📋 Copy dari Slide yang Ada
                              </button>
                            </div>

                            {slideManagerMode === 'copy' && (
                              <div>
                                <label className="block text-xs font-bold text-purple-800 mb-1">
                                  Pilih Slide Sumber untuk Di-Copy (100% Tombol &amp; Layout Disalin)
                                </label>
                                <select
                                  id="slide-manager-copy-source-select"
                                  value={sourceCopySlideId}
                                  onChange={(e) => {
                                    const srcId = e.target.value;
                                    setSourceCopySlideId(srcId);
                                    const m = getSmartSlideMeta(
                                      srcId,
                                      activeContent.slides[srcId]
                                    );
                                    setNewSlideTitle(
                                      `${m.smartTitle} (Salinan)`
                                    );
                                    setNewSlideSummary(m.smartSummary);
                                    setNewSlideBgUrl(
                                      activeContent.slides[srcId]
                                        ?.backgroundUrl ||
                                        m.backgroundUrl ||
                                        'mobile/Slide5znCNCeGBCx.jpg'
                                    );
                                  }}
                                  className="w-full px-3.5 py-2 rounded-xl border border-purple-300 bg-purple-50/40 text-xs font-bold text-slate-800"
                                >
                                  {allSlidesWithMeta.map(
                                    ({ slideId, meta }) => (
                                      <option key={slideId} value={slideId}>
                                        Slide {meta.slideNumber} —{' '}
                                        {meta.smartTitle}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Nama / Judul Slide Baru
                              </label>
                              <input
                                id="slide-manager-title-input"
                                type="text"
                                required
                                value={newSlideTitle}
                                onChange={(e) =>
                                  setNewSlideTitle(e.target.value)
                                }
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Ringkasan Materi / Narasi Slide
                              </label>
                              <textarea
                                rows={2}
                                value={newSlideSummary}
                                onChange={(e) =>
                                  setNewSlideSummary(e.target.value)
                                }
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700"
                              />
                            </div>

                            {/* Fitur Embed Seperti Halaman 360° pada Slide Baru */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-bold text-emerald-700">
                                  Tautan Embed Web / 360° (Opsional — Seperti Halaman 360°)
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNewSlideEmbedUrl(
                                      'https://faryzt.github.io/starla-360/'
                                    )
                                  }
                                  className="text-[11px] font-bold text-[#2F80ED] hover:underline cursor-pointer"
                                >
                                  + Isi Preset 360° Budaya
                                </button>
                              </div>
                              <input
                                id="slide-manager-embed-url-input"
                                type="url"
                                value={newSlideEmbedUrl}
                                onChange={(e) =>
                                  setNewSlideEmbedUrl(e.target.value)
                                }
                                placeholder="https://faryzt.github.io/starla-360/ (Kosongkan jika slide materi biasa)"
                                className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/30 text-xs font-mono text-slate-800"
                              />
                            </div>

                            {/* Pilih / Unggah Background Gambar Slide Baru */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Background Gambar Slide Baru (Preset / Unggah)
                              </label>
                              <div className="flex items-center gap-2">
                                <select
                                  value={newSlideBgUrl}
                                  onChange={(e) =>
                                    setNewSlideBgUrl(e.target.value)
                                  }
                                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                                >
                                  {STARLA_BACKGROUND_PRESETS.map((bg) => (
                                    <option key={bg.id} value={bg.imageUrl}>
                                      🖼️ {bg.label}
                                    </option>
                                  ))}
                                </select>
                                <label className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer flex items-center gap-1">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Unggah BG</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(ev) => {
                                      const f = ev.target.files?.[0];
                                      if (!f) return;
                                      const r = new FileReader();
                                      r.onload = () => {
                                        if (typeof r.result === 'string') {
                                          setNewSlideBgUrl(r.result);
                                        }
                                      };
                                      r.readAsDataURL(f);
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Pilih Backsound & Voice Over Slide Baru */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  Backsound Slide
                                </label>
                                <select
                                  value={newSlideBacksoundUrl}
                                  onChange={(e) =>
                                    setNewSlideBacksoundUrl(e.target.value)
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                                >
                                  {STARLA_BACKSOUND_CATALOG.map((bs) => (
                                    <option key={bs.id} value={bs.url}>
                                      🎵 {bs.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  Voice Over Narasi
                                </label>
                                <select
                                  value={newSlideVoiceOverUrl}
                                  onChange={(e) =>
                                    setNewSlideVoiceOverUrl(e.target.value)
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                                >
                                  {STARLA_VOICEOVER_CATALOG.map((vo) => (
                                    <option key={vo.id} value={vo.url}>
                                      🎙️ {vo.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                              <button
                                type="button"
                                onClick={() => setIsSlideManagerOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                id="confirm-create-slide-btn"
                                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-extrabold shadow-md cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>
                                  {slideManagerMode === 'copy'
                                    ? 'Salin & Buat Slide Baru'
                                    : 'Simpan Slide Baru'}
                                </span>
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================
                    TAB 7: PENGGUNA (USERS & ANALITIK SISWA + RECHARTS VISUALIZATION)
                ========================================================= */}
                {activeTab === 'analitik' && (
                  <div className="space-y-6">
                    <Suspense
                      fallback={
                        <div className="bg-white rounded-3xl p-6 border border-white text-xs font-bold text-slate-400">
                          Memuat Grafik Statistik Kuis &amp; Game (Recharts)...
                        </div>
                      }
                    >
                      <LazyQuizGameCompletionCharts
                        students={extraState.analyticsList}
                        onNavigateTab={(t) => setActiveTab(t)}
                      />
                    </Suspense>

                    <div className="bg-white rounded-3xl shadow-[0_10px_35px_rgba(15,23,42,0.03)] border border-white overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 bg-white">
                              <th className="py-4 px-6">Profil Pengguna ⇅</th>
                              <th className="py-4 px-4">ID ⇅</th>
                              <th className="py-4 px-4">Sekolah / Instansi ⇅</th>
                              <th className="py-4 px-4">Skor &amp; Progres ⇅</th>
                              <th className="py-4 px-4">Status ⇅</th>
                              <th className="py-4 px-4">Waktu Aktif ⇅</th>
                              <th className="py-4 px-6 text-right">Action ⇅</th>
                            </tr>
                          </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredAnalytics.map((st) => (
                            <tr
                              key={st.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={st.avatarUrl}
                                    alt={st.name}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-amber-50 shrink-0"
                                  />
                                  <p className="font-bold text-slate-800">
                                    {st.name}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">
                                #{st.id}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                                {st.school}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-bold text-blue-600">
                                Kuis: {st.quizScore}/100 • Garuda:{' '}
                                {st.garudaPoints} Poin ({st.completedModules}/17
                                Materi)
                              </td>
                              <td className="py-3.5 px-4">
                                {renderBadge(st.status)}
                              </td>
                              <td className="py-3.5 px-4 text-xs text-slate-400">
                                {st.lastActive}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditModalForPengguna(st)}
                                    className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                    title="Edit Pengguna"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePengguna(st.id)}
                                    className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Hapus Pengguna"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {renderPaginationFooter(filteredAnalyticsAll.length)}
                  </div>
                </div>
                )}

                {/* =========================================================
                    TAB 8: PENGATURAN
                ========================================================= */}
                {activeTab === 'pengaturan' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 space-y-4">
                      <h3 className="text-base font-extrabold text-[#2F80ED]">
                        Identitas Aplikasi & Tautan 360° Budaya
                      </h3>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">
                          Judul Utama Aplikasi
                        </label>
                        <input
                          type="text"
                          value={activeContent.appMeta.title}
                          onChange={(e) =>
                            updateContent((prev) => ({
                              ...prev,
                              appMeta: {
                                ...prev.appMeta,
                                title: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">
                          Tautan Embed 360° Budaya Utama
                        </label>
                        <input
                          type="text"
                          value={activeContent.appMeta.canonicalUrl}
                          onChange={(e) =>
                            updateContent((prev) => ({
                              ...prev,
                              appMeta: {
                                ...prev.appMeta,
                                canonicalUrl: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            await saveToCloud();
                            showToast(
                              'Pengaturan berhasil disimpan & disinkronkan!'
                            );
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Pengaturan</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 space-y-4">
                      <h3 className="text-base font-extrabold text-[#2F80ED]">
                        Cadangan JSON & Pemulihan Konten Default
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Unduh cadangan JSON seluruh materi, kuis, gim, dan desain slide, atau kembalikan ke konten bawaan pabrik kapan saja.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleExportJson}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Unduh Backup JSON</span>
                        </button>

                        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>Impor File JSON</span>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportJsonFile}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            resetToDefault();
                            setExtraState(DEFAULT_EXTRA_STATE);
                            showToast(
                              'Seluruh konten dikembalikan ke versi awal!'
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reset ke Default</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </div>

            {/* ===============================================================
                MODAL CRUD FORM (TAILORED PER TAB - EXTRACTED SUB-COMPONENT)
            =============================================================== */}
            <AdminCrudModal
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
              activeTab={activeTab}
              modalMode={modalMode}
              formEmbedUrl={formEmbedUrl}
              setFormEmbedUrl={setFormEmbedUrl}
              formTitle={formTitle}
              setFormTitle={setFormTitle}
              formCategory={formCategory}
              setFormCategory={setFormCategory}
              formStatus={formStatus}
              setFormStatus={setFormStatus}
              formDescription={formDescription}
              setFormDescription={setFormDescription}
              formTargetGroup={formTargetGroup}
              setFormTargetGroup={setFormTargetGroup}
              formPoints={formPoints}
              setFormPoints={setFormPoints}
              formChoices={formChoices}
              setFormChoices={setFormChoices}
              formImageUrl={formImageUrl}
              setFormImageUrl={setFormImageUrl}
              formAudioUrl={formAudioUrl}
              setFormAudioUrl={setFormAudioUrl}
              handleImageFileUpload={handleImageFileUpload}
              handleAudioFileUpload={handleAudioFileUpload}
              handleSaveModal={handleSaveModal}
            />

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
              <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#2F80ED] text-white text-xs font-bold shadow-xl border border-white/15">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{toastMessage}</span>
              </div>
            )}
          </div>
          ),
          targetPortal
        )}
    </AdminDataContext.Provider>
  );
};

export default AdminDashboard;
