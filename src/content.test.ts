import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultContent, ContentSchema } from './data/defaultContent';
import {
  resolveUpdatedContent,
  applySlidePatch,
  applyQuizQuestionPatch,
  transformStorylineProvideData,
} from './utils/contentRuntimeBridge';
import { getSupabaseEnvConfig } from './context/ContentContext';
import {
  APP_CONTENTS_TABLE,
  MAIN_CONTENT_SLUG,
  MEDIA_ASSETS_BUCKET,
  fetchMainContentFromCloud,
  saveMainContentToCloud,
  uploadMediaAssetToCloud,
  isValidContentSchema,
} from './lib/supabase';

test('defaultContent contains complete extracted static content matching ContentSchema', () => {
  assert.equal(defaultContent.appMeta.title, 'STARLA BUDAYA');
  assert.equal(
    defaultContent.appMeta.canonicalUrl,
    'https://faryzt.github.io/starla-360/'
  );
  assert.equal(defaultContent.frontStage.accessButtonLabel, 'ACCESS');

  // Verify all 43 slides are extracted
  assert.equal(defaultContent.slideOrder.length, 43);
  assert.equal(Object.keys(defaultContent.slides).length, 43);

  // Verify key slides exist
  assert.ok(defaultContent.slides['6AR4SV4ZYat']); // Intro video slide
  assert.ok(defaultContent.slides['5ml7jyaiXGc']); // Login slide
  assert.ok(defaultContent.slides['5dLAzY4SKGI']); // Welcome slide
  assert.ok(defaultContent.slides['6IgV5Xf2ecV']); // Sinema video slide
  assert.ok(defaultContent.slides['5iew2M44w24']); // Menu Materi slide
  assert.ok(defaultContent.slides['6eHtnAfM3bY']); // Menu Utama slide

  // Verify Welcome slide text extraction
  const welcomeSlide = defaultContent.slides['5dLAzY4SKGI'];
  assert.ok(
    welcomeSlide.instructions.some((line) =>
      line.includes('Selamat Datang di Starla Budaya!')
    )
  );
  assert.ok(welcomeSlide.audios.length >= 6);

  // Verify SVG text commandsets (102 text commandsets from paths.js)
  assert.equal(Object.keys(defaultContent.svgTextCommandSets).length, 102);
  assert.deepEqual(defaultContent.svgTextCommandSets['commandset-8'].lines, [
    'sekolah kamu',
  ]);
  assert.deepEqual(defaultContent.svgTextCommandSets['commandset-20'].lines, [
    'nama kamu',
  ]);

  // Verify audio catalog (272 MP3 files)
  assert.equal(Object.keys(defaultContent.audioCatalog).length, 272);

  // Verify Kuis Budaya (10 multiple-choice questions) and Game Anak Garuda (Drag & Drop)
  assert.equal(defaultContent.quizzes.kuisBudaya.questions.length, 10);
  const firstQuestion = defaultContent.quizzes.kuisBudaya.questions[0];
  assert.equal(firstQuestion.slideId, '6oOWqUyP2WL');
  assert.equal(firstQuestion.choices.length, 4);
  assert.equal(firstQuestion.correctChoiceId, 'choice_5jgHNtfhMbA');
  assert.equal(
    firstQuestion.correctAnswerText,
    'saling menghormati perbedaan baju adat'
  );

  assert.equal(defaultContent.quizzes.gameAnakGaruda.slideId, '6G1VrKuOhCw');
  assert.equal(defaultContent.quizzes.gameAnakGaruda.maxPoints, 20);
  assert.equal(defaultContent.variables.length, 78);
  assert.equal(isValidContentSchema(defaultContent), true);
});

test('transformStorylineProvideData preserves 100% bit-for-bit identity when using defaultContent', () => {
  const sampleSlideRaw = fs.readFileSync(
    path.join(process.cwd(), 'html5/data/js/5dLAzY4SKGI.js'),
    'utf8'
  );
  const transformed = transformStorylineProvideData(
    'slide',
    sampleSlideRaw,
    defaultContent
  );
  assert.equal(transformed, sampleSlideRaw);
});

test('real-time updateContent and transformStorylineProvideData apply updates cleanly', () => {
  const updated1: ContentSchema = resolveUpdatedContent(defaultContent, {
    appMeta: {
      ...defaultContent.appMeta,
      title: 'STARLA BUDAYA EDISI BARU',
    },
  });
  assert.equal(updated1.appMeta.title, 'STARLA BUDAYA EDISI BARU');
  assert.equal(defaultContent.appMeta.title, 'STARLA BUDAYA'); // Immutability verified

  const updated2 = applySlidePatch(updated1, '5dLAzY4SKGI', {
    title: 'Slide Sambutan Starla',
  });
  assert.equal(updated2.slides['5dLAzY4SKGI'].title, 'Slide Sambutan Starla');

  const updated3 = applyQuizQuestionPatch(updated2, '6oOWqUyP2WL', {
    questionText: 'Pertanyaan Kuis Budaya Nomor 1 Baru',
  });
  assert.equal(
    updated3.quizzes.kuisBudaya.questions[0].questionText,
    'Pertanyaan Kuis Budaya Nomor 1 Baru'
  );
  assert.equal(
    updated3.svgTextCommandSets['commandset-143'].lines[0],
    'Pertanyaan Kuis Budaya Nomor 1 Baru'
  );

  const mockPathsJson = JSON.stringify({
    Lib: {
      'commandset-143': {
        nodeType: 'g',
        children: [
          {
            nodeType: 'text',
            children: [
              {
                nodeType: 'tspan',
                children: ['Old Line'],
              },
            ],
          },
        ],
      },
    },
  });

  const transformedPathsStr = transformStorylineProvideData(
    'paths',
    mockPathsJson,
    updated3
  );
  const transformedPaths = JSON.parse(transformedPathsStr);
  assert.equal(
    transformedPaths.Lib['commandset-143'].children[0].children[0].children[0],
    'Pertanyaan Kuis Budaya Nomor 1 Baru'
  );
});

test('Tahap 2: Supabase safe fallback when env vars are unset or connection fails', async () => {
  const envCfg = getSupabaseEnvConfig();
  assert.equal(typeof envCfg, 'object');
  assert.ok('url' in envCfg && 'anonKey' in envCfg && 'isConfigured' in envCfg);

  // 1. Fetch with null client falls back to defaultContent without throwing
  const fetchRes = await fetchMainContentFromCloud(null);
  assert.equal(fetchRes.source, 'default');
  assert.equal(fetchRes.content.appMeta.title, 'STARLA BUDAYA');

  // 2. Save with null client falls back to localStorage without throwing
  const modifiedContent = resolveUpdatedContent(defaultContent, {
    appMeta: { ...defaultContent.appMeta, title: 'STARLA FALLBACK SAVE' },
  });
  const saveRes = await saveMainContentToCloud(modifiedContent, null);
  assert.equal(saveRes.success, true);
  assert.equal(saveRes.source, 'localStorage');
  assert.equal(saveRes.content.appMeta.title, 'STARLA FALLBACK SAVE');

  // 3. Upload media with null client falls back to Data URL without throwing
  const sampleBlob = new Blob(['fake-audio-binary-data'], {
    type: 'audio/mpeg',
  });
  const uploadRes = await uploadMediaAssetToCloud(
    sampleBlob,
    'narasi-baru.mp3',
    null
  );
  assert.equal(uploadRes.success, true);
  assert.equal(uploadRes.source, 'localStorage');
  assert.ok(uploadRes.url.startsWith('data:audio/mpeg;base64,'));
  assert.ok(uploadRes.path.includes('narasi-baru.mp3'));

  // 4. Simulated failing Supabase client falls back safely without throwing
  const failingClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: { message: 'Network offline' },
          }),
        }),
      }),
      upsert: async () => ({ error: { message: 'Database unreachable' } }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: { message: 'Storage offline' } }),
      }),
    },
  } as unknown as SupabaseClient;

  const failFetch = await fetchMainContentFromCloud(failingClient);
  assert.equal(failFetch.source, 'default');
  assert.equal(failFetch.error, 'Network offline');
  assert.equal(failFetch.content.appMeta.title, 'STARLA BUDAYA');

  const failSave = await saveMainContentToCloud(modifiedContent, failingClient);
  assert.equal(failSave.success, true);
  assert.equal(failSave.source, 'localStorage');
  assert.equal(failSave.error, 'Database unreachable');

  const failUpload = await uploadMediaAssetToCloud(
    sampleBlob,
    'test.mp3',
    failingClient
  );
  assert.equal(failUpload.success, true);
  assert.equal(failUpload.source, 'localStorage');
  assert.equal(failUpload.error, 'Storage offline');
});

test('Tahap 2: Supabase cloud operations (app_contents slug="main" & media-assets bucket)', async () => {
  let queriedTable = '';
  let queriedCol = '';
  let queriedSlug = '';
  let upsertedPayload: Record<string, unknown> | null = null;
  let uploadedBucket = '';
  let uploadedPath = '';

  const cloudCustomContent = resolveUpdatedContent(defaultContent, {
    appMeta: { ...defaultContent.appMeta, title: 'STARLA CLOUD SUPABASE' },
  });

  const mockSupabaseClient = {
    from: (table: string) => {
      queriedTable = table;
      return {
        select: (col: string) => {
          queriedCol = col;
          return {
            eq: (_field: string, val: string) => {
              queriedSlug = val;
              return {
                maybeSingle: async () => ({
                  data: { content_data: cloudCustomContent },
                  error: null,
                }),
              };
            },
          };
        },
        upsert: async (payload: Record<string, unknown>) => {
          upsertedPayload = payload;
          return { error: null };
        },
      };
    },
    storage: {
      from: (bucket: string) => {
        uploadedBucket = bucket;
        return {
          upload: async (p: string) => {
            uploadedPath = p;
            return { data: { path: p }, error: null };
          },
          getPublicUrl: (p: string) => ({
            data: {
              publicUrl: `https://example.supabase.co/storage/v1/object/public/${bucket}/${p}`,
            },
          }),
        };
      },
    },
  } as unknown as SupabaseClient;

  // Test fetch from app_contents (slug = 'main', column 'content_data')
  const fetched = await fetchMainContentFromCloud(mockSupabaseClient);
  assert.equal(queriedTable, APP_CONTENTS_TABLE);
  assert.equal(queriedCol, 'content_data');
  assert.equal(queriedSlug, MAIN_CONTENT_SLUG);
  assert.equal(fetched.source, 'supabase');
  assert.equal(fetched.content.appMeta.title, 'STARLA CLOUD SUPABASE');

  // Test saveContentToCloud to app_contents
  const saved = await saveMainContentToCloud(
    cloudCustomContent,
    mockSupabaseClient
  );
  assert.equal(saved.success, true);
  assert.equal(saved.source, 'supabase');
  assert.ok(upsertedPayload);
  assert.equal(
    (upsertedPayload as Record<string, unknown>).slug,
    MAIN_CONTENT_SLUG
  );

  // Test uploadMediaToCloud to media-assets bucket
  const mediaBlob = new Blob(['png-bytes'], { type: 'image/png' });
  const uploaded = await uploadMediaAssetToCloud(
    mediaBlob,
    'ikon-budaya.png',
    mockSupabaseClient
  );
  assert.equal(uploaded.success, true);
  assert.equal(uploaded.source, 'supabase');
  assert.equal(uploadedBucket, MEDIA_ASSETS_BUCKET);
  assert.ok(uploadedPath.includes('ikon-budaya.png'));
  assert.ok(
    uploaded.url.includes(
      'https://example.supabase.co/storage/v1/object/public/media-assets/'
    )
  );
});

test('Tahap 3: Admin PIN authentication, route detection (?mode=admin & /admin), and dynamic module management', async () => {
  const {
    DEFAULT_ADMIN_PIN,
    getConfiguredAdminPin,
    verifyAdminPin,
    isAdminRouteActive,
    isSlideHidden,
    addSlideItem,
    reorderSlideItem,
    toggleSlideVisibility,
    deleteSlideItem,
    addSlideInstruction,
    updateSlideInstruction,
    removeSlideInstruction,
    addQuizQuestionItem,
    reorderQuizQuestionItem,
    toggleQuizQuestionVisibility,
    addDragDropStatement,
    updateDragDropStatement,
    removeDragDropStatement,
    exportContentToJsonString,
    parseAndValidateImportedJson,
  } = await import('./features/admin/adminHelpers');

  // 1. PIN Authentication (NEXT_PUBLIC_ADMIN_PIN default 123456)
  assert.equal(DEFAULT_ADMIN_PIN, '123456');
  assert.equal(getConfiguredAdminPin(), '123456');
  assert.equal(verifyAdminPin('123456'), true);
  assert.equal(verifyAdminPin(' 123456 '), true);
  assert.equal(verifyAdminPin('000000'), false);
  assert.equal(verifyAdminPin(''), false);
  assert.equal(verifyAdminPin('999888', '999888'), true);

  // 2. Route & URL detection
  assert.equal(
    isAdminRouteActive({ pathname: '/', search: '?mode=admin' }),
    true
  );
  assert.equal(
    isAdminRouteActive({ pathname: '/admin', search: '' }),
    true
  );
  assert.equal(
    isAdminRouteActive({ pathname: '/', search: '', hash: '#admin' }),
    true
  );
  assert.equal(
    isAdminRouteActive({ pathname: '/', search: '?preview=1&mode=admin' }),
    false
  );
  assert.equal(isAdminRouteActive({ pathname: '/', search: '' }), false);

  // 3. Dynamic Slide Addition, Reordering, Visibility, and Instructions
  const { nextSchema: withNewSlide, createdSlideId } = addSlideItem(
    defaultContent,
    {
      title: 'Slide Eksplorasi Rumah Adat Baru',
      instructions: ['Kenali arsitektur nusantara'],
    }
  );
  assert.equal(withNewSlide.slideOrder.length, 44);
  assert.equal(
    withNewSlide.slides[createdSlideId].title,
    'Slide Eksplorasi Rumah Adat Baru'
  );
  assert.equal(isSlideHidden(withNewSlide, createdSlideId), false);

  const reorderedUp = reorderSlideItem(withNewSlide, createdSlideId, 'up');
  assert.equal(reorderedUp.slideOrder[42], createdSlideId);
  assert.equal(reorderedUp.slides[createdSlideId].slideNumber, 43);

  const hiddenSlideSchema = toggleSlideVisibility(reorderedUp, createdSlideId);
  assert.equal(isSlideHidden(hiddenSlideSchema, createdSlideId), true);

  const unhiddenSlideSchema = toggleSlideVisibility(
    hiddenSlideSchema,
    createdSlideId
  );
  assert.equal(isSlideHidden(unhiddenSlideSchema, createdSlideId), false);

  const withInstruction = addSlideInstruction(
    unhiddenSlideSchema,
    createdSlideId,
    'Poin instruksi kedua'
  );
  assert.equal(withInstruction.slides[createdSlideId].instructions.length, 2);

  const editedInstruction = updateSlideInstruction(
    withInstruction,
    createdSlideId,
    1,
    'Poin instruksi kedua diperbarui'
  );
  assert.equal(
    editedInstruction.slides[createdSlideId].instructions[1],
    'Poin instruksi kedua diperbarui'
  );

  const removedInstruction = removeSlideInstruction(
    editedInstruction,
    createdSlideId,
    1
  );
  assert.equal(
    removedInstruction.slides[createdSlideId].instructions.length,
    1
  );

  const afterDeleteCustomSlide = deleteSlideItem(
    removedInstruction,
    createdSlideId
  );
  assert.equal(afterDeleteCustomSlide.slideOrder.length, 43);

  // 4. Dynamic Quiz Question Addition, Reordering, and Visibility
  const { nextSchema: withNewQuiz, createdQuestion } = addQuizQuestionItem(
    defaultContent,
    {
      questionText: 'Apa semboyan pemersatu bangsa Indonesia?',
      choices: [
        { text: 'Bhinneka Tunggal Ika', isCorrect: true },
        { text: 'Tut Wuri Handayani', isCorrect: false },
      ],
    }
  );
  assert.equal(withNewQuiz.quizzes.kuisBudaya.questions.length, 11);
  assert.equal(
    createdQuestion.correctAnswerText,
    'Bhinneka Tunggal Ika'
  );

  const reorderedQuiz = reorderQuizQuestionItem(
    withNewQuiz,
    createdQuestion.slideId,
    'up'
  );
  assert.equal(
    reorderedQuiz.quizzes.kuisBudaya.questions[9].slideId,
    createdQuestion.slideId
  );

  const toggledQuiz = toggleQuizQuestionVisibility(
    reorderedQuiz,
    createdQuestion.slideId
  );
  assert.equal(
    toggledQuiz.quizzes.kuisBudaya.questions[9].hidden,
    true
  );

  // 5. Game Anak Garuda Drag & Drop Statements
  const withStmt = addDragDropStatement(
    defaultContent,
    'Menghargai kesenian daerah teman'
  );
  const addedStmt =
    withStmt.quizzes.gameAnakGaruda.statements[
      withStmt.quizzes.gameAnakGaruda.statements.length - 1
    ];
  assert.equal(addedStmt.text, 'Menghargai kesenian daerah teman');

  const updatedStmt = updateDragDropStatement(
    withStmt,
    addedStmt.id,
    'Menghormati tarian daerah nusantara'
  );
  assert.equal(
    updatedStmt.quizzes.gameAnakGaruda.statements.find(
      (s) => s.id === addedStmt.id
    )?.text,
    'Menghormati tarian daerah nusantara'
  );

  const removedStmt = removeDragDropStatement(updatedStmt, addedStmt.id);
  assert.equal(
    removedStmt.quizzes.gameAnakGaruda.statements.length,
    defaultContent.quizzes.gameAnakGaruda.statements.length
  );

  // 6. Export & Import Backup JSON validation
  const exportedJson = exportContentToJsonString(withNewSlide);
  const parsedResult = parseAndValidateImportedJson(exportedJson);
  assert.equal(parsedResult.valid, true);
  assert.equal(parsedResult.content?.slideOrder.length, 44);

  const invalidResult = parseAndValidateImportedJson('{"foo":"bar"}');
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.error);
});

test('Tahap 4: Visual Canvas Engine (elementOverrides, hiddenElementIds, canvasElements, 60fps pointer math, 8 resize handles & snap guides)', async () => {
  const {
    RESIZE_HANDLES,
    computeDragPositionPct,
    computeResizeBoundsPct,
    applyElementOverridePatch,
    applyHideNativeElement,
    applyRestoreNativeElement,
    applyAddCanvasElement,
    applyUpdateCanvasElement,
    applyDeleteCanvasElement,
    applyDuplicateCanvasElement,
  } = await import('./features/canvas/canvasMath');

  // 1. 8 Resize Handles verified
  assert.equal(RESIZE_HANDLES.length, 8);
  assert.deepEqual(RESIZE_HANDLES, ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']);

  // 2. Drag percentage conversion + center snap guide (50%)
  const dragNormal = computeDragPositionPct({
    startX: 10,
    startY: 20,
    width: 20,
    height: 10,
    deltaXPx: 72, // +10% of 720px
    deltaYPx: 40.5, // +10% of 405px
    containerWidthPx: 720,
    containerHeightPx: 405,
  });
  assert.equal(dragNormal.x, 20);
  assert.equal(dragNormal.y, 30);
  assert.equal(dragNormal.snapX, null);
  assert.equal(dragNormal.snapY, null);

  // Drag near center (x + width/2 = 40.5 + 10 = 50.5 -> snaps to 40 so center is 50%)
  const dragSnapCenter = computeDragPositionPct({
    startX: 30,
    startY: 35,
    width: 20,
    height: 10,
    deltaXPx: 75.6, // +10.5% -> 40.5%
    deltaYPx: 40.5, // +10% -> 45% (center Y = 50%)
    containerWidthPx: 720,
    containerHeightPx: 405,
  });
  assert.equal(dragSnapCenter.x, 40);
  assert.equal(dragSnapCenter.y, 45);
  assert.equal(dragSnapCenter.snapX, 50);
  assert.equal(dragSnapCenter.snapY, 50);

  // 3. Resize bounds calculation for SE and NW handles
  const resizeSE = computeResizeBoundsPct({
    handle: 'se',
    startX: 20,
    startY: 20,
    startWidth: 25,
    startHeight: 15,
    deltaXPx: 72, // +10%
    deltaYPx: 40.5, // +10%
    containerWidthPx: 720,
    containerHeightPx: 405,
  });
  assert.equal(resizeSE.x, 20);
  assert.equal(resizeSE.y, 20);
  assert.equal(resizeSE.width, 35);
  assert.equal(resizeSE.height, 25);

  const resizeNW = computeResizeBoundsPct({
    handle: 'nw',
    startX: 20,
    startY: 20,
    startWidth: 25,
    startHeight: 15,
    deltaXPx: -36, // -5%
    deltaYPx: -40.5, // -10%
    containerWidthPx: 720,
    containerHeightPx: 405,
  });
  assert.equal(resizeNW.x, 15);
  assert.equal(resizeNW.y, 10);
  assert.equal(resizeNW.width, 30);
  assert.equal(resizeNW.height, 25);

  // 4. Non-destructive elementOverrides & hiddenElementIds + Restore
  const slideId = '5dLAzY4SKGI';
  const nativeObjId = defaultContent.slides[slideId].texts[0].objectId;

  const withOverride = applyElementOverridePatch(
    defaultContent,
    slideId,
    nativeObjId,
    {
      xDeltaPct: 12.5,
      yDeltaPct: -4.2,
      widthPct: 40,
      heightPct: 15,
      customText: 'Teks Kustom Baru',
    }
  );
  assert.equal(
    withOverride.slides[slideId].elementOverrides?.[nativeObjId]?.xDeltaPct,
    12.5
  );
  assert.equal(
    withOverride.slides[slideId].elementOverrides?.[nativeObjId]?.customText,
    'Teks Kustom Baru'
  );

  const afterHideNative = applyHideNativeElement(
    withOverride,
    slideId,
    nativeObjId
  );
  assert.equal(
    afterHideNative.slides[slideId].elementOverrides?.[nativeObjId]?.hidden,
    true
  );
  assert.ok(
    afterHideNative.slides[slideId].hiddenElementIds?.includes(nativeObjId)
  );

  const afterRestoreNative = applyRestoreNativeElement(
    afterHideNative,
    slideId,
    nativeObjId
  );
  assert.equal(
    afterRestoreNative.slides[slideId].elementOverrides?.[nativeObjId]?.hidden,
    false
  );
  assert.ok(
    !afterRestoreNative.slides[slideId].hiddenElementIds?.includes(nativeObjId)
  );

  // 5. CanvasElements CRUD (Add, Update, Duplicate, Delete)
  const { nextSchema: withBtn, createdElement } = applyAddCanvasElement(
    afterRestoreNative,
    slideId,
    {
      type: 'image-button',
      label: 'Jelajahi Candi Borobudur',
      x: 32,
      y: 44,
      width: 28,
      height: 12,
      action: {
        type: 'open-popup',
        popupTitle: 'Candi Borobudur',
        popupContent: 'Warisan budaya dunia di Magelang, Jawa Tengah.',
      },
    }
  );
  assert.equal(withBtn.slides[slideId].canvasElements?.length, 1);
  assert.equal(createdElement.x, 32);
  assert.equal(createdElement.y, 44);
  assert.equal(createdElement.action.type, 'open-popup');

  const updatedBtnSchema = applyUpdateCanvasElement(
    withBtn,
    slideId,
    createdElement.id,
    {
      x: 50,
      y: 60,
      style: {
        ...createdElement.style,
        backgroundColor: '#16A34A',
        hoverEffect: 'glow',
      },
    }
  );
  assert.equal(
    updatedBtnSchema.slides[slideId].canvasElements?.[0].x,
    50
  );
  assert.equal(
    updatedBtnSchema.slides[slideId].canvasElements?.[0].style.backgroundColor,
    '#16A34A'
  );

  const { nextSchema: withDup, duplicatedElement } =
    applyDuplicateCanvasElement(updatedBtnSchema, slideId, createdElement.id);
  assert.ok(duplicatedElement);
  assert.equal(withDup.slides[slideId].canvasElements?.length, 2);
  assert.equal(duplicatedElement?.x, 53); // +3% offset

  const afterDeleteCustom = applyDeleteCanvasElement(
    withDup,
    slideId,
    createdElement.id
  );
  assert.equal(afterDeleteCustom.slides[slideId].canvasElements?.length, 1);
  assert.equal(
    afterDeleteCustom.slides[slideId].canvasElements?.[0].id,
    duplicatedElement?.id
  );
});

test('Tahap 5: VisualStudioAdmin (Undo/Redo >= 20 langkah, Duplikat Slide, Layer Forward/Backward, Lock Posisi & Reset Slide)', async () => {
  const {
    MAX_HISTORY_STEPS,
    createInitialHistoryState,
    pushHistoryState,
    undoHistoryState,
    redoHistoryState,
    applyAddCanvasElement,
    applyReorderCanvasElementLayer,
    applyToggleCanvasElementLock,
    applyResetSingleSlide,
  } = await import('./features/canvas/canvasMath');
  const { duplicateSlideItem } = await import('./features/admin/adminHelpers');

  // 1. Verifikasi Undo & Redo History Stack minimal 20 langkah (MAX_HISTORY_STEPS = 25)
  assert.ok(MAX_HISTORY_STEPS >= 20);
  let hist = createInitialHistoryState<number>(0);
  for (let i = 1; i <= 22; i++) {
    hist = pushHistoryState(hist, i);
  }
  assert.equal(hist.present, 22);
  assert.ok(hist.past.length >= 20);

  // Undo 20 langkah berturut-turut
  for (let step = 0; step < 20; step++) {
    hist = undoHistoryState(hist);
  }
  assert.equal(hist.present, 2);
  assert.equal(hist.future.length, 20);

  // Redo 5 langkah
  for (let step = 0; step < 5; step++) {
    hist = redoHistoryState(hist);
  }
  assert.equal(hist.present, 7);

  // 2. Tambah 2 elemen kanvas, uji Layer Forward/Backward & Lock Posisi
  const slideId = '5ml7jyaiXGc';
  const { nextSchema: s1, createdElement: el1 } = applyAddCanvasElement(
    defaultContent,
    slideId,
    { type: 'image-button', label: 'Tombol Pertama' }
  );
  const { nextSchema: s2, createdElement: el2 } = applyAddCanvasElement(
    s1,
    slideId,
    { type: 'audio-hotspot', label: 'Tombol Suara Kedua' }
  );

  // Naikkan layer el1 (Bring Forward)
  const afterForward = applyReorderCanvasElementLayer(
    s2,
    slideId,
    el1.id,
    'forward'
  );
  const forwardList = afterForward.slides[slideId].canvasElements || [];
  assert.equal(forwardList[1].id, el1.id);

  // Kunci posisi el1
  const afterLock = applyToggleCanvasElementLock(
    afterForward,
    slideId,
    el1.id
  );
  const lockedEl = afterLock.slides[slideId].canvasElements?.find(
    (item) => item.id === el1.id
  );
  assert.equal(lockedEl?.locked, true);

  // 3. Duplikat Slide beserta seluruh canvasElements-nya
  const { nextSchema: withDupSlide, duplicatedSlideId } = duplicateSlideItem(
    afterLock,
    slideId
  );
  assert.ok(duplicatedSlideId);
  assert.equal(withDupSlide.slideOrder.length, 44);
  assert.equal(
    withDupSlide.slides[duplicatedSlideId!].canvasElements?.length,
    2
  );
  assert.notEqual(
    withDupSlide.slides[duplicatedSlideId!].canvasElements?.[0].id,
    el2.id
  );

  // 4. Reset Single Slide ke susunan awal
  const afterResetSlide = applyResetSingleSlide(
    withDupSlide,
    slideId,
    defaultContent.slides[slideId]
  );
  assert.equal(
    afterResetSlide.slides[slideId].canvasElements?.length ?? 0,
    0
  );
});

test('CanvasElement & CanvasActionType schema, shadow presets, pulse hover, objectFit & action fields', async () => {
  const {
    resolveCanvasShadowCss,
    normalizeShadowPreset,
    resolveCanvasHoverStyle,
  } = await import('./data/defaultContent');
  const {
    MIN_ELEMENT_SIZE_PCT,
    createDefaultCanvasElement,
    applyAddCanvasElement,
    applyUpdateCanvasElement,
  } = await import('./features/canvas/canvasMath');
  const typeModule = await import('./data/defaultContent');

  // 1. Minimum element size is 1% (1 - 100%)
  assert.equal(MIN_ELEMENT_SIZE_PCT, 1);

  // 2. Create 'audio-button' element and verify full CanvasElement structure
  const audioBtn = createDefaultCanvasElement('audio-button', 0, {
    width: 1,
    height: 1,
    style: {
      backgroundColor: '#0F172A',
      textColor: '#FBBF24',
      fontSize: 14,
      borderRadius: 999,
      shadow: 'glow',
      hoverEffect: 'pulse',
      objectFit: 'cover',
    },
    action: {
      type: 'external-url',
      targetSlideIndex: 2,
      popupTitle: 'Portal Kebudayaan',
      popupBody: 'Kunjungi portal resmi kebudayaan Nusantara.',
      externalUrl: 'https://kebudayaan.kemdikbud.go.id',
    },
  });

  assert.equal(audioBtn.type, 'audio-button');
  assert.equal(audioBtn.width, 1);
  assert.equal(audioBtn.height, 1);
  assert.equal(audioBtn.style.shadow, 'glow');
  assert.equal(audioBtn.style.hoverEffect, 'pulse');
  assert.equal(audioBtn.style.objectFit, 'cover');
  assert.equal(audioBtn.action.type, 'external-url');
  assert.equal(audioBtn.action.targetSlideIndex, 2);
  assert.equal(
    audioBtn.action.popupBody,
    'Kunjungi portal resmi kebudayaan Nusantara.'
  );
  assert.equal(
    audioBtn.action.externalUrl,
    'https://kebudayaan.kemdikbud.go.id'
  );

  // 3. Verify shadow preset resolver ('none' | 'sm' | 'md' | 'lg' | 'glow')
  assert.equal(resolveCanvasShadowCss('none'), 'none');
  assert.ok(resolveCanvasShadowCss('sm').includes('rgba'));
  assert.ok(resolveCanvasShadowCss('md').includes('rgba'));
  assert.ok(resolveCanvasShadowCss('lg').includes('rgba'));
  assert.ok(resolveCanvasShadowCss('glow').includes('245, 158, 11'));
  assert.equal(normalizeShadowPreset(true), 'md');
  assert.equal(normalizeShadowPreset(false), 'none');
  assert.equal(normalizeShadowPreset('lg'), 'lg');

  // 4. Verify hover effect resolver ('none' | 'scale' | 'lift' | 'pulse')
  assert.equal(resolveCanvasHoverStyle('none', true).transform, 'none');
  assert.equal(resolveCanvasHoverStyle('scale', true).transform, 'scale(1.06)');
  assert.ok(
    resolveCanvasHoverStyle('lift', true).transform.includes('translateY')
  );
  const pulseStyle = resolveCanvasHoverStyle('pulse', true);
  assert.equal(pulseStyle.transform, 'scale(1.04)');
  assert.ok(pulseStyle.boxShadow?.includes('56, 189, 248'));

  // 5. Verify CRUD with CanvasElement on slide schema
  const slideId = '5dLAzY4SKGI';
  const { nextSchema, createdElement } = applyAddCanvasElement(
    defaultContent,
    slideId,
    audioBtn
  );
  assert.equal(nextSchema.slides[slideId].canvasElements?.[0].type, 'audio-button');
  const updated = applyUpdateCanvasElement(
    nextSchema,
    slideId,
    createdElement.id,
    {
      action: {
        type: 'goto-slide',
        targetSlideIndex: 4,
      },
    }
  );
  assert.equal(
    updated.slides[slideId].canvasElements?.[0].action.targetSlideIndex,
    4
  );
  assert.ok(typeof typeModule.resolveCanvasShadowCss === 'function');
});

test('60 FPS Pointer Drag & Resize (move & resize-se) + updateElementTransient + commitToHistory', async () => {
  const {
    computePointerMoveResizePct,
    createInitialHistoryState,
    updateTransientHistoryState,
    commitTransientHistoryState,
    undoHistoryState,
  } = await import('./features/canvas/canvasMath');

  const startElem = { x: 20, y: 30, width: 25, height: 15 };

  // 1. Mode 'move': +108px on 720px width (+15%) and +40.5px on 405px height (+10%)
  const moved = computePointerMoveResizePct({
    mode: 'move',
    startElem,
    startMouseX: 100,
    startMouseY: 100,
    clientX: 208,
    clientY: 140.5,
    stageWidth: 720,
    stageHeight: 405,
    enableSnap: false,
  });
  assert.equal(moved.x, 35);
  assert.equal(moved.y, 40);
  assert.equal(moved.width, 25);
  assert.equal(moved.height, 15);

  // 2. Mode 'resize-se': +72px (+10%) width and -200px (clamped to min 4%) height
  const resizedSE = computePointerMoveResizePct({
    mode: 'resize-se',
    startElem,
    startMouseX: 100,
    startMouseY: 100,
    clientX: 172,
    clientY: -100,
    stageWidth: 720,
    stageHeight: 405,
    enableSnap: false,
    minSizePct: 4,
  });
  assert.equal(resizedSE.x, 20);
  assert.equal(resizedSE.y, 30);
  assert.equal(resizedSE.width, 35);
  assert.equal(resizedSE.height, 4); // Clamped to min 4%

  // 3. Simulate 60 FPS transient pointermove updates followed by a single commitToHistory on pointerup
  const baseline = { x: 20, y: 30 };
  let hist = createInitialHistoryState(baseline);
  for (let frame = 1; frame <= 60; frame++) {
    hist = updateTransientHistoryState(hist, {
      x: Number((20 + frame * 0.25).toFixed(2)),
      y: Number((30 + frame * 0.15).toFixed(2)),
    });
  }
  // During 60fps pointermove, past stack is still 0 (not flooded)
  assert.equal(hist.past.length, 0);
  assert.deepEqual(hist.present, { x: 35, y: 39 });

  // On pointerup, commitToHistory records the entire drag as 1 single Undo step
  hist = commitTransientHistoryState(hist, baseline);
  assert.equal(hist.past.length, 1);
  assert.deepEqual(hist.past[0], { x: 20, y: 30 });

  // Undo restores directly to the pre-drag position in 1 step
  const afterUndo = undoHistoryState(hist);
  assert.deepEqual(afterUndo.present, { x: 20, y: 30 });
});

test('Magic AI Studio: generateMagicCanvasAiLocal generates 3 bottom menu buttons and updates popup content accurately', async () => {
  const {
    generateMagicCanvasAiLocal,
    normalizeAiCanvasElement,
  } = await import('./features/ai/magicAiEngine');

  // 1. Prompt: "Buatkan 3 tombol bergambar menu materi di bagian bawah"
  const resButtons = generateMagicCanvasAiLocal({
    prompt: 'Buatkan 3 tombol bergambar menu materi di bagian bawah',
    slideId: '5iew2M44w24',
    slideTitle: 'Menu Materi Starla Budaya',
    existingElementCount: 0,
  });

  assert.equal(resButtons.mode, 'create-elements');
  assert.equal(resButtons.elements.length, 3);
  resButtons.elements.forEach((el) => {
    assert.equal(el.type, 'image-button');
    assert.ok(el.x >= 0 && el.x <= 100);
    assert.equal(el.y, 78); // Bottom position
    assert.ok(el.width >= 1 && el.width <= 100);
    assert.ok(el.height >= 1 && el.height <= 100);
    assert.equal(el.action.type, 'open-popup');
    assert.ok(el.action.popupTitle && el.action.popupTitle.length > 0);
    assert.ok(el.action.popupContent && el.action.popupContent.length > 10);
  });

  // 2. Prompt: "Buatkan isi materi pop-up untuk tombol ini"
  const sampleTarget = normalizeAiCanvasElement(
    {
      type: 'image-button',
      label: 'Rumah Adat Tongkonan',
      x: 20,
      y: 78,
      width: 24,
      height: 12,
    },
    0
  );

  const resPopup = generateMagicCanvasAiLocal({
    prompt: 'Buatkan isi materi pop-up untuk tombol ini',
    slideId: '5iew2M44w24',
    slideTitle: 'Eksplorasi Rumah Adat',
    existingElementCount: 1,
    selectedElement: sampleTarget,
  });

  assert.equal(resPopup.mode, 'update-selected-popup');
  assert.ok(resPopup.popupUpdate?.popupTitle.includes('Rumah Adat Tongkonan'));
  assert.ok(
    resPopup.popupUpdate?.popupContent &&
      resPopup.popupUpdate.popupContent.length > 20
  );
  assert.equal(
    resPopup.popupUpdate?.popupBody,
    resPopup.popupUpdate?.popupContent
  );
});

test('Per-Element Timeline Animation CSS & Direct DOM Element Overrides + Cleanup Verification', async () => {
  const { resolveCanvasAnimationCss } = await import('./data/defaultContent');
  const {
    createDefaultCanvasElement,
    applyElementOverridePatch,
  } = await import('./features/canvas/canvasMath');

  // 1. Default element starts with 'none' animation
  const defaultEl = createDefaultCanvasElement('image-button', 0);
  assert.deepEqual(defaultEl.animation, {
    type: 'none',
    delay: 0,
    duration: 0.6,
  });
  assert.deepEqual(resolveCanvasAnimationCss(defaultEl.animation), {});

  // 2. All active animation types resolve valid keyframe CSS object with duration & delay
  const fadeCss = resolveCanvasAnimationCss({
    type: 'fade-in',
    delay: 0.5,
    duration: 0.8,
  });
  assert.equal(fadeCss.animationName, 'starlaCanvaFadeIn');
  assert.equal(fadeCss.animationDuration, '0.8s');
  assert.equal(fadeCss.animationDelay, '0.5s');

  const bounceCss = resolveCanvasAnimationCss({
    type: 'bounce',
    delay: 0.2,
    duration: 1.0,
  });
  assert.equal(bounceCss.animationName, 'starlaCanvaBounce');

  // 3. Native element override supports customImage + animation
  const firstSlideId = defaultContent.slideOrder[0];
  const patched = applyElementOverridePatch(
    defaultContent,
    firstSlideId,
    'img_0',
    {
      customImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
      animation: { type: 'pop-zoom', delay: 0.3, duration: 0.7 },
    }
  );
  const ov = patched.slides[firstSlideId].elementOverrides?.['img_0'];
  assert.equal(
    ov?.customImage,
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
  );
  assert.deepEqual(ov?.animation, {
    type: 'pop-zoom',
    delay: 0.3,
    duration: 0.7,
  });
});



