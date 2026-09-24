import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { startWatcher } from './watch.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

test('Markdown watcher rebuilds and serves the library safely', { timeout: 60000 }, async context => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'hld-notes-test-'));
  for (const folder of ['explanations', 'cheatsheets']) {
    await fs.cp(path.join(projectRoot, 'notes', folder), path.join(fixture, 'notes', folder), { recursive: true, filter: source => !source.endsWith('.html') });
  }
  const busyServer = http.createServer();
  busyServer.listen(0, '127.0.0.1');
  await once(busyServer, 'listening');
  const logs = [];
  let preview;
  const output = path.join(fixture, 'notes/explanations/distributed-systems-foundations.html');
  const readOutput = () => fs.readFile(output, 'utf8');
  const originalNote = path.join(fixture, 'notes/explanations/processes-vs-threads.md');
  const original = await fs.readFile(originalNote, 'utf8');
  const waitForBuild = predicate => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { preview.events.off('built', listener); reject(new Error('Expected rebuild did not arrive')); }, 8000);
    const listener = async event => {
      try {
        const html = await readOutput();
        if (!predicate(html, event)) return;
        clearTimeout(timer);
        preview.events.off('built', listener);
        resolve({ html, event });
      } catch (error) { clearTimeout(timer); preview.events.off('built', listener); reject(error); }
    };
    preview.events.on('built', listener);
  });
  try {
    preview = await startWatcher({ repoRoot: fixture, port: busyServer.address().port, log: message => logs.push(message) });
    await context.test('initial build, port fallback, standalone output and allowed routes', async () => {
      assert.notEqual(new URL(preview.url).port, String(busyServer.address().port));
      const offline = await readOutput();
      assert.equal((offline.match(/<figure id=/g) || []).length, 37);
      assert(!offline.includes('EventSource'));
      assert(!offline.includes('/tmp/ds-foundations-build'));
      const response = await fetch(preview.url);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert((await response.text()).includes('/__notes_events'));
      const origin = new URL(preview.url).origin;
      assert.equal((await fetch(origin + '/package.json')).status, 404);
      assert.equal((await fetch(origin + '/%2e%2e%2fpackage.json')).status, 404);
      assert.equal((await fetch(origin + '/notes/cheatsheets/cheatsheet-g3-caching.md')).status, 200);
      await fs.symlink(path.join(projectRoot, 'package.json'), path.join(fixture, 'notes/explanations/outside.md'));
      assert.equal((await fetch(origin + '/notes/explanations/outside.md')).status, 403);
      await fs.unlink(path.join(fixture, 'notes/explanations/outside.md'));
    });
    await context.test('saved explanation updates HTML and SSE revision', async () => {
      const connection = new AbortController();
      const stream = await fetch(new URL('/__notes_events', preview.url), { signal: connection.signal });
      const reader = stream.body.getReader();
      const initial = new TextDecoder().decode((await reader.read()).value);
      assert(initial.includes('event: revision'));
      const complete = waitForBuild(html => html.includes('watcher-prose-marker'));
      await fs.writeFile(originalNote, original + '\n\nSaved edit: watcher-prose-marker.\n');
      await complete;
      const received = new TextDecoder().decode((await reader.read()).value);
      assert(received.includes('event: revision'));
      assert.notEqual(received, initial);
      connection.abort();
    });
    await context.test('atomic saves, new explanations, new cheatsheets, and deletion', async () => {
      const newNote = path.join(fixture, 'notes/explanations/new-note.md');
      const newSheet = path.join(fixture, 'notes/cheatsheets/new-reference.md');
      let complete = waitForBuild(html => html.includes('topic-explanation-new-note'));
      await fs.writeFile(newNote, '# New topic\n\n## Details\n\nFreshly discovered explanation.\n');
      await complete;
      complete = waitForBuild(html => html.includes('atomic-save-marker'));
      await fs.writeFile(newNote + '.tmp', '# New topic\n\n## Details\n\natomic-save-marker\n');
      await fs.rename(newNote + '.tmp', newNote);
      await complete;
      complete = waitForBuild(html => html.includes('topic-reference-new-reference'));
      await fs.writeFile(newSheet, '# New reference\n\n## Lookup\n\nreference-discovery-marker\n');
      await complete;
      complete = waitForBuild(html => !html.includes('topic-explanation-new-note') && !html.includes('topic-reference-new-reference'));
      await fs.unlink(newNote);
      await fs.unlink(newSheet);
      await complete;
    });
    await context.test('changed diagram source cannot reuse its old SVG', async () => {
      let complete = waitForBuild(html => html.includes('diagram-source-marker'));
      await fs.writeFile(originalNote, original.replace('MACHINE (physical RAM + CPU cores)', 'MACHINE (diagram-source-marker)'));
      const changed = await complete;
      assert.equal((changed.html.match(/<figure id=/g) || []).length, 36);
      assert(changed.html.includes('SVG redraw pending'));
      assert(changed.event.details.includes('needs an SVG redraw'));
      assert(!changed.html.includes('id="diagram-processes-1"'));
      complete = waitForBuild(html => html.includes('inserted-code-marker'));
      await fs.writeFile(originalNote, original.replace('\n```\n', '\n```java\nString inserted = "inserted-code-marker";\n```\n\n```\n'));
      const inserted = await complete;
      assert.equal((inserted.html.match(/<figure id=/g) || []).length, 37);
      assert(!inserted.html.includes('SVG redraw pending'));
    });
    await context.test('cheatsheet saves update content without changing the standalone contract', async () => {
      const sheet = path.join(fixture, 'notes/cheatsheets/cheatsheet-g3-caching.md');
      const source = await fs.readFile(sheet, 'utf8');
      const complete = waitForBuild(html => html.includes('cheatsheet-save-marker'));
      await fs.writeFile(sheet, source + '\n\n## New section\n\ncheatsheet-save-marker\n');
      const result = await complete;
      assert(result.html.includes('cheatsheet-g3-section-6'));
      assert(!result.html.includes('EventSource'));
    });
    await context.test('build failures preserve last good HTML and recover after another save', async () => {
      const before = await readOutput();
      const broken = path.join(fixture, 'notes/cheatsheets/broken.md');
      const failed = once(preview.events, 'build-failed', { signal: AbortSignal.timeout(8000) });
      await fs.writeFile(broken, '# Invalid table\n\n╔════╗\n╚════╝\n');
      await failed;
      assert.equal(await readOutput(), before);
      const streamController = new AbortController();
      const response = await fetch(new URL('/__notes_events', preview.url), { signal: streamController.signal });
      const payload = new TextDecoder().decode((await response.body.getReader().read()).value);
      assert(payload.includes('event: build-error'));
      streamController.abort();
      const restored = waitForBuild(html => !html.includes('topic-reference-broken'));
      await fs.unlink(broken);
      await restored;
    });
    await context.test('deleting a referenced cheatsheet and the default note stays navigable', async () => {
      let complete = waitForBuild(html => !html.includes('id="panel-cheatsheet-g2"'));
      await fs.unlink(path.join(fixture, 'notes/cheatsheets/cheatsheet-g2-storage.md'));
      const removed = await complete;
      assert(removed.html.includes('source document unavailable'));
      complete = waitForBuild(html => !html.includes('id="panel-processes"'));
      await fs.unlink(originalNote);
      const noDefault = await complete;
      assert.match(noDefault.html, /id="panel-concurrency"[^>]+data-topic="concurrency" >/);
    });
    assert(logs.some(message => message.includes('Build failed')));
  } finally {
    await preview?.close();
    await new Promise(resolve => busyServer.close(resolve));
    await fs.rm(fixture, { recursive: true, force: true });
  }
});