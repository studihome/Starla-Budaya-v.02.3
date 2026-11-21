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

test('Audit & Smart Classification: Materi Budaya only contains Materi slides, all 43 slides have smart names, and unused legacy files are removed', async () => {
  const {
    SLIDE_EXACT_META,
    getSmartSlideMeta,
    getMateriBudayaSlides,
  } = await import('./utils/slideExactMeta');

  // 1. All 43 slides have exact smart metadata and no "Untitled Slide"
  assert.equal(Object.keys(SLIDE_EXACT_META).length, 43);
  for (const slideId of defaultContent.slideOrder) {
    const meta = getSmartSlideMeta(slideId, defaultContent.slides[slideId]);
    assert.ok(meta.smartTitle.length > 5);
    assert.notEqual(meta.smartTitle, 'Untitled Slide');
    assert.ok(!meta.smartSummary.includes('%_player'));
  }

  // 2. Materi Budaya filter returns ONLY the 17 pure cultural material slides
  const materiList = getMateriBudayaSlides(
    defaultContent.slideOrder,
    defaultContent.slides
  );
  assert.equal(materiList.length, 17);
  assert.equal(materiList[0].slide.id, '6OrD7bra4Ko');
  assert.ok(materiList[0].meta.smartTitle.includes('Apa itu Budaya?'));

  const materiIds = new Set(materiList.map((m) => m.slide.id));
  // Ensure non-materi slides (Login, 360°, Quiz, Drag & Drop, Results) are NOT in Materi Budaya
  assert.equal(materiIds.has('5ml7jyaiXGc'), false); // Login
  assert.equal(materiIds.has('5jTlwgcUi8o'), false); // 360° Budaya
  assert.equal(materiIds.has('6oOWqUyP2WL'), false); // Quiz #1
  assert.equal(materiIds.has('6G1VrKuOhCw'), false); // Gim Anak Garuda
  assert.equal(materiIds.has('6ddgVMlBGEg'), false); // Results

  // 3. Verify all 10 unused legacy files are removed
  const removedFiles = [
    'src/CanvaStudio.tsx',
    'src/StarlaAdminStudio.tsx',
    'src/features/admin/VisualStudioAdmin.tsx',
    'src/features/admin/AdminDashboard.tsx',
    'src/features/admin/LivePreviewPane.tsx',
    'src/features/admin/adminStyles.ts',
    'src/features/canvas/CanvasStageOverlay.tsx',
    'src/features/canvas/CanvasPropertyInspector.tsx',
    'src/features/canvas/EditableWrapper.tsx',
    'src/types/canvas.ts',
  ];
  for (const relPath of removedFiles) {
    assert.equal(
      fs.existsSync(path.join(process.cwd(), relPath)),
      false,
      `Expected ${relPath} to be deleted`
    );
  }
});

test('Smart Logic: 10 Game Anak Garuda Bird Questions, 360° Slide + Image Button Linker, and Last-Slide Refresh Persistence', async () => {
  const {
    GARUDA_BIRD_QUESTIONS,
    GARUDA_DROP_TARGETS,
    STARLA_BUTTON_PRESETS,
    getTur360Slides,
    getSmartSlideMeta,
  } = await import('./utils/slideExactMeta');
  const {
    applyGarudaBirdQuestionPatch,
    splitStatementIntoBalancedLines,
    saveLastActiveSlideState,
    loadLastActiveSlideState,
    protectStarlaLocalStorage,
  } = await import('./utils/contentRuntimeBridge');
  const { addSlideItem } = await import('./features/admin/adminHelpers');
  const { applyAddCanvasElement } = await import('./features/canvas/canvasMath');

  // 1. Verify all 10 Bird Questions of Game Anak Garuda (Slide 40 - 6G1VrKuOhCw)
  assert.equal(GARUDA_BIRD_QUESTIONS.length, 10);
  assert.ok(STARLA_BUTTON_PRESETS.length >= 6);
  const q1 = GARUDA_BIRD_QUESTIONS[0];
  assert.equal(q1.birdId, '6XfIWrI4Giy');
  assert.equal(q1.commandSetId, 'commandset-349');
  assert.equal(q1.defaultTarget, 'Budaya yang Benar');

  // Patch Bird #1: change statement text, flip targetChoice to 'Budaya yang Salah', and set points to 30
  const patchedGaruda = applyGarudaBirdQuestionPatch(
    defaultContent,
    '6XfIWrI4Giy',
    {
      text: 'Menolak bekerja sama dengan teman yang berbeda suku daerah',
      targetChoice: 'Budaya yang Salah',
      points: 30,
    }
  );

  const lines = splitStatementIntoBalancedLines(
    'Menolak bekerja sama dengan teman yang berbeda suku daerah',
    3,
    26
  );
  assert.ok(lines.length >= 2);
  assert.deepEqual(
    patchedGaruda.svgTextCommandSets['commandset-349'].lines,
    lines
  );
  assert.equal(
    patchedGaruda.quizzes.gameAnakGaruda.questionOverrides?.['6XfIWrI4Giy']
      ?.targetChoice,
    'Budaya yang Salah'
  );
  assert.equal(
    patchedGaruda.quizzes.gameAnakGaruda.questionOverrides?.['6XfIWrI4Giy']
      ?.points,
    30
  );

  // Verify transformStorylineProvideData patches 6G1VrKuOhCw.js runtime payload with updated targetId & points
  const rawSlide40Js = fs.readFileSync(
    path.join(process.cwd(), 'html5/data/js/6G1VrKuOhCw.js'),
    'utf8'
  );
  let rawSlide40Json = '';
  const fnExtract = new Function('window', rawSlide40Js);
  fnExtract({
    globalProvideData: (_kind: string, jsonStr: string) => {
      rawSlide40Json = jsonStr;
    },
  });

  const transformedSlide40Str = transformStorylineProvideData(
    'slide',
    rawSlide40Json,
    patchedGaruda
  );
  const transformedSlide40 = JSON.parse(transformedSlide40Str);
  const bird1Obj = transformedSlide40.slideLayers[0].objects.find(
    (o: any) => o.id === '6XfIWrI4Giy'
  );
  const dragOverEvent = bird1Obj.events.find(
    (ev: any) => ev.kind === 'ondragover'
  );
  const scoringIfAction = dragOverEvent.actions.find(
    (act: any) =>
      Array.isArray(act.thenActions) &&
      act.thenActions.some((ta: any) => ta.variable === '_player.poin')
  );
  assert.ok(scoringIfAction);
  assert.equal(
    scoringIfAction.condition.statement.statements[0].valueb,
    GARUDA_DROP_TARGETS.SALAH_ID
  );
  const poinAction = scoringIfAction.thenActions.find(
    (a: any) => a.variable === '_player.poin'
  );
  assert.equal(poinAction.value.value, 30);

  // 2. Verify Adding a New 360° Budaya Slide + Attaching an Image Button on Slide 43 (`5iew2M44w24`)
  const custom360SlideId = 'tur360_custom_borobudur';
  const { nextSchema: with360Slide } = addSlideItem(defaultContent, {
    id: custom360SlideId,
    title: 'Eksplorasi Tur Virtual 360° Candi Borobudur',
    instructions: ['Tur 360° Candi Borobudur'],
  });
  with360Slide.slides[custom360SlideId].webObjectUrl =
    'https://faryzt.github.io/starla-360/?scene=borobudur';
  with360Slide.slides[custom360SlideId].customCategory = 'tur360';

  const tur360Slides = getTur360Slides(
    with360Slide.slideOrder,
    with360Slide.slides
  );
  assert.equal(tur360Slides.length, 2); // Slide 8 + new custom 360 slide
  const customMeta = getSmartSlideMeta(
    custom360SlideId,
    with360Slide.slides[custom360SlideId]
  );
  assert.equal(customMeta.category, 'tur360');
  assert.equal(
    customMeta.webObjectUrl,
    'https://faryzt.github.io/starla-360/?scene=borobudur'
  );

  // Attach an uploaded Image Button (100% pure image, transparent background) on Menu Materi Slide 43 (`5iew2M44w24`) linking to `tur360_custom_borobudur`
  const { nextSchema: withMenuBtn, createdElement } = applyAddCanvasElement(
    with360Slide,
    '5iew2M44w24',
    {
      type: 'image-button',
      label: 'Tur 360° Borobudur',
      imageUrl: STARLA_BUTTON_PRESETS[0].imageUrl,
      style: {
        backgroundColor: 'transparent',
        borderRadius: 0,
        textPosition: 'hidden',
      },
      action: {
        type: 'goto-slide',
        targetSlideId: custom360SlideId,
      },
    }
  );
  assert.equal(createdElement.action.type, 'goto-slide');
  assert.equal(createdElement.action.targetSlideId, custom360SlideId);
  assert.equal(createdElement.style?.backgroundColor, 'transparent');
  assert.equal(createdElement.style?.textPosition, 'hidden');
  assert.equal(
    withMenuBtn.slides['5iew2M44w24'].canvasElements?.[0].imageUrl,
    'mobile/5dCAlHC5W8Z.png'
  );

  // Verify moving native slide buttons via elementOverrides updates Storyline slide provideData xPos/yPos in 1280x720 coordinates
  const { applyElementOverridePatch } = await import(
    './features/canvas/canvasMath'
  );
  const withMovedNativeBtn = applyElementOverridePatch(
    withMenuBtn,
    '5iew2M44w24',
    'native_btn_1',
    {
      xDeltaPct: 10, // +128px on 1280 stage
      yDeltaPct: -5, // -36px on 720 stage
    }
  );
  const transformedSlideJson = transformStorylineProvideData(
    'slide',
    JSON.stringify({
      id: '5iew2M44w24',
      slideLayers: [
        {
          objects: [
            {
              id: 'native_btn_1',
              xPos: 200,
              yPos: 300,
              width: 120,
              height: 50,
            },
          ],
        },
      ],
    }),
    withMovedNativeBtn
  );
  const parsedTransformedSlide = JSON.parse(transformedSlideJson);
  const movedNativeObj = parsedTransformedSlide.slideLayers[0].objects[0];
  assert.equal(movedNativeObj.xPos, 200 + Math.round(0.1 * 1280));
  assert.equal(movedNativeObj.yPos, 300 + Math.round(-0.05 * 720));

  // 3. Verify Last Active Slide Persistence & Storage.prototype.clear Protection
  const storeMap = new Map<string, string>();
  const mockStorage = {
    get length() {
      return storeMap.size;
    },
    key(idx: number) {
      return Array.from(storeMap.keys())[idx] ?? null;
    },
    getItem(k: string) {
      return storeMap.has(k) ? storeMap.get(k)! : null;
    },
    setItem(k: string, v: string) {
      storeMap.set(k, String(v));
    },
    removeItem(k: string) {
      storeMap.delete(k);
    },
    clear() {
      storeMap.clear();
    },
  };
  (globalThis as any).window = {
    localStorage: mockStorage,
  };

  protectStarlaLocalStorage();
  saveLastActiveSlideState({
    slideId: '6FkRXfgJQkY',
    slideIndex: 38,
    frontOpened: true,
    studentName: 'Putu Ayu',
    studentSchool: 'SDN 1 Denpasar',
  });

  // Simulate Storyline's wipeResumeStorage calling window.localStorage.clear() on refresh/beforeunload
  mockStorage.setItem('storyline_temp_suspend', 'xyz');
  mockStorage.clear();

  assert.equal(mockStorage.getItem('storyline_temp_suspend'), null);
  const restoredSlide = loadLastActiveSlideState();
  assert.ok(restoredSlide);
  assert.equal(restoredSlide?.slideId, '6FkRXfgJQkY');
  assert.equal(restoredSlide?.frontOpened, true);
  assert.equal(restoredSlide?.studentName, 'Putu Ayu');
});

test('Studio Slide Manager: Copy Slide (copySlideItem), Add New Slide with Background/Backsound/VoiceOver, SFX Catalogs, and Universal Button Triggers with Animated State Popup', async () => {
  const {
    STARLA_BACKSOUND_CATALOG,
    STARLA_VOICEOVER_CATALOG,
    STARLA_SFX_CATALOG,
    STARLA_BACKGROUND_PRESETS,
  } = await import('./utils/slideExactMeta');
  const { addSlideItem, copySlideItem } = await import(
    './features/admin/adminHelpers'
  );
  const {
    applyAddCanvasElement,
    applyUpdateCanvasElement,
    applyElementOverridePatch,
  } = await import('./features/canvas/canvasMath');

  // 1. Verify Backsound, VoiceOver, SFX, and Background Presets databases are populated
  assert.ok(STARLA_BACKSOUND_CATALOG.length >= 5);
  assert.ok(STARLA_VOICEOVER_CATALOG.length >= 6);
  assert.ok(STARLA_SFX_CATALOG.length >= 10);
  assert.ok(STARLA_BACKGROUND_PRESETS.length >= 6);

  // 2. Copy an existing slide ('5iew2M44w24') with custom title, background, backsound, and voiceOver
  const { nextSchema: withCopied, createdSlideId: copiedId } = copySlideItem(
    defaultContent,
    '5iew2M44w24',
    {
      title: 'Menu Materi Starla (Salinan Kustom)',
      backgroundUrl: STARLA_BACKGROUND_PRESETS[1].imageUrl,
      backsoundUrl: STARLA_BACKSOUND_CATALOG[0].url,
      voiceOverUrl: STARLA_VOICEOVER_CATALOG[1].url,
    }
  );
  assert.ok(copiedId);
  assert.equal(withCopied.slideOrder.length, 44);
  const copiedSlide = withCopied.slides[copiedId];
  assert.equal(copiedSlide.copiedFromSlideId, '5iew2M44w24');
  assert.equal(copiedSlide.title, 'Menu Materi Starla (Salinan Kustom)');
  assert.equal(
    copiedSlide.backgroundUrl,
    STARLA_BACKGROUND_PRESETS[1].imageUrl
  );
  assert.equal(copiedSlide.backsoundUrl, STARLA_BACKSOUND_CATALOG[0].url);
  assert.equal(copiedSlide.voiceOverUrl, STARLA_VOICEOVER_CATALOG[1].url);

  // 3. Add a brand-new custom slide with background, backsound, and voiceOver
  const { nextSchema: withNewCustom, createdSlideId: brandNewId } =
    addSlideItem(withCopied, {
      title: 'Eksplorasi Alat Musik Sasando NTT',
      instructions: ['Mengenal sejarah dan melodi Sasando dari Pulau Rote.'],
      backgroundUrl: STARLA_BACKGROUND_PRESETS[2].imageUrl,
      backsoundUrl: STARLA_BACKSOUND_CATALOG[1].url,
      voiceOverUrl: STARLA_VOICEOVER_CATALOG[2].url,
      customCategory: 'materi',
    });
  assert.equal(withNewCustom.slideOrder.length, 45);
  assert.equal(
    withNewCustom.slides[brandNewId].backsoundUrl,
    STARLA_BACKSOUND_CATALOG[1].url
  );
  assert.equal(
    withNewCustom.slides[brandNewId].voiceOverUrl,
    STARLA_VOICEOVER_CATALOG[2].url
  );

  // 4. Configure Universal Trigger (Animated Media State Popup + UI SFX) on an existing Native Slide Button
  const withNativeTrigger = applyElementOverridePatch(
    withNewCustom,
    copiedId,
    'native_menu_btn_01',
    {
      actionType: 'embed-popup',
      popupTitle: 'Tur Virtual 360° Rumah Adat',
      popupContent: 'Gunakan kursor untuk memutar panorama 360°.',
      popupMediaUrl: 'https://faryzt.github.io/starla-360/',
      popupMediaType: 'iframe',
      popupAnimation: 'bounce',
      clickSfxUrl: 'sfx:chime-gamelan',
      hoverSfxUrl: 'sfx:hover-soft',
      hoverEffect: 'scale',
    }
  );
  const nativeOv =
    withNativeTrigger.slides[copiedId].elementOverrides?.['native_menu_btn_01'];
  assert.equal(nativeOv?.actionType, 'embed-popup');
  assert.equal(nativeOv?.popupMediaType, 'iframe');
  assert.equal(nativeOv?.popupAnimation, 'bounce');
  assert.equal(nativeOv?.clickSfxUrl, 'sfx:chime-gamelan');
  assert.equal(nativeOv?.hoverSfxUrl, 'sfx:hover-soft');

  // 5. Configure Universal Trigger (Animated Media State Popup + UI SFX) on a Custom Uploaded Button
  const { nextSchema: withCustomBtn, createdElement } = applyAddCanvasElement(
    withNativeTrigger,
    copiedId,
    {
      type: 'image-button',
      label: 'Tombol Unggahan Kustom',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
      clickSfxUrl: 'sfx:click-crystal',
      hoverSfxUrl: 'sfx:hover-soft',
      style: {
        backgroundColor: 'transparent',
        borderRadius: 0,
        textPosition: 'hidden',
        hoverEffect: 'scale',
      },
      action: {
        type: 'embed-popup',
        popupTitle: 'Video Dokumentasi Budaya',
        popupContent: 'Tonton video dokumentasi budaya Nusantara.',
        popupMediaUrl: 'story_content/video_6gB2P6I3G4w_22_56_1280x720.mp4',
        popupMediaType: 'video',
        popupAnimation: 'pop-zoom',
      },
    }
  );
  const updatedCustomSchema = applyUpdateCanvasElement(
    withCustomBtn,
    copiedId,
    createdElement.id,
    {
      clickSfxUrl: 'sfx:success-fanfare',
    }
  );
  const savedCustomEl =
    updatedCustomSchema.slides[copiedId].canvasElements?.[0];
  assert.equal(savedCustomEl?.action.type, 'embed-popup');
  assert.equal(savedCustomEl?.action.popupMediaType, 'video');
  assert.equal(savedCustomEl?.action.popupAnimation, 'pop-zoom');
  assert.equal(savedCustomEl?.clickSfxUrl, 'sfx:success-fanfare');
  assert.equal(savedCustomEl?.hoverSfxUrl, 'sfx:hover-soft');
});

test('AdminDashboard Lazy Loading & Bounded LRU Stage Memory Optimization', async () => {
  const {
    MAX_CACHED_SLIDE_RUNTIMES,
    getAdminStageCacheStats,
    releaseAdminStageMemoryCache,
  } = await import('./utils/slideExactMeta');
  const { LazyAdminDashboard } = await import('./App');

  // 1. Verify LazyAdminDashboard is a valid React.lazy exotic component
  assert.ok(LazyAdminDashboard);
  assert.equal(
    (LazyAdminDashboard as any).$$typeof,
    Symbol.for('react.lazy')
  );

  // 2. Verify bounded LRU cache limit and memory release function
  assert.equal(MAX_CACHED_SLIDE_RUNTIMES, 6);
  releaseAdminStageMemoryCache(false);
  const initialStats = getAdminStageCacheStats();
  assert.equal(initialStats.cachedSlideCount, 0);
  assert.equal(initialStats.maxCachedSlides, 6);
  assert.equal(initialStats.hasAssetLibLoaded, false);
  assert.equal(initialStats.hasPathsLibLoaded, false);
});

test('Recharts Quiz & Game Completion Statistics from ContentContext & Universal Slide Embeds', async () => {
  const { computeQuizAndGameCompletionStats } = await import(
    './features/admin/QuizGameCompletionCharts'
  );
  const { addSlideItem } = await import('./features/admin/adminHelpers');

  const sampleStudents = [
    {
      id: 'USR-01',
      name: 'Rafi Pratama',
      school: 'SDN 1',
      completedModules: 8,
      quizScore: 95,
      garudaPoints: 180,
      status: 'Active',
    },
    {
      id: 'USR-02',
      name: 'Nadia Putri',
      school: 'SDN 2',
      completedModules: 5,
      quizScore: 80,
      garudaPoints: 90,
      status: 'Pending',
    },
    {
      id: 'USR-03',
      name: 'Bima Sakti',
      school: 'SDN 3',
      completedModules: 7,
      quizScore: 60,
      garudaPoints: 150,
      status: 'Active',
    },
  ];

  // 1. Compute stats against defaultContent
  const baseStats = computeQuizAndGameCompletionStats(
    defaultContent,
    sampleStudents
  );
  assert.equal(baseStats.totalUsers, 3);
  assert.equal(baseStats.completedQuizUsers, 2);
  assert.equal(baseStats.completedGameUsers, 2);
  assert.equal(baseStats.completedBothUsers, 1);
  assert.equal(baseStats.quizCompletionRatePct, 67);
  assert.equal(baseStats.gameCompletionRatePct, 67);
  assert.ok(baseStats.activeQuizQuestionCount >= 10);
  assert.ok(baseStats.activeGarudaQuestionCount >= 5);
  assert.equal(baseStats.moduleBreakdown.length, 5);
  assert.equal(baseStats.userComparison.length, 3);

  // 2. Mutate ContentContext (add custom Garuda question + new slide with 360/Web embed URL) and verify stats react dynamically
  const { nextSchema: withNewEmbedSlide, createdSlideId } = addSlideItem(
    defaultContent,
    {
      title: 'Slide Baru Dengan Embed 360',
      customCategory: 'materi',
      webObjectUrl: 'https://www.google.com/maps/embed?pb=!1m0',
    }
  );
  const mutatedContent: ContentSchema = {
    ...withNewEmbedSlide,
    quizzes: {
      ...withNewEmbedSlide.quizzes,
      gameAnakGaruda: {
        ...(withNewEmbedSlide.quizzes.gameAnakGaruda || {}),
        statements: [
          ...(withNewEmbedSlide.quizzes.gameAnakGaruda?.statements || []),
          {
            id: 'garuda-test-extra',
            text: 'Pernyataan ekstra Game Anak Garuda',
            targetChoice: 'Budaya yang Benar',
          },
        ],
      },
    },
  };

  const createdSlide = mutatedContent.slides[createdSlideId];
  assert.ok(createdSlide);
  assert.equal(
    createdSlide.webObjectUrl,
    'https://www.google.com/maps/embed?pb=!1m0'
  );

  const updatedStats = computeQuizAndGameCompletionStats(
    mutatedContent,
    sampleStudents
  );
  assert.equal(
    updatedStats.activeGarudaQuestionCount,
    baseStats.activeGarudaQuestionCount + 1
  );
  assert.equal(
    updatedStats.activeTur360SlideCount,
    baseStats.activeTur360SlideCount + 1
  );
});

test('Debounced Canvas State Saving: createCanvasStateSaveDebouncer coalesces rapid drag/property changes and preserves 100% synchronization on flush', async () => {
  const {
    CANVAS_SAVE_DEBOUNCE_MS,
    createCanvasStateSaveDebouncer,
    applyUpdateCanvasElement,
    applyAddCanvasElement,
  } = await import('./features/canvas/canvasMath');

  assert.equal(CANVAS_SAVE_DEBOUNCE_MS, 180);

  const slideId = '5iew2M44w24';
  const { nextSchema: withButton, createdElement } = applyAddCanvasElement(
    defaultContent,
    slideId,
    {
      type: 'image-button',
      label: 'Tombol Debounce Uji',
      x: 10,
      y: 20,
      width: 24,
      height: 12,
    }
  );

  const debouncer = createCanvasStateSaveDebouncer<ContentSchema>(40);
  const committedSnapshots: ContentSchema[] = [];

  // Simulate 25 rapid drag-and-drop / property changes within the debounce window
  let current = withButton;
  for (let step = 1; step <= 25; step++) {
    current = applyUpdateCanvasElement(current, slideId, createdElement.id, {
      x: 10 + step,
      y: 20 + step,
    });
    debouncer.schedule(current, (latest) => {
      committedSnapshots.push(latest);
    });
  }

  // While within the debounce window, pending is true and commit has not fired 25 times
  assert.equal(debouncer.isPending(), true);
  assert.equal(committedSnapshots.length, 0);

  // Wait for debounce timer to fire
  await new Promise((resolve) => setTimeout(resolve, 65));
  assert.equal(debouncer.isPending(), false);
  assert.equal(committedSnapshots.length, 1);

  const savedButton = committedSnapshots[0].slides[
    slideId
  ].canvasElements?.find((el) => el.id === createdElement.id);
  assert.equal(savedButton?.x, 35);
  assert.equal(savedButton?.y, 45);

  // Simulate rapid property edits followed by immediate flush() (e.g. cloud save / tab switch / unload)
  current = applyUpdateCanvasElement(current, slideId, createdElement.id, {
    x: 72,
    y: 64,
  });
  debouncer.schedule(current, (latest) => {
    committedSnapshots.push(latest);
  });
  assert.equal(debouncer.isPending(), true);

  debouncer.flush();
  assert.equal(debouncer.isPending(), false);
  assert.equal(committedSnapshots.length, 2);

  const flushedButton = committedSnapshots[1].slides[
    slideId
  ].canvasElements?.find((el) => el.id === createdElement.id);
  assert.equal(flushedButton?.x, 72);
  assert.equal(flushedButton?.y, 64);
});

test('Full Button Edit Access (Resize, Move, Replace, Delete/Restore, Smart Slide Linker) & New 360° Slide Embed Parity with Slide 8 (5jTlwgcUi8o)', async () => {
  const {
    normalizeSmartEmbedUrl,
    getSmartSlideMeta,
    loadExactSlideStageData,
    STARLA_BUTTON_PRESETS,
  } = await import('./utils/slideExactMeta');
  const { addSlideItem, copySlideItem } = await import(
    './features/admin/adminHelpers'
  );
  const {
    applyElementOverridePatch,
    applyAddCanvasElement,
    applyUpdateCanvasElement,
    applyDeleteCanvasElement,
  } = await import('./features/canvas/canvasMath');
  const { transformStorylineProvideData } = await import(
    './utils/contentRuntimeBridge'
  );

  // 1. Verify normalizeSmartEmbedUrl normalizes raw <iframe>, bare domains, and YouTube links
  assert.equal(
    normalizeSmartEmbedUrl(
      '<iframe width="560" height="315" src="https://faryzt.github.io/starla-360/?view=joglo" frameborder="0"></iframe>'
    ),
    'https://faryzt.github.io/starla-360/?view=joglo'
  );
  assert.equal(
    normalizeSmartEmbedUrl('faryzt.github.io/starla-360/'),
    'https://faryzt.github.io/starla-360/'
  );
  assert.equal(
    normalizeSmartEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
  );

  // 2. Verify creating a new 360° slide produces exact Slide 8 (5jTlwgcUi8o) embed parity
  const { nextSchema: withNew360, createdSlideId: new360Id } = addSlideItem(
    defaultContent,
    {
      title: 'Tur Virtual 360° Rumah Gadang',
      webObjectUrl:
        '<iframe src="https://faryzt.github.io/starla-360/?rumah=gadang"></iframe>',
    }
  );
  const created360Slide = withNew360.slides[new360Id];
  assert.equal(created360Slide.customCategory, 'tur360');
  assert.equal(
    created360Slide.webObjectUrl,
    'https://faryzt.github.io/starla-360/?rumah=gadang'
  );

  const new360Meta = getSmartSlideMeta(new360Id, created360Slide);
  assert.equal(new360Meta.category, 'tur360');
  assert.equal(
    new360Meta.webObjectUrl,
    'https://faryzt.github.io/starla-360/?rumah=gadang'
  );

  const new360Stage = await loadExactSlideStageData(new360Id, created360Slide);
  assert.ok(new360Stage, 'New 360° slide stage data must not be null');
  const webObj = new360Stage.objects.find((o) => o.kind === 'webobject');
  const backBtnObj = new360Stage.objects.find(
    (o) => o.imageUrl === 'mobile/6UTk9YJ1Rv7.png'
  );
  assert.ok(webObj, 'New 360° slide stage must contain a 1280x720 webobject');
  assert.equal(
    webObj?.webUrl,
    'https://faryzt.github.io/starla-360/?rumah=gadang'
  );
  assert.ok(
    backBtnObj,
    'New 360° slide stage must include Slide 8 authentic Back button'
  );
  assert.equal(backBtnObj?.imageUrl, 'mobile/6UTk9YJ1Rv7.png');

  // 3. Verify copying Slide 8 (5jTlwgcUi8o) preserves webObjectUrl & tur360 category
  const { nextSchema: withCopied360, createdSlideId: copied360Id } =
    copySlideItem(withNew360, '5jTlwgcUi8o', {
      title: 'Salinan Slide 8 Tur 360°',
    });
  const copied360Slide = withCopied360.slides[copied360Id];
  assert.equal(copied360Slide.customCategory, 'tur360');
  assert.equal(
    copied360Slide.webObjectUrl,
    'https://faryzt.github.io/starla-360/'
  );

  // 4. Verify Native Button full edit capabilities: Resize, Move, Replace Image, Link to Slide, Hide & Restore
  const targetSlideForEdit = '5iew2M44w24';
  const nativeBtnId = '5jH1rK3mN9p';
  const afterNativeEdit = applyElementOverridePatch(
    withCopied360,
    targetSlideForEdit,
    nativeBtnId,
    {
      xDeltaPct: 12.5,
      yDeltaPct: -8,
      widthPct: 22,
      heightPct: 14,
      customImage: STARLA_BUTTON_PRESETS[1].imageUrl,
      customLabel: 'Tombol Menuju 360 Rumah Gadang',
      actionType: 'goto-slide',
      targetSlideId: new360Id,
    }
  );
  const editedOv =
    afterNativeEdit.slides[targetSlideForEdit].elementOverrides?.[nativeBtnId];
  assert.equal(editedOv?.xDeltaPct, 12.5);
  assert.equal(editedOv?.yDeltaPct, -8);
  assert.equal(editedOv?.widthPct, 22);
  assert.equal(editedOv?.heightPct, 14);
  assert.equal(editedOv?.customImage, 'mobile/6UTk9YJ1Rv7.png');
  assert.equal(editedOv?.actionType, 'goto-slide');
  assert.equal(editedOv?.targetSlideId, new360Id);

  // Verify transformStorylineProvideData patches width, height, xPos, yPos, and events on the native button
  const patchedNativeJson = transformStorylineProvideData(
    'slide',
    JSON.stringify({
      id: targetSlideForEdit,
      slideLayers: [
        {
          objects: [
            {
              id: nativeBtnId,
              xPos: 100,
              yPos: 200,
              width: 150,
              height: 60,
              events: [
                {
                  kind: 'onrelease',
                  actions: [{ kind: ' jumpslide', slideId: 'old_slide' }],
                },
              ],
            },
          ],
        },
      ],
    }),
    afterNativeEdit
  );
  const parsedPatchedNative = JSON.parse(patchedNativeJson);
  const patchedObj = parsedPatchedNative.slideLayers[0].objects[0];
  assert.equal(patchedObj.xPos, 100 + Math.round(0.125 * 1280));
  assert.equal(patchedObj.yPos, 200 + Math.round(-0.08 * 720));
  assert.equal(patchedObj.width, Math.round(0.22 * 1280));
  assert.equal(patchedObj.height, Math.round(0.14 * 720));

  // Verify Hide & Restore on Native Button
  const afterHideNative = applyElementOverridePatch(
    afterNativeEdit,
    targetSlideForEdit,
    nativeBtnId,
    { hidden: true }
  );
  assert.equal(
    afterHideNative.slides[targetSlideForEdit].elementOverrides?.[nativeBtnId]
      ?.hidden,
    true
  );
  const afterRestoreNative = applyElementOverridePatch(
    afterHideNative,
    targetSlideForEdit,
    nativeBtnId,
    { hidden: false }
  );
  assert.equal(
    afterRestoreNative.slides[targetSlideForEdit].elementOverrides?.[
      nativeBtnId
    ]?.hidden,
    false
  );

  // 5. Verify Custom Button full edit capabilities: Add, Resize, Move, Replace Image, Link to New 360° Slide, and Delete
  const { nextSchema: withCustomBtn, createdElement: customBtn } =
    applyAddCanvasElement(afterRestoreNative, targetSlideForEdit, {
      type: 'image-button',
      label: 'Tombol Kustom 360',
      imageUrl: STARLA_BUTTON_PRESETS[0].imageUrl,
      x: 20,
      y: 30,
      width: 15,
      height: 12,
      action: {
        type: 'goto-slide',
        targetSlideId: '5jTlwgcUi8o',
      },
    });
  const afterCustomEdit = applyUpdateCanvasElement(
    withCustomBtn,
    targetSlideForEdit,
    customBtn.id,
    {
      x: 42,
      y: 55,
      width: 24,
      height: 18,
      imageUrl: STARLA_BUTTON_PRESETS[1].imageUrl,
      label: 'Tombol Menuju Slide 360 Baru',
      action: {
        type: 'goto-slide',
        targetSlideId: new360Id,
      },
    }
  );
  const updatedCustomBtn = afterCustomEdit.slides[
    targetSlideForEdit
  ].canvasElements?.find((c) => c.id === customBtn.id);
  assert.equal(updatedCustomBtn?.x, 42);
  assert.equal(updatedCustomBtn?.y, 55);
  assert.equal(updatedCustomBtn?.width, 24);
  assert.equal(updatedCustomBtn?.height, 18);
  assert.equal(updatedCustomBtn?.imageUrl, 'mobile/6UTk9YJ1Rv7.png');
  assert.equal(updatedCustomBtn?.action.type, 'goto-slide');
  assert.equal(updatedCustomBtn?.action.targetSlideId, new360Id);

  const afterCustomDelete = applyDeleteCanvasElement(
    afterCustomEdit,
    targetSlideForEdit,
    customBtn.id
  );
  assert.equal(
    afterCustomDelete.slides[targetSlideForEdit].canvasElements?.find(
      (c) => c.id === customBtn.id
    ),
    undefined
  );
});

test('Tahap 15: 6-Month Operational Analytics, Starla Budaya Curator Profiles & 1:1 Button Resize Parity', async () => {
  const {
    DEFAULT_EXTRA_STATE,
    SMART_ADMIN_PROFILES,
    SIX_MONTH_OPERATIONAL_SUMMARY,
    SIX_MONTH_TREND_DATA,
  } = await import('./features/admin/adminTypes');
  const { computeQuizAndGameCompletionStats } = await import(
    './features/admin/QuizGameCompletionCharts'
  );
  const {
    applyElementOverridePatch,
    applyAddCanvasElement,
    applyUpdateCanvasElement,
  } = await import('./features/canvas/canvasMath');
  const { transformStorylineProvideData } = await import(
    './utils/contentRuntimeBridge'
  );

  // 1. Verify Starla Budaya Curator Profiles
  assert.equal(SMART_ADMIN_PROFILES.length, 3);
  assert.ok(
    SMART_ADMIN_PROFILES[0].email.endsWith('@starlabudaya.id'),
    'Lead curator profile must use Starla Budaya domain'
  );

  // 2. Verify 6-Month Active User Dataset & Trends
  assert.equal(SIX_MONTH_OPERATIONAL_SUMMARY.operationalMonths, 6);
  assert.ok(SIX_MONTH_OPERATIONAL_SUMMARY.totalRegisteredUsers >= 1500);
  assert.ok(SIX_MONTH_OPERATIONAL_SUMMARY.partnerSchoolsCount >= 60);
  assert.equal(SIX_MONTH_TREND_DATA.length, 6);
  assert.equal(DEFAULT_EXTRA_STATE.analyticsList.length, 36);

  const stats = computeQuizAndGameCompletionStats(
    defaultContent,
    DEFAULT_EXTRA_STATE.analyticsList
  );
  assert.equal(stats.totalUsers, 36);
  assert.equal(stats.sixMonthTrend.length, 6);
  assert.ok(stats.sixMonthSummary.totalRegisteredUsers >= 1548);
  assert.ok(stats.avgQuizScore >= 85);
  assert.ok(stats.userComparison.length <= 12);

  // 3. Verify 1:1 Native Button Resize patches imagelib & states html5data dimensions
  const slideId = '5iew2M44w24';
  const btnId = 'btn_native_test';
  const withResizedNative = applyElementOverridePatch(
    defaultContent,
    slideId,
    btnId,
    {
      widthPct: 25,
      heightPct: 15,
    }
  );
  const patchedStr = transformStorylineProvideData(
    'slide',
    JSON.stringify({
      id: slideId,
      slideLayers: [
        {
          objects: [
            {
              id: btnId,
              xPos: 100,
              yPos: 100,
              width: 120,
              height: 50,
              imagelib: [{ url: 'mobile/5dCAlHC5W8Z.png', width: 120, height: 50 }],
              states: [
                {
                  name: '_default',
                  data: { html5data: { width: 120, height: 50 } },
                },
              ],
            },
          ],
        },
      ],
    }),
    withResizedNative
  );
  const parsedObj = JSON.parse(patchedStr).slideLayers[0].objects[0];
  assert.equal(parsedObj.width, Math.round(0.25 * 1280));
  assert.equal(parsedObj.height, Math.round(0.15 * 720));
  assert.equal(parsedObj.imagelib[0].width, Math.round(0.25 * 1280));
  assert.equal(parsedObj.imagelib[0].height, Math.round(0.15 * 720));
  assert.equal(
    parsedObj.states[0].data.html5data.width,
    Math.round(0.25 * 1280)
  );
  assert.equal(
    parsedObj.states[0].data.html5data.height,
    Math.round(0.15 * 720)
  );

  // 4. Verify Custom Added Button Resize & Persistence on Slide
  const { nextSchema: withAddedBtn, createdElement: addedBtn } =
    applyAddCanvasElement(defaultContent, slideId, {
      type: 'image-button',
      label: 'Tombol Publik 1:1',
      imageUrl: 'mobile/5dCAlHC5W8Z.png',
      x: 15,
      y: 25,
      width: 12,
      height: 9.5,
      action: {
        type: 'goto-slide',
        targetSlideId: '5jTlwgcUi8o',
      },
    });
  const resizedSchema = applyUpdateCanvasElement(
    withAddedBtn,
    slideId,
    addedBtn.id,
    {
      width: 22,
      height: 16,
    }
  );
  const finalBtn = resizedSchema.slides[slideId].canvasElements?.find(
    (b) => b.id === addedBtn.id
  );
  assert.ok(finalBtn);
  assert.equal(finalBtn?.width, 22);
  assert.equal(finalBtn?.height, 16);
});

test('Tahap 16: Cari Tahu Button Replacement (5b7bpGxEsZl.png -> cari tahu.png), Copied 360° Pameran Slide (https://faryzt.github.io/Pameran-360/), and Tidied Menu Buttons on Slide 5iew2M44w24', async () => {
  const {
    applyStarlaMenuAndPameranUpdate,
    PAMERAN_360_SLIDE_ID,
    PAMERAN_360_EMBED_URL,
    PAMERAN_360_BUTTON_ID,
  } = await import('./features/admin/adminHelpers');
  const { loadExactSlideStageData, getSmartSlideMeta } = await import(
    './utils/slideExactMeta'
  );

  const updated = applyStarlaMenuAndPameranUpdate(defaultContent);

  // 1. Verify "Tahukah Kamu?" button (5Vj2vgTep1J / 5b7bpGxEsZl.png) is replaced with "cari tahu.png" and retains link to 6OrD7bra4Ko
  const menuSlide = updated.slides['5iew2M44w24'];
  assert.ok(menuSlide);
  const cariTahuImg = menuSlide.images.find(
    (img) => img.objectId === '5Vj2vgTep1J'
  );
  assert.equal(cariTahuImg?.altText, 'cari tahu.png');
  const cariTahuOv = menuSlide.elementOverrides?.['5Vj2vgTep1J'];
  assert.ok(cariTahuOv);
  assert.equal(cariTahuOv?.customImage, 'mobile/5b7bpGxEsZl.png');
  assert.equal(cariTahuOv?.actionType, 'goto-slide');
  assert.equal(cariTahuOv?.targetSlideId, '6OrD7bra4Ko');

  // 2. Verify copied 360° Budaya slide for Pameran 360 exists with https://faryzt.github.io/Pameran-360/ and Home button
  const pameranSlide = updated.slides[PAMERAN_360_SLIDE_ID];
  assert.ok(pameranSlide, 'Copied 360° Pameran slide must exist');
  assert.equal(pameranSlide.copiedFromSlideId, '5jTlwgcUi8o');
  assert.equal(pameranSlide.customCategory, 'tur360');
  assert.equal(pameranSlide.webObjectUrl, PAMERAN_360_EMBED_URL);

  const pameranMeta = getSmartSlideMeta(PAMERAN_360_SLIDE_ID, pameranSlide);
  assert.equal(pameranMeta.category, 'tur360');
  assert.equal(pameranMeta.webObjectUrl, 'https://faryzt.github.io/Pameran-360/');

  const pameranStage = await loadExactSlideStageData(
    PAMERAN_360_SLIDE_ID,
    pameranSlide
  );
  assert.ok(pameranStage);
  const webObj = pameranStage.objects.find((o) => o.kind === 'webobject');
  const homeBtn = pameranStage.objects.find(
    (o) => o.imageUrl === 'mobile/6UTk9YJ1Rv7.png'
  );
  assert.equal(webObj?.webUrl, 'https://faryzt.github.io/Pameran-360/');
  assert.ok(homeBtn, 'Copied 360° Pameran slide must include Home button');

  // 3. Verify "pameran.png" button is added directly below 360° Budaya button and all 5 menu buttons are tidily aligned without overlap
  const pameranBtn = menuSlide.canvasElements?.find(
    (el) => el.id === PAMERAN_360_BUTTON_ID
  );
  assert.ok(pameranBtn, '360° Pameran button must exist on Slide 5iew2M44w24');
  assert.equal(pameranBtn?.imageUrl, 'mobile/pameran.png');
  assert.equal(pameranBtn?.action.type, 'goto-slide');
  assert.equal(pameranBtn?.action.targetSlideId, PAMERAN_360_SLIDE_ID);

  // Check that all 4 native buttons keep their exact horizontal xPos (xDeltaPct: 0) and have tidied vertical spacing so 360° Pameran sits directly below 360° Budaya without overlap
  const sinemaOv = menuSlide.elementOverrides?.['5ZPukeMFffY']!;
  const bermainOv = menuSlide.elementOverrides?.['5cPSgbCeIlr']!;
  const budaya360Ov = menuSlide.elementOverrides?.['6afmjIda5Z2']!;

  assert.equal(sinemaOv.xDeltaPct, 0);
  assert.equal(cariTahuOv.xDeltaPct, 0);
  assert.equal(bermainOv.xDeltaPct, 0);
  assert.equal(budaya360Ov.xDeltaPct, 0);

  const sinemaTop = (104 / 720) * 100 + (sinemaOv.yDeltaPct || 0);
  const cariTahuTop = (208 / 720) * 100 + (cariTahuOv.yDeltaPct || 0);
  const bermainTop = (360 / 720) * 100 + (bermainOv.yDeltaPct || 0);
  const budaya360Top = (480 / 720) * 100 + (budaya360Ov.yDeltaPct || 0);
  const pameranTop = pameranBtn!.y;

  assert.ok(sinemaTop < cariTahuTop);
  assert.ok(cariTahuTop < bermainTop);
  assert.ok(bermainTop < budaya360Top);
  assert.ok(
    budaya360Top < pameranTop,
    '360° Pameran button must be positioned directly below 360° Budaya button'
  );
  assert.ok(
    pameranTop + pameranBtn!.height <= 98,
    'All 5 menu buttons must fit within the 720px slide height'
  );
});

