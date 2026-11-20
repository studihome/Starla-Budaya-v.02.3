export const STARLA_ADMIN_SCOPED_CSS = `
#starla-admin-portal-root {
  position: fixed !important;
  inset: 0 !important;
  pointer-events: none !important;
  z-index: 2147483647 !important;
}
.starla-saas-admin {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483647 !important;
  pointer-events: auto !important;
  background-color: #F4F6FA !important;
  color: #0F172A !important;
  display: flex !important;
  overflow: hidden !important;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif !important;
  box-sizing: border-box !important;
}
.starla-saas-admin *, .starla-saas-admin *::before, .starla-saas-admin *::after {
  box-sizing: border-box;
}
.starla-saas-admin h1,
.starla-saas-admin h2,
.starla-saas-admin h3,
.starla-saas-admin h4,
.starla-saas-admin p {
  margin: 0;
}
.starla-saas-admin input[type="text"].rounded-full {
  border-radius: 9999px !important;
  padding-left: 2.75rem !important;
  padding-right: 1rem !important;
  padding-top: 0.625rem !important;
  padding-bottom: 0.625rem !important;
}
.starla-saas-admin input[type="text"]:not(.rounded-full),
.starla-saas-admin input[type="url"],
.starla-saas-admin input[type="number"],
.starla-saas-admin select:not(.bg-\\[\\#E3EEFF\\]):not(.bg-transparent),
.starla-saas-admin textarea {
  border-radius: 0.75rem !important;
  padding: 0.625rem 0.875rem !important;
}

/* Built-in Zero-Latency Puzzler Minimalist White Theme Tokens (Immune to Storyline output.min.css resets) */
.starla-saas-admin.bg-\\[\\#F4F6FA\\],
.starla-saas-admin .bg-\\[\\#F4F6FA\\] {
  background-color: #F4F6FA !important;
}
.starla-saas-admin.bg-\\[\\#F8FAFC\\],
.starla-saas-admin .bg-\\[\\#F8FAFC\\] {
  background-color: #F8FAFC !important;
}
.starla-saas-admin .bg-white {
  background-color: #FFFFFF !important;
}
.starla-saas-admin .bg-\\[\\#2F80ED\\] {
  background-color: #2F80ED !important;
  color: #FFFFFF !important;
}
.starla-saas-admin .bg-\\[\\#2F80ED\\]:hover,
.starla-saas-admin .hover\\:bg-\\[\\#1D6FE0\\]:hover {
  background-color: #1D6FE0 !important;
}
.starla-saas-admin .bg-\\[\\#E3EEFF\\],
.starla-saas-admin .bg-\\[\\#EBF3FF\\] {
  background-color: #E3EEFF !important;
}
.starla-saas-admin .text-\\[\\#2F80ED\\] {
  color: #2F80ED !important;
}
.starla-saas-admin .border-\\[\\#E2E8F0\\],
.starla-saas-admin .border-\\[\\#E2E8F0\\]\\/80 {
  border-color: #E2E8F0 !important;
}
/* Puzzler 5 Pastel Status Badges */
.starla-saas-admin .bg-\\[\\#FFF3D6\\] {
  background-color: #FFF3D6 !important;
  color: #E59500 !important;
}
.starla-saas-admin .bg-\\[\\#D1F5E0\\] {
  background-color: #D1F5E0 !important;
  color: #1B9E5A !important;
}
.starla-saas-admin .bg-\\[\\#FFD8DE\\] {
  background-color: #FFD8DE !important;
  color: #E14B64 !important;
}
.starla-saas-admin .bg-\\[\\#DCEBFE\\] {
  background-color: #DCEBFE !important;
  color: #2F80ED !important;
}
.starla-saas-admin .bg-\\[\\#EDE3FF\\] {
  background-color: #EDE3FF !important;
  color: #8445E5 !important;
}
`;

let cachedUnlayeredTailwindCss = '';
let tailwindHeadObserver: MutationObserver | null = null;

function stripCssLayers(rawCss: string): string {
  return rawCss
    .replace(/@layer\s+properties\s*;/g, '')
    .replace(
      /@layer\s+theme\s*,\s*base\s*,\s*components\s*,\s*utilities\s*;/g,
      ''
    )
    .replace(
      /@layer\s+(theme|base|components|utilities|properties)\s*\{/g,
      '@media all {'
    );
}

export function syncUnlayeredTailwind(isAdminActive: boolean): void {
  if (typeof document === 'undefined') return;
  let unlayeredEl = document.getElementById(
    'starla-tailwind-unlayered'
  ) as HTMLStyleElement | null;

  if (!isAdminActive) {
    document.documentElement.style.removeProperty('font-size');
    if (unlayeredEl) {
      unlayeredEl.disabled = true;
    }
    if (tailwindHeadObserver) {
      tailwindHeadObserver.disconnect();
      tailwindHeadObserver = null;
    }
    return;
  }

  document.documentElement.style.fontSize = '16px';

  const twStyle = Array.from(document.querySelectorAll('style')).find(
    (s) =>
      s.id !== 'starla-tailwind-unlayered' &&
      s.id !== 'starla-admin-scoped-styles' &&
      s.textContent &&
      s.textContent.includes('tailwindcss')
  );

  if (twStyle && twStyle.textContent) {
    cachedUnlayeredTailwindCss = stripCssLayers(twStyle.textContent);
  }

  if (cachedUnlayeredTailwindCss) {
    if (!unlayeredEl) {
      unlayeredEl = document.createElement('style');
      unlayeredEl.id = 'starla-tailwind-unlayered';
      document.head.appendChild(unlayeredEl);
    }
    unlayeredEl.disabled = false;
    if (unlayeredEl.textContent !== cachedUnlayeredTailwindCss) {
      unlayeredEl.textContent = cachedUnlayeredTailwindCss;
    }
    if (document.head.lastElementChild !== unlayeredEl) {
      document.head.appendChild(unlayeredEl);
    }
  }
}

function attachTailwindHeadObserver(): void {
  if (typeof document === 'undefined' || tailwindHeadObserver) return;
  let syncScheduled = false;
  tailwindHeadObserver = new MutationObserver((mutations) => {
    let shouldSync = false;
    for (const m of mutations) {
      const targetEl =
        m.target.nodeType === Node.ELEMENT_NODE
          ? (m.target as HTMLElement)
          : m.target.parentElement;
      if (
        targetEl &&
        targetEl.tagName === 'STYLE' &&
        targetEl.id !== 'starla-tailwind-unlayered' &&
        targetEl.id !== 'starla-admin-scoped-styles' &&
        targetEl.textContent?.includes('tailwindcss')
      ) {
        shouldSync = true;
        break;
      }
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        for (const node of Array.from(m.addedNodes)) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as HTMLElement).tagName === 'STYLE' &&
            (node as HTMLElement).id !== 'starla-tailwind-unlayered'
          ) {
            shouldSync = true;
            break;
          }
        }
      }
    }
    if (shouldSync && !syncScheduled) {
      syncScheduled = true;
      requestAnimationFrame(() => {
        syncScheduled = false;
        syncUnlayeredTailwind(true);
      });
    }
  });

  tailwindHeadObserver.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

/**
 * Ensures portal root and styles exist.
 * IMPORTANT ZERO-LAG OPTIMIZATION:
 * When `isAdminActive === false` (student public view), we DO NOT inject `@tailwindcss/browser@4`
 * so its global DOM MutationObserver NEVER runs during Storyline 60fps slide animations!
 */
export function ensureAdminStylesAndPortalRoot(
  isAdminActive = false
): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  let scopedStyleEl = document.getElementById(
    'starla-admin-scoped-styles'
  ) as HTMLStyleElement | null;
  if (!scopedStyleEl) {
    scopedStyleEl = document.createElement('style');
    scopedStyleEl.id = 'starla-admin-scoped-styles';
    scopedStyleEl.textContent = STARLA_ADMIN_SCOPED_CSS;
    document.head.appendChild(scopedStyleEl);
  } else if (scopedStyleEl.textContent !== STARLA_ADMIN_SCOPED_CSS) {
    scopedStyleEl.textContent = STARLA_ADMIN_SCOPED_CSS;
  }

  if (isAdminActive) {
    attachTailwindHeadObserver();
    if (!document.getElementById('starla-tailwind-runtime')) {
      const scriptEl = document.createElement('script');
      scriptEl.id = 'starla-tailwind-runtime';
      scriptEl.src = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';
      scriptEl.onload = () => {
        syncUnlayeredTailwind(true);
        window.setTimeout(() => syncUnlayeredTailwind(true), 80);
        window.setTimeout(() => syncUnlayeredTailwind(true), 250);
      };
      document.head.appendChild(scriptEl);
    }
  }

  syncUnlayeredTailwind(isAdminActive);

  let root = document.getElementById('starla-admin-portal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'starla-admin-portal-root';
    document.body.appendChild(root);
  } else if (document.body.lastElementChild !== root) {
    document.body.appendChild(root);
  }
  return root;
}
