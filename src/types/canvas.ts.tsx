// src/types/canvas.ts

export type ResizeDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export type CanvasElementType = 'image-button' | 'text' | 'image' | 'audio-button';

export type CanvasActionType = 'none' | 'goto-slide' | 'play-audio' | 'open-popup' | 'external-url';

export interface CanvasElementStyle {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'bold' | 'extrabold';
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  opacity: number;
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  hoverEffect: 'none' | 'scale' | 'lift' | 'pulse' | 'glow';
  objectFit: 'cover' | 'contain' | 'fill';
  textPosition: 'overlay' | 'bottom' | 'top' | 'hidden';
}

export interface CanvasElementAction {
  type: CanvasActionType;
  targetSlideIndex?: number;
  audioUrl?: string;
  popupTitle?: string;
  popupContent?: string;
  externalUrl?: string;
}

export interface CanvasElement {
  id: string;
  name: string;
  type: CanvasElementType;
  x: number;      // Persentase 0 - 100 relatif terhadap lebar kanvas
  y: number;      // Persentase 0 - 100 relatif terhadap tinggi kanvas
  width: number;  // Persentase 2 - 100
  height: number; // Persentase 2 - 100
  zIndex: number;
  locked: boolean;
  hidden: boolean;
  label: string;
  imageUrl?: string;
  audioUrl?: string;
  style: CanvasElementStyle;
  action: CanvasElementAction;
}

export interface OriginalElementOverride {
  id: string;
  label?: string;
  xDeltaPct: number; // Pergeseran horizontal (%) dari posisi asli
  yDeltaPct: number; // Pergeseran vertikal (%) dari posisi asli
  scale: number;     // Skala ukuran (default 1)
  hidden: boolean;   // Jika true, elemen asli disembunyikan (Non-destructive delete)
  customText?: string;
  customImageUrl?: string;
  customAudioUrl?: string;
}

export interface SlideData {
  id: string;
  title: string;
  backgroundUrl?: string;
  bgmUrl?: string;
  elements: CanvasElement[];
  originalOverrides: Record<string, OriginalElementOverride>;
}

export interface AppContentData {
  projectTitle: string;
  version: number;
  updatedAt: string;
  slides: SlideData[];
}