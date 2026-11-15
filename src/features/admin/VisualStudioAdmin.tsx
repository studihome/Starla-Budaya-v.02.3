import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import {
  CanvasElementItem,
  CanvasElementType,
  CanvasHoverEffect,
  SlideContentItem,
} from '../../data/defaultContent';
import {
  CanvasActionType,
  CanvasShadowPreset,
  normalizeShadowPreset,
} from '../../types/canvas';
import {
  addSlideItem,
  deleteSlideItem,
  isSlideHidden,
} from './adminHelpers';
import { CanvasStageOverlay } from '../canvas/CanvasStageOverlay';
import { clampPct } from '../canvas/canvasMath';

export interface VisualStudioAdminProps {
  selectedSlideId: string;
  onSelectSlideId: (slideId: string) => void;
  onOpenClassicTab?: (tab: 'quiz' | 'media' | 'meta' | 'backup') => void;
  onCloseAdmin?: () => void;
  onStatusMessage?: (
    type: 'success' | 'error' | 'info',
    message: string
  ) => void;
}

type LeftDockTab = 'slides' | 'elements' | 'layers';

const PRESET_CULTURE_ICONS = [
  { label: 'Tanpa Ikon', value: '' },
  { label: 'Garuda / Bintang', value: '★' },
  { label: 'Musik / Angklung', value: '♪' },
  { label: 'Suara / Narasi', value: '🔊' },
  { label: 'Informasi / Buku', value: '📖' },
  { label: 'Rumah Adat', value: '🏛' },
  { label: 'Panah Lanjut', value: '➔' },
  { label: 'Ceklis Selesai', value: '✓' },
];

const PRESET_STICKER_IMAGES = [
  { label: 'Lencana Selesai', url: 'mobile/5fD3uOAkxBz.png' },
  { label: 'Ilustrasi Budaya 1', url: 'mobile/6EfvCxuLoY5.png' },
  { label: 'Karakter Starla', url: 'mobile/5WGLEVYzj2G.png' },
  { label: 'Peta Nusantara', url: 'mobile/5X5KPiU9Isy.png' },
];

function resolvePreviewAssetUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  if (
    rawUrl.startsWith('http') ||
    rawUrl.startsWith('data:') ||
    rawUrl.startsWith('blob:') ||
    rawUrl.startsWith('/')
  ) {
    return rawUrl;
  }
  return `/${rawUrl}`;
}

function getSlideDisplayLabel(
  slide: SlideContentItem | undefined,
  fallbackIndex: number
): string {
  if (!slide) return `Slide #${fallbackIndex + 1}`;
  if (
    slide.title &&
    slide.title !== 'Untitled Slide' &&
    slide.title.trim().length > 0
  ) {
    return slide.title;
  }
  const firstInstruction = slide.instructions?.[0]?.trim();
  if (firstInstruction) {
    return firstInstruction.length > 42
      ? `${firstInstruction.slice(0, 42)}...`
      : firstInstruction;
  }
  const firstTextLine = slide.texts?.[0]?.lines?.[0]?.trim();
  if (firstTextLine) {
    return firstTextLine.length > 42
      ? `${firstTextLine.slice(0, 42)}...`
      : firstTextLine;
  }
  return slide.title || `Slide #${slide.slideNumber}`;
}

/**
 * VisualStudioAdmin (`src/features/admin/VisualStudioAdmin.tsx`)
 * Antarmuka WYSIWYG Builder modern bertema Dark Studio (#0F172A) bergaya Figma / Canva Pro
 * dengan Layout 4 Zona Ergonomis:
 * 1. Top Command Bar
 * 2. Left Dock (3 Tab: Slide, Tambah Elemen, Layer & Pemulihan)
 * 3. Center Workspace (16:9 Responsive Canvas + Floating Action Toolbar + Keyboard Delete/Backspace)
 * 4. Right Property Inspector (Gambar & Label, Gaya Visual, Aksi Klik & Audio, Koordinat Presisi)
 */
export const VisualStudioAdmin: React.FC<VisualStudioAdminProps> = ({
  selectedSlideId,
  onSelectSlideId,
  onOpenClassicTab,
  onCloseAdmin,
  onStatusMessage,
}) => {
  const {
    content,
    isSyncing,
    storageSource,
    isCanvasEditMode,
    setIsCanvasEditMode,
    isGridSnapEnabled,
    setIsGridSnapEnabled,
    selectedCanvasItemId,
    setSelectedCanvasItemId,
    setActiveCanvasSlideId,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    undoContent,
    redoContent,
    updateContent,
    updateSlideContent,
    updateElementOverride,
    hideNativeElement,
    restoreNativeElement,
    addCanvasElement,
    updateCanvasElement,
    deleteCanvasElement,
    duplicateCanvasElement,
    reorderCanvasElementLayer,
    toggleCanvasElementLock,
    resetSlideContent,
    duplicateSlide,
    saveContentToCloud,
    uploadMediaToCloud,
    resetContent,
  } = useContent();

  // Default ke Mode Edit Kanvas saat Studio dibuka agar admin bisa langsung mengedit
  useEffect(() => {
    setIsCanvasEditMode(true);
  }, [setIsCanvasEditMode]);

  // Sinkronkan activeCanvasSlideId dengan selectedSlideId
  useEffect(() => {
    if (selectedSlideId) {
      setActiveCanvasSlideId(selectedSlideId);
    }
  }, [selectedSlideId, setActiveCanvasSlideId]);

  // Pintasan Keyboard Studio: Ctrl+Z (Undo) dan Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInputFocused) return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (canUndo) {
          e.preventDefault();
          undoContent();
        }
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (canRedo) {
          e.preventDefault();
          redoContent();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undoContent, redoContent]);

  const [leftDockTab, setLeftDockTab] = useState<LeftDockTab>('elements');
  const [slideSearchQuery, setSlideSearchQuery] = useState<string>('');
  const [newSlideTitleInput, setNewSlideTitleInput] = useState<string>('');
  const [isPlayingInspectorAudio, setIsPlayingInspectorAudio] =
    useState<boolean>(false);
  const inspectorAudioRef = useRef<HTMLAudioElement | null>(null);

  const activeSlideId =
    content.slides[selectedSlideId]
      ? selectedSlideId
      : content.slideOrder[0] || '6AR4SV4ZYat';
  const currentSlide = content.slides[activeSlideId];

  const currentSlideOrderIndex = content.slideOrder.indexOf(activeSlideId);
  const canvasElements = currentSlide?.canvasElements || [];
  const elementOverrides = currentSlide?.elementOverrides || {};
  const hiddenElementIds = currentSlide?.hiddenElementIds || [];

  const selectedCustomElement: CanvasElementItem | null = useMemo(() => {
    if (!selectedCanvasItemId) return null;
    return (
      canvasElements.find((item) => item.id === selectedCanvasItemId) || null
    );
  }, [canvasElements, selectedCanvasItemId]);

  const nativeElementsList = useMemo(() => {
    if (!currentSlide) return [];
    const items: {
      id: string;
      kind: 'Teks SVG' | 'Gambar Slide';
      label: string;
      hidden: boolean;
      locked: boolean;
      zIndex: number;
      override?: typeof elementOverrides[string];
    }[] = [];

    (currentSlide.texts || []).forEach((tb) => {
      const ov = elementOverrides[tb.objectId];
      const isHidden = Boolean(
        ov?.hidden || hiddenElementIds.includes(tb.objectId)
      );
      items.push({
        id: tb.objectId,
        kind: 'Teks SVG',
        label:
          ov?.customText ||
          tb.lines.join(' ').trim() ||
          tb.altText ||
          tb.objectId,
        hidden: isHidden,
        locked: Boolean(ov?.locked),
        zIndex: ov?.zIndex ?? 35,
        override: ov,
      });
    });

    (currentSlide.images || []).forEach((img) => {
      const ov = elementOverrides[img.objectId];
      const isHidden = Boolean(
        ov?.hidden || hiddenElementIds.includes(img.objectId)
      );
      items.push({
        id: img.objectId,
        kind: 'Gambar Slide',
        label: img.altText || img.url.split('/').pop() || img.objectId,
        hidden: isHidden,
        locked: Boolean(ov?.locked),
        zIndex: ov?.zIndex ?? 30,
        override: ov,
      });
    });

    return items;
  }, [currentSlide, elementOverrides, hiddenElementIds]);

  const selectedNativeElement = useMemo(() => {
    if (!selectedCanvasItemId) return null;
    return (
      nativeElementsList.find((item) => item.id === selectedCanvasItemId) ||
      null
    );
  }, [nativeElementsList, selectedCanvasItemId]);

  const hiddenNativeElementsCount = useMemo(
    () => nativeElementsList.filter((item) => item.hidden).length,
    [nativeElementsList]
  );

  const filteredSlideIds = useMemo(() => {
    const q = slideSearchQuery.trim().toLowerCase();
    if (!q) return content.slideOrder;
    return content.slideOrder.filter((id, idx) => {
      const s = content.slides[id];
      const label = getSlideDisplayLabel(s, idx).toLowerCase();
      return (
        id.toLowerCase().includes(q) ||
        label.includes(q) ||
        String(idx + 1).includes(q)
      );
    });
  }, [content.slideOrder, content.slides, slideSearchQuery]);

  // Resolusi gambar latar untuk panggung kanvas 16:9
  const stageBackgroundUrl = useMemo(() => {
    if (!currentSlide) return '';
    if (currentSlide.backgroundUrl) {
      return resolvePreviewAssetUrl(currentSlide.backgroundUrl);
    }
    if (currentSlide.videos?.[0]?.posterUrl) {
      return resolvePreviewAssetUrl(currentSlide.videos[0].posterUrl);
    }
    if (activeSlideId === content.navigationConfig.slides.INTRO) {
      return resolvePreviewAssetUrl(content.videos.intro.posterUrl);
    }
    if (activeSlideId === content.navigationConfig.slides.SINEMA_VIDEO) {
      return resolvePreviewAssetUrl(content.videos.sinema.posterUrl);
    }
    if (currentSlide.images?.[0]?.url) {
      return resolvePreviewAssetUrl(currentSlide.images[0].url);
    }
    return '/mobile/Slide5WPRbcJDCqY.jpg';
  }, [activeSlideId, content.navigationConfig.slides, content.videos, currentSlide]);

  // Handlers Top Command Bar & Dock
  const handleAddElement = (
    type: CanvasElementType,
    presetPatch?: Partial<CanvasElementItem>
  ) => {
    if (!isCanvasEditMode) {
      setIsCanvasEditMode(true);
    }
    const created = addCanvasElement(activeSlideId, {
      type,
      ...(presetPatch || {}),
    });
    setSelectedCanvasItemId(created.id);
    onStatusMessage?.(
      'info',
      `Elemen "${created.label || created.type}" ditambahkan ke kanvas Slide #${currentSlideOrderIndex + 1}.`
    );
  };

  const handleCreateNewSlide = () => {
    const title =
      newSlideTitleInput.trim() ||
      `Slide Eksplorasi #${content.slideOrder.length + 1}`;
    const { nextSchema, createdSlideId } = addSlideItem(content, {
      title,
      instructions: [title],
    });
    updateContent(nextSchema);
    onSelectSlideId(createdSlideId);
    setNewSlideTitleInput('');
    onStatusMessage?.(
      'success',
      `Slide baru "${title}" berhasil dibuat dan dipilih.`
    );
  };

  const handleDuplicateActiveSlide = () => {
    const dupId = duplicateSlide(activeSlideId);
    if (dupId) {
      onSelectSlideId(dupId);
      onStatusMessage?.(
        'success',
        `Slide #${currentSlideOrderIndex + 1} berhasil diduplikasi.`
      );
    }
  };

  const handleDeleteActiveSlide = () => {
    const nextSchema = deleteSlideItem(content, activeSlideId);
    updateContent(nextSchema);
    const fallbackNextId =
      nextSchema.slideOrder[Math.max(0, currentSlideOrderIndex - 1)] ||
      nextSchema.slideOrder[0];
    if (fallbackNextId) {
      onSelectSlideId(fallbackNextId);
    }
    onStatusMessage?.(
      'info',
      `Slide (${activeSlideId}) telah dihapus/disembunyikan.`
    );
  };

  const handleResetCurrentSlide = () => {
    resetSlideContent(activeSlideId);
    onStatusMessage?.(
      'info',
      `Slide #${currentSlideOrderIndex + 1} (${activeSlideId}) dikembalikan ke susunan awal.`
    );
  };

  const handlePublishToSupabase = async () => {
    const result = await saveContentToCloud(content);
    if (result.source === 'supabase') {
      onStatusMessage?.(
        'success',
        'Berhasil disimpan & dipublikasikan ke Supabase Cloud (app_contents · slug = "main").'
      );
    } else {
      onStatusMessage?.(
        'info',
        result.error
          ? `Tersimpan aman di LocalStorage cadangan (${result.error}).`
          : 'Tersimpan di LocalStorage cadangan. Setel NEXT_PUBLIC_SUPABASE_URL untuk sinkronisasi Cloud.'
      );
    }
  };

  const handleUploadInspectorImage = async (file: File | null) => {
    if (!file || !selectedCustomElement) return;
    const res = await uploadMediaToCloud(file, file.name);
    if (res.url) {
      updateCanvasElement(activeSlideId, selectedCustomElement.id, {
        imageUrl: res.url,
      });
      onStatusMessage?.(
        'success',
        `Gambar elemen berhasil diunggah (${res.source === 'supabase' ? 'Supabase Storage' : 'Data URL Instan'}).`
      );
    }
  };

  const handleUploadInspectorAudio = async (file: File | null) => {
    if (!file || !selectedCustomElement) return;
    const res = await uploadMediaToCloud(file, file.name);
    if (res.url) {
      updateCanvasElement(activeSlideId, selectedCustomElement.id, {
        audioUrl: res.url,
        action: {
          ...selectedCustomElement.action,
          type: 'play-audio',
        },
      });
      onStatusMessage?.(
        'success',
        `File audio berhasil diunggah (${res.source === 'supabase' ? 'Supabase Storage' : 'Data URL Instan'}).`
      );
    }
  };

  const handlePlayTestInspectorAudio = (rawUrl?: string) => {
    const urlToPlay =
      rawUrl ||
      selectedCustomElement?.audioUrl ||
      currentSlide?.audios?.[0]?.url ||
      'story_content/6DeuLJzk41Q_44100_56_0.mp3';
    const resolved = resolvePreviewAssetUrl(urlToPlay);
    if (!resolved || !inspectorAudioRef.current) return;

    if (isPlayingInspectorAudio) {
      inspectorAudioRef.current.pause();
      inspectorAudioRef.current.currentTime = 0;
      setIsPlayingInspectorAudio(false);
      return;
    }

    setIsPlayingInspectorAudio(true);
    inspectorAudioRef.current.src = resolved;
    inspectorAudioRef.current.load();
    inspectorAudioRef.current.play().catch(() => {
      setIsPlayingInspectorAudio(false);
    });
  };

  const sampleAudioList = useMemo(
    () => Object.values(content.audioCatalog).slice(0, 30),
    [content.audioCatalog]
  );

  // ============================================================================
  // STYLES (DARK STUDIO #0F172A THEME DENGAN AKSEN KONTRAS TINGGI)
  // ============================================================================
  const studioInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid #334155',
    backgroundColor: '#090D16',
    color: '#F8FAFC',
    fontSize: '12px',
    fontFamily: 'inherit',
  };

  const studioLabelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#94A3B8',
    marginBottom: '4px',
  };

  const sectionCardStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#1E293B',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  return (
    <div
      data-testid="visual-studio-admin"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <audio
        ref={inspectorAudioRef}
        onEnded={() => setIsPlayingInspectorAudio(false)}
        style={{ display: 'none' }}
      />

      {/* ==================================================================== */}
      {/* ZONA 1: TOP COMMAND BAR                                              */}
      {/* ==================================================================== */}
      <header
        data-testid="studio-top-command-bar"
        style={{
          height: '54px',
          padding: '0 14px',
          backgroundColor: '#090D16',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Kiri: Identitas Studio, Pemilih Slide Aktif, Undo/Redo, & Toggle Grid/Snap */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingRight: '8px',
              borderRight: '1px solid #1E293B',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '2px',
                backgroundColor: '#F59E0B',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.03em',
                color: '#F8FAFC',
                whiteSpace: 'nowrap',
              }}
            >
              STARLA STUDIO
            </span>
          </div>

          {/* Pemilih Slide Aktif */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              title="Slide Sebelumnya"
              data-testid="btn-studio-prev-slide"
              disabled={currentSlideOrderIndex <= 0}
              onClick={() => {
                if (currentSlideOrderIndex > 0) {
                  onSelectSlideId(
                    content.slideOrder[currentSlideOrderIndex - 1]
                  );
                }
              }}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#1E293B',
                color: currentSlideOrderIndex <= 0 ? '#475569' : '#F8FAFC',
                fontSize: '12px',
                fontWeight: 700,
                cursor: currentSlideOrderIndex <= 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ‹
            </button>

            <select
              aria-label="Pemilih Slide Aktif"
              data-testid="studio-slide-selector"
              value={activeSlideId}
              onChange={(e) => {
                onSelectSlideId(e.target.value);
                setSelectedCanvasItemId(null);
              }}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                fontSize: '11px',
                fontWeight: 600,
                width: '195px',
                cursor: 'pointer',
              }}
            >
              {content.slideOrder.map((id, idx) => {
                const s = content.slides[id];
                const label = getSlideDisplayLabel(s, idx);
                return (
                  <option key={id} value={id}>
                    #{idx + 1} — {label} ({id})
                  </option>
                );
              })}
            </select>

            <button
              type="button"
              title="Slide Berikutnya"
              data-testid="btn-studio-next-slide"
              disabled={
                currentSlideOrderIndex >= content.slideOrder.length - 1
              }
              onClick={() => {
                if (currentSlideOrderIndex < content.slideOrder.length - 1) {
                  onSelectSlideId(
                    content.slideOrder[currentSlideOrderIndex + 1]
                  );
                }
              }}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#1E293B',
                color:
                  currentSlideOrderIndex >= content.slideOrder.length - 1
                    ? '#475569'
                    : '#F8FAFC',
                fontSize: '12px',
                fontWeight: 700,
                cursor:
                  currentSlideOrderIndex >= content.slideOrder.length - 1
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              ›
            </button>
          </div>

          {/* Undo & Redo (Minimal 20 Langkah History Stack) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              paddingLeft: '4px',
              borderLeft: '1px solid #1E293B',
            }}
          >
            <button
              type="button"
              title="Undo Perubahan (Ctrl+Z)"
              data-testid="btn-studio-undo"
              disabled={!canUndo}
              onClick={undoContent}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: canUndo ? '#1E293B' : '#0F172A',
                color: canUndo ? '#F8FAFC' : '#475569',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: canUndo ? 'pointer' : 'not-allowed',
              }}
            >
              ↶ Undo {undoCount > 0 ? `(${undoCount})` : ''}
            </button>
            <button
              type="button"
              title="Redo Perubahan (Ctrl+Y)"
              data-testid="btn-studio-redo"
              disabled={!canRedo}
              onClick={redoContent}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: canRedo ? '#1E293B' : '#0F172A',
                color: canRedo ? '#F8FAFC' : '#475569',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: canRedo ? 'pointer' : 'not-allowed',
              }}
            >
              ↷ Redo {redoCount > 0 ? `(${redoCount})` : ''}
            </button>
          </div>

          {/* Toggle Grid / Snap */}
          <button
            type="button"
            data-testid="btn-studio-toggle-grid"
            onClick={() => setIsGridSnapEnabled(!isGridSnapEnabled)}
            style={{
              padding: '5px 9px',
              borderRadius: '6px',
              border: isGridSnapEnabled
                ? '1px solid #38BDF8'
                : '1px solid #334155',
              backgroundColor: isGridSnapEnabled
                ? 'rgba(56, 189, 248, 0.14)'
                : '#1E293B',
              color: isGridSnapEnabled ? '#38BDF8' : '#94A3B8',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            ⊞ Grid/Snap: {isGridSnapEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Tengah: Switch Instan "Mode Edit Kanvas" vs "Mode Tes Interaktif (Live Preview)" */}
        <div
          role="group"
          aria-label="Mode Kerja Kanvas"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px',
            borderRadius: '8px',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            data-testid="btn-mode-edit-kanvas"
            onClick={() => setIsCanvasEditMode(true)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isCanvasEditMode ? '#F59E0B' : 'transparent',
              color: isCanvasEditMode ? '#090D16' : '#CBD5E1',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            Mode Edit Kanvas
          </button>
          <button
            type="button"
            data-testid="btn-mode-live-preview"
            onClick={() => {
              setIsCanvasEditMode(false);
              setSelectedCanvasItemId(null);
            }}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: !isCanvasEditMode ? '#10B981' : 'transparent',
              color: !isCanvasEditMode ? '#052E16' : '#CBD5E1',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            Mode Tes Interaktif (Live Preview)
          </button>
          <button
            type="button"
            data-testid="btn-preview-edit-toggle"
            title="Switch Mode Edit / Live Preview"
            onClick={() => setIsCanvasEditMode(!isCanvasEditMode)}
            style={{
              padding: '5px 7px',
              borderRadius: '6px',
              border: '1px solid #334155',
              backgroundColor: '#0F172A',
              color: '#94A3B8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⇄
          </button>
        </div>

        {/* Kanan: Reset Slide, Simpan & Publish ke Supabase, & Kembali ke Player */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            data-testid="btn-studio-reset-slide"
            onClick={handleResetCurrentSlide}
            style={{
              padding: '5px 9px',
              borderRadius: '6px',
              border: '1px solid #475569',
              backgroundColor: '#1E293B',
              color: '#E2E8F0',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            Reset Slide
          </button>

          <button
            type="button"
            data-testid="btn-studio-publish-supabase"
            disabled={isSyncing}
            onClick={() => void handlePublishToSupabase()}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #F59E0B',
              backgroundColor: '#F59E0B',
              color: '#090D16',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: isSyncing ? 'wait' : 'pointer',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)',
            }}
          >
            {isSyncing
              ? 'Menyimpan...'
              : 'Simpan & Publish ke Supabase'}
          </button>

          {onCloseAdmin && (
            <button
              type="button"
              data-testid="btn-close-admin"
              onClick={onCloseAdmin}
              style={{
                padding: '5px 9px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#0F172A',
                color: '#94A3B8',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              Kembali ke Player
            </button>
          )}
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN 3-COLUMN BODY (LEFT DOCK + CENTER WORKSPACE + RIGHT INSPECTOR) */}
      {/* ==================================================================== */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '300px minmax(0, 1fr) 340px',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* ================================================================== */}
        {/* ZONA 2: LEFT DOCK (3 TAB: SLIDE, TAMBAH ELEMEN, LAYER & PEMULIHAN) */}
        {/* ================================================================== */}
        <aside
          aria-label="Left Studio Dock"
          data-testid="studio-left-dock"
          style={{
            backgroundColor: '#0B1120',
            borderRight: '1px solid #1E293B',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* Navigasi 3 Tab Left Dock */}
          <div
            role="tablist"
            aria-label="Tab Left Dock"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px',
              padding: '8px',
              backgroundColor: '#090D16',
              borderBottom: '1px solid #1E293B',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={leftDockTab === 'slides'}
              data-testid="tab-left-slides"
              onClick={() => setLeftDockTab('slides')}
              style={{
                padding: '7px 6px',
                borderRadius: '6px',
                border:
                  leftDockTab === 'slides'
                    ? '1px solid #F59E0B'
                    : '1px solid transparent',
                backgroundColor:
                  leftDockTab === 'slides' ? '#1E293B' : 'transparent',
                color: leftDockTab === 'slides' ? '#FBBF24' : '#94A3B8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Slide ({content.slideOrder.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={leftDockTab === 'elements'}
              data-testid="tab-left-elements"
              onClick={() => setLeftDockTab('elements')}
              style={{
                padding: '7px 6px',
                borderRadius: '6px',
                border:
                  leftDockTab === 'elements'
                    ? '1px solid #F59E0B'
                    : '1px solid transparent',
                backgroundColor:
                  leftDockTab === 'elements' ? '#1E293B' : 'transparent',
                color: leftDockTab === 'elements' ? '#FBBF24' : '#94A3B8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Elemen
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={leftDockTab === 'layers'}
              data-testid="tab-left-layers"
              onClick={() => setLeftDockTab('layers')}
              style={{
                padding: '7px 6px',
                borderRadius: '6px',
                border:
                  leftDockTab === 'layers'
                    ? '1px solid #F59E0B'
                    : '1px solid transparent',
                backgroundColor:
                  leftDockTab === 'layers' ? '#1E293B' : 'transparent',
                color: leftDockTab === 'layers' ? '#FBBF24' : '#94A3B8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Layer ({canvasElements.length + nativeElementsList.length})
            </button>
          </div>

          {/* Isi Tab Left Dock */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* -------------------------------------------------------------- */}
            {/* TAB A: SLIDE (Daftar Visual, Tambah, Duplikat, Hapus Slide)    */}
            {/* -------------------------------------------------------------- */}
            {leftDockTab === 'slides' && (
              <>
                <div style={sectionCardStyle}>
                  <span style={studioLabelStyle}>
                    Manajemen Slide ({content.slideOrder.length} Slide)
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      aria-label="Judul Slide Baru"
                      data-testid="input-new-slide-title"
                      placeholder="Judul slide baru..."
                      value={newSlideTitleInput}
                      onChange={(e) => setNewSlideTitleInput(e.target.value)}
                      style={studioInputStyle}
                    />
                    <button
                      type="button"
                      data-testid="btn-dock-add-slide"
                      onClick={handleCreateNewSlide}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid #F59E0B',
                        backgroundColor: '#F59E0B',
                        color: '#090D16',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                    >
                      + Tambah Slide
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px',
                    }}
                  >
                    <button
                      type="button"
                      data-testid="btn-dock-duplicate-slide"
                      onClick={handleDuplicateActiveSlide}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #334155',
                        backgroundColor: '#0F172A',
                        color: '#E2E8F0',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Duplikat Slide
                    </button>
                    <button
                      type="button"
                      data-testid="btn-dock-delete-slide"
                      onClick={handleDeleteActiveSlide}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #7F1D1D',
                        backgroundColor: 'rgba(127, 29, 29, 0.25)',
                        color: '#FCA5A5',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Hapus Slide
                    </button>
                  </div>

                  <input
                    type="search"
                    aria-label="Cari Slide"
                    placeholder="Cari judul atau ID slide..."
                    value={slideSearchQuery}
                    onChange={(e) => setSlideSearchQuery(e.target.value)}
                    style={studioInputStyle}
                  />
                </div>

                {/* Daftar Visual Slide */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {filteredSlideIds.map((id) => {
                    const s = content.slides[id];
                    const orderIdx = content.slideOrder.indexOf(id);
                    const isSelected = id === activeSlideId;
                    const hidden = isSlideHidden(content, id);
                    const customCount = s?.canvasElements?.length || 0;
                    const thumbUrl = resolvePreviewAssetUrl(
                      s?.backgroundUrl ||
                        s?.images?.[0]?.url ||
                        'mobile/Slide5WPRbcJDCqY.jpg'
                    );

                    return (
                      <div
                        key={id}
                        role="button"
                        tabIndex={0}
                        data-testid={`studio-slide-item-${id}`}
                        onClick={() => {
                          onSelectSlideId(id);
                          setSelectedCanvasItemId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectSlideId(id);
                            setSelectedCanvasItemId(null);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#1E293B' : '#0F172A',
                          border: isSelected
                            ? '1.5px solid #F59E0B'
                            : '1px solid #1E293B',
                          cursor: 'pointer',
                          opacity: hidden ? 0.55 : 1,
                        }}
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '36px',
                            borderRadius: '4px',
                            backgroundColor: '#090D16',
                            border: '1px solid #334155',
                            overflow: 'hidden',
                            flexShrink: 0,
                            position: 'relative',
                          }}
                        >
                          <img
                            src={thumbUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              left: '3px',
                              fontSize: '9px',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#FBBF24',
                              backgroundColor: 'rgba(9, 13, 22, 0.85)',
                              padding: '0 3px',
                              borderRadius: '2px',
                            }}
                          >
                            #{orderIdx + 1}
                          </span>
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: isSelected ? '#F8FAFC' : '#CBD5E1',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {getSlideDisplayLabel(s, orderIdx)}
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              color: '#64748B',
                              fontFamily: 'monospace',
                              marginTop: '2px',
                            }}
                          >
                            {id}
                            {customCount > 0 ? ` · ${customCount} elemen` : ''}
                            {hidden ? ' · Disembunyikan' : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* -------------------------------------------------------------- */}
            {/* TAB B: TAMBAH ELEMEN (Sekali Klik ke Kanvas)                   */}
            {/* -------------------------------------------------------------- */}
            {leftDockTab === 'elements' && (
              <>
                <div style={sectionCardStyle}>
                  <span style={studioLabelStyle}>
                    Tambah Elemen Interaktif ke Kanvas
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      color: '#94A3B8',
                      lineHeight: 1.45,
                    }}
                  >
                    Klik salah satu komponen di bawah untuk langsung
                    menambahkannya ke kanvas Slide #{currentSlideOrderIndex + 1}
                    .
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: '8px',
                    }}
                  >
                    {/* 1. Tombol dengan Gambar (Image Button) */}
                    <button
                      type="button"
                      data-testid="btn-add-canvas-image-button"
                      onClick={() => handleAddElement('image-button')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.14)',
                        color: '#FBBF24',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>
                          + Tombol dengan Gambar (Image Button)
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#CBD5E1',
                            marginTop: '2px',
                          }}
                        >
                          Tombol interaktif untuk pindah slide, pop-up, atau
                          audio
                        </div>
                      </div>
                      <span style={{ fontSize: '16px' }}>▣</span>
                    </button>

                    {/* 2. Teks / Judul */}
                    <button
                      type="button"
                      data-testid="btn-add-canvas-text"
                      onClick={() => handleAddElement('text')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        backgroundColor: '#0F172A',
                        color: '#F8FAFC',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>
                          + Teks / Judul
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#94A3B8',
                            marginTop: '2px',
                          }}
                        >
                          Blok teks bebas, judul materi, atau catatan budaya
                        </div>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 800 }}>
                        T
                      </span>
                    </button>

                    {/* 3. Gambar / Stiker */}
                    <button
                      type="button"
                      data-testid="btn-add-canvas-image"
                      onClick={() => handleAddElement('image')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        backgroundColor: '#0F172A',
                        color: '#F8FAFC',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>
                          + Gambar / Stiker
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#94A3B8',
                            marginTop: '2px',
                          }}
                        >
                          Ilustrasi pakaian adat, rumah adat, atau stiker visual
                        </div>
                      </div>
                      <span style={{ fontSize: '16px' }}>❖</span>
                    </button>

                    {/* 4. Tombol Suara (Audio Trigger) */}
                    <button
                      type="button"
                      data-testid="btn-add-canvas-audio-hotspot"
                      onClick={() => handleAddElement('audio-hotspot')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #0284C7',
                        backgroundColor: 'rgba(2, 132, 199, 0.14)',
                        color: '#38BDF8',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>
                          + Tombol Suara (Audio Trigger)
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#CBD5E1',
                            marginTop: '2px',
                          }}
                        >
                          Hotspot pemutar narasi MP3 atau efek suara interaktif
                        </div>
                      </div>
                      <span style={{ fontSize: '16px' }}>▶</span>
                    </button>
                  </div>
                </div>

                {/* Pustaka Cepat Stiker & Aset Budaya */}
                <div style={sectionCardStyle}>
                  <span style={studioLabelStyle}>
                    Stiker & Aset Budaya Nusantara (Sekali Klik)
                  </span>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px',
                    }}
                  >
                    {PRESET_STICKER_IMAGES.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() =>
                          handleAddElement('image', {
                            label: preset.label,
                            imageUrl: preset.url,
                          })
                        }
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #334155',
                          backgroundColor: '#0F172A',
                          color: '#E2E8F0',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <img
                          src={resolvePreviewAssetUrl(preset.url)}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          style={{
                            width: '100%',
                            height: '44px',
                            objectFit: 'contain',
                          }}
                        />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* -------------------------------------------------------------- */}
            {/* TAB C: LAYER & PEMULIHAN (Bring Forward/Backward, Lock, Restore) */}
            {/* -------------------------------------------------------------- */}
            {leftDockTab === 'layers' && (
              <>
                {/* Layer Elemen Kanvas Tambahan */}
                <div style={sectionCardStyle}>
                  <span style={studioLabelStyle}>
                    Layer Elemen Kanvas ({canvasElements.length})
                  </span>
                  {canvasElements.length === 0 ? (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        padding: '8px 0',
                      }}
                    >
                      Belum ada elemen kanvas tambahan di slide ini.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {[...canvasElements].reverse().map((el) => {
                        const isSelected = selectedCanvasItemId === el.id;
                        return (
                          <div
                            key={el.id}
                            data-testid={`layer-item-${el.id}`}
                            onClick={() => setSelectedCanvasItemId(el.id)}
                            style={{
                              padding: '8px',
                              borderRadius: '6px',
                              border: isSelected
                                ? '1px solid #F59E0B'
                                : '1px solid #334155',
                              backgroundColor: isSelected
                                ? 'rgba(245, 158, 11, 0.12)'
                                : '#0F172A',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '6px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#F8FAFC',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {el.label || el.type}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontFamily: 'monospace',
                                  color: '#94A3B8',
                                }}
                              >
                                z:{el.zIndex}
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                flexWrap: 'wrap',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                title="Bring Forward (Naikkan Layer)"
                                data-testid={`btn-layer-forward-${el.id}`}
                                onClick={() =>
                                  reorderCanvasElementLayer(
                                    activeSlideId,
                                    el.id,
                                    'forward'
                                  )
                                }
                                style={{
                                  padding: '3px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #334155',
                                  backgroundColor: '#1E293B',
                                  color: '#E2E8F0',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                ↑ Forward
                              </button>
                              <button
                                type="button"
                                title="Send Backward (Turunkan Layer)"
                                data-testid={`btn-layer-backward-${el.id}`}
                                onClick={() =>
                                  reorderCanvasElementLayer(
                                    activeSlideId,
                                    el.id,
                                    'backward'
                                  )
                                }
                                style={{
                                  padding: '3px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #334155',
                                  backgroundColor: '#1E293B',
                                  color: '#E2E8F0',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                ↓ Backward
                              </button>
                              <button
                                type="button"
                                title={
                                  el.locked
                                    ? 'Buka Kunci Posisi'
                                    : 'Lock Posisi'
                                }
                                data-testid={`btn-layer-lock-${el.id}`}
                                onClick={() =>
                                  toggleCanvasElementLock(activeSlideId, el.id)
                                }
                                style={{
                                  padding: '3px 6px',
                                  borderRadius: '4px',
                                  border: el.locked
                                    ? '1px solid #38BDF8'
                                    : '1px solid #334155',
                                  backgroundColor: el.locked
                                    ? 'rgba(56, 189, 248, 0.16)'
                                    : '#1E293B',
                                  color: el.locked ? '#38BDF8' : '#E2E8F0',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                {el.locked ? 'Terkunci' : 'Lock'}
                              </button>
                              <button
                                type="button"
                                data-testid={`btn-inspector-duplicate-${el.id}`}
                                onClick={() =>
                                  duplicateCanvasElement(activeSlideId, el.id)
                                }
                                style={{
                                  padding: '3px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #334155',
                                  backgroundColor: '#1E293B',
                                  color: '#E2E8F0',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Duplikat
                              </button>
                              <button
                                type="button"
                                data-testid={`btn-inspector-delete-${el.id}`}
                                onClick={() =>
                                  deleteCanvasElement(activeSlideId, el.id)
                                }
                                style={{
                                  padding: '3px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #7F1D1D',
                                  backgroundColor: '#7F1D1D',
                                  color: '#FEE2E2',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Layer Elemen Asli Slide & Pemulihan Non-Destruktif (Restore) */}
                <div style={sectionCardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={studioLabelStyle}>
                      Elemen Asli Slide & Pemulihan ({nativeElementsList.length}
                      )
                    </span>
                    {hiddenNativeElementsCount > 0 && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#FBBF24',
                          fontWeight: 700,
                        }}
                      >
                        {hiddenNativeElementsCount} disembunyikan
                      </span>
                    )}
                  </div>

                  {nativeElementsList.length === 0 ? (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#64748B',
                        padding: '6px 0',
                      }}
                    >
                      Slide ini menggunakan komposisi latar penuh tanpa layer
                      objek terpisah.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      {nativeElementsList.map((nat) => (
                        <div
                          key={nat.id}
                          onClick={() => setSelectedCanvasItemId(nat.id)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border:
                              selectedCanvasItemId === nat.id
                                ? '1px solid #F59E0B'
                                : '1px solid #334155',
                            backgroundColor: nat.hidden
                              ? 'rgba(127, 29, 29, 0.15)'
                              : '#0F172A',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: nat.hidden ? '#94A3B8' : '#E2E8F0',
                                textDecoration: nat.hidden
                                  ? 'line-through'
                                  : 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              [{nat.kind}] {nat.label}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              data-testid={`btn-layer-lock-${nat.id}`}
                              onClick={() =>
                                toggleCanvasElementLock(activeSlideId, nat.id)
                              }
                              style={{
                                padding: '3px 6px',
                                borderRadius: '4px',
                                border: nat.locked
                                  ? '1px solid #38BDF8'
                                  : '1px solid #334155',
                                backgroundColor: '#1E293B',
                                color: nat.locked ? '#38BDF8' : '#CBD5E1',
                                fontSize: '10px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {nat.locked ? 'Terkunci' : 'Lock'}
                            </button>

                            {nat.hidden ? (
                              <button
                                type="button"
                                data-testid={`btn-restore-native-${nat.id}`}
                                onClick={() =>
                                  restoreNativeElement(activeSlideId, nat.id)
                                }
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #10B981',
                                  backgroundColor: '#065F46',
                                  color: '#D1FAE5',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Pulihkan (Restore)
                              </button>
                            ) : (
                              <button
                                type="button"
                                data-testid={`btn-hide-native-${nat.id}`}
                                onClick={() =>
                                  hideNativeElement(activeSlideId, nat.id)
                                }
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #475569',
                                  backgroundColor: '#1E293B',
                                  color: '#CBD5E1',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Sembunyikan
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ================================================================== */}
        {/* ZONA 3: CENTER WORKSPACE (16:9 PROPORTIONAL STAGE + FLOATING BAR)  */}
        {/* ================================================================== */}
        <section
          aria-label="Center Canvas Workspace"
          data-testid="studio-center-workspace"
          style={{
            backgroundColor: '#090D16',
            backgroundImage:
              'radial-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* Sub-bar Konteks Slide di Atas Kanvas */}
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flex: 1,
                minWidth: '240px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#FBBF24',
                  fontWeight: 700,
                }}
              >
                SLIDE #{currentSlideOrderIndex + 1} ({activeSlideId})
              </span>
              <input
                type="text"
                aria-label="Judul Slide"
                data-testid="input-slide-title"
                value={currentSlide?.title || ''}
                onChange={(e) =>
                  updateSlideContent(activeSlideId, { title: e.target.value })
                }
                placeholder="Judul slide..."
                style={{
                  ...studioInputStyle,
                  maxWidth: '240px',
                  padding: '4px 8px',
                }}
              />
              <input
                type="text"
                aria-label="URL Gambar Latar Slide"
                value={currentSlide?.backgroundUrl || ''}
                onChange={(e) =>
                  updateSlideContent(activeSlideId, {
                    backgroundUrl: e.target.value || null,
                  })
                }
                placeholder="URL Latar (mobile/Slide...)"
                style={{
                  ...studioInputStyle,
                  maxWidth: '220px',
                  padding: '4px 8px',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: '#94A3B8',
              }}
            >
              {onOpenClassicTab && (
                <>
                  <button
                    type="button"
                    data-testid="tab-quiz"
                    onClick={() => onOpenClassicTab('quiz')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '5px',
                      border: '1px solid #334155',
                      backgroundColor: '#1E293B',
                      color: '#CBD5E1',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Kuis & Game
                  </button>
                  <button
                    type="button"
                    data-testid="tab-media"
                    onClick={() => onOpenClassicTab('media')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '5px',
                      border: '1px solid #334155',
                      backgroundColor: '#1E293B',
                      color: '#CBD5E1',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Audio & Media
                  </button>
                  <button
                    type="button"
                    data-testid="tab-backup"
                    onClick={() => onOpenClassicTab('backup')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '5px',
                      border: '1px solid #334155',
                      backgroundColor: '#1E293B',
                      color: '#CBD5E1',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Backup JSON
                  </button>
                </>
              )}
              <button
                type="button"
                data-testid="btn-reset-default"
                onClick={() => {
                  resetContent();
                  onStatusMessage?.(
                    'info',
                    'Seluruh konten dikembalikan ke Default Asli.'
                  );
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: '1px solid #7F1D1D',
                  backgroundColor: 'rgba(127, 29, 29, 0.25)',
                  color: '#FCA5A5',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset Semua
              </button>
            </div>
          </div>

          {/* Area Panggung Kanvas 16:9 di Tengah Layar */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              overflow: 'auto',
              minHeight: 0,
            }}
          >
            <div
              data-testid="studio-stage-16-9"
              style={{
                width: '100%',
                maxWidth: '860px',
                aspectRatio: '16 / 9',
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                backgroundColor: '#060913',
                border: isCanvasEditMode
                  ? '2px solid #F59E0B'
                  : '2px solid #10B981',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.65)',
              }}
            >
              {/* Latar Slide */}
              {stageBackgroundUrl && (
                <img
                  src={stageBackgroundUrl}
                  alt={currentSlide?.title || 'Latar Slide'}
                  referrerPolicy="no-referrer"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.72,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Overlay Informasi Kontekstual Slide (Saat Mode Tes Interaktif / Tidak Mengganggu Kanvas) */}
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  bottom: '10px',
                  zIndex: 15,
                  pointerEvents: 'none',
                  backgroundColor: 'rgba(9, 13, 22, 0.78)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  fontSize: '11px',
                  color: '#CBD5E1',
                }}
              >
                {getSlideDisplayLabel(currentSlide, currentSlideOrderIndex)} ·{' '}
                {canvasElements.length} Elemen Kustom
              </div>

              {/* CanvasStageOverlay: Merender Elemen Asli + CanvasElements + 8 Resize Handles + Floating Toolbar */}
              <CanvasStageOverlay
                slideIdOverride={activeSlideId}
                mode="embedded"
                forceEditMode={isCanvasEditMode}
                onNavigateSlide={(targetId) => {
                  if (content.slides[targetId]) {
                    onSelectSlideId(targetId);
                  }
                }}
              />
            </div>
          </div>

          {/* Footer Bar Petunjuk Shortcut Studio */}
          <div
            style={{
              padding: '6px 16px',
              backgroundColor: '#090D16',
              borderTop: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#94A3B8',
              flexShrink: 0,
            }}
          >
            <div>
              {isCanvasEditMode
                ? 'Mode Edit Kanvas Aktif: Klik & seret elemen untuk memindahkan (60fps), tarik 8 titik sudut/sisi untuk mengubah ukuran.'
                : 'Mode Tes Interaktif Aktif: Klik tombol/hotspot di kanvas untuk menguji navigasi slide, audio, atau pop-up.'}
            </div>
            <div style={{ fontFamily: 'monospace', color: '#CBD5E1' }}>
              Shortcut: Delete/Backspace (Hapus) · Ctrl+Z (Undo) · Ctrl+Y (Redo)
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* ZONA 4: RIGHT PROPERTY INSPECTOR (PANEL KANAN)                     */}
        {/* ================================================================== */}
        <aside
          aria-label="Right Property Inspector"
          data-testid="studio-right-inspector"
          style={{
            backgroundColor: '#0B1120',
            borderLeft: '1px solid #1E293B',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#090D16',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#F8FAFC',
                letterSpacing: '0.02em',
              }}
            >
              Property Inspector
            </span>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: selectedCustomElement
                  ? '#FBBF24'
                  : selectedNativeElement
                    ? '#38BDF8'
                    : '#64748B',
              }}
            >
              {selectedCustomElement
                ? selectedCustomElement.type
                : selectedNativeElement
                  ? 'Elemen Asli'
                  : 'Belum Dipilih'}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* KONDISI 1: ELEMEN KANVAS KUSTOM SEDANG DIPILIH */}
            {selectedCustomElement ? (
              <>
                {/* A) PENGATURAN GAMBAR & LABEL */}
                <div style={sectionCardStyle}>
                  <span style={{ ...studioLabelStyle, color: '#FBBF24' }}>
                    a) Pengaturan Gambar & Label
                  </span>

                  <div>
                    <label style={studioLabelStyle}>
                      Teks Tombol / Label Elemen
                      <input
                        type="text"
                        aria-label="Label / Teks Elemen"
                        data-testid="inspector-input-label"
                        value={selectedCustomElement.label || ''}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            { label: e.target.value }
                          )
                        }
                        style={{ ...studioInputStyle, marginTop: '4px' }}
                      />
                    </label>
                  </div>

                  <div>
                    <label style={studioLabelStyle}>
                      Pilih Ikon Pendamping
                      <select
                        aria-label="Pilih Ikon"
                        data-testid="inspector-icon-picker"
                        value={selectedCustomElement.style?.iconName || ''}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                iconName: e.target.value,
                              },
                            }
                          )
                        }
                        style={{ ...studioInputStyle, marginTop: '4px' }}
                      >
                        {PRESET_CULTURE_ICONS.map((ic) => (
                          <option key={ic.label} value={ic.value}>
                            {ic.value ? `${ic.value} — ${ic.label}` : ic.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div>
                    <label style={studioLabelStyle}>
                      URL Gambar (`imageUrl`)
                      <input
                        type="text"
                        aria-label="URL Gambar (`imageUrl`)"
                        data-testid="inspector-input-image-url"
                        value={selectedCustomElement.imageUrl || ''}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            { imageUrl: e.target.value }
                          )
                        }
                        placeholder="mobile/5fD3uOAkxBz.png"
                        style={{
                          ...studioInputStyle,
                          marginTop: '4px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <label
                      data-testid="inspector-upload-image-label"
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px dashed #F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        color: '#FBBF24',
                        fontSize: '11px',
                        fontWeight: 700,
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      Unggah File Gambar
                      <input
                        type="file"
                        accept="image/*"
                        data-testid="inspector-upload-image"
                        onChange={(e) =>
                          void handleUploadInspectorImage(
                            e.target.files?.[0] || null
                          )
                        }
                        style={{ display: 'none' }}
                      />
                    </label>

                    {selectedCustomElement.imageUrl && (
                      <div
                        style={{
                          width: '48px',
                          height: '36px',
                          borderRadius: '4px',
                          backgroundColor: '#090D16',
                          border: '1px solid #334155',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={resolvePreviewAssetUrl(
                            selectedCustomElement.imageUrl
                          )}
                          alt="Pratinjau"
                          referrerPolicy="no-referrer"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* B) PENGATURAN GAYA VISUAL */}
                <div style={sectionCardStyle}>
                  <span style={{ ...studioLabelStyle, color: '#FBBF24' }}>
                    b) Pengaturan Gaya Visual
                  </span>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                    }}
                  >
                    <label style={studioLabelStyle}>
                      Ukuran Font (px)
                      <input
                        type="number"
                        aria-label="Ukuran Font (px)"
                        data-testid="inspector-input-fontsize"
                        min={10}
                        max={64}
                        value={selectedCustomElement.style?.fontSize ?? 14}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                fontSize: Number(e.target.value) || 14,
                              },
                            }
                          )
                        }
                        style={{ ...studioInputStyle, marginTop: '4px' }}
                      />
                    </label>

                    <label style={studioLabelStyle}>
                      Radius Sudut (px)
                      <input
                        type="number"
                        aria-label="Radius Sudut (px)"
                        data-testid="inspector-input-radius"
                        min={0}
                        max={999}
                        value={selectedCustomElement.style?.borderRadius ?? 8}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                borderRadius: Math.max(
                                  0,
                                  Number(e.target.value) || 0
                                ),
                              },
                            }
                          )
                        }
                        style={{ ...studioInputStyle, marginTop: '4px' }}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                    }}
                  >
                    <label style={studioLabelStyle}>
                      Warna Teks
                      <input
                        type="text"
                        aria-label="Warna Teks (`textColor`)"
                        data-testid="inspector-input-textcolor"
                        value={selectedCustomElement.style?.textColor || '#FFFFFF'}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                textColor: e.target.value,
                              },
                            }
                          )
                        }
                        style={{
                          ...studioInputStyle,
                          marginTop: '4px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </label>

                    <label style={studioLabelStyle}>
                      Warna Background
                      <input
                        type="text"
                        aria-label="Warna Latar (`backgroundColor`)"
                        data-testid="inspector-input-bgcolor"
                        value={
                          selectedCustomElement.style?.backgroundColor ||
                          '#D97706'
                        }
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                backgroundColor: e.target.value,
                              },
                            }
                          )
                        }
                        style={{
                          ...studioInputStyle,
                          marginTop: '4px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                    }}
                  >
                    <label style={studioLabelStyle}>
                      Ketebalan Border (px)
                      <input
                        type="number"
                        aria-label="Ketebalan Border (px)"
                        data-testid="inspector-input-borderwidth"
                        min={0}
                        max={20}
                        value={selectedCustomElement.style?.borderWidth ?? 0}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                borderWidth: Math.max(
                                  0,
                                  Number(e.target.value) || 0
                                ),
                              },
                            }
                          )
                        }
                        style={{ ...studioInputStyle, marginTop: '4px' }}
                      />
                    </label>

                    <label style={studioLabelStyle}>
                      Warna Border
                      <input
                        type="text"
                        aria-label="Warna Border"
                        value={
                          selectedCustomElement.style?.borderColor || '#F59E0B'
                        }
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                borderColor: e.target.value,
                              },
                            }
                          )
                        }
                        style={{
                          ...studioInputStyle,
                          marginTop: '4px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      alignItems: 'end',
                    }}
                  >
                    <label style={studioLabelStyle}>
                      Animasi Hover
                      <select
                        aria-label="Efek Hover (`hoverEffect`)"
                        data-testid="inspector-select-hover"
                        value={selectedCustomElement.style?.hoverEffect || 'none'}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                hoverEffect: e.target.value as CanvasHoverEffect,
                              },
                            }
                          )
                        }
                        style={{ ...studioInputStyle, marginTop: '4px' }}
                      >
                        <option value="none">Tanpa Efek (None)</option>
                        <option value="scale">Zoom / Scale Halus</option>
                        <option value="lift">Lift (Angkat ke Atas)</option>
                        <option value="pulse">Pulse (Denyut Cahaya)</option>
                        <option value="glow">Glow (Pendar Cahaya)</option>
                        <option value="bounce">Bounce (Pantul)</option>
                      </select>
                    </label>

                    <label style={studioLabelStyle}>
                      Mode Pas Gambar (`objectFit`)
                      <select
                        aria-label="Mode Pas Gambar (`objectFit`)"
                        data-testid="inspector-select-objectfit"
                        value={
                          selectedCustomElement.style?.objectFit || 'contain'
                        }
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                objectFit: e.target.value as
                                  | 'contain'
                                  | 'cover',
                              },
                            }
                          )
                        }
                        style={{ ...studioInputStyle, marginTop: '4px' }}
                      >
                        <option value="contain">Proporsional (contain)</option>
                        <option value="cover">Penuh Kotak (cover)</option>
                      </select>
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '8px',
                      alignItems: 'end',
                    }}
                  >
                    <label style={studioLabelStyle}>
                      Bayangan (`shadow`)
                      <select
                        aria-label="Preset Bayangan (`shadow`)"
                        data-testid="inspector-select-shadow"
                        value={normalizeShadowPreset(
                          selectedCustomElement.style?.shadow
                        )}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                shadow: e.target.value as CanvasShadowPreset,
                              },
                            }
                          )
                        }
                        style={{ ...studioInputStyle, marginTop: '4px' }}
                      >
                        <option value="none">Tanpa Bayangan (none)</option>
                        <option value="sm">Tipis Halus (sm)</option>
                        <option value="md">Standar Sedang (md)</option>
                        <option value="lg">Tegas Dalam (lg)</option>
                        <option value="glow">Pendar Emas (glow)</option>
                      </select>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#090D16',
                        border: '1px solid #334155',
                        fontSize: '11px',
                        color: '#E2E8F0',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        data-testid="inspector-checkbox-shadow"
                        checked={
                          Boolean(selectedCustomElement.style?.shadow) &&
                          selectedCustomElement.style?.shadow !== 'none'
                        }
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              style: {
                                ...selectedCustomElement.style,
                                shadow: e.target.checked ? 'md' : 'none',
                              },
                            }
                          )
                        }
                      />
                      Drop Shadow
                    </label>
                  </div>
                </div>

                {/* C) PENGATURAN AKSI KLIK & AUDIO */}
                <div style={sectionCardStyle}>
                  <span style={{ ...studioLabelStyle, color: '#FBBF24' }}>
                    c) Pengaturan Aksi Klik & Audio
                  </span>

                  <label style={studioLabelStyle}>
                    Aksi Saat Elemen Diklik (`action.type`)
                    <select
                      aria-label="Aksi Saat Diklik (`action.type`)"
                      data-testid="inspector-select-action"
                      value={selectedCustomElement.action?.type || 'none'}
                      onChange={(e) =>
                        updateCanvasElement(
                          activeSlideId,
                          selectedCustomElement.id,
                          {
                            action: {
                              ...selectedCustomElement.action,
                              type: e.target.value as CanvasActionType,
                            },
                          }
                        )
                      }
                      style={{ ...studioInputStyle, marginTop: '4px' }}
                    >
                      <option value="none">Tidak Ada Aksi (None)</option>
                      <option value="goto-slide">
                        Pindah ke Slide Tertentu (goto-slide)
                      </option>
                      <option value="play-audio">
                        Putar Audio / Efek Suara (play-audio)
                      </option>
                      <option value="open-popup">
                        Buka Modal Pop-up Materi (open-popup)
                      </option>
                      <option value="external-url">
                        Buka Tautan Eksternal (external-url)
                      </option>
                    </select>
                  </label>

                  {/* Target Slide jika goto-slide */}
                  {selectedCustomElement.action?.type === 'goto-slide' && (
                    <label style={studioLabelStyle}>
                      Pilih Slide Tujuan (`targetSlideId` / `targetSlideIndex`)
                      <select
                        aria-label="Slide Tujuan (`targetSlideId`)"
                        data-testid="inspector-select-target-slide"
                        value={
                          selectedCustomElement.action.targetSlideId ||
                          (typeof selectedCustomElement.action
                            .targetSlideIndex === 'number'
                            ? content.slideOrder[
                                selectedCustomElement.action.targetSlideIndex
                              ]
                            : undefined) ||
                          content.slideOrder[0]
                        }
                        onChange={(e) => {
                          const targetId = e.target.value;
                          const targetIdx =
                            content.slideOrder.indexOf(targetId);
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              action: {
                                ...selectedCustomElement.action,
                                targetSlideId: targetId,
                                targetSlideIndex:
                                  targetIdx >= 0 ? targetIdx : 0,
                              },
                            }
                          );
                        }}
                        style={{ ...studioInputStyle, marginTop: '4px' }}
                      >
                        {content.slideOrder.map((sid, idx) => (
                          <option key={sid} value={sid}>
                            #{idx + 1} —{' '}
                            {getSlideDisplayLabel(content.slides[sid], idx)} (
                            {sid})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {/* External URL jika external-url */}
                  {selectedCustomElement.action?.type === 'external-url' && (
                    <label style={studioLabelStyle}>
                      URL Eksternal (`externalUrl`)
                      <input
                        type="url"
                        aria-label="URL Eksternal (`externalUrl`)"
                        data-testid="inspector-input-external-url"
                        value={selectedCustomElement.action.externalUrl || ''}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            {
                              action: {
                                ...selectedCustomElement.action,
                                externalUrl: e.target.value,
                              },
                            }
                          )
                        }
                        placeholder="https://kebudayaan.kemdikbud.go.id"
                        style={{
                          ...studioInputStyle,
                          marginTop: '4px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </label>
                  )}

                  {/* Pengaturan Audio & Tombol Play Test */}
                  <div>
                    <label style={studioLabelStyle}>
                      URL Audio / Efek Suara (`audioUrl`)
                      <input
                        type="text"
                        aria-label="URL Audio (`audioUrl`)"
                        data-testid="inspector-input-audio-url"
                        value={selectedCustomElement.audioUrl || ''}
                        onChange={(e) =>
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            { audioUrl: e.target.value }
                          )
                        }
                        placeholder="story_content/6DeuLJzk41Q_44100_56_0.mp3"
                        style={{
                          ...studioInputStyle,
                          marginTop: '4px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </label>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '6px',
                      }}
                    >
                      <button
                        type="button"
                        data-testid="inspector-btn-test-audio"
                        onClick={() =>
                          handlePlayTestInspectorAudio(
                            selectedCustomElement.audioUrl
                          )
                        }
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #0284C7',
                          backgroundColor: isPlayingInspectorAudio
                            ? '#0284C7'
                            : 'rgba(2, 132, 199, 0.16)',
                          color: isPlayingInspectorAudio
                            ? '#F8FAFC'
                            : '#38BDF8',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isPlayingInspectorAudio
                          ? '◼ Hentikan Tes'
                          : '▶ Play Test Audio'}
                      </button>

                      <label
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px dashed #334155',
                          backgroundColor: '#090D16',
                          color: '#CBD5E1',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Unggah MP3
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) =>
                            void handleUploadInspectorAudio(
                              e.target.files?.[0] || null
                            )
                          }
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    <select
                      aria-label="Pilih dari Katalog Audio"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          updateCanvasElement(
                            activeSlideId,
                            selectedCustomElement.id,
                            { audioUrl: e.target.value }
                          );
                        }
                      }}
                      style={{ ...studioInputStyle, marginTop: '6px' }}
                    >
                      <option value="">
                        — Pilih Cepat dari Katalog Audio Bawaan —
                      </option>
                      {sampleAudioList.map((a) => (
                        <option key={a.assetId} value={a.url}>
                          Audio #{a.assetId} ({a.url.split('/').pop()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pengaturan Modal Pop-up Materi jika open-popup */}
                  {selectedCustomElement.action?.type === 'open-popup' && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        paddingTop: '4px',
                        borderTop: '1px solid #334155',
                      }}
                    >
                      <label style={studioLabelStyle}>
                        Judul Modal Pop-up (`popupTitle`)
                        <input
                          type="text"
                          aria-label="Judul Pop-up (`popupTitle`)"
                          data-testid="inspector-input-popup-title"
                          value={selectedCustomElement.action.popupTitle || ''}
                          onChange={(e) =>
                            updateCanvasElement(
                              activeSlideId,
                              selectedCustomElement.id,
                              {
                                action: {
                                  ...selectedCustomElement.action,
                                  popupTitle: e.target.value,
                                },
                              }
                            )
                          }
                          style={{ ...studioInputStyle, marginTop: '4px' }}
                        />
                      </label>
                      <label style={studioLabelStyle}>
                        Isi Materi Pop-up (`popupBody` / `popupContent`)
                        <textarea
                          rows={2}
                          aria-label="Isi Pesan Pop-up (`popupContent`)"
                          data-testid="inspector-input-popup-content"
                          value={
                            selectedCustomElement.action.popupBody ||
                            selectedCustomElement.action.popupContent ||
                            ''
                          }
                          onChange={(e) =>
                            updateCanvasElement(
                              activeSlideId,
                              selectedCustomElement.id,
                              {
                                action: {
                                  ...selectedCustomElement.action,
                                  popupBody: e.target.value,
                                  popupContent: e.target.value,
                                },
                              }
                            )
                          }
                          style={{ ...studioInputStyle, marginTop: '4px' }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* D) KOORDINAT PRESISI (X%, Y%, LEBAR%, TINGGI%) */}
                <div style={sectionCardStyle}>
                  <span style={{ ...studioLabelStyle, color: '#FBBF24' }}>
                    d) Koordinat Presisi (0% – 100%)
                  </span>

                  {(
                    [
                      { key: 'x', label: 'Posisi X (%)', min: 0, max: 100 },
                      { key: 'y', label: 'Posisi Y (%)', min: 0, max: 100 },
                      { key: 'width', label: 'Lebar (%)', min: 1, max: 100 },
                      { key: 'height', label: 'Tinggi (%)', min: 1, max: 100 },
                    ] as const
                  ).map((coord) => {
                    const currentVal = selectedCustomElement[coord.key];
                    return (
                      <div
                        key={coord.key}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: '#CBD5E1',
                          }}
                        >
                          <span>{coord.label}</span>
                          <span style={{ fontFamily: 'monospace' }}>
                            {currentVal}%
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 68px',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="range"
                            aria-label={`Slider ${coord.label}`}
                            min={coord.min}
                            max={coord.max}
                            step={0.5}
                            value={currentVal}
                            onChange={(e) =>
                              updateCanvasElement(
                                activeSlideId,
                                selectedCustomElement.id,
                                {
                                  [coord.key]: clampPct(
                                    Number(e.target.value),
                                    coord.min,
                                    coord.max
                                  ),
                                }
                              )
                            }
                          />
                          <input
                            type="number"
                            aria-label={coord.label}
                            data-testid={`inspector-coord-${coord.key}`}
                            min={coord.min}
                            max={coord.max}
                            value={currentVal}
                            onChange={(e) =>
                              updateCanvasElement(
                                activeSlideId,
                                selectedCustomElement.id,
                                {
                                  [coord.key]: clampPct(
                                    Number(e.target.value),
                                    coord.min,
                                    coord.max
                                  ),
                                }
                              )
                            }
                            style={{
                              ...studioInputStyle,
                              fontFamily: 'monospace',
                              textAlign: 'right',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : selectedNativeElement ? (
              /* KONDISI 2: ELEMEN ASLI SLIDE SEDANG DIPILIH */
              <div style={sectionCardStyle}>
                <span style={{ ...studioLabelStyle, color: '#38BDF8' }}>
                  Inspector Elemen Bawaan: {selectedNativeElement.id}
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    color: '#94A3B8',
                    lineHeight: 1.45,
                  }}
                >
                  Ubah pergeseran posisi persentase (`xDeltaPct`, `yDeltaPct`),
                  teks kustom, atau sembunyikan secara non-destruktif tanpa
                  merusak kode asli.
                </p>

                <label style={studioLabelStyle}>
                  Teks Kustom (`customText`)
                  <input
                    type="text"
                    value={
                      selectedNativeElement.override?.customText ??
                      selectedNativeElement.label
                    }
                    onChange={(e) =>
                      updateElementOverride(
                        activeSlideId,
                        selectedNativeElement.id,
                        { customText: e.target.value }
                      )
                    }
                    style={{ ...studioInputStyle, marginTop: '4px' }}
                  />
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                  }}
                >
                  <label style={studioLabelStyle}>
                    Geser X (`xDeltaPct` %)
                    <input
                      type="number"
                      value={selectedNativeElement.override?.xDeltaPct ?? 0}
                      onChange={(e) =>
                        updateElementOverride(
                          activeSlideId,
                          selectedNativeElement.id,
                          { xDeltaPct: Number(e.target.value) || 0 }
                        )
                      }
                      style={{ ...studioInputStyle, marginTop: '4px' }}
                    />
                  </label>
                  <label style={studioLabelStyle}>
                    Geser Y (`yDeltaPct` %)
                    <input
                      type="number"
                      value={selectedNativeElement.override?.yDeltaPct ?? 0}
                      onChange={(e) =>
                        updateElementOverride(
                          activeSlideId,
                          selectedNativeElement.id,
                          { yDeltaPct: Number(e.target.value) || 0 }
                        )
                      }
                      style={{ ...studioInputStyle, marginTop: '4px' }}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {selectedNativeElement.hidden ? (
                    <button
                      type="button"
                      data-testid={`btn-restore-native-${selectedNativeElement.id}`}
                      onClick={() =>
                        restoreNativeElement(
                          activeSlideId,
                          selectedNativeElement.id
                        )
                      }
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid #10B981',
                        backgroundColor: '#065F46',
                        color: '#D1FAE5',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Pulihkan Elemen (Restore)
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid={`btn-hide-native-${selectedNativeElement.id}`}
                      onClick={() =>
                        hideNativeElement(
                          activeSlideId,
                          selectedNativeElement.id
                        )
                      }
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid #7F1D1D',
                        backgroundColor: '#7F1D1D',
                        color: '#FEE2E2',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Sembunyikan Elemen Asli
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* KONDISI 3: BELUM ADA ELEMEN DIPILIH — PANDUAN CEPAT & PENGATURAN SLIDE */
              <div style={sectionCardStyle}>
                <span style={{ ...studioLabelStyle, color: '#FBBF24' }}>
                  Pilih atau Tambahkan Elemen Kanvas
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: '#CBD5E1',
                    lineHeight: 1.5,
                  }}
                >
                  Klik elemen apa pun di panggung tengah untuk membuka pengaturan
                  lengkap (Gambar & Label, Gaya Visual, Aksi Klik & Audio, serta
                  Koordinat Presisi), atau klik tombol di bawah untuk membuat
                  elemen baru:
                </p>

                <button
                  type="button"
                  onClick={() => handleAddElement('image-button')}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #F59E0B',
                    backgroundColor: '#F59E0B',
                    color: '#090D16',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  + Buat Tombol Bergambar Sekarang
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default VisualStudioAdmin;
