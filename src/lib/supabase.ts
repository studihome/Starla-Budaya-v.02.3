import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ContentSchema, defaultContent } from '../data/defaultContent';

export const APP_CONTENTS_TABLE = 'app_contents';
export const MAIN_CONTENT_SLUG = 'main';
export const MEDIA_ASSETS_BUCKET = 'media-assets';
export const LOCAL_STORAGE_CONTENT_KEY = 'starla_budaya_content_backup_v1';
export const LOCAL_STORAGE_MEDIA_KEY = 'starla_budaya_media_backup_v1';

export interface SupabaseEnvConfig {
  url: string | null;
  anonKey: string | null;
  isConfigured: boolean;
}

export interface FetchContentResult {
  content: ContentSchema;
  supabaseContent: ContentSchema | null;
  source: 'supabase' | 'localStorage' | 'default';
  error?: string;
}

export interface SaveContentResult {
  success: boolean;
  source: 'supabase' | 'localStorage';
  content: ContentSchema;
  error?: string;
}

export interface UploadMediaResult {
  success: boolean;
  url: string;
  path: string;
  source: 'supabase' | 'localStorage';
  error?: string;
}

/**
 * Membaca variabel environment Supabase secara aman untuk Next.js (Vercel)
 * maupun Vite / AI Studio (`process.env.NEXT_PUBLIC_SUPABASE_URL` / `import.meta.env.VITE_SUPABASE_URL`
 * dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`).
 */
export function getSupabaseEnvConfig(): SupabaseEnvConfig {
  let rawUrl: string | undefined;
  let rawKey: string | undefined;

  try {
    if (typeof process !== 'undefined' && process.env) {
      rawUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        rawUrl;
      rawKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        rawKey;
    }
  } catch {
    // Ignore process access errors in strict browser environments
  }

  try {
    const metaEnv = (
      import.meta as unknown as { env?: Record<string, string | undefined> }
    )?.env;
    if (metaEnv) {
      rawUrl =
        rawUrl ||
        metaEnv.VITE_SUPABASE_URL ||
        metaEnv.NEXT_PUBLIC_SUPABASE_URL;
      rawKey =
        rawKey ||
        metaEnv.VITE_SUPABASE_ANON_KEY ||
        metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }
  } catch {
    // Ignore import.meta access errors in CommonJS environments
  }

  const url = rawUrl && rawUrl.trim().length > 0 ? rawUrl.trim() : null;
  const anonKey = rawKey && rawKey.trim().length > 0 ? rawKey.trim() : null;
  const isValidUrl = Boolean(url && /^https?:\/\//i.test(url));
  const isConfigured = Boolean(isValidUrl && anonKey);

  return {
    url: isValidUrl ? url : null,
    anonKey: isConfigured ? anonKey : null,
    isConfigured,
  };
}

/**
 * Inisialisasi instance SupabaseClient dengan proteksi penuh agar tidak melempar error
 * saat environment variable belum diisi di preview AI Studio.
 */
function createSafeSupabaseClient(): SupabaseClient | null {
  try {
    const { url, anonKey, isConfigured } = getSupabaseEnvConfig();
    if (!isConfigured || !url || !anonKey) {
      return null;
    }
    return createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch {
    return null;
  }
}

export const supabase: SupabaseClient | null = createSafeSupabaseClient();

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

/**
 * Validasi ringan apakah objek yang dimuat dari cloud/localStorage merupakan ContentSchema yang valid.
 */
export function isValidContentSchema(data: unknown): data is ContentSchema {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.appMeta === 'object' &&
    candidate.appMeta !== null &&
    typeof candidate.slides === 'object' &&
    candidate.slides !== null &&
    Array.isArray(candidate.slideOrder) &&
    typeof candidate.quizzes === 'object' &&
    candidate.quizzes !== null
  );
}

/**
 * Membaca cadangan konten dari `localStorage` secara aman.
 */
export function loadContentFromLocalStorage(): ContentSchema | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LOCAL_STORAGE_CONTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isValidContentSchema(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Menyimpan cadangan konten ke `localStorage` secara aman.
 */
export function saveContentToLocalStorage(content: ContentSchema): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(
      LOCAL_STORAGE_CONTENT_KEY,
      JSON.stringify(content)
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Menghapus cadangan konten dari `localStorage`.
 */
export function clearContentFromLocalStorage(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(LOCAL_STORAGE_CONTENT_KEY);
  } catch {
    // Ignore storage removal errors
  }
}

/**
 * Mengambil data JSON konten terbaru dari tabel Supabase `app_contents`
 * (kolom `content_data` dengan `slug = 'main'`).
 * Jika Supabase belum dikonfigurasi atau gagal, otomatis fallback ke `localStorage` -> `defaultContent`.
 */
export async function fetchMainContentFromCloud(
  clientOverride?: SupabaseClient | null
): Promise<FetchContentResult> {
  const activeClient =
    clientOverride !== undefined ? clientOverride : supabase;

  if (activeClient) {
    try {
      const { data, error } = await activeClient
        .from(APP_CONTENTS_TABLE)
        .select('content_data')
        .eq('slug', MAIN_CONTENT_SLUG)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      const rawCloudContent = data?.content_data;
      if (isValidContentSchema(rawCloudContent)) {
        saveContentToLocalStorage(rawCloudContent);
        const activeContent = rawCloudContent ?? defaultContent;
        return {
          content: activeContent,
          supabaseContent: rawCloudContent,
          source: 'supabase',
        };
      }
    } catch (err) {
      const localBackup = loadContentFromLocalStorage();
      const supabaseContent: ContentSchema | null = null;
      const activeContent = supabaseContent ?? localBackup ?? defaultContent;
      return {
        content: activeContent,
        supabaseContent: null,
        source: localBackup ? 'localStorage' : 'default',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const localBackup = loadContentFromLocalStorage();
  const supabaseContent: ContentSchema | null = null;
  const activeContent = supabaseContent ?? localBackup ?? defaultContent;

  return {
    content: activeContent,
    supabaseContent: null,
    source: localBackup ? 'localStorage' : 'default',
  };
}

/**
 * Menyimpan perubahan konten ke tabel Supabase `app_contents` (`slug = 'main'`, kolom `content_data`),
 * sekaligus menyimpannya ke `localStorage` sebagai penyimpanan cadangan apabila offline/belum dikonfigurasi.
 */
export async function saveMainContentToCloud(
  newContent: ContentSchema,
  clientOverride?: SupabaseClient | null
): Promise<SaveContentResult> {
  // Selalu simpan ke localStorage terlebih dahulu sebagai fallback anti-gagal
  saveContentToLocalStorage(newContent);

  const activeClient =
    clientOverride !== undefined ? clientOverride : supabase;

  if (!activeClient) {
    return {
      success: true,
      source: 'localStorage',
      content: newContent,
    };
  }

  try {
    const { error } = await activeClient.from(APP_CONTENTS_TABLE).upsert(
      {
        slug: MAIN_CONTENT_SLUG,
        content_data: newContent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    );

    if (error) {
      throw new Error(error.message);
    }

    return {
      success: true,
      source: 'supabase',
      content: newContent,
    };
  } catch (err) {
    return {
      success: true,
      source: 'localStorage',
      content: newContent,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Mengonversi File/Blob ke Data URL base64 untuk fallback penyimpanan lokal
 * apabila Supabase Storage belum dikonfigurasi atau gagal.
 */
async function blobToDataUrl(file: File | Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const mime = file.type || 'application/octet-stream';
  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(buffer).toString('base64');
  return `data:${mime};base64,${base64}`;
}

/**
 * Mengunggah file audio/gambar baru ke Supabase Storage bucket `media-assets`.
 * Jika Supabase belum dikonfigurasi atau koneksi gagal, otomatis menggunakan fallback Data URL + `localStorage`.
 */
export async function uploadMediaAssetToCloud(
  file: File | Blob,
  customFileName?: string,
  clientOverride?: SupabaseClient | null
): Promise<UploadMediaResult> {
  const rawName =
    customFileName ||
    (typeof (file as File).name === 'string' && (file as File).name
      ? (file as File).name
      : `asset-${Date.now()}.bin`);
  const sanitizedName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `uploads/${Date.now()}-${sanitizedName}`;

  const activeClient =
    clientOverride !== undefined ? clientOverride : supabase;

  if (activeClient) {
    try {
      const { error: uploadError } = await activeClient.storage
        .from(MEDIA_ASSETS_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = activeClient.storage
        .from(MEDIA_ASSETS_BUCKET)
        .getPublicUrl(storagePath);

      if (publicUrlData?.publicUrl) {
        return {
          success: true,
          url: publicUrlData.publicUrl,
          path: storagePath,
          source: 'supabase',
        };
      }
    } catch (err) {
      const fallbackUrl = await blobToDataUrl(file);
      saveLocalMediaEntry(storagePath, fallbackUrl);
      return {
        success: true,
        url: fallbackUrl,
        path: storagePath,
        source: 'localStorage',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const fallbackUrl = await blobToDataUrl(file);
  saveLocalMediaEntry(storagePath, fallbackUrl);
  return {
    success: true,
    url: fallbackUrl,
    path: storagePath,
    source: 'localStorage',
  };
}

function saveLocalMediaEntry(pathKey: string, dataUrl: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const raw = window.localStorage.getItem(LOCAL_STORAGE_MEDIA_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[pathKey] = dataUrl;
    window.localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota errors on large files; Data URL is still returned in-memory
  }
}
