import {
  ContentSchema,
  SlideContentItem,
  QuizQuestionItem,
  GarudaQuestionOverride,
  defaultContent,
} from '../data/defaultContent';
import {
  GARUDA_BIRD_QUESTIONS,
  GARUDA_DROP_TARGETS,
  playStudioSoundEffect,
  normalizeSmartEmbedUrl,
} from './slideExactMeta';
import { LOCAL_STORAGE_MEDIA_KEY } from '../lib/supabase';

export type ContentUpdater =
  | Partial<ContentSchema>
  | ((prev: ContentSchema) => ContentSchema);

export const LAST_SLIDE_STORAGE_KEY = 'starla_last_slide_v1';
export const ADMIN_EXTRA_STORAGE_KEY = 'starla_admin_extra_v2';
const EMBEDDED_LAST_SLIDE_MEDIA_KEY = '__starla_last_slide_v1__';
const EMBEDDED_ADMIN_EXTRA_MEDIA_KEY = '__starla_admin_extra_v2__';

export interface LastActiveSlideState {
  slideId: string;
  slideIndex: number;
  frontOpened: boolean;
  studentName?: string;
  studentSchool?: string;
  isAdminOpen?: boolean;
  adminActiveTab?: string;
  updatedAt: number;
}

/**
 * Installs a non-destructive guard on `Storage.prototype.clear` so that
 * `wipeResumeStorage()` in `index.html` (which clears Storyline's internal LMS suspend_data
 * on `beforeunload`) NEVER wipes `starla_*` keys (`starla_last_slide_v1`, `starla_admin_extra_v2`,
 * `starla_budaya_content_backup_v1`, `starla_budaya_media_backup_v1`).
 */
export function protectStarlaLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const ls = window.localStorage as Storage & {
      __starlaClearProtected?: boolean;
    };
    const proto = Object.getPrototypeOf(ls) as Storage & {
      __starlaClearProtected?: boolean;
    };
    const target =
      proto && typeof proto.clear === 'function' ? proto : ls;
    if (!target || target.__starlaClearProtected) return;

    const origClear = target.clear;
    if (typeof origClear !== 'function') return;

    const wrappedClear = function (this: Storage) {
      if (this === window.localStorage) {
        const preserved: Array<[string, string]> = [];
        for (let i = 0; i < this.length; i++) {
          const k = this.key(i);
          if (k && k.startsWith('starla_')) {
            const val = this.getItem(k);
            if (val !== null) {
              preserved.push([k, val]);
            }
          }
        }
        origClear.call(this);
        for (const [k, val] of preserved) {
          this.setItem(k, val);
        }
        return;
      }
      return origClear.call(this);
    };

    target.clear = wrappedClear;
    target.__starlaClearProtected = true;
    if (Object.prototype.hasOwnProperty.call(ls, 'clear')) {
      ls.clear = wrappedClear;
      ls.__starlaClearProtected = true;
    }
  } catch {
    // Ignore in environments where Storage.prototype is frozen
  }
}

function readMediaBackupMap(): Record<string, string> {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const raw = window.localStorage.getItem(LOCAL_STORAGE_MEDIA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMediaBackupEntry(key: string, jsonValue: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const map = readMediaBackupMap();
    map[key] = jsonValue;
    window.localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Persists the user's last active slide & session state across browser refresh and tab close.
 * Saved in both `starla_last_slide_v1` and inside `starla_budaya_media_backup_v1` (which `index.html`
 * explicitly preserves during `<head>` initialization before the React bundle runs).
 */
export function saveLastActiveSlideState(
  patch: Partial<LastActiveSlideState> & { slideId: string }
): LastActiveSlideState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    protectStarlaLocalStorage();
    const existing = loadLastActiveSlideState();
    const nextState: LastActiveSlideState = {
      slideId: patch.slideId,
      slideIndex:
        patch.slideIndex ??
        existing?.slideIndex ??
        Math.max(0, defaultContent.slideOrder.indexOf(patch.slideId)),
      frontOpened: patch.frontOpened ?? existing?.frontOpened ?? true,
      studentName: patch.studentName ?? existing?.studentName,
      studentSchool: patch.studentSchool ?? existing?.studentSchool,
      isAdminOpen: patch.isAdminOpen ?? existing?.isAdminOpen,
      adminActiveTab: patch.adminActiveTab ?? existing?.adminActiveTab,
      updatedAt: Date.now(),
    };
    const serialized = JSON.stringify(nextState);
    window.localStorage.setItem(LAST_SLIDE_STORAGE_KEY, serialized);
    writeMediaBackupEntry(EMBEDDED_LAST_SLIDE_MEDIA_KEY, serialized);
    try {
      window.sessionStorage?.setItem(LAST_SLIDE_STORAGE_KEY, serialized);
    } catch {
      // Ignore sessionStorage errors
    }
    try {
      const loc = window.location;
      const isPublicRoute =
        loc &&
        !loc.pathname.startsWith('/admin') &&
        !(loc.search || '').includes('mode=admin');
      if (
        isPublicRoute &&
        nextState.frontOpened &&
        nextState.slideId &&
        typeof window.history?.replaceState === 'function'
      ) {
        const nextHash = `#slide=${encodeURIComponent(nextState.slideId)}`;
        if (loc.hash !== nextHash) {
          window.history.replaceState(
            null,
            '',
            `${loc.pathname}${loc.search}${nextHash}`
          );
        }
      }
    } catch {
      // Ignore history API restrictions
    }
    return nextState;
  } catch {
    return null;
  }
}

/**
 * Pure helper to determine which slide should be restored upon browser reload/refresh.
 * Priority:
 * 1. Returns `null` if `?reset=1` or `?fresh=1` is present in `urlSearch`.
 * 2. Valid `#slide=<id>` in `urlHash` (when existing in `availableSlides`).
 * 3. Persisted `savedState.slideId` when `savedState.frontOpened === true` and valid in `availableSlides`.
 */
export function resolveRestorableSlideId(
  savedState: LastActiveSlideState | null,
  urlHash: string,
  availableSlides: Record<string, unknown>,
  urlSearch = ''
): string | null {
  if (/(?:^|[?&])(reset|fresh)=1(?:&|$)/i.test(urlSearch || '')) {
    return null;
  }

  const hashMatch = (urlHash || '').match(/#slide=([A-Za-z0-9_-]+)/);
  if (hashMatch && hashMatch[1] && availableSlides[hashMatch[1]]) {
    return hashMatch[1];
  }

  if (
    savedState &&
    savedState.frontOpened === true &&
    typeof savedState.slideId === 'string' &&
    savedState.slideId.trim().length > 0 &&
    availableSlides[savedState.slideId]
  ) {
    return savedState.slideId;
  }

  return null;
}

/**
 * Loads the user's last active slide state on browser refresh or reopen.
 */
export function loadLastActiveSlideState(): LastActiveSlideState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    protectStarlaLocalStorage();
    let raw = window.localStorage.getItem(LAST_SLIDE_STORAGE_KEY);
    if (!raw) {
      const map = readMediaBackupMap();
      raw = map[EMBEDDED_LAST_SLIDE_MEDIA_KEY] || null;
      if (!raw) {
        try {
          raw = window.sessionStorage?.getItem(LAST_SLIDE_STORAGE_KEY) || null;
        } catch {
          raw = null;
        }
      }
      if (raw) {
        window.localStorage.setItem(LAST_SLIDE_STORAGE_KEY, raw);
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.slideId === 'string' && parsed.slideId.trim()) {
      return parsed as LastActiveSlideState;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearLastActiveSlideState(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(LAST_SLIDE_STORAGE_KEY);
    try {
      window.sessionStorage?.removeItem(LAST_SLIDE_STORAGE_KEY);
    } catch {
      // Ignore
    }
    const map = readMediaBackupMap();
    if (EMBEDDED_LAST_SLIDE_MEDIA_KEY in map) {
      delete map[EMBEDDED_LAST_SLIDE_MEDIA_KEY];
      window.localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(map));
    }
  } catch {
    // Ignore
  }
}

/**
 * Saves & loads `AdminExtraState` (360° Embed list, status overrides, analytics)
 * in a refresh-proof manner so `index.html`'s `wipeResumeStorage` never loses it.
 */
export function savePersistentAdminExtraState<T>(extraState: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    protectStarlaLocalStorage();
    const serialized = JSON.stringify(extraState);
    window.localStorage.setItem(ADMIN_EXTRA_STORAGE_KEY, serialized);
    writeMediaBackupEntry(EMBEDDED_ADMIN_EXTRA_MEDIA_KEY, serialized);
  } catch {
    // Ignore
  }
}

export function loadPersistentAdminExtraState<T>(): T | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    protectStarlaLocalStorage();
    let raw = window.localStorage.getItem(ADMIN_EXTRA_STORAGE_KEY);
    if (!raw) {
      const map = readMediaBackupMap();
      raw = map[EMBEDDED_ADMIN_EXTRA_MEDIA_KEY] || null;
      if (raw) {
        window.localStorage.setItem(ADMIN_EXTRA_STORAGE_KEY, raw);
      }
    }
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Splits a single-line or multi-line statement into balanced lines
 * so it fits cleanly inside Storyline's multi-tspan speech bubble SVGs.
 */
export function splitStatementIntoBalancedLines(
  text: string,
  targetLineCount = 3,
  maxCharsPerLine = 26
): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [''];
  if (cleaned.includes('\n')) {
    return cleaned.split('\n').map((l) => l.trim());
  }
  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    if (!current) {
      current = w;
    } else if (
      current.length + 1 + w.length <= maxCharsPerLine ||
      lines.length >= targetLineCount - 1
    ) {
      current += ' ' + w;
    } else {
      lines.push(current + ' ');
      current = w;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

/**
 * Helper to update a specific Bird Question in Game Anak Garuda (`6G1VrKuOhCw`).
 * Updates both `svgTextCommandSets[spec.commandSetId]`, `quizzes.gameAnakGaruda.questionOverrides[birdId]`,
 * and `slides['6G1VrKuOhCw'].hiddenElementIds`.
 */
export function applyGarudaBirdQuestionPatch(
  prev: ContentSchema,
  birdId: string,
  patch: Partial<GarudaQuestionOverride>
): ContentSchema {
  const spec = GARUDA_BIRD_QUESTIONS.find((q) => q.birdId === birdId);
  const prevOverrides = prev.quizzes.gameAnakGaruda.questionOverrides || {};
  const currentOv = prevOverrides[birdId] || { birdId };
  const nextOv: GarudaQuestionOverride = {
    ...currentOv,
    ...patch,
    birdId,
  };

  const nextCommandSets = { ...prev.svgTextCommandSets };
  if (spec && patch.text !== undefined) {
    const existingCs = nextCommandSets[spec.commandSetId];
    const targetLinesCount = existingCs?.lines?.length || spec.defaultLines.length || 3;
    const balancedLines = splitStatementIntoBalancedLines(
      patch.text,
      targetLinesCount,
      26
    );
    nextCommandSets[spec.commandSetId] = {
      commandSetId: spec.commandSetId,
      index:
        existingCs?.index ||
        Number(spec.commandSetId.replace('commandset-', '')) ||
        349,
      lines: balancedLines,
    };
  }

  const garudaSlide = prev.slides['6G1VrKuOhCw'];
  const nextSlides = { ...prev.slides };
  if (garudaSlide && patch.hidden !== undefined) {
    const prevHiddenIds = garudaSlide.hiddenElementIds || [];
    const nextHiddenIds = patch.hidden
      ? Array.from(new Set([...prevHiddenIds, birdId]))
      : prevHiddenIds.filter((id) => id !== birdId);
    nextSlides['6G1VrKuOhCw'] = {
      ...garudaSlide,
      hiddenElementIds: nextHiddenIds,
    };
  }

  return {
    ...prev,
    slides: nextSlides,
    svgTextCommandSets: nextCommandSets,
    quizzes: {
      ...prev.quizzes,
      gameAnakGaruda: {
        ...prev.quizzes.gameAnakGaruda,
        questionOverrides: {
          ...prevOverrides,
          [birdId]: nextOv,
        },
      },
    },
  };
}

/**
 * Deeply merges a partial ContentSchema or executes a functional updater
 * while preserving immutability and fallback safety.
 */
export function resolveUpdatedContent(
  prev: ContentSchema,
  updater: ContentUpdater
): ContentSchema {
  if (typeof updater === 'function') {
    const next = updater(prev);
    return next ?? prev;
  }

  if (!updater || typeof updater !== 'object') {
    return prev;
  }

  return {
    ...prev,
    ...updater,
    appMeta: updater.appMeta
      ? { ...prev.appMeta, ...updater.appMeta }
      : prev.appMeta,
    frontStage: updater.frontStage
      ? { ...prev.frontStage, ...updater.frontStage }
      : prev.frontStage,
    navigationConfig: updater.navigationConfig
      ? {
          ...prev.navigationConfig,
          ...updater.navigationConfig,
          slides: updater.navigationConfig.slides
            ? {
                ...prev.navigationConfig.slides,
                ...updater.navigationConfig.slides,
              }
            : prev.navigationConfig.slides,
        }
      : prev.navigationConfig,
    videos: updater.videos
      ? {
          intro: updater.videos.intro
            ? { ...prev.videos.intro, ...updater.videos.intro }
            : prev.videos.intro,
          sinema: updater.videos.sinema
            ? { ...prev.videos.sinema, ...updater.videos.sinema }
            : prev.videos.sinema,
        }
      : prev.videos,
    slides: updater.slides
      ? { ...prev.slides, ...updater.slides }
      : prev.slides,
    quizzes: updater.quizzes
      ? {
          kuisBudaya: updater.quizzes.kuisBudaya
            ? { ...prev.quizzes.kuisBudaya, ...updater.quizzes.kuisBudaya }
            : prev.quizzes.kuisBudaya,
          gameAnakGaruda: updater.quizzes.gameAnakGaruda
            ? {
                ...prev.quizzes.gameAnakGaruda,
                ...updater.quizzes.gameAnakGaruda,
              }
            : prev.quizzes.gameAnakGaruda,
        }
      : prev.quizzes,
    svgTextCommandSets: updater.svgTextCommandSets
      ? { ...prev.svgTextCommandSets, ...updater.svgTextCommandSets }
      : prev.svgTextCommandSets,
    audioCatalog: updater.audioCatalog
      ? { ...prev.audioCatalog, ...updater.audioCatalog }
      : prev.audioCatalog,
    imageCatalog: updater.imageCatalog
      ? { ...prev.imageCatalog, ...updater.imageCatalog }
      : prev.imageCatalog,
  };
}

/**
 * Helper to update a single slide in ContentSchema
 */
export function applySlidePatch(
  prev: ContentSchema,
  slideId: string,
  patch: Partial<SlideContentItem>
): ContentSchema {
  const existing = prev.slides[slideId];
  if (!existing) return prev;

  const updatedSlide: SlideContentItem = {
    ...existing,
    ...patch,
  };

  const nextCommandSets = { ...prev.svgTextCommandSets };
  if (patch.texts) {
    for (const tb of patch.texts) {
      if (tb.commandSetId && nextCommandSets[tb.commandSetId]) {
        nextCommandSets[tb.commandSetId] = {
          ...nextCommandSets[tb.commandSetId],
          lines: [...tb.lines],
        };
      }
    }
  }

  const nextAudioCatalog = { ...prev.audioCatalog };
  if (patch.audios) {
    for (const aud of patch.audios) {
      if (aud.assetId && nextAudioCatalog[aud.assetId]) {
        nextAudioCatalog[aud.assetId] = {
          ...nextAudioCatalog[aud.assetId],
          url: aud.url,
        };
      }
    }
  }

  const nextImageCatalog = { ...prev.imageCatalog };
  if (patch.images) {
    for (const img of patch.images) {
      if (img.assetId && nextImageCatalog[img.assetId]) {
        nextImageCatalog[img.assetId] = {
          ...nextImageCatalog[img.assetId],
          url: img.url,
        };
      }
    }
  }

  return {
    ...prev,
    slides: {
      ...prev.slides,
      [slideId]: updatedSlide,
    },
    svgTextCommandSets: nextCommandSets,
    audioCatalog: nextAudioCatalog,
    imageCatalog: nextImageCatalog,
  };
}

/**
 * Helper to update a quiz question in ContentSchema
 */
export function applyQuizQuestionPatch(
  prev: ContentSchema,
  slideId: string,
  patch: Partial<QuizQuestionItem>
): ContentSchema {
  const nextQuestions = prev.quizzes.kuisBudaya.questions.map((q) => {
    if (q.slideId !== slideId) return q;
    return {
      ...q,
      ...patch,
      choices: patch.choices ? [...patch.choices] : q.choices,
      feedbackLayers: patch.feedbackLayers
        ? { ...q.feedbackLayers, ...patch.feedbackLayers }
        : q.feedbackLayers,
    };
  });

  const updatedQuestion =
    nextQuestions.find((q) => q.slideId === slideId) || null;
  const nextCommandSets = { ...prev.svgTextCommandSets };

  if (updatedQuestion) {
    if (
      updatedQuestion.questionCommandSetId &&
      patch.questionText !== undefined &&
      nextCommandSets[updatedQuestion.questionCommandSetId]
    ) {
      nextCommandSets[updatedQuestion.questionCommandSetId] = {
        ...nextCommandSets[updatedQuestion.questionCommandSetId],
        lines: patch.questionText.split('\n'),
      };
    }
    if (patch.choices) {
      for (const ch of patch.choices) {
        if (ch.commandSetId && nextCommandSets[ch.commandSetId]) {
          nextCommandSets[ch.commandSetId] = {
            ...nextCommandSets[ch.commandSetId],
            lines: ch.text.split('\n'),
          };
        }
      }
    }
  }

  const nextSlides = { ...prev.slides };
  if (nextSlides[slideId] && updatedQuestion) {
    nextSlides[slideId] = {
      ...nextSlides[slideId],
      title: updatedQuestion.questionText,
      quizQuestion: updatedQuestion,
    };
  }

  return {
    ...prev,
    slides: nextSlides,
    quizzes: {
      ...prev.quizzes,
      kuisBudaya: {
        ...prev.quizzes.kuisBudaya,
        questions: nextQuestions,
      },
    },
    svgTextCommandSets: nextCommandSets,
  };
}

/**
 * Replaces `<tspan>` text lines inside a `paths.js` commandset node
 * while keeping all SVG coordinates, font attributes, and structure intact.
 */
function updateCommandSetTspans(
  node: Record<string, unknown>,
  newLines: string[]
): void {
  const tspans: Array<Record<string, unknown>> = [];
  function collectTspans(curr: unknown) {
    if (!curr || typeof curr !== 'object') return;
    const obj = curr as Record<string, unknown>;
    if (obj.nodeType === 'tspan' && Array.isArray(obj.children)) {
      tspans.push(obj);
    }
    if (Array.isArray(obj.children)) {
      for (const child of obj.children) {
        collectTspans(child);
      }
    }
  }
  collectTspans(node);

  if (tspans.length === 0) return;

  // If newLines has 1 long line and there are multiple tspans, wrap it across the available tspans
  const effectiveLines =
    newLines.length === 1 && tspans.length > 1 && newLines[0].length > 26
      ? splitStatementIntoBalancedLines(newLines[0], tspans.length, 26)
      : newLines;

  for (let i = 0; i < tspans.length; i++) {
    const lineText =
      i < effectiveLines.length
        ? i === tspans.length - 1 && effectiveLines.length > tspans.length
          ? effectiveLines.slice(i).join(' ')
          : effectiveLines[i]
        : '';
    tspans[i].children = [lineText];
  }
}

/**
 * Extracts the top-level slide `id` from a Storyline `globalProvideData('slide', rawJson)` string
 * without calling `JSON.parse`. Supports both synthetic payloads (where `"id"` appears near the
 * start) and real Articulate Storyline exports (where `"lmsId"` + `"id"` appear either within the
 * first ~1.2 KB or within the last ~12 KB before the slide `events` block).
 */
export function extractSlideIdFromProvideJson(rawJson: string): string | null {
  if (!rawJson || typeof rawJson !== 'string') return null;

  // 1. Short / synthetic payloads where top-level `"id"` is near the beginning
  const headShort = rawJson.slice(0, 160);
  const headShortMatch = headShort.match(/"id"\s*:\s*"([^"]+)"/);
  if (headShortMatch) {
    return headShortMatch[1];
  }

  // 2. Real Storyline exports where `"lmsId"` and `"id"` appear near the start (e.g. Slide 35, Slide 40)
  const headWindow = rawJson.slice(0, 1400);
  const headLmsMatch = headWindow.match(
    /"lmsId"\s*:\s*"[^"]*"[\s\S]{0,600}?"id"\s*:\s*"([^"]+)"/
  );
  if (headLmsMatch) {
    return headLmsMatch[1];
  }
  const headIdMatches = headWindow.matchAll(/"id"\s*:\s*"([^"]+)"/g);
  for (const m of headIdMatches) {
    if (defaultContent.slides[m[1]]) {
      return m[1];
    }
  }

  // 3. Real Storyline exports where `"lmsId"` and `"id"` appear near the tail (e.g. Slide 6, Slide 25-34, Slide 43)
  const tailWindow = rawJson.length > 14000 ? rawJson.slice(-14000) : rawJson;
  const tailLmsMatch = tailWindow.match(
    /"lmsId"\s*:\s*"[^"]*"[\s\S]{0,600}?"id"\s*:\s*"([^"]+)"/
  );
  if (tailLmsMatch) {
    return tailLmsMatch[1];
  }

  return null;
}

function extractLeadingSlideIdFromJson(rawJson: string): string | null {
  return extractSlideIdFromProvideJson(rawJson);
}

function doesSlideRequireTransform(
  slideId: string,
  activeContent: ContentSchema
): boolean {
  if (
    slideId === '604TQFYNuzG' ||
    slideId === '5iew2M44w24' ||
    slideId === '5jTlwgcUi8o' ||
    slideId === '6G1VrKuOhCw'
  ) {
    return true;
  }
  const slideCfg = activeContent.slides[slideId];
  if (!slideCfg) return false;
  const defSlideCfg = defaultContent.slides[slideId];
  if (!defSlideCfg || slideCfg.title !== defSlideCfg.title) return true;
  if (
    slideCfg.backgroundUrl &&
    slideCfg.backgroundUrl !== defSlideCfg.backgroundUrl
  ) {
    return true;
  }
  if (slideCfg.webObjectUrl) return true;
  if (
    slideCfg.elementOverrides &&
    Object.keys(slideCfg.elementOverrides).length > 0
  ) {
    return true;
  }
  if (
    Array.isArray(slideCfg.hiddenElementIds) &&
    slideCfg.hiddenElementIds.length > 0
  ) {
    return true;
  }
  return false;
}

/**
 * Transforms Storyline's `globalProvideData(type, jsonStr)` payload using activeContent.
 * Fast-path: if `activeContent === defaultContent`, returns `jsonStr` untouched (100% zero regression).
 */
export function transformStorylineProvideData(
  dataType: string,
  rawJson: string,
  activeContent: ContentSchema
): string {
  if (!activeContent || activeContent === defaultContent) {
    return rawJson;
  }

  if (dataType !== 'slide' && dataType !== 'paths' && dataType !== 'data') {
    return rawJson;
  }

  if (dataType === 'slide') {
    const fastSlideId = extractLeadingSlideIdFromJson(rawJson);
    if (fastSlideId && !doesSlideRequireTransform(fastSlideId, activeContent)) {
      return rawJson;
    }
  }

  try {
    const parsed = JSON.parse(rawJson);
    let modified = false;

    const NATIVE_DEFAULT_TARGETS: Record<string, string> = {
      '5ZPukeMFffY': '6IgV5Xf2ecV',
      '5Vj2vgTep1J': '6OrD7bra4Ko',
      '5cPSgbCeIlr': '6eHtnAfM3bY',
      '6afmjIda5Z2': '5jTlwgcUi8o',
    };

    const pameranEl = activeContent.slides['5iew2M44w24']?.canvasElements?.find(
      (el) => el.id === 'btn_pameran_360_budaya' && !el.hidden
    );

    if (dataType === 'paths' && parsed && parsed.Lib) {
      for (const [csKey, csItem] of Object.entries(
        activeContent.svgTextCommandSets
      )) {
        const defItem = defaultContent.svgTextCommandSets[csKey];
        const linesChanged =
          !defItem ||
          defItem.lines.length !== csItem.lines.length ||
          defItem.lines.some((line, idx) => line !== csItem.lines[idx]);

        if (linesChanged && parsed.Lib[csKey]) {
          updateCommandSetTspans(parsed.Lib[csKey], csItem.lines);
          modified = true;
        }
      }

      // Inject native Storyline SVG commandsets (normal + _default_Hover) for 360° Pameran button (btn_pameran_360_budaya)
      // matching 6afmjIda5Z2 (commandset-386 & commandset-387) 100%
      if (pameranEl) {
        const pamW = Math.max(40, Math.round((pameranEl.width / 100) * 1280));
        const pamH = Math.max(20, Math.round((pameranEl.height / 100) * 720));
        const hoverW = Math.round(pamW * (428 / 416));
        const hoverH = Math.round(pamH * (140 / 136));
        parsed.Lib['commandset-3860'] = {
          nodeType: 'g',
          children: [
            {
              nodeType: 'path',
              d: `M0,0L${pamW},0 ${pamW},${pamH} 0,${pamH}z`,
              id: 'path-12360',
              fill: 'none',
            },
            {
              nodeType: 'image',
              transform: [
                {
                  type: 'scale',
                  args: [pamW / 945, pamH / 277],
                },
              ],
              id: 'image-12350',
              'data-original-image': '01',
              x: 0,
              y: 0,
              opacity: 1,
            },
          ],
          className: 'eventable',
        };
        parsed.Lib['commandset-3870'] = {
          nodeType: 'g',
          children: [
            {
              nodeType: 'path',
              d: `M0,0L${hoverW},0 ${hoverW},${hoverH} 0,${hoverH}z`,
              id: 'path-12380',
              fill: 'none',
            },
            {
              nodeType: 'image',
              transform: [
                {
                  type: 'scale',
                  args: [hoverW / 945, hoverH / 277],
                },
              ],
              id: 'image-12370',
              'data-original-image': '01',
              x: 0,
              y: 0,
              opacity: 1,
            },
          ],
          className: 'eventable',
        };
        if (typeof window !== 'undefined') {
          (window as unknown as Record<string, unknown>).__STARLA_PATHS_3860_READY__ =
            true;
        }
        modified = true;
      }
    } else if (dataType === 'data' && parsed) {
      if (Array.isArray(parsed.assetLib)) {
        for (const asset of parsed.assetLib) {
          if (!asset || typeof asset.id !== 'number') continue;
          const audioOverride = activeContent.audioCatalog[asset.id];
          const defAudio = defaultContent.audioCatalog[asset.id];
          if (
            audioOverride &&
            (!defAudio || audioOverride.url !== defAudio.url)
          ) {
            asset.url = audioOverride.url;
            modified = true;
          }
          const imgOverride = activeContent.imageCatalog[asset.id];
          const defImg = defaultContent.imageCatalog[asset.id];
          if (imgOverride && (!defImg || imgOverride.url !== defImg.url)) {
            asset.url = imgOverride.url;
            modified = true;
          }
          // Always ensure asset 362 (5Vj2vgTep1J / Cari Tahu) points to mobile/5b7bpGxEsZl.png without stale maskref
          if (asset.id === 362) {
            asset.url = 'mobile/5b7bpGxEsZl.png';
            delete asset.maskref;
            modified = true;
          }
        }
        // Register asset 380 for native 360° Pameran button (mobile/pameran.png, 945x277)
        if (pameranEl) {
          parsed.assetLib[380] = {
            kind: 'asset',
            id: 380,
            imageType: 'normal',
            width: 945,
            height: 277,
            mobiledx: 0,
            mobiledy: 0,
            fileSize: 114465,
            url: pameranEl.imageUrl || 'mobile/pameran.png',
          };
          if (typeof window !== 'undefined') {
            (window as unknown as Record<string, unknown>).__STARLA_DATA_ASSET_380_READY__ =
              true;
          }
          modified = true;
        }
      }

      if (Array.isArray(parsed.scenes)) {
        for (const scene of parsed.scenes) {
          if (!scene || !Array.isArray(scene.slides)) continue;
          for (const sl of scene.slides) {
            const slideCfg = activeContent.slides[sl.id];
            const defSlideCfg = defaultContent.slides[sl.id];
            if (
              slideCfg &&
              (!defSlideCfg || slideCfg.title !== defSlideCfg.title)
            ) {
              sl.title = slideCfg.title;
              modified = true;
            }
            if (
              slideCfg?.quizQuestion &&
              Array.isArray(sl.interactions) &&
              sl.interactions[0]
            ) {
              const q = slideCfg.quizQuestion;
              const defQ = defSlideCfg?.quizQuestion;
              if (!defQ || q.questionText !== defQ.questionText) {
                sl.interactions[0].lmstext = q.questionText;
                modified = true;
              }
              if (Array.isArray(sl.interactions[0].choices)) {
                for (const ch of sl.interactions[0].choices) {
                  const overrideCh = q.choices.find((c) => c.id === ch.id);
                  const defCh = defQ?.choices.find((c) => c.id === ch.id);
                  if (
                    overrideCh &&
                    (!defCh || overrideCh.text !== defCh.text)
                  ) {
                    ch.lmstext = overrideCh.text;
                    modified = true;
                  }
                }
              }
            }
          }
        }
      }
    } else if (dataType === 'slide' && parsed && parsed.id) {
      const slideCfg = activeContent.slides[parsed.id];
      const defSlideCfg = defaultContent.slides[parsed.id];

      // Slide 37 (604TQFYNuzG): ensure all 4 main objects appear immediately at time 0 without stalling on Entrance tween if audio autoplay is blocked
      if (parsed.id === '604TQFYNuzG' && Array.isArray(parsed.slideLayers)) {
        const baseLayer37 = parsed.slideLayers[0];
        if (Array.isArray(baseLayer37?.timeline?.events)) {
          for (const ev of baseLayer37.timeline.events) {
            if (ev?.time === 0 && Array.isArray(ev.actions)) {
              for (const act of ev.actions) {
                if (act?.kind === 'show' && act.transition === 'custom') {
                  act.transition = 'appear';
                  delete act.animationId;
                  delete act.reverse;
                  modified = true;
                }
              }
            }
          }
        }
      }

      if (slideCfg) {
        if (!defSlideCfg || slideCfg.title !== defSlideCfg.title) {
          parsed.title = slideCfg.title;
          modified = true;
        }
        if (
          slideCfg.backgroundUrl &&
          (!defSlideCfg ||
            slideCfg.backgroundUrl !== defSlideCfg.backgroundUrl) &&
          parsed.background?.imglibrary?.[0]
        ) {
          parsed.background.imglibrary[0].url = slideCfg.backgroundUrl;
          modified = true;
        }

        // Slide 5iew2M44w24: Ensure 5Vj2vgTep1J uses mobile/5b7bpGxEsZl.png and inject native Storyline button for btn_pameran_360_budaya
        if (
          parsed.id === '5iew2M44w24' &&
          Array.isArray(parsed.slideLayers) &&
          parsed.slideLayers[0]
        ) {
          const baseLayerMenu = parsed.slideLayers[0];
          if (Array.isArray(baseLayerMenu.objects)) {
            const cariTahuObj = baseLayerMenu.objects.find(
              (o: any) => o?.id === '5Vj2vgTep1J'
            );
            if (cariTahuObj && Array.isArray(cariTahuObj.imagelib) && cariTahuObj.imagelib[0]) {
              cariTahuObj.imagelib[0].url = 'mobile/5b7bpGxEsZl.png';
              modified = true;
            }

            const btn360Template = baseLayerMenu.objects.find(
              (o: any) => o?.id === '6afmjIda5Z2'
            );
            const alreadyHasPameran = baseLayerMenu.objects.some(
              (o: any) => o?.id === 'btn_pameran_360_budaya'
            );
            const browserWin =
              typeof window !== 'undefined'
                ? (window as unknown as Record<string, unknown>)
                : null;
            const storylineAlreadyBootedWithoutPatch = Boolean(
              browserWin &&
                browserWin.DS &&
                (browserWin.__STARLA_DATA_ASSET_380_READY__ !== true ||
                  browserWin.__STARLA_PATHS_3860_READY__ !== true)
            );
            if (storylineAlreadyBootedWithoutPatch && browserWin) {
              browserWin.__STARLA_PAMERAN_NATIVE_INJECTED__ = false;
            }
            if (
              pameranEl &&
              btn360Template &&
              !alreadyHasPameran &&
              !storylineAlreadyBootedWithoutPatch
            ) {
              const pamX = Math.round((pameranEl.x / 100) * 1280);
              const pamY = Math.round((pameranEl.y / 100) * 720);
              const pamW = Math.max(40, Math.round((pameranEl.width / 100) * 1280));
              const pamH = Math.max(20, Math.round((pameranEl.height / 100) * 720));
              const hoverW = Math.round(pamW * (428 / 416));
              const hoverH = Math.round(pamH * (140 / 136));

              const clonedPameranObj = JSON.parse(
                JSON.stringify(btn360Template)
              );
              clonedPameranObj.id = 'btn_pameran_360_budaya';
              clonedPameranObj.xPos = pamX;
              clonedPameranObj.yPos = pamY;
              clonedPameranObj.width = pamW;
              clonedPameranObj.height = pamH;
              clonedPameranObj.rotateXPos = Math.round(pamW / 2);
              clonedPameranObj.rotateYPos = Math.round(pamH / 2);
              clonedPameranObj.depth = 12;
              clonedPameranObj.tabIndex = 17;
              clonedPameranObj.imagelib = [
                {
                  kind: 'imagedata',
                  assetId: 380,
                  id: '01',
                  url: pameranEl.imageUrl || 'mobile/pameran.png',
                  type: 'normal',
                  altText: 'pameran.png',
                  width: 945,
                  height: 277,
                  mobiledx: 0,
                  mobiledy: 0,
                },
              ];
              clonedPameranObj.data = {
                hotlinkId: '',
                accState: 0,
                vectorData: {
                  left: 0,
                  top: 0,
                  right: pamW,
                  bottom: pamH,
                  altText: 'pameran.png',
                  pngfb: false,
                  pr: { l: 'Lib', i: 3860 },
                },
                html5data: {
                  xPos: 0,
                  yPos: 0,
                  width: pamW,
                  height: pamH,
                  strokewidth: 0,
                },
              };
              clonedPameranObj.states = [
                {
                  kind: 'state',
                  name: '_default_Hover',
                  data: {
                    hotlinkId: '',
                    accState: 0,
                    vectorData: {
                      left: 0,
                      top: 0,
                      right: hoverW,
                      bottom: hoverH,
                      altText: 'pameran.png',
                      pngfb: false,
                      pr: { l: 'Lib', i: 3870 },
                    },
                    html5data: {
                      xPos: 0,
                      yPos: 0,
                      width: hoverW,
                      height: hoverH,
                      strokewidth: 0,
                    },
                  },
                },
              ];
              // Preserve 100% native Storyline hover state & hover sound (_parent.63TwMQdlWkR), and clear hover on release
              clonedPameranObj.events = [
                {
                  kind: 'onrelease',
                  actions: [
                    {
                      kind: 'exe_actiongroup',
                      id: '_this.ActGrpClearHoverState',
                    },
                  ],
                },
                {
                  kind: 'ontransitionin',
                  actions: [
                    {
                      kind: 'exe_actiongroup',
                      id: '_player._setstates',
                      scopeRef: { type: 'string', value: '_this' },
                    },
                  ],
                },
                {
                  kind: 'onrollover',
                  actions: [
                    {
                      kind: 'exe_actiongroup',
                      id: 'ActGrpSetHoverState',
                      scopeRef: { type: 'string', value: '_this' },
                    },
                  ],
                },
                {
                  kind: 'onrollout',
                  actions: [
                    {
                      kind: 'exe_actiongroup',
                      id: 'ActGrpClearHoverState',
                      scopeRef: { type: 'string', value: '_this' },
                    },
                  ],
                },
              ];

              baseLayerMenu.objects.push(clonedPameranObj);

              const tick0 = baseLayerMenu.timeline?.events?.find(
                (ev: any) => ev?.time === 0 && Array.isArray(ev.actions)
              );
              if (tick0) {
                tick0.actions.push({
                  kind: 'show',
                  transition: 'custom',
                  animationId: 'Entrance',
                  reverse: false,
                  objRef: {
                    type: 'string',
                    value: 'btn_pameran_360_budaya',
                  },
                });
              }
              if (browserWin) {
                browserWin.__STARLA_PAMERAN_NATIVE_INJECTED__ = true;
              }
              modified = true;
            }
          }
        }

        // Apply native button / element position, size, action link & visibility overrides to Storyline slide JSON
        const elOverrides = slideCfg.elementOverrides || {};
        const hiddenIds = slideCfg.hiddenElementIds || [];
        if (
          (Object.keys(elOverrides).length > 0 || hiddenIds.length > 0) &&
          Array.isArray(parsed.slideLayers)
        ) {
          const patchRawObjects = (rawObjs: any[]) => {
            for (const o of rawObjs) {
              if (!o || typeof o !== 'object') continue;
              const ov = o.id ? elOverrides[o.id] : undefined;
              const isHidden = Boolean(
                ov?.hidden || (o.id && hiddenIds.includes(o.id))
              );
              if (isHidden) {
                o.xPos = -2000;
                o.yPos = -2000;
                modified = true;
              } else if (ov) {
                if (typeof ov.xDeltaPct === 'number' && ov.xDeltaPct !== 0) {
                  o.xPos = Math.round(
                    (o.xPos || 0) + (ov.xDeltaPct / 100) * 1280
                  );
                  modified = true;
                }
                if (typeof ov.yDeltaPct === 'number' && ov.yDeltaPct !== 0) {
                  o.yPos = Math.round(
                    (o.yPos || 0) + (ov.yDeltaPct / 100) * 720
                  );
                  modified = true;
                }
                if (typeof ov.widthPct === 'number' && ov.widthPct > 0) {
                  const newW = Math.round((ov.widthPct / 100) * 1280);
                  o.width = newW;
                  if (Array.isArray(o.imagelib)) {
                    for (const im of o.imagelib) {
                      if (im && typeof im === 'object') im.width = newW;
                    }
                  }
                  if (Array.isArray(o.states)) {
                    for (const st of o.states) {
                      if (st?.data?.html5data) {
                        st.data.html5data.width = newW;
                      }
                    }
                  }
                  modified = true;
                }
                if (typeof ov.heightPct === 'number' && ov.heightPct > 0) {
                  const newH = Math.round((ov.heightPct / 100) * 720);
                  o.height = newH;
                  if (Array.isArray(o.imagelib)) {
                    for (const im of o.imagelib) {
                      if (im && typeof im === 'object') im.height = newH;
                    }
                  }
                  if (Array.isArray(o.states)) {
                    for (const st of o.states) {
                      if (st?.data?.html5data) {
                        st.data.html5data.height = newH;
                      }
                    }
                  }
                  modified = true;
                }
                // Record that this object's initial JSON coordinates & dimensions already include these values
                if (typeof window !== 'undefined' && o.id) {
                  const winShift = window as unknown as {
                    __STARLA_JSON_SHIFTED_ELEMENTS__?: Record<
                      string,
                      Record<
                        string,
                        {
                          xDeltaPct: number;
                          yDeltaPct: number;
                          widthPct?: number;
                          heightPct?: number;
                        }
                      >
                    >;
                  };
                  if (!winShift.__STARLA_JSON_SHIFTED_ELEMENTS__) {
                    winShift.__STARLA_JSON_SHIFTED_ELEMENTS__ = {};
                  }
                  if (!winShift.__STARLA_JSON_SHIFTED_ELEMENTS__[parsed.id]) {
                    winShift.__STARLA_JSON_SHIFTED_ELEMENTS__[parsed.id] = {};
                  }
                  winShift.__STARLA_JSON_SHIFTED_ELEMENTS__[parsed.id][o.id] = {
                    xDeltaPct: ov.xDeltaPct || 0,
                    yDeltaPct: ov.yDeltaPct || 0,
                    widthPct: ov.widthPct,
                    heightPct: ov.heightPct,
                  };
                }
                // If admin linked this native button to a non-default slide or popup, retarget gotoplay without removing onrollover/onrollout
                const isNativeDefaultTarget =
                  ov.actionType === 'goto-slide' &&
                  Boolean(ov.targetSlideId) &&
                  NATIVE_DEFAULT_TARGETS[o.id] === ov.targetSlideId;

                if (
                  ov.actionType &&
                  ov.actionType !== 'default' &&
                  !isNativeDefaultTarget
                ) {
                  if (
                    ov.actionType === 'goto-slide' &&
                    ov.targetSlideId &&
                    Boolean(defaultContent.slides[ov.targetSlideId]) &&
                    Array.isArray(o.events)
                  ) {
                    let patchedGoto = false;
                    for (const ev of o.events) {
                      if (Array.isArray(ev?.actions)) {
                        for (const act of ev.actions) {
                          if (act?.kind === 'gotoplay') {
                            act.objRef = {
                              type: 'string',
                              value: `_player.5sAEMI5psmg.${ov.targetSlideId}`,
                            };
                            act.url = `_player.5sAEMI5psmg.${ov.targetSlideId}`;
                            patchedGoto = true;
                            modified = true;
                          }
                        }
                      }
                    }
                    if (!patchedGoto) {
                      const nonReleaseEvents = o.events.filter(
                        (ev: any) => ev?.kind !== 'onrelease'
                      );
                      o.events = [
                        {
                          kind: 'onrelease',
                          actions: [
                            {
                              kind: 'gotoplay',
                              window: '_current',
                              wndtype: 'normal',
                              objRef: {
                                type: 'string',
                                value: `_player.5sAEMI5psmg.${ov.targetSlideId}`,
                              },
                              url: `_player.5sAEMI5psmg.${ov.targetSlideId}`,
                            },
                          ],
                        },
                        ...nonReleaseEvents,
                      ];
                      modified = true;
                    }
                  } else if (Array.isArray(o.events) && o.events.length > 0) {
                    // Custom target slide (e.g. new 360° slide) or embed-popup / open-url:
                    // keep ontransitionin, onrollover, and onrollout intact while removing only native gotoplay from onrelease
                    o.events = o.events
                      .map((ev: any) => {
                        if (ev?.kind !== 'onrelease') return ev;
                        const safeActions = (ev.actions || []).filter(
                          (act: any) => act?.kind !== 'gotoplay'
                        );
                        return { ...ev, actions: safeActions };
                      })
                      .filter(
                        (ev: any) =>
                          ev?.kind !== 'onrelease' ||
                          (Array.isArray(ev.actions) && ev.actions.length > 0)
                      );
                    modified = true;
                  }
                }
              }
              // Do not recurse into stategroup children (whose primary child shares ch.id === o.id at relative 0,0)
              if (Array.isArray(o.objects) && o.kind !== 'stategroup') {
                patchRawObjects(o.objects);
              }
              if (Array.isArray(o.states)) {
                for (const st of o.states) {
                  if (Array.isArray(st?.objects)) {
                    patchRawObjects(st.objects);
                  }
                }
              }
            }
          };
          for (const layer of parsed.slideLayers) {
            if (Array.isArray(layer?.objects)) {
              patchRawObjects(layer.objects);
            }
          }
        }
      }

      // Sync Slide 8 (5jTlwgcUi8o) or any slide with WebObject 360° URL if updated
      if (parsed.id === '5jTlwgcUi8o' || slideCfg?.webObjectUrl) {
        const raw360Url =
          slideCfg?.webObjectUrl || activeContent.appMeta?.canonicalUrl;
        const custom360Url = raw360Url
          ? normalizeSmartEmbedUrl(raw360Url)
          : null;
        if (
          custom360Url &&
          custom360Url !== defaultContent.appMeta.canonicalUrl &&
          Array.isArray(parsed.slideLayers)
        ) {
          for (const layer of parsed.slideLayers) {
            for (const obj of layer.objects || []) {
              if (
                obj.kind === 'webobject' &&
                (obj.url !== custom360Url || obj.html5Url !== custom360Url)
              ) {
                obj.url = custom360Url;
                obj.html5Url = custom360Url;
                modified = true;
              }
            }
          }
        }
      }

      // Sync Slide 40 (6G1VrKuOhCw — Game Anak Garuda) question targetChoice & points overrides
      if (
        parsed.id === '6G1VrKuOhCw' &&
        activeContent.quizzes?.gameAnakGaruda?.questionOverrides &&
        Array.isArray(parsed.slideLayers)
      ) {
        const qOverrides =
          activeContent.quizzes.gameAnakGaruda.questionOverrides;
        const baseLayer = parsed.slideLayers[0];
        if (baseLayer && Array.isArray(baseLayer.objects)) {
          for (const obj of baseLayer.objects) {
            const ov = qOverrides[obj.id];
            if (!ov) continue;

            if (ov.hidden) {
              obj.xPos = -2000;
              obj.yPos = -2000;
              modified = true;
            }

            if (
              (ov.targetChoice || ov.points !== undefined) &&
              Array.isArray(obj.events)
            ) {
              const targetId =
                ov.targetChoice === 'Budaya yang Salah'
                  ? GARUDA_DROP_TARGETS.SALAH_ID
                  : ov.targetChoice === 'Budaya yang Benar'
                  ? GARUDA_DROP_TARGETS.BENAR_ID
                  : null;

              for (const ev of obj.events) {
                if (ev.kind === 'ondragover' && Array.isArray(ev.actions)) {
                  for (const actGroup of ev.actions) {
                    const hasPoinAdjust =
                      Array.isArray(actGroup.thenActions) &&
                      actGroup.thenActions.some(
                        (ta: any) =>
                          ta.kind === 'adjustvar' &&
                          (ta.variable === '_player.poin' ||
                            ta.var === '_player.poin')
                      );
                    if (!hasPoinAdjust) continue;

                    const cmpStmt =
                      actGroup.condition?.statement?.statements?.[0];
                    if (
                      targetId &&
                      cmpStmt &&
                      cmpStmt.kind === 'compare' &&
                      cmpStmt.valueb &&
                      cmpStmt.valueb !== targetId
                    ) {
                      cmpStmt.valueb = targetId;
                      modified = true;
                    }
                    if (
                      targetId &&
                      actGroup.condition?.AND?.[0]?.R?.val &&
                      actGroup.condition.AND[0].R.val !== targetId
                    ) {
                      actGroup.condition.AND[0].R.val = targetId;
                      modified = true;
                    }
                    if (
                      ov.points !== undefined &&
                      Array.isArray(actGroup.thenActions)
                    ) {
                      for (const thenAct of actGroup.thenActions) {
                        if (
                          thenAct.kind === 'adjustvar' &&
                          (thenAct.variable === '_player.poin' ||
                            thenAct.var === '_player.poin')
                        ) {
                          if (
                            thenAct.value &&
                            typeof thenAct.value === 'object'
                          ) {
                            thenAct.value.value = ov.points;
                            modified = true;
                          } else if (
                            thenAct.val &&
                            typeof thenAct.val === 'object'
                          ) {
                            thenAct.val.val = ov.points;
                            modified = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return modified ? JSON.stringify(parsed) : rawJson;
  } catch {
    return rawJson;
  }
}

/**
 * Applies `elementOverrides` and `hiddenElementIds` non-destructively to Storyline's
 * live DOM elements (`#slide-window [data-model-id]`) without scanning slides that have no overrides.
 */
export function applySlideElementOverridesToDom(
  activeContent: ContentSchema
): void {
  if (typeof document === 'undefined') return;
  const slideWindow = document.getElementById('slide-window');
  if (!slideWindow) return;

  if (activeContent === defaultContent) {
    const overriddenEls = slideWindow.querySelectorAll<HTMLElement>(
      '[data-starla-overridden="true"]'
    );
    overriddenEls.forEach((el) => {
      el.style.marginLeft = '';
      el.style.marginTop = '';
      el.style.backgroundImage = '';
      el.style.backgroundSize = '';
      el.style.backgroundRepeat = '';
      el.style.backgroundPosition = '';
      el.removeAttribute('data-starla-custom-bg');
      if (el.dataset.starlaOrigW && el.dataset.starlaOrigH) {
        const origW = parseFloat(el.dataset.starlaOrigW) || 100;
        const origH = parseFloat(el.dataset.starlaOrigH) || 60;
        el.style.width = `${origW}px`;
        el.style.height = `${origH}px`;
        el.querySelectorAll<SVGSVGElement>('svg').forEach((svg) => {
          svg.setAttribute('width', `${origW}`);
          svg.setAttribute('height', `${origH}`);
          svg.style.width = `${origW}px`;
          svg.style.height = `${origH}px`;
          svg.style.opacity = '';
          svg.style.display = '';
        });
      }
      if (el.dataset.starlaOrigDisplay !== undefined) {
        el.style.display = el.dataset.starlaOrigDisplay;
        delete el.dataset.starlaOrigDisplay;
      }
      delete el.dataset.starlaOverridden;
    });
    return;
  }

  // Inject CSS rule to hide internal <svg>/<img> visually when data-starla-custom-bg="true"
  // without setting inline opacity: 0 on <svg> (so Canvg svgHit still parses an opaque shape)
  if (document.head && !document.getElementById('starla-custom-bg-css')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'starla-custom-bg-css';
    styleEl.textContent =
      '[data-starla-custom-bg="true"] svg, [data-starla-custom-bg="true"] img:not([data-starla-keep-img="true"]) { opacity: 0 !important; }';
    document.head.appendChild(styleEl);
  }

  // Ensure separate stacking contexts for base-layer vs feedback/modal slide layers
  // so base-layer buttons never bleed through on top of active feedback/warning layers,
  // while keeping ::before backdrop strictly behind content with pointer-events: none
  // and never forcing pointer-events: auto onto decorative feedback GIFs/banners.
  if (document.head && !document.getElementById('starla-menu-layer-stacking')) {
    const layerStyle = document.createElement('style');
    layerStyle.id = 'starla-menu-layer-stacking';
    layerStyle.textContent =
      '#slide-window .slide-layer.base-layer { z-index: 1 !important; } ' +
      '#slide-window .slide-layer:not(.base-layer) { z-index: 40 !important; isolation: isolate; } ' +
      '#slide-window .slide-layer:not(.base-layer).shown::before { z-index: 0 !important; pointer-events: none !important; } ' +
      '#slide-window .slide-layer:not(.base-layer).shown [data-acc-text*="lanjut" i]:not(.hidden), ' +
      '#slide-window .slide-layer:not(.base-layer).shown [data-acc-text*="7409592"]:not(.hidden), ' +
      '#slide-window .slide-layer:not(.base-layer).shown [data-acc-text*="close" i]:not(.hidden), ' +
      '#slide-window .slide-layer:not(.base-layer).shown [data-acc-text*="tutup" i]:not(.hidden), ' +
      '#slide-window .slide-layer:not(.base-layer).shown [data-acc-text*="silang" i]:not(.hidden), ' +
      '#slide-window .slide-layer:not(.base-layer).shown [data-model-id="67BmTMfY8zv"]:not(.hidden), ' +
      '#slide-window .slide-layer:not(.base-layer).shown [data-model-id="6UTaTWhJ8Dx"]:not(.hidden), ' +
      '#slide-window .slide-layer:not(.base-layer).shown button:not(.hidden) { z-index: 35 !important; pointer-events: auto !important; cursor: pointer !important; }';
    document.head.appendChild(layerStyle);
  }

  // Guard all root <svg> elements inside #slide-window against percentage width/height
  // because Storyline's Canvg svgHit parses svg.parentNode.innerHTML on a detached canvas
  // where viewPort.viewPorts is empty until root <svg> pixel width/height are evaluated.
  // Only scan <svg> elements for percentage width/height if at least one slide actually has a widthPct/heightPct override
  const hasAnySizeOverride = Object.values(activeContent.slides).some(
    (s) =>
      s.elementOverrides &&
      Object.values(s.elementOverrides).some(
        (ov) =>
          (typeof ov.widthPct === 'number' && ov.widthPct > 0) ||
          (typeof ov.heightPct === 'number' && ov.heightPct > 0)
      )
  );

  if (hasAnySizeOverride) {
    slideWindow.querySelectorAll<SVGSVGElement>('svg').forEach((svg) => {
      const attrW = svg.getAttribute('width') || '';
      const attrH = svg.getAttribute('height') || '';
      const styleW = svg.style.width || '';
      const styleH = svg.style.height || '';
      if (
        attrW.includes('%') ||
        attrH.includes('%') ||
        styleW.includes('%') ||
        styleH.includes('%')
      ) {
        const host =
          svg.closest<HTMLElement>('[data-model-id]') ||
          svg.parentElement ||
          slideWindow;
        const vb = (svg.getAttribute('viewBox') || '')
          .trim()
          .split(/[\s,]+/)
          .map(Number);
        const fallbackW =
          (!host.style.width.includes('%') ? parseFloat(host.style.width) : 0) ||
          host.offsetWidth ||
          (vb.length === 4 && vb[2] > 0 ? vb[2] : 100);
        const fallbackH =
          (!host.style.height.includes('%')
            ? parseFloat(host.style.height)
            : 0) ||
          host.offsetHeight ||
          (vb.length === 4 && vb[3] > 0 ? vb[3] : 60);
        const pxW = Math.max(4, Math.round(fallbackW));
        const pxH = Math.max(4, Math.round(fallbackH));
        svg.setAttribute('width', `${pxW}`);
        svg.setAttribute('height', `${pxH}`);
        svg.style.width = `${pxW}px`;
        svg.style.height = `${pxH}px`;
      }
    });
  }

  const winShift =
    typeof window !== 'undefined'
      ? (window as unknown as {
          __STARLA_JSON_SHIFTED_ELEMENTS__?: Record<
            string,
            Record<
              string,
              {
                xDeltaPct: number;
                yDeltaPct: number;
                widthPct?: number;
                heightPct?: number;
              }
            >
          >;
        })
      : {};

  // Live-sync Slide 8 (5jTlwgcUi8o) webobject iframe URL if Slide 8 is currently mounted
  const slide8Cfg = activeContent.slides['5jTlwgcUi8o'];
  if (slide8Cfg?.webObjectUrl) {
    const target360Url = normalizeSmartEmbedUrl(slide8Cfg.webObjectUrl);
    const webObjNode = slideWindow.querySelector<HTMLElement>(
      '[data-model-id="5maQz6EtJQu"]'
    );
    if (webObjNode) {
      const iframeEl = webObjNode.querySelector<HTMLIFrameElement>('iframe');
      if (iframeEl && iframeEl.getAttribute('src') !== target360Url) {
        iframeEl.setAttribute('src', target360Url);
      }
    }
  }

  // Native default goto targets on 5iew2M44w24 so untouched native buttons keep 100% native Storyline behavior
  const NATIVE_DEFAULT_TARGETS: Record<string, string> = {
    '5ZPukeMFffY': '6IgV5Xf2ecV',
    '5Vj2vgTep1J': '6OrD7bra4Ko',
    '5cPSgbCeIlr': '6eHtnAfM3bY',
    '6afmjIda5Z2': '5jTlwgcUi8o',
  };

  for (const slide of Object.values(activeContent.slides)) {
    const overrides = slide.elementOverrides;
    const hiddenIds = slide.hiddenElementIds || [];
    if (
      (!overrides || Object.keys(overrides).length === 0) &&
      hiddenIds.length === 0
    ) {
      continue;
    }

    const allIds = new Set<string>([
      ...Object.keys(overrides || {}),
      ...hiddenIds,
    ]);

    for (const elementId of allIds) {
      const ov = overrides?.[elementId];
      const isHidden = Boolean(ov?.hidden || hiddenIds.includes(elementId));
      const isNativeSameAsset =
        elementId === '5Vj2vgTep1J' &&
        (ov?.customImage === 'mobile/5b7bpGxEsZl.png' ||
          ov?.customImage === 'mobile/cari_tahu.png');
      const hasEffectiveCustomImage = Boolean(
        ov?.customImage && !isNativeSameAsset
      );
      const isNativeDefaultTarget =
        ov?.actionType === 'goto-slide' &&
        Boolean(ov.targetSlideId) &&
        NATIVE_DEFAULT_TARGETS[elementId] === ov.targetSlideId;

      const baked =
        winShift.__STARLA_JSON_SHIFTED_ELEMENTS__?.[slide.id]?.[elementId];
      const netXDeltaPct = (ov?.xDeltaPct || 0) - (baked?.xDeltaPct || 0);
      const netYDeltaPct = (ov?.yDeltaPct || 0) - (baked?.yDeltaPct || 0);
      const hasNetWidthOverride =
        typeof ov?.widthPct === 'number' &&
        ov.widthPct > 0 &&
        Math.abs(ov.widthPct - (baked?.widthPct || 0)) > 0.001;
      const hasNetHeightOverride =
        typeof ov?.heightPct === 'number' &&
        ov.heightPct > 0 &&
        Math.abs(ov.heightPct - (baked?.heightPct || 0)) > 0.001;

      // Fast skip: if element has no visual or behavioral delta from its native/baked Storyline definition, do not query or mutate DOM
      if (
        !isHidden &&
        ov &&
        Math.abs(netXDeltaPct) <= 0.001 &&
        Math.abs(netYDeltaPct) <= 0.001 &&
        !hasNetWidthOverride &&
        !hasNetHeightOverride &&
        !hasEffectiveCustomImage &&
        ov.customText === undefined &&
        (!ov.actionType ||
          ov.actionType === 'default' ||
          isNativeDefaultTarget) &&
        !ov.clickSfxUrl &&
        !ov.hoverSfxUrl &&
        !ov.hoverEffect
      ) {
        const previouslyOverridden = slideWindow.querySelector(
          `[data-model-id="${elementId}"][data-starla-overridden="true"]`
        );
        if (!previouslyOverridden) {
          continue;
        }
      }

      const nodes = slideWindow.querySelectorAll<HTMLElement>(
        `[data-model-id="${elementId}"]`
      );
      if (nodes.length === 0) continue;

      const accNode = document.getElementById(
        `acc-${elementId}`
      ) as HTMLElement | null;

      if (accNode) {
        accNode.style.display = isHidden ? 'none' : '';
      }

      nodes.forEach((el) => {
        // Skip inner stategroup child that shares data-model-id with its outer .slide-object-stategroup parent
        if (
          el.parentElement?.closest(
            `.slide-object-stategroup[data-model-id="${elementId}"]`
          )
        ) {
          return;
        }

        el.dataset.starlaOverridden = 'true';

        if (isHidden) {
          if (el.dataset.starlaOrigDisplay === undefined) {
            el.dataset.starlaOrigDisplay = el.style.display || '';
          }
          el.style.display = 'none';
        } else if (el.dataset.starlaOrigDisplay !== undefined) {
          el.style.display = el.dataset.starlaOrigDisplay;
          delete el.dataset.starlaOrigDisplay;
        }

        if (ov) {
          // Storyline scales .slide-layer and .slide-container to (1280 * winScale) x (720 * winScale).
          // Measure the live scaled stage dimensions so widthPct, heightPct, xDeltaPct, yDeltaPct match 1:1 with the Admin Canvas!
          const stageHost =
            el.closest<HTMLElement>('.slide-layer') ||
            el.closest<HTMLElement>('.slide-transition-container') ||
            el.closest<HTMLElement>('.slide-container') ||
            slideWindow.querySelector<HTMLElement>(
              '.slide-layer, .slide-transition-container, .slide-container'
            );
          const stageW =
            (stageHost && !stageHost.style.width.includes('%')
              ? parseFloat(stageHost.style.width)
              : 0) ||
            stageHost?.offsetWidth ||
            1280;
          const stageH =
            (stageHost && !stageHost.style.height.includes('%')
              ? parseFloat(stageHost.style.height)
              : 0) ||
            stageHost?.offsetHeight ||
            720;

          const baked =
            winShift.__STARLA_JSON_SHIFTED_ELEMENTS__?.[slide.id]?.[elementId];
          const netXDeltaPct = (ov.xDeltaPct || 0) - (baked?.xDeltaPct || 0);
          const netYDeltaPct = (ov.yDeltaPct || 0) - (baked?.yDeltaPct || 0);
          const netWidthOverride =
            ov.widthPct !== undefined &&
            ov.widthPct > 0 &&
            Math.abs(ov.widthPct - (baked?.widthPct || 0)) > 0.001;
          const netHeightOverride =
            ov.heightPct !== undefined &&
            ov.heightPct > 0 &&
            Math.abs(ov.heightPct - (baked?.heightPct || 0)) > 0.001;

          el.style.marginLeft =
            Math.abs(netXDeltaPct) > 0.001
              ? `${Math.round((netXDeltaPct / 100) * stageW)}px`
              : '';
          el.style.marginTop =
            Math.abs(netYDeltaPct) > 0.001
              ? `${Math.round((netYDeltaPct / 100) * stageH)}px`
              : '';

          const hasSizeOverride = netWidthOverride || netHeightOverride;

          if (hasSizeOverride) {
            if (!el.dataset.starlaOrigW) {
              const svgEl = el.querySelector<SVGSVGElement>('svg');
              const svgAttrW = svgEl?.getAttribute('width') || '';
              const parsedSvgW = !svgAttrW.includes('%')
                ? parseFloat(svgAttrW)
                : 0;
              const styleW = !el.style.width.includes('%')
                ? parseFloat(el.style.width)
                : 0;
              el.dataset.starlaOrigW = String(
                styleW || parsedSvgW || el.offsetWidth || 100
              );
            }
            if (!el.dataset.starlaOrigH) {
              const svgEl = el.querySelector<SVGSVGElement>('svg');
              const svgAttrH = svgEl?.getAttribute('height') || '';
              const parsedSvgH = !svgAttrH.includes('%')
                ? parseFloat(svgAttrH)
                : 0;
              const styleH = !el.style.height.includes('%')
                ? parseFloat(el.style.height)
                : 0;
              el.dataset.starlaOrigH = String(
                styleH || parsedSvgH || el.offsetHeight || 60
              );
            }

            const origW = parseFloat(el.dataset.starlaOrigW) || 100;
            const origH = parseFloat(el.dataset.starlaOrigH) || 60;
            el.dataset.starlaResized = 'true';

            const targetW = Math.max(
              4,
              ov.widthPct !== undefined && ov.widthPct > 0
                ? Math.round((ov.widthPct / 100) * stageW)
                : Math.round(origW)
            );
            const targetH = Math.max(
              4,
              ov.heightPct !== undefined && ov.heightPct > 0
                ? Math.round((ov.heightPct / 100) * stageH)
                : Math.round(origH)
            );

            el.style.width = `${targetW}px`;
            el.style.height = `${targetH}px`;

            // IMPORTANT: Always use explicit pixel dimensions (never '100%') on child divs and SVGs
            // and reset negative SVG drop-shadow filter offsets (left/top) to 0px so resized buttons align 1:1.
            const childDivs = el.querySelectorAll<HTMLElement>('div');
            childDivs.forEach((d) => {
              d.style.left = '0px';
              d.style.top = '0px';
              d.style.width = `${targetW}px`;
              d.style.height = `${targetH}px`;
            });
            const childSvgs = el.querySelectorAll<SVGSVGElement>('svg');
            childSvgs.forEach((svg) => {
              if (!svg.getAttribute('viewBox')) {
                const rawAttrW = svg.getAttribute('width') || '';
                const rawAttrH = svg.getAttribute('height') || '';
                const sw =
                  (!rawAttrW.includes('%') ? parseFloat(rawAttrW) : 0) || origW;
                const sh =
                  (!rawAttrH.includes('%') ? parseFloat(rawAttrH) : 0) || origH;
                svg.setAttribute('viewBox', `0 0 ${sw} ${sh}`);
              }
              svg.setAttribute('preserveAspectRatio', 'none');
              svg.setAttribute('width', `${targetW}`);
              svg.setAttribute('height', `${targetH}`);
              svg.style.width = `${targetW}px`;
              svg.style.height = `${targetH}px`;
            });
            const childImgs = el.querySelectorAll<HTMLImageElement>('img');
            childImgs.forEach((img) => {
              img.style.width = `${targetW}px`;
              img.style.height = `${targetH}px`;
              img.style.objectFit = 'fill';
            });
          } else if (
            el.dataset.starlaResized === 'true' &&
            el.dataset.starlaOrigW &&
            el.dataset.starlaOrigH
          ) {
            const origW = parseFloat(el.dataset.starlaOrigW) || 100;
            const origH = parseFloat(el.dataset.starlaOrigH) || 60;
            const restoreW = Math.max(4, Math.round(origW));
            const restoreH = Math.max(4, Math.round(origH));
            el.style.width = `${restoreW}px`;
            el.style.height = `${restoreH}px`;
            el.querySelectorAll<HTMLElement>('div').forEach((d) => {
              d.style.width = `${restoreW}px`;
              d.style.height = `${restoreH}px`;
            });
            el.querySelectorAll<SVGSVGElement>('svg').forEach((svg) => {
              svg.setAttribute('width', `${restoreW}`);
              svg.setAttribute('height', `${restoreH}`);
              svg.style.width = `${restoreW}px`;
              svg.style.height = `${restoreH}px`;
            });
            delete el.dataset.starlaResized;
          }

          // Remove any legacy injected <img> inside el so svg.parentNode.innerHTML stays valid single-root XML for Canvg
          const legacyInjectedImg = el.querySelector<HTMLImageElement>(
            'img[data-starla-custom-img="true"]'
          );
          if (legacyInjectedImg) {
            legacyInjectedImg.remove();
          }

          if (hasEffectiveCustomImage && ov.customImage) {
            const normalizedCustomImg =
              ov.customImage.startsWith('http') ||
              ov.customImage.startsWith('data:') ||
              ov.customImage.startsWith('/')
                ? ov.customImage
                : `/${ov.customImage}`;
            const imgEl = el.querySelector<HTMLImageElement>('img');
            if (imgEl) {
              if (imgEl.getAttribute('src') !== normalizedCustomImg) {
                imgEl.setAttribute('src', normalizedCustomImg);
              }
              imgEl.style.objectFit = 'fill';
            }
            const svgImgs = el.querySelectorAll('image');
            if (svgImgs.length > 0) {
              svgImgs.forEach((svgImg) => {
                svgImg.setAttribute('href', normalizedCustomImg);
                svgImg.setAttribute('xlink:href', normalizedCustomImg);
                svgImg.setAttribute('preserveAspectRatio', 'none');
              });
            }
            // Render replacement image via CSS background on outer [data-model-id] box for 1:1 visual parity
            // with ExactSlideStageCanvas while keeping inner <svg> opaque in innerHTML for Canvg svgHit.
            el.setAttribute('data-starla-custom-bg', 'true');
            el.querySelectorAll<SVGSVGElement>('svg').forEach((svg) => {
              svg.style.display = '';
              svg.style.opacity = '';
            });
            el.style.backgroundImage = `url("${normalizedCustomImg}")`;
            el.style.backgroundSize = '100% 100%';
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundPosition = 'center';
          } else {
            el.removeAttribute('data-starla-custom-bg');
            el.style.backgroundImage = '';
            el.querySelectorAll<SVGSVGElement>('svg').forEach((svg) => {
              svg.style.display = '';
              svg.style.opacity = '';
            });
          }

          if (ov.customText !== undefined) {
            const tspanEl = el.querySelector('tspan');
            if (tspanEl && tspanEl.textContent !== ov.customText) {
              tspanEl.textContent = ov.customText;
            }
          }

          // Bind auto-hover effect, UI button SFX, and custom action trigger on native Storyline buttons/elements
          const hasCustomBehavior = Boolean(
            (ov.actionType &&
              ov.actionType !== 'default' &&
              !isNativeDefaultTarget) ||
              ov.clickSfxUrl ||
              ov.hoverSfxUrl ||
              ov.hoverEffect
          );
          if (hasCustomBehavior) {
            el.style.cursor = 'pointer';
            el.style.transition =
              'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), filter 0.2s ease';
            el.dataset.starlaSlideId = slide.id;
            el.dataset.starlaObjectId = elementId;

            const bindCustomTriggerToNode = (targetNode: HTMLElement) => {
              targetNode.dataset.starlaSlideId = slide.id;
              targetNode.dataset.starlaObjectId = elementId;
              if (targetNode.dataset.starlaTriggerBound) return;
              targetNode.dataset.starlaTriggerBound = 'true';

              targetNode.addEventListener('pointerenter', () => {
                const winAny = window as unknown as {
                  __STARLA_CONTENT__?: ContentSchema;
                };
                const liveOv =
                  winAny.__STARLA_CONTENT__?.slides?.[
                    targetNode.dataset.starlaSlideId || ''
                  ]?.elementOverrides?.[
                    targetNode.dataset.starlaObjectId || ''
                  ];
                if (liveOv?.hoverEffect !== 'none') {
                  el.style.transform = 'scale(1.06)';
                  el.style.filter =
                    'brightness(1.08) drop-shadow(0 6px 14px rgba(37, 99, 235, 0.35))';
                }
                if (liveOv?.hoverSfxUrl && liveOv.hoverSfxUrl !== 'none') {
                  playStudioSoundEffect(liveOv.hoverSfxUrl, 0.45);
                }
              });

              targetNode.addEventListener('pointerleave', () => {
                el.style.transform = '';
                el.style.filter = '';
              });

              // Block Storyline's internal onrelease (mouseup / touchend / pointerup) in capture phase
              // whenever admin has set a custom actionType (e.g. goto-slide, embed-popup, open-url)
              let lastTriggerAt = 0;
              const interceptAndFire = (ev: Event, shouldDispatch: boolean) => {
                const winAny = window as unknown as {
                  __STARLA_CONTENT__?: ContentSchema;
                };
                const sId = targetNode.dataset.starlaSlideId || '';
                const oId = targetNode.dataset.starlaObjectId || '';
                const liveOv =
                  winAny.__STARLA_CONTENT__?.slides?.[sId]?.elementOverrides?.[
                    oId
                  ];
                if (!liveOv) return;

                const isDefaultNativeGoto =
                  liveOv.actionType === 'goto-slide' &&
                  Boolean(liveOv.targetSlideId) &&
                  NATIVE_DEFAULT_TARGETS[oId] === liveOv.targetSlideId;
                const hasActionOverride = Boolean(
                  liveOv.actionType &&
                    liveOv.actionType !== 'default' &&
                    !isDefaultNativeGoto
                );

                if (hasActionOverride) {
                  ev.preventDefault();
                  ev.stopPropagation();
                  if (typeof ev.stopImmediatePropagation === 'function') {
                    ev.stopImmediatePropagation();
                  }
                }

                if (!shouldDispatch) return;

                const now = Date.now();
                if (now - lastTriggerAt < 220) return;
                lastTriggerAt = now;

                if (liveOv.clickSfxUrl && liveOv.clickSfxUrl !== 'none') {
                  playStudioSoundEffect(liveOv.clickSfxUrl, 0.8);
                }

                if (hasActionOverride) {
                  window.dispatchEvent(
                    new CustomEvent('starla:native-element-trigger', {
                      detail: {
                        slideId: sId,
                        objectId: oId,
                        override: liveOv,
                      },
                    })
                  );
                }
              };

              // Intercept press-down events so Storyline doesn't arm its internal release state
              ['pointerdown', 'mousedown', 'touchstart'].forEach((evtName) => {
                targetNode.addEventListener(
                  evtName,
                  (ev) => interceptAndFire(ev, false),
                  true
                );
              });

              // Intercept release and click events and fire our custom action once
              ['pointerup', 'mouseup', 'touchend', 'click'].forEach(
                (evtName) => {
                  targetNode.addEventListener(
                    evtName,
                    (ev) => interceptAndFire(ev, true),
                    true
                  );
                }
              );
            };

            bindCustomTriggerToNode(el);
            if (accNode) {
              bindCustomTriggerToNode(accNode);
            }
          }
        }
      });
    }
  }

  // Bind click action on native Storyline-injected 360° Pameran button ([data-model-id="btn_pameran_360_budaya"])
  // while leaving Storyline's native onrollover/onrollout (_default_Hover state + _parent.63TwMQdlWkR audio) 100% intact
  const nativePameranNode = slideWindow.querySelector<HTMLElement>(
    '[data-model-id="btn_pameran_360_budaya"]'
  );
  if (nativePameranNode) {
    const accPameranNode = document.getElementById(
      'acc-btn_pameran_360_budaya'
    ) as HTMLElement | null;
    const bindNativePameranClick = (node: HTMLElement) => {
      if (node.dataset.starlaPameranBound === 'true') return;
      node.dataset.starlaPameranBound = 'true';
      let lastFireAt = 0;
      const onActivate = () => {
        const now = Date.now();
        if (now - lastFireAt < 250) return;
        lastFireAt = now;
        const winAny = window as unknown as {
          __STARLA_CONTENT__?: ContentSchema;
        };
        const schema = winAny.__STARLA_CONTENT__ || activeContent;
        const pameranCfg = schema.slides['5iew2M44w24']?.canvasElements?.find(
          (el) => el.id === 'btn_pameran_360_budaya'
        );
        const sfx =
          pameranCfg?.clickSfxUrl || 'story_content/6cE4jPpZoR1_44100_56_0.mp3';
        if (sfx && sfx !== 'none') {
          playStudioSoundEffect(sfx, 0.75);
        }
        const targetSlideId =
          pameranCfg?.action?.targetSlideId || 'tur360_pameran_budaya';
        window.dispatchEvent(
          new CustomEvent('starla:native-element-trigger', {
            detail: {
              slideId: '5iew2M44w24',
              objectId: 'btn_pameran_360_budaya',
              override: {
                actionType: pameranCfg?.action?.type || 'goto-slide',
                targetSlideId,
                externalUrl: pameranCfg?.action?.externalUrl,
                popupTitle: pameranCfg?.action?.popupTitle,
                popupContent: pameranCfg?.action?.popupContent,
                popupMediaUrl: pameranCfg?.action?.popupMediaUrl,
                popupMediaType: pameranCfg?.action?.popupMediaType,
              },
            },
          })
        );
      };
      node.addEventListener('click', onActivate);
      node.addEventListener('touchend', onActivate);
    };
    bindNativePameranClick(nativePameranNode);
    if (accPameranNode) {
      bindNativePameranClick(accPameranNode);
    }
  }

  // Slide 37 (604TQFYNuzG): Guarantee the 3 interactive Garuda stategroups (6qAwG9xOHLN, 6ohRzl28MkY, 66egpEZTpSp)
  // and prompt banner (5sRKlbgItqO) are visible (.shown) even if Storyline paused timeline tick 0 waiting on audio context unlock
  const slide37PrimaryIds = [
    '6qAwG9xOHLN',
    '6ohRzl28MkY',
    '66egpEZTpSp',
    '5sRKlbgItqO',
  ];
  if (
    slideWindow.querySelector(
      '[data-model-id="6qAwG9xOHLN"], [data-model-id="5sRKlbgItqO"]'
    )
  ) {
    for (const s37Id of slide37PrimaryIds) {
      slideWindow
        .querySelectorAll<HTMLElement>(`[data-model-id="${s37Id}"]`)
        .forEach((node) => {
          if (node.classList.contains('hidden')) {
            node.classList.remove('hidden');
            node.classList.add('shown');
          }
          if (node.style.opacity === '0') {
            node.style.opacity = '1';
          }
        });
    }
  }

  // Also sync Game Anak Garuda live text overrides if Slide 40 is mounted
  const garudaOverrides =
    activeContent.quizzes?.gameAnakGaruda?.questionOverrides;
  if (garudaOverrides) {
    for (const spec of GARUDA_BIRD_QUESTIONS) {
      const ov = garudaOverrides[spec.birdId];
      if (!ov || ov.text === undefined) continue;
      const textNode = slideWindow.querySelector<HTMLElement>(
        `[data-model-id="${spec.textObjId}"]`
      );
      if (textNode) {
        const tspans = textNode.querySelectorAll('tspan');
        if (tspans.length > 0) {
          const lines = splitStatementIntoBalancedLines(
            ov.text,
            tspans.length,
            26
          );
          tspans.forEach((ts, idx) => {
            const nextTxt = lines[idx] ?? '';
            if (ts.textContent !== nextTxt) {
              ts.textContent = nextTxt;
            }
          });
        }
      }
    }
  }
}

/**
 * Navigates Storyline (or custom slide stage) reliably to `slideId` without getting stuck,
 * unlocks `#starla-front-stage` if needed, and persists `slideId` as the last active slide.
 */
export function navigateStorylineToSlide(
  slideId: string,
  activeContent?: ContentSchema
): boolean {
  if (typeof window === 'undefined' || !slideId) return false;
  try {
    const w = window as any;
    const schema = activeContent || w.__STARLA_CONTENT__ || defaultContent;
    const slideIdx = Math.max(0, schema.slideOrder.indexOf(slideId));

    // Unlock front stage if still closed so slide is visible
    const frontStage = document.getElementById('starla-front-stage');
    if (frontStage) {
      frontStage.style.opacity = '0';
      frontStage.style.pointerEvents = 'none';
      frontStage.style.display = 'none';
      frontStage.classList.add(
        'hidden-stage',
        'is-hidden',
        'is-Unlocked',
        'is-Hidden'
      );
      if (document.body) {
        document.body.classList.add('starla-started');
      }
      w.__starlaFrontOpened = true;
    }

    // Save last active slide immediately
    saveLastActiveSlideState({
      slideId,
      slideIndex: slideIdx,
      frontOpened: true,
    });

    // Notify custom slide stage / Admin listener
    window.dispatchEvent(
      new CustomEvent('starla:slide-changed', {
        detail: { slideId, slideIndex: slideIdx },
      })
    );

    // If native Storyline slide exists in `defaultContent.slides`, trigger Storyline's pubSub navigation
    // only when Storyline's active window slide is not already `slideId` (prevents redundant slide reload/unmount)
    if (defaultContent.slides[slideId]) {
      let currentEngineSlideId: string | null = null;
      try {
        currentEngineSlideId =
          w.StarlaCoreEngine?.getCurrentSlideId?.() ||
          w.DS?.windowManager?.getCurrentWindowSlide?.()?.id ||
          null;
      } catch {
        currentEngineSlideId = null;
      }
      const fullRef = `_player.5sAEMI5psmg.${slideId}`;
      if (
        currentEngineSlideId !== slideId &&
        w.DS &&
        w.DS.pubSub &&
        typeof w.DS.pubSub.trigger === 'function'
      ) {
        w.DS.pubSub.trigger('nextSlide:requesting', fullRef);
      }
      // Anti-stuck watchdog: clear any stuck `.slide-loader` spinner after transition
      window.setTimeout(() => {
        const loaders = document.querySelectorAll<HTMLElement>('.slide-loader');
        loaders.forEach((ld) => {
          ld.style.display = 'none';
        });
      }, 450);
      return true;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Synchronizes real-time updates from `ContentContext` to the active DOM
 * without altering any CSS classes, layout geometry, or audio trigger listeners.
 */
export function syncContentToLiveDom(activeContent: ContentSchema): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  try {
    protectStarlaLocalStorage();

    // 1. Sync document title & meta if updated
    if (
      activeContent.appMeta?.title &&
      document.title !== activeContent.appMeta.title
    ) {
      document.title = activeContent.appMeta.title;
    }

    // 2. Sync Front Stage ACCESS button label if updated
    const accessLabelEl = document.querySelector(
      '#starla-access-btn .starla-access-label'
    );
    if (
      accessLabelEl &&
      activeContent.frontStage?.accessButtonLabel &&
      accessLabelEl.textContent !== activeContent.frontStage.accessButtonLabel
    ) {
      accessLabelEl.textContent = activeContent.frontStage.accessButtonLabel;
    }

    // 3. Apply non-destructive elementOverrides & hiddenElementIds if present
    applySlideElementOverridesToDom(activeContent);

    // 4. Expose active content to window for player & engine inspection
    const win = window as unknown as Record<string, unknown>;
    win.__STARLA_CONTENT__ = activeContent;
  } catch {
    // Ignore DOM sync errors in non-browser environments
  }
}
