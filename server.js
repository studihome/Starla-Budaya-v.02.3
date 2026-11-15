const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;

// Explicit file paths for Vercel Node File Tracer (@vercel/nft)
const INDEX_HTML_PATH = path.join(__dirname, 'index.html');
const STORY_HTML_PATH = path.join(__dirname, 'story.html');
const HTML5_DIR_PATH = path.join(__dirname, 'html5');
const MOBILE_DIR_PATH = path.join(__dirname, 'mobile');
const STORY_CONTENT_DIR_PATH = path.join(__dirname, 'story_content');

function sendHtmlPage(res, filePath) {
  try {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf8');
      return res.status(200).send(html);
    }
    if (fs.existsSync(INDEX_HTML_PATH)) {
      const fallbackHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
      return res.status(200).send(fallbackHtml);
    }
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
}

const { GoogleGenAI, Type } = require('@google/genai');

// Apply JSON body parser for API endpoints
app.use(express.json({ limit: '2mb' }));

// Apply headers matching vercel.json
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'fullscreen=*, autoplay=*');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const reqPath = req.path || '/';
  if (
    reqPath === '/' ||
    reqPath === '/admin' ||
    reqPath.startsWith('/admin/') ||
    reqPath === '/index.html' ||
    reqPath === '/story.html' ||
    reqPath.endsWith('.html')
  ) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  } else if (reqPath.endsWith('.mp4')) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  } else if (
    reqPath.startsWith('/story_content/') ||
    reqPath.startsWith('/html5/') ||
    reqPath.startsWith('/mobile/')
  ) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// Gemini Magic AI Studio Endpoint (Server-Side @google/genai)
app.post('/api/gemini/magic-canvas', async (req, res) => {
  const {
    prompt = '',
    slideId = '',
    slideTitle = '',
    selectedElement = null,
  } = req.body || {};

  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

  if (!apiKey) {
    return res.status(200).json({
      fallback: true,
      message:
        'GEMINI_API_KEY belum disetel di server; menggunakan generator cerdas lokal.',
    });
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
              description:
                '"create-elements" atau "update-selected-popup"',
            },
            summary: {
              type: Type.STRING,
              description: 'Ringkasan singkat tindakan AI dalam bahasa Indonesia',
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
    return res.status(200).json({
      ...parsed,
      source: 'gemini',
    });
  } catch (err) {
    return res.status(200).json({
      fallback: true,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// Explicit static directory mounts for both local Express and Vercel Serverless
app.use('/html5', express.static(HTML5_DIR_PATH));
app.use('/mobile', express.static(MOBILE_DIR_PATH));
app.use('/story_content', express.static(STORY_CONTENT_DIR_PATH));

// Explicit HTML routes for /, /admin, /index.html, and /story.html
app.get(['/', '/index.html', '/admin', '/admin/{*splat}'], (req, res) => {
  sendHtmlPage(res, INDEX_HTML_PATH);
});

app.get(['/story.html', '/story'], (req, res) => {
  sendHtmlPage(res, STORY_HTML_PATH);
});

// Serve static files from root with cleanUrls support (.html extension fallback)
app.use(
  express.static(ROOT_DIR, {
    extensions: ['html'],
    index: ['index.html', 'story.html'],
  })
);

// Global error handler so Vercel Serverless Function never crashes with unhandled exception
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Only bind port when executed directly outside Vercel Serverless runtime
if (require.main === module && !process.env.VERCEL && !process.env.NOW_REGION) {
  app.listen(PORT, HOST, () => {
    console.log(`STARLA BUDAYA server running at http://${HOST}:${PORT}`);
  });
}

// Export callable Express handler for Vercel Serverless AND named { app } for tests
app.app = app;
app.default = app;
app.handler = app;
module.exports = app;

