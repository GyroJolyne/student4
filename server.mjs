import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const routes = ['/', '/partnerships', '/legal/privacy-policy', '/legal/terms-conditions'];
const types = {html:'text/html; charset=utf-8', js:'application/javascript', css:'text/css', wasm:'application/wasm', svg:'image/svg+xml', webp:'image/webp', avif:'image/avif', png:'image/png', jpg:'image/jpeg', json:'application/json', woff2:'font/woff2'};
http.createServer(async (req,res) => {
  const route = new URL(req.url,'http://localhost').pathname.replace(/\/$/,'') || '/';
  const page = routes.includes(route);
  if (!page && !route.startsWith('/assets/')) {res.writeHead(404).end(); return;}
  const name = page ? 'pages/'+(route.slice(1).replace('/','_') || 'home')+'.html' : route.slice(1);
  const file = path.join(root,name);
  try {
    const info = await stat(file);
    if (!info.isFile()) throw Error();
    const isVideo = path.extname(file) === '.mp4';
    const headers = {'Content-Type': isVideo ? 'video/mp4' : types[path.extname(file).slice(1)] || 'application/octet-stream', 'Content-Length':info.size};
    let status = route === '/partnerships' ? 404 : 200;
    let range;
    if (isVideo) {
      headers['Accept-Ranges'] = 'bytes';
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (match && (match[1] || match[2])) {
        const start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]));
        const end = match[1] && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
        if (start > end) {
          res.writeHead(416, {'Content-Range': `bytes */${info.size}`}).end();
          return;
        }
        status = 206;
        range = {start, end};
        headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
        headers['Content-Length'] = end - start + 1;
      }
    }
    res.writeHead(status, headers);
    if (req.method === 'HEAD') {res.end(); return;}
    const stream = createReadStream(file, range);
    res.on('close', () => stream.destroy());
    stream.on('error',()=>res.destroy()).pipe(res);
  } catch {res.writeHead(404).end();}
}).listen(Number(process.env.PORT || 4184),'127.0.0.1');
