import React from 'react';
import { ContentProvider } from './context/ContentContext';
import { StarlaPlayer } from './components/StarlaPlayer';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { ContentSchema } from './data/defaultContent';

export interface AppProps {
  initialSupabaseContent?: ContentSchema | null;
}

/**
 * Top-level Application Root (Open-Closed Principle).
 * Membungkus player utama dengan `ContentProvider` dan modul terisolasi
 * `AdminDashboard` (`?mode=admin`, `/admin`, atau `Ctrl + Shift + A`)
 * tanpa menyentuh atau mengubah logika internal player utama (`StarlaPlayer`).
 */
export const App: React.FC<AppProps> = ({ initialSupabaseContent = null }) => {
  return (
    <ContentProvider initialSupabaseContent={initialSupabaseContent}>
      <StarlaPlayer />
      <AdminDashboard />
    </ContentProvider>
  );
};

export default App;

