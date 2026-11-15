import {
  ContentSchema,
  SlideContentItem,
  ElementOverrideConfig,
  CanvasElementItem,
  CanvasElementType,
} from '../../data/defaultContent';

export type ResizeHandleDirection =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

export const RESIZE_HANDLES: ResizeHandleDirection[] = [
  'nw',
  'n',
  'ne',
  'e',
  'se',
  's',
  'sw',
  'w',
];

export interface RectPct {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function computeMoveRectPct(
  initialRect: RectPct,
  deltaXPct: number,
  deltaYPct: number,
  snapStepPct = 0
): RectPct {
  const maxX = Math.max(0, 100 - initialRect.width);
  const maxY = Math.max(0, 100 - initialRect.height);
  let nextX = clampPct(initialRect.x + deltaXPct, 0, maxX);
  let nextY = clampPct(initialRect.y + deltaYPct, 0, maxY);
  if (snapStepPct > 0) {
    nextX = clampPct(Math.round(nextX / snapStepPct) * snapStepPct, 0, maxX);
    nextY = clampPct(Math.round(nextY / snapStepPct) * snapStepPct, 0, maxY);
  }
  return {
    x: roundPct(nextX),
    y: roundPct(nextY),
    width: initialRect.width,
    height: initialRect.height,
  };
}

export function computeResizeRectPct(
  initialRect: RectPct,
  dir: ResizeHandleDirection,
  deltaXPct: number,
  deltaYPct: number,
  minW = 4,
  minH = 4,
  snapStepPct = 0
): RectPct {
  let x = initialRect.x;
  let y = initialRect.y;
  let width = initialRect.width;
  let height = initialRect.height;

  if (dir.includes('e')) {
    width = clampPct(initialRect.width + deltaXPct, minW, 100 - initialRect.x);
  } else if (dir.includes('w')) {
    const rightEdge = initialRect.x + initialRect.width;
    x = clampPct(initialRect.x + deltaXPct, 0, rightEdge - minW);
    width = roundPct(rightEdge - x);
  }

  if (dir.includes('s')) {
    height = clampPct(initialRect.height + deltaYPct, minH, 100 - initialRect.y);
  } else if (dir.includes('n')) {
    const bottomEdge = initialRect.y + initialRect.height;
    y = clampPct(initialRect.y + deltaYPct, 0, bottomEdge - minH);
    height = roundPct(bottomEdge - y);
  }

  if (snapStepPct > 0) {
    width = clampPct(Math.round(width / snapStepPct) * snapStepPct, minW, 100 - x);
    height = clampPct(Math.round(height / snapStepPct) * snapStepPct, minH, 100 - y);
  }

  return {
    x: roundPct(x),
    y: roundPct(y),
    width: roundPct(width),
    height: roundPct(height),
  };
}

export const SNAP_CENTER_PCT = 50;
export const SNAP_THRESHOLD_PCT = 1.2;
export const MIN_ELEMENT_SIZE_PCT = 1;

export function roundPct(val: number): number {
  return Math.round(val * 100) / 100;
}

export function clampPct(val: number, min = 0, max = 100): number {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, roundPct(val)));
}

export interface SnapResult {
  x: number;
  y: number;
  snapX: number | null;
  snapY: number | null;
}

/**
 * Menghitung posisi baru dalam persentase (0-100) saat elemen digeser (drag)
 * menggunakan delta piksel dari `PointerEvent` dan `getBoundingClientRect()` container,
 * lengkap dengan deteksi garis bantu tengah (snap guide di 50%).
 */
export function computeDragPositionPct(params: {
  startX: number;
  startY: number;
  width: number;
  height: number;
  deltaXPx: number;
  deltaYPx: number;
  containerWidthPx: number;
  containerHeightPx: number;
  enableSnap?: boolean;
}): SnapResult {
  const {
    startX,
    startY,
    width,
    height,
    deltaXPx,
    deltaYPx,
    containerWidthPx,
    containerHeightPx,
    enableSnap = true,
  } = params;

  const safeWidthPx = containerWidthPx > 0 ? containerWidthPx : 1;
  const safeHeightPx = containerHeightPx > 0 ? containerHeightPx : 1;

  const dxPct = (deltaXPx / safeWidthPx) * 100;
  const dyPct = (deltaYPx / safeHeightPx) * 100;

  const maxX = Math.max(0, 100 - width);
  const maxY = Math.max(0, 100 - height);

  let nextX = clampPct(startX + dxPct, 0, maxX);
  let nextY = clampPct(startY + dyPct, 0, maxY);
  let snapX: number | null = null;
  let snapY: number | null = null;

  if (enableSnap) {
    const centerX = nextX + width / 2;
    if (Math.abs(centerX - SNAP_CENTER_PCT) <= SNAP_THRESHOLD_PCT) {
      nextX = clampPct(SNAP_CENTER_PCT - width / 2, 0, maxX);
      snapX = SNAP_CENTER_PCT;
    } else if (Math.abs(nextX - SNAP_CENTER_PCT) <= SNAP_THRESHOLD_PCT) {
      nextX = clampPct(SNAP_CENTER_PCT, 0, maxX);
      snapX = SNAP_CENTER_PCT;
    }

    const centerY = nextY + height / 2;
    if (Math.abs(centerY - SNAP_CENTER_PCT) <= SNAP_THRESHOLD_PCT) {
      nextY = clampPct(SNAP_CENTER_PCT - height / 2, 0, maxY);
      snapY = SNAP_CENTER_PCT;
    } else if (Math.abs(nextY - SNAP_CENTER_PCT) <= SNAP_THRESHOLD_PCT) {
      nextY = clampPct(SNAP_CENTER_PCT, 0, maxY);
      snapY = SNAP_CENTER_PCT;
    }
  }

  return {
    x: roundPct(nextX),
    y: roundPct(nextY),
    snapX,
    snapY,
  };
}

/**
 * Menghitung posisi dan ukuran baru dalam persentase (0-100) saat salah satu dari
 * 8 titik handle resize ditarik.
 */
export function computeResizeBoundsPct(params: {
  handle: ResizeHandleDirection;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  deltaXPx: number;
  deltaYPx: number;
  containerWidthPx: number;
  containerHeightPx: number;
}): {
  x: number;
  y: number;
  width: number;
  height: number;
  snapX: number | null;
  snapY: number | null;
} {
  const {
    handle,
    startX,
    startY,
    startWidth,
    startHeight,
    deltaXPx,
    deltaYPx,
    containerWidthPx,
    containerHeightPx,
  } = params;

  const safeWidthPx = containerWidthPx > 0 ? containerWidthPx : 1;
  const safeHeightPx = containerHeightPx > 0 ? containerHeightPx : 1;

  const dxPct = (deltaXPx / safeWidthPx) * 100;
  const dyPct = (deltaYPx / safeHeightPx) * 100;

  let x = startX;
  let y = startY;
  let width = startWidth;
  let height = startHeight;

  // Horizontal resize
  if (handle.includes('e')) {
    width = clampPct(startWidth + dxPct, MIN_ELEMENT_SIZE_PCT, 100 - startX);
  } else if (handle.includes('w')) {
    const rightEdge = startX + startWidth;
    const proposedX = clampPct(
      startX + dxPct,
      0,
      rightEdge - MIN_ELEMENT_SIZE_PCT
    );
    x = proposedX;
    width = roundPct(rightEdge - proposedX);
  }

  // Vertical resize
  if (handle.includes('s')) {
    height = clampPct(startHeight + dyPct, MIN_ELEMENT_SIZE_PCT, 100 - startY);
  } else if (handle.includes('n')) {
    const bottomEdge = startY + startHeight;
    const proposedY = clampPct(
      startY + dyPct,
      0,
      bottomEdge - MIN_ELEMENT_SIZE_PCT
    );
    y = proposedY;
    height = roundPct(bottomEdge - proposedY);
  }

  let snapX: number | null = null;
  let snapY: number | null = null;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  if (Math.abs(centerX - SNAP_CENTER_PCT) <= SNAP_THRESHOLD_PCT) {
    snapX = SNAP_CENTER_PCT;
  }
  if (Math.abs(centerY - SNAP_CENTER_PCT) <= SNAP_THRESHOLD_PCT) {
    snapY = SNAP_CENTER_PCT;
  }

  return {
    x: roundPct(x),
    y: roundPct(y),
    width: roundPct(width),
    height: roundPct(height),
    snapX,
    snapY,
  };
}

export type PointerInteractionMode =
  | 'move'
  | 'resize-se'
  | `resize-${ResizeHandleDirection}`;

/**
 * Logika Inti Pointer Drag & Resize Berbasis Persentase (60 FPS):
 * Mengonversi pergerakan piksel mouse (`clientX - startMouseX`, `clientY - startMouseY`)
 * menjadi koordinat persentase terhadap lebar/tinggi kanvas (`stageRect.width`, `stageRect.height`).
 */
export function computePointerMoveResizePct(params: {
  mode: PointerInteractionMode;
  startElem: Pick<CanvasElementItem, 'x' | 'y' | 'width' | 'height'>;
  startMouseX: number;
  startMouseY: number;
  clientX: number;
  clientY: number;
  stageWidth: number;
  stageHeight: number;
  enableSnap?: boolean;
  minSizePct?: number;
}): {
  x: number;
  y: number;
  width: number;
  height: number;
  snapX: number | null;
  snapY: number | null;
} {
  const {
    mode,
    startElem,
    startMouseX,
    startMouseY,
    clientX,
    clientY,
    stageWidth,
    stageHeight,
    enableSnap = false,
    minSizePct = 4,
  } = params;

  const safeWidth = stageWidth > 0 ? stageWidth : 1;
  const safeHeight = stageHeight > 0 ? stageHeight : 1;
  const deltaXPx = clientX - startMouseX;
  const deltaYPx = clientY - startMouseY;
  const deltaXPct = (deltaXPx / safeWidth) * 100;
  const deltaYPct = (deltaYPx / safeHeight) * 100;

  if (mode === 'move') {
    if (enableSnap) {
      const snapped = computeDragPositionPct({
        startX: startElem.x,
        startY: startElem.y,
        width: startElem.width,
        height: startElem.height,
        deltaXPx,
        deltaYPx,
        containerWidthPx: safeWidth,
        containerHeightPx: safeHeight,
        enableSnap: true,
      });
      return {
        x: Number(snapped.x.toFixed(2)),
        y: Number(snapped.y.toFixed(2)),
        width: Number(startElem.width.toFixed(2)),
        height: Number(startElem.height.toFixed(2)),
        snapX: snapped.snapX,
        snapY: snapped.snapY,
      };
    }

    const nextX = Math.max(
      0,
      Math.min(100 - startElem.width, startElem.x + deltaXPct)
    );
    const nextY = Math.max(
      0,
      Math.min(100 - startElem.height, startElem.y + deltaYPct)
    );
    return {
      x: Number(nextX.toFixed(2)),
      y: Number(nextY.toFixed(2)),
      width: Number(startElem.width.toFixed(2)),
      height: Number(startElem.height.toFixed(2)),
      snapX: null,
      snapY: null,
    };
  }

  if (mode === 'resize-se' && !enableSnap) {
    const nextW = Math.max(
      minSizePct,
      Math.min(100 - startElem.x, startElem.width + deltaXPct)
    );
    const nextH = Math.max(
      minSizePct,
      Math.min(100 - startElem.y, startElem.height + deltaYPct)
    );
    return {
      x: Number(startElem.x.toFixed(2)),
      y: Number(startElem.y.toFixed(2)),
      width: Number(nextW.toFixed(2)),
      height: Number(nextH.toFixed(2)),
      snapX: null,
      snapY: null,
    };
  }

  const handle = mode.replace('resize-', '') as ResizeHandleDirection;
  const resized = computeResizeBoundsPct({
    handle,
    startX: startElem.x,
    startY: startElem.y,
    startWidth: startElem.width,
    startHeight: startElem.height,
    deltaXPx,
    deltaYPx,
    containerWidthPx: safeWidth,
    containerHeightPx: safeHeight,
  });

  const clampedW =
    handle === 'se'
      ? Math.max(
          minSizePct,
          Math.min(100 - startElem.x, startElem.width + deltaXPct)
        )
      : resized.width;
  const clampedH =
    handle === 'se'
      ? Math.max(
          minSizePct,
          Math.min(100 - startElem.y, startElem.height + deltaYPct)
        )
      : resized.height;

  return {
    x: Number(resized.x.toFixed(2)),
    y: Number(resized.y.toFixed(2)),
    width: Number(clampedW.toFixed(2)),
    height: Number(clampedH.toFixed(2)),
    snapX: enableSnap ? resized.snapX : null,
    snapY: enableSnap ? resized.snapY : null,
  };
}

/**
 * Memastikan objek slide memiliki struktur default untuk `elementOverrides`, `hiddenElementIds`, dan `canvasElements`.
 */
export function ensureSlideCanvasFields(
  slide: SlideContentItem
): Required<
  Pick<
    SlideContentItem,
    'elementOverrides' | 'hiddenElementIds' | 'canvasElements'
  >
> {
  return {
    elementOverrides: slide.elementOverrides
      ? { ...slide.elementOverrides }
      : {},
    hiddenElementIds: Array.isArray(slide.hiddenElementIds)
      ? [...slide.hiddenElementIds]
      : [],
    canvasElements: Array.isArray(slide.canvasElements)
      ? [...slide.canvasElements]
      : [],
  };
}

/**
 * Memperbarui `elementOverrides[elementId]` pada slide tertentu tanpa merusak komponen asli.
 */
export function applyElementOverridePatch(
  schema: ContentSchema,
  slideId: string,
  elementId: string,
  patch: Partial<ElementOverrideConfig>
): ContentSchema {
  const slide = schema.slides[slideId];
  if (!slide || !elementId) return schema;

  const { elementOverrides, hiddenElementIds, canvasElements } =
    ensureSlideCanvasFields(slide);
  const prevOverride: ElementOverrideConfig = elementOverrides[elementId] ?? {
    xDeltaPct: 0,
    yDeltaPct: 0,
  };

  const nextOverride: ElementOverrideConfig = {
    ...prevOverride,
    ...patch,
    xDeltaPct:
      patch.xDeltaPct !== undefined
        ? roundPct(patch.xDeltaPct)
        : prevOverride.xDeltaPct,
    yDeltaPct:
      patch.yDeltaPct !== undefined
        ? roundPct(patch.yDeltaPct)
        : prevOverride.yDeltaPct,
  };

  elementOverrides[elementId] = nextOverride;

  let nextHiddenIds = hiddenElementIds;
  if (patch.hidden === true && !nextHiddenIds.includes(elementId)) {
    nextHiddenIds = [...nextHiddenIds, elementId];
  } else if (patch.hidden === false) {
    nextHiddenIds = nextHiddenIds.filter((id) => id !== elementId);
  }

  return {
    ...schema,
    slides: {
      ...schema.slides,
      [slideId]: {
        ...slide,
        elementOverrides,
        hiddenElementIds: nextHiddenIds,
        canvasElements,
      },
    },
  };
}

/**
 * Non-Destructive Delete untuk elemen asli slide: menandai `hiddenElementIds` dan `elementOverrides[elementId].hidden = true`.
 */
export function applyHideNativeElement(
  schema: ContentSchema,
  slideId: string,
  elementId: string
): ContentSchema {
  return applyElementOverridePatch(schema, slideId, elementId, {
    hidden: true,
  });
}

/**
 * Mengembalikan (Restore) elemen asli slide yang sebelumnya disembunyikan dari panel Layer.
 */
export function applyRestoreNativeElement(
  schema: ContentSchema,
  slideId: string,
  elementId: string
): ContentSchema {
  return applyElementOverridePatch(schema, slideId, elementId, {
    hidden: false,
  });
}

/**
 * Membuat template awal `CanvasElementItem` berdasarkan tipe elemen baru yang dipilih admin.
 */
export function createDefaultCanvasElement(
  type: CanvasElementType,
  existingCount = 0,
  customPatch?: Partial<CanvasElementItem>
): CanvasElementItem {
  const offset = (existingCount % 5) * 3;
  const id =
    customPatch?.id ||
    `ce_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const audioButtonDefault: CanvasElementItem = {
    id,
    type,
    x: clampPct(40 + offset, 0, 85),
    y: clampPct(42 + offset, 0, 85),
    width: 18,
    height: 11,
    zIndex: 42 + existingCount,
    label: 'Putar Narasi',
    imageUrl: '',
    audioUrl: 'story_content/6DeuLJzk41Q_44100_56_0.mp3',
    style: {
      backgroundColor: '#0F172A',
      textColor: '#FBBF24',
      borderRadius: 999,
      fontSize: 13,
      shadow: 'glow',
      hoverEffect: 'pulse',
      objectFit: 'contain',
    },
    action: {
      type: 'play-audio',
    },
  };

  const defaultsByType: Record<CanvasElementType, CanvasElementItem> = {
    'image-button': {
      id,
      type: 'image-button',
      x: clampPct(36 + offset, 0, 80),
      y: clampPct(38 + offset, 0, 80),
      width: 24,
      height: 12,
      zIndex: 40 + existingCount,
      label: 'Tombol Eksplorasi Baru',
      imageUrl: 'mobile/5fD3uOAkxBz.png',
      audioUrl: '',
      style: {
        backgroundColor: '#D97706',
        textColor: '#FFFFFF',
        borderRadius: 10,
        fontSize: 14,
        shadow: 'md',
        hoverEffect: 'scale',
        objectFit: 'contain',
      },
      action: {
        type: 'open-popup',
        popupTitle: 'Informasi Budaya Nusantara',
        popupBody:
          'Mari mengenal keunikan budaya daerah dan mengamalkan nilai Bhinneka Tunggal Ika.',
        popupContent:
          'Mari mengenal keunikan budaya daerah dan mengamalkan nilai Bhinneka Tunggal Ika.',
      },
    },
    text: {
      id,
      type: 'text',
      x: clampPct(25 + offset, 0, 70),
      y: clampPct(22 + offset, 0, 80),
      width: 46,
      height: 14,
      zIndex: 40 + existingCount,
      label: 'Teks Judul atau Penjelasan Baru',
      imageUrl: '',
      audioUrl: '',
      style: {
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        textColor: '#F8FAFC',
        borderRadius: 8,
        fontSize: 16,
        shadow: 'md',
        hoverEffect: 'none',
      },
      action: {
        type: 'none',
      },
    },
    image: {
      id,
      type: 'image',
      x: clampPct(34 + offset, 0, 75),
      y: clampPct(26 + offset, 0, 70),
      width: 26,
      height: 32,
      zIndex: 38 + existingCount,
      label: 'Ilustrasi Budaya',
      imageUrl: 'mobile/6EfvCxuLoY5.png',
      audioUrl: '',
      style: {
        backgroundColor: 'transparent',
        textColor: '#FFFFFF',
        borderRadius: 8,
        fontSize: 14,
        shadow: 'none',
        hoverEffect: 'none',
        objectFit: 'contain',
      },
      action: {
        type: 'none',
      },
    },
    'audio-button': {
      ...audioButtonDefault,
      type: 'audio-button',
    },
    'audio-hotspot': {
      ...audioButtonDefault,
      type: 'audio-hotspot',
    },
  };

  const base = defaultsByType[type];
  return {
    ...base,
    ...customPatch,
    id,
    x: clampPct(customPatch?.x ?? base.x, 0, 100),
    y: clampPct(customPatch?.y ?? base.y, 0, 100),
    width: clampPct(customPatch?.width ?? base.width, MIN_ELEMENT_SIZE_PCT, 100),
    height: clampPct(
      customPatch?.height ?? base.height,
      MIN_ELEMENT_SIZE_PCT,
      100
    ),
    style: {
      ...base.style,
      ...(customPatch?.style || {}),
    },
    action: {
      ...base.action,
      ...(customPatch?.action || {}),
    },
    animation: customPatch?.animation ?? {
      type: 'none',
      delay: 0,
      duration: 0.6,
    },
  };
}

/**
 * Menambahkan elemen kanvas baru ke dalam `slide.canvasElements`.
 */
export function applyAddCanvasElement(
  schema: ContentSchema,
  slideId: string,
  elementInput: Partial<CanvasElementItem> & { type: CanvasElementType }
): { nextSchema: ContentSchema; createdElement: CanvasElementItem } {
  const slide = schema.slides[slideId];
  const existingElements = slide?.canvasElements || [];
  const createdElement = createDefaultCanvasElement(
    elementInput.type,
    existingElements.length,
    elementInput
  );

  if (!slide) {
    return { nextSchema: schema, createdElement };
  }

  const { elementOverrides, hiddenElementIds, canvasElements } =
    ensureSlideCanvasFields(slide);

  const nextSchema: ContentSchema = {
    ...schema,
    slides: {
      ...schema.slides,
      [slideId]: {
        ...slide,
        elementOverrides,
        hiddenElementIds,
        canvasElements: [...canvasElements, createdElement],
      },
    },
  };

  return { nextSchema, createdElement };
}

/**
 * Memperbarui properti elemen kanvas pada `slide.canvasElements`.
 */
export function applyUpdateCanvasElement(
  schema: ContentSchema,
  slideId: string,
  elementId: string,
  patch: Partial<CanvasElementItem>
): ContentSchema {
  const slide = schema.slides[slideId];
  if (!slide || !Array.isArray(slide.canvasElements)) return schema;

  const nextCanvasElements = slide.canvasElements.map((item) => {
    if (item.id !== elementId) return item;
    return {
      ...item,
      ...patch,
      x: patch.x !== undefined ? clampPct(patch.x, 0, 100) : item.x,
      y: patch.y !== undefined ? clampPct(patch.y, 0, 100) : item.y,
      width:
        patch.width !== undefined
          ? clampPct(patch.width, MIN_ELEMENT_SIZE_PCT, 100)
          : item.width,
      height:
        patch.height !== undefined
          ? clampPct(patch.height, MIN_ELEMENT_SIZE_PCT, 100)
          : item.height,
      style: patch.style ? { ...item.style, ...patch.style } : item.style,
      action: patch.action ? { ...item.action, ...patch.action } : item.action,
      animation: patch.animation
        ? { ...(item.animation || { type: 'none', delay: 0, duration: 0.6 }), ...patch.animation }
        : item.animation,
    };
  });

  return {
    ...schema,
    slides: {
      ...schema.slides,
      [slideId]: {
        ...slide,
        canvasElements: nextCanvasElements,
      },
    },
  };
}

/**
 * Menghapus permanen elemen tambahan (`canvasElements`) dari array slide.
 */
export function applyDeleteCanvasElement(
  schema: ContentSchema,
  slideId: string,
  elementId: string
): ContentSchema {
  const slide = schema.slides[slideId];
  if (!slide || !Array.isArray(slide.canvasElements)) return schema;

  return {
    ...schema,
    slides: {
      ...schema.slides,
      [slideId]: {
        ...slide,
        canvasElements: slide.canvasElements.filter(
          (item) => item.id !== elementId
        ),
      },
    },
  };
}

/**
 * Menduplikasi elemen kanvas yang ada dengan sedikit pergeseran persentase (`+3%`) agar mudah terlihat.
 */
export function applyDuplicateCanvasElement(
  schema: ContentSchema,
  slideId: string,
  elementId: string
): { nextSchema: ContentSchema; duplicatedElement: CanvasElementItem | null } {
  const slide = schema.slides[slideId];
  if (!slide || !Array.isArray(slide.canvasElements)) {
    return { nextSchema: schema, duplicatedElement: null };
  }

  const source = slide.canvasElements.find((item) => item.id === elementId);
  if (!source) {
    return { nextSchema: schema, duplicatedElement: null };
  }

  const newId = `ce_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const duplicatedElement: CanvasElementItem = {
    ...source,
    id: newId,
    label: source.label ? `${source.label} (Salinan)` : 'Salinan Elemen',
    x: clampPct(source.x + 3, 0, Math.max(0, 100 - source.width)),
    y: clampPct(source.y + 3, 0, Math.max(0, 100 - source.height)),
    zIndex: source.zIndex + 1,
    style: { ...source.style },
    action: { ...source.action },
  };

  return {
    nextSchema: {
      ...schema,
      slides: {
        ...schema.slides,
        [slideId]: {
          ...slide,
          canvasElements: [...slide.canvasElements, duplicatedElement],
        },
      },
    },
    duplicatedElement,
  };
}

/**
 * Mengatur urutan tumpukan layer (`Bring Forward` / `Send Backward`) untuk elemen kanvas maupun elemen asli.
 */
export function applyReorderCanvasElementLayer(
  schema: ContentSchema,
  slideId: string,
  elementId: string,
  direction: 'forward' | 'backward'
): ContentSchema {
  const slide = schema.slides[slideId];
  if (!slide) return schema;

  const { elementOverrides, hiddenElementIds, canvasElements } =
    ensureSlideCanvasFields(slide);

  const idx = canvasElements.findIndex((item) => item.id === elementId);
  if (idx !== -1) {
    const nextElements = [...canvasElements];
    const current = nextElements[idx];
    const deltaZ = direction === 'forward' ? 2 : -2;
    const nextZ = Math.max(1, (current.zIndex || 40) + deltaZ);

    const updatedItem: CanvasElementItem = {
      ...current,
      zIndex: nextZ,
    };
    nextElements[idx] = updatedItem;

    const swapIdx = direction === 'forward' ? idx + 1 : idx - 1;
    if (swapIdx >= 0 && swapIdx < nextElements.length) {
      const temp = nextElements[swapIdx];
      nextElements[swapIdx] = updatedItem;
      nextElements[idx] = {
        ...temp,
        zIndex:
          direction === 'forward'
            ? Math.max(1, updatedItem.zIndex - 1)
            : updatedItem.zIndex + 1,
      };
    }

    return {
      ...schema,
      slides: {
        ...schema.slides,
        [slideId]: {
          ...slide,
          elementOverrides,
          hiddenElementIds,
          canvasElements: nextElements,
        },
      },
    };
  }

  // Jika yang dipilih adalah elemen asli (native element), sesuaikan zIndex pada elementOverrides
  const prevOv = elementOverrides[elementId] ?? {
    xDeltaPct: 0,
    yDeltaPct: 0,
  };
  const nextNativeZ = Math.max(
    1,
    (prevOv.zIndex ?? 35) + (direction === 'forward' ? 2 : -2)
  );
  return applyElementOverridePatch(schema, slideId, elementId, {
    zIndex: nextNativeZ,
  });
}

/**
 * Mengunci atau membuka kunci posisi (`locked`) pada elemen kanvas atau elemen asli slide.
 */
export function applyToggleCanvasElementLock(
  schema: ContentSchema,
  slideId: string,
  elementId: string
): ContentSchema {
  const slide = schema.slides[slideId];
  if (!slide) return schema;

  const { elementOverrides, canvasElements } = ensureSlideCanvasFields(slide);
  const customTarget = canvasElements.find((item) => item.id === elementId);
  if (customTarget) {
    return applyUpdateCanvasElement(schema, slideId, elementId, {
      locked: !customTarget.locked,
    });
  }

  const prevOv = elementOverrides[elementId];
  return applyElementOverridePatch(schema, slideId, elementId, {
    locked: !prevOv?.locked,
  });
}

/**
 * Mereset satu slide ke kondisi awal tanpa mengganggu slide lainnya.
 */
export function applyResetSingleSlide(
  schema: ContentSchema,
  slideId: string,
  defaultReference?: SlideContentItem
): ContentSchema {
  const slide = schema.slides[slideId];
  if (!slide) return schema;

  const resetSlideData: SlideContentItem = defaultReference
    ? {
        ...defaultReference,
        slideNumber: slide.slideNumber,
        elementOverrides: {},
        hiddenElementIds: [],
        canvasElements: [],
      }
    : {
        ...slide,
        elementOverrides: {},
        hiddenElementIds: [],
        canvasElements: [],
      };

  return {
    ...schema,
    slides: {
      ...schema.slides,
      [slideId]: resetSlideData,
    },
  };
}

// ============================================================================
// UNDO & REDO HISTORY STACK ENGINE (Minimal 20 Langkah — Disetel 25 Langkah)
// ============================================================================
export const MAX_HISTORY_STEPS = 25;

export interface HistoryStackState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createInitialHistoryState<T>(initialPresent: T): HistoryStackState<T> {
  return {
    past: [],
    present: initialPresent,
    future: [],
  };
}

export function pushHistoryState<T>(
  history: HistoryStackState<T>,
  nextPresent: T,
  maxSteps: number = MAX_HISTORY_STEPS
): HistoryStackState<T> {
  if (history.present === nextPresent) {
    return history;
  }
  const nextPast = [...history.past, history.present];
  const trimmedPast =
    nextPast.length > maxSteps
      ? nextPast.slice(nextPast.length - maxSteps)
      : nextPast;

  return {
    past: trimmedPast,
    present: nextPresent,
    future: [],
  };
}

export function undoHistoryState<T>(
  history: HistoryStackState<T>
): HistoryStackState<T> {
  if (history.past.length === 0) {
    return history;
  }
  const previous = history.past[history.past.length - 1];
  const nextPast = history.past.slice(0, history.past.length - 1);
  return {
    past: nextPast,
    present: previous,
    future: [history.present, ...history.future].slice(0, MAX_HISTORY_STEPS),
  };
}

export function redoHistoryState<T>(
  history: HistoryStackState<T>
): HistoryStackState<T> {
  if (history.future.length === 0) {
    return history;
  }
  const next = history.future[0];
  const nextFuture = history.future.slice(1);
  return {
    past: [...history.past, history.present].slice(-MAX_HISTORY_STEPS),
    present: next,
    future: nextFuture,
  };
}

/**
 * Memperbarui state `present` secara transien (selama 60fps pointermove drag/resize)
 * tanpa menambah item ke `past` di setiap frame.
 */
export function updateTransientHistoryState<T>(
  history: HistoryStackState<T>,
  nextPresent: T
): HistoryStackState<T> {
  if (history.present === nextPresent) {
    return history;
  }
  return {
    ...history,
    present: nextPresent,
  };
}

/**
 * Menyimpan perubahan transien (setelah `pointerup`) sebagai satu langkah utuh
 * di dalam `past` pada Undo/Redo history stack (`commitToHistory`).
 */
export function commitTransientHistoryState<T>(
  history: HistoryStackState<T>,
  baselineBeforeDrag: T | null,
  maxSteps: number = MAX_HISTORY_STEPS
): HistoryStackState<T> {
  if (baselineBeforeDrag === null || baselineBeforeDrag === history.present) {
    return history;
  }
  const nextPast = [...history.past, baselineBeforeDrag];
  const trimmedPast =
    nextPast.length > maxSteps
      ? nextPast.slice(nextPast.length - maxSteps)
      : nextPast;
  return {
    past: trimmedPast,
    present: history.present,
    future: [],
  };
}


