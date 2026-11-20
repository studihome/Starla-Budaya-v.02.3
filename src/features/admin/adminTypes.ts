import type React from 'react';
import type {
  ContentSchema,
  CanvasAnimationType,
} from '../../data/defaultContent';

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
  | 'On Sale'
  | 'Bouncing'
  | 'Unggulan'
  | 'Populer';

export interface Tur360EmbedItem {
  id: string;
  embedUrl: string;
  slideId?: string;
  buttonSlideId?: string;
  buttonElementId?: string;
}

export interface GimCustomItem {
  id: string;
  birdId?: string;
  textObjId?: string;
  commandSetId?: string;
  statementId?: string;
  slideId: string;
  title: string;
  category: string;
  topic: string;
  targetChoice: 'Budaya yang Benar' | 'Budaya yang Salah';
  points: number;
  status: BadgeStatus;
  imageUrl: string;
  audioUrl: string;
  isGarudaBird?: boolean;
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
  adminPin?: string;
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

export interface StagePopupPreviewState {
  title: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'iframe' | 'image' | 'video' | 'audio' | 'none';
  animation?: CanvasAnimationType | string;
}

export interface SmartAdminProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  badge: string;
}

export const SMART_ADMIN_PROFILES: SmartAdminProfile[] = [
  {
    id: 'jane-cooper',
    name: 'Jane Cooper',
    email: 'jane234@example.com',
    role: 'Kurator Budaya Utama',
    avatarUrl: 'mobile/5hv8C0oRfrb.png',
    badge: 'Lead Curator',
  },
  {
    id: 'admin-starla',
    name: 'Admin Starla',
    email: 'admin@starlabudaya.id',
    role: 'Pendidik & Guru Budaya',
    avatarUrl: 'mobile/6EfvCxuLoY5.png',
    badge: 'Educator',
  },
  {
    id: 'studio-creator',
    name: 'Studio Creator',
    email: 'studio@starlabudaya.id',
    role: 'Desainer Slide & 360°',
    avatarUrl: 'mobile/5jk1lv5JqZM.png',
    badge: 'Visual Studio',
  },
];

export const DEFAULT_EXTRA_STATE: AdminExtraState = {
  tur360List: [
    {
      id: '360-01',
      embedUrl: 'https://faryzt.github.io/starla-360/',
      slideId: '5jTlwgcUi8o',
      buttonSlideId: '5iew2M44w24',
    },
  ],
  analyticsList: [
    {
      id: 'STD-101',
      name: 'Putu Ayu Prameswari',
      school: 'SDN 1 Denpasar',
      completedModules: 17,
      quizScore: 100,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/5hv8C0oRfrb.png',
      lastActive: 'Hari ini, 09:40 WITA',
    },
    {
      id: 'STD-102',
      name: 'Bima Arya Pratama',
      school: 'SDN Menteng 01 Jakarta',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Bouncing',
      avatarUrl: 'mobile/5r8KdQdV9SH.png',
      lastActive: 'Hari ini, 08:15 WIB',
    },
    {
      id: 'STD-103',
      name: 'Siti Nurbaya Lubis',
      school: 'SDN 060812 Medan',
      completedModules: 15,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/62oB2J2cBdW.png',
      lastActive: 'Kemarin, 14:20 WIB',
    },
    {
      id: 'STD-104',
      name: 'Fransiskus Yoman',
      school: 'SD Inpres Kotaraja Jayapura',
      completedModules: 14,
      quizScore: 80,
      garudaPoints: 160,
      status: 'Active',
      avatarUrl: 'mobile/5s6NWFwiK9z.png',
      lastActive: 'Kemarin, 11:05 WIT',
    },
    {
      id: 'STD-105',
      name: 'Raden Bagus Satrio',
      school: 'SDN Ungaran 1 Yogyakarta',
      completedModules: 12,
      quizScore: 80,
      garudaPoints: 140,
      status: 'Pending',
      avatarUrl: 'mobile/6Z7ek63QC1F.png',
      lastActive: '2 hari lalu',
    },
  ],
  statusOverrides: {},
  categoryOverrides: {},
};
