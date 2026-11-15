// src/CanvaStudio.tsx
// MINIMALIST WHITE CANVA STUDIO + DIRECT DOM INSPECTOR + ELEMENT TIMELINE + SUPABASE
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Undo2,
  Redo2,
  Eye,
  Edit3,
  CloudUpload,
  Plus,
  Image as ImageIcon,
  Type,
  Volume2,
  Trash2,
  X,
  Play,
  Check,
  Copy,
  Clock,
  Film,
  Layers,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { defaultContent } from './data/defaultContent';
import { isAdminRouteActive } from './features/admin/adminHelpers';

// ==========================================
// 1. KONFIGURASI ENVIRONMENT & SUPABASE
// ==========================================
const getEnv = (nextKey: string, viteKey: string, fallback = ''): string => {
  try {
    if (typeof process !== 'undefined' && process.env?.[nextKey]) {
      return process.env[nextKey] as string;
    }
    if (
      typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string> }).env?.[viteKey]
    ) {
      return (import.meta as unknown as { env: Record<string, string> }).env[
        viteKey
      ];
    }
  } catch {
    // Ignore env access error
  }
  return fallback;
};

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
const SUPABASE_KEY = getEnv(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY'
);
const ADMIN_PIN = getEnv('NEXT_PUBLIC_ADMIN_PIN', 'VITE_ADMIN_PIN', '123456');

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;
const STORAGE_KEY = 'articulate_white_studio_v3';

// ==========================================
// 2. TIPE DATA KANVAS, ANIMASI & TIMELINE
// ==========================================
export type ResizeDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
export type AnimationType =
  | 'none'
  | 'fade-in'
  | 'zoom-in'
  | 'slide-up'
  | 'slide-left'
  | 'bounce';

export interface ElementAnimation {
  type: AnimationType;
  delay: number; // Waktu mulai dalam detik (misal: 0, 0.5, 1.2)
  duration: number; // Durasi dalam detik (misal: 0.6, 1.0)
}

export interface CanvasElement {
  id: string;
  name: string;
  type: 'image-button' | 'text' | 'image' | 'audio-button';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  locked: boolean;
  label: string;
  imageUrl?: string;
  audioUrl?: string;
  bgColor: string;
  textColor: string;
  fontSize: number;
  borderRadius: number;
  actionType: 'none' | 'goto-slide' | 'open-popup' | 'play-audio';
  targetSlide?: number;
  popupTitle?: string;
  popupContent?: string;
  animation: ElementAnimation;
}

export interface NativeNodeOverride {
  selectorId: string;
  name: string;
  tagName: string;
  xDeltaPct: number;
  yDeltaPct: number;
  hidden: boolean;
  customText?: string;
  customImageSrc?: string;
  animation: ElementAnimation;
}

export interface SlideItem {
  id: string;
  title: string;
  bgColor?: string;
  bgImage?: string;
  isCustomBlank?: boolean;
  elements: CanvasElement[];
  nativeOverrides: Record<string, NativeNodeOverride>;
}

export interface StudioData {
  version: number;
  slides: SlideItem[];
}

const buildInitialSlidesFromDefaultContent = (): SlideItem[] => {
  const order = defaultContent?.slideOrder || [];
  if (order.length === 0) {
    return [
      {
        id: 'slide-1',
        title: 'Slide 1',
        elements: [],
        nativeOverrides: {},
      },
    ];
  }
  return order.map((slideId, idx) => {
    const raw = defaultContent.slides[slideId];
    return {
      id: slideId,
      title: raw?.title || `Slide ${idx + 1}`,
      bgColor: '#FFFFFF',
      bgImage: raw?.backgroundUrl || raw?.images?.[0]?.url || undefined,
      isCustomBlank: false,
      elements: [],
      nativeOverrides: {},
    };
  });
};

const DEFAULT_STUDIO_DATA: StudioData = {
  version: 1,
  slides: buildInitialSlidesFromDefaultContent(),
};

const ANIMATION_KEYFRAMES: Record<AnimationType, Keyframe[]> = {
  none: [{ opacity: 1 }, { opacity: 1 }],
  'fade-in': [{ opacity: 0 }, { opacity: 1 }],
  'zoom-in': [
    { opacity: 0, transform: 'scale(0.6)' },
    { opacity: 1, transform: 'scale(1)' },
  ],
  'slide-up': [
    { opacity: 0, transform: 'translateY(36px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  'slide-left': [
    { opacity: 0, transform: 'translateX(40px)' },
    { opacity: 1, transform: 'translateX(0)' },
  ],
  bounce: [
    { opacity: 0, transform: 'scale(0.5)' },
    { opacity: 1, transform: 'scale(1.08)' },
    { opacity: 1, transform: 'scale(0.96)' },
    { opacity: 1, transform: 'scale(1)' },
  ],
};

const RESIZE_HANDLES: { dir: ResizeDir; cls: string }[] = [
  { dir: 'nw', cls: '-top-1.5 -left-1.5 cursor-nwse-resize' },
  { dir: 'n', cls: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
  { dir: 'ne', cls: '-top-1.5 -right-1.5 cursor-nesw-resize' },
  { dir: 'e', cls: 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize' },
  { dir: 'se', cls: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
  { dir: 's', cls: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
  { dir: 'sw', cls: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
  { dir: 'w', cls: 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize' },
];

// ==========================================
// 3. CONTEXT STUDIO
// ==========================================
interface StudioContextValue {
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  totalSlides: number;
}

const StudioContext = createContext<StudioContextValue>({
  activeSlideIndex: 0,
  setActiveSlideIndex: () => {},
  totalSlides: DEFAULT_STUDIO_DATA.slides.length,
});

export const useCanvaStudio = () => useContext(StudioContext);

export interface CanvaStudioProps {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  defaultAuthenticated?: boolean;
  selectedSlideId?: string;
  onSelectSlideId?: (slideId: string) => void;
  onOpenClassicTab?: (
    tab: 'slides' | 'quiz' | 'media' | 'meta' | 'backup'
  ) => void;
  onSwitchToClassicTab?: (tab: 'quiz' | 'audio' | 'json') => void;
  onCloseAdmin?: () => void;
  onStatusMessage?: (
    type: 'success' | 'error' | 'info',
    message: string
  ) => void;
}

// ==========================================
// 4. KOMPONEN UTAMA CANVA STUDIO
// ==========================================
export const CanvaStudio: React.FC<CanvaStudioProps> = ({
  children,
  defaultOpen = false,
  defaultAuthenticated = false,
  selectedSlideId,
  onSelectSlideId,
  onOpenClassicTab,
  onSwitchToClassicTab,
  onCloseAdmin,
  onStatusMessage,
}) => {
  const [data, setData] = useState<StudioData>(DEFAULT_STUDIO_DATA);
  const [history, setHistory] = useState<StudioData[]>([DEFAULT_STUDIO_DATA]);
  const [histIdx, setHistIdx] = useState<number>(0);

  const [slideIdx, setSlideIdx] = useState<number>(() => {
    if (selectedSlideId) {
      const idx = DEFAULT_STUDIO_DATA.slides.findIndex(
        (s) => s.id === selectedSlideId
      );
      if (idx >= 0) return idx;
    }
    return 0;
  });

  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(
    () => defaultOpen || isAdminRouteActive()
  );
  const [isAuth, setIsAuth] = useState<boolean>(() => defaultAuthenticated);
  const [pin, setPin] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(
    () => defaultAuthenticated
  );

  // Seleksi: bisa berupa ID elemen baru ('el-...') atau elemen asli slide ('native-...')
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [detectedNativeIds, setDetectedNativeIds] = useState<
    { id: string; name: string; tag: string }[]
  >([]);

  // Panel Bawah: 'slides' (Halaman Slide ala Canva) atau 'timeline' (Timeline Animasi)
  const [bottomTab, setBottomTab] = useState<'slides' | 'timeline'>('timeline');
  const [isBottomOpen, setIsBottomOpen] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ title: string; content: string } | null>(
    null
  );

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const nativeContentRef = useRef<HTMLDivElement>(null);

  const currentSlide: SlideItem =
    data.slides[slideIdx] || data.slides[0] || DEFAULT_STUDIO_DATA.slides[0];
  const selectedCustomEl =
    currentSlide.elements.find((e) => e.id === selectedId) || null;
  const selectedNativeOv =
    selectedId && currentSlide.nativeOverrides[selectedId]
      ? currentSlide.nativeOverrides[selectedId]
      : null;

  const notify = useCallback(
    (msg: string) => {
      setToast(msg);
      onStatusMessage?.('info', msg);
      setTimeout(() => setToast(null), 2500);
    },
    [onStatusMessage]
  );

  // Pastikan #starla-react-root terlihat saat Studio dibuka
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const rootEl = document.getElementById('starla-react-root');
    if (!rootEl) return;
    if (isStudioOpen) {
      rootEl.style.display = 'block';
      rootEl.removeAttribute('aria-hidden');
    }
  }, [isStudioOpen]);

  // Dengarkan pintasan Ctrl + Shift + A atau perubahan URL ?mode=admin
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleLocation = () => {
      if (isAdminRouteActive()) {
        setIsStudioOpen(true);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'a'
      ) {
        e.preventDefault();
        setIsStudioOpen((v) => !v);
      }
    };
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, []);

  // Load Data dari LocalStorage & Supabase
  useEffect(() => {
    const loadContent = async () => {
      try {
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
            setData(parsed);
            setHistory([parsed]);
          }
        }
        if (supabase) {
          const { data: row } = await supabase
            .from('app_contents')
            .select('content_data')
            .eq('slug', 'main')
            .single();
          if (
            row?.content_data &&
            Array.isArray(row.content_data.slides) &&
            row.content_data.slides.length > 0
          ) {
            setData(row.content_data);
            setHistory([row.content_data]);
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(row.content_data)
            );
          }
        }
      } catch {
        // Fallback aman ke DEFAULT_STUDIO_DATA
      }
    };
    loadContent();
  }, []);

  // Simpan History Undo/Redo
  const commitData = useCallback(
    (updater: (prev: StudioData) => StudioData) => {
      setData((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore quota errors
        }
        setHistory((h) => {
          const nextStack = [...h.slice(0, histIdx + 1), next].slice(-30);
          setHistIdx(nextStack.length - 1);
          return nextStack;
        });
        return next;
      });
    },
    [histIdx]
  );

  const undo = useCallback(() => {
    if (histIdx > 0) {
      const idx = histIdx - 1;
      setHistIdx(idx);
      setData(history[idx]);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history[idx]));
      } catch {}
    }
  }, [histIdx, history]);

  const redo = useCallback(() => {
    if (histIdx < history.length - 1) {
      const idx = histIdx + 1;
      setHistIdx(idx);
      setData(history[idx]);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history[idx]));
      } catch {}
    }
  }, [histIdx, history]);

  // ==========================================================
  // AUTO-INSPECTOR & APPLY OVERRIDES KE ASET SLIDE ASLI (DOM)
  // ==========================================================
  const scanAndApplyNativeDOM = useCallback(() => {
    const container = nativeContentRef.current;
    if (!container) return;

    // Tandai elemen penting (gambar, tombol, teks judul/paragraf) di slide asli agar bisa diklik & masuk timeline
    const candidates = container.querySelectorAll(
      'img, button, h1, h2, h3, h4, p, [role="button"]'
    );
    const foundList: { id: string; name: string; tag: string }[] = [];

    candidates.forEach((node, index) => {
      const el = node as HTMLElement;
      let studioId = el.getAttribute('data-studio-id');
      if (!studioId) {
        studioId = `native-${index}-${el.tagName.toLowerCase()}`;
        el.setAttribute('data-studio-id', studioId);
      }

      const shortText = (
        el.innerText ||
        el.getAttribute('alt') ||
        el.tagName
      )
        .trim()
        .slice(0, 22);
      const readableName = shortText
        ? `${el.tagName}: ${shortText}`
        : `Aset ${index + 1} (${el.tagName})`;
      foundList.push({ id: studioId, name: readableName, tag: el.tagName });

      // Terapkan perubahan posisi, teks, gambar, atau visibilitas dari state nativeOverrides
      const ov = currentSlide.nativeOverrides[studioId];
      if (ov) {
        el.style.display = ov.hidden ? 'none' : '';
        el.style.transform = `translate(${ov.xDeltaPct}%, ${ov.yDeltaPct}%)`;
        if (
          ov.customText !== undefined &&
          el.tagName !== 'IMG' &&
          el.children.length === 0
        ) {
          el.innerText = ov.customText;
        }
        if (ov.customImageSrc && el.tagName === 'IMG') {
          (el as HTMLImageElement).src = ov.customImageSrc;
        }
      } else {
        el.style.display = '';
        el.style.transform = '';
      }

      // Highlight biru jika sedang dipilih di Mode Edit
      if (isEditMode && selectedId === studioId) {
        el.style.outline = '2.5px solid #2563EB';
        el.style.outlineOffset = '2px';
        el.style.cursor = 'move';
      } else if (isEditMode) {
        el.style.outline = '';
        el.style.cursor = 'pointer';
      } else {
        el.style.outline = '';
        el.style.cursor = '';
      }
    });

    setDetectedNativeIds(foundList);
  }, [currentSlide.nativeOverrides, isEditMode, selectedId]);

  useEffect(() => {
    const timer = setTimeout(scanAndApplyNativeDOM, 60);
    return () => clearTimeout(timer);
  }, [scanAndApplyNativeDOM, slideIdx, children, isStudioOpen, isAuth]);

  // ==========================================================
  // PEMUTAR ANIMASI TIMELINE (WEB ANIMATIONS API - 60 FPS)
  // ==========================================================
  const playSlideTimeline = useCallback(() => {
    // 1. Putar animasi untuk seluruh elemen kustom
    currentSlide.elements.forEach((el) => {
      if (el.animation.type === 'none') return;
      const domNode = document.getElementById(`studio-el-${el.id}`);
      if (domNode && typeof domNode.animate === 'function') {
        domNode.animate(ANIMATION_KEYFRAMES[el.animation.type], {
          duration: Math.max(100, el.animation.duration * 1000),
          delay: Math.max(0, el.animation.delay * 1000),
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        });
      }
    });

    // 2. Putar animasi untuk aset bawaan slide asli yang diberi animasi
    Object.values(currentSlide.nativeOverrides).forEach((ov) => {
      if (!ov.animation || ov.animation.type === 'none' || ov.hidden) return;
      const domNode = nativeContentRef.current?.querySelector(
        `[data-studio-id="${ov.selectorId}"]`
      ) as HTMLElement | null;
      if (domNode && typeof domNode.animate === 'function') {
        domNode.animate(ANIMATION_KEYFRAMES[ov.animation.type], {
          duration: Math.max(100, ov.animation.duration * 1000),
          delay: Math.max(0, ov.animation.delay * 1000),
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        });
      }
    });
  }, [currentSlide.elements, currentSlide.nativeOverrides]);

  // Otomatis putar animasi saat pindah slide
  useEffect(() => {
    const t = setTimeout(playSlideTimeline, 120);
    return () => clearTimeout(t);
  }, [slideIdx, playSlideTimeline]);

  // ==========================================================
  // INTERAKSI KLIK & GESER ASET BAWAAN SLIDE ASLI DI KANVAS
  // ==========================================================
  const handleNativeCanvasPointerDown = (e: React.PointerEvent) => {
    if (!isEditMode || !canvasContainerRef.current) return;
    const target = (e.target as HTMLElement).closest(
      '[data-studio-id]'
    ) as HTMLElement | null;
    if (!target) {
      setSelectedId(null);
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    const studioId = target.getAttribute('data-studio-id')!;
    setSelectedId(studioId);

    const existingOv: NativeNodeOverride = currentSlide.nativeOverrides[
      studioId
    ] || {
      selectorId: studioId,
      name:
        (target.innerText || target.getAttribute('alt') || target.tagName)
          .trim()
          .slice(0, 20) || studioId,
      tagName: target.tagName,
      xDeltaPct: 0,
      yDeltaPct: 0,
      hidden: false,
      customText:
        target.tagName !== 'IMG' && target.children.length === 0
          ? target.innerText
          : undefined,
      customImageSrc:
        target.tagName === 'IMG'
          ? (target as HTMLImageElement).src
          : undefined,
      animation: { type: 'none', delay: 0, duration: 0.6 },
    };

    const CommitInitialSelection = () => {
      if (!currentSlide.nativeOverrides[studioId]) {
        commitData((prev) => {
          const slides = [...prev.slides];
          slides[slideIdx] = {
            ...slides[slideIdx],
            nativeOverrides: {
              ...slides[slideIdx].nativeOverrides,
              [studioId]: existingOv,
            },
          };
          return { ...prev, slides };
        });
      }
    };
    CommitInitialSelection();

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    let nextX = existingOv.xDeltaPct;
    let nextY = existingOv.yDeltaPct;

    const onMove = (me: PointerEvent) => {
      const dx = ((me.clientX - startX) / rect.width) * 100;
      const dy = ((me.clientY - startY) / rect.height) * 100;
      nextX = Number((existingOv.xDeltaPct + dx).toFixed(2));
      nextY = Number((existingOv.yDeltaPct + dy).toFixed(2));
      target.style.transform = `translate(${nextX}%, ${nextY}%)`;
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      commitData((prev) => {
        const slides = [...prev.slides];
        slides[slideIdx] = {
          ...slides[slideIdx],
          nativeOverrides: {
            ...slides[slideIdx].nativeOverrides,
            [studioId]: { ...existingOv, xDeltaPct: nextX, yDeltaPct: nextY },
          },
        };
        return { ...prev, slides };
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const updateNativeOverride = (
    studioId: string,
    partial: Partial<NativeNodeOverride>
  ) => {
    commitData((prev) => {
      const slides = [...prev.slides];
      const existing = slides[slideIdx].nativeOverrides[studioId] || {
        selectorId: studioId,
        name: studioId,
        tagName: 'DIV',
        xDeltaPct: 0,
        yDeltaPct: 0,
        hidden: false,
        animation: { type: 'none', delay: 0, duration: 0.6 },
      };
      slides[slideIdx] = {
        ...slides[slideIdx],
        nativeOverrides: {
          ...slides[slideIdx].nativeOverrides,
          [studioId]: { ...existing, ...partial },
        },
      };
      return { ...prev, slides };
    });
  };

  // ==========================================================
  // MANIPULASI ELEMEN BARU (TAMBAH, GESER, RESIZE, HAPUS)
  // ==========================================================
  const updateCustomTransient = (id: string, part: Partial<CanvasElement>) => {
    setData((prev) => {
      const slides = [...prev.slides];
      slides[slideIdx] = {
        ...slides[slideIdx],
        elements: slides[slideIdx].elements.map((el) =>
          el.id === id ? { ...el, ...part } : el
        ),
      };
      return { ...prev, slides };
    });
  };

  const commitCustomElement = (id: string, part: Partial<CanvasElement>) => {
    commitData((prev) => {
      const slides = [...prev.slides];
      slides[slideIdx] = {
        ...slides[slideIdx],
        elements: slides[slideIdx].elements.map((el) =>
          el.id === id ? { ...el, ...part } : el
        ),
      };
      return { ...prev, slides };
    });
  };

  const addCustomElement = (type: CanvasElement['type']) => {
    const id = `el-${Date.now()}`;
    const newEl: CanvasElement = {
      id,
      name:
        type === 'text'
          ? 'Teks'
          : type === 'image-button'
            ? 'Tombol Gambar'
            : type === 'image'
              ? 'Gambar'
              : 'Tombol Audio',
      type,
      x: 36,
      y: 36,
      width: type === 'text' ? 28 : 20,
      height: type === 'text' ? 10 : 18,
      zIndex: currentSlide.elements.length + 20,
      locked: false,
      label:
        type === 'text'
          ? 'Klik 2x untuk Edit Teks'
          : type === 'image-button'
            ? 'Tombol Baru'
            : type === 'audio-button'
              ? 'Putar Audio'
              : '',
      imageUrl:
        type === 'image-button' || type === 'image'
          ? 'mobile/5fD3uOAkxBz.png'
          : undefined,
      bgColor: type === 'text' ? '#FFFFFF' : '#2563EB',
      textColor: type === 'text' ? '#0F172A' : '#FFFFFF',
      fontSize: 16,
      borderRadius: 12,
      actionType: 'none',
      animation: { type: 'fade-in', delay: 0, duration: 0.6 },
    };

    commitData((prev) => {
      const slides = [...prev.slides];
      slides[slideIdx] = {
        ...slides[slideIdx],
        elements: [...slides[slideIdx].elements, newEl],
      };
      return { ...prev, slides };
    });
    setSelectedId(id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    if (selectedId.startsWith('native-')) {
      updateNativeOverride(selectedId, { hidden: true });
      setSelectedId(null);
      notify('Aset disembunyikan (Bisa dipulihkan di Timeline)');
    } else {
      commitData((prev) => {
        const slides = [...prev.slides];
        slides[slideIdx] = {
          ...slides[slideIdx],
          elements: slides[slideIdx].elements.filter(
            (e) => e.id !== selectedId
          ),
        };
        return { ...prev, slides };
      });
      setSelectedId(null);
    }
  };

  // Drag & 8-Point Resize Elemen Kustom
  const handleCustomPointerDown = (
    e: React.PointerEvent,
    el: CanvasElement,
    mode: 'move' | ResizeDir
  ) => {
    if (!isEditMode || editingTextId === el.id) return;
    e.stopPropagation();
    setSelectedId(el.id);
    if (el.locked || !canvasContainerRef.current) return;

    const dom = e.currentTarget as HTMLElement;
    try {
      dom.setPointerCapture(e.pointerId);
    } catch {}
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const init = { x: el.x, y: el.y, width: el.width, height: el.height };
    let latest = { ...init };

    const onMove = (me: PointerEvent) => {
      const dx = ((me.clientX - startX) / rect.width) * 100;
      const dy = ((me.clientY - startY) / rect.height) * 100;
      let { x: nx, y: ny, width: nw, height: nh } = init;

      if (mode === 'move') {
        nx = Math.max(0, Math.min(100 - init.width, init.x + dx));
        ny = Math.max(0, Math.min(100 - init.height, init.y + dy));
      } else {
        const min = 4;
        if (mode.includes('e'))
          nw = Math.max(min, Math.min(100 - init.x, init.width + dx));
        if (mode.includes('s'))
          nh = Math.max(min, Math.min(100 - init.y, init.height + dy));
        if (mode.includes('w')) {
          const d = Math.max(-init.x, Math.min(init.width - min, dx));
          nx = init.x + d;
          nw = init.width - d;
        }
        if (mode.includes('n')) {
          const d = Math.max(-init.y, Math.min(init.height - min, dy));
          ny = init.y + d;
          nh = init.height - d;
        }
      }
      latest = {
        x: Number(nx.toFixed(2)),
        y: Number(ny.toFixed(2)),
        width: Number(nw.toFixed(2)),
        height: Number(nh.toFixed(2)),
      };
      updateCustomTransient(el.id, latest);
    };

    const onUp = (ue: PointerEvent) => {
      try {
        dom.releasePointerCapture(ue.pointerId);
      } catch {}
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      commitCustomElement(el.id, latest);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // ==========================================================
  // MANAJEMEN SLIDE ALA CANVA (TAMBAH, DUPLIKAT, HAPUS)
  // ==========================================================
  const addBlankOrCloneSlide = (cloneCurrent: boolean) => {
    commitData((prev) => {
      const source = prev.slides[slideIdx];
      const nextNum = prev.slides.length + 1;
      const newSlide: SlideItem =
        cloneCurrent && source
          ? {
              ...JSON.parse(JSON.stringify(source)),
              id: `slide-${Date.now()}`,
              title: `${source.title} (Salinan)`,
            }
          : {
              id: `slide-${Date.now()}`,
              title: `Slide ${nextNum}`,
              bgColor: '#FFFFFF',
              isCustomBlank: false,
              elements: [],
              nativeOverrides: {},
            };
      return { ...prev, slides: [...prev.slides, newSlide] };
    });
    setSlideIdx(data.slides.length);
    notify(
      cloneCurrent ? 'Slide berhasil diduplikasi!' : 'Slide baru ditambahkan!'
    );
  };

  const deleteSlideAt = (idx: number) => {
    if (data.slides.length <= 1) return;
    commitData((prev) => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== idx),
    }));
    setSlideIdx((p) => Math.max(0, p - 1));
  };

  // Upload Media (Supabase Storage + Base64 Fallback)
  const uploadMedia = async (file: File): Promise<string> => {
    if (supabase) {
      try {
        const ext = file.name.split('.').pop() || 'bin';
        const path = `uploads/${Date.now()}.${ext}`;
        const { error } = await supabase.storage
          .from('media-assets')
          .upload(path, file);
        if (!error) {
          const { data: pub } = supabase.storage
            .from('media-assets')
            .getPublicUrl(path);
          if (pub?.publicUrl) return pub.publicUrl;
        }
      } catch {}
    }
    return new Promise((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const saveToSupabase = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (supabase) {
        await supabase.from('app_contents').upsert(
          {
            slug: 'main',
            content_data: data,
            version: data.version + 1,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        );
      }
      notify('Berhasil disimpan & dipublikasikan!');
    } catch {
      notify('Tersimpan di memori lokal browser.');
    } finally {
      setIsSaving(false);
    }
  };

  // Ambil aset asli slide dari defaultContent agar 100% tampil di dalam kanvas 16:9
  const rawSlideDef = defaultContent?.slides?.[currentSlide.id];

  // Render Isi Kanvas Utama (Dipakai Bersama oleh Mode Publik & Mode Editor)
  const renderUnifiedSlideStage = () => (
    <div
      ref={canvasContainerRef}
      data-testid="studio-canvas-stage"
      onPointerDown={handleNativeCanvasPointerDown}
      style={{ backgroundColor: currentSlide.bgColor || '#FFFFFF' }}
      className="relative w-full h-full overflow-hidden select-none"
    >
      {/* 1. Lapisan Aset & Komponen Slide Asli (100% Tampil Utuh) */}
      <div ref={nativeContentRef} className="w-full h-full relative">
        {children}

        {/* Render aset visual asli dari slide aktif agar dapat diklik & diedit langsung di kanvas 16:9 */}
        {rawSlideDef && (
          <div className="w-full h-full relative p-4 flex flex-col justify-between">
            {/* Gambar-gambar Asli Slide */}
            <div className="relative w-full h-full flex flex-wrap items-center justify-center gap-3">
              {(rawSlideDef.images || []).map((img, i) => (
                <img
                  key={img.objectId || i}
                  data-testid={`canvas-el-native:native-${i}-img`}
                  src={img.url}
                  alt={img.altText || `${currentSlide.title} aset ${i + 1}`}
                  draggable={false}
                  style={{
                    maxWidth: i === 0 ? '88%' : '28%',
                    maxHeight: i === 0 ? '72%' : '34%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              ))}
              {(rawSlideDef.images || []).length === 0 &&
                (rawSlideDef.videos || []).map((vid, i) => (
                  <img
                    key={vid.objectId || i}
                    data-testid={`canvas-el-native:native-${i}-img`}
                    src={
                      vid.posterUrl ||
                      rawSlideDef.backgroundUrl ||
                      'mobile/Slide5WPRbcJDCqY.jpg'
                    }
                    alt={`Video Slide: ${currentSlide.title}`}
                    draggable={false}
                    style={{
                      maxWidth: '88%',
                      maxHeight: '72%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                    }}
                  />
                ))}
            </div>

            {/* Teks & Tombol Bawaan Slide Asli */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 bg-white/90 p-2 rounded-xl border border-slate-200/80">
              <h2
                data-testid="canvas-el-native:native-heading"
                className="text-sm font-bold text-slate-900 px-2 py-1"
              >
                {currentSlide.title}
              </h2>
              {(rawSlideDef.texts || []).slice(0, 6).map((tb, idx) => (
                <p
                  key={tb.objectId || idx}
                  data-testid={`canvas-el-native:native-text-${idx}`}
                  className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                >
                  {tb.lines.join(' ')}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Lapisan Elemen Kanvas Tambahan */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {currentSlide.elements.map((el) => {
          const isSelected = isEditMode && selectedId === el.id;
          return (
            <div
              id={`studio-el-${el.id}`}
              data-testid={`canvas-el-${el.id}`}
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                zIndex: el.zIndex,
              }}
              onPointerDown={(e) => handleCustomPointerDown(e, el, 'move')}
              onDoubleClick={(e) => {
                if (isEditMode) {
                  e.stopPropagation();
                  setEditingTextId(el.id);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditMode) {
                  setSelectedId(el.id);
                  return;
                }
                if (el.audioUrl) new Audio(el.audioUrl).play().catch(() => {});
                if (
                  el.actionType === 'goto-slide' &&
                  typeof el.targetSlide === 'number'
                ) {
                  setSlideIdx(el.targetSlide);
                }
                if (el.actionType === 'open-popup') {
                  setPopup({
                    title: el.popupTitle || el.label,
                    content: el.popupContent || '',
                  });
                }
              }}
              className={`absolute pointer-events-auto ${
                isEditMode
                  ? 'cursor-move'
                  : 'cursor-pointer transition-transform hover:scale-[1.02]'
              }`}
            >
              <div
                style={{
                  backgroundColor: el.bgColor,
                  color: el.textColor,
                  borderRadius: `${el.borderRadius}px`,
                  fontSize: `${el.fontSize}px`,
                }}
                className={`w-full h-full flex flex-col items-center justify-center overflow-hidden shadow-md font-semibold ${
                  isSelected
                    ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-white'
                    : isEditMode
                      ? 'hover:ring-1 hover:ring-blue-400'
                      : ''
                }`}
              >
                {(el.type === 'image-button' || el.type === 'image') &&
                  el.imageUrl && (
                    <img
                      src={el.imageUrl}
                      alt={el.label}
                      draggable={false}
                      className={`w-full ${
                        el.label ? 'h-3/4' : 'h-full'
                      } object-cover pointer-events-none`}
                    />
                  )}
                {el.type === 'audio-button' && (
                  <Volume2 className="w-6 h-6 mb-1" />
                )}
                {el.type !== 'image' && (
                  <div className="px-2 py-1 text-center w-full truncate">
                    {editingTextId === el.id ? (
                      <input
                        type="text"
                        autoFocus
                        data-testid={`inline-text-editor-${el.id}`}
                        value={el.label}
                        onChange={(e) =>
                          updateCustomTransient(el.id, {
                            label: e.target.value,
                          })
                        }
                        onBlur={() => {
                          setEditingTextId(null);
                          commitCustomElement(el.id, { label: el.label });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingTextId(null);
                            commitCustomElement(el.id, { label: el.label });
                          }
                        }}
                        className="w-full bg-white text-slate-900 text-center rounded px-1 outline-none ring-2 ring-blue-500"
                      />
                    ) : (
                      <span>{el.label}</span>
                    )}
                  </div>
                )}
              </div>

              {/* 8 Titik Resize (Gaya Canva Putih-Biru) */}
              {isSelected &&
                !el.locked &&
                RESIZE_HANDLES.map((h) => (
                  <div
                    key={h.dir}
                    data-testid={`resize-handle-${el.id}-${h.dir}`}
                    onPointerDown={(e) => handleCustomPointerDown(e, el, h.dir)}
                    className={`absolute w-3 h-3 bg-white border-2 border-blue-600 rounded-full shadow z-50 ${h.cls}`}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==========================================================
  // MODE 1: TAMPILAN PUBLIK PENUH (TANPA DASHBOARD)
  // ==========================================================
  if (!isStudioOpen) {
    return (
      <StudioContext.Provider
        value={{
          activeSlideIndex: slideIdx,
          setActiveSlideIndex: setSlideIdx,
          totalSlides: data.slides.length,
        }}
      >
        {children}
      </StudioContext.Provider>
    );
  }

  // ==========================================================
  // MODE 2: LOGIN PIN ADMIN (MINIMALIS PUTIH)
  // ==========================================================
  if (!isAuth) {
    return (
      <div
        data-testid="admin-pin-gate"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2147483647,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <style>{CANVA_STUDIO_SCOPED_CSS}</style>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pin === ADMIN_PIN) {
              setIsAuth(true);
              setIsEditMode(true);
            } else {
              notify('PIN salah (Default: 123456)');
            }
          }}
          className="canva-white-studio-scope bg-white border border-slate-200 rounded-2xl p-6 max-w-xs w-full text-center shadow-xl"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '320px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
          }}
        >
          <h3 className="font-bold text-slate-900 text-base mb-1">
            Admin Editor
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Masukkan PIN Admin (Default: 123456)
          </p>
          <input
            id="admin-pin-input"
            type="password"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••••"
            className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-center text-slate-900 mb-4 outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsStudioOpen(false);
                onCloseAdmin?.();
              }}
              className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              data-testid="admin-pin-submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              Masuk
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================================
  // MODE 3: DASHBOARD ADMIN PUTIH MINIMALIS & FUNGSIONAL (CANVA LIGHT)
  // ==========================================================
  return (
    <StudioContext.Provider
      value={{
        activeSlideIndex: slideIdx,
        setActiveSlideIndex: setSlideIdx,
        totalSlides: data.slides.length,
      }}
    >
      <style>{CANVA_STUDIO_SCOPED_CSS}</style>
      <div
        data-testid="visual-studio-admin"
        className="canva-white-studio-scope fixed inset-0 z-50 bg-[#F8FAFC] text-slate-800 flex flex-col select-none overflow-hidden font-sans"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2147483647,
          backgroundColor: '#F8FAFC',
          color: '#1E293B',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Notifikasi Ringkas */}
        {toast && (
          <div
            data-testid="studio-status-toast"
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        {/* 1. TOP TOOLBAR PUTIH MINIMALIS (OTOMATIS MENAMPILKAN ALAT EDIT SAAT ELEMEN DIKLIK) */}
        <header
          data-testid="studio-top-command-bar"
          style={{ backgroundColor: '#FFFFFF' }}
          className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-2xs"
        >
          {/* Kiri: Judul Slide & Undo/Redo */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-blue-600 tracking-tight mr-2">
              SlideStudio
            </span>
            <button
              type="button"
              data-testid="btn-studio-undo"
              onClick={undo}
              disabled={histIdx <= 0}
              title="Undo"
              className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 text-slate-700"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              data-testid="btn-studio-redo"
              onClick={redo}
              disabled={histIdx >= history.length - 1}
              title="Redo"
              className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-30 text-slate-700"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1" />
            <span className="text-xs font-semibold text-slate-500">
              {currentSlide.title}
            </span>
          </div>

          {/* Tengah: Contextual Quick Edit Bar (Muncul Saat Elemen di Kanvas Diklik) */}
          <div
            data-testid="studio-right-inspector"
            className="flex items-center gap-2"
          >
            {selectedCustomEl && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-xs">
                <input
                  type="text"
                  data-testid="inspector-label-input"
                  value={selectedCustomEl.label}
                  onChange={(e) =>
                    commitCustomElement(selectedCustomEl.id, {
                      label: e.target.value,
                    })
                  }
                  placeholder="Teks elemen..."
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs w-36 outline-none focus:border-blue-600"
                />
                <input
                  type="color"
                  title="Warna Latar"
                  data-testid="inspector-bg-color"
                  value={
                    selectedCustomEl.bgColor.startsWith('#')
                      ? selectedCustomEl.bgColor
                      : '#2563EB'
                  }
                  onChange={(e) =>
                    commitCustomElement(selectedCustomEl.id, {
                      bgColor: e.target.value,
                    })
                  }
                  className="w-6 h-6 rounded cursor-pointer border border-slate-300 bg-white"
                />
                <input
                  type="number"
                  title="Ukuran Teks"
                  value={selectedCustomEl.fontSize}
                  onChange={(e) =>
                    commitCustomElement(selectedCustomEl.id, {
                      fontSize: Number(e.target.value),
                    })
                  }
                  className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                />
                {(selectedCustomEl.type === 'image-button' ||
                  selectedCustomEl.type === 'image') && (
                  <label className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer font-semibold text-blue-600 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Ganti Gambar</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f)
                          commitCustomElement(selectedCustomEl.id, {
                            imageUrl: await uploadMedia(f),
                          });
                      }}
                      className="hidden"
                    />
                  </label>
                )}
                <select
                  value={selectedCustomEl.animation.type}
                  onChange={(e) =>
                    commitCustomElement(selectedCustomEl.id, {
                      animation: {
                        ...selectedCustomEl.animation,
                        type: e.target.value as AnimationType,
                      },
                    })
                  }
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium"
                >
                  <option value="none">Tanpa Animasi</option>
                  <option value="fade-in">Animasi: Fade In</option>
                  <option value="zoom-in">Animasi: Zoom In</option>
                  <option value="slide-up">Animasi: Slide Up</option>
                  <option value="slide-left">Animasi: Slide Left</option>
                  <option value="bounce">Animasi: Bounce</option>
                </select>
                <button
                  type="button"
                  onClick={deleteSelected}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                  title="Hapus Elemen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {selectedNativeOv && (
              <div className="flex items-center gap-2 bg-blue-50/70 border border-blue-200 px-3 py-1 rounded-xl text-xs">
                <span className="font-bold text-blue-700 truncate max-w-[120px]">
                  {selectedNativeOv.name}
                </span>
                {selectedNativeOv.tagName !== 'IMG' && (
                  <input
                    type="text"
                    data-testid="inspector-native-text-input"
                    value={selectedNativeOv.customText ?? ''}
                    onChange={(e) =>
                      updateNativeOverride(selectedNativeOv.selectorId, {
                        customText: e.target.value,
                      })
                    }
                    placeholder="Ubah teks..."
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs w-40 outline-none"
                  />
                )}
                {selectedNativeOv.tagName === 'IMG' && (
                  <label className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer font-semibold text-blue-600 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Ganti Gambar Asli</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f)
                          updateNativeOverride(selectedNativeOv.selectorId, {
                            customImageSrc: await uploadMedia(f),
                          });
                      }}
                      className="hidden"
                    />
                  </label>
                )}
                <select
                  value={selectedNativeOv.animation?.type || 'none'}
                  onChange={(e) =>
                    updateNativeOverride(selectedNativeOv.selectorId, {
                      animation: {
                        ...(selectedNativeOv.animation || {
                          delay: 0,
                          duration: 0.6,
                        }),
                        type: e.target.value as AnimationType,
                      },
                    })
                  }
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium"
                >
                  <option value="none">Tanpa Animasi</option>
                  <option value="fade-in">Animasi: Fade In</option>
                  <option value="zoom-in">Animasi: Zoom In</option>
                  <option value="slide-up">Animasi: Slide Up</option>
                  <option value="slide-left">Animasi: Slide Left</option>
                  <option value="bounce">Animasi: Bounce</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    updateNativeOverride(selectedNativeOv.selectorId, {
                      xDeltaPct: 0,
                      yDeltaPct: 0,
                    })
                  }
                  title="Reset Posisi Asli"
                  className="p-1.5 text-slate-600 hover:bg-white rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={deleteSelected}
                  className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg"
                  title="Sembunyikan Aset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Kanan: Putar Timeline, Mode Preview & Simpan */}
          <div className="flex items-center gap-2">
            {(onSwitchToClassicTab || onOpenClassicTab) && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  type="button"
                  data-testid="btn-switch-quiz-tab"
                  onClick={() => {
                    onSwitchToClassicTab?.('quiz');
                    onOpenClassicTab?.('quiz');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Kuis
                </button>
                <button
                  type="button"
                  data-testid="btn-switch-audio-tab"
                  onClick={() => {
                    onSwitchToClassicTab?.('audio');
                    onOpenClassicTab?.('media');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Audio
                </button>
                <button
                  type="button"
                  data-testid="btn-switch-json-tab"
                  onClick={() => {
                    onSwitchToClassicTab?.('json');
                    onOpenClassicTab?.('backup');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  JSON
                </button>
              </div>
            )}

            <button
              type="button"
              data-testid="btn-play-timeline-preview"
              onClick={playSlideTimeline}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              <span>Putar Animasi</span>
            </button>

            <button
              type="button"
              data-testid={
                isEditMode ? 'btn-mode-live-preview' : 'btn-mode-edit-canvas'
              }
              onClick={() => {
                setIsEditMode(!isEditMode);
                setSelectedId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                isEditMode
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  : 'bg-emerald-600 border-emerald-600 text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Coba Klik Publik' : 'Kembali Edit'}</span>
            </button>

            <button
              type="button"
              data-testid="btn-publish-supabase"
              onClick={saveToSupabase}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
            </button>

            <button
              type="button"
              data-testid="btn-exit-studio"
              onClick={() => {
                setIsEditMode(false);
                setIsStudioOpen(false);
                onCloseAdmin?.();
              }}
              title="Tutup Editor"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 2. AREA TENGAH: TOOLBAR KIRI SEDERHANA + KANVAS BESAR UTAMA */}
        <div className="flex-1 flex overflow-hidden">
          {/* Toolbar Kiri Putih Minimalis (Langsung Klik Tanpa Drawer Rumit) */}
          <aside
            data-testid="studio-left-dock"
            style={{ backgroundColor: '#FFFFFF' }}
            className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-3 shrink-0"
          >
            <button
              type="button"
              data-testid="btn-add-text-element"
              onClick={() => addCustomElement('text')}
              className="w-14 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex flex-col items-center gap-1 text-[11px] font-semibold transition"
            >
              <Type className="w-5 h-5 text-blue-600" />
              <span>+ Teks</span>
            </button>

            <button
              type="button"
              data-testid="btn-add-image-button"
              onClick={() => addCustomElement('image-button')}
              className="w-14 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex flex-col items-center gap-1 text-[11px] font-semibold transition"
            >
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <span>+ Tombol</span>
            </button>

            <button
              type="button"
              data-testid="btn-add-image-element"
              onClick={() => addCustomElement('image')}
              className="w-14 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex flex-col items-center gap-1 text-[11px] font-semibold transition"
            >
              <Plus className="w-5 h-5 text-blue-600" />
              <span>+ Gambar</span>
            </button>

            <button
              type="button"
              data-testid="btn-add-audio-button"
              onClick={() => addCustomElement('audio-button')}
              className="w-14 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex flex-col items-center gap-1 text-[11px] font-semibold transition"
            >
              <Volume2 className="w-5 h-5 text-blue-600" />
              <span>+ Audio</span>
            </button>
          </aside>

          {/* Kanvas Utama Besar (Menampilkan 100% Isi & Aset Slide Seperti Publik) */}
          <main
            data-testid="studio-center-workspace"
            style={{ backgroundColor: '#F1F5F9' }}
            onClick={() => setSelectedId(null)}
            className="flex-1 bg-[#F1F5F9] flex items-center justify-center p-4 overflow-auto"
          >
            <div
              data-testid="studio-stage-16-9"
              className="relative w-full max-w-5xl aspect-video bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden"
            >
              {renderUnifiedSlideStage()}
            </div>
          </main>
        </div>

        {/* 3. PANEL BAWAH PUTIH: TIMELINE ANIMASI ELEMEN & SLIDE STRIP ALA CANVA */}
        <footer
          data-testid="canva-bottom-footer"
          style={{ backgroundColor: '#FFFFFF' }}
          className="bg-white border-t border-slate-200 shrink-0"
        >
          {/* Bar Header Panel Bawah */}
          <div className="h-9 px-4 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <button
                type="button"
                data-testid="tab-bottom-timeline"
                onClick={() => {
                  setBottomTab('timeline');
                  setIsBottomOpen(true);
                }}
                className={`h-9 flex items-center gap-1.5 font-bold border-b-2 transition ${
                  bottomTab === 'timeline' && isBottomOpen
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Timeline & Animasi Elemen (
                  {currentSlide.elements.length + detectedNativeIds.length})
                </span>
              </button>

              <button
                type="button"
                data-testid="tab-bottom-slides"
                onClick={() => {
                  setBottomTab('slides');
                  setIsBottomOpen(true);
                }}
                className={`h-9 flex items-center gap-1.5 font-bold border-b-2 transition ${
                  bottomTab === 'slides' && isBottomOpen
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Halaman Slide ({data.slides.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsBottomOpen(!isBottomOpen)}
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              {isBottomOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Isi Panel Bawah */}
          {isBottomOpen && (
            <div className="h-44 overflow-y-auto px-4 py-3">
              {/* TAB 1: TIMELINE ANIMASI SETIAP ELEMEN DI SLIDE */}
              {bottomTab === 'timeline' && (
                <div
                  data-testid="canva-timeline-panel"
                  className="space-y-1.5"
                >
                  {/* Daftar Elemen Tambahan */}
                  {currentSlide.elements.map((el) => (
                    <div
                      key={el.id}
                      data-testid={`timeline-row-${el.id}`}
                      onClick={() => setSelectedId(el.id)}
                      className={`grid grid-cols-12 items-center gap-3 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                        selectedId === el.id
                          ? 'bg-blue-50/70 border-blue-400'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="col-span-3 font-semibold text-slate-800 truncate">
                        {el.label || el.name}
                      </div>
                      <div className="col-span-3 flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          data-testid={`timeline-anim-type-${el.id}`}
                          value={el.animation.type}
                          onChange={(e) =>
                            commitCustomElement(el.id, {
                              animation: {
                                ...el.animation,
                                type: e.target.value as AnimationType,
                              },
                            })
                          }
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs"
                        >
                          <option value="none">Tanpa Animasi</option>
                          <option value="fade-in">Fade In</option>
                          <option value="zoom-in">Zoom In</option>
                          <option value="slide-up">Slide Up</option>
                          <option value="slide-left">Slide Left</option>
                          <option value="bounce">Bounce</option>
                        </select>
                      </div>
                      <div className="col-span-4 flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          Mulai (s):
                        </span>
                        <input
                          type="number"
                          step="0.2"
                          min="0"
                          data-testid={`timeline-anim-delay-${el.id}`}
                          value={el.animation.delay}
                          onChange={(e) =>
                            commitCustomElement(el.id, {
                              animation: {
                                ...el.animation,
                                delay: Number(e.target.value),
                              },
                            })
                          }
                          className="w-14 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center"
                        />
                        <span className="text-[11px] text-slate-500">
                          Durasi (s):
                        </span>
                        <input
                          type="number"
                          step="0.2"
                          min="0.2"
                          data-testid={`timeline-anim-duration-${el.id}`}
                          value={el.animation.duration}
                          onChange={(e) =>
                            commitCustomElement(el.id, {
                              animation: {
                                ...el.animation,
                                duration: Number(e.target.value),
                              },
                            })
                          }
                          className="w-14 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-center"
                        />
                      </div>
                      {/* Visual Bar Timeline */}
                      <div className="col-span-2 bg-slate-100 h-3 rounded-full overflow-hidden relative">
                        <div
                          style={{
                            left: `${Math.min(80, el.animation.delay * 20)}%`,
                            width: `${Math.min(
                              100,
                              el.animation.duration * 30
                            )}%`,
                          }}
                          className="absolute inset-y-0 bg-blue-600 rounded-full"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Daftar Aset Bawaan Slide Asli */}
                  {detectedNativeIds.map((nat) => {
                    const ov = currentSlide.nativeOverrides[nat.id];
                    const anim = ov?.animation || {
                      type: 'none',
                      delay: 0,
                      duration: 0.6,
                    };
                    return (
                      <div
                        key={nat.id}
                        data-testid={`timeline-row-${nat.id}`}
                        onClick={() => setSelectedId(nat.id)}
                        className={`grid grid-cols-12 items-center gap-3 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                          selectedId === nat.id
                            ? 'bg-blue-50/70 border-blue-400'
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="col-span-3 font-medium text-slate-700 truncate flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold">
                            Asli
                          </span>
                          <span
                            className={
                              ov?.hidden ? 'line-through text-slate-400' : ''
                            }
                          >
                            {nat.name}
                          </span>
                        </div>
                        <div className="col-span-3 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-slate-400" />
                          <select
                            data-testid={`timeline-anim-type-${nat.id}`}
                            value={anim.type}
                            onChange={(e) =>
                              updateNativeOverride(nat.id, {
                                name: nat.name,
                                tagName: nat.tag,
                                animation: {
                                  ...anim,
                                  type: e.target.value as AnimationType,
                                },
                              })
                            }
                            className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs"
                          >
                            <option value="none">Tanpa Animasi</option>
                            <option value="fade-in">Fade In</option>
                            <option value="zoom-in">Zoom In</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="slide-left">Slide Left</option>
                            <option value="bounce">Bounce</option>
                          </select>
                        </div>
                        <div className="col-span-4 flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">
                            Mulai (s):
                          </span>
                          <input
                            type="number"
                            step="0.2"
                            min="0"
                            data-testid={`timeline-anim-delay-${nat.id}`}
                            value={anim.delay}
                            onChange={(e) =>
                              updateNativeOverride(nat.id, {
                                name: nat.name,
                                tagName: nat.tag,
                                animation: {
                                  ...anim,
                                  delay: Number(e.target.value),
                                },
                              })
                            }
                            className="w-14 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center"
                          />
                          <span className="text-[11px] text-slate-500">
                            Durasi (s):
                          </span>
                          <input
                            type="number"
                            step="0.2"
                            min="0.2"
                            data-testid={`timeline-anim-duration-${nat.id}`}
                            value={anim.duration}
                            onChange={(e) =>
                              updateNativeOverride(nat.id, {
                                name: nat.name,
                                tagName: nat.tag,
                                animation: {
                                  ...anim,
                                  duration: Number(e.target.value),
                                },
                              })
                            }
                            className="w-14 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center"
                          />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          {ov?.hidden && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateNativeOverride(nat.id, { hidden: false });
                              }}
                              className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold"
                            >
                              Tampilkan Lagi
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: STRIP HALAMAN SLIDE ALA CANVA */}
              {bottomTab === 'slides' && (
                <div
                  data-testid="canva-slide-strip"
                  className="flex items-center gap-3 overflow-x-auto pb-1"
                >
                  {data.slides.map((s, idx) => (
                    <div
                      key={s.id}
                      data-testid={`slide-item-${s.id}`}
                      onClick={() => {
                        setSlideIdx(idx);
                        onSelectSlideId?.(s.id);
                      }}
                      className={`group relative w-40 h-24 rounded-xl border-2 p-2.5 flex flex-col justify-between cursor-pointer shrink-0 transition ${
                        slideIdx === idx
                          ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">
                          Slide {idx + 1}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            title="Duplikat Slide"
                            data-testid={`btn-duplicate-slide-${s.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSlideIdx(idx);
                              addBlankOrCloneSlide(true);
                            }}
                            className="p-1 bg-white rounded hover:bg-slate-100 text-slate-600 shadow-2xs"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {data.slides.length > 1 && (
                            <button
                              type="button"
                              title="Hapus Slide"
                              data-testid={`btn-delete-slide-${s.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSlideAt(idx);
                              }}
                              className="p-1 bg-white rounded hover:bg-rose-50 text-rose-600 shadow-2xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        value={s.title}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value;
                          commitData((prev) => {
                            const slides = [...prev.slides];
                            slides[idx] = { ...slides[idx], title: val };
                            return { ...prev, slides };
                          });
                        }}
                        className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-700 outline-none"
                      />
                    </div>
                  ))}

                  {/* Tombol Tambah Slide & Duplikat Slide Ala Canva */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      data-testid="btn-add-slide"
                      onClick={() => addBlankOrCloneSlide(false)}
                      className="h-11 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-600 hover:text-blue-600 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Slide</span>
                    </button>
                    <button
                      type="button"
                      data-testid="btn-duplicate-current-slide"
                      onClick={() => addBlankOrCloneSlide(true)}
                      className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplikat Slide Ini</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </footer>

        {/* Modal Pop-up Saat Tombol Interaktif Diklik */}
        {popup && (
          <div
            data-testid="canvas-action-popup"
            onClick={() => setPopup(null)}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 text-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                <h3 className="font-bold text-blue-600">{popup.title}</h3>
                <button type="button" onClick={() => setPopup(null)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {popup.content}
              </p>
            </div>
          </div>
        )}
      </div>
    </StudioContext.Provider>
  );
};

// Scoped Tailwind utility stylesheet for CanvaStudio so it renders with 100% accuracy
// without modifying index.html / story.html or leaking styles into Storyline player.
const CANVA_STUDIO_SCOPED_CSS = `
.canva-white-studio-scope, .canva-white-studio-scope *, .canva-white-studio-scope *::before, .canva-white-studio-scope *::after {
  box-sizing: border-box;
}
.canva-white-studio-scope {
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 9990;
  display: flex;
  flex-direction: column;
  background-color: #F1F5F9;
  color: #0F172A;
  user-select: none;
}
.canva-white-studio-scope button { background: transparent; border: none; cursor: pointer; font-family: inherit; padding: 0; color: inherit; }
.canva-white-studio-scope button:disabled { opacity: 0.35; cursor: not-allowed; }
.canva-white-studio-scope input, .canva-white-studio-scope select { font-family: inherit; }
.canva-white-studio-scope .fixed { position: fixed; }
.canva-white-studio-scope .absolute { position: absolute; }
.canva-white-studio-scope .relative { position: relative; }
.canva-white-studio-scope .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.canva-white-studio-scope .inset-y-0 { top: 0; bottom: 0; }
.canva-white-studio-scope .top-16 { top: 4rem; }
.canva-white-studio-scope .left-1\\/2 { left: 50%; }
.canva-white-studio-scope .top-1\\/2 { top: 50%; }
.canva-white-studio-scope .-translate-x-1\\/2 { transform: translateX(-50%); }
.canva-white-studio-scope .-translate-y-1\\/2 { transform: translateY(-50%); }
.canva-white-studio-scope .-top-1\\.5 { top: -0.375rem; }
.canva-white-studio-scope .-bottom-1\\.5 { bottom: -0.375rem; }
.canva-white-studio-scope .-left-1\\.5 { left: -0.375rem; }
.canva-white-studio-scope .-right-1\\.5 { right: -0.375rem; }
.canva-white-studio-scope .z-10 { z-index: 10; }
.canva-white-studio-scope .z-50 { z-index: 50; }
.canva-white-studio-scope .flex { display: flex; }
.canva-white-studio-scope .flex-col { flex-direction: column; }
.canva-white-studio-scope .flex-wrap { flex-wrap: wrap; }
.canva-white-studio-scope .flex-1 { flex: 1 1 0%; }
.canva-white-studio-scope .shrink-0 { flex-shrink: 0; }
.canva-white-studio-scope .items-center { align-items: center; }
.canva-white-studio-scope .justify-center { justify-content: center; }
.canva-white-studio-scope .justify-between { justify-content: space-between; }
.canva-white-studio-scope .justify-end { justify-content: flex-end; }
.canva-white-studio-scope .grid { display: grid; }
.canva-white-studio-scope .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
.canva-white-studio-scope .col-span-2 { grid-column: span 2 / span 2; }
.canva-white-studio-scope .col-span-3 { grid-column: span 3 / span 3; }
.canva-white-studio-scope .col-span-4 { grid-column: span 4 / span 4; }
.canva-white-studio-scope .gap-1 { gap: 0.25rem; }
.canva-white-studio-scope .gap-1\\.5 { gap: 0.375rem; }
.canva-white-studio-scope .gap-2 { gap: 0.5rem; }
.canva-white-studio-scope .gap-3 { gap: 0.75rem; }
.canva-white-studio-scope .gap-4 { gap: 1rem; }
.canva-white-studio-scope .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
.canva-white-studio-scope .w-full { width: 100%; }
.canva-white-studio-scope .h-full { height: 100%; }
.canva-white-studio-scope .h-3\\/4 { height: 75%; }
.canva-white-studio-scope .w-3 { width: 0.75rem; }
.canva-white-studio-scope .h-3 { height: 0.75rem; }
.canva-white-studio-scope .w-3\\.5 { width: 0.875rem; }
.canva-white-studio-scope .h-3\\.5 { height: 0.875rem; }
.canva-white-studio-scope .w-4 { width: 1rem; }
.canva-white-studio-scope .h-4 { height: 1rem; }
.canva-white-studio-scope .w-5 { width: 1.25rem; }
.canva-white-studio-scope .h-5 { height: 1.25rem; }
.canva-white-studio-scope .w-6 { width: 1.5rem; }
.canva-white-studio-scope .h-6 { height: 1.5rem; }
.canva-white-studio-scope .w-14 { width: 3.5rem; }
.canva-white-studio-scope .w-20 { width: 5rem; }
.canva-white-studio-scope .w-36 { width: 9rem; }
.canva-white-studio-scope .w-40 { width: 10rem; }
.canva-white-studio-scope .h-9 { height: 2.25rem; }
.canva-white-studio-scope .h-11 { height: 2.75rem; }
.canva-white-studio-scope .h-14 { height: 3.5rem; }
.canva-white-studio-scope .h-24 { height: 6rem; }
.canva-white-studio-scope .h-44 { height: 11rem; }
.canva-white-studio-scope .w-px { width: 1px; }
.canva-white-studio-scope .max-w-xs { max-width: 20rem; }
.canva-white-studio-scope .max-w-md { max-width: 28rem; }
.canva-white-studio-scope .max-w-5xl { max-width: 64rem; }
.canva-white-studio-scope .max-w-\\[120px\\] { max-width: 120px; }
.canva-white-studio-scope .aspect-video { aspect-ratio: 16 / 9; }
.canva-white-studio-scope .p-1 { padding: 0.25rem; }
.canva-white-studio-scope .p-1\\.5 { padding: 0.375rem; }
.canva-white-studio-scope .p-2 { padding: 0.5rem; }
.canva-white-studio-scope .p-2\\.5 { padding: 0.625rem; }
.canva-white-studio-scope .p-4 { padding: 1rem; }
.canva-white-studio-scope .p-6 { padding: 1.5rem; }
.canva-white-studio-scope .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
.canva-white-studio-scope .px-1\\.5 { padding-left: 0.375rem; padding-right: 0.375rem; }
.canva-white-studio-scope .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.canva-white-studio-scope .px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
.canva-white-studio-scope .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.canva-white-studio-scope .px-4 { padding-left: 1rem; padding-right: 1rem; }
.canva-white-studio-scope .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.canva-white-studio-scope .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.canva-white-studio-scope .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.canva-white-studio-scope .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.canva-white-studio-scope .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
.canva-white-studio-scope .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.canva-white-studio-scope .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.canva-white-studio-scope .pb-1 { padding-bottom: 0.25rem; }
.canva-white-studio-scope .pb-3 { padding-bottom: 0.75rem; }
.canva-white-studio-scope .mb-1 { margin-bottom: 0.25rem; }
.canva-white-studio-scope .mb-3 { margin-bottom: 0.75rem; }
.canva-white-studio-scope .mb-4 { margin-bottom: 1rem; }
.canva-white-studio-scope .mr-1 { margin-right: 0.25rem; }
.canva-white-studio-scope .mr-2 { margin-right: 0.5rem; }
.canva-white-studio-scope .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
.canva-white-studio-scope .bg-white { background-color: #FFFFFF; }
.canva-white-studio-scope .bg-white\\/90 { background-color: rgba(255, 255, 255, 0.9); }
.canva-white-studio-scope .bg-\\[\\#F8FAFC\\] { background-color: #F8FAFC; }
.canva-white-studio-scope .bg-\\[\\#F1F5F9\\] { background-color: #F1F5F9; }
.canva-white-studio-scope .bg-slate-50 { background-color: #F8FAFC; }
.canva-white-studio-scope .bg-slate-50\\/60 { background-color: rgba(248, 250, 252, 0.6); }
.canva-white-studio-scope .bg-slate-100 { background-color: #F1F5F9; }
.canva-white-studio-scope .bg-slate-200 { background-color: #E2E8F0; }
.canva-white-studio-scope .bg-slate-900 { background-color: #0F172A; }
.canva-white-studio-scope .bg-slate-900\\/50 { background-color: rgba(15, 23, 42, 0.5); }
.canva-white-studio-scope .bg-blue-50\\/40 { background-color: rgba(239, 246, 255, 0.4); }
.canva-white-studio-scope .bg-blue-50\\/70 { background-color: rgba(239, 246, 255, 0.7); }
.canva-white-studio-scope .bg-blue-600 { background-color: #2563EB; }
.canva-white-studio-scope .bg-emerald-600 { background-color: #059669; }
.canva-white-studio-scope .hover\\:bg-slate-50:hover { background-color: #F8FAFC; }
.canva-white-studio-scope .hover\\:bg-slate-100:hover { background-color: #F1F5F9; }
.canva-white-studio-scope .hover\\:bg-blue-700:hover { background-color: #1D4ED8; }
.canva-white-studio-scope .hover\\:bg-emerald-700:hover { background-color: #047857; }
.canva-white-studio-scope .hover\\:bg-rose-50:hover { background-color: #FFF1F2; }
.canva-white-studio-scope .hover\\:bg-emerald-50:hover { background-color: #ECFDF5; }
.canva-white-studio-scope .text-white { color: #FFFFFF; }
.canva-white-studio-scope .text-slate-400 { color: #94A3B8; }
.canva-white-studio-scope .text-slate-500 { color: #64748B; }
.canva-white-studio-scope .text-slate-600 { color: #475569; }
.canva-white-studio-scope .text-slate-700 { color: #334155; }
.canva-white-studio-scope .text-slate-800 { color: #1E293B; }
.canva-white-studio-scope .text-slate-900 { color: #0F172A; }
.canva-white-studio-scope .text-blue-600 { color: #2563EB; }
.canva-white-studio-scope .text-blue-700 { color: #1D4ED8; }
.canva-white-studio-scope .text-emerald-400 { color: #34D399; }
.canva-white-studio-scope .text-rose-600 { color: #E11D48; }
.canva-white-studio-scope .hover\\:text-rose-600:hover { color: #E11D48; }
.canva-white-studio-scope .hover\\:text-slate-700:hover { color: #334155; }
.canva-white-studio-scope .border { border: 1px solid #E2E8F0; }
.canva-white-studio-scope .border-2 { border-width: 2px; border-style: solid; }
.canva-white-studio-scope .border-b { border-bottom: 1px solid #E2E8F0; }
.canva-white-studio-scope .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
.canva-white-studio-scope .border-t { border-top: 1px solid #E2E8F0; }
.canva-white-studio-scope .border-r { border-right: 1px solid #E2E8F0; }
.canva-white-studio-scope .border-dashed { border-style: dashed; }
.canva-white-studio-scope .border-transparent { border-color: transparent; }
.canva-white-studio-scope .border-slate-100 { border-color: #F1F5F9; }
.canva-white-studio-scope .border-slate-200 { border-color: #E2E8F0; }
.canva-white-studio-scope .border-slate-200\\/80 { border-color: rgba(226, 232, 240, 0.8); }
.canva-white-studio-scope .border-slate-300 { border-color: #CBD5E1; }
.canva-white-studio-scope .border-blue-200 { border-color: #BFDBFE; }
.canva-white-studio-scope .border-blue-400 { border-color: #60A5FA; }
.canva-white-studio-scope .border-blue-600 { border-color: #2563EB; }
.canva-white-studio-scope .border-emerald-600 { border-color: #059669; }
.canva-white-studio-scope .hover\\:border-blue-300:hover { border-color: #93C5FD; }
.canva-white-studio-scope .hover\\:border-blue-400:hover { border-color: #60A5FA; }
.canva-white-studio-scope .rounded { border-radius: 0.25rem; }
.canva-white-studio-scope .rounded-lg { border-radius: 0.5rem; }
.canva-white-studio-scope .rounded-xl { border-radius: 0.75rem; }
.canva-white-studio-scope .rounded-2xl { border-radius: 1rem; }
.canva-white-studio-scope .rounded-full { border-radius: 9999px; }
.canva-white-studio-scope .text-\\[10px\\] { font-size: 10px; }
.canva-white-studio-scope .text-\\[11px\\] { font-size: 11px; }
.canva-white-studio-scope .text-xs { font-size: 0.75rem; line-height: 1rem; }
.canva-white-studio-scope .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.canva-white-studio-scope .text-base { font-size: 1rem; line-height: 1.5rem; }
.canva-white-studio-scope .font-medium { font-weight: 500; }
.canva-white-studio-scope .font-semibold { font-weight: 600; }
.canva-white-studio-scope .font-bold { font-weight: 700; }
.canva-white-studio-scope .font-extrabold { font-weight: 800; }
.canva-white-studio-scope .text-center { text-align: center; }
.canva-white-studio-scope .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.canva-white-studio-scope .line-through { text-decoration: line-through; }
.canva-white-studio-scope .overflow-hidden { overflow: hidden; }
.canva-white-studio-scope .overflow-auto { overflow: auto; }
.canva-white-studio-scope .overflow-y-auto { overflow-y: auto; }
.canva-white-studio-scope .overflow-x-auto { overflow-x: auto; }
.canva-white-studio-scope .object-cover { object-fit: cover; }
.canva-white-studio-scope .select-none { user-select: none; }
.canva-white-studio-scope .pointer-events-none { pointer-events: none; }
.canva-white-studio-scope .pointer-events-auto { pointer-events: auto; }
.canva-white-studio-scope .cursor-pointer { cursor: pointer; }
.canva-white-studio-scope .cursor-move { cursor: move; }
.canva-white-studio-scope .cursor-nwse-resize { cursor: nwse-resize; }
.canva-white-studio-scope .cursor-nesw-resize { cursor: nesw-resize; }
.canva-white-studio-scope .cursor-ns-resize { cursor: ns-resize; }
.canva-white-studio-scope .cursor-ew-resize { cursor: ew-resize; }
.canva-white-studio-scope .hidden { display: none; }
.canva-white-studio-scope .outline-none { outline: none; }
.canva-white-studio-scope .ring-2 { box-shadow: 0 0 0 2px #2563EB; }
.canva-white-studio-scope .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
.canva-white-studio-scope .shadow-md { box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1); }
.canva-white-studio-scope .shadow-lg { box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.12); }
.canva-white-studio-scope .shadow-xl { box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15); }
.canva-white-studio-scope .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); }
.canva-white-studio-scope .opacity-0 { opacity: 0; }
.canva-white-studio-scope .group:hover .group-hover\\:opacity-100 { opacity: 1; }
`;

export default CanvaStudio;
