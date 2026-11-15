import React from 'react';
import { ContentProvider } from './context/ContentContext';
import { StarlaPlayer } from './components/StarlaPlayer';
import { ContentSchema } from './data/defaultContent';

export interface AppProps {
  initialSupabaseContent?: ContentSchema | null;
}

/**
 * Top-level Application Root (Open-Closed Principle).
 * Membungkus player utama dengan `ContentProvider` sehingga siap diperluas
 * dengan Route/View Switcher (mis. Admin Dashboard) tanpa menyentuh player utama.
 */
export const App: React.FC<AppProps> = ({ initialSupabaseContent = null }) => {
  return (
    <ContentProvider initialSupabaseContent={initialSupabaseContent}>
      <StarlaPlayer />
    </ContentProvider>
  );
};

export default App;
