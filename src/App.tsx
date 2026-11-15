import React from 'react';
import { ContentProvider } from './context/ContentContext';
import { StarlaPlayer } from './components/StarlaPlayer';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { CanvasStageOverlay } from './features/canvas/CanvasStageOverlay';
import { CanvaStudio } from './CanvaStudio';
import { ContentSchema } from './data/defaultContent';

export { CanvaStudio };

export interface AppProps {
  initialSupabaseContent?: ContentSchema | null;
}

/**
 * Top-level Application Root (Open-Closed Principle).
 * Membungkus player utama dengan `ContentProvider`, `CanvasStageOverlay`, dan modul terisolasi
 * `AdminDashboard` + `CanvaStudio` (`?mode=admin`, `/admin`, atau `Ctrl + Shift + A`)
 * tanpa menyentuh atau mengubah logika internal player utama (`StarlaPlayer`).
 */
export const App: React.FC<AppProps> = ({ initialSupabaseContent = null }) => {
  return (
    <ContentProvider initialSupabaseContent={initialSupabaseContent}>
      <StarlaPlayer />
      <CanvasStageOverlay mode="player-portal" />
      <AdminDashboard />
    </ContentProvider>
  );
};

export default App;
