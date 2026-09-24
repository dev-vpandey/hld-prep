import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const buildScript = fileURLToPath(new URL('./build.mjs', import.meta.url));
const guidePath = '/notes/explanations/distributed-systems-foundations.html';

function liveReload(version) {
  const storageKey = 'hld-notes-reading-position';
  let previous;
  try { previous = JSON.parse(sessionStorage.getItem(storageKey)); sessionStorage.removeItem(storageKey); } catch {}
  if (previous && previous.hash === location.hash) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const anchor = document.getElementById(previous.anchor);
      scrollTo({ top: anchor ? scrollY + anchor.getBoundingClientRect().top - previous.offset : previous.scroll, behavior: 'instant' });
    }));
  }
  const events = new EventSource('/__notes_events');
  let reloading = false;
  events.addEventListener('revision', event => {
    if (event.data === version || reloading) return;
    reloading = true;
    const panel = document.querySelector('.chapter-panel:not([hidden])');
    const headings = [...panel.querySelectorAll('h1, .note-body h2, .note-body h3')];
    const anchor = headings.filter(heading => heading.getBoundingClientRect().top <= 150).at(-1) || headings[0];
    try { sessionStorage.setItem(storageKey, JSON.stringify({ hash: location.hash, anchor: anchor.id, offset: anchor.getBoundingClientRect().top, scroll: scrollY })); } catch {}
    location.reload();
  });
  events.addEventListener('build-error', event => {
    let notice = document.getElementById('notes-build-error');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'notes-build-error';
      notice.setAttribute('role', 'alert');
      notice.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:100;background:#fff0ed;color:#802f29;padding:12px 20px;font:14px/1.5 sans-serif;max-height:30vh;overflow:auto;border-top:2px solid #b84d46';
      document.body.append(notice);
    }
    notice.textContent = 'Notes build failed. Showing the last successful version. ' + JSON.parse(event.data);
  });
  events.addEventListener('build-ok', () => document.getElementById('notes-build-error')?.remove());
}

export async function startWatcher({ repoRoot = projectRoot, port = 4173, log = console.log } = {}) {
  repoRoot = await fs.realpath(path.resolve(repoRoot));
  const output = path.join(repoRoot, guidePath);
  const events = new EventEmitter();
  const clients = new Set();
  const directories = ['notes/explanations', 'notes/cheatsheets'].map(folder => path.join(repoRoot, folder));
  let revision = '';
  let lastError = '';
  let timer;
  let child;
  let closed = false;
  let running = false;
  let pending = false;
  const broadcast = (name, data) => {
    for (const client of clients) client.write(`event: ${name}\ndata: ${data}\n\n`);
  };
  async function build() {
    if (closed) return false;
    if (running) { pending = true; return false; }
    running = true;
    log('Building notes...');
    let details = '';
    let successful = false;
    try {
      await new Promise((resolve, reject) => {
        child = spawn(process.execPath, [buildScript, '--root', repoRoot], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
        child.stdout.on('data', chunk => { details += chunk; });
        child.stderr.on('data', chunk => { details += chunk; });
        child.once('error', reject);
        child.once('close', code => code === 0 ? resolve() : reject(new Error(details.trim() || `Builder exited with code ${code}`)));
      });
      const html = await fs.readFile(output);
      revision = createHash('sha256').update(html).digest('hex');
      lastError = '';
      log(details.trim());
      log('Build complete.');
      broadcast('build-ok', '{}');
      broadcast('revision', revision);
      successful = true;
      events.emit('built', { revision, details });
    } catch (error) {
      lastError = error.message;
      log(`Build failed: ${lastError}`);
      broadcast('build-error', JSON.stringify(lastError));
      events.emit('build-failed', error);
    } finally {
      running = false;
      child = undefined;
      if (pending && !closed) { pending = false; schedule(); }
    }
    return successful;
  }
  function schedule() {
    clearTimeout(timer);
    if (!closed) timer = setTimeout(() => { void build(); }, 150);
  }
  const watcher = chokidar.watch([...directories, buildScript, fileURLToPath(new URL('./diagram-sources.json', import.meta.url))], {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 }
  });
  watcher.on('all', (event, file) => {
    if (file.endsWith('.md') || file === buildScript || file.endsWith('/diagram-sources.json') || event === 'addDir' || event === 'unlinkDir') schedule();
  });
  watcher.on('error', error => { log(`Watch error: ${error.message}`); events.emit('watch-failed', error); });
  await new Promise((resolve, reject) => { watcher.once('ready', resolve); watcher.once('error', reject); });
  if (!await build()) { await watcher.close(); clearTimeout(timer); closed = true; throw new Error(lastError); }

  const server = http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (!/^127\.0\.0\.1:\d+$/.test(request.headers.host || '')) { response.writeHead(403).end(); return; }
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      if (pathname === '/__notes_events' && request.method === 'GET') {
        response.writeHead(200, { 'Content-Type': 'text/event-stream', Connection: 'keep-alive' });
        response.write(`event: revision\ndata: ${revision}\n\n`);
        if (lastError) response.write(`event: build-error\ndata: ${JSON.stringify(lastError)}\n\n`);
        clients.add(response);
        response.on('close', () => clients.delete(response));
        return;
      }
      if (pathname === '/') { response.writeHead(302, { Location: guidePath }).end(); return; }
      const candidate = path.resolve(repoRoot, '.' + pathname);
      const isGuide = pathname === guidePath;
      const isMarkdown = pathname.endsWith('.md') && directories.some(directory => candidate.startsWith(directory + path.sep));
      if (!isGuide && !isMarkdown) { response.writeHead(404).end('Not found'); return; }
      const real = await fs.realpath(candidate);
      if (!directories.some(directory => real.startsWith(directory + path.sep))) { response.writeHead(403).end(); return; }
      let content = await fs.readFile(real, 'utf8');
      if (isGuide) {
        const servedRevision = createHash('sha256').update(content).digest('hex');
        content = content.replace('</body>', `<script>(${liveReload.toString()})(${JSON.stringify(servedRevision)});</script></body>`);
      }
      response.writeHead(200, { 'Content-Type': isGuide ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 400).end('Unable to read note');
    }
  });
  async function close() {
    closed = true;
    clearTimeout(timer);
    if (child) child.kill();
    await watcher.close();
    for (const client of clients) client.end();
    clients.clear();
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
  }
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        await new Promise((resolve, reject) => {
          const fail = error => { server.off('listening', ready); reject(error); };
          const ready = () => { server.off('error', fail); resolve(); };
          server.once('error', fail);
          server.once('listening', ready);
          server.listen(port ? port + attempt : 0, '127.0.0.1');
        });
        break;
      } catch (error) {
        if (error.code !== 'EADDRINUSE' || attempt >= 10 || port === 0) throw error;
      }
    }
  } catch (error) { await close(); throw error; }
  const url = `http://127.0.0.1:${server.address().port}${guidePath}`;
  log(`Notes preview ready: ${url}`);
  return { url, events, close };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const watcher = await startWatcher();
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void watcher.close(); });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}