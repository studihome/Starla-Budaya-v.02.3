import React from 'react';
import { X, Link2, Save, Image as ImageIcon, Volume2 } from 'lucide-react';
import type { AdminTabKey, BadgeStatus } from './adminTypes';

export interface AdminCrudModalChoice {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AdminCrudModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (v: boolean) => void;
  activeTab: AdminTabKey;
  modalMode: 'add' | 'edit';
  formEmbedUrl: string;
  setFormEmbedUrl: (v: string) => void;
  formTitle: string;
  setFormTitle: (v: string) => void;
  formCategory: string;
  setFormCategory: (v: string) => void;
  formStatus: BadgeStatus;
  setFormStatus: (v: BadgeStatus) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formTargetGroup: 'Budaya yang Benar' | 'Budaya yang Salah';
  setFormTargetGroup: (v: 'Budaya yang Benar' | 'Budaya yang Salah') => void;
  formPoints: number;
  setFormPoints: (v: number) => void;
  formChoices: AdminCrudModalChoice[];
  setFormChoices: React.Dispatch<React.SetStateAction<AdminCrudModalChoice[]>>;
  formImageUrl: string;
  setFormImageUrl: (v: string) => void;
  formAudioUrl: string;
  setFormAudioUrl: (v: string) => void;
  handleImageFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAudioFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveModal: (e: React.FormEvent) => void;
}

export const AdminCrudModal: React.FC<AdminCrudModalProps> = React.memo(
  ({
    isModalOpen,
    setIsModalOpen,
    activeTab,
    modalMode,
    formEmbedUrl,
    setFormEmbedUrl,
    formTitle,
    setFormTitle,
    formCategory,
    setFormCategory,
    formStatus,
    setFormStatus,
    formDescription,
    setFormDescription,
    formTargetGroup,
    setFormTargetGroup,
    formPoints,
    setFormPoints,
    formChoices,
    setFormChoices,
    formImageUrl,
    setFormImageUrl,
    formAudioUrl,
    setFormAudioUrl,
    handleImageFileUpload,
    handleAudioFileUpload,
    handleSaveModal,
  }) => {
    if (!isModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
          <div className="px-6 py-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              {activeTab === 'tur360'
                ? modalMode === 'add'
                  ? 'Tambah Tautan Embed 360° Budaya & Slide Baru'
                  : 'Edit Tautan Embed 360° Budaya'
                : activeTab === 'gim'
                ? modalMode === 'add'
                  ? 'Tambah Soal Baru Game Anak Garuda (Slide 40)'
                  : 'Edit Soal Game Anak Garuda / Gim Budaya'
                : activeTab === 'analitik'
                ? modalMode === 'add'
                  ? 'Tambah Pengguna Baru'
                  : 'Edit Data Pengguna'
                : modalMode === 'add'
                ? 'Tambah Data Budaya Baru'
                : 'Edit Data Budaya'}
            </h3>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

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
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Menambahkan tautan 360° otomatis membuat halaman slide baru khusus untuk embed tautan ini yang dapat dipilih pada tab Desain Slide.
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
            <form
              onSubmit={handleSaveModal}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {activeTab === 'kuis'
                    ? 'Pertanyaan Kuis'
                    : activeTab === 'gim'
                    ? 'Teks Pernyataan Soal (pada Gelembung Burung Starla)'
                    : activeTab === 'analitik'
                    ? 'Nama Lengkap Pengguna / Siswa'
                    : 'Judul Materi Budaya'}
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Masukkan judul atau nama..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {activeTab === 'analitik'
                      ? 'Sekolah / Instansi'
                      : 'Topik / Kategori Budaya'}
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
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as BadgeStatus)
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Active">Active (Tampil)</option>
                    <option value="Unggulan">Unggulan</option>
                    <option value="Populer">Populer</option>
                    <option value="On Sale">On Sale</option>
                    <option value="Bouncing">Bouncing</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive (Sembunyikan)</option>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kunci Kategori Jawaban (Drag & Drop)
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
                        Budaya yang Benar (Sikap Menghargai)
                      </option>
                      <option value="Budaya yang Salah">
                        Budaya yang Salah (Sikap Tidak Menghargai)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bobot Poin Saat Jawaban Benar
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      step={5}
                      value={formPoints}
                      onChange={(e) =>
                        setFormPoints(Number(e.target.value) || 20)
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'kuis' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Pilihan Jawaban (Pilih 1 Kunci Jawaban Benar)
                  </label>
                  {formChoices.map((ch, idx) => (
                    <div key={ch.id} className="flex items-center gap-2">
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
    );
  }
);

export default AdminCrudModal;
