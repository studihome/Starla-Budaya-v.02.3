import React, { useRef, useState } from 'react';
import {
  RESIZE_HANDLES,
  ResizeHandleDirection,
  PointerInteractionMode,
  computePointerMoveResizePct,
} from './canvasMath';
import {
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
 * EditableWrapper:
 * - Di Mode Pengguna (`isCanvasEditMode === false`): Zero-Overhead. Hanya merender elemen pada koordinat persentase
 *   tanpa garis bantu, handle resize, maupun toolbar editor.
 * - Di Mode Edit Kanvas (`isCanvasEditMode === true`): Mengaktifkan drag-and-drop 60fps berbasis `PointerEvent` +
 *   `getBoundingClientRect()`, 8 titik handle resize, deteksi snap guide tengah, serta Floating Action Toolbar
 *   (Duplikat, Layer Up/Down, Tes Audio, Lock, dan Hapus/Sembunyikan).
 */
export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  id,
  label,
  x,
  y,
  width,
  height,
  zIndex = 40,
  locked = false,
  enableSnap = true,
  audioUrl,
  isCanvasEditMode,
  isSelected,
  isNativeElement = false,
  containerRef,
  onSelect,
  onChangeBounds,
  onCommitHistory,
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
    if (!isCanvasEditMode) return;
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

  const toolbarBtnStyle: React.CSSProperties = {
    padding: '3px 7px',
    borderRadius: '4px',
    border: '1px solid #334155',
    backgroundColor: '#1E293B',
    color: '#E2E8F0',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    lineHeight: 1.2,
  };

  return (
    <div
      data-canvas-element-id={id}
      data-testid={`canvas-edit-el-${id}`}
      data-locked={String(locked)}
      onPointerDown={handleDragPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
        cursor: locked ? 'not-allowed' : 'move',
        userSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto',
      }}
    >
      {/* Konten Visual Elemen */}
      <div
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>

      {/* Floating Action Toolbar & 8 Titik Handle Resize saat Elemen Dipilih */}
      {isSelected && (
        <>
          <div
            data-testid={`canvas-toolbar-${id}`}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: y < 14 ? 'calc(100% + 8px)' : '-36px',
              left: x > 50 ? 'auto' : x < 15 ? '0' : '50%',
              right: x > 50 ? '0' : 'auto',
              transform:
                x >= 15 && x <= 50 ? 'translateX(-50%)' : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 7px',
              borderRadius: '6px',
              backgroundColor: '#0F172A',
              border: '1px solid #F59E0B',
              color: '#F8FAFC',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              zIndex: 125,
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.65)',
            }}
          >
            <span
              style={{
                fontFamily: 'monospace',
                color: '#FBBF24',
                fontWeight: 700,
                marginRight: '2px',
              }}
            >
              {Math.round(x)}%,{Math.round(y)}% ({Math.round(width)}×
              {Math.round(height)}%)
            </span>

            {!isNativeElement && onDuplicate && (
              <button
                type="button"
                title="Duplikat Elemen"
                data-testid={`btn-duplicate-el-${id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(id);
                }}
                style={toolbarBtnStyle}
              >
                Duplikat
              </button>
            )}

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
                  style={toolbarBtnStyle}
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
                  style={toolbarBtnStyle}
                >
                  ↓ Down
                </button>
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
                  ...toolbarBtnStyle,
                  borderColor: '#0284C7',
                  color: '#7DD3FC',
                }}
              >
                ▶ Tes Audio
              </button>
            )}

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
                  ...toolbarBtnStyle,
                  borderColor: locked ? '#38BDF8' : '#334155',
                  color: locked ? '#38BDF8' : '#E2E8F0',
                }}
              >
                {locked ? 'Terkunci' : 'Lock'}
              </button>
            )}

            <button
              type="button"
              title="Hapus Elemen (Delete / Backspace)"
              data-testid={`btn-delete-el-${id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              style={{
                padding: '3px 7px',
                borderRadius: '4px',
                border: '1px solid #991B1B',
                backgroundColor: '#7F1D1D',
                color: '#FEE2E2',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                lineHeight: 1.2,
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

