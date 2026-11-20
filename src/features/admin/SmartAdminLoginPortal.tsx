import React from 'react';
import { CheckCircle2, LogOut } from 'lucide-react';
import type { SmartAdminProfile } from './adminTypes';
import { PuzzlerCubeLogo } from './RoyalBlueInteractiveHub';

export interface SmartAdminLoginPortalProps {
  profiles: SmartAdminProfile[];
  selectedProfileId: string;
  activeProfile: SmartAdminProfile;
  loginEmailInput: string;
  loginPinInput: string;
  showLoginPin: boolean;
  rememberAdminSession: boolean;
  loginError: string | null;
  materiCount: number;
  tur360Count: number;
  quizAndGameCount: number;
  totalSlidesCount: number;
  onSelectProfile: (profile: SmartAdminProfile) => void;
  onChangeEmail: (val: string) => void;
  onChangePin: (val: string) => void;
  onToggleShowPin: () => void;
  onToggleRemember: (checked: boolean) => void;
  onSubmitPinLogin: (e: React.FormEvent) => void;
  onQuickSmartLogin: (profileId: string) => void;
  onExitToPublic: () => void;
}

export const SmartAdminLoginPortal: React.FC<SmartAdminLoginPortalProps> =
  React.memo(
    ({
      profiles,
      selectedProfileId,
      activeProfile,
      loginEmailInput,
      loginPinInput,
      showLoginPin,
      rememberAdminSession,
      loginError,
      materiCount,
      tur360Count,
      quizAndGameCount,
      totalSlidesCount,
      onSelectProfile,
      onChangeEmail,
      onChangePin,
      onToggleShowPin,
      onToggleRemember,
      onSubmitPinLogin,
      onQuickSmartLogin,
      onExitToPublic,
    }) => {
      return (
        <div
          id="admin-smart-login-portal"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
          }}
          className="starla-saas-admin fixed inset-0 flex items-center justify-center bg-[#F4F6FA] text-slate-800 font-sans p-4 sm:p-6 overflow-y-auto select-none"
        >
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-[0_14px_45px_rgba(15,23,42,0.06)] border border-[#E2E8F0] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Clean White Minimalist Puzzler Overview */}
            <div className="lg:col-span-5 bg-[#F8FAFC] border-b lg:border-b-0 lg:border-r border-[#E2E8F0] text-slate-800 p-7 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <PuzzlerCubeLogo className="w-9 h-9" />
                  <h1
                    style={{
                      fontFamily:
                        'Georgia, "Playfair Display", "Times New Roman", serif',
                    }}
                    className="text-[22px] font-black tracking-tight leading-none text-slate-900"
                  >
                    Puzzler
                  </h1>
                </div>

                <div className="mt-7">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3EEFF] text-[11px] font-bold text-[#2F80ED]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2F80ED]" />
                    Smart Curator & Educator Gate
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-3 leading-snug">
                    Kelola Materi, 360° Embed, Kuis & Desain Slide 1:1
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Portal manajemen cerdas dengan sinkronisasi real-time ke
                    ContentContext, visualisasi analitik Recharts, dan kanvas
                    presisi tanpa lag.
                  </p>
                </div>

                {/* Live Telemetry Pills from ContentContext */}
                <div className="grid grid-cols-2 gap-2.5 mt-6">
                  <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0]">
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Materi Murni
                    </p>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
                      {materiCount} Slide
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0]">
                    <p className="text-[11px] text-slate-400 font-semibold">
                      360° & Web Embed
                    </p>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
                      {tur360Count} Lokasi
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0]">
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Gim & Kuis Aktif
                    </p>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
                      {quizAndGameCount} Soal
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#E2E8F0]">
                    <p className="text-[11px] text-slate-400 font-semibold">
                      Kanvas Studio
                    </p>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
                      {totalSlidesCount} Slide
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  Puzzler Minimalist Studio
                </span>
                <button
                  type="button"
                  onClick={onExitToPublic}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#E2E8F0] text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Layar Publik</span>
                </button>
              </div>
            </div>

            {/* Right Column: Smart Login Form */}
            <div className="lg:col-span-7 p-7 sm:p-9 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Smart Admin Login
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih profil kurator atau masukkan PIN keamanan studio
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#EBF3FF] text-[#2F80ED] text-[11px] font-extrabold">
                    PIN: 1234 / 123456
                  </span>
                </div>

                {/* 1-Click Smart Profile Switcher */}
                <div className="mt-5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                    1. Pilih Profil Kurator (Smart Profile)
                  </label>
                  <div
                    id="admin-profile-selector"
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
                  >
                    {profiles.map((prof) => {
                      const isSelected = prof.id === selectedProfileId;
                      return (
                        <button
                          key={prof.id}
                          type="button"
                          onClick={() => onSelectProfile(prof)}
                          className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'border-[#2F80ED] bg-[#EBF3FF]/60 shadow-2xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <img
                            src={prof.avatarUrl}
                            alt={prof.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-900 truncate">
                              {prof.name}
                            </p>
                            <p className="text-[10px] font-semibold text-[#2F80ED] truncate">
                              {prof.badge}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Smart PIN & Credential Form */}
                <form
                  id="admin-pin-form"
                  onSubmit={onSubmitPinLogin}
                  className="mt-5 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email / Identitas Kurator
                    </label>
                    <input
                      id="admin-email-input"
                      type="text"
                      value={loginEmailInput}
                      onChange={(e) => onChangeEmail(e.target.value)}
                      placeholder="jane234@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-sm font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-[#2F80ED] focus:ring-2 focus:ring-blue-500/15"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="admin-pin-input"
                        className="block text-xs font-bold text-slate-700"
                      >
                        PIN Keamanan Studio
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onChangePin('1234')}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-[11px] font-bold text-[#2F80ED] cursor-pointer"
                        >
                          Isi 1234
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangePin('123456')}
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-[11px] font-bold text-[#2F80ED] cursor-pointer"
                        >
                          Isi 123456
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <input
                        id="admin-pin-input"
                        type={showLoginPin ? 'text' : 'password'}
                        value={loginPinInput}
                        onChange={(e) => onChangePin(e.target.value)}
                        placeholder="Masukkan PIN (1234 atau 123456)"
                        autoComplete="off"
                        className="w-full pl-4 pr-20 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-extrabold tracking-widest text-slate-900 placeholder:tracking-normal placeholder:font-medium focus:outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-blue-500/15"
                      />
                      <button
                        type="button"
                        onClick={onToggleShowPin}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        {showLoginPin ? 'Sembunyi' : 'Lihat'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberAdminSession}
                        onChange={(e) => onToggleRemember(e.target.checked)}
                        className="rounded border-slate-300 text-[#2F80ED] focus:ring-[#2F80ED]"
                      />
                      <span>Ingat sesi login cerdas di perangkat ini</span>
                    </label>
                  </div>

                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
                      {loginError}
                    </div>
                  )}

                  <div className="pt-1 flex flex-col sm:flex-row items-stretch gap-2.5">
                    <button
                      id="admin-login-submit-btn"
                      type="submit"
                      className="flex-1 py-3 px-5 rounded-xl bg-[#2F80ED] hover:bg-[#1D6FE0] text-white text-xs font-extrabold shadow-[0_10px_22px_rgba(47,128,237,0.3)] transition-all cursor-pointer"
                    >
                      Masuk dengan PIN →
                    </button>
                    <button
                      id="admin-smart-quick-login-btn"
                      type="button"
                      onClick={() => onQuickSmartLogin(selectedProfileId)}
                      className="py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-extrabold transition-all cursor-pointer"
                    >
                      ⚡ Smart 1-Click Login
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Aktif sebagai:{' '}
                  <strong className="text-slate-700">
                    {activeProfile.name}
                  </strong>{' '}
                  ({activeProfile.role})
                </span>
                <span>Pintasan: Ctrl+Shift+A</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
  );

SmartAdminLoginPortal.displayName = 'SmartAdminLoginPortal';

export default SmartAdminLoginPortal;
