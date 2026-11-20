import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { ContentSchema, CanvasElement } from '../../data/defaultContent';
import {
  getSmartSlideMeta,
  loadExactSlideStageData,
  playStudioSoundEffect,
  normalizeSmartEmbedUrl,
  type ExactSlideRuntimeData,
  type ExactStageObject,
} from '../../utils/slideExactMeta';
import type { StagePopupPreviewState } from './adminTypes';

export function renderPathsSvgNode(
  node: any,
  key: string | number,
  svgTextOverrides: Record<string, { commandSetId?: string; lines: string[] }>,
  activeCommandSetId?: string | null,
  lineCounter?: { index: number }
): React.ReactNode {
  if (!node || typeof node !== 'object') return null;
  const Tag = node.nodeType as string;
  if (!Tag) return null;

  const props: Record<string, any> = { key };
  for (const [k, v] of Object.entries(node)) {
    if (k === 'nodeType' || k === 'children' || k.startsWith('commandset-')) {
      continue;
    }
    if (k === 'xlink:href') {
      props.href = v;
    } else if (k === 'stroke-width') {
      props.strokeWidth = v;
    } else if (k === 'stroke-linecap') {
      props.strokeLinecap = v;
    } else if (k === 'stroke-linejoin') {
      props.strokeLinejoin = v;
    } else if (k === 'stroke-opacity') {
      props.strokeOpacity = v;
    } else if (k === 'fill-opacity') {
      props.fillOpacity = v;
    } else if (k === 'fill-rule') {
      props.fillRule = v;
    } else if (k === 'font-family') {
      props.fontFamily = "'Arial Rounded MT Bold', 'Nunito', sans-serif";
    } else if (k === 'font-size') {
      props.fontSize = v;
    } else if (k === 'stop-color') {
      props.stopColor = v;
    } else if (k === 'stop-opacity') {
      props.stopOpacity = v;
    } else if (k === 'flood-color') {
      props.floodColor = v;
    } else if (k === 'flood-opacity') {
      props.floodOpacity = v;
    } else if (Tag === 'tspan' && k === 'x' && typeof v === 'string') {
      props.x = v.trim().split(/\s+/)[0] || '0';
    } else if (typeof v === 'string' || typeof v === 'number') {
      props[k] = v;
    }
  }

  const children = Array.isArray(node.children)
    ? node.children.map((ch: any, idx: number) => {
        if (typeof ch === 'string') {
          if (
            Tag === 'tspan' &&
            activeCommandSetId &&
            svgTextOverrides[activeCommandSetId] &&
            lineCounter
          ) {
            const customLines = svgTextOverrides[activeCommandSetId].lines;
            const currentIdx = lineCounter.index;
            lineCounter.index += 1;
            if (typeof customLines[currentIdx] === 'string') {
              return customLines[currentIdx];
            }
          }
          return ch;
        }
        return renderPathsSvgNode(
          ch,
          idx,
          svgTextOverrides,
          activeCommandSetId,
          lineCounter
        );
      })
    : null;

  return React.createElement(Tag, props, children);
}

export interface ExactSlideStageCanvasProps {
  slideId: string;
  activeContent: ContentSchema;
  tur360Url: string;
  selectedCustomElId: string | null;
  selectedNativeObjId: string | null;
  previewPopup?: StagePopupPreviewState | null;
  onClosePreviewPopup?: () => void;
  onSelectCustomEl: (id: string | null) => void;
  onSelectNativeObj: (obj: ExactStageObject | null) => void;
  onLoadedObjects?: (objs: ExactStageObject[]) => void;
  onStartDragCustomEl: (
    e: React.PointerEvent<HTMLDivElement>,
    el: CanvasElement
  ) => void;
  onStartResizeCustomEl: (
    e: React.PointerEvent<HTMLDivElement>,
    el: CanvasElement
  ) => void;
  onStartDragNativeObj: (
    e: React.PointerEvent<HTMLDivElement>,
    obj: ExactStageObject,
    curXDeltaPct: number,
    curYDeltaPct: number
  ) => void;
  onStartResizeNativeObj?: (
    e: React.PointerEvent<HTMLDivElement>,
    obj: ExactStageObject,
    curWidthPct: number,
    curHeightPct: number
  ) => void;
  onHideNativeObj?: (objectId: string) => void;
  onDeleteCustomEl: (id: string) => void;
}

export const ExactSlideStageCanvas: React.FC<ExactSlideStageCanvasProps> =
  React.memo(
    ({
      slideId,
      activeContent,
      tur360Url,
      selectedCustomElId,
      selectedNativeObjId,
      previewPopup,
      onClosePreviewPopup,
      onSelectCustomEl,
      onSelectNativeObj,
      onLoadedObjects,
      onStartDragCustomEl,
      onStartResizeCustomEl,
      onStartDragNativeObj,
      onStartResizeNativeObj,
      onHideNativeObj,
      onDeleteCustomEl,
    }) => {
      const [runtimeSlide, setRuntimeSlide] =
        useState<ExactSlideRuntimeData | null>(null);
      const [loading, setLoading] = useState<boolean>(true);
      const [bgFailed, setBgFailed] = useState<boolean>(false);

      const slideData = activeContent.slides[slideId];
      const slideMeta = getSmartSlideMeta(slideId, slideData);

      useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setBgFailed(false);
        loadExactSlideStageData(slideId, slideData).then((res) => {
          if (!cancelled) {
            setRuntimeSlide(res);
            setLoading(false);
            if (onLoadedObjects) {
              onLoadedObjects(res?.objects || []);
            }
          }
        });
        return () => {
          cancelled = true;
        };
      }, [
        slideId,
        slideData?.webObjectUrl,
        slideData?.backgroundUrl,
        slideData?.copiedFromSlideId,
        slideData?.customCategory,
        onLoadedObjects,
      ]);

      const rawBgUrl =
        slideData?.backgroundUrl ||
        runtimeSlide?.backgroundUrl ||
        slideMeta.backgroundUrl;
      const effectiveBgUrl = bgFailed
        ? 'mobile/Slide5znCNCeGBCx.jpg'
        : rawBgUrl;

      const customElements = slideData?.canvasElements || [];
      const elementOverrides = slideData?.elementOverrides || {};
      const hiddenElementIds = slideData?.hiddenElementIds || [];

      return (
        <div
          onClick={() => {
            onSelectCustomEl(null);
            onSelectNativeObj(null);
          }}
          className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-sm border border-[#E2E8F0] bg-slate-100 select-none"
        >
          {/* 1. EXACT SLIDE BACKGROUND (1280x720) */}
          {effectiveBgUrl && (
            <img
              src={effectiveBgUrl}
              alt={slideMeta.smartTitle}
              onError={() => {
                if (!bgFailed) setBgFailed(true);
              }}
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              draggable={false}
            />
          )}

          {/* 2. EXACT NATIVE STORYLINE OBJECTS AT 100% PUBLIC COORDINATES */}
          {runtimeSlide &&
            runtimeSlide.objects.map((obj) => {
              const override = elementOverrides[obj.id];
              if (override?.hidden || hiddenElementIds.includes(obj.id)) {
                return null;
              }

              const xDeltaPct = override?.xDeltaPct || 0;
              const yDeltaPct = override?.yDeltaPct || 0;
              const leftPct = (obj.xPos / 1280) * 100 + xDeltaPct;
              const topPct = (obj.yPos / 720) * 100 + yDeltaPct;
              const widthPct = override?.widthPct ?? (obj.width / 1280) * 100;
              const heightPct = override?.heightPct ?? (obj.height / 720) * 100;

              const shapeNode = obj.shapeCommandSetId
                ? runtimeSlide.pathsLib[obj.shapeCommandSetId]
                : null;
              const textNode = obj.textCommandSetId
                ? runtimeSlide.pathsLib[obj.textCommandSetId]
                : null;

              const resolvedImgUrl = override?.customImage || obj.imageUrl;
              const hasCustomReplacementImg = Boolean(override?.customImage);

              const isFullScreenBackdrop =
                (obj.width >= 1250 && obj.height >= 700) ||
                obj.kind === 'webobject' ||
                obj.kind === 'video';
              const isNativeSelected = selectedNativeObjId === obj.id;
              const hasCustomTrigger =
                override?.actionType && override.actionType !== 'default';

              return (
                <div
                  key={obj.id}
                  data-native-obj-id={obj.id}
                  onPointerDown={
                    !isFullScreenBackdrop
                      ? (e) =>
                          onStartDragNativeObj(e, obj, xDeltaPct, yDeltaPct)
                      : undefined
                  }
                  onMouseEnter={
                    !isFullScreenBackdrop && override?.hoverSfxUrl
                      ? () => playStudioSoundEffect(override.hoverSfxUrl, 0.45)
                      : undefined
                  }
                  onClick={
                    !isFullScreenBackdrop
                      ? (e) => {
                          e.stopPropagation();
                          if (override?.clickSfxUrl) {
                            playStudioSoundEffect(override.clickSfxUrl, 0.85);
                          }
                          onSelectCustomEl(null);
                          onSelectNativeObj(obj);
                        }
                      : undefined
                  }
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    zIndex: isNativeSelected ? 55 : obj.depth + 2,
                  }}
                  className={`absolute ${
                    isFullScreenBackdrop
                      ? 'pointer-events-none'
                      : `pointer-events-auto cursor-move transition-all duration-150 ${
                          override?.hoverEffect !== 'none'
                            ? 'hover:scale-[1.03] hover:brightness-105'
                            : ''
                        } ${
                          isNativeSelected
                            ? 'ring-2 ring-[#2F80ED] outline outline-2 outline-blue-600 rounded-md'
                            : hasCustomTrigger
                            ? 'ring-1 ring-emerald-400/80 hover:ring-2 hover:ring-emerald-500 rounded-md'
                            : 'hover:ring-2 hover:ring-blue-400/70 rounded-md'
                        }`
                  }`}
                >
                  {obj.kind === 'video' && obj.videoUrl && (
                    <video
                      src={obj.videoUrl}
                      poster={obj.posterUrl || undefined}
                      controls
                      playsInline
                      className="w-full h-full object-cover pointer-events-auto rounded-none"
                    />
                  )}

                  {obj.kind === 'webobject' && (
                    <iframe
                      key={`webobj-${slideId}-${normalizeSmartEmbedUrl(
                        slideData?.webObjectUrl || obj.webUrl || tur360Url
                      )}`}
                      src={normalizeSmartEmbedUrl(
                        slideData?.webObjectUrl ||
                          obj.webUrl ||
                          tur360Url ||
                          'https://faryzt.github.io/starla-360/'
                      )}
                      title="360 Budaya Embed"
                      className="w-full h-full border-0 pointer-events-auto"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; vr; xr-spatial-tracking"
                    />
                  )}

                  {!hasCustomReplacementImg &&
                    (shapeNode || textNode) &&
                    obj.width > 0 &&
                    obj.height > 0 && (
                      <svg
                        viewBox={`0 0 ${obj.width} ${obj.height}`}
                        preserveAspectRatio="none"
                        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
                      >
                        {shapeNode &&
                          renderPathsSvgNode(
                            shapeNode,
                            `shape_${obj.id}`,
                            activeContent.svgTextCommandSets
                          )}
                        {textNode &&
                          renderPathsSvgNode(
                            textNode,
                            `text_${obj.id}`,
                            activeContent.svgTextCommandSets,
                            obj.textCommandSetId,
                            { index: 0 }
                          )}
                      </svg>
                    )}

                  {resolvedImgUrl && (
                    <img
                      src={resolvedImgUrl}
                      alt={obj.altText || obj.id}
                      className={`w-full h-full ${
                        hasCustomReplacementImg
                          ? 'object-contain'
                          : 'object-fill'
                      } pointer-events-none select-none`}
                      draggable={false}
                    />
                  )}

                  {obj.kind === 'textinput' && (
                    <div className="w-full h-full rounded-lg border-2 border-amber-400/80 bg-white/90 px-3 flex items-center text-xs font-bold text-slate-600 shadow-inner pointer-events-none">
                      {obj.id === '5pmNQLIknke'
                        ? 'Ketik nama kamu...'
                        : 'Ketik sekolah kamu...'}
                    </div>
                  )}

                  {isNativeSelected && !isFullScreenBackdrop && (
                    <>
                      {onHideNativeObj && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            onHideNativeObj(obj.id);
                          }}
                          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 cursor-pointer z-30"
                          title="Hapus / Sembunyikan Tombol"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onStartResizeNativeObj && (
                        <div
                          onPointerDown={(e) =>
                            onStartResizeNativeObj(e, obj, widthPct, heightPct)
                          }
                          className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-[#2F80ED] border-2 border-white shadow-md cursor-nwse-resize z-30"
                          title="Tarik untuk mengubah ukuran tombol"
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}

          {/* Universal Slide Embed Support */}
          {slideData?.webObjectUrl &&
            !runtimeSlide?.objects.some((o) => o.kind === 'webobject') && (
              <iframe
                key={`univ-embed-${slideId}-${normalizeSmartEmbedUrl(
                  slideData.webObjectUrl
                )}`}
                src={normalizeSmartEmbedUrl(slideData.webObjectUrl)}
                title={slideMeta.smartTitle || 'Interactive Web / 360 Embed'}
                className="absolute inset-0 w-full h-full border-0 pointer-events-auto z-[5]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; vr; xr-spatial-tracking"
              />
            )}

          {/* Fallback for newly created custom Materi slides */}
          {!loading &&
            (!runtimeSlide || runtimeSlide.objects.length === 0) &&
            slideData &&
            slideMeta.category !== 'tur360' &&
            !slideData.webObjectUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                <div className="max-w-2xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] rounded-2xl p-6 shadow-lg text-slate-800">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#E3EEFF] text-[#2F80ED] text-xs font-extrabold uppercase tracking-wider mb-3">
                    {slideMeta.subTopic}
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-3">
                    {slideMeta.smartTitle}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {slideMeta.smartSummary}
                  </p>
                </div>
              </div>
            )}

          {/* 3. CUSTOM INTERACTIVE CANVAS ELEMENTS ADDED BY ADMIN */}
          {customElements.map((el) => {
            const isSelected = selectedCustomElId === el.id;
            const isPureImageButton = Boolean(el.imageUrl);
            return (
              <div
                key={el.id}
                data-custom-el-id={el.id}
                onPointerDown={(e) => onStartDragCustomEl(e, el)}
                onMouseEnter={() => {
                  if (el.hoverSfxUrl) {
                    playStudioSoundEffect(el.hoverSfxUrl, 0.45);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (el.clickSfxUrl) {
                    playStudioSoundEffect(el.clickSfxUrl, 0.85);
                  }
                  onSelectNativeObj(null);
                  onSelectCustomEl(el.id);
                }}
                style={{
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width}%`,
                  height: `${el.height}%`,
                  backgroundColor: isPureImageButton
                    ? 'transparent'
                    : el.style?.backgroundColor || '#2563EB',
                  color: el.style?.textColor || '#FFFFFF',
                  borderRadius: isPureImageButton
                    ? '0px'
                    : `${el.style?.borderRadius ?? 12}px`,
                  fontSize: `${el.style?.fontSize ?? 14}px`,
                  zIndex: 60,
                }}
                className={`absolute flex items-center justify-center ${
                  isPureImageButton ? 'p-0' : 'px-3 py-1.5 shadow-lg gap-2'
                } font-bold cursor-move transition-all duration-150 ${
                  el.style?.hoverEffect !== 'none'
                    ? 'hover:scale-105 hover:brightness-110'
                    : ''
                } ${
                  isSelected
                    ? 'ring-2 ring-[#2F80ED] outline outline-2 outline-blue-600 rounded-md'
                    : 'hover:ring-2 hover:ring-blue-400/80 rounded-md'
                }`}
              >
                {isPureImageButton ? (
                  <img
                    src={el.imageUrl}
                    alt={el.label || 'Tombol Gambar'}
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                ) : (
                  <span className="truncate pointer-events-none">
                    {el.label}
                  </span>
                )}
                {isSelected && (
                  <>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomEl(el.id);
                      }}
                      className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 cursor-pointer z-20"
                      title="Hapus Tombol"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div
                      onPointerDown={(e) => onStartResizeCustomEl(e, el)}
                      className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md cursor-nwse-resize z-20"
                      title="Tarik untuk mengubah ukuran tombol"
                    />
                  </>
                )}
              </div>
            );
          })}

          {/* 4. ANIMATED STATE POPUP PREVIEW OVERLAY INSIDE STAGE */}
          {previewPopup && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onClosePreviewPopup?.();
              }}
              className="absolute inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-5"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full max-w-xl max-h-[90%] flex flex-col rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden transition-all duration-300 ${
                  previewPopup.animation === 'bounce'
                    ? 'animate-bounce'
                    : 'scale-100 opacity-100'
                }`}
              >
                <div className="px-4 py-3 bg-[#2F80ED] text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-white" />
                    <h4 className="text-sm font-extrabold truncate">
                      {previewPopup.title || 'State Popup Interaktif'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onClosePreviewPopup?.()}
                    className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold cursor-pointer"
                  >
                    ✕ Tutup Popup
                  </button>
                </div>
                <div className="p-4 overflow-y-auto space-y-3 text-slate-800">
                  {previewPopup.mediaUrl && (
                    <div className="w-full rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-50">
                      {previewPopup.mediaType === 'image' ? (
                        <img
                          src={previewPopup.mediaUrl}
                          alt={previewPopup.title}
                          className="w-full max-h-60 object-contain mx-auto"
                        />
                      ) : previewPopup.mediaType === 'video' ? (
                        <video
                          src={previewPopup.mediaUrl}
                          controls
                          autoPlay
                          className="w-full max-h-60 object-contain"
                        />
                      ) : previewPopup.mediaType === 'audio' ? (
                        <div className="p-4 bg-slate-100 flex flex-col items-center gap-2">
                          <audio
                            src={previewPopup.mediaUrl}
                            controls
                            autoPlay
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-video">
                          <iframe
                            src={previewPopup.mediaUrl}
                            title={previewPopup.title}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {previewPopup.content && (
                    <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                      {previewPopup.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  );

ExactSlideStageCanvas.displayName = 'ExactSlideStageCanvas';

export default ExactSlideStageCanvas;
