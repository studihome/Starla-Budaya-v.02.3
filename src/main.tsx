import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { defaultContent } from './data/defaultContent';
import { transformStorylineProvideData } from './utils/contentRuntimeBridge';

/**
 * Inisialisasi awal bridge `window.globalProvideData` dan mount React `ContentProvider` + `StarlaPlayer`
 * tanpa mengubah struktur DOM Storyline (`#preso`, `#slide-window`, `#starla-front-stage`).
 */
function bootstrapStarlaContentBridge(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const win = window as unknown as Record<string, unknown>;
  if (!win.__STARLA_CONTENT__) {
    win.__STARLA_CONTENT__ = defaultContent;
  }

  // Hook globalProvideData apabila sudah didefinisikan oleh bootstrapper.min.js
  const existingProvide = win.globalProvideData as
    | (((dataType: string, rawJson: string) => void) & {
        __starlaWrapped?: boolean;
        __starlaOrig?: (dataType: string, rawJson: string) => void;
      })
    | undefined;

  if (
    typeof existingProvide === 'function' &&
    !existingProvide.__starlaWrapped
  ) {
    const wrapped = function (
      this: unknown,
      dataType: string,
      rawJson: string
    ) {
      const currentContent =
        (win.__STARLA_CONTENT__ as typeof defaultContent) ?? defaultContent;
      const transformed = transformStorylineProvideData(
        dataType,
        rawJson,
        currentContent
      );
      return existingProvide.call(this, dataType, transformed);
    };
    wrapped.__starlaWrapped = true;
    wrapped.__starlaOrig = existingProvide;
    win.globalProvideData = wrapped;
  }

  const mountReactRoot = () => {
    if (!document.body) return;
    let container = document.getElementById('starla-react-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'starla-react-root';
      container.style.display = 'none';
      container.setAttribute('aria-hidden', 'true');
      document.body.appendChild(container);
    }
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
