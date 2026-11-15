// src/features/admin/VisualStudioAdmin.tsx
import React, { useState, useEffect } from 'react';
import { useContent, ADMIN_PIN } from '../../context/ContentContext';
import { CanvasStageOverlay } from '../canvas/CanvasStageOverlay';
import {
  Undo2,
  Redo2,
  Magnet,
  Eye,
  Edit3,
  CloudUpload,
  Plus,
  Image as ImageIcon,
  Type,
  Volume2,
  Layers,
  Trash2,
  Copy,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  LogOut,
  Sliders,
  Play,
  LayoutGrid,
} from 'lucide-react';

interface VisualStudioAdminProps {
  children: React.ReactNode; // Komponen Player Articulate Asli Anda
}

export const VisualStudioAdmin: React.FC<VisualStudioAdminProps> = ({ children }) => {
  const {
    content,
    activeSlideIndex,
    setActiveSlideIndex,
    activeSlide,
    selectedElementId,
    setSelectedElementId,
    isEditMode,
    setIsEditMode,
    snapEnabled,
    setSnapEnabled,
    canUndo,
    canRedo,
    undo,
    redo,
    commitElementUpdate,
    addElement,
    duplicateElement,
    deleteElement,
    updateOriginalOverride,
    addSlide,
    duplicateSlide,
    deleteSlide,
    isSaving,
    syncStatus,
    saveToCloud,
    uploadMediaFile,
    resetCurrentSlide,
  } = useContent();

  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [leftTab, setLeftTab] = useState<'elements' | 'slides' | 'layers'>('elements');
  const [rightTab, setRightTab] = useState<'content' | 'style' | 'action'>('content');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedElement =
    activeSlide.elements.find((e) => e.id === selectedElementId) || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Deteksi URL `?mode=admin` serta Pintasan Keyboard (Ctrl+Shift+A, Ctrl+Z, Ctrl+Y, Delete)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'admin') {
        setIsStudioOpen(true);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Pintasan Buka/Tutup Admin Studio: Ctrl + Shift + A
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsStudioOpen((prev) => !prev);
      }

      if (!isStudioOpen || !isAuthenticated || !isEditMode) return;

      // Abaikan jika admin sedang mengetik di dalam input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        deleteElement(selectedElementId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStudioOpen, isAuthenticated, isEditMode, selectedElementId, undo, redo, deleteElement]);

  const handleLoginPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true);
      setIsEditMode(true);
      setPinError('');
    } else {
      setPinError('PIN Admin tidak sesuai. Silakan coba lagi.');
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imageUrl' | 'audioUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;
    showToast('Mengunggah media...');
    const uploadedUrl = await uploadMediaFile(file);
    if (field === 'imageUrl') {
      commitElementUpdate(selectedElement.id, { imageUrl: uploadedUrl });
    } else {
      commitElementUpdate(selectedElement.id, {
        audioUrl: uploadedUrl,
        action: { ...selectedElement.action, audioUrl: uploadedUrl },
      });
    }
    showToast('Media berhasil dipasang ke tombol!');
  };

  const handlePublish = async () => {
    const ok = await saveToCloud();
    if (ok) {
      showToast('Berhasil disimpan & dipublikasikan!');
    } else {
      showToast('Tersimpan di browser lokal (Supabase belum dikonfigurasi).');
    }
  };

  // 1. TAMPILAN PENGGUNA MURNI (100% ZERO VISUAL REGRESSION)
  if (!isStudioOpen) {
    return (
      <div className="relative w-full h-full">
        {children}
        <CanvasStageOverlay />
        {/* Tombol Akses Cepat Admin (Transparan di Pojok Kanan Bawah) */}
        <button
          type="button"
          onClick={() => setIsStudioOpen(true)}
          title="Buka Visual Studio Admin (Ctrl + Shift + A)"
          className="fixed bottom-3 right-3 z-50 bg-slate-900/70 hover:bg-slate-900 text-yellow-400 border border-yellow-400/30 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg opacity-35 hover:opacity-100 transition-opacity flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Admin Studio</span>
        </button>
      </div>
    );
  }

  // 2. MODAL AUTENTIKASI PIN ADMIN
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-50">
        <form
          onSubmit={handleLoginPin}
          className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-white"
        >
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-lg mb-2">
            <Sparkles className="w-5 h-5" />
            <span>Visual Canvas Studio</span>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Masukkan PIN Admin untuk membuka editor kanvas interaktif (Default: 123456).
          </p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="Masukkan PIN Admin..."
            autoFocus
            className="w-full bg-slate-950 border border-slate-700 focus:border-yellow-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none mb-3"
          />
          {pinError && <p className="text-xs text-rose-400 mb-3">{pinError}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStudioOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-slate-950 transition"
            >
              Buka Studio
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 3. WORKSPACE STUDIO ADMIN 4 ZONA (CANVA / FIGMA DARK SLATE THEME)
  return (
    <div className="fixed inset-0 bg-[#0B1120] text-slate-100 flex flex-col z-50 select-none overflow-hidden font-sans">
      {/* Notifikasi Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-yellow-400 text-yellow-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-yellow-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ZONA 1: TOP COMMAND BAR */}
      <header className="h-14 bg-[#0F172A] border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        {/* Kiri: Identitas & Pemilih Slide */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-yellow-400/30 px-3 py-1.5 rounded-xl">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-extrabold tracking-wide text-white">
              STUDIO KANVAS
            </span>
          </div>

          <select
            value={activeSlideIndex}
            onChange={(e) => setActiveSlideIndex(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 text-white outline-none focus:border-yellow-400"
          >
            {content.slides.map((s, idx) => (
              <option key={s.id} value={idx}>
                {idx + 1}. {s.title} ({s.elements.length} elemen)
              </option>
            ))}
          </select>
        </div>

        {/* Tengah: Undo, Redo, Snap & Switcher Mode Edit vs Live Test */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={() => setSnapEnabled(!snapEnabled)}
            title="Garis Bantu Magnetik Otomatis"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              snapEnabled
                ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              isEditMode
                ? 'bg-yellow-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Kanvas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              setSelectedElementId(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              !isEditMode
                ? 'bg-emerald-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Uji Interaktif</span>
          </button>
        </div>

        {/* Kanan: Reset, Publish ke Supabase & Keluar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetCurrentSlide}
            title="Kosongkan Elemen Tambahan di Slide Ini"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow-lg transition disabled:opacity-50"
          >
            <CloudUpload className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan & Publish'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              setIsStudioOpen(false);
            }}
            title="Kembali ke Mode Layar Penuh Pengguna"
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* AREA UTAMA: LEFT DOCK + CENTER STAGE + RIGHT INSPECTOR */}
      <div className="flex-1 flex overflow-hidden">
        {/* ZONA 2: LEFT DOCK (TAMBAH ELEMEN, SLIDE, LAYER) */}
        <aside className="w-72 bg-[#0F172A] border-r border-slate-800 flex flex-col shrink-0">
          {/* Navigasi Tab Kiri */}
          <div className="grid grid-cols-3 border-b border-slate-800 p-1.5 gap-1 bg-slate-950/40">
            <button
              type="button"
              onClick={() => setLeftTab('elements')}
              className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition ${
                leftTab === 'elements'
                  ? 'bg-slate-800 text-yellow-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah UI</span>
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('layers')}
              className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition ${
                leftTab === 'layers'
                  ? 'bg-slate-800 text-yellow-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Layer ({activeSlide.elements.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('slides')}
              className={`py-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition ${
                leftTab === 'slides'
                  ? 'bg-slate-800 text-yellow-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Slide ({content.slides.length})</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* ISI TAB 1: TAMBAH KOMPONEN KE KANVAS */}
            {leftTab === 'elements' && (
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Klik untuk Menambahkan ke Kanvas
                </p>

                <button
                  type="button"
                  onClick={() => addElement('image-button')}
                  className="w-full p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-yellow-400/30 hover:border-yellow-400 flex items-center gap-3 text-left transition group"
                >
                  <div className="p-2.5 rounded-xl bg-yellow-400/10 text-yellow-400 group-hover:scale-110 transition">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Tombol dengan Gambar</div>
                    <div className="text-[11px] text-slate-400">
                      Tombol gambar interaktif + suara & aksi klik
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => addElement('text')}
                  className="w-full p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-400 flex items-center gap-3 text-left transition group"
                >
                  <div className="p-2.5 rounded-xl bg-sky-400/10 text-sky-400 group-hover:scale-110 transition">
                    <Type className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Teks / Judul Bebas</div>
                    <div className="text-[11px] text-slate-400">
                      Kotak teks materi yang bisa digeser
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => addElement('image')}
                  className="w-full p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-400 flex items-center gap-3 text-left transition group"
                >
                  <div className="p-2.5 rounded-xl bg-emerald-400/10 text-emerald-400 group-hover:scale-110 transition">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Gambar / Ilustrasi</div>
                    <div className="text-[11px] text-slate-400">
                      Tambahkan karakter, ikon, atau dekorasi
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => addElement('audio-button')}
                  className="w-full p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-400 flex items-center gap-3 text-left transition group"
                >
                  <div className="p-2.5 rounded-xl bg-purple-400/10 text-purple-400 group-hover:scale-110 transition">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Tombol Suara / Narasi</div>
                    <div className="text-[11px] text-slate-400">
                      Hotspot pemutar narasi MP3/WAV
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* ISI TAB 2: MANAJEMEN LAYER & PEMULIHAN ELEMEN */}
            {leftTab === 'layers' && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Daftar Elemen di Slide Ini
                </p>
                {activeSlide.elements.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Belum ada elemen tambahan di slide ini.
                  </p>
                ) : (
                  activeSlide.elements.map((el) => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        selectedElementId === el.id
                          ? 'bg-slate-800 border-yellow-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold truncate">{el.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {el.type} • Z:{el.zIndex}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            commitElementUpdate(el.id, { locked: !el.locked });
                          }}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400"
                        >
                          {el.locked ? (
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteElement(el.id);
                          }}
                          className="p-1 hover:bg-rose-950/60 rounded text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Pemulihan Elemen Asli jika Ada yang Disembunyikan */}
                {Object.values(activeSlide.originalOverrides).some((o) => o.hidden) && (
                  <div className="pt-4 border-t border-slate-800 mt-4">
                    <p className="text-[11px] font-semibold text-amber-400 mb-2">
                      Elemen Asli yang Disembunyikan
                    </p>
                    {Object.values(activeSlide.originalOverrides)
                      .filter((o) => o.hidden)
                      .map((orig) => (
                        <div
                          key={orig.id}
                          className="flex items-center justify-between bg-slate-900 p-2 rounded-lg mb-1.5 text-xs"
                        >
                          <span className="truncate">{orig.label || orig.id}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateOriginalOverride(orig.id, { hidden: false })
                            }
                            className="px-2 py-1 bg-yellow-400 text-slate-950 font-bold rounded text-[10px]"
                          >
                            Pulihkan
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* ISI TAB 3: MANAJEMEN SLIDE */}
            {leftTab === 'slides' && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={addSlide}
                  className="w-full py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Slide Baru</span>
                </button>

                {content.slides.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      activeSlideIndex === idx
                        ? 'bg-slate-800 border-yellow-400'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white">
                        Slide {idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateSlide(idx);
                          }}
                          title="Duplikat Slide"
                          className="p-1 hover:bg-slate-700 rounded text-slate-300"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {content.slides.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSlide(idx);
                            }}
                            title="Hapus Slide"
                            className="p-1 hover:bg-rose-950 rounded text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={s.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        s.title = newTitle;
                        setActiveSlideIndex(idx);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ZONA 3: CENTER WORKSPACE (KANVAS WYSIWYG RESPONSIF 16:9) */}
        <main className="flex-1 bg-[#070B14] flex flex-col items-center justify-center p-6 overflow-auto relative">
          <div className="mb-3 flex items-center justify-between w-full max-w-5xl text-xs text-slate-400">
            <span>
              Mode Aktif:{' '}
              <strong className={isEditMode ? 'text-yellow-400' : 'text-emerald-400'}>
                {isEditMode
                  ? 'Editor Kanvas (Klik & Tarik untuk Geser/Resize)'
                  : 'Pratinjau Interaktif Langsung'}
              </strong>
            </span>
            <span>
              Status Cloud:{' '}
              <strong className="text-sky-400 uppercase">{syncStatus}</strong>
            </span>
          </div>

          {/* Kontainer Kanvas Proporsional 16:9 */}
          <div className="relative w-full max-w-5xl aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-slate-800">
            {children}
            <CanvasStageOverlay />
          </div>
        </main>

        {/* ZONA 4: RIGHT PROPERTY INSPECTOR (PENGATURAN DETAIL ELEMEN) */}
        <aside className="w-80 bg-[#0F172A] border-l border-slate-800 flex flex-col shrink-0">
          {!selectedElement ? (
            <div className="p-6 text-center my-auto space-y-3">
              <Sliders className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">
                Belum Ada Elemen Dipilih
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Klik salah satu tombol atau elemen di atas kanvas untuk mengubah gambar, posisi, gaya visual, maupun aksi suaranya.
              </p>
            </div>
          ) : (
            <>
              {/* Header Inspector */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                <input
                  type="text"
                  value={selectedElement.name}
                  onChange={(e) =>
                    commitElementUpdate(selectedElement.id, { name: e.target.value })
                  }
                  className="bg-slate-900 border border-slate-700 focus:border-yellow-400 rounded-lg px-2.5 py-1 text-xs font-bold text-white w-44 outline-none"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Duplikat"
                    onClick={() => duplicateElement(selectedElement.id)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Hapus"
                    onClick={() => deleteElement(selectedElement.id)}
                    className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub-Tab Inspector */}
              <div className="grid grid-cols-3 border-b border-slate-800 p-1 gap-1 bg-slate-950/40 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRightTab('content')}
                  className={`py-2 rounded-lg transition ${
                    rightTab === 'content'
                      ? 'bg-slate-800 text-yellow-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Konten & UI
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('style')}
                  className={`py-2 rounded-lg transition ${
                    rightTab === 'style'
                      ? 'bg-slate-800 text-yellow-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Gaya & Posisi
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('action')}
                  className={`py-2 rounded-lg transition ${
                    rightTab === 'action'
                      ? 'bg-slate-800 text-yellow-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Aksi & Audio
                </button>
              </div>

              {/* Isi Panel Inspector */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* TAB INSPECTOR 1: KONTEN & GAMBAR TOMBOL */}
                {rightTab === 'content' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Teks Label Tombol / Konten
                      </label>
                      <textarea
                        rows={2}
                        value={selectedElement.label}
                        onChange={(e) =>
                          commitElementUpdate(selectedElement.id, {
                            label: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 focus:border-yellow-400 rounded-xl p-2.5 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Posisi Label Teks terhadap Gambar
                      </label>
                      <select
                        value={selectedElement.style.textPosition}
                        onChange={(e) =>
                          commitElementUpdate(selectedElement.id, {
                            style: {
                              ...selectedElement.style,
                              textPosition: e.target.value as any,
                            },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="bottom">Di Bawah Gambar</option>
                        <option value="overlay">Tengah Menimpa Gambar (Overlay)</option>
                        <option value="hidden">Sembunyikan Teks (Hanya Gambar)</option>
                      </select>
                    </div>

                    {(selectedElement.type === 'image-button' ||
                      selectedElement.type === 'image') && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <label className="block text-slate-400 font-semibold">
                          Gambar Tombol (Upload atau URL)
                        </label>
                        {selectedElement.imageUrl && (
                          <img
                            src={selectedElement.imageUrl}
                            alt="Preview"
                            className="w-full h-28 object-contain bg-slate-950 rounded-xl border border-slate-800 p-1"
                          />
                        )}
                        <input
                          type="text"
                          value={selectedElement.imageUrl || ''}
                          onChange={(e) =>
                            commitElementUpdate(selectedElement.id, {
                              imageUrl: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                        <label className="block w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-yellow-400 font-bold text-center rounded-xl cursor-pointer border border-yellow-400/30 transition">
                          <span>Unggah File Gambar Baru</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'imageUrl')}
                            className="hidden"
                          />
                        </label>

                        <div className="pt-2">
                          <label className="block text-slate-400 font-semibold mb-1">
                            Mode Pemotongan Gambar
                          </label>
                          <select
                            value={selectedElement.style.objectFit}
                            onChange={(e) =>
                              commitElementUpdate(selectedElement.id, {
                                style: {
                                  ...selectedElement.style,
                                  objectFit: e.target.value as any,
                                },
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                          >
                            <option value="cover">Penuh Proporsional (Cover)</option>
                            <option value="contain">Utuh Tanpa Terpotong (Contain)</option>
                            <option value="fill">Rentangkan Penuh (Fill)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB INSPECTOR 2: GAYA VISUAL & KOORDINAT PERSENTASE PRESISI */}
                {rightTab === 'style' && (
                  <div className="space-y-4">
                    {/* Koordinat Persentase Responsif */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-2">
                        Posisi & Ukuran Responsif (%)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400">Posisi X (%)</span>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedElement.x}
                            onChange={(e) =>
                              commitElementUpdate(selectedElement.id, {
                                x: Number(e.target.value),
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Posisi Y (%)</span>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedElement.y}
                            onChange={(e) =>
                              commitElementUpdate(selectedElement.id, {
                                y: Number(e.target.value),
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Lebar (%)</span>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedElement.width}
                            onChange={(e) =>
                              commitElementUpdate(selectedElement.id, {
                                width: Math.max(4, Number(e.target.value)),
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Tinggi (%)</span>
                          <input
                            type="number"
                            step="0.5"
                            value={selectedElement.height}
                            onChange={(e) =>
                              commitElementUpdate(selectedElement.id, {
                                height: Math.max(4, Number(e.target.value)),
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Warna Latar, Warna Teks & Border */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <div>
                        <label className="block text-slate-400 mb-1">Warna Latar</label>
                        <input
                          type="color"
                          value={
                            selectedElement.style.backgroundColor.startsWith('#')
                              ? selectedElement.style.backgroundColor
                              : '#1E293B'
                          }
                          onChange={(e) =>
                            commitElementUpdate(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                backgroundColor: e.target.value,
                              },
                            })
                          }
                          className="w-full h-9 rounded-lg cursor-pointer bg-slate-900 border border-slate-700 p-1"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Warna Teks</label>
                        <input
                          type="color"
                          value={selectedElement.style.textColor}
                          onChange={(e) =>
                            commitElementUpdate(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                textColor: e.target.value,
                              },
                            })
                          }
                          className="w-full h-9 rounded-lg cursor-pointer bg-slate-900 border border-slate-700 p-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Ukuran Font (px)
                        </label>
                        <input
                          type="number"
                          value={selectedElement.style.fontSize}
                          onChange={(e) =>
                            commitElementUpdate(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                fontSize: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Lengkungan Sudut
                        </label>
                        <input
                          type="number"
                          value={selectedElement.style.borderRadius}
                          onChange={(e) =>
                            commitElementUpdate(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                borderRadius: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        Animasi Saat Disentuh (Hover Effect)
                      </label>
                      <select
                        value={selectedElement.style.hoverEffect}
                        onChange={(e) =>
                          commitElementUpdate(selectedElement.id, {
                            style: {
                              ...selectedElement.style,
                              hoverEffect: e.target.value as any,
                            },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="scale">Membesar Halus (Zoom Scale)</option>
                        <option value="lift">Melayang Naik (Lift Up)</option>
                        <option value="glow">Bersinar Emas (Golden Glow)</option>
                        <option value="pulse">Berdenyut (Pulse)</option>
                        <option value="none">Tanpa Efek</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* TAB INSPECTOR 3: AKSI INTERAKTIF & SUARA KLIK */}
                {rightTab === 'action' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Aksi Saat Tombol Diklik Pengguna
                      </label>
                      <select
                        value={selectedElement.action.type}
                        onChange={(e) =>
                          commitElementUpdate(selectedElement.id, {
                            action: {
                              ...selectedElement.action,
                              type: e.target.value as any,
                            },
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="none">Hanya Efek Suara / Visual</option>
                        <option value="goto-slide">Pindah ke Slide Tertentu</option>
                        <option value="open-popup">Buka Pop-up Materi / Info</option>
                        <option value="play-audio">Putar Narasi / Audio Khusus</option>
                        <option value="external-url">Buka Tautan Web Eksternal</option>
                      </select>
                    </div>

                    {/* Opsi Pindah Slide */}
                    {selectedElement.action.type === 'goto-slide' && (
                      <div>
                        <label className="block text-slate-400 mb-1">
                          Pilih Slide Tujuan
                        </label>
                        <select
                          value={selectedElement.action.targetSlideIndex || 0}
                          onChange={(e) =>
                            commitElementUpdate(selectedElement.id, {
                              action: {
                                ...selectedElement.action,
                                targetSlideIndex: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        >
                          {content.slides.map((s, idx) => (
                            <option key={s.id} value={idx}>
                              Slide {idx + 1} - {s.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Opsi Buka Pop-up Materi */}
                    {selectedElement.action.type === 'open-popup' && (
                      <div className="space-y-2">
                        <label className="block text-slate-400">Judul Pop-up</label>
                        <input
                          type="text"
                          value={selectedElement.action.popupTitle || ''}
                          onChange={(e) =>
                            commitElementUpdate(selectedElement.id, {
                              action: {
                                ...selectedElement.action,
                                popupTitle: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                        <label className="block text-slate-400">Isi Penjelasan Materi</label>
                        <textarea
                          rows={4}
                          value={selectedElement.action.popupContent || ''}
                          onChange={(e) =>
                            commitElementUpdate(selectedElement.id, {
                              action: {
                                ...selectedElement.action,
                                popupContent: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                        />
                      </div>
                    )}

                    {/* Pengaturan Suara / Efek Audio Tombol */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <label className="block text-slate-400 font-semibold">
                        Efek Suara / Audio Narasi Saat Diklik
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={selectedElement.audioUrl || ''}
                          onChange={(e) =>
                            commitElementUpdate(selectedElement.id, {
                              audioUrl: e.target.value,
                            })
                          }
                          placeholder="URL MP3/WAV..."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        />
                        {selectedElement.audioUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              const a = new Audio(selectedElement.audioUrl);
                              a.play();
                            }}
                            title="Tes Putar Audio"
                            className="px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <label className="block w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-center rounded-xl cursor-pointer border border-emerald-400/30 transition">
                        <span>Unggah File Suara (MP3/WAV)</span>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleFileUpload(e, 'audioUrl')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};