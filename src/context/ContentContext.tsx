// src/context/ContentContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppContentData, SlideData, CanvasElement, OriginalElementOverride } from '../types/canvas';

// Helper pembacaan Environment Variable lintas platform (Next.js & Vite AI Studio)
const getEnvVar = (nextKey: string, viteKey: string, fallback = ''): string => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[nextKey]) {
      return process.env[nextKey] as string;
    }
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[viteKey]) {
      return (import.meta as any).env[viteKey] as string;
    }
  } catch {
    // Abaikan jika environment tidak ditemukan
  }
  return fallback;
};

const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
export const ADMIN_PIN = getEnvVar('NEXT_PUBLIC_ADMIN_PIN', 'VITE_ADMIN_PIN', '123456');

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const STORAGE_KEY = 'articulate_studio_content_v1';

export const DEFAULT_CONTENT: AppContentData = {
  projectTitle: 'Interactive Articulate Module',
  version: 1,
  updatedAt: new Date().toISOString(),
  slides: [
    {
      id: 'slide-1',
      title: 'Slide 1 - Layar Utama',
      elements: [],
      originalOverrides: {},
    },
  ],
};

interface ContentContextType {
  content: AppContentData;
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  activeSlide: SlideData;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
  snapEnabled: boolean;
  setSnapEnabled: (val: boolean) => void;
  // History Undo / Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  // Manipulasi Elemen & Slide
  updateElementTransient: (elementId: string, partial: Partial<CanvasElement>) => void;
  commitElementUpdate: (elementId: string, partial: Partial<CanvasElement>) => void;
  addElement: (type: CanvasElement['type']) => void;
  duplicateElement: (elementId: string) => void;
  deleteElement: (elementId: string) => void;
  updateOriginalOverride: (origId: string, partial: Partial<OriginalElementOverride>) => void;
  addSlide: () => void;
  duplicateSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  // Cloud Sync & Media
  isSaving: boolean;
  syncStatus: 'synced' | 'local-only' | 'saving' | 'error';
  saveToCloud: () => Promise<boolean>;
  uploadMediaFile: (file: File) => Promise<string>;
  resetCurrentSlide: () => void;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<AppContentData>(DEFAULT_CONTENT);
  const [history, setHistory] = useState<AppContentData[]>([DEFAULT_CONTENT]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local-only' | 'saving' | 'error'>('local-only');

  // Load awal dari Supabase atau fallback ke LocalStorage
  useEffect(() => {
    const loadInitialContent = async () => {
      try {
        const localRaw = localStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          const parsed = JSON.parse(localRaw) as AppContentData;
          setContent(parsed);
          setHistory([parsed]);
        }

        if (supabase) {
          const { data, error } = await supabase
            .from('app_contents')
            .select('content_data')
            .eq('slug', 'main')
            .single();

          if (!error && data?.content_data) {
            const cloudData = data.content_data as AppContentData;
            setContent(cloudData);
            setHistory([cloudData]);
            setHistoryIndex(0);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
            setSyncStatus('synced');
          }
        }
      } catch (err) {
        console.warn('Menggunakan fallback konten lokal:', err);
      }
    };
    loadInitialContent();
  }, []);

  // Simpan state baru ke History Stack (maksimal 30 langkah Undo/Redo)
  const pushWithHistory = useCallback(
    (updater: (prev: AppContentData) => AppContentData) => {
      setContent((prev) => {
        const next = {
          ...updater(prev),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setHistory((hPrev) => {
          const sliced = hPrev.slice(0, historyIndex + 1);
          const updatedStack = [...sliced, next].slice(-30);
          setHistoryIndex(updatedStack.length - 1);
          return updatedStack;
        });
        return next;
      });
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      setContent(history[nextIdx]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history[nextIdx]));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setContent(history[nextIdx]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history[nextIdx]));
    }
  }, [history, historyIndex]);

  const activeSlide: SlideData = content.slides[activeSlideIndex] || content.slides[0] || DEFAULT_CONTENT.slides[0];

  // Update cepat 60fps saat drag/resize tanpa memenuhi history stack
  const updateElementTransient = useCallback(
    (elementId: string, partial: Partial<CanvasElement>) => {
      setContent((prev) => {
        const slides = [...prev.slides];
        const current = slides[activeSlideIndex];
        if (!current) return prev;
        slides[activeSlideIndex] = {
          ...current,
          elements: current.elements.map((el) => (el.id === elementId ? { ...el, ...partial } : el)),
        };
        return { ...prev, slides };
      });
    },
    [activeSlideIndex]
  );

  // Commit perubahan ke Undo/Redo stack saat klik dilepas atau properti diubah
  const commitElementUpdate = useCallback(
    (elementId: string, partial: Partial<CanvasElement>) => {
      pushWithHistory((prev) => {
        const slides = [...prev.slides];
        const current = slides[activeSlideIndex];
        if (!current) return prev;
        slides[activeSlideIndex] = {
          ...current,
          elements: current.elements.map((el) => (el.id === elementId ? { ...el, ...partial } : el)),
        };
        return { ...prev, slides };
      });
    },
    [activeSlideIndex, pushWithHistory]
  );

  // Tambah elemen baru ke tengah kanvas
  const addElement = useCallback(
    (type: CanvasElement['type']) => {
      const id = `el-${Date.now()}`;
      const newElement: CanvasElement = {
        id,
        name:
          type === 'image-button'
            ? 'Tombol Gambar'
            : type === 'text'
            ? 'Teks Baru'
            : type === 'image'
            ? 'Gambar Visual'
            : 'Tombol Audio',
        type,
        x: 38,
        y: 38,
        width: type === 'text' ? 28 : 22,
        height: type === 'text' ? 12 : 20,
        zIndex: (activeSlide.elements.length || 0) + 10,
        locked: false,
        hidden: false,
        label:
          type === 'image-button'
            ? 'Klik Mulai'
            : type === 'text'
            ? 'Ketik Judul / Materi di Sini'
            : type === 'audio-button'
            ? 'Putar Narasi'
            : '',
        imageUrl:
          type === 'image-button' || type === 'image'
            ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
            : undefined,
        style: {
          backgroundColor: type === 'text' ? 'rgba(15, 23, 42, 0.75)' : '#1E293B',
          textColor: '#FFFFFF',
          fontSize: 16,
          fontWeight: 'bold',
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#FACC15',
          opacity: 100,
          shadow: 'lg',
          hoverEffect: 'scale',
          objectFit: 'cover',
          textPosition: type === 'image' ? 'hidden' : 'bottom',
        },
        action: {
          type: type === 'audio-button' ? 'play-audio' : 'none',
          targetSlideIndex: 0,
          popupTitle: 'Informasi Materi',
          popupContent: 'Tulis penjelasan detail materi atau umpan balik interaktif di sini.',
        },
      };

      pushWithHistory((prev) => {
        const slides = [...prev.slides];
        slides[activeSlideIndex] = {
          ...slides[activeSlideIndex],
          elements: [...slides[activeSlideIndex].elements, newElement],
        };
        return { ...prev, slides };
      });
      setSelectedElementId(id);
    },
    [activeSlide.elements.length, activeSlideIndex, pushWithHistory]
  );

  const duplicateElement = useCallback(
    (elementId: string) => {
      const target = activeSlide.elements.find((e) => e.id === elementId);
      if (!target) return;
      const newId = `el-${Date.now()}`;
      const copy: CanvasElement = {
        ...JSON.parse(JSON.stringify(target)),
        id: newId,
        name: `${target.name} (Salinan)`,
        x: Math.min(85, target.x + 4),
        y: Math.min(85, target.y + 4),
        zIndex: activeSlide.elements.length + 15,
      };
      pushWithHistory((prev) => {
        const slides = [...prev.slides];
        slides[activeSlideIndex] = {
          ...slides[activeSlideIndex],
          elements: [...slides[activeSlideIndex].elements, copy],
        };
        return { ...prev, slides };
      });
      setSelectedElementId(newId);
    },
    [activeSlide.elements, activeSlideIndex, pushWithHistory]
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      pushWithHistory((prev) => {
        const slides = [...prev.slides];
        slides[activeSlideIndex] = {
          ...slides[activeSlideIndex],
          elements: slides[activeSlideIndex].elements.filter((e) => e.id !== elementId),
        };
        return { ...prev, slides };
      });
      if (selectedElementId === elementId) setSelectedElementId(null);
    },
    [activeSlideIndex, pushWithHistory, selectedElementId]
  );

  const updateOriginalOverride = useCallback(
    (origId: string, partial: Partial<OriginalElementOverride>) => {
      pushWithHistory((prev) => {
        const slides = [...prev.slides];
        const current = slides[activeSlideIndex];
        const existing = current.originalOverrides[origId] || {
          id: origId,
          xDeltaPct: 0,
          yDeltaPct: 0,
          scale: 1,
          hidden: false,
        };
        slides[activeSlideIndex] = {
          ...current,
          originalOverrides: {
            ...current.originalOverrides,
            [origId]: { ...existing, ...partial },
          },
        };
        return { ...prev, slides };
      });
    },
    [activeSlideIndex, pushWithHistory]
  );

  const addSlide = useCallback(() => {
    const newSlide: SlideData = {
      id: `slide-${Date.now()}`,
      title: `Slide ${content.slides.length + 1}`,
      elements: [],
      originalOverrides: {},
    };
    pushWithHistory((prev) => ({
      ...prev,
      slides: [...prev.slides, newSlide],
    }));
    setActiveSlideIndex(content.slides.length);
  }, [content.slides.length, pushWithHistory]);

  const duplicateSlide = useCallback(
    (index: number) => {
      const source = content.slides[index];
      if (!source) return;
      const cloned: SlideData = {
        ...JSON.parse(JSON.stringify(source)),
        id: `slide-${Date.now()}`,
        title: `${source.title} (Salinan)`,
      };
      pushWithHistory((prev) => {
        const slides = [...prev.slides];
        slides.splice(index + 1, 0, cloned);
        return { ...prev, slides };
      });
      setActiveSlideIndex(index + 1);
    },
    [content.slides, pushWithHistory]
  );

  const deleteSlide = useCallback(
    (index: number) => {
      if (content.slides.length <= 1) return;
      pushWithHistory((prev) => ({
        ...prev,
        slides: prev.slides.filter((_, idx) => idx !== index),
      }));
      setActiveSlideIndex((prev) => Math.max(0, prev - 1));
    },
    [content.slides.length, pushWithHistory]
  );

  const resetCurrentSlide = useCallback(() => {
    pushWithHistory((prev) => {
      const slides = [...prev.slides];
      slides[activeSlideIndex] = {
        ...slides[activeSlideIndex],
        elements: [],
        originalOverrides: {},
      };
      return { ...prev, slides };
    });
    setSelectedElementId(null);
  }, [activeSlideIndex, pushWithHistory]);

  // Simpan ke Supabase + LocalStorage
  const saveToCloud = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setSyncStatus('saving');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      if (!supabase) {
        setSyncStatus('local-only');
        setIsSaving(false);
        return true;
      }

      const { error } = await supabase.from('app_contents').upsert(
        {
          slug: 'main',
          content_data: content,
          version: content.version + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      );

      if (error) throw error;
      setSyncStatus('synced');
      setIsSaving(false);
      return true;
    } catch (err) {
      console.error('Gagal menyimpan ke Supabase, tersimpan di lokal:', err);
      setSyncStatus('error');
      setIsSaving(false);
      return false;
    }
  }, [content]);

  // Upload Gambar/Audio ke Supabase Storage dengan Fallback DataURL Base64 otomatis
  const uploadMediaFile = useCallback(async (file: File): Promise<string> => {
    if (supabase) {
      try {
        const ext = file.name.split('.').pop() || 'bin';
        const filePath = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const { error } = await supabase.storage.from('media-assets').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (!error) {
          const { data } = supabase.storage.from('media-assets').getPublicUrl(filePath);
          if (data?.publicUrl) return data.publicUrl;
        }
      } catch (e) {
        console.warn('Supabase storage fallback ke DataURL lokal:', e);
      }
    }
    // Fallback Base64 DataURL agar di AI Studio Preview tetap langsung tampil 100%
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  return (
    <ContentContext.Provider
      value={{
        content,
        activeSlideIndex,
        setActiveSlideIndex,
        activeSlide,
        selectedElementId,
        setSelectedElementId,
        isEditMode,
        setIsEditMode,
        snapEnabled,
        setSnapEnabled,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        undo,
        redo,
        updateElementTransient,
        commitElementUpdate,
        addElement,
        duplicateElement,
        deleteElement,
        updateOriginalOverride,
        addSlide,
        duplicateSlide,
        deleteSlide,
        isSaving,
        syncStatus,
        saveToCloud,
        uploadMediaFile,
        resetCurrentSlide,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent wajib digunakan di dalam ContentProvider');
  return ctx;
};