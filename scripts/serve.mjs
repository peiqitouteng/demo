/**
 * 零依赖静态服务器（只用 Node 内置模块），用于本地预览。
 *
 *   npm run dev            # http://localhost:4173
 *   PORT=8080 npm run dev
 *
 * 直接双击 index.html 也能看（file:// 下唯一受限的是剪贴板 API，
 * 页面里有 execCommand 兜底），起服务只是为了更接近真实环境。
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = normalize(decoded).replace(/^([/\\])+/, '');
  const target = join(ROOT, relative);

  // 防目录穿越：解析后必须仍在项目根目录内
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;

  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      const index = join(target, 'index.html');
      const indexInfo = await stat(index);
      if (indexInfo.isFile()) return index;
      return null;
    }
    return target;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed\n', { allow: 'GET, HEAD' });
  }

  const file = await resolveFile(req.url || '/');
  if (!file) return send(res, 404, '404 Not Found\n');

  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {
    'content-type': type,
    'cache-control': 'no-cache',
  });

  if (req.method === 'HEAD') return res.end();

  createReadStream(file)
    .on('error', () => send(res, 500, '500 Internal Server Error\n'))
    .pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`Matt Skills 速查 → http://${HOST}:${PORT}/`);
  console.log(`根目录：${ROOT}`);
});
