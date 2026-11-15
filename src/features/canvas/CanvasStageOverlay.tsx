import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useContent } from '../../context/ContentContext';
import {
  CanvasElementItem,
  SlideContentItem,
} from '../../data/defaultContent';
import { resolveCanvasShadowCss } from '../../types/canvas';
import { EditableWrapper } from './EditableWrapper';
import { clampPct } from './canvasMath';

export interface CanvasStageOverlayProps {
  /**
   * Jika diberikan, menggunakan slideId ini (mis. pada Split-Screen Live Preview / Visual Canvas Editor).
   * Jika tidak diberikan, otomatis mendeteksi slide aktif dari player utama (`#slide-window`).
   */
  slideIdOverride?: string;
  /**
   * Mode pemasangan:
   * - `'embedded'`: dirender langsung di dalam container parent berasio 16:9.
   * - `'player-portal'`: dirender ke dalam `#slide-window` pada player utama menggunakan React Portal.
   */
  mode?: 'embedded' | 'player-portal';
  /**
   * Paksa status mode edit kanvas pada instance ini (opsional).
   */
  forceEditMode?: boolean;
  /**
   * Callback saat aksi `goto-slide` dipicu.
   */
  onNavigateSlide?: (targetSlideId: string) => void;
}

function normalizeAssetUrl(rawUrl?: string): string {
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

/**
 * Merender visual internal dari satu `CanvasElementItem` sesuai tipenya
 * (`'image-button' | 'text' | 'image' | 'audio-button' | 'audio-hotspot'`).
 */
const CanvasElementRenderer: React.FC<{
  item: CanvasElementItem;
  isPlayingAudio: boolean;
}> = ({ item, isPlayingAudio }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const bg = item.style?.backgroundColor ?? 'rgba(15, 23, 42, 0.85)';
  const color = item.style?.textColor ?? '#FFFFFF';
  const radius = item.style?.borderRadius ?? 8;
  const borderWidth = item.style?.borderWidth ?? 0;
  const borderColor = item.style?.borderColor ?? '#F59E0B';
  const fontSize = item.style?.fontSize ?? 14;
  const iconName = item.style?.iconName || '';
  const objectFit = item.style?.objectFit ?? 'contain';
  const shadow = resolveCanvasShadowCss(item.style?.shadow);

  const borderStyle =
    borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined;

  const imgSrc = normalizeAssetUrl(item.imageUrl);

  if (item.type === 'image') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: `${radius}px`,
          border: borderStyle,
          overflow: 'hidden',
          backgroundColor: bg,
          boxShadow: shadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imgSrc && !imgFailed ? (
          <img
            src={imgSrc}
            alt={item.label || 'Elemen Gambar Kanvas'}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit,
              display: 'block',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: `${fontSize}px`,
              color,
              fontWeight: 600,
              padding: '6px',
              textAlign: 'center',
            }}
          >
            {iconName ? `${iconName} ` : ''}
            {item.label || 'Gambar'}
          </span>
        )}
      </div>
    );
  }

  if (item.type === 'text') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: `${radius}px`,
          border: borderStyle,
          backgroundColor: bg,
          color,
          fontSize: `${fontSize}px`,
          fontWeight: 600,
          boxShadow: shadow,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflow: 'hidden',
          lineHeight: 1.35,
          gap: '6px',
        }}
      >
        {iconName && <span aria-hidden="true">{iconName}</span>}
        <span>{item.label || 'Teks Kanvas'}</span>
      </div>
    );
  }

  if (item.type === 'audio-hotspot' || item.type === 'audio-button') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: `${radius}px`,
          backgroundColor: bg,
          color,
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          boxShadow: shadow,
          border: borderStyle || '1.5px solid #F59E0B',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          overflow: 'hidden',
        }}
      >
        <span aria-hidden="true">
          {isPlayingAudio ? '◼' : iconName || '▶'}
        </span>
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {item.label || 'Putar Audio'}
        </span>
      </div>
    );
  }

  // Default: 'image-button'
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: `${radius}px`,
        border: borderStyle,
        backgroundColor: bg,
        color,
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        boxShadow: shadow,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        overflow: 'hidden',
      }}
    >
      {imgSrc && !imgFailed ? (
        <img
          src={imgSrc}
          alt={item.label || 'Ikon Tombol'}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          style={{
            height: '75%',
            maxWidth: '38%',
            objectFit,
            flexShrink: 0,
          }}
        />
      ) : (
        iconName && <span aria-hidden="true">{iconName}</span>
      )}
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.label || 'Tombol Interaktif'}
      </span>
    </div>
  );
};

export const CanvasStageOverlay: React.FC<CanvasStageOverlayProps> = ({
  slideIdOverride,
  mode = 'embedded',
  forceEditMode,
  onNavigateSlide,
}) => {
  const {
    content,
    isCanvasEditMode: contextEditMode,
    isGridSnapEnabled,
    selectedCanvasItemId,
    setSelectedCanvasItemId,
    activeCanvasSlideId,
    setActiveCanvasSlideId,
    updateElementOverrideTransient,
    hideNativeElement,
    updateElementTransient,
    commitToHistory,
    deleteCanvasElement,
    duplicateCanvasElement,
    reorderCanvasElementLayer,
    toggleCanvasElementLock,
  } = useContent();

  const isEditMode =
    forceEditMode !== undefined ? forceEditMode : contextEditMode;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAudioItemId, setPlayingAudioItemId] = useState<string | null>(
    null
  );
  const [activePopup, setActivePopup] = useState<{
    title: string;
    content: string;
    externalUrl?: string;
  } | null>(null);
  const [snapGuides, setSnapGuides] = useState<{
    snapX: number | null;
    snapY: number | null;
  }>({ snapX: null, snapY: null });

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [detectedPlayerSlideId, setDetectedPlayerSlideId] =
    useState<string>('');

  // Deteksi `#slide-window` dan slide aktif pada player Storyline jika dalam mode `'player-portal'`
  useEffect(() => {
    if (mode !== 'player-portal' || typeof document === 'undefined') return;

    const syncPortalAndSlide = () => {
      const sw = document.getElementById('slide-window');
      if (sw && sw !== portalTarget) {
        setPortalTarget(sw);
      }
      const win = window as unknown as {
        StarlaCoreEngine?: { getCurrentSlideId?: () => string };
      };
      const currentId = win.StarlaCoreEngine?.getCurrentSlideId?.() || '';
      if (currentId && content.slides[currentId]) {
        setDetectedPlayerSlideId(currentId);
      }
    };

    syncPortalAndSlide();
    const timer = window.setInterval(syncPortalAndSlide, 450);
    return () => window.clearInterval(timer);
  }, [mode, portalTarget, content.slides]);

  const resolvedSlideId =
    slideIdOverride ||
    detectedPlayerSlideId ||
    activeCanvasSlideId ||
    content.slideOrder[0];

  const currentSlide: SlideContentItem | undefined =
    content.slides[resolvedSlideId];

  const canvasElements = currentSlide?.canvasElements || [];
  const elementOverrides = currentSlide?.elementOverrides || {};
  const hiddenElementIds = currentSlide?.hiddenElementIds || [];

  // Keyboard Delete / Backspace di Mode Edit Kanvas
  useEffect(() => {
    if (!isEditMode || !selectedCanvasItemId || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const customTarget = canvasElements.find(
        (item) => item.id === selectedCanvasItemId
      );
      if (customTarget) {
        if (customTarget.locked) return;
        e.preventDefault();
        deleteCanvasElement(resolvedSlideId, selectedCanvasItemId);
        return;
      }

      const natOv = elementOverrides[selectedCanvasItemId];
      if (natOv?.locked) return;
      e.preventDefault();
      hideNativeElement(resolvedSlideId, selectedCanvasItemId);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEditMode,
    selectedCanvasItemId,
    canvasElements,
    elementOverrides,
    resolvedSlideId,
    deleteCanvasElement,
    hideNativeElement,
  ]);

  // Zero-Overhead Guardrail:
  // Di mode player-portal pengguna biasa (`!isEditMode`), jika tidak ada `canvasElements` dan tidak ada popup aktif,
  // jangan merender elemen DOM apa pun agar tampilan 100% identik dengan aplikasi asli.
  if (
    mode === 'player-portal' &&
    !isEditMode &&
    canvasElements.length === 0 &&
    !activePopup
  ) {
    return null;
  }

  const handlePlayAudioForItem = (itemId: string, rawAudioUrl?: string) => {
    const fallbackUrl =
      rawAudioUrl ||
      currentSlide?.audios?.[0]?.url ||
      'story_content/6DeuLJzk41Q_44100_56_0.mp3';
    const audioSrc = normalizeAssetUrl(fallbackUrl);
    if (!audioSrc || !audioRef.current) return;

    if (playingAudioItemId === itemId) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingAudioItemId(null);
      return;
    }

    setPlayingAudioItemId(itemId);
    audioRef.current.src = audioSrc;
    audioRef.current.load();
    audioRef.current.play().catch(() => {});
  };

  // Eksekusi aksi saat elemen diklik di Mode Pengguna (`!isEditMode`)
  const handleTriggerElementAction = (item: CanvasElementItem) => {
    const act = item.action;
    const isAudioType =
      item.type === 'audio-hotspot' || item.type === 'audio-button';
    const effectiveActionType =
      act?.type && act.type !== 'none'
        ? act.type
        : isAudioType && item.audioUrl
          ? 'play-audio'
          : 'none';

    if (effectiveActionType === 'goto-slide') {
      const targetIdFromIndex =
        typeof act.targetSlideIndex === 'number' &&
        act.targetSlideIndex >= 0 &&
        act.targetSlideIndex < content.slideOrder.length
          ? content.slideOrder[act.targetSlideIndex]
          : undefined;
      const targetSlideId = act.targetSlideId || targetIdFromIndex;
      if (targetSlideId) {
        if (onNavigateSlide) {
          onNavigateSlide(targetSlideId);
        } else {
          setActiveCanvasSlideId(targetSlideId);
          if (typeof document !== 'undefined') {
            const targetEl = document.querySelector<HTMLElement>(
              `[data-slide-id="${targetSlideId}"]`
            );
            targetEl?.click();
          }
        }
      }
    } else if (effectiveActionType === 'play-audio') {
      handlePlayAudioForItem(item.id, item.audioUrl);
    } else if (effectiveActionType === 'open-popup') {
      setActivePopup({
        title: act.popupTitle || item.label || 'Informasi Budaya',
        content:
          act.popupBody ||
          act.popupContent ||
          'Informasi interaktif STARLA BUDAYA.',
      });
    } else if (effectiveActionType === 'external-url' && act.externalUrl) {
      setActivePopup({
        title: act.popupTitle || item.label || 'Tautan Eksternal',
        content:
          act.popupBody ||
          act.popupContent ||
          `Buka tautan referensi budaya: ${act.externalUrl}`,
        externalUrl: act.externalUrl,
      });
    }
  };

  // Daftar elemen bawaan slide (teks/gambar) untuk diedit posisinya secara non-destruktif saat `isEditMode === true`
  const nativeInteractiveItems = isEditMode
    ? [
        ...(currentSlide?.texts || []).slice(0, 6).map((tb, idx) => {
          const ov = elementOverrides[tb.objectId];
          const isHidden = Boolean(
            ov?.hidden || hiddenElementIds.includes(tb.objectId)
          );
          const baseX = clampPct(12 + (idx % 2) * 38, 0, 80);
          const baseY = clampPct(16 + Math.floor(idx / 2) * 20, 0, 80);
          return {
            objectId: tb.objectId,
            kind: 'native-text' as const,
            label:
              ov?.customText ??
              (tb.lines.join(' ').trim() || tb.altText || tb.objectId),
            x: clampPct(baseX + (ov?.xDeltaPct || 0), 0, 92),
            y: clampPct(baseY + (ov?.yDeltaPct || 0), 0, 92),
            baseX,
            baseY,
            width: ov?.widthPct ?? 34,
            height: ov?.heightPct ?? 12,
            zIndex: ov?.zIndex ?? 35,
            locked: Boolean(ov?.locked),
            audioUrl: ov?.customAudio || currentSlide?.audios?.[0]?.url || '',
            isHidden,
          };
        }),
      ].filter((item) => !item.isHidden)
    : [];

  const overlayContent = (
    <div
      ref={containerRef}
      data-testid="canvas-stage-overlay"
      data-slide-id={resolvedSlideId}
      data-edit-mode={String(isEditMode)}
      data-grid-snap={String(isGridSnapEnabled)}
      onPointerDown={() => {
        if (isEditMode) {
          setSelectedCanvasItemId(null);
        }
      }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: isEditMode ? 90 : 38,
        pointerEvents: isEditMode ? 'auto' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Audio Player Internal untuk Aksi `play-audio` & Tes Audio */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudioItemId(null)}
        style={{ display: 'none' }}
      />

      {/* Grid Overlay Proporsional — HANYA dirender saat `isEditMode === true` dan `isGridSnapEnabled === true` */}
      {isEditMode && isGridSnapEnabled && (
        <div
          data-testid="canvas-grid-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
            backgroundImage:
              'linear-gradient(to right, rgba(148, 163, 184, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.14) 1px, transparent 1px)',
            backgroundSize: '10% 10%',
          }}
        />
      )}

      {/* Garis Bantu Tengah (Center Snap Guides) — HANYA dirender saat `isEditMode === true` dan snap aktif */}
      {isEditMode && isGridSnapEnabled && snapGuides.snapX !== null && (
        <div
          data-testid="canvas-snap-guide-x"
          style={{
            position: 'absolute',
            left: `${snapGuides.snapX}%`,
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: '#38BDF8',
            boxShadow: '0 0 6px rgba(56, 189, 248, 0.9)',
            zIndex: 130,
            pointerEvents: 'none',
          }}
        />
      )}
      {isEditMode && isGridSnapEnabled && snapGuides.snapY !== null && (
        <div
          data-testid="canvas-snap-guide-y"
          style={{
            position: 'absolute',
            top: `${snapGuides.snapY}%`,
            left: 0,
            right: 0,
            height: '1px',
            backgroundColor: '#38BDF8',
            boxShadow: '0 0 6px rgba(56, 189, 248, 0.9)',
            zIndex: 130,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 1. Render Elemen Asli Slide (Native Elements) saat Mode Edit Kanvas Aktif */}
      {isEditMode &&
        nativeInteractiveItems.map((nat) => (
          <EditableWrapper
            key={`native_${nat.objectId}`}
            id={nat.objectId}
            label={`Asli: ${nat.label}`}
            x={nat.x}
            y={nat.y}
            width={nat.width}
            height={nat.height}
            zIndex={nat.zIndex}
            locked={nat.locked}
            enableSnap={isGridSnapEnabled}
            audioUrl={nat.audioUrl}
            isCanvasEditMode={true}
            isSelected={selectedCanvasItemId === nat.objectId}
            isNativeElement={true}
            containerRef={containerRef}
            onSelect={(id) => setSelectedCanvasItemId(id)}
            onChangeBounds={(id, bounds) => {
              updateElementOverrideTransient(resolvedSlideId, id, {
                xDeltaPct: bounds.x - nat.baseX,
                yDeltaPct: bounds.y - nat.baseY,
                widthPct: bounds.width,
                heightPct: bounds.height,
              });
            }}
            onCommitHistory={commitToHistory}
            onLayerOrder={(id, dir) =>
              reorderCanvasElementLayer(resolvedSlideId, id, dir)
            }
            onToggleLock={(id) => toggleCanvasElementLock(resolvedSlideId, id)}
            onTestAudio={(id, url) => handlePlayAudioForItem(id, url)}
            onDelete={(id) => hideNativeElement(resolvedSlideId, id)}
            onSnapChange={setSnapGuides}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '6px',
                backgroundColor: 'rgba(15, 23, 42, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.45)',
                color: '#E2E8F0',
                fontSize: '11px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                [Elemen Asli] {nat.label}
              </span>
            </div>
          </EditableWrapper>
        ))}

      {/* 2. Render Seluruh `canvasElements` di Posisi Persentasenya */}
      {canvasElements.map((item) => (
        <EditableWrapper
          key={item.id}
          id={item.id}
          label={item.label || item.type}
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          zIndex={item.zIndex || 40}
          locked={Boolean(item.locked)}
          enableSnap={isGridSnapEnabled}
          audioUrl={item.audioUrl}
          isCanvasEditMode={isEditMode}
          isSelected={selectedCanvasItemId === item.id}
          isNativeElement={false}
          containerRef={containerRef}
          onSelect={(id) => setSelectedCanvasItemId(id)}
          onChangeBounds={(id, bounds) => {
            updateElementTransient(resolvedSlideId, id, {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
            });
          }}
          onCommitHistory={commitToHistory}
          onDuplicate={(id) => duplicateCanvasElement(resolvedSlideId, id)}
          onLayerOrder={(id, dir) =>
            reorderCanvasElementLayer(resolvedSlideId, id, dir)
          }
          onToggleLock={(id) => toggleCanvasElementLock(resolvedSlideId, id)}
          onTestAudio={(id, url) => handlePlayAudioForItem(id, url)}
          onDelete={(id) => deleteCanvasElement(resolvedSlideId, id)}
          onSnapChange={setSnapGuides}
          onTriggerAction={() => handleTriggerElementAction(item)}
          hoverEffect={item.style?.hoverEffect || 'none'}
        >
          <CanvasElementRenderer
            item={item}
            isPlayingAudio={playingAudioItemId === item.id}
          />
        </EditableWrapper>
      ))}

      {/* 3. Modal Pop-up Interaktif saat `action.type === 'open-popup'` Dipicu Pengguna */}
      {activePopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="canvas-popup-title"
          data-testid="canvas-action-popup"
          onClick={(e) => {
            e.stopPropagation();
            setActivePopup(null);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 200,
            backgroundColor: 'rgba(6, 9, 19, 0.82)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            pointerEvents: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '420px',
              borderRadius: '10px',
              backgroundColor: '#0F172A',
              border: '1px solid #F59E0B',
              padding: '20px',
              color: '#F8FAFC',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.65)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '10px',
              }}
            >
              <h4
                id="canvas-popup-title"
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#FBBF24',
                }}
              >
                {activePopup.title}
              </h4>
              <button
                type="button"
                data-testid="btn-close-canvas-popup"
                onClick={() => setActivePopup(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#1E293B',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: 1.55,
                color: '#E2E8F0',
              }}
            >
              {activePopup.content}
            </p>
            {activePopup.externalUrl && (
              <div style={{ marginTop: '14px' }}>
                <a
                  href={activePopup.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="canvas-popup-external-link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    backgroundColor: '#F59E0B',
                    color: '#090D16',
                    fontSize: '12px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Buka Tautan ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (mode === 'player-portal') {
    if (!portalTarget) return null;
    return createPortal(overlayContent, portalTarget);
  }

  return overlayContent;
};

export default CanvasStageOverlay;

