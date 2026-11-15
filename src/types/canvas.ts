// src/types/canvas.ts

export type ResizeDirection =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

export type CanvasActionType =
  | 'none'
  | 'goto-slide'
  | 'play-audio'
  | 'open-popup'
  | 'external-url';

export type CanvasElementType =
  | 'image-button'
  | 'text'
  | 'image'
  | 'audio-button'
  | 'audio-hotspot';

export type CanvasShadowPreset = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';

export type CanvasHoverEffect =
  | 'none'
  | 'scale'
  | 'lift'
  | 'pulse'
  | 'glow'
  | 'zoom'
  | 'bounce';

export type CanvasAnimationType =
  | 'none'
  | 'fade-in'
  | 'pop-zoom'
  | 'slide-up'
  | 'slide-left'
  | 'bounce';

export interface CanvasElementAnimation {
  type: CanvasAnimationType;
  delay: number;    // Waktu mulai / delay dalam detik (mis. 0 - 10)
  duration: number; // Durasi animasi dalam detik (mis. 0.2 - 5)
}

export type ResizeHandleDirection = ResizeDirection;

export interface CanvasElementStyle {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'medium' | 'bold' | 'extrabold';
  textAlign?: 'left' | 'center' | 'right';
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
  shadow?: CanvasShadowPreset | boolean;
  hoverEffect?: CanvasHoverEffect;
  objectFit?: 'cover' | 'contain' | 'fill';
  textPosition?: 'overlay' | 'bottom' | 'top' | 'hidden';
  iconName?: string;
}

export interface CanvasElementAction {
  type: CanvasActionType;
  targetSlideIndex?: number;
  targetSlideId?: string;
  audioUrl?: string;
  popupTitle?: string;
  popupBody?: string;
  popupContent?: string;
  externalUrl?: string;
}

export type CanvasActionConfig = CanvasElementAction;

export interface CanvasElement {
  id: string;
  name?: string;
  type: CanvasElementType;
  x: number;      // Posisi horizontal dalam Persentase (0 - 100)
  y: number;      // Posisi vertikal dalam Persentase (0 - 100)
  width: number;  // Lebar dalam Persentase (1 - 100)
  height: number; // Tinggi dalam Persentase (1 - 100)
  zIndex: number;
  locked?: boolean;
  hidden?: boolean;
  // Konten Visual & Audio
  label?: string;
  imageUrl?: string;
  audioUrl?: string;
  // Kustomisasi Gaya UI
  style: CanvasElementStyle;
  // Aksi Interaktif saat Diklik
  action: CanvasElementAction;
  // Pengaturan Timeline Animasi (Canva / Articulate Style)
  animation?: CanvasElementAnimation;
}

export interface OriginalElementOverride {
  id: string;
  label?: string;
  xDeltaPct: number; // Pergeseran horizontal (%) dari posisi asli
  yDeltaPct: number; // Pergeseran vertikal (%) dari posisi asli
  scale?: number;    // Skala ukuran (default 1)
  hidden: boolean;   // Jika true, elemen asli disembunyikan (Non-destructive delete)
  customText?: string;
  customImageUrl?: string;
  customAudioUrl?: string;
  animation?: CanvasElementAnimation;
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

/**
 * Mengonversi nilai `style.shadow` ('none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow' | boolean)
 * menjadi nilai CSS `box-shadow` yang presisi.
 */
export function resolveCanvasShadowCss(
  shadow: CanvasShadowPreset | boolean | undefined
): string {
  if (!shadow || shadow === 'none') {
    return 'none';
  }
  if (shadow === true || shadow === 'md') {
    return '0 8px 20px rgba(0, 0, 0, 0.45)';
  }
  if (shadow === 'sm') {
    return '0 3px 8px rgba(0, 0, 0, 0.32)';
  }
  if (shadow === 'lg') {
    return '0 16px 34px rgba(0, 0, 0, 0.65)';
  }
  if (shadow === 'xl') {
    return '0 24px 48px rgba(0, 0, 0, 0.78)';
  }
  if (shadow === 'glow') {
    return '0 0 22px rgba(245, 158, 11, 0.78)';
  }
  return 'none';
}

/**
 * Menormalkan nilai `style.shadow` ke salah satu preset standar ('none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow')
 * untuk ditampilkan pada dropdown Property Inspector.
 */
export function normalizeShadowPreset(
  shadow: CanvasShadowPreset | boolean | undefined
): CanvasShadowPreset {
  if (!shadow || shadow === 'none') return 'none';
  if (shadow === true) return 'md';
  return shadow;
}

/**
 * Menghasilkan efek transformasi & bayangan saat elemen di-hover di Mode Pengguna (`!isCanvasEditMode`).
 */
export function resolveCanvasHoverStyle(
  hoverEffect: CanvasHoverEffect | undefined,
  isHovered: boolean
): { transform: string; boxShadow?: string } {
  if (!isHovered || !hoverEffect || hoverEffect === 'none') {
    return { transform: 'none' };
  }
  if (hoverEffect === 'scale' || hoverEffect === 'zoom') {
    return { transform: 'scale(1.06)' };
  }
  if (hoverEffect === 'lift' || hoverEffect === 'bounce') {
    return { transform: 'translateY(-5px) scale(1.02)' };
  }
  if (hoverEffect === 'pulse') {
    return {
      transform: 'scale(1.04)',
      boxShadow: '0 0 24px rgba(56, 189, 248, 0.85)',
    };
  }
  if (hoverEffect === 'glow') {
    return {
      transform: 'none',
      boxShadow: '0 0 22px rgba(251, 191, 36, 0.85)',
    };
  }
  return { transform: 'none' };
}

export const CANVAS_ANIMATION_KEYFRAMES_CSS = `
@keyframes starlaCanvaFadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes starlaCanvaPopZoom {
  0% { opacity: 0; transform: scale(0.55); }
  75% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes starlaCanvaSlideUp {
  0% { opacity: 0; transform: translateY(28px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes starlaCanvaSlideLeft {
  0% { opacity: 0; transform: translateX(32px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes starlaCanvaBounce {
  0% { opacity: 0; transform: translateY(-28px) scale(0.92); }
  55% { opacity: 1; transform: translateY(6px) scale(1.03); }
  80% { transform: translateY(-3px) scale(0.99); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
`;

export function resolveCanvasAnimationCss(
  animation: CanvasElementAnimation | undefined
): {
  animationName?: string;
  animationDuration?: string;
  animationDelay?: string;
  animationFillMode?: string;
  animationTimingFunction?: string;
} {
  if (!animation || !animation.type || animation.type === 'none') {
    return {};
  }
  const keyframeMap: Record<Exclude<CanvasAnimationType, 'none'>, string> = {
    'fade-in': 'starlaCanvaFadeIn',
    'pop-zoom': 'starlaCanvaPopZoom',
    'slide-up': 'starlaCanvaSlideUp',
    'slide-left': 'starlaCanvaSlideLeft',
    bounce: 'starlaCanvaBounce',
  };
  const animName = keyframeMap[animation.type];
  if (!animName) return {};
  const delaySec = Math.max(0, Number(animation.delay) || 0);
  const durationSec = Math.max(0.1, Number(animation.duration) || 0.6);

  return {
    animationName: animName,
    animationDuration: `${durationSec}s`,
    animationDelay: `${delaySec}s`,
    animationFillMode: 'both',
    animationTimingFunction:
      animation.type === 'bounce' || animation.type === 'pop-zoom'
        ? 'cubic-bezier(0.22, 1, 0.36, 1)'
        : 'cubic-bezier(0.16, 1, 0.3, 1)',
  };
}

