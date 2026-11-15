// src/AdminDashboard.tsx
// MODERN SAAS ADMIN DASHBOARD & DATA CONTEXT — STARLA BUDAYA (REACT + TAILWIND CSS + LUCIDE-REACT)
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Gamepad2,
  ClipboardCheck,
  MonitorPlay,
  Users,
  Settings,
  Search,
  Filter,
  Download,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Volume2,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  Lock,
  LogOut,
  CloudUpload,
  RefreshCw,
  Upload,
  FileJson,
  Eye,
  Move,
  Type,
  MousePointerClick,
  ShieldCheck,
  Award,
  Layers,
  Bell,
  MessageSquare,
  X,
  Check,
  ArrowUpRight,
} from 'lucide-react';
import { useContent } from './context/ContentContext';
import {
  CanvasActionType,
  CanvasElementItem,
  CanvasElementType,
  ContentSchema,
  QuizChoiceItem,
  QuizQuestionItem,
  SlideContentItem,
} from './data/defaultContent';
import {
  addDragDropStatement,
  addQuizQuestionItem,
  addSlideItem,
  deleteQuizQuestionItem,
  deleteSlideItem,
  duplicateSlideItem,
  exportContentToJsonString,
  getConfiguredAdminPin,
  isAdminRouteActive,
  isSlideHidden,
  parseAndValidateImportedJson,
  removeDragDropStatement,
  toggleQuizQuestionVisibility,
  toggleSlideVisibility,
  updateDragDropStatement,
  verifyAdminPin,
} from './features/admin/adminHelpers';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type DashboardTabId =
  | 'dashboard'
  | 'materi'
  | 'tur360'
  | 'gim'
  | 'kuis'
  | 'desain'
  | 'pengguna'
  | 'pengaturan';

export type PastelBadgeStatus =
  | 'Active'
  | 'Pending'
  | 'Inactive'
  | 'On Sale'
  | 'Bouncing'
  | 'Unggulan'
  | 'Interaktif';

export interface ActivityRecord {
  id: string;
  studentName: string;
  school: string;
  moduleTitle: string;
  category: string;
  metric: string;
  timeAgo: string;
  status: PastelBadgeStatus;
  avatarUrl: string;
}

export interface Tour360Hotspot {
  id: string;
  label: string;
  yaw: number;
  pitch: number;
  description: string;
}

export interface Tour360Item {
  id: string;
  title: string;
  province: string;
  category: string;
  panoramaUrl: string;
  audioGuideUrl: string;
  narration: string;
  hotspots: Tour360Hotspot[];
  status: PastelBadgeStatus;
}

export interface GameMissionItem {
  id: string;
  title: string;
  description: string;
  gameType: 'Drag & Drop Garuda' | 'Memory Match' | 'Tebak Suara' | 'Kuis Cepat';
  level: 'Level 1 - Mudah' | 'Level 2 - Sedang' | 'Level 3 - Sulit' | 'Level 4 - Mahir';
  points: number;
  status: PastelBadgeStatus;
  linkedStatementId?: string;
  iconUrl: string;
}

export interface UserAccountItem {
  id: string;
  name: string;
  school: string;
  role: 'Murid' | 'Guru' | 'Admin';
  score: number;
  progressPct: number;
  status: PastelBadgeStatus;
  avatarUrl: string;
}

export interface MateriRowItem {
  rawSlide: SlideContentItem;
  idx: number;
  slideId: string;
  formattedId: string;
  readableTitle: string;
  subtitle: string;
  category: string;
  status: PastelBadgeStatus;
  thumbUrl: string;
  audioUrl: string;
  metric: string;
}

export interface AdminDataContextValue {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: DashboardTabId;
  setActiveTab: React.Dispatch<React.SetStateAction<DashboardTabId>>;
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  totalSlides: number;
  content: ContentSchema;
  materiList: MateriRowItem[];
  tours360: Tour360Item[];
  gameMissions: GameMissionItem[];
  quizQuestions: QuizQuestionItem[];
  users: UserAccountItem[];
  activities: ActivityRecord[];
  activeSlideElements: CanvasElementItem[];
}

export interface AdminDashboardProps {
  children?: React.ReactNode;
}

const CUSTOM_PIN_STORAGE_KEY = 'starla_custom_admin_pin';
const EXTRA_DATA_STORAGE_KEY = 'starla_saas_admin_extra_v1';

// ============================================================================
// INITIAL DATA FOR 360° BUDAYA, GIM EDUKASI, PENGGUNA & AKTIVITAS
// ============================================================================

const INITIAL_ACTIVITIES: ActivityRecord[] = [
  {
    id: '#ACT-001',
    studentName: 'Alya Putri Maharani',
    school: 'SDN 1 Nusantara Jakarta',
    moduleTitle: 'Eksplorasi Rumah Adat & Bhinneka Tunggal Ika',
    category: 'Materi Budaya',
    metric: 'Skor 95 · Selesai 100%',
    timeAgo: '5 menit lalu',
    status: 'On Sale',
    avatarUrl: 'mobile/5fD3uOAkxBz.png',
  },
  {
    id: '#ACT-002',
    studentName: 'Bima Satria Pratama',
    school: 'SDN 3 Cendekia Bandung',
    moduleTitle: 'Tur Virtual 360° Anjungan Sumatera Barat',
    category: '360° Budaya',
    metric: '6/6 Hotspot Dikunjungi',
    timeAgo: '14 menit lalu',
    status: 'Bouncing',
    avatarUrl: 'mobile/6EfvCxuLoY5.png',
  },
  {
    id: '#ACT-003',
    studentName: 'Citra Kirana Dewi',
    school: 'SD Merdeka Yogyakarta',
    moduleTitle: 'Evaluasi Kuis Budaya Nusantara (10 Soal)',
    category: 'Kuis & Evaluasi',
    metric: 'Nilai 100/100 (Sempurna)',
    timeAgo: '28 menit lalu',
    status: 'Active',
    avatarUrl: 'mobile/5WGLEVYzj2G.png',
  },
  {
    id: '#ACT-004',
    studentName: 'Dimas Aditya Nugraha',
    school: 'SDN 2 Tunas Bangsa Surabaya',
    moduleTitle: 'Misi Gim Anak Garuda: Sikap Toleransi',
    category: 'Gim Edukasi',
    metric: '+120 Poin Garuda',
    timeAgo: '42 menit lalu',
    status: 'Bouncing',
    avatarUrl: 'mobile/5fD3uOAkxBz.png',
  },
  {
    id: '#ACT-005',
    studentName: 'Eka Surya Saputra',
    school: 'SDN 4 Harapan Denpasar',
    moduleTitle: 'Sinema Video Animasi Starla Budaya',
    category: 'Materi Budaya',
    metric: 'Menonton 04:15 menit',
    timeAgo: '1 jam lalu',
    status: 'Active',
    avatarUrl: 'mobile/6EfvCxuLoY5.png',
  },
  {
    id: '#ACT-006',
    studentName: 'Farah Nabila Azzahra',
    school: 'SDN 1 Bhinneka Medan',
    moduleTitle: 'Tur Virtual 360° Rumah Adat Tongkonan',
    category: '360° Budaya',
    metric: '4/5 Hotspot Dikunjungi',
    timeAgo: '2 jam lalu',
    status: 'Pending',
    avatarUrl: 'mobile/5WGLEVYzj2G.png',
  },
];

const INITIAL_TOURS_360: Tour360Item[] = [
  {
    id: '#360-001',
    title: 'Anjungan Rumah Gadang Minangkabau',
    province: 'Sumatera Barat',
    category: 'Arsitektur Nusantara',
    panoramaUrl: 'mobile/Slide5WPRbcJDCqY.jpg',
    audioGuideUrl: 'story_content/6bB7nF2xL2B_44100_48_0.mp3',
    narration:
      'Eksplorasi kemegahan arsitektur atap gonjong Rumah Gadang dan filosofi adat basandi syarak.',
    hotspots: [
      {
        id: 'hs-1',
        label: 'Atap Gonjong Tanduk Kerbau',
        yaw: 45,
        pitch: 18,
        description: 'Melambangkan kemenangan dan kearifan lokal masyarakat Minangkabau.',
      },
      {
        id: 'hs-2',
        label: 'Rangkiang Lumbung Padi',
        yaw: 130,
        pitch: -5,
        description: 'Tempat penyimpanan padi sebagai simbol kesejahteraan bersama.',
      },
      {
        id: 'hs-3',
        label: 'Ukiran Kayu Motif Alam Takambang',
        yaw: 210,
        pitch: 8,
        description: 'Filosofi belajar dari keindahan dan keteraturan alam semesta.',
      },
    ],
    status: 'On Sale',
  },
  {
    id: '#360-002',
    title: 'Pelataran Candi Borobudur & Relief',
    province: 'Jawa Tengah',
    category: 'Cagar Budaya Dunia',
    panoramaUrl: 'mobile/6EfvCxuLoY5.png',
    audioGuideUrl: 'story_content/6bB7nF2xL2B_44100_48_0.mp3',
    narration:
      'Jelajahi relief bersejarah dan stupa megah warisan budaya dunia di Magelang, Jawa Tengah.',
    hotspots: [
      {
        id: 'hs-4',
        label: 'Stupa Induk Puncak Candi',
        yaw: 90,
        pitch: 24,
        description: 'Monumen harmoni dan toleransi masyarakat Nusantara sejak abad ke-8.',
      },
      {
        id: 'hs-5',
        label: 'Relief Perahu Samudraraksa',
        yaw: 175,
        pitch: 4,
        description: 'Bukti kejayaan maritim nenek moyang bangsa Indonesia.',
      },
    ],
    status: 'Bouncing',
  },
  {
    id: '#360-003',
    title: 'Desa Adat Tongkonan Tana Toraja',
    province: 'Sulawesi Selatan',
    category: 'Desa Adat Tradisional',
    panoramaUrl: 'mobile/5WGLEVYzj2G.png',
    audioGuideUrl: 'story_content/6bB7nF2xL2B_44100_48_0.mp3',
    narration:
      'Kenali keunikan rumah adat Tongkonan dengan ukiran Pa’barre Allo khas pegunungan Toraja.',
    hotspots: [
      {
        id: 'hs-6',
        label: 'Fasad Tanduk Kerbau (Kabongo)',
        yaw: 60,
        pitch: 12,
        description: 'Lambang status sosial, gotong royong, dan kekerabatan masyarakat Toraja.',
      },
      {
        id: 'hs-7',
        label: 'Alang Sura (Lumbung Padi)',
        yaw: 240,
        pitch: 6,
        description: 'Bangunan menghadap Tongkonan sebagai simbol kemakmuran.',
      },
    ],
    status: 'Active',
  },
  {
    id: '#360-004',
    title: 'Kompleks Rumah Honai Lembah Baliem',
    province: 'Papua Pegunungan',
    category: 'Arsitektur Nusantara',
    panoramaUrl: 'mobile/5fD3uOAkxBz.png',
    audioGuideUrl: 'story_content/6bB7nF2xL2B_44100_48_0.mp3',
    narration:
      'Kunjungi rumah bundar beratap jerami yang hangat dan ramah lingkungan di Lembah Baliem.',
    hotspots: [
      {
        id: 'hs-8',
        label: 'Atap Jerami Berbentuk Kerucut',
        yaw: 110,
        pitch: 15,
        description: 'Menjaga kehangatan ruangan di pegunungan dingin Lembah Baliem.',
      },
    ],
    status: 'Active',
  },
  {
    id: '#360-005',
    title: 'Bangsal Kencono Keraton Yogyakarta',
    province: 'DI Yogyakarta',
    category: 'Warisan Budaya',
    panoramaUrl: 'mobile/Slide5WPRbcJDCqY.jpg',
    audioGuideUrl: 'story_content/6bB7nF2xL2B_44100_48_0.mp3',
    narration:
      'Amati tata ruang arsitektur Joglo Agung dan filosofi sumbu filosofis Yogyakarta.',
    hotspots: [
      {
        id: 'hs-9',
        label: 'Pendopo Agung Joglo',
        yaw: 180,
        pitch: 10,
        description: 'Pusat pagelaran seni tari klasik dan gamelan keraton.',
      },
    ],
    status: 'Pending',
  },
];

const INITIAL_USERS: UserAccountItem[] = [
  {
    id: '#USR-001',
    name: 'Dr. Faryz, M.Pd.',
    school: 'Pengembang Utama Starla Budaya',
    role: 'Admin',
    score: 100,
    progressPct: 100,
    status: 'On Sale',
    avatarUrl: 'mobile/6EfvCxuLoY5.png',
  },
  {
    id: '#USR-002',
    name: 'Ibu Ratna Sari, S.Pd.',
    school: 'SDN 1 Nusantara Jakarta',
    role: 'Guru',
    score: 98,
    progressPct: 100,
    status: 'Active',
    avatarUrl: 'mobile/5WGLEVYzj2G.png',
  },
  {
    id: '#USR-003',
    name: 'Alya Putri Maharani',
    school: 'SDN 1 Nusantara Jakarta',
    role: 'Murid',
    score: 95,
    progressPct: 100,
    status: 'On Sale',
    avatarUrl: 'mobile/5fD3uOAkxBz.png',
  },
  {
    id: '#USR-004',
    name: 'Bima Satria Pratama',
    school: 'SDN 3 Cendekia Bandung',
    role: 'Murid',
    score: 90,
    progressPct: 92,
    status: 'Bouncing',
    avatarUrl: 'mobile/6EfvCxuLoY5.png',
  },
  {
    id: '#USR-005',
    name: 'Citra Kirana Dewi',
    school: 'SD Merdeka Yogyakarta',
    role: 'Murid',
    score: 100,
    progressPct: 100,
    status: 'Active',
    avatarUrl: 'mobile/5WGLEVYzj2G.png',
  },
  {
    id: '#USR-006',
    name: 'Dimas Aditya Nugraha',
    school: 'SDN 2 Tunas Bangsa Surabaya',
    role: 'Murid',
    score: 85,
    progressPct: 80,
    status: 'Active',
    avatarUrl: 'mobile/5fD3uOAkxBz.png',
  },
  {
    id: '#USR-007',
    name: 'Farah Nabila Azzahra',
    school: 'SDN 1 Bhinneka Medan',
    role: 'Murid',
    score: 75,
    progressPct: 65,
    status: 'Pending',
    avatarUrl: 'mobile/6EfvCxuLoY5.png',
  },
  {
    id: '#USR-008',
    name: 'Gilang Ramadhan',
    school: 'SDN 5 Harmoni Makassar',
    role: 'Murid',
    score: 60,
    progressPct: 40,
    status: 'Inactive',
    avatarUrl: 'mobile/5WGLEVYzj2G.png',
  },
];

// ============================================================================
// SCOPED TAILWIND CSS INJECTION (ZERO EXTERNAL RUNTIME BUILD DEPENDENCY)
// ============================================================================

const SAAS_TAILWIND_CSS = `
.starla-saas-admin, .starla-saas-admin * {
  box-sizing: border-box;
  font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.starla-saas-admin {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: #F4F7FE;
  color: #0f172a;
  overflow: hidden;
  user-select: text;
  -webkit-user-select: text;
}
.starla-saas-admin .w-64 { width: 16rem; }
.starla-saas-admin .w-80 { width: 20rem; }
.starla-saas-admin .w-10 { width: 2.5rem; }
.starla-saas-admin .h-10 { height: 2.5rem; }
.starla-saas-admin .w-9 { width: 2.25rem; }
.starla-saas-admin .h-9 { height: 2.25rem; }
.starla-saas-admin .w-8 { width: 2rem; }
.starla-saas-admin .h-8 { height: 2rem; }
.starla-saas-admin .w-12 { width: 3rem; }
.starla-saas-admin .h-12 { height: 3rem; }
.starla-saas-admin .w-full { width: 100%; }
.starla-saas-admin .h-full { height: 100%; }
.starla-saas-admin .min-w-0 { min-width: 0; }
.starla-saas-admin .shrink-0 { flex-shrink: 0; }
.starla-saas-admin .flex { display: flex; }
.starla-saas-admin .inline-flex { display: inline-flex; }
.starla-saas-admin .grid { display: grid; }
.starla-saas-admin .flex-col { flex-direction: column; }
.starla-saas-admin .flex-wrap { flex-wrap: wrap; }
.starla-saas-admin .flex-1 { flex: 1 1 0%; }
.starla-saas-admin .items-center { align-items: center; }
.starla-saas-admin .items-start { align-items: flex-start; }
.starla-saas-admin .justify-between { justify-content: space-between; }
.starla-saas-admin .justify-center { justify-content: center; }
.starla-saas-admin .justify-end { justify-content: flex-end; }
.starla-saas-admin .gap-1 { gap: 0.25rem; }
.starla-saas-admin .gap-1\\.5 { gap: 0.375rem; }
.starla-saas-admin .gap-2 { gap: 0.5rem; }
.starla-saas-admin .gap-2\\.5 { gap: 0.625rem; }
.starla-saas-admin .gap-3 { gap: 0.75rem; }
.starla-saas-admin .gap-4 { gap: 1rem; }
.starla-saas-admin .gap-5 { gap: 1.25rem; }
.starla-saas-admin .gap-6 { gap: 1.5rem; }
.starla-saas-admin .space-y-1 > * + * { margin-top: 0.25rem; }
.starla-saas-admin .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
.starla-saas-admin .space-y-2 > * + * { margin-top: 0.5rem; }
.starla-saas-admin .space-y-2\\.5 > * + * { margin-top: 0.625rem; }
.starla-saas-admin .space-y-3 > * + * { margin-top: 0.75rem; }
.starla-saas-admin .space-y-4 > * + * { margin-top: 1rem; }
.starla-saas-admin .space-y-5 > * + * { margin-top: 1.25rem; }
.starla-saas-admin .space-y-6 > * + * { margin-top: 1.5rem; }
.starla-saas-admin .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.starla-saas-admin .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.starla-saas-admin .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.starla-saas-admin .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.starla-saas-admin .bg-white { background-color: #ffffff; }
.starla-saas-admin .bg-\\[\\#F4F7FE\\] { background-color: #F4F7FE; }
.starla-saas-admin .bg-\\[\\#2563EB\\] { background-color: #2563EB; }
.starla-saas-admin .bg-slate-50 { background-color: #f8fafc; }
.starla-saas-admin .bg-slate-100 { background-color: #f1f5f9; }
.starla-saas-admin .bg-blue-50 { background-color: #eff6ff; }
.starla-saas-admin .bg-blue-600 { background-color: #2563eb; }
.starla-saas-admin .hover\\:bg-blue-700:hover { background-color: #1d4ed8; }
.starla-saas-admin .hover\\:bg-slate-50:hover { background-color: #f8fafc; }
.starla-saas-admin .hover\\:bg-slate-100:hover { background-color: #f1f5f9; }
.starla-saas-admin .hover\\:bg-rose-50:hover { background-color: #fff1f2; }
.starla-saas-admin .bg-emerald-50 { background-color: #ecfdf5; }
.starla-saas-admin .bg-amber-50 { background-color: #fffbeb; }
.starla-saas-admin .bg-rose-50 { background-color: #fff1f2; }
.starla-saas-admin .bg-purple-50 { background-color: #faf5ff; }
.starla-saas-admin .bg-indigo-50 { background-color: #eef2ff; }
.starla-saas-admin .text-white { color: #ffffff; }
.starla-saas-admin .text-slate-900 { color: #0f172a; }
.starla-saas-admin .text-slate-800 { color: #1e293b; }
.starla-saas-admin .text-slate-700 { color: #334155; }
.starla-saas-admin .text-slate-600 { color: #475569; }
.starla-saas-admin .text-slate-500 { color: #64748b; }
.starla-saas-admin .text-slate-400 { color: #94a3b8; }
.starla-saas-admin .text-blue-600 { color: #2563eb; }
.starla-saas-admin .text-blue-700 { color: #1d4ed8; }
.starla-saas-admin .text-emerald-600 { color: #059669; }
.starla-saas-admin .text-emerald-700 { color: #047857; }
.starla-saas-admin .text-amber-600 { color: #d97706; }
.starla-saas-admin .text-amber-700 { color: #b45309; }
.starla-saas-admin .text-rose-600 { color: #e11d48; }
.starla-saas-admin .text-rose-700 { color: #be123c; }
.starla-saas-admin .text-purple-600 { color: #9333ea; }
.starla-saas-admin .text-purple-700 { color: #7e22ce; }
.starla-saas-admin .border { border-width: 1px; border-style: solid; border-color: #e2e8f0; }
.starla-saas-admin .border-b { border-bottom: 1px solid #e2e8f0; }
.starla-saas-admin .border-t { border-top: 1px solid #e2e8f0; }
.starla-saas-admin .border-r { border-right: 1px solid #e2e8f0; }
.starla-saas-admin .border-l { border-left: 1px solid #e2e8f0; }
.starla-saas-admin .border-slate-100 { border-color: #f1f5f9; }
.starla-saas-admin .border-slate-200 { border-color: #e2e8f0; }
.starla-saas-admin .border-blue-200 { border-color: #bfdbfe; }
.starla-saas-admin .border-blue-500 { border-color: #3b82f6; }
.starla-saas-admin .border-emerald-200 { border-color: #a7f3d0; }
.starla-saas-admin .border-amber-200 { border-color: #fde68a; }
.starla-saas-admin .border-rose-200 { border-color: #fecdd3; }
.starla-saas-admin .border-purple-200 { border-color: #e9d5ff; }
.starla-saas-admin .rounded-lg { border-radius: 0.5rem; }
.starla-saas-admin .rounded-xl { border-radius: 0.75rem; }
.starla-saas-admin .rounded-2xl { border-radius: 1rem; }
.starla-saas-admin .rounded-3xl { border-radius: 1.5rem; }
.starla-saas-admin .rounded-full { border-radius: 9999px; }
.starla-saas-admin .shadow-sm { box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.06); }
.starla-saas-admin .shadow-md { box-shadow: 0 6px 16px -3px rgba(37, 99, 235, 0.28), 0 2px 6px -2px rgba(15, 23, 42, 0.08); }
.starla-saas-admin .shadow-lg { box-shadow: 0 12px 28px -6px rgba(15, 23, 42, 0.14); }
.starla-saas-admin .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); }
.starla-saas-admin .p-1\\.5 { padding: 0.375rem; }
.starla-saas-admin .p-2 { padding: 0.5rem; }
.starla-saas-admin .p-3 { padding: 0.75rem; }
.starla-saas-admin .p-3\\.5 { padding: 0.875rem; }
.starla-saas-admin .p-4 { padding: 1rem; }
.starla-saas-admin .p-5 { padding: 1.25rem; }
.starla-saas-admin .p-6 { padding: 1.5rem; }
.starla-saas-admin .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.starla-saas-admin .px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
.starla-saas-admin .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.starla-saas-admin .px-3\\.5 { padding-left: 0.875rem; padding-right: 0.875rem; }
.starla-saas-admin .px-4 { padding-left: 1rem; padding-right: 1rem; }
.starla-saas-admin .px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
.starla-saas-admin .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.starla-saas-admin .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.starla-saas-admin .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.starla-saas-admin .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.starla-saas-admin .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.starla-saas-admin .py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
.starla-saas-admin .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.starla-saas-admin .py-3\\.5 { padding-top: 0.875rem; padding-bottom: 0.875rem; }
.starla-saas-admin .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.starla-saas-admin .pt-1 { padding-top: 0.25rem; }
.starla-saas-admin .pt-2 { padding-top: 0.5rem; }
.starla-saas-admin .pt-3 { padding-top: 0.75rem; }
.starla-saas-admin .pb-3 { padding-bottom: 0.75rem; }
.starla-saas-admin .pb-5 { padding-bottom: 1.25rem; }
.starla-saas-admin .mt-0\\.5 { margin-top: 0.125rem; }
.starla-saas-admin .mt-1 { margin-top: 0.25rem; }
.starla-saas-admin .mt-1\\.5 { margin-top: 0.375rem; }
.starla-saas-admin .mt-2 { margin-top: 0.5rem; }
.starla-saas-admin .mt-3 { margin-top: 0.75rem; }
.starla-saas-admin .mt-5 { margin-top: 1.25rem; }
.starla-saas-admin .mb-3 { margin-bottom: 0.75rem; }
.starla-saas-admin .text-xs { font-size: 0.75rem; line-height: 1.1rem; }
.starla-saas-admin .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.starla-saas-admin .text-base { font-size: 1rem; line-height: 1.5rem; }
.starla-saas-admin .text-lg { font-size: 1.125rem; line-height: 1.6rem; }
.starla-saas-admin .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.starla-saas-admin .text-2xl { font-size: 1.5rem; line-height: 2rem; }
.starla-saas-admin .font-medium { font-weight: 500; }
.starla-saas-admin .font-semibold { font-weight: 600; }
.starla-saas-admin .font-bold { font-weight: 700; }
.starla-saas-admin .font-extrabold { font-weight: 800; }
.starla-saas-admin .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.starla-saas-admin .overflow-hidden { overflow: hidden; }
.starla-saas-admin .overflow-y-auto { overflow-y: auto; }
.starla-saas-admin .overflow-x-auto { overflow-x: auto; }
.starla-saas-admin .object-cover { object-fit: cover; }
.starla-saas-admin .object-contain { object-fit: contain; }
.starla-saas-admin .cursor-pointer { cursor: pointer; }
.starla-saas-admin .transition-all { transition: all 0.18s ease; }
.starla-saas-admin .relative { position: relative; }
.starla-saas-admin .absolute { position: absolute; }
.starla-saas-admin .fixed { position: fixed; }
.starla-saas-admin .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.starla-saas-admin table { width: 100%; border-collapse: collapse; }
.starla-saas-admin th { text-align: left; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; padding: 0.875rem 1.25rem; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.starla-saas-admin td { padding: 0.875rem 1.25rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; vertical-align: middle; }
.starla-saas-admin tbody tr:hover { background-color: #f8fafc; }
.starla-saas-admin input, .starla-saas-admin select, .starla-saas-admin textarea {
  font-family: inherit;
  outline: none;
}
.starla-saas-admin button {
  font-family: inherit;
  cursor: pointer;
}
.starla-saas-admin button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
`;

function ensureSaasStylesMounted() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('starla-saas-admin-tailwind')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'starla-saas-admin-tailwind';
    styleEl.textContent = SAAS_TAILWIND_CSS;
    document.head.appendChild(styleEl);
  }
}

// ============================================================================
// HELPER: PASTEL STATUS BADGE RENDERER
// ============================================================================

export const PastelStatusBadge: React.FC<{ status: PastelBadgeStatus }> = ({
  status,
}) => {
  const styles: Record<
    PastelBadgeStatus,
    { className: string; icon: React.ReactNode }
  > = {
    Active: {
      className:
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200',
      icon: <CheckCircle2 size={13} />,
    },
    Pending: {
      className:
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200',
      icon: <Clock size={13} />,
    },
    Inactive: {
      className:
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200',
      icon: <XCircle size={13} />,
    },
    'On Sale': {
      className:
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200',
      icon: <Sparkles size={13} />,
    },
    Unggulan: {
      className:
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200',
      icon: <Sparkles size={13} />,
    },
    Bouncing: {
      className:
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200',
      icon: <Zap size={13} />,
    },
    Interaktif: {
      className:
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200',
      icon: <Zap size={13} />,
    },
  };

  const cfg = styles[status] || styles.Active;
  return (
    <span
      className={cfg.className}
      data-testid={`status-badge-${status.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {cfg.icon}
      <span>{status}</span>
    </span>
  );
};

// ============================================================================
// HELPER: RESOLVE READABLE SLIDE TITLE & CATEGORY
// ============================================================================

function resolveReadableSlideTitle(slide: SlideContentItem, idx: number): string {
  const rawTitle = (slide.title || '').trim();
  if (rawTitle && rawTitle.toLowerCase() !== 'untitled slide') {
    return rawTitle;
  }
  const firstTextLine = slide.texts?.[0]?.lines?.join(' ')?.trim();
  if (firstTextLine && firstTextLine.length > 1) {
    return firstTextLine.slice(0, 52);
  }
  const firstInstr = slide.instructions?.[0]?.trim();
  if (firstInstr && firstInstr.length > 1) {
    return firstInstr.slice(0, 52);
  }
  if (idx === 0) return 'Opening Starla Budaya';
  return `Halaman Materi ${idx + 1}`;
}

function resolveSlideCategory(slide: SlideContentItem, idx: number): string {
  if (slide.quizQuestion) return 'Evaluasi & Kuis';
  if (slide.videos && slide.videos.length > 0) return 'Sinema & Video';
  if (idx <= 3) return 'Pembuka & Pengantar';
  if (idx >= 30) return 'Gim & Evaluasi';
  return 'Eksplorasi Budaya';
}

function resolveSlideStatus(
  content: ContentSchema,
  slide: SlideContentItem,
  idx: number
): PastelBadgeStatus {
  if (isSlideHidden(content, slide.id)) return 'Inactive';
  if ((slide.canvasElements?.length || 0) > 0 || slide.quizQuestion) {
    return 'Bouncing';
  }
  if (idx < 6 || (slide.videos?.length || 0) > 0) return 'On Sale';
  return 'Active';
}

// ============================================================================
// ADMIN DATA CONTEXT & HOOK (`useAdminData()`)
// ============================================================================

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function useAdminData(): AdminDataContextValue {
  const ctx = useContext(AdminDataContext);
  if (!ctx) {
    throw new Error('useAdminData must be used within <AdminDashboard>');
  }
  return ctx;
}

// ============================================================================
// PUBLIC OVERLAY FOR CUSTOM ELEMENTS CREATED IN "DESAIN SLIDE"
// ============================================================================

const PublicCustomSlideElementsPortal: React.FC<{
  content: ContentSchema;
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
}> = ({ content, activeSlideIndex, setActiveSlideIndex }) => {
  const [popupData, setPopupData] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const slideId =
    content.slideOrder[activeSlideIndex] || content.slideOrder[0];
  const slide = content.slides[slideId];
  const elements = (slide?.canvasElements || []).filter((el) => !el.hidden);

  if (typeof document === 'undefined' || elements.length === 0) return null;

  const targetContainer =
    document.getElementById('slide-window') ||
    document.getElementById('preso') ||
    document.body;

  const handleElementClick = (el: CanvasElementItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const act = el.action;
    if (el.audioUrl || act?.audioUrl) {
      const url = act?.audioUrl || el.audioUrl;
      if (url) {
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(() => {});
      }
    }
    if (!act || act.type === 'none') return;
    if (act.type === 'goto-slide') {
      if (typeof act.targetSlideIndex === 'number') {
        setActiveSlideIndex(
          Math.max(0, Math.min(content.slideOrder.length - 1, act.targetSlideIndex))
        );
      } else if (act.targetSlideId) {
        const idx = content.slideOrder.indexOf(act.targetSlideId);
        if (idx >= 0) setActiveSlideIndex(idx);
      }
    } else if (act.type === 'open-popup') {
      setPopupData({
        title: act.popupTitle || el.label || 'Informasi Budaya',
        body:
          act.popupContent ||
          act.popupBody ||
          'Penjelasan materi budaya Nusantara.',
      });
    } else if (act.type === 'external-url' && act.externalUrl) {
      window.location.assign(act.externalUrl);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9990,
      }}
    >
      {elements.map((el) => (
        <div
          key={el.id}
          onClick={(e) => handleElementClick(el, e)}
          style={{
            position: 'absolute',
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.width}%`,
            height: `${el.height}%`,
            zIndex: el.zIndex || 20,
            pointerEvents: 'auto',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 10px',
            backgroundColor: el.style?.backgroundColor || '#2563EB',
            color: el.style?.textColor || '#ffffff',
            fontSize: el.style?.fontSize || 13,
            fontWeight: 700,
            borderRadius: el.style?.borderRadius ?? 10,
            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.22)',
            overflow: 'hidden',
          }}
        >
          {el.imageUrl && (
            <img
              src={el.imageUrl}
              alt={el.label || 'Elemen'}
              style={{
                width: el.type === 'image' ? '100%' : 24,
                height: el.type === 'image' ? '100%' : 24,
                objectFit: 'cover',
                borderRadius: 6,
              }}
            />
          )}
          {el.type !== 'image' && <span>{el.label}</span>}
        </div>
      ))}

      {popupData && (
        <div
          onClick={() => setPopupData(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto',
            zIndex: 99999,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 35px rgba(15, 23, 42, 0.25)',
            }}
          >
            <h4
              style={{
                margin: '0 0 8px 0',
                fontSize: 18,
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {popupData.title}
            </h4>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#475569',
              }}
            >
              {popupData.body}
            </p>
            <button
              type="button"
              onClick={() => setPopupData(null)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#2563EB',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>,
    targetContainer
  );
};

// ============================================================================
// MAIN ADMIN DASHBOARD COMPONENT
// ============================================================================

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ children }) => {
  const {
    content,
    storageSource,
    isSyncing,
    activeSlideIndex,
    setActiveSlideIndex,
    updateContent,
    updateSlideContent,
    updateQuizQuestion,
    saveContentToCloud,
    uploadMediaToCloud,
    resetContent,
    addCanvasElement,
    updateCanvasElement,
    deleteCanvasElement,
  } = useContent();

  useEffect(() => {
    ensureSaasStylesMounted();
  }, []);

  // --------------------------------------------------------------------------
  // OPEN / AUTH STATE
  // --------------------------------------------------------------------------
  const [isOpen, setIsOpen] = useState<boolean>(() => isAdminRouteActive());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [customPin, setCustomPin] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CUSTOM_PIN_STORAGE_KEY) || getConfiguredAdminPin();
    }
    return getConfiguredAdminPin();
  });

  // --------------------------------------------------------------------------
  // NAVIGATION, SEARCH, FILTER, PAGINATION STATE
  // --------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<DashboardTabId>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PastelBadgeStatus>('ALL');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, statusFilter, pageSize]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onUrlChange = () => {
      if (isAdminRouteActive()) setIsOpen(true);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('popstate', onUrlChange);
    window.addEventListener('hashchange', onUrlChange);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('popstate', onUrlChange);
      window.removeEventListener('hashchange', onUrlChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // --------------------------------------------------------------------------
  // PERSISTED MODULE DATA (ACTIVITIES, 360 TOURS, GAMES, USERS)
  // --------------------------------------------------------------------------
  const [activities, setActivities] = useState<ActivityRecord[]>(INITIAL_ACTIVITIES);
  const [tours360, setTours360] = useState<Tour360Item[]>(INITIAL_TOURS_360);
  const [users, setUsers] = useState<UserAccountItem[]>(INITIAL_USERS);
  const [slideCategoryOverrides, setSlideCategoryOverrides] = useState<
    Record<string, string>
  >({});
  const [slideStatusOverrides, setSlideStatusOverrides] = useState<
    Record<string, PastelBadgeStatus>
  >({});

  const [extraGames, setExtraGames] = useState<GameMissionItem[]>([
    {
      id: '#GIM-101',
      title: 'Memory Match: Pakaian Adat 38 Provinsi',
      description: 'Cocokkan kartu gambar pakaian adat dengan nama provinsinya secara tepat.',
      gameType: 'Memory Match',
      level: 'Level 2 - Sedang',
      points: 30,
      status: 'On Sale',
      iconUrl: 'mobile/5WGLEVYzj2G.png',
    },
    {
      id: '#GIM-102',
      title: 'Tebak Suara: Harmoni Alat Musik Tradisional',
      description: 'Dengarkan petikan Sasando, Angklung, Gamelan, dan Tifa lalu pilih asalnya.',
      gameType: 'Tebak Suara',
      level: 'Level 3 - Sulit',
      points: 40,
      status: 'Bouncing',
      iconUrl: 'mobile/5fD3uOAkxBz.png',
    },
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(EXTRA_DATA_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.activities) && parsed.activities.length > 0) {
        setActivities(parsed.activities);
      }
      if (Array.isArray(parsed.tours360) && parsed.tours360.length > 0) {
        setTours360(parsed.tours360);
      }
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        setUsers(parsed.users);
      }
      if (Array.isArray(parsed.extraGames)) {
        setExtraGames(parsed.extraGames);
      }
      if (parsed.slideCategoryOverrides) {
        setSlideCategoryOverrides(parsed.slideCategoryOverrides);
      }
      if (parsed.slideStatusOverrides) {
        setSlideStatusOverrides(parsed.slideStatusOverrides);
      }
    } catch {
      // ignore invalid local cache
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        EXTRA_DATA_STORAGE_KEY,
        JSON.stringify({
          activities,
          tours360,
          users,
          extraGames,
          slideCategoryOverrides,
          slideStatusOverrides,
        })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [
    activities,
    tours360,
    users,
    extraGames,
    slideCategoryOverrides,
    slideStatusOverrides,
  ]);

  const allGameMissions: GameMissionItem[] = useMemo(() => {
    const garudaStatements = content.quizzes.gameAnakGaruda.statements || [];
    const mappedGaruda: GameMissionItem[] = garudaStatements.map((stmt, idx) => ({
      id: `#GIM-${String(idx + 1).padStart(3, '0')}`,
      title: `Misi Anak Garuda #${idx + 1}`,
      description: stmt.text,
      gameType: 'Drag & Drop Garuda',
      level: idx % 2 === 0 ? 'Level 1 - Mudah' : 'Level 2 - Sedang',
      points: content.quizzes.gameAnakGaruda.maxPoints || 20,
      status: idx === 0 ? 'On Sale' : 'Bouncing',
      linkedStatementId: stmt.id,
      iconUrl: 'mobile/6EfvCxuLoY5.png',
    }));
    return [...mappedGaruda, ...extraGames];
  }, [content.quizzes.gameAnakGaruda, extraGames]);

  // --------------------------------------------------------------------------
  // AUDIO PREVIEW HELPER
  // --------------------------------------------------------------------------
  const togglePlayAudio = useCallback(
    (url: string) => {
      if (!url) return;
      if (playingAudioUrl === url && audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        setPlayingAudioUrl(null);
        return;
      }
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(url);
      audioPreviewRef.current = audio;
      setPlayingAudioUrl(url);
      audio.onended = () => setPlayingAudioUrl(null);
      audio.onerror = () => setPlayingAudioUrl(null);
      audio.play().catch(() => setPlayingAudioUrl(null));
    },
    [playingAudioUrl]
  );

  // --------------------------------------------------------------------------
  // TAB 6: DESAIN SLIDE (SIMPLE VISUAL SLIDE DESIGNER STATE)
  // --------------------------------------------------------------------------
  const [designSlideIdx, setDesignSlideIdx] = useState<number>(activeSlideIndex || 0);
  const [selectedCanvasElId, setSelectedCanvasElId] = useState<string | null>(null);
  const designStageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeSlideIndex >= 0 && activeSlideIndex < content.slideOrder.length) {
      setDesignSlideIdx(activeSlideIndex);
    }
  }, [activeSlideIndex, content.slideOrder.length]);

  const activeDesignSlideId =
    content.slideOrder[designSlideIdx] || content.slideOrder[0];
  const activeDesignSlide: SlideContentItem | undefined =
    content.slides[activeDesignSlideId];
  const activeDesignElements: CanvasElementItem[] =
    activeDesignSlide?.canvasElements || [];
  const selectedCanvasElement =
    activeDesignElements.find((el) => el.id === selectedCanvasElId) || null;

  const handleSelectDesignSlide = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(content.slideOrder.length - 1, idx));
      setDesignSlideIdx(clamped);
      setActiveSlideIndex(clamped);
      setSelectedCanvasElId(null);
    },
    [content.slideOrder.length, setActiveSlideIndex]
  );

  const handleAddSimpleCanvasElement = (type: CanvasElementType) => {
    if (!activeDesignSlideId) return;
    const count = activeDesignElements.length;
    const offset = (count % 5) * 4;
    const defaults: Partial<CanvasElementItem> & { type: CanvasElementType } =
      type === 'text'
        ? {
            type: 'text',
            label: 'Teks Materi Baru',
            x: 20 + offset,
            y: 25 + offset,
            width: 34,
            height: 12,
            style: {
              backgroundColor: '#ffffff',
              textColor: '#0f172a',
              fontSize: 15,
              borderRadius: 10,
            },
          }
        : type === 'image'
          ? {
              type: 'image',
              label: 'Gambar Budaya',
              imageUrl: 'mobile/6EfvCxuLoY5.png',
              x: 28 + offset,
              y: 22 + offset,
              width: 26,
              height: 32,
              style: {
                backgroundColor: 'transparent',
                textColor: '#ffffff',
                borderRadius: 12,
              },
            }
          : type === 'audio-button'
            ? {
                type: 'audio-button',
                label: 'Putar Narasi Audio',
                audioUrl: 'story_content/6bB7nF2xL2B_44100_48_0.mp3',
                x: 25 + offset,
                y: 72,
                width: 28,
                height: 11,
                style: {
                  backgroundColor: '#059669',
                  textColor: '#ffffff',
                  fontSize: 13,
                  borderRadius: 999,
                },
                action: {
                  type: 'play-audio',
                  audioUrl: 'story_content/6bB7nF2xL2B_44100_48_0.mp3',
                },
              }
            : {
                type: 'image-button',
                label: 'Tombol Materi Interaktif',
                imageUrl: 'mobile/5fD3uOAkxBz.png',
                x: 24 + offset,
                y: 74,
                width: 30,
                height: 12,
                style: {
                  backgroundColor: '#2563EB',
                  textColor: '#ffffff',
                  fontSize: 13,
                  borderRadius: 12,
                },
                action: {
                  type: 'open-popup',
                  popupTitle: 'Informasi Budaya Nusantara',
                  popupContent:
                    'Penjelasan interaktif mengenai kekayaan budaya dan kearifan lokal Indonesia.',
                },
              };

    const createdEl = addCanvasElement(activeDesignSlideId, defaults);
    setSelectedCanvasElId(createdEl.id);
    showToast('Elemen baru berhasil ditambahkan ke kanvas slide');
  };

  const handleCanvasElementPointerDown = (
    e: React.PointerEvent,
    el: CanvasElementItem
  ) => {
    e.stopPropagation();
    setSelectedCanvasElId(el.id);
    if (el.locked || !designStageRef.current) return;

    const stageRect = designStageRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = el.x;
    const origY = el.y;

    const onMove = (moveEvt: PointerEvent) => {
      const dxPct = ((moveEvt.clientX - startX) / stageRect.width) * 100;
      const dyPct = ((moveEvt.clientY - startY) / stageRect.height) * 100;
      const nextX = Math.max(0, Math.min(100 - el.width, origX + dxPct));
      const nextY = Math.max(0, Math.min(100 - el.height, origY + dyPct));
      updateCanvasElement(activeDesignSlideId, el.id, {
        x: Number(nextX.toFixed(1)),
        y: Number(nextY.toFixed(1)),
      });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // --------------------------------------------------------------------------
  // CRUD MODAL STATE (SHARED DYNAMIC MODAL FOR ALL TABLE TABS)
  // --------------------------------------------------------------------------
  const [modalMode, setModalMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState<string>('');
  const [formSubtitle, setFormSubtitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formMetric, setFormMetric] = useState<string>('');
  const [formStatus, setFormStatus] = useState<PastelBadgeStatus>('Active');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formAudioUrl, setFormAudioUrl] = useState<string>('');
  const [formPoints, setFormPoints] = useState<number>(20);
  const [formLevel, setFormLevel] = useState<GameMissionItem['level']>('Level 1 - Mudah');
  const [formGameType, setFormGameType] = useState<GameMissionItem['gameType']>('Drag & Drop Garuda');
  const [formRole, setFormRole] = useState<UserAccountItem['role']>('Murid');
  const [formProgress, setFormProgress] = useState<number>(100);
  const [formHotspotsText, setFormHotspotsText] = useState<string>('');
  const [formQuizChoices, setFormQuizChoices] = useState<
    { id: string; text: string; isCorrect: boolean }[]
  >([
    { id: 'c1', text: 'Pilihan Jawaban A', isCorrect: true },
    { id: 'c2', text: 'Pilihan Jawaban B', isCorrect: false },
    { id: 'c3', text: 'Pilihan Jawaban C', isCorrect: false },
    { id: 'c4', text: 'Pilihan Jawaban D', isCorrect: false },
  ]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingRecordId(null);
    setFormStatus('Active');

    if (activeTab === 'dashboard') {
      setFormTitle('Murid Baru Starla');
      setFormSubtitle('SDN 1 Nusantara');
      setFormCategory('Materi Budaya');
      setFormMetric('Skor 95 · Selesai 100%');
      setFormImageUrl('mobile/6EfvCxuLoY5.png');
    } else if (activeTab === 'materi') {
      setFormTitle(`Bab Materi Budaya ${content.slideOrder.length + 1}`);
      setFormSubtitle('Pelajari keragaman budaya dan kearifan lokal Nusantara.');
      setFormCategory('Eksplorasi Budaya');
      setFormImageUrl('mobile/Slide5WPRbcJDCqY.jpg');
      setFormAudioUrl('story_content/6bB7nF2xL2B_44100_48_0.mp3');
      setFormStatus('On Sale');
    } else if (activeTab === 'tur360') {
      setFormTitle('Anjungan Budaya Nusantara Baru');
      setFormSubtitle('Jawa Barat');
      setFormCategory('Arsitektur Nusantara');
      setFormImageUrl('mobile/Slide5WPRbcJDCqY.jpg');
      setFormAudioUrl('story_content/6bB7nF2xL2B_44100_48_0.mp3');
      setFormHotspotsText(
        'Gerbang Utama | Arsitektur khas tradisional\nPendopo Tengah | Ruang musyawarah masyarakat adat'
      );
      setFormStatus('Bouncing');
    } else if (activeTab === 'gim') {
      setFormTitle('Misi Anak Garuda Baru');
      setFormSubtitle('Menghargai perbedaan budaya dan bahasa daerah teman.');
      setFormGameType('Drag & Drop Garuda');
      setFormLevel('Level 1 - Mudah');
      setFormPoints(20);
      setFormStatus('Bouncing');
      setFormImageUrl('mobile/6EfvCxuLoY5.png');
    } else if (activeTab === 'kuis') {
      setFormTitle('Apa sikap terbaik saat melihat pertunjukan tari daerah lain?');
      setFormPoints(10);
      setFormStatus('Active');
      setFormQuizChoices([
        {
          id: 'c1',
          text: 'Menonton dengan apresiasi dan rasa bangga',
          isCorrect: true,
        },
        {
          id: 'c2',
          text: 'Mengabaikan karena berbeda daerah',
          isCorrect: false,
        },
        {
          id: 'c3',
          text: 'Membandingkan secara berlebihan',
          isCorrect: false,
        },
        {
          id: 'c4',
          text: 'Menolak mempelajari maknanya',
          isCorrect: false,
        },
      ]);
    } else if (activeTab === 'pengguna') {
      setFormTitle('Nadia Permata Sari');
      setFormSubtitle('SDN 2 Nusantara');
      setFormRole('Murid');
      setFormPoints(92);
      setFormProgress(95);
      setFormStatus('Active');
      setFormImageUrl('mobile/5fD3uOAkxBz.png');
    }
  };

  const openEditModalForSlide = (slide: SlideContentItem, idx: number) => {
    setModalMode('edit');
    setEditingRecordId(slide.id);
    setFormTitle(resolveReadableSlideTitle(slide, idx));
    setFormSubtitle(
      slide.instructions?.join('\n') ||
        slide.texts?.map((t) => t.lines.join(' ')).join('\n') ||
        ''
    );
    setFormCategory(
      slideCategoryOverrides[slide.id] || resolveSlideCategory(slide, idx)
    );
    setFormStatus(
      slideStatusOverrides[slide.id] || resolveSlideStatus(content, slide, idx)
    );
    setFormImageUrl(
      slide.images?.[0]?.url || slide.backgroundUrl || 'mobile/Slide5WPRbcJDCqY.jpg'
    );
    setFormAudioUrl(slide.audios?.[0]?.url || '');
  };

  const openEditModalForTour360 = (item: Tour360Item) => {
    setModalMode('edit');
    setEditingRecordId(item.id);
    setFormTitle(item.title);
    setFormSubtitle(item.province);
    setFormCategory(item.category);
    setFormImageUrl(item.panoramaUrl);
    setFormAudioUrl(item.audioGuideUrl);
    setFormStatus(item.status);
    setFormHotspotsText(
      item.hotspots.map((h) => `${h.label} | ${h.description}`).join('\n')
    );
  };

  const openEditModalForGame = (item: GameMissionItem) => {
    setModalMode('edit');
    setEditingRecordId(item.id);
    setFormTitle(item.title);
    setFormSubtitle(item.description);
    setFormGameType(item.gameType);
    setFormLevel(item.level);
    setFormPoints(item.points);
    setFormStatus(item.status);
    setFormImageUrl(item.iconUrl);
  };

  const openEditModalForQuiz = (q: QuizQuestionItem) => {
    setModalMode('edit');
    setEditingRecordId(q.slideId);
    setFormTitle(q.questionText);
    setFormPoints(q.maxPoints || 10);
    setFormStatus(q.hidden ? 'Inactive' : 'Active');
    setFormQuizChoices(
      q.choices.map((c) => ({
        id: c.id,
        text: c.text,
        isCorrect: c.isCorrect,
      }))
    );
  };

  const openEditModalForUser = (u: UserAccountItem) => {
    setModalMode('edit');
    setEditingRecordId(u.id);
    setFormTitle(u.name);
    setFormSubtitle(u.school);
    setFormRole(u.role);
    setFormPoints(u.score);
    setFormProgress(u.progressPct);
    setFormStatus(u.status);
    setFormImageUrl(u.avatarUrl);
  };

  const openEditModalForActivity = (act: ActivityRecord) => {
    setModalMode('edit');
    setEditingRecordId(act.id);
    setFormTitle(act.studentName);
    setFormSubtitle(act.moduleTitle);
    setFormCategory(act.category);
    setFormMetric(act.metric);
    setFormStatus(act.status);
    setFormImageUrl(act.avatarUrl);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (activeTab === 'dashboard') {
      if (modalMode === 'create') {
        const nextAct: ActivityRecord = {
          id: `#ACT-${String(activities.length + 1).padStart(3, '0')}`,
          studentName: formTitle.trim(),
          school: 'SD Nusantara',
          moduleTitle: formSubtitle.trim() || 'Eksplorasi Budaya Nusantara',
          category: formCategory.trim() || 'Materi Budaya',
          metric: formMetric.trim() || 'Skor 90 · Selesai',
          timeAgo: 'Baru saja',
          status: formStatus,
          avatarUrl: formImageUrl || 'mobile/6EfvCxuLoY5.png',
        };
        setActivities((prev) => [nextAct, ...prev]);
        showToast('Aktivitas belajar baru berhasil ditambahkan');
      } else if (editingRecordId) {
        setActivities((prev) =>
          prev.map((a) =>
            a.id === editingRecordId
              ? {
                  ...a,
                  studentName: formTitle.trim(),
                  moduleTitle: formSubtitle.trim(),
                  category: formCategory.trim(),
                  metric: formMetric.trim(),
                  status: formStatus,
                  avatarUrl: formImageUrl || a.avatarUrl,
                }
              : a
          )
        );
        showToast('Data aktivitas berhasil diperbarui');
      }
    } else if (activeTab === 'materi') {
      if (modalMode === 'create') {
        const { nextSchema, createdSlideId } = addSlideItem(content, {
          title: formTitle.trim(),
          instructions: formSubtitle
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          backgroundUrl: formImageUrl || 'mobile/Slide5WPRbcJDCqY.jpg',
        });
        updateContent(nextSchema);
        setSlideCategoryOverrides((prev) => ({
          ...prev,
          [createdSlideId]: formCategory || 'Eksplorasi Budaya',
        }));
        setSlideStatusOverrides((prev) => ({
          ...prev,
          [createdSlideId]: formStatus,
        }));
        showToast('Materi slide baru berhasil ditambahkan');
      } else if (editingRecordId && content.slides[editingRecordId]) {
        const target = content.slides[editingRecordId];
        const nextInstructions = formSubtitle
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        const nextImages =
          target.images && target.images.length > 0
            ? target.images.map((im, i) =>
                i === 0 && formImageUrl ? { ...im, url: formImageUrl } : im
              )
            : formImageUrl
              ? [
                  {
                    layerIndex: 0,
                    layerId: 'layer-0',
                    objectId: `img-${Date.now()}`,
                    assetId: 0,
                    url: formImageUrl,
                    altText: formTitle.trim(),
                    width: 640,
                    height: 360,
                  },
                ]
              : [];
        const nextAudios =
          target.audios && target.audios.length > 0
            ? target.audios.map((au, i) =>
                i === 0 && formAudioUrl ? { ...au, url: formAudioUrl } : au
              )
            : formAudioUrl
              ? [
                  {
                    layerIndex: 0,
                    layerId: 'layer-0',
                    audioId: `aud-${Date.now()}`,
                    assetId: 0,
                    url: formAudioUrl,
                    durationMs: 5000,
                  },
                ]
              : [];

        updateSlideContent(editingRecordId, {
          title: formTitle.trim(),
          instructions: nextInstructions,
          images: nextImages,
          audios: nextAudios,
        });
        setSlideCategoryOverrides((prev) => ({
          ...prev,
          [editingRecordId]: formCategory || 'Eksplorasi Budaya',
        }));
        setSlideStatusOverrides((prev) => ({
          ...prev,
          [editingRecordId]: formStatus,
        }));
        showToast('Materi budaya berhasil diperbarui');
      }
    } else if (activeTab === 'tur360') {
      const parsedHotspots: Tour360Hotspot[] = formHotspotsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => {
          const [lbl, desc] = line.split('|').map((s) => s.trim());
          return {
            id: `hs-${Date.now()}-${idx}`,
            label: lbl || `Titik Hotspot ${idx + 1}`,
            yaw: (idx * 65 + 45) % 360,
            pitch: 10,
            description: desc || 'Penjelasan interaktif titik budaya 360°.',
          };
        });

      if (modalMode === 'create') {
        const nextTour: Tour360Item = {
          id: `#360-${String(tours360.length + 1).padStart(3, '0')}`,
          title: formTitle.trim(),
          province: formSubtitle.trim() || 'Nusantara',
          category: formCategory.trim() || 'Arsitektur Nusantara',
          panoramaUrl: formImageUrl || 'mobile/Slide5WPRbcJDCqY.jpg',
          audioGuideUrl:
            formAudioUrl || 'story_content/6bB7nF2xL2B_44100_48_0.mp3',
          narration: `Tur virtual interaktif 360° ${formTitle.trim()}.`,
          hotspots:
            parsedHotspots.length > 0
              ? parsedHotspots
              : [
                  {
                    id: `hs-${Date.now()}`,
                    label: 'Titik Utama Panorama',
                    yaw: 90,
                    pitch: 10,
                    description: 'Informasi utama lokasi budaya 360°.',
                  },
                ],
          status: formStatus,
        };
        setTours360((prev) => [nextTour, ...prev]);
        showToast('Lokasi Tur Virtual 360° baru berhasil ditambahkan');
      } else if (editingRecordId) {
        setTours360((prev) =>
          prev.map((t) =>
            t.id === editingRecordId
              ? {
                  ...t,
                  title: formTitle.trim(),
                  province: formSubtitle.trim(),
                  category: formCategory.trim(),
                  panoramaUrl: formImageUrl || t.panoramaUrl,
                  audioGuideUrl: formAudioUrl || t.audioGuideUrl,
                  hotspots:
                    parsedHotspots.length > 0 ? parsedHotspots : t.hotspots,
                  status: formStatus,
                }
              : t
          )
        );
        showToast('Data lokasi 360° Budaya berhasil diperbarui');
      }
    } else if (activeTab === 'gim') {
      if (modalMode === 'create') {
        if (formGameType === 'Drag & Drop Garuda') {
          const nextSchema = addDragDropStatement(
            content,
            formSubtitle.trim() || formTitle.trim()
          );
          updateContent(nextSchema);
          showToast('Misi Drag & Drop Anak Garuda berhasil ditambahkan');
        } else {
          const nextGame: GameMissionItem = {
            id: `#GIM-${String(allGameMissions.length + 1).padStart(3, '0')}`,
            title: formTitle.trim(),
            description: formSubtitle.trim() || formTitle.trim(),
            gameType: formGameType,
            level: formLevel,
            points: Number(formPoints) || 20,
            status: formStatus,
            iconUrl: formImageUrl || 'mobile/6EfvCxuLoY5.png',
          };
          setExtraGames((prev) => [...prev, nextGame]);
          showToast('Misi Gim Edukasi baru berhasil ditambahkan');
        }
      } else if (editingRecordId) {
        const targetMission = allGameMissions.find(
          (g) => g.id === editingRecordId
        );
        if (targetMission?.linkedStatementId) {
          const nextSchema = updateDragDropStatement(
            content,
            targetMission.linkedStatementId,
            formSubtitle.trim() || formTitle.trim()
          );
          updateContent(nextSchema);
          showToast('Pernyataan Gim Anak Garuda berhasil diperbarui');
        } else {
          setExtraGames((prev) =>
            prev.map((g) =>
              g.id === editingRecordId
                ? {
                    ...g,
                    title: formTitle.trim(),
                    description: formSubtitle.trim(),
                    gameType: formGameType,
                    level: formLevel,
                    points: Number(formPoints) || 20,
                    status: formStatus,
                    iconUrl: formImageUrl || g.iconUrl,
                  }
                : g
            )
          );
          showToast('Misi Gim Edukasi berhasil diperbarui');
        }
      }
    } else if (activeTab === 'kuis') {
      if (modalMode === 'create') {
        const { nextSchema } = addQuizQuestionItem(content, {
          questionText: formTitle.trim(),
          maxPoints: Number(formPoints) || 10,
          choices: formQuizChoices.map((c) => ({
            text: c.text,
            isCorrect: c.isCorrect,
          })),
        });
        updateContent(nextSchema);
        showToast('Soal Kuis Budaya baru berhasil ditambahkan');
      } else if (editingRecordId) {
        const existingQ = content.quizzes.kuisBudaya.questions.find(
          (q) => q.slideId === editingRecordId
        );
        if (existingQ) {
          const updatedChoices: QuizChoiceItem[] = formQuizChoices.map(
            (fc, idx) => {
              const orig = existingQ.choices[idx];
              return {
                id: orig?.id || fc.id || `choice_${idx}`,
                objectId: orig?.objectId,
                commandSetId: orig?.commandSetId,
                text: fc.text,
                isCorrect: fc.isCorrect,
                points: fc.isCorrect ? Number(formPoints) || 10 : 0,
              };
            }
          );
          const correctItem =
            updatedChoices.find((c) => c.isCorrect) || updatedChoices[0];
          updateQuizQuestion(editingRecordId, {
            questionText: formTitle.trim(),
            maxPoints: Number(formPoints) || 10,
            choices: updatedChoices,
            correctChoiceId: correctItem?.id || null,
            correctAnswerText: correctItem?.text || null,
            hidden: formStatus === 'Inactive',
          });
          showToast('Soal Kuis & Evaluasi berhasil diperbarui');
        }
      }
    } else if (activeTab === 'pengguna') {
      if (modalMode === 'create') {
        const nextUser: UserAccountItem = {
          id: `#USR-${String(users.length + 1).padStart(3, '0')}`,
          name: formTitle.trim(),
          school: formSubtitle.trim() || 'SD Nusantara',
          role: formRole,
          score: Number(formPoints) || 85,
          progressPct: Math.min(100, Math.max(0, Number(formProgress) || 100)),
          status: formStatus,
          avatarUrl: formImageUrl || 'mobile/5fD3uOAkxBz.png',
        };
        setUsers((prev) => [nextUser, ...prev]);
        showToast('Akun pengguna baru berhasil ditambahkan');
      } else if (editingRecordId) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingRecordId
              ? {
                  ...u,
                  name: formTitle.trim(),
                  school: formSubtitle.trim(),
                  role: formRole,
                  score: Number(formPoints) || u.score,
                  progressPct: Math.min(
                    100,
                    Math.max(0, Number(formProgress) || u.progressPct)
                  ),
                  status: formStatus,
                  avatarUrl: formImageUrl || u.avatarUrl,
                }
              : u
          )
        );
        showToast('Data pengguna berhasil diperbarui');
      }
    }

    setModalMode('closed');
  };

  // --------------------------------------------------------------------------
  // FILE UPLOAD HELPER (SUPABASE CLOUD + DATA URL FALLBACK)
  // --------------------------------------------------------------------------
  const handleMediaFileUpload = async (
    file: File | undefined,
    target: 'image' | 'audio' | 'canvas-image' | 'canvas-audio'
  ) => {
    if (!file) return;
    const res = await uploadMediaToCloud(file, file.name);
    if (!res.url) return;
    if (target === 'image') {
      setFormImageUrl(res.url);
    } else if (target === 'audio') {
      setFormAudioUrl(res.url);
    } else if (target === 'canvas-image' && selectedCanvasElement) {
      updateCanvasElement(activeDesignSlideId, selectedCanvasElement.id, {
        imageUrl: res.url,
      });
    } else if (target === 'canvas-audio' && selectedCanvasElement) {
      updateCanvasElement(activeDesignSlideId, selectedCanvasElement.id, {
        audioUrl: res.url,
        action: {
          ...selectedCanvasElement.action,
          type: 'play-audio',
          audioUrl: res.url,
        },
      });
    }
    showToast(`File ${file.name} berhasil diunggah`);
  };

  // --------------------------------------------------------------------------
  // EXPORT & IMPORT JSON BACKUP HELPERS
  // --------------------------------------------------------------------------
  const handleExportData = () => {
    const jsonString = exportContentToJsonString(content);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starla-budaya-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data JSON berhasil diekspor');
  };

  const handleImportJsonFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const result = parseAndValidateImportedJson(text);
      if (result.valid && result.content) {
        updateContent(result.content);
        showToast('Backup JSON berhasil diimpor & diterapkan');
      } else {
        showToast(result.error || 'Format file JSON tidak valid');
      }
    };
    reader.readAsText(file);
  };

  // --------------------------------------------------------------------------
  // FILTERED & PAGINATED DATA ROWS PER TAB
  // --------------------------------------------------------------------------
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const allMateriRows: MateriRowItem[] = useMemo(() => {
    return content.slideOrder
      .map((slideId, idx) => {
        const slide = content.slides[slideId];
        if (!slide) return null;
        const readableTitle = resolveReadableSlideTitle(slide, idx);
        const category =
          slideCategoryOverrides[slideId] || resolveSlideCategory(slide, idx);
        const status =
          slideStatusOverrides[slideId] ||
          resolveSlideStatus(content, slide, idx);
        const subtitle =
          slide.instructions?.[0] ||
          slide.texts?.[0]?.lines?.join(' ') ||
          `Modul pembelajaran interaktif halaman ${idx + 1}`;
        const thumbUrl =
          slide.images?.[0]?.url ||
          slide.backgroundUrl ||
          'mobile/Slide5WPRbcJDCqY.jpg';
        const audioUrl = slide.audios?.[0]?.url || '';
        const formattedId = `#SLD-${String(idx + 1).padStart(3, '0')}`;
        const metric = `${slide.images?.length || 0} Gambar · ${
          slide.audios?.length || 0
        } Audio`;
        return {
          rawSlide: slide,
          idx,
          slideId,
          formattedId,
          readableTitle,
          subtitle,
          category,
          status,
          thumbUrl,
          audioUrl,
          metric,
        };
      })
      .filter((item): item is MateriRowItem => Boolean(item));
  }, [content, slideCategoryOverrides, slideStatusOverrides]);

  const materiRows = useMemo(() => {
    return allMateriRows.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return (
        item.readableTitle.toLowerCase().includes(normalizedQuery) ||
        item.subtitle.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.formattedId.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [allMateriRows, statusFilter, normalizedQuery]);

  const filteredActivities = useMemo(() => {
    return activities.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return (
        item.studentName.toLowerCase().includes(normalizedQuery) ||
        item.moduleTitle.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activities, statusFilter, normalizedQuery]);

  const filteredTours360 = useMemo(() => {
    return tours360.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.province.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [tours360, statusFilter, normalizedQuery]);

  const filteredGames = useMemo(() => {
    return allGameMissions.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.gameType.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [allGameMissions, statusFilter, normalizedQuery]);

  const filteredQuizQuestions = useMemo(() => {
    return content.quizzes.kuisBudaya.questions
      .map((q, idx) => {
        const status: PastelBadgeStatus = q.hidden
          ? 'Inactive'
          : idx < 3
            ? 'On Sale'
            : 'Active';
        const formattedId = `#QIZ-${String(idx + 1).padStart(3, '0')}`;
        return { q, idx, status, formattedId };
      })
      .filter((item) => {
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
        if (!normalizedQuery) return true;
        return (
          item.q.questionText.toLowerCase().includes(normalizedQuery) ||
          (item.q.correctAnswerText || '')
            .toLowerCase()
            .includes(normalizedQuery) ||
          item.formattedId.toLowerCase().includes(normalizedQuery)
        );
      });
  }, [content.quizzes.kuisBudaya.questions, statusFilter, normalizedQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.school.toLowerCase().includes(normalizedQuery) ||
        item.role.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [users, statusFilter, normalizedQuery]);

  const totalItemsForActiveTab = useMemo(() => {
    if (activeTab === 'dashboard') return filteredActivities.length;
    if (activeTab === 'materi') return materiRows.length;
    if (activeTab === 'tur360') return filteredTours360.length;
    if (activeTab === 'gim') return filteredGames.length;
    if (activeTab === 'kuis') return filteredQuizQuestions.length;
    if (activeTab === 'pengguna') return filteredUsers.length;
    return 0;
  }, [
    activeTab,
    filteredActivities.length,
    materiRows.length,
    filteredTours360.length,
    filteredGames.length,
    filteredQuizQuestions.length,
    filteredUsers.length,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItemsForActiveTab / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = startIdx + pageSize;

  // --------------------------------------------------------------------------
  // CONTEXT VALUE FOR `useAdminData()`
  // --------------------------------------------------------------------------
  const adminDataContextValue = useMemo<AdminDataContextValue>(
    () => ({
      isOpen,
      setIsOpen,
      activeTab,
      setActiveTab,
      activeSlideIndex,
      setActiveSlideIndex: handleSelectDesignSlide,
      totalSlides: content.slideOrder.length,
      content,
      materiList: allMateriRows,
      tours360,
      gameMissions: allGameMissions,
      quizQuestions: content.quizzes.kuisBudaya.questions,
      users,
      activities,
      activeSlideElements: activeDesignElements,
    }),
    [
      isOpen,
      activeTab,
      activeSlideIndex,
      handleSelectDesignSlide,
      content,
      allMateriRows,
      tours360,
      allGameMissions,
      users,
      activities,
      activeDesignElements,
    ]
  );

  // --------------------------------------------------------------------------
  // SIDEBAR MENU DEFINITION (8 FUNCTIONAL TABS)
  // --------------------------------------------------------------------------
  const sidebarMenus: {
    id: DashboardTabId;
    label: string;
    pageTitle: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      pageTitle: 'Dashboard Statistik & Aktivitas',
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: 'materi',
      label: 'Materi Budaya',
      pageTitle: 'Manajemen Materi Budaya',
      icon: <BookOpen size={18} />,
      badge: String(content.slideOrder.length),
    },
    {
      id: 'tur360',
      label: '360° Budaya',
      pageTitle: 'Eksplorasi Tur Virtual 360° Budaya',
      icon: <Compass size={18} />,
      badge: String(tours360.length),
    },
    {
      id: 'gim',
      label: 'Gim Edukasi',
      pageTitle: 'Manajemen Misi Gim Edukasi',
      icon: <Gamepad2 size={18} />,
      badge: String(allGameMissions.length),
    },
    {
      id: 'kuis',
      label: 'Kuis & Evaluasi',
      pageTitle: 'Bank Soal Kuis & Evaluasi',
      icon: <ClipboardCheck size={18} />,
      badge: String(content.quizzes.kuisBudaya.questions.length),
    },
    {
      id: 'desain',
      label: 'Desain Slide',
      pageTitle: 'Studio Desain Slide Interaktif',
      icon: <MonitorPlay size={18} />,
    },
    {
      id: 'pengguna',
      label: 'Pengguna',
      pageTitle: 'Manajemen Data Pengguna',
      icon: <Users size={18} />,
      badge: String(users.length),
    },
    {
      id: 'pengaturan',
      label: 'Pengaturan',
      pageTitle: 'Pengaturan Sistem & Cloud Backup',
      icon: <Settings size={18} />,
    },
  ];

  const currentMenuMeta =
    sidebarMenus.find((m) => m.id === activeTab) || sidebarMenus[0];

  // ==========================================================================
  // RENDER 1: PUBLIC MODE (isOpen === false)
  // ==========================================================================
  if (!isOpen) {
    return (
      <AdminDataContext.Provider value={adminDataContextValue}>
        {children}
        <PublicCustomSlideElementsPortal
          content={content}
          activeSlideIndex={activeSlideIndex}
          setActiveSlideIndex={setActiveSlideIndex}
        />
        {typeof document !== 'undefined' &&
          createPortal(
            <button
              type="button"
              data-testid="open-admin-dashboard-btn"
              onClick={() => setIsOpen(true)}
              className="fixed bottom-4 right-4 z-50"
              style={{
                position: 'fixed',
                right: 16,
                bottom: 16,
                zIndex: 2147483647,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 9999,
                backgroundColor: '#2563EB',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.55)',
                fontFamily:
                  '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard Admin</span>
            </button>,
            document.body
          )}
      </AdminDataContext.Provider>
    );
  }

  if (typeof document === 'undefined') {
    return (
      <AdminDataContext.Provider value={adminDataContextValue}>
        {children}
      </AdminDataContext.Provider>
    );
  }

  // ==========================================================================
  // RENDER 2: PIN AUTHENTICATION MODAL
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <AdminDataContext.Provider value={adminDataContextValue}>
        {children}
        {createPortal(
          <div
            className="starla-saas-admin items-center justify-center p-4"
            data-testid="admin-pin-gate"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full"
              style={{ maxWidth: 420 }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Lock size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Dashboard Admin Starla Budaya
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan PIN Keamanan Admin untuk mengelola materi, 360° budaya, gim, dan evaluasi (Default: {customPin})
                </p>
              </div>

              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    verifyAdminPin(pinInput, customPin) ||
                    verifyAdminPin(pinInput)
                  ) {
                    setIsAuthenticated(true);
                    setPinError(null);
                    setPinInput('');
                  } else {
                    setPinError('PIN Admin tidak sesuai. Silakan coba lagi.');
                  }
                }}
              >
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    PIN Keamanan Admin
                  </label>
                  <input
                    type="password"
                    data-testid="admin-pin-input"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Masukkan PIN (contoh: 123456)"
                    autoFocus
                    className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900"
                  />
                  {pinError && (
                    <p
                      className="text-xs font-semibold text-rose-600 mt-1.5"
                      data-testid="admin-pin-error"
                    >
                      {pinError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    data-testid="admin-pin-cancel"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Kembali ke Publik
                  </button>
                  <button
                    type="submit"
                    data-testid="admin-pin-submit"
                    className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-md border"
                    style={{ borderColor: '#2563EB' }}
                  >
                    Buka Dashboard
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </AdminDataContext.Provider>
    );
  }

  // ==========================================================================
  // RENDER 3: MAIN MODERN SAAS ADMIN DASHBOARD
  // ==========================================================================
  const showTableActionBar =
    activeTab !== 'desain' && activeTab !== 'pengaturan';

  const renderPaginationBar = () => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    const visiblePages = pages.slice(
      Math.max(0, safePage - 2),
      Math.min(totalPages, safePage + 2)
    );

    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-white border-t border-slate-100"
        data-testid="table-pagination-bar"
      >
        <span className="text-xs font-medium text-slate-500">
          Menampilkan{' '}
          <strong className="text-slate-800">
            {totalItemsForActiveTab === 0 ? 0 : startIdx + 1}–
            {Math.min(endIdx, totalItemsForActiveTab)}
          </strong>{' '}
          dari <strong className="text-slate-800">{totalItemsForActiveTab}</strong> data
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="pagination-prev-btn"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          {visiblePages.map((p) => {
            const active = p === safePage;
            return (
              <button
                key={p}
                type="button"
                data-testid={`pagination-page-${String(p).padStart(2, '0')}`}
                onClick={() => setCurrentPage(p)}
                className={
                  active
                    ? 'px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold shadow-sm'
                    : 'px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50'
                }
                style={active ? { border: '1px solid #2563EB' } : undefined}
              >
                {String(p).padStart(2, '0')}
              </button>
            );
          })}

          <button
            type="button"
            data-testid="pagination-next-btn"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminDataContext.Provider value={adminDataContextValue}>
      {children}
      {createPortal(
        <div className="starla-saas-admin" data-testid="starla-admin-dashboard">
          {/* ============================================================== */}
          {/* LEFT SIDEBAR (w-64, White, Active bg-[#2563EB] text-white)     */}
          {/* ============================================================== */}
          <aside
            className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0"
            data-testid="admin-sidebar"
          >
            <div className="p-5">
              {/* Brand Logo */}
              <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-extrabold text-lg shadow-md">
                  ★
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-extrabold text-slate-900 truncate">
                    STARLA BUDAYA
                  </h1>
                  <p className="text-xs font-medium text-slate-500 truncate">
                    SaaS Admin Console
                  </p>
                </div>
              </div>

              {/* 8 Functional Navigation Items */}
              <nav className="mt-5 space-y-1.5" aria-label="Menu Utama Admin">
                {sidebarMenus.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`sidebar-tab-${item.id}`}
                      onClick={() => setActiveTab(item.id)}
                      className={
                        isActive
                          ? 'w-full flex items-center justify-between px-4 py-2.5 bg-[#2563EB] bg-blue-600 text-white rounded-xl shadow-md text-sm font-semibold transition-all'
                          : 'w-full flex items-center justify-between px-4 py-2.5 bg-white text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-all'
                      }
                      style={{ border: 'none' }}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      {item.badge && (
                        <span
                          className={
                            isActive
                              ? 'px-2 py-0.5 rounded-full text-xs font-bold bg-white text-blue-600'
                              : 'px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600'
                          }
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Footer: Storage Indicator & Kembali ke Publik (Log out) */}
            <div className="p-4 border-t border-slate-100 space-y-3">
              <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-700">
                    Penyimpanan
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-600 uppercase">
                  {storageSource}
                </span>
              </div>

              <button
                type="button"
                data-testid="close-admin-dashboard-btn"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
              >
                <LogOut size={15} />
                <span>Kembali ke Publik (Log out)</span>
              </button>
            </div>
          </aside>

          {/* ============================================================== */}
          {/* MAIN WORKSPACE (bg-[#F4F7FE])                                  */}
          {/* ============================================================== */}
          <div className="flex-1 flex flex-col bg-[#F4F7FE] min-w-0 overflow-hidden">
            {/* TOP BAR: Capsule Search, Messages/Notifications & Admin Profile */}
            <header
              className="px-6 py-4 bg-[#F4F7FE] border-b border-slate-200 flex items-center justify-between gap-4 shrink-0"
              data-testid="admin-topbar"
            >
              {/* Capsule White Search Input */}
              <div
                className="flex items-center gap-2.5 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 w-full"
                style={{ maxWidth: 420 }}
              >
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  data-testid="admin-global-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-white text-sm text-slate-800"
                  style={{ border: 'none' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-slate-700"
                    style={{ border: 'none', background: 'transparent' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Right Top Bar: Toast, Cloud Sync, Messages/Notifications & Admin Profile */}
              <div className="flex items-center gap-2.5">
                {toastMessage && (
                  <div
                    className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    data-testid="admin-toast"
                  >
                    <CheckCircle2 size={14} />
                    <span>{toastMessage}</span>
                  </div>
                )}

                <button
                  type="button"
                  data-testid="topbar-save-cloud-btn"
                  disabled={isSyncing}
                  onClick={async () => {
                    const res = await saveContentToCloud();
                    showToast(
                      res.source === 'supabase'
                        ? 'Tersimpan ke Supabase Cloud!'
                        : 'Tersimpan di LocalStorage browser!'
                    );
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-sm"
                >
                  <CloudUpload size={15} className="text-blue-600" />
                  <span>{isSyncing ? 'Menyimpan...' : 'Simpan Cloud'}</span>
                </button>

                <button
                  type="button"
                  title="Pesan"
                  onClick={() => showToast('Tidak ada pesan baru')}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm"
                >
                  <MessageSquare size={16} />
                </button>

                <button
                  type="button"
                  title="Notifikasi"
                  onClick={() => showToast('Semua modul budaya tersinkronisasi 100%')}
                  className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shadow-sm"
                >
                  <Bell size={16} />
                </button>

                <div className="flex items-center gap-2.5 bg-white rounded-full px-3.5 py-1.5 shadow-sm border border-slate-200">
                  <img
                    src="mobile/6EfvCxuLoY5.png"
                    alt="Profil Admin"
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900">
                      Administrator
                    </div>
                    <div className="text-xs text-slate-500">Starla Budaya</div>
                  </div>
                </div>
              </div>
            </header>

            {/* SCROLLABLE CONTENT AREA */}
            <main className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Large Page Title Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    className="text-2xl font-extrabold text-slate-900"
                    data-testid="admin-page-title"
                  >
                    {currentMenuMeta.pageTitle}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola seluruh konten interaktif Starla Budaya secara real-time tanpa mengubah tampilan publik
                  </p>
                </div>
              </div>

              {/* ========================================================== */}
              {/* KPI SUMMARY CARDS & QUICK ACCESS (SHOWN ON DASHBOARD TAB)  */}
              {/* ========================================================== */}
              {activeTab === 'dashboard' && (
                <>
                  <div
                    className="grid grid-cols-4 gap-4"
                    data-testid="dashboard-kpi-grid"
                  >
                    <div
                      onClick={() => setActiveTab('materi')}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Total Bab & Slide Budaya
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                          {content.slideOrder.length} Slide
                        </h3>
                        <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-emerald-600">
                          <span>Buka Materi</span>
                          <ArrowUpRight size={12} />
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <BookOpen size={22} />
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveTab('tur360')}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Lokasi 360° & Misi Gim
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                          {tours360.length + allGameMissions.length} Modul
                        </h3>
                        <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-purple-600">
                          <span>
                            {tours360.length} Tur 360° · {allGameMissions.length} Gim
                          </span>
                          <ArrowUpRight size={12} />
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Compass size={22} />
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveTab('kuis')}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Bank Soal Kuis & Evaluasi
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                          {content.quizzes.kuisBudaya.questions.length} Soal
                        </h3>
                        <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-blue-600">
                          <span>Kelola Kuis</span>
                          <ArrowUpRight size={12} />
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ClipboardCheck size={22} />
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveTab('pengguna')}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Murid & Pengguna Aktif
                        </p>
                        <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                          {users.length} Akun
                        </h3>
                        <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-amber-600">
                          <span>Rata-rata Skor 91.5</span>
                          <ArrowUpRight size={12} />
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Award size={22} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ========================================================== */}
              {/* ACTION BAR: Showing 10, Filter, Export, + Add New          */}
              {/* ========================================================== */}
              {showTableActionBar && (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200"
                  data-testid="admin-action-bar"
                >
                  <div className="flex items-center gap-3">
                    <select
                      aria-label="Showing rows per page"
                      data-testid="showing-select"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700"
                    >
                      <option value={10}>Showing 10</option>
                      <option value={25}>Showing 25</option>
                      <option value={50}>Showing 50</option>
                    </select>

                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white">
                      <Filter size={14} className="text-slate-500" />
                      <select
                        aria-label="Filter Status"
                        data-testid="status-filter-select"
                        value={statusFilter}
                        onChange={(e) =>
                          setStatusFilter(
                            e.target.value as 'ALL' | PastelBadgeStatus
                          )
                        }
                        className="bg-white text-xs font-semibold text-slate-700"
                        style={{ border: 'none' }}
                      >
                        <option value="ALL">Filter: Semua Status</option>
                        <option value="Active">Status: Active</option>
                        <option value="Pending">Status: Pending</option>
                        <option value="Inactive">Status: Inactive</option>
                        <option value="On Sale">Status: On Sale</option>
                        <option value="Bouncing">Status: Bouncing</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      data-testid="action-export-btn"
                      onClick={handleExportData}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
                    >
                      <Download size={15} />
                      <span>Export</span>
                    </button>

                    <button
                      type="button"
                      data-testid="action-add-new-btn"
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                      style={{ border: '1px solid #2563EB' }}
                    >
                      <Plus size={16} />
                      <span>+ Add New</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* TAB 1: DASHBOARD (TABEL AKTIVITAS BELAJAR TERBARU)         */}
              {/* ========================================================== */}
              {activeTab === 'dashboard' && (
                <div
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                  data-testid="table-card-dashboard"
                >
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Aktivitas Belajar Terbaru
                      </h3>
                      <p className="text-xs text-slate-500">
                        Rekapitulasi interaksi murid pada materi budaya, tur 360°, gim, dan evaluasi kuis
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Avatar & Judul</th>
                          <th>Kode ID</th>
                          <th>Metrik</th>
                          <th>Kategori</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredActivities
                          .slice(startIdx, endIdx)
                          .map((act) => (
                            <tr key={act.id}>
                              <td>
                                <div className="flex items-center gap-3">
                                  <img
                                    src={act.avatarUrl}
                                    alt={act.studentName}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                  />
                                  <div>
                                    <div className="font-bold text-slate-900">
                                      {act.studentName}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {act.moduleTitle} · {act.timeAgo}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="font-bold text-slate-700">
                                  {act.id}
                                </span>
                              </td>
                              <td>
                                <span className="font-semibold text-slate-700">
                                  {act.metric}
                                </span>
                              </td>
                              <td>
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                  {act.category}
                                </span>
                              </td>
                              <td>
                                <PastelStatusBadge status={act.status} />
                              </td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    title="Edit Aktivitas"
                                    onClick={() => openEditModalForActivity(act)}
                                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Hapus Aktivitas"
                                    onClick={() => {
                                      setActivities((prev) =>
                                        prev.filter((a) => a.id !== act.id)
                                      );
                                      showToast(`Aktivitas ${act.id} dihapus`);
                                    }}
                                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-600"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPaginationBar()}
                </div>
              )}

              {/* ========================================================== */}
              {/* TAB 2: MATERI BUDAYA (CRUD PER BAB / SLIDE)                */}
              {/* ========================================================== */}
              {activeTab === 'materi' && (
                <div
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                  data-testid="table-card-materi"
                >
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Avatar & Judul Materi</th>
                          <th>Kode ID</th>
                          <th>Metrik Aset</th>
                          <th>Kategori</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materiRows.slice(startIdx, endIdx).map((row) => (
                          <tr key={row.slideId}>
                            <td>
                              <div className="flex items-center gap-3">
                                <img
                                  src={row.thumbUrl}
                                  alt={row.readableTitle}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                                <div style={{ maxWidth: 320 }}>
                                  <div className="font-bold text-slate-900 truncate">
                                    {row.readableTitle}
                                  </div>
                                  <div className="text-xs text-slate-500 truncate">
                                    {row.subtitle}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="font-bold text-slate-700">
                                {row.formattedId}
                              </span>
                              <div className="text-xs text-slate-400">
                                {row.slideId}
                              </div>
                            </td>
                            <td>
                              <div className="font-semibold text-slate-700">
                                {row.metric}
                              </div>
                              {row.audioUrl && (
                                <button
                                  type="button"
                                  onClick={() => togglePlayAudio(row.audioUrl)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 mt-0.5"
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    padding: 0,
                                  }}
                                >
                                  <Volume2 size={12} />
                                  <span>
                                    {playingAudioUrl === row.audioUrl
                                      ? 'Stop Audio'
                                      : 'Putar Audio'}
                                  </span>
                                </button>
                              )}
                            </td>
                            <td>
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                {row.category}
                              </span>
                            </td>
                            <td>
                              <PastelStatusBadge status={row.status} />
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  title="Edit Materi Slide"
                                  data-testid={`edit-slide-${row.idx}`}
                                  onClick={() =>
                                    openEditModalForSlide(row.rawSlide, row.idx)
                                  }
                                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Buka di Desain Slide"
                                  onClick={() => {
                                    handleSelectDesignSlide(row.idx);
                                    setActiveTab('desain');
                                  }}
                                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-blue-600"
                                >
                                  <MonitorPlay size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Duplikat Slide"
                                  onClick={() => {
                                    const { nextSchema } = duplicateSlideItem(
                                      content,
                                      row.slideId
                                    );
                                    updateContent(nextSchema);
                                    showToast(
                                      `Slide ${row.formattedId} diduplikasi`
                                    );
                                  }}
                                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                                >
                                  <Copy size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Hapus / Nonaktifkan Slide"
                                  onClick={() => {
                                    if (
                                      row.slideId.startsWith('custom_slide_')
                                    ) {
                                      updateContent(
                                        deleteSlideItem(content, row.slideId)
                                      );
                                      showToast(
                                        `Slide ${row.formattedId} dihapus`
                                      );
                                    } else {
                                      updateContent(
                                        toggleSlideVisibility(
                                          content,
                                          row.slideId
                                        )
                                      );
                                      showToast(
                                        `Visibilitas ${row.formattedId} diperbarui`
                                      );
                                    }
                                  }}
                                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPaginationBar()}
                </div>
              )}

              {/* ========================================================== */}
              {/* TAB 3: 360° BUDAYA (LOKASI TUR VIRTUAL, PANORAMA, HOTSPOT) */}
              {/* ========================================================== */}
              {activeTab === 'tur360' && (
                <div
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                  data-testid="table-card-tur360"
                >
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Avatar & Lokasi 360°</th>
                          <th>Kode ID</th>
                          <th>Metrik Hotspot</th>
                          <th>Kategori Daerah</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTours360.slice(startIdx, endIdx).map((tour) => (
                          <tr key={tour.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <img
                                  src={tour.panoramaUrl}
                                  alt={tour.title}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-slate-900">
                                    {tour.title}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    Provinsi {tour.province}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="font-bold text-slate-700">
                                {tour.id}
                              </span>
                            </td>
                            <td>
                              <div className="font-semibold text-slate-800">
                                {tour.hotspots.length} Titik Hotspot
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  togglePlayAudio(tour.audioGuideUrl)
                                }
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 mt-0.5"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  padding: 0,
                                }}
                              >
                                <Volume2 size={12} />
                                <span>
                                  {playingAudioUrl === tour.audioGuideUrl
                                    ? 'Stop Pemandu'
                                    : 'Audio Pemandu'}
                                </span>
                              </button>
                            </td>
                            <td>
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                {tour.category}
                              </span>
                            </td>
                            <td>
                              <PastelStatusBadge status={tour.status} />
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  title="Edit Lokasi 360°"
                                  onClick={() => openEditModalForTour360(tour)}
                                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Hapus Lokasi"
                                  onClick={() => {
                                    setTours360((prev) =>
                                      prev.filter((t) => t.id !== tour.id)
                                    );
                                    showToast(`Lokasi ${tour.id} dihapus`);
                                  }}
                                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPaginationBar()}
                </div>
              )}

              {/* ========================================================== */}
              {/* TAB 4: GIM EDUKASI (MISI GIM INTERAKTIF, LEVEL & POIN)     */}
              {/* ========================================================== */}
              {activeTab === 'gim' && (
                <div
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                  data-testid="table-card-gim"
                >
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Avatar & Judul Misi Gim</th>
                          <th>Kode ID</th>
                          <th>Metrik Level & Skor</th>
                          <th>Kategori Gim</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGames.slice(startIdx, endIdx).map((gim) => (
                          <tr key={gim.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <img
                                  src={gim.iconUrl}
                                  alt={gim.title}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                                <div style={{ maxWidth: 340 }}>
                                  <div className="font-bold text-slate-900">
                                    {gim.title}
                                  </div>
                                  <div className="text-xs text-slate-500 truncate">
                                    {gim.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="font-bold text-slate-700">
                                {gim.id}
                              </span>
                            </td>
                            <td>
                              <div className="font-bold text-slate-800">
                                +{gim.points} Poin Garuda
                              </div>
                              <div className="text-xs text-slate-500">
                                {gim.level}
                              </div>
                            </td>
                            <td>
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-blue-700">
                                {gim.gameType}
                              </span>
                            </td>
                            <td>
                              <PastelStatusBadge status={gim.status} />
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  title="Edit Misi Gim"
                                  onClick={() => openEditModalForGame(gim)}
                                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Hapus Misi Gim"
                                  onClick={() => {
                                    if (gim.linkedStatementId) {
                                      const nextSchema =
                                        removeDragDropStatement(
                                          content,
                                          gim.linkedStatementId
                                        );
                                      updateContent(nextSchema);
                                    } else {
                                      setExtraGames((prev) =>
                                        prev.filter((g) => g.id !== gim.id)
                                      );
                                    }
                                    showToast(`Misi ${gim.id} dihapus`);
                                  }}
                                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPaginationBar()}
                </div>
              )}

              {/* ========================================================== */}
              {/* TAB 5: KUIS & EVALUASI (SOAL, PILIHAN, KUNCI & POIN)       */}
              {/* ========================================================== */}
              {activeTab === 'kuis' && (
                <div
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                  data-testid="table-card-kuis"
                >
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Avatar & Pertanyaan Kuis</th>
                          <th>Kode ID</th>
                          <th>Metrik Opsi & Poin</th>
                          <th>Kategori</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuizQuestions
                          .slice(startIdx, endIdx)
                          .map(({ q, idx, status, formattedId }) => (
                            <tr key={q.slideId}>
                              <td>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-extrabold text-sm flex items-center justify-center border border-blue-200 shrink-0">
                                    Q{idx + 1}
                                  </div>
                                  <div style={{ maxWidth: 360 }}>
                                    <div className="font-bold text-slate-900">
                                      {q.questionText}
                                    </div>
                                    <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                                      ✓ Kunci: {q.correctAnswerText || '-'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="font-bold text-slate-700">
                                  {formattedId}
                                </span>
                                <div className="text-xs text-slate-400">
                                  {q.slideId}
                                </div>
                              </td>
                              <td>
                                <div className="font-bold text-slate-800">
                                  {q.choices.length} Opsi · {q.maxPoints || 10}{' '}
                                  Poin
                                </div>
                                <div className="text-xs text-slate-500">
                                  KKM {content.quizzes.kuisBudaya.passPercent}%
                                </div>
                              </td>
                              <td>
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                  Pilihan Ganda
                                </span>
                              </td>
                              <td>
                                <PastelStatusBadge status={status} />
                              </td>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    title="Edit Soal Kuis"
                                    data-testid={`edit-quiz-${idx}`}
                                    onClick={() => openEditModalForQuiz(q)}
                                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    title="Hapus / Nonaktifkan Soal"
                                    onClick={() => {
                                      if (
                                        q.slideId.startsWith('custom_quiz_')
                                      ) {
                                        updateContent(
                                          deleteQuizQuestionItem(
                                            content,
                                            q.slideId
                                          )
                                        );
                                        showToast(`Soal ${formattedId} dihapus`);
                                      } else {
                                        updateContent(
                                          toggleQuizQuestionVisibility(
                                            content,
                                            q.slideId
                                          )
                                        );
                                        showToast(
                                          `Status soal ${formattedId} diperbarui`
                                        );
                                      }
                                    }}
                                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-600"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPaginationBar()}
                </div>
              )}

              {/* ========================================================== */}
              {/* TAB 6: DESAIN SLIDE (KANVAS 16:9 DI KIRI & FORM DI KANAN)  */}
              {/* ========================================================== */}
              {activeTab === 'desain' && activeDesignSlide && (
                <div className="space-y-4" data-testid="tab-desain-slide">
                  {/* Top Control Bar of Desain Slide */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={designSlideIdx <= 0}
                        onClick={() =>
                          handleSelectDesignSlide(designSlideIdx - 1)
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
                      >
                        ◀ Sebelumnya
                      </button>

                      <select
                        aria-label="Pilih Slide untuk Didesain"
                        data-testid="desain-slide-select"
                        value={designSlideIdx}
                        onChange={(e) =>
                          handleSelectDesignSlide(Number(e.target.value))
                        }
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                      >
                        {content.slideOrder.map((sid, idx) => {
                          const s = content.slides[sid];
                          if (!s) return null;
                          return (
                            <option key={sid} value={idx}>
                              Slide {idx + 1}/{content.slideOrder.length} —{' '}
                              {resolveReadableSlideTitle(s, idx)}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="button"
                        disabled={
                          designSlideIdx >= content.slideOrder.length - 1
                        }
                        onClick={() =>
                          handleSelectDesignSlide(designSlideIdx + 1)
                        }
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
                      >
                        Selanjutnya ▶
                      </button>
                    </div>

                    {/* Quick Add Element Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="desain-add-text-btn"
                        onClick={() => handleAddSimpleCanvasElement('text')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
                      >
                        <Type size={14} className="text-blue-600" />
                        <span>+ Teks</span>
                      </button>
                      <button
                        type="button"
                        data-testid="desain-add-button-btn"
                        onClick={() =>
                          handleAddSimpleCanvasElement('image-button')
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                        style={{ border: '1px solid #2563EB' }}
                      >
                        <MousePointerClick size={14} />
                        <span>+ Tombol Interaktif</span>
                      </button>
                      <button
                        type="button"
                        data-testid="desain-add-image-btn"
                        onClick={() => handleAddSimpleCanvasElement('image')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
                      >
                        <ImageIcon size={14} className="text-purple-600" />
                        <span>+ Gambar</span>
                      </button>
                      <button
                        type="button"
                        data-testid="desain-add-audio-btn"
                        onClick={() =>
                          handleAddSimpleCanvasElement('audio-button')
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
                      >
                        <Volume2 size={14} className="text-emerald-600" />
                        <span>+ Audio</span>
                      </button>
                    </div>
                  </div>

                  {/* Left 16:9 Live Preview Canvas + Right Property Form */}
                  <div className="flex gap-5 items-start">
                    {/* Left: 16:9 Interactive Slide Stage */}
                    <div className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Layers size={16} className="text-blue-600" />
                          <span className="text-sm font-bold text-slate-900">
                            Kanvas 16:9 Slide #{designSlideIdx + 1}:{' '}
                            {resolveReadableSlideTitle(
                              activeDesignSlide,
                              designSlideIdx
                            )}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                          Klik & geser (drag) elemen di atas kanvas
                        </span>
                      </div>

                      <div
                        ref={designStageRef}
                        data-testid="desain-slide-canvas"
                        onClick={() => setSelectedCanvasElId(null)}
                        style={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '16 / 9',
                          borderRadius: 16,
                          overflow: 'hidden',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#f8fafc',
                          backgroundImage: activeDesignSlide.backgroundUrl
                            ? `url(${activeDesignSlide.backgroundUrl})`
                            : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {/* Native Slide Preview Content */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: 18,
                            pointerEvents: 'none',
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 12,
                              overflow: 'hidden',
                            }}
                          >
                            {(activeDesignSlide.images || [])
                              .slice(0, 4)
                              .map((img, i) => (
                                <img
                                  key={img.objectId || i}
                                  src={img.url}
                                  alt={img.altText || `Aset ${i + 1}`}
                                  style={{
                                    maxWidth: i === 0 ? '75%' : '28%',
                                    maxHeight: i === 0 ? '68%' : '32%',
                                    objectFit: 'contain',
                                    borderRadius: 10,
                                  }}
                                />
                              ))}
                          </div>

                          <div
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.92)',
                              padding: '10px 14px',
                              borderRadius: 12,
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 800,
                                color: '#0f172a',
                              }}
                            >
                              {resolveReadableSlideTitle(
                                activeDesignSlide,
                                designSlideIdx
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#475569',
                                marginTop: 2,
                              }}
                            >
                              {activeDesignSlide.instructions?.[0] ||
                                activeDesignSlide.texts?.[0]?.lines?.join(' ') ||
                                'Tampilan asli slide publik terjaga 100% tanpa regresi.'}
                            </div>
                          </div>
                        </div>

                        {/* Draggable Custom Elements Layer */}
                        {activeDesignElements.map((el) => {
                          if (el.hidden) return null;
                          const isSel = el.id === selectedCanvasElId;
                          return (
                            <div
                              key={el.id}
                              data-testid={`desain-canvas-el-${el.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCanvasElId(el.id);
                              }}
                              onPointerDown={(e) =>
                                handleCanvasElementPointerDown(e, el)
                              }
                              style={{
                                position: 'absolute',
                                left: `${el.x}%`,
                                top: `${el.y}%`,
                                width: `${el.width}%`,
                                height: `${el.height}%`,
                                zIndex: el.zIndex || 20,
                                cursor: 'move',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                padding: '6px 10px',
                                backgroundColor:
                                  el.style?.backgroundColor || '#2563EB',
                                color: el.style?.textColor || '#ffffff',
                                fontSize: el.style?.fontSize || 13,
                                fontWeight: 700,
                                borderRadius: el.style?.borderRadius ?? 10,
                                outline: isSel
                                  ? '3px solid #2563EB'
                                  : '1px dashed rgba(37, 99, 235, 0.5)',
                                outlineOffset: 2,
                                boxShadow: '0 6px 16px rgba(15, 23, 42, 0.18)',
                                userSelect: 'none',
                              }}
                            >
                              {el.imageUrl && (
                                <img
                                  src={el.imageUrl}
                                  alt={el.label || 'Elemen'}
                                  draggable={false}
                                  style={{
                                    width: el.type === 'image' ? '100%' : 22,
                                    height: el.type === 'image' ? '100%' : 22,
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                  }}
                                />
                              )}
                              {el.type !== 'image' && (
                                <span className="truncate">{el.label}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Property Form (w-80) */}
                    <div className="w-80 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4 shrink-0">
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                        {selectedCanvasElement
                          ? 'Form Edit Elemen Slide'
                          : 'Pengaturan Slide & Layer'}
                      </h3>

                      {!selectedCanvasElement ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-600">
                              Judul Slide Aktif
                            </label>
                            <input
                              type="text"
                              value={activeDesignSlide.title}
                              onChange={(e) =>
                                updateSlideContent(activeDesignSlideId, {
                                  title: e.target.value,
                                })
                              }
                              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900"
                            />
                          </div>

                          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <Move size={14} />
                              <span>Panduan Desain Slide:</span>
                            </div>
                            <p>
                              1. Gunakan tombol <strong>+ Teks</strong> atau{' '}
                              <strong>+ Tombol Interaktif</strong> di atas.
                            </p>
                            <p>
                              2. Geser posisi elemen di kanvas 16:9 sebelah kiri.
                            </p>
                            <p>
                              3. Klik elemen untuk mengedit teks, warna, aksi, atau menghapusnya.
                            </p>
                          </div>

                          {activeDesignElements.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-xs font-bold text-slate-700">
                                Daftar Elemen Overlay ({activeDesignElements.length})
                              </div>
                              {activeDesignElements.map((el) => (
                                <div
                                  key={el.id}
                                  onClick={() => setSelectedCanvasElId(el.id)}
                                  className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-800"
                                >
                                  <span className="truncate">
                                    {el.label || el.type}
                                  </span>
                                  <span className="text-blue-600">Edit →</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-600">
                              Label / Teks Elemen
                            </label>
                            <input
                              type="text"
                              data-testid="desain-el-label-input"
                              value={selectedCanvasElement.label || ''}
                              onChange={(e) =>
                                updateCanvasElement(
                                  activeDesignSlideId,
                                  selectedCanvasElement.id,
                                  { label: e.target.value }
                                )
                              }
                              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-slate-600">
                                Posisi X (%)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={96}
                                value={selectedCanvasElement.x}
                                onChange={(e) =>
                                  updateCanvasElement(
                                    activeDesignSlideId,
                                    selectedCanvasElement.id,
                                    { x: Number(e.target.value) }
                                  )
                                }
                                className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-600">
                                Posisi Y (%)
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={96}
                                value={selectedCanvasElement.y}
                                onChange={(e) =>
                                  updateCanvasElement(
                                    activeDesignSlideId,
                                    selectedCanvasElement.id,
                                    { y: Number(e.target.value) }
                                  )
                                }
                                className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-600">
                                Lebar (%)
                              </label>
                              <input
                                type="number"
                                min={4}
                                max={100}
                                value={selectedCanvasElement.width}
                                onChange={(e) =>
                                  updateCanvasElement(
                                    activeDesignSlideId,
                                    selectedCanvasElement.id,
                                    { width: Number(e.target.value) }
                                  )
                                }
                                className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-600">
                                Tinggi (%)
                              </label>
                              <input
                                type="number"
                                min={4}
                                max={100}
                                value={selectedCanvasElement.height}
                                onChange={(e) =>
                                  updateCanvasElement(
                                    activeDesignSlideId,
                                    selectedCanvasElement.id,
                                    { height: Number(e.target.value) }
                                  )
                                }
                                className="w-full mt-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-slate-600">
                                Warna Latar
                              </label>
                              <input
                                type="color"
                                value={
                                  selectedCanvasElement.style
                                    ?.backgroundColor || '#2563EB'
                                }
                                onChange={(e) =>
                                  updateCanvasElement(
                                    activeDesignSlideId,
                                    selectedCanvasElement.id,
                                    {
                                      style: {
                                        ...selectedCanvasElement.style,
                                        backgroundColor: e.target.value,
                                      },
                                    }
                                  )
                                }
                                className="w-full mt-1 h-8 rounded-lg border border-slate-200 cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-600">
                                Warna Teks
                              </label>
                              <input
                                type="color"
                                value={
                                  selectedCanvasElement.style?.textColor ||
                                  '#ffffff'
                                }
                                onChange={(e) =>
                                  updateCanvasElement(
                                    activeDesignSlideId,
                                    selectedCanvasElement.id,
                                    {
                                      style: {
                                        ...selectedCanvasElement.style,
                                        textColor: e.target.value,
                                      },
                                    }
                                  )
                                }
                                className="w-full mt-1 h-8 rounded-lg border border-slate-200 cursor-pointer"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-600">
                              Aksi Saat Diklik
                            </label>
                            <select
                              value={
                                selectedCanvasElement.action?.type || 'none'
                              }
                              onChange={(e) =>
                                updateCanvasElement(
                                  activeDesignSlideId,
                                  selectedCanvasElement.id,
                                  {
                                    action: {
                                      ...selectedCanvasElement.action,
                                      type: e.target.value as CanvasActionType,
                                    },
                                  }
                                )
                              }
                              className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                            >
                              <option value="none">Tidak Ada Aksi</option>
                              <option value="open-popup">
                                Buka Pop-up Materi
                              </option>
                              <option value="goto-slide">
                                Pindah ke Slide
                              </option>
                              <option value="play-audio">
                                Putar Suara / Audio
                              </option>
                              <option value="external-url">
                                Buka Tautan URL
                              </option>
                            </select>
                          </div>

                          {selectedCanvasElement.action?.type ===
                            'open-popup' && (
                            <div>
                              <label className="text-xs font-semibold text-slate-600">
                                Isi Materi Pop-up
                              </label>
                              <textarea
                                rows={2}
                                value={
                                  selectedCanvasElement.action?.popupContent ||
                                  ''
                                }
                                onChange={(e) =>
                                  updateCanvasElement(
                                    activeDesignSlideId,
                                    selectedCanvasElement.id,
                                    {
                                      action: {
                                        ...selectedCanvasElement.action,
                                        popupContent: e.target.value,
                                      },
                                    }
                                  )
                                }
                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2">
                            <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer">
                              <Upload size={13} />
                              <span>Gambar</span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) =>
                                  handleMediaFileUpload(
                                    e.target.files?.[0],
                                    'canvas-image'
                                  )
                                }
                              />
                            </label>
                            <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer">
                              <Volume2 size={13} />
                              <span>Audio</span>
                              <input
                                type="file"
                                accept="audio/*"
                                style={{ display: 'none' }}
                                onChange={(e) =>
                                  handleMediaFileUpload(
                                    e.target.files?.[0],
                                    'canvas-audio'
                                  )
                                }
                              />
                            </label>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setSelectedCanvasElId(null)}
                              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600"
                            >
                              Selesai Pilih
                            </button>
                            <button
                              type="button"
                              data-testid="desain-delete-el-btn"
                              onClick={() => {
                                deleteCanvasElement(
                                  activeDesignSlideId,
                                  selectedCanvasElement.id
                                );
                                setSelectedCanvasElId(null);
                                showToast('Elemen dihapus dari slide');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold"
                            >
                              <Trash2 size={13} />
                              <span>Hapus Elemen</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* TAB 7: PENGGUNA (DATA MURID / GURU, PROGRES & SKOR)        */}
              {/* ========================================================== */}
              {activeTab === 'pengguna' && (
                <div
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                  data-testid="table-card-pengguna"
                >
                  <div className="overflow-x-auto">
                    <table>
                      <thead>
                        <tr>
                          <th>Avatar & Nama Pengguna</th>
                          <th>Kode ID</th>
                          <th>Metrik Progres & Skor</th>
                          <th>Kategori Peran</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.slice(startIdx, endIdx).map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-slate-900">
                                    {u.name}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {u.school}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="font-bold text-slate-700">
                                {u.id}
                              </span>
                            </td>
                            <td>
                              <div className="font-bold text-slate-800">
                                Skor: {u.score}/100
                              </div>
                              <div className="text-xs text-slate-500">
                                Progres: {u.progressPct}% Selesai
                              </div>
                            </td>
                            <td>
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <PastelStatusBadge status={u.status} />
                            </td>
                            <td>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  title="Edit Pengguna"
                                  onClick={() => openEditModalForUser(u)}
                                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  title="Hapus Pengguna"
                                  onClick={() => {
                                    setUsers((prev) =>
                                      prev.filter((item) => item.id !== u.id)
                                    );
                                    showToast(`Pengguna ${u.id} dihapus`);
                                  }}
                                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPaginationBar()}
                </div>
              )}

              {/* ========================================================== */}
              {/* TAB 8: PENGATURAN (EXPORT, IMPORT, RESET, SUPABASE SYNC)   */}
              {/* ========================================================== */}
              {activeTab === 'pengaturan' && (
                <div
                  className="grid grid-cols-2 gap-5"
                  data-testid="tab-pengaturan"
                >
                  {/* Card 1: Export, Import, Reset & Supabase Cloud */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <CloudUpload size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Sinkronisasi Supabase & Backup JSON
                        </h3>
                        <p className="text-xs text-slate-500">
                          Export Backup JSON, Import JSON, Reset Default, dan Sinkronisasi Cloud
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600">
                          Sumber Penyimpanan Aktif:
                        </span>
                        <span className="font-bold text-blue-600 uppercase">
                          {storageSource}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600">
                          Total Slide Terdaftar:
                        </span>
                        <span className="font-bold text-slate-900">
                          {content.slideOrder.length} Slide
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        data-testid="settings-save-cloud-btn"
                        onClick={async () => {
                          const res = await saveContentToCloud();
                          showToast(
                            res.source === 'supabase'
                              ? 'Berhasil disinkronkan ke Supabase Cloud!'
                              : 'Berhasil disimpan ke LocalStorage!'
                          );
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                        style={{ border: '1px solid #2563EB' }}
                      >
                        <CloudUpload size={15} />
                        <span>Sinkronisasi Supabase</span>
                      </button>

                      <button
                        type="button"
                        data-testid="settings-export-json-btn"
                        onClick={handleExportData}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
                      >
                        <Download size={15} />
                        <span>Export Backup JSON</span>
                      </button>

                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer">
                        <FileJson size={15} className="text-blue-600" />
                        <span>Import JSON</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          style={{ display: 'none' }}
                          onChange={(e) =>
                            handleImportJsonFile(e.target.files?.[0])
                          }
                        />
                      </label>

                      <button
                        type="button"
                        data-testid="settings-reset-default-btn"
                        onClick={() => {
                          resetContent();
                          showToast(
                            'Konten dikembalikan ke pengaturan awal (Reset Default)'
                          );
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold"
                      >
                        <RefreshCw size={14} />
                        <span>Reset Default</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Identitas Aplikasi & PIN Admin */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Identitas Aplikasi & PIN Keamanan Admin
                        </h3>
                        <p className="text-xs text-slate-500">
                          Perbarui metadata judul aplikasi serta kode PIN akses dashboard
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Judul Aplikasi Utama
                        </label>
                        <input
                          type="text"
                          data-testid="settings-app-title-input"
                          value={content.appMeta.title}
                          onChange={(e) =>
                            updateContent({
                              ...content,
                              appMeta: {
                                ...content.appMeta,
                                title: e.target.value,
                              },
                            })
                          }
                          className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Deskripsi Meta Aplikasi
                        </label>
                        <textarea
                          rows={2}
                          value={content.appMeta.description}
                          onChange={(e) =>
                            updateContent({
                              ...content,
                              appMeta: {
                                ...content.appMeta,
                                description: e.target.value,
                              },
                            })
                          }
                          className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          PIN Keamanan Admin
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            data-testid="settings-admin-pin-input"
                            value={customPin}
                            onChange={(e) => setCustomPin(e.target.value)}
                            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                typeof window !== 'undefined' &&
                                customPin.trim()
                              ) {
                                localStorage.setItem(
                                  CUSTOM_PIN_STORAGE_KEY,
                                  customPin.trim()
                                );
                                showToast('PIN Admin berhasil diperbarui');
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-[#2563EB] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                            style={{ border: '1px solid #2563EB' }}
                          >
                            Simpan PIN
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* ============================================================== */}
          {/* CRUD MODAL FOR ADDING / EDITING ITEMS ACROSS ALL TABLE TABS    */}
          {/* ============================================================== */}
          {modalMode !== 'closed' && (
            <div
              className="fixed inset-0 flex items-center justify-center p-4"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                zIndex: 2147483647,
              }}
              data-testid="admin-crud-modal"
            >
              <div
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full p-6 space-y-4 overflow-y-auto"
                style={{ maxWidth: 540, maxHeight: '90vh' }}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900">
                    {modalMode === 'create' ? '+ Add New' : 'Edit Data'} —{' '}
                    {currentMenuMeta.label}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalMode('closed')}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form className="space-y-3" onSubmit={handleSaveModal}>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      {activeTab === 'kuis'
                        ? 'Teks Pertanyaan Kuis'
                        : activeTab === 'pengguna'
                          ? 'Nama Lengkap Pengguna'
                          : 'Judul / Nama Item'}
                    </label>
                    <input
                      type="text"
                      required
                      data-testid="crud-modal-title-input"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900"
                    />
                  </div>

                  {activeTab !== 'kuis' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        {activeTab === 'materi'
                          ? 'Narasi / Teks Instruksi Materi'
                          : activeTab === 'tur360'
                            ? 'Provinsi & Narasi Lokasi 360°'
                            : activeTab === 'gim'
                              ? 'Deskripsi / Pernyataan Misi Gim'
                              : activeTab === 'pengguna'
                                ? 'Asal Sekolah / Institusi'
                                : 'Modul / Deskripsi Aktivitas'}
                      </label>
                      <textarea
                        rows={2}
                        data-testid="crud-modal-subtitle-input"
                        value={formSubtitle}
                        onChange={(e) => setFormSubtitle(e.target.value)}
                        className="w-full mt-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800"
                      />
                    </div>
                  )}

                  {(activeTab === 'materi' ||
                    activeTab === 'tur360' ||
                    activeTab === 'dashboard') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Kategori
                        </label>
                        <input
                          type="text"
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Status Badge
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) =>
                            setFormStatus(e.target.value as PastelBadgeStatus)
                          }
                          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                        >
                          <option value="Active">Active (Hijau)</option>
                          <option value="Pending">Pending (Oranye)</option>
                          <option value="Inactive">Inactive (Merah)</option>
                          <option value="On Sale">On Sale (Biru)</option>
                          <option value="Bouncing">Bouncing (Ungu)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tur360' && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Daftar Titik Hotspot (1 per baris, format: Nama | Deskripsi)
                      </label>
                      <textarea
                        rows={3}
                        value={formHotspotsText}
                        onChange={(e) => setFormHotspotsText(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                      />
                    </div>
                  )}

                  {activeTab === 'gim' && (
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Tipe Permainan
                        </label>
                        <select
                          value={formGameType}
                          onChange={(e) =>
                            setFormGameType(
                              e.target.value as GameMissionItem['gameType']
                            )
                          }
                          className="w-full mt-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                        >
                          <option value="Drag & Drop Garuda">
                            Drag & Drop Garuda
                          </option>
                          <option value="Memory Match">Memory Match</option>
                          <option value="Tebak Suara">Tebak Suara</option>
                          <option value="Kuis Cepat">Kuis Cepat</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Level
                        </label>
                        <select
                          value={formLevel}
                          onChange={(e) =>
                            setFormLevel(
                              e.target.value as GameMissionItem['level']
                            )
                          }
                          className="w-full mt-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                        >
                          <option value="Level 1 - Mudah">
                            Level 1 - Mudah
                          </option>
                          <option value="Level 2 - Sedang">
                            Level 2 - Sedang
                          </option>
                          <option value="Level 3 - Sulit">
                            Level 3 - Sulit
                          </option>
                          <option value="Level 4 - Mahir">
                            Level 4 - Mahir
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Skor Poin
                        </label>
                        <input
                          type="number"
                          value={formPoints}
                          onChange={(e) =>
                            setFormPoints(Number(e.target.value))
                          }
                          className="w-full mt-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'kuis' && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Bobot Skor Poin
                          </label>
                          <input
                            type="number"
                            value={formPoints}
                            onChange={(e) =>
                              setFormPoints(Number(e.target.value))
                            }
                            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700">
                            Status Soal
                          </label>
                          <select
                            value={formStatus}
                            onChange={(e) =>
                              setFormStatus(e.target.value as PastelBadgeStatus)
                            }
                            className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                          >
                            <option value="Active">Active</option>
                            <option value="On Sale">On Sale</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="text-xs font-bold text-slate-700">
                          Pilihan Jawaban & Kunci Jawaban Benar:
                        </label>
                        {formQuizChoices.map((ch, cIdx) => (
                          <div key={ch.id} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setFormQuizChoices((prev) =>
                                  prev.map((item, i) => ({
                                    ...item,
                                    isCorrect: i === cIdx,
                                  }))
                                )
                              }
                              className={
                                ch.isCorrect
                                  ? 'px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0'
                                  : 'px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 text-xs font-semibold shrink-0'
                              }
                            >
                              {ch.isCorrect ? '✓ Benar' : `Opsi ${cIdx + 1}`}
                            </button>
                            <input
                              type="text"
                              value={ch.text}
                              onChange={(e) =>
                                setFormQuizChoices((prev) =>
                                  prev.map((item, i) =>
                                    i === cIdx
                                      ? { ...item, text: e.target.value }
                                      : item
                                  )
                                )
                              }
                              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'pengguna' && (
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Peran Akun
                        </label>
                        <select
                          value={formRole}
                          onChange={(e) =>
                            setFormRole(
                              e.target.value as UserAccountItem['role']
                            )
                          }
                          className="w-full mt-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                        >
                          <option value="Murid">Murid</option>
                          <option value="Guru">Guru</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Skor (0-100)
                        </label>
                        <input
                          type="number"
                          value={formPoints}
                          onChange={(e) =>
                            setFormPoints(Number(e.target.value))
                          }
                          className="w-full mt-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Status Akun
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) =>
                            setFormStatus(e.target.value as PastelBadgeStatus)
                          }
                          className="w-full mt-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                        >
                          <option value="Active">Active</option>
                          <option value="On Sale">On Sale</option>
                          <option value="Bouncing">Bouncing</option>
                          <option value="Pending">Pending</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {(activeTab === 'materi' || activeTab === 'tur360') && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          URL Gambar / Panorama
                        </label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="text"
                            value={formImageUrl}
                            onChange={(e) => setFormImageUrl(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                          />
                          <label className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold cursor-pointer">
                            <Upload size={13} />
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) =>
                                handleMediaFileUpload(
                                  e.target.files?.[0],
                                  'image'
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          URL Audio Narasi / Pemandu
                        </label>
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="text"
                            value={formAudioUrl}
                            onChange={(e) => setFormAudioUrl(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                          />
                          <label className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold cursor-pointer">
                            <Volume2 size={13} />
                            <input
                              type="file"
                              accept="audio/*"
                              style={{ display: 'none' }}
                              onChange={(e) =>
                                handleMediaFileUpload(
                                  e.target.files?.[0],
                                  'audio'
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalMode('closed')}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      data-testid="crud-modal-save-btn"
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#2563EB] bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                      style={{ border: '1px solid #2563EB' }}
                    >
                      <Check size={14} />
                      <span>Simpan Data</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </AdminDataContext.Provider>
  );
};

export default AdminDashboard;
