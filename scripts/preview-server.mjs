import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
]);
const previewPort = Number(process.env.JINGYI_PREVIEW_PORT) || 8766;
let previewUpdateAvailable = true;

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  if (request.method === 'POST' && pathname === '/api/backends/chat-completions/status') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ data: [{ id: 'translator-small' }, { id: 'translator-pro' }] }));
    return;
  }
  if (request.method === 'GET' && pathname === '/api/extensions/discover') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify([{ name: 'third-party/jingyi', type: 'local' }]));
    return;
  }
  if (request.method === 'POST' && pathname === '/api/extensions/version') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({
      currentBranchName: 'main',
      currentCommitHash: '1234567890abcdef',
      isUpToDate: !previewUpdateAvailable,
      remoteUrl: 'https://github.com/iabil-604/jingyi',
    }));
    return;
  }
  if (request.method === 'POST' && pathname === '/api/extensions/update') {
    const wasUpToDate = !previewUpdateAvailable;
    previewUpdateAvailable = false;
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ shortCommitHash: 'abcdef0', isUpToDate: wasUpToDate }));
    return;
  }
  const relative = pathname === '/' ? 'preview.html' : pathname.replace(/^\/+/, '');
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(target, (error, data) => {
    if (error) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mime.get(path.extname(target)) || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(data);
  });
}).listen(previewPort, '127.0.0.1', () => {
  console.log(`Jingyi preview: http://127.0.0.1:${previewPort}/`);
});
