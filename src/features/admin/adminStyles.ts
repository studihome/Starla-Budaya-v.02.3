export const ADMIN_SCOPED_STYLE_ID = 'starla-admin-scoped-styles';

export const ADMIN_SCOPED_CSS = `
.starla-admin-portal,
.starla-admin-portal *,
.starla-admin-portal *::before,
.starla-admin-portal *::after {
  box-sizing: border-box;
  user-select: text;
  -webkit-user-select: text;
  pointer-events: auto;
}

.starla-admin-portal {
  position: fixed;
  inset: 0;
  z-index: 2147483647 !important;
  width: 100vw;
  height: 100vh;
  background-color: #0B0F19;
  color: #F8FAFC;
  font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

.starla-admin-portal .sa-tabular {
  font-family: "JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}

/* Top Bar (Strict 3-Zone Contract) */
.starla-admin-portal .sa-topbar {
  height: 58px;
  min-height: 58px;
  padding: 0 24px;
  background-color: #0F172A;
  border-bottom: 1px solid #1E293B;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.starla-admin-portal .sa-brand {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #F8FAFC;
  white-space: nowrap;
  flex-shrink: 0;
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.starla-admin-portal .sa-topnav {
  display: flex;
  align-items: center;
  gap: 24px;
  overflow-x: auto;
}

.starla-admin-portal .sa-navlink {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 18px 2px 16px 2px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #94A3B8;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 150ms cubic-bezier(0.16, 1, 0.3, 1), border-color 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.starla-admin-portal .sa-navlink:hover {
  color: #F8FAFC;
}

.starla-admin-portal .sa-navlink.is-active {
  color: #FBBF24;
  border-bottom-color: #F59E0B;
}

/* Sub-toolbar for workspace utilities */
.starla-admin-portal .sa-subtoolbar {
  min-height: 46px;
  padding: 8px 24px;
  background-color: #0B0F19;
  border-bottom: 1px solid #1E293B;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.starla-admin-portal .sa-meta-line {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #94A3B8;
  flex-wrap: wrap;
}

.starla-admin-portal .sa-meta-sep {
  color: #475569;
}

.starla-admin-portal .sa-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Buttons */
.starla-admin-portal .sa-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 7px 14px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  flex-shrink: 0;
  cursor: pointer;
  border: 1px solid #334155;
  background-color: #1E293B;
  color: #F1F5F9;
  transition: opacity 150ms cubic-bezier(0.16, 1, 0.3, 1), transform 150ms cubic-bezier(0.16, 1, 0.3, 1), background-color 150ms ease;
}

.starla-admin-portal .sa-btn:hover:not(:disabled) {
  background-color: #334155;
}

.starla-admin-portal .sa-btn:active:not(:disabled) {
  transform: scale(0.99);
}

.starla-admin-portal .sa-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.starla-admin-portal .sa-btn-primary {
  background-color: #D97706;
  border-color: #F59E0B;
  color: #FFFFFF;
}

.starla-admin-portal .sa-btn-primary:hover:not(:disabled) {
  background-color: #B45309;
}

.starla-admin-portal .sa-btn-danger {
  background-color: #1E293B;
  border-color: #7F1D1D;
  color: #FCA5A5;
}

.starla-admin-portal .sa-btn-danger:hover:not(:disabled) {
  background-color: #7F1D1D;
  color: #FFFFFF;
}

.starla-admin-portal .sa-btn-ghost {
  background-color: transparent;
  border-color: #1E293B;
  color: #CBD5E1;
}

.starla-admin-portal .sa-btn-ghost:hover:not(:disabled) {
  background-color: #1E293B;
  color: #FFFFFF;
}

.starla-admin-portal .sa-btn-sm {
  min-height: 30px;
  padding: 5px 10px;
  font-size: 12px;
}

.starla-admin-portal button:focus-visible,
.starla-admin-portal input:focus-visible,
.starla-admin-portal textarea:focus-visible,
.starla-admin-portal select:focus-visible {
  outline: 2px solid #F59E0B;
  outline-offset: 1px;
}

/* Split-screen workspace body */
.starla-admin-portal .sa-workspace {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  min-height: 0;
  overflow: hidden;
}

.starla-admin-portal .sa-workspace.is-editor-only {
  grid-template-columns: minmax(0, 1fr);
}

.starla-admin-portal .sa-editor-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid #1E293B;
  background-color: #0B0F19;
}

.starla-admin-portal .sa-preview-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background-color: #0F172A;
}

/* Master-Detail Layout inside Editor Pane */
.starla-admin-portal .sa-master-detail {
  flex: 1;
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
}

.starla-admin-portal .sa-sidebar-list {
  border-right: 1px solid #1E293B;
  background-color: #0F172A;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.starla-admin-portal .sa-sidebar-header {
  padding: 14px 16px;
  border-bottom: 1px solid #1E293B;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.starla-admin-portal .sa-sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.starla-admin-portal .sa-list-item {
  width: 100%;
  text-align: left;
  padding: 9px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: #CBD5E1;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.starla-admin-portal .sa-list-item:hover {
  background-color: #1E293B;
  color: #F8FAFC;
}

.starla-admin-portal .sa-list-item.is-selected {
  background-color: #1E293B;
  border-color: #F59E0B;
  color: #FFFFFF;
}

.starla-admin-portal .sa-list-item.is-hidden-item {
  opacity: 0.55;
}

.starla-admin-portal .sa-detail-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* Forms & Inputs */
.starla-admin-portal .sa-section {
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid #1E293B;
}

.starla-admin-portal .sa-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.starla-admin-portal .sa-section-title {
  font-size: 16px;
  font-weight: 700;
  color: #F8FAFC;
  margin: 0 0 6px 0;
}

.starla-admin-portal .sa-section-desc {
  font-size: 13px;
  color: #94A3B8;
  margin: 0 0 16px 0;
}

.starla-admin-portal .sa-field {
  margin-bottom: 16px;
}

.starla-admin-portal .sa-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #CBD5E1;
  margin-bottom: 6px;
}

.starla-admin-portal .sa-input,
.starla-admin-portal .sa-textarea,
.starla-admin-portal .sa-select {
  width: 100%;
  padding: 9px 12px;
  border-radius: 6px;
  border: 1px solid #334155;
  background-color: #0F172A;
  color: #F8FAFC;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.45;
}

.starla-admin-portal .sa-textarea {
  min-height: 76px;
  resize: vertical;
}

.starla-admin-portal .sa-row-card {
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid #1E293B;
  background-color: #0F172A;
  margin-bottom: 12px;
}

.starla-admin-portal .sa-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

/* Status banner */
.starla-admin-portal .sa-banner {
  padding: 10px 16px;
  border-radius: 6px;
  border: 1px solid #334155;
  background-color: #1E293B;
  color: #F8FAFC;
  font-size: 13px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.starla-admin-portal .sa-banner.is-success {
  border-color: #15803D;
  background-color: rgba(22, 163, 74, 0.14);
  color: #DCFCE7;
}

.starla-admin-portal .sa-banner.is-error {
  border-color: #B91C1C;
  background-color: rgba(220, 38, 38, 0.14);
  color: #FEE2E2;
}

/* PIN Gate Screen */
.starla-admin-portal .sa-auth-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: #0B0F19;
}

.starla-admin-portal .sa-auth-box {
  width: 100%;
  max-width: 440px;
  padding: 32px;
  border-radius: 10px;
  border: 1px solid #1E293B;
  background-color: #0F172A;
}

@media (max-width: 1024px) {
  .starla-admin-portal .sa-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .starla-admin-portal .sa-master-detail {
    grid-template-columns: 220px minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .starla-admin-portal .sa-master-detail {
    grid-template-columns: minmax(0, 1fr);
  }
  .starla-admin-portal .sa-grid-2 {
    grid-template-columns: minmax(0, 1fr);
  }
}
`;

export function ensureAdminStylesMounted(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(ADMIN_SCOPED_STYLE_ID)) return;

  const styleEl = document.createElement('style');
  styleEl.id = ADMIN_SCOPED_STYLE_ID;
  styleEl.textContent = ADMIN_SCOPED_CSS;
  document.head.appendChild(styleEl);
}
