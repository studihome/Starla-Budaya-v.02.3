import {
  CanvasActionType,
  CanvasElement,
  CanvasElementType,
  CanvasHoverEffect,
  CanvasShadowPreset,
} from '../types/canvas';

/**
 * STARLA BUDAYA - Default Static Content & TypeScript Schema (Tahap 1: Zero-Regression Refactoring)
 * Diekstrak secara utuh (100% lossless) dari seluruh slide, teks SVG, aset audio/gambar/video,
 * serta interaksi/kuis Articulate Storyline tanpa mengubah visual, layout, maupun logika audio.
 */

export interface AppMetaContent {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
  themeColor: string;
  language: string;
  engineVersion: string;
  cid: string;
  playerVersion: string;
  publishTimestamp: string;
}

export interface FrontStageContent {
  accessButtonId: string;
  accessButtonLabel: string;
  accessButtonAriaLabel: string;
  stageAriaLabel: string;
  backgroundColor: string;
  fingerprintGradientStops: string[];
}

export interface NavigationConfigContent {
  scenePrefix: string;
  entryPoint: string;
  slides: {
    INTRO: string;
    LOGIN: string;
    WELCOME: string;
    MENU_MATERI: string;
    MENU_UTAMA: string;
    SINEMA_VIDEO: string;
    KUIS_START: string;
    KUIS_CERT: string;
    KUIS_RESULTS: string;
    GAME_START: string;
    GAME_CERT: string;
    GAME_DRAG_DROP: string;
    GAME_RESULTS: string;
  };
}

export interface VideoAssetConfig {
  id: string;
  modelId: string;
  url: string;
  mobileUrl: string;
  posterUrl: string;
  width: number;
  height: number;
  durationMs: number;
  closeMarkerId?: string;
  triggerModelId?: string;
}

export interface AudioAssetItem {
  assetId: number;
  url: string;
  durationMs: number;
  fileSize: number;
}

export interface ImageAssetItem {
  assetId: number;
  url: string;
  imageType: string;
  width: number;
  height: number;
  fileSize: number;
}

export interface SvgTextCommandSetItem {
  commandSetId: string;
  index: number;
  lines: string[];
}

export interface SlideTextBlock {
  objectId: string;
  uniqueId: string;
  linkId: string;
  commandSetId: string | null;
  altText: string;
  lines: string[];
}

export interface SlideAudioRef {
  layerIndex: number;
  layerId: string;
  audioId: string;
  assetId: number;
  url: string;
  durationMs: number;
}

export interface SlideImageRef {
  layerIndex: number;
  layerId: string;
  objectId: string;
  assetId: number;
  url: string;
  altText: string;
  width: number;
  height: number;
}

export interface SlideVideoRef {
  layerIndex: number;
  objectId: string;
  url: string;
  posterUrl: string;
  width: number;
  height: number;
}

export interface QuizChoiceItem {
  id: string;
  objectId?: string;
  commandSetId?: string | null;
  text: string;
  isCorrect: boolean;
  points: number;
}

export interface QuizQuestionItem {
  slideId: string;
  slideNumber: number;
  interactionId: string;
  type: 'multiplechoice' | 'matching' | string;
  questionText: string;
  questionCommandSetId: string | null;
  maxPoints: number;
  choices: QuizChoiceItem[];
  correctChoiceId: string | null;
  correctAnswerText: string | null;
  feedbackLayers: {
    correctLayerId: string | null;
    incorrectLayerId: string | null;
  };
  hidden?: boolean;
}

export interface DragDropStatementItem {
  id: string;
  text: string;
}

export interface DragDropInteractionConfig {
  quizId: string;
  slideId: string;
  interactionId: string;
  title: string;
  passPercent: number;
  maxPoints: number;
  resultsSlideId: string;
  choices: { id: string; text: string }[];
  statements: DragDropStatementItem[];
}

export interface ElementOverrideConfig {
  xDeltaPct: number;
  yDeltaPct: number;
  widthPct?: number;
  heightPct?: number;
  hidden?: boolean;
  locked?: boolean;
  zIndex?: number;
  customText?: string;
  customImage?: string;
  customAudio?: string;
}

export type {
  CanvasActionType,
  CanvasElement,
  CanvasElementType,
  CanvasHoverEffect,
  CanvasShadowPreset,
};

export type CanvasElementStyle = CanvasElement['style'];

export type CanvasElementAction = CanvasElement['action'];

export type CanvasElementItem = CanvasElement;

export interface SlideContentItem {
  id: string;
  slideNumber: number;
  title: string;
  lmsId: string;
  jsPath: string;
  width: number;
  height: number;
  resume: boolean;
  backgroundUrl: string | null;
  instructions: string[];
  texts: SlideTextBlock[];
  audios: SlideAudioRef[];
  images: SlideImageRef[];
  videos: SlideVideoRef[];
  quizQuestion: QuizQuestionItem | null;
  hidden?: boolean;
  elementOverrides?: Record<string, ElementOverrideConfig>;
  hiddenElementIds?: string[];
  canvasElements?: CanvasElementItem[];
}

export interface StorylineVariableConfig {
  name: string;
  type: string;
  defaultValue: string | number | boolean;
  resume: boolean;
}

export interface ContentSchema {
  version: string;
  appMeta: AppMetaContent;
  frontStage: FrontStageContent;
  navigationConfig: NavigationConfigContent;
  protectedAssets: string[];
  videos: {
    intro: VideoAssetConfig;
    sinema: VideoAssetConfig;
  };
  slideOrder: string[];
  hiddenSlides?: string[];
  slides: Record<string, SlideContentItem>;
  quizzes: {
    kuisBudaya: {
      quizId: string;
      title: string;
      passPercent: number;
      resultsSlideId: string;
      questions: QuizQuestionItem[];
    };
    gameAnakGaruda: DragDropInteractionConfig;
  };
  svgTextCommandSets: Record<string, SvgTextCommandSetItem>;
  audioCatalog: Record<number, AudioAssetItem>;
  imageCatalog: Record<number, ImageAssetItem>;
  variables: StorylineVariableConfig[];
}

export const defaultContent: ContentSchema = {
  "version": "4.3.0-production",
  "appMeta": {
    "title": "STARLA BUDAYA",
    "description": "STARLA BUDAYA merupakan multimedia pembelajaran interaktif bersertifikat HKI dan buku terbit ber-ISBN yang menyajikan eksplorasi budaya dan nilai Pancasila melalui eksplorasi imersif 360° dan gamifikasi.",
    "ogTitle": "STARLA BUDAYA",
    "ogDescription": "STARLA BUDAYA merupakan multimedia pembelajaran interaktif bersertifikat HKI dan buku terbit ber-ISBN yang menyajikan eksplorasi budaya dan nilai Pancasila melalui eksplorasi imersif 360° dan gamifikasi.",
    "canonicalUrl": "https://faryzt.github.io/starla-360/",
    "themeColor": "#060913",
    "language": "id-ID",
    "engineVersion": "4.3.0-production",
    "cid": "b974f4c2-3fe2-42d9-ab75-74905c7a6203",
    "playerVersion": "3.20.30234.0",
    "publishTimestamp": "2026-11-12T01:32:57.1869836Z"
  },
  "frontStage": {
    "accessButtonId": "starla-access-btn",
    "accessButtonLabel": "ACCESS",
    "accessButtonAriaLabel": "ACCESS STARLA Budaya",
    "stageAriaLabel": "ACCESS STARLA Budaya",
    "backgroundColor": "#060913",
    "fingerprintGradientStops": [
      "#fef08a",
      "#fbbf24",
      "#f59e0b",
      "#b45309"
    ]
  },
  "navigationConfig": {
    "scenePrefix": "_player.5sAEMI5psmg.",
    "entryPoint": "_player.5sAEMI5psmg.6AR4SV4ZYat",
    "slides": {
      "INTRO": "6AR4SV4ZYat",
      "LOGIN": "5ml7jyaiXGc",
      "WELCOME": "5dLAzY4SKGI",
      "MENU_MATERI": "5iew2M44w24",
      "MENU_UTAMA": "6eHtnAfM3bY",
      "SINEMA_VIDEO": "6IgV5Xf2ecV",
      "KUIS_START": "6oOWqUyP2WL",
      "KUIS_CERT": "6H1Qh8g3j2r",
      "KUIS_RESULTS": "6ddgVMlBGEg",
      "GAME_START": "5a4b3c2d1e0",
      "GAME_CERT": "6G2Qh9g4j3s",
      "GAME_DRAG_DROP": "6G1VrKuOhCw",
      "GAME_RESULTS": "6WIqLhHr1Cm"
    }
  },
  "protectedAssets": [
    "5gkganedbet.png",
    "6cvvybugy8d_p_246_0_1299_405.png",
    "6efvcxuloy5.png",
    "5zajjyzwshr.png",
    "6qmyzkenwib.png",
    "6vpxf5tzdfs.png",
    "6ljf2bhskos.png",
    "poster_6ivttb86pvv_video_5gkzk4lbtf6_22_56_1280x720.jpg",
    "poster_5fw9lqf7to8_video_6npjlwnxee5_22_56_1280x720.jpg"
  ],
  "videos": {
    "intro": {
      "id": "video_6nPjLwNxeE5_22_56_1280x720",
      "modelId": "5fW9LQF7to8",
      "url": "story_content/video_6nPjLwNxeE5_22_56_1280x720.mp4",
      "mobileUrl": "mobile/video_6nPjLwNxeE5_22_56_1280x720.mp4",
      "posterUrl": "mobile/poster_5fW9LQF7to8_video_6nPjLwNxeE5_22_56_1280x720.jpg",
      "width": 1280,
      "height": 720,
      "durationMs": 18166
    },
    "sinema": {
      "id": "video_5gKzK4lbTf6_22_56_1280x720",
      "modelId": "6IvTTb86pVv",
      "url": "story_content/video_5gKzK4lbTf6_22_56_1280x720.mp4",
      "mobileUrl": "story_content/video_5gKzK4lbTf6_22_56_1280x720.mp4",
      "posterUrl": "mobile/poster_6IvTTb86pVv_video_5gKzK4lbTf6_22_56_1280x720.jpg",
      "width": 1280,
      "height": 720,
      "durationMs": 103000,
      "closeMarkerId": "5cduCNQqTlN",
      "triggerModelId": "5ZPukeMFffY"
    }
  },
  "slideOrder": [
    "6AR4SV4ZYat",
    "5ml7jyaiXGc",
    "5dLAzY4SKGI",
    "6XQ2Lfxmzw1",
    "5y0cYcWaZ3N",
    "5iWbenzMEWM",
    "6IgV5Xf2ecV",
    "5jTlwgcUi8o",
    "6AtIwHwQnjq",
    "5zwBwMPydB6",
    "6rj9XvcPk4j",
    "60qqSfn2Gy4",
    "69u2IVtFccK",
    "6lLQh7AsdfG",
    "5wmBV8vjFPm",
    "6VGgu6tqinV",
    "6rO2Rjnvtcl",
    "5g85v9o85Yb",
    "62u9PmQKgzB",
    "5o4GAEeLE09",
    "6VYnewFze63",
    "69cSEO6heKU",
    "6mhmEQSWIJZ",
    "5UlnwWVKUrp",
    "6oOWqUyP2WL",
    "6fJRLUtSDVL",
    "6V8v7yM3VzE",
    "6TsqDEfppnq",
    "5tNzQg4qrZn",
    "5udKoy5uKgm",
    "6PxxtyG4oap",
    "5eaO0Lz8ZMk",
    "6SKvjji8cdv",
    "5a8YIrSITc8",
    "6ddgVMlBGEg",
    "6eHtnAfM3bY",
    "604TQFYNuzG",
    "6EA329REfHb",
    "6FkRXfgJQkY",
    "6G1VrKuOhCw",
    "6WIqLhHr1Cm",
    "6OrD7bra4Ko",
    "5iew2M44w24"
  ],
  "slides": {
    "6AR4SV4ZYat": {
      "id": "6AR4SV4ZYat",
      "slideNumber": 1,
      "title": "Untitled Slide",
      "lmsId": "Slide1",
      "jsPath": "html5/data/js/6AR4SV4ZYat.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [],
      "texts": [],
      "audios": [],
      "images": [],
      "videos": [
        {
          "layerIndex": 0,
          "objectId": "5fW9LQF7to8",
          "url": "",
          "posterUrl": "",
          "width": 1280,
          "height": 720
        }
      ],
      "quizQuestion": null
    },
    "5ml7jyaiXGc": {
      "id": "5ml7jyaiXGc",
      "slideNumber": 2,
      "title": "Untitled Slide",
      "lmsId": "Slide2",
      "jsPath": "html5/data/js/5ml7jyaiXGc.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [],
      "texts": [],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "62QsWquwv8Z",
          "assetId": 14,
          "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
          "durationMs": 861
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5nhOpdTOED0",
          "assetId": 15,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6abPhs28LFk",
          "assetId": 16,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6hcl05Gaq0D",
          "assetId": 17,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5XGl8w6XPzu",
          "assetId": 18,
          "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
          "durationMs": 861
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5iiAdMW9N5t",
          "assetId": 19,
          "url": "story_content/6fP6CzyqyMk_44100_56_0.mp3",
          "durationMs": 133511
        },
        {
          "layerIndex": 1,
          "layerId": "6ID9JVqeujI",
          "audioId": "662BJfvgEJA",
          "assetId": 23,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6ID9JVqeujI",
          "audioId": "6PxoTng57Ky",
          "assetId": 24,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        },
        {
          "layerIndex": 2,
          "layerId": "5daJyf2E28Q",
          "audioId": "616ET8ewzWK",
          "assetId": 26,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "5daJyf2E28Q",
          "audioId": "6P1aqfTJ6Fy",
          "assetId": 27,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        },
        {
          "layerIndex": 3,
          "layerId": "6oUt0Npou2e",
          "audioId": "6BpLg1qdQBK",
          "assetId": 30,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 3,
          "layerId": "6oUt0Npou2e",
          "audioId": "5hPEkZ7xBCH",
          "assetId": 31,
          "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
          "durationMs": 861
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6Ba08MJD9Os",
          "assetId": 2,
          "url": "story_content/6Q69tvGOis4.gif",
          "altText": "ezgif-22f102a5fd7e3796.gif",
          "width": 570,
          "height": 318
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "61iyTtN5i5D",
          "assetId": 3,
          "url": "story_content/5r8KdQdV9SH.png",
          "altText": "login starla.png",
          "width": 856,
          "height": 769
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6RhrYBTnxET",
          "assetId": 4,
          "url": "story_content/6ZqJN7v5CWr.png",
          "altText": "starla kayu.png",
          "width": 1620,
          "height": 672
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6PAGonaw9CX",
          "assetId": 5,
          "url": "story_content/65Vuggwqrb8_RG_P_436_0_231_164.gif",
          "altText": "download (3).gif",
          "width": 232,
          "height": 165
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5e60XlfFdPU",
          "assetId": 6,
          "url": "story_content/5WGLEVYzj2G.png",
          "altText": "mulai awal.png",
          "width": 514,
          "height": 212
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6hai0TUXah7",
          "assetId": 7,
          "url": "story_content/6KFvI2w3gL9.png",
          "altText": "740959a.png",
          "width": 198,
          "height": 142
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6MH4z3L8jTt",
          "assetId": 8,
          "url": "story_content/6I2HdKkSgG6.png",
          "altText": "7409593x.png",
          "width": 180,
          "height": 137
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5UtFJ5n4cl4",
          "assetId": 9,
          "url": "story_content/6fBYfnad2Zd.png",
          "altText": "7409593c.png",
          "width": 200,
          "height": 153
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5UtFJ5n4cl4",
          "assetId": 10,
          "url": "story_content/5rXZGGJH9iG.png",
          "altText": "Desain tanpa judul (72).png",
          "width": 160,
          "height": 135
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5VbkrAiIMXD",
          "assetId": 11,
          "url": "story_content/6JVXCNVq6ai_P_649_0_704_270.png",
          "altText": "budaya starla.png",
          "width": 704,
          "height": 270
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6EsvQoxj52t",
          "assetId": 12,
          "url": "story_content/6nov80Jmg0Y_X.gif",
          "altText": "913561_9bcd5.gif",
          "width": 254,
          "height": 224
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5rfuOUTO45w",
          "assetId": 13,
          "url": "story_content/5dCAlHC5W8Z.png",
          "altText": "v2.png",
          "width": 184,
          "height": 128
        },
        {
          "layerIndex": 1,
          "layerId": "6ID9JVqeujI",
          "objectId": "6eb4PmDsps1",
          "assetId": 21,
          "url": "story_content/6EfvCxuLoY5.png",
          "altText": "Desain tanpa judul (67).png",
          "width": 1208,
          "height": 647
        },
        {
          "layerIndex": 1,
          "layerId": "6ID9JVqeujI",
          "objectId": "5ZMtYjS7oxd",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        },
        {
          "layerIndex": 2,
          "layerId": "5daJyf2E28Q",
          "objectId": "6exxdHWPhvw",
          "assetId": 25,
          "url": "story_content/6qmYZKenWib.png",
          "altText": "info.png",
          "width": 1539,
          "height": 882
        },
        {
          "layerIndex": 2,
          "layerId": "5daJyf2E28Q",
          "objectId": "5tBmZlAoMEi",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        },
        {
          "layerIndex": 3,
          "layerId": "6oUt0Npou2e",
          "objectId": "6NmAh1Gt8vY",
          "assetId": 29,
          "url": "story_content/5ZAJjyZwSHr.png",
          "altText": "pralogin.png",
          "width": 1181,
          "height": 659
        },
        {
          "layerIndex": 3,
          "layerId": "6oUt0Npou2e",
          "objectId": "5Zr3famKnLd",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "5dLAzY4SKGI": {
      "id": "5dLAzY4SKGI",
      "slideNumber": 3,
      "title": "Untitled Slide",
      "lmsId": "Slide3",
      "jsPath": "html5/data/js/5dLAzY4SKGI.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Selamat Datang di Starla Budaya! Sebelum kita belajar dan bermain, kenalan dulu  yuk saya, Starla! Studi Pelajar Pancasila Kita akan belajar tentang Budaya Indonesia. Starla harap, Kamu bisa Mengenal, Menghargai, Merefleksi, dan Mengaplikasikan Keragaman Budaya di Indonesia."
      ],
      "texts": [
        {
          "objectId": "6Pi2Yx4AGKv",
          "uniqueId": "6Pi2Yx4AGKv_-263303062",
          "linkId": "txt__default_6Pi2Yx4AGKv",
          "commandSetId": "commandset-38",
          "altText": "Selamat Datang di Starla Budaya!\n\nSebelum kita belajar dan bermain,\nkenalan dulu  yuk saya, Starla!\nStudi Pelajar Pancasila\nKita akan belajar tentang\nBudaya Indonesia. Starla harap,\nKamu bisa Mengenal, Menghargai,\nMerefleksi, dan Mengaplikasikan\nKeragaman Budaya di Indonesia.",
          "lines": [
            "Selamat Datang di Starla Budaya!",
            "Sebelum kita belajar dan bermain,",
            "kenalan dulu  yuk saya, Starla!",
            "Studi Pelajar Pancasila",
            "Kita akan belajar tentang",
            "Budaya Indonesia. Starla harap,",
            "Kamu bisa Mengenal, Menghargai,",
            "Merefleksi, dan Mengaplikasikan",
            "Keragaman Budaya di Indonesia."
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "68xAHtlKzRR",
          "assetId": 36,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6VYpPkhwqNQ",
          "assetId": 37,
          "url": "story_content/6Zh1DGetjr4_44100_56_0.mp3",
          "durationMs": 7421
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6MwuBRXyyHe",
          "assetId": 38,
          "url": "story_content/5kRUm7Nir2B_44100_56_0.mp3",
          "durationMs": 63631
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5hoaHqSjwr4",
          "assetId": 39,
          "url": "story_content/5ZYCAe9VtmT_44100_56_0.mp3",
          "durationMs": 20381
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5YGEbMQBbcX",
          "assetId": 40,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5zDaTGqm7Es",
          "assetId": 41,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 1,
          "layerId": "6mjWGxoB818",
          "audioId": "6ghm27BZ8Ee",
          "assetId": 43,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6mjWGxoB818",
          "audioId": "6jwF8aXK5t2",
          "assetId": 44,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        },
        {
          "layerIndex": 2,
          "layerId": "6WM7jDPn6zX",
          "audioId": "5XEQpUv8fX6",
          "assetId": 45,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6WM7jDPn6zX",
          "audioId": "6ocdnRwYzAa",
          "assetId": 46,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "62Hyd5Mbky0",
          "assetId": 33,
          "url": "story_content/62oB2J2cBdW.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6SMFoTLAdPz",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6ibvTx7Qxkl",
          "assetId": 35,
          "url": "story_content/5hv8C0oRfrb.png",
          "altText": "Desain tanpa judul (52).png",
          "width": 282,
          "height": 506
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5kgeQZ4WLbR",
          "assetId": 7,
          "url": "story_content/6KFvI2w3gL9.png",
          "altText": "740959a.png",
          "width": 198,
          "height": 142
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6Ztpql2jkLe",
          "assetId": 8,
          "url": "story_content/6I2HdKkSgG6.png",
          "altText": "7409593x.png",
          "width": 180,
          "height": 137
        },
        {
          "layerIndex": 1,
          "layerId": "6mjWGxoB818",
          "objectId": "5r4Mq3C47Ot",
          "assetId": 21,
          "url": "story_content/6EfvCxuLoY5.png",
          "altText": "Desain tanpa judul (67).png",
          "width": 1208,
          "height": 647
        },
        {
          "layerIndex": 1,
          "layerId": "6mjWGxoB818",
          "objectId": "6UhbxgMqZ1H",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        },
        {
          "layerIndex": 2,
          "layerId": "6WM7jDPn6zX",
          "objectId": "5zJYoWxs1Lg",
          "assetId": 25,
          "url": "story_content/6qmYZKenWib.png",
          "altText": "info.png",
          "width": 1539,
          "height": 882
        },
        {
          "layerIndex": 2,
          "layerId": "6WM7jDPn6zX",
          "objectId": "5ffEdVIgGid",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6XQ2Lfxmzw1": {
      "id": "6XQ2Lfxmzw1",
      "slideNumber": 4,
      "title": "Untitled Slide",
      "lmsId": "Slide4",
      "jsPath": "html5/data/js/6XQ2Lfxmzw1.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Rumah Adat",
        "Bentuk apakah ini?"
      ],
      "texts": [
        {
          "objectId": "60IjJlwQNmP",
          "uniqueId": "60IjJlwQNmP_-1073115308",
          "linkId": "txt__default_60IjJlwQNmP",
          "commandSetId": "commandset-41",
          "altText": "Rumah Adat",
          "lines": [
            "Rumah Adat"
          ]
        },
        {
          "objectId": "6HtFeNDQSxT",
          "uniqueId": "6HtFeNDQSxT_1061919463",
          "linkId": "txt__default_6HtFeNDQSxT",
          "commandSetId": "commandset-44",
          "altText": "Bentuk apakah ini?",
          "lines": [
            "Bentuk apakah ini?"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6jGekkFZKmM",
          "assetId": 49,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6VJTAB4Rry1",
          "assetId": 50,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5jo4Z3RHqkY",
          "assetId": 51,
          "url": "story_content/6Zh1DGetjr4_44100_56_0.mp3",
          "durationMs": 7421
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6nqEtrxXczL",
          "assetId": 52,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6Y8zwpud5tg",
          "assetId": 53,
          "url": "story_content/5kRUm7Nir2B_44100_56_0.mp3",
          "durationMs": 63631
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6Ye8CJsTrCm",
          "assetId": 54,
          "url": "story_content/6ovJchPVZxx_44100_56_0.mp3",
          "durationMs": 10482
        },
        {
          "layerIndex": 1,
          "layerId": "6qHJFatjFEQ",
          "audioId": "6TYCSzmfSl4",
          "assetId": 55,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6qHJFatjFEQ",
          "audioId": "6L18xcwzz7I",
          "assetId": 56,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        },
        {
          "layerIndex": 2,
          "layerId": "67Sz4uXEphb",
          "audioId": "6qBvXh39Bcx",
          "assetId": 58,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "67Sz4uXEphb",
          "audioId": "66AdBB7b2nZ",
          "assetId": 59,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6lGKmQikGaZ",
          "assetId": 33,
          "url": "story_content/62oB2J2cBdW.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5tgs3LEMQLc",
          "assetId": 7,
          "url": "story_content/6KFvI2w3gL9.png",
          "altText": "740959a.png",
          "width": 198,
          "height": 142
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "61KsCC2dzKE",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6WiEH8MEDeE",
          "assetId": 8,
          "url": "story_content/6I2HdKkSgG6.png",
          "altText": "7409593x.png",
          "width": 180,
          "height": 137
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5zGMKq0PPzG",
          "assetId": 47,
          "url": "story_content/5fE9gitG6bb.png",
          "altText": "Desain tanpa judul (51).png",
          "width": 1097,
          "height": 223
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6RR6VggxcaX",
          "assetId": 48,
          "url": "story_content/6EcL7dPjjHh.png",
          "altText": "tahukah kamu starla.png",
          "width": 1174,
          "height": 178
        },
        {
          "layerIndex": 1,
          "layerId": "6qHJFatjFEQ",
          "objectId": "66C5ie4pKHX",
          "assetId": 25,
          "url": "story_content/6qmYZKenWib.png",
          "altText": "info.png",
          "width": 1539,
          "height": 882
        },
        {
          "layerIndex": 1,
          "layerId": "6qHJFatjFEQ",
          "objectId": "5yqk8LZSHaF",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        },
        {
          "layerIndex": 2,
          "layerId": "67Sz4uXEphb",
          "objectId": "6FKoCi8DG3Z",
          "assetId": 21,
          "url": "story_content/6EfvCxuLoY5.png",
          "altText": "Desain tanpa judul (67).png",
          "width": 1208,
          "height": 647
        },
        {
          "layerIndex": 2,
          "layerId": "67Sz4uXEphb",
          "objectId": "6DTzHsRwaqH",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "5y0cYcWaZ3N": {
      "id": "5y0cYcWaZ3N",
      "slideNumber": 5,
      "title": "Untitled Slide",
      "lmsId": "Slide5",
      "jsPath": "html5/data/js/5y0cYcWaZ3N.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Senjata Tradisional",
        "Benda apakah ini?"
      ],
      "texts": [
        {
          "objectId": "6GiNloVmCmH",
          "uniqueId": "6GiNloVmCmH_1905438594",
          "linkId": "txt__default_6GiNloVmCmH",
          "commandSetId": "commandset-47",
          "altText": "Senjata Tradisional",
          "lines": [
            "Senjata Tradisional"
          ]
        },
        {
          "objectId": "60fWioKq3Lx",
          "uniqueId": "60fWioKq3Lx_-1993307852",
          "linkId": "txt__default_60fWioKq3Lx",
          "commandSetId": "commandset-49",
          "altText": "Benda apakah ini?",
          "lines": [
            "Benda apakah ini?"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6pjBOIHRBcm",
          "assetId": 61,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6oj4sKV9aTJ",
          "assetId": 62,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6RbK8JmIAdX",
          "assetId": 63,
          "url": "story_content/6Zh1DGetjr4_44100_56_0.mp3",
          "durationMs": 7421
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5sugiCGjWkl",
          "assetId": 64,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5vOeGpNyTI4",
          "assetId": 65,
          "url": "story_content/5kRUm7Nir2B_44100_56_0.mp3",
          "durationMs": 63631
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6XUvJqx6MSl",
          "assetId": 66,
          "url": "story_content/6apy3oZfWFX_44100_56_0.mp3",
          "durationMs": 11892
        },
        {
          "layerIndex": 1,
          "layerId": "64u5eiIV0K1",
          "audioId": "6hwJ2eTUqLt",
          "assetId": 67,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "64u5eiIV0K1",
          "audioId": "5l0pD7IixHm",
          "assetId": 68,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        },
        {
          "layerIndex": 2,
          "layerId": "5sNHndzy8iJ",
          "audioId": "6n7NQQlJKKj",
          "assetId": 70,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "5sNHndzy8iJ",
          "audioId": "6cryi5teTXZ",
          "assetId": 71,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6GJm10za8ix",
          "assetId": 33,
          "url": "story_content/62oB2J2cBdW.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6Aojw0y8X7H",
          "assetId": 7,
          "url": "story_content/6KFvI2w3gL9.png",
          "altText": "740959a.png",
          "width": 198,
          "height": 142
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5r7k2C13xYY",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5WQpAIYsz5d",
          "assetId": 8,
          "url": "story_content/6I2HdKkSgG6.png",
          "altText": "7409593x.png",
          "width": 180,
          "height": 137
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6hvOK7p0KXD",
          "assetId": 60,
          "url": "story_content/6GK4OH9jOlj.png",
          "altText": "Desain tanpa judul (50).png",
          "width": 1168,
          "height": 357
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5xYvKWmPXWi",
          "assetId": 48,
          "url": "story_content/6EcL7dPjjHh.png",
          "altText": "tahukah kamu starla.png",
          "width": 1174,
          "height": 178
        },
        {
          "layerIndex": 1,
          "layerId": "64u5eiIV0K1",
          "objectId": "6buBqvk3zpe",
          "assetId": 25,
          "url": "story_content/6qmYZKenWib.png",
          "altText": "info.png",
          "width": 1539,
          "height": 882
        },
        {
          "layerIndex": 1,
          "layerId": "64u5eiIV0K1",
          "objectId": "6ODgzMJxKPk",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        },
        {
          "layerIndex": 2,
          "layerId": "5sNHndzy8iJ",
          "objectId": "5iBaskfo7HO",
          "assetId": 21,
          "url": "story_content/6EfvCxuLoY5.png",
          "altText": "Desain tanpa judul (67).png",
          "width": 1208,
          "height": 647
        },
        {
          "layerIndex": 2,
          "layerId": "5sNHndzy8iJ",
          "objectId": "68C1eXDfgH3",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "5iWbenzMEWM": {
      "id": "5iWbenzMEWM",
      "slideNumber": 6,
      "title": "Untitled Slide",
      "lmsId": "Slide6",
      "jsPath": "html5/data/js/5iWbenzMEWM.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Gamelan",
        "Apa nama benda ini?"
      ],
      "texts": [
        {
          "objectId": "5lFE2TrTQjV",
          "uniqueId": "5lFE2TrTQjV_-1184703554",
          "linkId": "txt__default_5lFE2TrTQjV",
          "commandSetId": "commandset-51",
          "altText": "Gamelan",
          "lines": [
            "Gamelan"
          ]
        },
        {
          "objectId": "6jX44oAxd5S",
          "uniqueId": "6jX44oAxd5S_17977966",
          "linkId": "txt__default_6jX44oAxd5S",
          "commandSetId": "commandset-54",
          "altText": "Apa nama benda ini?",
          "lines": [
            "Apa nama benda ini?"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6YS3t3dzbQq",
          "assetId": 73,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "66Qt6TyyxSH",
          "assetId": 74,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5zZJIfwtF3j",
          "assetId": 75,
          "url": "story_content/6Zh1DGetjr4_44100_56_0.mp3",
          "durationMs": 7421
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "61h9IBkFupU",
          "assetId": 76,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "65hcKq984aO",
          "assetId": 77,
          "url": "story_content/5kRUm7Nir2B_44100_56_0.mp3",
          "durationMs": 63631
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6JYxXRoxYgi",
          "assetId": 78,
          "url": "story_content/6W6bjByNtHg_44100_56_0.mp3",
          "durationMs": 15331
        },
        {
          "layerIndex": 1,
          "layerId": "6CxdLWuB6Xv",
          "audioId": "6grwxaX9awo",
          "assetId": 79,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6CxdLWuB6Xv",
          "audioId": "6GOc7JPvVfS",
          "assetId": 80,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        },
        {
          "layerIndex": 2,
          "layerId": "6KrptA4L84i",
          "audioId": "5WGtCdBZrJu",
          "assetId": 82,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6KrptA4L84i",
          "audioId": "5ixjqZXVHKq",
          "assetId": 83,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6hHZP19HnwQ",
          "assetId": 33,
          "url": "story_content/62oB2J2cBdW.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5iLvcd4xk0z",
          "assetId": 7,
          "url": "story_content/6KFvI2w3gL9.png",
          "altText": "740959a.png",
          "width": 198,
          "height": 142
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6g9PyClc9Ga",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5qWsHvULTWp",
          "assetId": 8,
          "url": "story_content/6I2HdKkSgG6.png",
          "altText": "7409593x.png",
          "width": 180,
          "height": 137
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6khdzwB4gbA",
          "assetId": 72,
          "url": "story_content/5X5KPiU9Isy.png",
          "altText": "Desain tanpa judul (70).png",
          "width": 1083,
          "height": 322
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5g1AOMszlO3",
          "assetId": 48,
          "url": "story_content/6EcL7dPjjHh.png",
          "altText": "tahukah kamu starla.png",
          "width": 1174,
          "height": 178
        },
        {
          "layerIndex": 1,
          "layerId": "6CxdLWuB6Xv",
          "objectId": "5eCesPD9p2h",
          "assetId": 25,
          "url": "story_content/6qmYZKenWib.png",
          "altText": "info.png",
          "width": 1539,
          "height": 882
        },
        {
          "layerIndex": 1,
          "layerId": "6CxdLWuB6Xv",
          "objectId": "5bho98CMin1",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        },
        {
          "layerIndex": 2,
          "layerId": "6KrptA4L84i",
          "objectId": "5VvHnWLINWK",
          "assetId": 21,
          "url": "story_content/6EfvCxuLoY5.png",
          "altText": "Desain tanpa judul (67).png",
          "width": 1208,
          "height": 647
        },
        {
          "layerIndex": 2,
          "layerId": "6KrptA4L84i",
          "objectId": "665ZbJN207i",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6IgV5Xf2ecV": {
      "id": "6IgV5Xf2ecV",
      "slideNumber": 7,
      "title": "Untitled Slide",
      "lmsId": "Slide7",
      "jsPath": "html5/data/js/6IgV5Xf2ecV.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Tutup"
      ],
      "texts": [
        {
          "objectId": "5cduCNQqTlN_expandinglabel",
          "uniqueId": "5v5bzBia6sD_-1536232699",
          "linkId": "txt__default_5v5bzBia6sD",
          "commandSetId": "commandset-56",
          "altText": " Tutup",
          "lines": [
            " Tutup"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "62KvZSmnlSa",
          "assetId": 86,
          "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
          "durationMs": 861
        }
      ],
      "images": [],
      "videos": [
        {
          "layerIndex": 0,
          "objectId": "6IvTTb86pVv",
          "url": "",
          "posterUrl": "",
          "width": 1280,
          "height": 720
        }
      ],
      "quizQuestion": null
    },
    "5jTlwgcUi8o": {
      "id": "5jTlwgcUi8o",
      "slideNumber": 8,
      "title": "Untitled Slide",
      "lmsId": "Slide8",
      "jsPath": "html5/data/js/5jTlwgcUi8o.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [],
      "texts": [],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5W0v9PtUWvz",
          "assetId": 88,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6U38sGT8aLM",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6AtIwHwQnjq": {
      "id": "6AtIwHwQnjq",
      "slideNumber": 9,
      "title": "Untitled Slide",
      "lmsId": "Slide9",
      "jsPath": "html5/data/js/6AtIwHwQnjq.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [],
      "texts": [],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5h1dLXJ9Ami",
          "assetId": 91,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6S2fZM6lKot",
          "assetId": 92,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6LTu79HuVO4",
          "assetId": 93,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5ZyJogjXSPr",
          "assetId": 94,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5kpWER98FYi",
          "assetId": 95,
          "url": "story_content/5WPKUcAEWAA_44100_56_0.mp3",
          "durationMs": 62152
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5goKs081cYq",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5VPCvIjv1Te",
          "assetId": 90,
          "url": "story_content/5cdUoSSngTY_Y.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "5zwBwMPydB6": {
      "id": "5zwBwMPydB6",
      "slideNumber": 10,
      "title": "Untitled Slide",
      "lmsId": "Slide10",
      "jsPath": "html5/data/js/5zwBwMPydB6.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [],
      "texts": [],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6EhknmOx2sv",
          "assetId": 99,
          "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
          "durationMs": 861
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6LrdyLEVQwq",
          "assetId": 100,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6TRSU1fcyJF",
          "assetId": 101,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5cgPXT9qXft",
          "assetId": 102,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6iju8AhhHB7",
          "assetId": 103,
          "url": "story_content/5WPKUcAEWAA_44100_56_0.mp3",
          "durationMs": 62152
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6bHT3oW3g86",
          "assetId": 97,
          "url": "story_content/661nhMkxmjk.png",
          "altText": "KEMBALI.png",
          "width": 548,
          "height": 170
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5eKaHKHmNrE",
          "assetId": 98,
          "url": "story_content/5cdUoSSngTY_X.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6rj9XvcPk4j": {
      "id": "6rj9XvcPk4j",
      "slideNumber": 11,
      "title": "Untitled Slide",
      "lmsId": "Slide11",
      "jsPath": "html5/data/js/6rj9XvcPk4j.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Bagaimana cara menghargai  Bahasa Daerah?",
        "1. Meminta teman mengajari bahasa  daerahnya 2. Meminta penjelasan tentang bahasa yang  tidak dimengerti 3. Berbicara dengan teman berbeda suku  menggunakan bahasa indonesia Bahasa daerah mana saja yang kamu ketahui? Ayo ucapkan pada gurumu"
      ],
      "texts": [
        {
          "objectId": "6il2W8nNyIQ",
          "uniqueId": "6il2W8nNyIQ_1857375325",
          "linkId": "txt__default_6il2W8nNyIQ",
          "commandSetId": "commandset-69",
          "altText": "Bagaimana cara menghargai Bahasa Daerah?",
          "lines": [
            "Bagaimana cara menghargai ",
            "Bahasa Daerah?"
          ]
        },
        {
          "objectId": "5XoYMavuVi7",
          "uniqueId": "5XoYMavuVi7_-1278779070",
          "linkId": "txt__default_5XoYMavuVi7",
          "commandSetId": "commandset-73",
          "altText": "Meminta teman mengajari bahasa daerahnya\nMeminta penjelasan tentang bahasa yang tidak dimengerti\nBerbicara dengan teman berbeda suku menggunakan bahasa indonesia\n\nBahasa daerah mana saja yang kamu\nketahui? Ayo ucapkan pada gurumu",
          "lines": [
            "1.",
            "Meminta teman mengajari bahasa ",
            "daerahnya",
            "2.",
            "Meminta penjelasan tentang bahasa yang ",
            "tidak dimengerti",
            "3.",
            "Berbicara dengan teman berbeda suku ",
            "menggunakan bahasa indonesia",
            "Bahasa daerah mana saja yang kamu",
            "ketahui? Ayo ucapkan pada gurumu"
          ]
        },
        {
          "objectId": "5w3ua3vmKlB",
          "uniqueId": "5w3ua3vmKlB_451455238",
          "linkId": "txt__default_5w3ua3vmKlB",
          "commandSetId": "commandset-75",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "6VAh6q0KsmB",
          "uniqueId": "6VAh6q0KsmB_-1521296231",
          "linkId": "txt__default_6VAh6q0KsmB",
          "commandSetId": "commandset-77",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5uQicOr08xn",
          "uniqueId": "5uQicOr08xn_-278569448",
          "linkId": "txt__default_5uQicOr08xn",
          "commandSetId": "commandset-78",
          "altText": "?",
          "lines": [
            "?"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6GPu6uWKdFI",
          "assetId": 105,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6WJwxJPPCHu",
          "assetId": 106,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6Lqw2jz8LKD",
          "assetId": 107,
          "url": "story_content/5kqdQfaYooj_44100_56_0.mp3",
          "durationMs": 40782
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6Engqo3w5Tb",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6iIiEKqsgaD",
          "assetId": 35,
          "url": "story_content/5hv8C0oRfrb.png",
          "altText": "Desain tanpa judul (52).png",
          "width": 282,
          "height": 506
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5vXm7sJsGjh",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5YBFkrmVWiV",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "60qqSfn2Gy4": {
      "id": "60qqSfn2Gy4",
      "slideNumber": 12,
      "title": "Untitled Slide",
      "lmsId": "Slide12",
      "jsPath": "html5/data/js/60qqSfn2Gy4.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Keragaman Lagu Daerah Lagu daerah adalah lagu khas suatu daerah. Lagu daerah  menggunakan bahasa dan dialek daerah setempat. Lagu  daerah dinyanyikan saat pementasan tari, permainan  tradisional, pesta rakyat, atau pertunjukan daerah. Cerita  yang disampaikan dalam lagu daerah dapat berupa  keindahan alam, keagamaan, hubungan masyarakat, atau  adat istiadat. Setiap daerah memiliki lagu daerah loh dan kita harus ikut melestarikan lagu daerah yang ada di negara kita."
      ],
      "texts": [
        {
          "objectId": "5wTpugdXVsD",
          "uniqueId": "5wTpugdXVsD_-1368454166",
          "linkId": "txt__default_5wTpugdXVsD",
          "commandSetId": "commandset-80",
          "altText": "Keragaman Lagu Daerah\n\nLagu daerah adalah lagu khas suatu daerah. Lagu daerah menggunakan bahasa dan dialek daerah setempat. Lagu daerah dinyanyikan saat pementasan tari, permainan tradisional, pesta rakyat, atau pertunjukan daerah. Cerita yang disampaikan dalam lagu daerah dapat berupa keindahan alam, keagamaan, hubungan masyarakat, atau adat istiadat.\n\nSetiap daerah memiliki lagu daerah loh dan kita harus\nikut melestarikan lagu daerah yang ada di negara kita.",
          "lines": [
            "Keragaman Lagu Daerah",
            "Lagu daerah adalah lagu khas suatu daerah. Lagu daerah ",
            "menggunakan bahasa dan dialek daerah setempat. Lagu ",
            "daerah dinyanyikan saat pementasan tari, permainan ",
            "tradisional, pesta rakyat, atau pertunjukan daerah. Cerita ",
            "yang disampaikan dalam lagu daerah dapat berupa ",
            "keindahan alam, keagamaan, hubungan masyarakat, atau ",
            "adat istiadat.",
            "Setiap daerah memiliki lagu daerah loh dan kita harus",
            "ikut melestarikan lagu daerah yang ada di negara kita."
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6psnrJF9DAt",
          "assetId": 108,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6pFdtItO0BM",
          "assetId": 109,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6btVfDvT5dM",
          "assetId": 110,
          "url": "story_content/5XbL9belZlq_44100_56_0.mp3",
          "durationMs": 39922
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6NgCUhSXrkz",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5YH3nrR9MP2",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5ZRw3LOjfbD",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "69u2IVtFccK": {
      "id": "69u2IVtFccK",
      "slideNumber": 13,
      "title": "Untitled Slide",
      "lmsId": "Slide13",
      "jsPath": "html5/data/js/69u2IVtFccK.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Bagaimana cara menghargai  lagu daerah?",
        "1. Memberi tepuk tangan setelah teman  menyanyikan lagu daerahnya 2. Mempelajari lagu daerah lain 3. Menyanyikan lagu daerah dengan lirik yang  benar Kalau di daerah kamu apa judul lagu daerah yang kamu ketahui?"
      ],
      "texts": [
        {
          "objectId": "5rvhBfmBejH",
          "uniqueId": "5rvhBfmBejH_-325590904",
          "linkId": "txt__default_5rvhBfmBejH",
          "commandSetId": "commandset-82",
          "altText": "Bagaimana cara menghargai lagu daerah?",
          "lines": [
            "Bagaimana cara menghargai ",
            "lagu daerah?"
          ]
        },
        {
          "objectId": "6AM2AqJsldI",
          "uniqueId": "6AM2AqJsldI_2058820987",
          "linkId": "txt__default_6AM2AqJsldI",
          "commandSetId": "commandset-75",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5qeV3aBVvJN",
          "uniqueId": "5qeV3aBVvJN_483112372",
          "linkId": "txt__default_5qeV3aBVvJN",
          "commandSetId": "commandset-77",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "6bMNKKgtpv6",
          "uniqueId": "6bMNKKgtpv6_-767036747",
          "linkId": "txt__default_6bMNKKgtpv6",
          "commandSetId": "commandset-78",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5pDSYnd3bFk",
          "uniqueId": "5pDSYnd3bFk_1851558633",
          "linkId": "txt__default_5pDSYnd3bFk",
          "commandSetId": "commandset-84",
          "altText": "Memberi tepuk tangan setelah teman menyanyikan lagu daerahnya\nMempelajari lagu daerah lain\nMenyanyikan lagu daerah dengan lirik yang benar\n\nKalau di daerah kamu apa judul lagu daerah\nyang kamu ketahui?",
          "lines": [
            "1.",
            "Memberi tepuk tangan setelah teman ",
            "menyanyikan lagu daerahnya",
            "2.",
            "Mempelajari lagu daerah lain",
            "3.",
            "Menyanyikan lagu daerah dengan lirik yang ",
            "benar",
            "Kalau di daerah kamu apa judul lagu daerah",
            "yang kamu ketahui?"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "68tnHVua7Z1",
          "assetId": 111,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6ooZTuBjhGX",
          "assetId": 112,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6Fd5w9Bnd4b",
          "assetId": 113,
          "url": "story_content/63sJfFpLapV_44100_56_0.mp3",
          "durationMs": 41821
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6JNJBiLPazc",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6kZorRqNJ55",
          "assetId": 35,
          "url": "story_content/5hv8C0oRfrb.png",
          "altText": "Desain tanpa judul (52).png",
          "width": 282,
          "height": 506
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5sYGKiU9eGo",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6TRGULoxByA",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6lLQh7AsdfG": {
      "id": "6lLQh7AsdfG",
      "slideNumber": 14,
      "title": "Untitled Slide",
      "lmsId": "Slide14",
      "jsPath": "html5/data/js/6lLQh7AsdfG.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Keragaman Alat Musik Tradisional Lagu daerah biasanya diiringi oleh permainan alat  musik daerah setempat. Iringan permainan alat   musik daerah membuat lagu daerah menjadi lebih  menarik untuk didengarkan. Ada berbagai jenis alat  musik daerah di Indonesia. Oleh sebab itu, kita harus  menghargai keragaman alat musik daerah ya.."
      ],
      "texts": [
        {
          "objectId": "5lhIEbEDaDd",
          "uniqueId": "5lhIEbEDaDd_1977962740",
          "linkId": "txt__default_5lhIEbEDaDd",
          "commandSetId": "commandset-86",
          "altText": "Keragaman Alat Musik Tradisional\n\nLagu daerah biasanya diiringi oleh permainan alat musik daerah setempat. Iringan permainan alat  musik daerah membuat lagu daerah menjadi lebih menarik untuk didengarkan. Ada berbagai jenis alat musik daerah di Indonesia. Oleh sebab itu, kita harus menghargai keragaman alat musik daerah ya..",
          "lines": [
            "Keragaman Alat Musik Tradisional",
            "Lagu daerah biasanya diiringi oleh permainan alat ",
            "musik daerah setempat. Iringan permainan alat  ",
            "musik daerah membuat lagu daerah menjadi lebih ",
            "menarik untuk didengarkan. Ada berbagai jenis alat ",
            "musik daerah di Indonesia. Oleh sebab itu, kita harus ",
            "menghargai keragaman alat musik daerah ya.."
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6hDiX1VxSND",
          "assetId": 115,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5vPXtp0qFe4",
          "assetId": 116,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5fkbTSbYal2",
          "assetId": 117,
          "url": "story_content/5ZwosbRRQyX_44100_56_0.mp3",
          "durationMs": 38062
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6kIYz4PKJq4",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6OxBJtlAmgg",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6LnKKrqfXvV",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6j9WSZkDgpm",
          "assetId": 114,
          "url": "story_content/5nmvbLuGxeM.png",
          "altText": "Desain tanpa judul (69).png",
          "width": 1127,
          "height": 334
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "5wmBV8vjFPm": {
      "id": "5wmBV8vjFPm",
      "slideNumber": 15,
      "title": "Untitled Slide",
      "lmsId": "Slide15",
      "jsPath": "html5/data/js/5wmBV8vjFPm.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Bagaimana cara menghargai alat  musik tradisional?",
        "1. Memberi tepuk tangan setelah teman  menyanyikan lagu daerahnya 2. Mempelajari lagu daerah lain 3. Menyanyikan lagu daerah dengan lirik  yang benar Kalau di daerah kamu apa nama alat musik tradisional yang kamu ketauhi?"
      ],
      "texts": [
        {
          "objectId": "6hxPlL93Pu6",
          "uniqueId": "6hxPlL93Pu6_-1962402918",
          "linkId": "txt__default_6hxPlL93Pu6",
          "commandSetId": "commandset-89",
          "altText": "Bagaimana cara menghargai alat musik tradisional?",
          "lines": [
            "Bagaimana cara menghargai alat ",
            "musik tradisional?"
          ]
        },
        {
          "objectId": "5ylHTY4wgDU",
          "uniqueId": "5ylHTY4wgDU_-1326012540",
          "linkId": "txt__default_5ylHTY4wgDU",
          "commandSetId": "commandset-75",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "6NPpAvvxYy7",
          "uniqueId": "6NPpAvvxYy7_-941969736",
          "linkId": "txt__default_6NPpAvvxYy7",
          "commandSetId": "commandset-77",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "6Oc0sZXLZYz",
          "uniqueId": "6Oc0sZXLZYz_400333630",
          "linkId": "txt__default_6Oc0sZXLZYz",
          "commandSetId": "commandset-78",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5m1Wh20QXQc",
          "uniqueId": "5m1Wh20QXQc_-1168916714",
          "linkId": "txt__default_5m1Wh20QXQc",
          "commandSetId": "commandset-91",
          "altText": "Memberi tepuk tangan setelah teman menyanyikan lagu daerahnya\nMempelajari lagu daerah lain\nMenyanyikan lagu daerah dengan lirik yang benar\n\nKalau di daerah kamu apa nama alat\nmusik tradisional yang kamu ketauhi?",
          "lines": [
            "1.",
            "Memberi tepuk tangan setelah teman ",
            "menyanyikan lagu daerahnya",
            "2.",
            "Mempelajari lagu daerah lain",
            "3.",
            "Menyanyikan lagu daerah dengan lirik ",
            "yang benar",
            "Kalau di daerah kamu apa nama alat",
            "musik tradisional yang kamu ketauhi?"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6LRfpZG4XhT",
          "assetId": 118,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6To1GhNRJ1b",
          "assetId": 119,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6TnhvfwJ15k",
          "assetId": 120,
          "url": "story_content/6k7JPOlasPL_44100_56_0.mp3",
          "durationMs": 51751
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5eFIBS1RoEg",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6XdoyLHxsB4",
          "assetId": 35,
          "url": "story_content/5hv8C0oRfrb.png",
          "altText": "Desain tanpa judul (52).png",
          "width": 282,
          "height": 506
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5lEm10ZatsN",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6j7uedtBHl5",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6VGgu6tqinV": {
      "id": "6VGgu6tqinV",
      "slideNumber": 16,
      "title": "Untitled Slide",
      "lmsId": "Slide16",
      "jsPath": "html5/data/js/6VGgu6tqinV.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Keragaman Pakaian Daerah Pakaian daerah merupakan pakaian khas suatu  daerah. Pakaian daerah dikenakan saat perayaan  atau upacara adat. Bahan untuk membuat pakaian  daerah diambil dari hasil alam daerah setempat. Keragaman pakaian daerah merupakan kekayaan  budaya bangsa yang tidak ternilai harganya. Kita  harus saling menghargai keragaman pakaian daerah."
      ],
      "texts": [
        {
          "objectId": "6AltwdCow6r",
          "uniqueId": "6AltwdCow6r_-1453892698",
          "linkId": "txt__default_6AltwdCow6r",
          "commandSetId": "commandset-92",
          "altText": "Keragaman Pakaian Daerah\n\nPakaian daerah merupakan pakaian khas suatu daerah. Pakaian daerah dikenakan saat perayaan atau upacara adat. Bahan untuk membuat pakaian daerah diambil dari hasil alam daerah setempat.\n\nKeragaman pakaian daerah merupakan kekayaan budaya bangsa yang tidak ternilai harganya. Kita harus saling menghargai keragaman\npakaian daerah.",
          "lines": [
            "Keragaman Pakaian Daerah",
            "Pakaian daerah merupakan pakaian khas suatu ",
            "daerah. Pakaian daerah dikenakan saat perayaan ",
            "atau upacara adat. Bahan untuk membuat pakaian ",
            "daerah diambil dari hasil alam daerah setempat.",
            "Keragaman pakaian daerah merupakan kekayaan ",
            "budaya bangsa yang tidak ternilai harganya. Kita ",
            "harus saling menghargai keragaman",
            "pakaian daerah."
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6qYTk9gZEvQ",
          "assetId": 121,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6ENJLUA0dIA",
          "assetId": 122,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6okQhennwXu",
          "assetId": 123,
          "url": "story_content/6UucgsObbox_44100_56_0.mp3",
          "durationMs": 36861
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6iDMUVOaAwi",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5ckRsJLiZpL",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5VfIZvN8Ltq",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6rO2Rjnvtcl": {
      "id": "6rO2Rjnvtcl",
      "slideNumber": 17,
      "title": "Untitled Slide",
      "lmsId": "Slide17",
      "jsPath": "html5/data/js/6rO2Rjnvtcl.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Bagaimana cara menghargai  pakaian daerah?",
        "1. Memakai pakaian daerah dengan rasa   bangga 2. Memuji keindahan pakaian adat daerah  lain 3. Menyimpan pakaian daerah dengan baik Apakah kamu pernah memakai baju adat  daerah kamu? Apa nama baju adat yang kamu ketauhi?"
      ],
      "texts": [
        {
          "objectId": "5aRAXsYN11y",
          "uniqueId": "5aRAXsYN11y_1332784485",
          "linkId": "txt__default_5aRAXsYN11y",
          "commandSetId": "commandset-93",
          "altText": "Bagaimana cara menghargai pakaian daerah?",
          "lines": [
            "Bagaimana cara menghargai ",
            "pakaian daerah?"
          ]
        },
        {
          "objectId": "6SpoCsrGgIk",
          "uniqueId": "6SpoCsrGgIk_154592920",
          "linkId": "txt__default_6SpoCsrGgIk",
          "commandSetId": "commandset-75",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "62lvdoQ3TyD",
          "uniqueId": "62lvdoQ3TyD_-1208843939",
          "linkId": "txt__default_62lvdoQ3TyD",
          "commandSetId": "commandset-77",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5ZHJQA7ndnr",
          "uniqueId": "5ZHJQA7ndnr_1485038249",
          "linkId": "txt__default_5ZHJQA7ndnr",
          "commandSetId": "commandset-78",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "6o6bCPOCRlg",
          "uniqueId": "6o6bCPOCRlg_2144289594",
          "linkId": "txt__default_6o6bCPOCRlg",
          "commandSetId": "commandset-95",
          "altText": "Memakai pakaian daerah dengan rasa bangga\nMemuji keindahan pakaian adat daerah lain\nMenyimpan pakaian daerah dengan baik\n\nApakah kamu pernah memakai baju adat daerah kamu? Apa nama baju adat yang\nkamu ketauhi?",
          "lines": [
            "1.",
            "Memakai pakaian daerah dengan rasa",
            " ",
            "bangga",
            "2.",
            "Memuji keindahan pakaian adat daerah ",
            "lain",
            "3.",
            "Menyimpan pakaian daerah dengan baik",
            "Apakah kamu pernah memakai baju adat ",
            "daerah kamu? Apa nama baju adat yang",
            "kamu ketauhi?"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5WrvtxOzFYX",
          "assetId": 124,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6IiTk0smtVo",
          "assetId": 125,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6F0AJSzBaoj",
          "assetId": 126,
          "url": "story_content/64rbmiR4oxv_44100_56_0.mp3",
          "durationMs": 54312
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "670KS5btfu8",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6KJaXIXjpHU",
          "assetId": 35,
          "url": "story_content/5hv8C0oRfrb.png",
          "altText": "Desain tanpa judul (52).png",
          "width": 282,
          "height": 506
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6qGG08fw8VM",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6588GZwKctt",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "5g85v9o85Yb": {
      "id": "5g85v9o85Yb",
      "slideNumber": 18,
      "title": "Untitled Slide",
      "lmsId": "Slide18",
      "jsPath": "html5/data/js/5g85v9o85Yb.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Keragaman Senjata Tradisional Senjata tradisional merupakan senjata khas suatu  daerah. Senjata tradisional digunakan sebagai  kelengkapan atau hiasan pakaian daerah. Senjata  tradisional juga ada yang digunakan untuk berburu dan  untuk peralatan sehari-hari. Kita harus melestarikan keragaman senjata tradisional  Indonesia. Kita harus saling menghargai perbedaan  senjata tradisional."
      ],
      "texts": [
        {
          "objectId": "6IM75rNBqpq",
          "uniqueId": "6IM75rNBqpq_-632408921",
          "linkId": "txt__default_6IM75rNBqpq",
          "commandSetId": "commandset-97",
          "altText": "Keragaman Senjata Tradisional\n\nSenjata tradisional merupakan senjata khas suatu daerah. Senjata tradisional digunakan sebagai kelengkapan atau hiasan pakaian daerah. Senjata tradisional juga ada yang digunakan untuk berburu dan untuk peralatan sehari-hari.\n\nKita harus melestarikan keragaman senjata tradisional Indonesia. Kita harus saling menghargai perbedaan senjata tradisional.",
          "lines": [
            "Keragaman Senjata Tradisional",
            "Senjata tradisional merupakan senjata khas suatu ",
            "daerah. Senjata tradisional digunakan sebagai ",
            "kelengkapan atau hiasan pakaian daerah. Senjata ",
            "tradisional juga ada yang digunakan untuk berburu dan ",
            "untuk peralatan sehari-hari.",
            "Kita harus melestarikan keragaman senjata tradisional ",
            "Indonesia. Kita harus saling menghargai perbedaan ",
            "senjata tradisional."
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5x1Bhoz0eTH",
          "assetId": 127,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6XroNIHunLh",
          "assetId": 128,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5t6WKfCqLK1",
          "assetId": 129,
          "url": "story_content/6CcjdD1I85U_44100_56_0.mp3",
          "durationMs": 39582
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "62E2PpDRLDH",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6Lk6017p5Cw",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6gF2ljSN0cr",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "62u9PmQKgzB": {
      "id": "62u9PmQKgzB",
      "slideNumber": 19,
      "title": "Untitled Slide",
      "lmsId": "Slide19",
      "jsPath": "html5/data/js/62u9PmQKgzB.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Bagaimana cara menghargai  senjata tradisional?",
        "1. Memuji keindahan bentuk senjata tradisional   daerah lain 2. Mempelajari sejarah senjata tradisional  daerah lain 3. Menjaga senjata daerah dengan baik Kalau di daerah kamu apa nama senjata  tradisional yang kamu ketauhi?"
      ],
      "texts": [
        {
          "objectId": "6KLYycV0Xp8",
          "uniqueId": "6KLYycV0Xp8_-178273216",
          "linkId": "txt__default_6KLYycV0Xp8",
          "commandSetId": "commandset-98",
          "altText": "Bagaimana cara menghargai senjata tradisional?",
          "lines": [
            "Bagaimana cara menghargai ",
            "senjata tradisional?"
          ]
        },
        {
          "objectId": "6p547ZRRBxM",
          "uniqueId": "6p547ZRRBxM_198018644",
          "linkId": "txt__default_6p547ZRRBxM",
          "commandSetId": "commandset-75",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5oWY8MwZ5QJ",
          "uniqueId": "5oWY8MwZ5QJ_1135979993",
          "linkId": "txt__default_5oWY8MwZ5QJ",
          "commandSetId": "commandset-77",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5zC0U2P470r",
          "uniqueId": "5zC0U2P470r_1159453054",
          "linkId": "txt__default_5zC0U2P470r",
          "commandSetId": "commandset-78",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "64jdIdjvLt0",
          "uniqueId": "64jdIdjvLt0_1968847411",
          "linkId": "txt__default_64jdIdjvLt0",
          "commandSetId": "commandset-100",
          "altText": "Memuji keindahan bentuk senjata tradisional daerah lain\nMempelajari sejarah senjata tradisional daerah lain\nMenjaga senjata daerah dengan baik\n\nKalau di daerah kamu apa nama senjata tradisional yang kamu ketauhi?",
          "lines": [
            "1.",
            "Memuji keindahan bentuk senjata tradisional",
            " ",
            "daerah lain",
            "2.",
            "Mempelajari sejarah senjata tradisional ",
            "daerah lain",
            "3.",
            "Menjaga senjata daerah dengan baik",
            "Kalau di daerah kamu apa nama senjata ",
            "tradisional yang kamu ketauhi?"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6KSU67pqsSE",
          "assetId": 130,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5w3T1w0vQyM",
          "assetId": 131,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6m4zAAtwxF9",
          "assetId": 132,
          "url": "story_content/5etzPk0n3VG_44100_56_0.mp3",
          "durationMs": 52062
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6EhPDYc4aj9",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6ZBgIW4EK7h",
          "assetId": 35,
          "url": "story_content/5hv8C0oRfrb.png",
          "altText": "Desain tanpa judul (52).png",
          "width": 282,
          "height": 506
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6eHq6c3bJi4",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5grMvTynrZo",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "5o4GAEeLE09": {
      "id": "5o4GAEeLE09",
      "slideNumber": 20,
      "title": "Untitled Slide",
      "lmsId": "Slide20",
      "jsPath": "html5/data/js/5o4GAEeLE09.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Keragaman Tari Tradisional Tari adalah gerak tubuh secara berirama untuk  mengungkapkan perasaan dan pikiran serta untuk  menceritakan sesuatu. Tari tradisional merupakan  tarian yang lahir, tumbuh, dan berkembang dalam  kelompok masyarakat di daerah tertentu. Para penari  tradisional mengenakan pakaian daerah ketika  menari. Tari tradisional dipentaskan dalam upacara  adat dan keagamaan, penyambutan tamu, perayaan  panen raya, serta hiburan rakyat."
      ],
      "texts": [
        {
          "objectId": "686FeGXHUbn",
          "uniqueId": "686FeGXHUbn_-1771650383",
          "linkId": "txt__default_686FeGXHUbn",
          "commandSetId": "commandset-102",
          "altText": "Keragaman Tari Tradisional\n\nTari adalah gerak tubuh secara berirama untuk mengungkapkan perasaan dan pikiran serta untuk menceritakan sesuatu. Tari tradisional merupakan tarian yang lahir, tumbuh, dan berkembang dalam kelompok masyarakat di daerah tertentu. Para penari tradisional mengenakan pakaian daerah ketika menari. Tari tradisional dipentaskan dalam upacara adat dan keagamaan, penyambutan tamu, perayaan panen raya, serta hiburan rakyat.",
          "lines": [
            "Keragaman Tari Tradisional",
            "Tari adalah gerak tubuh secara berirama untuk ",
            "mengungkapkan perasaan dan pikiran serta untuk ",
            "menceritakan sesuatu. Tari tradisional merupakan ",
            "tarian yang lahir, tumbuh, dan berkembang dalam ",
            "kelompok masyarakat di daerah tertentu. Para penari ",
            "tradisional mengenakan pakaian daerah ketika ",
            "menari. Tari tradisional dipentaskan dalam upacara ",
            "adat dan keagamaan, penyambutan tamu, perayaan ",
            "panen raya, serta hiburan rakyat."
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6g3Rr3uPKD8",
          "assetId": 133,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "69Sx7nDnmTs",
          "assetId": 134,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5grl0c9eDrC",
          "assetId": 135,
          "url": "story_content/6UkVdpRGxou_44100_56_0.mp3",
          "durationMs": 46321
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5zgfJOEhLpt",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6l3owCufYEt",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5lgROuPJbTs",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6VYnewFze63": {
      "id": "6VYnewFze63",
      "slideNumber": 21,
      "title": "Untitled Slide",
      "lmsId": "Slide21",
      "jsPath": "html5/data/js/6VYnewFze63.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Bagaimana cara menghargai tari  tradisional?",
        "1. Menonton pementasan tari tradisional   hingga selesai 2. Mempelajari tari tradisional dari berbagai  daerah di Indonesia 3. Ketahui lebih banyak sejarah tari  tradisional dari berbagai daerah lainnya Kalau di daerah kamu apa nama tari  tradisional yang kamu ketahui?"
      ],
      "texts": [
        {
          "objectId": "6Y7t0L0VcHA",
          "uniqueId": "6Y7t0L0VcHA_948216337",
          "linkId": "txt__default_6Y7t0L0VcHA",
          "commandSetId": "commandset-103",
          "altText": "Bagaimana cara menghargai tari tradisional?",
          "lines": [
            "Bagaimana cara menghargai tari ",
            "tradisional?"
          ]
        },
        {
          "objectId": "5zeLY5KuI1M",
          "uniqueId": "5zeLY5KuI1M_707654818",
          "linkId": "txt__default_5zeLY5KuI1M",
          "commandSetId": "commandset-75",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5pB27qBbQwg",
          "uniqueId": "5pB27qBbQwg_-320727197",
          "linkId": "txt__default_5pB27qBbQwg",
          "commandSetId": "commandset-77",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "6cMDUC3dsAE",
          "uniqueId": "6cMDUC3dsAE_1331193809",
          "linkId": "txt__default_6cMDUC3dsAE",
          "commandSetId": "commandset-78",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5ttiZMvdqo3",
          "uniqueId": "5ttiZMvdqo3_-832211169",
          "linkId": "txt__default_5ttiZMvdqo3",
          "commandSetId": "commandset-105",
          "altText": "Menonton pementasan tari tradisional hingga selesai\nMempelajari tari tradisional dari berbagai daerah di Indonesia\nKetahui lebih banyak sejarah tari tradisional dari berbagai daerah lainnya\n\nKalau di daerah kamu apa nama tari tradisional yang kamu ketahui?",
          "lines": [
            "1.",
            "Menonton pementasan tari tradisional",
            " ",
            "hingga selesai",
            "2.",
            "Mempelajari tari tradisional dari berbagai ",
            "daerah di Indonesia",
            "3.",
            "Ketahui lebih banyak sejarah tari ",
            "tradisional dari berbagai daerah lainnya",
            "Kalau di daerah kamu apa nama tari ",
            "tradisional yang kamu ketahui?"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6JPxOhDUWwQ",
          "assetId": 136,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "626nTqWXbQH",
          "assetId": 137,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5h2xeiDeozf",
          "assetId": 138,
          "url": "story_content/6qzShui9SPq_44100_56_0.mp3",
          "durationMs": 56951
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5hYqiJGFgQj",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5c3jguPU14h",
          "assetId": 35,
          "url": "story_content/5hv8C0oRfrb.png",
          "altText": "Desain tanpa judul (52).png",
          "width": 282,
          "height": 506
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6MytonuMVSw",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5pClKoa4Wi3",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "69cSEO6heKU": {
      "id": "69cSEO6heKU",
      "slideNumber": 22,
      "title": "Untitled Slide",
      "lmsId": "Slide22",
      "jsPath": "html5/data/js/69cSEO6heKU.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Keragaman Rumah Adat Rumah adat adalah rumah yang dibangun  sesuai dengan ciri khas dan budaya  masyarakat di suatu daerah tertentu. Setiap rumah adat memiliki aturan. Kita harus  menghargai dan menghormati aturannya."
      ],
      "texts": [
        {
          "objectId": "6NUklTzc7OY",
          "uniqueId": "6NUklTzc7OY_615987387",
          "linkId": "txt__default_6NUklTzc7OY",
          "commandSetId": "commandset-107",
          "altText": "Keragaman Rumah Adat\n\nRumah adat adalah rumah yang dibangun sesuai dengan ciri khas dan budaya masyarakat di suatu daerah tertentu.\n\nSetiap rumah adat memiliki aturan. Kita harus menghargai dan menghormati aturannya.",
          "lines": [
            "Keragaman Rumah Adat",
            "Rumah adat adalah rumah yang dibangun ",
            "sesuai dengan ciri khas dan budaya ",
            "masyarakat di suatu daerah tertentu.",
            "Setiap rumah adat memiliki aturan. Kita harus ",
            "menghargai dan menghormati aturannya."
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6pZkCoaPt47",
          "assetId": 139,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5slPNTrcEZp",
          "assetId": 140,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5mHHRGVHMM8",
          "assetId": 141,
          "url": "story_content/6jklFMi3AKq_44100_56_0.mp3",
          "durationMs": 39501
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6C16iwcqvLv",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6C67HGMM6xf",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5aDawBBaEnm",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6mhmEQSWIJZ": {
      "id": "6mhmEQSWIJZ",
      "slideNumber": 23,
      "title": "Untitled Slide",
      "lmsId": "Slide23",
      "jsPath": "html5/data/js/6mhmEQSWIJZ.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Bagaimana cara  menghargai rumah adat?",
        "1. Melepas alas kaki sebelum memasuki   rumah adat 2. Mendenggarkan penjelasan tentang  rumah adat 3. Menunjukkan kekaguman terhadap  keunikan rumah adat Kalau di daerah kamu apa nama rumah adat yang kamu ketauhi?"
      ],
      "texts": [
        {
          "objectId": "5cTF08uxuW0",
          "uniqueId": "5cTF08uxuW0_-1475612440",
          "linkId": "txt__default_5cTF08uxuW0",
          "commandSetId": "commandset-109",
          "altText": "Bagaimana cara menghargai rumah adat?",
          "lines": [
            "Bagaimana cara ",
            "menghargai rumah adat?"
          ]
        },
        {
          "objectId": "5bkot76VCm8",
          "uniqueId": "5bkot76VCm8_1593360810",
          "linkId": "txt__default_5bkot76VCm8",
          "commandSetId": "commandset-111",
          "altText": "Melepas alas kaki sebelum memasuki rumah adat\nMendenggarkan penjelasan tentang rumah adat\nMenunjukkan kekaguman terhadap keunikan rumah adat\n\nKalau di daerah kamu apa nama\nrumah adat yang kamu ketauhi?",
          "lines": [
            "1.",
            "Melepas alas kaki sebelum memasuki",
            " ",
            "rumah adat",
            "2.",
            "Mendenggarkan penjelasan tentang ",
            "rumah adat",
            "3.",
            "Menunjukkan kekaguman terhadap ",
            "keunikan rumah adat",
            "Kalau di daerah kamu apa nama",
            "rumah adat yang kamu ketauhi?"
          ]
        },
        {
          "objectId": "6htIuzEZXP1",
          "uniqueId": "6htIuzEZXP1_-1572205980",
          "linkId": "txt__default_6htIuzEZXP1",
          "commandSetId": "commandset-75",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5gFWejQ3qdT",
          "uniqueId": "5gFWejQ3qdT_-424179757",
          "linkId": "txt__default_5gFWejQ3qdT",
          "commandSetId": "commandset-77",
          "altText": "?",
          "lines": [
            "?"
          ]
        },
        {
          "objectId": "5yDZjjYlpbY",
          "uniqueId": "5yDZjjYlpbY_-265962167",
          "linkId": "txt__default_5yDZjjYlpbY",
          "commandSetId": "commandset-78",
          "altText": "?",
          "lines": [
            "?"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6XhOk8ZbTpA",
          "assetId": 142,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5kPt6pIxbLk",
          "assetId": 143,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6m7Kx8VmUpA",
          "assetId": 144,
          "url": "story_content/6mfqCF3DHTn_44100_56_0.mp3",
          "durationMs": 56712
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6XGSX3WjF0L",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "62xkGm7HdKa",
          "assetId": 35,
          "url": "story_content/5hv8C0oRfrb.png",
          "altText": "Desain tanpa judul (52).png",
          "width": 282,
          "height": 506
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6CIGSgZXHoJ",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6RZkBSZfrVO",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "5UlnwWVKUrp": {
      "id": "5UlnwWVKUrp",
      "slideNumber": 24,
      "title": "Untitled Slide",
      "lmsId": "Slide24",
      "jsPath": "html5/data/js/5UlnwWVKUrp.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Kerja Bagus!  kamu sudah mengenal dan  mempelajari bagaimana cara  menghargai keragaman budaya  di Indonesia dengan sangat baik."
      ],
      "texts": [
        {
          "objectId": "6HxiNirn6GV",
          "uniqueId": "6HxiNirn6GV_-1863837381",
          "linkId": "txt__default_6HxiNirn6GV",
          "commandSetId": "commandset-114",
          "altText": "Kerja Bagus! \nkamu sudah mengenal dan mempelajari bagaimana cara menghargai keragaman budaya di Indonesia dengan sangat baik.",
          "lines": [
            "Kerja Bagus! ",
            "kamu sudah mengenal dan ",
            "mempelajari bagaimana cara ",
            "menghargai keragaman budaya ",
            "di Indonesia dengan sangat baik."
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6gdw5OvDLfh",
          "assetId": 146,
          "url": "story_content/5yzMgZw5dbd_44100_56_0.mp3",
          "durationMs": 681
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5gfbl41kBHx",
          "assetId": 147,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "666kFh0zaCc",
          "assetId": 148,
          "url": "story_content/6VqCsaYwadr_44100_56_0.mp3",
          "durationMs": 10402
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5c2hJTkuzJo",
          "assetId": 149,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6BwpIl74rvb",
          "assetId": 150,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5f0tCrbdm0K",
          "assetId": 151,
          "url": "story_content/6AhqX1tWlfo_44100_56_0.mp3",
          "durationMs": 63631
        },
        {
          "layerIndex": 1,
          "layerId": "6NdsPwwu8j0",
          "audioId": "6ifmL80psbT",
          "assetId": 152,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6NdsPwwu8j0",
          "audioId": "6oQEAX8Pbig",
          "assetId": 153,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        },
        {
          "layerIndex": 2,
          "layerId": "6U4F2yyhtev",
          "audioId": "6a1VVt9oy2k",
          "assetId": 155,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6U4F2yyhtev",
          "audioId": "5xB7jvjoAxk",
          "assetId": 156,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5X3fdWQvD8n",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5sxElZAreTq",
          "assetId": 35,
          "url": "story_content/5hv8C0oRfrb.png",
          "altText": "Desain tanpa judul (52).png",
          "width": 282,
          "height": 506
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6EIbCjXcXON",
          "assetId": 8,
          "url": "story_content/6I2HdKkSgG6.png",
          "altText": "7409593x.png",
          "width": 180,
          "height": 137
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "65CCJa8dqM3",
          "assetId": 145,
          "url": "story_content/6FqvPwU4M4Q.png",
          "altText": "6CIwc3f9QSv.png",
          "width": 646,
          "height": 144
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6U1zCIZUdb8",
          "assetId": 7,
          "url": "story_content/6KFvI2w3gL9.png",
          "altText": "740959a.png",
          "width": 198,
          "height": 142
        },
        {
          "layerIndex": 1,
          "layerId": "6NdsPwwu8j0",
          "objectId": "6hLv4Y59ieo",
          "assetId": 25,
          "url": "story_content/6qmYZKenWib.png",
          "altText": "info.png",
          "width": 1539,
          "height": 882
        },
        {
          "layerIndex": 1,
          "layerId": "6NdsPwwu8j0",
          "objectId": "5roFNy3J57t",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        },
        {
          "layerIndex": 2,
          "layerId": "6U4F2yyhtev",
          "objectId": "60uGyRvRMOe",
          "assetId": 21,
          "url": "story_content/6EfvCxuLoY5.png",
          "altText": "Desain tanpa judul (67).png",
          "width": 1208,
          "height": 647
        },
        {
          "layerIndex": 2,
          "layerId": "6U4F2yyhtev",
          "objectId": "6WcZSipYnRa",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6oOWqUyP2WL": {
      "id": "6oOWqUyP2WL",
      "slideNumber": 25,
      "title": "Misalkan kamu memiliki teman Udi berasal dari suku Sunda, Komang berasal dari suku Bali, dan kamu berasal dari suku Jawa. Mereka memakai baju adatnya. Sikapmu terhadap perbedaan baju ada tersebut adalah....",
      "lmsId": "Slide25",
      "jsPath": "html5/data/js/6oOWqUyP2WL.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "hanya bermain dengan teman yang pakai baju adat yang sama",
        "mengejek baju adat lain karena merasa baju  adatmu adalah yang terbaik",
        "mengatakan bahwa baju adatmu lebih baik  dibanding yang lain",
        "saling menghormati perbedaan baju adat",
        "Misalkan kamu memiliki teman Udi berasal dari suku  Sunda, Komang berasal dari suku Bali, dan kamu berasal  dari suku Jawa. Mereka memakai baju adatnya. Sikapmu  terhadap perbedaan baju ada tersebut adalah...."
      ],
      "texts": [
        {
          "objectId": "6EVtXKpkpXd",
          "uniqueId": "6gI8wN5Uvyg_-96470515",
          "linkId": "txt__default_6EVtXKpkpXd",
          "commandSetId": "commandset-123",
          "altText": "hanya bermain dengan teman yang pakai\nbaju adat yang sama",
          "lines": [
            "hanya bermain dengan teman yang pakai",
            "baju adat yang sama"
          ]
        },
        {
          "objectId": "6b0XbNaWdfs",
          "uniqueId": "5WOXamRjjbQ_-259187761",
          "linkId": "txt__default_6b0XbNaWdfs",
          "commandSetId": "commandset-128",
          "altText": "mengejek baju adat lain karena merasa baju adatmu adalah yang terbaik",
          "lines": [
            "mengejek baju adat lain karena merasa baju ",
            "adatmu adalah yang terbaik"
          ]
        },
        {
          "objectId": "6eOu6G7RdHc",
          "uniqueId": "695k1uuvqXb_-1614721656",
          "linkId": "txt__default_6eOu6G7RdHc",
          "commandSetId": "commandset-133",
          "altText": "mengatakan bahwa baju adatmu lebih baik dibanding yang lain",
          "lines": [
            "mengatakan bahwa baju adatmu lebih baik ",
            "dibanding yang lain"
          ]
        },
        {
          "objectId": "5jgHNtfhMbA",
          "uniqueId": "66HTsMEXhkk_1838867507",
          "linkId": "txt__default_5jgHNtfhMbA",
          "commandSetId": "commandset-140",
          "altText": "saling menghormati perbedaan baju adat",
          "lines": [
            "saling menghormati perbedaan baju adat"
          ]
        },
        {
          "objectId": "5zs5XSc8BHE",
          "uniqueId": "5zs5XSc8BHE_-634244639",
          "linkId": "txt__default_5zs5XSc8BHE",
          "commandSetId": "commandset-143",
          "altText": "Misalkan kamu memiliki teman Udi berasal dari suku Sunda, Komang berasal dari suku Bali, dan kamu berasal dari suku Jawa. Mereka memakai baju adatnya. Sikapmu terhadap perbedaan baju ada tersebut adalah....",
          "lines": [
            "Misalkan kamu memiliki teman Udi berasal dari suku ",
            "Sunda, Komang berasal dari suku Bali, dan kamu berasal ",
            "dari suku Jawa. Mereka memakai baju adatnya. Sikapmu ",
            "terhadap perbedaan baju ada tersebut adalah...."
          ]
        },
        {
          "objectId": "5mlujekLxKf_CorrectReview",
          "uniqueId": "5mlujekLxKf_CorrectReview",
          "linkId": "5mlujekLxKf_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "5mlujekLxKf_IncorrectReview",
          "uniqueId": "5mlujekLxKf_IncorrectReview",
          "linkId": "5mlujekLxKf_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6lPm3XfTnfF",
          "assetId": 160,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6qmOBFeoZMY",
          "assetId": 161,
          "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
          "durationMs": 38641
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5s0KRnskHqi",
          "assetId": 162,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 1,
          "layerId": "5wLllNjELzq",
          "audioId": "5qCilSdR8u5",
          "assetId": 168,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "5wLllNjELzq",
          "audioId": "6SzS3bH2v4O",
          "assetId": 169,
          "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
          "durationMs": 5021
        },
        {
          "layerIndex": 1,
          "layerId": "5wLllNjELzq",
          "audioId": "5n5dAQSMtt4",
          "assetId": 170,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6BvBZyuy25S",
          "audioId": "6Voyc9AG2MS",
          "assetId": 175,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6BvBZyuy25S",
          "audioId": "6dvr9PBDTk0",
          "assetId": 176,
          "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
          "durationMs": 3871
        },
        {
          "layerIndex": 2,
          "layerId": "6BvBZyuy25S",
          "audioId": "5YFujyyJ8Bp",
          "assetId": 177,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6I0oYTMyzEy",
          "assetId": 158,
          "url": "story_content/5jk1lv5JqZM.png",
          "altText": "5jEUQabPzSg.png",
          "width": 1017,
          "height": 503
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6UvVtSpfsTM",
          "assetId": 159,
          "url": "story_content/5ewpLbxmMP5.png",
          "altText": "6UxUQ5kzvsI_P_0_0_1280_480.png",
          "width": 784,
          "height": 294
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5zQMJy9TGpi",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 1,
          "layerId": "5wLllNjELzq",
          "objectId": "5s5fyaUq5F5",
          "assetId": 164,
          "url": "story_content/64trbzmlqII.gif",
          "altText": "200.gif",
          "width": 200,
          "height": 200
        },
        {
          "layerIndex": 1,
          "layerId": "5wLllNjELzq",
          "objectId": "6n4v1TVPYkj",
          "assetId": 165,
          "url": "story_content/6cVvYbugY8D_P_246_0_1299_405.png",
          "altText": "salah starla.png",
          "width": 1299,
          "height": 405
        },
        {
          "layerIndex": 1,
          "layerId": "5wLllNjELzq",
          "objectId": "6iBj0j4Wyvj",
          "assetId": 166,
          "url": "story_content/5xIHoMB2ZC7.gif",
          "altText": "AS0005343_05.gif",
          "width": 254,
          "height": 300
        },
        {
          "layerIndex": 1,
          "layerId": "5wLllNjELzq",
          "objectId": "67BmTMfY8zv",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 1,
          "layerId": "5wLllNjELzq",
          "objectId": "5vw6iEJUiYN",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6BvBZyuy25S",
          "objectId": "5mLhj75cZ4L",
          "assetId": 172,
          "url": "story_content/6F5Z4MpnsdU.gif",
          "altText": "1645317_d9287.gif",
          "width": 500,
          "height": 500
        },
        {
          "layerIndex": 2,
          "layerId": "6BvBZyuy25S",
          "objectId": "5cdGs3Yklaw",
          "assetId": 173,
          "url": "story_content/5gkgaNEdBEt.png",
          "altText": "benar.png",
          "width": 1141,
          "height": 388
        },
        {
          "layerIndex": 2,
          "layerId": "6BvBZyuy25S",
          "objectId": "6ExPND8186F",
          "assetId": 174,
          "url": "story_content/5yMgs76yF4Y.gif",
          "altText": "AS0005343_04.gif",
          "width": 292,
          "height": 300
        },
        {
          "layerIndex": 2,
          "layerId": "6BvBZyuy25S",
          "objectId": "6UTaTWhJ8Dx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6BvBZyuy25S",
          "objectId": "67rmQ8moFdO",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "6oOWqUyP2WL",
        "slideNumber": 25,
        "interactionId": "5woba5hGYmO",
        "type": "multiplechoice",
        "questionText": "Misalkan kamu memiliki teman Udi berasal dari suku Sunda, Komang berasal dari suku Bali, dan kamu berasal dari suku Jawa. Mereka memakai baju adatnya. Sikapmu terhadap perbedaan baju ada tersebut adalah....",
        "questionCommandSetId": "commandset-143",
        "maxPoints": 10,
        "choices": [
          {
            "id": "choice_6eOu6G7RdHc",
            "objectId": "6eOu6G7RdHc",
            "commandSetId": "commandset-133",
            "text": "mengatakan bahwa baju adatmu lebih baik dibanding yang lain",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_6b0XbNaWdfs",
            "objectId": "6b0XbNaWdfs",
            "commandSetId": "commandset-128",
            "text": "mengejek baju adat lain karena merasa baju adatmu adalah yang terbaik",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_5jgHNtfhMbA",
            "objectId": "5jgHNtfhMbA",
            "commandSetId": "commandset-140",
            "text": "saling menghormati perbedaan baju adat",
            "isCorrect": true,
            "points": 10
          },
          {
            "id": "choice_6EVtXKpkpXd",
            "objectId": "6EVtXKpkpXd",
            "commandSetId": "commandset-123",
            "text": "hanya bermain dengan teman yang pakai\nbaju adat yang sama",
            "isCorrect": false,
            "points": 0
          }
        ],
        "correctChoiceId": "choice_5jgHNtfhMbA",
        "correctAnswerText": "saling menghormati perbedaan baju adat",
        "feedbackLayers": {
          "correctLayerId": "6BvBZyuy25S",
          "incorrectLayerId": "5wLllNjELzq"
        }
      }
    },
    "6fJRLUtSDVL": {
      "id": "6fJRLUtSDVL",
      "slideNumber": 26,
      "title": "Pak Dika meminta siswa menceritakan budaya daerahnya masing-masing. Oxel menceritakan keunikan budaya yang ada di daerahnya. Budaya dan daerah asal Oxel berbeda denganmu. Tindakanmu sebaiknya…",
      "lmsId": "Slide26",
      "jsPath": "html5/data/js/6fJRLUtSDVL.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "memotong cerita yang disampaikan oleh Oxel",
        "merendahkan kebudayaan yang ada di daerah Oxel",
        "mendengarkan cerita Oxel dengan saksama",
        "menunjukkan bahwa kebudayaan daerahmu lebih baik",
        "Pak Dika meminta siswa menceritakan budaya daerahnya  masing-masing. Oxel menceritakan keunikan budaya yang  ada di daerahnya. Budaya dan daerah asal Oxel berbeda  denganmu. Tindakanmu sebaiknya…"
      ],
      "texts": [
        {
          "objectId": "6UqIjWay05w",
          "uniqueId": "5yh7rtLFc4S_-598758075",
          "linkId": "txt__default_6UqIjWay05w",
          "commandSetId": "commandset-162",
          "altText": "memotong cerita yang disampaikan oleh Oxel",
          "lines": [
            "memotong cerita yang disampaikan oleh Oxel"
          ]
        },
        {
          "objectId": "68TfPxuMC2x",
          "uniqueId": "6GFtaHjy2to_-1150742622",
          "linkId": "txt__default_68TfPxuMC2x",
          "commandSetId": "commandset-163",
          "altText": "merendahkan kebudayaan yang ada di daerah Oxel ",
          "lines": [
            "merendahkan kebudayaan yang ada di daerah Oxel "
          ]
        },
        {
          "objectId": "6f1PW4x37QC",
          "uniqueId": "6oaNWvOP8Mk_-83945712",
          "linkId": "txt__default_6f1PW4x37QC",
          "commandSetId": "commandset-170",
          "altText": "mendengarkan cerita Oxel dengan saksama",
          "lines": [
            "mendengarkan cerita Oxel dengan saksama"
          ]
        },
        {
          "objectId": "5UmGXHzsBZ5",
          "uniqueId": "6kHGmrBjqJ8_1678767313",
          "linkId": "txt__default_5UmGXHzsBZ5",
          "commandSetId": "commandset-171",
          "altText": "menunjukkan bahwa kebudayaan daerahmu lebih baik",
          "lines": [
            "menunjukkan bahwa kebudayaan daerahmu lebih baik"
          ]
        },
        {
          "objectId": "5ozHG3fPsSp",
          "uniqueId": "5ozHG3fPsSp_1617748355",
          "linkId": "txt__default_5ozHG3fPsSp",
          "commandSetId": "commandset-174",
          "altText": "Pak Dika meminta siswa menceritakan budaya daerahnya masing-masing. Oxel menceritakan keunikan budaya yang ada di daerahnya. Budaya dan daerah asal Oxel berbeda denganmu. Tindakanmu sebaiknya…",
          "lines": [
            "Pak Dika meminta siswa menceritakan budaya daerahnya ",
            "masing-masing. Oxel menceritakan keunikan budaya yang ",
            "ada di daerahnya. Budaya dan daerah asal Oxel berbeda ",
            "denganmu. Tindakanmu sebaiknya…"
          ]
        },
        {
          "objectId": "6E4jhwVoSbS_CorrectReview",
          "uniqueId": "6E4jhwVoSbS_CorrectReview",
          "linkId": "6E4jhwVoSbS_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "6E4jhwVoSbS_IncorrectReview",
          "uniqueId": "6E4jhwVoSbS_IncorrectReview",
          "linkId": "6E4jhwVoSbS_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6goeljfAzGZ",
          "assetId": 179,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6WdKlm5P2lW",
          "assetId": 180,
          "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
          "durationMs": 38641
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5sj0SpuNqsF",
          "assetId": 181,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 1,
          "layerId": "5dINY7oQloY",
          "audioId": "61cvUC8ZZOd",
          "assetId": 182,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "5dINY7oQloY",
          "audioId": "6SzS3bH2v4O",
          "assetId": 183,
          "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
          "durationMs": 5021
        },
        {
          "layerIndex": 1,
          "layerId": "5dINY7oQloY",
          "audioId": "5n5dAQSMtt4",
          "assetId": 184,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6YjsJKEnG88",
          "audioId": "6MkCnEZsj1m",
          "assetId": 185,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6YjsJKEnG88",
          "audioId": "6dvr9PBDTk0",
          "assetId": 186,
          "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
          "durationMs": 3871
        },
        {
          "layerIndex": 2,
          "layerId": "6YjsJKEnG88",
          "audioId": "5YFujyyJ8Bp",
          "assetId": 187,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5quFtqqQ6wO",
          "assetId": 158,
          "url": "story_content/5jk1lv5JqZM.png",
          "altText": "5jEUQabPzSg.png",
          "width": 1017,
          "height": 503
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6Q5BE22xd04",
          "assetId": 159,
          "url": "story_content/5ewpLbxmMP5.png",
          "altText": "6UxUQ5kzvsI_P_0_0_1280_480.png",
          "width": 784,
          "height": 294
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5ySR9Q9Rvtv",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 1,
          "layerId": "5dINY7oQloY",
          "objectId": "5s5fyaUq5F5",
          "assetId": 164,
          "url": "story_content/64trbzmlqII.gif",
          "altText": "200.gif",
          "width": 200,
          "height": 200
        },
        {
          "layerIndex": 1,
          "layerId": "5dINY7oQloY",
          "objectId": "6n4v1TVPYkj",
          "assetId": 165,
          "url": "story_content/6cVvYbugY8D_P_246_0_1299_405.png",
          "altText": "salah starla.png",
          "width": 1299,
          "height": 405
        },
        {
          "layerIndex": 1,
          "layerId": "5dINY7oQloY",
          "objectId": "6iBj0j4Wyvj",
          "assetId": 166,
          "url": "story_content/5xIHoMB2ZC7.gif",
          "altText": "AS0005343_05.gif",
          "width": 254,
          "height": 300
        },
        {
          "layerIndex": 1,
          "layerId": "5dINY7oQloY",
          "objectId": "67BmTMfY8zv",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 1,
          "layerId": "5dINY7oQloY",
          "objectId": "6NLGXK5RVUl",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6YjsJKEnG88",
          "objectId": "5mLhj75cZ4L",
          "assetId": 172,
          "url": "story_content/6F5Z4MpnsdU.gif",
          "altText": "1645317_d9287.gif",
          "width": 500,
          "height": 500
        },
        {
          "layerIndex": 2,
          "layerId": "6YjsJKEnG88",
          "objectId": "5cdGs3Yklaw",
          "assetId": 173,
          "url": "story_content/5gkgaNEdBEt.png",
          "altText": "benar.png",
          "width": 1141,
          "height": 388
        },
        {
          "layerIndex": 2,
          "layerId": "6YjsJKEnG88",
          "objectId": "6ExPND8186F",
          "assetId": 174,
          "url": "story_content/5yMgs76yF4Y.gif",
          "altText": "AS0005343_04.gif",
          "width": 292,
          "height": 300
        },
        {
          "layerIndex": 2,
          "layerId": "6YjsJKEnG88",
          "objectId": "6UTaTWhJ8Dx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6YjsJKEnG88",
          "objectId": "6S1AW6YJqM0",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "6fJRLUtSDVL",
        "slideNumber": 26,
        "interactionId": "6IHKaPcNAs9",
        "type": "multiplechoice",
        "questionText": "Pak Dika meminta siswa menceritakan budaya daerahnya masing-masing. Oxel menceritakan keunikan budaya yang ada di daerahnya. Budaya dan daerah asal Oxel berbeda denganmu. Tindakanmu sebaiknya…",
        "questionCommandSetId": "commandset-174",
        "maxPoints": 10,
        "choices": [
          {
            "id": "choice_6f1PW4x37QC",
            "objectId": "6f1PW4x37QC",
            "commandSetId": "commandset-170",
            "text": "mendengarkan cerita Oxel dengan saksama",
            "isCorrect": true,
            "points": 10
          },
          {
            "id": "choice_5UmGXHzsBZ5",
            "objectId": "5UmGXHzsBZ5",
            "commandSetId": "commandset-171",
            "text": "menunjukkan bahwa kebudayaan daerahmu lebih baik",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_68TfPxuMC2x",
            "objectId": "68TfPxuMC2x",
            "commandSetId": "commandset-163",
            "text": "merendahkan kebudayaan yang ada di daerah Oxel ",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_6UqIjWay05w",
            "objectId": "6UqIjWay05w",
            "commandSetId": "commandset-162",
            "text": "memotong cerita yang disampaikan oleh Oxel",
            "isCorrect": false,
            "points": 0
          }
        ],
        "correctChoiceId": "choice_6f1PW4x37QC",
        "correctAnswerText": "mendengarkan cerita Oxel dengan saksama",
        "feedbackLayers": {
          "correctLayerId": "6YjsJKEnG88",
          "incorrectLayerId": "5dINY7oQloY"
        }
      }
    },
    "6V8v7yM3VzE": {
      "id": "6V8v7yM3VzE",
      "slideNumber": 27,
      "title": "Keluargamu sedang berlibur ke Papua. Di sana sedang diadakan upacara adat bakar batu. Kamu ingin ikut melihat upa cara adat tersebut. Sikapmu sebaiknya...",
      "lmsId": "Slide27",
      "jsPath": "html5/data/js/6V8v7yM3VzE.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "tidak perlu memperhatikan upacara adat karena  merasa asing",
        "menyaksikan upacara adat dengan tenang",
        "membuat keributan pada saat upacara adat sedang  berlangsung",
        "meninggalkan upacara adat karena merasa bosan",
        "Keluargamu sedang berlibur ke Papua. Di sana  sedang diadakan upacara adat bakar batu. Kamu  ingin ikut melihat  upa cara  adat tersebut. Sikapmu  sebaiknya..."
      ],
      "texts": [
        {
          "objectId": "6jGHZ6ElUUM",
          "uniqueId": "65321ctQLJb_1604481692",
          "linkId": "txt__default_6jGHZ6ElUUM",
          "commandSetId": "commandset-179",
          "altText": "tidak perlu memperhatikan upacara adat karena merasa asing",
          "lines": [
            "tidak perlu memperhatikan upacara adat karena ",
            "merasa asing"
          ]
        },
        {
          "objectId": "5cnKrBOlvB8",
          "uniqueId": "6Mttfv9Zkxv_1298477358",
          "linkId": "txt__default_5cnKrBOlvB8",
          "commandSetId": "commandset-182",
          "altText": "menyaksikan upacara adat dengan tenang",
          "lines": [
            "menyaksikan upacara adat dengan tenang"
          ]
        },
        {
          "objectId": "64pXzDFhTbz",
          "uniqueId": "5vJ4nDAR9Jk_-1134447026",
          "linkId": "txt__default_64pXzDFhTbz",
          "commandSetId": "commandset-187",
          "altText": "membuat keributan pada saat upacara adat sedang berlangsung",
          "lines": [
            "membuat keributan pada saat upacara adat sedang ",
            "berlangsung"
          ]
        },
        {
          "objectId": "5klQLOy2sMl",
          "uniqueId": "6A1ggLYJRGd_-1107424223",
          "linkId": "txt__default_5klQLOy2sMl",
          "commandSetId": "commandset-188",
          "altText": "meninggalkan upacara adat karena merasa bosan",
          "lines": [
            "meninggalkan upacara adat karena merasa bosan"
          ]
        },
        {
          "objectId": "6gHBhSex8vI",
          "uniqueId": "6gHBhSex8vI_168252446",
          "linkId": "txt__default_6gHBhSex8vI",
          "commandSetId": "commandset-191",
          "altText": "Keluargamu sedang berlibur ke Papua. Di sana sedang diadakan upacara adat bakar batu. Kamu ingin ikut melihat upa cara adat tersebut. Sikapmu sebaiknya...",
          "lines": [
            "Keluargamu sedang berlibur ke Papua. Di sana ",
            "sedang diadakan upacara adat bakar batu. Kamu ",
            "ingin ikut melihat ",
            "upa cara",
            " adat tersebut. Sikapmu ",
            "sebaiknya..."
          ]
        },
        {
          "objectId": "5VfB5tnVfdk_CorrectReview",
          "uniqueId": "5VfB5tnVfdk_CorrectReview",
          "linkId": "5VfB5tnVfdk_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "5VfB5tnVfdk_IncorrectReview",
          "uniqueId": "5VfB5tnVfdk_IncorrectReview",
          "linkId": "5VfB5tnVfdk_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "679pfw9qB7k",
          "assetId": 189,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5iRCPi92djA",
          "assetId": 190,
          "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
          "durationMs": 38641
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "68Tu8cdefgn",
          "assetId": 191,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 1,
          "layerId": "6ozsIxVZ0Ap",
          "audioId": "5sVLw359uop",
          "assetId": 192,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6ozsIxVZ0Ap",
          "audioId": "6SzS3bH2v4O",
          "assetId": 193,
          "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
          "durationMs": 5021
        },
        {
          "layerIndex": 1,
          "layerId": "6ozsIxVZ0Ap",
          "audioId": "5n5dAQSMtt4",
          "assetId": 194,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6RqFMmFCoCW",
          "audioId": "5itHhxUirzC",
          "assetId": 195,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6RqFMmFCoCW",
          "audioId": "6dvr9PBDTk0",
          "assetId": 196,
          "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
          "durationMs": 3871
        },
        {
          "layerIndex": 2,
          "layerId": "6RqFMmFCoCW",
          "audioId": "5YFujyyJ8Bp",
          "assetId": 197,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6K3m5d4ouzG",
          "assetId": 158,
          "url": "story_content/5jk1lv5JqZM.png",
          "altText": "5jEUQabPzSg.png",
          "width": 1017,
          "height": 503
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5tymEWgoDlt",
          "assetId": 159,
          "url": "story_content/5ewpLbxmMP5.png",
          "altText": "6UxUQ5kzvsI_P_0_0_1280_480.png",
          "width": 784,
          "height": 294
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5oNdvH2Cevb",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 1,
          "layerId": "6ozsIxVZ0Ap",
          "objectId": "5s5fyaUq5F5",
          "assetId": 164,
          "url": "story_content/64trbzmlqII.gif",
          "altText": "200.gif",
          "width": 200,
          "height": 200
        },
        {
          "layerIndex": 1,
          "layerId": "6ozsIxVZ0Ap",
          "objectId": "6n4v1TVPYkj",
          "assetId": 165,
          "url": "story_content/6cVvYbugY8D_P_246_0_1299_405.png",
          "altText": "salah starla.png",
          "width": 1299,
          "height": 405
        },
        {
          "layerIndex": 1,
          "layerId": "6ozsIxVZ0Ap",
          "objectId": "6iBj0j4Wyvj",
          "assetId": 166,
          "url": "story_content/5xIHoMB2ZC7.gif",
          "altText": "AS0005343_05.gif",
          "width": 254,
          "height": 300
        },
        {
          "layerIndex": 1,
          "layerId": "6ozsIxVZ0Ap",
          "objectId": "67BmTMfY8zv",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 1,
          "layerId": "6ozsIxVZ0Ap",
          "objectId": "607eCBzCDio",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6RqFMmFCoCW",
          "objectId": "5mLhj75cZ4L",
          "assetId": 172,
          "url": "story_content/6F5Z4MpnsdU.gif",
          "altText": "1645317_d9287.gif",
          "width": 500,
          "height": 500
        },
        {
          "layerIndex": 2,
          "layerId": "6RqFMmFCoCW",
          "objectId": "5cdGs3Yklaw",
          "assetId": 173,
          "url": "story_content/5gkgaNEdBEt.png",
          "altText": "benar.png",
          "width": 1141,
          "height": 388
        },
        {
          "layerIndex": 2,
          "layerId": "6RqFMmFCoCW",
          "objectId": "6ExPND8186F",
          "assetId": 174,
          "url": "story_content/5yMgs76yF4Y.gif",
          "altText": "AS0005343_04.gif",
          "width": 292,
          "height": 300
        },
        {
          "layerIndex": 2,
          "layerId": "6RqFMmFCoCW",
          "objectId": "6UTaTWhJ8Dx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6RqFMmFCoCW",
          "objectId": "64nbhEkleUJ",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "6V8v7yM3VzE",
        "slideNumber": 27,
        "interactionId": "6fI1qRMq5kG",
        "type": "multiplechoice",
        "questionText": "Keluargamu sedang berlibur ke Papua. Di sana sedang diadakan upacara adat bakar batu. Kamu ingin ikut melihat upa cara adat tersebut. Sikapmu sebaiknya...",
        "questionCommandSetId": "commandset-191",
        "maxPoints": 10,
        "choices": [
          {
            "id": "choice_64pXzDFhTbz",
            "objectId": "64pXzDFhTbz",
            "commandSetId": "commandset-187",
            "text": "membuat keributan pada saat upacara adat sedang berlangsung",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_5klQLOy2sMl",
            "objectId": "5klQLOy2sMl",
            "commandSetId": "commandset-188",
            "text": "meninggalkan upacara adat karena merasa bosan",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_5cnKrBOlvB8",
            "objectId": "5cnKrBOlvB8",
            "commandSetId": "commandset-182",
            "text": "menyaksikan upacara adat dengan tenang",
            "isCorrect": true,
            "points": 10
          },
          {
            "id": "choice_6jGHZ6ElUUM",
            "objectId": "6jGHZ6ElUUM",
            "commandSetId": "commandset-179",
            "text": "tidak perlu memperhatikan upacara adat karena merasa asing",
            "isCorrect": false,
            "points": 0
          }
        ],
        "correctChoiceId": "choice_5cnKrBOlvB8",
        "correctAnswerText": "menyaksikan upacara adat dengan tenang",
        "feedbackLayers": {
          "correctLayerId": "6RqFMmFCoCW",
          "incorrectLayerId": "6ozsIxVZ0Ap"
        }
      }
    },
    "6TsqDEfppnq": {
      "id": "6TsqDEfppnq",
      "slideNumber": 28,
      "title": "Misalkan kamu memiliki teman baru dari daerah yang berbeda denganmu. Teman barumu membawakan oleh-oleh makanan khas dari daerahnya. Kamu mencicipi sedikit makanan yang dibawa temanmu. Setelah mencicipi, kamu kurang suka dengan rasanya. Tindakanmu sebaiknya",
      "lmsId": "Slide28",
      "jsPath": "html5/data/js/6TsqDEfppnq.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "meminta maaf ke temanuntuk tidak melanjutka makan",
        "mencela rasa makanan khas daerah dari temanmu",
        "membuang makanan tersebut karena kurang suka",
        "menghabiskan makanan bersama teman-teman",
        "Misalkan kamu memiliki teman baru dari daerah yang  berbeda denganmu. Teman barumu membawakan oleh-oleh  makanan khas dari daerahnya. Kamu mencicipi sedikit  makanan yang dibawa temanmu. Setelah mencicipi, kamu  kurang suka dengan rasanya. Tindakanmu sebaiknya"
      ],
      "texts": [
        {
          "objectId": "6iXJLX3avbA",
          "uniqueId": "6bxA5mmsuE9_2123467782",
          "linkId": "txt__default_6iXJLX3avbA",
          "commandSetId": "commandset-193",
          "altText": "meminta maaf ke temanuntuk tidak melanjutka makan\n",
          "lines": [
            "meminta maaf ke temanuntuk tidak melanjutka makan"
          ]
        },
        {
          "objectId": "5VM9NEhsrLX",
          "uniqueId": "6ctHhrkcSuW_1862357120",
          "linkId": "txt__default_5VM9NEhsrLX",
          "commandSetId": "commandset-194",
          "altText": "mencela rasa makanan khas daerah dari temanmu",
          "lines": [
            "mencela rasa makanan khas daerah dari temanmu"
          ]
        },
        {
          "objectId": "6WFNI1nDjDb",
          "uniqueId": "5nB7gtM2y5Y_676305449",
          "linkId": "txt__default_6WFNI1nDjDb",
          "commandSetId": "commandset-199",
          "altText": "membuang makanan tersebut karena kurang suka",
          "lines": [
            "membuang makanan tersebut karena kurang suka"
          ]
        },
        {
          "objectId": "6V9n5XzWzav",
          "uniqueId": "5l6secygC4v_-821334397",
          "linkId": "txt__default_6V9n5XzWzav",
          "commandSetId": "commandset-200",
          "altText": "menghabiskan makanan bersama teman-teman",
          "lines": [
            "menghabiskan makanan bersama teman-teman"
          ]
        },
        {
          "objectId": "5YqQGGnK9Bz",
          "uniqueId": "5YqQGGnK9Bz_433061640",
          "linkId": "txt__default_5YqQGGnK9Bz",
          "commandSetId": "commandset-203",
          "altText": "Misalkan kamu memiliki teman baru dari daerah yang berbeda denganmu. Teman barumu membawakan oleh-oleh makanan khas dari daerahnya. Kamu mencicipi sedikit makanan yang dibawa temanmu. Setelah mencicipi, kamu kurang suka dengan rasanya. Tindakanmu sebaiknya",
          "lines": [
            "Misalkan kamu memiliki teman baru dari daerah yang ",
            "berbeda denganmu. Teman barumu membawakan oleh-oleh ",
            "makanan khas dari daerahnya. Kamu mencicipi sedikit ",
            "makanan yang dibawa temanmu. Setelah mencicipi, kamu ",
            "kurang suka dengan rasanya. Tindakanmu sebaiknya"
          ]
        },
        {
          "objectId": "6STBhdYCyxL_CorrectReview",
          "uniqueId": "6STBhdYCyxL_CorrectReview",
          "linkId": "6STBhdYCyxL_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "6STBhdYCyxL_IncorrectReview",
          "uniqueId": "6STBhdYCyxL_IncorrectReview",
          "linkId": "6STBhdYCyxL_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "69ccWeFKW2s",
          "assetId": 199,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6fpoobyMjsv",
          "assetId": 200,
          "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
          "durationMs": 38641
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "69l0y2JF9EZ",
          "assetId": 201,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 1,
          "layerId": "6IjgPGebEz0",
          "audioId": "6jVkmZZRiY4",
          "assetId": 202,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6IjgPGebEz0",
          "audioId": "6SzS3bH2v4O",
          "assetId": 203,
          "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
          "durationMs": 5021
        },
        {
          "layerIndex": 1,
          "layerId": "6IjgPGebEz0",
          "audioId": "5n5dAQSMtt4",
          "assetId": 204,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6AIJEmDTCL3",
          "audioId": "6II3dFMNnC1",
          "assetId": 205,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6AIJEmDTCL3",
          "audioId": "6dvr9PBDTk0",
          "assetId": 206,
          "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
          "durationMs": 3871
        },
        {
          "layerIndex": 2,
          "layerId": "6AIJEmDTCL3",
          "audioId": "5YFujyyJ8Bp",
          "assetId": 207,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6JcUBP8OKS0",
          "assetId": 158,
          "url": "story_content/5jk1lv5JqZM.png",
          "altText": "5jEUQabPzSg.png",
          "width": 1017,
          "height": 503
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5ihEHUIn2Ee",
          "assetId": 159,
          "url": "story_content/5ewpLbxmMP5.png",
          "altText": "6UxUQ5kzvsI_P_0_0_1280_480.png",
          "width": 784,
          "height": 294
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5aebsSuKM3J",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 1,
          "layerId": "6IjgPGebEz0",
          "objectId": "5s5fyaUq5F5",
          "assetId": 164,
          "url": "story_content/64trbzmlqII.gif",
          "altText": "200.gif",
          "width": 200,
          "height": 200
        },
        {
          "layerIndex": 1,
          "layerId": "6IjgPGebEz0",
          "objectId": "6n4v1TVPYkj",
          "assetId": 165,
          "url": "story_content/6cVvYbugY8D_P_246_0_1299_405.png",
          "altText": "salah starla.png",
          "width": 1299,
          "height": 405
        },
        {
          "layerIndex": 1,
          "layerId": "6IjgPGebEz0",
          "objectId": "6iBj0j4Wyvj",
          "assetId": 166,
          "url": "story_content/5xIHoMB2ZC7.gif",
          "altText": "AS0005343_05.gif",
          "width": 254,
          "height": 300
        },
        {
          "layerIndex": 1,
          "layerId": "6IjgPGebEz0",
          "objectId": "67BmTMfY8zv",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 1,
          "layerId": "6IjgPGebEz0",
          "objectId": "6qtQzC55pvp",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6AIJEmDTCL3",
          "objectId": "5mLhj75cZ4L",
          "assetId": 172,
          "url": "story_content/6F5Z4MpnsdU.gif",
          "altText": "1645317_d9287.gif",
          "width": 500,
          "height": 500
        },
        {
          "layerIndex": 2,
          "layerId": "6AIJEmDTCL3",
          "objectId": "5cdGs3Yklaw",
          "assetId": 173,
          "url": "story_content/5gkgaNEdBEt.png",
          "altText": "benar.png",
          "width": 1141,
          "height": 388
        },
        {
          "layerIndex": 2,
          "layerId": "6AIJEmDTCL3",
          "objectId": "6ExPND8186F",
          "assetId": 174,
          "url": "story_content/5yMgs76yF4Y.gif",
          "altText": "AS0005343_04.gif",
          "width": 292,
          "height": 300
        },
        {
          "layerIndex": 2,
          "layerId": "6AIJEmDTCL3",
          "objectId": "6UTaTWhJ8Dx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6AIJEmDTCL3",
          "objectId": "5k9QHhQOPC6",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "6TsqDEfppnq",
        "slideNumber": 28,
        "interactionId": "5n7aaGFiNy2",
        "type": "multiplechoice",
        "questionText": "Misalkan kamu memiliki teman baru dari daerah yang berbeda denganmu. Teman barumu membawakan oleh-oleh makanan khas dari daerahnya. Kamu mencicipi sedikit makanan yang dibawa temanmu. Setelah mencicipi, kamu kurang suka dengan rasanya. Tindakanmu sebaiknya",
        "questionCommandSetId": "commandset-203",
        "maxPoints": 10,
        "choices": [
          {
            "id": "choice_6WFNI1nDjDb",
            "objectId": "6WFNI1nDjDb",
            "commandSetId": "commandset-199",
            "text": "membuang makanan tersebut karena kurang suka",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_6V9n5XzWzav",
            "objectId": "6V9n5XzWzav",
            "commandSetId": "commandset-200",
            "text": "menghabiskan makanan bersama teman-teman",
            "isCorrect": true,
            "points": 10
          },
          {
            "id": "choice_5VM9NEhsrLX",
            "objectId": "5VM9NEhsrLX",
            "commandSetId": "commandset-194",
            "text": "mencela rasa makanan khas daerah dari temanmu",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_6iXJLX3avbA",
            "objectId": "6iXJLX3avbA",
            "commandSetId": "commandset-193",
            "text": "meminta maaf ke temanuntuk tidak melanjutka makan\n",
            "isCorrect": false,
            "points": 0
          }
        ],
        "correctChoiceId": "choice_6V9n5XzWzav",
        "correctAnswerText": "menghabiskan makanan bersama teman-teman",
        "feedbackLayers": {
          "correctLayerId": "6AIJEmDTCL3",
          "incorrectLayerId": "6IjgPGebEz0"
        }
      }
    },
    "5tNzQg4qrZn": {
      "id": "5tNzQg4qrZn",
      "slideNumber": 29,
      "title": "Perhatikan gambar dibawah ini, walaupun mereka memakai baju adat yang berbeda namun memegang bendera merah putih yang sama, maknanya adalah...",
      "lmsId": "Slide29",
      "jsPath": "html5/data/js/5tNzQg4qrZn.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "foto bersama",
        "berjuang melawan penjajah",
        "bersatu saling menghargai",
        "melaksanakan upacara bendera",
        "Perhatikan gambar dibawah ini, walaupun mereka  memakai baju adat yang berbeda namun memegang  bendera merah putih yang sama, maknanya adalah..."
      ],
      "texts": [
        {
          "objectId": "5pc4q3FQPbs",
          "uniqueId": "6gHKn187p4G_2055543225",
          "linkId": "txt__default_5pc4q3FQPbs",
          "commandSetId": "commandset-210",
          "altText": "foto bersama",
          "lines": [
            "foto bersama"
          ]
        },
        {
          "objectId": "5ZOi3JMUqDj",
          "uniqueId": "6YDAxkk6Y1O_634498615",
          "linkId": "txt__default_5ZOi3JMUqDj",
          "commandSetId": "commandset-211",
          "altText": "berjuang melawan penjajah",
          "lines": [
            "berjuang melawan penjajah"
          ]
        },
        {
          "objectId": "68z043eV7Cd",
          "uniqueId": "5xkOqIRXWia_-1641190754",
          "linkId": "txt__default_68z043eV7Cd",
          "commandSetId": "commandset-214",
          "altText": "bersatu saling menghargai",
          "lines": [
            "bersatu saling menghargai"
          ]
        },
        {
          "objectId": "6JHZsxQ4btz",
          "uniqueId": "6qE9w83E8gc_21957522",
          "linkId": "txt__default_6JHZsxQ4btz",
          "commandSetId": "commandset-215",
          "altText": "melaksanakan upacara bendera",
          "lines": [
            "melaksanakan upacara bendera"
          ]
        },
        {
          "objectId": "5n1h1TawUsR",
          "uniqueId": "5n1h1TawUsR_1522078370",
          "linkId": "txt__default_5n1h1TawUsR",
          "commandSetId": "commandset-218",
          "altText": "Perhatikan gambar dibawah ini, walaupun mereka memakai baju adat yang berbeda namun memegang bendera merah putih yang sama, maknanya adalah...",
          "lines": [
            "Perhatikan gambar dibawah ini, walaupun mereka ",
            "memakai baju adat yang berbeda namun memegang ",
            "bendera merah putih yang sama, maknanya adalah..."
          ]
        },
        {
          "objectId": "5qCsT5pHbQn_CorrectReview",
          "uniqueId": "5qCsT5pHbQn_CorrectReview",
          "linkId": "5qCsT5pHbQn_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "5qCsT5pHbQn_IncorrectReview",
          "uniqueId": "5qCsT5pHbQn_IncorrectReview",
          "linkId": "5qCsT5pHbQn_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6UKK3rDuOie",
          "assetId": 210,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5dpqqDVHJMM",
          "assetId": 211,
          "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
          "durationMs": 38641
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5cMqqOcjLhL",
          "assetId": 212,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 1,
          "layerId": "6QkcRhah4eX",
          "audioId": "5V5jrzPWeYM",
          "assetId": 213,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6QkcRhah4eX",
          "audioId": "6SzS3bH2v4O",
          "assetId": 214,
          "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
          "durationMs": 5021
        },
        {
          "layerIndex": 1,
          "layerId": "6QkcRhah4eX",
          "audioId": "5n5dAQSMtt4",
          "assetId": 215,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "5aP1qzv44A6",
          "audioId": "5m05Ju5L1ML",
          "assetId": 216,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "5aP1qzv44A6",
          "audioId": "6dvr9PBDTk0",
          "assetId": 217,
          "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
          "durationMs": 3871
        },
        {
          "layerIndex": 2,
          "layerId": "5aP1qzv44A6",
          "audioId": "5YFujyyJ8Bp",
          "assetId": 218,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6dAzCtKQqes",
          "assetId": 158,
          "url": "story_content/5jk1lv5JqZM.png",
          "altText": "5jEUQabPzSg.png",
          "width": 1017,
          "height": 503
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6cgunoUF13I",
          "assetId": 159,
          "url": "story_content/5ewpLbxmMP5.png",
          "altText": "6UxUQ5kzvsI_P_0_0_1280_480.png",
          "width": 784,
          "height": 294
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5rDa9DCc6sd",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6NtMNu6Pf3H",
          "assetId": 209,
          "url": "story_content/6IQ01FMWzRp.png",
          "altText": "Desain tanpa judul (60).png",
          "width": 529,
          "height": 398
        },
        {
          "layerIndex": 1,
          "layerId": "6QkcRhah4eX",
          "objectId": "5s5fyaUq5F5",
          "assetId": 164,
          "url": "story_content/64trbzmlqII.gif",
          "altText": "200.gif",
          "width": 200,
          "height": 200
        },
        {
          "layerIndex": 1,
          "layerId": "6QkcRhah4eX",
          "objectId": "6n4v1TVPYkj",
          "assetId": 165,
          "url": "story_content/6cVvYbugY8D_P_246_0_1299_405.png",
          "altText": "salah starla.png",
          "width": 1299,
          "height": 405
        },
        {
          "layerIndex": 1,
          "layerId": "6QkcRhah4eX",
          "objectId": "6iBj0j4Wyvj",
          "assetId": 166,
          "url": "story_content/5xIHoMB2ZC7.gif",
          "altText": "AS0005343_05.gif",
          "width": 254,
          "height": 300
        },
        {
          "layerIndex": 1,
          "layerId": "6QkcRhah4eX",
          "objectId": "67BmTMfY8zv",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 1,
          "layerId": "6QkcRhah4eX",
          "objectId": "5vKnZq8X89I",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "5aP1qzv44A6",
          "objectId": "5mLhj75cZ4L",
          "assetId": 172,
          "url": "story_content/6F5Z4MpnsdU.gif",
          "altText": "1645317_d9287.gif",
          "width": 500,
          "height": 500
        },
        {
          "layerIndex": 2,
          "layerId": "5aP1qzv44A6",
          "objectId": "5cdGs3Yklaw",
          "assetId": 173,
          "url": "story_content/5gkgaNEdBEt.png",
          "altText": "benar.png",
          "width": 1141,
          "height": 388
        },
        {
          "layerIndex": 2,
          "layerId": "5aP1qzv44A6",
          "objectId": "6ExPND8186F",
          "assetId": 174,
          "url": "story_content/5yMgs76yF4Y.gif",
          "altText": "AS0005343_04.gif",
          "width": 292,
          "height": 300
        },
        {
          "layerIndex": 2,
          "layerId": "5aP1qzv44A6",
          "objectId": "6UTaTWhJ8Dx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "5aP1qzv44A6",
          "objectId": "5iF2B8hmrIo",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "5tNzQg4qrZn",
        "slideNumber": 29,
        "interactionId": "5X0lYwRx4jy",
        "type": "multiplechoice",
        "questionText": "Perhatikan gambar dibawah ini, walaupun mereka memakai baju adat yang berbeda namun memegang bendera merah putih yang sama, maknanya adalah...",
        "questionCommandSetId": "commandset-218",
        "maxPoints": 10,
        "choices": [
          {
            "id": "choice_68z043eV7Cd",
            "objectId": "68z043eV7Cd",
            "commandSetId": "commandset-214",
            "text": "bersatu saling menghargai",
            "isCorrect": true,
            "points": 10
          },
          {
            "id": "choice_6JHZsxQ4btz",
            "objectId": "6JHZsxQ4btz",
            "commandSetId": "commandset-215",
            "text": "melaksanakan upacara bendera",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_5ZOi3JMUqDj",
            "objectId": "5ZOi3JMUqDj",
            "commandSetId": "commandset-211",
            "text": "berjuang melawan penjajah",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_5pc4q3FQPbs",
            "objectId": "5pc4q3FQPbs",
            "commandSetId": "commandset-210",
            "text": "foto bersama",
            "isCorrect": false,
            "points": 0
          }
        ],
        "correctChoiceId": "choice_68z043eV7Cd",
        "correctAnswerText": "bersatu saling menghargai",
        "feedbackLayers": {
          "correctLayerId": "5aP1qzv44A6",
          "incorrectLayerId": "6QkcRhah4eX"
        }
      }
    },
    "5udKoy5uKgm": {
      "id": "5udKoy5uKgm",
      "slideNumber": 30,
      "title": "Tindakan menghargai yang sebaiknya dilakukan Mustofa dan Satria saat berkunjung ke rumah Bayu ketika melihat ukiran di pintu rumah adat dayak adalah....",
      "lmsId": "Slide30",
      "jsPath": "html5/data/js/5udKoy5uKgm.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "mengatakan bahwa rumahnya lebih unik daripada  rumah Bayu",
        "mengatakan bahwa rumah Bayu terlihat kuno dan  ketinggalan zaman",
        "mencoret-coret dinding rumah Bayu karena bagus",
        "memuji ukiran dinding yang terdapat di rumah Bayu",
        "Tindakan menghargai yang sebaiknya dilakukan Mustofa  dan Satria saat berkunjung ke rumah Bayu ketika melihat  ukiran di pintu rumah adat dayak adalah...."
      ],
      "texts": [
        {
          "objectId": "5jNOBm9lcbk",
          "uniqueId": "6FF0c30lIQa_701126317",
          "linkId": "txt__default_5jNOBm9lcbk",
          "commandSetId": "commandset-222",
          "altText": "mengatakan bahwa rumahnya lebih unik daripada rumah Bayu",
          "lines": [
            "mengatakan bahwa rumahnya lebih unik daripada ",
            "rumah Bayu"
          ]
        },
        {
          "objectId": "5tvU585dU4z",
          "uniqueId": "6EfpnbTeJtD_818810146",
          "linkId": "txt__default_5tvU585dU4z",
          "commandSetId": "commandset-223",
          "altText": "mengatakan bahwa rumah Bayu terlihat kuno dan ketinggalan zaman",
          "lines": [
            "mengatakan bahwa rumah Bayu terlihat kuno dan ",
            "ketinggalan zaman"
          ]
        },
        {
          "objectId": "6mcdiZg6LAP",
          "uniqueId": "6lYtGkD88Tj_-614805145",
          "linkId": "txt__default_6mcdiZg6LAP",
          "commandSetId": "commandset-228",
          "altText": "mencoret-coret dinding rumah Bayu karena bagus",
          "lines": [
            "mencoret-coret dinding rumah Bayu karena bagus"
          ]
        },
        {
          "objectId": "5yZBgCRi7eL",
          "uniqueId": "6GRoyVtjxPf_-1984786456",
          "linkId": "txt__default_5yZBgCRi7eL",
          "commandSetId": "commandset-229",
          "altText": "memuji ukiran dinding yang terdapat di rumah Bayu",
          "lines": [
            "memuji ukiran dinding yang terdapat di rumah Bayu"
          ]
        },
        {
          "objectId": "65QAHHDquLi",
          "uniqueId": "65QAHHDquLi_-2085688995",
          "linkId": "txt__default_65QAHHDquLi",
          "commandSetId": "commandset-231",
          "altText": "Tindakan menghargai yang sebaiknya dilakukan Mustofa dan Satria saat berkunjung ke rumah Bayu ketika melihat ukiran di pintu rumah adat dayak adalah....",
          "lines": [
            "Tindakan menghargai yang sebaiknya dilakukan Mustofa ",
            "dan Satria saat berkunjung ke rumah Bayu ketika melihat ",
            "ukiran di pintu rumah adat dayak adalah...."
          ]
        },
        {
          "objectId": "6cG19pW7V7M_CorrectReview",
          "uniqueId": "6cG19pW7V7M_CorrectReview",
          "linkId": "6cG19pW7V7M_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "6cG19pW7V7M_IncorrectReview",
          "uniqueId": "6cG19pW7V7M_IncorrectReview",
          "linkId": "6cG19pW7V7M_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6SFrQYV41st",
          "assetId": 220,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5ztziMk6JB6",
          "assetId": 221,
          "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
          "durationMs": 38641
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6L2Qr9zHJGW",
          "assetId": 222,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 1,
          "layerId": "6rbLNT1TBry",
          "audioId": "5WKnxs5aN7w",
          "assetId": 223,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6rbLNT1TBry",
          "audioId": "6SzS3bH2v4O",
          "assetId": 224,
          "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
          "durationMs": 5021
        },
        {
          "layerIndex": 1,
          "layerId": "6rbLNT1TBry",
          "audioId": "5n5dAQSMtt4",
          "assetId": 225,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "61Bo7wMMSKu",
          "audioId": "68fakN0bZkX",
          "assetId": 226,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "61Bo7wMMSKu",
          "audioId": "6dvr9PBDTk0",
          "assetId": 227,
          "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
          "durationMs": 3871
        },
        {
          "layerIndex": 2,
          "layerId": "61Bo7wMMSKu",
          "audioId": "5YFujyyJ8Bp",
          "assetId": 228,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6iTfnDEPcR3",
          "assetId": 158,
          "url": "story_content/5jk1lv5JqZM.png",
          "altText": "5jEUQabPzSg.png",
          "width": 1017,
          "height": 503
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5awkSyr8y4C",
          "assetId": 159,
          "url": "story_content/5ewpLbxmMP5.png",
          "altText": "6UxUQ5kzvsI_P_0_0_1280_480.png",
          "width": 784,
          "height": 294
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6B7vExlOL3R",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 1,
          "layerId": "6rbLNT1TBry",
          "objectId": "5s5fyaUq5F5",
          "assetId": 164,
          "url": "story_content/64trbzmlqII.gif",
          "altText": "200.gif",
          "width": 200,
          "height": 200
        },
        {
          "layerIndex": 1,
          "layerId": "6rbLNT1TBry",
          "objectId": "6n4v1TVPYkj",
          "assetId": 165,
          "url": "story_content/6cVvYbugY8D_P_246_0_1299_405.png",
          "altText": "salah starla.png",
          "width": 1299,
          "height": 405
        },
        {
          "layerIndex": 1,
          "layerId": "6rbLNT1TBry",
          "objectId": "6iBj0j4Wyvj",
          "assetId": 166,
          "url": "story_content/5xIHoMB2ZC7.gif",
          "altText": "AS0005343_05.gif",
          "width": 254,
          "height": 300
        },
        {
          "layerIndex": 1,
          "layerId": "6rbLNT1TBry",
          "objectId": "67BmTMfY8zv",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 1,
          "layerId": "6rbLNT1TBry",
          "objectId": "5lLcquVmMT2",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "61Bo7wMMSKu",
          "objectId": "5mLhj75cZ4L",
          "assetId": 172,
          "url": "story_content/6F5Z4MpnsdU.gif",
          "altText": "1645317_d9287.gif",
          "width": 500,
          "height": 500
        },
        {
          "layerIndex": 2,
          "layerId": "61Bo7wMMSKu",
          "objectId": "5cdGs3Yklaw",
          "assetId": 173,
          "url": "story_content/5gkgaNEdBEt.png",
          "altText": "benar.png",
          "width": 1141,
          "height": 388
        },
        {
          "layerIndex": 2,
          "layerId": "61Bo7wMMSKu",
          "objectId": "6ExPND8186F",
          "assetId": 174,
          "url": "story_content/5yMgs76yF4Y.gif",
          "altText": "AS0005343_04.gif",
          "width": 292,
          "height": 300
        },
        {
          "layerIndex": 2,
          "layerId": "61Bo7wMMSKu",
          "objectId": "6UTaTWhJ8Dx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "61Bo7wMMSKu",
          "objectId": "671yXfeD50x",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "5udKoy5uKgm",
        "slideNumber": 30,
        "interactionId": "6ecAv5UHVvK",
        "type": "multiplechoice",
        "questionText": "Tindakan menghargai yang sebaiknya dilakukan Mustofa dan Satria saat berkunjung ke rumah Bayu ketika melihat ukiran di pintu rumah adat dayak adalah....",
        "questionCommandSetId": "commandset-231",
        "maxPoints": 10,
        "choices": [
          {
            "id": "choice_6mcdiZg6LAP",
            "objectId": "6mcdiZg6LAP",
            "commandSetId": "commandset-228",
            "text": "mencoret-coret dinding rumah Bayu karena bagus",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_5yZBgCRi7eL",
            "objectId": "5yZBgCRi7eL",
            "commandSetId": "commandset-229",
            "text": "memuji ukiran dinding yang terdapat di rumah Bayu",
            "isCorrect": true,
            "points": 10
          },
          {
            "id": "choice_5tvU585dU4z",
            "objectId": "5tvU585dU4z",
            "commandSetId": "commandset-223",
            "text": "mengatakan bahwa rumah Bayu terlihat kuno dan ketinggalan zaman",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_5jNOBm9lcbk",
            "objectId": "5jNOBm9lcbk",
            "commandSetId": "commandset-222",
            "text": "mengatakan bahwa rumahnya lebih unik daripada rumah Bayu",
            "isCorrect": false,
            "points": 0
          }
        ],
        "correctChoiceId": "choice_5yZBgCRi7eL",
        "correctAnswerText": "memuji ukiran dinding yang terdapat di rumah Bayu",
        "feedbackLayers": {
          "correctLayerId": "61Bo7wMMSKu",
          "incorrectLayerId": "6rbLNT1TBry"
        }
      }
    },
    "6PxxtyG4oap": {
      "id": "6PxxtyG4oap",
      "slideNumber": 31,
      "title": "Seorang pedagang siomai dari Bandung berbicara menggunakan bahasa Sunda. Kamu berasal dari daerah berbeda. Kamu tidak mengerti bahasa Sunda. Tindakanmu sebaiknya.... ",
      "lmsId": "Slide31",
      "jsPath": "html5/data/js/6PxxtyG4oap.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "tidak jadi membeli siomai karena berbeda bahasa  daerah",
        "mengajak pedagang berbicara menggunakan bahasa  daerahmu",
        "meminta dengan sopan agar pedagang itu berbicara  menggunakan bahasa Indonesia",
        "meminta pedagang itu untuk berbicara menggunakan  bahasa daerahmu",
        "Seorang pedagang siomai dari Bandung berbicara  menggunakan bahasa Sunda. Kamu berasal dari daerah  berbeda. Kamu tidak mengerti bahasa Sunda. Tindakanmu  sebaiknya...."
      ],
      "texts": [
        {
          "objectId": "5lFRx7up827",
          "uniqueId": "6Fv40tsb0rT_1930812734",
          "linkId": "txt__default_5lFRx7up827",
          "commandSetId": "commandset-232",
          "altText": "tidak jadi membeli siomai karena berbeda bahasa daerah",
          "lines": [
            "tidak jadi membeli siomai karena berbeda bahasa ",
            "daerah"
          ]
        },
        {
          "objectId": "6GpqX7TLTb9",
          "uniqueId": "6RiJAxKL0pz_-1602953408",
          "linkId": "txt__default_6GpqX7TLTb9",
          "commandSetId": "commandset-233",
          "altText": "mengajak pedagang berbicara menggunakan bahasa daerahmu",
          "lines": [
            "mengajak pedagang berbicara menggunakan bahasa ",
            "daerahmu"
          ]
        },
        {
          "objectId": "6BmI7R905py",
          "uniqueId": "5oUqyM4H13X_2025114176",
          "linkId": "txt__default_6BmI7R905py",
          "commandSetId": "commandset-236",
          "altText": "meminta dengan sopan agar pedagang itu berbicara menggunakan bahasa Indonesia",
          "lines": [
            "meminta dengan sopan agar pedagang itu berbicara ",
            "menggunakan bahasa Indonesia"
          ]
        },
        {
          "objectId": "5xgJs3j9aSj",
          "uniqueId": "6UvClDDbE3A_105848118",
          "linkId": "txt__default_5xgJs3j9aSj",
          "commandSetId": "commandset-237",
          "altText": "meminta pedagang itu untuk berbicara menggunakan bahasa daerahmu",
          "lines": [
            "meminta pedagang itu untuk berbicara menggunakan ",
            "bahasa daerahmu"
          ]
        },
        {
          "objectId": "6qxJVLZDR0x",
          "uniqueId": "6qxJVLZDR0x_699369",
          "linkId": "txt__default_6qxJVLZDR0x",
          "commandSetId": "commandset-240",
          "altText": "Seorang pedagang siomai dari Bandung berbicara menggunakan bahasa Sunda. Kamu berasal dari daerah berbeda. Kamu tidak mengerti bahasa Sunda. Tindakanmu sebaiknya.... ",
          "lines": [
            "Seorang pedagang siomai dari Bandung berbicara ",
            "menggunakan bahasa Sunda. Kamu berasal dari daerah ",
            "berbeda. Kamu tidak mengerti bahasa Sunda. Tindakanmu ",
            "sebaiknya.... "
          ]
        },
        {
          "objectId": "6l1kGROde3h_CorrectReview",
          "uniqueId": "6l1kGROde3h_CorrectReview",
          "linkId": "6l1kGROde3h_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "6l1kGROde3h_IncorrectReview",
          "uniqueId": "6l1kGROde3h_IncorrectReview",
          "linkId": "6l1kGROde3h_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5n0tFuVdcre",
          "assetId": 230,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "60q39Lsboca",
          "assetId": 231,
          "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
          "durationMs": 38641
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6hvXesGM6pa",
          "assetId": 232,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 1,
          "layerId": "61rhLpSYjLN",
          "audioId": "5j6Dv5ndbYC",
          "assetId": 233,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "61rhLpSYjLN",
          "audioId": "6SzS3bH2v4O",
          "assetId": 234,
          "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
          "durationMs": 5021
        },
        {
          "layerIndex": 1,
          "layerId": "61rhLpSYjLN",
          "audioId": "5n5dAQSMtt4",
          "assetId": 235,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6NOS9sRsO3U",
          "audioId": "5oAeKhwoHKf",
          "assetId": 236,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6NOS9sRsO3U",
          "audioId": "6dvr9PBDTk0",
          "assetId": 237,
          "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
          "durationMs": 3871
        },
        {
          "layerIndex": 2,
          "layerId": "6NOS9sRsO3U",
          "audioId": "5YFujyyJ8Bp",
          "assetId": 238,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6Fk84UjmAns",
          "assetId": 158,
          "url": "story_content/5jk1lv5JqZM.png",
          "altText": "5jEUQabPzSg.png",
          "width": 1017,
          "height": 503
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "66XlrFkH4gn",
          "assetId": 159,
          "url": "story_content/5ewpLbxmMP5.png",
          "altText": "6UxUQ5kzvsI_P_0_0_1280_480.png",
          "width": 784,
          "height": 294
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6TPImSqlsYB",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 1,
          "layerId": "61rhLpSYjLN",
          "objectId": "5s5fyaUq5F5",
          "assetId": 164,
          "url": "story_content/64trbzmlqII.gif",
          "altText": "200.gif",
          "width": 200,
          "height": 200
        },
        {
          "layerIndex": 1,
          "layerId": "61rhLpSYjLN",
          "objectId": "6n4v1TVPYkj",
          "assetId": 165,
          "url": "story_content/6cVvYbugY8D_P_246_0_1299_405.png",
          "altText": "salah starla.png",
          "width": 1299,
          "height": 405
        },
        {
          "layerIndex": 1,
          "layerId": "61rhLpSYjLN",
          "objectId": "6iBj0j4Wyvj",
          "assetId": 166,
          "url": "story_content/5xIHoMB2ZC7.gif",
          "altText": "AS0005343_05.gif",
          "width": 254,
          "height": 300
        },
        {
          "layerIndex": 1,
          "layerId": "61rhLpSYjLN",
          "objectId": "67BmTMfY8zv",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 1,
          "layerId": "61rhLpSYjLN",
          "objectId": "665Yo6Tgiac",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6NOS9sRsO3U",
          "objectId": "5mLhj75cZ4L",
          "assetId": 172,
          "url": "story_content/6F5Z4MpnsdU.gif",
          "altText": "1645317_d9287.gif",
          "width": 500,
          "height": 500
        },
        {
          "layerIndex": 2,
          "layerId": "6NOS9sRsO3U",
          "objectId": "5cdGs3Yklaw",
          "assetId": 173,
          "url": "story_content/5gkgaNEdBEt.png",
          "altText": "benar.png",
          "width": 1141,
          "height": 388
        },
        {
          "layerIndex": 2,
          "layerId": "6NOS9sRsO3U",
          "objectId": "6ExPND8186F",
          "assetId": 174,
          "url": "story_content/5yMgs76yF4Y.gif",
          "altText": "AS0005343_04.gif",
          "width": 292,
          "height": 300
        },
        {
          "layerIndex": 2,
          "layerId": "6NOS9sRsO3U",
          "objectId": "6UTaTWhJ8Dx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6NOS9sRsO3U",
          "objectId": "6g7qLC86lAm",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "6PxxtyG4oap",
        "slideNumber": 31,
        "interactionId": "5ccluUrKWxL",
        "type": "multiplechoice",
        "questionText": "Seorang pedagang siomai dari Bandung berbicara menggunakan bahasa Sunda. Kamu berasal dari daerah berbeda. Kamu tidak mengerti bahasa Sunda. Tindakanmu sebaiknya.... ",
        "questionCommandSetId": "commandset-240",
        "maxPoints": 10,
        "choices": [
          {
            "id": "choice_6BmI7R905py",
            "objectId": "6BmI7R905py",
            "commandSetId": "commandset-236",
            "text": "meminta dengan sopan agar pedagang itu berbicara menggunakan bahasa Indonesia",
            "isCorrect": true,
            "points": 10
          },
          {
            "id": "choice_5xgJs3j9aSj",
            "objectId": "5xgJs3j9aSj",
            "commandSetId": "commandset-237",
            "text": "meminta pedagang itu untuk berbicara menggunakan bahasa daerahmu",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_6GpqX7TLTb9",
            "objectId": "6GpqX7TLTb9",
            "commandSetId": "commandset-233",
            "text": "mengajak pedagang berbicara menggunakan bahasa daerahmu",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_5lFRx7up827",
            "objectId": "5lFRx7up827",
            "commandSetId": "commandset-232",
            "text": "tidak jadi membeli siomai karena berbeda bahasa daerah",
            "isCorrect": false,
            "points": 0
          }
        ],
        "correctChoiceId": "choice_6BmI7R905py",
        "correctAnswerText": "meminta dengan sopan agar pedagang itu berbicara menggunakan bahasa Indonesia",
        "feedbackLayers": {
          "correctLayerId": "6NOS9sRsO3U",
          "incorrectLayerId": "61rhLpSYjLN"
        }
      }
    },
    "5eaO0Lz8ZMk": {
      "id": "5eaO0Lz8ZMk",
      "slideNumber": 32,
      "title": "Temanmu menjelaskan sejarah dan keunikan senjata tradisional dari daerahnya. Tindakanmu sebaiknya adalah..",
      "lmsId": "Slide32",
      "jsPath": "html5/data/js/5eaO0Lz8ZMk.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "mencari kekurangan dari senjata tradisional yang  sedang dijelaskannya",
        "mendengarkan penjelasannya dengan saksama",
        "tidak mendengarkan penjelasannya",
        "mengobrol dengan teman lain karena tidak tertarik  dengan ceritanya",
        "Temanmu menjelaskan sejarah dan keunikan  senjata tradisional dari daerahnya. Tindakanmu  sebaiknya adalah.."
      ],
      "texts": [
        {
          "objectId": "62GDQTE6pPh",
          "uniqueId": "67YvoIMGhdw_-1214061910",
          "linkId": "txt__default_62GDQTE6pPh",
          "commandSetId": "commandset-243",
          "altText": "mencari kekurangan dari senjata tradisional yang sedang dijelaskannya",
          "lines": [
            "mencari kekurangan dari senjata tradisional yang ",
            "sedang dijelaskannya"
          ]
        },
        {
          "objectId": "6QRkw5qLd0w",
          "uniqueId": "6dU8hEjfXuY_1965449449",
          "linkId": "txt__default_6QRkw5qLd0w",
          "commandSetId": "commandset-244",
          "altText": "mendengarkan penjelasannya dengan saksama",
          "lines": [
            "mendengarkan penjelasannya dengan saksama"
          ]
        },
        {
          "objectId": "6VShuLQdd5A",
          "uniqueId": "68Mj75LMXma_-2117746466",
          "linkId": "txt__default_6VShuLQdd5A",
          "commandSetId": "commandset-249",
          "altText": "tidak mendengarkan penjelasannya",
          "lines": [
            "tidak mendengarkan penjelasannya"
          ]
        },
        {
          "objectId": "67qTI4Zo6bT",
          "uniqueId": "5WuGWyNvVOe_1184179004",
          "linkId": "txt__default_67qTI4Zo6bT",
          "commandSetId": "commandset-250",
          "altText": "mengobrol dengan teman lain karena tidak tertarik dengan ceritanya",
          "lines": [
            "mengobrol dengan teman lain karena tidak tertarik ",
            "dengan ceritanya"
          ]
        },
        {
          "objectId": "5zRY8NPNsFd",
          "uniqueId": "5zRY8NPNsFd_1844864032",
          "linkId": "txt__default_5zRY8NPNsFd",
          "commandSetId": "commandset-253",
          "altText": "Temanmu menjelaskan sejarah dan keunikan senjata tradisional dari daerahnya. Tindakanmu sebaiknya adalah..",
          "lines": [
            "Temanmu menjelaskan sejarah dan keunikan ",
            "senjata tradisional dari daerahnya. Tindakanmu ",
            "sebaiknya adalah.."
          ]
        },
        {
          "objectId": "6n6C2g1VcPu_CorrectReview",
          "uniqueId": "6n6C2g1VcPu_CorrectReview",
          "linkId": "6n6C2g1VcPu_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "6n6C2g1VcPu_IncorrectReview",
          "uniqueId": "6n6C2g1VcPu_IncorrectReview",
          "linkId": "6n6C2g1VcPu_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5xtCe6cOdX1",
          "assetId": 240,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5bvXMOXZ62S",
          "assetId": 241,
          "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
          "durationMs": 38641
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5hgan0R6GvL",
          "assetId": 242,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 1,
          "layerId": "5lnjz9IXetF",
          "audioId": "6CTcwTNeR3V",
          "assetId": 243,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "5lnjz9IXetF",
          "audioId": "6SzS3bH2v4O",
          "assetId": 244,
          "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
          "durationMs": 5021
        },
        {
          "layerIndex": 1,
          "layerId": "5lnjz9IXetF",
          "audioId": "5n5dAQSMtt4",
          "assetId": 245,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "5dPQ9dmNB1n",
          "audioId": "6IUQ89gCdCb",
          "assetId": 246,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "5dPQ9dmNB1n",
          "audioId": "6dvr9PBDTk0",
          "assetId": 247,
          "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
          "durationMs": 3871
        },
        {
          "layerIndex": 2,
          "layerId": "5dPQ9dmNB1n",
          "audioId": "5YFujyyJ8Bp",
          "assetId": 248,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6gYLiIObRsT",
          "assetId": 158,
          "url": "story_content/5jk1lv5JqZM.png",
          "altText": "5jEUQabPzSg.png",
          "width": 1017,
          "height": 503
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5l3GAsyl92A",
          "assetId": 159,
          "url": "story_content/5ewpLbxmMP5.png",
          "altText": "6UxUQ5kzvsI_P_0_0_1280_480.png",
          "width": 784,
          "height": 294
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "66KR7o1uCLM",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 1,
          "layerId": "5lnjz9IXetF",
          "objectId": "5s5fyaUq5F5",
          "assetId": 164,
          "url": "story_content/64trbzmlqII.gif",
          "altText": "200.gif",
          "width": 200,
          "height": 200
        },
        {
          "layerIndex": 1,
          "layerId": "5lnjz9IXetF",
          "objectId": "6n4v1TVPYkj",
          "assetId": 165,
          "url": "story_content/6cVvYbugY8D_P_246_0_1299_405.png",
          "altText": "salah starla.png",
          "width": 1299,
          "height": 405
        },
        {
          "layerIndex": 1,
          "layerId": "5lnjz9IXetF",
          "objectId": "6iBj0j4Wyvj",
          "assetId": 166,
          "url": "story_content/5xIHoMB2ZC7.gif",
          "altText": "AS0005343_05.gif",
          "width": 254,
          "height": 300
        },
        {
          "layerIndex": 1,
          "layerId": "5lnjz9IXetF",
          "objectId": "67BmTMfY8zv",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 1,
          "layerId": "5lnjz9IXetF",
          "objectId": "5r64wxSwBh2",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "5dPQ9dmNB1n",
          "objectId": "5mLhj75cZ4L",
          "assetId": 172,
          "url": "story_content/6F5Z4MpnsdU.gif",
          "altText": "1645317_d9287.gif",
          "width": 500,
          "height": 500
        },
        {
          "layerIndex": 2,
          "layerId": "5dPQ9dmNB1n",
          "objectId": "5cdGs3Yklaw",
          "assetId": 173,
          "url": "story_content/5gkgaNEdBEt.png",
          "altText": "benar.png",
          "width": 1141,
          "height": 388
        },
        {
          "layerIndex": 2,
          "layerId": "5dPQ9dmNB1n",
          "objectId": "6ExPND8186F",
          "assetId": 174,
          "url": "story_content/5yMgs76yF4Y.gif",
          "altText": "AS0005343_04.gif",
          "width": 292,
          "height": 300
        },
        {
          "layerIndex": 2,
          "layerId": "5dPQ9dmNB1n",
          "objectId": "6UTaTWhJ8Dx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "5dPQ9dmNB1n",
          "objectId": "6CncvK8J5PW",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "5eaO0Lz8ZMk",
        "slideNumber": 32,
        "interactionId": "615RmMUnUpM",
        "type": "multiplechoice",
        "questionText": "Temanmu menjelaskan sejarah dan keunikan senjata tradisional dari daerahnya. Tindakanmu sebaiknya adalah..",
        "questionCommandSetId": "commandset-253",
        "maxPoints": 10,
        "choices": [
          {
            "id": "choice_6VShuLQdd5A",
            "objectId": "6VShuLQdd5A",
            "commandSetId": "commandset-249",
            "text": "tidak mendengarkan penjelasannya",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_67qTI4Zo6bT",
            "objectId": "67qTI4Zo6bT",
            "commandSetId": "commandset-250",
            "text": "mengobrol dengan teman lain karena tidak tertarik dengan ceritanya",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_6QRkw5qLd0w",
            "objectId": "6QRkw5qLd0w",
            "commandSetId": "commandset-244",
            "text": "mendengarkan penjelasannya dengan saksama",
            "isCorrect": true,
            "points": 10
          },
          {
            "id": "choice_62GDQTE6pPh",
            "objectId": "62GDQTE6pPh",
            "commandSetId": "commandset-243",
            "text": "mencari kekurangan dari senjata tradisional yang sedang dijelaskannya",
            "isCorrect": false,
            "points": 0
          }
        ],
        "correctChoiceId": "choice_6QRkw5qLd0w",
        "correctAnswerText": "mendengarkan penjelasannya dengan saksama",
        "feedbackLayers": {
          "correctLayerId": "5dPQ9dmNB1n",
          "incorrectLayerId": "5lnjz9IXetF"
        }
      }
    },
    "6SKvjji8cdv": {
      "id": "6SKvjji8cdv",
      "slideNumber": 33,
      "title": "Kamu dan temanmu menyaksikan pentas seni tari tradisional di dekat rumah. Tarian yang sedang ditampilkan tidak berasal dari daerahmu. Tindakanmu sebaiknya",
      "lmsId": "Slide33",
      "jsPath": "html5/data/js/6SKvjji8cdv.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "memberikan pujian terhadap penampilan para  penari",
        "mengajak teman untuk meninggalkan tempat  tersebut",
        "merasa bahwa tari modern lebih bagus  dibandingkan tari tradicional",
        "mencari kekurangan dari tari tradisional yang  ditampilkan",
        "Kamu dan temanmu menyaksikan pentas seni tari  tradisional di dekat rumah. Tarian yang sedang ditampilkan  tidak berasal dari daerahmu. Tindakanmu sebaiknya"
      ],
      "texts": [
        {
          "objectId": "6cxGp9TN1cp",
          "uniqueId": "5oXyRHYxiji_-526419434",
          "linkId": "txt__default_6cxGp9TN1cp",
          "commandSetId": "commandset-262",
          "altText": "memberikan pujian terhadap penampilan para penari",
          "lines": [
            "memberikan pujian terhadap penampilan para ",
            "penari"
          ]
        },
        {
          "objectId": "5umFBsxx2Fr",
          "uniqueId": "6hT9Res5vH1_-1545869725",
          "linkId": "txt__default_5umFBsxx2Fr",
          "commandSetId": "commandset-263",
          "altText": "mengajak teman untuk meninggalkan tempat tersebut",
          "lines": [
            "mengajak teman untuk meninggalkan tempat ",
            "tersebut"
          ]
        },
        {
          "objectId": "5fbJQeTkPZ8",
          "uniqueId": "5kedJT2broo_287207547",
          "linkId": "txt__default_5fbJQeTkPZ8",
          "commandSetId": "commandset-264",
          "altText": "merasa bahwa tari modern lebih bagus dibandingkan tari tradicional",
          "lines": [
            "merasa bahwa tari modern lebih bagus ",
            "dibandingkan tari tradicional"
          ]
        },
        {
          "objectId": "5xnLhfrkH7T",
          "uniqueId": "6atJOg4kcPT_-2035555475",
          "linkId": "txt__default_5xnLhfrkH7T",
          "commandSetId": "commandset-265",
          "altText": "mencari kekurangan dari tari tradisional yang ditampilkan",
          "lines": [
            "mencari kekurangan dari tari tradisional yang ",
            "ditampilkan"
          ]
        },
        {
          "objectId": "62rq0B7EWU6",
          "uniqueId": "62rq0B7EWU6_-2108243962",
          "linkId": "txt__default_62rq0B7EWU6",
          "commandSetId": "commandset-266",
          "altText": "Kamu dan temanmu menyaksikan pentas seni tari tradisional di dekat rumah. Tarian yang sedang ditampilkan tidak berasal dari daerahmu. Tindakanmu sebaiknya",
          "lines": [
            "Kamu dan temanmu menyaksikan pentas seni tari ",
            "tradisional di dekat rumah. Tarian yang sedang ditampilkan ",
            "tidak berasal dari daerahmu. Tindakanmu sebaiknya"
          ]
        },
        {
          "objectId": "5g31gd1iQ7v_CorrectReview",
          "uniqueId": "5g31gd1iQ7v_CorrectReview",
          "linkId": "5g31gd1iQ7v_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "5g31gd1iQ7v_IncorrectReview",
          "uniqueId": "5g31gd1iQ7v_IncorrectReview",
          "linkId": "5g31gd1iQ7v_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6TvorCQyTF4",
          "assetId": 250,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5y05pIP52fG",
          "assetId": 251,
          "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
          "durationMs": 38641
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5kdTAjlUCXm",
          "assetId": 252,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 1,
          "layerId": "6R7oc9XCNf5",
          "audioId": "5z7nExUID5Q",
          "assetId": 253,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6R7oc9XCNf5",
          "audioId": "6SzS3bH2v4O",
          "assetId": 254,
          "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
          "durationMs": 5021
        },
        {
          "layerIndex": 1,
          "layerId": "6R7oc9XCNf5",
          "audioId": "5n5dAQSMtt4",
          "assetId": 255,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6AYOrp7ei5M",
          "audioId": "67P52IbaePr",
          "assetId": 256,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6AYOrp7ei5M",
          "audioId": "6dvr9PBDTk0",
          "assetId": 257,
          "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
          "durationMs": 3871
        },
        {
          "layerIndex": 2,
          "layerId": "6AYOrp7ei5M",
          "audioId": "5YFujyyJ8Bp",
          "assetId": 258,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6CA71pziedw",
          "assetId": 158,
          "url": "story_content/5jk1lv5JqZM.png",
          "altText": "5jEUQabPzSg.png",
          "width": 1017,
          "height": 503
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5cnsOawcy8F",
          "assetId": 159,
          "url": "story_content/5ewpLbxmMP5.png",
          "altText": "6UxUQ5kzvsI_P_0_0_1280_480.png",
          "width": 784,
          "height": 294
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5uWYNkYaPqt",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 1,
          "layerId": "6R7oc9XCNf5",
          "objectId": "5s5fyaUq5F5",
          "assetId": 164,
          "url": "story_content/64trbzmlqII.gif",
          "altText": "200.gif",
          "width": 200,
          "height": 200
        },
        {
          "layerIndex": 1,
          "layerId": "6R7oc9XCNf5",
          "objectId": "6n4v1TVPYkj",
          "assetId": 165,
          "url": "story_content/6cVvYbugY8D_P_246_0_1299_405.png",
          "altText": "salah starla.png",
          "width": 1299,
          "height": 405
        },
        {
          "layerIndex": 1,
          "layerId": "6R7oc9XCNf5",
          "objectId": "6iBj0j4Wyvj",
          "assetId": 166,
          "url": "story_content/5xIHoMB2ZC7.gif",
          "altText": "AS0005343_05.gif",
          "width": 254,
          "height": 300
        },
        {
          "layerIndex": 1,
          "layerId": "6R7oc9XCNf5",
          "objectId": "67BmTMfY8zv",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 1,
          "layerId": "6R7oc9XCNf5",
          "objectId": "66reliplcbx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6AYOrp7ei5M",
          "objectId": "5mLhj75cZ4L",
          "assetId": 172,
          "url": "story_content/6F5Z4MpnsdU.gif",
          "altText": "1645317_d9287.gif",
          "width": 500,
          "height": 500
        },
        {
          "layerIndex": 2,
          "layerId": "6AYOrp7ei5M",
          "objectId": "5cdGs3Yklaw",
          "assetId": 173,
          "url": "story_content/5gkgaNEdBEt.png",
          "altText": "benar.png",
          "width": 1141,
          "height": 388
        },
        {
          "layerIndex": 2,
          "layerId": "6AYOrp7ei5M",
          "objectId": "6ExPND8186F",
          "assetId": 174,
          "url": "story_content/5yMgs76yF4Y.gif",
          "altText": "AS0005343_04.gif",
          "width": 292,
          "height": 300
        },
        {
          "layerIndex": 2,
          "layerId": "6AYOrp7ei5M",
          "objectId": "6UTaTWhJ8Dx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6AYOrp7ei5M",
          "objectId": "6V3A0y7Ab3X",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "6SKvjji8cdv",
        "slideNumber": 33,
        "interactionId": "6ByK1wqt7Jy",
        "type": "multiplechoice",
        "questionText": "Kamu dan temanmu menyaksikan pentas seni tari tradisional di dekat rumah. Tarian yang sedang ditampilkan tidak berasal dari daerahmu. Tindakanmu sebaiknya",
        "questionCommandSetId": "commandset-266",
        "maxPoints": 10,
        "choices": [
          {
            "id": "choice_5fbJQeTkPZ8",
            "objectId": "5fbJQeTkPZ8",
            "commandSetId": "commandset-264",
            "text": "merasa bahwa tari modern lebih bagus dibandingkan tari tradicional",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_5xnLhfrkH7T",
            "objectId": "5xnLhfrkH7T",
            "commandSetId": "commandset-265",
            "text": "mencari kekurangan dari tari tradisional yang ditampilkan",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_5umFBsxx2Fr",
            "objectId": "5umFBsxx2Fr",
            "commandSetId": "commandset-263",
            "text": "mengajak teman untuk meninggalkan tempat tersebut",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_6cxGp9TN1cp",
            "objectId": "6cxGp9TN1cp",
            "commandSetId": "commandset-262",
            "text": "memberikan pujian terhadap penampilan para penari",
            "isCorrect": true,
            "points": 10
          }
        ],
        "correctChoiceId": "choice_6cxGp9TN1cp",
        "correctAnswerText": "memberikan pujian terhadap penampilan para penari",
        "feedbackLayers": {
          "correctLayerId": "6AYOrp7ei5M",
          "incorrectLayerId": "6R7oc9XCNf5"
        }
      }
    },
    "5a8YIrSITc8": {
      "id": "5a8YIrSITc8",
      "slideNumber": 34,
      "title": "Zaura pandai memainkan beberapa alat musik tradisional. Zaura paling suka bermain angklung. Ibu Guru sering meminta Zaura untuk menampilkan permainannya dalam acara sekolah. Tindakan yang sebaiknya dilakukan Zaura dengan kemampuan yang dimilikinya adalah",
      "lmsId": "Slide34",
      "jsPath": "html5/data/js/5a8YIrSITc8.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "memilih untuk belajar alat musik modern agar tidak  ketinggalan zaman",
        "lebih memilih mempelajari alat musik yang berasal dari  daerahnya saja",
        "mencela teman menggunakan alat musik tradisional",
        "terus belajar memainkan alat musik tradisional dan  mengajari teman",
        "Zaura pandai memainkan beberapa alat musik tradisional.  Zaura paling suka bermain angklung. Ibu Guru sering  meminta Zaura untuk menampilkan permainannya dalam  acara sekolah. Tindakan yang sebaiknya dilakukan Zaura  dengan kemampuan yang dimilikinya adalah"
      ],
      "texts": [
        {
          "objectId": "62eUyuMcCAJ",
          "uniqueId": "6oBJymXBhkg_234866948",
          "linkId": "txt__default_62eUyuMcCAJ",
          "commandSetId": "commandset-272",
          "altText": "memilih untuk belajar alat musik modern agar tidak ketinggalan zaman",
          "lines": [
            "memilih untuk belajar alat musik modern agar tidak ",
            "ketinggalan zaman"
          ]
        },
        {
          "objectId": "5l3UHJPpE8D",
          "uniqueId": "5XTyMorvqCF_1682780613",
          "linkId": "txt__default_5l3UHJPpE8D",
          "commandSetId": "commandset-273",
          "altText": "lebih memilih mempelajari alat musik yang berasal dari daerahnya saja",
          "lines": [
            "lebih memilih mempelajari alat musik yang berasal dari ",
            "daerahnya saja"
          ]
        },
        {
          "objectId": "6SjkddRAYtG",
          "uniqueId": "6pulozxvo9i_94207404",
          "linkId": "txt__default_6SjkddRAYtG",
          "commandSetId": "commandset-278",
          "altText": "mencela teman menggunakan alat musik tradisional",
          "lines": [
            "mencela teman menggunakan alat musik tradisional"
          ]
        },
        {
          "objectId": "6CNI9CtAg4I",
          "uniqueId": "69CVU92r2mK_1026219134",
          "linkId": "txt__default_6CNI9CtAg4I",
          "commandSetId": "commandset-281",
          "altText": "terus belajar memainkan alat musik tradisional dan mengajari teman",
          "lines": [
            "terus belajar memainkan alat musik tradisional dan ",
            "mengajari teman"
          ]
        },
        {
          "objectId": "5c930bQDXdG",
          "uniqueId": "5c930bQDXdG_-119404166",
          "linkId": "txt__default_5c930bQDXdG",
          "commandSetId": "commandset-284",
          "altText": "Zaura pandai memainkan beberapa alat musik tradisional. Zaura paling suka bermain angklung. Ibu Guru sering meminta Zaura untuk menampilkan permainannya dalam acara sekolah. Tindakan yang sebaiknya dilakukan Zaura dengan kemampuan yang dimilikinya adalah",
          "lines": [
            "Zaura pandai memainkan beberapa alat musik tradisional. ",
            "Zaura paling suka bermain angklung. Ibu Guru sering ",
            "meminta Zaura untuk menampilkan permainannya dalam ",
            "acara sekolah. Tindakan yang sebaiknya dilakukan Zaura ",
            "dengan kemampuan yang dimilikinya adalah"
          ]
        },
        {
          "objectId": "5adK7zG5F1d_CorrectReview",
          "uniqueId": "5adK7zG5F1d_CorrectReview",
          "linkId": "5adK7zG5F1d_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "5adK7zG5F1d_IncorrectReview",
          "uniqueId": "5adK7zG5F1d_IncorrectReview",
          "linkId": "5adK7zG5F1d_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6pgk4moAyAV",
          "assetId": 260,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6nW3dyKHssi",
          "assetId": 261,
          "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
          "durationMs": 38641
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6AkpZ2BEm6P",
          "assetId": 262,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 1,
          "layerId": "6O0xCHrwpAI",
          "audioId": "5sCyvvoprvZ",
          "assetId": 263,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6O0xCHrwpAI",
          "audioId": "6SzS3bH2v4O",
          "assetId": 264,
          "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
          "durationMs": 5021
        },
        {
          "layerIndex": 1,
          "layerId": "6O0xCHrwpAI",
          "audioId": "5n5dAQSMtt4",
          "assetId": 265,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6ULkx4Aw2EM",
          "audioId": "64GEEnfcsGE",
          "assetId": 266,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6ULkx4Aw2EM",
          "audioId": "6dvr9PBDTk0",
          "assetId": 267,
          "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
          "durationMs": 3871
        },
        {
          "layerIndex": 2,
          "layerId": "6ULkx4Aw2EM",
          "audioId": "5YFujyyJ8Bp",
          "assetId": 268,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6ChDWnJRzGL",
          "assetId": 158,
          "url": "story_content/5jk1lv5JqZM.png",
          "altText": "5jEUQabPzSg.png",
          "width": 1017,
          "height": 503
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6359aCVzIG9",
          "assetId": 159,
          "url": "story_content/5ewpLbxmMP5.png",
          "altText": "6UxUQ5kzvsI_P_0_0_1280_480.png",
          "width": 784,
          "height": 294
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5fsEZSYb23N",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 1,
          "layerId": "6O0xCHrwpAI",
          "objectId": "5s5fyaUq5F5",
          "assetId": 164,
          "url": "story_content/64trbzmlqII.gif",
          "altText": "200.gif",
          "width": 200,
          "height": 200
        },
        {
          "layerIndex": 1,
          "layerId": "6O0xCHrwpAI",
          "objectId": "6n4v1TVPYkj",
          "assetId": 165,
          "url": "story_content/6cVvYbugY8D_P_246_0_1299_405.png",
          "altText": "salah starla.png",
          "width": 1299,
          "height": 405
        },
        {
          "layerIndex": 1,
          "layerId": "6O0xCHrwpAI",
          "objectId": "6iBj0j4Wyvj",
          "assetId": 166,
          "url": "story_content/5xIHoMB2ZC7.gif",
          "altText": "AS0005343_05.gif",
          "width": 254,
          "height": 300
        },
        {
          "layerIndex": 1,
          "layerId": "6O0xCHrwpAI",
          "objectId": "67BmTMfY8zv",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 1,
          "layerId": "6O0xCHrwpAI",
          "objectId": "6fhJiPyrXY2",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6ULkx4Aw2EM",
          "objectId": "5mLhj75cZ4L",
          "assetId": 172,
          "url": "story_content/6F5Z4MpnsdU.gif",
          "altText": "1645317_d9287.gif",
          "width": 500,
          "height": 500
        },
        {
          "layerIndex": 2,
          "layerId": "6ULkx4Aw2EM",
          "objectId": "5cdGs3Yklaw",
          "assetId": 173,
          "url": "story_content/5gkgaNEdBEt.png",
          "altText": "benar.png",
          "width": 1141,
          "height": 388
        },
        {
          "layerIndex": 2,
          "layerId": "6ULkx4Aw2EM",
          "objectId": "6ExPND8186F",
          "assetId": 174,
          "url": "story_content/5yMgs76yF4Y.gif",
          "altText": "AS0005343_04.gif",
          "width": 292,
          "height": 300
        },
        {
          "layerIndex": 2,
          "layerId": "6ULkx4Aw2EM",
          "objectId": "6UTaTWhJ8Dx",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        },
        {
          "layerIndex": 2,
          "layerId": "6ULkx4Aw2EM",
          "objectId": "6aGToyuTSVc",
          "assetId": 167,
          "url": "story_content/6QxLg3NYlpt.png",
          "altText": "lanjut starla.png",
          "width": 504,
          "height": 160
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "5a8YIrSITc8",
        "slideNumber": 34,
        "interactionId": "67tUff8DXh7",
        "type": "multiplechoice",
        "questionText": "Zaura pandai memainkan beberapa alat musik tradisional. Zaura paling suka bermain angklung. Ibu Guru sering meminta Zaura untuk menampilkan permainannya dalam acara sekolah. Tindakan yang sebaiknya dilakukan Zaura dengan kemampuan yang dimilikinya adalah",
        "questionCommandSetId": "commandset-284",
        "maxPoints": 10,
        "choices": [
          {
            "id": "choice_6SjkddRAYtG",
            "objectId": "6SjkddRAYtG",
            "commandSetId": "commandset-278",
            "text": "mencela teman menggunakan alat musik tradisional",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_6CNI9CtAg4I",
            "objectId": "6CNI9CtAg4I",
            "commandSetId": "commandset-281",
            "text": "terus belajar memainkan alat musik tradisional dan mengajari teman",
            "isCorrect": true,
            "points": 10
          },
          {
            "id": "choice_5l3UHJPpE8D",
            "objectId": "5l3UHJPpE8D",
            "commandSetId": "commandset-273",
            "text": "lebih memilih mempelajari alat musik yang berasal dari daerahnya saja",
            "isCorrect": false,
            "points": 0
          },
          {
            "id": "choice_62eUyuMcCAJ",
            "objectId": "62eUyuMcCAJ",
            "commandSetId": "commandset-272",
            "text": "memilih untuk belajar alat musik modern agar tidak ketinggalan zaman",
            "isCorrect": false,
            "points": 0
          }
        ],
        "correctChoiceId": "choice_6CNI9CtAg4I",
        "correctAnswerText": "terus belajar memainkan alat musik tradisional dan mengajari teman",
        "feedbackLayers": {
          "correctLayerId": "6ULkx4Aw2EM",
          "incorrectLayerId": "6O0xCHrwpAI"
        }
      }
    },
    "6ddgVMlBGEg": {
      "id": "6ddgVMlBGEg",
      "slideNumber": 35,
      "title": "Results Slide",
      "lmsId": "Slide35",
      "jsPath": "html5/data/js/6ddgVMlBGEg.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "%_player.6pq3GkKswiA.$Score%",
        "%_player.TextEntry4%",
        "%_player.TextEntry5%"
      ],
      "texts": [
        {
          "objectId": "6dWHacgdO9N",
          "uniqueId": "",
          "linkId": "txt__default_6dWHacgdO9N",
          "commandSetId": null,
          "altText": "%_player.6pq3GkKswiA.$Score%",
          "lines": [
            "%_player.6pq3GkKswiA.$Score%"
          ]
        },
        {
          "objectId": "60uUNnfsekF",
          "uniqueId": "",
          "linkId": "txt__default_60uUNnfsekF",
          "commandSetId": null,
          "altText": "%_player.TextEntry4% ",
          "lines": [
            "%_player.TextEntry4%"
          ]
        },
        {
          "objectId": "5dDUvDKxJKq",
          "uniqueId": "",
          "linkId": "txt__default_5dDUvDKxJKq",
          "commandSetId": null,
          "altText": "%_player.TextEntry5% ",
          "lines": [
            "%_player.TextEntry5%"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5lqA1M1jZi4",
          "assetId": 270,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5ZPpYHkCV5N",
          "assetId": 271,
          "url": "story_content/6j9IobXfevk_44100_56_0.mp3",
          "durationMs": 63111
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5ur8WwDQJer",
          "assetId": 8,
          "url": "story_content/6I2HdKkSgG6.png",
          "altText": "7409593x.png",
          "width": 180,
          "height": 137
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6eHtnAfM3bY": {
      "id": "6eHtnAfM3bY",
      "slideNumber": 36,
      "title": "Untitled Slide",
      "lmsId": "Slide36",
      "jsPath": "html5/data/js/6eHtnAfM3bY.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [],
      "texts": [],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5sTbnQAyRbL",
          "assetId": 276,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6SxI2jV8rM8",
          "assetId": 277,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6oMSI7MCCiF",
          "assetId": 278,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "67FYsXPC4S9",
          "assetId": 279,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6c6VXhYavVX",
          "assetId": 280,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "67CIlml6Iwt",
          "assetId": 281,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6mwqdLqrm4W",
          "assetId": 282,
          "url": "story_content/6qRbYJOwFU4_44100_56_0.mp3",
          "durationMs": 63431
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6XQWThMbV3U",
          "assetId": 283,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 1,
          "layerId": "6BlP2sHtehl",
          "audioId": "6L4mlc5lUHM",
          "assetId": 284,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "6BlP2sHtehl",
          "audioId": "6CRYCT4zkAF",
          "assetId": 285,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        },
        {
          "layerIndex": 2,
          "layerId": "5x8UD5vB9qb",
          "audioId": "6pJwxxY5O5w",
          "assetId": 287,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "5x8UD5vB9qb",
          "audioId": "6p11NaVGzZ1",
          "assetId": 288,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5thp2ZP0d52",
          "assetId": 2,
          "url": "story_content/6Q69tvGOis4.gif",
          "altText": "ezgif-22f102a5fd7e3796.gif",
          "width": 570,
          "height": 318
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5VY7baERHMi",
          "assetId": 7,
          "url": "story_content/6KFvI2w3gL9.png",
          "altText": "740959a.png",
          "width": 198,
          "height": 142
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5kREu1RQMZp",
          "assetId": 8,
          "url": "story_content/6I2HdKkSgG6.png",
          "altText": "7409593x.png",
          "width": 180,
          "height": 137
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6UhHiuuKuan",
          "assetId": 272,
          "url": "story_content/5wHjJTgBBpW.png",
          "altText": "Desain tanpa judul (32).png",
          "width": 488,
          "height": 152
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "60Y2D5T2PBN",
          "assetId": 273,
          "url": "story_content/5s6NWFwiK9z.png",
          "altText": "Desain tanpa judul (33).png",
          "width": 941,
          "height": 260
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5xuxdAf2iyO",
          "assetId": 274,
          "url": "story_content/5hwJucP8a1A.png",
          "altText": "Desain tanpa judul (35).png",
          "width": 958,
          "height": 672
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5hjfDHsqC4N",
          "assetId": 275,
          "url": "story_content/6Z7ek63QC1F.png",
          "altText": "Desain tanpa judul (34).png",
          "width": 941,
          "height": 249
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6gZ3i9V6xyz",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5ikAyrCHttT",
          "assetId": 9,
          "url": "story_content/6fBYfnad2Zd.png",
          "altText": "7409593c.png",
          "width": 200,
          "height": 153
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5ikAyrCHttT",
          "assetId": 10,
          "url": "story_content/5rXZGGJH9iG.png",
          "altText": "Desain tanpa judul (72).png",
          "width": 160,
          "height": 135
        },
        {
          "layerIndex": 1,
          "layerId": "6BlP2sHtehl",
          "objectId": "5cI1L3YzZim",
          "assetId": 25,
          "url": "story_content/6qmYZKenWib.png",
          "altText": "info.png",
          "width": 1539,
          "height": 882
        },
        {
          "layerIndex": 1,
          "layerId": "6BlP2sHtehl",
          "objectId": "5Z3CAwZT8J0",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        },
        {
          "layerIndex": 2,
          "layerId": "5x8UD5vB9qb",
          "objectId": "6q4ZApIYDaj",
          "assetId": 21,
          "url": "story_content/6EfvCxuLoY5.png",
          "altText": "Desain tanpa judul (67).png",
          "width": 1208,
          "height": 647
        },
        {
          "layerIndex": 2,
          "layerId": "5x8UD5vB9qb",
          "objectId": "60OqR1FSbfo",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "604TQFYNuzG": {
      "id": "604TQFYNuzG",
      "slideNumber": 37,
      "title": "Untitled Slide",
      "lmsId": "Slide37",
      "jsPath": "html5/data/js/604TQFYNuzG.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "Pilih dan tekan satu garuda yang menunjukkan perasaan kamu belajar budaya"
      ],
      "texts": [
        {
          "objectId": "5sRKlbgItqO",
          "uniqueId": "5sRKlbgItqO_1328656255",
          "linkId": "txt__default_5sRKlbgItqO",
          "commandSetId": "commandset-316",
          "altText": "Pilih dan tekan satu garuda yang menunjukkan perasaan kamu belajar budaya",
          "lines": [
            "Pilih dan tekan satu garuda yang menunjukkan perasaan kamu belajar budaya"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5k8zkmGhzT4",
          "assetId": 296,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6ay7d2iv4Dr",
          "assetId": 297,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6mV6ztzrgao",
          "assetId": 298,
          "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
          "durationMs": 861
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6i5LU25eLB6",
          "assetId": 299,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6DhQaoPLJnb",
          "assetId": 300,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "68oCX5kN586",
          "assetId": 301,
          "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
          "durationMs": 861
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6Yf6a7gxn5m",
          "assetId": 302,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5muGqEvJwR7",
          "assetId": 303,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6TeYGgyfFEL",
          "assetId": 304,
          "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
          "durationMs": 861
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5qaSXMOIbeK",
          "assetId": 305,
          "url": "story_content/6SsAariyI62_44100_56_0.mp3",
          "durationMs": 59722
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6qAwG9xOHLN",
          "assetId": 290,
          "url": "story_content/6USmgcHO6qe.png",
          "altText": "Desain tanpa judul (42).png",
          "width": 250,
          "height": 416
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5sdWrihytYh",
          "assetId": 291,
          "url": "story_content/63q9ywMxP2X.png",
          "altText": "Desain tanpa judul (45).png",
          "width": 270,
          "height": 242
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6ohRzl28MkY",
          "assetId": 292,
          "url": "story_content/5mooWrkgV9C.png",
          "altText": "Desain tanpa judul (41).png",
          "width": 190,
          "height": 397
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5ZpiuaPKDwl",
          "assetId": 293,
          "url": "story_content/6LOjHAsXoJZ.png",
          "altText": "Desain tanpa judul (44).png",
          "width": 273,
          "height": 272
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "66egpEZTpSp",
          "assetId": 294,
          "url": "story_content/6iRLqPu2poe.png",
          "altText": "Desain tanpa judul (40).png",
          "width": 241,
          "height": 416
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "67WiegX629m",
          "assetId": 295,
          "url": "story_content/5ftaDySNgbZ.png",
          "altText": "Desain tanpa judul (43).png",
          "width": 272,
          "height": 250
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6EA329REfHb": {
      "id": "6EA329REfHb",
      "slideNumber": 38,
      "title": "Untitled Slide",
      "lmsId": "Slide38",
      "jsPath": "html5/data/js/6EA329REfHb.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [],
      "texts": [],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6SKdUoVWvyp",
          "assetId": 308,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6fG8pG5KqDj",
          "assetId": 309,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6EyWjoXCfln",
          "assetId": 310,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6no62WeTHZA",
          "assetId": 311,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "62LdB7UDWmE",
          "assetId": 312,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5wNJHMLKrro",
          "assetId": 313,
          "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
          "durationMs": 861
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5mqCguYLZFr",
          "assetId": 314,
          "url": "story_content/6j9IobXfevk_44100_56_0.mp3",
          "durationMs": 63111
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "61ftL8w7nKg",
          "assetId": 307,
          "url": "story_content/5fD3uOAkxBz.png",
          "altText": "selesai.png",
          "width": 442,
          "height": 128
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6FkRXfgJQkY": {
      "id": "6FkRXfgJQkY",
      "slideNumber": 39,
      "title": "Untitled Slide",
      "lmsId": "Slide39",
      "jsPath": "html5/data/js/6FkRXfgJQkY.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Keragaman Bahasa Daerah Bahasa daerah adalah bahasa yang digunakan oleh suatu  suku bangsa. Bahasa daerah digunakan sebagai alat  komunikasi atau bahasa percakapan sehari-hari  masyarakat. Indonesia memiliki ratusan jenis bahasa daerah  loh. Setiap bahasa daerah memiliki dialek masing- masing. Agar  setiap orang dari berbagai daerah tetap dapat  berkomunikasi dengan baik, bangsa Indonesia memiliki  bahasa yang dapat dimengerti oleh semua orang. Bahasa itu  disebut sebagai bahasa persatuan, yaitu bahasa Indonesia."
      ],
      "texts": [
        {
          "objectId": "60MfrArJ9kV",
          "uniqueId": "60MfrArJ9kV_994279673",
          "linkId": "txt__default_60MfrArJ9kV",
          "commandSetId": "commandset-331",
          "altText": "Keragaman Bahasa Daerah\n\nBahasa daerah adalah bahasa yang digunakan oleh suatu suku bangsa. Bahasa daerah digunakan sebagai alat komunikasi atau bahasa percakapan sehari-hari masyarakat. Indonesia memiliki ratusan jenis bahasa daerah loh.\n\nSetiap bahasa daerah memiliki dialek masing- masing. Agar setiap orang dari berbagai daerah tetap dapat berkomunikasi dengan baik, bangsa Indonesia memiliki bahasa yang dapat dimengerti oleh semua orang. Bahasa itu disebut sebagai bahasa persatuan, yaitu bahasa Indonesia.",
          "lines": [
            "Keragaman Bahasa Daerah",
            "Bahasa daerah adalah bahasa yang digunakan oleh suatu ",
            "suku bangsa. Bahasa daerah digunakan sebagai alat ",
            "komunikasi atau bahasa percakapan sehari-hari ",
            "masyarakat. Indonesia memiliki ratusan jenis bahasa daerah ",
            "loh.",
            "Setiap bahasa daerah memiliki dialek masing- masing. Agar ",
            "setiap orang dari berbagai daerah tetap dapat ",
            "berkomunikasi dengan baik, bangsa Indonesia memiliki ",
            "bahasa yang dapat dimengerti oleh semua orang. Bahasa itu ",
            "disebut sebagai bahasa persatuan, yaitu bahasa Indonesia."
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5vNWSCmPFqZ",
          "assetId": 315,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6RNxXgXtHLs",
          "assetId": 316,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5UuTRlWqnCI",
          "assetId": 317,
          "url": "story_content/6VrGVxitHVs_44100_56_0.mp3",
          "durationMs": 28131
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6aqvIWht29U",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5sDJsjhQazH",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5vDDmQhJCOo",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6G1VrKuOhCw": {
      "id": "6G1VrKuOhCw",
      "slideNumber": 40,
      "title": "Drag and Drop",
      "lmsId": "Slide40",
      "jsPath": "html5/data/js/6G1VrKuOhCw.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "%_player.poin%",
        "Nilai",
        "Budaya yang Benar",
        "Budaya yang Salah",
        "saya harus menghargai  ketika orang lain berbicara  bahasa daerahnya",
        "tidak suka alat musik  gamelan karena berisik  di telinga saya",
        "menjaga pakaian adat  yang kita miliki",
        "Bangga terhadap  keberagaman yang ada  di Indonesia",
        "tidak mau tau senjata  tradisional daerah lain",
        "keragaman budaya dapat  memecah belah persatuan  Indonesia",
        "tidak suka mendengar  musik dari daerah lain",
        "keragaman budaya  menjadi daya tarik wisata  Indonesia",
        "mau belajar tarian  daerah lain",
        "rumah adat saya lebih  bagus daripada rumah  adat daerah lain"
      ],
      "texts": [
        {
          "objectId": "6f8xGdqBHkx",
          "uniqueId": "",
          "linkId": "txt__default_6f8xGdqBHkx",
          "commandSetId": null,
          "altText": "%_player.poin%",
          "lines": [
            "%_player.poin%"
          ]
        },
        {
          "objectId": "5Ur9Ty2CRVt",
          "uniqueId": "5Ur9Ty2CRVt_1675094275",
          "linkId": "txt__default_5Ur9Ty2CRVt",
          "commandSetId": "commandset-336",
          "altText": "Nilai",
          "lines": [
            "Nilai"
          ]
        },
        {
          "objectId": "5ZEfZx7fDRf",
          "uniqueId": "5ZEfZx7fDRf_1729589767",
          "linkId": "txt__default_5ZEfZx7fDRf",
          "commandSetId": "commandset-341",
          "altText": "Budaya yang Benar",
          "lines": [
            "Budaya yang Benar"
          ]
        },
        {
          "objectId": "647QoskpLq4",
          "uniqueId": "647QoskpLq4_898440799",
          "linkId": "txt__default_647QoskpLq4",
          "commandSetId": "commandset-345",
          "altText": "Budaya yang Salah",
          "lines": [
            "Budaya yang Salah"
          ]
        },
        {
          "objectId": "6PmmLlA3BUm",
          "uniqueId": "6PmmLlA3BUm_-1077557028",
          "linkId": "txt__default_6PmmLlA3BUm",
          "commandSetId": "commandset-349",
          "altText": "saya harus menghargai ketika orang lain berbicara bahasa daerahnya",
          "lines": [
            "saya harus menghargai ",
            "ketika orang lain berbicara ",
            "bahasa daerahnya"
          ]
        },
        {
          "objectId": "5h0p9KUFVsV",
          "uniqueId": "5h0p9KUFVsV_1747076320",
          "linkId": "txt__default_5h0p9KUFVsV",
          "commandSetId": "commandset-353",
          "altText": "tidak suka alat musik gamelan karena berisik di telinga saya",
          "lines": [
            "tidak suka alat musik ",
            "gamelan karena berisik ",
            "di telinga saya"
          ]
        },
        {
          "objectId": "5fdyc47zgAM",
          "uniqueId": "5fdyc47zgAM_1298489609",
          "linkId": "txt__default_5fdyc47zgAM",
          "commandSetId": "commandset-356",
          "altText": "menjaga pakaian adat yang kita miliki",
          "lines": [
            "menjaga pakaian adat ",
            "yang kita miliki"
          ]
        },
        {
          "objectId": "6nUqJmLjuQl",
          "uniqueId": "6nUqJmLjuQl_1731687778",
          "linkId": "txt__default_6nUqJmLjuQl",
          "commandSetId": "commandset-359",
          "altText": "Bangga terhadap keberagaman yang ada di Indonesia",
          "lines": [
            "Bangga terhadap ",
            "keberagaman yang ada ",
            "di Indonesia"
          ]
        },
        {
          "objectId": "6U30Zh8t5Tk",
          "uniqueId": "6U30Zh8t5Tk_-899811778",
          "linkId": "txt__default_6U30Zh8t5Tk",
          "commandSetId": "commandset-361",
          "altText": "tidak mau tau senjata tradisional daerah lain",
          "lines": [
            "tidak mau tau senjata ",
            "tradisional daerah lain"
          ]
        },
        {
          "objectId": "6oPQdY3JV4d",
          "uniqueId": "6oPQdY3JV4d_829931307",
          "linkId": "txt__default_6oPQdY3JV4d",
          "commandSetId": "commandset-363",
          "altText": "keragaman budaya dapat memecah belah persatuan Indonesia",
          "lines": [
            "keragaman budaya dapat ",
            "memecah belah persatuan ",
            "Indonesia"
          ]
        },
        {
          "objectId": "5ZZO56PNDaL",
          "uniqueId": "5ZZO56PNDaL_-1872408600",
          "linkId": "txt__default_5ZZO56PNDaL",
          "commandSetId": "commandset-364",
          "altText": "tidak suka mendengar musik dari daerah lain",
          "lines": [
            "tidak suka mendengar ",
            "musik dari daerah lain"
          ]
        },
        {
          "objectId": "6l3BVdcEP3S",
          "uniqueId": "6l3BVdcEP3S_708852005",
          "linkId": "txt__default_6l3BVdcEP3S",
          "commandSetId": "commandset-367",
          "altText": "keragaman budaya menjadi daya tarik wisata Indonesia",
          "lines": [
            "keragaman budaya ",
            "menjadi daya tarik wisata ",
            "Indonesia"
          ]
        },
        {
          "objectId": "6qAvA99AbtK",
          "uniqueId": "6qAvA99AbtK_-1421158870",
          "linkId": "txt__default_6qAvA99AbtK",
          "commandSetId": "commandset-369",
          "altText": "mau belajar tarian daerah lain",
          "lines": [
            "mau belajar tarian ",
            "daerah lain"
          ]
        },
        {
          "objectId": "5smqyHWpI8t",
          "uniqueId": "5smqyHWpI8t_465065658",
          "linkId": "txt__default_5smqyHWpI8t",
          "commandSetId": "commandset-370",
          "altText": "rumah adat saya lebih bagus daripada rumah adat daerah lain",
          "lines": [
            "rumah adat saya lebih ",
            "bagus daripada rumah ",
            "adat daerah lain"
          ]
        },
        {
          "objectId": "6mxkFyRe2qp_CorrectReview",
          "uniqueId": "6mxkFyRe2qp_CorrectReview",
          "linkId": "6mxkFyRe2qp_CorrectReview",
          "commandSetId": "commandset-145",
          "altText": "Benar",
          "lines": [
            "Benar"
          ]
        },
        {
          "objectId": "6mxkFyRe2qp_IncorrectReview",
          "uniqueId": "6mxkFyRe2qp_IncorrectReview",
          "linkId": "6mxkFyRe2qp_IncorrectReview",
          "commandSetId": "commandset-147",
          "altText": "Salah",
          "lines": [
            "Salah"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5uB7jPS8yCc",
          "assetId": 337,
          "url": "story_content/6ozfyPr3FNr_44100_56_0.mp3",
          "durationMs": 1802
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6025IJIAZ7L",
          "assetId": 338,
          "url": "story_content/6ozfyPr3FNr_44100_56_0.mp3",
          "durationMs": 1802
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5zbnEZ1kVSz",
          "assetId": 339,
          "url": "story_content/5jxbm5Im7Vd_44100_56_0.mp3",
          "durationMs": 972
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6XO4n6wMLEZ",
          "assetId": 340,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5u1wgGzTd1s",
          "assetId": 341,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5eGwB2WIish",
          "assetId": 342,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6kf5lETjcuM",
          "assetId": 343,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5z6z8p62DnS",
          "assetId": 344,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6FOzzwY7uns",
          "assetId": 345,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6JOCvR6WoHj",
          "assetId": 346,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5XhwPCjzKVW",
          "assetId": 347,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "69F9BzV5Hzw",
          "assetId": 348,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5xCcLYyGxr6",
          "assetId": 349,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "63CQ4nkOrIe",
          "assetId": 350,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6Gl8wW5SClz",
          "assetId": 351,
          "url": "story_content/5vvn7Snmnr4_44100_56_0.mp3",
          "durationMs": 66611
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5dofARx4ZOm",
          "assetId": 352,
          "url": "story_content/5cCQsSaYl6g_44100_56_0.mp3",
          "durationMs": 7472
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5egaW53LzwY",
          "assetId": 353,
          "url": "story_content/6OCl0RMljnW_44100_56_0.mp3",
          "durationMs": 11991
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "647GXvbCxZp",
          "assetId": 318,
          "url": "story_content/6PFU9CSOUPJ.gif",
          "altText": "ezgif-5bd04bf095bc95f4.gif",
          "width": 660,
          "height": 371
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "61zEAUw7Yj0",
          "assetId": 319,
          "url": "story_content/6f5CYdEJRLG.gif",
          "altText": "3a82e9187592869ee4a9658e1046c4b4.gif",
          "width": 350,
          "height": 350
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5Uu6byOFyRq",
          "assetId": 320,
          "url": "story_content/6oOnHqMcEc4_P_0_585_800_124.png",
          "altText": "Desain tanpa judul (12).png",
          "width": 800,
          "height": 124
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6YRB5UIjNas",
          "assetId": 321,
          "url": "story_content/6Hxt2bPxv63.png",
          "altText": "Desain tanpa judul (38).png",
          "width": 562,
          "height": 378
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5uLET0cr0nZ",
          "assetId": 322,
          "url": "story_content/5lksIr96jvp.png",
          "altText": "Desain tanpa judul (39).png",
          "width": 552,
          "height": 366
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6PGiQBN0VYp",
          "assetId": 307,
          "url": "story_content/5fD3uOAkxBz.png",
          "altText": "selesai.png",
          "width": 442,
          "height": 128
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6XfIWrI4Giy",
          "assetId": 323,
          "url": "story_content/5ikz4u4OaSa_X_P_32_17_203_262.gif",
          "altText": "burung starla.gif",
          "width": 204,
          "height": 263
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6WPERKBcqaY",
          "assetId": 325,
          "url": "story_content/6hdYjh8cDDa_XY_P_0_0_600_532.png",
          "altText": "Desain tanpa judul (13).png",
          "width": 600,
          "height": 532
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6JvyeweLFyt",
          "assetId": 326,
          "url": "story_content/5ikz4u4OaSa_P_32_17_203_262.gif",
          "altText": "burung starla.gif",
          "width": 204,
          "height": 263
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5VfbiaZbuBu",
          "assetId": 328,
          "url": "story_content/6hdYjh8cDDa_Y_P_0_0_600_532.png",
          "altText": "Desain tanpa judul (13).png",
          "width": 600,
          "height": 532
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6limMUc3hxJ",
          "assetId": 323,
          "url": "story_content/5ikz4u4OaSa_X_P_32_17_203_262.gif",
          "altText": "burung starla.gif",
          "width": 204,
          "height": 263
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5wRLwiyB4UA",
          "assetId": 325,
          "url": "story_content/6hdYjh8cDDa_XY_P_0_0_600_532.png",
          "altText": "Desain tanpa judul (13).png",
          "width": 600,
          "height": 532
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6jWyZbf56OG",
          "assetId": 326,
          "url": "story_content/5ikz4u4OaSa_P_32_17_203_262.gif",
          "altText": "burung starla.gif",
          "width": 204,
          "height": 263
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6V9QH7pdxyE",
          "assetId": 328,
          "url": "story_content/6hdYjh8cDDa_Y_P_0_0_600_532.png",
          "altText": "Desain tanpa judul (13).png",
          "width": 600,
          "height": 532
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "667DkO0X4Ap",
          "assetId": 323,
          "url": "story_content/5ikz4u4OaSa_X_P_32_17_203_262.gif",
          "altText": "burung starla.gif",
          "width": 204,
          "height": 263
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5oSlQnV8Y5u",
          "assetId": 325,
          "url": "story_content/6hdYjh8cDDa_XY_P_0_0_600_532.png",
          "altText": "Desain tanpa judul (13).png",
          "width": 600,
          "height": 532
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5jJyJQ5Uht8",
          "assetId": 326,
          "url": "story_content/5ikz4u4OaSa_P_32_17_203_262.gif",
          "altText": "burung starla.gif",
          "width": 204,
          "height": 263
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5uGJeOlrS5g",
          "assetId": 328,
          "url": "story_content/6hdYjh8cDDa_Y_P_0_0_600_532.png",
          "altText": "Desain tanpa judul (13).png",
          "width": 600,
          "height": 532
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6P6IRWjp98P",
          "assetId": 323,
          "url": "story_content/5ikz4u4OaSa_X_P_32_17_203_262.gif",
          "altText": "burung starla.gif",
          "width": 204,
          "height": 263
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6e2Kr2QZ2Vs",
          "assetId": 325,
          "url": "story_content/6hdYjh8cDDa_XY_P_0_0_600_532.png",
          "altText": "Desain tanpa judul (13).png",
          "width": 600,
          "height": 532
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5prOTedzzbR",
          "assetId": 323,
          "url": "story_content/5ikz4u4OaSa_X_P_32_17_203_262.gif",
          "altText": "burung starla.gif",
          "width": 204,
          "height": 263
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6gxFAT7tJMe",
          "assetId": 325,
          "url": "story_content/6hdYjh8cDDa_XY_P_0_0_600_532.png",
          "altText": "Desain tanpa judul (13).png",
          "width": 600,
          "height": 532
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6Tz1C4dfw77",
          "assetId": 326,
          "url": "story_content/5ikz4u4OaSa_P_32_17_203_262.gif",
          "altText": "burung starla.gif",
          "width": 204,
          "height": 263
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5o88GqmLCCj",
          "assetId": 328,
          "url": "story_content/6hdYjh8cDDa_Y_P_0_0_600_532.png",
          "altText": "Desain tanpa judul (13).png",
          "width": 600,
          "height": 532
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "69rLgopor0f",
          "assetId": 326,
          "url": "story_content/5ikz4u4OaSa_P_32_17_203_262.gif",
          "altText": "burung starla.gif",
          "width": 204,
          "height": 263
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6JpALWh5xMl",
          "assetId": 328,
          "url": "story_content/6hdYjh8cDDa_Y_P_0_0_600_532.png",
          "altText": "Desain tanpa judul (13).png",
          "width": 600,
          "height": 532
        }
      ],
      "videos": [],
      "quizQuestion": {
        "slideId": "6G1VrKuOhCw",
        "slideNumber": 40,
        "interactionId": "5wg4ZXz4XnZ",
        "type": "matching",
        "questionText": "Drag and Drop",
        "questionCommandSetId": null,
        "maxPoints": 20,
        "choices": [
          {
            "id": "choice_6JvyeweLFyt",
            "objectId": "6JvyeweLFyt",
            "commandSetId": null,
            "text": "Picture 44 - burung starla.gif",
            "isCorrect": false,
            "points": 0
          }
        ],
        "correctChoiceId": null,
        "correctAnswerText": null,
        "feedbackLayers": {
          "correctLayerId": null,
          "incorrectLayerId": null
        }
      }
    },
    "6WIqLhHr1Cm": {
      "id": "6WIqLhHr1Cm",
      "slideNumber": 41,
      "title": "Results Slide",
      "lmsId": "Slide41",
      "jsPath": "html5/data/js/6WIqLhHr1Cm.js",
      "width": 1280,
      "height": 720,
      "resume": true,
      "backgroundUrl": null,
      "instructions": [
        "%_player.TextEntry4%",
        "%_player.TextEntry5%",
        "%_player.poin%"
      ],
      "texts": [
        {
          "objectId": "6QHDbEqxXxx",
          "uniqueId": "",
          "linkId": "txt__default_6QHDbEqxXxx",
          "commandSetId": null,
          "altText": "%_player.TextEntry4% ",
          "lines": [
            "%_player.TextEntry4%"
          ]
        },
        {
          "objectId": "68ZDusYxNWj",
          "uniqueId": "",
          "linkId": "txt__default_68ZDusYxNWj",
          "commandSetId": null,
          "altText": "%_player.TextEntry5% ",
          "lines": [
            "%_player.TextEntry5%"
          ]
        },
        {
          "objectId": "5apz529Umi7",
          "uniqueId": "",
          "linkId": "txt__default_5apz529Umi7",
          "commandSetId": null,
          "altText": "%_player.poin%",
          "lines": [
            "%_player.poin%"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6WZfejLqlcS",
          "assetId": 355,
          "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
          "durationMs": 861
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5zRKSaYtcdW",
          "assetId": 356,
          "url": "story_content/5WPKUcAEWAA_44100_56_0.mp3",
          "durationMs": 62152
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6I5zcba4vsd",
          "assetId": 357,
          "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
          "durationMs": 4052
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6Dx3stLukJn",
          "assetId": 8,
          "url": "story_content/6I2HdKkSgG6.png",
          "altText": "7409593x.png",
          "width": 180,
          "height": 137
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "6OrD7bra4Ko": {
      "id": "6OrD7bra4Ko",
      "slideNumber": 42,
      "title": "Untitled Slide",
      "lmsId": "Slide42",
      "jsPath": "html5/data/js/6OrD7bra4Ko.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [
        "Apa itu Budaya? Budaya adalah adat istiadat  yang dimiliki suatu suku  bangsa. Budaya diwariskan  secara turun temurun dari  zaman nenek moyang hingga  sampai generasi saat ini loh…"
      ],
      "texts": [
        {
          "objectId": "5WcyakaeLrY",
          "uniqueId": "5WcyakaeLrY_-566771505",
          "linkId": "txt__default_5WcyakaeLrY",
          "commandSetId": "commandset-375",
          "altText": "Apa itu Budaya?\n\n\nBudaya adalah adat istiadat yang dimiliki suatu suku bangsa. Budaya diwariskan secara turun temurun dari zaman nenek moyang hingga sampai generasi saat ini loh…\n\n\n",
          "lines": [
            "Apa itu Budaya?",
            "Budaya adalah adat istiadat ",
            "yang dimiliki suatu suku ",
            "bangsa. Budaya diwariskan ",
            "secara turun temurun dari ",
            "zaman nenek moyang hingga ",
            "sampai generasi saat ini loh…"
          ]
        }
      ],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6H6palo6Aro",
          "assetId": 358,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6iUPNeVhR86",
          "assetId": 359,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6FafV1Sc1e5",
          "assetId": 360,
          "url": "story_content/5wfUoLg3RiL_44100_56_0.mp3",
          "durationMs": 11571
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6rWLw0d4YzH",
          "assetId": 104,
          "url": "story_content/6pYfGRfCfkW_B-10_R9BF2FF.png",
          "altText": "BORDER STARLA.png",
          "width": 989,
          "height": 645
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5pTCbGk0cRJ",
          "assetId": 35,
          "url": "story_content/5hv8C0oRfrb.png",
          "altText": "Desain tanpa judul (52).png",
          "width": 282,
          "height": 506
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5gibM8Ukd4d",
          "assetId": 87,
          "url": "story_content/6UTk9YJ1Rv7.png",
          "altText": "7409593.png",
          "width": 200,
          "height": 143
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5fBZYY4lL9N",
          "assetId": 34,
          "url": "story_content/5cdUoSSngTY.png",
          "altText": "740959b.png",
          "width": 221,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    },
    "5iew2M44w24": {
      "id": "5iew2M44w24",
      "slideNumber": 43,
      "title": "Untitled Slide",
      "lmsId": "Slide43",
      "jsPath": "html5/data/js/5iew2M44w24.js",
      "width": 1280,
      "height": 720,
      "resume": false,
      "backgroundUrl": null,
      "instructions": [],
      "texts": [],
      "audios": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "69JgmT2rmXE",
          "assetId": 366,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6XVtmcwH1Qi",
          "assetId": 367,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5fZRlcLrkKi",
          "assetId": 368,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6hzbZrpmG5R",
          "assetId": 369,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6cOC25tlntL",
          "assetId": 370,
          "url": "story_content/679pv2NykUw_44100_56_0.mp3",
          "durationMs": 1442
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "5sEhzlYlSpI",
          "assetId": 371,
          "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
          "durationMs": 941
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "6bV4nWO30CZ",
          "assetId": 372,
          "url": "story_content/6fP6CzyqyMk_44100_56_0.mp3",
          "durationMs": 133511
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "audioId": "63TwMQdlWkR",
          "assetId": 373,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "5tBpZGAZRvZ",
          "audioId": "6ipuUZUg0Yq",
          "assetId": 374,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 1,
          "layerId": "5tBpZGAZRvZ",
          "audioId": "6idcfYD3twQ",
          "assetId": 375,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        },
        {
          "layerIndex": 2,
          "layerId": "6p9pX73nL3K",
          "audioId": "6VfUe9PvbLO",
          "assetId": 377,
          "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
          "durationMs": 5151
        },
        {
          "layerIndex": 2,
          "layerId": "6p9pX73nL3K",
          "audioId": "5iz91SbF4tZ",
          "assetId": 378,
          "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
          "durationMs": 472
        }
      ],
      "images": [
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "68Xszod2oOA",
          "assetId": 2,
          "url": "story_content/6Q69tvGOis4.gif",
          "altText": "ezgif-22f102a5fd7e3796.gif",
          "width": 570,
          "height": 318
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "64z7j6Gs8hE",
          "assetId": 5,
          "url": "story_content/65Vuggwqrb8_RG_P_436_0_231_164.gif",
          "altText": "download (3).gif",
          "width": 232,
          "height": 165
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5ZPukeMFffY",
          "assetId": 361,
          "url": "story_content/6VpxF5tzDfS.png",
          "altText": "Desain tanpa judul (53).png",
          "width": 612,
          "height": 205
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5Vj2vgTep1J",
          "assetId": 362,
          "url": "story_content/5b7bpGxEsZl.png",
          "altText": "Desain tanpa judul (25).png",
          "width": 714,
          "height": 304
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5cPSgbCeIlr",
          "assetId": 363,
          "url": "story_content/6EhjX1oYXWn.png",
          "altText": "Desain tanpa judul (26).png",
          "width": 616,
          "height": 243
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6nIRXylj5C3",
          "assetId": 7,
          "url": "story_content/6KFvI2w3gL9.png",
          "altText": "740959a.png",
          "width": 198,
          "height": 142
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "5yX8qGnZePl",
          "assetId": 364,
          "url": "story_content/6kd8fv3DWt3.png",
          "altText": "Desain tanpa judul (73).png",
          "width": 116,
          "height": 101
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6QViUrCbMSJ",
          "assetId": 8,
          "url": "story_content/6I2HdKkSgG6.png",
          "altText": "7409593x.png",
          "width": 180,
          "height": 137
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6afmjIda5Z2",
          "assetId": 365,
          "url": "story_content/5yFZRb2SQSU.png",
          "altText": "Desain tanpa judul (27).png",
          "width": 627,
          "height": 205
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6jNM42tJrR5",
          "assetId": 9,
          "url": "story_content/6fBYfnad2Zd.png",
          "altText": "7409593c.png",
          "width": 200,
          "height": 153
        },
        {
          "layerIndex": 0,
          "layerId": "base",
          "objectId": "6jNM42tJrR5",
          "assetId": 10,
          "url": "story_content/5rXZGGJH9iG.png",
          "altText": "Desain tanpa judul (72).png",
          "width": 160,
          "height": 135
        },
        {
          "layerIndex": 1,
          "layerId": "5tBpZGAZRvZ",
          "objectId": "6QlVJiPwrWl",
          "assetId": 25,
          "url": "story_content/6qmYZKenWib.png",
          "altText": "info.png",
          "width": 1539,
          "height": 882
        },
        {
          "layerIndex": 1,
          "layerId": "5tBpZGAZRvZ",
          "objectId": "6niCawvLG1a",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        },
        {
          "layerIndex": 2,
          "layerId": "6p9pX73nL3K",
          "objectId": "5vAd6TsQE7K",
          "assetId": 21,
          "url": "story_content/6EfvCxuLoY5.png",
          "altText": "Desain tanpa judul (67).png",
          "width": 1208,
          "height": 647
        },
        {
          "layerIndex": 2,
          "layerId": "6p9pX73nL3K",
          "objectId": "5dFWkaH35V0",
          "assetId": 22,
          "url": "story_content/6ljF2bhskoS.png",
          "altText": "7409592.png",
          "width": 229,
          "height": 158
        }
      ],
      "videos": [],
      "quizQuestion": null
    }
  },
  "quizzes": {
    "kuisBudaya": {
      "quizId": "6pq3GkKswiA",
      "title": "STARLA BUDAYA",
      "passPercent": 70,
      "resultsSlideId": "6ddgVMlBGEg",
      "questions": [
        {
          "slideId": "6oOWqUyP2WL",
          "slideNumber": 25,
          "interactionId": "5woba5hGYmO",
          "type": "multiplechoice",
          "questionText": "Misalkan kamu memiliki teman Udi berasal dari suku Sunda, Komang berasal dari suku Bali, dan kamu berasal dari suku Jawa. Mereka memakai baju adatnya. Sikapmu terhadap perbedaan baju ada tersebut adalah....",
          "questionCommandSetId": "commandset-143",
          "maxPoints": 10,
          "choices": [
            {
              "id": "choice_6eOu6G7RdHc",
              "objectId": "6eOu6G7RdHc",
              "commandSetId": "commandset-133",
              "text": "mengatakan bahwa baju adatmu lebih baik dibanding yang lain",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_6b0XbNaWdfs",
              "objectId": "6b0XbNaWdfs",
              "commandSetId": "commandset-128",
              "text": "mengejek baju adat lain karena merasa baju adatmu adalah yang terbaik",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_5jgHNtfhMbA",
              "objectId": "5jgHNtfhMbA",
              "commandSetId": "commandset-140",
              "text": "saling menghormati perbedaan baju adat",
              "isCorrect": true,
              "points": 10
            },
            {
              "id": "choice_6EVtXKpkpXd",
              "objectId": "6EVtXKpkpXd",
              "commandSetId": "commandset-123",
              "text": "hanya bermain dengan teman yang pakai\nbaju adat yang sama",
              "isCorrect": false,
              "points": 0
            }
          ],
          "correctChoiceId": "choice_5jgHNtfhMbA",
          "correctAnswerText": "saling menghormati perbedaan baju adat",
          "feedbackLayers": {
            "correctLayerId": "6BvBZyuy25S",
            "incorrectLayerId": "5wLllNjELzq"
          }
        },
        {
          "slideId": "6fJRLUtSDVL",
          "slideNumber": 26,
          "interactionId": "6IHKaPcNAs9",
          "type": "multiplechoice",
          "questionText": "Pak Dika meminta siswa menceritakan budaya daerahnya masing-masing. Oxel menceritakan keunikan budaya yang ada di daerahnya. Budaya dan daerah asal Oxel berbeda denganmu. Tindakanmu sebaiknya…",
          "questionCommandSetId": "commandset-174",
          "maxPoints": 10,
          "choices": [
            {
              "id": "choice_6f1PW4x37QC",
              "objectId": "6f1PW4x37QC",
              "commandSetId": "commandset-170",
              "text": "mendengarkan cerita Oxel dengan saksama",
              "isCorrect": true,
              "points": 10
            },
            {
              "id": "choice_5UmGXHzsBZ5",
              "objectId": "5UmGXHzsBZ5",
              "commandSetId": "commandset-171",
              "text": "menunjukkan bahwa kebudayaan daerahmu lebih baik",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_68TfPxuMC2x",
              "objectId": "68TfPxuMC2x",
              "commandSetId": "commandset-163",
              "text": "merendahkan kebudayaan yang ada di daerah Oxel ",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_6UqIjWay05w",
              "objectId": "6UqIjWay05w",
              "commandSetId": "commandset-162",
              "text": "memotong cerita yang disampaikan oleh Oxel",
              "isCorrect": false,
              "points": 0
            }
          ],
          "correctChoiceId": "choice_6f1PW4x37QC",
          "correctAnswerText": "mendengarkan cerita Oxel dengan saksama",
          "feedbackLayers": {
            "correctLayerId": "6YjsJKEnG88",
            "incorrectLayerId": "5dINY7oQloY"
          }
        },
        {
          "slideId": "6V8v7yM3VzE",
          "slideNumber": 27,
          "interactionId": "6fI1qRMq5kG",
          "type": "multiplechoice",
          "questionText": "Keluargamu sedang berlibur ke Papua. Di sana sedang diadakan upacara adat bakar batu. Kamu ingin ikut melihat upa cara adat tersebut. Sikapmu sebaiknya...",
          "questionCommandSetId": "commandset-191",
          "maxPoints": 10,
          "choices": [
            {
              "id": "choice_64pXzDFhTbz",
              "objectId": "64pXzDFhTbz",
              "commandSetId": "commandset-187",
              "text": "membuat keributan pada saat upacara adat sedang berlangsung",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_5klQLOy2sMl",
              "objectId": "5klQLOy2sMl",
              "commandSetId": "commandset-188",
              "text": "meninggalkan upacara adat karena merasa bosan",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_5cnKrBOlvB8",
              "objectId": "5cnKrBOlvB8",
              "commandSetId": "commandset-182",
              "text": "menyaksikan upacara adat dengan tenang",
              "isCorrect": true,
              "points": 10
            },
            {
              "id": "choice_6jGHZ6ElUUM",
              "objectId": "6jGHZ6ElUUM",
              "commandSetId": "commandset-179",
              "text": "tidak perlu memperhatikan upacara adat karena merasa asing",
              "isCorrect": false,
              "points": 0
            }
          ],
          "correctChoiceId": "choice_5cnKrBOlvB8",
          "correctAnswerText": "menyaksikan upacara adat dengan tenang",
          "feedbackLayers": {
            "correctLayerId": "6RqFMmFCoCW",
            "incorrectLayerId": "6ozsIxVZ0Ap"
          }
        },
        {
          "slideId": "6TsqDEfppnq",
          "slideNumber": 28,
          "interactionId": "5n7aaGFiNy2",
          "type": "multiplechoice",
          "questionText": "Misalkan kamu memiliki teman baru dari daerah yang berbeda denganmu. Teman barumu membawakan oleh-oleh makanan khas dari daerahnya. Kamu mencicipi sedikit makanan yang dibawa temanmu. Setelah mencicipi, kamu kurang suka dengan rasanya. Tindakanmu sebaiknya",
          "questionCommandSetId": "commandset-203",
          "maxPoints": 10,
          "choices": [
            {
              "id": "choice_6WFNI1nDjDb",
              "objectId": "6WFNI1nDjDb",
              "commandSetId": "commandset-199",
              "text": "membuang makanan tersebut karena kurang suka",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_6V9n5XzWzav",
              "objectId": "6V9n5XzWzav",
              "commandSetId": "commandset-200",
              "text": "menghabiskan makanan bersama teman-teman",
              "isCorrect": true,
              "points": 10
            },
            {
              "id": "choice_5VM9NEhsrLX",
              "objectId": "5VM9NEhsrLX",
              "commandSetId": "commandset-194",
              "text": "mencela rasa makanan khas daerah dari temanmu",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_6iXJLX3avbA",
              "objectId": "6iXJLX3avbA",
              "commandSetId": "commandset-193",
              "text": "meminta maaf ke temanuntuk tidak melanjutka makan\n",
              "isCorrect": false,
              "points": 0
            }
          ],
          "correctChoiceId": "choice_6V9n5XzWzav",
          "correctAnswerText": "menghabiskan makanan bersama teman-teman",
          "feedbackLayers": {
            "correctLayerId": "6AIJEmDTCL3",
            "incorrectLayerId": "6IjgPGebEz0"
          }
        },
        {
          "slideId": "5tNzQg4qrZn",
          "slideNumber": 29,
          "interactionId": "5X0lYwRx4jy",
          "type": "multiplechoice",
          "questionText": "Perhatikan gambar dibawah ini, walaupun mereka memakai baju adat yang berbeda namun memegang bendera merah putih yang sama, maknanya adalah...",
          "questionCommandSetId": "commandset-218",
          "maxPoints": 10,
          "choices": [
            {
              "id": "choice_68z043eV7Cd",
              "objectId": "68z043eV7Cd",
              "commandSetId": "commandset-214",
              "text": "bersatu saling menghargai",
              "isCorrect": true,
              "points": 10
            },
            {
              "id": "choice_6JHZsxQ4btz",
              "objectId": "6JHZsxQ4btz",
              "commandSetId": "commandset-215",
              "text": "melaksanakan upacara bendera",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_5ZOi3JMUqDj",
              "objectId": "5ZOi3JMUqDj",
              "commandSetId": "commandset-211",
              "text": "berjuang melawan penjajah",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_5pc4q3FQPbs",
              "objectId": "5pc4q3FQPbs",
              "commandSetId": "commandset-210",
              "text": "foto bersama",
              "isCorrect": false,
              "points": 0
            }
          ],
          "correctChoiceId": "choice_68z043eV7Cd",
          "correctAnswerText": "bersatu saling menghargai",
          "feedbackLayers": {
            "correctLayerId": "5aP1qzv44A6",
            "incorrectLayerId": "6QkcRhah4eX"
          }
        },
        {
          "slideId": "5udKoy5uKgm",
          "slideNumber": 30,
          "interactionId": "6ecAv5UHVvK",
          "type": "multiplechoice",
          "questionText": "Tindakan menghargai yang sebaiknya dilakukan Mustofa dan Satria saat berkunjung ke rumah Bayu ketika melihat ukiran di pintu rumah adat dayak adalah....",
          "questionCommandSetId": "commandset-231",
          "maxPoints": 10,
          "choices": [
            {
              "id": "choice_6mcdiZg6LAP",
              "objectId": "6mcdiZg6LAP",
              "commandSetId": "commandset-228",
              "text": "mencoret-coret dinding rumah Bayu karena bagus",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_5yZBgCRi7eL",
              "objectId": "5yZBgCRi7eL",
              "commandSetId": "commandset-229",
              "text": "memuji ukiran dinding yang terdapat di rumah Bayu",
              "isCorrect": true,
              "points": 10
            },
            {
              "id": "choice_5tvU585dU4z",
              "objectId": "5tvU585dU4z",
              "commandSetId": "commandset-223",
              "text": "mengatakan bahwa rumah Bayu terlihat kuno dan ketinggalan zaman",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_5jNOBm9lcbk",
              "objectId": "5jNOBm9lcbk",
              "commandSetId": "commandset-222",
              "text": "mengatakan bahwa rumahnya lebih unik daripada rumah Bayu",
              "isCorrect": false,
              "points": 0
            }
          ],
          "correctChoiceId": "choice_5yZBgCRi7eL",
          "correctAnswerText": "memuji ukiran dinding yang terdapat di rumah Bayu",
          "feedbackLayers": {
            "correctLayerId": "61Bo7wMMSKu",
            "incorrectLayerId": "6rbLNT1TBry"
          }
        },
        {
          "slideId": "6PxxtyG4oap",
          "slideNumber": 31,
          "interactionId": "5ccluUrKWxL",
          "type": "multiplechoice",
          "questionText": "Seorang pedagang siomai dari Bandung berbicara menggunakan bahasa Sunda. Kamu berasal dari daerah berbeda. Kamu tidak mengerti bahasa Sunda. Tindakanmu sebaiknya.... ",
          "questionCommandSetId": "commandset-240",
          "maxPoints": 10,
          "choices": [
            {
              "id": "choice_6BmI7R905py",
              "objectId": "6BmI7R905py",
              "commandSetId": "commandset-236",
              "text": "meminta dengan sopan agar pedagang itu berbicara menggunakan bahasa Indonesia",
              "isCorrect": true,
              "points": 10
            },
            {
              "id": "choice_5xgJs3j9aSj",
              "objectId": "5xgJs3j9aSj",
              "commandSetId": "commandset-237",
              "text": "meminta pedagang itu untuk berbicara menggunakan bahasa daerahmu",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_6GpqX7TLTb9",
              "objectId": "6GpqX7TLTb9",
              "commandSetId": "commandset-233",
              "text": "mengajak pedagang berbicara menggunakan bahasa daerahmu",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_5lFRx7up827",
              "objectId": "5lFRx7up827",
              "commandSetId": "commandset-232",
              "text": "tidak jadi membeli siomai karena berbeda bahasa daerah",
              "isCorrect": false,
              "points": 0
            }
          ],
          "correctChoiceId": "choice_6BmI7R905py",
          "correctAnswerText": "meminta dengan sopan agar pedagang itu berbicara menggunakan bahasa Indonesia",
          "feedbackLayers": {
            "correctLayerId": "6NOS9sRsO3U",
            "incorrectLayerId": "61rhLpSYjLN"
          }
        },
        {
          "slideId": "5eaO0Lz8ZMk",
          "slideNumber": 32,
          "interactionId": "615RmMUnUpM",
          "type": "multiplechoice",
          "questionText": "Temanmu menjelaskan sejarah dan keunikan senjata tradisional dari daerahnya. Tindakanmu sebaiknya adalah..",
          "questionCommandSetId": "commandset-253",
          "maxPoints": 10,
          "choices": [
            {
              "id": "choice_6VShuLQdd5A",
              "objectId": "6VShuLQdd5A",
              "commandSetId": "commandset-249",
              "text": "tidak mendengarkan penjelasannya",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_67qTI4Zo6bT",
              "objectId": "67qTI4Zo6bT",
              "commandSetId": "commandset-250",
              "text": "mengobrol dengan teman lain karena tidak tertarik dengan ceritanya",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_6QRkw5qLd0w",
              "objectId": "6QRkw5qLd0w",
              "commandSetId": "commandset-244",
              "text": "mendengarkan penjelasannya dengan saksama",
              "isCorrect": true,
              "points": 10
            },
            {
              "id": "choice_62GDQTE6pPh",
              "objectId": "62GDQTE6pPh",
              "commandSetId": "commandset-243",
              "text": "mencari kekurangan dari senjata tradisional yang sedang dijelaskannya",
              "isCorrect": false,
              "points": 0
            }
          ],
          "correctChoiceId": "choice_6QRkw5qLd0w",
          "correctAnswerText": "mendengarkan penjelasannya dengan saksama",
          "feedbackLayers": {
            "correctLayerId": "5dPQ9dmNB1n",
            "incorrectLayerId": "5lnjz9IXetF"
          }
        },
        {
          "slideId": "6SKvjji8cdv",
          "slideNumber": 33,
          "interactionId": "6ByK1wqt7Jy",
          "type": "multiplechoice",
          "questionText": "Kamu dan temanmu menyaksikan pentas seni tari tradisional di dekat rumah. Tarian yang sedang ditampilkan tidak berasal dari daerahmu. Tindakanmu sebaiknya",
          "questionCommandSetId": "commandset-266",
          "maxPoints": 10,
          "choices": [
            {
              "id": "choice_5fbJQeTkPZ8",
              "objectId": "5fbJQeTkPZ8",
              "commandSetId": "commandset-264",
              "text": "merasa bahwa tari modern lebih bagus dibandingkan tari tradicional",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_5xnLhfrkH7T",
              "objectId": "5xnLhfrkH7T",
              "commandSetId": "commandset-265",
              "text": "mencari kekurangan dari tari tradisional yang ditampilkan",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_5umFBsxx2Fr",
              "objectId": "5umFBsxx2Fr",
              "commandSetId": "commandset-263",
              "text": "mengajak teman untuk meninggalkan tempat tersebut",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_6cxGp9TN1cp",
              "objectId": "6cxGp9TN1cp",
              "commandSetId": "commandset-262",
              "text": "memberikan pujian terhadap penampilan para penari",
              "isCorrect": true,
              "points": 10
            }
          ],
          "correctChoiceId": "choice_6cxGp9TN1cp",
          "correctAnswerText": "memberikan pujian terhadap penampilan para penari",
          "feedbackLayers": {
            "correctLayerId": "6AYOrp7ei5M",
            "incorrectLayerId": "6R7oc9XCNf5"
          }
        },
        {
          "slideId": "5a8YIrSITc8",
          "slideNumber": 34,
          "interactionId": "67tUff8DXh7",
          "type": "multiplechoice",
          "questionText": "Zaura pandai memainkan beberapa alat musik tradisional. Zaura paling suka bermain angklung. Ibu Guru sering meminta Zaura untuk menampilkan permainannya dalam acara sekolah. Tindakan yang sebaiknya dilakukan Zaura dengan kemampuan yang dimilikinya adalah",
          "questionCommandSetId": "commandset-284",
          "maxPoints": 10,
          "choices": [
            {
              "id": "choice_6SjkddRAYtG",
              "objectId": "6SjkddRAYtG",
              "commandSetId": "commandset-278",
              "text": "mencela teman menggunakan alat musik tradisional",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_6CNI9CtAg4I",
              "objectId": "6CNI9CtAg4I",
              "commandSetId": "commandset-281",
              "text": "terus belajar memainkan alat musik tradisional dan mengajari teman",
              "isCorrect": true,
              "points": 10
            },
            {
              "id": "choice_5l3UHJPpE8D",
              "objectId": "5l3UHJPpE8D",
              "commandSetId": "commandset-273",
              "text": "lebih memilih mempelajari alat musik yang berasal dari daerahnya saja",
              "isCorrect": false,
              "points": 0
            },
            {
              "id": "choice_62eUyuMcCAJ",
              "objectId": "62eUyuMcCAJ",
              "commandSetId": "commandset-272",
              "text": "memilih untuk belajar alat musik modern agar tidak ketinggalan zaman",
              "isCorrect": false,
              "points": 0
            }
          ],
          "correctChoiceId": "choice_6CNI9CtAg4I",
          "correctAnswerText": "terus belajar memainkan alat musik tradisional dan mengajari teman",
          "feedbackLayers": {
            "correctLayerId": "6ULkx4Aw2EM",
            "incorrectLayerId": "6O0xCHrwpAI"
          }
        }
      ]
    },
    "gameAnakGaruda": {
      "quizId": "5xqs5Xb1paw",
      "slideId": "6G1VrKuOhCw",
      "interactionId": "5wg4ZXz4XnZ",
      "title": "Drag and Drop",
      "passPercent": 80,
      "maxPoints": 20,
      "resultsSlideId": "6WIqLhHr1Cm",
      "choices": [
        {
          "id": "choice_6JvyeweLFyt",
          "text": "Picture 44 - burung starla.gif"
        }
      ],
      "statements": [
        {
          "id": "statement_6YRB5UIjNas",
          "text": "Sila 1 - Desain tanpa judul (38).png"
        },
        {
          "id": "statement_5uLET0cr0nZ",
          "text": "Sila 5 - Desain tanpa judul (39).png"
        }
      ]
    }
  },
  "svgTextCommandSets": {
    "commandset-8": {
      "commandSetId": "commandset-8",
      "index": 8,
      "lines": [
        "sekolah kamu"
      ]
    },
    "commandset-20": {
      "commandSetId": "commandset-20",
      "index": 20,
      "lines": [
        "nama kamu"
      ]
    },
    "commandset-38": {
      "commandSetId": "commandset-38",
      "index": 38,
      "lines": [
        "Selamat Datang di Starla Budaya!",
        "Sebelum kita belajar dan bermain,",
        "kenalan dulu  yuk saya, Starla!",
        "Studi Pelajar Pancasila",
        "Kita akan belajar tentang",
        "Budaya Indonesia. Starla harap,",
        "Kamu bisa Mengenal, Menghargai,",
        "Merefleksi, dan Mengaplikasikan",
        "Keragaman Budaya di Indonesia."
      ]
    },
    "commandset-41": {
      "commandSetId": "commandset-41",
      "index": 41,
      "lines": [
        "Rumah Adat"
      ]
    },
    "commandset-44": {
      "commandSetId": "commandset-44",
      "index": 44,
      "lines": [
        "Bentuk apakah ini?"
      ]
    },
    "commandset-47": {
      "commandSetId": "commandset-47",
      "index": 47,
      "lines": [
        "Senjata Tradisional"
      ]
    },
    "commandset-49": {
      "commandSetId": "commandset-49",
      "index": 49,
      "lines": [
        "Benda apakah ini?"
      ]
    },
    "commandset-51": {
      "commandSetId": "commandset-51",
      "index": 51,
      "lines": [
        "Gamelan"
      ]
    },
    "commandset-54": {
      "commandSetId": "commandset-54",
      "index": 54,
      "lines": [
        "Apa nama benda ini?"
      ]
    },
    "commandset-56": {
      "commandSetId": "commandset-56",
      "index": 56,
      "lines": [
        " Tutup"
      ]
    },
    "commandset-69": {
      "commandSetId": "commandset-69",
      "index": 69,
      "lines": [
        "Bagaimana cara menghargai ",
        "Bahasa Daerah?"
      ]
    },
    "commandset-73": {
      "commandSetId": "commandset-73",
      "index": 73,
      "lines": [
        "1.",
        "Meminta teman mengajari bahasa ",
        "daerahnya",
        "2.",
        "Meminta penjelasan tentang bahasa yang ",
        "tidak dimengerti",
        "3.",
        "Berbicara dengan teman berbeda suku ",
        "menggunakan bahasa indonesia",
        "Bahasa daerah mana saja yang kamu",
        "ketahui? Ayo ucapkan pada gurumu"
      ]
    },
    "commandset-75": {
      "commandSetId": "commandset-75",
      "index": 75,
      "lines": [
        "?"
      ]
    },
    "commandset-77": {
      "commandSetId": "commandset-77",
      "index": 77,
      "lines": [
        "?"
      ]
    },
    "commandset-78": {
      "commandSetId": "commandset-78",
      "index": 78,
      "lines": [
        "?"
      ]
    },
    "commandset-80": {
      "commandSetId": "commandset-80",
      "index": 80,
      "lines": [
        "Keragaman Lagu Daerah",
        "Lagu daerah adalah lagu khas suatu daerah. Lagu daerah ",
        "menggunakan bahasa dan dialek daerah setempat. Lagu ",
        "daerah dinyanyikan saat pementasan tari, permainan ",
        "tradisional, pesta rakyat, atau pertunjukan daerah. Cerita ",
        "yang disampaikan dalam lagu daerah dapat berupa ",
        "keindahan alam, keagamaan, hubungan masyarakat, atau ",
        "adat istiadat.",
        "Setiap daerah memiliki lagu daerah loh dan kita harus",
        "ikut melestarikan lagu daerah yang ada di negara kita."
      ]
    },
    "commandset-82": {
      "commandSetId": "commandset-82",
      "index": 82,
      "lines": [
        "Bagaimana cara menghargai ",
        "lagu daerah?"
      ]
    },
    "commandset-84": {
      "commandSetId": "commandset-84",
      "index": 84,
      "lines": [
        "1.",
        "Memberi tepuk tangan setelah teman ",
        "menyanyikan lagu daerahnya",
        "2.",
        "Mempelajari lagu daerah lain",
        "3.",
        "Menyanyikan lagu daerah dengan lirik yang ",
        "benar",
        "Kalau di daerah kamu apa judul lagu daerah",
        "yang kamu ketahui?"
      ]
    },
    "commandset-86": {
      "commandSetId": "commandset-86",
      "index": 86,
      "lines": [
        "Keragaman Alat Musik Tradisional",
        "Lagu daerah biasanya diiringi oleh permainan alat ",
        "musik daerah setempat. Iringan permainan alat  ",
        "musik daerah membuat lagu daerah menjadi lebih ",
        "menarik untuk didengarkan. Ada berbagai jenis alat ",
        "musik daerah di Indonesia. Oleh sebab itu, kita harus ",
        "menghargai keragaman alat musik daerah ya.."
      ]
    },
    "commandset-89": {
      "commandSetId": "commandset-89",
      "index": 89,
      "lines": [
        "Bagaimana cara menghargai alat ",
        "musik tradisional?"
      ]
    },
    "commandset-91": {
      "commandSetId": "commandset-91",
      "index": 91,
      "lines": [
        "1.",
        "Memberi tepuk tangan setelah teman ",
        "menyanyikan lagu daerahnya",
        "2.",
        "Mempelajari lagu daerah lain",
        "3.",
        "Menyanyikan lagu daerah dengan lirik ",
        "yang benar",
        "Kalau di daerah kamu apa nama alat",
        "musik tradisional yang kamu ketauhi?"
      ]
    },
    "commandset-92": {
      "commandSetId": "commandset-92",
      "index": 92,
      "lines": [
        "Keragaman Pakaian Daerah",
        "Pakaian daerah merupakan pakaian khas suatu ",
        "daerah. Pakaian daerah dikenakan saat perayaan ",
        "atau upacara adat. Bahan untuk membuat pakaian ",
        "daerah diambil dari hasil alam daerah setempat.",
        "Keragaman pakaian daerah merupakan kekayaan ",
        "budaya bangsa yang tidak ternilai harganya. Kita ",
        "harus saling menghargai keragaman",
        "pakaian daerah."
      ]
    },
    "commandset-93": {
      "commandSetId": "commandset-93",
      "index": 93,
      "lines": [
        "Bagaimana cara menghargai ",
        "pakaian daerah?"
      ]
    },
    "commandset-95": {
      "commandSetId": "commandset-95",
      "index": 95,
      "lines": [
        "1.",
        "Memakai pakaian daerah dengan rasa",
        " ",
        "bangga",
        "2.",
        "Memuji keindahan pakaian adat daerah ",
        "lain",
        "3.",
        "Menyimpan pakaian daerah dengan baik",
        "Apakah kamu pernah memakai baju adat ",
        "daerah kamu? Apa nama baju adat yang",
        "kamu ketauhi?"
      ]
    },
    "commandset-97": {
      "commandSetId": "commandset-97",
      "index": 97,
      "lines": [
        "Keragaman Senjata Tradisional",
        "Senjata tradisional merupakan senjata khas suatu ",
        "daerah. Senjata tradisional digunakan sebagai ",
        "kelengkapan atau hiasan pakaian daerah. Senjata ",
        "tradisional juga ada yang digunakan untuk berburu dan ",
        "untuk peralatan sehari-hari.",
        "Kita harus melestarikan keragaman senjata tradisional ",
        "Indonesia. Kita harus saling menghargai perbedaan ",
        "senjata tradisional."
      ]
    },
    "commandset-98": {
      "commandSetId": "commandset-98",
      "index": 98,
      "lines": [
        "Bagaimana cara menghargai ",
        "senjata tradisional?"
      ]
    },
    "commandset-100": {
      "commandSetId": "commandset-100",
      "index": 100,
      "lines": [
        "1.",
        "Memuji keindahan bentuk senjata tradisional",
        " ",
        "daerah lain",
        "2.",
        "Mempelajari sejarah senjata tradisional ",
        "daerah lain",
        "3.",
        "Menjaga senjata daerah dengan baik",
        "Kalau di daerah kamu apa nama senjata ",
        "tradisional yang kamu ketauhi?"
      ]
    },
    "commandset-102": {
      "commandSetId": "commandset-102",
      "index": 102,
      "lines": [
        "Keragaman Tari Tradisional",
        "Tari adalah gerak tubuh secara berirama untuk ",
        "mengungkapkan perasaan dan pikiran serta untuk ",
        "menceritakan sesuatu. Tari tradisional merupakan ",
        "tarian yang lahir, tumbuh, dan berkembang dalam ",
        "kelompok masyarakat di daerah tertentu. Para penari ",
        "tradisional mengenakan pakaian daerah ketika ",
        "menari. Tari tradisional dipentaskan dalam upacara ",
        "adat dan keagamaan, penyambutan tamu, perayaan ",
        "panen raya, serta hiburan rakyat."
      ]
    },
    "commandset-103": {
      "commandSetId": "commandset-103",
      "index": 103,
      "lines": [
        "Bagaimana cara menghargai tari ",
        "tradisional?"
      ]
    },
    "commandset-105": {
      "commandSetId": "commandset-105",
      "index": 105,
      "lines": [
        "1.",
        "Menonton pementasan tari tradisional",
        " ",
        "hingga selesai",
        "2.",
        "Mempelajari tari tradisional dari berbagai ",
        "daerah di Indonesia",
        "3.",
        "Ketahui lebih banyak sejarah tari ",
        "tradisional dari berbagai daerah lainnya",
        "Kalau di daerah kamu apa nama tari ",
        "tradisional yang kamu ketahui?"
      ]
    },
    "commandset-107": {
      "commandSetId": "commandset-107",
      "index": 107,
      "lines": [
        "Keragaman Rumah Adat",
        "Rumah adat adalah rumah yang dibangun ",
        "sesuai dengan ciri khas dan budaya ",
        "masyarakat di suatu daerah tertentu.",
        "Setiap rumah adat memiliki aturan. Kita harus ",
        "menghargai dan menghormati aturannya."
      ]
    },
    "commandset-109": {
      "commandSetId": "commandset-109",
      "index": 109,
      "lines": [
        "Bagaimana cara ",
        "menghargai rumah adat?"
      ]
    },
    "commandset-111": {
      "commandSetId": "commandset-111",
      "index": 111,
      "lines": [
        "1.",
        "Melepas alas kaki sebelum memasuki",
        " ",
        "rumah adat",
        "2.",
        "Mendenggarkan penjelasan tentang ",
        "rumah adat",
        "3.",
        "Menunjukkan kekaguman terhadap ",
        "keunikan rumah adat",
        "Kalau di daerah kamu apa nama",
        "rumah adat yang kamu ketauhi?"
      ]
    },
    "commandset-114": {
      "commandSetId": "commandset-114",
      "index": 114,
      "lines": [
        "Kerja Bagus! ",
        "kamu sudah mengenal dan ",
        "mempelajari bagaimana cara ",
        "menghargai keragaman budaya ",
        "di Indonesia dengan sangat baik."
      ]
    },
    "commandset-123": {
      "commandSetId": "commandset-123",
      "index": 123,
      "lines": [
        "hanya bermain dengan teman yang pakai",
        "baju adat yang sama"
      ]
    },
    "commandset-128": {
      "commandSetId": "commandset-128",
      "index": 128,
      "lines": [
        "mengejek baju adat lain karena merasa baju ",
        "adatmu adalah yang terbaik"
      ]
    },
    "commandset-133": {
      "commandSetId": "commandset-133",
      "index": 133,
      "lines": [
        "mengatakan bahwa baju adatmu lebih baik ",
        "dibanding yang lain"
      ]
    },
    "commandset-140": {
      "commandSetId": "commandset-140",
      "index": 140,
      "lines": [
        "saling menghormati perbedaan baju adat"
      ]
    },
    "commandset-143": {
      "commandSetId": "commandset-143",
      "index": 143,
      "lines": [
        "Misalkan kamu memiliki teman Udi berasal dari suku ",
        "Sunda, Komang berasal dari suku Bali, dan kamu berasal ",
        "dari suku Jawa. Mereka memakai baju adatnya. Sikapmu ",
        "terhadap perbedaan baju ada tersebut adalah...."
      ]
    },
    "commandset-145": {
      "commandSetId": "commandset-145",
      "index": 145,
      "lines": [
        "Benar"
      ]
    },
    "commandset-147": {
      "commandSetId": "commandset-147",
      "index": 147,
      "lines": [
        "Salah"
      ]
    },
    "commandset-162": {
      "commandSetId": "commandset-162",
      "index": 162,
      "lines": [
        "memotong cerita yang disampaikan oleh Oxel"
      ]
    },
    "commandset-163": {
      "commandSetId": "commandset-163",
      "index": 163,
      "lines": [
        "merendahkan kebudayaan yang ada di daerah Oxel "
      ]
    },
    "commandset-170": {
      "commandSetId": "commandset-170",
      "index": 170,
      "lines": [
        "mendengarkan cerita Oxel dengan saksama"
      ]
    },
    "commandset-171": {
      "commandSetId": "commandset-171",
      "index": 171,
      "lines": [
        "menunjukkan bahwa kebudayaan daerahmu lebih baik"
      ]
    },
    "commandset-174": {
      "commandSetId": "commandset-174",
      "index": 174,
      "lines": [
        "Pak Dika meminta siswa menceritakan budaya daerahnya ",
        "masing-masing. Oxel menceritakan keunikan budaya yang ",
        "ada di daerahnya. Budaya dan daerah asal Oxel berbeda ",
        "denganmu. Tindakanmu sebaiknya…"
      ]
    },
    "commandset-179": {
      "commandSetId": "commandset-179",
      "index": 179,
      "lines": [
        "tidak perlu memperhatikan upacara adat karena ",
        "merasa asing"
      ]
    },
    "commandset-182": {
      "commandSetId": "commandset-182",
      "index": 182,
      "lines": [
        "menyaksikan upacara adat dengan tenang"
      ]
    },
    "commandset-187": {
      "commandSetId": "commandset-187",
      "index": 187,
      "lines": [
        "membuat keributan pada saat upacara adat sedang ",
        "berlangsung"
      ]
    },
    "commandset-188": {
      "commandSetId": "commandset-188",
      "index": 188,
      "lines": [
        "meninggalkan upacara adat karena merasa bosan"
      ]
    },
    "commandset-191": {
      "commandSetId": "commandset-191",
      "index": 191,
      "lines": [
        "Keluargamu sedang berlibur ke Papua. Di sana ",
        "sedang diadakan upacara adat bakar batu. Kamu ",
        "ingin ikut melihat ",
        "upa cara",
        " adat tersebut. Sikapmu ",
        "sebaiknya..."
      ]
    },
    "commandset-193": {
      "commandSetId": "commandset-193",
      "index": 193,
      "lines": [
        "meminta maaf ke temanuntuk tidak melanjutka makan"
      ]
    },
    "commandset-194": {
      "commandSetId": "commandset-194",
      "index": 194,
      "lines": [
        "mencela rasa makanan khas daerah dari temanmu"
      ]
    },
    "commandset-199": {
      "commandSetId": "commandset-199",
      "index": 199,
      "lines": [
        "membuang makanan tersebut karena kurang suka"
      ]
    },
    "commandset-200": {
      "commandSetId": "commandset-200",
      "index": 200,
      "lines": [
        "menghabiskan makanan bersama teman-teman"
      ]
    },
    "commandset-203": {
      "commandSetId": "commandset-203",
      "index": 203,
      "lines": [
        "Misalkan kamu memiliki teman baru dari daerah yang ",
        "berbeda denganmu. Teman barumu membawakan oleh-oleh ",
        "makanan khas dari daerahnya. Kamu mencicipi sedikit ",
        "makanan yang dibawa temanmu. Setelah mencicipi, kamu ",
        "kurang suka dengan rasanya. Tindakanmu sebaiknya"
      ]
    },
    "commandset-210": {
      "commandSetId": "commandset-210",
      "index": 210,
      "lines": [
        "foto bersama"
      ]
    },
    "commandset-211": {
      "commandSetId": "commandset-211",
      "index": 211,
      "lines": [
        "berjuang melawan penjajah"
      ]
    },
    "commandset-214": {
      "commandSetId": "commandset-214",
      "index": 214,
      "lines": [
        "bersatu saling menghargai"
      ]
    },
    "commandset-215": {
      "commandSetId": "commandset-215",
      "index": 215,
      "lines": [
        "melaksanakan upacara bendera"
      ]
    },
    "commandset-218": {
      "commandSetId": "commandset-218",
      "index": 218,
      "lines": [
        "Perhatikan gambar dibawah ini, walaupun mereka ",
        "memakai baju adat yang berbeda namun memegang ",
        "bendera merah putih yang sama, maknanya adalah..."
      ]
    },
    "commandset-222": {
      "commandSetId": "commandset-222",
      "index": 222,
      "lines": [
        "mengatakan bahwa rumahnya lebih unik daripada ",
        "rumah Bayu"
      ]
    },
    "commandset-223": {
      "commandSetId": "commandset-223",
      "index": 223,
      "lines": [
        "mengatakan bahwa rumah Bayu terlihat kuno dan ",
        "ketinggalan zaman"
      ]
    },
    "commandset-228": {
      "commandSetId": "commandset-228",
      "index": 228,
      "lines": [
        "mencoret-coret dinding rumah Bayu karena bagus"
      ]
    },
    "commandset-229": {
      "commandSetId": "commandset-229",
      "index": 229,
      "lines": [
        "memuji ukiran dinding yang terdapat di rumah Bayu"
      ]
    },
    "commandset-231": {
      "commandSetId": "commandset-231",
      "index": 231,
      "lines": [
        "Tindakan menghargai yang sebaiknya dilakukan Mustofa ",
        "dan Satria saat berkunjung ke rumah Bayu ketika melihat ",
        "ukiran di pintu rumah adat dayak adalah...."
      ]
    },
    "commandset-232": {
      "commandSetId": "commandset-232",
      "index": 232,
      "lines": [
        "tidak jadi membeli siomai karena berbeda bahasa ",
        "daerah"
      ]
    },
    "commandset-233": {
      "commandSetId": "commandset-233",
      "index": 233,
      "lines": [
        "mengajak pedagang berbicara menggunakan bahasa ",
        "daerahmu"
      ]
    },
    "commandset-236": {
      "commandSetId": "commandset-236",
      "index": 236,
      "lines": [
        "meminta dengan sopan agar pedagang itu berbicara ",
        "menggunakan bahasa Indonesia"
      ]
    },
    "commandset-237": {
      "commandSetId": "commandset-237",
      "index": 237,
      "lines": [
        "meminta pedagang itu untuk berbicara menggunakan ",
        "bahasa daerahmu"
      ]
    },
    "commandset-240": {
      "commandSetId": "commandset-240",
      "index": 240,
      "lines": [
        "Seorang pedagang siomai dari Bandung berbicara ",
        "menggunakan bahasa Sunda. Kamu berasal dari daerah ",
        "berbeda. Kamu tidak mengerti bahasa Sunda. Tindakanmu ",
        "sebaiknya.... "
      ]
    },
    "commandset-243": {
      "commandSetId": "commandset-243",
      "index": 243,
      "lines": [
        "mencari kekurangan dari senjata tradisional yang ",
        "sedang dijelaskannya"
      ]
    },
    "commandset-244": {
      "commandSetId": "commandset-244",
      "index": 244,
      "lines": [
        "mendengarkan penjelasannya dengan saksama"
      ]
    },
    "commandset-249": {
      "commandSetId": "commandset-249",
      "index": 249,
      "lines": [
        "tidak mendengarkan penjelasannya"
      ]
    },
    "commandset-250": {
      "commandSetId": "commandset-250",
      "index": 250,
      "lines": [
        "mengobrol dengan teman lain karena tidak tertarik ",
        "dengan ceritanya"
      ]
    },
    "commandset-253": {
      "commandSetId": "commandset-253",
      "index": 253,
      "lines": [
        "Temanmu menjelaskan sejarah dan keunikan ",
        "senjata tradisional dari daerahnya. Tindakanmu ",
        "sebaiknya adalah.."
      ]
    },
    "commandset-262": {
      "commandSetId": "commandset-262",
      "index": 262,
      "lines": [
        "memberikan pujian terhadap penampilan para ",
        "penari"
      ]
    },
    "commandset-263": {
      "commandSetId": "commandset-263",
      "index": 263,
      "lines": [
        "mengajak teman untuk meninggalkan tempat ",
        "tersebut"
      ]
    },
    "commandset-264": {
      "commandSetId": "commandset-264",
      "index": 264,
      "lines": [
        "merasa bahwa tari modern lebih bagus ",
        "dibandingkan tari tradicional"
      ]
    },
    "commandset-265": {
      "commandSetId": "commandset-265",
      "index": 265,
      "lines": [
        "mencari kekurangan dari tari tradisional yang ",
        "ditampilkan"
      ]
    },
    "commandset-266": {
      "commandSetId": "commandset-266",
      "index": 266,
      "lines": [
        "Kamu dan temanmu menyaksikan pentas seni tari ",
        "tradisional di dekat rumah. Tarian yang sedang ditampilkan ",
        "tidak berasal dari daerahmu. Tindakanmu sebaiknya"
      ]
    },
    "commandset-272": {
      "commandSetId": "commandset-272",
      "index": 272,
      "lines": [
        "memilih untuk belajar alat musik modern agar tidak ",
        "ketinggalan zaman"
      ]
    },
    "commandset-273": {
      "commandSetId": "commandset-273",
      "index": 273,
      "lines": [
        "lebih memilih mempelajari alat musik yang berasal dari ",
        "daerahnya saja"
      ]
    },
    "commandset-278": {
      "commandSetId": "commandset-278",
      "index": 278,
      "lines": [
        "mencela teman menggunakan alat musik tradisional"
      ]
    },
    "commandset-281": {
      "commandSetId": "commandset-281",
      "index": 281,
      "lines": [
        "terus belajar memainkan alat musik tradisional dan ",
        "mengajari teman"
      ]
    },
    "commandset-284": {
      "commandSetId": "commandset-284",
      "index": 284,
      "lines": [
        "Zaura pandai memainkan beberapa alat musik tradisional. ",
        "Zaura paling suka bermain angklung. Ibu Guru sering ",
        "meminta Zaura untuk menampilkan permainannya dalam ",
        "acara sekolah. Tindakan yang sebaiknya dilakukan Zaura ",
        "dengan kemampuan yang dimilikinya adalah"
      ]
    },
    "commandset-316": {
      "commandSetId": "commandset-316",
      "index": 316,
      "lines": [
        "Pilih dan tekan satu garuda yang menunjukkan perasaan kamu belajar budaya"
      ]
    },
    "commandset-331": {
      "commandSetId": "commandset-331",
      "index": 331,
      "lines": [
        "Keragaman Bahasa Daerah",
        "Bahasa daerah adalah bahasa yang digunakan oleh suatu ",
        "suku bangsa. Bahasa daerah digunakan sebagai alat ",
        "komunikasi atau bahasa percakapan sehari-hari ",
        "masyarakat. Indonesia memiliki ratusan jenis bahasa daerah ",
        "loh.",
        "Setiap bahasa daerah memiliki dialek masing- masing. Agar ",
        "setiap orang dari berbagai daerah tetap dapat ",
        "berkomunikasi dengan baik, bangsa Indonesia memiliki ",
        "bahasa yang dapat dimengerti oleh semua orang. Bahasa itu ",
        "disebut sebagai bahasa persatuan, yaitu bahasa Indonesia."
      ]
    },
    "commandset-336": {
      "commandSetId": "commandset-336",
      "index": 336,
      "lines": [
        "Nilai"
      ]
    },
    "commandset-341": {
      "commandSetId": "commandset-341",
      "index": 341,
      "lines": [
        "Budaya yang Benar"
      ]
    },
    "commandset-345": {
      "commandSetId": "commandset-345",
      "index": 345,
      "lines": [
        "Budaya yang Salah"
      ]
    },
    "commandset-349": {
      "commandSetId": "commandset-349",
      "index": 349,
      "lines": [
        "saya harus menghargai ",
        "ketika orang lain berbicara ",
        "bahasa daerahnya"
      ]
    },
    "commandset-353": {
      "commandSetId": "commandset-353",
      "index": 353,
      "lines": [
        "tidak suka alat musik ",
        "gamelan karena berisik ",
        "di telinga saya"
      ]
    },
    "commandset-356": {
      "commandSetId": "commandset-356",
      "index": 356,
      "lines": [
        "menjaga pakaian adat ",
        "yang kita miliki"
      ]
    },
    "commandset-359": {
      "commandSetId": "commandset-359",
      "index": 359,
      "lines": [
        "Bangga terhadap ",
        "keberagaman yang ada ",
        "di Indonesia"
      ]
    },
    "commandset-361": {
      "commandSetId": "commandset-361",
      "index": 361,
      "lines": [
        "tidak mau tau senjata ",
        "tradisional daerah lain"
      ]
    },
    "commandset-363": {
      "commandSetId": "commandset-363",
      "index": 363,
      "lines": [
        "keragaman budaya dapat ",
        "memecah belah persatuan ",
        "Indonesia"
      ]
    },
    "commandset-364": {
      "commandSetId": "commandset-364",
      "index": 364,
      "lines": [
        "tidak suka mendengar ",
        "musik dari daerah lain"
      ]
    },
    "commandset-367": {
      "commandSetId": "commandset-367",
      "index": 367,
      "lines": [
        "keragaman budaya ",
        "menjadi daya tarik wisata ",
        "Indonesia"
      ]
    },
    "commandset-369": {
      "commandSetId": "commandset-369",
      "index": 369,
      "lines": [
        "mau belajar tarian ",
        "daerah lain"
      ]
    },
    "commandset-370": {
      "commandSetId": "commandset-370",
      "index": 370,
      "lines": [
        "rumah adat saya lebih ",
        "bagus daripada rumah ",
        "adat daerah lain"
      ]
    },
    "commandset-375": {
      "commandSetId": "commandset-375",
      "index": 375,
      "lines": [
        "Apa itu Budaya?",
        "Budaya adalah adat istiadat ",
        "yang dimiliki suatu suku ",
        "bangsa. Budaya diwariskan ",
        "secara turun temurun dari ",
        "zaman nenek moyang hingga ",
        "sampai generasi saat ini loh…"
      ]
    }
  },
  "audioCatalog": {
    "14": {
      "assetId": 14,
      "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
      "durationMs": 861,
      "fileSize": 6344
    },
    "15": {
      "assetId": 15,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "16": {
      "assetId": 16,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "17": {
      "assetId": 17,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "18": {
      "assetId": 18,
      "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
      "durationMs": 861,
      "fileSize": 6344
    },
    "19": {
      "assetId": 19,
      "url": "story_content/6fP6CzyqyMk_44100_56_0.mp3",
      "durationMs": 133511,
      "fileSize": 934764
    },
    "23": {
      "assetId": 23,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "24": {
      "assetId": 24,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "26": {
      "assetId": 26,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "27": {
      "assetId": 27,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "30": {
      "assetId": 30,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "31": {
      "assetId": 31,
      "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
      "durationMs": 861,
      "fileSize": 6344
    },
    "36": {
      "assetId": 36,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "37": {
      "assetId": 37,
      "url": "story_content/6Zh1DGetjr4_44100_56_0.mp3",
      "durationMs": 7421,
      "fileSize": 52241
    },
    "38": {
      "assetId": 38,
      "url": "story_content/5kRUm7Nir2B_44100_56_0.mp3",
      "durationMs": 63631,
      "fileSize": 445750
    },
    "39": {
      "assetId": 39,
      "url": "story_content/5ZYCAe9VtmT_44100_56_0.mp3",
      "durationMs": 20381,
      "fileSize": 142938
    },
    "40": {
      "assetId": 40,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "41": {
      "assetId": 41,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "43": {
      "assetId": 43,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "44": {
      "assetId": 44,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "45": {
      "assetId": 45,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "46": {
      "assetId": 46,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "49": {
      "assetId": 49,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "50": {
      "assetId": 50,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "51": {
      "assetId": 51,
      "url": "story_content/6Zh1DGetjr4_44100_56_0.mp3",
      "durationMs": 7421,
      "fileSize": 52241
    },
    "52": {
      "assetId": 52,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "53": {
      "assetId": 53,
      "url": "story_content/5kRUm7Nir2B_44100_56_0.mp3",
      "durationMs": 63631,
      "fileSize": 445750
    },
    "54": {
      "assetId": 54,
      "url": "story_content/6ovJchPVZxx_44100_56_0.mp3",
      "durationMs": 10482,
      "fileSize": 73635
    },
    "55": {
      "assetId": 55,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "56": {
      "assetId": 56,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "58": {
      "assetId": 58,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "59": {
      "assetId": 59,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "61": {
      "assetId": 61,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "62": {
      "assetId": 62,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "63": {
      "assetId": 63,
      "url": "story_content/6Zh1DGetjr4_44100_56_0.mp3",
      "durationMs": 7421,
      "fileSize": 52241
    },
    "64": {
      "assetId": 64,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "65": {
      "assetId": 65,
      "url": "story_content/5kRUm7Nir2B_44100_56_0.mp3",
      "durationMs": 63631,
      "fileSize": 445750
    },
    "66": {
      "assetId": 66,
      "url": "story_content/6apy3oZfWFX_44100_56_0.mp3",
      "durationMs": 11892,
      "fileSize": 83510
    },
    "67": {
      "assetId": 67,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "68": {
      "assetId": 68,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "70": {
      "assetId": 70,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "71": {
      "assetId": 71,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "73": {
      "assetId": 73,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "74": {
      "assetId": 74,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "75": {
      "assetId": 75,
      "url": "story_content/6Zh1DGetjr4_44100_56_0.mp3",
      "durationMs": 7421,
      "fileSize": 52241
    },
    "76": {
      "assetId": 76,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "77": {
      "assetId": 77,
      "url": "story_content/5kRUm7Nir2B_44100_56_0.mp3",
      "durationMs": 63631,
      "fileSize": 445750
    },
    "78": {
      "assetId": 78,
      "url": "story_content/6W6bjByNtHg_44100_56_0.mp3",
      "durationMs": 15331,
      "fileSize": 107647
    },
    "79": {
      "assetId": 79,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "80": {
      "assetId": 80,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "82": {
      "assetId": 82,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "83": {
      "assetId": 83,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "86": {
      "assetId": 86,
      "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
      "durationMs": 861,
      "fileSize": 6344
    },
    "88": {
      "assetId": 88,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "91": {
      "assetId": 91,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "92": {
      "assetId": 92,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "93": {
      "assetId": 93,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "94": {
      "assetId": 94,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "95": {
      "assetId": 95,
      "url": "story_content/5WPKUcAEWAA_44100_56_0.mp3",
      "durationMs": 62152,
      "fileSize": 435327
    },
    "99": {
      "assetId": 99,
      "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
      "durationMs": 861,
      "fileSize": 6344
    },
    "100": {
      "assetId": 100,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "101": {
      "assetId": 101,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "102": {
      "assetId": 102,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "103": {
      "assetId": 103,
      "url": "story_content/5WPKUcAEWAA_44100_56_0.mp3",
      "durationMs": 62152,
      "fileSize": 435327
    },
    "105": {
      "assetId": 105,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "106": {
      "assetId": 106,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "107": {
      "assetId": 107,
      "url": "story_content/5kqdQfaYooj_44100_56_0.mp3",
      "durationMs": 40782,
      "fileSize": 285750
    },
    "108": {
      "assetId": 108,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "109": {
      "assetId": 109,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "110": {
      "assetId": 110,
      "url": "story_content/5XbL9belZlq_44100_56_0.mp3",
      "durationMs": 39922,
      "fileSize": 279715
    },
    "111": {
      "assetId": 111,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "112": {
      "assetId": 112,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "113": {
      "assetId": 113,
      "url": "story_content/63sJfFpLapV_44100_56_0.mp3",
      "durationMs": 41821,
      "fileSize": 293064
    },
    "115": {
      "assetId": 115,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "116": {
      "assetId": 116,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "117": {
      "assetId": 117,
      "url": "story_content/5ZwosbRRQyX_44100_56_0.mp3",
      "durationMs": 38062,
      "fileSize": 266732
    },
    "118": {
      "assetId": 118,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "119": {
      "assetId": 119,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "120": {
      "assetId": 120,
      "url": "story_content/6k7JPOlasPL_44100_56_0.mp3",
      "durationMs": 51751,
      "fileSize": 362550
    },
    "121": {
      "assetId": 121,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "122": {
      "assetId": 122,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "123": {
      "assetId": 123,
      "url": "story_content/6UucgsObbox_44100_56_0.mp3",
      "durationMs": 36861,
      "fileSize": 258321
    },
    "124": {
      "assetId": 124,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "125": {
      "assetId": 125,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "126": {
      "assetId": 126,
      "url": "story_content/64rbmiR4oxv_44100_56_0.mp3",
      "durationMs": 54312,
      "fileSize": 380470
    },
    "127": {
      "assetId": 127,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "128": {
      "assetId": 128,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "129": {
      "assetId": 129,
      "url": "story_content/6CcjdD1I85U_44100_56_0.mp3",
      "durationMs": 39582,
      "fileSize": 277338
    },
    "130": {
      "assetId": 130,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "131": {
      "assetId": 131,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "132": {
      "assetId": 132,
      "url": "story_content/5etzPk0n3VG_44100_56_0.mp3",
      "durationMs": 52062,
      "fileSize": 364744
    },
    "133": {
      "assetId": 133,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "134": {
      "assetId": 134,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "135": {
      "assetId": 135,
      "url": "story_content/6UkVdpRGxou_44100_56_0.mp3",
      "durationMs": 46321,
      "fileSize": 324515
    },
    "136": {
      "assetId": 136,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "137": {
      "assetId": 137,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "138": {
      "assetId": 138,
      "url": "story_content/6qzShui9SPq_44100_56_0.mp3",
      "durationMs": 56951,
      "fileSize": 398938
    },
    "139": {
      "assetId": 139,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "140": {
      "assetId": 140,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "141": {
      "assetId": 141,
      "url": "story_content/6jklFMi3AKq_44100_56_0.mp3",
      "durationMs": 39501,
      "fileSize": 276790
    },
    "142": {
      "assetId": 142,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "143": {
      "assetId": 143,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "144": {
      "assetId": 144,
      "url": "story_content/6mfqCF3DHTn_44100_56_0.mp3",
      "durationMs": 56712,
      "fileSize": 397292
    },
    "146": {
      "assetId": 146,
      "url": "story_content/5yzMgZw5dbd_44100_56_0.mp3",
      "durationMs": 681,
      "fileSize": 5064
    },
    "147": {
      "assetId": 147,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "148": {
      "assetId": 148,
      "url": "story_content/6VqCsaYwadr_44100_56_0.mp3",
      "durationMs": 10402,
      "fileSize": 73087
    },
    "149": {
      "assetId": 149,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "150": {
      "assetId": 150,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "151": {
      "assetId": 151,
      "url": "story_content/6AhqX1tWlfo_44100_56_0.mp3",
      "durationMs": 63631,
      "fileSize": 445750
    },
    "152": {
      "assetId": 152,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "153": {
      "assetId": 153,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "155": {
      "assetId": 155,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "156": {
      "assetId": 156,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "160": {
      "assetId": 160,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "161": {
      "assetId": 161,
      "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
      "durationMs": 38641,
      "fileSize": 270755
    },
    "162": {
      "assetId": 162,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "168": {
      "assetId": 168,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "169": {
      "assetId": 169,
      "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
      "durationMs": 5021,
      "fileSize": 35418
    },
    "170": {
      "assetId": 170,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "175": {
      "assetId": 175,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "176": {
      "assetId": 176,
      "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
      "durationMs": 3871,
      "fileSize": 27372
    },
    "177": {
      "assetId": 177,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "179": {
      "assetId": 179,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "180": {
      "assetId": 180,
      "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
      "durationMs": 38641,
      "fileSize": 270755
    },
    "181": {
      "assetId": 181,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "182": {
      "assetId": 182,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "183": {
      "assetId": 183,
      "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
      "durationMs": 5021,
      "fileSize": 35418
    },
    "184": {
      "assetId": 184,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "185": {
      "assetId": 185,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "186": {
      "assetId": 186,
      "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
      "durationMs": 3871,
      "fileSize": 27372
    },
    "187": {
      "assetId": 187,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "189": {
      "assetId": 189,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "190": {
      "assetId": 190,
      "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
      "durationMs": 38641,
      "fileSize": 270755
    },
    "191": {
      "assetId": 191,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "192": {
      "assetId": 192,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "193": {
      "assetId": 193,
      "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
      "durationMs": 5021,
      "fileSize": 35418
    },
    "194": {
      "assetId": 194,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "195": {
      "assetId": 195,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "196": {
      "assetId": 196,
      "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
      "durationMs": 3871,
      "fileSize": 27372
    },
    "197": {
      "assetId": 197,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "199": {
      "assetId": 199,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "200": {
      "assetId": 200,
      "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
      "durationMs": 38641,
      "fileSize": 270755
    },
    "201": {
      "assetId": 201,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "202": {
      "assetId": 202,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "203": {
      "assetId": 203,
      "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
      "durationMs": 5021,
      "fileSize": 35418
    },
    "204": {
      "assetId": 204,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "205": {
      "assetId": 205,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "206": {
      "assetId": 206,
      "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
      "durationMs": 3871,
      "fileSize": 27372
    },
    "207": {
      "assetId": 207,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "210": {
      "assetId": 210,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "211": {
      "assetId": 211,
      "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
      "durationMs": 38641,
      "fileSize": 270755
    },
    "212": {
      "assetId": 212,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "213": {
      "assetId": 213,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "214": {
      "assetId": 214,
      "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
      "durationMs": 5021,
      "fileSize": 35418
    },
    "215": {
      "assetId": 215,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "216": {
      "assetId": 216,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "217": {
      "assetId": 217,
      "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
      "durationMs": 3871,
      "fileSize": 27372
    },
    "218": {
      "assetId": 218,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "220": {
      "assetId": 220,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "221": {
      "assetId": 221,
      "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
      "durationMs": 38641,
      "fileSize": 270755
    },
    "222": {
      "assetId": 222,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "223": {
      "assetId": 223,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "224": {
      "assetId": 224,
      "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
      "durationMs": 5021,
      "fileSize": 35418
    },
    "225": {
      "assetId": 225,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "226": {
      "assetId": 226,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "227": {
      "assetId": 227,
      "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
      "durationMs": 3871,
      "fileSize": 27372
    },
    "228": {
      "assetId": 228,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "230": {
      "assetId": 230,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "231": {
      "assetId": 231,
      "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
      "durationMs": 38641,
      "fileSize": 270755
    },
    "232": {
      "assetId": 232,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "233": {
      "assetId": 233,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "234": {
      "assetId": 234,
      "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
      "durationMs": 5021,
      "fileSize": 35418
    },
    "235": {
      "assetId": 235,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "236": {
      "assetId": 236,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "237": {
      "assetId": 237,
      "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
      "durationMs": 3871,
      "fileSize": 27372
    },
    "238": {
      "assetId": 238,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "240": {
      "assetId": 240,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "241": {
      "assetId": 241,
      "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
      "durationMs": 38641,
      "fileSize": 270755
    },
    "242": {
      "assetId": 242,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "243": {
      "assetId": 243,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "244": {
      "assetId": 244,
      "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
      "durationMs": 5021,
      "fileSize": 35418
    },
    "245": {
      "assetId": 245,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "246": {
      "assetId": 246,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "247": {
      "assetId": 247,
      "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
      "durationMs": 3871,
      "fileSize": 27372
    },
    "248": {
      "assetId": 248,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "250": {
      "assetId": 250,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "251": {
      "assetId": 251,
      "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
      "durationMs": 38641,
      "fileSize": 270755
    },
    "252": {
      "assetId": 252,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "253": {
      "assetId": 253,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "254": {
      "assetId": 254,
      "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
      "durationMs": 5021,
      "fileSize": 35418
    },
    "255": {
      "assetId": 255,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "256": {
      "assetId": 256,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "257": {
      "assetId": 257,
      "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
      "durationMs": 3871,
      "fileSize": 27372
    },
    "258": {
      "assetId": 258,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "260": {
      "assetId": 260,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "261": {
      "assetId": 261,
      "url": "story_content/5vNv2K3cR8S_44100_56_0.mp3",
      "durationMs": 38641,
      "fileSize": 270755
    },
    "262": {
      "assetId": 262,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "263": {
      "assetId": 263,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "264": {
      "assetId": 264,
      "url": "story_content/5UvoGh4XtC4_44100_56_0.mp3",
      "durationMs": 5021,
      "fileSize": 35418
    },
    "265": {
      "assetId": 265,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "266": {
      "assetId": 266,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "267": {
      "assetId": 267,
      "url": "story_content/5cUdYjaXPBD_44100_56_0.mp3",
      "durationMs": 3871,
      "fileSize": 27372
    },
    "268": {
      "assetId": 268,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "270": {
      "assetId": 270,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "271": {
      "assetId": 271,
      "url": "story_content/6j9IobXfevk_44100_56_0.mp3",
      "durationMs": 63111,
      "fileSize": 442092
    },
    "276": {
      "assetId": 276,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "277": {
      "assetId": 277,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "278": {
      "assetId": 278,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "279": {
      "assetId": 279,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "280": {
      "assetId": 280,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "281": {
      "assetId": 281,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "282": {
      "assetId": 282,
      "url": "story_content/6qRbYJOwFU4_44100_56_0.mp3",
      "durationMs": 63431,
      "fileSize": 444287
    },
    "283": {
      "assetId": 283,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "284": {
      "assetId": 284,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "285": {
      "assetId": 285,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "287": {
      "assetId": 287,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "288": {
      "assetId": 288,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "296": {
      "assetId": 296,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "297": {
      "assetId": 297,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "298": {
      "assetId": 298,
      "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
      "durationMs": 861,
      "fileSize": 6344
    },
    "299": {
      "assetId": 299,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "300": {
      "assetId": 300,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "301": {
      "assetId": 301,
      "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
      "durationMs": 861,
      "fileSize": 6344
    },
    "302": {
      "assetId": 302,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "303": {
      "assetId": 303,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "304": {
      "assetId": 304,
      "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
      "durationMs": 861,
      "fileSize": 6344
    },
    "305": {
      "assetId": 305,
      "url": "story_content/6SsAariyI62_44100_56_0.mp3",
      "durationMs": 59722,
      "fileSize": 418321
    },
    "308": {
      "assetId": 308,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "309": {
      "assetId": 309,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "310": {
      "assetId": 310,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "311": {
      "assetId": 311,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "312": {
      "assetId": 312,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "313": {
      "assetId": 313,
      "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
      "durationMs": 861,
      "fileSize": 6344
    },
    "314": {
      "assetId": 314,
      "url": "story_content/6j9IobXfevk_44100_56_0.mp3",
      "durationMs": 63111,
      "fileSize": 442092
    },
    "315": {
      "assetId": 315,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "316": {
      "assetId": 316,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "317": {
      "assetId": 317,
      "url": "story_content/6VrGVxitHVs_44100_56_0.mp3",
      "durationMs": 28131,
      "fileSize": 197247
    },
    "337": {
      "assetId": 337,
      "url": "story_content/6ozfyPr3FNr_44100_56_0.mp3",
      "durationMs": 1802,
      "fileSize": 12927
    },
    "338": {
      "assetId": 338,
      "url": "story_content/6ozfyPr3FNr_44100_56_0.mp3",
      "durationMs": 1802,
      "fileSize": 12927
    },
    "339": {
      "assetId": 339,
      "url": "story_content/5jxbm5Im7Vd_44100_56_0.mp3",
      "durationMs": 972,
      "fileSize": 7075
    },
    "340": {
      "assetId": 340,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "341": {
      "assetId": 341,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "342": {
      "assetId": 342,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "343": {
      "assetId": 343,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "344": {
      "assetId": 344,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "345": {
      "assetId": 345,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "346": {
      "assetId": 346,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "347": {
      "assetId": 347,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "348": {
      "assetId": 348,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "349": {
      "assetId": 349,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "350": {
      "assetId": 350,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "351": {
      "assetId": 351,
      "url": "story_content/5vvn7Snmnr4_44100_56_0.mp3",
      "durationMs": 66611,
      "fileSize": 466595
    },
    "352": {
      "assetId": 352,
      "url": "story_content/5cCQsSaYl6g_44100_56_0.mp3",
      "durationMs": 7472,
      "fileSize": 52607
    },
    "353": {
      "assetId": 353,
      "url": "story_content/6OCl0RMljnW_44100_56_0.mp3",
      "durationMs": 11991,
      "fileSize": 84241
    },
    "355": {
      "assetId": 355,
      "url": "story_content/6DeuLJzk41Q_44100_56_0.mp3",
      "durationMs": 861,
      "fileSize": 6344
    },
    "356": {
      "assetId": 356,
      "url": "story_content/5WPKUcAEWAA_44100_56_0.mp3",
      "durationMs": 62152,
      "fileSize": 435327
    },
    "357": {
      "assetId": 357,
      "url": "story_content/6DT4nKlXYbB_44100_56_0.mp3",
      "durationMs": 4052,
      "fileSize": 28652
    },
    "358": {
      "assetId": 358,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "359": {
      "assetId": 359,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "360": {
      "assetId": 360,
      "url": "story_content/5wfUoLg3RiL_44100_56_0.mp3",
      "durationMs": 11571,
      "fileSize": 81315
    },
    "366": {
      "assetId": 366,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "367": {
      "assetId": 367,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "368": {
      "assetId": 368,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "369": {
      "assetId": 369,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "370": {
      "assetId": 370,
      "url": "story_content/679pv2NykUw_44100_56_0.mp3",
      "durationMs": 1442,
      "fileSize": 10367
    },
    "371": {
      "assetId": 371,
      "url": "story_content/5tluWyE6Cdx_44100_56_0.mp3",
      "durationMs": 941,
      "fileSize": 6892
    },
    "372": {
      "assetId": 372,
      "url": "story_content/6fP6CzyqyMk_44100_56_0.mp3",
      "durationMs": 133511,
      "fileSize": 934764
    },
    "373": {
      "assetId": 373,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "374": {
      "assetId": 374,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "375": {
      "assetId": 375,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    },
    "377": {
      "assetId": 377,
      "url": "story_content/6Tk6kUdjse4_44100_56_0.mp3",
      "durationMs": 5151,
      "fileSize": 36332
    },
    "378": {
      "assetId": 378,
      "url": "story_content/6cE4jPpZoR1_44100_56_0.mp3",
      "durationMs": 472,
      "fileSize": 3601
    }
  },
  "imageCatalog": {
    "1": {
      "assetId": 1,
      "url": "mobile/poster_5fW9LQF7to8_video_6nPjLwNxeE5_22_56_1280x720.jpg",
      "imageType": "normal",
      "width": 0,
      "height": 0,
      "fileSize": 143153
    },
    "2": {
      "assetId": 2,
      "url": "mobile/6Q69tvGOis4.gif",
      "imageType": "animatedgif",
      "width": 570,
      "height": 318,
      "fileSize": 3297183
    },
    "3": {
      "assetId": 3,
      "url": "mobile/5r8KdQdV9SH.png",
      "imageType": "normal",
      "width": 856,
      "height": 769,
      "fileSize": 2566738
    },
    "4": {
      "assetId": 4,
      "url": "mobile/6ZqJN7v5CWr.png",
      "imageType": "normal",
      "width": 1620,
      "height": 672,
      "fileSize": 1354771
    },
    "5": {
      "assetId": 5,
      "url": "mobile/65Vuggwqrb8_RG_P_436_0_231_164.gif",
      "imageType": "animatedgif",
      "width": 232,
      "height": 165,
      "fileSize": 151497
    },
    "6": {
      "assetId": 6,
      "url": "mobile/5WGLEVYzj2G.png",
      "imageType": "normal",
      "width": 514,
      "height": 212,
      "fileSize": 466117
    },
    "7": {
      "assetId": 7,
      "url": "mobile/6KFvI2w3gL9.png",
      "imageType": "normal",
      "width": 198,
      "height": 142,
      "fileSize": 62463
    },
    "8": {
      "assetId": 8,
      "url": "mobile/6I2HdKkSgG6.png",
      "imageType": "normal",
      "width": 180,
      "height": 137,
      "fileSize": 58667
    },
    "9": {
      "assetId": 9,
      "url": "mobile/6fBYfnad2Zd.png",
      "imageType": "normal",
      "width": 200,
      "height": 153,
      "fileSize": 60658
    },
    "10": {
      "assetId": 10,
      "url": "mobile/5rXZGGJH9iG.png",
      "imageType": "normal",
      "width": 160,
      "height": 135,
      "fileSize": 50825
    },
    "11": {
      "assetId": 11,
      "url": "mobile/6JVXCNVq6ai_P_649_0_704_270.png",
      "imageType": "normal",
      "width": 704,
      "height": 270,
      "fileSize": 251054
    },
    "12": {
      "assetId": 12,
      "url": "mobile/6nov80Jmg0Y_X.gif",
      "imageType": "animatedgif",
      "width": 254,
      "height": 224,
      "fileSize": 495067
    },
    "13": {
      "assetId": 13,
      "url": "mobile/5dCAlHC5W8Z.png",
      "imageType": "normal",
      "width": 184,
      "height": 128,
      "fileSize": 8457
    },
    "20": {
      "assetId": 20,
      "url": "mobile/Slide5op1WI5tdmw.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "21": {
      "assetId": 21,
      "url": "mobile/6EfvCxuLoY5.png",
      "imageType": "normal",
      "width": 1208,
      "height": 647,
      "fileSize": 390984
    },
    "22": {
      "assetId": 22,
      "url": "mobile/6ljF2bhskoS.png",
      "imageType": "normal",
      "width": 229,
      "height": 158,
      "fileSize": 63964
    },
    "25": {
      "assetId": 25,
      "url": "mobile/6qmYZKenWib.png",
      "imageType": "normal",
      "width": 1539,
      "height": 882,
      "fileSize": 380189
    },
    "28": {
      "assetId": 28,
      "url": "mobile/Slide6owjLh57ycC.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "29": {
      "assetId": 29,
      "url": "mobile/5ZAJjyZwSHr.png",
      "imageType": "normal",
      "width": 1181,
      "height": 659,
      "fileSize": 355387
    },
    "32": {
      "assetId": 32,
      "url": "mobile/Slide5znCNCeGBCx.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "33": {
      "assetId": 33,
      "url": "mobile/62oB2J2cBdW.png",
      "imageType": "normal",
      "width": 989,
      "height": 645,
      "fileSize": 13097
    },
    "34": {
      "assetId": 34,
      "url": "mobile/5cdUoSSngTY.png",
      "imageType": "normal",
      "width": 221,
      "height": 158,
      "fileSize": 60847
    },
    "35": {
      "assetId": 35,
      "url": "mobile/5hv8C0oRfrb.png",
      "imageType": "normal",
      "width": 282,
      "height": 506,
      "fileSize": 41986
    },
    "42": {
      "assetId": 42,
      "url": "mobile/Slide6GVz0uYzbxw.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "47": {
      "assetId": 47,
      "url": "mobile/5fE9gitG6bb.png",
      "imageType": "normal",
      "width": 1097,
      "height": 223,
      "fileSize": 108512
    },
    "48": {
      "assetId": 48,
      "url": "mobile/6EcL7dPjjHh.png",
      "imageType": "normal",
      "width": 1174,
      "height": 178,
      "fileSize": 972242
    },
    "57": {
      "assetId": 57,
      "url": "mobile/Slide68A1AJF7yjW.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "60": {
      "assetId": 60,
      "url": "mobile/6GK4OH9jOlj.png",
      "imageType": "normal",
      "width": 1168,
      "height": 357,
      "fileSize": 78757
    },
    "69": {
      "assetId": 69,
      "url": "mobile/Slide6oeoTamYR7D.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "72": {
      "assetId": 72,
      "url": "mobile/5X5KPiU9Isy.png",
      "imageType": "normal",
      "width": 1083,
      "height": 322,
      "fileSize": 107111
    },
    "81": {
      "assetId": 81,
      "url": "mobile/Slide6gJBrBvMnuS.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "85": {
      "assetId": 85,
      "url": "mobile/poster_6IvTTb86pVv_video_5gKzK4lbTf6_22_56_1280x720.jpg",
      "imageType": "normal",
      "width": 0,
      "height": 0,
      "fileSize": 365523
    },
    "87": {
      "assetId": 87,
      "url": "mobile/6UTk9YJ1Rv7.png",
      "imageType": "normal",
      "width": 200,
      "height": 143,
      "fileSize": 61339
    },
    "89": {
      "assetId": 89,
      "url": "mobile/Slide5jvmjYVwgcQ.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "90": {
      "assetId": 90,
      "url": "mobile/5cdUoSSngTY_Y.png",
      "imageType": "normal",
      "width": 221,
      "height": 158,
      "fileSize": 60425
    },
    "96": {
      "assetId": 96,
      "url": "mobile/Slide6QrkavOlv6I.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "97": {
      "assetId": 97,
      "url": "mobile/661nhMkxmjk.png",
      "imageType": "normal",
      "width": 548,
      "height": 170,
      "fileSize": 642008
    },
    "98": {
      "assetId": 98,
      "url": "mobile/5cdUoSSngTY_X.png",
      "imageType": "normal",
      "width": 221,
      "height": 158,
      "fileSize": 60726
    },
    "104": {
      "assetId": 104,
      "url": "mobile/6pYfGRfCfkW_B-10_R9BF2FF.png",
      "imageType": "normal",
      "width": 989,
      "height": 645,
      "fileSize": 12501
    },
    "114": {
      "assetId": 114,
      "url": "mobile/5nmvbLuGxeM.png",
      "imageType": "normal",
      "width": 1127,
      "height": 334,
      "fileSize": 98692
    },
    "145": {
      "assetId": 145,
      "url": "mobile/6FqvPwU4M4Q.png",
      "imageType": "normal",
      "width": 646,
      "height": 144,
      "fileSize": 104210
    },
    "154": {
      "assetId": 154,
      "url": "mobile/Slide6omEOGTRAbY.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "157": {
      "assetId": 157,
      "url": "mobile/Slide6OyJsyjTUqI.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "158": {
      "assetId": 158,
      "url": "mobile/5jk1lv5JqZM.png",
      "imageType": "normal",
      "width": 1017,
      "height": 503,
      "fileSize": 47481
    },
    "159": {
      "assetId": 159,
      "url": "mobile/5ewpLbxmMP5.png",
      "imageType": "normal",
      "width": 784,
      "height": 294,
      "fileSize": 79631
    },
    "163": {
      "assetId": 163,
      "url": "mobile/Slide6Yl1XmK7vDs.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "164": {
      "assetId": 164,
      "url": "mobile/64trbzmlqII.gif",
      "imageType": "animatedgif",
      "width": 200,
      "height": 200,
      "fileSize": 29435
    },
    "165": {
      "assetId": 165,
      "url": "mobile/6cVvYbugY8D_P_246_0_1299_405.png",
      "imageType": "normal",
      "width": 1299,
      "height": 405,
      "fileSize": 551001
    },
    "166": {
      "assetId": 166,
      "url": "mobile/5xIHoMB2ZC7.gif",
      "imageType": "animatedgif",
      "width": 254,
      "height": 300,
      "fileSize": 121387
    },
    "167": {
      "assetId": 167,
      "url": "mobile/6QxLg3NYlpt.png",
      "imageType": "normal",
      "width": 504,
      "height": 160,
      "fileSize": 596229
    },
    "171": {
      "assetId": 171,
      "url": "mobile/Slide6CCYce11Vkv.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "172": {
      "assetId": 172,
      "url": "mobile/6F5Z4MpnsdU.gif",
      "imageType": "animatedgif",
      "width": 500,
      "height": 500,
      "fileSize": 367231
    },
    "173": {
      "assetId": 173,
      "url": "mobile/5gkgaNEdBEt.png",
      "imageType": "normal",
      "width": 1141,
      "height": 388,
      "fileSize": 587194
    },
    "174": {
      "assetId": 174,
      "url": "mobile/5yMgs76yF4Y.gif",
      "imageType": "animatedgif",
      "width": 292,
      "height": 300,
      "fileSize": 119192
    },
    "178": {
      "assetId": 178,
      "url": "mobile/Slide5X3dTiLuyun.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "188": {
      "assetId": 188,
      "url": "mobile/Slide5yo2tQLf00F.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "198": {
      "assetId": 198,
      "url": "mobile/Slide6KW9BTxsrqH.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "208": {
      "assetId": 208,
      "url": "mobile/Slide5xh1Rw3OcNe.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "209": {
      "assetId": 209,
      "url": "mobile/6IQ01FMWzRp.png",
      "imageType": "normal",
      "width": 529,
      "height": 398,
      "fileSize": 92088
    },
    "219": {
      "assetId": 219,
      "url": "mobile/Slide5rA9s7guf32.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "229": {
      "assetId": 229,
      "url": "mobile/Slide5pz0QaovvXI.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "239": {
      "assetId": 239,
      "url": "mobile/Slide6lkiWE3E8ip.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "249": {
      "assetId": 249,
      "url": "mobile/Slide5wOgryCi9PZ.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "259": {
      "assetId": 259,
      "url": "mobile/Slide61QwsfBQyAQ.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "269": {
      "assetId": 269,
      "url": "mobile/Slide6EkMdNHlhuq.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "272": {
      "assetId": 272,
      "url": "mobile/5wHjJTgBBpW.png",
      "imageType": "normal",
      "width": 488,
      "height": 152,
      "fileSize": 172809
    },
    "273": {
      "assetId": 273,
      "url": "mobile/5s6NWFwiK9z.png",
      "imageType": "normal",
      "width": 941,
      "height": 260,
      "fileSize": 404595
    },
    "274": {
      "assetId": 274,
      "url": "mobile/5hwJucP8a1A.png",
      "imageType": "normal",
      "width": 958,
      "height": 672,
      "fileSize": 795147
    },
    "275": {
      "assetId": 275,
      "url": "mobile/6Z7ek63QC1F.png",
      "imageType": "normal",
      "width": 941,
      "height": 249,
      "fileSize": 385726
    },
    "286": {
      "assetId": 286,
      "url": "mobile/Slide6QITAEn8GDc.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "289": {
      "assetId": 289,
      "url": "mobile/Slide5sKRbJGYSxp.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "290": {
      "assetId": 290,
      "url": "mobile/6USmgcHO6qe.png",
      "imageType": "normal",
      "width": 250,
      "height": 416,
      "fileSize": 158715
    },
    "291": {
      "assetId": 291,
      "url": "mobile/63q9ywMxP2X.png",
      "imageType": "normal",
      "width": 270,
      "height": 242,
      "fileSize": 128384
    },
    "292": {
      "assetId": 292,
      "url": "mobile/5mooWrkgV9C.png",
      "imageType": "normal",
      "width": 190,
      "height": 397,
      "fileSize": 130178
    },
    "293": {
      "assetId": 293,
      "url": "mobile/6LOjHAsXoJZ.png",
      "imageType": "normal",
      "width": 273,
      "height": 272,
      "fileSize": 140268
    },
    "294": {
      "assetId": 294,
      "url": "mobile/6iRLqPu2poe.png",
      "imageType": "normal",
      "width": 241,
      "height": 416,
      "fileSize": 158869
    },
    "295": {
      "assetId": 295,
      "url": "mobile/5ftaDySNgbZ.png",
      "imageType": "normal",
      "width": 272,
      "height": 250,
      "fileSize": 134888
    },
    "306": {
      "assetId": 306,
      "url": "mobile/Slide5WPRbcJDCqY.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "307": {
      "assetId": 307,
      "url": "mobile/5fD3uOAkxBz.png",
      "imageType": "normal",
      "width": 442,
      "height": 128,
      "fileSize": 654388
    },
    "318": {
      "assetId": 318,
      "url": "mobile/6PFU9CSOUPJ.gif",
      "imageType": "animatedgif",
      "width": 660,
      "height": 371,
      "fileSize": 1596584
    },
    "319": {
      "assetId": 319,
      "url": "mobile/6f5CYdEJRLG.gif",
      "imageType": "animatedgif",
      "width": 350,
      "height": 350,
      "fileSize": 8987
    },
    "320": {
      "assetId": 320,
      "url": "mobile/6oOnHqMcEc4_P_0_585_800_124.png",
      "imageType": "normal",
      "width": 800,
      "height": 124,
      "fileSize": 195020
    },
    "321": {
      "assetId": 321,
      "url": "mobile/6Hxt2bPxv63.png",
      "imageType": "normal",
      "width": 562,
      "height": 378,
      "fileSize": 717990
    },
    "322": {
      "assetId": 322,
      "url": "mobile/5lksIr96jvp.png",
      "imageType": "normal",
      "width": 552,
      "height": 366,
      "fileSize": 724924
    },
    "323": {
      "assetId": 323,
      "url": "mobile/5ikz4u4OaSa_X_P_32_17_203_262.gif",
      "imageType": "animatedgif",
      "width": 204,
      "height": 263,
      "fileSize": 134136
    },
    "324": {
      "assetId": 324,
      "url": "mobile/Shape6m98yfUO1Iq.png",
      "imageType": "normal",
      "width": 392,
      "height": 190,
      "fileSize": 0
    },
    "325": {
      "assetId": 325,
      "url": "mobile/6hdYjh8cDDa_XY_P_0_0_600_532.png",
      "imageType": "normal",
      "width": 600,
      "height": 532,
      "fileSize": 35477
    },
    "326": {
      "assetId": 326,
      "url": "mobile/5ikz4u4OaSa_P_32_17_203_262.gif",
      "imageType": "animatedgif",
      "width": 204,
      "height": 263,
      "fileSize": 134184
    },
    "327": {
      "assetId": 327,
      "url": "mobile/Shape6UnzsbRA93h.png",
      "imageType": "normal",
      "width": 345,
      "height": 176,
      "fileSize": 0
    },
    "328": {
      "assetId": 328,
      "url": "mobile/6hdYjh8cDDa_Y_P_0_0_600_532.png",
      "imageType": "normal",
      "width": 600,
      "height": 532,
      "fileSize": 35293
    },
    "329": {
      "assetId": 329,
      "url": "mobile/Shape6bSyd1h1Gob.png",
      "imageType": "normal",
      "width": 362,
      "height": 169,
      "fileSize": 0
    },
    "330": {
      "assetId": 330,
      "url": "mobile/Shape6T8SRIgndxx.png",
      "imageType": "normal",
      "width": 362,
      "height": 169,
      "fileSize": 0
    },
    "331": {
      "assetId": 331,
      "url": "mobile/Shape6FhYG5g0Way.png",
      "imageType": "normal",
      "width": 362,
      "height": 169,
      "fileSize": 0
    },
    "332": {
      "assetId": 332,
      "url": "mobile/Shape6FS6WcQAv0B.png",
      "imageType": "normal",
      "width": 362,
      "height": 169,
      "fileSize": 0
    },
    "333": {
      "assetId": 333,
      "url": "mobile/Shape5rdG8E4Q1fh.png",
      "imageType": "normal",
      "width": 362,
      "height": 169,
      "fileSize": 0
    },
    "334": {
      "assetId": 334,
      "url": "mobile/Shape6aMuaPe3mDN.png",
      "imageType": "normal",
      "width": 362,
      "height": 152,
      "fileSize": 0
    },
    "335": {
      "assetId": 335,
      "url": "mobile/Shape66FKtxZNQMC.png",
      "imageType": "normal",
      "width": 362,
      "height": 169,
      "fileSize": 0
    },
    "336": {
      "assetId": 336,
      "url": "mobile/Shape6BbAY0tdgT2.png",
      "imageType": "normal",
      "width": 362,
      "height": 169,
      "fileSize": 0
    },
    "354": {
      "assetId": 354,
      "url": "mobile/Slide6r3TAL6GVOt.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "361": {
      "assetId": 361,
      "url": "mobile/6VpxF5tzDfS.png",
      "imageType": "normal",
      "width": 612,
      "height": 205,
      "fileSize": 88673
    },
    "362": {
      "assetId": 362,
      "url": "mobile/5b7bpGxEsZl.png",
      "imageType": "normal",
      "width": 714,
      "height": 304,
      "fileSize": 495242
    },
    "363": {
      "assetId": 363,
      "url": "mobile/6EhjX1oYXWn.png",
      "imageType": "normal",
      "width": 616,
      "height": 243,
      "fileSize": 243981
    },
    "364": {
      "assetId": 364,
      "url": "mobile/6kd8fv3DWt3.png",
      "imageType": "normal",
      "width": 116,
      "height": 101,
      "fileSize": 51122
    },
    "365": {
      "assetId": 365,
      "url": "mobile/5yFZRb2SQSU.png",
      "imageType": "normal",
      "width": 627,
      "height": 205,
      "fileSize": 211254
    },
    "376": {
      "assetId": 376,
      "url": "mobile/Slide6kOcLT0fs6c.png",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 0
    },
    "379": {
      "assetId": 379,
      "url": "mobile/5maQz6EtJQu5eRveoLDcvv{Width=1280, Height=720}Light.jpg",
      "imageType": "normal",
      "width": 1280,
      "height": 720,
      "fileSize": 20430
    }
  },
  "variables": [
    {
      "name": "QuizAdvanceModeWarningShown",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "CurrentQuiz_6mxkFyRe2qp",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "CurrentQuiz_5mlujekLxKf",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "CurrentQuiz_6E4jhwVoSbS",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "CurrentQuiz_5VfB5tnVfdk",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "CurrentQuiz_6STBhdYCyxL",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "CurrentQuiz_5qCsT5pHbQn",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "CurrentQuiz_6cG19pW7V7M",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "CurrentQuiz_6l1kGROde3h",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "CurrentQuiz_6n6C2g1VcPu",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "CurrentQuiz_5g31gd1iQ7v",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "CurrentQuiz_5adK7zG5F1d",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "TextEntry1",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "TextEntry3",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "TextEntry4",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "TextEntry5",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "cek_login",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "poin",
      "type": "number",
      "defaultValue": 0,
      "resume": true
    },
    {
      "name": "suara_aktif",
      "type": "boolean",
      "defaultValue": true,
      "resume": true
    },
    {
      "name": "LastSlideViewed_5jpgil4RGjK",
      "type": "string",
      "defaultValue": "_player.5sAEMI5psmg.6AR4SV4ZYat",
      "resume": true
    },
    {
      "name": "6AR4SV4ZYat_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5ml7jyaiXGc_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5dLAzY4SKGI_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6XQ2Lfxmzw1_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5y0cYcWaZ3N_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5iWbenzMEWM_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6IgV5Xf2ecV_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5jTlwgcUi8o_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6AtIwHwQnjq_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5zwBwMPydB6_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6rj9XvcPk4j_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "60qqSfn2Gy4_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "69u2IVtFccK_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6lLQh7AsdfG_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5wmBV8vjFPm_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6VGgu6tqinV_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6rO2Rjnvtcl_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5g85v9o85Yb_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "62u9PmQKgzB_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5o4GAEeLE09_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6VYnewFze63_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "69cSEO6heKU_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6mhmEQSWIJZ_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5UlnwWVKUrp_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_5mlujekLxKf",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6oOWqUyP2WL_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_6E4jhwVoSbS",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6fJRLUtSDVL_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_5VfB5tnVfdk",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6V8v7yM3VzE_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_6STBhdYCyxL",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6TsqDEfppnq_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_5qCsT5pHbQn",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5tNzQg4qrZn_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_6cG19pW7V7M",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5udKoy5uKgm_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_6l1kGROde3h",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6PxxtyG4oap_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_6n6C2g1VcPu",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5eaO0Lz8ZMk_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_5g31gd1iQ7v",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6SKvjji8cdv_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_5adK7zG5F1d",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5a8YIrSITc8_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_5kfCbgzYJo4",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6ddgVMlBGEg_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6eHtnAfM3bY_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "604TQFYNuzG_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6EA329REfHb_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6FkRXfgJQkY_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_6mxkFyRe2qp",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6G1VrKuOhCw_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "ReviewMode_6mgEHWuqrFS",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6WIqLhHr1Cm_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "6OrD7bra4Ko_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "5iew2M44w24_RetryModeInteractionIncompleteOnLoad",
      "type": "boolean",
      "defaultValue": false,
      "resume": true
    },
    {
      "name": "PrintPromptWindowQuizVar_5rbHN3NonCQ",
      "type": "string",
      "defaultValue": "",
      "resume": true
    },
    {
      "name": "PrintPromptUsername_5rbHN3NonCQ",
      "type": "string",
      "defaultValue": "",
      "resume": true
    }
  ]
};

export default defaultContent;
