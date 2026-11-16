import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Gamepad2,
  HelpCircle,
  Layout,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  Filter,
  Download,
  Edit3,
  Trash2,
  LogOut,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
  Award,
  Move,
  Image as ImageIcon,
  Volume2,
  ExternalLink,
  RotateCcw,
  Eye,
  Save,
  X,
  Upload,
  Sparkles,
  Link2,
  Layers,
  Play,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { useContent } from './context/ContentContext';
import {
  defaultContent,
  type ContentSchema,
  type CanvasElement,
} from './data/defaultContent';
import {
  applySlidePatch,
  applyQuizQuestionPatch,
} from './utils/contentRuntimeBridge';
import {
  addSlideItem,
  deleteSlideItem,
  addQuizQuestionItem,
  addDragDropStatement,
  updateDragDropStatement,
  removeDragDropStatement,
  exportContentToJsonString,
  parseAndValidateImportedJson,
  isAdminRouteActive,
} from './features/admin/adminHelpers';
import {
  applyAddCanvasElement,
  applyUpdateCanvasElement,
  applyDeleteCanvasElement,
  applyResetSingleSlide,
} from './features/canvas/canvasMath';
import {
  getSmartSlideMeta,
  getMateriBudayaSlides,
  loadExactSlideStageData,
  type ExactSlideRuntimeData,
  type SlideCategoryType,
} from './utils/slideExactMeta';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AdminTabKey =
  | 'dashboard'
  | 'materi'
  | 'tur360'
  | 'gim'
  | 'kuis'
  | 'desain'
  | 'analitik'
  | 'pengaturan';

export type BadgeStatus =
  | 'Active'
  | 'Pending'
  | 'Inactive'
  | 'Unggulan'
  | 'Populer';

export interface Tur360EmbedItem {
  id: string;
  embedUrl: string;
  slideId?: string;
}

export interface GimCustomItem {
  id: string;
  title: string;
  category: string;
  targetChoice: 'Budaya yang Benar' | 'Budaya yang Salah';
  points: number;
  status: BadgeStatus;
  imageUrl: string;
  audioUrl: string;
  statementId?: string;
}

export interface StudentAnalyticsItem {
  id: string;
  name: string;
  school: string;
  completedModules: number;
  quizScore: number;
  garudaPoints: number;
  status: BadgeStatus;
  avatarUrl: string;
  lastActive: string;
}

export interface AdminExtraState {
  tur360List: Tur360EmbedItem[];
  analyticsList: StudentAnalyticsItem[];
  statusOverrides: Record<string, BadgeStatus>;
  categoryOverrides: Record<string, string>;
}

export interface AdminDataContextValue {
  activeContent: ContentSchema;
  updateContent: (
    updater:
      | Partial<ContentSchema>
      | ((prev: ContentSchema) => ContentSchema)
  ) => void;
  saveToCloud: () => Promise<any>;
  resetToDefault: () => void;
  extraState: AdminExtraState;
  setExtraState: React.Dispatch<React.SetStateAction<AdminExtraState>>;
  isAdminOpen: boolean;
  setIsAdminOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  activeSlideId: string;
  totalSlides: number;
  navigateToPublicSlide: (slideId: string) => void;
}

const ADMIN_EXTRA_STORAGE_KEY = 'starla_admin_extra_v2';

const DEFAULT_EXTRA_STATE: AdminExtraState = {
  tur360List: [
    {
      id: '360-01',
      embedUrl: 'https://faryzt.github.io/starla-360/',
      slideId: '5jTlwgcUi8o',
    },
  ],
  analyticsList: [
    {
      id: 'STD-101',
      name: 'Putu Ayu Prameswari',
      school: 'SDN 1 Denpasar',
      completedModules: 17,
      quizScore: 100,
      garudaPoints: 20,
      status: 'Unggulan',
      avatarUrl: 'story_content/5hv8C0oRfrb.png',
      lastActive: 'Hari ini, 09:40 WITA',
    },
    {
      id: 'STD-102',
      name: 'Bima Arya Pratama',
      school: 'SDN Menteng 01 Jakarta',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 20,
      status: 'Populer',
      avatarUrl: 'story_content/5r8KdQdV9SH.png',
      lastActive: 'Hari ini, 08:15 WIB',
    },
    {
      id: 'STD-103',
      name: 'Siti Nurbaya Lubis',
      school: 'SDN 060812 Medan',
      completedModules: 15,
      quizScore: 90,
      garudaPoints: 18,
      status: 'Active',
      avatarUrl: 'story_content/62oB2J2cBdW.png',
      lastActive: 'Kemarin, 14:20 WIB',
    },
    {
      id: 'STD-104',
      name: 'Fransiskus Yoman',
      school: 'SD Inpres Kotaraja Jayapura',
      completedModules: 14,
      quizScore: 80,
      garudaPoints: 16,
      status: 'Active',
      avatarUrl: 'story_content/5s6NWFwiK9z.png',
      lastActive: 'Kemarin, 11:05 WIT',
    },
    {
      id: 'STD-105',
      name: 'Raden Bagus Satrio',
      school: 'SDN Ungaran 1 Yogyakarta',
      completedModules: 12,
      quizScore: 80,
      garudaPoints: 14,
      status: 'Pending',
      avatarUrl: 'story_content/6Z7ek63QC1F.png',
      lastActive: '2 hari lalu',
    },
  ],
  statusOverrides: {},
  categoryOverrides: {},
};

const STARLA_ADMIN_SCOPED_CSS = `
#starla-admin-portal-root {
  position: fixed !important;
  inset: 0 !important;
  pointer-events: none !important;
  z-index: 2147483647 !important;
}
#open-admin-dashboard-btn {
  position: fixed !important;
  bottom: 16px !important;
  right: 16px !important;
  z-index: 2147483647 !important;
  pointer-events: auto !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 10px 16px !important;
  border-radius: 9999px !important;
  background: linear-gradient(135deg, #12267A 0%, #2563EB 100%) !important;
  color: #ffffff !important;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  border: 1px solid rgba(255, 255, 255, 0.28) !important;
  box-shadow: 0 12px 28px rgba(18, 38, 122, 0.45) !important;
  cursor: pointer !important;
}
.starla-saas-admin {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483647 !important;
  pointer-events: auto !important;
  background-color: #EEF2FA !important;
  color: #1E293B !important;
  display: flex !important;
  overflow: hidden !important;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif !important;
  box-sizing: border-box !important;
}
.starla-saas-admin *, .starla-saas-admin *::before, .starla-saas-admin *::after {
  box-sizing: border-box;
}
.starla-saas-admin h1,
.starla-saas-admin h2,
.starla-saas-admin h3,
.starla-saas-admin h4,
.starla-saas-admin p {
  margin: 0;
}
.starla-saas-admin input[type="text"].rounded-full {
  border-radius: 9999px !important;
  padding-left: 2.75rem !important;
  padding-right: 1rem !important;
  padding-top: 0.625rem !important;
  padding-bottom: 0.625rem !important;
}
.starla-saas-admin input[type="text"]:not(.rounded-full),
.starla-saas-admin input[type="url"],
.starla-saas-admin input[type="number"],
.starla-saas-admin select,
.starla-saas-admin textarea {
  border-radius: 0.75rem !important;
  padding: 0.625rem 0.875rem !important;
}
`;

function syncUnlayeredTailwind(isAdminActive: boolean): void {
  if (typeof document === 'undefined') return;
  let unlayeredEl = document.getElementById(
    'starla-tailwind-unlayered'
  ) as HTMLStyleElement | null;

  if (!isAdminActive) {
    document.documentElement.style.removeProperty('font-size');
    if (unlayeredEl) {
      unlayeredEl.disabled = true;
    }
    return;
  }

  document.documentElement.style.fontSize = '16px';

  const twStyle = Array.from(document.querySelectorAll('style')).find(
    (s) =>
      s.id !== 'starla-tailwind-unlayered' &&
      s.textContent &&
      s.textContent.includes('tailwindcss')
  );

  if (twStyle && twStyle.textContent) {
    if (!unlayeredEl) {
      unlayeredEl = document.createElement('style');
      unlayeredEl.id = 'starla-tailwind-unlayered';
      document.head.appendChild(unlayeredEl);
    }
    unlayeredEl.disabled = false;
    const unlayeredCss = twStyle.textContent
      .replace(/@layer\s+properties\s*;/g, '')
      .replace(/@layer\s+theme\s*,\s*base\s*,\s*components\s*,\s*utilities\s*;/g, '')
      .replace(
        /@layer\s+(theme|base|components|utilities|properties)\s*\{/g,
        '@media all {'
      );
    if (unlayeredEl.textContent !== unlayeredCss) {
      unlayeredEl.textContent = unlayeredCss;
    }
    if (document.head.lastElementChild !== unlayeredEl) {
      document.head.appendChild(unlayeredEl);
    }
  }
}

function ensureAdminStylesAndPortalRoot(
  isAdminActive = false
): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  if (!document.getElementById('starla-admin-scoped-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'starla-admin-scoped-styles';
    styleEl.textContent = STARLA_ADMIN_SCOPED_CSS;
    document.head.appendChild(styleEl);
  }

  if (!document.getElementById('starla-tailwind-runtime')) {
    const scriptEl = document.createElement('script');
    scriptEl.id = 'starla-tailwind-runtime';
    scriptEl.src = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';
    scriptEl.onload = () => syncUnlayeredTailwind(isAdminActive);
    document.head.appendChild(scriptEl);
  }

  syncUnlayeredTailwind(isAdminActive);

  let root = document.getElementById('starla-admin-portal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'starla-admin-portal-root';
    document.body.appendChild(root);
  } else if (document.body.lastElementChild !== root) {
    document.body.appendChild(root);
  }
  return root;
}

const AdminDataContext = createContext<AdminDataContextValue | undefined>(
  undefined
);

export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error('useAdminData must be used within <AdminDashboard>');
  }
  return ctx;
}

// ============================================================================
// EXACT SVG NODE RENDERER FOR "DESAIN SLIDE" (100% PUBLIC LAYOUT LOCK)
// ============================================================================

function renderPathsSvgNode(
  node: any,
  key: string | number,
  svgTextOverrides: Record<string, { commandSetId?: string; lines: string[] }>,
  activeCommandSetId?: string | null,
  lineCounter?: { index: number }
): React.ReactNode {
  if (!node || typeof node !== 'object') return null;
  const Tag = node.nodeType as string;
  if (!Tag) return null;

  const props: Record<string, any> = { key };
  for (const [k, v] of Object.entries(node)) {
    if (k === 'nodeType' || k === 'children' || k.startsWith('commandset-')) {
      continue;
    }
    if (k === 'xlink:href') {
      props.href = v;
    } else if (k === 'stroke-width') {
      props.strokeWidth = v;
    } else if (k === 'stroke-linecap') {
      props.strokeLinecap = v;
    } else if (k === 'stroke-linejoin') {
      props.strokeLinejoin = v;
    } else if (k === 'stroke-opacity') {
      props.strokeOpacity = v;
    } else if (k === 'fill-opacity') {
      props.fillOpacity = v;
    } else if (k === 'fill-rule') {
      props.fillRule = v;
    } else if (k === 'font-family') {
      props.fontFamily = "'Arial Rounded MT Bold', 'Nunito', sans-serif";
    } else if (k === 'font-size') {
      props.fontSize = v;
    } else if (k === 'stop-color') {
      props.stopColor = v;
    } else if (k === 'stop-opacity') {
      props.stopOpacity = v;
    } else if (k === 'flood-color') {
      props.floodColor = v;
    } else if (k === 'flood-opacity') {
      props.floodOpacity = v;
    } else if (Tag === 'tspan' && k === 'x' && typeof v === 'string') {
      // Use the starting X coordinate of the line so fallback browser font renders cleanly without glyph overlap
      props.x = v.trim().split(/\s+/)[0] || '0';
    } else if (typeof v === 'string' || typeof v === 'number') {
      props[k] = v;
    }
  }

  const children = Array.isArray(node.children)
    ? node.children.map((ch: any, idx: number) => {
        if (typeof ch === 'string') {
          if (
            Tag === 'tspan' &&
            activeCommandSetId &&
            svgTextOverrides[activeCommandSetId] &&
            lineCounter
          ) {
            const customLines = svgTextOverrides[activeCommandSetId].lines;
            const currentIdx = lineCounter.index;
            lineCounter.index += 1;
            if (typeof customLines[currentIdx] === 'string') {
              return customLines[currentIdx];
            }
          }
          return ch;
        }
        return renderPathsSvgNode(
          ch,
          idx,
          svgTextOverrides,
          activeCommandSetId,
          lineCounter
        );
      })
    : null;

  return React.createElement(Tag, props, children);
}

const ExactSlideStageCanvas: React.FC<{
  slideId: string;
  activeContent: ContentSchema;
  tur360Url: string;
  selectedCustomElId: string | null;
  onSelectCustomEl: (id: string | null) => void;
  onStartDragCustomEl: (
    e: React.PointerEvent<HTMLDivElement>,
    el: CanvasElement
  ) => void;
  onDeleteCustomEl: (id: string) => void;
}> = ({
  slideId,
  activeContent,
  tur360Url,
  selectedCustomElId,
  onSelectCustomEl,
  onStartDragCustomEl,
  onDeleteCustomEl,
}) => {
  const [runtimeSlide, setRuntimeSlide] =
    useState<ExactSlideRuntimeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const slideData = activeContent.slides[slideId];
  const slideMeta = getSmartSlideMeta(slideId, slideData);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadExactSlideStageData(slideId).then((res) => {
      if (!cancelled) {
        setRuntimeSlide(res);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slideId]);

  const effectiveBgUrl =
    slideData?.backgroundUrl ||
    runtimeSlide?.backgroundUrl ||
    slideMeta.backgroundUrl;

  const customElements = slideData?.canvasElements || [];
  const elementOverrides = slideData?.elementOverrides || {};

  return (
    <div
      onClick={() => onSelectCustomEl(null)}
      className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-200/80 bg-[#0F172A] select-none"
    >
      {/* 1. EXACT SLIDE BACKGROUND (1280x720) */}
      {effectiveBgUrl && (
        <img
          src={effectiveBgUrl}
          alt={slideMeta.smartTitle}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
          draggable={false}
        />
      )}

      {/* 2. EXACT NATIVE STORYLINE OBJECTS AT 100% PUBLIC COORDINATES (xPos/1280, yPos/720) */}
      {runtimeSlide &&
        runtimeSlide.objects.map((obj) => {
          const override = elementOverrides[obj.id];
          if (override?.hidden) return null;

          const leftPct = (obj.xPos / 1280) * 100 + (override?.xDeltaPct || 0);
          const topPct = (obj.yPos / 720) * 100 + (override?.yDeltaPct || 0);
          const widthPct = override?.widthPct ?? (obj.width / 1280) * 100;
          const heightPct = override?.heightPct ?? (obj.height / 720) * 100;

          const shapeNode = obj.shapeCommandSetId
            ? runtimeSlide.pathsLib[obj.shapeCommandSetId]
            : null;
          const textNode = obj.textCommandSetId
            ? runtimeSlide.pathsLib[obj.textCommandSetId]
            : null;

          const resolvedImgUrl = override?.customImage || obj.imageUrl;

          return (
            <div
              key={obj.id}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                zIndex: obj.depth + 2,
              }}
              className="absolute pointer-events-none"
            >
              {/* Video Object (Slide 1 & Slide 7) */}
              {obj.kind === 'video' && obj.videoUrl && (
                <video
                  src={obj.videoUrl}
                  poster={obj.posterUrl || undefined}
                  controls
                  playsInline
                  className="w-full h-full object-cover pointer-events-auto rounded-none"
                />
              )}

              {/* WebObject 360° Budaya Embed (Slide 8) */}
              {obj.kind === 'webobject' && (
                <iframe
                  src={tur360Url || obj.webUrl || 'https://faryzt.github.io/starla-360/'}
                  title="360 Budaya Embed"
                  className="w-full h-full border-0 pointer-events-auto"
                />
              )}

              {/* Vector Shape / SVG Text from paths.js at exact object coordinates */}
              {(shapeNode || textNode) && obj.width > 0 && obj.height > 0 && (
                <svg
                  viewBox={`0 0 ${obj.width} ${obj.height}`}
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full overflow-visible"
                >
                  {shapeNode &&
                    renderPathsSvgNode(
                      shapeNode,
                      `shape_${obj.id}`,
                      activeContent.svgTextCommandSets
                    )}
                  {textNode &&
                    renderPathsSvgNode(
                      textNode,
                      `text_${obj.id}`,
                      activeContent.svgTextCommandSets,
                      obj.textCommandSetId,
                      { index: 0 }
                    )}
                </svg>
              )}

              {/* Native Image Object at exact Storyline coordinates */}
              {resolvedImgUrl && (
                <img
                  src={resolvedImgUrl}
                  alt={obj.altText || obj.id}
                  className="w-full h-full object-fill"
                  draggable={false}
                />
              )}

              {/* Native Text Input Placeholder (Slide 2 Login Nama & Sekolah) */}
              {obj.kind === 'textinput' && (
                <div className="w-full h-full rounded-lg border-2 border-amber-400/80 bg-white/90 px-3 flex items-center text-xs font-bold text-slate-600 shadow-inner">
                  {obj.id === '5pmNQLIknke'
                    ? 'Ketik nama kamu...'
                    : 'Ketik sekolah kamu...'}
                </div>
              )}
            </div>
          );
        })}

      {/* Fallback for newly created custom admin slides that don't have a .js file in html5/data/js */}
      {!loading && !runtimeSlide && slideData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#102372]/90 via-[#1E3A8A]/85 to-[#0F172A]/90 text-white">
          <div className="max-w-2xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider mb-3">
              {slideMeta.subTopic}
            </span>
            <h3 className="text-2xl font-extrabold text-amber-300 mb-3">
              {slideMeta.smartTitle}
            </h3>
            <p className="text-sm text-white/95 leading-relaxed">
              {slideMeta.smartSummary}
            </p>
          </div>
        </div>
      )}

      {/* 3. CUSTOM INTERACTIVE CANVAS ELEMENTS ADDED BY ADMIN (DRAGGABLE 60FPS) */}
      {customElements.map((el) => {
        const isSelected = selectedCustomElId === el.id;
        return (
          <div
            key={el.id}
            onPointerDown={(e) => onStartDragCustomEl(e, el)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectCustomEl(el.id);
            }}
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.width}%`,
              height: `${el.height}%`,
              backgroundColor: el.style?.backgroundColor || '#2563EB',
              color: el.style?.textColor || '#FFFFFF',
              borderRadius: `${el.style?.borderRadius ?? 12}px`,
              fontSize: `${el.style?.fontSize ?? 14}px`,
              zIndex: 50,
            }}
            className={`absolute flex items-center justify-center gap-2 px-3 py-1.5 font-bold shadow-lg cursor-move transition-shadow ${
              isSelected
                ? 'ring-2 ring-white outline outline-2 outline-blue-600'
                : 'hover:ring-2 hover:ring-blue-300'
            }`}
          >
            {el.imageUrl && (
              <img
                src={el.imageUrl}
                alt={el.label}
                className="w-5 h-5 rounded object-cover shrink-0 pointer-events-none"
              />
            )}
            <span className="truncate pointer-events-none">{el.label}</span>
            {isSelected && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCustomEl(el.id);
                }}
                className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700"
                title="Hapus Elemen Tambahan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================================================

export const AdminDashboard: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const {
    content: activeContent,
    updateContent,
    saveToCloud,
    resetContent: resetToDefault,
    isSaving,
  } = useContent();
  const syncStatus = isSaving ? 'saving' : 'idle';

  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isAdminRouteActive(window.location);
  });

  const [activeTab, setActiveTab] = useState<AdminTabKey>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showingCount, setShowingCount] = useState<number>(20);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Slide navigation state synced with public player & Desain Slide
  const [activeSlideIndex, setActiveSlideIndexState] = useState<number>(0);
  const [activeDesignSlideId, setActiveDesignSlideId] = useState<string>(
    () => activeContent.slideOrder[2] || activeContent.slideOrder[0] || '5dLAzY4SKGI'
  );
  const [designPreviewMode, setDesignPreviewMode] = useState<
    'exact-stage' | 'live-storyline'
  >('exact-stage');

  // 360° Budaya live preview state
  const [preview360Url, setPreview360Url] = useState<string | null>(null);

  // Extra state persisted in localStorage
  const [extraState, setExtraState] = useState<AdminExtraState>(() => {
    if (typeof window === 'undefined') return DEFAULT_EXTRA_STATE;
    try {
      const raw = window.localStorage.getItem(ADMIN_EXTRA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migrate legacy tur360List items to clean { id, embedUrl, slideId }
        const migrated360: Tur360EmbedItem[] = Array.isArray(parsed.tur360List)
          ? parsed.tur360List.map((item: any, idx: number) => ({
              id: item.id || `360-0${idx + 1}`,
              embedUrl:
                item.embedUrl ||
                item.url ||
                activeContent.appMeta.canonicalUrl ||
                'https://faryzt.github.io/starla-360/',
              slideId: item.slideId || '5jTlwgcUi8o',
            }))
          : DEFAULT_EXTRA_STATE.tur360List;
        return {
          ...DEFAULT_EXTRA_STATE,
          ...parsed,
          tur360List:
            migrated360.length > 0
              ? migrated360
              : DEFAULT_EXTRA_STATE.tur360List,
        };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_EXTRA_STATE;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        ADMIN_EXTRA_STORAGE_KEY,
        JSON.stringify(extraState)
      );
    } catch {
      // ignore
    }
  }, [extraState]);

  // Modal CRUD state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Bahasa Daerah');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formStatus, setFormStatus] = useState<BadgeStatus>('Active');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formAudioUrl, setFormAudioUrl] = useState<string>('');
  const [formEmbedUrl, setFormEmbedUrl] = useState<string>(
    'https://faryzt.github.io/starla-360/'
  );
  const [formChoices, setFormChoices] = useState<
    Array<{ id: string; text: string; isCorrect: boolean }>
  >([
    { id: 'c1', text: '', isCorrect: true },
    { id: 'c2', text: '', isCorrect: false },
    { id: 'c3', text: '', isCorrect: false },
    { id: 'c4', text: '', isCorrect: false },
  ]);
  const [formTargetGroup, setFormTargetGroup] = useState<
    'Budaya yang Benar' | 'Budaya yang Salah'
  >('Budaya yang Benar');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Dragging state in "Desain Slide"
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [selectedCanvasElId, setSelectedCanvasElId] = useState<string | null>(
    null
  );
  const [dragState, setDragState] = useState<{
    elementId: string;
    startX: number;
    startY: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  // Sync URL hash/query when opening/closing admin
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      setIsAdminOpen(isAdminRouteActive(window.location));
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Keyboard shortcut Ctrl+Shift+A / Alt+A
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeSlideId = useMemo(() => {
    return (
      activeContent.slideOrder[activeSlideIndex] ||
      activeContent.slideOrder[0] ||
      '6AR4SV4ZYat'
    );
  }, [activeContent.slideOrder, activeSlideIndex]);

  const navigateToPublicSlide = useCallback(
    (slideId: string) => {
      const idx = activeContent.slideOrder.indexOf(slideId);
      if (idx >= 0) {
        setActiveSlideIndexState(idx);
      }
      setActiveDesignSlideId(slideId);
      if (typeof window !== 'undefined') {
        try {
          const w = window as any;
          if (w.DS && w.DS.windowManager) {
            w.DS.windowManager.gotoSlide?.(slideId);
          }
          window.postMessage(
            { type: 'STARLA_GOTO_SLIDE', slideId, slideIndex: idx },
            '*'
          );
        } catch {
          // ignore
        }
      }
    },
    [activeContent.slideOrder]
  );

  const setActiveSlideIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(
        0,
        Math.min(activeContent.slideOrder.length - 1, index)
      );
      setActiveSlideIndexState(clamped);
      const targetId = activeContent.slideOrder[clamped];
      if (targetId) {
        navigateToPublicSlide(targetId);
      }
    },
    [activeContent.slideOrder, navigateToPublicSlide]
  );

  // ============================================================================
  // DERIVED MODULE DATASETS (SMART, ACCURATE & STRUCTURED)
  // ============================================================================

  // 1. Materi Budaya ONLY ("Materi berisi slide materi saja")
  const materiItems = useMemo(() => {
    const pureMateriList = getMateriBudayaSlides(
      activeContent.slideOrder,
      activeContent.slides
    );
    return pureMateriList.map(({ slide, meta }, idx) => {
      const customImg = slide.images[0]?.url;
      const firstImg =
        customImg &&
        (customImg.startsWith('data:') ||
          customImg.startsWith('http') ||
          customImg.startsWith('mobile/'))
          ? customImg
          : meta.backgroundUrl || customImg || 'story_content/5hv8C0oRfrb.png';
      const firstAudio =
        slide.audios[0]?.url ||
        'story_content/6k7JPOlasPL_44100_56_0.mp3';
      const status: BadgeStatus =
        extraState.statusOverrides[slide.id] ||
        (idx < 4 ? 'Unggulan' : idx < 10 ? 'Populer' : 'Active');
      const category =
        extraState.categoryOverrides[slide.id] || meta.subTopic;

      return {
        id: slide.id,
        code: `#MTR-${String(idx + 1).padStart(2, '0')} (Slide ${meta.slideNumber})`,
        slideNumber: meta.slideNumber,
        title: meta.smartTitle,
        category,
        description: meta.smartSummary,
        metricLabel: `${slide.audios.length} Audio • ${slide.images.length} Aset Visual`,
        status,
        imageUrl: firstImg,
        audioUrl: firstAudio,
      };
    });
  }, [
    activeContent.slideOrder,
    activeContent.slides,
    extraState.statusOverrides,
    extraState.categoryOverrides,
  ]);

  // 2. 360° Budaya (ONLY Embed URL column as requested: "pada 360 budaya hanya ada kolom tautan embed")
  const tur360Items = useMemo(() => {
    return extraState.tur360List.map((item, idx) => ({
      id: item.id,
      code: `#360-${String(idx + 1).padStart(2, '0')}`,
      embedUrl: item.embedUrl,
      slideId: item.slideId || '5jTlwgcUi8o',
    }));
  }, [extraState.tur360List]);

  // 3. Gim Edukasi (Tebak Budaya Slides 4, 5, 6 + Gim Drag & Drop Anak Garuda Statements)
  const gimItems = useMemo<GimCustomItem[]>(() => {
    const warmups: GimCustomItem[] = (
      ['6XQ2Lfxmzw1', '5y0cYcWaZ3N', '5iWbenzMEWM'] as const
    ).map((sId, idx) => {
      const sl = activeContent.slides[sId];
      const meta = getSmartSlideMeta(sId, sl, idx);
      return {
        id: `GIM-TEBAK-${idx + 1}`,
        title: meta.smartTitle,
        category: 'Gim Tebak Gambar (Slide ' + meta.slideNumber + ')',
        targetChoice: 'Budaya yang Benar',
        points: 10,
        status: 'Unggulan',
        imageUrl:
          sl?.images?.[1]?.url ||
          sl?.images?.[0]?.url ||
          'story_content/5hv8C0oRfrb.png',
        audioUrl:
          sl?.audios?.[0]?.url ||
          'story_content/6k7JPOlasPL_44100_56_0.mp3',
      };
    });

    const stmts = activeContent.quizzes.gameAnakGaruda.statements || [];
    const garudaItems: GimCustomItem[] = stmts.map((st, idx) => {
      const isPositive = idx % 2 === 0;
      const status: BadgeStatus =
        extraState.statusOverrides[st.id] ||
        (idx < 2 ? 'Unggulan' : 'Active');
      return {
        id: `GIM-${String(idx + 1).padStart(2, '0')}`,
        statementId: st.id,
        title: st.text,
        category: 'Drag & Drop Anak Garuda (Slide 40)',
        targetChoice: isPositive ? 'Budaya yang Benar' : 'Budaya yang Salah',
        points: 20,
        status,
        imageUrl: 'story_content/6Hxt2bPxv63.png',
        audioUrl: 'story_content/6k7JPOlasPL_44100_56_0.mp3',
      };
    });

    return [...warmups, ...garudaItems];
  }, [
    activeContent.slides,
    activeContent.quizzes.gameAnakGaruda.statements,
    extraState.statusOverrides,
  ]);

  // 4. Kuis & Evaluasi (10 Multiple-Choice Questions on Slides 25–34)
  const kuisItems = useMemo(() => {
    return activeContent.quizzes.kuisBudaya.questions.map((q, idx) => {
      const status: BadgeStatus =
        extraState.statusOverrides[q.slideId] ||
        (q.hidden ? 'Inactive' : idx < 3 ? 'Unggulan' : 'Active');
      const sl = activeContent.slides[q.slideId];
      const meta = getSmartSlideMeta(q.slideId, sl, idx);
      return {
        id: q.slideId,
        code: `#KUIS-${String(idx + 1).padStart(2, '0')} (Slide ${meta.slideNumber})`,
        title: q.questionText,
        category: meta.smartTitle,
        correctAnswer: q.correctAnswerText || '',
        points: q.maxPoints,
        choicesCount: q.choices.length,
        choices: q.choices,
        correctChoiceId: q.correctChoiceId,
        status,
        imageUrl:
          sl?.images[0]?.url ||
          meta.backgroundUrl ||
          'story_content/5jk1lv5JqZM.png',
        audioUrl:
          sl?.audios[0]?.url ||
          'story_content/6k7JPOlasPL_44100_56_0.mp3',
      };
    });
  }, [
    activeContent.quizzes.kuisBudaya.questions,
    activeContent.slides,
    extraState.statusOverrides,
  ]);

  // 5. All Slides with Smart Names for "Desain Slide"
  const allSlidesWithMeta = useMemo(() => {
    return activeContent.slideOrder.map((sId: string, idx: number) => {
      const sl = activeContent.slides[sId];
      const meta = getSmartSlideMeta(sId, sl, idx);
      return {
        slideId: sId,
        slide: sl,
        meta,
      };
    });
  }, [activeContent.slideOrder, activeContent.slides]);

  // ============================================================================
  // MODAL CRUD HANDLERS
  // ============================================================================

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormAudioUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormTitle('');
    setFormCategory('Bahasa Daerah');
    setFormDescription('');
    setFormStatus('Active');
    setFormImageUrl('story_content/5hv8C0oRfrb.png');
    setFormAudioUrl('story_content/6k7JPOlasPL_44100_56_0.mp3');
    setFormEmbedUrl('https://faryzt.github.io/starla-360/');
    setFormChoices([
      { id: 'c1', text: 'Pilihan Jawaban A (Benar)', isCorrect: true },
      { id: 'c2', text: 'Pilihan Jawaban B', isCorrect: false },
      { id: 'c3', text: 'Pilihan Jawaban C', isCorrect: false },
      { id: 'c4', text: 'Pilihan Jawaban D', isCorrect: false },
    ]);
    setFormTargetGroup('Budaya yang Benar');
    setIsModalOpen(true);
  };

  const openEditModalForMateri = (item: (typeof materiItems)[number]) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormStatus(item.status);
    setFormImageUrl(item.imageUrl);
    setFormAudioUrl(item.audioUrl);
    setIsModalOpen(true);
  };

  const openEditModalFor360 = (item: Tur360EmbedItem) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormEmbedUrl(item.embedUrl);
    setIsModalOpen(true);
  };

  const openEditModalForGim = (item: GimCustomItem) => {
    setModalMode('edit');
    setEditingId(item.statementId || item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormTargetGroup(item.targetChoice);
    setFormStatus(item.status);
    setFormImageUrl(item.imageUrl);
    setFormAudioUrl(item.audioUrl);
    setIsModalOpen(true);
  };

  const openEditModalForKuis = (item: (typeof kuisItems)[number]) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormStatus(item.status);
    setFormImageUrl(item.imageUrl);
    setFormAudioUrl(item.audioUrl);
    setFormChoices(
      item.choices.map((c) => ({
        id: c.id,
        text: c.text,
        isCorrect: c.id === item.correctChoiceId,
      }))
    );
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'tur360') {
      const cleanedUrl = formEmbedUrl.trim() || 'https://faryzt.github.io/starla-360/';
      if (modalMode === 'add') {
        const newItem: Tur360EmbedItem = {
          id: `360-${String(extraState.tur360List.length + 1).padStart(2, '0')}`,
          embedUrl: cleanedUrl,
          slideId: '5jTlwgcUi8o',
        };
        setExtraState((prev) => ({
          ...prev,
          tur360List: [newItem, ...prev.tur360List],
        }));
        updateContent((prev) => ({
          ...prev,
          appMeta: {
            ...prev.appMeta,
            canonicalUrl: cleanedUrl,
          },
        }));
        showToast('Tautan Embed 360° Budaya berhasil ditambahkan!');
      } else if (editingId) {
        setExtraState((prev) => ({
          ...prev,
          tur360List: prev.tur360List.map((it) =>
            it.id === editingId ? { ...it, embedUrl: cleanedUrl } : it
          ),
        }));
        updateContent((prev) => ({
          ...prev,
          appMeta: {
            ...prev.appMeta,
            canonicalUrl: cleanedUrl,
          },
        }));
        showToast('Tautan Embed 360° Budaya berhasil diperbarui!');
      }
      setIsModalOpen(false);
      return;
    }

    if (activeTab === 'materi') {
      if (modalMode === 'add') {
        updateContent((prev) => {
          const { nextSchema, createdSlideId } = addSlideItem(prev, {
            title: formTitle.trim() || 'Materi Budaya Baru',
            instructions: [
              formDescription.trim() || 'Penjelasan materi budaya Nusantara.',
            ],
          });
          const sl = nextSchema.slides[createdSlideId];
          if (sl) {
            if (formImageUrl) {
              sl.images = [
                {
                  layerIndex: 0,
                  layerId: 'base',
                  objectId: 'img_custom_0',
                  assetId: 999,
                  url: formImageUrl,
                  altText: formTitle,
                  width: 400,
                  height: 300,
                },
              ];
            }
            if (formAudioUrl) {
              sl.audios = [
                {
                  layerIndex: 0,
                  layerId: 'base',
                  audioId: 'aud_custom_0',
                  assetId: 999,
                  url: formAudioUrl,
                  durationMs: 5000,
                },
              ];
            }
          }
          setExtraState((es) => ({
            ...es,
            statusOverrides: {
              ...es.statusOverrides,
              [createdSlideId]: formStatus,
            },
            categoryOverrides: {
              ...es.categoryOverrides,
              [createdSlideId]: formCategory,
            },
          }));
          return { ...nextSchema };
        });
        showToast('Slide Materi Budaya baru berhasil ditambahkan!');
      } else if (editingId) {
        updateContent((prev) => {
          const curSlide = prev.slides[editingId];
          if (!curSlide) return prev;
          const nextImages = [...curSlide.images];
          if (formImageUrl) {
            if (nextImages.length > 0) {
              nextImages[0] = { ...nextImages[0], url: formImageUrl };
            } else {
              nextImages.push({
                layerIndex: 0,
                layerId: 'base',
                objectId: 'img_0',
                assetId: 998,
                url: formImageUrl,
                altText: formTitle,
                width: 400,
                height: 300,
              });
            }
          }
          const nextAudios = [...curSlide.audios];
          if (formAudioUrl) {
            if (nextAudios.length > 0) {
              nextAudios[0] = { ...nextAudios[0], url: formAudioUrl };
            } else {
              nextAudios.push({
                layerIndex: 0,
                layerId: 'base',
                audioId: 'aud_0',
                assetId: 998,
                url: formAudioUrl,
                durationMs: 5000,
              });
            }
          }
          return applySlidePatch(prev, editingId, {
            title: formTitle.trim() || curSlide.title,
            instructions: [
              formDescription.trim() || curSlide.instructions[0] || '',
              ...curSlide.instructions.slice(1),
            ],
            images: nextImages,
            audios: nextAudios,
          });
        });
        setExtraState((es) => ({
          ...es,
          statusOverrides: {
            ...es.statusOverrides,
            [editingId]: formStatus,
          },
          categoryOverrides: {
            ...es.categoryOverrides,
            [editingId]: formCategory,
          },
        }));
        showToast('Materi Budaya berhasil diperbarui!');
      }
    } else if (activeTab === 'gim') {
      if (modalMode === 'add') {
        updateContent((prev) =>
          addDragDropStatement(
            prev,
            formTitle.trim() || 'Pernyataan Sikap Budaya Baru'
          )
        );
        showToast('Item Gim Edukasi berhasil ditambahkan!');
      } else if (editingId) {
        updateContent((prev) =>
          updateDragDropStatement(prev, editingId, formTitle.trim())
        );
        setExtraState((es) => ({
          ...es,
          statusOverrides: {
            ...es.statusOverrides,
            [editingId]: formStatus,
          },
        }));
        showToast('Item Gim Edukasi berhasil diperbarui!');
      }
    } else if (activeTab === 'kuis') {
      if (modalMode === 'add') {
        updateContent((prev) => {
          const { nextSchema } = addQuizQuestionItem(prev, {
            questionText: formTitle.trim() || 'Pertanyaan Kuis Budaya Baru',
            choices: formChoices.map((c) => ({
              text: c.text.trim() || 'Opsi Jawaban',
              isCorrect: c.isCorrect,
            })),
          });
          return nextSchema;
        });
        showToast('Soal Kuis & Evaluasi baru berhasil ditambahkan!');
      } else if (editingId) {
        updateContent((prev) => {
          const targetQ = prev.quizzes.kuisBudaya.questions.find(
            (q) => q.slideId === editingId
          );
          if (!targetQ) return prev;
          const updatedChoices = targetQ.choices.map((orig, idx) => ({
            ...orig,
            text: formChoices[idx]?.text ?? orig.text,
          }));
          const chosenCorrectIdx = formChoices.findIndex((c) => c.isCorrect);
          const correctChoice =
            updatedChoices[chosenCorrectIdx >= 0 ? chosenCorrectIdx : 0];
          return applyQuizQuestionPatch(prev, editingId, {
            questionText: formTitle.trim() || targetQ.questionText,
            choices: updatedChoices,
            correctChoiceId: correctChoice?.id || targetQ.correctChoiceId,
            correctAnswerText:
              correctChoice?.text || targetQ.correctAnswerText,
          });
        });
        setExtraState((es) => ({
          ...es,
          statusOverrides: {
            ...es.statusOverrides,
            [editingId]: formStatus,
          },
        }));
        showToast('Soal Kuis & Evaluasi berhasil diperbarui!');
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteMateri = (slideId: string) => {
    updateContent((prev) => deleteSlideItem(prev, slideId));
    showToast('Slide materi berhasil dihapus / disembunyikan.');
  };

  const handleDelete360 = (id: string) => {
    setExtraState((prev) => ({
      ...prev,
      tur360List: prev.tur360List.filter((it) => it.id !== id),
    }));
    showToast('Tautan Embed 360° Budaya berhasil dihapus.');
  };

  const handleDeleteGim = (statementId?: string) => {
    if (!statementId) {
      showToast('Slide Tebak Budaya bawaan tidak dapat dihapus permanen.');
      return;
    }
    updateContent((prev) => removeDragDropStatement(prev, statementId));
    showToast('Pernyataan Gim Anak Garuda berhasil dihapus.');
  };

  const handleDeleteKuis = (slideId: string) => {
    updateContent((prev) => ({
      ...prev,
      quizzes: {
        ...prev.quizzes,
        kuisBudaya: {
          ...prev.quizzes.kuisBudaya,
          questions: prev.quizzes.kuisBudaya.questions.filter(
            (q) => q.slideId !== slideId
          ),
        },
      },
    }));
    showToast('Soal Kuis berhasil dihapus.');
  };

  // ============================================================================
  // DESAIN SLIDE VISUAL CANVAS HANDLERS (60FPS DRAG)
  // ============================================================================

  const activeDesignSlide =
    activeContent.slides[activeDesignSlideId] ||
    activeContent.slides[activeSlideId];
  const activeDesignMeta = getSmartSlideMeta(
    activeDesignSlide?.id || activeDesignSlideId,
    activeDesignSlide
  );

  const handleAddElementToDesignCanvas = (
    type: 'image-button' | 'text'
  ) => {
    if (!activeDesignSlide) return;
    updateContent((prev) => {
      const { nextSchema, createdElement } = applyAddCanvasElement(
        prev,
        activeDesignSlide.id,
        {
          type,
          label:
            type === 'image-button'
              ? 'Tombol Materi Interaktif'
              : 'Teks Judul Budaya',
          x: 34,
          y: 76,
          width: 32,
          height: 11,
        }
      );
      setSelectedCanvasElId(createdElement.id);
      return nextSchema;
    });
    showToast('Elemen interaktif ditambahkan ke kanvas slide.');
  };

  const handleStartDragCanvasElement = (
    e: React.PointerEvent<HTMLDivElement>,
    el: CanvasElement
  ) => {
    e.stopPropagation();
    setSelectedCanvasElId(el.id);
    setDragState({
      elementId: el.id,
      startX: el.x,
      startY: el.y,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    });
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || !stageRef.current || !activeDesignSlide) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const deltaXPct = ((e.clientX - dragState.startMouseX) / rect.width) * 100;
    const deltaYPct =
      ((e.clientY - dragState.startMouseY) / rect.height) * 100;
    const nextX = Math.max(
      0,
      Math.min(92, Number((dragState.startX + deltaXPct).toFixed(1)))
    );
    const nextY = Math.max(
      0,
      Math.min(92, Number((dragState.startY + deltaYPct).toFixed(1)))
    );

    updateContent((prev) =>
      applyUpdateCanvasElement(
        prev,
        activeDesignSlide.id,
        dragState.elementId,
        {
          x: nextX,
          y: nextY,
        }
      )
    );
  };

  const handleStagePointerUp = () => {
    if (dragState) {
      setDragState(null);
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportContentToJsonString(activeContent);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starla-budaya-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON berhasil diunduh!');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const res = parseAndValidateImportedJson(reader.result);
        if (res.valid && res.content) {
          updateContent(res.content);
          showToast('Data JSON berhasil diimpor!');
        } else {
          showToast(res.error || 'Format JSON tidak valid.');
        }
      }
    };
    reader.readAsText(file);
  };

  const renderBadge = (status: BadgeStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Inactive
          </span>
        );
      case 'Unggulan':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            Unggulan
          </span>
        );
      case 'Populer':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            Populer
          </span>
        );
    }
  };

  const renderCategoryBadge = (cat: SlideCategoryType) => {
    const map: Record<SlideCategoryType, { label: string; cls: string }> = {
      materi: {
        label: 'Materi Budaya',
        cls: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      tur360: {
        label: '360° Budaya',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      gim: {
        label: 'Gim Edukasi',
        cls: 'bg-purple-50 text-purple-700 border-purple-200',
      },
      kuis: {
        label: 'Kuis Evaluasi',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      pembuka: {
        label: 'Pembuka / Video',
        cls: 'bg-sky-50 text-sky-700 border-sky-200',
      },
      menu: {
        label: 'Menu Navigasi',
        cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      },
      hasil: {
        label: 'Skor / Penutup',
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
      },
    };
    const item = map[cat];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.cls}`}
      >
        {item.label}
      </span>
    );
  };

  const contextValue = useMemo<AdminDataContextValue>(
    () => ({
      activeContent,
      updateContent,
      saveToCloud,
      resetToDefault,
      extraState,
      setExtraState,
      isAdminOpen,
      setIsAdminOpen,
      activeSlideIndex,
      setActiveSlideIndex,
      activeSlideId,
      totalSlides: activeContent.slideOrder.length,
      navigateToPublicSlide,
    }),
    [
      activeContent,
      updateContent,
      saveToCloud,
      resetToDefault,
      extraState,
      isAdminOpen,
      activeSlideIndex,
      setActiveSlideIndex,
      activeSlideId,
      navigateToPublicSlide,
    ]
  );

  const sidebarMenus: Array<{
    key: AdminTabKey;
    label: string;
    badge?: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      key: 'materi',
      label: 'Materi Budaya',
      badge: String(materiItems.length),
      icon: BookOpen,
    },
    {
      key: 'tur360',
      label: '360° Budaya',
      badge: String(tur360Items.length),
      icon: Compass,
    },
    {
      key: 'gim',
      label: 'Gim Edukasi',
      badge: String(gimItems.length),
      icon: Gamepad2,
    },
    {
      key: 'kuis',
      label: 'Kuis & Evaluasi',
      badge: String(kuisItems.length),
      icon: HelpCircle,
    },
    {
      key: 'desain',
      label: 'Desain Slide',
      badge: String(allSlidesWithMeta.length),
      icon: Layout,
    },
    { key: 'analitik', label: 'Analitik Siswa', icon: BarChart3 },
    { key: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  // Filtered items for active tab
  const filteredMateri = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return materiItems
      .filter((it) => {
        if (categoryFilter !== 'ALL' && it.category !== categoryFilter) {
          return false;
        }
        if (!q) return true;
        return (
          it.title.toLowerCase().includes(q) ||
          it.description.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q) ||
          it.code.toLowerCase().includes(q)
        );
      })
      .slice(0, showingCount);
  }, [materiItems, searchQuery, showingCount, categoryFilter]);

  const filteredTur360 = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tur360Items
      .filter((it) => {
        if (!q) return true;
        return (
          it.embedUrl.toLowerCase().includes(q) ||
          it.code.toLowerCase().includes(q)
        );
      })
      .slice(0, showingCount);
  }, [tur360Items, searchQuery, showingCount]);

  const filteredGim = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return gimItems
      .filter((it) => {
        if (!q) return true;
        return (
          it.title.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q) ||
          it.targetChoice.toLowerCase().includes(q)
        );
      })
      .slice(0, showingCount);
  }, [gimItems, searchQuery, showingCount]);

  const filteredKuis = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return kuisItems
      .filter((it) => {
        if (!q) return true;
        return (
          it.title.toLowerCase().includes(q) ||
          it.correctAnswer.toLowerCase().includes(q) ||
          it.category.toLowerCase().includes(q) ||
          it.code.toLowerCase().includes(q)
        );
      })
      .slice(0, showingCount);
  }, [kuisItems, searchQuery, showingCount]);

  const filteredAnalytics = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return extraState.analyticsList
      .filter((it) => {
        if (!q) return true;
        return (
          it.name.toLowerCase().includes(q) ||
          it.school.toLowerCase().includes(q) ||
          it.id.toLowerCase().includes(q)
        );
      })
      .slice(0, showingCount);
  }, [extraState.analyticsList, searchQuery, showingCount]);

  const materiSubTopics = useMemo(() => {
    const set = new Set<string>();
    materiItems.forEach((m) => set.add(m.category));
    return ['ALL', ...Array.from(set)];
  }, [materiItems]);

  const primary360EmbedUrl =
    tur360Items[0]?.embedUrl ||
    activeContent.appMeta.canonicalUrl ||
    'https://faryzt.github.io/starla-360/';

  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(() =>
    ensureAdminStylesAndPortalRoot(isAdminOpen)
  );

  useEffect(() => {
    const root = ensureAdminStylesAndPortalRoot(isAdminOpen);
    setPortalRoot(root);
    const t1 = window.setTimeout(() => {
      ensureAdminStylesAndPortalRoot(isAdminOpen);
    }, 120);
    const t2 = window.setTimeout(() => {
      ensureAdminStylesAndPortalRoot(isAdminOpen);
    }, 450);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isAdminOpen, activeTab, isModalOpen]);

  const targetPortal =
    portalRoot || (typeof document !== 'undefined' ? document.body : null);

  return (
    <AdminDataContext.Provider value={contextValue}>
      {/* PUBLIC VIEW: 100% IDENTICAL ZERO-REGRESSION */}
      {children}

      {/* FLOATING ROYAL-BLUE ADMIN TRIGGER BUTTON (RENDERED VIA PORTAL ABOVE #starla-front-stage) */}
      {!isAdminOpen &&
        targetPortal &&
        createPortal(
          <button
            type="button"
            id="open-admin-dashboard-btn"
            onClick={() => setIsAdminOpen(true)}
            style={{
              position: 'fixed',
              bottom: '16px',
              right: '16px',
              zIndex: 2147483647,
            }}
            className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#152C88] to-[#2563EB] hover:from-[#102372] hover:to-[#1D4ED8] text-white text-xs font-bold shadow-xl border border-white/25 transition-all cursor-pointer"
            title="Buka Admin Dashboard Starla Budaya (Ctrl+Shift+A)"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Admin Studio</span>
          </button>,
          targetPortal
        )}

      {/* MODERN ROYAL-BLUE & CLEAN WHITE SAAS ADMIN DASHBOARD OVERLAY */}
      {isAdminOpen &&
        targetPortal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2147483647,
            }}
            className="starla-saas-admin fixed inset-0 flex bg-[#EEF3FC] text-slate-800 font-sans overflow-hidden select-none"
          >
            {/* MOBILE SIDEBAR BACKDROP */}
            {mobileSidebarOpen && (
              <div
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
              />
            )}

            {/* 1. LEFT SIDEBAR (CLEAN WHITE CARD WITH ROYAL BLUE ACTIVE PILL) */}
            <aside
              className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 shadow-[4px_0_24px_rgba(21,44,136,0.05)] z-40 transition-transform duration-200 ${
                mobileSidebarOpen
                  ? 'translate-x-0'
                  : '-translate-x-full lg:translate-x-0'
              }`}
            >
              <div>
                {/* App Brand Header */}
                <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#152C88] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-600/25">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-base font-extrabold tracking-tight text-[#152C88] leading-none">
                        STARLA BUDAYA
                      </h1>
                      <p className="text-[11px] font-medium text-slate-400 mt-1">
                        Smart Cultural CMS
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 8 Navigation Tabs */}
                <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-170px)]">
                  {sidebarMenus.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        id={`admin-nav-${item.key}`}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.key);
                          setSearchQuery('');
                          setCategoryFilter('ALL');
                          setMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-gradient-to-r from-[#152C88] to-[#2563EB] text-white rounded-2xl shadow-md shadow-blue-700/25'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-[#152C88] rounded-2xl'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 ${
                              isActive ? 'text-white' : 'text-slate-400'
                            }`}
                          />
                          <span>{item.label}</span>
                        </span>
                        {item.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Return to Public App Button */}
              <div className="p-4 border-t border-slate-100">
                <button
                  type="button"
                  id="close-admin-dashboard-btn"
                  onClick={() => {
                    setIsAdminOpen(false);
                    if (
                      typeof window !== 'undefined' &&
                      (window.location.search.includes('mode=admin') ||
                        window.location.hash === '#admin' ||
                        window.location.pathname === '/admin')
                    ) {
                      window.history.replaceState({}, '', '/');
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Kembali ke Publik</span>
                </button>
              </div>
            </aside>

            {/* 2. MAIN WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* ROYAL BLUE HEADER BANNER (INSPIRED BY REFERENCE IMAGE) */}
              <header className="relative bg-gradient-to-r from-[#12267A] via-[#1B38A8] to-[#2563EB] text-white px-6 lg:px-8 pt-5 pb-12 shrink-0 overflow-hidden">
                {/* Subtle geometric facet shapes matching reference image */}
                <div className="pointer-events-none absolute -top-12 right-24 w-56 h-56 bg-white/5 rotate-12 rounded-3xl" />
                <div className="pointer-events-none absolute top-4 right-72 w-36 h-36 bg-sky-400/10 -rotate-12 rounded-full blur-xl" />

                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                  {/* Left: Mobile Menu + Active View Title */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMobileSidebarOpen(true)}
                      className="lg:hidden p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight">
                        {sidebarMenus.find((m) => m.key === activeTab)?.label ||
                          'Dashboard'}
                      </h2>
                      <p className="text-xs text-blue-100/90 mt-0.5">
                        Sinkronisasi Real-Time • {materiItems.length} Materi Budaya •{' '}
                        {allSlidesWithMeta.length} Total Slide Publik
                      </p>
                    </div>
                  </div>

                  {/* Center: Capsule Search Bar */}
                  <div className="relative w-full sm:w-80 lg:w-96 order-3 sm:order-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari materi budaya, soal kuis, atau slide..."
                      className="w-full pl-11 pr-4 py-2.5 bg-white rounded-full text-sm text-slate-700 placeholder:text-slate-400 shadow-lg shadow-blue-950/20 focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all"
                    />
                  </div>

                  {/* Right: Cloud Save + Notification + Avatar */}
                  <div className="flex items-center gap-3 order-2 sm:order-3">
                    <button
                      type="button"
                      onClick={async () => {
                        await saveToCloud();
                        showToast('Perubahan disimpan & disinkronkan!');
                      }}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {syncStatus === 'saving'
                          ? 'Menyimpan...'
                          : 'Simpan Perubahan'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          'Semua modul materi, 360° Budaya, dan desain slide aktif.'
                        )
                      }
                      className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white relative transition-colors cursor-pointer"
                      title="Notifikasi Sistem"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 border-2 border-[#1B38A8] absolute top-2 right-2" />
                    </button>

                    <div className="flex items-center gap-2.5 pl-2 border-l border-white/20">
                      <img
                        src="story_content/5hv8C0oRfrb.png"
                        alt="Admin Starla"
                        className="w-10 h-10 rounded-full object-cover bg-amber-100 border-2 border-white shadow-md"
                      />
                      <div className="hidden xl:block text-left">
                        <p className="text-xs font-bold text-white leading-tight">
                          Admin Starla
                        </p>
                        <p className="text-[11px] text-blue-100">
                          Kurator Budaya
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* MAIN SCROLLABLE CONTENT SHEET (ROUNDED TOP OVERLAPPING ROYAL BLUE HEADER) */}
              <main className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 -mt-6 relative z-20 space-y-6">
                {/* ACTION BAR FOR CRUD TABS */}
                {(activeTab === 'materi' ||
                  activeTab === 'tur360' ||
                  activeTab === 'gim' ||
                  activeTab === 'kuis' ||
                  activeTab === 'analitik') && (
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-[0_8px_24px_rgba(21,44,136,0.06)] border border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <span>Showing</span>
                        <select
                          value={showingCount}
                          onChange={(e) =>
                            setShowingCount(Number(e.target.value))
                          }
                          className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold focus:outline-none focus:border-blue-500"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      {/* Topic Filter for Materi Budaya */}
                      {activeTab === 'materi' && (
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
                          <Filter className="w-3.5 h-3.5 text-blue-600" />
                          <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-transparent font-bold text-slate-700 focus:outline-none"
                          >
                            {materiSubTopics.map((topic) => (
                              <option key={topic} value={topic}>
                                {topic === 'ALL'
                                  ? 'Semua Topik Materi (17 Slide)'
                                  : topic}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Export JSON</span>
                      </button>
                    </div>

                    {activeTab !== 'analitik' && (
                      <button
                        type="button"
                        id="admin-add-new-btn"
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#152C88] to-[#2563EB] hover:from-[#102372] hover:to-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {activeTab === 'tur360'
                            ? '+ Tambah Tautan Embed'
                            : activeTab === 'materi'
                            ? '+ Tambah Materi Baru'
                            : '+ Tambah Baru'}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* =========================================================
                    TAB 1: DASHBOARD (ICON TILE GRID + RECENT MATERI LIST)
                ========================================================= */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Quick Module Icon Tiles (Inspired by Reference Image Left Screen) */}
                    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h3 className="text-base font-extrabold text-[#152C88]">
                            Menu Utama Studio Budaya
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Pilih modul untuk mengelola materi budaya, tautan embed 360°, kuis, atau desain slide 1:1
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-[#152C88] text-xs font-bold">
                          Aktif & Terhubung
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                          {
                            key: 'materi' as AdminTabKey,
                            title: 'Materi Budaya',
                            sub: `${materiItems.length} Slide Materi`,
                            icon: BookOpen,
                            bg: 'bg-blue-50 text-blue-600 border-blue-100',
                          },
                          {
                            key: 'tur360' as AdminTabKey,
                            title: '360° Budaya',
                            sub: `${tur360Items.length} Tautan Embed`,
                            icon: Compass,
                            bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                          },
                          {
                            key: 'desain' as AdminTabKey,
                            title: 'Desain Slide',
                            sub: `${allSlidesWithMeta.length} Slide Presisi`,
                            icon: Layout,
                            bg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                          },
                          {
                            key: 'gim' as AdminTabKey,
                            title: 'Gim Edukasi',
                            sub: `${gimItems.length} Tantangan`,
                            icon: Gamepad2,
                            bg: 'bg-purple-50 text-purple-600 border-purple-100',
                          },
                          {
                            key: 'kuis' as AdminTabKey,
                            title: 'Kuis & Evaluasi',
                            sub: `${kuisItems.length} Soal Kuis`,
                            icon: HelpCircle,
                            bg: 'bg-amber-50 text-amber-600 border-amber-100',
                          },
                          {
                            key: 'analitik' as AdminTabKey,
                            title: 'Analitik Siswa',
                            sub: `${extraState.analyticsList.length} Siswa Aktif`,
                            icon: BarChart3,
                            bg: 'bg-rose-50 text-rose-600 border-rose-100',
                          },
                        ].map((tile) => {
                          const Icon = tile.icon;
                          return (
                            <button
                              key={tile.key}
                              type="button"
                              onClick={() => setActiveTab(tile.key)}
                              className="group bg-white hover:bg-[#F8FAFF] rounded-2xl p-5 border border-slate-100 shadow-[0_6px_20px_rgba(21,44,136,0.05)] hover:shadow-[0_10px_25px_rgba(37,99,235,0.12)] hover:border-blue-200 transition-all flex flex-col items-center text-center cursor-pointer"
                            >
                              <div
                                className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-3 group-hover:scale-105 transition-transform ${tile.bg}`}
                              >
                                <Icon className="w-7 h-7" />
                              </div>
                              <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#152C88]">
                                {tile.title}
                              </p>
                              <p className="text-[11px] font-semibold text-emerald-600 mt-1">
                                {tile.sub}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Floating Card Rows Preview of Pure Materi Budaya (Inspired by Reference Image Middle Screen) */}
                    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-extrabold text-[#152C88]">
                            Daftar Inti Materi Keragaman Budaya
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                             Menampilkan khusus slide materi pembelajaran budaya (tanpa tercampur slide kuis/login)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('materi')}
                          className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                        >
                          Lihat Semua ({materiItems.length} Materi) →
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {materiItems.slice(0, 6).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3.5 p-3.5 rounded-2xl bg-[#F8FAFF] hover:bg-white border border-slate-100 hover:border-blue-200 shadow-xs hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm bg-blue-50 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-extrabold text-slate-800 truncate">
                                  {item.title}
                                </p>
                                <p className="text-xs font-bold text-emerald-600 mt-0.5">
                                  {item.category} • Slide {item.slideNumber}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDesignSlideId(item.id);
                                  setActiveTab('desain');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#152C88] text-xs font-bold cursor-pointer"
                              >
                                Desain
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('materi');
                                  openEditModalForMateri(item);
                                }}
                                className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                                title="Edit Materi"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 2: MATERI BUDAYA (HANYA BERISI SLIDE MATERI SAJA)
                ========================================================= */}
                {activeTab === 'materi' && (
                  <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#152C88]">
                          Kurikulum Materi Keragaman Budaya ({materiItems.length} Slide Materi Murni)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Terfilter cerdas: hanya menampilkan slide materi pembelajaran budaya (Pengertian Budaya, 7 Keragaman Budaya, Cara Menghargai, & Cerita Pengantar).
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        100% Slide Materi
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                            <th className="py-3.5 px-6">Materi Budaya</th>
                            <th className="py-3.5 px-4">Slide</th>
                            <th className="py-3.5 px-4">Topik Bahasan</th>
                            <th className="py-3.5 px-4">Inti Bacaan Materi</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-6 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredMateri.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-blue-50/30 transition-colors"
                            >
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-11 h-11 rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0"
                                  />
                                  <div className="min-w-0 max-w-xs">
                                    <p className="font-bold text-slate-800 truncate">
                                      {item.title}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {item.metricLabel}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#2563EB]">
                                Slide {item.slideNumber}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#152C88] text-xs font-bold">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-xs text-slate-600 max-w-md">
                                <p className="line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              </td>
                              <td className="py-3.5 px-4">
                                {renderBadge(item.status)}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDesignSlideId(item.id);
                                      setActiveTab('desain');
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                                    title="Lihat & Desain Slide Ini"
                                  >
                                    Lihat Slide
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditModalForMateri(item)}
                                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Edit Materi"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMateri(item.id)}
                                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Hapus Materi"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 3: 360° BUDAYA (HANYA KOLOM TAUTAN EMBED)
                ========================================================= */}
                {activeTab === 'tur360' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/70 to-blue-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Link2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-800">
                              Daftar Tautan Embed 360° Budaya
                            </h3>
                            <p className="text-xs text-slate-500">
                              Terhubung langsung ke WebObject Slide 8 (Eksplorasi Tur Virtual 360° Budaya)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                              <th className="py-3.5 px-6 w-28">ID</th>
                              <th className="py-3.5 px-4">
                                Tautan Embed (URL 360° Budaya)
                              </th>
                              <th className="py-3.5 px-6 text-right w-48">
                                Aksi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {filteredTur360.map((item) => (
                              <tr
                                key={item.id}
                                className="hover:bg-slate-50/80 transition-colors"
                              >
                                <td className="py-4 px-6 font-mono text-xs font-bold text-slate-500">
                                  {item.code}
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                      <Compass className="w-4 h-4" />
                                    </div>
                                    <a
                                      href={item.embedUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-mono text-xs sm:text-sm font-bold text-[#2563EB] hover:underline break-all flex items-center gap-1.5"
                                    >
                                      <span>{item.embedUrl}</span>
                                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                    </a>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreview360Url((prev) =>
                                          prev === item.embedUrl
                                            ? null
                                            : item.embedUrl
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
                                    >
                                      {preview360Url === item.embedUrl
                                        ? 'Tutup Pratinjau'
                                        : 'Pratinjau'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openEditModalFor360(item)}
                                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Edit Tautan Embed"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete360(item.id)}
                                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Hapus Tautan Embed"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Optional Live Interactive Embed Preview */}
                    {preview360Url && (
                      <div className="bg-white rounded-3xl p-5 shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#152C88] flex items-center gap-2">
                            <Compass className="w-4 h-4 text-emerald-600" />
                            Pratinjau Interaktif Tautan Embed: {preview360Url}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPreview360Url(null)}
                            className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Tutup
                          </button>
                        </div>
                        <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                          <iframe
                            src={preview360Url}
                            title="Pratinjau 360 Budaya"
                            className="w-full h-full border-0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================
                    TAB 4: GIM EDUKASI
                ========================================================= */}
                {activeTab === 'gim' && (
                  <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                            <th className="py-3.5 px-6">Pernyataan / Tantangan Gim</th>
                            <th className="py-3.5 px-4">ID</th>
                            <th className="py-3.5 px-4">Modul Gim</th>
                            <th className="py-3.5 px-4">Kelompok Jawaban</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-6 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredGim.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-purple-50 shrink-0"
                                  />
                                  <p className="font-bold text-slate-800 max-w-md">
                                    {item.title}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">
                                #{item.id}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                                {item.category}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-bold text-blue-600">
                                {item.targetChoice} ({item.points} Poin)
                              </td>
                              <td className="py-3.5 px-4">
                                {renderBadge(item.status)}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditModalForGim(item)}
                                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Edit Gim"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  {item.statementId && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteGim(item.statementId)
                                      }
                                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Hapus Gim"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 5: KUIS & EVALUASI
                ========================================================= */}
                {activeTab === 'kuis' && (
                  <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                            <th className="py-3.5 px-6">Pertanyaan Kuis Budaya</th>
                            <th className="py-3.5 px-4">Kode / Slide</th>
                            <th className="py-3.5 px-4">Topik Evaluasi</th>
                            <th className="py-3.5 px-4">Kunci Jawaban Benar</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-6 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredKuis.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-amber-50 shrink-0"
                                  />
                                  <p className="font-bold text-slate-800 line-clamp-2 max-w-md">
                                    {item.title}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">
                                {item.code}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                                {item.category}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-bold text-emerald-700 max-w-xs">
                                ✓ {item.correctAnswer} ({item.points} Poin)
                              </td>
                              <td className="py-3.5 px-4">
                                {renderBadge(item.status)}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveDesignSlideId(item.id);
                                      setActiveTab('desain');
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold cursor-pointer"
                                  >
                                    Slide
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditModalForKuis(item)}
                                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Edit Soal"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteKuis(item.id)}
                                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Hapus Soal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 6: DESAIN SLIDE (100% PUBLIC LAYOUT WITHOUT CHANGING POSITIONS)
                ========================================================= */}
                {activeTab === 'desain' && activeDesignSlide && (
                  <div className="space-y-5">
                    {/* Top Slide Selector & Visual Toolbar */}
                    <div className="bg-white p-4 rounded-2xl shadow-[0_8px_24px_rgba(21,44,136,0.06)] border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Prev Slide Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const curIdx = activeContent.slideOrder.indexOf(
                              activeDesignSlide.id
                            );
                            if (curIdx > 0) {
                              const prevId =
                                activeContent.slideOrder[curIdx - 1];
                              setActiveDesignSlideId(prevId);
                              navigateToPublicSlide(prevId);
                            }
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Slide Sebelumnya"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Smart Slide Selector Dropdown */}
                        <select
                          value={activeDesignSlide.id}
                          onChange={(e) => {
                            setActiveDesignSlideId(e.target.value);
                            navigateToPublicSlide(e.target.value);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-extrabold text-[#152C88] focus:outline-none focus:border-blue-600 max-w-md"
                        >
                          {allSlidesWithMeta.map(({ slideId, meta }) => (
                            <option key={slideId} value={slideId}>
                              Slide {meta.slideNumber} — {meta.smartTitle}
                            </option>
                          ))}
                        </select>

                        {/* Next Slide Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const curIdx = activeContent.slideOrder.indexOf(
                              activeDesignSlide.id
                            );
                            if (
                              curIdx >= 0 &&
                              curIdx < activeContent.slideOrder.length - 1
                            ) {
                              const nextId =
                                activeContent.slideOrder[curIdx + 1];
                              setActiveDesignSlideId(nextId);
                              navigateToPublicSlide(nextId);
                            }
                          }}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Slide Selanjutnya"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {renderCategoryBadge(activeDesignMeta.category)}
                      </div>

                      {/* Add Overlay & View Mode Switcher */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-xl bg-slate-100 p-1">
                          <button
                            type="button"
                            onClick={() => setDesignPreviewMode('exact-stage')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              designPreviewMode === 'exact-stage'
                                ? 'bg-white text-[#152C88] shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Kanvas Presisi 1:1
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDesignPreviewMode('live-storyline')
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              designPreviewMode === 'live-storyline'
                                ? 'bg-white text-[#152C88] shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Play className="w-3 h-3" />
                            <span>Player Interaktif</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleAddElementToDesignCanvas('image-button')
                          }
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tombol</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAddElementToDesignCanvas('text')
                          }
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Teks</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const orig =
                              defaultContent.slides[activeDesignSlide.id];
                            if (orig) {
                              updateContent((prev) =>
                                applyResetSingleSlide(
                                  prev,
                                  activeDesignSlide.id,
                                  orig
                                )
                              );
                              showToast(
                                'Slide dikembalikan ke tampilan awal.'
                              );
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* Slide Title & Smart Info Header Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* 16:9 Exact Public Stage Container (8 cols on large screens) */}
                      <div className="lg:col-span-8 bg-white rounded-3xl p-5 shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-[#152C88] text-white text-xs font-extrabold">
                                Slide {activeDesignMeta.slideNumber}
                              </span>
                              <h3 className="text-base font-extrabold text-slate-800">
                                {activeDesignMeta.smartTitle}
                              </h3>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Topik: {activeDesignMeta.subTopic} • Koordinat Kanvas Asli 1280×720 (Posisi 100% Identik Publik)
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigateToPublicSlide(activeDesignSlide.id);
                              setIsAdminOpen(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Buka di Layar Publik</span>
                          </button>
                        </div>

                        <div
                          ref={stageRef}
                          onPointerMove={handleStagePointerMove}
                          onPointerUp={handleStagePointerUp}
                          className="w-full"
                        >
                          {designPreviewMode === 'exact-stage' ? (
                            <ExactSlideStageCanvas
                              slideId={activeDesignSlide.id}
                              activeContent={activeContent}
                              tur360Url={primary360EmbedUrl}
                              selectedCustomElId={selectedCanvasElId}
                              onSelectCustomEl={setSelectedCanvasElId}
                              onStartDragCustomEl={handleStartDragCanvasElement}
                              onDeleteCustomEl={(elId) => {
                                updateContent((prev) =>
                                  applyDeleteCanvasElement(
                                    prev,
                                    activeDesignSlide.id,
                                    elId
                                  )
                                );
                                setSelectedCanvasElId(null);
                              }}
                            />
                          ) : (
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950">
                              <iframe
                                src="/story.html"
                                title="Interactive Storyline Stage"
                                className="w-full h-full border-0"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Inspector: Slide Properties & Nama Slide Editor (4 cols on large screens) */}
                      <div className="lg:col-span-4 bg-white rounded-3xl p-5 shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Layers className="w-4 h-4 text-[#2563EB]" />
                          <h4 className="text-sm font-extrabold text-slate-800">
                            Detail & Nama Slide #{activeDesignMeta.slideNumber}
                          </h4>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Nama Slide
                          </label>
                          <input
                            type="text"
                            value={activeDesignMeta.smartTitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) =>
                                applySlidePatch(
                                  prev,
                                  activeDesignSlide.id,
                                  {
                                    title: val,
                                  }
                                )
                              );
                            }}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Ringkasan / Teks Narasi Slide
                          </label>
                          <textarea
                            rows={4}
                            value={activeDesignMeta.smartSummary}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateContent((prev) =>
                                applySlidePatch(
                                  prev,
                                  activeDesignSlide.id,
                                  {
                                    instructions: [
                                      val,
                                      ...activeDesignSlide.instructions.slice(
                                        1
                                      ),
                                    ],
                                  }
                                )
                              );
                            }}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        {/* Selected Custom Overlay Inspector */}
                        {selectedCanvasElId &&
                          (() => {
                            const sel = (
                              activeDesignSlide.canvasElements || []
                            ).find((c) => c.id === selectedCanvasElId);
                            if (!sel) return null;
                            return (
                              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-extrabold text-[#152C88] flex items-center gap-1.5">
                                    <Move className="w-3.5 h-3.5" />
                                    Edit Elemen Tambahan
                                  </span>
                                  <span className="text-[11px] font-mono text-blue-700">
                                    X:{sel.x}% • Y:{sel.y}%
                                  </span>
                                </div>
                                <input
                                  type="text"
                                  value={sel.label}
                                  onChange={(e) =>
                                    updateContent((prev) =>
                                      applyUpdateCanvasElement(
                                        prev,
                                        activeDesignSlide.id,
                                        sel.id,
                                        { label: e.target.value }
                                      )
                                    )
                                  }
                                  placeholder="Label teks elemen..."
                                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-bold text-slate-800"
                                />
                              </div>
                            );
                          })()}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>ID Slide: #{activeDesignSlide.id}</span>
                          <span>
                            {activeDesignSlide.images.length} Gambar •{' '}
                            {activeDesignSlide.audios.length} Audio
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Slide Filmstrip with Smart Names & Thumbnails */}
                    <div className="bg-white rounded-3xl p-4 shadow-[0_8px_24px_rgba(21,44,136,0.06)] border border-slate-100">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-extrabold text-[#152C88]">
                          Daftar Seluruh Slide ({allSlidesWithMeta.length} Slide) — Klik untuk Berpindah Slide
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Geser horizontal untuk melihat seluruh slide
                        </span>
                      </div>
                      <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {allSlidesWithMeta.map(({ slideId, slide, meta }) => {
                          const isCurrent =
                            slideId === activeDesignSlide.id;
                          const thumb =
                            meta.backgroundUrl ||
                            slide?.images?.[0]?.url ||
                            'mobile/Slide5znCNCeGBCx.jpg';
                          return (
                            <button
                              key={slideId}
                              type="button"
                              onClick={() => {
                                setActiveDesignSlideId(slideId);
                                navigateToPublicSlide(slideId);
                              }}
                              className={`group shrink-0 w-48 rounded-2xl p-2 border text-left transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-blue-50/80 border-[#2563EB] ring-2 ring-blue-500/20 shadow-sm'
                                  : 'bg-slate-50/70 hover:bg-white border-slate-200/80'
                              }`}
                            >
                              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 mb-2 border border-slate-200/60">
                                <img
                                  src={thumb}
                                  alt={meta.smartTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-extrabold">
                                  #{meta.slideNumber}
                                </span>
                              </div>
                              <p className="text-xs font-extrabold text-slate-800 truncate">
                                {meta.smartTitle}
                              </p>
                              <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
                                {meta.subTopic}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 7: ANALITIK SISWA
                ========================================================= */}
                {activeTab === 'analitik' && (
                  <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                            <th className="py-3.5 px-6">Profil Siswa</th>
                            <th className="py-3.5 px-4">ID Siswa</th>
                            <th className="py-3.5 px-4">Asal Sekolah</th>
                            <th className="py-3.5 px-4">Skor & Progres</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-6 text-right">
                              Waktu Aktif
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {filteredAnalytics.map((st) => (
                            <tr
                              key={st.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-3.5">
                                  <img
                                    src={st.avatarUrl}
                                    alt={st.name}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-amber-50 shrink-0"
                                  />
                                  <p className="font-bold text-slate-800">
                                    {st.name}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">
                                #{st.id}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                                {st.school}
                              </td>
                              <td className="py-3.5 px-4 text-xs font-bold text-blue-600">
                                Kuis: {st.quizScore}/100 • Garuda:{' '}
                                {st.garudaPoints} Poin ({st.completedModules}/17
                                Materi)
                              </td>
                              <td className="py-3.5 px-4">
                                {renderBadge(st.status)}
                              </td>
                              <td className="py-3.5 px-6 text-right text-xs text-slate-400">
                                {st.lastActive}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAB 8: PENGATURAN
                ========================================================= */}
                {activeTab === 'pengaturan' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 space-y-4">
                      <h3 className="text-base font-extrabold text-[#152C88]">
                        Identitas Aplikasi & Tautan 360° Budaya
                      </h3>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">
                          Judul Utama Aplikasi
                        </label>
                        <input
                          type="text"
                          value={activeContent.appMeta.title}
                          onChange={(e) =>
                            updateContent((prev) => ({
                              ...prev,
                              appMeta: {
                                ...prev.appMeta,
                                title: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">
                          Tautan Embed 360° Budaya Utama
                        </label>
                        <input
                          type="text"
                          value={activeContent.appMeta.canonicalUrl}
                          onChange={(e) =>
                            updateContent((prev) => ({
                              ...prev,
                              appMeta: {
                                ...prev.appMeta,
                                canonicalUrl: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={async () => {
                            await saveToCloud();
                            showToast(
                              'Pengaturan berhasil disimpan & disinkronkan!'
                            );
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Pengaturan</span>
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_rgba(21,44,136,0.06)] border border-slate-100 space-y-4">
                      <h3 className="text-base font-extrabold text-[#152C88]">
                        Cadangan JSON & Pemulihan Konten Default
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Unduh cadangan JSON seluruh materi, kuis, gim, dan desain slide, atau kembalikan ke konten bawaan pabrik kapan saja.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleExportJson}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Unduh Backup JSON</span>
                        </button>

                        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>Impor File JSON</span>
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportJsonFile}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            resetToDefault();
                            setExtraState(DEFAULT_EXTRA_STATE);
                            showToast(
                              'Seluruh konten dikembalikan ke versi awal!'
                            );
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reset ke Default</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </div>

            {/* ===============================================================
                MODAL CRUD FORM (TAILORED PER TAB — 360° ONLY HAS EMBED LINK)
            =============================================================== */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-[#152C88] to-[#2563EB] text-white flex items-center justify-between">
                    <h3 className="text-base font-extrabold">
                      {activeTab === 'tur360'
                        ? modalMode === 'add'
                          ? 'Tambah Tautan Embed 360° Budaya'
                          : 'Edit Tautan Embed 360° Budaya'
                        : modalMode === 'add'
                        ? 'Tambah Data Budaya Baru'
                        : 'Edit Data Budaya'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* IF TAB === 'tur360': ONLY SHOW EMBED URL FIELD */}
                  {activeTab === 'tur360' ? (
                    <form onSubmit={handleSaveModal} className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Tautan Embed 360° Budaya (URL)
                        </label>
                        <div className="relative">
                          <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="url"
                            required
                            value={formEmbedUrl}
                            onChange={(e) => setFormEmbedUrl(e.target.value)}
                            placeholder="https://faryzt.github.io/starla-360/"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                          Masukkan tautan embed halaman tur virtual 360° yang akan ditampilkan pada Slide 8.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          id="modal-save-submit-btn"
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Tautan Embed</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* FORM FOR MATERI / GIM / KUIS */
                    <form
                      onSubmit={handleSaveModal}
                      className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {activeTab === 'kuis'
                            ? 'Pertanyaan Kuis'
                            : activeTab === 'gim'
                            ? 'Pernyataan Sikap Budaya'
                            : 'Judul Materi Budaya'}
                        </label>
                        <input
                          type="text"
                          required
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="Masukkan judul atau teks..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Topik / Kategori Budaya
                          </label>
                          <input
                            type="text"
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Status Badge
                          </label>
                          <select
                            value={formStatus}
                            onChange={(e) =>
                              setFormStatus(e.target.value as BadgeStatus)
                            }
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                          >
                            <option value="Active">Active</option>
                            <option value="Unggulan">Unggulan</option>
                            <option value="Populer">Populer</option>
                            <option value="Pending">Pending</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      {activeTab === 'materi' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Isi Bacaan / Penjelasan Materi Budaya
                          </label>
                          <textarea
                            rows={4}
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="Tuliskan penjelasan materi budaya..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      )}

                      {activeTab === 'gim' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Target Kelompok Drag & Drop
                          </label>
                          <select
                            value={formTargetGroup}
                            onChange={(e) =>
                              setFormTargetGroup(
                                e.target.value as
                                  | 'Budaya yang Benar'
                                  | 'Budaya yang Salah'
                              )
                            }
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800"
                          >
                            <option value="Budaya yang Benar">
                              Budaya yang Benar (+10 Poin)
                            </option>
                            <option value="Budaya yang Salah">
                              Budaya yang Salah (+10 Poin)
                            </option>
                          </select>
                        </div>
                      )}

                      {activeTab === 'kuis' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Pilihan Jawaban (Pilih 1 Kunci Jawaban Benar)
                          </label>
                          {formChoices.map((ch, idx) => (
                            <div
                              key={ch.id}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="radio"
                                name="correctChoice"
                                checked={ch.isCorrect}
                                onChange={() =>
                                  setFormChoices((prev) =>
                                    prev.map((c, i) => ({
                                      ...c,
                                      isCorrect: i === idx,
                                    }))
                                  )
                                }
                              />
                              <input
                                type="text"
                                value={ch.text}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormChoices((prev) =>
                                    prev.map((c, i) =>
                                      i === idx ? { ...c, text: val } : c
                                    )
                                  );
                                }}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Image & Audio Upload */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            URL / Upload Gambar
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={formImageUrl}
                              onChange={(e) => setFormImageUrl(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                            />
                            <label className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">
                              <ImageIcon className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            URL / Upload Audio MP3
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={formAudioUrl}
                              onChange={(e) => setFormAudioUrl(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                            />
                            <label className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">
                              <Volume2 className="w-4 h-4" />
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={handleAudioFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          id="modal-save-submit-btn"
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Data</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
              <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#152C88] text-white text-xs font-bold shadow-xl border border-white/15">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{toastMessage}</span>
              </div>
            )}
          </div>,
          targetPortal
        )}
    </AdminDataContext.Provider>
  );
};

export default AdminDashboard;
