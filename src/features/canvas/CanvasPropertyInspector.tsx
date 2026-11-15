import React from 'react';
import { useContent } from '../../context/ContentContext';
import {
  CanvasElementItem,
  CanvasElementType,
} from '../../data/defaultContent';

export interface CanvasPropertyInspectorProps {
  slideId: string;
}

export const CanvasPropertyInspector: React.FC<
  CanvasPropertyInspectorProps
> = ({ slideId }) => {
  const {
    content,
    isCanvasEditMode,
    setIsCanvasEditMode,
    selectedCanvasItemId,
    setSelectedCanvasItemId,
    addCanvasElement,
    updateCanvasElement,
    deleteCanvasElement,
    duplicateCanvasElement,
    updateElementOverride,
    hideNativeElement,
    restoreNativeElement,
  } = useContent();

  const slide = content.slides[slideId];
  if (!slide) return null;

  const canvasElements = slide.canvasElements || [];
  const elementOverrides = slide.elementOverrides || {};
  const hiddenElementIds = slide.hiddenElementIds || [];

  const selectedCustomEl: CanvasElementItem | undefined = canvasElements.find(
    (el) => el.id === selectedCanvasItemId
  );

  const handleAddElement = (type: CanvasElementType) => {
    setIsCanvasEditMode(true);
    addCanvasElement(slideId, { type });
  };

  return (
    <div className="sa-section" data-testid="canvas-property-inspector">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '12px',
        }}
      >
        <div>
          <h3 className="sa-section-title">
            Visual Canvas Engine (WYSIWYG Builder)
          </h3>
          <p className="sa-section-desc" style={{ marginBottom: 0 }}>
            Tambahkan elemen interaktif baru atau geser/ubah ukuran langsung di
            panggung pratinjau dengan koordinat persentase (0–100%).
          </p>
        </div>

        <button
          type="button"
          data-testid="btn-toggle-canvas-edit-mode"
          className={`sa-btn sa-btn-sm ${
            isCanvasEditMode ? 'sa-btn-primary' : ''
          }`}
          onClick={() => setIsCanvasEditMode(!isCanvasEditMode)}
        >
          {isCanvasEditMode
            ? 'Mode Edit Kanvas: AKTIF'
            : 'Aktifkan Mode Edit Kanvas'}
        </button>
      </div>

      {/* Toolbar Tambah Elemen Kanvas Baru */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <button
          type="button"
          className="sa-btn sa-btn-sm sa-btn-primary"
          data-testid="btn-add-canvas-image-button"
          onClick={() => handleAddElement('image-button')}
        >
          + Tombol Bergambar
        </button>
        <button
          type="button"
          className="sa-btn sa-btn-sm"
          data-testid="btn-add-canvas-text"
          onClick={() => handleAddElement('text')}
        >
          + Teks Kanvas
        </button>
        <button
          type="button"
          className="sa-btn sa-btn-sm"
          data-testid="btn-add-canvas-image"
          onClick={() => handleAddElement('image')}
        >
          + Gambar Bebas
        </button>
        <button
          type="button"
          className="sa-btn sa-btn-sm"
          data-testid="btn-add-canvas-audio-hotspot"
          onClick={() => handleAddElement('audio-hotspot')}
        >
          + Hotspot Audio
        </button>
      </div>

      {/* Daftar Layer Elemen Kanvas Baru (`canvasElements`) */}
      <div className="sa-row-card">
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#F8FAFC',
            marginBottom: '8px',
          }}
        >
          Layer Elemen Kanvas Tambahan (
          <span className="sa-tabular">{canvasElements.length}</span>)
        </div>

        {canvasElements.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>
            Belum ada elemen tambahan pada slide ini. Klik salah satu tombol di
            atas untuk menambahkan elemen ke kanvas.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {canvasElements.map((item) => {
              const isSelected = selectedCanvasItemId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCanvasItemId(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: isSelected
                      ? '1px solid #F59E0B'
                      : '1px solid #1E293B',
                    backgroundColor: isSelected ? '#1E293B' : '#0B0F19',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <strong style={{ color: '#F8FAFC' }}>
                      {item.label || item.type}
                    </strong>{' '}
                    <span className="sa-tabular" style={{ color: '#94A3B8' }}>
                      ({item.type} · X:{item.x}% Y:{item.y}% · W:{item.width}%
                      H:{item.height}%)
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="sa-btn sa-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateCanvasElement(slideId, item.id);
                      }}
                    >
                      Duplikat
                    </button>
                    <button
                      type="button"
                      className="sa-btn sa-btn-sm sa-btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCanvasElement(slideId, item.id);
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspector Detail Properti untuk `selectedCustomEl` */}
      {selectedCustomEl && (
        <div
          className="sa-row-card"
          data-testid="selected-canvas-element-editor"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <strong style={{ fontSize: '13px', color: '#FBBF24' }}>
              Properti Elemen Terpilih: {selectedCustomEl.id} (
              {selectedCustomEl.type})
            </strong>
          </div>

          <div className="sa-grid-2">
            <div className="sa-field">
              <label htmlFor="ce-label-input" className="sa-label">
                Label / Teks Elemen
              </label>
              <input
                id="ce-label-input"
                type="text"
                className="sa-input"
                value={selectedCustomEl.label || ''}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    label: e.target.value,
                  })
                }
              />
            </div>

            <div className="sa-field">
              <label htmlFor="ce-zindex-input" className="sa-label">
                Urutan Layer (z-index)
              </label>
              <input
                id="ce-zindex-input"
                type="number"
                className="sa-input sa-tabular"
                value={selectedCustomEl.zIndex}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    zIndex: Number(e.target.value) || 40,
                  })
                }
              />
            </div>
          </div>

          {/* Koordinat Persentase (X, Y, Width, Height) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <div>
              <label htmlFor="ce-x-input" className="sa-label">
                Posisi X (%)
              </label>
              <input
                id="ce-x-input"
                type="number"
                step="0.5"
                className="sa-input sa-tabular"
                value={selectedCustomEl.x}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    x: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label htmlFor="ce-y-input" className="sa-label">
                Posisi Y (%)
              </label>
              <input
                id="ce-y-input"
                type="number"
                step="0.5"
                className="sa-input sa-tabular"
                value={selectedCustomEl.y}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    y: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label htmlFor="ce-w-input" className="sa-label">
                Lebar (%)
              </label>
              <input
                id="ce-w-input"
                type="number"
                step="0.5"
                className="sa-input sa-tabular"
                value={selectedCustomEl.width}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    width: Number(e.target.value) || 10,
                  })
                }
              />
            </div>
            <div>
              <label htmlFor="ce-h-input" className="sa-label">
                Tinggi (%)
              </label>
              <input
                id="ce-h-input"
                type="number"
                step="0.5"
                className="sa-input sa-tabular"
                value={selectedCustomEl.height}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    height: Number(e.target.value) || 10,
                  })
                }
              />
            </div>
          </div>

          {/* Media URL (Image / Audio) */}
          <div className="sa-grid-2">
            <div className="sa-field">
              <label htmlFor="ce-img-input" className="sa-label">
                URL Gambar (`imageUrl`)
              </label>
              <input
                id="ce-img-input"
                type="text"
                className="sa-input sa-tabular"
                value={selectedCustomEl.imageUrl || ''}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    imageUrl: e.target.value,
                  })
                }
              />
            </div>

            <div className="sa-field">
              <label htmlFor="ce-audio-input" className="sa-label">
                URL Audio (`audioUrl`)
              </label>
              <input
                id="ce-audio-input"
                type="text"
                className="sa-input sa-tabular"
                value={selectedCustomEl.audioUrl || ''}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    audioUrl: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Style: Background, Text Color, Border Radius, Font Size, Hover Effect */}
          <div className="sa-grid-2">
            <div className="sa-field">
              <label htmlFor="ce-bg-input" className="sa-label">
                Warna Latar (`backgroundColor`)
              </label>
              <input
                id="ce-bg-input"
                type="text"
                className="sa-input sa-tabular"
                value={selectedCustomEl.style.backgroundColor || ''}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    style: {
                      ...selectedCustomEl.style,
                      backgroundColor: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="sa-field">
              <label htmlFor="ce-hover-select" className="sa-label">
                Efek Hover (`hoverEffect`)
              </label>
              <select
                id="ce-hover-select"
                className="sa-select"
                value={selectedCustomEl.style.hoverEffect || 'none'}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    style: {
                      ...selectedCustomEl.style,
                      hoverEffect: e.target.value as
                        | 'none'
                        | 'scale'
                        | 'lift'
                        | 'pulse'
                        | 'glow',
                    },
                  })
                }
              >
                <option value="none">Tanpa Efek (none)</option>
                <option value="scale">Perbesar Halus (scale)</option>
                <option value="lift">Angkat ke Atas (lift)</option>
                <option value="pulse">Denyut Cahaya (pulse)</option>
                <option value="glow">Pendar Cahaya (glow)</option>
              </select>
            </div>
          </div>

          {/* Konfigurasi Action (`none | goto-slide | play-audio | open-popup | external-url`) */}
          <div className="sa-grid-2">
            <div className="sa-field">
              <label htmlFor="ce-action-type" className="sa-label">
                Aksi Saat Diklik (`action.type`)
              </label>
              <select
                id="ce-action-type"
                className="sa-select"
                value={selectedCustomEl.action.type}
                onChange={(e) =>
                  updateCanvasElement(slideId, selectedCustomEl.id, {
                    action: {
                      ...selectedCustomEl.action,
                      type: e.target.value as
                        | 'none'
                        | 'goto-slide'
                        | 'play-audio'
                        | 'open-popup'
                        | 'external-url',
                    },
                  })
                }
              >
                <option value="none">Tidak Ada Aksi (none)</option>
                <option value="goto-slide">Pindah ke Slide (goto-slide)</option>
                <option value="play-audio">Putar Audio (play-audio)</option>
                <option value="open-popup">Buka Pop-up Informasi (open-popup)</option>
                <option value="external-url">Buka URL Eksternal (external-url)</option>
              </select>
            </div>

            {selectedCustomEl.action.type === 'goto-slide' && (
              <div className="sa-field">
                <label htmlFor="ce-target-slide" className="sa-label">
                  Slide Tujuan (`targetSlideId` / `targetSlideIndex`)
                </label>
                <select
                  id="ce-target-slide"
                  className="sa-select"
                  value={
                    selectedCustomEl.action.targetSlideId ||
                    (typeof selectedCustomEl.action.targetSlideIndex === 'number'
                      ? content.slideOrder[selectedCustomEl.action.targetSlideIndex]
                      : undefined) ||
                    content.slideOrder[0]
                  }
                  onChange={(e) => {
                    const targetId = e.target.value;
                    const targetIdx = content.slideOrder.indexOf(targetId);
                    updateCanvasElement(slideId, selectedCustomEl.id, {
                      action: {
                        ...selectedCustomEl.action,
                        targetSlideId: targetId,
                        targetSlideIndex: targetIdx >= 0 ? targetIdx : 0,
                      },
                    });
                  }}
                >
                  {content.slideOrder.map((id, idx) => (
                    <option key={id} value={id}>
                      #{idx + 1} — {content.slides[id]?.title} ({id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCustomEl.action.type === 'external-url' && (
              <div className="sa-field">
                <label htmlFor="ce-external-url" className="sa-label">
                  URL Tujuan (`externalUrl`)
                </label>
                <input
                  id="ce-external-url"
                  type="url"
                  className="sa-input sa-tabular"
                  value={selectedCustomEl.action.externalUrl || ''}
                  onChange={(e) =>
                    updateCanvasElement(slideId, selectedCustomEl.id, {
                      action: {
                        ...selectedCustomEl.action,
                        externalUrl: e.target.value,
                      },
                    })
                  }
                  placeholder="https://kemdikbud.go.id"
                />
              </div>
            )}
          </div>

          {selectedCustomEl.action.type === 'open-popup' && (
            <div className="sa-grid-2">
              <div className="sa-field">
                <label htmlFor="ce-popup-title" className="sa-label">
                  Judul Pop-up (`popupTitle`)
                </label>
                <input
                  id="ce-popup-title"
                  type="text"
                  className="sa-input"
                  value={selectedCustomEl.action.popupTitle || ''}
                  onChange={(e) =>
                    updateCanvasElement(slideId, selectedCustomEl.id, {
                      action: {
                        ...selectedCustomEl.action,
                        popupTitle: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="sa-field">
                <label htmlFor="ce-popup-content" className="sa-label">
                  Isi Pesan Pop-up (`popupBody` / `popupContent`)
                </label>
                <input
                  id="ce-popup-content"
                  type="text"
                  className="sa-input"
                  value={
                    selectedCustomEl.action.popupBody ||
                    selectedCustomEl.action.popupContent ||
                    ''
                  }
                  onChange={(e) =>
                    updateCanvasElement(slideId, selectedCustomEl.id, {
                      action: {
                        ...selectedCustomEl.action,
                        popupBody: e.target.value,
                        popupContent: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panel Layer Elemen Asli & Non-Destructive Restore (`elementOverrides` & `hiddenElementIds`) */}
      {slide.texts.length > 0 && (
        <div className="sa-row-card" data-testid="native-elements-layer-panel">
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#F8FAFC',
              marginBottom: '8px',
            }}
          >
            Layer Elemen Bawaan Slide (`elementOverrides` &amp; Restore)
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {slide.texts.slice(0, 8).map((tb) => {
              const ov = elementOverrides[tb.objectId];
              const isHidden = Boolean(
                ov?.hidden || hiddenElementIds.includes(tb.objectId)
              );
              return (
                <div
                  key={tb.objectId}
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
                    opacity: isHidden ? 0.6 : 1,
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <span
                      className="sa-tabular"
                      style={{ color: '#FBBF24', fontWeight: 600 }}
                    >
                      [{tb.objectId}]
                    </span>{' '}
                    <span style={{ color: '#CBD5E1' }}>
                      {ov?.customText ||
                        tb.lines.join(' ').slice(0, 42) ||
                        tb.altText}
                    </span>
                    {ov && (ov.xDeltaPct !== 0 || ov.yDeltaPct !== 0) && (
                      <span
                        className="sa-tabular"
                        style={{ color: '#38BDF8', marginLeft: '6px' }}
                      >
                        (ΔX:{ov.xDeltaPct}% ΔY:{ov.yDeltaPct}%)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {isHidden ? (
                      <button
                        type="button"
                        className="sa-btn sa-btn-sm sa-btn-primary"
                        data-testid={`btn-restore-native-${tb.objectId}`}
                        onClick={() =>
                          restoreNativeElement(slideId, tb.objectId)
                        }
                      >
                        Pulihkan (Restore)
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm"
                          onClick={() =>
                            updateElementOverride(slideId, tb.objectId, {
                              xDeltaPct: 0,
                              yDeltaPct: 0,
                            })
                          }
                        >
                          Reset Posisi
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn-sm sa-btn-danger"
                          data-testid={`btn-hide-native-${tb.objectId}`}
                          onClick={() =>
                            hideNativeElement(slideId, tb.objectId)
                          }
                        >
                          Sembunyikan
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasPropertyInspector;
