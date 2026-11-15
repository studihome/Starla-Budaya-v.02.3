import {
  ContentSchema,
  SlideContentItem,
  QuizQuestionItem,
  defaultContent,
} from '../data/defaultContent';

export type ContentUpdater =
  | Partial<ContentSchema>
  | ((prev: ContentSchema) => ContentSchema);

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

  for (let i = 0; i < tspans.length; i++) {
    const lineText = i < newLines.length ? newLines[i] : '';
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
    }

    return modified ? JSON.stringify(parsed) : rawJson;
  } catch {
    return rawJson;
  }
}

/**
 * Applies `elementOverrides` and `hiddenElementIds` non-destructively to Storyline's
 * live DOM elements (`#slide-window [data-model-id]`) without altering default elements.
 */
export function applySlideElementOverridesToDom(
  activeContent: ContentSchema
): void {
  if (typeof document === 'undefined') return;
  const slideWindow = document.getElementById('slide-window');
  if (!slideWindow) return;

  // If using unmodified defaultContent, restore any previously overridden elements and exit
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
      const ov = overrides?.[elementId];
      const isHidden = Boolean(ov?.hidden || hiddenIds.includes(elementId));
      const nodes = slideWindow.querySelectorAll<HTMLElement>(
        `[data-model-id="${elementId}"]`
      );

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
}

/**
 * Synchronizes real-time updates from `ContentContext` to the active DOM
 * without altering any CSS classes, layout geometry, or audio trigger listeners.
 */
export function syncContentToLiveDom(activeContent: ContentSchema): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  try {
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

