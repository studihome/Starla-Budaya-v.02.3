import React, { useRef, useState, useEffect } from 'react';
import {
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Volume2,
  Lock,
  Unlock,
  Move,
  Image as ImageIcon,
  Palette,
  Type,
  MousePointerClick,
} from 'lucide-react';
import {
  CanvasActionConfig,
  CanvasElementAnimation,
  resolveCanvasAnimationCss,
} from '../../data/defaultContent';
import {
  ResizeHandleDirection,
  computeMoveRectPct,
  computeResizeRectPct,
  RectPct,
} from './canvasMath';

export interface EditableWrapperProps {
  id: string;
  label?: string;
  rect: RectPct;
  zIndex?: number;
  locked?: boolean;
  hidden?: boolean;
  isSelected: boolean;
  isEditMode: boolean;
  snapStepPct?: number;
  hasAudio?: boolean;
  isNativeElement?: boolean;
  elementType?: 'image-button' | 'text' | 'image' | 'audio-button' | 'audio-hotspot';
  inlineTextValue?: string;
  currentBgColor?: string;
  currentTextColor?: string;
  currentFontSize?: number;
  currentAction?: CanvasActionConfig;
  animation?: CanvasElementAnimation;
  timelinePlayRevision?: number;
  stageRef: React.RefObject<HTMLElement | null>;
  onSelect: (id: string, e: React.MouseEvent | React.PointerEvent) => void;
  onChangeRectTransient: (id: string, nextRect: RectPct) => void;
  onCommitRectChange: (id: string, finalRect: RectPct) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onLayerUp?: (id: string) => void;
  onLayerDown?: (id: string) => void;
  onTestAudio?: (id: string) => void;
  onToggleLock?: (id: string) => void;
  onInlineTextCommit?: (id: string, nextText: string) => void;
  onQuickUploadImage?: (id: string, file: File) => void;
  onQuickUploadAudio?: (id: string, file: File) => void;
  onQuickStyleChange?: (
    id: string,
    patch: { backgroundColor?: string; textColor?: string; fontSize?: number }
  ) => void;
  onQuickActionCycle?: (id: string) => void;
  onUserClick?: (id: string, e: React.MouseEvent) => void;
  children: React.ReactNode;
}

const HANDLE_DIRECTIONS: ResizeHandleDirection[] = [
  'nw',
  'n',
  'ne',
  'e',
  'se',
  's',
  'sw',
  'w',
];

const HANDLE_POSITION_STYLES: Record<ResizeHandleDirection, React.CSSProperties> = {
  nw: { top: '-6px', left: '-6px', cursor: 'nwse-resize' },
  n: { top: '-6px', left: 'calc(50% - 6px)', cursor: 'ns-resize' },
  ne: { top: '-6px', right: '-6px', cursor: 'nesw-resize' },
  e: { top: 'calc(50% - 6px)', right: '-6px', cursor: 'ew-resize' },
  se: { bottom: '-6px', right: '-6px', cursor: 'nwse-resize' },
  s: { bottom: '-6px', left: 'calc(50% - 6px)', cursor: 'ns-resize' },
  sw: { bottom: '-6px', left: '-6px', cursor: 'nesw-resize' },
  w: { top: 'calc(50% - 6px)', left: '-6px', cursor: 'ew-resize' },
};

const QUICK_COLOR_SWATCHES = [
  '#2563EB',
  '#059669',
  '#7C3AED',
  '#EA580C',
  '#DC2626',
  '#0F172A',
  '#FFFFFF',
];

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  id,
  label,
  rect,
  zIndex = 20,
  locked = false,
  hidden = false,
  isSelected,
  isEditMode,
  snapStepPct = 0,
  hasAudio = false,
  isNativeElement = false,
  elementType = 'image-button',
  inlineTextValue = '',
  currentBgColor = '#2563EB',
  currentTextColor = '#FFFFFF',
  currentFontSize = 15,
  currentAction,
  animation,
  timelinePlayRevision = 0,
  stageRef,
  onSelect,
  onChangeRectTransient,
  onCommitRectChange,
  onDuplicate,
  onDelete,
  onLayerUp,
  onLayerDown,
  onTestAudio,
  onToggleLock,
  onInlineTextCommit,
  onQuickUploadImage,
  onQuickUploadAudio,
  onQuickStyleChange,
  onQuickActionCycle,
  onUserClick,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeResizeDir, setActiveResizeDir] =
    useState<ResizeHandleDirection | null>(null);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [draftText, setDraftText] = useState(inlineTextValue);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [animFlashKey, setAnimFlashKey] = useState(0);

  const activeRectRef = useRef<RectPct>(rect);
  activeRectRef.current = rect;

  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const inlineInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isInlineEditing) {
      setDraftText(inlineTextValue);
    }
  }, [inlineTextValue, isInlineEditing]);

  useEffect(() => {
    if (!isSelected) {
      setIsInlineEditing(false);
      setShowColorPalette(false);
    }
  }, [isSelected]);

  useEffect(() => {
    if (isInlineEditing && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [isInlineEditing]);

  useEffect(() => {
    if (timelinePlayRevision > 0) {
      setAnimFlashKey(timelinePlayRevision);
    }
  }, [timelinePlayRevision]);

  if (hidden) {
    return null;
  }

  const animationCss = resolveCanvasAnimationCss(animation);

  // ZERO-OVERHEAD USER MODE:
  // When not in edit mode, render clean wrapper with zero editor chrome.
  if (!isEditMode) {
    return (
      <div
        data-canvas-element-id={id}
        data-testid={`canvas-el-${id}`}
        onClick={(e) => {
          if (onUserClick) {
            e.stopPropagation();
            onUserClick(id, e);
          }
        }}
        style={{
          position: 'absolute',
          left: `${rect.x}%`,
          top: `${rect.y}%`,
          width: `${rect.width}%`,
          height: `${rect.height}%`,
          zIndex,
          boxSizing: 'border-box',
          cursor: onUserClick ? 'pointer' : 'default',
          userSelect: 'none',
          ...animationCss,
        }}
      >
        {children}
      </div>
    );
  }

  const commitInlineEdit = () => {
    setIsInlineEditing(false);
    if (onInlineTextCommit && draftText.trim() !== inlineTextValue) {
      onInlineTextCommit(id, draftText);
    }
  };

  // Start 60fps pointer drag or 8-point resize
  const startPointerInteraction = (
    e: React.PointerEvent,
    mode: 'move' | ResizeHandleDirection
  ) => {
    if (!isEditMode || isInlineEditing) return;
    e.stopPropagation();
    e.preventDefault();

    onSelect(id, e);

    if (locked) return;

    const stageEl = stageRef.current;
    if (!stageEl) return;

    const stageBounds = stageEl.getBoundingClientRect();
    if (stageBounds.width <= 0 || stageBounds.height <= 0) return;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const initialRect: RectPct = { ...activeRectRef.current };
    let latestRect: RectPct = initialRect;

    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors in headless environments
    }

    if (mode === 'move') {
      setIsDragging(true);
    } else {
      setActiveResizeDir(mode);
    }

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const deltaXPct =
        ((moveEvt.clientX - startMouseX) / stageBounds.width) * 100;
      const deltaYPct =
        ((moveEvt.clientY - startMouseY) / stageBounds.height) * 100;

      if (mode === 'move') {
        latestRect = computeMoveRectPct(
          initialRect,
          deltaXPct,
          deltaYPct,
          snapStepPct
        );
      } else {
        latestRect = computeResizeRectPct(
          initialRect,
          mode,
          deltaXPct,
          deltaYPct,
          4,
          4,
          snapStepPct
        );
      }
      onChangeRectTransient(id, latestRect);
    };

    const handlePointerUp = (upEvt: PointerEvent) => {
      try {
        targetEl.releasePointerCapture(upEvt.pointerId);
      } catch {
        // Ignore
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setIsDragging(false);
      setActiveResizeDir(null);
      onCommitRectChange(id, latestRect);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const showToolbarBelow = rect.y < 14;
  const canEditImage = Boolean(onQuickUploadImage);
  const canEditText = Boolean(onInlineTextCommit);

  return (
    <div
      key={`${id}-anim-${animFlashKey}`}
      data-canvas-element-id={id}
      data-testid={`canvas-el-${id}`}
      onPointerDown={(e) => startPointerInteraction(e, 'move')}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id, e);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!locked && onInlineTextCommit) {
          setDraftText(inlineTextValue || label || '');
          setIsInlineEditing(true);
        }
      }}
      style={{
        position: 'absolute',
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        zIndex: isSelected ? Math.max(zIndex, 90) : zIndex,
        boxSizing: 'border-box',
        cursor: isInlineEditing
          ? 'text'
          : locked
            ? 'not-allowed'
            : isDragging
              ? 'grabbing'
              : 'grab',
        outline: isSelected
          ? locked
            ? '2px dashed #D97706'
            : '2px solid #2563EB'
          : '1px dashed rgba(37, 99, 235, 0.35)',
        outlineOffset: '2px',
        borderRadius: '6px',
        userSelect: 'none',
        touchAction: 'none',
        transition:
          isDragging || activeResizeDir ? 'none' : 'outline 120ms ease',
        ...animationCss,
      }}
    >
      {/* Hidden Quick File Inputs for Canva-Style Toolbar */}
      <input
        ref={imgInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onQuickUploadImage) {
            onQuickUploadImage(id, file);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onQuickUploadAudio) {
            onQuickUploadAudio(id, file);
          }
          e.target.value = '';
        }}
      />

      {/* Canva-Style Minimalist White Floating Contextual Toolbar */}
      {isSelected && (
        <div
          data-testid={`canvas-toolbar-${id}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            ...(showToolbarBelow
              ? { top: 'calc(100% + 10px)' }
              : { bottom: 'calc(100% + 10px)' }),
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 8px',
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.14), 0 4px 10px -2px rgba(15, 23, 42, 0.08)',
            color: '#0F172A',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 130,
          }}
        >
          {/* Element Badge & Coordinate */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '6px',
              backgroundColor: isNativeElement ? '#EFF6FF' : '#F1F5F9',
              color: isNativeElement ? '#1D4ED8' : '#334155',
              fontFamily: 'monospace',
              fontSize: '10px',
            }}
          >
            <Move size={11} />
            {isNativeElement ? 'Asli' : 'Custom'} {Math.round(rect.x)}%,{Math.round(rect.y)}%
          </span>

          {/* Quick Edit Text Button */}
          {canEditText && (
            <button
              type="button"
              title="Edit Teks Langsung (atau Double-Click)"
              data-testid={`btn-inline-text-el-${id}`}
              onClick={() => {
                setDraftText(inlineTextValue || label || '');
                setIsInlineEditing(true);
              }}
              style={toolbarBtnStyle}
            >
              <Type size={12} style={{ color: '#2563EB' }} />
              <span>Edit Teks</span>
            </button>
          )}

          {/* Quick Replace / Upload Image */}
          {canEditImage && (
            <button
              type="button"
              title="Ganti Gambar Elemen"
              data-testid={`btn-change-image-el-${id}`}
              onClick={() => imgInputRef.current?.click()}
              style={toolbarBtnStyle}
            >
              <ImageIcon size={13} style={{ color: '#059669' }} />
              <span>Ganti Gambar</span>
            </button>
          )}

          {/* Quick Upload Audio */}
          {!isNativeElement && onQuickUploadAudio && (
            <button
              type="button"
              title="Upload / Ganti Suara"
              data-testid={`btn-change-audio-el-${id}`}
              onClick={() => audioInputRef.current?.click()}
              style={toolbarBtnStyle}
            >
              <Volume2 size={13} style={{ color: '#0284C7' }} />
              <span>Suara</span>
            </button>
          )}

          {/* Quick Color Swatch Toggle */}
          {!isNativeElement && onQuickStyleChange && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                title="Ganti Warna Elemen"
                data-testid={`btn-color-el-${id}`}
                onClick={() => setShowColorPalette((v) => !v)}
                style={toolbarBtnStyle}
              >
                <span
                  style={{
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    backgroundColor: currentBgColor,
                    border: '1px solid #CBD5E1',
                    display: 'inline-block',
                  }}
                />
                <Palette size={12} />
              </button>

              {showColorPalette && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.14)',
                    zIndex: 140,
                  }}
                >
                  {QUICK_COLOR_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => {
                        onQuickStyleChange(id, {
                          backgroundColor: hex,
                          textColor: hex === '#FFFFFF' ? '#0F172A' : '#FFFFFF',
                        });
                        setShowColorPalette(false);
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: hex,
                        border:
                          currentBgColor === hex
                            ? '2px solid #2563EB'
                            : '1px solid #CBD5E1',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Font Size Controls */}
          {!isNativeElement && onQuickStyleChange && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '1px 3px',
              }}
            >
              <button
                type="button"
                title="Perkecil Font"
                data-testid={`btn-font-dec-${id}`}
                onClick={() =>
                  onQuickStyleChange(id, {
                    fontSize: Math.max(10, (currentFontSize || 15) - 2),
                  })
                }
                style={{ ...toolbarBtnStyle, padding: '2px 5px' }}
              >
                A-
              </button>
              <span style={{ fontSize: '10px', color: '#475569', padding: '0 2px' }}>
                {currentFontSize || 15}
              </span>
              <button
                type="button"
                title="Perbesar Font"
                data-testid={`btn-font-inc-${id}`}
                onClick={() =>
                  onQuickStyleChange(id, {
                    fontSize: Math.min(64, (currentFontSize || 15) + 2),
                  })
                }
                style={{ ...toolbarBtnStyle, padding: '2px 5px' }}
              >
                A+
              </button>
            </div>
          )}

          {/* Quick Cycle Click Action */}
          {!isNativeElement && onQuickActionCycle && (
            <button
              type="button"
              title="Ubah Aksi Klik (None / Slide / Pop-up / Audio)"
              data-testid={`btn-cycle-action-${id}`}
              onClick={() => onQuickActionCycle(id)}
              style={toolbarBtnStyle}
            >
              <MousePointerClick size={12} style={{ color: '#D97706' }} />
              <span>{currentAction?.type || 'none'}</span>
            </button>
          )}

          {hasAudio && onTestAudio && (
            <button
              type="button"
              title="Tes Suara"
              data-testid={`btn-test-audio-${id}`}
              onClick={() => onTestAudio(id)}
              style={toolbarBtnStyle}
            >
              <Volume2 size={13} style={{ color: '#059669' }} />
            </button>
          )}

          {onLayerUp && (
            <button
              type="button"
              title="Majukan Layer (Bring Forward)"
              data-testid={`btn-layer-up-${id}`}
              onClick={() => onLayerUp(id)}
              style={toolbarBtnStyle}
            >
              <ArrowUp size={13} />
            </button>
          )}

          {onLayerDown && (
            <button
              type="button"
              title="Mundurkan Layer (Send Backward)"
              data-testid={`btn-layer-down-${id}`}
              onClick={() => onLayerDown(id)}
              style={toolbarBtnStyle}
            >
              <ArrowDown size={13} />
            </button>
          )}

          {onToggleLock && (
            <button
              type="button"
              title={locked ? 'Buka Kunci Posisi' : 'Kunci Posisi'}
              data-testid={`btn-lock-el-${id}`}
              onClick={() => onToggleLock(id)}
              style={{
                ...toolbarBtnStyle,
                color: locked ? '#D97706' : '#334155',
              }}
            >
              {locked ? <Lock size={13} /> : <Unlock size={13} />}
            </button>
          )}

          {onDuplicate && !isNativeElement && (
            <button
              type="button"
              title="Duplikat Elemen"
              data-testid={`btn-duplicate-el-${id}`}
              onClick={() => onDuplicate(id)}
              style={toolbarBtnStyle}
            >
              <Copy size={13} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              title={
                isNativeElement
                  ? 'Sembunyikan Elemen Asli (Dapat Dipulihkan)'
                  : 'Hapus Elemen'
              }
              data-testid={`btn-delete-el-${id}`}
              onClick={() => onDelete(id)}
              style={{ ...toolbarBtnStyle, color: '#DC2626' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      {/* Element Content or Inline Text Editor */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          pointerEvents: isInlineEditing ? 'auto' : 'none',
        }}
      >
        {children}

        {isInlineEditing && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              borderRadius: '6px',
              padding: '4px',
              border: '2px solid #2563EB',
            }}
          >
            <textarea
              ref={inlineInputRef}
              data-testid={`inline-text-editor-${id}`}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onBlur={commitInlineEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitInlineEdit();
                } else if (e.key === 'Escape') {
                  setIsInlineEditing(false);
                  setDraftText(inlineTextValue);
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                resize: 'none',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: '#0F172A',
                fontSize: `${currentFontSize || 15}px`,
                fontWeight: 700,
                textAlign: 'center',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}
      </div>

      {/* 8-Point Resize Handles (NW, N, NE, E, SE, S, SW, W) */}
      {isSelected &&
        !locked &&
        HANDLE_DIRECTIONS.map((dir) => (
          <div
            key={dir}
            data-testid={`resize-handle-${id}-${dir}`}
            onPointerDown={(e) => startPointerInteraction(e, dir)}
            style={{
              position: 'absolute',
              width: '11px',
              height: '11px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '2px solid #2563EB',
              boxShadow: '0 2px 6px rgba(15,23,42,0.22)',
              zIndex: 120,
              ...HANDLE_POSITION_STYLES[dir],
            }}
          />
        ))}
    </div>
  );
};

const toolbarBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  padding: '4px 7px',
  borderRadius: '6px',
  border: '1px solid transparent',
  backgroundColor: '#F8FAFC',
  color: '#0F172A',
  cursor: 'pointer',
  fontSize: '11px',
  fontWeight: 600,
};
