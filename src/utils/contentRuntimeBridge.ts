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
      }

      // Sync Slide 8 (5jTlwgcUi8o) WebObject 360° URL if updated
      if (parsed.id === '5jTlwgcUi8o') {
        const custom360Url =
          slideCfg?.webObjectUrl || activeContent.appMeta?.canonicalUrl;
        if (
          custom360Url &&
          custom360Url !== defaultContent.appMeta.canonicalUrl &&
          Array.isArray(parsed.slideLayers)
        ) {
          for (const layer of parsed.slideLayers) {
            for (const obj of layer.objects || []) {
              if (obj.kind === 'webobject' && obj.url !== custom360Url) {
                obj.url = custom360Url;
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
              Array.isArray(obj. events)
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
      if (el.dataset.starlaOrigDisplay !== undefined) {
        el.style.display = el.dataset.starlaOrigDisplay;
        delete el.dataset.starlaOrigDisplay;
      }
      delete el.dataset.starlaOverridden;
    });
    return;
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

      const ov = overrides?.[elementId];
      const isHidden = Boolean(ov?.hidden || hiddenIds.includes(elementId));

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
          el.style.marginLeft =
            ov.xDeltaPct && ov.xDeltaPct !== 0 ? `${ov.xDeltaPct}%` : '';
          el.style.marginTop =
            ov.yDeltaPct && ov.yDeltaPct !== 0 ? `${ov.yDeltaPct}%` : '';
          if (ov.widthPct !== undefined && ov.widthPct > 0) {
            el.style.width = `${ov.widthPct}%`;
          }
          if (ov.heightPct !== undefined && ov.heightPct > 0) {
            el.style.height = `${ov.heightPct}%`;
          }
          if (ov.customImage) {
            const imgEl = el.querySelector<HTMLImageElement>('img');
            if (imgEl && imgEl.src !== ov.customImage) {
              imgEl.src = ov.customImage;
            }
          }
          if (ov.customText !== undefined) {
            const tspanEl = el.querySelector('tspan');
            if (tspanEl && tspanEl.textContent !== ov.customText) {
              tspanEl.textContent = ov.customText;
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
