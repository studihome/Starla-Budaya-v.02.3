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
    return nextState;
  } catch {
    return null;
  }
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

  try {
    const parsed = JSON.parse(rawJson);
    let modified = false;

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
                  o.width = Math.round((ov.widthPct / 100) * 1280);
                  modified = true;
                }
                if (typeof ov.heightPct === 'number' && ov.heightPct > 0) {
                  o.height = Math.round((ov.heightPct / 100) * 720);
                  modified = true;
                }
                // Record that this object's initial JSON coordinates already include these deltas
                if (typeof window !== 'undefined' && o.id) {
                  const winShift = window as unknown as {
                    __STARLA_JSON_SHIFTED_ELEMENTS__?: Record<
                      string,
                      Record<string, { xDeltaPct: number; yDeltaPct: number }>
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
                  };
                }
                // If admin linked this native button to a slide or popup, neutralize or retarget Storyline's internal onrelease events
                if (ov.actionType && ov.actionType !== 'default') {
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
                            act.url = `_player.5sAEMI5psmg.${ov.targetSlideId}`;
                            patchedGoto = true;
                            modified = true;
                          }
                        }
                      }
                    }
                    if (!patchedGoto) {
                      o.events = [
                        {
                          kind: 'onrelease',
                          actions: [
                            {
                              kind: 'gotoplay',
                              window: '_current',
                              wndtype: 'normal',
                              objRef: { type: 'string', value: '_ Montenegro' },
                              url: `_player.5sAEMI5psmg.${ov.targetSlideId}`,
                            },
                          ],
                        },
                      ];
                      modified = true;
                    }
                  } else if (Array.isArray(o.events) && o.events.length > 0) {
                    // Custom target slide (e.g. new 360° slide) or embed-popup / open-url:
                    // clear native gotoplay so Storyline never hijacks the click before starla:native-element-trigger fires
                    o.events = [];
                    modified = true;
                  }
                }
              }
              if (Array.isArray(o.objects)) {
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

  // Guard all root <svg> elements inside #slide-window against percentage width/height
  // because Storyline's Canvg svgHit parses svg.parentNode.innerHTML on a detached canvas
  // where viewPort.viewPorts is empty until root <svg> pixel width/height are evaluated.
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

  const winShift =
    typeof window !== 'undefined'
      ? (window as unknown as {
          __STARLA_JSON_SHIFTED_ELEMENTS__?: Record<
            string,
            Record<string, { xDeltaPct: number; yDeltaPct: number }>
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
      const nodes = slideWindow.querySelectorAll<HTMLElement>(
        `[data-model-id="${elementId}"]`
      );
      if (nodes.length === 0) continue;

      const accNode = document.getElementById(
        `acc-${elementId}`
      ) as HTMLElement | null;

      const ov = overrides?.[elementId];
      const isHidden = Boolean(ov?.hidden || hiddenIds.includes(elementId));

      if (accNode) {
        accNode.style.display = isHidden ? 'none' : '';
      }

      nodes.forEach((el) => {
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
          const baked =
            winShift.__STARLA_JSON_SHIFTED_ELEMENTS__?.[slide.id]?.[elementId];
          const netXDeltaPct = (ov.xDeltaPct || 0) - (baked?.xDeltaPct || 0);
          const netYDeltaPct = (ov.yDeltaPct || 0) - (baked?.yDeltaPct || 0);

          el.style.marginLeft =
            Math.abs(netXDeltaPct) > 0.001
              ? `${Math.round((netXDeltaPct / 100) * 1280)}px`
              : '';
          el.style.marginTop =
            Math.abs(netYDeltaPct) > 0.001
              ? `${Math.round((netYDeltaPct / 100) * 720)}px`
              : '';

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

          if (
            (ov.widthPct !== undefined && ov.widthPct > 0) ||
            (ov.heightPct !== undefined && ov.heightPct > 0)
          ) {
            const targetW = Math.max(
              4,
              ov.widthPct !== undefined && ov.widthPct > 0
                ? Math.round((ov.widthPct / 100) * 1280)
                : Math.round(origW)
            );
            const targetH = Math.max(
              4,
              ov.heightPct !== undefined && ov.heightPct > 0
                ? Math.round((ov.heightPct / 100) * 720)
                : Math.round(origH)
            );

            el.style.width = `${targetW}px`;
            el.style.height = `${targetH}px`;

            // IMPORTANT: Always use explicit pixel dimensions (never '100%') on child divs and SVGs
            // so Storyline's internal Canvg svgHit hit-testing never encounters percentage units on a detached canvas.
            const childDivs = el.querySelectorAll<HTMLElement>('div');
            childDivs.forEach((d) => {
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
              img.style.objectFit = 'contain';
            });
          } else if (el.dataset.starlaOrigW && el.dataset.starlaOrigH) {
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
          }

          // Remove any legacy injected <img> inside el so svg.parentNode.innerHTML stays valid single-root XML for Canvg
          const legacyInjectedImg = el.querySelector<HTMLImageElement>(
            'img[data-starla-custom-img="true"]'
          );
          if (legacyInjectedImg) {
            legacyInjectedImg.remove();
          }

          if (ov.customImage) {
            const normalizedCustomImg =
              ov.customImage.startsWith('http') ||
              ov.customImage.startsWith('data:') ||
              ov.customImage.startsWith('/')
                ? ov.customImage
                : `/${ov.customImage}`;
            let replacedAny = false;
            const imgEl = el.querySelector<HTMLImageElement>('img');
            if (imgEl) {
              if (imgEl.getAttribute('src') !== normalizedCustomImg) {
                imgEl.setAttribute('src', normalizedCustomImg);
              }
              replacedAny = true;
            }
            const svgImgs = el.querySelectorAll('image');
            if (svgImgs.length > 0) {
              svgImgs.forEach((svgImg) => {
                svgImg.setAttribute('href', normalizedCustomImg);
                svgImg.setAttribute('xlink:href', normalizedCustomImg);
              });
              replacedAny = true;
            }
            // If native button was a pure SVG vector path with no <img>/<image>, render replacement image via CSS background on el
            // while keeping the <svg> intact (opacity: 0) so Storyline's Canvg svgHit XML parser and hit bounds work 100% cleanly.
            if (!replacedAny) {
              el.querySelectorAll<SVGSVGElement>('svg').forEach((svg) => {
                svg.style.display = '';
                svg.style.opacity = '0';
              });
              el.style.backgroundImage = `url("${normalizedCustomImg}")`;
              el.style.backgroundSize = 'contain';
              el.style.backgroundRepeat = 'no-repeat';
              el.style.backgroundPosition = 'center';
            } else {
              el.style.backgroundImage = '';
              el.querySelectorAll<SVGSVGElement>('svg').forEach((svg) => {
                svg.style.display = '';
                svg.style.opacity = '';
              });
            }
          } else {
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
            (ov.actionType && ov.actionType !== 'default') ||
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

                const hasActionOverride = Boolean(
                  liveOv.actionType && liveOv.actionType !== 'default'
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
    if (defaultContent.slides[slideId]) {
      const fullRef = `_player.5sAEMI5psmg.${slideId}`;
      if (w.DS && w.DS.pubSub && typeof w.DS.pubSub.trigger === 'function') {
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
