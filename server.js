const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;

// Explicit file paths for Vercel Node File Tracer (@vercel/nft)
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');
const STORY_HTML_PATH = path.join(__dirname, 'story.html');
const HTML5_DIR_PATH = path.join(__dirname, 'html5');
const MOBILE_DIR_PATH = path.join(__dirname, 'mobile');
const STORY_CONTENT_DIR_PATH = path.join(__dirname, 'story_content');
const ICONS_DIR_PATH = path.join(__dirname, 'icons');
const MANIFEST_PATH = path.join(__dirname, 'manifest.webmanifest');
const SW_PATH = path.join(__dirname, 'sw.js');

let express = null;
try {
  express = require('express');
} catch (_err) {
  express = null;
}

let GoogleGenAI = null;
let Type = null;
try {
  const genai = require('@google/genai');
  GoogleGenAI = genai.GoogleGenAI;
  Type = genai.Type;
} catch (_err) {
  GoogleGenAI = null;
  Type = null;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function applyStandardSecurityAndCacheHeaders(reqPath, res) {
  res.setHeader('Permissions-Policy', 'fullscreen=*, autoplay=*');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (reqPath === '/sw.js') {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (
    reqPath === '/manifest.webmanifest' ||
    reqPath === '/manifest.json'
  ) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  } else if (
    reqPath === '/' ||
    reqPath === '/admin' ||
    reqPath.startsWith('/admin/') ||
    reqPath === '/index.html' ||
    reqPath === '/story.html' ||
    reqPath.endsWith('.html') ||
    reqPath.endsWith('starla-content-bridge.js')
  ) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (reqPath.endsWith('.mp4')) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  } else if (
    reqPath.startsWith('/story_content/') ||
    reqPath.startsWith('/html5/') ||
    reqPath.startsWith('/mobile/') ||
    reqPath.startsWith('/icons/')
  ) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}

async function handleMagicCanvasRequest(bodyObj) {
  const {
    prompt = '',
    slideId = '',
    slideTitle = '',
    selectedElement = null,
  } = bodyObj || {};

  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

  if (!apiKey || !GoogleGenAI || !Type) {
    return {
      fallback: true,
      message:
        'GEMINI_API_KEY belum disetel di server; menggunakan generator cerdas lokal.',
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = [
      'Anda adalah asisten perancang UI interaktif "Magic AI Studio" untuk aplikasi edukasi budaya Nusantara "STARLA BUDAYA".',
      'Tugas Anda adalah mengubah perintah admin menjadi JSON terstruktur untuk kanvas berasio 16:9 dengan koordinat persentase (x: 0-100, y: 0-100, width: 4-100, height: 4-100).',
      'Jika admin meminta pembuatan isi materi pop-up untuk tombol yang sedang dipilih, kembalikan mode="update-selected-popup" beserta popupTitle dan popupContent edukatif.',
      'Jika admin meminta pembuatan tombol/teks/gambar/audio baru (misal: "Buatkan 3 tombol bergambar menu materi di bagian bawah"), kembalikan mode="create-elements" beserta daftar elements yang tertata rapi di koordinat persentase.',
      'Gunakan URL gambar aset bawaan yang valid seperti "mobile/6EfvCxuLoY5.png", "mobile/5WGLEVYzj2G.png", "mobile/5fD3uOAkxBz.png", atau "mobile/5X5KPiU9Isy.png" dan audio "story_content/6DeuLJzk41Q_44100_56_0.mp3".',
    ].join(' ');

    const userContext = JSON.stringify({
      prompt,
      slideId,
      slideTitle,
      selectedElement: selectedElement
        ? {
            id: selectedElement.id,
            type: selectedElement.type,
            label: selectedElement.label,
          }
        : null,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userContext,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mode: {
              type: Type.STRING,
              description: '"create-elements" atau "update-selected-popup"',
            },
            summary: {
              type: Type.STRING,
              description:
                'Ringkasan singkat tindakan AI dalam bahasa Indonesia',
            },
            popupUpdate: {
              type: Type.OBJECT,
              properties: {
                popupTitle: { type: Type.STRING },
                popupContent: { type: Type.STRING },
              },
            },
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description:
                      '"image-button" | "text" | "image" | "audio-button"',
                  },
                  label: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  imageUrl: { type: Type.STRING },
                  audioUrl: { type: Type.STRING },
                  style: {
                    type: Type.OBJECT,
                    properties: {
                      backgroundColor: { type: Type.STRING },
                      textColor: { type: Type.STRING },
                      fontSize: { type: Type.NUMBER },
                      borderRadius: { type: Type.NUMBER },
                      shadow: { type: Type.STRING },
                      hoverEffect: { type: Type.STRING },
                    },
                  },
                  action: {
                    type: Type.OBJECT,
                    properties: {
                      type: {
                        type: Type.STRING,
                        description:
                          '"none" | "goto-slide" | "play-audio" | "open-popup"',
                      },
                      popupTitle: { type: Type.STRING },
                      popupContent: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const rawText = (response.text || '{}').trim();
    const parsed = JSON.parse(rawText);
    return {
      ...parsed,
      source: 'gemini',
    };
  } catch (err) {
    return {
      fallback: true,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Built-in Zero-Dependency Native HTTP Handler Fallback.
 * Guarantees that the dev server starts immediately on port 3000 even if node_modules
 * is missing after a cold container wake-up, while background npm install heals dependencies.
 */
const BRIDGE_SCRIPT_PATH = path.join(
  HTML5_DIR_PATH,
  'lib',
  'scripts',
  'starla-content-bridge.js'
);

function readHtmlWithFreshBridgeUrl(filePath) {
  const rawHtml = fs.readFileSync(filePath, 'utf8');
  let versionTag = 'puzzler-v5';
  try {
    if (fs.existsSync(BRIDGE_SCRIPT_PATH)) {
      const stat = fs.statSync(BRIDGE_SCRIPT_PATH);
      versionTag = `puzzler-${Math.floor(stat.mtimeMs)}-${stat.size}`;
    }
  } catch (_e) {
    // fallback to static version tag
  }
  return rawHtml.replace(
    'src="html5/lib/scripts/starla-content-bridge.js"',
    `src="html5/lib/scripts/starla-content-bridge.js?v=${versionTag}"`
  );
}

function createNativeFallbackApp() {
  const handler = (req, res) => {
    try {
      const parsedUrl = new URL(req.url || '/', 'http://localhost');
      const reqPath = decodeURIComponent(parsedUrl.pathname || '/');
      applyStandardSecurityAndCacheHeaders(reqPath, res);

      if (req.method === 'POST' && reqPath === '/api/gemini/magic-canvas') {
        let rawBody = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
          rawBody += chunk;
        });
        req.on('end', async () => {
          let parsedBody = {};
          try {
            parsedBody = rawBody ? JSON.parse(rawBody) : {};
          } catch (_e) {
            parsedBody = {};
          }
          const result = await handleMagicCanvasRequest(parsedBody);
          const payload = JSON.stringify(result);
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(payload),
          });
          res.end(payload);
        });
        return;
      }

      if (
        reqPath === '/' ||
        reqPath === '/index.html' ||
        reqPath === '/admin' ||
        reqPath.startsWith('/admin/')
      ) {
        const html = readHtmlWithFreshBridgeUrl(INDEX_HTML_PATH);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      if (reqPath === '/manifest.webmanifest' || reqPath === '/manifest.json') {
        if (fs.existsSync(MANIFEST_PATH)) {
          const manifestBuf = fs.readFileSync(MANIFEST_PATH);
          res.writeHead(200, {
            'Content-Type': 'application/manifest+json; charset=utf-8',
            'Content-Length': manifestBuf.length,
          });
          res.end(manifestBuf);
          return;
        }
      }

      if (reqPath === '/sw.js') {
        if (fs.existsSync(SW_PATH)) {
          const swBuf = fs.readFileSync(SW_PATH);
          res.writeHead(200, {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Content-Length': swBuf.length,
          });
          res.end(swBuf);
          return;
        }
      }

      if (reqPath === '/story.html' || reqPath === '/story') {
        const target = fs.existsSync(STORY_HTML_PATH)
          ? STORY_HTML_PATH
          : INDEX_HTML_PATH;
        const html = readHtmlWithFreshBridgeUrl(target);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      const safeRelPath = reqPath.replace(/^\/+/, '');
      let candidatePath = path.resolve(ROOT_DIR, safeRelPath);
      if (!candidatePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      if (
        !fs.existsSync(candidatePath) &&
        !path.extname(candidatePath) &&
        fs.existsSync(`${candidatePath}.html`)
      ) {
        candidatePath = `${candidatePath}.html`;
      }

      if (
        fs.existsSync(candidatePath) &&
        fs.statSync(candidatePath).isFile()
      ) {
        const stat = fs.statSync(candidatePath);
        const ext = path.extname(candidatePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const range = req.headers.range;

        if (range && ext === '.mp4') {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10) || 0;
          const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
          const chunkSize = end - start + 1;
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType,
          });
          fs.createReadStream(candidatePath, { start, end }).pipe(res);
          return;
        }

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stat.size,
        });
        fs.createReadStream(candidatePath).pipe(res);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    } catch (_err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('Internal Server Error');
    }
  };

  handler.listen = (port, host, cb) => {
    const server = http.createServer(handler);
    if (typeof host === 'function') {
      return server.listen(port, host);
    }
    return server.listen(port, host, cb);
  };

  return handler;
}

function createExpressApp() {
  const app = express();

  function sendHtmlPage(res, filePath) {
    try {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      if (fs.existsSync(filePath)) {
        const html = readHtmlWithFreshBridgeUrl(filePath);
        return res.status(200).send(html);
      }
      if (fs.existsSync(INDEX_HTML_PATH)) {
        const fallbackHtml = readHtmlWithFreshBridgeUrl(INDEX_HTML_PATH);
        return res.status(200).send(fallbackHtml);
      }
      return res.sendFile(filePath);
    } catch (_err) {
      return res.status(500).send('Internal Server Error');
    }
  }

  app.use(express.json({ limit: '2mb' }));

  app.use((req, res, next) => {
    applyStandardSecurityAndCacheHeaders(req.path || '/', res);
    next();
  });

  app.post('/api/gemini/magic-canvas', async (req, res) => {
    const result = await handleMagicCanvasRequest(req.body || {});
    return res.status(200).json(result);
  });

  app.get('/html5/lib/scripts/starla-content-bridge.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (fs.existsSync(BRIDGE_SCRIPT_PATH)) {
      return res.status(200).send(fs.readFileSync(BRIDGE_SCRIPT_PATH, 'utf8'));
    }
    return res.status(404).send('// starla-content-bridge.js not found');
  });

  app.get(['/manifest.webmanifest', '/manifest.json'], (_req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    if (fs.existsSync(MANIFEST_PATH)) {
      return res.status(200).send(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    }
    return res.status(404).json({ error: 'Manifest not found' });
  });

  app.get('/sw.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    if (fs.existsSync(SW_PATH)) {
      return res.status(200).send(fs.readFileSync(SW_PATH, 'utf8'));
    }
    return res.status(404).send('// sw.js not found');
  });

  app.use('/icons', express.static(ICONS_DIR_PATH));
  app.use('/html5', express.static(HTML5_DIR_PATH));
  app.use('/mobile', express.static(MOBILE_DIR_PATH));
  app.use('/story_content', express.static(STORY_CONTENT_DIR_PATH));

  app.get(['/', '/index.html', '/admin', '/admin/{*splat}'], (_req, res) => {
    sendHtmlPage(res, INDEX_HTML_PATH);
  });

  app.get(['/story.html', '/story'], (_req, res) => {
    sendHtmlPage(res, STORY_HTML_PATH);
  });

  app.use(
    express.static(ROOT_DIR, {
      extensions: ['html'],
      index: ['index.html', 'story.html'],
    })
  );

  app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return app;
}

const app = express ? createExpressApp() : createNativeFallbackApp();

// If node_modules was missing on cold boot, trigger self-healing npm install in background
if (
  !express &&
  require.main === module &&
  !process.env.VERCEL &&
  !process.env.NOW_REGION
) {
  try {
    const child = spawn('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: ROOT_DIR,
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
  } catch (_err) {
    // Ignore background install spawn error; native HTTP server is already serving port 3000
  }
}

// Only bind port when executed directly outside Vercel Serverless runtime
if (require.main === module && !process.env.VERCEL && !process.env.NOW_REGION) {
  app.listen(PORT, HOST, () => {
    console.log(
      `STARLA BUDAYA server running at http://${HOST}:${PORT} (${
        express ? 'express' : 'native-http-fallback'
      })`
    );
  });
}

// Export callable handler for Vercel Serverless AND named { app } for tests
app.app = app;
app.default = app;
app.handler = app;
module.exports = app;
