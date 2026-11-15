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

