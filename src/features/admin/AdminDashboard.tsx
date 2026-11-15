import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useContent } from '../../context/ContentContext';
import {
  SlideContentItem,
  QuizQuestionItem,
  QuizChoiceItem,
} from '../../data/defaultContent';
import {
  getConfiguredAdminPin,
  verifyAdminPin,
  isAdminRouteActive,
  isSlideHidden,
  addSlideItem,
  reorderSlideItem,
  toggleSlideVisibility,
  deleteSlideItem,
  addSlideInstruction,
  updateSlideInstruction,
  removeSlideInstruction,
  updateSlideTextBlockLines,
  addQuizQuestionItem,
  reorderQuizQuestionItem,
  toggleQuizQuestionVisibility,
  deleteQuizQuestionItem,
  addDragDropStatement,
  updateDragDropStatement,
  removeDragDropStatement,
  reorderDragDropStatement,
  exportContentToJsonString,
  parseAndValidateImportedJson,
} from './adminHelpers';
import { ensureAdminStylesMounted } from './adminStyles';
import { LivePreviewPane } from './LivePreviewPane';

type AdminTab = 'slides' | 'quiz' | 'media' | 'meta' | 'backup';

export const AdminDashboard: React.FC = () => {
  const {
    content,
    storageSource,
    isSyncing,
    updateContent,
    updateSlideContent,
    updateQuizQuestion,
    updateSvgText,
    updateAudioUrl,
    updateImageUrl,
    saveContentToCloud,
    uploadMediaToCloud,
    resetContent,
  } = useContent();

  const [isOpen, setIsOpen] = useState<boolean>(() => isAdminRouteActive());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('slides');
  const [showSplitPreview, setShowSplitPreview] = useState<boolean>(true);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // State Editor Slide
  const [selectedSlideId, setSelectedSlideId] = useState<string>(
    () => content.slideOrder[0] || '5dLAzY4SKGI'
  );
  const [slideSearch, setSlideSearch] = useState<string>('');
  const [newSlideTitle, setNewSlideTitle] = useState<string>('');
  const [newInstructionText, setNewInstructionText] = useState<string>('');

  // State Editor Kuis & Game
  const [selectedQuizSlideId, setSelectedQuizSlideId] = useState<string>(
    () => content.quizzes.kuisBudaya.questions[0]?.slideId || '6oOWqUyP2WL'
  );
  const [newQuizQuestionText, setNewQuizQuestionText] = useState<string>('');
  const [newDragDropText, setNewDragDropText] = useState<string>('');

  // State Pengelola Audio & Media
  const [mediaSubTab, setMediaSubTab] = useState<'audio' | 'image' | 'video'>(
    'audio'
  );
  const [mediaSearch, setMediaSearch] = useState<string>('');
  const [selectedAudioAssetId, setSelectedAudioAssetId] = useState<number>(1);
  const [selectedImageAssetId, setSelectedImageAssetId] = useState<number>(38);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [playingAudioLabel, setPlayingAudioLabel] = useState<string>('');
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // State Meta & Teks SVG
  const [svgSearch, setSvgSearch] = useState<string>('');

  // State Ekspor/Impor Backup JSON
  const [importJsonText, setImportJsonText] = useState<string>('');

  // Sinkronkan visibilitas container #starla-react-root agar player utama 100% utuh saat Admin ditutup
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const rootEl = document.getElementById('starla-react-root');
    if (isOpen) {
      ensureAdminStylesMounted();
      if (rootEl) {
        rootEl.style.display = 'block';
        rootEl.removeAttribute('aria-hidden');
      }
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioUrl(null);
      if (rootEl) {
        rootEl.style.display = 'none';
        rootEl.setAttribute('aria-hidden', 'true');
      }
    }
  }, [isOpen]);

  // Dengarkan perubahan URL (popstate / hashchange) dan pintasan tombol rahasia Ctrl + Shift + A
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      if (isAdminRouteActive()) {
        setIsOpen(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('keydown', handleKeyDown, true);

    const win = window as unknown as Record<string, unknown>;
    win.__STARLA_OPEN_ADMIN__ = () => setIsOpen(true);
    win.__STARLA_CLOSE_ADMIN__ = () => setIsOpen(false);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  const handleCloseAdmin = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== 'undefined' && window.history) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('mode');
        if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
          url.pathname = '/';
        }
        if (url.hash === '#admin' || url.hash === '#mode=admin') {
          url.hash = '';
        }
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      } catch {
        // Abaikan error URL di lingkungan terbatas
      }
    }
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(pinInput)) {
      setIsAuthenticated(true);
      setAuthError(null);
      setPinInput('');
    } else {
      setAuthError(
        'PIN Admin tidak sesuai. Gunakan PIN yang dikonfigurasi pada NEXT_PUBLIC_ADMIN_PIN (default pengembangan: 123456).'
      );
    }
  };

  // Fungsi Play Test Audio
  const handlePlayTestAudio = useCallback(
    (rawUrl: string, label: string) => {
      if (!rawUrl) return;
      const normalizedUrl =
        rawUrl.startsWith('http') ||
        rawUrl.startsWith('data:') ||
        rawUrl.startsWith('blob:') ||
        rawUrl.startsWith('/')
          ? rawUrl
          : `/${rawUrl}`;

      if (playingAudioUrl === rawUrl && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
        setPlayingAudioUrl(null);
        setPlayingAudioLabel('');
        return;
      }

      setPlayingAudioUrl(rawUrl);
      setPlayingAudioLabel(label);

      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = normalizedUrl;
        audioPlayerRef.current.load();
        audioPlayerRef.current.play().catch(() => {
          // Di browser headless tanpa interaksi, element audio tetap ter-load siap diputar
        });
      }
    },
    [playingAudioUrl]
  );

  // Handler Simpan & Publikasikan ke Cloud
  const handleSaveToCloud = async () => {
    const res = await saveContentToCloud(content);
    if (res.source === 'supabase') {
      setStatusBanner({
        type: 'success',
        message:
          'Berhasil disimpan & dipublikasikan ke Supabase Cloud (app_contents slug = main).',
      });
    } else {
      setStatusBanner({
        type: 'success',
        message:
          'Perubahan berhasil disimpan ke Penyimpanan Cadangan Lokal (Safe Fallback aktif karena Supabase belum dikonfigurasi).',
      });
    }
  };

  // Handler Reset ke Default Asli
  const handleResetToDefault = () => {
    resetContent();
    setStatusBanner({
      type: 'info',
      message:
        'Seluruh konten berhasil dikembalikan ke Default Asli (defaultContent).',
    });
  };

  // Handler Ekspor Backup JSON
  const handleExportJson = () => {
    const jsonStr = exportContentToJsonString(content);
    setImportJsonText(jsonStr);
    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `starla-budaya-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: teks JSON sudah ditampilkan di textarea Backup JSON
    }
    setStatusBanner({
      type: 'success',
      message:
        'Backup JSON berhasil diekspor dan disiapkan pada panel Ekspor/Impor Backup JSON.',
    });
  };

  // Handler Impor Backup JSON dari Teks
  const handleImportJsonString = (rawText: string) => {
    const result = parseAndValidateImportedJson(rawText);
    if (!result.valid || !result.content) {
      setStatusBanner({
        type: 'error',
        message: result.error || 'Format JSON tidak valid.',
      });
      return;
    }
    updateContent(result.content);
    setStatusBanner({
      type: 'success',
      message:
        'Backup JSON berhasil diimpor dan diterapkan langsung ke aplikasi.',
    });
  };

  // Handler Unggah File Media (Audio/Gambar) ke Supabase Storage `media-assets`
  const handleUploadMediaFile = async (
    file: File,
    targetType: 'audio-catalog' | 'image-catalog' | 'slide-bg' | 'slide-audio',
    targetAssetId?: number,
    targetSlideId?: string
  ) => {
    const res = await uploadMediaToCloud(file, file.name);
    if (!res.url) {
      setStatusBanner({
        type: 'error',
        message: res.error || 'Gagal mengunggah file media.',
      });
      return;
    }

    if (targetType === 'audio-catalog' && typeof targetAssetId === 'number') {
      updateAudioUrl(targetAssetId, res.url);
    } else if (
      targetType === 'image-catalog' &&
      typeof targetAssetId === 'number'
    ) {
      updateImageUrl(targetAssetId, res.url);
    } else if (targetType === 'slide-bg' && targetSlideId) {
      updateSlideContent(targetSlideId, { backgroundUrl: res.url });
    } else if (
      targetType === 'slide-audio' &&
      typeof targetAssetId === 'number' &&
      targetSlideId
    ) {
      updateAudioUrl(targetAssetId, res.url);
      const sl = content.slides[targetSlideId];
      if (sl) {
        updateSlideContent(targetSlideId, {
          audios: sl.audios.map((a) =>
            a.assetId === targetAssetId ? { ...a, url: res.url } : a
          ),
        });
      }
    }

    setStatusBanner({
      type: 'success',
      message: `File "${file.name}" berhasil diunggah (${res.source === 'supabase' ? 'Supabase Storage media-assets' : 'Penyimpanan Lokal Fallback'}).`,
    });
  };

  // Filter daftar slide
  const filteredSlideIds = useMemo(() => {
    const q = slideSearch.trim().toLowerCase();
    if (!q) return content.slideOrder;
    return content.slideOrder.filter((id) => {
      const sl = content.slides[id];
      if (!sl) return false;
      return (
        sl.id.toLowerCase().includes(q) ||
        sl.title.toLowerCase().includes(q) ||
        sl.instructions.some((line) => line.toLowerCase().includes(q))
      );
    });
  }, [content.slideOrder, content.slides, slideSearch]);

  const activeSlide: SlideContentItem | undefined =
    content.slides[selectedSlideId] ||
    content.slides[content.slideOrder[0]];

  const activeQuestion: QuizQuestionItem | undefined =
    content.quizzes.kuisBudaya.questions.find(
      (q) => q.slideId === selectedQuizSlideId
    ) || content.quizzes.kuisBudaya.questions[0];

  // Filter daftar Audio & Gambar
  const filteredAudioList = useMemo(() => {
    const list = Object.values(content.audioCatalog);
    const q = mediaSearch.trim().toLowerCase();
    if (!q) return list.slice(0, 60);
    return list
      .filter(
        (item) =>
          String(item.assetId).includes(q) ||
          item.url.toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [content.audioCatalog, mediaSearch]);

  const filteredImageList = useMemo(() => {
    const list = Object.values(content.imageCatalog);
    const q = mediaSearch.trim().toLowerCase();
    if (!q) return list.slice(0, 60);
    return list
      .filter(
        (item) =>
          String(item.assetId).includes(q) ||
          item.url.toLowerCase().includes(q)
      )
      .slice(0, 60);
  }, [content.imageCatalog, mediaSearch]);

  // Filter CommandSet SVG
  const filteredCommandSets = useMemo(() => {
    const list = Object.values(content.svgTextCommandSets);
    const q = svgSearch.trim().toLowerCase();
    if (!q) return list.slice(0, 50);
    return list
      .filter(
        (cs) =>
          cs.commandSetId.toLowerCase().includes(q) ||
          cs.lines.some((line) => line.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [content.svgTextCommandSets, svgSearch]);

  if (!isOpen) {
    return null;
  }

  // ============================================================================
  // SCREEN 1: AUTENTIKASI PIN ADMIN
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <div
        className="starla-admin-portal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-auth-heading"
        data-testid="admin-pin-gate"
      >
        <header className="sa-topbar">
          <span className="sa-brand">STARLA BUDAYA Admin</span>
          <nav className="sa-topnav" aria-label="Status Keamanan">
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>
              Autentikasi PIN Diperlukan
            </span>
          </nav>
          <button
            type="button"
            className="sa-btn sa-btn-ghost"
            onClick={handleCloseAdmin}
          >
            Kembali ke Player
          </button>
        </header>

        <main className="sa-auth-wrap">
          <form className="sa-auth-box" onSubmit={handlePinSubmit}>
            <h1
              id="admin-auth-heading"
              style={{
                margin: '0 0 8px 0',
                fontSize: '22px',
                fontWeight: 700,
                color: '#F8FAFC',
              }}
            >
              Akses Admin Dashboard
            </h1>
            <p
              style={{
                margin: '0 0 20px 0',
                fontSize: '13px',
                color: '#94A3B8',
              }}
            >
              Masukkan PIN Keamanan Admin untuk mengelola slide pembelajaran,
              narasi audio, soal Kuis Budaya, dan sinkronisasi Supabase Cloud.
            </p>

            {authError && (
              <div
                role="alert"
                className="sa-banner is-error"
                data-testid="admin-pin-error"
              >
                <span>{authError}</span>
              </div>
            )}

            <div className="sa-field">
              <label htmlFor="admin-pin-input" className="sa-label">
                PIN Keamanan Admin
              </label>
              <input
                id="admin-pin-input"
                type="password"
                inputMode="numeric"
                autoFocus
                className="sa-input sa-tabular"
                placeholder="Masukkan PIN Admin (contoh: 123456)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
              />
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '12px',
                  color: '#64748B',
                }}
              >
                Mendukung variabel environment NEXT_PUBLIC_ADMIN_PIN (default
                pengembangan:{' '}
                <span className="sa-tabular">{getConfiguredAdminPin()}</span>)
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginTop: '24px',
              }}
            >
              <button
                type="button"
                className="sa-btn sa-btn-ghost"
                onClick={handleCloseAdmin}
              >
                Batal
              </button>
              <button
                type="submit"
                className="sa-btn sa-btn-primary"
                data-testid="admin-pin-submit"
              >
                Masuk ke Admin Dashboard
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  }

  // ============================================================================
  // SCREEN 2: WORKSPACE ADMIN DASHBOARD TERISOLASI
  // ============================================================================
  return (
    <div
      className="starla-admin-portal"
      data-testid="admin-dashboard-workspace"
    >
      {/* 1. Top Bar (3-Zone Contract: Brand — 5 Single-Line Nav Links — 1 Primary Action) */}
      <header className="sa-topbar">
        <button
          type="button"
          className="sa-brand"
          onClick={() => setActiveTab('slides')}
        >
          STARLA BUDAYA Admin
        </button>

        <nav className="sa-topnav" aria-label="Navigasi Modul Admin">
          <button
            type="button"
            className={`sa-navlink ${activeTab === 'slides' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('slides')}
          >
            Editor Slide
          </button>
          <button
            type="button"
            className={`sa-navlink ${activeTab === 'quiz' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            Kuis &amp; Game
          </button>
          <button
            type="button"
            className={`sa-navlink ${activeTab === 'media' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            Audio &amp; Media
          </button>
          <button
            type="button"
            className={`sa-navlink ${activeTab === 'meta' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('meta')}
          >
            Meta &amp; Teks SVG
          </button>
          <button
            type="button"
            className={`sa-navlink ${activeTab === 'backup' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            Backup JSON
          </button>
        </nav>

        <button
          type="button"
          className="sa-btn sa-btn-primary"
          disabled={isSyncing}
          onClick={handleSaveToCloud}
          data-testid="btn-save-cloud"
        >
          {isSyncing
            ? 'Menyimpan...'
            : 'Simpan & Publikasikan ke Cloud'}
        </button>
      </header>

      {/* 2. Sub-Toolbar untuk Utilitas Workspace */}
      <div className="sa-subtoolbar">
        <div className="sa-meta-line">
          <span>
            Sumber Penyimpanan:{' '}
            <strong style={{ color: '#F8FAFC' }}>
              {storageSource === 'supabase'
                ? 'Supabase Cloud'
                : storageSource === 'localStorage'
                  ? 'Penyimpanan Lokal (Fallback)'
                  : 'Default Asli'}
            </strong>
          </span>
          <span className="sa-meta-sep">·</span>
          <span className="sa-tabular">
            {content.slideOrder.length} Slide
          </span>
          <span className="sa-meta-sep">·</span>
          <span className="sa-tabular">
            {content.quizzes.kuisBudaya.questions.length} Soal Kuis Budaya
          </span>
          <span className="sa-meta-sep">·</span>
          <span className="sa-tabular">
            {Object.keys(content.audioCatalog).length} Audio MP3
          </span>
        </div>

        <div className="sa-toolbar-actions">
          <button
            type="button"
            className="sa-btn sa-btn-sm"
            onClick={() => setShowSplitPreview((prev) => !prev)}
          >
            {showSplitPreview
              ? 'Sembunyikan Live Preview'
              : 'Tampilkan Split-Screen Preview'}
          </button>
          <button
            type="button"
            className="sa-btn sa-btn-sm"
            onClick={() => {
              setActiveTab('backup');
              handleExportJson();
            }}
            data-testid="btn-export-import-json"
          >
            Ekspor/Impor Backup JSON
          </button>
          <button
            type="button"
            className="sa-btn sa-btn-sm sa-btn-danger"
            onClick={handleResetToDefault}
            data-testid="btn-reset-default"
          >
            Reset ke Default Asli
          </button>
          <button
            type="button"
            className="sa-btn sa-btn-sm sa-btn-ghost"
            onClick={handleCloseAdmin}
          >
            Kembali ke Player
          </button>
        </div>
      </div>

      {/* Audio Element Tersembunyi untuk Fitur "Play Test Audio" */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => {
          setPlayingAudioUrl(null);
          setPlayingAudioLabel('');
        }}
        style={{ display: 'none' }}
      />

      {/* Bar Pemutar Uji Suara jika sedang memutar audio */}
      {playingAudioUrl && (
        <div
          style={{
            padding: '8px 24px',
            backgroundColor: '#1E293B',
            borderBottom: '1px solid #F59E0B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '12px',
          }}
          data-testid="active-audio-test-bar"
        >
          <div>
            <strong style={{ color: '#FBBF24' }}>
              Sedang Memutar Uji Audio:
            </strong>{' '}
            <span>{playingAudioLabel}</span>{' '}
            <span className="sa-tabular" style={{ color: '#94A3B8' }}>
              ({playingAudioUrl})
            </span>
          </div>
          <button
            type="button"
            className="sa-btn sa-btn-sm sa-btn-danger"
            onClick={() => {
              if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
              }
              setPlayingAudioUrl(null);
              setPlayingAudioLabel('');
            }}
          >
            Hentikan Uji Audio
          </button>
        </div>
      )}

      {/* 3. Main Split-Screen Workspace */}
      <main
        className={`sa-workspace ${showSplitPreview ? '' : 'is-editor-only'}`}
      >
        {/* LEFT PANE: MODUL EDITOR */}
        <section className="sa-editor-pane" aria-label="Area Editor Konten">
          {/* Status Banner Global */}
          {statusBanner && (
            <div style={{ padding: '14px 24px 0 24px' }}>
              <div
                role="status"
                className={`sa-banner ${
                  statusBanner.type === 'success'
                    ? 'is-success'
                    : statusBanner.type === 'error'
                      ? 'is-error'
                      : ''
                }`}
                data-testid="admin-status-banner"
              >
                <span>{statusBanner.message}</span>
                <button
                  type="button"
                  className="sa-btn sa-btn-sm sa-btn-ghost"
                  onClick={() => setStatusBanner(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 1: EDITOR VISUAL PER SLIDE & MANAJEMEN MODUL DINAMIS         */}
          {/* ================================================================ */}
          {activeTab === 'slides' && (
            <div className="sa-master-detail">
              {/* Sidebar Daftar Slide */}
              <div className="sa-sidebar-list">
                <div className="sa-sidebar-header">
                  <label htmlFor="slide-search-input" className="sa-label" style={{ marginBottom: 0 }}>
                    Cari Slide ({filteredSlideIds.length})
                  </label>
                  <input
                    id="slide-search-input"
                    type="search"
                    className="sa-input"
                    placeholder="Cari judul atau ID slide..."
                    value={slideSearch}
                    onChange={(e) => setSlideSearch(e.target.value)}
                  />
                  {/* Form Tambah Slide Baru */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      aria-label="Judul Slide Baru"
                      className="sa-input"
                      placeholder="Judul slide baru..."
                      value={newSlideTitle}
                      onChange={(e) => setNewSlideTitle(e.target.value)}
                    />
                    <button
                      type="button"
                      className="sa-btn sa-btn-sm sa-btn-primary"
                      onClick={() => {
                        const { nextSchema, createdSlideId } = addSlideItem(
                          content,
                          {
                            title: newSlideTitle || 'Slide Materi Baru',
                            instructions: [
                              newSlideTitle || 'Slide Materi Baru',
                            ],
                          }
                        );
                        updateContent(nextSchema);
                        setSelectedSlideId(createdSlideId);
                        setNewSlideTitle('');
                        setStatusBanner({
                          type: 'success',
                          message: `Slide baru "${newSlideTitle || 'Slide Materi Baru'}" berhasil ditambahkan.`,
                        });
                      }}
                      data-testid="btn-add-slide"
                    >
                      + Slide
                    </button>
                  </div>
                </div>

                <div className="sa-sidebar-scroll" role="list">
                  {filteredSlideIds.map((slideId) => {
                    const sl = content.slides[slideId];
                    if (!sl) return null;
                    const hidden = isSlideHidden(content, slideId);
                    const isSelected = sl.id === activeSlide?.id;
                    return (
                      <button
                        key={slideId}
                        type="button"
                        role="listitem"
                        className={`sa-list-item ${
                          isSelected ? 'is-selected' : ''
                        } ${hidden ? 'is-hidden-item' : ''}`}
                        onClick={() => setSelectedSlideId(slideId)}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            <span className="sa-tabular">
                              #{sl.slideNumber}
                            </span>{' '}
                            {sl.title}
                          </div>
                          <div
                            className="sa-tabular"
                            style={{ fontSize: '11px', color: '#94A3B8' }}
                          >
                            {sl.id}
                            {hidden ? ' · Disembunyikan' : ''}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Area Detail Editor Visual Slide */}
              <div className="sa-detail-scroll">
                {activeSlide ? (
                  <>
                    <div className="sa-section">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap',
                          marginBottom: '14px',
                        }}
                      >
                        <div>
                          <h2 className="sa-section-title">
                            Slide #{activeSlide.slideNumber}: {activeSlide.title}
                          </h2>
                          <div className="sa-meta-line">
                            <span className="sa-tabular">
                              ID: {activeSlide.id}
                            </span>
                            <span className="sa-meta-sep">·</span>
                            <span>
                              Status:{' '}
                              {isSlideHidden(content, activeSlide.id)
                                ? 'Disembunyikan'
                                : 'Ditampilkan'}
                            </span>
                          </div>
                        </div>

                        {/* Kontrol Manajemen Modul Dinamis (Urutan & Visibilitas) */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="sa-btn sa-btn-sm"
                            onClick={() =>
                              updateContent((prev) =>
                                reorderSlideItem(prev, activeSlide.id, 'up')
                              )
                            }
                            aria-label="Geser Slide Naik"
                          >
                            Geser Naik
                          </button>
                          <button
                            type="button"
                            className="sa-btn sa-btn-sm"
                            onClick={() =>
                              updateContent((prev) =>
                                reorderSlideItem(prev, activeSlide.id, 'down')
                              )
                            }
                            aria-label="Geser Slide Turun"
                          >
                            Geser Turun
                          </button>
                          <button
                            type="button"
                            className="sa-btn sa-btn-sm"
                            onClick={() =>
                              updateContent((prev) =>
                                toggleSlideVisibility(prev, activeSlide.id)
                              )
                            }
                            data-testid="btn-toggle-slide-visibility"
                          >
                            {isSlideHidden(content, activeSlide.id)
                              ? 'Tampilkan Slide'
                              : 'Sembunyikan Slide'}
                          </button>
                          <button
                            type="button"
                            className="sa-btn sa-btn-sm sa-btn-danger"
                            onClick={() => {
                              updateContent((prev) =>
                                deleteSlideItem(prev, activeSlide.id)
                              );
                            }}
                          >
                            Hapus / Nonaktifkan
                          </button>
                        </div>
                      </div>

                      <div className="sa-grid-2">
                        <div className="sa-field">
                          <label
                            htmlFor="slide-title-input"
                            className="sa-label"
                          >
                            Judul Slide
                          </label>
                          <input
                            id="slide-title-input"
                            type="text"
                            className="sa-input"
                            value={activeSlide.title}
                            onChange={(e) =>
                              updateSlideContent(activeSlide.id, {
                                title: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="sa-field">
                          <label htmlFor="slide-bg-input" className="sa-label">
                            URL Gambar Latar Slide
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              id="slide-bg-input"
                              type="text"
                              className="sa-input sa-tabular"
                              value={activeSlide.backgroundUrl || ''}
                              placeholder="mobile/Slide5WPRbcJDCqY.jpg"
                              onChange={(e) =>
                                updateSlideContent(activeSlide.id, {
                                  backgroundUrl: e.target.value || null,
                                })
                              }
                            />
                            <label
                              className="sa-btn sa-btn-sm"
                              style={{ cursor: 'pointer' }}
                            >
                              Unggah Latar
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    void handleUploadMediaFile(
                                      f,
                                      'slide-bg',
                                      undefined,
                                      activeSlide.id
                                    );
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bagian Teks & Instruksi Slide */}
                    <div className="sa-section">
                      <h3 className="sa-section-title">
                        Instruksi &amp; Narasi Teks Slide (
                        <span className="sa-tabular">
                          {activeSlide.instructions.length}
                        </span>
                        )
                      </h3>
                      <p className="sa-section-desc">
                        Ubah baris instruksi atau tambahkan poin panduan baru
                        untuk murid pada slide ini.
                      </p>

                      {activeSlide.instructions.map((inst, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '8px',
                          }}
                        >
                          <input
                            type="text"
                            aria-label={`Instruksi baris ${idx + 1}`}
                            className="sa-input"
                            value={inst}
                            onChange={(e) =>
                              updateContent((prev) =>
                                updateSlideInstruction(
                                  prev,
                                  activeSlide.id,
                                  idx,
                                  e.target.value
                                )
                              )
                            }
                          />
                          <button
                            type="button"
                            className="sa-btn sa-btn-sm sa-btn-danger"
                            onClick={() =>
                              updateContent((prev) =>
                                removeSlideInstruction(
                                  prev,
                                  activeSlide.id,
                                  idx
                                )
                              )
                            }
                          >
                            Hapus
                          </button>
                        </div>
                      ))}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <input
                          type="text"
                          aria-label="Tambah baris instruksi baru"
                          className="sa-input"
                          placeholder="Ketik baris instruksi atau teks baru..."
                          value={newInstructionText}
                          onChange={(e) =>
                            setNewInstructionText(e.target.value)
                          }
                        />
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm sa-btn-primary"
                          onClick={() => {
                            if (!newInstructionText.trim()) return;
                            updateContent((prev) =>
                              addSlideInstruction(
                                prev,
                                activeSlide.id,
                                newInstructionText
                              )
                            );
                            setNewInstructionText('');
                          }}
                        >
                          + Tambah Instruksi
                        </button>
                      </div>
                    </div>

                    {/* Bagian Blok Teks Vektor (SVG CommandSet) pada Slide */}
                    <div className="sa-section">
                      <h3 className="sa-section-title">
                        Layer Teks Vektor Slide (
                        <span className="sa-tabular">
                          {activeSlide.texts.length}
                        </span>
                        )
                      </h3>
                      <p className="sa-section-desc">
                        Setiap blok teks terhubung langsung ke CommandSet SVG
                        Storyline (`paths.js`). Satu baris per &lt;tspan&gt;.
                      </p>

                      {activeSlide.texts.length === 0 ? (
                        <div style={{ color: '#94A3B8', fontSize: '13px' }}>
                          Slide ini menggunakan gambar latar penuh tanpa layer
                          teks SVG terpisah.
                        </div>
                      ) : (
                        activeSlide.texts.map((tb, tIdx) => (
                          <div key={tb.uniqueId || tIdx} className="sa-row-card">
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '6px',
                                fontSize: '12px',
                                color: '#94A3B8',
                              }}
                            >
                              <span className="sa-tabular">
                                Objek: {tb.objectId} ·{' '}
                                {tb.commandSetId || 'Tanpa CommandSet'}
                              </span>
                            </div>
                            <textarea
                              aria-label={`Teks SVG ${tb.commandSetId || tIdx}`}
                              className="sa-textarea"
                              value={tb.lines.join('\n')}
                              onChange={(e) => {
                                const nextLines = e.target.value.split('\n');
                                updateContent((prev) =>
                                  updateSlideTextBlockLines(
                                    prev,
                                    activeSlide.id,
                                    tIdx,
                                    nextLines
                                  )
                                );
                              }}
                            />
                          </div>
                        ))
                      )}
                    </div>

                    {/* Bagian Audio Slide */}
                    <div className="sa-section">
                      <h3 className="sa-section-title">
                        Audio &amp; Narasi Slide (
                        <span className="sa-tabular">
                          {activeSlide.audios.length}
                        </span>
                        )
                      </h3>
                      <p className="sa-section-desc">
                        Uji suara narasi dengan tombol Play Test Audio atau ganti
                        file audio pada slide ini.
                      </p>

                      {activeSlide.audios.length === 0 ? (
                        <div style={{ color: '#94A3B8', fontSize: '13px' }}>
                          Tidak ada track audio terpisah pada slide ini.
                        </div>
                      ) : (
                        activeSlide.audios.map((aud, aIdx) => {
                          const currentUrl =
                            content.audioCatalog[aud.assetId]?.url || aud.url;
                          const isPlaying = playingAudioUrl === currentUrl;
                          return (
                            <div
                              key={`${aud.audioId}_${aIdx}`}
                              className="sa-row-card"
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                  marginBottom: '8px',
                                }}
                              >
                                <span
                                  className="sa-tabular"
                                  style={{ fontSize: '12px', color: '#CBD5E1' }}
                                >
                                  Audio Asset #{aud.assetId} · Durasi:{' '}
                                  {Math.round(aud.durationMs / 100) / 10} dtk
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="sa-btn sa-btn-sm"
                                    onClick={() =>
                                      handlePlayTestAudio(
                                        currentUrl,
                                        `Slide #${activeSlide.slideNumber} Audio #${aud.assetId}`
                                      )
                                    }
                                  >
                                    {isPlaying
                                      ? 'Hentikan Audio'
                                      : 'Play Test Audio'}
                                  </button>
                                  <label
                                    className="sa-btn sa-btn-sm sa-btn-primary"
                                    style={{ cursor: 'pointer' }}
                                  >
                                    Unggah Audio Baru
                                    <input
                                      type="file"
                                      accept="audio/*"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) {
                                          void handleUploadMediaFile(
                                            f,
                                            'slide-audio',
                                            aud.assetId,
                                            activeSlide.id
                                          );
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                              <input
                                type="text"
                                aria-label={`URL Audio Aset ${aud.assetId}`}
                                className="sa-input sa-tabular"
                                value={currentUrl}
                                onChange={(e) => {
                                  const nextUrl = e.target.value;
                                  updateAudioUrl(aud.assetId, nextUrl);
                                  updateSlideContent(activeSlide.id, {
                                    audios: activeSlide.audios.map((item) =>
                                      item.assetId === aud.assetId
                                        ? { ...item, url: nextUrl }
                                        : item
                                    ),
                                  });
                                }}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: EDITOR KUIS BUDAYA & GAME ANAK GARUDA                     */}
          {/* ================================================================ */}
          {activeTab === 'quiz' && (
            <div className="sa-master-detail">
              {/* Sidebar Daftar Soal Kuis Budaya */}
              <div className="sa-sidebar-list">
                <div className="sa-sidebar-header">
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>
                    Daftar Soal Kuis Budaya (
                    <span className="sa-tabular">
                      {content.quizzes.kuisBudaya.questions.length}
                    </span>
                    )
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      aria-label="Teks Soal Kuis Baru"
                      className="sa-input"
                      placeholder="Pertanyaan baru..."
                      value={newQuizQuestionText}
                      onChange={(e) => setNewQuizQuestionText(e.target.value)}
                    />
                    <button
                      type="button"
                      className="sa-btn sa-btn-sm sa-btn-primary"
                      onClick={() => {
                        const { nextSchema, createdQuestion } =
                          addQuizQuestionItem(content, {
                            questionText:
                              newQuizQuestionText ||
                              'Pertanyaan Baru Tentang Keberagaman Budaya',
                          });
                        updateContent(nextSchema);
                        setSelectedQuizSlideId(createdQuestion.slideId);
                        setNewQuizQuestionText('');
                        setStatusBanner({
                          type: 'success',
                          message: 'Soal Kuis Budaya baru berhasil ditambahkan.',
                        });
                      }}
                      data-testid="btn-add-quiz-question"
                    >
                      + Soal
                    </button>
                  </div>
                </div>

                <div className="sa-sidebar-scroll" role="list">
                  {content.quizzes.kuisBudaya.questions.map((q, idx) => {
                    const isSelected = q.slideId === activeQuestion?.slideId;
                    return (
                      <button
                        key={q.slideId}
                        type="button"
                        role="listitem"
                        className={`sa-list-item ${
                          isSelected ? 'is-selected' : ''
                        } ${q.hidden ? 'is-hidden-item' : ''}`}
                        onClick={() => setSelectedQuizSlideId(q.slideId)}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            <span className="sa-tabular">Soal #{idx + 1}:</span>{' '}
                            {q.questionText}
                          </div>
                          <div
                            className="sa-tabular"
                            style={{ fontSize: '11px', color: '#94A3B8' }}
                          >
                            Slide: {q.slideId} · {q.maxPoints} Poin
                            {q.hidden ? ' · Disembunyikan' : ''}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail Editor Soal Kuis & Game Anak Garuda */}
              <div className="sa-detail-scroll">
                {activeQuestion && (
                  <div className="sa-section">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                        marginBottom: '16px',
                      }}
                    >
                      <div>
                        <h2 className="sa-section-title">
                          Editor Soal Kuis Budaya ({activeQuestion.slideId})
                        </h2>
                        <div className="sa-meta-line">
                          <span className="sa-tabular">
                            Poin Maksimal: {activeQuestion.maxPoints}
                          </span>
                          <span className="sa-meta-sep">·</span>
                          <span>
                            Status:{' '}
                            {activeQuestion.hidden ? 'Disembunyikan' : 'Aktif'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm"
                          onClick={() =>
                            updateContent((prev) =>
                              reorderQuizQuestionItem(
                                prev,
                                activeQuestion.slideId,
                                'up'
                              )
                            )
                          }
                        >
                          Geser Naik
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm"
                          onClick={() =>
                            updateContent((prev) =>
                              reorderQuizQuestionItem(
                                prev,
                                activeQuestion.slideId,
                                'down'
                              )
                            )
                          }
                        >
                          Geser Turun
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm"
                          onClick={() =>
                            updateContent((prev) =>
                              toggleQuizQuestionVisibility(
                                prev,
                                activeQuestion.slideId
                              )
                            )
                          }
                        >
                          {activeQuestion.hidden
                            ? 'Tampilkan Soal'
                            : 'Sembunyikan Soal'}
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm sa-btn-danger"
                          onClick={() =>
                            updateContent((prev) =>
                              deleteQuizQuestionItem(
                                prev,
                                activeQuestion.slideId
                              )
                            )
                          }
                        >
                          Hapus / Nonaktifkan
                        </button>
                      </div>
                    </div>

                    <div className="sa-field">
                      <label
                        htmlFor="quiz-question-text"
                        className="sa-label"
                      >
                        Teks Pertanyaan Kuis
                      </label>
                      <textarea
                        id="quiz-question-text"
                        className="sa-textarea"
                        value={activeQuestion.questionText}
                        onChange={(e) =>
                          updateQuizQuestion(activeQuestion.slideId, {
                            questionText: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="sa-field">
                      <label className="sa-label">
                        Pilihan Jawaban &amp; Kunci Jawaban Benar
                      </label>
                      {activeQuestion.choices.map((ch, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        return (
                          <div key={ch.id} className="sa-row-card">
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                marginBottom: '8px',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  color: ch.isCorrect ? '#4ADE80' : '#CBD5E1',
                                }}
                              >
                                Pilihan {letter}{' '}
                                {ch.isCorrect ? '(Kunci Jawaban Benar)' : ''}
                              </span>
                              <button
                                type="button"
                                className={`sa-btn sa-btn-sm ${
                                  ch.isCorrect ? 'sa-btn-primary' : ''
                                }`}
                                onClick={() => {
                                  const nextChoices: QuizChoiceItem[] =
                                    activeQuestion.choices.map((item) => ({
                                      ...item,
                                      isCorrect: item.id === ch.id,
                                      points:
                                        item.id === ch.id
                                          ? activeQuestion.maxPoints
                                          : 0,
                                    }));
                                  updateQuizQuestion(activeQuestion.slideId, {
                                    choices: nextChoices,
                                    correctChoiceId: ch.id,
                                    correctAnswerText: ch.text,
                                  });
                                }}
                              >
                                {ch.isCorrect
                                  ? 'Kunci Jawaban Aktif'
                                  : 'Jadikan Kunci Jawaban'}
                              </button>
                            </div>
                            <input
                              type="text"
                              aria-label={`Teks Pilihan ${letter}`}
                              className="sa-input"
                              value={ch.text}
                              onChange={(e) => {
                                const nextText = e.target.value;
                                const nextChoices = activeQuestion.choices.map(
                                  (item) =>
                                    item.id === ch.id
                                      ? { ...item, text: nextText }
                                      : item
                                );
                                updateQuizQuestion(activeQuestion.slideId, {
                                  choices: nextChoices,
                                  correctAnswerText: ch.isCorrect
                                    ? nextText
                                    : activeQuestion.correctAnswerText,
                                });
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Editor Game Anak Garuda (Drag & Drop) */}
                <div className="sa-section">
                  <h3 className="sa-section-title">
                    Game Anak Garuda (Drag &amp; Drop — Slide{' '}
                    <span className="sa-tabular">
                      {content.quizzes.gameAnakGaruda.slideId}
                    </span>
                    )
                  </h3>
                  <p className="sa-section-desc">
                    Kelola judul, batas kelulusan, dan item pernyataan pada
                    interaksi Drag &amp; Drop Game Anak Garuda.
                  </p>

                  <div className="sa-grid-2" style={{ marginBottom: '14px' }}>
                    <div className="sa-field">
                      <label htmlFor="garuda-title-input" className="sa-label">
                        Judul Game Anak Garuda
                      </label>
                      <input
                        id="garuda-title-input"
                        type="text"
                        className="sa-input"
                        value={content.quizzes.gameAnakGaruda.title}
                        onChange={(e) =>
                          updateContent({
                            quizzes: {
                              ...content.quizzes,
                              gameAnakGaruda: {
                                ...content.quizzes.gameAnakGaruda,
                                title: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="sa-field">
                      <label htmlFor="garuda-pass-input" className="sa-label">
                        Persentase Lulus (%)
                      </label>
                      <input
                        id="garuda-pass-input"
                        type="number"
                        className="sa-input sa-tabular"
                        value={content.quizzes.gameAnakGaruda.passPercent}
                        onChange={(e) =>
                          updateContent({
                            quizzes: {
                              ...content.quizzes,
                              gameAnakGaruda: {
                                ...content.quizzes.gameAnakGaruda,
                                passPercent: Number(e.target.value) || 0,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  {content.quizzes.gameAnakGaruda.statements.map((st, idx) => (
                    <div
                      key={st.id}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        className="sa-tabular"
                        style={{
                          fontSize: '12px',
                          color: '#94A3B8',
                          minWidth: '28px',
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        aria-label={`Pernyataan Game Garuda ${idx + 1}`}
                        className="sa-input"
                        value={st.text}
                        onChange={(e) =>
                          updateContent((prev) =>
                            updateDragDropStatement(prev, st.id, e.target.value)
                          )
                        }
                      />
                      <button
                        type="button"
                        className="sa-btn sa-btn-sm"
                        onClick={() =>
                          updateContent((prev) =>
                            reorderDragDropStatement(prev, st.id, 'up')
                          )
                        }
                      >
                        Naik
                      </button>
                      <button
                        type="button"
                        className="sa-btn sa-btn-sm sa-btn-danger"
                        onClick={() =>
                          updateContent((prev) =>
                            removeDragDropStatement(prev, st.id)
                          )
                        }
                      >
                        Hapus
                      </button>
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <input
                      type="text"
                      aria-label="Pernyataan Game Anak Garuda Baru"
                      className="sa-input"
                      placeholder="Tambah item pernyataan budaya baru..."
                      value={newDragDropText}
                      onChange={(e) => setNewDragDropText(e.target.value)}
                    />
                    <button
                      type="button"
                      className="sa-btn sa-btn-sm sa-btn-primary"
                      onClick={() => {
                        if (!newDragDropText.trim()) return;
                        updateContent((prev) =>
                          addDragDropStatement(prev, newDragDropText)
                        );
                        setNewDragDropText('');
                      }}
                    >
                      + Tambah Item Game
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: PENGELOLA AUDIO & MEDIA (DENGAN TOMBOL PLAY TEST AUDIO)   */}
          {/* ================================================================ */}
          {activeTab === 'media' && (
            <div className="sa-detail-scroll">
              <div className="sa-section">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <h2 className="sa-section-title">
                      Pengelola Audio &amp; Media (Supabase Storage{' '}
                      <span className="sa-tabular">media-assets</span>)
                    </h2>
                    <p className="sa-section-desc" style={{ marginBottom: 0 }}>
                      Unggah file audio/gambar baru atau uji pemutaran suara
                      dengan tombol Play Test Audio sebelum disimpan.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className={`sa-btn sa-btn-sm ${
                        mediaSubTab === 'audio' ? 'sa-btn-primary' : ''
                      }`}
                      onClick={() => setMediaSubTab('audio')}
                    >
                      Katalog Audio (
                      <span className="sa-tabular">
                        {Object.keys(content.audioCatalog).length}
                      </span>
                      )
                    </button>
                    <button
                      type="button"
                      className={`sa-btn sa-btn-sm ${
                        mediaSubTab === 'image' ? 'sa-btn-primary' : ''
                      }`}
                      onClick={() => setMediaSubTab('image')}
                    >
                      Katalog Gambar (
                      <span className="sa-tabular">
                        {Object.keys(content.imageCatalog).length}
                      </span>
                      )
                    </button>
                    <button
                      type="button"
                      className={`sa-btn sa-btn-sm ${
                        mediaSubTab === 'video' ? 'sa-btn-primary' : ''
                      }`}
                      onClick={() => setMediaSubTab('video')}
                    >
                      Video Utama (2)
                    </button>
                  </div>
                </div>

                {/* Panel Unggah Cepat ke Supabase Storage / Fallback */}
                <div className="sa-row-card" style={{ marginBottom: '18px' }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '13px',
                      marginBottom: '10px',
                    }}
                  >
                    Unggah File Media Baru ke Cloud (`media-assets`)
                  </div>
                  <div className="sa-grid-2">
                    <div>
                      <label
                        htmlFor="upload-audio-asset-select"
                        className="sa-label"
                      >
                        Unggah &amp; Ganti Aset Audio MP3
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          id="upload-audio-asset-select"
                          type="number"
                          className="sa-input sa-tabular"
                          style={{ maxWidth: '110px' }}
                          value={selectedAudioAssetId}
                          onChange={(e) =>
                            setSelectedAudioAssetId(Number(e.target.value) || 1)
                          }
                          aria-label="ID Aset Audio Target"
                        />
                        <label
                          className="sa-btn sa-btn-primary"
                          style={{ cursor: 'pointer', flex: 1 }}
                        >
                          Pilih File Audio (.mp3 / .wav)
                          <input
                            type="file"
                            accept="audio/*"
                            style={{ display: 'none' }}
                            data-testid="input-upload-audio"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                void handleUploadMediaFile(
                                  f,
                                  'audio-catalog',
                                  selectedAudioAssetId
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="upload-image-asset-select"
                        className="sa-label"
                      >
                        Unggah &amp; Ganti Aset Gambar
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          id="upload-image-asset-select"
                          type="number"
                          className="sa-input sa-tabular"
                          style={{ maxWidth: '110px' }}
                          value={selectedImageAssetId}
                          onChange={(e) =>
                            setSelectedImageAssetId(
                              Number(e.target.value) || 38
                            )
                          }
                          aria-label="ID Aset Gambar Target"
                        />
                        <label
                          className="sa-btn"
                          style={{ cursor: 'pointer', flex: 1 }}
                        >
                          Pilih File Gambar (.png / .jpg / .gif)
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            data-testid="input-upload-image"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                void handleUploadMediaFile(
                                  f,
                                  'image-catalog',
                                  selectedImageAssetId
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {mediaSubTab !== 'video' && (
                  <div className="sa-field">
                    <label htmlFor="media-search-input" className="sa-label">
                      Cari Aset berdasarkan ID atau Nama File
                    </label>
                    <input
                      id="media-search-input"
                      type="search"
                      className="sa-input"
                      placeholder="Ketik ID aset atau nama file (contoh: 5UvoGh4XtC4)..."
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                    />
                  </div>
                )}

                {mediaSubTab === 'audio' && (
                  <div>
                    {filteredAudioList.map((aud) => {
                      const isPlaying = playingAudioUrl === aud.url;
                      return (
                        <div key={aud.assetId} className="sa-row-card">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              marginBottom: '8px',
                            }}
                          >
                            <div className="sa-meta-line">
                              <strong
                                className="sa-tabular"
                                style={{ color: '#F8FAFC' }}
                              >
                                Audio Asset #{aud.assetId}
                              </strong>
                              <span className="sa-meta-sep">·</span>
                              <span className="sa-tabular">
                                {Math.round(aud.durationMs / 100) / 10} detik
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                className={`sa-btn sa-btn-sm ${
                                  isPlaying ? 'sa-btn-danger' : 'sa-btn-primary'
                                }`}
                                onClick={() =>
                                  handlePlayTestAudio(
                                    aud.url,
                                    `Audio Asset #${aud.assetId}`
                                  )
                                }
                              >
                                {isPlaying
                                  ? 'Hentikan Audio'
                                  : 'Play Test Audio'}
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            aria-label={`URL Audio Katalog ${aud.assetId}`}
                            className="sa-input sa-tabular"
                            value={aud.url}
                            onChange={(e) =>
                              updateAudioUrl(aud.assetId, e.target.value)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {mediaSubTab === 'image' && (
                  <div>
                    {filteredImageList.map((img) => (
                      <div key={img.assetId} className="sa-row-card">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            marginBottom: '8px',
                          }}
                        >
                          <div className="sa-meta-line">
                            <strong
                              className="sa-tabular"
                              style={{ color: '#F8FAFC' }}
                            >
                              Image Asset #{img.assetId}
                            </strong>
                            <span className="sa-meta-sep">·</span>
                            <span className="sa-tabular">
                              {img.width}x{img.height}px
                            </span>
                          </div>
                        </div>
                        <input
                          type="text"
                          aria-label={`URL Gambar Katalog ${img.assetId}`}
                          className="sa-input sa-tabular"
                          value={img.url}
                          onChange={(e) =>
                            updateImageUrl(img.assetId, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                {mediaSubTab === 'video' && (
                  <div className="sa-grid-2">
                    <div className="sa-row-card">
                      <h3 className="sa-section-title">
                        Video Pembuka (Intro Thriller)
                      </h3>
                      <div className="sa-field">
                        <label htmlFor="video-intro-url" className="sa-label">
                          URL Video Intro
                        </label>
                        <input
                          id="video-intro-url"
                          type="text"
                          className="sa-input sa-tabular"
                          value={content.videos.intro.url}
                          onChange={(e) =>
                            updateContent({
                              videos: {
                                ...content.videos,
                                intro: {
                                  ...content.videos.intro,
                                  url: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="sa-row-card">
                      <h3 className="sa-section-title">
                        Video Sinema Budaya (`5gKzK4lbTf6`)
                      </h3>
                      <div className="sa-field">
                        <label htmlFor="video-sinema-url" className="sa-label">
                          URL Video Sinema
                        </label>
                        <input
                          id="video-sinema-url"
                          type="text"
                          className="sa-input sa-tabular"
                          value={content.videos.sinema.url}
                          onChange={(e) =>
                            updateContent({
                              videos: {
                                ...content.videos,
                                sinema: {
                                  ...content.videos.sinema,
                                  url: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: META APLIKASI, FRONT STAGE & 102 COMMANDSET TEKS SVG      */}
          {/* ================================================================ */}
          {activeTab === 'meta' && (
            <div className="sa-detail-scroll">
              <div className="sa-section">
                <h2 className="sa-section-title">
                  Identitas Aplikasi &amp; Panggung Depan (Front Stage)
                </h2>
                <p className="sa-section-desc">
                  Perubahan pada judul aplikasi dan tombol akses akan langsung
                  disinkronkan ke dokumen utama secara real-time.
                </p>

                <div className="sa-grid-2">
                  <div className="sa-field">
                    <label htmlFor="meta-app-title" className="sa-label">
                      Judul Aplikasi Utama
                    </label>
                    <input
                      id="meta-app-title"
                      type="text"
                      className="sa-input"
                      value={content.appMeta.title}
                      onChange={(e) =>
                        updateContent({
                          appMeta: {
                            ...content.appMeta,
                            title: e.target.value,
                            ogTitle: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="sa-field">
                    <label htmlFor="meta-access-label" className="sa-label">
                      Label Tombol Akses Front Stage
                    </label>
                    <input
                      id="meta-access-label"
                      type="text"
                      className="sa-input"
                      value={content.frontStage.accessButtonLabel}
                      onChange={(e) =>
                        updateContent({
                          frontStage: {
                            ...content.frontStage,
                            accessButtonLabel: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="sa-field">
                  <label htmlFor="meta-app-desc" className="sa-label">
                    Deskripsi Meta SEO
                  </label>
                  <textarea
                    id="meta-app-desc"
                    className="sa-textarea"
                    value={content.appMeta.description}
                    onChange={(e) =>
                      updateContent({
                        appMeta: {
                          ...content.appMeta,
                          description: e.target.value,
                          ogDescription: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="sa-section">
                <h2 className="sa-section-title">
                  Katalog Lengkap Teks Vektor SVG (`paths.js` —{' '}
                  <span className="sa-tabular">
                    {Object.keys(content.svgTextCommandSets).length}
                  </span>{' '}
                  CommandSet)
                </h2>
                <div className="sa-field">
                  <label htmlFor="svg-search-input" className="sa-label">
                    Cari CommandSet Teks SVG
                  </label>
                  <input
                    id="svg-search-input"
                    type="search"
                    className="sa-input"
                    placeholder="Cari teks (contoh: Selamat Datang, sekolah kamu, nama kamu)..."
                    value={svgSearch}
                    onChange={(e) => setSvgSearch(e.target.value)}
                  />
                </div>

                {filteredCommandSets.map((cs) => (
                  <div key={cs.commandSetId} className="sa-row-card">
                    <div
                      className="sa-tabular"
                      style={{
                        fontSize: '12px',
                        color: '#FBBF24',
                        marginBottom: '6px',
                      }}
                    >
                      {cs.commandSetId}
                    </div>
                    <textarea
                      aria-label={`Editor ${cs.commandSetId}`}
                      className="sa-textarea"
                      value={cs.lines.join('\n')}
                      onChange={(e) =>
                        updateSvgText(
                          cs.commandSetId,
                          e.target.value.split('\n')
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 5: EKSPOR / IMPOR BACKUP JSON                                */}
          {/* ================================================================ */}
          {activeTab === 'backup' && (
            <div className="sa-detail-scroll">
              <div className="sa-section">
                <h2 className="sa-section-title">
                  Ekspor &amp; Impor Backup JSON Konten
                </h2>
                <p className="sa-section-desc">
                  Unduh seluruh konfigurasi slide, kuis, dan katalog media
                  sebagai file JSON cadangan, atau pulihkan dari file JSON
                  backup.
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                    marginBottom: '18px',
                  }}
                >
                  <button
                    type="button"
                    className="sa-btn sa-btn-primary"
                    onClick={handleExportJson}
                  >
                    Unduh &amp; Tampilkan Backup JSON
                  </button>

                  <label
                    className="sa-btn"
                    style={{ cursor: 'pointer' }}
                  >
                    Pilih File Backup JSON (.json)
                    <input
                      type="file"
                      accept=".json,application/json"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const text =
                            typeof reader.result === 'string'
                              ? reader.result
                              : '';
                          setImportJsonText(text);
                          handleImportJsonString(text);
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    className="sa-btn"
                    onClick={() => handleImportJsonString(importJsonText)}
                    data-testid="btn-apply-import-json"
                  >
                    Terapkan JSON dari Kotak Teks
                  </button>
                </div>

                <div className="sa-field">
                  <label htmlFor="backup-json-textarea" className="sa-label">
                    Data JSON Backup (Dapat Diedit atau Ditempel Langsung)
                  </label>
                  <textarea
                    id="backup-json-textarea"
                    className="sa-textarea sa-tabular"
                    style={{ minHeight: '320px', fontSize: '12px' }}
                    placeholder="Klik 'Unduh & Tampilkan Backup JSON' atau tempel isi file backup JSON di sini..."
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT PANE: SPLIT-SCREEN LIVE PREVIEW */}
        {showSplitPreview && (
          <LivePreviewPane
            content={content}
            activeSlideId={selectedSlideId}
            activeQuizSlideId={selectedQuizSlideId}
            activeTab={activeTab}
            onSelectSlide={(id) => setSelectedSlideId(id)}
            onPlayTestAudio={handlePlayTestAudio}
            playingAudioUrl={playingAudioUrl}
          />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
