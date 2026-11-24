import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { app } = require('./server.js');

function request(server: http.Server, reqPath: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === 'string') {
      reject(new Error('Server not listening'));
      return;
    }
    http.get({ hostname: '127.0.0.1', port: addr.port, path: reqPath }, (res: http.IncomingMessage) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, headers: res.headers, body });
      });
    }).on('error', reject);
  });
}

function startServer(): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

test('story.html and index.html are 100% identical (Hukum 10)', () => {
  const storyHtml = fs.readFileSync(path.join(process.cwd(), 'story.html'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.equal(storyHtml, indexHtml);
});

test('Tahap 1-3 & 10 Hukum Keras Anti-Regresi verified in story.html', () => {
  const storyHtml = fs.readFileSync(path.join(process.cwd(), 'story.html'), 'utf8');

  // Tahap 1: Amber rounded star SVG favicon without background
  assert.ok(storyHtml.includes("linearGradient id='amberStar'"));
  assert.ok(storyHtml.includes("stroke-linejoin='round'"));

  // Hukum 1: html, body display: block
  assert.ok(storyHtml.includes('display: block;'));

  // Tahap 2: Video visibility & Sinema (6VpxF5tzDfS.png / 5ZPukeMFffY) autoplay for video_5gKzK4lbTf6_22_56_1280x720.mp4
  assert.ok(storyHtml.includes('function isTargetVideo5gKz(el)'));
  assert.ok(storyHtml.includes('function isSlideVideoActuallyOpen(videoEl)'));
  assert.ok(storyHtml.includes('function isSinemaTriggerElement(el)'));
  assert.ok(storyHtml.includes('function triggerSinemaVideoAutoplay()'));
  assert.ok(storyHtml.includes('function hideTargetVideoPoster(videoEl)'));
  assert.ok(storyHtml.includes('5ZPukeMFffY'));
  assert.ok(storyHtml.includes('video_5gkzk4lbtf6_22_56_1280x720'));

  const videoStat = fs.statSync(path.join(process.cwd(), 'story_content', 'video_5gKzK4lbTf6_22_56_1280x720.mp4'));
  assert.equal(videoStat.size, 4536230);

  // Front stage blinking ACCESS button below fingerprint icon
  assert.ok(storyHtml.includes('id="starla-access-btn"'));
  assert.ok(storyHtml.includes('<span class="starla-access-label">ACCESS</span>'));
  assert.ok(storyHtml.includes('@keyframes starlaAccessBlink'));

  // Tahap 3: Capture-phase broken image listener & protected valid assets
  assert.ok(storyHtml.includes("window.addEventListener('error'"));
  assert.ok(storyHtml.includes('5gkganedbet.png'));
  assert.ok(storyHtml.includes('6cvvybugy8d_p_246_0_1299_405.png'));
  assert.ok(storyHtml.includes('6efvcxuloy5.png'));

  // Hukum 8 & 9: Murid terminology & canonical URL
  assert.ok(!/siswa|peserta didik/i.test(storyHtml));
  assert.ok(storyHtml.includes('https://faryzt.github.io/starla-360/'));
});

test('server serves index.html, story.html, and video_5gKzK4lbTf6_22_56_1280x720.mp4 cleanly', async () => {
  const server = await startServer();
  try {
    const res = await request(server, '/story.html');
    assert.equal(res.status, 200);
    assert.equal(res.headers['permissions-policy'], 'fullscreen=*, autoplay=*');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['cache-control'], 'no-cache, must-revalidate');
    assert.ok(res.body.includes('<title>STARLA BUDAYA</title>'));

    const addr = server.address();
    assert.ok(addr && typeof addr !== 'string');
    const videoStatus = await new Promise<number>((resolve, reject) => {
      http.get(
        {
          hostname: '127.0.0.1',
          port: addr.port,
          path: '/story_content/video_5gKzK4lbTf6_22_56_1280x720.mp4',
          headers: { Range: 'bytes=0-1023' },
        },
        (vRes: http.IncomingMessage) => {
          vRes.resume();
          resolve(vRes.statusCode || 0);
        }
      ).on('error', reject);
    });
    assert.ok(videoStatus === 200 || videoStatus === 206);
  } finally {
    server.close();
  }
});

test('Vercel Serverless Function compatibility: exported handler is directly callable and serves / and /admin without 500 error', async () => {
  const serverModule = require('./server.js');
  assert.equal(typeof serverModule, 'function');
  assert.equal(typeof serverModule.default, 'function');
  assert.equal(typeof serverModule.app, 'function');

  const vercelJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8')
  );
  assert.equal(vercelJson.cleanUrls, true);
  assert.ok(
    Array.isArray(vercelJson.rewrites) &&
      vercelJson.rewrites.some(
        (r: { source: string; destination: string }) =>
          r.source === '/admin' && r.destination === '/index.html'
      )
  );

  // Simulate Vercel Serverless Function launcher wrapping the default export directly with http.createServer(handler)
  const serverlessServer = await new Promise<http.Server>((resolve, reject) => {
    const srv = http.createServer(serverModule);
    srv.listen(0, '127.0.0.1', () => resolve(srv));
    srv.on('error', reject);
  });

  try {
    const rootRes = await request(serverlessServer, '/');
    assert.equal(rootRes.status, 200);
    assert.ok(rootRes.body.includes('<title>STARLA BUDAYA</title>'));

    const adminRes = await request(serverlessServer, '/admin');
    assert.equal(adminRes.status, 200);
    assert.ok(adminRes.body.includes('<title>STARLA BUDAYA</title>'));

    const adminQueryRes = await request(serverlessServer, '/?mode=admin');
    assert.equal(adminQueryRes.status, 200);
    assert.ok(adminQueryRes.body.includes('<title>STARLA BUDAYA</title>'));

    // Test POST /api/gemini/magic-canvas endpoint
    const addr = serverlessServer.address();
    assert.ok(addr && typeof addr !== 'string');
    const postRes = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const payload = JSON.stringify({
        prompt: 'Buatkan 3 tombol bergambar menu materi di bagian bawah',
        slideTitle: 'Menu Materi',
        slideIndex: 0,
        totalSlides: 43,
      });
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: addr.port,
          path: '/api/gemini/magic-canvas',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
        }
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
    assert.equal(postRes.status, 200);
    const parsedPost = JSON.parse(postRes.body);
    assert.ok(parsedPost.fallback === true || parsedPost.mode === 'create-elements');
  } finally {
    serverlessServer.close();
  }
});

test('Hybrid PWA endpoints (/manifest.webmanifest, /manifest.json, /sw.js, and /icons/*) serve cleanly with compliant headers', async () => {
  const server = await startServer();
  try {
    const manifestRes = await request(server, '/manifest.webmanifest');
    assert.equal(manifestRes.status, 200);
    assert.ok(
      String(manifestRes.headers['content-type'] || '').includes(
        'application/manifest+json'
      )
    );
    const manifest = JSON.parse(manifestRes.body);
    assert.equal(manifest.id, '/');
    assert.equal(manifest.name, 'STARLA BUDAYA');
    assert.ok(manifest.short_name.length <= 12);
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.start_url, '/');
    assert.equal(manifest.scope, '/');

    const manifestJsonAlias = await request(server, '/manifest.json');
    assert.equal(manifestJsonAlias.status, 200);

    const swRes = await request(server, '/sw.js');
    assert.equal(swRes.status, 200);
    assert.equal(swRes.headers['service-worker-allowed'], '/');
    assert.ok(
      String(swRes.headers['content-type'] || '').includes('javascript')
    );

    const icon192 = await request(server, '/icons/pwa-192x192.png');
    assert.equal(icon192.status, 200);
    assert.ok(String(icon192.headers['content-type'] || '').includes('image/png'));

    const icon512 = await request(server, '/icons/pwa-512x512.png');
    assert.equal(icon512.status, 200);

    const appleIcon = await request(server, '/icons/apple-touch-icon.png');
    assert.equal(appleIcon.status, 200);

    const svgIcon = await request(server, '/icons/starla-icon.svg');
    assert.equal(svgIcon.status, 200);
    assert.ok(String(svgIcon.headers['content-type'] || '').includes('image/svg+xml'));
  } finally {
    server.close();
  }
});


