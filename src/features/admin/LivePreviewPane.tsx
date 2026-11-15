import React, { useState } from 'react';
import {
  ContentSchema,
  SlideContentItem,
  QuizQuestionItem,
} from '../../data/defaultContent';
import { isSlideHidden } from './adminHelpers';

export interface LivePreviewPaneProps {
  content: ContentSchema;
  activeSlideId: string;
  activeQuizSlideId: string;
  activeTab: string;
  onSelectSlide: (slideId: string) => void;
  onPlayTestAudio: (url: string, label: string) => void;
  playingAudioUrl: string | null;
}

export const LivePreviewPane: React.FC<LivePreviewPaneProps> = ({
  content,
  activeSlideId,
  activeQuizSlideId,
  activeTab,
  onSelectSlide,
  onPlayTestAudio,
  playingAudioUrl,
}) => {
  const [previewMode, setPreviewMode] = useState<'canvas' | 'player'>('canvas');
  const [iframeRefreshKey, setIframeRefreshKey] = useState<number>(1);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  // Tentukan slide yang sedang dipratinjau berdasarkan tab aktif
  const targetSlideId =
    activeTab === 'quiz' && content.slides[activeQuizSlideId]
      ? activeQuizSlideId
      : content.slides[activeSlideId]
        ? activeSlideId
        : content.slideOrder[0];

  const currentSlide: SlideContentItem | undefined =
    content.slides[targetSlideId];

  const activeQuizQuestion: QuizQuestionItem | null =
    currentSlide?.quizQuestion ||
    content.quizzes.kuisBudaya.questions.find(
      (q) => q.slideId === targetSlideId
    ) ||
    null;

  const slideHidden = currentSlide
    ? isSlideHidden(content, currentSlide.id)
    : false;

  const previewBgUrl =
    currentSlide?.backgroundUrl ||
    currentSlide?.images?.[0]?.url ||
    'mobile/Slide5WPRbcJDCqY.jpg';

  const visibleSlideCount = content.slideOrder.filter(
    (id) => !isSlideHidden(content, id)
  ).length;

  return (
    <aside
      className="sa-preview-pane"
      aria-label="Split-Screen Live Preview"
      data-testid="admin-live-preview-pane"
    >
      {/* Header Split-Screen Live Preview */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: '#0F172A',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#F8FAFC',
            }}
          >
            Split-Screen Live Preview
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>
            <span>{content.appMeta.title}</span>
            <span className="sa-meta-sep"> · </span>
            <span className="sa-tabular">
              {visibleSlideCount}/{content.slideOrder.length} Slide Aktif
            </span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#0B0F19',
            padding: '4px',
            borderRadius: '6px',
            border: '1px solid #1E293B',
          }}
        >
          <button
            type="button"
            onClick={() => setPreviewMode('canvas')}
            className={`sa-btn sa-btn-sm ${
              previewMode === 'canvas' ? 'sa-btn-primary' : 'sa-btn-ghost'
            }`}
            style={{ border: 'none' }}
          >
            Kanvas Visual
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('player')}
            className={`sa-btn sa-btn-sm ${
              previewMode === 'player' ? 'sa-btn-primary' : 'sa-btn-ghost'
            }`}
            style={{ border: 'none' }}
          >
            Player Interaktif
          </button>
        </div>
      </div>

      {/* Body Split-Screen Live Preview */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {previewMode === 'canvas' ? (
          <>
            {/* Selector cepat slide pada pratinjau */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <label
                htmlFor="preview-slide-selector"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#CBD5E1',
                  whiteSpace: 'nowrap',
                }}
              >
                Slide Pratinjau:
              </label>
              <select
                id="preview-slide-selector"
                aria-label="Pilih Slide Pratinjau"
                className="sa-select"
                value={targetSlideId}
                onChange={(e) => {
                  setSelectedChoiceId(null);
                  onSelectSlide(e.target.value);
                }}
              >
                {content.slideOrder.map((id, idx) => {
                  const sl = content.slides[id];
                  if (!sl) return null;
                  const hidden = isSlideHidden(content, id);
                  return (
                    <option key={id} value={id}>
                      #{idx + 1} — {sl.title} ({id})
                      {hidden ? ' [Disembunyikan]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Panggung Visual 16:9 */}
            {currentSlide ? (
              <div
                data-testid="live-preview-stage-card"
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #334155',
                  backgroundColor: '#060913',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {!imgErrorMap[previewBgUrl] ? (
                  <img
                    src={
                      previewBgUrl.startsWith('http') ||
                      previewBgUrl.startsWith('data:') ||
                      previewBgUrl.startsWith('/')
                        ? previewBgUrl
                        : `/${previewBgUrl}`
                    }
                    alt={currentSlide.title || 'Latar Slide'}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setImgErrorMap((prev) => ({
                        ...prev,
                        [previewBgUrl]: true,
                      }))
                    }
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: slideHidden ? 0.35 : 0.78,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'radial-gradient(circle at 50% 35%, #1E293B 0%, #060913 100%)',
                    }}
                  />
                )}

                {/* Scrim kontras terukur */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to top, rgba(6,9,19,0.94) 0%, rgba(6,9,19,0.55) 55%, rgba(6,9,19,0.75) 100%)',
                  }}
                />

                {/* Top Overlay Info */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#E2E8F0',
                  }}
                >
                  <div>
                    <span className="sa-tabular" style={{ fontWeight: 700 }}>
                      Slide #{currentSlide.slideNumber}
                    </span>
                    <span className="sa-meta-sep"> · </span>
                    <span className="sa-tabular">{currentSlide.id}</span>
                    <span className="sa-meta-sep"> · </span>
                    <span>
                      {slideHidden ? 'Status: Disembunyikan' : 'Status: Aktif'}
                    </span>
                  </div>
                  <div style={{ color: '#FBBF24', fontWeight: 600 }}>
                    Tombol Front Stage: {content.frontStage.accessButtonLabel}
                  </div>
                </div>

                {/* Konten Tengah & Bawah Slide */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <h3
                    data-testid="live-preview-slide-title"
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      textWrap: 'balance',
                    }}
                  >
                    {currentSlide.title}
                  </h3>

                  {currentSlide.instructions.length > 0 && (
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#E2E8F0',
                        maxHeight: '84px',
                        overflowY: 'auto',
                        display: ' flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      {currentSlide.instructions.slice(0, 4).map((line, i) => (
                        <div key={i} style={{ lineHeight: 1.4 }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Simulasi Interaktif Kuis Budaya jika slide merupakan soal kuis */}
            {activeQuizQuestion && (
              <div
                className="sa-row-card"
                data-testid="live-preview-quiz-simulator"
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#FBBF24',
                    marginBottom: '6px',
                  }}
                >
                  Uji Coba Interaktif Soal Kuis Budaya · Poin Maksimal:{' '}
                  <span className="sa-tabular">
                    {activeQuizQuestion.maxPoints}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    marginBottom: '12px',
                  }}
                >
                  {activeQuizQuestion.questionText}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {activeQuizQuestion.choices.map((ch, idx) => {
                    const isSelected = selectedChoiceId === ch.id;
                    const optionLetter = String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setSelectedChoiceId(ch.id)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: isSelected
                            ? ch.isCorrect
                              ? '1px solid #16A34A'
                              : '1px solid #DC2626'
                            : '1px solid #334155',
                          backgroundColor: isSelected
                            ? ch.isCorrect
                              ? 'rgba(22, 163, 74, 0.18)'
                              : 'rgba(220, 38, 38, 0.18)'
                            : '#0B0F19',
                          color: '#F8FAFC',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          fontFamily: 'inherit',
                          fontSize: '13px',
                        }}
                      >
                        <span>
                          <strong>{optionLetter}.</strong> {ch.text}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            color: ch.isCorrect ? '#4ADE80' : '#94A3B8',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ch.isCorrect ? 'Kunci Jawaban' : 'Opsi'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedChoiceId && (
                  <div
                    style={{
                      marginTop: '10px',
                      fontSize: '12px',
                      color: activeQuizQuestion.choices.find(
                        (c) => c.id === selectedChoiceId
                      )?.isCorrect
                        ? '#4ADE80'
                        : '#FCA5A5',
                    }}
                  >
                    {activeQuizQuestion.choices.find(
                      (c) => c.id === selectedChoiceId
                    )?.isCorrect
                      ? 'Umpan Balik: Jawaban Benar (+10 Poin)'
                      : 'Umpan Balik: Jawaban Belum Tepat (0 Poin)'}
                  </div>
                )}
              </div>
            )}

            {/* Daftar Audio & Teks SVG pada Slide Aktif */}
            {currentSlide && (
              <div className="sa-row-card">
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    marginBottom: '8px',
                  }}
                >
                  Ringkasan Elemen Slide #{currentSlide.slideNumber}
                </div>
                <div className="sa-meta-line" style={{ marginBottom: '12px' }}>
                  <span className="sa-tabular">
                    {currentSlide.texts.length} Layer Teks SVG
                  </span>
                  <span className="sa-meta-sep">·</span>
                  <span className="sa-tabular">
                    {currentSlide.audios.length} Track Audio
                  </span>
                  <span className="sa-meta-sep">·</span>
                  <span className="sa-tabular">
                    {currentSlide.images.length} Aset Gambar
                  </span>
                </div>

                {currentSlide.audios.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {currentSlide.audios.slice(0, 4).map((aud, i) => {
                      const resolvedUrl =
                        content.audioCatalog[aud.assetId]?.url || aud.url;
                      const isPlaying = playingAudioUrl === resolvedUrl;
                      return (
                        <div
                          key={`${aud.audioId}_${i}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#0B0F19',
                            border: '1px solid #1E293B',
                            fontSize: '12px',
                          }}
                        >
                          <span
                            className="sa-tabular"
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: '#CBD5E1',
                            }}
                          >
                            Aset #{aud.assetId}: {resolvedUrl}
                          </span>
                          <button
                            type="button"
                            className="sa-btn sa-btn-sm"
                            onClick={() =>
                              onPlayTestAudio(
                                resolvedUrl,
                                `Slide #${currentSlide.slideNumber} Audio #${aud.assetId}`
                              )
                            }
                          >
                            {isPlaying ? 'Hentikan Audio' : 'Play Test Audio'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Mode 2: Player Interaktif Langsung (Storyline 360 Engine) */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              height: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                Pratinjau langsung player utama dengan data konten terbaru:
              </span>
              <button
                type="button"
                className="sa-btn sa-btn-sm"
                onClick={() => setIframeRefreshKey((k) => k + 1)}
              >
                Muat Ulang Pratinjau Player
              </button>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: '360px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #334155',
                backgroundColor: '#060913',
              }}
            >
              <iframe
                key={iframeRefreshKey}
                src={`/?preview=1&t=${iframeRefreshKey}`}
                title="STARLA BUDAYA Live Player Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default LivePreviewPane;
