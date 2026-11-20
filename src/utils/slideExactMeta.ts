import type { SlideContentItem } from '../data/defaultContent';

export type SlideCategoryType =
  | 'materi'
  | 'pembuka'
  | 'tur360'
  | 'gim'
  | 'kuis'
  | 'menu'
  | 'hasil';

export interface SlideSmartMeta {
  slideId: string;
  slideNumber: number;
  smartTitle: string;
  category: SlideCategoryType;
  subTopic: string;
  materiOrder?: number;
  smartSummary: string;
  backgroundUrl: string | null;
  webObjectUrl?: string | null;
}

export interface ExactStageObject {
  id: string;
  kind: string;
  xPos: number;
  yPos: number;
  width: number;
  height: number;
  depth: number;
  imageUrl: string | null;
  shapeCommandSetId: string | null;
  textCommandSetId: string | null;
  altText: string;
  webUrl: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
}

export interface ExactSlideRuntimeData {
  slideId: string;
  width: number;
  height: number;
  backgroundUrl: string | null;
  objects: ExactStageObject[];
  pathsLib: Record<string, any>;
}

export interface GarudaBirdQuestionSpec {
  questionNumber: number;
  birdId: string;
  textObjId: string;
  commandSetId: string;
  defaultText: string;
  defaultLines: string[];
  defaultTarget: 'Budaya yang Benar' | 'Budaya yang Salah';
  defaultTargetId: '6YRB5UIjNas' | '5uLET0cr0nZ';
  defaultPoints: number;
  topic: string;
  imageUrl: string;
}

export const GARUDA_DROP_TARGETS = {
  BENAR_ID: '6YRB5UIjNas' as const,
  SALAH_ID: '5uLET0cr0nZ' as const,
  BENAR_LABEL: 'Budaya yang Benar' as const,
  SALAH_LABEL: 'Budaya yang Salah' as const,
  BENAR_COMMANDSET: 'commandset-341',
  SALAH_COMMANDSET: 'commandset-345',
};

/**
 * Complete, audited catalog of all 10 Draggable Bird Questions on Slide 40 (`6G1VrKuOhCw` — Game Anak Garuda).
 * Extracted directly from `html5/data/js/6G1VrKuOhCw.js` and `html5/data/js/paths.js`.
 */
export const GARUDA_BIRD_QUESTIONS: GarudaBirdQuestionSpec[] = [
  {
    questionNumber: 1,
    birdId: '6XfIWrI4Giy',
    textObjId: '6PmmLlA3BUm',
    commandSetId: 'commandset-349',
    defaultText:
      'saya harus menghargai ketika orang lain berbicara bahasa daerahnya',
    defaultLines: [
      'saya harus menghargai ',
      'ketika orang lain berbicara ',
      'bahasa daerahnya',
    ],
    defaultTarget: 'Budaya yang Benar',
    defaultTargetId: '6YRB5UIjNas',
    defaultPoints: 10,
    topic: 'Sikap Bahasa Daerah',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
  {
    questionNumber: 2,
    birdId: '6JvyeweLFyt',
    textObjId: '5h0p9KUFVsV',
    commandSetId: 'commandset-353',
    defaultText:
      'tidak suka alat musik gamelan karena berisik di telinga saya',
    defaultLines: [
      'tidak suka alat musik ',
      'gamelan karena berisik di ',
      'telinga saya',
    ],
    defaultTarget: 'Budaya yang Salah',
    defaultTargetId: '5uLET0cr0nZ',
    defaultPoints: 10,
    topic: 'Sikap Alat Musik Daerah',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
  {
    questionNumber: 3,
    birdId: '6limMUc3hxJ',
    textObjId: '5fdyc47zgAM',
    commandSetId: 'commandset-356',
    defaultText: 'menjaga pakaian adat yang kita miliki',
    defaultLines: ['menjaga pakaian adat yang ', 'kita miliki'],
    defaultTarget: 'Budaya yang Benar',
    defaultTargetId: '6YRB5UIjNas',
    defaultPoints: 10,
    topic: 'Sikap Pakaian Adat',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
  {
    questionNumber: 4,
    birdId: '6jWyZbf56OG',
    textObjId: '6nUqJmLjuQl',
    commandSetId: 'commandset-359',
    defaultText: 'Bangga terhadap keberagaman yang ada di Indonesia',
    defaultLines: ['Bangga terhadap ', 'keberagaman yang ada di ', 'Indonesia'],
    defaultTarget: 'Budaya yang Benar',
    defaultTargetId: '6YRB5UIjNas',
    defaultPoints: 10,
    topic: 'Kebanggaan Keberagaman',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
  {
    questionNumber: 5,
    birdId: '667DkO0X4Ap',
    textObjId: '6U30Zh8t5Tk',
    commandSetId: 'commandset-361',
    defaultText: 'tidak mau tau senjata tradisional daerah lain',
    defaultLines: ['tidak mau tau senjata ', 'tradisional daerah lain'],
    defaultTarget: 'Budaya yang Salah',
    defaultTargetId: '5uLET0cr0nZ',
    defaultPoints: 10,
    topic: 'Sikap Senjata Tradisional',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
  {
    questionNumber: 6,
    birdId: '5jJyJQ5Uht8',
    textObjId: '6oPQdY3JV4d',
    commandSetId: 'commandset-363',
    defaultText: 'keragaman budaya dapat memecah belah persatuan Indonesia',
    defaultLines: [
      'keragaman budaya dapat ',
      'memecah belah persatuan ',
      'Indonesia',
    ],
    defaultTarget: 'Budaya yang Salah',
    defaultTargetId: '5uLET0cr0nZ',
    defaultPoints: 10,
    topic: 'Persatuan & Kesatuan',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
  {
    questionNumber: 7,
    birdId: '6P6IRWjp98P',
    textObjId: '5ZZO56PNDaL',
    commandSetId: 'commandset-364',
    defaultText: 'tidak suka mendengar musik dari daerah lain',
    defaultLines: ['tidak suka mendengar ', 'musik dari daerah lain'],
    defaultTarget: 'Budaya yang Salah',
    defaultTargetId: '5uLET0cr0nZ',
    defaultPoints: 10,
    topic: 'Sikap Lagu & Musik Daerah',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
  {
    questionNumber: 8,
    birdId: '5prOTedzzbR',
    textObjId: '6l3BVdcEP3S',
    commandSetId: 'commandset-367',
    defaultText: 'keragaman budaya menjadi daya tarik wisata Indonesia',
    defaultLines: [
      'keragaman budaya menjadi ',
      'daya tarik wisata Indonesia',
    ],
    defaultTarget: 'Budaya yang Benar',
    defaultTargetId: '6YRB5UIjNas',
    defaultPoints: 10,
    topic: 'Daya Tarik Budaya',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
  {
    questionNumber: 9,
    birdId: '6Tz1C4dfw77',
    textObjId: '6qAvA99AbtK',
    commandSetId: 'commandset-369',
    defaultText: 'mau belajar tarian daerah lain',
    defaultLines: ['mau belajar tarian daerah ', 'lain'],
    defaultTarget: 'Budaya yang Benar',
    defaultTargetId: '6YRB5UIjNas',
    defaultPoints: 10,
    topic: 'Sikap Tari Tradisional',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
  {
    questionNumber: 10,
    birdId: '69rLgopor0f',
    textObjId: '5smqyHWpI8t',
    commandSetId: 'commandset-370',
    defaultText: 'rumah adat saya lebih bagus daripada rumah adat daerah lain',
    defaultLines: [
      'rumah adat saya lebih bagus ',
      'daripada rumah adat daerah ',
      'lain',
    ],
    defaultTarget: 'Budaya yang Salah',
    defaultTargetId: '5uLET0cr0nZ',
    defaultPoints: 10,
    topic: 'Sikap Rumah Adat',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
];

/**
 * Smartly normalizes any 360° or web embed input (raw URL, domain without https://,
 * pasted <iframe src="..."> tag, or YouTube watch/short link) into a valid embeddable URL
 * identical in behavior to Slide 8 (5jTlwgcUi8o).
 */
export function normalizeSmartEmbedUrl(
  rawInput?: string | null,
  fallbackUrl = 'https://faryzt.github.io/starla-360/'
): string {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return fallbackUrl;

  // 1. If admin pasted a full <iframe ... src="..."> HTML snippet, extract src attribute
  if (trimmed.toLowerCase().includes('<iframe')) {
    const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch?.[1]) {
      return normalizeSmartEmbedUrl(srcMatch[1], fallbackUrl);
    }
  }

  let url = trimmed;

  // 2. If domain was typed without protocol (e.g. faryzt.github.io/starla-360/ or www.example.com)
  if (
    !/^(https?:\/\/|\/|data:|blob:|mobile\/|story_content\/|html5\/)/i.test(url)
  ) {
    if (url.startsWith('//')) {
      url = `https:${url}`;
    } else if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(url)) {
      url = `https://${url}`;
    }
  }

  // 3. Convert YouTube watch or youtu.be links into embeddable /embed/ URLs
  const ytWatchMatch = url.match(
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/i
  );
  if (ytWatchMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytWatchMatch[1]}`;
  }
  const ytShortMatch = url.match(
    /^https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{6,})/i
  );
  if (ytShortMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytShortMatch[1]}`;
  }

  return url;
}

/**
 * Preset button images available in Starla Budaya for creating or replacing Image Buttons
 * (e.g. Tombol Navigasi 360° Budaya, Tombol Kembali Slide 8, or Tombol Materi).
 */
export const STARLA_BUTTON_PRESETS: Array<{
  id: string;
  label: string;
  imageUrl: string;
}> = [
  {
    id: 'btn-360-icon',
    label: 'Ikon Navigasi / Tur 360°',
    imageUrl: 'mobile/5dCAlHC5W8Z.png',
  },
  {
    id: 'btn-slide8-back',
    label: 'Tombol Kembali Asli (Slide 8 / 360°)',
    imageUrl: 'mobile/6UTk9YJ1Rv7.png',
  },
  {
    id: 'btn-starla-char',
    label: 'Karakter Starla Budaya',
    imageUrl: 'mobile/5hv8C0oRfrb.png',
  },
  {
    id: 'btn-garuda-badge',
    label: 'Lencana Anak Garuda',
    imageUrl: 'mobile/6Hxt2bPxv63.png',
  },
  {
    id: 'btn-bird-anim',
    label: 'Animasi Burung Starla',
    imageUrl: 'mobile/6Q69tvGOis4.gif',
  },
  {
    id: 'btn-nusantara-1',
    label: 'Ikon Rumah & Adat',
    imageUrl: 'mobile/5r8KdQdV9SH.png',
  },
  {
    id: 'btn-nusantara-2',
    label: 'Ikon Pakaian Budaya',
    imageUrl: 'mobile/62oB2J2cBdW.png',
  },
];

/**
 * Database Pilihan Backsound Musik Latar Starla Budaya Nusantara (diambil dari aset asli story_content/).
 */
export interface AudioCatalogOption {
  id: string;
  label: string;
  url: string;
  category: 'backsound' | 'voiceover' | 'sfx';
  durationLabel: string;
}

export const STARLA_BACKSOUND_CATALOG: AudioCatalogOption[] = [
  {
    id: 'bs-harmoni-utama',
    label: 'Harmoni Nusantara Utama (Musik Ceria Starla)',
    url: 'story_content/6fP6CzyqyMk_44100_56_0.mp3',
    category: 'backsound',
    durationLabel: '02:13',
  },
  {
    id: 'bs-eksplorasi-budaya',
    label: 'Alunan Eksplorasi Budaya Indonesia (Musik Materi)',
    url: 'story_content/5kRUm7Nir2B_44100_56_0.mp3',
    category: 'backsound',
    durationLabel: '01:03',
  },
  {
    id: 'bs-iringan-tradisional',
    label: 'Iringan Musik Tradisional Nusantara',
    url: 'story_content/5ZYCAe9VtmT_44100_56_0.mp3',
    category: 'backsound',
    durationLabel: '00:20',
  },
  {
    id: 'bs-jingle-petualangan',
    label: 'Jingle Pembuka Petualangan Budaya',
    url: 'story_content/6Zh1DGetjr4_44100_56_0.mp3',
    category: 'backsound',
    durationLabel: '00:07',
  },
  {
    id: 'bs-melodi-ambient',
    label: 'Melodi Ambient Halaman Materi',
    url: 'story_content/6Tk6kUdjse4_44100_56_0.mp3',
    category: 'backsound',
    durationLabel: '00:05',
  },
];

/**
 * Database Pilihan Voice Over Narasi Starla Budaya.
 */
export const STARLA_VOICEOVER_CATALOG: AudioCatalogOption[] = [
  {
    id: 'vo-none',
    label: 'Tanpa Voice Over Tambahan',
    url: '',
    category: 'voiceover',
    durationLabel: '-',
  },
  {
    id: 'vo-sambutan-starla',
    label: 'VO Sambutan Selamat Datang di Starla Budaya',
    url: 'story_content/6k7JPOlasPL_44100_56_0.mp3',
    category: 'voiceover',
    durationLabel: 'Narasi',
  },
  {
    id: 'vo-pengantar-budaya',
    label: 'VO Pengantar Keragaman Budaya Indonesia',
    url: 'story_content/6ovJchPVZxx_44100_56_0.mp3',
    category: 'voiceover',
    durationLabel: '00:10',
  },
  {
    id: 'vo-menghargai-budaya',
    label: 'VO Cara Menghargai Keragaman Budaya Daerah',
    url: 'story_content/6apy3oZfWFX_44100_56_0.mp3',
    category: 'voiceover',
    durationLabel: '00:12',
  },
  {
    id: 'vo-bahasa-daerah',
    label: 'VO Eksplorasi Bahasa Daerah Nusantara',
    url: 'story_content/6Tk6kUdjse4_44100_56_0.mp3',
    category: 'voiceover',
    durationLabel: 'Narasi',
  },
  {
    id: 'vo-rumah-adat',
    label: 'VO Eksplorasi Rumah Adat & Pakaian Adat',
    url: 'story_content/6Zh1DGetjr4_44100_56_0.mp3',
    category: 'voiceover',
    durationLabel: 'Narasi',
  },
];

/**
 * Database Pilihan Sound Efek Tombol UI Terbaik (Kombinasi MP3 Asli Starla + Studio Web Audio Synthesizer).
 */
export const STARLA_SFX_CATALOG: AudioCatalogOption[] = [
  {
    id: 'sfx-starla-click',
    label: '✨ Klik Tombol Asli Starla Budaya (Original Pop)',
    url: 'story_content/6cE4jPpZoR1_44100_56_0.mp3',
    category: 'sfx',
    durationLabel: '0.4s',
  },
  {
    id: 'sfx-starla-nav',
    label: '🔔 Navigasi Slide Starla (Original Chime)',
    url: 'story_content/6DeuLJzk41Q_44100_56_0.mp3',
    category: 'sfx',
    durationLabel: '0.8s',
  },
  {
    id: 'sfx-starla-menu',
    label: '🎵 Interaksi Menu Starla (Original Tone)',
    url: 'story_content/5tluWyE6Cdx_44100_56_0.mp3',
    category: 'sfx',
    durationLabel: '0.9s',
  },
  {
    id: 'sfx-crystal-click',
    label: '💎 Studio Crystal Click (Modern UI Crisp)',
    url: 'sfx:click-crystal',
    category: 'sfx',
    durationLabel: 'Instan',
  },
  {
    id: 'sfx-pop-nusantara',
    label: '🫧 Studio Pop Bubble (Halus & Responsif)',
    url: 'sfx:pop-nusantara',
    category: 'sfx',
    durationLabel: 'Instan',
  },
  {
    id: 'sfx-gamelan-chime',
    label: '🎶 Studio Gamelan Chime (Nada Pentatonik Emas)',
    url: 'sfx:chime-gamelan',
    category: 'sfx',
    durationLabel: 'Instan',
  },
  {
    id: 'sfx-whoosh-magic',
    label: '🚀 Studio Whoosh Transisi (Buka Popup / Slide)',
    url: 'sfx:whoosh-magic',
    category: 'sfx',
    durationLabel: 'Instan',
  },
  {
    id: 'sfx-success-fanfare',
    label: '🏆 Studio Fanfare Berhasil (Kuis / Benar)',
    url: 'sfx:success-fanfare',
    category: 'sfx',
    durationLabel: 'Instan',
  },
  {
    id: 'sfx-hover-soft',
    label: '🪶 Studio Hover Tick (Efek Sentuh Halus)',
    url: 'sfx:hover-soft',
    category: 'sfx',
    durationLabel: 'Instan',
  },
  {
    id: 'sfx-none',
    label: '🔇 Tanpa Efek Suara',
    url: '',
    category: 'sfx',
    durationLabel: '-',
  },
];

/**
 * Database Pilihan Background Gambar Slide Bawaan Starla Budaya.
 */
export const STARLA_BACKGROUND_PRESETS: Array<{
  id: string;
  label: string;
  imageUrl: string;
}> = [
  {
    id: 'bg-malam-nusantara',
    label: 'Latar Biru Nusantara (Menu & 360°)',
    imageUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  {
    id: 'bg-panggung-budaya',
    label: 'Latar Panggung Budaya Nusantara',
    imageUrl: 'mobile/Slide6r3TAL6GVOt.jpg',
  },
  {
    id: 'bg-ruang-materi',
    label: 'Latar Ruang Materi Starla Budaya',
    imageUrl: 'mobile/Slide6kOcLT0fs6c.png',
  },
  {
    id: 'bg-cerah-eksplorasi',
    label: 'Latar Cerah Eksplorasi Budaya',
    imageUrl: 'mobile/5maQz6EtJQu5eRveoLDcvv{Width=1280, Height=720}Light.jpg',
  },
  {
    id: 'bg-langit-garuda',
    label: 'Latar Petualangan Anak Garuda',
    imageUrl: 'mobile/5s6NWFwiK9z.png',
  },
  {
    id: 'bg-taman-starla',
    label: 'Latar Taman Budaya Starla',
    imageUrl: 'mobile/6Z7ek63QC1F.png',
  },
];

let sharedAudioCtx: AudioContext | null = null;
let currentPreviewAudio: HTMLAudioElement | null = null;

export function stopPreviewAudio(): void {
  if (currentPreviewAudio) {
    try {
      currentPreviewAudio.pause();
      currentPreviewAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentPreviewAudio = null;
  }
}

/**
 * Plays either an MP3/DataURL audio file or a zero-latency Web Audio API synthesized studio sound effect.
 */
export function playStudioSoundEffect(
  sfxUrlOrPreset: string | undefined | null,
  volume = 0.75
): HTMLAudioElement | null {
  if (!sfxUrlOrPreset || sfxUrlOrPreset === 'none' || typeof window === 'undefined') {
    return null;
  }

  if (sfxUrlOrPreset.startsWith('sfx:')) {
    try {
      const AudioContextCtor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return null;
      if (!sharedAudioCtx) {
        sharedAudioCtx = new AudioContextCtor();
      }
      if (sharedAudioCtx.state === 'suspended') {
        void sharedAudioCtx.resume();
      }
      const ctx = sharedAudioCtx;
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(Math.max(0.05, Math.min(1, volume)), now);
      masterGain.connect(ctx.destination);

      if (sfxUrlOrPreset === 'sfx:hover-soft') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.045);
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (sfxUrlOrPreset === 'sfx:click-crystal') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1240, now + 0.08);
        g.gain.setValueAtTime(0.45, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.095);
      } else if (sfxUrlOrPreset === 'sfx:pop-nusantara') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.11);
        g.gain.setValueAtTime(0.5, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.125);
      } else if (sfxUrlOrPreset === 'sfx:chime-gamelan') {
        // Pentatonic Slendro/Pelog inspired chime chord
        const freqs = [587.33, 659.25, 880, 1174.66];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          const t0 = now + idx * 0.055;
          osc.frequency.setValueAtTime(f, t0);
          g.gain.setValueAtTime(0.32, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.42);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(t0);
          osc.stop(t0 + 0.44);
        });
      } else if (sfxUrlOrPreset === 'sfx:whoosh-magic') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        g.gain.setValueAtTime(0.38, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.21);
      } else if (sfxUrlOrPreset === 'sfx:success-fanfare') {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle';
          const t0 = now + idx * 0.07;
          osc.frequency.setValueAtTime(f, t0);
          g.gain.setValueAtTime(0.35, t0);
          g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(t0);
          osc.stop(t0 + 0.36);
        });
      }
    } catch {
      // ignore Web Audio errors
    }
    return null;
  }

  try {
    stopPreviewAudio();
    const normalizedUrl =
      sfxUrlOrPreset.startsWith('http') ||
      sfxUrlOrPreset.startsWith('data:') ||
      sfxUrlOrPreset.startsWith('/')
        ? sfxUrlOrPreset
        : `/${sfxUrlOrPreset}`;
    const audio = new Audio(normalizedUrl);
    audio.volume = Math.max(0.05, Math.min(1, volume));
    currentPreviewAudio = audio;
    void audio.play().catch(() => {});
    return audio;
  } catch {
    return null;
  }
}

/**
 * Complete, audited catalog of all 43 Articulate Storyline slides in Starla Budaya.
 */
export const SLIDE_EXACT_META: Record<string, SlideSmartMeta> = {
  '6AR4SV4ZYat': {
    slideId: '6AR4SV4ZYat',
    slideNumber: 1,
    smartTitle: 'Video Pembuka (Trailer Starla Budaya)',
    category: 'pembuka',
    subTopic: 'Pembuka & Pengenalan',
    smartSummary:
      'Tayangan video animasi pembuka (Trailer Starla Budaya) sebelum masuk ke halaman login siswa.',
    backgroundUrl: 'mobile/poster_5fW9LQF7to8_video_6nPjLwNxeE5_22_56_1280x720.jpg',
  },
  '5ml7jyaiXGc': {
    slideId: '5ml7jyaiXGc',
    slideNumber: 2,
    smartTitle: 'Halaman Masuk Siswa (Input Nama & Sekolah)',
    category: 'pembuka',
    subTopic: 'Identitas Siswa',
    smartSummary:
      'Formulir interaktif bagi siswa untuk mengisi Nama Lengkap dan Nama Sekolah sebelum memulai petualangan budaya.',
    backgroundUrl: 'mobile/6Q69tvGOis4.gif',
  },
  '5dLAzY4SKGI': {
    slideId: '5dLAzY4SKGI',
    slideNumber: 3,
    smartTitle: 'Selamat Datang & Perkenalan Karakter Starla',
    category: 'pembuka',
    subTopic: 'Sambutan Starla',
    smartSummary:
      'Selamat Datang di Starla Budaya! Sebelum kita belajar dan bermain, kenalan dulu yuk bersama Starla — Studi Pelajar Pancasila Kita Semua Bersaudara.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '6XQ2Lfxmzw1': {
    slideId: '6XQ2Lfxmzw1',
    slideNumber: 4,
    smartTitle: 'Tebak Budaya 1: Bentuk Rumah Adat',
    category: 'gim',
    subTopic: 'Pemanasan Interaktif',
    smartSummary:
      'Permainan tebak siluet gambar: "Bentuk apakah ini?" — Mengenali bentuk Rumah Adat Nusantara.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '5y0cYcWaZ3N': {
    slideId: '5y0cYcWaZ3N',
    slideNumber: 5,
    smartTitle: 'Tebak Budaya 2: Benda Senjata Tradisional',
    category: 'gim',
    subTopic: 'Pemanasan Interaktif',
    smartSummary:
      'Permainan tebak siluet gambar: "Benda apakah ini?" — Mengenali bentuk Senjata Tradisional Nusantara.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '5iWbenzMEWM': {
    slideId: '5iWbenzMEWM',
    slideNumber: 6,
    smartTitle: 'Tebak Budaya 3: Alat Musik Gamelan',
    category: 'gim',
    subTopic: 'Pemanasan Interaktif',
    smartSummary:
      'Permainan tebak siluet gambar: "Apa nama benda ini?" — Mengenali instrumen musik tradisional Gamelan.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '6IgV5Xf2ecV': {
    slideId: '6IgV5Xf2ecV',
    slideNumber: 7,
    smartTitle: 'Sinema Animasi Petualangan Budaya',
    category: 'pembuka',
    subTopic: 'Sinema Edukasi',
    smartSummary:
      'Tayangan video cerita animasi tentang indahnya keberagaman budaya di lingkungan sekolah dan masyarakat.',
    backgroundUrl: 'mobile/poster_6IvTTb86pVv_video_5gKzK4lbTf6_22_56_1280x720.jpg',
  },
  '5jTlwgcUi8o': {
    slideId: '5jTlwgcUi8o',
    slideNumber: 8,
    smartTitle: 'Eksplorasi Tur Virtual 360° Budaya Indonesia',
    category: 'tur360',
    subTopic: 'Tur Virtual 360°',
    smartSummary:
      'Penjelajahan panorama interaktif 360° Budaya Nusantara melalui tautan embed web interaktif.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
    webObjectUrl: 'https://faryzt.github.io/starla-360/',
  },
  '6AtIwHwQnjq': {
    slideId: '6AtIwHwQnjq',
    slideNumber: 9,
    smartTitle: 'Komik Pengantar: Mengenal Keragaman Suku & Budaya (Bagian 1)',
    category: 'materi',
    subTopic: 'Pengantar Keragaman Budaya',
    materiOrder: 2,
    smartSummary:
      'Ilustrasi cerita pengantar tentang perjumpaan siswa dari berbagai latar belakang suku dan daerah di sekolah.',
    backgroundUrl: 'mobile/Slide5jvmjYVwgcQ.jpg',
  },
  '5zwBwMPydB6': {
    slideId: '5zwBwMPydB6',
    slideNumber: 10,
    smartTitle: 'Komik Pengantar: Hidup Rukun dalam Keberagaman (Bagian 2)',
    category: 'materi',
    subTopic: 'Pengantar Keragaman Budaya',
    materiOrder: 3,
    smartSummary:
      'Lanjutan cerita ilustrasi tentang pentingnya sikap rukun, bersahabat, dan saling menghormati perbedaan budaya.',
    backgroundUrl: 'mobile/Slide6QrkavOlv6I.jpg',
  },
  '6OrD7bra4Ko': {
    slideId: '6OrD7bra4Ko',
    slideNumber: 42,
    smartTitle: 'Pengertian Budaya: Apa itu Budaya?',
    category: 'materi',
    subTopic: 'Konsep Dasar Budaya',
    materiOrder: 1,
    smartSummary:
      'Budaya adalah adat istiadat yang dimiliki suatu suku bangsa. Budaya diwariskan secara turun-temurun dari zaman nenek moyang hingga sampai generasi saat ini.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '6FkRXfgJQkY': {
    slideId: '6FkRXfgJQkY',
    slideNumber: 39,
    smartTitle: 'Materi 1: Keragaman Bahasa Daerah',
    category: 'materi',
    subTopic: 'Bahasa Daerah',
    materiOrder: 4,
    smartSummary:
      'Bahasa daerah adalah bahasa yang digunakan oleh suatu suku bangsa sebagai alat komunikasi sehari-hari. Agar setiap orang dari berbagai daerah tetap dapat berkomunikasi dengan baik, bangsa Indonesia memiliki bahasa persatuan yaitu Bahasa Indonesia.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '6rj9XvcPk4j': {
    slideId: '6rj9XvcPk4j',
    slideNumber: 11,
    smartTitle: 'Cara Menghargai Keragaman Bahasa Daerah',
    category: 'materi',
    subTopic: 'Bahasa Daerah',
    materiOrder: 5,
    smartSummary:
      '1) Meminta teman mengajari bahasa daerahnya. 2) Meminta penjelasan tentang bahasa yang tidak dimengerti dengan sopan. 3) Menggunakan Bahasa Indonesia saat berbicara dengan teman berbeda daerah.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '60qqSfn2Gy4': {
    slideId: '60qqSfn2Gy4',
    slideNumber: 12,
    smartTitle: 'Materi 2: Keragaman Lagu Daerah',
    category: 'materi',
    subTopic: 'Lagu Daerah',
    materiOrder: 6,
    smartSummary:
      'Lagu daerah adalah lagu khas suatu daerah yang menggunakan bahasa dan dialek setempat. Dinyanyikan saat pementasan tari, permainan tradisional, pesta rakyat, atau pertunjukan daerah untuk menceritakan keindahan alam dan adat istiadat.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '69u2IVtFccK': {
    slideId: '69u2IVtFccK',
    slideNumber: 13,
    smartTitle: 'Cara Menghargai Keragaman Lagu Daerah',
    category: 'materi',
    subTopic: 'Lagu Daerah',
    materiOrder: 7,
    smartSummary:
      '1) Memberi tepuk tangan setelah teman menyanyikan lagu daerahnya. 2) Mempelajari lagu daerah lain dengan semangat. 3) Menyanyikan lagu daerah sesuai dengan liriknya.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '6lLQh7AsdfG': {
    slideId: '6lLQh7AsdfG',
    slideNumber: 14,
    smartTitle: 'Materi 3: Keragaman Alat Musik Tradisional',
    category: 'materi',
    subTopic: 'Alat Musik Tradisional',
    materiOrder: 8,
    smartSummary:
      'Lagu daerah biasanya diiringi oleh permainan alat musik daerah setempat sehingga membuat lagu daerah menjadi lebih menarik untuk didengarkan. Ada berbagai jenis alat musik daerah di Indonesia yang wajib kita hargai.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '5wmBV8vjFPm': {
    slideId: '5wmBV8vjFPm',
    slideNumber: 15,
    smartTitle: 'Cara Menghargai Alat Musik Tradisional',
    category: 'materi',
    subTopic: 'Alat Musik Tradisional',
    materiOrder: 9,
    smartSummary:
      '1) Mempelajari cara memainkan alat musik tradisional dari daerah lain. 2) Tidak merusak atau mencela keunikan alat musik tradisional. 3) Memberi apresiasi terhadap pertunjukan musik daerah.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '6VGgu6tqinV': {
    slideId: '6VGgu6tqinV',
    slideNumber: 16,
    smartTitle: 'Materi 4: Keragaman Pakaian Daerah',
    category: 'materi',
    subTopic: 'Pakaian Daerah',
    materiOrder: 10,
    smartSummary:
      'Pakaian daerah merupakan pakaian khas suatu daerah yang dikenakan saat perayaan atau upacara adat. Bahan untuk membuat pakaian daerah diambil dari hasil alam daerah setempat dan merupakan kekayaan budaya bangsa.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '6rO2Rjnvtcl': {
    slideId: '6rO2Rjnvtcl',
    slideNumber: 17,
    smartTitle: 'Cara Menghargai Keragaman Pakaian Daerah',
    category: 'materi',
    subTopic: 'Pakaian Daerah',
    materiOrder: 11,
    smartSummary:
      '1) Memakai pakaian daerah dengan rasa bangga dan sopan. 2) Memuji keindahan pakaian adat daerah lain. 3) Mengenakan pakaian adat saat acara peringatan hari besar nasional.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '5g85v9o85Yb': {
    slideId: '5g85v9o85Yb',
    slideNumber: 18,
    smartTitle: 'Materi 5: Keragaman Senjata Tradisional',
    category: 'materi',
    subTopic: 'Senjata Tradisional',
    materiOrder: 12,
    smartSummary:
      'Senjata tradisional merupakan senjata khas suatu daerah yang digunakan sebagai kelengkapan atau hiasan pakaian daerah, berburu, dan peralatan sehari-hari. Kita harus melestarikan dan menghargai keragaman senjata tradisional Indonesia.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '62u9PmQKgzB': {
    slideId: '62u9PmQKgzB',
    slideNumber: 19,
    smartTitle: 'Cara Menghargai Senjata Tradisional',
    category: 'materi',
    subTopic: 'Senjata Tradisional',
    materiOrder: 13,
    smartSummary:
      '1) Memuji keindahan bentuk senjata tradisional daerah lain. 2) Mempelajari sejarah dan keunikan senjata tradisional Nusantara. 3) Tidak menggunakan senjata tradisional untuk membahayakan orang lain.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '5o4GAEeLE09': {
    slideId: '5o4GAEeLE09',
    slideNumber: 20,
    smartTitle: 'Materi 6: Keragaman Tari Tradisional',
    category: 'materi',
    subTopic: 'Tari Tradisional',
    materiOrder: 14,
    smartSummary:
      'Tari adalah gerak tubuh secara berirama untuk mengungkapkan perasaan dan pikiran serta menceritakan sesuatu. Para penari tradisional mengenakan pakaian daerah ketika menari dalam upacara adat, penyambutan tamu, panen raya, dan hiburan rakyat.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '6VYnewFze63': {
    slideId: '6VYnewFze63',
    slideNumber: 21,
    smartTitle: 'Cara Menghargai Keragaman Tari Tradisional',
    category: 'materi',
    subTopic: 'Tari Tradisional',
    materiOrder: 15,
    smartSummary:
      '1) Menonton pementasan tari tradisional hingga selesai dengan tertib. 2) Mempelajari gerak tari tradisional dari berbagai daerah. 3) Memberi tepuk tangan dan apresiasi kepada para penari daerah.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '69cSEO6heKU': {
    slideId: '69cSEO6heKU',
    slideNumber: 22,
    smartTitle: 'Materi 7: Keragaman Rumah Adat',
    category: 'materi',
    subTopic: 'Rumah Adat',
    materiOrder: 16,
    smartSummary:
      'Rumah adat adalah rumah yang dibangun sesuai dengan ciri khas dan budaya masyarakat di suatu daerah tertentu. Setiap rumah adat memiliki aturan yang wajib kita hargai dan hormati.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '6mhmEQSWIJZ': {
    slideId: '6mhmEQSWIJZ',
    slideNumber: 23,
    smartTitle: 'Cara Menghargai Keragaman Rumah Adat',
    category: 'materi',
    subTopic: 'Rumah Adat',
    materiOrder: 17,
    smartSummary:
      '1) Melepas alas kaki sebelum memasuki rumah adat sesuai aturan setempat. 2) Mendengarkan penjelasan tentang sejarah dan filosofi rumah adat. 3) Menjaga kebersihan dan tidak merusak ukiran rumah adat.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '5UlnwWVKUrp': {
    slideId: '5UlnwWVKUrp',
    slideNumber: 24,
    smartTitle: 'Apresiasi Penutup Materi Budaya',
    category: 'hasil',
    subTopic: 'Penutup Materi',
    smartSummary:
      'Kerja Bagus! Kamu sudah mengenal dan mempelajari bagaimana cara menghargai keragaman budaya di Indonesia dengan sangat baik.',
    backgroundUrl: 'mobile/Slide5znCNCeGBCx.jpg',
  },
  '6oOWqUyP2WL': {
    slideId: '6oOWqUyP2WL',
    slideNumber: 25,
    smartTitle: 'Kuis Budaya #1: Menghormati Perbedaan Baju Adat',
    category: 'kuis',
    subTopic: 'Evaluasi Kuis (Soal 1)',
    smartSummary:
      'Misalkan kamu memiliki teman Udi berasal dari suku Sunda, Komang dari suku Bali, dan kamu dari suku Jawa. Sikap menghargai pakaian adat adalah...',
    backgroundUrl: 'mobile/Slide6OyJsyjTUqI.jpg',
  },
  '6fJRLUtSDVL': {
    slideId: '6fJRLUtSDVL',
    slideNumber: 26,
    smartTitle: 'Kuis Budaya #2: Mendengarkan Cerita Budaya Teman',
    category: 'kuis',
    subTopic: 'Evaluasi Kuis (Soal 2)',
    smartSummary:
      'Pak Dika meminta siswa menceritakan budaya daerahnya masing-masing. Sikap menghargai saat Oxel bercerita adalah...',
    backgroundUrl: 'mobile/Slide5X3dTiLuyun.jpg',
  },
  '6V8v7yM3VzE': {
    slideId: '6V8v7yM3VzE',
    slideNumber: 27,
    smartTitle: 'Kuis Budaya #3: Menghormati Upacara Adat Bakar Batu Papua',
    category: 'kuis',
    subTopic: 'Evaluasi Kuis (Soal 3)',
    smartSummary:
      'Keluargamu sedang berlibur ke Papua dan menyaksikan upacara adat bakar batu. Sikapmu sebaiknya...',
    backgroundUrl: 'mobile/Slide5yo2tQLf00F.jpg',
  },
  '6TsqDEfppnq': {
    slideId: '6TsqDEfppnq',
    slideNumber: 28,
    smartTitle: 'Kuis Budaya #4: Menghargai Makanan Khas Daerah Teman',
    category: 'kuis',
    subTopic: 'Evaluasi Kuis (Soal 4)',
    smartSummary:
      'Teman barumu membawakan oleh-oleh makanan khas dari daerahnya. Sikap menghargai yang tepat adalah...',
    backgroundUrl: 'mobile/Slide6KW9BTxsrqH.jpg',
  },
  '5tNzQg4qrZn': {
    slideId: '5tNzQg4qrZn',
    slideNumber: 29,
    smartTitle: 'Kuis Budaya #5: Makna Persatuan dalam Keberagaman',
    category: 'kuis',
    subTopic: 'Evaluasi Kuis (Soal 5)',
    smartSummary:
      'Walaupun memakai baju adat yang berbeda namun memegang bendera Merah Putih yang sama, maknanya adalah...',
    backgroundUrl: 'mobile/Slide5xh1Rw3OcNe.jpg',
  },
  '5udKoy5uKgm': {
    slideId: '5udKoy5uKgm',
    slideNumber: 30,
    smartTitle: 'Kuis Budaya #6: Menghargai Ukiran Rumah Adat',
    category: 'kuis',
    subTopic: 'Evaluasi Kuis (Soal 6)',
    smartSummary:
      'Tindakan menghargai yang sebaiknya dilakukan Mustofa dan Satria saat berkunjung ke rumah adat Bayu adalah...',
    backgroundUrl: 'mobile/Slide5rA9s7guf32.jpg',
  },
  '6PxxtyG4oap': {
    slideId: '6PxxtyG4oap',
    slideNumber: 31,
    smartTitle: 'Kuis Budaya #7: Sikap Santun terhadap Bahasa Daerah Lain',
    category: 'kuis',
    subTopic: 'Evaluasi Kuis (Soal 7)',
    smartSummary:
      'Seorang pedagang siomai dari Bandung berbicara menggunakan bahasa Sunda yang belum kamu mengerti. Sikapmu sebaiknya...',
    backgroundUrl: 'mobile/Slide5pz0QaovvXI.jpg',
  },
  '5eaO0Lz8ZMk': {
    slideId: '5eaO0Lz8ZMk',
    slideNumber: 32,
    smartTitle: 'Kuis Budaya #8: Menghargai Sejarah Senjata Tradisional',
    category: 'kuis',
    subTopic: 'Evaluasi Kuis (Soal 8)',
    smartSummary:
      'Temanmu menjelaskan sejarah dan keunikan senjata tradisional dari daerahnya. Tindakanmu sebaiknya adalah...',
    backgroundUrl: 'mobile/Slide6lkiWE3E8ip.jpg',
  },
  '6SKvjji8cdv': {
    slideId: '6SKvjji8cdv',
    slideNumber: 33,
    smartTitle: 'Kuis Budaya #9: Apresiasi Pentas Seni Tari Daerah',
    category: 'kuis',
    subTopic: 'Evaluasi Kuis (Soal 9)',
    smartSummary:
      'Kamu dan temanmu menyaksikan pentas seni tari tradisional dari daerah lain. Tindakan menghargai yang tepat adalah...',
    backgroundUrl: 'mobile/Slide5wOgryCi9PZ.jpg',
  },
  '5a8YIrSITc8': {
    slideId: '5a8YIrSITc8',
    slideNumber: 34,
    smartTitle: 'Kuis Budaya #10: Bangga Menampilkan Alat Musik Angklung',
    category: 'kuis',
    subTopic: 'Evaluasi Kuis (Soal 10)',
    smartSummary:
      'Zaura pandai memainkan alat musik tradisional angklung dan diminta tampil di acara sekolah. Sikap kita sebaiknya...',
    backgroundUrl: 'mobile/Slide61QwsfBQyAQ.jpg',
  },
  '6ddgVMlBGEg': {
    slideId: '6ddgVMlBGEg',
    slideNumber: 35,
    smartTitle: 'Papan Skor & Hasil Evaluasi Kuis Budaya',
    category: 'hasil',
    subTopic: 'Hasil Evaluasi',
    smartSummary:
      'Menampilkan total perolehan nilai kuis evaluasi siswa beserta nama dan asal sekolah.',
    backgroundUrl: 'mobile/Slide6EkMdNHlhuq.jpg',
  },
  '6eHtnAfM3bY': {
    slideId: '6eHtnAfM3bY',
    slideNumber: 36,
    smartTitle: 'Menu Utama Petualangan Starla Budaya',
    category: 'menu',
    subTopic: 'Navigasi Utama',
    smartSummary:
      'Halaman pusat navigasi untuk memilih Materi Budaya, Sinema Budaya, Tur 360°, Kuis Evaluasi, dan Gim Anak Garuda.',
    backgroundUrl: 'mobile/6Q69tvGOis4.gif',
  },
  '604TQFYNuzG': {
    slideId: '604TQFYNuzG',
    slideNumber: 37,
    smartTitle: 'Refleksi Perasaan Belajar Budaya (Pilih Ekspresi Garuda)',
    category: 'hasil',
    subTopic: 'Refleksi Belajar',
    smartSummary:
      'Pilih dan tekan satu karakter Garuda yang menunjukkan perasaan kamu setelah belajar keragaman budaya hari ini.',
    backgroundUrl: 'mobile/Slide5sKRbJGYSxp.jpg',
  },
  '6EA329REfHb': {
    slideId: '6EA329REfHb',
    slideNumber: 38,
    smartTitle: 'Profil Pengembang & Informasi HKI Starla Budaya',
    category: 'hasil',
    subTopic: 'Informasi Pengembang',
    smartSummary:
      'Halaman informasi tim pengembang media pembelajaran interaktif Starla Budaya.',
    backgroundUrl: 'mobile/Slide5WPRbcJDCqY.jpg',
  },
  '6G1VrKuOhCw': {
    slideId: '6G1VrKuOhCw',
    slideNumber: 40,
    smartTitle: 'Gim Interaktif Drag & Drop: Anak Garuda',
    category: 'gim',
    subTopic: 'Gim Drag & Drop',
    smartSummary:
      'Permainan mengelompokkan 10 pernyataan sikap menghargai budaya (Budaya yang Benar vs Budaya yang Salah) bersama karakter Anak Garuda.',
    backgroundUrl: 'mobile/6PFU9CSOUPJ.gif',
  },
  '6WIqLhHr1Cm': {
    slideId: '6WIqLhHr1Cm',
    slideNumber: 41,
    smartTitle: 'Papan Skor & Hasil Gim Anak Garuda',
    category: 'hasil',
    subTopic: 'Hasil Gim',
    smartSummary:
      'Menampilkan perolehan poin siswa setelah menyelesaikan tantangan Gim Drag & Drop Anak Garuda.',
    backgroundUrl: 'mobile/Slide6r3TAL6GVOt.jpg',
  },
  '5iew2M44w24': {
    slideId: '5iew2M44w24',
    slideNumber: 43,
    smartTitle: 'Menu Pilihan Materi Keragaman Budaya',
    category: 'menu',
    subTopic: 'Navigasi Materi',
    smartSummary:
      'Halaman menu untuk memilih sub-materi keragaman budaya, video animasi, maupun eksplorasi 360° Budaya.',
    backgroundUrl: 'mobile/6Q69tvGOis4.gif',
  },
};

/**
 * Returns smart metadata for any slide (native or custom admin-created slide).
 */
export function getSmartSlideMeta(
  slideId: string,
  slide?: SlideContentItem,
  fallbackIndex = 0
): SlideSmartMeta {
  const known = SLIDE_EXACT_META[slideId];
  const rawTitle = (slide?.title || '').trim();
  const hasCustomEditedTitle =
    rawTitle &&
    rawTitle !== 'Untitled Slide' &&
    rawTitle !== 'Results Slide' &&
    rawTitle !== 'Drag and Drop' &&
    !rawTitle.startsWith('Slide ');

  const cleanInstructions = (slide?.instructions || [])
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(
      (line) =>
        line.length > 2 &&
        line !== '?' &&
        line !== 'Benar' &&
        line !== 'Salah' &&
        !line.startsWith('Rectangle') &&
        !line.startsWith('Check Box') &&
        !line.includes('%_player')
    );

  if (known) {
    const rawKnownWebUrl = slide?.webObjectUrl || known.webObjectUrl || null;
    return {
      ...known,
      smartTitle: hasCustomEditedTitle ? rawTitle : known.smartTitle,
      smartSummary:
        cleanInstructions.length > 0
          ? cleanInstructions.join(' ')
          : known.smartSummary,
      backgroundUrl: slide?.backgroundUrl || known.backgroundUrl,
      webObjectUrl: rawKnownWebUrl
        ? normalizeSmartEmbedUrl(rawKnownWebUrl, known.webObjectUrl || 'https://faryzt.github.io/starla-360/')
        : null,
    };
  }

  // Check if this custom slide is a 360° Budaya slide (including copies of Slide 8)
  const isCustom360 =
    slide?.customCategory === 'tur360' ||
    slide?.copiedFromSlideId === '5jTlwgcUi8o' ||
    Boolean(slide?.webObjectUrl) ||
    slideId.startsWith('tur360_') ||
    /360/i.test(rawTitle);

  if (isCustom360) {
    const normalizedEmbedUrl = normalizeSmartEmbedUrl(
      slide?.webObjectUrl,
      'https://faryzt.github.io/starla-360/'
    );
    return {
      slideId,
      slideNumber: slide?.slideNumber || fallbackIndex + 1,
      smartTitle: hasCustomEditedTitle
        ? rawTitle
        : `Eksplorasi Tur Virtual 360° Budaya #${fallbackIndex + 1}`,
      category: 'tur360',
      subTopic: 'Tur Virtual 360°',
      smartSummary:
        cleanInstructions.join(' ') ||
        `Penjelajahan panorama interaktif 360° Budaya Nusantara (${normalizedEmbedUrl}).`,
      backgroundUrl: slide?.backgroundUrl || 'mobile/Slide5znCNCeGBCx.jpg',
      webObjectUrl: normalizedEmbedUrl,
    };
  }

  if (slide?.quizQuestion || slide?.customCategory === 'kuis') {
    return {
      slideId,
      slideNumber: slide?.slideNumber || fallbackIndex + 1,
      smartTitle: hasCustomEditedTitle
        ? rawTitle
        : `Kuis Budaya Tambahan #${fallbackIndex + 1}`,
      category: 'kuis',
      subTopic: 'Evaluasi Kuis Tambahan',
      smartSummary:
        slide?.quizQuestion?.questionText ||
        cleanInstructions.join(' ') ||
        'Soal evaluasi pemahaman keragaman budaya.',
      backgroundUrl: slide?.backgroundUrl || 'mobile/Slide5WPRbcJDCqY.jpg',
    };
  }

  // Any custom slide added by Admin via "+ Tambah Baru" in Materi Budaya
  return {
    slideId,
    slideNumber: slide?.slideNumber || fallbackIndex + 1,
    smartTitle: hasCustomEditedTitle
      ? rawTitle
      : `Materi Budaya Tambahan #${fallbackIndex + 1}`,
    category: slide?.customCategory || 'materi',
    subTopic: 'Materi Tambahan',
    materiOrder: 100 + fallbackIndex,
    smartSummary:
      cleanInstructions.join(' ') ||
      'Materi pembelajaran keragaman budaya Nusantara.',
    backgroundUrl:
      slide?.backgroundUrl ||
      slide?.images?.[0]?.url ||
      'mobile/Slide5znCNCeGBCx.jpg',
  };
}

/**
 * Returns ONLY the cultural learning material slides ("slide materi saja")
 * sorted in logical learning sequence.
 */
export function getMateriBudayaSlides(
  slideOrder: string[],
  slides: Record<string, SlideContentItem>
): Array<{ slide: SlideContentItem; meta: SlideSmartMeta }> {
  const items: Array<{ slide: SlideContentItem; meta: SlideSmartMeta }> = [];

  slideOrder.forEach((id, idx) => {
    const sl = slides[id];
    if (!sl || sl.hidden) return;
    const meta = getSmartSlideMeta(id, sl, idx);
    if (meta.category === 'materi') {
      items.push({ slide: sl, meta });
    }
  });

  items.sort(
    (a, b) => (a.meta.materiOrder ?? 999) - (b.meta.materiOrder ?? 999)
  );
  return items;
}

/**
 * Returns all 360° Budaya slides (Slide 8 + any custom 360° slides added by Admin).
 */
export function getTur360Slides(
  slideOrder: string[],
  slides: Record<string, SlideContentItem>
): Array<{ slide: SlideContentItem; meta: SlideSmartMeta }> {
  const items: Array<{ slide: SlideContentItem; meta: SlideSmartMeta }> = [];
  slideOrder.forEach((id, idx) => {
    const sl = slides[id];
    if (!sl || sl.hidden) return;
    const meta = getSmartSlideMeta(id, sl, idx);
    if (meta.category === 'tur360') {
      items.push({ slide: sl, meta });
    }
  });
  return items;
}

// Bounded LRU in-memory cache for exact Storyline stage rendering in "Desain Slide"
// Prevents unbounded RAM growth and allows instant memory release when closing Desain Slide / AdminDashboard
export const MAX_CACHED_SLIDE_RUNTIMES = 6;
let cachedAssetLib: Array<{ url?: string }> | null = null;
let cachedPathsLib: Record<string, any> | null = null;
const cachedSlideRuntimeMap = new Map<string, ExactSlideRuntimeData>();

export function getAdminStageCacheStats(): {
  cachedSlideCount: number;
  maxCachedSlides: number;
  hasAssetLibLoaded: boolean;
  hasPathsLibLoaded: boolean;
  cachedSlideIds: string[];
} {
  return {
    cachedSlideCount: cachedSlideRuntimeMap.size,
    maxCachedSlides: MAX_CACHED_SLIDE_RUNTIMES,
    hasAssetLibLoaded: cachedAssetLib !== null,
    hasPathsLibLoaded: cachedPathsLib !== null,
    cachedSlideIds: Array.from(cachedSlideRuntimeMap.keys()),
  };
}

export function releaseAdminStageMemoryCache(keepHeavyLibs = false): void {
  cachedSlideRuntimeMap.clear();
  if (!keepHeavyLibs) {
    cachedAssetLib = null;
    cachedPathsLib = null;
  }
}

function setLruSlideRuntime(
  slideId: string,
  data: ExactSlideRuntimeData
): void {
  if (cachedSlideRuntimeMap.has(slideId)) {
    cachedSlideRuntimeMap.delete(slideId);
  } else if (cachedSlideRuntimeMap.size >= MAX_CACHED_SLIDE_RUNTIMES) {
    const oldestKey = cachedSlideRuntimeMap.keys().next().value;
    if (oldestKey) {
      cachedSlideRuntimeMap.delete(oldestKey);
    }
  }
  cachedSlideRuntimeMap.set(slideId, data);
}

function parseProvideDataPayload(rawJs: string): any {
  let captured: any = null;
  const fakeWindow = {
    globalProvideData: (_kind: string, jsonStr: string) => {
      captured = JSON.parse(jsonStr);
    },
  };
  try {
    const fn = new Function('window', rawJs);
    fn(fakeWindow);
  } catch {
    const start = rawJs.indexOf('{');
    const end = rawJs.lastIndexOf('}');
    if (start >= 0 && end > start) {
      captured = JSON.parse(rawJs.slice(start, end + 1));
    }
  }
  return captured;
}

export async function loadExactSlideStageData(
  slideId: string,
  customSlide?: SlideContentItem
): Promise<ExactSlideRuntimeData | null> {
  // If this is a custom 360° Budaya slide added by Admin (not copied from another non-360 slide),
  // return an exact 1280x720 WebObject + authentic Slide 8 Back Button stage identical to Slide 8 (5jTlwgcUi8o)
  if (
    !SLIDE_EXACT_META[slideId] &&
    !customSlide?.copiedFromSlideId &&
    (customSlide?.customCategory === 'tur360' ||
      Boolean(customSlide?.webObjectUrl) ||
      slideId.startsWith('tur360_'))
  ) {
    const embedUrl = normalizeSmartEmbedUrl(
      customSlide?.webObjectUrl,
      'https://faryzt.github.io/starla-360/'
    );
    return {
      slideId,
      width: 1280,
      height: 720,
      backgroundUrl:
        customSlide?.backgroundUrl || 'mobile/Slide5znCNCeGBCx.jpg',
      objects: [
        {
          id: `${slideId}_webobj`,
          kind: 'webobject',
          xPos: 0,
          yPos: 0,
          width: 1280,
          height: 720,
          depth: 1,
          imageUrl: null,
          shapeCommandSetId: null,
          textCommandSetId: null,
          altText: '360 Budaya Embed (Slide 8 Parity)',
          webUrl: embedUrl,
          videoUrl: null,
          posterUrl: null,
        },
        {
          id: `${slideId}_back_btn`,
          kind: 'vectorshape',
          xPos: 8,
          yPos: 8,
          width: 95,
          height: 68,
          depth: 2,
          imageUrl: 'mobile/6UTk9YJ1Rv7.png',
          shapeCommandSetId: null,
          textCommandSetId: null,
          altText: 'Tombol Kembali (Slide 8)',
          webUrl: null,
          videoUrl: null,
          posterUrl: null,
        },
      ],
      pathsLib: {},
    };
  }

  if (cachedSlideRuntimeMap.has(slideId)) {
    const existing = cachedSlideRuntimeMap.get(slideId)!;
    // Refresh LRU order
    cachedSlideRuntimeMap.delete(slideId);
    cachedSlideRuntimeMap.set(slideId, existing);
    // Apply any live customSlide backgroundUrl or webObjectUrl override dynamically
    const liveWebUrl = customSlide?.webObjectUrl
      ? normalizeSmartEmbedUrl(customSlide.webObjectUrl)
      : null;
    if (liveWebUrl || customSlide?.backgroundUrl) {
      return {
        ...existing,
        backgroundUrl: customSlide?.backgroundUrl || existing.backgroundUrl,
        objects: existing.objects.map((o) =>
          o.kind === 'webobject' && liveWebUrl ? { ...o, webUrl: liveWebUrl } : o
        ),
      };
    }
    return existing;
  }

  try {
    if (!cachedAssetLib) {
      const dataRes = await fetch('/html5/data/js/data.js');
      if (dataRes.ok) {
        const dataRaw = await dataRes.text();
        const parsedData = parseProvideDataPayload(dataRaw);
        cachedAssetLib = parsedData?.assetLib || [];
      } else {
        cachedAssetLib = [];
      }
    }

    if (!cachedPathsLib) {
      const pathsRes = await fetch('/html5/data/js/paths.js');
      if (pathsRes.ok) {
        const pathsRaw = await pathsRes.text();
        const parsedPaths = parseProvideDataPayload(pathsRaw);
        cachedPathsLib = parsedPaths?.Lib || {};
      } else {
        cachedPathsLib = {};
      }
    }

    const effectiveSourceSlideId = customSlide?.copiedFromSlideId || slideId;
    const slideRes = await fetch(`/html5/data/js/${effectiveSourceSlideId}.js`);
    if (!slideRes.ok) {
      // For a brand-new custom slide added in Desain Slide (without a native .js file),
      // return a valid 1280x720 stage with background and an authentic Slide 8 Back button
      const hasEmbed =
        customSlide?.customCategory === 'tur360' ||
        Boolean(customSlide?.webObjectUrl) ||
        slideId.startsWith('tur360_');
      const fallbackObjects: ExactStageObject[] = [];
      if (hasEmbed) {
        fallbackObjects.push({
          id: `${slideId}_webobj`,
          kind: 'webobject',
          xPos: 0,
          yPos: 0,
          width: 1280,
          height: 720,
          depth: 1,
          imageUrl: null,
          shapeCommandSetId: null,
          textCommandSetId: null,
          altText: '360 Budaya Embed',
          webUrl: normalizeSmartEmbedUrl(customSlide?.webObjectUrl),
          videoUrl: null,
          posterUrl: null,
        });
      }
      fallbackObjects.push({
        id: `${slideId}_back_btn`,
        kind: 'vectorshape',
        xPos: 8,
        yPos: 8,
        width: 95,
        height: 68,
        depth: 2,
        imageUrl: 'mobile/6UTk9YJ1Rv7.png',
        shapeCommandSetId: null,
        textCommandSetId: null,
        altText: 'Tombol Kembali ke Menu',
        webUrl: null,
        videoUrl: null,
        posterUrl: null,
      });
      return {
        slideId,
        width: 1280,
        height: 720,
        backgroundUrl:
          customSlide?.backgroundUrl || 'mobile/Slide5znCNCeGBCx.jpg',
        objects: fallbackObjects,
        pathsLib: {},
      };
    }
    const slideRaw = await slideRes.text();
    const sData = parseProvideDataPayload(slideRaw);
    if (!sData) return null;

    const bgAssetId = sData.background?.imagedata?.assetId;
    const backgroundUrl: string | null =
      customSlide?.backgroundUrl ||
      (bgAssetId !== undefined && cachedAssetLib?.[bgAssetId]?.url
        ? cachedAssetLib[bgAssetId].url!
        : SLIDE_EXACT_META[effectiveSourceSlideId]?.backgroundUrl || null);

    const baseLayer =
      (sData.slideLayers || []).find((l: any) => l.isBaseLayer) ||
      (sData.slideLayers || [])[0];

    const objects: ExactStageObject[] = [];

    const collectObjects = (
      rawObjs: any[],
      offsetX = 0,
      offsetY = 0,
      parentDepth = 0
    ) => {
      for (const o of rawObjs || []) {
        if (
          typeof o.id === 'string' &&
          (o.id.endsWith('_CorrectReview') || o.id.endsWith('_IncorrectReview'))
        ) {
          continue;
        }

        const xPos = (typeof o.xPos === 'number' ? o.xPos : 0) + offsetX;
        const yPos = (typeof o.yPos === 'number' ? o.yPos : 0) + offsetY;
        const width = typeof o.width === 'number' ? o.width : 0;
        const height = typeof o.height === 'number' ? o.height : 0;
        const effDepth =
          typeof o.depth === 'number'
            ? o.depth + parentDepth
            : objects.length + 1;

        if (Array.isArray(o.objects) && o.objects.length > 0) {
          if (o.kind === 'stategroup') {
            // Collect the primary child (default state) AND any attached objgroup (e.g. speech bubbles + question texts on Slide 40)
            const visibleChildren = o.objects.filter(
              (ch: any, idx: number) =>
                idx === 0 || ch.id === o.id || ch.kind === 'objgroup'
            );
            collectObjects(visibleChildren, xPos, yPos, effDepth);
          } else {
            collectObjects(o.objects, xPos, yPos, effDepth);
          }
          continue;
        }

        const img0 = o.imagelib?.[0] || o.data?.imagelib?.[0];
        let imageUrl: string | null = null;
        if (img0) {
          if (
            typeof img0.assetId === 'number' &&
            cachedAssetLib?.[img0.assetId]?.url
          ) {
            imageUrl = cachedAssetLib[img0.assetId].url!;
          } else if (img0.url) {
            imageUrl = img0.url;
          }
        }

        const shapePrIdx = o.data?.vectorData?.pr?.i;
        const shapeCommandSetId =
          typeof shapePrIdx === 'number' ? `commandset-${shapePrIdx}` : null;

        const textPrIdx = o.textLib?.[0]?.vectortext?.pr?.i;
        const textCommandSetId =
          typeof textPrIdx === 'number' ? `commandset-${textPrIdx}` : null;

        const altText = o.data?.vectorData?.altText || '';
        const webUrl =
          o.kind === 'webobject'
            ? normalizeSmartEmbedUrl(customSlide?.webObjectUrl || o.url)
            : null;

        let videoUrl: string | null = null;
        let posterUrl: string | null = null;
        if (o.kind === 'video') {
          if (effectiveSourceSlideId === '6AR4SV4ZYat') {
            videoUrl = 'story_content/video_6nPjLwNxeE5_22_56_1280x720.mp4';
            posterUrl =
              'mobile/poster_5fW9LQF7to8_video_6nPjLwNxeE5_22_56_1280x720.jpg';
          } else if (effectiveSourceSlideId === '6IgV5Xf2ecV') {
            videoUrl = 'story_content/video_5gKzK4lbTf6_22_56_1280x720.mp4';
            posterUrl =
              'mobile/poster_6IvTTb86pVv_video_5gKzK4lbTf6_22_56_1280x720.jpg';
          }
        }

        objects.push({
          id: o.id || `obj_${objects.length}`,
          kind: o.kind || 'vectorshape',
          xPos,
          yPos,
          width,
          height,
          depth: effDepth,
          imageUrl,
          shapeCommandSetId,
          textCommandSetId,
          altText,
          webUrl,
          videoUrl,
          posterUrl,
        });
      }
    };

    collectObjects(baseLayer?.objects || []);
    objects.sort((a, b) => a.depth - b.depth);

    // Slice pathsLib to ONLY the command sets used by this slide to minimize memory footprint
    const scopedPathsLib: Record<string, any> = {};
    if (cachedPathsLib) {
      for (const obj of objects) {
        if (
          obj.shapeCommandSetId &&
          cachedPathsLib[obj.shapeCommandSetId] !== undefined
        ) {
          scopedPathsLib[obj.shapeCommandSetId] =
            cachedPathsLib[obj.shapeCommandSetId];
        }
        if (
          obj.textCommandSetId &&
          cachedPathsLib[obj.textCommandSetId] !== undefined
        ) {
          scopedPathsLib[obj.textCommandSetId] =
            cachedPathsLib[obj.textCommandSetId];
        }
      }
    }

    const runtimeData: ExactSlideRuntimeData = {
      slideId,
      width: sData.width || 1280,
      height: sData.height || 720,
      backgroundUrl,
      objects,
      pathsLib: scopedPathsLib,
    };

    setLruSlideRuntime(slideId, runtimeData);
    return runtimeData;
  } catch {
    return null;
  }
}
