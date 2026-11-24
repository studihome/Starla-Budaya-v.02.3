import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { defaultContent, type ContentSchema } from './data/defaultContent';
import {
  transformStorylineProvideData,
  extractSlideIdFromProvideJson,
  protectStarlaLocalStorage,
} from './utils/contentRuntimeBridge';
import { loadContentFromLocalStorage } from './lib/supabase';
import { applyStarlaMenuAndPameranUpdate } from './features/admin/adminHelpers';

export type ProvideFn = ((dataType: string, rawJson: string) => unknown) & {
  __starlaWrapped?: boolean;
  __starlaOrig?: (dataType: string, rawJson: string) => unknown;
};

interface ShiftedElementRecord {
  xDeltaPct: number;
  yDeltaPct: number;
  widthPct?: number;
  heightPct?: number;
}

interface CachedProvideEntry {
  transformed: string;
  slideId?: string;
  shiftedSnapshot?: Record<string, ShiftedElementRecord>;
  contentSignature: string;
}

const MAX_PROVIDE_CACHE_ENTRIES = 64;
const provideTransformCache = new Map<string, CachedProvideEntry>();

let lastRawContentRef: ContentSchema | null = null;
let lastSyncedContentRef: ContentSchema | null = null;
let lastCachedContentRef: ContentSchema | null = null;
let cacheHitCount = 0;
let cacheMissCount = 0;

function extractFastSlideId(rawJson: string): string | undefined {
  return extractSlideIdFromProvideJson(rawJson) ?? undefined;
}

function computeContentSignature(
  activeContent: ContentSchema,
  slideId?: string
): string {
  const slideItem = slideId ? activeContent.slides?.[slideId] : undefined;
  const slideSig = slideItem
    ? `${slideItem.title}|${slideItem.backgroundUrl ?? ''}|${slideItem.webObjectUrl ?? ''}|${slideItem.canvasElements?.length ?? 0}|${Object.keys(slideItem.elementOverrides ?? {}).length}`
    : 'global';
  return `${activeContent.version ?? ''}|${activeContent.appMeta?.publishTimestamp ?? ''}|${slideSig}`;
}

/**
 * Ensures `window.__STARLA_CONTENT__` is always synchronized through
 * `applyStarlaMenuAndPameranUpdate` using O(1) reference-identity memoization.
 */
export function resolveSynchronizedBridgeContent(
  win: Record<string, unknown>
): ContentSchema {
  const candidate =
    (win.__STARLA_CONTENT__ as ContentSchema | undefined) ??
    loadContentFromLocalStorage() ??
    defaultContent;

  if (
    candidate === lastSyncedContentRef ||
    (candidate === lastRawContentRef && lastSyncedContentRef !== null)
  ) {
    if (win.__STARLA_CONTENT__ !== lastSyncedContentRef) {
      win.__STARLA_CONTENT__ = lastSyncedContentRef;
    }
    return lastSyncedContentRef;
  }

  const synchronized = applyStarlaMenuAndPameranUpdate(candidate);
  lastRawContentRef = candidate;
  lastSyncedContentRef = synchronized;
  win.__STARLA_CONTENT__ = synchronized;
  return synchronized;
}

export function clearProvideTransformCache(): void {
  provideTransformCache.clear();
  cacheHitCount = 0;
  cacheMissCount = 0;
}

export function getProvideTransformCacheStats(): {
  size: number;
  hits: number;
  misses: number;
} {
  return {
    size: provideTransformCache.size,
    hits: cacheHitCount,
    misses: cacheMissCount,
  };
}

/**
 * Wraps Articulate Storyline's `window.globalProvideData` with:
 * 1. Immediate O(1) pass-through for non-transformed payload types (e.g., `frame`, `transcript`).
 * 2. Reference-memoized `applyStarlaMenuAndPameranUpdate` synchronization whenever `__STARLA_CONTENT__` updates.
 * 3. Lightweight bounded LRU cache keyed by `(dataType, rawJson)` with automatic invalidation.
 */
export function wrapProvideFn(
  fn: ProvideFn,
  targetWin?: Record<string, unknown>
): ProvideFn {
  if (typeof fn !== 'function' || fn.__starlaWrapped) return fn;

  const win: Record<string, unknown> =
    targetWin ??
    (typeof window !== 'undefined'
      ? (window as unknown as Record<string, unknown>)
      : {});

  const wrapped: ProvideFn = function (
    this: unknown,
    dataType: string,
    rawJson: string
  ) {
    if (
      typeof rawJson !== 'string' ||
      rawJson.length === 0 ||
      (dataType !== 'slide' && dataType !== 'paths' && dataType !== 'data')
    ) {
      return fn.call(this, dataType, rawJson);
    }

    const currentContent = resolveSynchronizedBridgeContent(win);

    if (currentContent !== lastCachedContentRef) {
      provideTransformCache.clear();
      lastCachedContentRef = currentContent;
    }

    const cacheKey = `${dataType}:${rawJson}`;
    const cached = provideTransformCache.get(cacheKey);
    if (cached !== undefined) {
      const expectedSig = computeContentSignature(currentContent, cached.slideId);
      const trimmed = cached.transformed.trim();
      if (
        cached.contentSignature === expectedSig &&
        trimmed.startsWith('{') &&
        trimmed.endsWith('}')
      ) {
        cacheHitCount += 1;
        provideTransformCache.delete(cacheKey);
        provideTransformCache.set(cacheKey, cached);
        if (cached.slideId && cached.shiftedSnapshot) {
          const shiftedMap =
            (win.__STARLA_JSON_SHIFTED_ELEMENTS__ as
              | Record<string, Record<string, ShiftedElementRecord>>
              | undefined) ?? {};
          shiftedMap[cached.slideId] = { ...cached.shiftedSnapshot };
          win.__STARLA_JSON_SHIFTED_ELEMENTS__ = shiftedMap;
          if (typeof window !== 'undefined') {
            const browserWin = window as unknown as Record<string, unknown>;
            if (browserWin !== win) {
              const browserShiftedMap =
                (browserWin.__STARLA_JSON_SHIFTED_ELEMENTS__ as
                  | Record<string, Record<string, ShiftedElementRecord>>
                  | undefined) ?? {};
              browserShiftedMap[cached.slideId] = { ...cached.shiftedSnapshot };
              browserWin.__STARLA_JSON_SHIFTED_ELEMENTS__ = browserShiftedMap;
            }
          }
        }
        return fn.call(this, dataType, cached.transformed);
      }
      provideTransformCache.delete(cacheKey);
    }

    cacheMissCount += 1;
    const transformed = transformStorylineProvideData(
      dataType,
      rawJson,
      currentContent
    );
    const safeTransformed =
      typeof transformed === 'string' && transformed.length > 0
        ? transformed
        : rawJson;

    const slideId =
      dataType === 'slide' ? extractFastSlideId(rawJson) : undefined;
    const browserWinShifted =
      typeof window !== 'undefined'
        ? ((window as unknown as Record<string, unknown>)
            .__STARLA_JSON_SHIFTED_ELEMENTS__ as
            | Record<string, Record<string, ShiftedElementRecord>>
            | undefined)
        : undefined;
    const shiftedMap =
      (win.__STARLA_JSON_SHIFTED_ELEMENTS__ as
        | Record<string, Record<string, ShiftedElementRecord>>
        | undefined) ?? browserWinShifted;
    const shiftedSnapshot =
      slideId && shiftedMap?.[slideId]
        ? { ...shiftedMap[slideId] }
        : undefined;

    if (provideTransformCache.size >= MAX_PROVIDE_CACHE_ENTRIES) {
      const oldestKey = provideTransformCache.keys().next().value;
      if (oldestKey !== undefined) {
        provideTransformCache.delete(oldestKey);
      }
    }
    provideTransformCache.set(cacheKey, {
      transformed: safeTransformed,
      slideId,
      shiftedSnapshot,
      contentSignature: computeContentSignature(currentContent, slideId),
    });

    return fn.call(this, dataType, safeTransformed);
  };

  wrapped.__starlaWrapped = true;
  wrapped.__starlaOrig = fn;
  return wrapped;
}

/**
 * Inisialisasi awal bridge `window.globalProvideData` dan mount React `ContentProvider` + `StarlaPlayer`
 * tanpa mengubah struktur DOM Storyline (`#preso`, `#slide-window`, `#starla-front-stage`).
 */
function bootstrapStarlaContentBridge(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const win = window as unknown as Record<string, unknown>;
  resolveSynchronizedBridgeContent(win);

  let currentProvideFn: ProvideFn | undefined =
    typeof win.globalProvideData === 'function'
      ? wrapProvideFn(win.globalProvideData as ProvideFn, win)
      : undefined;

  try {
    Object.defineProperty(window, 'globalProvideData', {
      configurable: true,
      enumerable: true,
      get() {
        return currentProvideFn;
      },
      set(nextFn) {
        currentProvideFn =
          typeof nextFn === 'function'
            ? wrapProvideFn(nextFn as ProvideFn, win)
            : nextFn;
      },
    });
  } catch {
    if (currentProvideFn) {
      win.globalProvideData = currentProvideFn;
    }
  }

  const mountReactRoot = () => {
    if (!document.body) return;
    let container = document.getElementById('starla-react-root') as
      | (HTMLElement & { __starlaRootMounted?: boolean })
      | null;
    if (!container) {
      container = document.createElement('div') as HTMLElement & {
        __starlaRootMounted?: boolean;
      };
      container.id = 'starla-react-root';
      container.style.display = 'none';
      container.setAttribute('aria-hidden', 'true');
      document.body.appendChild(container);
    }
    if (container.__starlaRootMounted) return;
    container.__starlaRootMounted = true;
    const root = createRoot(container);
    root.render(<App />);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReactRoot);
  } else {
    mountReactRoot();
  }
}

bootstrapStarlaContentBridge();

export { App, defaultContent };
