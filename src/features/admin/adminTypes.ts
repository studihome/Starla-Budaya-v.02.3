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

export interface SixMonthTrendPoint {
  month: string;
  shortMonth: string;
  activeUsers: number;
  quizCompletions: number;
  gameCompletions: number;
  tour360Views: number;
  avgQuizScore: number;
}

export interface SixMonthOperationalSummary {
  totalRegisteredUsers: number;
  activeMonthlyUsers: number;
  partnerSchoolsCount: number;
  totalLearningSessions: number;
  completedQuizSessions: number;
  completedGarudaSessions: number;
  operationalMonths: number;
  periodLabel: string;
  satisfactionRatePct: number;
}

export const SIX_MONTH_OPERATIONAL_SUMMARY: SixMonthOperationalSummary = {
  totalRegisteredUsers: 1548,
  activeMonthlyUsers: 1284,
  partnerSchoolsCount: 64,
  totalLearningSessions: 14820,
  completedQuizSessions: 1396,
  completedGarudaSessions: 1425,
  operationalMonths: 6,
  periodLabel: '6 Bulan Operasional (Mei – Oktober)',
  satisfactionRatePct: 98.4,
};

export const SIX_MONTH_TREND_DATA: SixMonthTrendPoint[] = [
  {
    month: 'Mei (Bulan 1)',
    shortMonth: 'Mei',
    activeUsers: 245,
    quizCompletions: 198,
    gameCompletions: 210,
    tour360Views: 412,
    avgQuizScore: 81,
  },
  {
    month: 'Juni (Bulan 2)',
    shortMonth: 'Jun',
    activeUsers: 468,
    quizCompletions: 392,
    gameCompletions: 415,
    tour360Views: 845,
    avgQuizScore: 84,
  },
  {
    month: 'Juli (Bulan 3)',
    shortMonth: 'Jul',
    activeUsers: 734,
    quizCompletions: 640,
    gameCompletions: 682,
    tour360Views: 1390,
    avgQuizScore: 86,
  },
  {
    month: 'Agustus (Bulan 4)',
    shortMonth: 'Agu',
    activeUsers: 1042,
    quizCompletions: 938,
    gameCompletions: 965,
    tour360Views: 2150,
    avgQuizScore: 89,
  },
  {
    month: 'September (Bulan 5)',
    shortMonth: 'Sep',
    activeUsers: 1296,
    quizCompletions: 1184,
    gameCompletions: 1218,
    tour360Views: 2890,
    avgQuizScore: 91,
  },
  {
    month: 'Oktober (Bulan 6)',
    shortMonth: 'Okt',
    activeUsers: 1548,
    quizCompletions: 1396,
    gameCompletions: 1425,
    tour360Views: 3640,
    avgQuizScore: 93,
  },
];

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
    id: 'ratna-saraswati',
    name: 'Dr. Ratna Saraswati, M.Pd.',
    email: 'ratna.kurator@starlabudaya.id',
    role: 'Kurator Budaya Utama',
    avatarUrl: 'mobile/5hv8C0oRfrb.png',
    badge: 'Lead Curator',
  },
  {
    id: 'budi-santoso',
    name: 'Budi Santoso, S.Pd.',
    email: 'budi.edukasi@starlabudaya.id',
    role: 'Koordinator Edukasi Nusantara',
    avatarUrl: 'mobile/6EfvCxuLoY5.png',
    badge: 'Educator Lead',
  },
  {
    id: 'nadia-prameswari',
    name: 'Nadia Prameswari, S.Sn.',
    email: 'nadia.studio@starlabudaya.id',
    role: 'Desainer Interaktif & 360°',
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
    {
      id: '360-02',
      embedUrl: 'https://faryzt.github.io/Pameran-360/',
      slideId: 'tur360_pameran_budaya',
      buttonSlideId: '5iew2M44w24',
      buttonElementId: 'btn_pameran_360_budaya',
    },
  ],
  analyticsList: [
    {
      id: 'STD-101',
      name: 'Putu Ayu Prameswari',
      school: 'SDN 1 Denpasar, Bali',
      completedModules: 17,
      quizScore: 100,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/5hv8C0oRfrb.png',
      lastActive: 'Hari ini, 09:42 WITA',
    },
    {
      id: 'STD-102',
      name: 'Bima Arya Pratama',
      school: 'SDN Menteng 01 Jakarta',
      completedModules: 17,
      quizScore: 95,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/5r8KdQdV9SH.png',
      lastActive: 'Hari ini, 09:28 WIB',
    },
    {
      id: 'STD-103',
      name: 'Siti Nurbaya Lubis',
      school: 'SDN 060812 Medan, Sumut',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/62oB2J2cBdW.png',
      lastActive: 'Hari ini, 09:15 WIB',
    },
    {
      id: 'STD-104',
      name: 'Fransiskus Yoman',
      school: 'SD Inpres Kotaraja Jayapura',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/5s6NWFwiK9z.png',
      lastActive: 'Hari ini, 11:05 WIT',
    },
    {
      id: 'STD-105',
      name: 'Raden Bagus Satrio',
      school: 'SDN Ungaran 1 Yogyakarta',
      completedModules: 15,
      quizScore: 85,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/6Z7ek63QC1F.png',
      lastActive: 'Hari ini, 08:50 WIB',
    },
    {
      id: 'STD-106',
      name: 'Cut Meutia Zahra',
      school: 'SDN 2 Banda Aceh',
      completedModules: 17,
      quizScore: 100,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/5hv8C0oRfrb.png',
      lastActive: 'Hari ini, 08:35 WIB',
    },
    {
      id: 'STD-107',
      name: 'Andi Tenri Pada',
      school: 'SDN Sudirman 1 Makassar',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Bouncing',
      avatarUrl: 'mobile/6EfvCxuLoY5.png',
      lastActive: 'Hari ini, 09:30 WITA',
    },
    {
      id: 'STD-108',
      name: 'Ni Luh Gede Saraswati',
      school: 'SDN 3 Ubud Gianyar, Bali',
      completedModules: 17,
      quizScore: 95,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/5jk1lv5JqZM.png',
      lastActive: 'Hari ini, 09:10 WITA',
    },
    {
      id: 'STD-109',
      name: 'Muhammad Fajar Ramadhan',
      school: 'SDN Banjarsari Bandung',
      completedModules: 15,
      quizScore: 85,
      garudaPoints: 160,
      status: 'Active',
      avatarUrl: 'mobile/5r8KdQdV9SH.png',
      lastActive: 'Hari ini, 07:55 WIB',
    },
    {
      id: 'STD-110',
      name: 'Yohanes Karel Wamafma',
      school: 'SD YPPK St. Fransiskus Biak',
      completedModules: 14,
      quizScore: 80,
      garudaPoints: 160,
      status: 'Active',
      avatarUrl: 'mobile/5s6NWFwiK9z.png',
      lastActive: 'Hari ini, 10:15 WIT',
    },
    {
      id: 'STD-111',
      name: 'Aisyah Putri Maharani',
      school: 'SDN Kaliasin I Surabaya',
      completedModules: 17,
      quizScore: 100,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/62oB2J2cBdW.png',
      lastActive: 'Kemarin, 15:40 WIB',
    },
    {
      id: 'STD-112',
      name: 'Dewa Gede Agung Putra',
      school: 'SDN 4 Singaraja Buleleng',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/6Z7ek63QC1F.png',
      lastActive: 'Kemarin, 16:12 WITA',
    },
    {
      id: 'STD-113',
      name: 'Grace Natalia Manurung',
      school: 'SD St. Antonius Medan',
      completedModules: 15,
      quizScore: 85,
      garudaPoints: 180,
      status: 'Bouncing',
      avatarUrl: 'mobile/5hv8C0oRfrb.png',
      lastActive: 'Kemarin, 14:20 WIB',
    },
    {
      id: 'STD-114',
      name: 'Dimas Aditya Nugroho',
      school: 'SDN Pekunden Semarang',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/5r8KdQdV9SH.png',
      lastActive: 'Kemarin, 13:50 WIB',
    },
    {
      id: 'STD-115',
      name: 'Nabila Azzahra Hakim',
      school: 'SDN 12 Padang, Sumbar',
      completedModules: 17,
      quizScore: 95,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/62oB2J2cBdW.png',
      lastActive: 'Kemarin, 11:30 WIB',
    },
    {
      id: 'STD-116',
      name: 'La Ode Muhammad Rizky',
      school: 'SDN 1 Baubau Buton, Sultra',
      completedModules: 14,
      quizScore: 80,
      garudaPoints: 160,
      status: 'Active',
      avatarUrl: 'mobile/5s6NWFwiK9z.png',
      lastActive: 'Kemarin, 10:45 WITA',
    },
    {
      id: 'STD-117',
      name: 'Kezia Aurelia Sondakh',
      school: 'SD GMIM 12 Manado, Sulut',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/5jk1lv5JqZM.png',
      lastActive: '2 hari lalu, 14:15 WITA',
    },
    {
      id: 'STD-118',
      name: 'Bayu Pamungkas Wijaya',
      school: 'SDN Kauman 1 Malang',
      completedModules: 15,
      quizScore: 85,
      garudaPoints: 160,
      status: 'Bouncing',
      avatarUrl: 'mobile/6Z7ek63QC1F.png',
      lastActive: '2 hari lalu, 13:05 WIB',
    },
    {
      id: 'STD-119',
      name: 'Dayang Nurhaliza',
      school: 'SDN 03 Pontianak, Kalbar',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/5hv8C0oRfrb.png',
      lastActive: '2 hari lalu, 10:20 WIB',
    },
    {
      id: 'STD-120',
      name: 'Petrus Lamberth Pattinasarany',
      school: 'SD Negeri Latihan Ambon',
      completedModules: 15,
      quizScore: 85,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/5r8KdQdV9SH.png',
      lastActive: '2 hari lalu, 11:40 WIT',
    },
    {
      id: 'STD-121',
      name: 'Kirana Larasati Kusuma',
      school: 'SDN Mangkukusuman 1 Tegal',
      completedModules: 17,
      quizScore: 95,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/62oB2J2cBdW.png',
      lastActive: '3 hari lalu, 15:10 WIB',
    },
    {
      id: 'STD-122',
      name: 'Sultan Hasanuddin Alfarizi',
      school: 'SD Islam Athirah Makassar',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/5s6NWFwiK9z.png',
      lastActive: '3 hari lalu, 14:00 WITA',
    },
    {
      id: 'STD-123',
      name: 'Meilani Putri Anggraini',
      school: 'SDN 17 Palembang, Sumsel',
      completedModules: 13,
      quizScore: 75,
      garudaPoints: 140,
      status: 'Pending',
      avatarUrl: 'mobile/5jk1lv5JqZM.png',
      lastActive: '3 hari lalu, 09:30 WIB',
    },
    {
      id: 'STD-124',
      name: 'I Wayan Dharma Putra',
      school: 'SDN 2 Sanur Denpasar',
      completedModules: 17,
      quizScore: 100,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/6Z7ek63QC1F.png',
      lastActive: '3 hari lalu, 16:05 WITA',
    },
    {
      id: 'STD-125',
      name: 'Zahra Amalia Ramadhani',
      school: 'SDN 001 Balikpapan, Kaltim',
      completedModules: 15,
      quizScore: 85,
      garudaPoints: 160,
      status: 'Active',
      avatarUrl: 'mobile/5hv8C0oRfrb.png',
      lastActive: '4 hari lalu, 11:25 WITA',
    },
    {
      id: 'STD-126',
      name: 'Gabriel Mateus da Costa',
      school: 'SD Inpres Naikoten 1 Kupang',
      completedModules: 14,
      quizScore: 80,
      garudaPoints: 160,
      status: 'Active',
      avatarUrl: 'mobile/5r8KdQdV9SH.png',
      lastActive: '4 hari lalu, 10:15 WITA',
    },
    {
      id: 'STD-127',
      name: 'Rizky Pratama Hidayat',
      school: 'SDN Seberang Mesjid 1 Banjarmasin',
      completedModules: 12,
      quizScore: 75,
      garudaPoints: 140,
      status: 'Pending',
      avatarUrl: 'mobile/6EfvCxuLoY5.png',
      lastActive: '4 hari lalu, 13:45 WITA',
    },
    {
      id: 'STD-128',
      name: 'Shafa Salsabila Khairunnisa',
      school: 'SDN Polisi 4 Bogor, Jabar',
      completedModules: 17,
      quizScore: 95,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/62oB2J2cBdW.png',
      lastActive: '5 hari lalu, 14:50 WIB',
    },
    {
      id: 'STD-129',
      name: 'Lalu Muhammad Zikri',
      school: 'SDN 2 Mataram, Lombok NTB',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/5s6NWFwiK9z.png',
      lastActive: '5 hari lalu, 09:20 WITA',
    },
    {
      id: 'STD-130',
      name: 'Celine Victoria Halim',
      school: 'SD Sutomo 1 Medan',
      completedModules: 17,
      quizScore: 100,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/5jk1lv5JqZM.png',
      lastActive: '5 hari lalu, 15:30 WIB',
    },
    {
      id: 'STD-131',
      name: 'Arjuna Satria Wibowo',
      school: 'SDN Kleco 1 Surakarta',
      completedModules: 15,
      quizScore: 85,
      garudaPoints: 160,
      status: 'Active',
      avatarUrl: 'mobile/6Z7ek63QC1F.png',
      lastActive: '6 hari lalu, 10:10 WIB',
    },
    {
      id: 'STD-132',
      name: 'Intan Permata Sari',
      school: 'SDN 1 Teluk Betung Bandar Lampung',
      completedModules: 14,
      quizScore: 80,
      garudaPoints: 160,
      status: 'Bouncing',
      avatarUrl: 'mobile/5hv8C0oRfrb.png',
      lastActive: '6 hari lalu, 11:00 WIB',
    },
    {
      id: 'STD-133',
      name: 'Marselinus Wanggai',
      school: 'SD Negeri 1 Manokwari, Papua Barat',
      completedModules: 15,
      quizScore: 85,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/5r8KdQdV9SH.png',
      lastActive: '1 minggu lalu, 12:30 WIT',
    },
    {
      id: 'STD-134',
      name: 'Farhan Maulana Ibrahim',
      school: 'SDN 36 Pekanbaru, Riau',
      completedModules: 16,
      quizScore: 90,
      garudaPoints: 180,
      status: 'Active',
      avatarUrl: 'mobile/6EfvCxuLoY5.png',
      lastActive: '1 minggu lalu, 14:15 WIB',
    },
    {
      id: 'STD-135',
      name: 'Syifa Nurul Aini',
      school: 'SDN 2 Kota Ternate, Maluku Utara',
      completedModules: 13,
      quizScore: 75,
      garudaPoints: 140,
      status: 'Pending',
      avatarUrl: 'mobile/62oB2J2cBdW.png',
      lastActive: '1 minggu lalu, 10:50 WIT',
    },
    {
      id: 'STD-136',
      name: 'Kadek Bagus Dananjaya',
      school: 'SDN 1 Semarapura Klungkung, Bali',
      completedModules: 17,
      quizScore: 95,
      garudaPoints: 200,
      status: 'On Sale',
      avatarUrl: 'mobile/5jk1lv5JqZM.png',
      lastActive: '1 minggu lalu, 16:00 WITA',
    },
  ],
  statusOverrides: {},
  categoryOverrides: {},
};
