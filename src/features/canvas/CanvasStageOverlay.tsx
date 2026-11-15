// src/features/canvas/CanvasStageOverlay.tsx
import React, { useRef, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import { CanvasElement, ResizeDirection } from '../../types/canvas';
import { Copy, Trash2, Volume2, Lock, ArrowUp, ArrowDown, X } from 'lucide-react';

const RESIZE_HANDLES: { dir: ResizeDirection; className: string }[] = [
  { dir: 'nw', className: '-top-1.5 -left-1.5 cursor-nwse-resize' },
  { dir: 'n', className: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
  { dir: 'ne', className: '-top-1.5 -right-1.5 cursor-nesw-resize' },
  { dir: 'e', className: 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize' },
  { dir: 'se', className: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
  { dir: 's', className: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
  { dir: 'sw', className: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
  { dir: 'w', className: 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize' },
];

export const CanvasStageOverlay: React.FC = () => {
  const {
    activeSlide,
    selectedElementId,
    setSelectedElementId,
    isEditMode,
    snapEnabled,
    updateElementTransient,
    commitElementUpdate,
    duplicateElement,
    deleteElement,
    setActiveSlideIndex,
  } = useContent();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [snapLines, setSnapLines] = useState<{ vertical: boolean; horizontal: boolean }>({
    vertical: false,
    horizontal: false,
  });
  const [activePopup, setActivePopup] = useState<{ title: string; content: string } | null>(null);

  // Putar audio tanpa memotong audio lain
  const playAudioUrl = (url?: string) => {
    if (!url) return;
    try {
      const audio = new Audio(url);
      audio.play().catch((err) => console.warn('Gagal memutar audio:', err));
    } catch (e) {
      console.warn('Error Audio API:', e);
    }
  };

  // Aksi saat elemen diklik oleh pengguna (Bukan Mode Edit)
  const handleUserClickElement = (el: CanvasElement) => {
    if (isEditMode) return;

    // Jika elemen punya audio langsung, putar suaranya
    if (el.audioUrl) {
      playAudioUrl(el.audioUrl);
    }

    switch (el.action.type) {
      case 'play-audio':
        playAudioUrl(el.action.audioUrl || el.audioUrl);
        break;
      case 'goto-slide':
        if (typeof el.action.targetSlideIndex === 'number') {
          setActiveSlideIndex(el.action.targetSlideIndex);
        }
        break;
      case 'open-popup':
        setActivePopup({
          title: el.action.popupTitle || el.label || 'Informasi',
          content: el.action.popupContent || '',
        });
        break;
      case 'external-url':
        if (el.action.externalUrl) {
          window.open(el.action.externalUrl, '_blank', 'noopener,noreferrer');
        }
        break;
      default:
        break;
    }
  };

  // Pointer Handler 60 FPS untuk Geser Posisi (Move) & 8 Titik Resize dalam Persentase
  const startPointerInteraction = (
    e: React.PointerEvent,
    el: CanvasElement,
    mode: 'move' | ResizeDirection
  ) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedElementId(el.id);

    if (el.locked || !overlayRef.current) return;

    const targetDom = e.currentTarget as HTMLElement;
    targetDom.setPointerCapture(e.pointerId);

    const rect = overlayRef.current.getBoundingClientRect();
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const initial = { x: el.x, y: el.y, width: el.width, height: el.height };

    let latestState = { ...initial };

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const deltaXPct = ((moveEvt.clientX - startClientX) / rect.width) * 100;
      const deltaYPct = ((moveEvt.clientY - startClientY) / rect.height) * 100;

      let nextX = initial.x;
      let nextY = initial.y;
      let nextW = initial.width;
      let nextH = initial.height;

      if (mode === 'move') {
        nextX = Math.max(0, Math.min(100 - initial.width, initial.x + deltaXPct));
        nextY = Math.max(0, Math.min(100 - initial.height, initial.y + deltaYPct));

        // Magnetic Center Snapping (toleransi 1.2%)
        let vSnap = false;
        let hSnap = false;
        if (snapEnabled) {
          const centerX = nextX + nextW / 2;
          const centerY = nextY + nextH / 2;
          if (Math.abs(centerX - 50) < 1.2) {
            nextX = 50 - nextW / 2;
            vSnap = true;
          }
          if (Math.abs(centerY - 50) < 1.2) {
            nextY = 50 - nextH / 2;
            hSnap = true;
          }
        }
        setSnapLines({ vertical: vSnap, horizontal: hSnap });
      } else {
        // Logika 8 Titik Resize dengan pengaman ukuran minimum 4%
        const minSize = 4;
        if (mode.includes('e')) {
          nextW = Math.max(minSize, Math.min(100 - initial.x, initial.width + deltaXPct));
        }
        if (mode.includes('s')) {
          nextH = Math.max(minSize, Math.min(100 - initial.y, initial.height + deltaYPct));
        }
        if (mode.includes('w')) {
          const maxDeltaX = initial.width - minSize;
          const clampedDX = Math.max(-initial.x, Math.min(maxDeltaX, deltaXPct));
          nextX = initial.x + clampedDX;
          nextW = initial.width - clampedDX;
        }
        if (mode.includes('n')) {
          const maxDeltaY = initial.height - minSize;
          const clampedDY = Math.max(-initial.y, Math.min(maxDeltaY, deltaYPct));
          nextY = initial.y + clampedDY;
          nextH = initial.height - clampedDY;
        }
      }

      latestState = {
        x: Number(nextX.toFixed(2)),
        y: Number(nextY.toFixed(2)),
        width: Number(nextW.toFixed(2)),
        height: Number(nextH.toFixed(2)),
      };

      updateElementTransient(el.id, latestState);
    };

    const handlePointerUp = (upEvt: PointerEvent) => {
      try {
        targetDom.releasePointerCapture(upEvt.pointerId);
      } catch {
        // Abaikan jika pointer sudah dilepas
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setSnapLines({ vertical: false, horizontal: false });
      commitElementUpdate(el.id, latestState);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const getShadowClass = (shadow: CanvasElement['style']['shadow']) => {
    switch (shadow) {
      case 'sm':
        return 'shadow-sm';
      case 'md':
        return 'shadow-md';
      case 'lg':
        return 'shadow-lg shadow-black/40';
      case 'xl':
        return 'shadow-2xl shadow-black/60';
      case 'glow':
        return 'shadow-[0_0_25px_rgba(250,204,21,0.65)]';
      default:
        return '';
    }
  };

  const getHoverClass = (hover: CanvasElement['style']['hoverEffect']) => {
    if (isEditMode) return '';
    switch (hover) {
      case 'scale':
        return 'transition-transform duration-200 hover:scale-105 active:scale-95';
      case 'lift':
        return 'transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl';
      case 'pulse':
        return 'hover:animate-pulse';
      case 'glow':
        return 'transition-shadow duration-200 hover:shadow-[0_0_30px_rgba(250,204,21,0.85)]';
      default:
        return '';
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={() => isEditMode && setSelectedElementId(null)}
      className={`absolute inset-0 w-full h-full select-none overflow-hidden ${
        isEditMode ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Garis Bantu Grid & Snap Magnetik saat Mode Edit */}
      {isEditMode && snapEnabled && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {snapLines.vertical && (
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-yellow-400 shadow-[0_0_8px_#FACC15]" />
          )}
          {snapLines.horizontal && (
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-yellow-400 shadow-[0_0_8px_#FACC15]" />
          )}
        </div>
      )}

      {/* Render Seluruh Elemen Kanvas */}
      {activeSlide.elements
        .filter((el) => !el.hidden)
        .map((el) => {
          const isSelected = isEditMode && selectedElementId === el.id;

          return (
            <div
              key={el.id}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.width}%`,
                height: `${el.height}%`,
                zIndex: el.zIndex,
                opacity: (el.style.opacity ?? 100) / 100,
              }}
              onPointerDown={(e) => startPointerInteraction(e, el, 'move')}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditMode) {
                  setSelectedElementId(el.id);
                } else {
                  handleUserClickElement(el);
                }
              }}
              className={`absolute group pointer-events-auto ${
                isEditMode
                  ? el.locked
                    ? 'cursor-not-allowed'
                    : 'cursor-move'
                  : 'cursor-pointer'
              } ${getHoverClass(el.style.hoverEffect)}`}
            >
              {/* Floating Quick-Action Toolbar di Atas Elemen yang Dipilih */}
              {isSelected && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 border border-yellow-400/50 text-white px-2.5 py-1 rounded-lg shadow-xl z-50 whitespace-nowrap"
                >
                  <span className="text-[11px] font-semibold text-yellow-400 mr-1.5">
                    {el.name}
                  </span>
                  <button
                    type="button"
                    title="Naikkan Layer"
                    onClick={() => commitElementUpdate(el.id, { zIndex: el.zIndex + 1 })}
                    className="p-1 hover:bg-slate-700 rounded"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Turunkan Layer"
                    onClick={() =>
                      commitElementUpdate(el.id, { zIndex: Math.max(1, el.zIndex - 1) })
                    }
                    className="p-1 hover:bg-slate-700 rounded"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  {(el.audioUrl || el.action.audioUrl) && (
                    <button
                      type="button"
                      title="Tes Putar Suara"
                      onClick={() => playAudioUrl(el.audioUrl || el.action.audioUrl)}
                      className="p-1 text-emerald-400 hover:bg-slate-700 rounded"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Duplikat Elemen"
                    onClick={() => duplicateElement(el.id)}
                    className="p-1 hover:bg-slate-700 rounded"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Hapus Elemen"
                    onClick={() => deleteElement(el.id)}
                    className="p-1 text-rose-400 hover:bg-rose-950/60 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Kontainer Visual Utama Elemen */}
              <div
                style={{
                  backgroundColor: el.style.backgroundColor,
                  color: el.style.textColor,
                  borderRadius: `${el.style.borderRadius}px`,
                  borderWidth: `${el.style.borderWidth}px`,
                  borderColor: el.style.borderColor,
                  borderStyle: el.style.borderWidth > 0 ? 'solid' : 'none',
                  fontSize: `${el.style.fontSize}px`,
                  fontWeight: el.style.fontWeight,
                }}
                className={`w-full h-full flex flex-col items-center justify-center overflow-hidden relative transition-colors ${getShadowClass(
                  el.style.shadow
                )} ${
                  isSelected
                    ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-950'
                    : isEditMode
                    ? 'hover:ring-1 hover:ring-sky-400/70'
                    : ''
                }`}
              >
                {/* Tampilan Gambar untuk Image Button atau Image */}
                {(el.type === 'image-button' || el.type === 'image') && el.imageUrl && (
                  <img
                    src={el.imageUrl}
                    alt={el.label || el.name}
                    draggable={false}
                    style={{ objectFit: el.style.objectFit }}
                    className={`w-full ${
                      el.style.textPosition === 'bottom' || el.style.textPosition === 'top'
                        ? 'h-3/4'
                        : 'h-full'
                    } pointer-events-none select-none`}
                  />
                )}

                {/* Ikon Audio jika tipe Audio Button */}
                {el.type === 'audio-button' && (
                  <Volume2 className="w-7 h-7 mb-1 text-yellow-400 animate-pulse" />
                )}

                {/* Label Teks Tombol / Elemen */}
                {el.style.textPosition !== 'hidden' && el.label && (
                  <div
                    className={`px-3 py-1.5 text-center leading-tight break-words w-full flex items-center justify-center ${
                      el.style.textPosition === 'overlay'
                        ? 'absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]'
                        : 'h-auto'
                    }`}
                  >
                    <span>{el.label}</span>
                  </div>
                )}

                {/* Indikator Kunci Posisi di Mode Edit */}
                {isEditMode && el.locked && (
                  <div className="absolute top-1.5 right-1.5 bg-slate-900/80 p-1 rounded text-amber-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* 8 Titik Handle Resize (Hanya Tampil Saat Dipilih & Tidak Dikunci) */}
              {isSelected && !el.locked && (
                <>
                  {RESIZE_HANDLES.map((h) => (
                    <div
                      key={h.dir}
                      onPointerDown={(e) => startPointerInteraction(e, el, h.dir)}
                      className={`absolute w-3.5 h-3.5 bg-yellow-400 border-2 border-slate-950 rounded-full shadow-md z-50 hover:scale-125 transition-transform ${h.className}`}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}

      {/* Modal Pop-up Interaktif Saat Tombol Diklik Pengguna */}
      {activePopup && (
        <div
          onClick={() => setActivePopup(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-yellow-400/40 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-yellow-400">{activePopup.title}</h3>
              <button
                type="button"
                onClick={() => setActivePopup(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {activePopup.content}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePopup(null)}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};