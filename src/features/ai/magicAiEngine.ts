import {
  CanvasElement,
  CanvasElementType,
  CanvasActionType,
} from '../../types/canvas';
import { clampPct } from '../canvas/canvasMath';

export interface MagicCanvasAiRequest {
  prompt: string;
  slideId: string;
  slideTitle?: string;
  selectedElement?: CanvasElement | null;
  existingElementCount?: number;
}

export interface MagicCanvasPopupUpdate {
  popupTitle: string;
  popupContent: string;
  popupBody: string;
}

export interface MagicCanvasAiResponse {
  mode: 'create-elements' | 'update-selected-popup';
  summary: string;
  source: 'gemini' | 'smart-fallback';
  elements: CanvasElement[];
  popupUpdate?: MagicCanvasPopupUpdate;
}

const CULTURAL_TOPICS = [
  {
    title: 'Rumah Adat Nusantara',
    shortLabel: 'Rumah Adat',
    imageUrl: 'mobile/6EfvCxuLoY5.png',
    color: '#D97706',
    popupTitle: 'Keunikan Rumah Adat Nusantara',
    popupContent:
      'Setiap daerah di Indonesia memiliki arsitektur rumah adat yang khas, seperti Rumah Gadang di Sumatera Barat, Joglo di Jawa, dan Honai di Papua yang mencerminkan kearifan lokal.',
  },
  {
    title: 'Pakaian & Tarian Daerah',
    shortLabel: 'Busana & Tari',
    imageUrl: 'mobile/5WGLEVYzj2G.png',
    color: '#0284C7',
    popupTitle: 'Keindahan Busana & Tarian Tradisional',
    popupContent:
      'Keragaman pakaian adat dan seni tari daerah merupakan warisan luhur bangsa Indonesia yang wajib kita lestarikan dengan rasa bangga dan saling menghormati.',
  },
  {
    title: 'Alat Musik & Lagu Daerah',
    shortLabel: 'Musik Daerah',
    imageUrl: 'mobile/5fD3uOAkxBz.png',
    color: '#059669',
    popupTitle: 'Harmoni Alat Musik Tradisional',
    popupContent:
      'Angklung, Gamelan, Sasando, dan Tifa menghasilkan harmoni indah yang mengajarkan nilai persatuan dalam keberagaman (Bhinneka Tunggal Ika).',
  },
  {
    title: 'Nilai Pancasila & Toleransi',
    shortLabel: 'Nilai Pancasila',
    imageUrl: 'mobile/5X5KPiU9Isy.png',
    color: '#7C3AED',
    popupTitle: 'Pengamalan Nilai Pancasila & Bhinneka Tunggal Ika',
    popupContent:
      'Menghargai teman dari berbagai suku, agama, dan budaya adalah wujud nyata pengamalan sila ke-3 Pancasila: Persatuan Indonesia.',
  },
];

/**
 * Menormalkan objek parsial hasil AI menjadi `CanvasElement` yang 100% valid
 * dengan koordinat persentase (0-100%).
 */
export function normalizeAiCanvasElement(
  raw: Partial<CanvasElement>,
  index: number,
  existingCount = 0
): CanvasElement {
  const validTypes: CanvasElementType[] = [
    'image-button',
    'text',
    'image',
    'audio-button',
    'audio-hotspot',
  ];
  const resolvedType: CanvasElementType =
    raw.type && validTypes.includes(raw.type) ? raw.type : 'image-button';

  const validActions: CanvasActionType[] = [
    'none',
    'goto-slide',
    'play-audio',
    'open-popup',
    'external-url',
  ];
  const resolvedActionType: CanvasActionType =
    raw.action?.type && validActions.includes(raw.action.type)
      ? raw.action.type
      : resolvedType === 'audio-button' || resolvedType === 'audio-hotspot'
        ? 'play-audio'
        : resolvedType === 'image-button'
          ? 'open-popup'
          : 'none';

  const topic = CULTURAL_TOPICS[index % CULTURAL_TOPICS.length];
  const width = clampPct(Number(raw.width) || 24, 4, 100);
  const height = clampPct(Number(raw.height) || 12, 4, 100);
  const x = clampPct(
    raw.x !== undefined ? Number(raw.x) : 12 + index * 28,
    0,
    Math.max(0, 100 - width)
  );
  const y = clampPct(
    raw.y !== undefined ? Number(raw.y) : 76,
    0,
    Math.max(0, 100 - height)
  );

  const popupText =
    raw.action?.popupBody ||
    raw.action?.popupContent ||
    topic.popupContent;

  return {
    id:
      raw.id ||
      `ce_ai_${Date.now().toString(36)}_${index}_${Math.random().toString(36).slice(2, 5)}`,
    name: raw.name || raw.label || topic.shortLabel,
    type: resolvedType,
    x,
    y,
    width,
    height,
    zIndex: Number(raw.zIndex) || 45 + existingCount + index,
    locked: false,
    hidden: false,
    label: raw.label || topic.shortLabel,
    imageUrl:
      raw.imageUrl !== undefined
        ? raw.imageUrl
        : resolvedType === 'image-button' || resolvedType === 'image'
          ? topic.imageUrl
          : '',
    audioUrl:
      raw.audioUrl ||
      (resolvedType === 'audio-button' || resolvedType === 'audio-hotspot'
        ? 'story_content/6DeuLJzk41Q_44100_56_0.mp3'
        : ''),
    style: {
      backgroundColor: raw.style?.backgroundColor || topic.color,
      textColor: raw.style?.textColor || '#FFFFFF',
      fontSize: Number(raw.style?.fontSize) || 14,
      fontWeight: raw.style?.fontWeight || 'bold',
      borderRadius:
        raw.style?.borderRadius !== undefined
          ? Number(raw.style.borderRadius)
          : 12,
      borderWidth: Number(raw.style?.borderWidth) || 1,
      borderColor: raw.style?.borderColor || '#FBBF24',
      opacity: 1,
      shadow: raw.style?.shadow || 'md',
      hoverEffect: raw.style?.hoverEffect || 'scale',
      objectFit: raw.style?.objectFit || 'contain',
      textPosition: raw.style?.textPosition || 'overlay',
      iconName: raw.style?.iconName || '★',
    },
    action: {
      type: resolvedActionType,
      targetSlideIndex: raw.action?.targetSlideIndex,
      targetSlideId: raw.action?.targetSlideId,
      audioUrl: raw.action?.audioUrl || raw.audioUrl,
      popupTitle: raw.action?.popupTitle || topic.popupTitle,
      popupBody: popupText,
      popupContent: popupText,
      externalUrl: raw.action?.externalUrl,
    },
  };
}

/**
 * Generator deterministik cerdas untuk membuat elemen kanvas atau isi materi pop-up
 * berdasarkan instruksi bahasa alami admin (berfungsi instan & sebagai fallback aman).
 */
export function generateMagicCanvasAiLocal(
  request: MagicCanvasAiRequest
): MagicCanvasAiResponse {
  const promptLower = (request.prompt || '').trim().toLowerCase();
  const existingCount = request.existingElementCount || 0;

  // Deteksi apakah admin meminta pembuatan isi materi pop-up untuk tombol yang sedang dipilih
  const isPopupContentPrompt =
    (promptLower.includes('pop-up') ||
      promptLower.includes('popup') ||
      promptLower.includes('isi materi') ||
      promptLower.includes('penjelasan')) &&
    !promptLower.includes('buatkan 3') &&
    !promptLower.includes('buatkan 2') &&
    !promptLower.includes('buatkan 4') &&
    (promptLower.includes('tombol ini') ||
      promptLower.includes('elemen ini') ||
      Boolean(request.selectedElement));

  if (isPopupContentPrompt && request.selectedElement) {
    const labelContext =
      request.selectedElement.label ||
      request.slideTitle ||
      'Budaya Nusantara';
    const popupTitle = `Eksplorasi: ${labelContext}`;
    const popupContent = `${labelContext} merupakan bagian penting dari kekayaan budaya Indonesia. Melalui pemahaman dan sikap saling menghormati, kita turut menjaga persatuan dalam bingkai Bhinneka Tunggal Ika.`;

    return {
      mode: 'update-selected-popup',
      summary: `Isi materi pop-up untuk "${labelContext}" berhasil dibuat oleh Magic AI.`,
      source: 'smart-fallback',
      elements: [],
      popupUpdate: {
        popupTitle,
        popupContent,
        popupBody: popupContent,
      },
    };
  }

  // Deteksi jumlah elemen yang diminta (misal: "Buatkan 3 tombol bergambar menu materi di bagian bawah")
  const numberMatch = promptLower.match(/\b([1-6])\b/);
  let count = numberMatch ? Number(numberMatch[1]) : 1;
  if (
    !numberMatch &&
    (promptLower.includes('menu materi') || promptLower.includes('deretan'))
  ) {
    count = 3;
  }

  // Deteksi posisi vertikal (bawah / atas / tengah)
  let targetY = 78;
  if (promptLower.includes('atas') || promptLower.includes('header')) {
    targetY = 10;
  } else if (promptLower.includes('tengah')) {
    targetY = 44;
  } else if (promptLower.includes('bawah') || promptLower.includes('footer')) {
    targetY = 78;
  }

  // Deteksi tipe elemen
  let elementType: CanvasElementType = 'image-button';
  if (
    promptLower.includes('suara') ||
    promptLower.includes('audio') ||
    promptLower.includes('narasi')
  ) {
    elementType = 'audio-button';
  } else if (
    (promptLower.includes('judul') || promptLower.includes('teks')) &&
    !promptLower.includes('tombol')
  ) {
    elementType = 'text';
  } else if (
    (promptLower.includes('stiker') || promptLower.includes('gambar')) &&
    !promptLower.includes('tombol')
  ) {
    elementType = 'image';
  }

  // Hitung distribusi horizontal yang proporsional (0 - 100%)
  const gap = 4;
  const totalAvailableWidth = 84; // margin kiri 8%, kanan 8%
  const itemWidth =
    count === 1
      ? elementType === 'text'
        ? 52
        : 28
      : Math.max(14, Math.floor((totalAvailableWidth - gap * (count - 1)) / count));
  const itemHeight =
    elementType === 'image' ? 26 : elementType === 'text' ? 14 : 12;

  const totalRowWidth = count * itemWidth + (count - 1) * gap;
  const startX = Math.max(4, Math.round((100 - totalRowWidth) / 2));

  const generatedElements: CanvasElement[] = [];
  for (let i = 0; i < count; i++) {
    const topic = CULTURAL_TOPICS[i % CULTURAL_TOPICS.length];
    const xPos = clampPct(startX + i * (itemWidth + gap), 0, 100 - itemWidth);

    let customLabel = topic.shortLabel;
    if (count === 1 && request.prompt.trim().length > 0) {
      const quoted = request.prompt.match(/"([^"]+)"|'([^']+)'/);
      if (quoted) {
        customLabel = quoted[1] || quoted[2];
      } else if (elementType === 'text') {
        customLabel = request.slideTitle
          ? `Eksplorasi ${request.slideTitle}`
          : 'Eksplorasi Budaya Nusantara';
      }
    }

    generatedElements.push(
      normalizeAiCanvasElement(
        {
          type: elementType,
          x: xPos,
          y: targetY,
          width: itemWidth,
          height: itemHeight,
          label: customLabel,
          imageUrl:
            elementType === 'image-button' || elementType === 'image'
              ? topic.imageUrl
              : '',
          style: {
            backgroundColor:
              elementType === 'text'
                ? 'rgba(15, 23, 42, 0.88)'
                : topic.color,
            textColor: '#FFFFFF',
            fontSize: 14,
            fontWeight: 'bold',
            borderRadius: elementType === 'audio-button' ? 999 : 12,
            borderWidth: 1,
            borderColor: '#FBBF24',
            shadow: 'md',
            hoverEffect: 'scale',
            objectFit: 'contain',
          },
          action: {
            type:
              elementType === 'audio-button'
                ? 'play-audio'
                : elementType === 'image-button'
                  ? 'open-popup'
                  : 'none',
            popupTitle: topic.popupTitle,
            popupBody: topic.popupContent,
            popupContent: topic.popupContent,
          },
        },
        i,
        existingCount
      )
    );
  }

  return {
    mode: 'create-elements',
    summary: `Magic AI berhasil menambahkan ${generatedElements.length} elemen (${elementType}) ke slide aktif.`,
    source: 'smart-fallback',
    elements: generatedElements,
  };
}

/**
 * Memanggil endpoint server `/api/gemini/magic-canvas` (menggunakan `@google/genai` di sisi server)
 * dengan fallback otomatis ke `generateMagicCanvasAiLocal` jika offline atau variabel kunci belum disetel.
 */
export async function requestMagicCanvasAi(
  request: MagicCanvasAiRequest
): Promise<MagicCanvasAiResponse> {
  try {
    if (typeof fetch !== 'function') {
      return generateMagicCanvasAiLocal(request);
    }

    const res = await fetch('/api/gemini/magic-canvas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      return generateMagicCanvasAiLocal(request);
    }

    const data = (await res.json()) as Partial<MagicCanvasAiResponse>;

    if (
      data.mode === 'update-selected-popup' &&
      data.popupUpdate &&
      data.popupUpdate.popupTitle
    ) {
      return {
        mode: 'update-selected-popup',
        summary:
          data.summary || 'Materi pop-up berhasil diperbarui oleh Gemini AI.',
        source: data.source || 'gemini',
        elements: [],
        popupUpdate: {
          popupTitle: data.popupUpdate.popupTitle,
          popupContent:
            data.popupUpdate.popupContent || data.popupUpdate.popupBody || '',
          popupBody:
            data.popupUpdate.popupBody || data.popupUpdate.popupContent || '',
        },
      };
    }

    if (Array.isArray(data.elements) && data.elements.length > 0) {
      const normalized = data.elements.map((el, idx) =>
        normalizeAiCanvasElement(el, idx, request.existingElementCount || 0)
      );
      return {
        mode: 'create-elements',
        summary:
          data.summary ||
          `Gemini Magic AI menambahkan ${normalized.length} elemen baru ke kanvas.`,
        source: data.source || 'gemini',
        elements: normalized,
      };
    }

    return generateMagicCanvasAiLocal(request);
  } catch {
    return generateMagicCanvasAiLocal(request);
  }
}
