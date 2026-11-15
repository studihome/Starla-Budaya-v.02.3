import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { defaultContent, ContentSchema } from './data/defaultContent';
import {
  resolveUpdatedContent,
  applySlidePatch,
  applyQuizQuestionPatch,
  transformStorylineProvideData,
} from './utils/contentRuntimeBridge';
import { getSupabaseEnvConfig } from './context/ContentContext';

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
  // 1. Update appMeta and frontStage via resolveUpdatedContent
  const updated1: ContentSchema = resolveUpdatedContent(defaultContent, {
    appMeta: {
      ...defaultContent.appMeta,
      title: 'STARLA BUDAYA EDISI BARU',
    },
  });
  assert.equal(updated1.appMeta.title, 'STARLA BUDAYA EDISI BARU');
  assert.equal(defaultContent.appMeta.title, 'STARLA BUDAYA'); // Immutability verified

  // 2. Update a slide title and quiz question via applySlidePatch & applyQuizQuestionPatch
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

  // 3. Verify transformStorylineProvideData reflects the updated content in paths and slide payloads
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

test('getSupabaseEnvConfig safely returns null when env vars are unset', () => {
  const envCfg = getSupabaseEnvConfig();
  assert.equal(typeof envCfg, 'object');
  assert.ok('url' in envCfg && 'anonKey' in envCfg);
});
