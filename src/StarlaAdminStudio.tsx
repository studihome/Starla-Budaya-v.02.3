// src/StarlaAdminStudio.tsx
// STARLA BUDAYA ADMIN STUDIO — ANT DESIGN v5 (WHITE THEME) + TWO-WAY SLIDE SYNC + DIRECT DOM INSPECTOR + TABLE TIMELINE + SUPABASE
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  ConfigProvider,
  Layout,
  Table,
  Form,
  Button,
  Input,
  InputNumber,
  Select,
  Tabs,
  Card,
  Space,
  Tag,
  Tooltip,
  Modal,
  Divider,
  Typography,
  Empty,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UndoOutlined,
  RedoOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  EditOutlined,
  CloudUploadOutlined,
  PlusOutlined,
  PictureOutlined,
  FontSizeOutlined,
  SoundOutlined,
  DeleteOutlined,
  CopyOutlined,
  ReloadOutlined,
  CloseOutlined,
  LockOutlined,
  AppstoreOutlined,
  FieldTimeOutlined,
  CheckCircleOutlined,
  DownOutlined,
  UpOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { createClient } from '@supabase/supabase-js';
import { defaultContent } from './data/defaultContent';
import { isAdminRouteActive } from './features/admin/adminHelpers';

const { Header, Sider, Content, Footer } = Layout;
const { Text, Title } = Typography;

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

export interface TimelineRowRecord {
  id: string;
  name: string;
  kind: 'custom' | 'native';
  tagName: string;
  hidden: boolean;
  animationType: AnimationType;
  delay: number;
  duration: number;
}

/**
 * Mendaftarkan seluruh 43 slide bawaan asli dari `defaultContent.slideOrder`
 * agar langsung muncul secara lengkap di tab "Halaman Slide" Ant Design sejak pertama kali dibuka.
 */
export const ORIGINAL_SLIDE_COUNT: number =
  defaultContent?.slideOrder?.length || 1;

export const buildInitialSlidesFromDefaultContent = (): SlideItem[] => {
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
    const firstTextLine = raw?.texts?.[0]?.lines
      ?.join(' ')
      ?.replace(/\s+/g, ' ')
      ?.trim();
    const resolvedTitle =
      raw?.title && raw.title !== 'Untitled Slide'
        ? raw.title
        : firstTextLine
          ? firstTextLine.slice(0, 32)
          : idx === 0
            ? 'Opening Starla Budaya'
            : `Halaman Materi ${idx + 1}`;
    return {
      id: slideId,
      title: resolvedTitle,
      bgColor: '#FFFFFF',
      bgImage: raw?.backgroundUrl || raw?.images?.[0]?.url || undefined,
      isCustomBlank: false,
      elements: [],
      nativeOverrides: {},
    };
  });
};

export const DEFAULT_STUDIO_DATA: StudioData = {
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

const RESIZE_HANDLES: { dir: ResizeDir; style: React.CSSProperties }[] = [
  {
    dir: 'nw',
    style: { top: -5, left: -5, cursor: 'nwse-resize' },
  },
  {
    dir: 'n',
    style: {
      top: -5,
      left: '50%',
      transform: 'translateX(-50%)',
      cursor: 'ns-resize',
    },
  },
  {
    dir: 'ne',
    style: { top: -5, right: -5, cursor: 'nesw-resize' },
  },
  {
    dir: 'e',
    style: {
      top: '50%',
      right: -5,
      transform: 'translateY(-50%)',
      cursor: 'ew-resize',
    },
  },
  {
    dir: 'se',
    style: { bottom: -5, right: -5, cursor: 'nwse-resize' },
  },
  {
    dir: 's',
    style: {
      bottom: -5,
      left: '50%',
      transform: 'translateX(-50%)',
      cursor: 'ns-resize',
    },
  },
  {
    dir: 'sw',
    style: { bottom: -5, left: -5, cursor: 'nesw-resize' },
  },
  {
    dir: 'w',
    style: {
      top: '50%',
      left: -5,
      transform: 'translateY(-50%)',
      cursor: 'ew-resize',
    },
  },
];

// ==========================================
// 3. CONTEXT STUDIO DUA ARAH (TWO-WAY SLIDE SYNC)
// ==========================================
export interface StudioContextValue {
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  totalSlides: number;
  originalSlideCount: number;
  activeSlide: SlideItem;
  slides: SlideItem[];
  isStudioOpen: boolean;
  isEditMode: boolean;
}

const StudioContext = createContext<StudioContextValue>({
  activeSlideIndex: 0,
  setActiveSlideIndex: () => {},
  totalSlides: DEFAULT_STUDIO_DATA.slides.length,
  originalSlideCount: ORIGINAL_SLIDE_COUNT,
  activeSlide: DEFAULT_STUDIO_DATA.slides[0],
  slides: DEFAULT_STUDIO_DATA.slides,
  isStudioOpen: false,
  isEditMode: false,
});

export const useStarlaStudio = () => useContext(StudioContext);
export const useCanvaStudio = useStarlaStudio;

export interface StarlaAdminStudioProps {
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

export type CanvaStudioProps = StarlaAdminStudioProps;

// ==========================================
// 4. KOMPONEN UTAMA STARLA ADMIN STUDIO (ANT DESIGN v5)
// ==========================================
export const StarlaAdminStudio: React.FC<StarlaAdminStudioProps> = ({
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
  const [pinError, setPinError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);

  // Seleksi: bisa berupa ID elemen baru ('el-...') atau elemen asli slide ('native-...')
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [detectedNativeIds, setDetectedNativeIds] = useState<
    { id: string; name: string; tag: string }[]
  >([]);

  // Panel Bawah: 'timeline' (Antd Table Timeline Animasi) atau 'slides' (Halaman Slide ala Canva)
  const [bottomTab, setBottomTab] = useState<'timeline' | 'slides'>('timeline');
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

  // Fungsi sinkronisasi indeks slide dua arah (dipanggil dari Footer, Header, Tombol Kanvas, maupun MainArticulatePlayer)
  const handleSetActiveSlideIndex = useCallback(
    (nextIndex: number) => {
      setData((currentData) => {
        const total = currentData.slides.length;
        if (total === 0) return currentData;
        const clamped = Math.max(0, Math.min(total - 1, nextIndex));
        setSlideIdx(clamped);
        setSelectedId(null);
        setEditingTextId(null);
        const targetSlide = currentData.slides[clamped];
        if (targetSlide) {
          onSelectSlideId?.(targetSlide.id);
        }
        return currentData;
      });
    },
    [onSelectSlideId]
  );

  const notify = useCallback(
    (msg: string) => {
      setToast(msg);
      onStatusMessage?.('info', msg);
      setTimeout(() => setToast(null), 2500);
    },
    [onStatusMessage]
  );

  // Pastikan #starla-react-root terlihat saat Studio dibuka dan disembunyikan saat ditutup agar #preso 100% bebas gangguan
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const rootEl = document.getElementById('starla-react-root');
    if (!rootEl) return;
    if (isStudioOpen) {
      rootEl.style.display = 'block';
      rootEl.removeAttribute('aria-hidden');
    } else {
      rootEl.style.display = 'none';
      rootEl.setAttribute('aria-hidden', 'true');
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsStudioOpen((prev) => !prev);
      }
    };
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sinkronisasi selectedSlideId dari parent jika berubah
  useEffect(() => {
    if (!selectedSlideId) return;
    const idx = data.slides.findIndex((s) => s.id === selectedSlideId);
    if (idx >= 0 && idx !== slideIdx) {
      setSlideIdx(idx);
      setSelectedId(null);
    }
  }, [selectedSlideId, data.slides, slideIdx]);

  // ------------------------------------------
  // MUAT & SIMPAN DATA (SUPABASE + LOCAL FALLBACK)
  // ------------------------------------------
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local) as StudioData;
          if (mounted && parsed?.slides?.length) {
            setData(parsed);
            setHistory([parsed]);
          }
        }
        if (supabase) {
          const { data: row } = await supabase
            .from('app_contents')
            .select('content')
            .eq('slug', 'main')
            .single();
          if (mounted && row?.content?.slides?.length) {
            setData(row.content as StudioData);
            setHistory([row.content as StudioData]);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(row.content));
          }
        }
      } catch {
        // Fallback aman ke DEFAULT_STUDIO_DATA
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const commitData = useCallback(
    (next: StudioData) => {
      setData(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota error
      }
      setHistory((prev) => {
        const sliced = prev.slice(0, histIdx + 1);
        const updated = [...sliced, next].slice(-25);
        setHistIdx(updated.length - 1);
        return updated;
      });
    },
    [histIdx]
  );

  const undo = () => {
    if (histIdx > 0) {
      setHistIdx(histIdx - 1);
      setData(history[histIdx - 1]);
    }
  };

  const redo = () => {
    if (histIdx < history.length - 1) {
      setHistIdx(histIdx + 1);
      setData(history[histIdx + 1]);
    }
  };

  const saveToSupabase = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (supabase) {
        const { error } = await supabase.from('app_contents').upsert(
          {
            slug: 'main',
            content: data,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        );
        if (error) throw error;
        notify('Tersimpan di Cloud Supabase');
      } else {
        notify('Tersimpan di Browser Lokal');
      }
    } catch {
      notify('Disimpan ke memori lokal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadFile = async (
    file: File,
    cb: (url: string) => void
  ): Promise<void> => {
    if (supabase) {
      try {
        const path = `uploads/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { error } = await supabase.storage
          .from('media-assets')
          .upload(path, file, { upsert: true });
        if (!error) {
          const { data: pub } = supabase.storage
            .from('media-assets')
            .getPublicUrl(path);
          if (pub?.publicUrl) {
            cb(pub.publicUrl);
            notify('File berhasil diunggah');
            return;
          }
        }
      } catch {
        // Fallback ke DataURL
      }
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        cb(reader.result);
        notify('File dimuat');
      }
    };
    reader.readAsDataURL(file);
  };

  // ------------------------------------------
  // 5. DIRECT DOM INSPECTOR (MENGEDIT ASET SLIDE ASLI SECARA LANGSUNG)
  // ------------------------------------------
  const scanAndApplyNativeDOM = useCallback(() => {
    const container = nativeContentRef.current;
    if (!container) return;

    const interactiveTags = container.querySelectorAll(
      'img, button, h1, h2, h3, h4, p, [role="button"]'
    );
    const list: { id: string; name: string; tag: string }[] = [];

    interactiveTags.forEach((node, index) => {
      const el = node as HTMLElement;
      // Jangan scan tombol navigasi sistem internal (Sebelumnya/Selanjutnya) sebagai elemen konten
      if (el.getAttribute('data-studio-nav-ignore') === 'true') {
        return;
      }

      let sid = el.getAttribute('data-studio-id');
      if (!sid) {
        sid = `native-${index}-${el.tagName.toLowerCase()}`;
        el.setAttribute('data-studio-id', sid);
      }

      if (el.getAttribute('data-orig-text') === null) {
        el.setAttribute('data-orig-text', el.innerText || '');
      }
      if (
        el.tagName === 'IMG' &&
        el.getAttribute('data-orig-src') === null
      ) {
        el.setAttribute(
          'data-orig-src',
          (el as HTMLImageElement).src || ''
        );
      }

      const ov = currentSlide.nativeOverrides[sid];
      if (ov) {
        el.style.display = ov.hidden ? 'none' : '';
        el.style.transform = `translate(${ov.xDeltaPct}%, ${ov.yDeltaPct}%)`;
        if (ov.customText !== undefined && el.tagName !== 'IMG') {
          el.innerText = ov.customText;
        }
        if (ov.customImageSrc && el.tagName === 'IMG') {
          (el as HTMLImageElement).src = ov.customImageSrc;
        }
      } else {
        el.style.display = '';
        el.style.transform = '';
      }

      if (isStudioOpen && isAuth && isEditMode) {
        el.style.cursor = 'pointer';
        el.style.outline =
          selectedId === sid ? '2.5px solid #1677ff' : '1px dashed transparent';
        el.style.outlineOffset = '2px';
      } else {
        el.style.cursor = '';
        el.style.outline = '';
      }

      const labelPreview =
        el.tagName === 'IMG'
          ? (el as HTMLImageElement).alt || `Gambar Asli #${index + 1}`
          : (el.innerText || `${el.tagName} #${index + 1}`).slice(0, 26);

      list.push({
        id: sid,
        name: `${el.tagName}: ${labelPreview}`,
        tag: el.tagName,
      });
    });

    setDetectedNativeIds(list);
  }, [currentSlide, isStudioOpen, isAuth, isEditMode, selectedId]);

  useEffect(() => {
    const t = setTimeout(scanAndApplyNativeDOM, 90);
    return () => clearTimeout(t);
  }, [scanAndApplyNativeDOM, slideIdx, data]);

  const updateNativeOverride = (
    sid: string,
    patch: Partial<NativeNodeOverride>
  ) => {
    const existing: NativeNodeOverride = currentSlide.nativeOverrides[sid] || {
      selectorId: sid,
      name: sid,
      tagName: 'DIV',
      xDeltaPct: 0,
      yDeltaPct: 0,
      hidden: false,
      animation: { type: 'none', delay: 0, duration: 0.6 },
    };
    const nextOverrides = {
      ...currentSlide.nativeOverrides,
      [sid]: { ...existing, ...patch },
    };
    const nextSlides = data.slides.map((s, i) =>
      i === slideIdx ? { ...s, nativeOverrides: nextOverrides } : s
    );
    commitData({ ...data, slides: nextSlides });
  };

  // Drag langsung pada elemen asli slide di dalam kanvas
  const handleNativeCanvasPointerDown = (e: React.PointerEvent) => {
    if (!isStudioOpen || !isAuth || !isEditMode || !canvasContainerRef.current)
      return;
    const target = (e.target as HTMLElement).closest(
      '[data-studio-id]'
    ) as HTMLElement | null;
    if (!target) return;

    e.stopPropagation();
    const sid = target.getAttribute('data-studio-id')!;
    setSelectedId(sid);

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const existing = currentSlide.nativeOverrides[sid] || {
      selectorId: sid,
      name: `${target.tagName}: ${(
        target.innerText ||
        target.getAttribute('alt') ||
        sid
      ).slice(0, 22)}`,
      tagName: target.tagName,
      xDeltaPct: 0,
      yDeltaPct: 0,
      hidden: false,
      animation: { type: 'none' as AnimationType, delay: 0, duration: 0.6 },
    };

    let moved = false;
    let lastX = existing.xDeltaPct;
    let lastY = existing.yDeltaPct;

    const onMove = (mv: PointerEvent) => {
      const dx = ((mv.clientX - startX) / rect.width) * 100;
      const dy = ((mv.clientY - startY) / rect.height) * 100;
      if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
        moved = true;
        lastX = Number((existing.xDeltaPct + dx).toFixed(1));
        lastY = Number((existing.yDeltaPct + dy).toFixed(1));
        target.style.transform = `translate(${lastX}%, ${lastY}%)`;
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (moved) {
        updateNativeOverride(sid, {
          name: existing.name,
          tagName: existing.tagName,
          xDeltaPct: lastX,
          yDeltaPct: lastY,
        });
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // ------------------------------------------
  // 6. PEMUTAR ANIMASI TIMELINE (WEB ANIMATIONS API)
  // ------------------------------------------
  const playSlideTimeline = useCallback(() => {
    currentSlide.elements.forEach((el) => {
      const dom = document.getElementById(`studio-el-${el.id}`);
      if (dom && el.animation.type !== 'none') {
        dom.animate(ANIMATION_KEYFRAMES[el.animation.type], {
          duration: Math.max(100, el.animation.duration * 1000),
          delay: Math.max(0, el.animation.delay * 1000),
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        });
      }
    });

    if (nativeContentRef.current) {
      Object.values(currentSlide.nativeOverrides).forEach((ov) => {
        if (ov.animation && ov.animation.type !== 'none' && !ov.hidden) {
          const dom = nativeContentRef.current?.querySelector(
            `[data-studio-id="${ov.selectorId}"]`
          ) as HTMLElement | null;
          if (dom) {
            dom.animate(ANIMATION_KEYFRAMES[ov.animation.type], {
              duration: Math.max(100, ov.animation.duration * 1000),
              delay: Math.max(0, ov.animation.delay * 1000),
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'both',
            });
          }
        }
      });
    }
  }, [currentSlide]);

  useEffect(() => {
    const t = setTimeout(playSlideTimeline, 120);
    return () => clearTimeout(t);
  }, [slideIdx, playSlideTimeline]);

  // ------------------------------------------
  // 7. OPERASI ELEMEN TAMBAHAN & DRAG/RESIZE 60FPS
  // ------------------------------------------
  const updateCustomElement = (
    id: string,
    patch: Partial<CanvasElement>,
    recordHistory = false
  ) => {
    const nextSlides = data.slides.map((s, idx) =>
      idx !== slideIdx
        ? s
        : {
            ...s,
            elements: s.elements.map((el) =>
              el.id === id ? { ...el, ...patch } : el
            ),
          }
    );
    const nextData = { ...data, slides: nextSlides };
    if (recordHistory) commitData(nextData);
    else setData(nextData);
  };

  const commitCustomElement = (id: string, patch: Partial<CanvasElement>) =>
    updateCustomElement(id, patch, true);

  const addCustomElement = (type: CanvasElement['type']) => {
    const id = `el-${Date.now()}`;
    const count = currentSlide.elements.length + 1;
    const newEl: CanvasElement = {
      id,
      name:
        type === 'text'
          ? `Teks #${count}`
          : type === 'image'
            ? `Gambar #${count}`
            : type === 'audio-button'
              ? `Audio #${count}`
              : `Tombol #${count}`,
      type,
      x: 34,
      y: 36,
      width: type === 'text' ? 32 : 24,
      height: type === 'text' ? 12 : 16,
      zIndex: count + 10,
      locked: false,
      label:
        type === 'text'
          ? 'Klik 2x untuk ketik teks'
          : type === 'audio-button'
            ? 'Putar Suara'
            : 'Tombol Materi',
      imageUrl:
        type === 'image' || type === 'image-button'
          ? 'mobile/Slide5WPRbcJDCqY.jpg'
          : undefined,
      bgColor: type === 'text' ? '#ffffff' : '#1677ff',
      textColor: type === 'text' ? '#0f172a' : '#ffffff',
      fontSize: 15,
      borderRadius: 10,
      actionType: type === 'audio-button' ? 'play-audio' : 'open-popup',
      popupTitle: 'Materi Pembelajaran',
      popupContent: 'Tulis penjelasan materi di sini.',
      animation: { type: 'fade-in', delay: 0, duration: 0.6 },
    };

    const nextSlides = data.slides.map((s, i) =>
      i === slideIdx ? { ...s, elements: [...s.elements, newEl] } : s
    );
    commitData({ ...data, slides: nextSlides });
    setSelectedId(id);
  };

  const duplicateCustomElement = (el: CanvasElement) => {
    const copy: CanvasElement = {
      ...el,
      id: `el-${Date.now()}`,
      name: `${el.name} (Salinan)`,
      x: Math.min(82, el.x + 4),
      y: Math.min(82, el.y + 4),
      zIndex: currentSlide.elements.length + 12,
    };
    const nextSlides = data.slides.map((s, i) =>
      i === slideIdx ? { ...s, elements: [...s.elements, copy] } : s
    );
    commitData({ ...data, slides: nextSlides });
    setSelectedId(copy.id);
    notify('Elemen diduplikasi');
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    if (selectedId.startsWith('native-')) {
      updateNativeOverride(selectedId, { hidden: true });
      setSelectedId(null);
      notify('Elemen asli disembunyikan (bisa dipulihkan di Timeline)');
    } else {
      const nextSlides = data.slides.map((s, i) =>
        i === slideIdx
          ? { ...s, elements: s.elements.filter((e) => e.id !== selectedId) }
          : s
      );
      commitData({ ...data, slides: nextSlides });
      setSelectedId(null);
      notify('Elemen dihapus');
    }
  };

  const handleCustomPointerDown = (
    e: React.PointerEvent,
    el: CanvasElement,
    mode: 'move' | ResizeDir
  ) => {
    if (!isEditMode || el.locked || editingTextId === el.id) return;
    e.stopPropagation();
    setSelectedId(el.id);
    if (!canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...el };

    const onMove = (mv: PointerEvent) => {
      const dx = ((mv.clientX - startX) / rect.width) * 100;
      const dy = ((mv.clientY - startY) / rect.height) * 100;

      if (mode === 'move') {
        updateCustomElement(
          el.id,
          {
            x: Number(
              Math.max(0, Math.min(100 - orig.width, orig.x + dx)).toFixed(1)
            ),
            y: Number(
              Math.max(0, Math.min(100 - orig.height, orig.y + dy)).toFixed(1)
            ),
          },
          false
        );
      } else {
        let { x, y, width, height } = orig;
        if (mode.includes('e'))
          width = Math.max(5, Math.min(100 - x, orig.width + dx));
        if (mode.includes('s'))
          height = Math.max(5, Math.min(100 - y, orig.height + dy));
        if (mode.includes('w')) {
          const nw = Math.max(5, orig.width - dx);
          x = orig.x + (orig.width - nw);
          width = nw;
        }
        if (mode.includes('n')) {
          const nh = Math.max(5, orig.height - dy);
          y = orig.y + (orig.height - nh);
          height = nh;
        }
        updateCustomElement(
          el.id,
          {
            x: Number(x.toFixed(1)),
            y: Number(y.toFixed(1)),
            width: Number(width.toFixed(1)),
            height: Number(height.toFixed(1)),
          },
          false
        );
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setData((latest) => {
        commitData(latest);
        return latest;
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // ------------------------------------------
  // 8. MANAJEMEN SLIDE ALA CANVA (TAMBAH, DUPLIKAT, HAPUS)
  // ------------------------------------------
  const addNewSlide = () => {
    const newSlide: SlideItem = {
      id: `slide-${Date.now()}`,
      title: `Slide Baru ${data.slides.length + 1}`,
      bgColor: '#FFFFFF',
      isCustomBlank: true,
      elements: [],
      nativeOverrides: {},
    };
    const nextSlides = [...data.slides, newSlide];
    commitData({ ...data, slides: nextSlides });
    const nextIdx = nextSlides.length - 1;
    setSlideIdx(nextIdx);
    setSelectedId(null);
    onSelectSlideId?.(newSlide.id);
    notify('Slide kustom baru ditambahkan');
  };

  const duplicateSlide = (idx: number) => {
    const src = data.slides[idx];
    const cloned: SlideItem = JSON.parse(JSON.stringify(src));
    cloned.id = `slide-${Date.now()}`;
    cloned.title = `${src.title} (Salinan)`;
    cloned.elements = cloned.elements.map((el, i) => ({
      ...el,
      id: `el-${Date.now()}-${i}`,
    }));
    const nextSlides = [...data.slides];
    nextSlides.splice(idx + 1, 0, cloned);
    commitData({ ...data, slides: nextSlides });
    setSlideIdx(idx + 1);
    setSelectedId(null);
    onSelectSlideId?.(cloned.id);
    notify('Slide berhasil diduplikasi');
  };

  const deleteSlide = (idx: number) => {
    if (data.slides.length <= 1) {
      notify('Minimal harus ada 1 slide');
      return;
    }
    const nextSlides = data.slides.filter((_, i) => i !== idx);
    commitData({ ...data, slides: nextSlides });
    const nextIdx = Math.max(0, idx - 1);
    setSlideIdx(nextIdx);
    setSelectedId(null);
    if (nextSlides[nextIdx]) {
      onSelectSlideId?.(nextSlides[nextIdx].id);
    }
    notify('Slide dihapus');
  };

  // ------------------------------------------
  // 9. DATA SOURCE & KOLOM ANTD TABLE TIMELINE
  // ------------------------------------------
  const timelineRows = useMemo<TimelineRowRecord[]>(() => {
    const customRows: TimelineRowRecord[] = currentSlide.elements.map((el) => ({
      id: el.id,
      name: el.label || el.name,
      kind: 'custom',
      tagName: el.type.toUpperCase(),
      hidden: false,
      animationType: el.animation.type,
      delay: el.animation.delay,
      duration: el.animation.duration,
    }));

    const nativeRows: TimelineRowRecord[] = detectedNativeIds.map((nat) => {
      const ov = currentSlide.nativeOverrides[nat.id];
      const anim = ov?.animation || {
        type: 'none' as AnimationType,
        delay: 0,
        duration: 0.6,
      };
      return {
        id: nat.id,
        name: nat.name,
        kind: 'native',
        tagName: nat.tag,
        hidden: Boolean(ov?.hidden),
        animationType: anim.type,
        delay: anim.delay,
        duration: anim.duration,
      };
    });

    return [...customRows, ...nativeRows];
  }, [currentSlide.elements, currentSlide.nativeOverrides, detectedNativeIds]);

  const timelineColumns: ColumnsType<TimelineRowRecord> = [
    {
      title: 'Elemen Slide',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (val: string, record: TimelineRowRecord) => (
        <Space size={6}>
          <Tag
            color={record.kind === 'custom' ? 'blue' : 'default'}
            style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}
          >
            {record.kind === 'custom' ? 'Baru' : 'Asli'}
          </Tag>
          <Text
            delete={record.hidden}
            strong={selectedId === record.id}
            style={{
              fontSize: 12,
              color: selectedId === record.id ? '#1677ff' : '#1e293b',
            }}
            ellipsis={{ tooltip: val }}
          >
            {val}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Tipe Animasi',
      dataIndex: 'animationType',
      key: 'animationType',
      width: 170,
      render: (val: AnimationType, record: TimelineRowRecord) => (
        <Select
          size="small"
          data-testid={`timeline-anim-type-${record.id}`}
          value={val}
          style={{ width: '100%' }}
          onClick={(e) => e.stopPropagation()}
          onChange={(nextType: AnimationType) => {
            if (record.kind === 'custom') {
              commitCustomElement(record.id, {
                animation: {
                  type: nextType,
                  delay: record.delay,
                  duration: record.duration,
                },
              });
            } else {
              updateNativeOverride(record.id, {
                name: record.name,
                tagName: record.tagName,
                animation: {
                  type: nextType,
                  delay: record.delay,
                  duration: record.duration,
                },
              });
            }
          }}
          options={[
            { value: 'none', label: 'Tanpa Animasi' },
            { value: 'fade-in', label: 'Fade In' },
            { value: 'zoom-in', label: 'Zoom In' },
            { value: 'slide-up', label: 'Slide Up' },
            { value: 'slide-left', label: 'Slide Left' },
            { value: 'bounce', label: 'Bounce' },
          ]}
        />
      ),
    },
    {
      title: 'Mulai / Delay (s)',
      dataIndex: 'delay',
      key: 'delay',
      width: 135,
      render: (val: number, record: TimelineRowRecord) => (
        <InputNumber
          size="small"
          min={0}
          max={30}
          step={0.2}
          data-testid={`timeline-anim-delay-${record.id}`}
          value={val}
          style={{ width: 90 }}
          onClick={(e) => e.stopPropagation()}
          onChange={(nextDelay) => {
            const delayNum = Number(nextDelay ?? 0);
            if (record.kind === 'custom') {
              commitCustomElement(record.id, {
                animation: {
                  type: record.animationType,
                  delay: delayNum,
                  duration: record.duration,
                },
              });
            } else {
              updateNativeOverride(record.id, {
                name: record.name,
                tagName: record.tagName,
                animation: {
                  type: record.animationType,
                  delay: delayNum,
                  duration: record.duration,
                },
              });
            }
          }}
        />
      ),
    },
    {
      title: 'Durasi (s)',
      dataIndex: 'duration',
      key: 'duration',
      width: 135,
      render: (val: number, record: TimelineRowRecord) => (
        <InputNumber
          size="small"
          min={0.2}
          max={20}
          step={0.2}
          data-testid={`timeline-anim-duration-${record.id}`}
          value={val}
          style={{ width: 90 }}
          onClick={(e) => e.stopPropagation()}
          onChange={(nextDuration) => {
            const durNum = Math.max(0.2, Number(nextDuration ?? 0.6));
            if (record.kind === 'custom') {
              commitCustomElement(record.id, {
                animation: {
                  type: record.animationType,
                  delay: record.delay,
                  duration: durNum,
                },
              });
            } else {
              updateNativeOverride(record.id, {
                name: record.name,
                tagName: record.tagName,
                animation: {
                  type: record.animationType,
                  delay: record.delay,
                  duration: durNum,
                },
              });
            }
          }}
        />
      ),
    },
    {
      title: 'Visual Timeline',
      key: 'visualBar',
      render: (_: unknown, record: TimelineRowRecord) => (
        <div
          style={{
            background: '#f1f5f9',
            height: 10,
            borderRadius: 999,
            position: 'relative',
            overflow: 'hidden',
            minWidth: 90,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${Math.min(80, record.delay * 18)}%`,
              width: `${Math.min(100, record.duration * 28)}%`,
              background:
                record.animationType === 'none' ? '#cbd5e1' : '#1677ff',
              borderRadius: 999,
            }}
          />
        </div>
      ),
    },
    {
      title: 'Aksi Cepat',
      key: 'actions',
      width: 140,
      align: 'right',
      render: (_: unknown, record: TimelineRowRecord) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          {record.kind === 'native' && record.hidden && (
            <Button
              size="small"
              type="primary"
              onClick={() =>
                updateNativeOverride(record.id, { hidden: false })
              }
            >
              Tampilkan Lagi
            </Button>
          )}
          {record.kind === 'native' && !record.hidden && (
            <Tooltip title="Sembunyikan Elemen Asli">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() =>
                  updateNativeOverride(record.id, { hidden: true })
                }
              />
            </Tooltip>
          )}
          {record.kind === 'custom' && (
            <Tooltip title="Hapus Elemen">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  const nextSlides = data.slides.map((s, i) =>
                    i === slideIdx
                      ? {
                          ...s,
                          elements: s.elements.filter(
                            (e) => e.id !== record.id
                          ),
                        }
                      : s
                  );
                  commitData({ ...data, slides: nextSlides });
                  if (selectedId === record.id) setSelectedId(null);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // ------------------------------------------
  // 10. RENDER ISI SLIDE UTAMA (SINKRONISASI DUA ARAH & DUKUNGAN SLIDE KUSTOM BARU)
  // ------------------------------------------
  const rawSlideDef = defaultContent.slides[currentSlide.id];
  const isCustomSlide =
    Boolean(currentSlide.isCustomBlank) || slideIdx >= ORIGINAL_SLIDE_COUNT;

  const studioContextValue = useMemo<StudioContextValue>(
    () => ({
      activeSlideIndex: slideIdx,
      setActiveSlideIndex: handleSetActiveSlideIndex,
      totalSlides: data.slides.length,
      originalSlideCount: ORIGINAL_SLIDE_COUNT,
      activeSlide: currentSlide,
      slides: data.slides,
      isStudioOpen,
      isEditMode,
    }),
    [
      slideIdx,
      handleSetActiveSlideIndex,
      data.slides,
      currentSlide,
      isStudioOpen,
      isEditMode,
    ]
  );

  const renderUnifiedSlideStage = () => (
    <div
      ref={canvasContainerRef}
      data-testid="studio-canvas-stage"
      onPointerDown={handleNativeCanvasPointerDown}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: currentSlide.bgColor || '#FFFFFF',
        backgroundImage: currentSlide.bgImage
          ? `url(${currentSlide.bgImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 1. Lapisan Konten Asli Slide atau Slide Kustom Baru */}
      <div
        ref={nativeContentRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Jika children (MainArticulatePlayer) diberikan, render di dalam konteks */}
        {children}

        {/* Fallback apabila StarlaAdminStudio dipanggil mandiri tanpa children */}
        {!children && !isCustomSlide && rawSlideDef && (
          <div
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
            {/* Galeri Aset Gambar Asli Slide */}
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
                  key={img.objectId || i}
                  data-testid={`canvas-el-native:native-${i}-img`}
                  src={img.url}
                  alt={img.objectId || `${currentSlide.title} aset ${i + 1}`}
                  draggable={false}
                  style={{
                    maxWidth: i === 0 ? '88%' : '28%',
                    maxHeight: i === 0 ? '72%' : '34%',
                    objectFit: 'contain',
                    borderRadius: 8,
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
                      borderRadius: 8,
                    }}
                  />
                ))}
            </div>

            {/* Teks & Tombol Bawaan Slide Asli */}
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: 'rgba(255,255,255,0.92)',
                padding: 8,
                borderRadius: 10,
                border: '1px solid #e2e8f0',
              }}
            >
              <h2
                data-testid="canvas-el-native:native-heading"
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0f172a',
                  padding: '4px 8px',
                }}
              >
                {currentSlide.title}
              </h2>
              {(rawSlideDef.texts || []).slice(0, 6).map((tb, idx) => (
                <p
                  key={tb.objectId || idx}
                  data-testid={`canvas-el-native:native-text-${idx}`}
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#334155',
                    backgroundColor: '#f1f5f9',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {tb.lines.join(' ')}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Fallback Kanvas Slide Kustom apabila tanpa children */}
        {!children && isCustomSlide && (
          <div
            data-testid="custom-slide-canvas"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              background:
                currentSlide.bgColor ||
                'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            }}
          >
            <Tag color="blue" style={{ marginBottom: 8 }}>
              Slide Kustom #{slideIdx + 1}
            </Tag>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {currentSlide.title}
            </h2>
            {currentSlide.elements.length === 0 && (
              <p
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: '#64748b',
                }}
              >
                Kanvas slide kustom bersih — tambahkan Teks, Tombol Bergambar,
                Gambar, atau Audio dari toolbar atas.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 2. Lapisan Elemen Kanvas Tambahan (pointerEvents: none pada wrapper agar klik tembus ke elemen asli) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
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
                pointerEvents: 'auto',
                cursor: isEditMode ? 'move' : 'pointer',
                outline: isSelected ? '2px solid #1677ff' : 'none',
                borderRadius: el.borderRadius,
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
                  handleSetActiveSlideIndex(el.targetSlide);
                }
                if (el.actionType === 'open-popup') {
                  setPopup({
                    title: el.popupTitle || el.label,
                    content: el.popupContent || '',
                  });
                }
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: el.bgColor,
                  color: el.textColor,
                  fontSize: `${el.fontSize}px`,
                  borderRadius: `${el.borderRadius}px`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                  border: '1px solid #e2e8f0',
                }}
              >
                {(el.type === 'image' || el.type === 'image-button') &&
                  el.imageUrl && (
                    <img
                      src={el.imageUrl}
                      alt={el.label}
                      draggable={false}
                      style={{
                        width: '100%',
                        height: el.type === 'image' ? '100%' : '72%',
                        objectFit: 'cover',
                      }}
                    />
                  )}

                {el.type !== 'image' &&
                  (editingTextId === el.id ? (
                    <input
                      autoFocus
                      value={el.label}
                      onChange={(e) =>
                        updateCustomElement(
                          el.id,
                          { label: e.target.value },
                          false
                        )
                      }
                      onBlur={() => {
                        setEditingTextId(null);
                        commitData(data);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingTextId(null);
                          commitData(data);
                        }
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        padding: '2px 6px',
                        border: '1px solid #1677ff',
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        padding: '2px 8px',
                        fontWeight: 600,
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                      }}
                    >
                      {el.label}
                    </div>
                  ))}
              </div>

              {/* 8 Titik Resize Handle */}
              {isSelected &&
                !el.locked &&
                RESIZE_HANDLES.map((h) => (
                  <div
                    key={h.dir}
                    data-testid={`resize-handle-${h.dir}`}
                    onPointerDown={(e) =>
                      handleCustomPointerDown(e, el, h.dir)
                    }
                    style={{
                      position: 'absolute',
                      width: 10,
                      height: 10,
                      backgroundColor: '#ffffff',
                      border: '2px solid #1677ff',
                      borderRadius: '50%',
                      zIndex: 20,
                      ...h.style,
                    }}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==========================================================
  // MODE 1: TAMPILAN PUBLIK MURNI (ZERO-OVERHEAD & 100% IDENTIK)
  // ==========================================================
  if (!isStudioOpen) {
    return (
      <StudioContext.Provider value={studioContextValue}>
        {children}
      </StudioContext.Provider>
    );
  }

  // ==========================================================
  // MODE 2: MODAL LOGIN PIN ADMIN PUTIH BERSIH (ANT DESIGN)
  // ==========================================================
  if (!isAuth) {
    return (
      <StudioContext.Provider value={studioContextValue}>
        {children}
        <ConfigProvider
          theme={{
            token: {
              colorBgContainer: '#ffffff',
              colorPrimary: '#1677ff',
              borderRadius: 8,
              colorText: '#0f172a',
            },
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            data-testid="admin-pin-gate"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483647,
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <Card
              style={{
                width: '100%',
                maxWidth: 400,
                boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.1)',
                border: '1px solid #e2e8f0',
              }}
            >
              <Space
                direction="vertical"
                size={16}
                style={{ width: '100%', textAlign: 'center' }}
              >
                <div>
                  <LockOutlined
                    style={{ fontSize: 28, color: '#1677ff', marginBottom: 8 }}
                  />
                  <Title level={4} style={{ margin: 0 }}>
                    Akses Admin Dashboard
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Masukkan PIN Keamanan Admin untuk membuka Starla Budaya
                    Studio (Default: {ADMIN_PIN})
                  </Text>
                </div>

                {pinError && (
                  <div
                    role="alert"
                    data-testid="admin-pin-error"
                    style={{
                      backgroundColor: '#fff1f2',
                      color: '#e11d48',
                      border: '1px solid #fecdd3',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                    }}
                  >
                    {pinError}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (pin.trim() === ADMIN_PIN) {
                      setPinError(null);
                      setIsAuth(true);
                      setIsEditMode(true);
                    } else {
                      setPinError('PIN Admin tidak sesuai. Silakan coba lagi.');
                      notify('PIN tidak sesuai');
                    }
                  }}
                >
                  <Space
                    direction="vertical"
                    size={12}
                    style={{ width: '100%', textAlign: 'left' }}
                  >
                    <div>
                      <label
                        htmlFor="admin-pin-input"
                        style={{
                          display: 'block',
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 4,
                          color: '#0f172a',
                        }}
                      >
                        PIN Keamanan Admin
                      </label>
                      <input
                        id="admin-pin-input"
                        data-testid="admin-pin-input"
                        type="password"
                        inputMode="numeric"
                        autoFocus
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Masukkan PIN Admin (contoh: 123456)"
                        style={{
                          width: '100%',
                          height: 38,
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          fontSize: 14,
                          outline: 'none',
                        }}
                      />
                    </div>
                    <Space
                      style={{ width: '100%', justifyContent: 'space-between' }}
                    >
                      <Button
                        onClick={() => {
                          setIsStudioOpen(false);
                          onCloseAdmin?.();
                        }}
                      >
                        Batal
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        data-testid="admin-pin-submit"
                      >
                        Masuk ke Admin Dashboard
                      </Button>
                    </Space>
                  </Space>
                </form>
              </Space>
            </Card>
          </div>
        </ConfigProvider>
      </StudioContext.Provider>
    );
  }

  // ==========================================================
  // MODE 3: DASHBOARD ADMIN STARLA BUDAYA (ANT DESIGN v5 WHITE THEME)
  // ==========================================================
  return (
    <StudioContext.Provider value={studioContextValue}>
      <ConfigProvider
        theme={{
          token: {
            colorBgContainer: '#ffffff',
            colorBgLayout: '#f1f5f9',
            colorPrimary: '#1677ff',
            borderRadius: 8,
            colorText: '#0f172a',
            fontSize: 12,
          },
        }}
      >
        <div
          data-testid="visual-studio-admin"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            backgroundColor: '#ffffff',
            color: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            userSelect: 'none',
          }}
        >
          {/* Toast Notifikasi Ringkas */}
          {toast && (
            <div
              data-testid="studio-status-toast"
              style={{
                position: 'fixed',
                top: 64,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)',
              }}
            >
              <CheckCircleOutlined style={{ color: '#34d399' }} />
              <span>{toast}</span>
            </div>
          )}

          <Layout style={{ height: '100%', backgroundColor: '#f1f5f9' }}>
            {/* ============================================================
                1. ANTD HEADER PUTIH BERSIH (COMMAND BAR & TAMBAH ELEMEN CEPAT)
               ============================================================ */}
            <Header
              data-testid="studio-top-command-bar"
              style={{
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '0 16px',
                height: 56,
                lineHeight: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              {/* Kiri: Brand, Undo/Redo, Navigasi Slide Cepat & Tambah Elemen */}
              <Space size={8} align="center">
                <Text
                  strong
                  style={{
                    fontSize: 14,
                    color: '#1677ff',
                    letterSpacing: '-0.02em',
                    marginRight: 4,
                  }}
                >
                  SlideStudio
                </Text>

                <Tooltip title="Undo">
                  <Button
                    size="small"
                    data-testid="btn-studio-undo"
                    icon={<UndoOutlined />}
                    disabled={histIdx <= 0}
                    onClick={undo}
                  />
                </Tooltip>
                <Tooltip title="Redo">
                  <Button
                    size="small"
                    data-testid="btn-studio-redo"
                    icon={<RedoOutlined />}
                    disabled={histIdx >= history.length - 1}
                    onClick={redo}
                  />
                </Tooltip>

                <Divider type="vertical" />

                {/* Navigasi Slide Dua Arah di Header */}
                <Space size={4}>
                  <Tooltip title="Slide Sebelumnya">
                    <Button
                      size="small"
                      data-testid="header-btn-prev-slide"
                      icon={<LeftOutlined />}
                      disabled={slideIdx <= 0}
                      onClick={() => handleSetActiveSlideIndex(slideIdx - 1)}
                    />
                  </Tooltip>
                  <Badge
                    color={isCustomSlide ? '#059669' : '#1677ff'}
                    text={
                      <Text
                        strong
                        data-testid="active-slide-indicator"
                        style={{ fontSize: 12, color: '#334155' }}
                      >
                        Slide {slideIdx + 1}/{data.slides.length}:{' '}
                        {currentSlide.title}
                      </Text>
                    }
                  />
                  <Tooltip title="Slide Selanjutnya">
                    <Button
                      size="small"
                      data-testid="header-btn-next-slide"
                      icon={<RightOutlined />}
                      disabled={slideIdx >= data.slides.length - 1}
                      onClick={() => handleSetActiveSlideIndex(slideIdx + 1)}
                    />
                  </Tooltip>
                </Space>

                <Divider type="vertical" />

                {/* Tombol Tambah Elemen ke Kanvas */}
                <Space size={6} data-testid="studio-left-dock">
                  <Button
                    size="small"
                    data-testid="btn-add-text-element"
                    icon={<FontSizeOutlined style={{ color: '#1677ff' }} />}
                    onClick={() => addCustomElement('text')}
                  >
                    + Teks
                  </Button>
                  <Button
                    size="small"
                    data-testid="btn-add-image-button"
                    icon={<PictureOutlined style={{ color: '#1677ff' }} />}
                    onClick={() => addCustomElement('image-button')}
                  >
                    + Tombol
                  </Button>
                  <Button
                    size="small"
                    data-testid="btn-add-image-element"
                    icon={<PlusOutlined style={{ color: '#1677ff' }} />}
                    onClick={() => addCustomElement('image')}
                  >
                    + Gambar
                  </Button>
                  <Button
                    size="small"
                    data-testid="btn-add-audio-button"
                    icon={<SoundOutlined style={{ color: '#1677ff' }} />}
                    onClick={() => addCustomElement('audio-button')}
                  >
                    + Audio
                  </Button>
                </Space>
              </Space>

              {/* Kanan: Tab Klasik, Putar Animasi, Coba Klik Publik, Simpan Supabase, Tutup */}
              <Space size={8} align="center">
                {(onOpenClassicTab || onSwitchToClassicTab) && (
                  <Space size={4}>
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        onOpenClassicTab?.('quiz');
                        onSwitchToClassicTab?.('quiz');
                      }}
                    >
                      Kuis
                    </Button>
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        onOpenClassicTab?.('media');
                        onSwitchToClassicTab?.('audio');
                      }}
                    >
                      Audio
                    </Button>
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        onOpenClassicTab?.('backup');
                        onSwitchToClassicTab?.('json');
                      }}
                    >
                      JSON
                    </Button>
                  </Space>
                )}

                <Button
                  size="small"
                  data-testid="btn-play-timeline-preview"
                  icon={<PlayCircleOutlined style={{ color: '#1677ff' }} />}
                  onClick={playSlideTimeline}
                >
                  Putar Animasi
                </Button>

                <Button
                  size="small"
                  data-testid={
                    isEditMode ? 'btn-mode-live-preview' : 'btn-mode-edit-canvas'
                  }
                  type={isEditMode ? 'default' : 'primary'}
                  icon={isEditMode ? <EyeOutlined /> : <EditOutlined />}
                  onClick={() => {
                    setIsEditMode(!isEditMode);
                    setSelectedId(null);
                  }}
                >
                  {isEditMode ? 'Coba Klik Publik' : 'Kembali Edit'}
                </Button>

                <Button
                  size="small"
                  type="primary"
                  data-testid="btn-publish-supabase"
                  icon={<CloudUploadOutlined />}
                  loading={isSaving}
                  onClick={saveToSupabase}
                >
                  Simpan
                </Button>

                <Tooltip title="Tutup Editor">
                  <Button
                    size="small"
                    type="text"
                    data-testid="btn-exit-studio"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setIsEditMode(false);
                      setIsStudioOpen(false);
                      onCloseAdmin?.();
                    }}
                  />
                </Tooltip>
              </Space>
            </Header>

            {/* ============================================================
                2. AREA TENGAH: CONTENT (KANVAS 16:9) + SIDER KANAN (ANTD FORM)
               ============================================================ */}
            <Layout style={{ flex: 1, overflow: 'hidden', background: '#f1f5f9' }}>
              {/* KANVAS SLIDE UTAMA (RASIO 16:9 IDENTIK PUBLIK) */}
              <Content
                data-testid="studio-center-workspace"
                onClick={() => setSelectedId(null)}
                style={{
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  overflow: 'auto',
                }}
              >
                <div
                  data-testid="studio-stage-16-9"
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 960,
                    aspectRatio: '16 / 9',
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  {renderUnifiedSlideStage()}
                </div>
              </Content>

              {/* SIDER KANAN PUTIH: ANTD FORM INSPECTOR ELEMEN */}
              <Sider
                width={310}
                theme="light"
                data-testid="studio-right-inspector"
                style={{
                  backgroundColor: '#ffffff',
                  borderLeft: '1px solid #e2e8f0',
                  overflowY: 'auto',
                  padding: 14,
                }}
              >
                {/* KASUS A: ELEMEN TAMBAHAN SEDANG DIPILIH */}
                {selectedCustomEl && (
                  <Form layout="vertical" size="small">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <Space size={6}>
                        <Tag color="blue" style={{ margin: 0 }}>
                          Elemen Baru
                        </Tag>
                        <Text strong style={{ fontSize: 12 }}>
                          {selectedCustomEl.name}
                        </Text>
                      </Space>
                      <Space size={4}>
                        <Tooltip title="Duplikat Elemen">
                          <Button
                            size="small"
                            data-testid="floating-btn-duplicate"
                            icon={<CopyOutlined />}
                            onClick={() =>
                              duplicateCustomElement(selectedCustomEl)
                            }
                          />
                        </Tooltip>
                        <Tooltip title="Hapus Elemen">
                          <Button
                            size="small"
                            danger
                            data-testid="floating-btn-delete"
                            icon={<DeleteOutlined />}
                            onClick={deleteSelected}
                          />
                        </Tooltip>
                      </Space>
                    </div>

                    <Form.Item label="Teks / Label Elemen" style={{ marginBottom: 10 }}>
                      <Input
                        data-testid="inspector-label-input"
                        value={selectedCustomEl.label}
                        onChange={(e) =>
                          commitCustomElement(selectedCustomEl.id, {
                            label: e.target.value,
                          })
                        }
                        placeholder="Masukkan teks tombol/label..."
                      />
                    </Form.Item>

                    <Form.Item label="Media Gambar & Suara" style={{ marginBottom: 10 }}>
                      <Space wrap size={6}>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '3px 10px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            backgroundColor: '#ffffff',
                          }}
                        >
                          <PictureOutlined style={{ color: '#1677ff' }} />
                          <span>Upload Gambar</span>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleUploadFile(e.target.files[0], (url) =>
                                commitCustomElement(selectedCustomEl.id, {
                                  imageUrl: url,
                                })
                              )
                            }
                          />
                        </label>

                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '3px 10px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            backgroundColor: '#ffffff',
                          }}
                        >
                          <SoundOutlined style={{ color: '#1677ff' }} />
                          <span>Upload Suara</span>
                          <input
                            type="file"
                            accept="audio/*"
                            style={{ display: 'none' }}
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleUploadFile(e.target.files[0], (url) =>
                                commitCustomElement(selectedCustomEl.id, {
                                  audioUrl: url,
                                  actionType: 'play-audio',
                                })
                              )
                            }
                          />
                        </label>

                        {selectedCustomEl.audioUrl && (
                          <Button
                            size="small"
                            icon={<PlayCircleOutlined />}
                            onClick={() =>
                              new Audio(selectedCustomEl.audioUrl!)
                                .play()
                                .catch(() => {})
                            }
                          >
                            Tes Suara
                          </Button>
                        )}
                      </Space>
                    </Form.Item>

                    <Form.Item label="Gaya Visual (Warna & Ukuran Font)" style={{ marginBottom: 10 }}>
                      <Space size={8} align="center">
                        <Tooltip title="Warna Latar">
                          <input
                            type="color"
                            data-testid="inspector-bg-color"
                            value={
                              selectedCustomEl.bgColor.startsWith('#')
                                ? selectedCustomEl.bgColor
                                : '#1677ff'
                            }
                            onChange={(e) =>
                              commitCustomElement(selectedCustomEl.id, {
                                bgColor: e.target.value,
                              })
                            }
                            style={{
                              width: 28,
                              height: 24,
                              padding: 0,
                              border: '1px solid #cbd5e1',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          />
                        </Tooltip>
                        <Tooltip title="Warna Teks">
                          <input
                            type="color"
                            value={
                              selectedCustomEl.textColor.startsWith('#')
                                ? selectedCustomEl.textColor
                                : '#ffffff'
                            }
                            onChange={(e) =>
                              commitCustomElement(selectedCustomEl.id, {
                                textColor: e.target.value,
                              })
                            }
                            style={{
                              width: 28,
                              height: 24,
                              padding: 0,
                              border: '1px solid #cbd5e1',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          />
                        </Tooltip>
                        <InputNumber
                          min={10}
                          max={72}
                          value={selectedCustomEl.fontSize}
                          addonBefore="Font"
                          style={{ width: 105 }}
                          onChange={(v) =>
                            commitCustomElement(selectedCustomEl.id, {
                              fontSize: Number(v ?? 15),
                            })
                          }
                        />
                      </Space>
                    </Form.Item>

                    <Form.Item label="Posisi & Ukuran Kanvas (%)" style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 6,
                        }}
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          addonBefore="X%"
                          value={selectedCustomEl.x}
                          style={{ width: '100%' }}
                          onChange={(v) =>
                            commitCustomElement(selectedCustomEl.id, {
                              x: Number(v ?? 0),
                            })
                          }
                        />
                        <InputNumber
                          min={0}
                          max={100}
                          addonBefore="Y%"
                          value={selectedCustomEl.y}
                          style={{ width: '100%' }}
                          onChange={(v) =>
                            commitCustomElement(selectedCustomEl.id, {
                              y: Number(v ?? 0),
                            })
                          }
                        />
                        <InputNumber
                          min={5}
                          max={100}
                          addonBefore="L%"
                          value={selectedCustomEl.width}
                          style={{ width: '100%' }}
                          onChange={(v) =>
                            commitCustomElement(selectedCustomEl.id, {
                              width: Number(v ?? 20),
                            })
                          }
                        />
                        <InputNumber
                          min={5}
                          max={100}
                          addonBefore="T%"
                          value={selectedCustomEl.height}
                          style={{ width: '100%' }}
                          onChange={(v) =>
                            commitCustomElement(selectedCustomEl.id, {
                              height: Number(v ?? 12),
                            })
                          }
                        />
                      </div>
                    </Form.Item>

                    <Form.Item label="Animasi Masuk" style={{ marginBottom: 10 }}>
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <Select
                          value={selectedCustomEl.animation.type}
                          onChange={(val: AnimationType) =>
                            commitCustomElement(selectedCustomEl.id, {
                              animation: {
                                ...selectedCustomEl.animation,
                                type: val,
                              },
                            })
                          }
                          options={[
                            { value: 'none', label: 'Tanpa Animasi' },
                            { value: 'fade-in', label: 'Fade In' },
                            { value: 'zoom-in', label: 'Zoom In' },
                            { value: 'slide-up', label: 'Slide Up' },
                            { value: 'slide-left', label: 'Slide Left' },
                            { value: 'bounce', label: 'Bounce' },
                          ]}
                        />
                        <Space size={6}>
                          <InputNumber
                            min={0}
                            step={0.2}
                            addonBefore="Mulai"
                            value={selectedCustomEl.animation.delay}
                            onChange={(v) =>
                              commitCustomElement(selectedCustomEl.id, {
                                animation: {
                                  ...selectedCustomEl.animation,
                                  delay: Number(v ?? 0),
                                },
                              })
                            }
                          />
                          <InputNumber
                            min={0.2}
                            step={0.2}
                            addonBefore="Durasi"
                            value={selectedCustomEl.animation.duration}
                            onChange={(v) =>
                              commitCustomElement(selectedCustomEl.id, {
                                animation: {
                                  ...selectedCustomEl.animation,
                                  duration: Math.max(0.2, Number(v ?? 0.6)),
                                },
                              })
                            }
                          />
                        </Space>
                      </Space>
                    </Form.Item>

                    <Form.Item label="Aksi Saat Diklik" style={{ marginBottom: 8 }}>
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <Select
                          data-testid="inspector-action-type"
                          value={selectedCustomEl.actionType}
                          onChange={(val) =>
                            commitCustomElement(selectedCustomEl.id, {
                              actionType: val,
                            })
                          }
                          options={[
                            { value: 'none', label: 'Tidak Ada Aksi' },
                            { value: 'goto-slide', label: 'Pindah ke Slide' },
                            { value: 'open-popup', label: 'Buka Pop-up Materi' },
                            { value: 'play-audio', label: 'Putar Audio' },
                          ]}
                        />

                        {selectedCustomEl.actionType === 'goto-slide' && (
                          <Select
                            value={selectedCustomEl.targetSlide ?? 0}
                            onChange={(idx) =>
                              commitCustomElement(selectedCustomEl.id, {
                                targetSlide: Number(idx),
                              })
                            }
                            options={data.slides.map((s, idx) => ({
                              value: idx,
                              label: `Ke Slide ${idx + 1}: ${s.title}`,
                            }))}
                          />
                        )}

                        {selectedCustomEl.actionType === 'open-popup' && (
                          <>
                            <Input
                              placeholder="Judul Pop-up"
                              value={selectedCustomEl.popupTitle || ''}
                              onChange={(e) =>
                                commitCustomElement(selectedCustomEl.id, {
                                  popupTitle: e.target.value,
                                })
                              }
                            />
                            <Input.TextArea
                              rows={2}
                              placeholder="Isi penjelasan pop-up..."
                              value={selectedCustomEl.popupContent || ''}
                              onChange={(e) =>
                                commitCustomElement(selectedCustomEl.id, {
                                  popupContent: e.target.value,
                                })
                              }
                            />
                          </>
                        )}
                      </Space>
                    </Form.Item>
                  </Form>
                )}

                {/* KASUS B: ELEMEN ASLI SLIDE SEDANG DIPILIH */}
                {selectedId &&
                  selectedId.startsWith('native-') &&
                  !selectedCustomEl && (
                    <Form layout="vertical" size="small">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 10,
                        }}
                      >
                        <Space size={6}>
                          <Tag color="geekblue" style={{ margin: 0 }}>
                            Elemen Asli Slide
                          </Tag>
                          <Text strong style={{ fontSize: 12 }}>
                            {selectedNativeOv?.tagName || 'DOM'}
                          </Text>
                        </Space>
                        <Space size={4}>
                          <Tooltip title="Reset ke Posisi Awal">
                            <Button
                              size="small"
                              icon={<ReloadOutlined />}
                              onClick={() =>
                                updateNativeOverride(selectedId, {
                                  xDeltaPct: 0,
                                  yDeltaPct: 0,
                                  hidden: false,
                                })
                              }
                            />
                          </Tooltip>
                          <Tooltip title="Sembunyikan Elemen Asli">
                            <Button
                              size="small"
                              danger
                              data-testid="floating-btn-delete"
                              icon={<DeleteOutlined />}
                              onClick={deleteSelected}
                            />
                          </Tooltip>
                        </Space>
                      </div>

                      {selectedId.includes('-img') ? (
                        <Form.Item label="Ganti Gambar Aset Asli">
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 12px',
                              border: '1px solid #1677ff',
                              borderRadius: 6,
                              color: '#1677ff',
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            <PictureOutlined />
                            <span>Pilih Gambar Pengganti</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) =>
                                e.target.files?.[0] &&
                                handleUploadFile(e.target.files[0], (url) =>
                                  updateNativeOverride(selectedId, {
                                    customImageSrc: url,
                                  })
                                )
                              }
                            />
                          </label>
                        </Form.Item>
                      ) : (
                        <Form.Item label="Ubah Teks Elemen Asli">
                          <Input
                            data-testid="native-text-override-input"
                            placeholder="Ketik teks pengganti..."
                            value={selectedNativeOv?.customText ?? ''}
                            onChange={(e) =>
                              updateNativeOverride(selectedId, {
                                customText: e.target.value,
                              })
                            }
                          />
                        </Form.Item>
                      )}

                      <Form.Item label="Geser Posisi Relatif (X% / Y%)">
                        <Space size={8}>
                          <InputNumber
                            step={1}
                            addonBefore="ΔX%"
                            value={selectedNativeOv?.xDeltaPct ?? 0}
                            onChange={(v) =>
                              updateNativeOverride(selectedId, {
                                xDeltaPct: Number(v ?? 0),
                              })
                            }
                          />
                          <InputNumber
                            step={1}
                            addonBefore="ΔY%"
                            value={selectedNativeOv?.yDeltaPct ?? 0}
                            onChange={(v) =>
                              updateNativeOverride(selectedId, {
                                yDeltaPct: Number(v ?? 0),
                              })
                            }
                          />
                        </Space>
                      </Form.Item>

                      <Form.Item label="Animasi Elemen Asli">
                        <Space
                          direction="vertical"
                          size={6}
                          style={{ width: '100%' }}
                        >
                          <Select
                            value={
                              selectedNativeOv?.animation?.type || 'none'
                            }
                            onChange={(val: AnimationType) =>
                              updateNativeOverride(selectedId, {
                                animation: {
                                  type: val,
                                  delay:
                                    selectedNativeOv?.animation?.delay ?? 0,
                                  duration:
                                    selectedNativeOv?.animation?.duration ??
                                    0.6,
                                },
                              })
                            }
                            options={[
                              { value: 'none', label: 'Tanpa Animasi' },
                              { value: 'fade-in', label: 'Fade In' },
                              { value: 'zoom-in', label: 'Zoom In' },
                              { value: 'slide-up', label: 'Slide Up' },
                              { value: 'slide-left', label: 'Slide Left' },
                              { value: 'bounce', label: 'Bounce' },
                            ]}
                          />
                        </Space>
                      </Form.Item>
                    </Form>
                  )}

                {/* KASUS C: BELUM ADA ELEMEN YANG DIKLIK */}
                {!selectedId && (
                  <Form layout="vertical" size="small">
                    <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
                      Pengaturan Slide & Kanvas
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Klik langsung teks, gambar, atau tombol di dalam kanvas
                      untuk mengedit, menggeser, atau mengatur animasinya.
                    </Text>

                    <Divider style={{ margin: '12px 0' }} />

                    <Form.Item label="Judul Slide Aktif">
                      <Input
                        data-testid="inspector-slide-title-input"
                        value={currentSlide.title}
                        onChange={(e) => {
                          const nextSlides = data.slides.map((s, i) =>
                            i === slideIdx
                              ? { ...s, title: e.target.value }
                              : s
                          );
                          commitData({ ...data, slides: nextSlides });
                        }}
                      />
                    </Form.Item>

                    <Form.Item label="Warna Latar Belakang Slide">
                      <Space size={8} align="center">
                        <input
                          type="color"
                          value={
                            (currentSlide.bgColor || '#FFFFFF').startsWith('#')
                              ? currentSlide.bgColor || '#FFFFFF'
                              : '#FFFFFF'
                          }
                          onChange={(e) => {
                            const nextSlides = data.slides.map((s, i) =>
                              i === slideIdx
                                ? { ...s, bgColor: e.target.value }
                                : s
                            );
                            commitData({ ...data, slides: nextSlides });
                          }}
                          style={{
                            width: 32,
                            height: 26,
                            padding: 0,
                            border: '1px solid #cbd5e1',
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                        />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {isCustomSlide
                            ? 'Latar Kanvas Slide Kustom'
                            : 'Latar Slide Asli'}
                        </Text>
                      </Space>
                    </Form.Item>

                    <Form.Item label="Tambah Elemen Cepat ke Slide">
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8,
                        }}
                      >
                        <Button
                          icon={<FontSizeOutlined />}
                          onClick={() => addCustomElement('text')}
                        >
                          + Teks
                        </Button>
                        <Button
                          icon={<PictureOutlined />}
                          onClick={() => addCustomElement('image-button')}
                        >
                          + Tombol
                        </Button>
                        <Button
                          icon={<PlusOutlined />}
                          onClick={() => addCustomElement('image')}
                        >
                          + Gambar
                        </Button>
                        <Button
                          icon={<SoundOutlined />}
                          onClick={() => addCustomElement('audio-button')}
                        >
                          + Audio
                        </Button>
                      </div>
                    </Form.Item>
                  </Form>
                )}
              </Sider>
            </Layout>

            {/* ============================================================
                3. ANTD FOOTER PUTIH: TABS (ANTD TABLE TIMELINE & DAFTAR CARD SLIDE)
               ============================================================ */}
            <Footer
              data-testid="canva-bottom-footer"
              style={{
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                padding: '0 16px',
                flexShrink: 0,
              }}
            >
              <Tabs
                size="small"
                activeKey={bottomTab}
                onChange={(key) => {
                  setBottomTab(key as 'timeline' | 'slides');
                  setIsBottomOpen(true);
                }}
                tabBarStyle={{ marginBottom: isBottomOpen ? 8 : 0 }}
                tabBarExtraContent={
                  <Button
                    size="small"
                    type="text"
                    icon={isBottomOpen ? <DownOutlined /> : <UpOutlined />}
                    onClick={() => setIsBottomOpen(!isBottomOpen)}
                  />
                }
                items={[
                  {
                    key: 'timeline',
                    label: (
                      <span
                        data-testid="tab-bottom-timeline"
                        onClick={() => {
                          setBottomTab('timeline');
                          setIsBottomOpen(true);
                        }}
                      >
                        <FieldTimeOutlined style={{ marginRight: 6 }} />
                        Timeline & Animasi Elemen ({timelineRows.length})
                      </span>
                    ),
                    children: isBottomOpen ? (
                      <div
                        data-testid="canva-timeline-panel"
                        style={{ height: 175, overflowY: 'auto', paddingBottom: 8 }}
                      >
                        <Table<TimelineRowRecord>
                          rowKey="id"
                          size="small"
                          pagination={false}
                          columns={timelineColumns}
                          dataSource={timelineRows}
                          locale={{
                            emptyText: (
                              <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Belum ada elemen di slide ini"
                              />
                            ),
                          }}
                          onRow={(record) => ({
                            'data-testid': `timeline-row-${record.id}`,
                            onClick: () => setSelectedId(record.id),
                            style: {
                              cursor: 'pointer',
                              backgroundColor:
                                selectedId === record.id
                                  ? '#eff6ff'
                                  : '#ffffff',
                            },
                          })}
                        />
                      </div>
                    ) : null,
                  },
                  {
                    key: 'slides',
                    label: (
                      <span
                        data-testid="tab-bottom-slides"
                        onClick={() => {
                          setBottomTab('slides');
                          setIsBottomOpen(true);
                        }}
                      >
                        <AppstoreOutlined style={{ marginRight: 6 }} />
                        Halaman Slide ({data.slides.length})
                      </span>
                    ),
                    children: isBottomOpen ? (
                      <div
                        data-testid="canva-slide-strip"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          overflowX: 'auto',
                          paddingBottom: 10,
                          height: 175,
                        }}
                      >
                        {data.slides.map((s, idx) => (
                          <Card
                            key={s.id}
                            size="small"
                            hoverable
                            data-testid={`slide-item-${s.id}`}
                            onClick={() => handleSetActiveSlideIndex(idx)}
                            style={{
                              width: 170,
                              minWidth: 170,
                              height: 112,
                              borderRadius: 10,
                              borderColor:
                                slideIdx === idx ? '#1677ff' : '#e2e8f0',
                              borderWidth: slideIdx === idx ? 2 : 1,
                              backgroundColor:
                                slideIdx === idx ? '#eff6ff' : '#ffffff',
                              flexShrink: 0,
                            }}
                            styles={{
                              body: {
                                padding: 10,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                              },
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Tag
                                color={
                                  slideIdx === idx
                                    ? 'blue'
                                    : idx >= ORIGINAL_SLIDE_COUNT ||
                                        s.isCustomBlank
                                      ? 'green'
                                      : 'default'
                                }
                                style={{ margin: 0, fontSize: 10 }}
                              >
                                Slide {idx + 1}
                              </Tag>
                              <Space
                                size={2}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Tooltip title="Duplikat Slide">
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<CopyOutlined />}
                                    onClick={() => duplicateSlide(idx)}
                                  />
                                </Tooltip>
                                <Tooltip title="Hapus Slide">
                                  <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => deleteSlide(idx)}
                                  />
                                </Tooltip>
                              </Space>
                            </div>

                            <Input
                              size="small"
                              variant="borderless"
                              value={s.title}
                              onClick={() => handleSetActiveSlideIndex(idx)}
                              onChange={(e) => {
                                const nextSlides = data.slides.map((sl, i) =>
                                  i === idx
                                    ? { ...sl, title: e.target.value }
                                    : sl
                                );
                                commitData({ ...data, slides: nextSlides });
                              }}
                              style={{
                                padding: 0,
                                fontWeight: 600,
                                fontSize: 12,
                                color: '#1e293b',
                              }}
                            />

                            <Text type="secondary" style={{ fontSize: 10 }}>
                              {s.elements.length} elemen tambahan
                            </Text>
                          </Card>
                        ))}

                        {/* Tombol Tambah & Duplikat Slide */}
                        <Space direction="vertical" size={6} style={{ flexShrink: 0 }}>
                          <Button
                            type="dashed"
                            data-testid="btn-add-new-slide"
                            icon={<PlusOutlined />}
                            onClick={addNewSlide}
                            style={{ width: 150, height: 50 }}
                          >
                            Tambah Slide
                          </Button>
                          <Button
                            data-testid="btn-duplicate-active-slide"
                            icon={<CopyOutlined />}
                            onClick={() => duplicateSlide(slideIdx)}
                            style={{ width: 150, height: 50 }}
                          >
                            Duplikat Slide Ini
                          </Button>
                        </Space>
                      </div>
                    ) : null,
                  },
                ]}
              />
            </Footer>
          </Layout>

          {/* Modal Pop-up Materi saat Live Preview */}
          <Modal
            open={Boolean(popup)}
            title={popup?.title}
            footer={null}
            onCancel={() => setPopup(null)}
            centered
          >
            <p style={{ whiteSpace: 'pre-line', color: '#475569' }}>
              {popup?.content}
            </p>
          </Modal>
        </div>
      </ConfigProvider>
    </StudioContext.Provider>
  );
};

export const CanvaStudio = StarlaAdminStudio;
export default StarlaAdminStudio;
