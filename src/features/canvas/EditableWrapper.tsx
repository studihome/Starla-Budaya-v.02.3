import React, { useEffect, useRef, useState } from 'react';
import {
  RESIZE_HANDLES,
  ResizeHandleDirection,
  PointerInteractionMode,
  computePointerMoveResizePct,
} from './canvasMath';
import {
  CanvasActionType,
  CanvasHoverEffect,
  resolveCanvasHoverStyle,
} from '../../types/canvas';

export interface EditableWrapperProps {
  id: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  locked?: boolean;
  enableSnap?: boolean;
  audioUrl?: string;
  backgroundColor?: string;
  fontSize?: number;
  actionType?: CanvasActionType;
  isCanvasEditMode: boolean;
  isSelected: boolean;
  isNativeElement?: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  onSelect: (id: string) => void;
  onChangeBounds: (
    id: string,
    bounds: { x: number; y: number; width: number; height: number }
  ) => void;
  onCommitHistory?: () => void;
  onInlineTextChange?: (id: string, newLabel: string) => void;
  onQuickStyleChange?: (
    id: string,
    stylePatch: { backgroundColor?: string; fontSize?: number }
  ) => void;
  onQuickActionChange?: (id: string, actionType: CanvasActionType) => void;
  onQuickUploadImage?: (id: string, file: File) => void;
  onQuickUploadAudio?: (id: string, file: File) => void;
  onDuplicate?: (id: string) => void;
  onLayerOrder?: (id: string, direction: 'forward' | 'backward') => void;
  onToggleLock?: (id: string) => void;
  onTestAudio?: (id: string, audioUrl?: string) => void;
  onDelete: (id: string) => void;
  onSnapChange?: (snap: { snapX: number | null; snapY: number | null }) => void;
  onTriggerAction?: () => void;
  hoverEffect?: CanvasHoverEffect;
  children: React.ReactNode;
}

const HANDLE_CURSORS: Record<ResizeHandleDirection, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
};

const HANDLE_POSITIONS: Record<ResizeHandleDirection, React.CSSProperties> = {
  nw: { top: '-5px', left: '-5px' },
  n: { top: '-5px', left: 'calc(50% - 5px)' },
  ne: { top: '-5px', right: '-5px' },
  e: { top: 'calc(50% - 5px)', right: '-5px' },
  se: { bottom: '-5px', right: '-5px' },
  s: { bottom: '-5px', left: 'calc(50% - 5px)' },
  sw: { bottom: '-5px', left: '-5px' },
  w: { top: 'calc(50% - 5px)', left: '-5px' },
};

/**
 * EditableWrapper (Canva-Style Minimalist Floating Studio):
 * - Di Mode Pengguna (`isCanvasEditMode === false`): Zero-Overhead. Hanya merender elemen pada koordinat persentase
 *   tanpa garis bantu, handle resize, maupun toolbar editor.
 * - Di Mode Edit Kanvas (`isCanvasEditMode === true`):
 *   1) Drag-and-drop 60fps berbasis `PointerEvent` + `getBoundingClientRect()` (0-100%)
 *   2) 8 titik handle resize responsif (`nw, n, ne, e, se, s, sw, w`)
 *   3) Double-Click Inline Text Editing langsung di atas elemen kanvas
 *   4) Floating Contextual Pill Toolbar berisi tombol cepat: Ganti Gambar, Upload Suara, Warna, Ukuran Font,
 *      Aksi Klik, Layer Up/Down, Lock, Duplikat, dan Hapus.
 */
export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  id,
  label = '',
  x,
  y,
  width,
  height,
  zIndex = 40,
  locked = false,
  enableSnap = true,
  audioUrl,
  backgroundColor = '#D97706',
  fontSize = 14,
  actionType = 'none',
  isCanvasEditMode,
  isSelected,
  isNativeElement = false,
  containerRef,
  onSelect,
  onChangeBounds,
  onCommitHistory,
  onInlineTextChange,
  onQuickStyleChange,
  onQuickActionChange,
  onQuickUploadImage,
  onQuickUploadAudio,
  onDuplicate,
  onLayerOrder,
  onToggleLock,
  onTestAudio,
  onDelete,
  onSnapChange,
  onTriggerAction,
  hoverEffect = 'none',
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [inlineDraft, setInlineDraft] = useState(label);
  const inlineInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setInlineDraft(label);
  }, [label]);

  useEffect(() => {
    if (!isSelected && isInlineEditing) {
      setIsInlineEditing(false);
    }
  }, [isSelected, isInlineEditing]);

  useEffect(() => {
    if (isInlineEditing && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [isInlineEditing]);

  const interactionRef = useRef<{
    mode: PointerInteractionMode;
    pointerId: number;
    startMouseX: number;
    startMouseY: number;
    startElem: { x: number; y: number; width: number; height: number };
    stageWidth: number;
    stageHeight: number;
    cleanupWindowListeners?: () => void;
  } | null>(null);

  // ============================================================================
  // ZERO-OVERHEAD USER MODE (`isCanvasEditMode === false`)
  // ============================================================================
  if (!isCanvasEditMode) {
    const { transform: hoverTransform, boxShadow: hoverShadow } =
      resolveCanvasHoverStyle(hoverEffect, isHovered);

    return (
      <div
        data-canvas-element-id={id}
        data-testid={`canvas-user-el-${id}`}
        onClick={(e) => {
          if (onTriggerAction) {
            e.stopPropagation();
            onTriggerAction();
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: `${width}%`,
          height: `${height}%`,
          zIndex,
          cursor: onTriggerAction ? 'pointer' : 'default',
          pointerEvents: 'auto',
          transform: hoverTransform,
          boxShadow: hoverShadow,
          transition:
            'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 180ms ease',
        }}
      >
        {children}
      </div>
    );
  }

  // ============================================================================
  // CANVAS EDIT MODE (`isCanvasEditMode === true`) — 60FPS POINTER EVENTS
  // ============================================================================
  const getStageDimensions = () => {
    const stageRect = containerRef.current?.getBoundingClientRect();
    return {
      width: stageRect && stageRect.width > 0 ? stageRect.width : 720,
      height: stageRect && stageRect.height > 0 ? stageRect.height : 405,
    };
  };

  const applyPointerCoordinateUpdate = (clientX: number, clientY: number) => {
    const state = interactionRef.current;
    if (!state || locked) return;

    const result = computePointerMoveResizePct({
      mode: state.mode,
      startElem: state.startElem,
      startMouseX: state.startMouseX,
      startMouseY: state.startMouseY,
      clientX,
      clientY,
      stageWidth: state.stageWidth,
      stageHeight: state.stageHeight,
      enableSnap,
      minSizePct: 4,
    });

    onSnapChange?.({ snapX: result.snapX, snapY: result.snapY });
    onChangeBounds(id, {
      x: result.x,
      y: result.y,
      width: result.width,
      height: result.height,
    });
  };

  const finishPointerInteraction = (
    targetEl?: HTMLElement | null,
    pointerId?: number
  ) => {
    const state = interactionRef.current;
    if (!state) return;

    state.cleanupWindowListeners?.();
    interactionRef.current = null;
    onSnapChange?.({ snapX: null, snapY: null });
    onCommitHistory?.(); // Simpan ke Undo/Redo stack setelah selesai menggeser

    if (targetEl && pointerId !== undefined) {
      try {
        targetEl.releasePointerCapture(pointerId);
      } catch {
        // Ignore in synthetic test environments
      }
    }
  };

  // Logika Inti Pointer Drag & Resize Berbasis Persentase (60 FPS)
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    mode: PointerInteractionMode
  ) => {
    if (!isCanvasEditMode || isInlineEditing) return;
    e.stopPropagation();
    onSelect(id);

    if (locked) return;

    interactionRef.current?.cleanupWindowListeners?.();

    const targetNode = (e.target as HTMLElement) || e.currentTarget;
    try {
      targetNode.setPointerCapture(e.pointerId);
    } catch {
      // Ignore in synthetic test environments without setPointerCapture
    }

    const stageRect = getStageDimensions();
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startElem = { x, y, width, height };

    const onWindowPointerMove = (moveEvent: PointerEvent) => {
      applyPointerCoordinateUpdate(moveEvent.clientX, moveEvent.clientY);
    };

    const onWindowPointerUp = (upEvent: PointerEvent) => {
      finishPointerInteraction(
        (upEvent.target as HTMLElement) || targetNode,
        upEvent.pointerId
      );
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', onWindowPointerMove);
      window.addEventListener('pointerup', onWindowPointerUp);
    }

    interactionRef.current = {
      mode,
      pointerId: e.pointerId,
      startMouseX,
      startMouseY,
      startElem,
      stageWidth: stageRect.width,
      stageHeight: stageRect.height,
      cleanupWindowListeners: () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('pointermove', onWindowPointerMove);
          window.removeEventListener('pointerup', onWindowPointerUp);
        }
      },
    };
  };

  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    handlePointerDown(e, 'move');
  };

  const handleResizePointerDown = (
    handle: ResizeHandleDirection,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    handlePointerDown(e, `resize-${handle}`);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactionRef.current || locked) return;
    e.stopPropagation();
    applyPointerCoordinateUpdate(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactionRef.current) return;
    e.stopPropagation();
    finishPointerInteraction(e.currentTarget, e.pointerId);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect(id);
    if (locked || !onInlineTextChange) return;
    setInlineDraft(label);
    setIsInlineEditing(true);
  };

  const commitInlineText = () => {
    setIsInlineEditing(false);
    if (onInlineTextChange && inlineDraft.trim() !== label) {
      onInlineTextChange(id, inlineDraft);
    }
  };

  const pillBtnStyle: React.CSSProperties = {
    padding: '3px 7px',
    borderRadius: '999px',
    border: '1px solid rgba(148, 163, 184, 0.28)',
    backgroundColor: 'rgba(30, 41, 59, 0.92)',
    color: '#F8FAFC',
    fontSize: '10.5px',
    fontWeight: 600,
    cursor: 'pointer',
    lineHeight: 1.2,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  };

  const safeHexColor =
    backgroundColor && backgroundColor.startsWith('#') && backgroundColor.length === 7
      ? backgroundColor
      : '#D97706';

  return (
    <div
      data-canvas-element-id={id}
      data-testid={`canvas-edit-el-${id}`}
      data-locked={String(locked)}
      onPointerDown={handleDragPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        zIndex: isSelected ? Math.max(zIndex, 100) : zIndex,
        outline: isSelected
          ? locked
            ? '2px solid #38BDF8'
            : '2px solid #F59E0B'
          : '1px dashed rgba(248, 250, 252, 0.55)',
        outlineOffset: '1px',
        cursor: isInlineEditing
          ? 'text'
          : locked
            ? 'not-allowed'
            : 'move',
        userSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto',
      }}
    >
      {/* Konten Visual Elemen atau Double-Click Inline Text Editor */}
      {isInlineEditing ? (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(9, 13, 22, 0.92)',
            borderRadius: '8px',
            padding: '4px 8px',
          }}
        >
          <input
            ref={inlineInputRef}
            type="text"
            aria-label="Inline Text Editor"
            data-testid={`inline-text-input-${id}`}
            value={inlineDraft}
            onChange={(e) => setInlineDraft(e.target.value)}
            onBlur={commitInlineText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitInlineText();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setInlineDraft(label);
                setIsInlineEditing(false);
              }
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid #F59E0B',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: `${fontSize}px`,
              fontWeight: 700,
              textAlign: 'center',
              padding: '3px 6px',
              outline: 'none',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {children}
        </div>
      )}

      {/* Floating Contextual Pill Toolbar & 8 Titik Handle Resize saat Elemen Dipilih */}
      {isSelected && (
        <>
          <div
            data-testid={`canvas-toolbar-${id}`}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: y < 16 ? 'calc(100% + 10px)' : '-42px',
              left: x > 55 ? 'auto' : x < 12 ? '0' : '50%',
              right: x > 55 ? '0' : 'auto',
              transform:
                x >= 12 && x <= 55 ? 'translateX(-50%)' : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 9px',
              borderRadius: '999px',
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(245, 158, 11, 0.75)',
              color: '#F8FAFC',
              fontSize: '10.5px',
              whiteSpace: 'nowrap',
              zIndex: 135,
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.72)',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace',
                color: '#FBBF24',
                fontWeight: 700,
                paddingRight: '4px',
                borderRight: '1px solid rgba(148, 163, 184, 0.25)',
              }}
            >
              {Math.round(x)}%,{Math.round(y)}%
            </span>

            {/* 1. Ganti Gambar */}
            {!isNativeElement && onQuickUploadImage && (
              <>
                <button
                  type="button"
                  title="Ganti Gambar Elemen"
                  data-testid={`btn-change-image-el-${id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    imageInputRef.current?.click();
                  }}
                  style={pillBtnStyle}
                >
                  🖼 Gambar
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onQuickUploadImage(id, f);
                  }}
                />
              </>
            )}

            {/* 2. Upload Suara & Tes Audio */}
            {!isNativeElement && onQuickUploadAudio && (
              <>
                <button
                  type="button"
                  title="Upload Suara MP3"
                  data-testid={`btn-upload-audio-el-${id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    audioInputRef.current?.click();
                  }}
                  style={pillBtnStyle}
                >
                  🎵 Suara
                </button>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onQuickUploadAudio(id, f);
                  }}
                />
              </>
            )}

            {onTestAudio && (
              <button
                type="button"
                title="Tes Suara Elemen"
                data-testid={`btn-test-audio-el-${id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTestAudio(id, audioUrl);
                }}
                style={{
                  ...pillBtnStyle,
                  borderColor: '#0284C7',
                  color: '#7DD3FC',
                }}
              >
                ▶ Tes Audio
              </button>
            )}

            {/* 3. Warna Background */}
            {!isNativeElement && onQuickStyleChange && (
              <label
                title="Ubah Warna Elemen"
                style={{
                  ...pillBtnStyle,
                  padding: '2px 6px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="color"
                  aria-label="Warna Cepat Elemen"
                  data-testid={`input-color-el-${id}`}
                  value={safeHexColor}
                  onChange={(e) =>
                    onQuickStyleChange(id, { backgroundColor: e.target.value })
                  }
                  style={{
                    width: '14px',
                    height: '14px',
                    border: 'none',
                    padding: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                />
              </label>
            )}

            {/* 4. Ukuran Font (A- / A+) */}
            {!isNativeElement && onQuickStyleChange && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <button
                  type="button"
                  title="Perkecil Ukuran Font"
                  data-testid={`btn-font-dec-el-${id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickStyleChange(id, {
                      fontSize: Math.max(10, (fontSize || 14) - 2),
                    });
                  }}
                  style={pillBtnStyle}
                >
                  A-
                </button>
                <button
                  type="button"
                  title="Perbesar Ukuran Font"
                  data-testid={`btn-font-inc-el-${id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickStyleChange(id, {
                      fontSize: Math.min(48, (fontSize || 14) + 2),
                    });
                  }}
                  style={pillBtnStyle}
                >
                  A+
                </button>
              </div>
            )}

            {/* 5. Aksi Klik Cepat */}
            {!isNativeElement && onQuickActionChange && (
              <select
                aria-label="Aksi Klik Cepat"
                data-testid={`select-action-el-${id}`}
                value={actionType}
                onChange={(e) =>
                  onQuickActionChange(id, e.target.value as CanvasActionType)
                }
                style={{
                  ...pillBtnStyle,
                  padding: '2px 6px',
                  backgroundColor: '#0F172A',
                }}
              >
                <option value="none">Aksi: None</option>
                <option value="open-popup">Aksi: Pop-up</option>
                <option value="goto-slide">Aksi: Pindah Slide</option>
                <option value="play-audio">Aksi: Putar Audio</option>
                <option value="external-url">Aksi: URL Luar</option>
              </select>
            )}

            {/* 6. Layer Up / Down */}
            {onLayerOrder && (
              <>
                <button
                  type="button"
                  title="Naikkan Layer (Bring Forward)"
                  data-testid={`btn-layer-up-${id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerOrder(id, 'forward');
                  }}
                  style={pillBtnStyle}
                >
                  ↑ Layer Up
                </button>
                <button
                  type="button"
                  title="Turunkan Layer (Send Backward)"
                  data-testid={`btn-layer-down-${id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerOrder(id, 'backward');
                  }}
                  style={pillBtnStyle}
                >
                  ↓ Down
                </button>
              </>
            )}

            {/* 7. Lock */}
            {onToggleLock && (
              <button
                type="button"
                title={locked ? 'Buka Kunci Posisi' : 'Kunci Posisi'}
                data-testid={`btn-lock-el-${id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(id);
                }}
                style={{
                  ...pillBtnStyle,
                  borderColor: locked ? '#38BDF8' : 'rgba(148, 163, 184, 0.28)',
                  color: locked ? '#38BDF8' : '#F8FAFC',
                }}
              >
                {locked ? 'Terkunci' : 'Lock'}
              </button>
            )}

            {/* 8. Duplikat */}
            {!isNativeElement && onDuplicate && (
              <button
                type="button"
                title="Duplikat Elemen"
                data-testid={`btn-duplicate-el-${id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(id);
                }}
                style={pillBtnStyle}
              >
                Duplikat
              </button>
            )}

            {/* 9. Hapus / Sembunyikan */}
            <button
              type="button"
              title="Hapus Elemen (Delete / Backspace)"
              data-testid={`btn-delete-el-${id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              style={{
                ...pillBtnStyle,
                borderColor: '#991B1B',
                backgroundColor: '#7F1D1D',
                color: '#FEE2E2',
              }}
            >
              {isNativeElement ? 'Sembunyikan' : 'Hapus'}
            </button>
          </div>

          {/* 8 Titik Resize Handle di Sudut & Sisi (aktif saat tidak dikunci) */}
          {!locked &&
            RESIZE_HANDLES.map((handle) => (
              <div
                key={handle}
                role="slider"
                aria-label={`Resize handle ${handle}`}
                aria-valuenow={Math.round(width)}
                data-testid={`resize-handle-${handle}`}
                onPointerDown={(e) => handleResizePointerDown(handle, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: '#FBBF24',
                  border: '1.5px solid #0F172A',
                  cursor: HANDLE_CURSORS[handle],
                  zIndex: 115,
                  touchAction: 'none',
                  ...HANDLE_POSITIONS[handle],
                }}
              />
            ))}
        </>
      )}
    </div>
  );
};

export default EditableWrapper;
