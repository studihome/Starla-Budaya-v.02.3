import {
  ContentSchema,
  SlideContentItem,
  QuizQuestionItem,
  QuizChoiceItem,
  SlideTextBlock,
  defaultContent,
} from '../../data/defaultContent';
import { resolveUpdatedContent } from '../../utils/contentRuntimeBridge';
import { isValidContentSchema } from '../../lib/supabase';
import {
  SLIDE_EXACT_META,
  normalizeSmartEmbedUrl,
} from '../../utils/slideExactMeta';

export const DEFAULT_ADMIN_PIN = '123456';

/**
 * Membaca PIN Admin dari environment variable (`NEXT_PUBLIC_ADMIN_PIN` / `VITE_ADMIN_PIN`)
 * dengan fallback ke `'123456'` untuk mode pengembangan.
 */
export function getConfiguredAdminPin(): string {
  let pin = '';

  try {
    if (typeof process !== 'undefined' && process.env) {
      pin =
        process.env.NEXT_PUBLIC_ADMIN_PIN ||
        process.env.VITE_ADMIN_PIN ||
        '';
    }
  } catch {
    // Abaikan jika process tidak tersedia di browser
  }

  try {
    const metaEnv = (
      import.meta as unknown as { env?: Record<string, string | undefined> }
    ).env;
    if (metaEnv) {
      if (!pin) {
        pin =
          metaEnv.NEXT_PUBLIC_ADMIN_PIN ||
          metaEnv.VITE_ADMIN_PIN ||
          '';
      }
    }
  } catch {
    // Abaikan jika import.meta.env tidak tersedia
  }

  try {
    if (typeof window !== 'undefined') {
      const winEnv = (
        window as unknown as { __ENV__?: Record<string, string | undefined> }
      ).__ENV__;
      if (winEnv && !pin) {
        pin =
          winEnv.NEXT_PUBLIC_ADMIN_PIN ||
          winEnv.VITE_ADMIN_PIN ||
          '';
      }
    }
  } catch {
    // Abaikan jika window tidak tersedia
  }

  const trimmed = pin.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_ADMIN_PIN;
}

/**
 * Memverifikasi apakah input PIN sesuai dengan PIN Admin yang dikonfigurasi.
 */
export function verifyAdminPin(
  inputPin: string,
  expectedPin: string = getConfiguredAdminPin()
): boolean {
  if (typeof inputPin !== 'string') return false;
  const cleanedInput = inputPin.trim();
  if (!cleanedInput) return false;
  return cleanedInput === expectedPin.trim();
}

/**
 * Mengecek apakah URL/lokasi saat ini mengaktifkan Admin Dashboard
 * (`?mode=admin`, rute `/admin`, atau hash `#admin`),
 * kecuali jika parameter `?preview=1` aktif (untuk iframe Live Preview).
 */
export function isAdminRouteActive(loc?: {
  pathname?: string;
  search?: string;
  hash?: string;
}): boolean {
  const target =
    loc ??
    (typeof window !== 'undefined' && window.location
      ? window.location
      : { pathname: '/', search: '', hash: '' });

  const search = target.search || '';
  const pathname = target.pathname || '/';
  const hash = target.hash || '';

  // Jangan pernah membuka Admin Dashboard di dalam iframe pratinjau langsung
  if (/[?&]preview=1(&|$)/i.test(search)) {
    return false;
  }

  if (/[?&]mode=admin(&|$)/i.test(search)) {
    return true;
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return true;
  }

  if (hash === '#admin' || hash === '#mode=admin') {
    return true;
  }

  return false;
}

/**
 * Mengecek apakah sebuah slide disembunyikan.
 */
export function isSlideHidden(schema: ContentSchema, slideId: string): boolean {
  const slide = schema.slides[slideId];
  if (slide?.hidden) return true;
  if (Array.isArray(schema.hiddenSlides) && schema.hiddenSlides.includes(slideId)) {
    return true;
  }
  return false;
}

/**
 * Menambah slide baru ke dalam `ContentSchema` beserta blok teks SVG-nya.
 */
export function addSlideItem(
  schema: ContentSchema,
  input: {
    id?: string;
    title: string;
    instructions?: string[];
    backgroundUrl?: string | null;
    backsoundUrl?: string | null;
    backsoundVolume?: number;
    backsoundLoop?: boolean;
    voiceOverUrl?: string | null;
    voiceOverVolume?: number;
    voiceOverAutoplay?: boolean;
    copiedFromSlideId?: string | null;
    customCategory?: SlideContentItem['customCategory'];
    webObjectUrl?: string | null;
  }
): { nextSchema: ContentSchema; createdSlideId: string } {
  const cleanTitle = input.title.trim() || 'Slide Baru';
  const rawId =
    input.id?.trim() ||
    `slide_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const slideId = schema.slides[rawId] ? `${rawId}_new` : rawId;

  const existingIndices = Object.values(schema.svgTextCommandSets).map(
    (cs) => cs.index
  );
  const nextCommandIndex =
    (existingIndices.length > 0 ? Math.max(...existingIndices) : 200) + 1;
  const commandSetId = `commandset-${nextCommandIndex}`;

  const instructions =
    input.instructions && input.instructions.length > 0
      ? input.instructions.map((line) => line.trim()).filter(Boolean)
      : [cleanTitle];

  const textBlock: SlideTextBlock = {
    objectId: `txt_${slideId}`,
    uniqueId: `u_${slideId}`,
    linkId: `txt__default_${slideId}`,
    commandSetId,
    altText: cleanTitle,
    lines: instructions,
  };

  const newSlideNumber = schema.slideOrder.length + 1;
  const has360Intent =
    input.customCategory === 'tur360' ||
    Boolean(input.webObjectUrl && input.webObjectUrl.trim()) ||
    slideId.startsWith('tur360_');
  const resolvedWebObjectUrl = has360Intent
    ? normalizeSmartEmbedUrl(
        input.webObjectUrl,
        'https://faryzt.github.io/starla-360/'
      )
    : input.webObjectUrl ?? null;

  const newSlide: SlideContentItem = {
    id: slideId,
    slideNumber: newSlideNumber,
    title: cleanTitle,
    lmsId: `Slide${newSlideNumber}`,
    jsPath: `html5/data/js/${slideId}.js`,
    width: 720,
    height: 405,
    resume: false,
    backgroundUrl:
      input.backgroundUrl !== undefined
        ? input.backgroundUrl
        : 'mobile/Slide5znCNCeGBCx.jpg',
    webObjectUrl: resolvedWebObjectUrl,
    copiedFromSlideId: input.copiedFromSlideId ?? null,
    backsoundUrl: input.backsoundUrl ?? null,
    backsoundVolume: input.backsoundVolume ?? 0.45,
    backsoundLoop: input.backsoundLoop ?? true,
    voiceOverUrl: input.voiceOverUrl ?? null,
    voiceOverVolume: input.voiceOverVolume ?? 0.9,
    voiceOverAutoplay: input.voiceOverAutoplay ?? true,
    customCategory:
      input.customCategory ?? (has360Intent ? 'tur360' : 'materi'),
    instructions,
    texts: [textBlock],
    audios: [],
    images: [],
    videos: [],
    quizQuestion: null,
    hidden: false,
    elementOverrides: {},
    hiddenElementIds: [],
    canvasElements: [],
  };

  const nextSlideOrder = [...schema.slideOrder, slideId];
  const nextSchema: ContentSchema = {
    ...schema,
    slideOrder: nextSlideOrder,
    slides: {
      ...schema.slides,
      [slideId]: newSlide,
    },
    svgTextCommandSets: {
      ...schema.svgTextCommandSets,
      [commandSetId]: {
        commandSetId,
        index: nextCommandIndex,
        lines: instructions,
      },
    },
  };

  return { nextSchema, createdSlideId: slideId };
}

/**
 * Menyalin (Copy / Duplikat) dari slide yang sudah ada menjadi slide baru yang mandiri,
 * termasuk seluruh objek asli (`copiedFromSlideId`), latar belakang, posisi elemen (`elementOverrides`),
 * tombol kustom (`canvasElements`), tautan embed 360° (`webObjectUrl`), backsound, dan voice over.
 */
export function copySlideItem(
  schema: ContentSchema,
  sourceSlideId: string,
  overrides?: {
    id?: string;
    title?: string;
    backgroundUrl?: string | null;
    backsoundUrl?: string | null;
    voiceOverUrl?: string | null;
    webObjectUrl?: string | null;
    customCategory?: SlideContentItem['customCategory'];
  }
): { nextSchema: ContentSchema; createdSlideId: string } {
  const sourceSlide = schema.slides[sourceSlideId];
  if (!sourceSlide) {
    return addSlideItem(schema, {
      id: overrides?.id,
      title: overrides?.title || 'Slide Salinan Baru',
      backgroundUrl: overrides?.backgroundUrl,
      backsoundUrl: overrides?.backsoundUrl,
      voiceOverUrl: overrides?.voiceOverUrl,
      webObjectUrl: overrides?.webObjectUrl,
      customCategory: overrides?.customCategory,
    });
  }

  const rawId =
    overrides?.id?.trim() ||
    `copy_${sourceSlideId}_${Date.now().toString(36).slice(-4)}`;
  const createdSlideId = schema.slides[rawId] ? `${rawId}_dup` : rawId;
  const newSlideNumber = schema.slideOrder.length + 1;

  const clonedCanvasElements = (sourceSlide.canvasElements || []).map(
    (el, idx) => ({
      ...el,
      id: `ce_${createdSlideId}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
      style: { ...el.style },
      action: { ...el.action },
    })
  );

  const clonedOverrides: NonNullable<SlideContentItem['elementOverrides']> = {};
  if (sourceSlide.elementOverrides) {
    for (const [k, v] of Object.entries(sourceSlide.elementOverrides)) {
      clonedOverrides[k] = { ...v };
    }
  }

  const effectiveSourceMeta =
    SLIDE_EXACT_META[sourceSlide.copiedFromSlideId || sourceSlideId];
  const rawInheritedWebUrl =
    overrides?.webObjectUrl !== undefined
      ? overrides.webObjectUrl
      : sourceSlide.webObjectUrl || effectiveSourceMeta?.webObjectUrl || null;
  const resolvedCopyWebUrl = rawInheritedWebUrl
    ? normalizeSmartEmbedUrl(rawInheritedWebUrl)
    : null;
  const isSource360 =
    sourceSlideId === '5jTlwgcUi8o' ||
    sourceSlide.copiedFromSlideId === '5jTlwgcUi8o' ||
    sourceSlide.customCategory === 'tur360' ||
    effectiveSourceMeta?.category === 'tur360' ||
    Boolean(resolvedCopyWebUrl);

  const newSlide: SlideContentItem = {
    ...sourceSlide,
    id: createdSlideId,
    slideNumber: newSlideNumber,
    title:
      overrides?.title?.trim() || `${sourceSlide.title} (Salinan)`,
    lmsId: `Slide${newSlideNumber}`,
    copiedFromSlideId: sourceSlide.copiedFromSlideId || sourceSlideId,
    backgroundUrl:
      overrides?.backgroundUrl !== undefined
        ? overrides.backgroundUrl
        : sourceSlide.backgroundUrl || effectiveSourceMeta?.backgroundUrl || null,
    webObjectUrl: resolvedCopyWebUrl,
    backsoundUrl:
      overrides?.backsoundUrl !== undefined
        ? overrides.backsoundUrl
        : sourceSlide.backsoundUrl ?? null,
    voiceOverUrl:
      overrides?.voiceOverUrl !== undefined
        ? overrides.voiceOverUrl
        : sourceSlide.voiceOverUrl ??
          sourceSlide.audios?.[0]?.url ??
          null,
    customCategory:
      overrides?.customCategory ??
      (isSource360 ? 'tur360' : sourceSlide.customCategory ?? 'materi'),
    instructions: [...(sourceSlide.instructions || [])],
    texts: (sourceSlide.texts || []).map((t) => ({
      ...t,
      lines: [...t.lines],
    })),
    audios: (sourceSlide.audios || []).map((a) => ({ ...a })),
    images: (sourceSlide.images || []).map((im) => ({ ...im })),
    videos: (sourceSlide.videos || []).map((v) => ({ ...v })),
    elementOverrides: clonedOverrides,
    hiddenElementIds: [...(sourceSlide.hiddenElementIds || [])],
    canvasElements: clonedCanvasElements,
    hidden: false,
  };

  const nextSlideOrder = [...schema.slideOrder, createdSlideId];
  return {
    nextSchema: {
      ...schema,
      slideOrder: nextSlideOrder,
      slides: {
        ...schema.slides,
        [createdSlideId]: newSlide,
      },
    },
    createdSlideId,
  };
}

/**
 * Mengubah urutan slide (naik atau turun) di dalam `slideOrder`.
 */
export function reorderSlideItem(
  schema: ContentSchema,
  slideId: string,
  direction: 'up' | 'down'
): ContentSchema {
  const currentIndex = schema.slideOrder.indexOf(slideId);
  if (currentIndex === -1) return schema;

  const targetIndex =
    direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= schema.slideOrder.length) {
    return schema;
  }

  const nextOrder = [...schema.slideOrder];
  const temp = nextOrder[currentIndex];
  nextOrder[currentIndex] = nextOrder[targetIndex];
  nextOrder[targetIndex] = temp;

  const nextSlides = { ...schema.slides };
  nextOrder.forEach((id, idx) => {
    if (nextSlides[id]) {
      nextSlides[id] = {
        ...nextSlides[id],
        slideNumber: idx + 1,
      };
    }
  });

  return {
    ...schema,
    slideOrder: nextOrder,
    slides: nextSlides,
  };
}

/**
 * Menyembunyikan atau menampilkan kembali sebuah slide.
 */
export function toggleSlideVisibility(
  schema: ContentSchema,
  slideId: string
): ContentSchema {
  const existing = schema.slides[slideId];
  if (!existing) return schema;

  const currentlyHidden = isSlideHidden(schema, slideId);
  const nextHidden = !currentlyHidden;
  const prevHiddenList = Array.isArray(schema.hiddenSlides)
    ? schema.hiddenSlides
    : [];

  const nextHiddenList = nextHidden
    ? Array.from(new Set([...prevHiddenList, slideId]))
    : prevHiddenList.filter((id) => id !== slideId);

  return {
    ...schema,
    hiddenSlides: nextHiddenList,
    slides: {
      ...schema.slides,
      [slideId]: {
        ...existing,
        hidden: nextHidden,
      },
    },
  };
}

/**
 * Menghapus slide tambahan (custom) atau menyembunyikan slide bawaan agar tidak merusak urutan engine.
 */
export function deleteSlideItem(
  schema: ContentSchema,
  slideId: string
): ContentSchema {
  // Jika slide merupakan bagian dari slide bawaan defaultContent, sembunyikan saja untuk menjaga zero-regression
  if (defaultContent.slides[slideId]) {
    if (isSlideHidden(schema, slideId)) return schema;
    return toggleSlideVisibility(schema, slideId);
  }

  if (!schema.slides[slideId]) return schema;

  const nextSlideOrder = schema.slideOrder.filter((id) => id !== slideId);
  const nextSlides = { ...schema.slides };
  delete nextSlides[slideId];

  nextSlideOrder.forEach((id, idx) => {
    if (nextSlides[id]) {
      nextSlides[id] = {
        ...nextSlides[id],
        slideNumber: idx + 1,
      };
    }
  });

  const nextHidden = (schema.hiddenSlides || []).filter((id) => id !== slideId);

  return {
    ...schema,
    slideOrder: nextSlideOrder,
    hiddenSlides: nextHidden,
    slides: nextSlides,
  };
}

/**
 * Menambahkan baris instruksi baru pada slide tertentu.
 */
export function addSlideInstruction(
  schema: ContentSchema,
  slideId: string,
  instructionText: string
): ContentSchema {
  const slide = schema.slides[slideId];
  if (!slide) return schema;

  const cleanText = instructionText.trim() || 'Instruksi baru';
  const nextInstructions = [...slide.instructions, cleanText];

  return {
    ...schema,
    slides: {
      ...schema.slides,
      [slideId]: {
        ...slide,
        instructions: nextInstructions,
      },
    },
  };
}

/**
 * Memperbarui baris instruksi tertentu pada slide.
 */
export function updateSlideInstruction(
  schema: ContentSchema,
  slideId: string,
  index: number,
  instructionText: string
): ContentSchema {
  const slide = schema.slides[slideId];
  if (!slide || index < 0 || index >= slide.instructions.length) return schema;

  const nextInstructions = [...slide.instructions];
  nextInstructions[index] = instructionText;

  return {
    ...schema,
    slides: {
      ...schema.slides,
      [slideId]: {
        ...slide,
        instructions: nextInstructions,
      },
    },
  };
}

/**
 * Menghapus baris instruksi tertentu pada slide.
 */
export function removeSlideInstruction(
  schema: ContentSchema,
  slideId: string,
  index: number
): ContentSchema {
  const slide = schema.slides[slideId];
  if (!slide || index < 0 || index >= slide.instructions.length) return schema;

  const nextInstructions = slide.instructions.filter((_, idx) => idx !== index);

  return {
    ...schema,
    slides: {
      ...schema.slides,
      [slideId]: {
        ...slide,
        instructions: nextInstructions,
      },
    },
  };
}

/**
 * Memperbarui baris teks SVG pada blok teks ke-`textIndex` di dalam sebuah slide.
 */
export function updateSlideTextBlockLines(
  schema: ContentSchema,
  slideId: string,
  textIndex: number,
  lines: string[]
): ContentSchema {
  const slide = schema.slides[slideId];
  if (!slide || textIndex < 0 || textIndex >= slide.texts.length) return schema;

  const targetBlock = slide.texts[textIndex];
  const updatedBlock: SlideTextBlock = {
    ...targetBlock,
    lines: [...lines],
    altText: lines.join(' ').trim() || targetBlock.altText,
  };

  const nextTexts = [...slide.texts];
  nextTexts[textIndex] = updatedBlock;

  const nextCommandSets = { ...schema.svgTextCommandSets };
  if (targetBlock.commandSetId && nextCommandSets[targetBlock.commandSetId]) {
    nextCommandSets[targetBlock.commandSetId] = {
      ...nextCommandSets[targetBlock.commandSetId],
      lines: [...lines],
    };
  }

  return {
    ...schema,
    slides: {
      ...schema.slides,
      [slideId]: {
        ...slide,
        texts: nextTexts,
      },
    },
    svgTextCommandSets: nextCommandSets,
  };
}

/**
 * Menambahkan soal pilihan ganda baru ke dalam `quizzes.kuisBudaya.questions`
 * sekaligus mendaftarkan slide kuis terkait.
 */
export function addQuizQuestionItem(
  schema: ContentSchema,
  input: {
    slideId?: string;
    questionText: string;
    maxPoints?: number;
    choices?: { text: string; isCorrect: boolean }[];
  }
): { nextSchema: ContentSchema; createdQuestion: QuizQuestionItem } {
  const cleanQuestionText =
    input.questionText.trim() || 'Pertanyaan Kuis Budaya Baru';
  const rawSlideId =
    input.slideId?.trim() ||
    `quiz_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const slideId = schema.slides[rawSlideId]
    ? `${rawSlideId}_q`
    : rawSlideId;

  const existingIndices = Object.values(schema.svgTextCommandSets).map(
    (cs) => cs.index
  );
  let nextCsIndex =
    (existingIndices.length > 0 ? Math.max(...existingIndices) : 250) + 1;

  const questionCommandSetId = `commandset-${nextCsIndex++}`;
  const maxPoints = input.maxPoints ?? 10;

  const rawChoices =
    input.choices && input.choices.length >= 2
      ? input.choices
      : [
          { text: 'Pilihan Jawaban A (Benar)', isCorrect: true },
          { text: 'Pilihan Jawaban B', isCorrect: false },
          { text: 'Pilihan Jawaban C', isCorrect: false },
          { text: 'Pilihan Jawaban D', isCorrect: false },
        ];

  // Pastikan minimal ada 1 jawaban benar
  const hasCorrect = rawChoices.some((c) => c.isCorrect);
  const normalizedChoices = rawChoices.map((c, idx) => ({
    text: c.text.trim() || `Pilihan ${idx + 1}`,
    isCorrect: hasCorrect ? c.isCorrect : idx === 0,
  }));

  const nextCommandSets = {
    ...schema.svgTextCommandSets,
    [questionCommandSetId]: {
      commandSetId: questionCommandSetId,
      index: nextCsIndex - 1,
      lines: cleanQuestionText.split('\n'),
    },
  };

  const builtChoices: QuizChoiceItem[] = normalizedChoices.map((ch, idx) => {
    const csId = `commandset-${nextCsIndex++}`;
    nextCommandSets[csId] = {
      commandSetId: csId,
      index: nextCsIndex - 1,
      lines: ch.text.split('\n'),
    };
    return {
      id: `choice_${slideId}_${idx + 1}`,
      objectId: `obj_${slideId}_${idx + 1}`,
      commandSetId: csId,
      text: ch.text,
      isCorrect: ch.isCorrect,
      points: ch.isCorrect ? maxPoints : 0,
    };
  });

  const correctChoice =
    builtChoices.find((c) => c.isCorrect) || builtChoices[0];
  const slideNumber = schema.slideOrder.length + 1;

  const createdQuestion: QuizQuestionItem = {
    slideId,
    slideNumber,
    interactionId: `interaction_${slideId}`,
    type: 'multiplechoice',
    questionText: cleanQuestionText,
    questionCommandSetId,
    maxPoints,
    choices: builtChoices,
    correctChoiceId: correctChoice ? correctChoice.id : null,
    correctAnswerText: correctChoice ? correctChoice.text : null,
    feedbackLayers: {
      correctLayerId: 'layer_correct',
      incorrectLayerId: 'layer_incorrect',
    },
    hidden: false,
  };

  const newSlide: SlideContentItem = {
    id: slideId,
    slideNumber,
    title: cleanQuestionText,
    lmsId: `Kuis_${ schema.quizzes.kuisBudaya.questions.length + 1 }`,
    jsPath: `html5/data/js/${slideId}.js`,
    width: 720,
    height: 405,
    resume: false,
    backgroundUrl: 'mobile/Slide5WPRbcJDCqY.jpg',
    instructions: [
      cleanQuestionText,
      ...builtChoices.map((c) => c.text),
    ],
    texts: [
      {
        objectId: `q_txt_${slideId}`,
        uniqueId: `u_q_${slideId}`,
        linkId: `txt__default_q_${slideId}`,
        commandSetId: questionCommandSetId,
        altText: cleanQuestionText,
        lines: cleanQuestionText.split('\n'),
      },
      ...builtChoices.map((c) => ({
        objectId: c.objectId || c.id,
        uniqueId: `u_${c.id}`,
        linkId: `txt__default_${c.id}`,
        commandSetId: c.commandSetId || null,
        altText: c.text,
        lines: c.text.split('\n'),
      })),
    ],
    audios: [],
    images: [],
    videos: [],
    quizQuestion: createdQuestion,
    hidden: false,
  };

  const nextQuestions = [
    ...schema.quizzes.kuisBudaya.questions,
    createdQuestion,
  ];

  const nextSchema: ContentSchema = {
    ...schema,
    slideOrder: [...schema.slideOrder, slideId],
    slides: {
      ...schema.slides,
      [slideId]: newSlide,
    },
    quizzes: {
      ...schema.quizzes,
      kuisBudaya: {
        ...schema.quizzes.kuisBudaya,
        questions: nextQuestions,
      },
    },
    svgTextCommandSets: nextCommandSets,
  };

  return { nextSchema, createdQuestion };
}

/**
 * Mengubah urutan soal Kuis Budaya (naik atau turun).
 */
export function reorderQuizQuestionItem(
  schema: ContentSchema,
  slideId: string,
  direction: 'up' | 'down'
): ContentSchema {
  const questions = schema.quizzes.kuisBudaya.questions;
  const idx = questions.findIndex((q) => q.slideId === slideId);
  if (idx === -1) return schema;

  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= questions.length) return schema;

  const nextQuestions = [...questions];
  const temp = nextQuestions[idx];
  nextQuestions[idx] = nextQuestions[targetIdx];
  nextQuestions[targetIdx] = temp;

  return {
    ...schema,
    quizzes: {
      ...schema.quizzes,
      kuisBudaya: {
        ...schema.quizzes.kuisBudaya,
        questions: nextQuestions,
      },
    },
  };
}

/**
 * Menyembunyikan atau menampilkan kembali sebuah soal Kuis Budaya.
 */
export function toggleQuizQuestionVisibility(
  schema: ContentSchema,
  slideId: string
): ContentSchema {
  const questions = schema.quizzes.kuisBudaya.questions;
  const target = questions.find((q) => q.slideId === slideId);
  if (!target) return schema;

  const nextHidden = !target.hidden;
  const nextQuestions = questions.map((q) =>
    q.slideId === slideId ? { ...q, hidden: nextHidden } : q
  );

  const nextSlides = { ...schema.slides };
  if (nextSlides[slideId]) {
    nextSlides[slideId] = {
      ...nextSlides[slideId],
      hidden: nextHidden,
      quizQuestion: nextSlides[slideId].quizQuestion
        ? { ...nextSlides[slideId].quizQuestion!, hidden: nextHidden }
        : null,
    };
  }

  return {
    ...schema,
    slides: nextSlides,
    quizzes: {
      ...schema.quizzes,
      kuisBudaya: {
        ...schema.quizzes.kuisBudaya,
        questions: nextQuestions,
      },
    },
  };
}

/**
 * Menghapus soal Kuis Budaya tambahan atau menyembunyikan soal bawaan.
 */
export function deleteQuizQuestionItem(
  schema: ContentSchema,
  slideId: string
): ContentSchema {
  const isDefaultQuestion = defaultContent.quizzes.kuisBudaya.questions.some(
    (q) => q.slideId === slideId
  );
  if (isDefaultQuestion) {
    return toggleQuizQuestionVisibility(schema, slideId);
  }

  const nextQuestions = schema.quizzes.kuisBudaya.questions.filter(
    (q) => q.slideId !== slideId
  );
  const nextSlideOrder = schema.slideOrder.filter((id) => id !== slideId);
  const nextSlides = { ...schema.slides };
  delete nextSlides[slideId];

  return {
    ...schema,
    slideOrder: nextSlideOrder,
    slides: nextSlides,
    quizzes: {
      ...schema.quizzes,
      kuisBudaya: {
        ...schema.quizzes.kuisBudaya,
        questions: nextQuestions,
      },
    },
  };
}

/**
 * Menambahkan pernyataan baru pada Game Anak Garuda (Drag & Drop).
 */
export function addDragDropStatement(
  schema: ContentSchema,
  text: string
): ContentSchema {
  const cleanText = text.trim() || 'Pernyataan Budaya Baru';
  const newId = `stmt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;

  return {
    ...schema,
    quizzes: {
      ...schema.quizzes,
      gameAnakGaruda: {
        ...schema.quizzes.gameAnakGaruda,
        statements: [
          ...schema.quizzes.gameAnakGaruda.statements,
          { id: newId, text: cleanText },
        ],
      },
    },
  };
}

/**
 * Memperbarui teks pernyataan pada Game Anak Garuda (Drag & Drop).
 */
export function updateDragDropStatement(
  schema: ContentSchema,
  statementId: string,
  text: string
): ContentSchema {
  return {
    ...schema,
    quizzes: {
      ...schema.quizzes,
      gameAnakGaruda: {
        ...schema.quizzes.gameAnakGaruda,
        statements: schema.quizzes.gameAnakGaruda.statements.map((st) =>
          st.id === statementId ? { ...st, text } : st
        ),
      },
    },
  };
}

/**
 * Menghapus pernyataan pada Game Anak Garuda (Drag & Drop).
 */
export function removeDragDropStatement(
  schema: ContentSchema,
  statementId: string
): ContentSchema {
  return {
    ...schema,
    quizzes: {
      ...schema.quizzes,
      gameAnakGaruda: {
        ...schema.quizzes.gameAnakGaruda,
        statements: schema.quizzes.gameAnakGaruda.statements.filter(
          (st) => st.id !== statementId
        ),
      },
    },
  };
}

/**
 * Mengubah urutan pernyataan pada Game Anak Garuda (Drag & Drop).
 */
export function reorderDragDropStatement(
  schema: ContentSchema,
  statementId: string,
  direction: 'up' | 'down'
): ContentSchema {
  const statements = schema.quizzes.gameAnakGaruda.statements;
  const idx = statements.findIndex((st) => st.id === statementId);
  if (idx === -1) return schema;

  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= statements.length) return schema;

  const nextStatements = [...statements];
  const temp = nextStatements[idx];
  nextStatements[idx] = nextStatements[targetIdx];
  nextStatements[targetIdx] = temp;

  return {
    ...schema,
    quizzes: {
      ...schema.quizzes,
      gameAnakGaruda: {
        ...schema.quizzes.gameAnakGaruda,
        statements: nextStatements,
      },
    },
  };
}

/**
 * Mengekspor `ContentSchema` menjadi string JSON terformat untuk backup.
 */
export function exportContentToJsonString(schema: ContentSchema): string {
  return JSON.stringify(schema, null, 2);
}

/**
 * Memvalidasi dan mengurai string JSON backup yang diimpor oleh Admin.
 */
export function parseAndValidateImportedJson(rawJson: string): {
  valid: boolean;
  content?: ContentSchema;
  error?: string;
} {
  if (!rawJson || !rawJson.trim()) {
    return {
      valid: false,
      error: 'Data JSON kosong. Silakan tempel atau pilih file JSON backup.',
    };
  }

  try {
    const parsed = JSON.parse(rawJson);
    if (!isValidContentSchema(parsed)) {
      return {
        valid: false,
        error:
          'Format JSON tidak sesuai dengan skema STARLA BUDAYA (pastikan memiliki appMeta, slides, quizzes, dan audioCatalog).',
      };
    }

    const merged = resolveUpdatedContent(defaultContent, parsed);
    return {
      valid: true,
      content: merged,
    };
  } catch (err) {
    return {
      valid: false,
      error: `Gagal membaca JSON: ${err instanceof Error ? err.message : 'Format tidak valid'}`,
    };
  }
}

/**
 * Menduplikasi slide (termasuk seluruh `canvasElements` dengan ID baru, `elementOverrides`, `instructions`, dan `backgroundUrl`)
 * lalu menyisipkannya tepat setelah slide sumber di dalam `slideOrder`.
 */
export function duplicateSlideItem(
  schema: ContentSchema,
  sourceSlideId: string
): { nextSchema: ContentSchema; duplicatedSlideId: string | null } {
  const source = schema.slides[sourceSlideId];
  if (!source) {
    return { nextSchema: schema, duplicatedSlideId: null };
  }

  const duplicatedSlideId = `slide_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const clonedCanvasElements = Array.isArray(source.canvasElements)
    ? source.canvasElements.map((el, idx) => ({
        ...el,
        id: `ce_${Date.now().toString(36)}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
        style: { ...el.style },
        action: { ...el.action },
      }))
    : [];

  const clonedOverrides = source.elementOverrides
    ? JSON.parse(JSON.stringify(source.elementOverrides))
    : {};

  const sourceOrderIdx = schema.slideOrder.indexOf(sourceSlideId);
  const insertIdx =
    sourceOrderIdx !== -1 ? sourceOrderIdx + 1 : schema.slideOrder.length;

  const nextSlideOrder = [
    ...schema.slideOrder.slice(0, insertIdx),
    duplicatedSlideId,
    ...schema.slideOrder.slice(insertIdx),
  ];

  const newSlide: SlideContentItem = {
    ...source,
    id: duplicatedSlideId,
    slideNumber: insertIdx + 1,
    title: `${source.title || 'Slide'} (Salinan)`,
    lmsId: `Slide${nextSlideOrder.length}`,
    jsPath: `html5/data/js/${duplicatedSlideId}.js`,
    instructions: [...(source.instructions || [])],
    texts: (source.texts || []).map((tb) => ({
      ...tb,
      lines: [...tb.lines],
    })),
    audios: [...(source.audios || [])],
    images: [...(source.images || [])],
    videos: [...(source.videos || [])],
    hidden: false,
    elementOverrides: clonedOverrides,
    hiddenElementIds: [...(source.hiddenElementIds || [])],
    canvasElements: clonedCanvasElements,
  };

  const nextSlides: Record<string, SlideContentItem> = {
    ...schema.slides,
    [duplicatedSlideId]: newSlide,
  };

  nextSlideOrder.forEach((id, idx) => {
    if (nextSlides[id]) {
      nextSlides[id] = {
        ...nextSlides[id],
        slideNumber: idx + 1,
      };
    }
  });

  return {
    nextSchema: {
      ...schema,
      slideOrder: nextSlideOrder,
      slides: nextSlides,
    },
    duplicatedSlideId,
  };
}

export const PAMERAN_360_SLIDE_ID = 'tur360_pameran_budaya';
export const PAMERAN_360_EMBED_URL = 'https://faryzt.github.io/Pameran-360/';
export const PAMERAN_360_BUTTON_ID = 'btn_pameran_360_budaya';

/**
 * Menerapkan pembaruan Menu Pilihan Materi (`5iew2M44w24`) & Slide Salinan 360° Pameran (`tur360_pameran_budaya`):
 * 1. Mengganti tombol "Tahukah Kamu?" (`5Vj2vgTep1J` / `5b7bpGxEsZl.png`) dengan tombol "Cari Tahu" (`cari tahu.png`) dengan mempertahankan tautan ke `6OrD7bra4Ko`.
 * 2. Menyalin Slide 360° Budaya (`5jTlwgcUi8o`) menjadi `tur360_pameran_budaya` dengan tautan embed `https://faryzt.github.io/Pameran-360/` lengkap dengan tombol Home.
 * 3. Menambahkan tombol "360° Pameran" (`pameran.png`) tepat di bawah tombol "360° Budaya" serta merapikan susunan vertikal ke-5 tombol menu agar presisi dan bebas tumpang-tindih.
 */
export function applyStarlaMenuAndPameranUpdate(
  schema: ContentSchema
): ContentSchema {
  if (!schema || !schema.slides) return schema;
  let nextSchema = schema;

  // 1. Copy Slide 360° Budaya (5jTlwgcUi8o) -> tur360_pameran_budaya with https://faryzt.github.io/Pameran-360/
  if (!nextSchema.slides[PAMERAN_360_SLIDE_ID]) {
    const copied = copySlideItem(nextSchema, '5jTlwgcUi8o', {
      id: PAMERAN_360_SLIDE_ID,
      title: 'Eksplorasi Tur Virtual 360° Pameran Budaya',
      webObjectUrl: PAMERAN_360_EMBED_URL,
      customCategory: 'tur360',
      backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
    });
    nextSchema = copied.nextSchema;
    if (nextSchema.slides[PAMERAN_360_SLIDE_ID]) {
      nextSchema = {
        ...nextSchema,
        slides: {
          ...nextSchema.slides,
          [PAMERAN_360_SLIDE_ID]: {
            ...nextSchema.slides[PAMERAN_360_SLIDE_ID],
            instructions: [
              'Penjelajahan panorama interaktif 360° Pameran Budaya Nusantara melalui tautan embed web interaktif (https://faryzt.github.io/Pameran-360/).',
            ],
            webObjectUrl: PAMERAN_360_EMBED_URL,
            customCategory: 'tur360',
            copiedFromSlideId: '5jTlwgcUi8o',
          },
        },
      };
    }
  } else {
    const existingPameran = nextSchema.slides[PAMERAN_360_SLIDE_ID];
    if (
      !existingPameran.webObjectUrl ||
      existingPameran.customCategory !== 'tur360' ||
      existingPameran.copiedFromSlideId !== '5jTlwgcUi8o'
    ) {
      nextSchema = {
        ...nextSchema,
        slides: {
          ...nextSchema.slides,
          [PAMERAN_360_SLIDE_ID]: {
            ...existingPameran,
            webObjectUrl:
              existingPameran.webObjectUrl || PAMERAN_360_EMBED_URL,
            customCategory: 'tur360',
            copiedFromSlideId: '5jTlwgcUi8o',
          },
        },
      };
    }
    if (!nextSchema.slideOrder.includes(PAMERAN_360_SLIDE_ID)) {
      nextSchema = {
        ...nextSchema,
        slideOrder: [...nextSchema.slideOrder, PAMERAN_360_SLIDE_ID],
      };
    }
  }

  // 2. Replace 5Vj2vgTep1J (5b7bpGxEsZl.png) with "cari tahu.png", keep original horizontal xPos (xDeltaPct: 0) and native SVG rendering, and tidy vertical spacing (yDeltaPct) so all 5 menu buttons fit cleanly on Slide 5iew2M44w24
  const menuSlide = nextSchema.slides['5iew2M44w24'];
  if (!menuSlide) return nextSchema;

  const rawExistingOverrides = menuSlide.elementOverrides || {};
  const existingCanvasEls = menuSlide.canvasElements || [];

  // Clean up any legacy auto-tidied position/size shifts from previous sessions so native buttons use the clean vertical stack with native SVG width/height
  const LEGACY_AUTO_Y_DELTAS = new Set([
    0, -5, -3.6111, -6.3889, -6.6667, -7.7778, -8.4722, -8.6111, -8.8889,
  ]);
  const cleanNativeOverride = (
    id: string,
    defaults: NonNullable<SlideContentItem['elementOverrides']>[string]
  ) => {
    const prev = rawExistingOverrides[id];
    if (!prev) return defaults;
    const isLegacyAutoShift =
      (typeof prev.yDeltaPct === 'number' &&
        LEGACY_AUTO_Y_DELTAS.has(Number(prev.yDeltaPct.toFixed(4)))) ||
      prev.widthPct !== undefined ||
      prev.heightPct !== undefined;
    if (isLegacyAutoShift) {
      return {
        ...defaults,
      };
    }
    return {
      ...defaults,
      ...prev,
    };
  };

  const defaultNativeOverrides: NonNullable<
    SlideContentItem['elementOverrides']
  > = {
    // 1. SINEMA (5ZPukeMFffY) — original xPos: 746, width: 306, height: 102 (centerX: 899); tidied yPos: 44 (-60px = -8.3333%)
    '5ZPukeMFffY': cleanNativeOverride('5ZPukeMFffY', {
      xDeltaPct: 0,
      yDeltaPct: -8.3333,
      customLabel: 'Sinema',
      actionType: 'goto-slide' as const,
      targetSlideId: '6IgV5Xf2ecV',
    }),
    // 2. CARI TAHU (5Vj2vgTep1J) — original xPos: 719, width: 360, height: 154 (centerX: 899); tidied yPos: 132 (-76px = -10.5556%), image replaced by cari tahu.png (5b7bpGxEsZl.png), link to 6OrD7bra4Ko
    '5Vj2vgTep1J': cleanNativeOverride('5Vj2vgTep1J', {
      xDeltaPct: 0,
      yDeltaPct: -10.5556,
      customImage: 'mobile/5b7bpGxEsZl.png',
      customLabel: 'Cari Tahu',
      actionType: 'goto-slide' as const,
      targetSlideId: '6OrD7bra4Ko',
    }),
    // 3. BERMAIN (5cPSgbCeIlr) — original xPos: 743, width: 312, height: 123 (centerX: 899); tidied yPos: 266 (-94px = -13.0556%)
    '5cPSgbCeIlr': cleanNativeOverride('5cPSgbCeIlr', {
      xDeltaPct: 0,
      yDeltaPct: -13.0556,
      customLabel: 'Bermain',
      actionType: 'goto-slide' as const,
      targetSlideId: '6eHtnAfM3bY',
    }),
    // 4. 360° BUDAYA (6afmjIda5Z2) — original xPos: 691, width: 416, height: 136 (centerX: 899); tidied yPos: 394 (-86px = -11.9444%)
    '6afmjIda5Z2': cleanNativeOverride('6afmjIda5Z2', {
      xDeltaPct: 0,
      yDeltaPct: -11.9444,
      customLabel: '360° Budaya',
      actionType: 'goto-slide' as const,
      targetSlideId: '5jTlwgcUi8o',
    }),
  };

  if (!defaultNativeOverrides['5Vj2vgTep1J'].customImage) {
    defaultNativeOverrides['5Vj2vgTep1J'].customImage =
      'mobile/5b7bpGxEsZl.png';
  }

  const pameranButtonSpec = {
    id: PAMERAN_360_BUTTON_ID,
    type: 'image-button' as const,
    label: '360° Pameran',
    x: 55.2344,
    y: 74.1667,
    width: 30,
    height: 15.8333,
    zIndex: 35,
    imageUrl: 'mobile/pameran.png',
    clickSfxUrl: 'story_content/6cE4jPpZoR1_44100_56_0.mp3',
    style: {
      backgroundColor: 'transparent',
      textColor: '#ffffff',
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      fontSize: 16,
      fontWeight: 'bold' as const,
      textAlign: 'center' as const,
      opacity: 1,
      textPosition: 'hidden' as const,
    },
    action: {
      type: 'goto-slide' as const,
      targetSlideId: PAMERAN_360_SLIDE_ID,
    },
  };

  const hasPameranButton = existingCanvasEls.some(
    (el) =>
      el.id === PAMERAN_360_BUTTON_ID ||
      el.action?.targetSlideId === PAMERAN_360_SLIDE_ID
  );

  // 5. 360° PAMERAN (pameran.png) tepat di bawah tombol 360° Budaya (yPos: 394, height: 136 -> bottom: 530) -> x=707 (55.2344%, centerX: 899), y=534 (74.1667%), w=384 (30%), h=114 (15.8333%) -> bottom: 648 (72px safe margin from bottom)
  const nextCanvasEls = hasPameranButton
    ? existingCanvasEls.map((el) =>
        el.id === PAMERAN_360_BUTTON_ID &&
        (Math.abs(el.y - 74.4444) < 0.05 ||
          Math.abs(el.y - 83.3333) < 0.05 ||
          Math.abs(el.y - 80) < 0.05)
          ? {
              ...el,
              x: pameranButtonSpec.x,
              y: pameranButtonSpec.y,
              width: pameranButtonSpec.width,
              height: pameranButtonSpec.height,
            }
          : el
      )
    : [...existingCanvasEls, pameranButtonSpec];

  const updatedImages = (menuSlide.images || []).map((im) =>
    im.objectId === '5Vj2vgTep1J'
      ? { ...im, altText: 'cari tahu.png', url: 'story_content/5b7bpGxEsZl.png' }
      : im
  );

  return {
    ...nextSchema,
    slides: {
      ...nextSchema.slides,
      '5iew2M44w24': {
        ...menuSlide,
        images: updatedImages,
        elementOverrides: {
          ...rawExistingOverrides,
          ...defaultNativeOverrides,
        },
        canvasElements: nextCanvasEls,
      },
    },
  };
}


