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

