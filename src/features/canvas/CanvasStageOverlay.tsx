import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Volume2,
  ExternalLink,
  Sparkles,
  Play,
  X,
  ArrowRightCircle,
  MessageSquare,
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import {
  CanvasElement,
  CanvasActionType,
  CANVAS_ANIMATION_KEYFRAMES_CSS,
  resolveCanvasShadowCss,
} from '../../types/canvas';
import { SlideImageRef, SlideTextBlock } from '../../data/defaultContent';
import { EditableWrapper } from './EditableWrapper';
import { RectPct } from './canvasMath';

export interface CanvasStageOverlayProps {
  /**
   * Optional explicit slide ID (used by Studio 16:9 Stage).
   */
  explicitSlideId?: string;
  /**
   * Optional legacy alias for explicitSlideId (used by LivePreviewPane).
   */
  slideIdOverride?: string;
  /**
   * Optional callback when navigating slides from a button click.
   */
  onNavigateSlide?: (slideId: string) => void;
  /**
   * Optional explicit stage container ref.
   */
  explicitStageRef?: React.RefObject<HTMLElement | null>;
  /**
   * Render mode: 'player-portal' attaches into Articulate #slide-window or falls back to overlay;
   * 'embedded' renders directly inside VisualStudioAdmin / CanvaStudio 16:9 stage.
   */
  mode?: 'player-portal' | 'embedded';
  /**
   * Incremented counter to trigger timeline preview animation replay on all elements.
   */
  timelinePlayRevision?: number;
}

export const CanvasStageOverlay: React.FC<CanvasStageOverlayProps> = ({
  explicitSlideId,
  slideIdOverride,
  onNavigateSlide,
  explicitStageRef,
  mode = 'player-portal',
  timelinePlayRevision = 0,
}) => {
  const {
    content,
    activeCanvasSlideId,
    setActiveCanvasSlideId,
    isCanvasEditMode,
    isGridSnapEnabled,
    selectedCanvasItemId,
    setSelectedCanvasItemId,
    updateCanvasElement,
    duplicateCanvasElement,
    deleteCanvasElement,
    reorderCanvasElementLayer,
    updateElementOverride,
    hideNativeElement,
    uploadMediaToCloud,
  } = useContent();

  const internalStageRef = useRef<HTMLDivElement | null>(null);
  const stageRef = explicitStageRef || internalStageRef;

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [transientRects, setTransientRects] = useState<Record<string, RectPct>>(
    {}
  );
  const [popupState, setPopupState] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const resolvedSlideId =
    explicitSlideId ||
    slideIdOverride ||
    activeCanvasSlideId ||
    content.slideOrder[0] ||
    '5dLAzY4SKGI';

  const currentSlide = useMemo(
    () =>
      content.slides[resolvedSlideId] ||
      content.slides[content.slideOrder[0]],
    [content.slides, content.slideOrder, resolvedSlideId]
  );

  const snapStepPct = isGridSnapEnabled ? 2 : 0;

  // Locate #slide-window or #preso in Articulate DOM when in player-portal mode
  useEffect(() => {
    if (mode !== 'player-portal') return;

    const findSlideContainer = () => {
      const el =
        (document.getElementById('slide-window') as HTMLElement | null) ||
        (document.querySelector('.slide-layer') as HTMLElement | null) ||
        (document.getElementById('preso') as HTMLElement | null);
      if (el && el !== portalTarget) {
        setPortalTarget(el);
      }
    };

    findSlideContainer();
    const timer = window.setInterval(findSlideContainer, 800);
    return () => window.clearInterval(timer);
  }, [mode, portalTarget]);

  // Apply elementOverrides to native Articulate DOM nodes inside #slide-window
  useEffect(() => {
    if (!currentSlide) return;
    const overrides = currentSlide.elementOverrides || {};
    const hiddenSet = new Set(currentSlide.hiddenElementIds || []);

    const accNodes = document.querySelectorAll<HTMLElement>('[data-acc-text]');
    accNodes.forEach((node) => {
      const accKey = node.getAttribute('data-acc-text') || '';
      const modelId = node.getAttribute('data-model-id') || accKey;
      const ov = overrides[modelId] || overrides[accKey];
      const isHidden =
        hiddenSet.has(modelId) || hiddenSet.has(accKey) || Boolean(ov?.hidden);

      if (isHidden) {
        node.style.visibility = 'hidden';
        node.style.pointerEvents = 'none';
      } else {
        node.style.visibility = '';
        node.style.pointerEvents = '';
      }

      if (ov && (ov.xDeltaPct || ov.yDeltaPct)) {
        node.style.transform = `translate(${ov.xDeltaPct || 0}%, ${ov.yDeltaPct || 0}%)`;
      } else if (!ov) {
        node.style.transform = '';
      }
    });
  }, [currentSlide, isCanvasEditMode]);

  // Keyboard Delete / Backspace support when an element is selected in Edit Mode
  useEffect(() => {
    if (!isCanvasEditMode || !selectedCanvasItemId || !currentSlide) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        (document.activeElement as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedCanvasItemId.startsWith('native:')) {
          const nativeId = selectedCanvasItemId.replace(/^native:/, '');
          hideNativeElement(currentSlide.id, nativeId);
          setSelectedCanvasItemId(null);
        } else {
          deleteCanvasElement(currentSlide.id, selectedCanvasItemId);
          setSelectedCanvasItemId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCanvasEditMode,
    selectedCanvasItemId,
    currentSlide,
    deleteCanvasElement,
    hideNativeElement,
    setSelectedCanvasItemId,
  ]);

  if (!currentSlide) return null;

  const canvasElements = [...(currentSlide.canvasElements || [])].sort(
    (a, b) => (a.zIndex || 20) - (b.zIndex || 20)
  );
  const hiddenIds = new Set(currentSlide.hiddenElementIds || []);
  const overrides = currentSlide.elementOverrides || {};

  // Build native slide element items (native images, video posters/backgrounds, and native text blocks)
  // so the 16:9 studio canvas displays all original slide assets on every slide and supports Direct Click-to-Edit.
  const rawImageSources: {
    objectId: string;
    url: string;
    altText: string;
    width: number;
    height: number;
  }[] = [
    ...(currentSlide.images || []).map((img: SlideImageRef, idx: number) => ({
      objectId: img.objectId || `img_${idx}`,
      url: img.url,
      altText: img.altText || `Gambar Asli #${idx + 1}`,
      width: img.width || 600,
      height: img.height || 400,
    })),
    ...(currentSlide.videos || []).map((vid, idx: number) => ({
      objectId: vid.objectId || `vid_${idx}`,
      url:
        vid.posterUrl ||
        currentSlide.backgroundUrl ||
        'mobile/Slide5WPRbcJDCqY.jpg',
      altText: `Video Slide: ${currentSlide.title}`,
      width: vid.width || 1280,
      height: vid.height || 720,
    })),
  ];

  if (rawImageSources.length === 0 && currentSlide.backgroundUrl) {
    rawImageSources.push({
      objectId: `bg_${currentSlide.id}`,
      url: currentSlide.backgroundUrl,
      altText: `Latar Slide: ${currentSlide.title}`,
      width: 1280,
      height: 720,
    });
  }

  const nativeImageItems = rawImageSources.map((img, idx: number) => {
    const id = img.objectId;
    const ov = overrides[id];
    const isHidden = hiddenIds.has(id) || Boolean(ov?.hidden);
    const isFullBg =
      idx === 0 &&
      (img.width >= 900 || img.height >= 500 || rawImageSources.length === 1);
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const defaultX = isFullBg ? 4 : Math.min(72, 6 + col * 30);
    const defaultY = isFullBg ? 6 : Math.min(68, 12 + row * 28);
    const defaultW = isFullBg ? 92 : 26;
    const defaultH = isFullBg ? 84 : 24;

    const baseRect: RectPct = {
      x: Math.max(0, Math.min(96, defaultX + (ov?.xDeltaPct || 0))),
      y: Math.max(0, Math.min(96, defaultY + (ov?.yDeltaPct || 0))),
      width: ov?.widthPct || defaultW,
      height: ov?.heightPct || defaultH,
    };

    return {
      id,
      wrapperId: `native:${id}`,
      kind: 'image' as const,
      label: ov?.customText || img.altText || `Gambar Asli #${idx + 1}`,
      imageUrl: ov?.customImage || img.url,
      defaultX,
      defaultY,
      rect: transientRects[`native:${id}`] || baseRect,
      hidden: isHidden,
      locked: Boolean(ov?.locked),
      animation: ov?.animation,
      zIndex: isFullBg ? 6 : 10 + idx,
    };
  });

  const nativeTextItems = (currentSlide.texts || []).map(
    (tb: SlideTextBlock, idx: number) => {
      const id = tb.objectId;
      const ov = overrides[id];
      const isHidden = hiddenIds.has(id) || Boolean(ov?.hidden);
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const defaultX = Math.min(66, 8 + col * 44);
      const defaultY = Math.min(78, 12 + row * 16);
      const baseRect: RectPct = {
        x: Math.max(0, Math.min(95, defaultX + (ov?.xDeltaPct || 0))),
        y: Math.max(0, Math.min(95, defaultY + (ov?.yDeltaPct || 0))),
        width: ov?.widthPct || 38,
        height: ov?.heightPct || 12,
      };
      return {
        id,
        wrapperId: `native:${id}`,
        kind: 'text' as const,
        label: ov?.customText || tb.lines.join(' '),
        imageUrl: ov?.customImage,
        defaultX,
        defaultY,
        rect: transientRects[`native:${id}`] || baseRect,
        hidden: isHidden,
        locked: Boolean(ov?.locked),
        animation: ov?.animation,
        zIndex: 16 + idx,
      };
    }
  );

  const playAudioUrl = (url?: string) => {
    if (!url) return;
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      audio.play().catch(() => {
        // Ignore autoplay restrictions in headless browsers
      });
    } catch {
      // Ignore audio errors
    }
  };

  const executeElementAction = (el: CanvasElement) => {
    if (el.audioUrl && el.action.type !== 'play-audio') {
      playAudioUrl(el.audioUrl);
    }

    switch (el.action.type) {
      case 'play-audio':
        playAudioUrl(el.audioUrl);
        break;
      case 'goto-slide': {
        let targetId = el.action.targetSlideId;
        if (
          typeof el.action.targetSlideIndex === 'number' &&
          content.slideOrder[el.action.targetSlideIndex]
        ) {
          targetId = content.slideOrder[el.action.targetSlideIndex];
        }
        if (targetId) {
          setActiveCanvasSlideId(targetId);
          onNavigateSlide?.(targetId);
        }
        break;
      }
      case 'open-popup':
        setPopupState({
          title: el.action.popupTitle || el.label || 'Informasi Materi',
          content:
            el.action.popupBody ||
            el.action.popupContent ||
            'Detail materi interaktif untuk bagian ini.',
        });
        break;
      case 'external-url':
        if (el.action.externalUrl) {
          window.open(el.action.externalUrl, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'none':
      default:
        break;
    }
  };

  // ZERO-OVERHEAD GUARD FOR PUBLIC PLAYER MODE:
  // If in player-portal mode, not editing, and slide has no custom elements or active popups, render nothing.
  if (
    mode === 'player-portal' &&
    !isCanvasEditMode &&
    canvasElements.length === 0 &&
    !popupState
  ) {
    return null;
  }

  const overlayContent = (
    <div
      ref={internalStageRef}
      data-testid={
        mode === 'embedded' ? 'studio-canvas-stage' : 'player-canvas-overlay'
      }
      onClick={() => {
        if (isCanvasEditMode) {
          setSelectedCanvasItemId(null);
        }
      }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents:
          isCanvasEditMode || mode === 'embedded' ? 'auto' : 'none',
        zIndex: isCanvasEditMode ? 80 : 45,
        overflow: 'hidden',
      }}
    >
      {/* Keyframes for Per-Element Timeline Animations */}
      <style>{CANVAS_ANIMATION_KEYFRAMES_CSS}</style>

      {/* Subtle Optional Snap Grid when enabled in Edit Mode */}
      {isCanvasEditMode && snapStepPct > 0 && (
        <div
          data-testid="canvas-snap-grid"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: `
              linear-gradient(to right, rgba(37, 99, 235, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(37, 99, 235, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: `${snapStepPct}% ${snapStepPct}%`,
            zIndex: 5,
          }}
        />
      )}

      {/* Native Slide Images (Direct Click-to-Edit in Studio or Edit Mode) */}
      {(isCanvasEditMode || mode === 'embedded') &&
        nativeImageItems.map((item) => (
          <EditableWrapper
            key={item.wrapperId}
            id={item.wrapperId}
            label={item.label}
            rect={item.rect}
            zIndex={item.zIndex}
            locked={item.locked}
            hidden={item.hidden}
            isSelected={selectedCanvasItemId === item.wrapperId}
            isEditMode={isCanvasEditMode}
            snapStepPct={snapStepPct}
            isNativeElement={true}
            elementType="image"
            inlineTextValue={item.label}
            currentFontSize={13}
            animation={item.animation}
            timelinePlayRevision={timelinePlayRevision}
            stageRef={stageRef}
            onSelect={(id) => setSelectedCanvasItemId(id)}
            onChangeRectTransient={(id, nextRect) =>
              setTransientRects((prev) => ({ ...prev, [id]: nextRect }))
            }
            onCommitRectChange={(id, finalRect) => {
              setTransientRects((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
              });
              updateElementOverride(resolvedSlideId, item.id, {
                xDeltaPct: Number((finalRect.x - item.defaultX).toFixed(2)),
                yDeltaPct: Number((finalRect.y - item.defaultY).toFixed(2)),
                widthPct: finalRect.width,
                heightPct: finalRect.height,
              });
            }}
            onInlineTextCommit={(_id, nextText) => {
              updateElementOverride(resolvedSlideId, item.id, {
                customText: nextText,
              });
            }}
            onQuickUploadImage={async (_id, file) => {
              const res = await uploadMediaToCloud(file, file.name);
              if (res.url) {
                updateElementOverride(resolvedSlideId, item.id, {
                  customImage: res.url,
                });
              }
            }}
            onToggleLock={() => {
              updateElementOverride(resolvedSlideId, item.id, {
                locked: !item.locked,
              });
            }}
            onDelete={() => {
              hideNativeElement(resolvedSlideId, item.id);
              setSelectedCanvasItemId(null);
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#F8FAFC',
                border: isCanvasEditMode
                  ? '1px solid rgba(148, 163, 184, 0.35)'
                  : 'none',
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.label}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          </EditableWrapper>
        ))}

      {/* Native Slide Text & Interactive Blocks (Direct Click-to-Edit) */}
      {(isCanvasEditMode || mode === 'embedded') &&
        nativeTextItems.map((item) => (
          <EditableWrapper
            key={item.wrapperId}
            id={item.wrapperId}
            label={item.label}
            rect={item.rect}
            zIndex={item.zIndex}
            locked={item.locked}
            hidden={item.hidden}
            isSelected={selectedCanvasItemId === item.wrapperId}
            isEditMode={isCanvasEditMode}
            snapStepPct={snapStepPct}
            isNativeElement={true}
            elementType="text"
            inlineTextValue={item.label}
            currentFontSize={14}
            animation={item.animation}
            timelinePlayRevision={timelinePlayRevision}
            stageRef={stageRef}
            onSelect={(id) => setSelectedCanvasItemId(id)}
            onChangeRectTransient={(id, nextRect) =>
              setTransientRects((prev) => ({ ...prev, [id]: nextRect }))
            }
            onCommitRectChange={(id, finalRect) => {
              setTransientRects((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
              });
              updateElementOverride(resolvedSlideId, item.id, {
                xDeltaPct: Number((finalRect.x - item.defaultX).toFixed(2)),
                yDeltaPct: Number((finalRect.y - item.defaultY).toFixed(2)),
                widthPct: finalRect.width,
                heightPct: finalRect.height,
              });
            }}
            onInlineTextCommit={(_id, nextText) => {
              updateElementOverride(resolvedSlideId, item.id, {
                customText: nextText,
              });
            }}
            onQuickUploadImage={async (_id, file) => {
              const res = await uploadMediaToCloud(file, file.name);
              if (res.url) {
                updateElementOverride(resolvedSlideId, item.id, {
                  customImage: res.url,
                });
              }
            }}
            onToggleLock={() => {
              updateElementOverride(resolvedSlideId, item.id, {
                locked: !item.locked,
              });
            }}
            onDelete={() => {
              hideNativeElement(resolvedSlideId, item.id);
              setSelectedCanvasItemId(null);
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: item.imageUrl
                  ? '#FFFFFF'
                  : 'rgba(255, 255, 255, 0.92)',
                border: '1px solid rgba(148, 163, 184, 0.45)',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                color: '#0F172A',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflow: 'hidden',
              }}
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.label}
                  draggable={false}
                  style={{
                    width: '32px',
                    height: '32px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.35,
                }}
              >
                {item.label}
              </span>
            </div>
          </EditableWrapper>
        ))}

      {/* Custom Canvas Elements (Image Buttons, Text, Images, Audio Buttons) */}
      {canvasElements.map((el) => {
        const rect: RectPct = transientRects[el.id] || {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
        };
        const isHovered = hoveredId === el.id;

        const hoverTransform =
          !isCanvasEditMode && isHovered
            ? el.style.hoverEffect === 'scale'
              ? 'scale(1.04)'
              : el.style.hoverEffect === 'lift'
                ? 'translateY(-3px)'
                : el.style.hoverEffect === 'pulse'
                  ? 'scale(1.02)'
                  : 'none'
            : 'none';

        const cycleActionOrder: CanvasActionType[] = [
          'none',
          'open-popup',
          'goto-slide',
          'play-audio',
          'external-url',
        ];

        return (
          <div
            key={el.id}
            style={{
              pointerEvents: 'auto',
            }}
            onMouseEnter={() => setHoveredId(el.id)}
            onMouseLeave={() =>
              setHoveredId((prev) => (prev === el.id ? null : prev))
            }
          >
            <EditableWrapper
              id={el.id}
              label={el.label}
              rect={rect}
              zIndex={el.zIndex || 25}
              locked={el.locked}
              isSelected={selectedCanvasItemId === el.id}
              isEditMode={isCanvasEditMode}
              snapStepPct={snapStepPct}
              hasAudio={Boolean(el.audioUrl)}
              elementType={el.type}
              inlineTextValue={el.label || ''}
              currentBgColor={el.style.backgroundColor}
              currentTextColor={el.style.textColor}
              currentFontSize={el.style.fontSize}
              currentAction={el.action}
              animation={el.animation}
              timelinePlayRevision={timelinePlayRevision}
              stageRef={stageRef}
              onSelect={(id) => setSelectedCanvasItemId(id)}
              onChangeRectTransient={(id, nextRect) =>
                setTransientRects((prev) => ({ ...prev, [id]: nextRect }))
              }
              onCommitRectChange={(id, finalRect) => {
                setTransientRects((prev) => {
                  const copy = { ...prev };
                  delete copy[id];
                  return copy;
                });
                updateCanvasElement(resolvedSlideId, id, {
                  x: finalRect.x,
                  y: finalRect.y,
                  width: finalRect.width,
                  height: finalRect.height,
                });
              }}
              onInlineTextCommit={(id, nextText) => {
                updateCanvasElement(resolvedSlideId, id, {
                  label: nextText,
                });
              }}
              onQuickUploadImage={async (id, file) => {
                const res = await uploadMediaToCloud(file, file.name);
                if (res.url) {
                  updateCanvasElement(resolvedSlideId, id, {
                    imageUrl: res.url,
                  });
                }
              }}
              onQuickUploadAudio={async (id, file) => {
                const res = await uploadMediaToCloud(file, file.name);
                if (res.url) {
                  updateCanvasElement(resolvedSlideId, id, {
                    audioUrl: res.url,
                    action: {
                      ...el.action,
                      type:
                        el.action.type === 'none'
                          ? 'play-audio'
                          : el.action.type,
                    },
                  });
                }
              }}
              onQuickStyleChange={(id, patch) => {
                updateCanvasElement(resolvedSlideId, id, {
                  style: {
                    ...el.style,
                    ...patch,
                  },
                });
              }}
              onQuickActionCycle={(id) => {
                const currentIdx = cycleActionOrder.indexOf(
                  el.action.type || 'none'
                );
                const nextType =
                  cycleActionOrder[(currentIdx + 1) % cycleActionOrder.length];
                updateCanvasElement(resolvedSlideId, id, {
                  action: {
                    ...el.action,
                    type: nextType,
                    popupTitle:
                      nextType === 'open-popup' && !el.action.popupTitle
                        ? el.label || 'Informasi Materi'
                        : el.action.popupTitle,
                    popupBody:
                      nextType === 'open-popup' && !el.action.popupBody
                        ? 'Penjelasan interaktif untuk elemen ini.'
                        : el.action.popupBody,
                  },
                });
              }}
              onDuplicate={(id) => duplicateCanvasElement(resolvedSlideId, id)}
              onDelete={(id) => deleteCanvasElement(resolvedSlideId, id)}
              onLayerUp={(id) =>
                reorderCanvasElementLayer(resolvedSlideId, id, 'forward')
              }
              onLayerDown={(id) =>
                reorderCanvasElementLayer(resolvedSlideId, id, 'backward')
              }
              onTestAudio={() => playAudioUrl(el.audioUrl)}
              onToggleLock={(id) => {
                updateCanvasElement(resolvedSlideId, id, {
                  locked: !el.locked,
                });
              }}
              onUserClick={() => executeElementAction(el)}
            >
              <CanvasElementRenderer
                element={el}
                hoverTransform={hoverTransform}
              />
            </EditableWrapper>
          </div>
        );
      })}

      {/* Interactive Popup Modal when user clicks an 'open-popup' button */}
      {popupState && (
        <div
          data-testid="canvas-action-popup"
          onClick={(e) => {
            e.stopPropagation();
            setPopupState(null);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 200,
            pointerEvents: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '22px 24px',
              color: '#0F172A',
              boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#0F172A',
                }}
              >
                {popupState.title}
              </h3>
              <button
                type="button"
                data-testid="btn-close-canvas-popup"
                onClick={() => setPopupState(null)}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  color: '#334155',
                  borderRadius: '8px',
                  padding: '5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                }}
              >
                <X size={16} />
              </button>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                lineHeight: 1.65,
                color: '#334155',
                whiteSpace: 'pre-wrap',
              }}
            >
              {popupState.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (mode === 'embedded') {
    return overlayContent;
  }

  if (portalTarget) {
    return createPortal(overlayContent, portalTarget);
  }

  return overlayContent;
};

const CanvasElementRenderer: React.FC<{
  element: CanvasElement;
  hoverTransform: string;
}> = ({ element, hoverTransform }) => {
  const { style, type, label, imageUrl, action } = element;
  const shadowValue = resolveCanvasShadowCss(style.shadow);
  const borderCss =
    style.borderWidth && style.borderWidth > 0
      ? `${style.borderWidth}px solid ${style.borderColor || 'rgba(148,163,184,0.4)'}`
      : '1px solid rgba(148,163,184,0.28)';

  const ActionBadge = () => {
    if (!action || action.type === 'none') return null;
    return (
      <span
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          width: '20px',
          height: '20px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {action.type === 'play-audio' && <Volume2 size={11} />}
        {action.type === 'goto-slide' && <ArrowRightCircle size={11} />}
        {action.type === 'open-popup' && <MessageSquare size={11} />}
        {action.type === 'external-url' && <ExternalLink size={11} />}
      </span>
    );
  };

  if (type === 'image') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: `${style.borderRadius ?? 8}px`,
          boxShadow: shadowValue,
          border: borderCss,
          backgroundColor: style.backgroundColor || 'transparent',
          overflow: 'hidden',
          position: 'relative',
          transform: hoverTransform,
          transition: 'transform 160ms ease, box-shadow 160ms ease',
          opacity: style.opacity ?? 1,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label || 'Canvas Image'}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: style.objectFit || 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: style.textColor || '#475569',
              fontSize: `${style.fontSize || 14}px`,
              fontWeight: 600,
            }}
          >
            {label || 'Gambar'}
          </div>
        )}
        <ActionBadge />
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: `${style.borderRadius ?? 8}px`,
          boxShadow: shadowValue,
          border: borderCss,
          backgroundColor: style.backgroundColor || '#FFFFFF',
          color: style.textColor || '#0F172A',
          fontSize: `${style.fontSize || 18}px`,
          fontWeight: style.fontWeight || 'bold',
          textAlign: style.textAlign || 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            style.textAlign === 'left'
              ? 'flex-start'
              : style.textAlign === 'right'
                ? 'flex-end'
                : 'center',
          padding: '8px 14px',
          boxSizing: 'border-box',
          position: 'relative',
          transform: hoverTransform,
          transition: 'transform 160ms ease',
          opacity: style.opacity ?? 1,
          overflow: 'hidden',
        }}
      >
        <span style={{ lineHeight: 1.3 }}>{label || 'Teks Baru'}</span>
        <ActionBadge />
      </div>
    );
  }

  if (type === 'audio-button' || type === 'audio-hotspot') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: `${style.borderRadius ?? 999}px`,
          boxShadow: shadowValue,
          border: borderCss,
          backgroundColor: style.backgroundColor || '#059669',
          color: style.textColor || '#FFFFFF',
          fontSize: `${style.fontSize || 14}px`,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '8px 12px',
          boxSizing: 'border-box',
          position: 'relative',
          transform: hoverTransform,
          transition: 'transform 160ms ease',
          opacity: style.opacity ?? 1,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255,255,255,0.22)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Play size={14} fill="currentColor" />
        </span>
        {label && (
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        )}
      </div>
    );
  }

  // Default: 'image-button' (Tombol dengan Gambar)
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: `${style.borderRadius ?? 10}px`,
        boxShadow: shadowValue,
        border: borderCss,
        backgroundColor: style.backgroundColor || '#2563EB',
        color: style.textColor || '#FFFFFF',
        fontSize: `${style.fontSize || 15}px`,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '8px 14px',
        boxSizing: 'border-box',
        position: 'relative',
        transform: hoverTransform,
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        opacity: style.opacity ?? 1,
        overflow: 'hidden',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label || 'Icon'}
          draggable={false}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            objectFit: style.objectFit || 'cover',
            flexShrink: 0,
            backgroundColor: 'rgba(255,255,255,0.15)',
          }}
        />
      ) : (
        <span
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={15} />
        </span>
      )}
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.25,
        }}
      >
        {label || 'Tombol Interaktif'}
      </span>
      <ActionBadge />
    </div>
  );
};
