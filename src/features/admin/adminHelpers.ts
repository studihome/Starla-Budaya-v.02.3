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
        : 'mobile/Slide5WPRbcJDCqY.jpg',
    instructions,
    texts: [textBlock],
    audios: [],
    images: [],
    videos: [],
    quizQuestion: null,
    hidden: false,
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
