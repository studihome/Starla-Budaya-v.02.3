import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { CheckCircle2, Gamepad2, HelpCircle, Users } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import type { ContentSchema } from '../../data/defaultContent';
import {
  GARUDA_BIRD_QUESTIONS,
  getMateriBudayaSlides,
  getTur360Slides,
} from '../../utils/slideExactMeta';

export interface StudentCompletionRecord {
  id: string;
  name: string;
  school: string;
  completedModules: number;
  quizScore: number;
  garudaPoints: number;
  status: string;
}

export interface ModuleCompletionChartPoint {
  moduleName: string;
  shortName: string;
  completedUsers: number;
  inProgressUsers: number;
  totalQuestionsOrSlides: number;
  completionRatePct: number;
}

export interface UserScoreChartPoint {
  name: string;
  school: string;
  skorKuis: number;
  skorGameGaruda: number;
  modulSelesai: number;
}

export interface QuizGameStatsSummary {
  totalUsers: number;
  completedQuizUsers: number;
  completedGameUsers: number;
  completedBothUsers: number;
  quizCompletionRatePct: number;
  gameCompletionRatePct: number;
  avgQuizScore: number;
  avgGameScorePct: number;
  activeQuizQuestionCount: number;
  activeGarudaQuestionCount: number;
  activeMateriSlideCount: number;
  activeTur360SlideCount: number;
  moduleBreakdown: ModuleCompletionChartPoint[];
  userComparison: UserScoreChartPoint[];
}

/**
 * Pure function that computes Quiz & Game completion statistics directly from
 * `ContentSchema` (`ContentContext`) and the active student analytics list.
 */
export function computeQuizAndGameCompletionStats(
  content: ContentSchema,
  students: StudentCompletionRecord[]
): QuizGameStatsSummary {
  const safeStudents = Array.isArray(students) ? students : [];
  const totalUsers = safeStudents.length;

  // 1. Active Quiz questions from ContentContext
  const activeQuizQuestionCount = (
    content.quizzes?.kuisBudaya?.questions || []
  ).filter((q) => !q.hidden).length;

  // 2. Active Game Anak Garuda questions from ContentContext (10 native birds + custom statements - hidden)
  const hiddenOnSlide40 =
    content.slides?.['6G1VrKuOhCw']?.hiddenElementIds || [];
  const garudaOverrides =
    content.quizzes?.gameAnakGaruda?.questionOverrides || {};
  const activeNativeBirds = GARUDA_BIRD_QUESTIONS.filter(
    (b) =>
      !hiddenOnSlide40.includes(b.birdId) && !garudaOverrides[b.birdId]?.hidden
  ).length;
  const customStatements = (
    content.quizzes?.gameAnakGaruda?.statements || []
  ).filter((s) => s.id !== '6aBc0ef8Fpq' && s.id !== '6l3BVdcEP3S').length;
  const activeGarudaQuestionCount = activeNativeBirds + customStatements;

  // 3. Active Materi & 360 slides from ContentContext
  const activeMateriSlideCount = getMateriBudayaSlides(
    content.slideOrder || [],
    content.slides || {}
  ).length;
  const activeTur360SlideCount = getTur360Slides(
    content.slideOrder || [],
    content.slides || {}
  ).length;

  // Thresholds for completion based on ContentContext max points
  const quizPassThreshold = 70;
  const gamePassThreshold = 120; // out of 200 max Garuda points

  const completedQuizUsers = safeStudents.filter(
    (s) => s.quizScore >= quizPassThreshold
  ).length;
  const completedGameUsers = safeStudents.filter(
    (s) => s.garudaPoints >= gamePassThreshold
  ).length;
  const completedBothUsers = safeStudents.filter(
    (s) =>
      s.quizScore >= quizPassThreshold && s.garudaPoints >= gamePassThreshold
  ).length;
  const completedMateriUsers = safeStudents.filter(
    (s) => s.completedModules >= Math.max(1, activeMateriSlideCount - 3)
  ).length;
  const completed360Users = safeStudents.filter(
    (s) => s.completedModules >= 10
  ).length;

  const quizCompletionRatePct =
    totalUsers > 0 ? Math.round((completedQuizUsers / totalUsers) * 100) : 0;
  const gameCompletionRatePct =
    totalUsers > 0 ? Math.round((completedGameUsers / totalUsers) * 100) : 0;

  const avgQuizScore =
    totalUsers > 0
      ? Math.round(
          safeStudents.reduce((acc, s) => acc + (Number(s.quizScore) || 0), 0) /
            totalUsers
        )
      : 0;

  const avgGameScorePct =
    totalUsers > 0
      ? Math.round(
          safeStudents.reduce(
            (acc, s) =>
              acc + Math.min(100, Math.round(((Number(s.garudaPoints) || 0) / 200) * 100)),
            0
          ) / totalUsers
        )
      : 0;

  const moduleBreakdown: ModuleCompletionChartPoint[] = [
    {
      moduleName: `Kuis Evaluasi (${activeQuizQuestionCount} Soal)`,
      shortName: 'Kuis Budaya',
      completedUsers: completedQuizUsers,
      inProgressUsers: Math.max(0, totalUsers - completedQuizUsers),
      totalQuestionsOrSlides: activeQuizQuestionCount,
      completionRatePct: quizCompletionRatePct,
    },
    {
      moduleName: `Game Anak Garuda (${activeGarudaQuestionCount} Soal)`,
      shortName: 'Game Garuda',
      completedUsers: completedGameUsers,
      inProgressUsers: Math.max(0, totalUsers - completedGameUsers),
      totalQuestionsOrSlides: activeGarudaQuestionCount,
      completionRatePct: gameCompletionRatePct,
    },
    {
      moduleName: 'Gim Tebak Budaya (3 Slide)',
      shortName: 'Tebak Budaya',
      completedUsers: Math.min(totalUsers, completedGameUsers + 1),
      inProgressUsers: Math.max(
        0,
        totalUsers - Math.min(totalUsers, completedGameUsers + 1)
      ),
      totalQuestionsOrSlides: 3,
      completionRatePct:
        totalUsers > 0
          ? Math.round(
              (Math.min(totalUsers, completedGameUsers + 1) / totalUsers) * 100
            )
          : 0,
    },
    {
      moduleName: `Materi Budaya (${activeMateriSlideCount} Slide)`,
      shortName: 'Materi Budaya',
      completedUsers: completedMateriUsers,
      inProgressUsers: Math.max(0, totalUsers - completedMateriUsers),
      totalQuestionsOrSlides: activeMateriSlideCount,
      completionRatePct:
        totalUsers > 0
          ? Math.round((completedMateriUsers / totalUsers) * 100)
          : 0,
    },
    {
      moduleName: `Tur 360° Budaya (${activeTur360SlideCount} Slide)`,
      shortName: '360° Budaya',
      completedUsers: completed360Users,
      inProgressUsers: Math.max(0, totalUsers - completed360Users),
      totalQuestionsOrSlides: activeTur360SlideCount,
      completionRatePct:
        totalUsers > 0
          ? Math.round((completed360Users / totalUsers) * 100)
          : 0,
    },
  ];

  const userComparison: UserScoreChartPoint[] = safeStudents.map((st) => {
    const firstName = st.name.split(' ').slice(0, 2).join(' ');
    return {
      name: firstName,
      school: st.school,
      skorKuis: st.quizScore,
      skorGameGaruda: Math.min(100, Math.round((st.garudaPoints / 200) * 100)),
      modulSelesai: st.completedModules,
    };
  });

  return {
    totalUsers,
    completedQuizUsers,
    completedGameUsers,
    completedBothUsers,
    quizCompletionRatePct,
    gameCompletionRatePct,
    avgQuizScore,
    avgGameScorePct,
    activeQuizQuestionCount,
    activeGarudaQuestionCount,
    activeMateriSlideCount,
    activeTur360SlideCount,
    moduleBreakdown,
    userComparison,
  };
}

export const QuizGameCompletionCharts: React.FC<{
  students: StudentCompletionRecord[];
  onNavigateTab?: (tab: 'kuis' | 'gim' | 'analitik') => void;
}> = ({ students, onNavigateTab }) => {
  const { content } = useContent();

  const stats = useMemo(
    () => computeQuizAndGameCompletionStats(content, students),
    [content, students]
  );

  return (
    <div
      id="recharts-quiz-game-panel"
      className="bg-white rounded-2xl p-6 shadow-[0_4px_24px_rgba(15,23,42,0.04)] border border-slate-100 space-y-6"
    >
      {/* Top Header & Summary Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3FF] text-[#2F80ED] text-[11px] font-extrabold">
              Live Analytics • ContentContext
            </span>
            <h3 className="text-base font-extrabold text-slate-900">
              Visualisasi Penyelesaian Kuis &amp; Game Edukasi
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Statistik real-time berdasarkan{' '}
            <span className="font-bold text-slate-700">
              {stats.activeQuizQuestionCount} Soal Kuis Budaya
            </span>{' '}
            &amp;{' '}
            <span className="font-bold text-slate-700">
              {stats.activeGarudaQuestionCount} Soal Game Anak Garuda
            </span>{' '}
            dari ContentContext
          </p>
        </div>

        {/* 3 Clean Metric Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab?.('kuis')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#DCFCE7]/60 hover:bg-[#DCFCE7] text-[#10B981] border border-emerald-200/60 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>
              Selesai Kuis: {stats.completedQuizUsers}/{stats.totalUsers} (
              {stats.quizCompletionRatePct}%)
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('gim')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E0F2FE]/70 hover:bg-[#E0F2FE] text-[#2F80ED] border border-blue-200/60 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>
              Selesai Game: {stats.completedGameUsers}/{stats.totalUsers} (
              {stats.gameCompletionRatePct}%)
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab?.('analitik')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F3E8FF]/70 hover:bg-[#F3E8FF] text-[#A855F7] border border-purple-200/60 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>
              Rata-Rata Skor: {stats.avgQuizScore}% Kuis •{' '}
              {stats.avgGameScorePct}% Game
            </span>
          </button>
        </div>
      </div>

      {/* Two Recharts Panels Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: BarChart Jumlah Pengguna Selesai Kuis & Game per Modul */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800">
                Jumlah Pengguna Selesai per Modul (Kuis &amp; Game)
              </h4>
              <p className="text-[11px] text-slate-400">
                Perbandingan pengguna selesai vs sedang berjalan
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {stats.completedBothUsers} Lulus Keduanya
            </span>
          </div>

          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.moduleBreakdown}
                margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
                />
                <Bar
                  dataKey="completedUsers"
                  name="Selesai (Pengguna)"
                  fill="#2F80ED"
                  radius={[6, 6, 0, 0]}
                  barSize={26}
                />
                <Bar
                  dataKey="inProgressUsers"
                  name="Proses Belajar"
                  fill="#F59E0B"
                  radius={[6, 6, 0, 0]}
                  barSize={26}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: AreaChart Perbandingan Skor Kuis vs Game Anak Garuda per Pengguna */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800">
                Statistik Nilai Kuis vs Game Anak Garuda per Pengguna
              </h4>
              <p className="text-[11px] text-slate-400">
                Persentase pencapaian skor kuis &amp; poin gim tiap siswa
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#2F80ED]">
              Skala 0 – 100%
            </span>
          </div>

          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.userComparison}
                margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorSkorKuis"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#2F80ED" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2F80ED" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient
                    id="colorSkorGame"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
                />
                <Area
                  type="monotone"
                  dataKey="skorKuis"
                  name="Skor Kuis Budaya (%)"
                  stroke="#2F80ED"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSkorKuis)"
                />
                <Area
                  type="monotone"
                  dataKey="skorGameGaruda"
                  name="Skor Game Anak Garuda (%)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSkorGame)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizGameCompletionCharts;
