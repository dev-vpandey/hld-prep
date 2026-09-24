import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const require = createRequire(import.meta.url);
const repoRoot = process.argv.includes('--root') ? path.resolve(process.argv[process.argv.indexOf('--root') + 1]) : fileURLToPath(new URL('../', import.meta.url));
const root = path.join(repoRoot, 'notes/explanations');
const output = path.join(root, 'distributed-systems-foundations.html');
const diagramSources = JSON.parse(fs.readFileSync(new URL('./diagram-sources.json', import.meta.url), 'utf8'));
const warnings = [];
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const icon = name => fs.readFileSync(require.resolve(`lucide-static/icons/${name}.svg`), 'utf8').replace(/<\?xml[^>]*>/g, '').replace('<svg ', '<svg aria-hidden="true" ');
const ink = '#243943', teal = '#087f73', blue = '#2866b5', red = '#b84d46', gold = '#91651d';
const tones = { teal: ['#e5f4ef', teal], blue: ['#edf3fc', blue], red: ['#fff0ed', red], gold: ['#fff6df', gold], gray: ['#f0f3f4', '#50646d'] };
let sequence = 0;
let currentMarker = '';
const text = (x, y, value, size = 17, color = ink, anchor = 'start', weight = 500) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(value)}</text>`;
const lines = (x, y, values, size = 16, color = ink, anchor = 'start') => values.map((value, index) => text(x, y + index * 24, value, size, color, anchor)).join('');
const box = (x, y, width, height, title, subtitle = '', tone = 'teal') => {
  const [fill, stroke] = tones[tone];
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="7" fill="${fill}" stroke="${stroke}" stroke-opacity=".35"/>` + text(x + width / 2, y + (subtitle ? 30 : height / 2 + 6), title, 18, stroke, 'middle', 650) + (subtitle ? lines(x + width / 2, y + 56, subtitle.split('|'), 14, ink, 'middle') : '');
};
const arrow = (x1, y1, x2, y2, label = '', color = '#71868c', dashed = false) => `<path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="${color}" stroke-width="2" ${dashed ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#${currentMarker})"/>` + (label ? text((x1 + x2) / 2, (y1 + y2) / 2 - 10, label, 14, ink, 'middle') : '');
const route = (points, color = '#71868c', dashed = false) => `<path d="M${points.map(point => point.join(',')).join(' L')}" fill="none" stroke="${color}" stroke-width="2" ${dashed ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#${currentMarker})"/>`;
const badge = (x, y, title, tone = 'teal', width = 170) => box(x, y, width, 38, title, '', tone);
const heading = (value, sub = '') => text(32, 38, value, 22, ink, 'start', 700) + (sub ? text(32, 65, sub, 15, '#50646d') : '');
const node = (x, y, label, value, tone = 'teal', width = 144) => box(x, y, width, 82, label, value, tone);
const scene = (title, description, height, draw) => ({ title, description, height, draw });
const timeline = scene('One core interleaves. Multiple cores overlap.', 'Concurrent tasks take turns on one core; parallel tasks execute at the same instant on separate cores.', 350, () => {
  let svg = heading('Two execution models', 'Color follows the task, not the CPU core.');
  svg += text(32, 110, 'CONCURRENCY', 15, teal, 'start', 700) + text(470, 110, 'PARALLELISM', 15, blue, 'start', 700);
  const colors = { A: 'teal', B: 'blue', C: 'gold' };
  ['A', 'B', 'A', 'C', 'B', 'A', 'C'].forEach((task, index) => { svg += box(32 + index * 55, 145, 49, 45, task, '', colors[task]); });
  ['A', 'B', 'C'].forEach((task, row) => {
    svg += text(470, 151 + row * 54, `Core ${row + 1}`, 14);
    for (let slot = 0; slot < 5; slot++) svg += box(534 + slot * 53, 123 + row * 54, 47, 43, task, '', colors[task]);
  });
  svg += arrow(32, 265, 420, 265, 'Time') + arrow(475, 300, 810, 300, 'Time');
  svg += text(32, 308, 'A, B, C make interleaved progress.', 16);
  return svg;
});
const stateMachine = detailed => scene(detailed ? 'Circuit breaker: thresholds and recovery' : 'Circuit breaker: three states', 'Closed allows calls. Failures open the breaker. After a cooldown, half-open permits probes; success closes it and failure reopens it.', 355, () => {
  let svg = heading('Stop new damage. Probe before resuming.', detailed ? 'Window: 20 calls  /  Threshold: 50%  /  Cooldown: 10s  /  Probes: 5' : 'Each caller tracks the health of each dependency independently.');
  svg += node(40, 125, 'CLOSED', 'Calls pass through', 'teal', 180) + node(340, 125, 'OPEN', 'Calls fail fast', 'red', 180) + node(640, 125, 'HALF-OPEN', detailed ? 'Allow 5 probes' : 'Allow test calls', 'gold', 180);
  svg += arrow(222, 158, 334, 158, detailed ? '>= 50% fail' : 'Failures') + arrow(522, 158, 634, 158, detailed ? 'After 10s' : 'Cooldown');
  svg += route([[732, 208], [732, 255], [432, 255], [432, 210]], red) + text(580, 246, 'Probe fails: reopen', 15, red, 'middle');
  svg += route([[750, 124], [750, 93], [131, 93], [131, 121]], teal) + text(450, 85, detailed ? 'All 5 probes succeed: close' : 'Probe succeeds: close', 14, teal, 'middle');
  svg += text(40, 319, 'Correction: OPEN -> HALF-OPEN is triggered by elapsed time, not a successful call.', 15, red);
  return svg;
});
const partitionScene = scene('A broken link is not a dead node', 'Before the partition A, B, and C communicate. Afterwards A and B remain connected, while C is isolated but may still be running.', 325, () => heading('Same machines. Different reachability.') + text(32, 89, 'BEFORE', 15, teal, 'start', 700) + node(32, 119, 'A', 'Healthy', 'teal', 96) + node(167, 119, 'B', 'Healthy', 'teal', 96) + node(302, 119, 'C', 'Healthy', 'teal', 96) + arrow(130, 158, 162, 158) + arrow(265, 158, 296, 158) + text(480, 89, 'AFTER', 15, red, 'start', 700) + node(465, 119, 'A', 'Reachable', 'teal', 100) + node(594, 119, 'B', 'Reachable', 'teal', 100) + arrow(567, 158, 588, 158) + node(740, 119, 'C', 'Isolated', 'red', 100) + `<path d="M720 110 L706 145 L725 166 L711 209" fill="none" stroke="${red}" stroke-width="3"/>` + lines(32, 264, ['A timeout means unreachable. It does not prove the other node has crashed.', 'Inside each group, communication can still work normally.'], 17));
const asyncFlow = scene('Acknowledge now, replicate later', 'The first node acknowledges the client before background replication reaches the other replicas. Reads there may briefly be stale.', 310, () => heading('Fast response, a replication-lag window') + node(40, 125, 'Client', 'WRITE x = 15', 'gray', 165) + node(345, 125, 'Node 1', 'x = 15', 'teal', 165) + node(650, 125, 'Nodes 2, 3', 'Catch up later', 'blue', 170) + arrow(208, 147, 340, 147, 'Write') + arrow(342, 185, 209, 185, 'ACK', teal) + arrow(513, 167, 645, 167, 'Async', blue, true) + text(40, 270, 'Success can precede convergence. Durability depends on the actual replication policy.', 16));
const choice = scene('PACELC asks two different questions', 'During a partition choose availability or consistency. Otherwise choose latency or consistency.', 345, () => heading('Partition or normal operation?') + box(290, 83, 280, 58, 'Network partition?') + route([[350, 143], [350, 181], [222, 181], [222, 210]]) + route([[510, 143], [510, 181], [643, 181], [643, 210]]) + text(300, 174, 'YES', 14, red, 'middle', 700) + text(555, 174, 'NO / ELSE', 14, blue, 'middle', 700) + box(40, 214, 365, 94, 'Availability or Consistency', 'CAP: what happens during the break?', 'red') + box(460, 214, 365, 94, 'Latency or Consistency', 'PACELC: the everyday trade-off', 'blue'));
const scenes = {
  availability: [
    null,
    scene('Availability is measured over time', 'Seven uptime intervals and one outage. Downtime consumes the error budget.', 245, () => {
      let svg = heading('The outage window consumes your error budget');
      for (let slot = 0; slot < 8; slot++) svg += box(32 + slot * 101, 91, 92, 54, slot === 3 ? 'DOWN' : 'UP', '', slot === 3 ? 'red' : 'teal');
      return svg + arrow(32, 188, 828, 188, 'Time') + text(381, 228, 'Outage window', 16, red, 'middle');
    }),
    scene('Active-passive: promote the standby', 'The active node serves traffic and replicates to an idle standby. If it fails, detection and promotion create a brief failover gap.', 335, () => heading('One serves. One waits.') + node(32, 130, 'Client', '100% traffic', 'gray', 170) + node(340, 90, 'Active', 'Serving traffic', 'teal', 190) + node(340, 230, 'Passive', 'Synced standby', 'blue', 190) + arrow(207, 164, 334, 130, 'Requests') + arrow(435, 175, 435, 224, 'Sync') + lines(590, 125, ['1. Active fails', '2. Detect the failure', '3. Promote standby', '4. Resume traffic'], 18) + text(590, 252, 'Failover gap', 18, red, 'start', 700)),
    scene('Active-active: both nodes serve', 'A load balancer routes to both nodes. When one becomes unhealthy, it removes that node and the surviving node must absorb the traffic.', 330, () => heading('Capacity must survive the loss, too.') + box(280, 86, 300, 65, 'Load balancer', '', 'gray') + node(90, 224, 'Node A', 'Live traffic', 'teal', 260) + node(510, 224, 'Node B', 'Live traffic', 'blue', 260) + arrow(345, 154, 220, 218, 'Healthy route') + arrow(515, 154, 640, 218, 'Healthy route')),
    scene('Detect, remove, promote', 'Health checks keep traffic on Node A and remove Node B after three missed checks. Database replication supplies a promotable copy.', 370, () => heading('Routing health and data recovery are separate') + box(32, 125, 210, 70, 'Load balancer', '', 'gray') + node(555, 91, 'Node A', '200 OK: keep routing', 'teal', 266) + node(555, 203, 'Node B', '3 timeouts: remove', 'red', 266) + arrow(245, 144, 549, 128, 'Ping every 5s') + arrow(245, 178, 549, 237, 'Ping every 5s') + badge(32, 311, 'Primary DB', 'teal', 210) + badge(555, 311, 'Replica DB', 'blue', 266) + arrow(245, 330, 549, 330, 'Replicate; promote on failure')),
    scene('Contain the fault and keep operating', 'An aircraft analogy: detect a failed engine, isolate it, and rebalance control to the surviving engine. Service can continue in a degraded but correct state.', 330, () => heading('Fault tolerance: detect -> isolate -> recover') + node(70, 95, 'Engine 1', 'Failed / isolated', 'red', 270) + node(520, 95, 'Engine 2', 'Still operating', 'teal', 270) + arrow(210, 180, 350, 240, 'Isolate', red) + arrow(655, 180, 510, 240, 'Rebalance', teal) + box(270, 246, 320, 60, 'Aircraft remains controllable', '', 'blue')),
    scene('Three votes commit. Two cannot.', 'In a five-node majority consensus group, three acknowledgments can commit a write. Only two reachable voters cannot form a majority.', 300, () => {
      let svg = heading('N = 5  /  Majority = 3');
      for (let slot = 0; slot < 5; slot++) svg += node(32 + slot * 166, 112, `N${slot + 1}`, slot < 3 ? 'ACK' : 'Down', slot < 3 ? 'teal' : 'red');
      return svg + badge(32, 237, '3 / 5: commit', 'teal', 350) + badge(466, 237, '2 / 5: reject or wait', 'red', 360);
    }),
    scene('Synchronous vs asynchronous replication', 'Synchronous replication waits for replica acknowledgment before replying to the client. Asynchronous replication replies first and propagates later, exposing a data-loss window.', 405, () => heading('When does the client hear "OK"?') + text(32, 91, 'SYNCHRONOUS', 15, teal, 'start', 700) + node(32, 115, 'Client', 'Waits for replica', 'gray', 190) + node(335, 115, 'Primary', 'Write stored', 'teal', 190) + node(640, 115, 'Replica', 'Confirms copy', 'blue', 190) + arrow(225, 137, 330, 137, 'Write') + arrow(527, 137, 635, 137, 'Replicate') + arrow(636, 183, 530, 183, 'ACK') + arrow(331, 183, 227, 183, 'Then OK') + text(32, 249, 'ASYNCHRONOUS', 15, blue, 'start', 700) + node(32, 273, 'Client', 'Receives OK early', 'gray', 190) + node(335, 273, 'Primary', 'May fail before sync', 'gold', 190) + node(640, 273, 'Replica', 'Receives copy later', 'blue', 190) + arrow(225, 295, 330, 295, 'Write') + arrow(331, 341, 227, 341, 'OK now') + arrow(527, 315, 635, 315, 'Later', blue, true) + text(430, 387, 'Async risk: acknowledged write not yet present on the replica.', 16, red, 'middle')),
    scene('A majority can progress; a minority cannot commit', 'After a five-node group splits two versus three, the old leader on the minority side cannot commit writes. A leader on the majority side can progress. Fencing protects external resources.', 365, () => heading('Split-brain prevention', 'Leadership claims are not enough. Require a quorum and fence stale owners.') + box(32, 105, 335, 154, 'Side A: L1 + N2', '2 / 5 nodes|Old leader lacks a majority|No successful commits', 'red') + box(495, 105, 335, 154, 'Side B: N3 + N4 + N5', '3 / 5 nodes|Can elect a new leader|Majority can commit', 'teal') + `<path d="M435 102 L417 152 L442 190 L423 258" fill="none" stroke="${red}" stroke-width="3"/>` + badge(150, 298, 'Fencing: reject writes from the stale owner', 'blue', 560)),
    null,
    null,
    scene('Three zones, a two-replica write quorum', 'A global load balancer routes to three availability zones. Each zone has application nodes and a database replica. Losing two zones leaves one replica, which cannot satisfy a two-of-three write quorum.', 430, () => {
      let svg = heading('Checkout survives only while its write quorum survives') + box(280, 83, 300, 60, 'Global load balancer', '', 'gray');
      [60, 330, 600].forEach((left, index) => {
        svg += box(left, 218, 220, 137, `AZ-${index + 1}`, 'Local routing / app nodes|Database replica', index ? 'blue' : 'teal');
        svg += arrow(430, 146, left + 110, 210);
      });
      return svg + arrow(283, 321, 324, 321, 'Sync') + arrow(553, 321, 594, 321, 'Sync') + text(430, 397, '2 / 3 replicas: writes succeed.  1 / 3: checkout writes stop.', 18, red, 'middle', 650);
    })
  ],
  consistency: [
    scene('A stale answer or no answer', 'Both replicas began with x=10. A receives x=15 during a partition. B cannot learn the new value, so a read at B is stale or refused.', 310, () => heading('Start: A = 10, B = 10. Then the link breaks.') + node(50, 120, 'Node A', 'WRITE x = 15', 'teal', 240) + node(570, 120, 'Node B', 'Still x = 10', 'gold', 240) + arrow(296, 158, 564, 158, 'Partition: no updates', red, true) + badge(50, 243, 'Availability: B returns 10', 'gold', 360) + badge(455, 243, 'Consistency: B refuses', 'blue', 360)),
    asyncFlow,
    scene('CAP is crisis mode. PACELC includes normal mode.', 'With a healthy link, acknowledgment timing trades latency against consistency. During a partition, an isolated replica cannot guarantee both fresh reads and an answer.', 335, () => heading('Two operating conditions') + text(32, 91, 'NORMAL OPERATION', 15, teal, 'start', 700) + node(32, 124, 'A', 'x = 15', 'teal', 135) + node(300, 124, 'B', 'Sync or async?', 'blue', 135) + arrow(171, 163, 293, 163, 'Replicate') + text(32, 253, 'Wait for freshness or acknowledge early.', 16) + text(481, 91, 'PARTITION', 15, red, 'start', 700) + node(480, 124, 'A', 'x = 15', 'teal', 130) + node(705, 124, 'B', 'x = 10', 'gold', 130) + arrow(614, 163, 699, 163, 'Broken', red, true) + lines(481, 253, ['B must return possibly stale data', 'or refuse the operation.'], 16)),
    scene('Read the six letters as a conditional', 'P means partition. During a partition, availability or consistency. Else, latency or consistency.', 230, () => {
      let svg = heading('P A C E L C');
      [['P', 'Partition', 'red'], ['A', 'Availability', 'red'], ['C', 'Consistency', 'red'], ['E', 'Else', 'blue'], ['L', 'Latency', 'blue'], ['C', 'Consistency', 'blue']].forEach(([letter, word, tone], index) => { svg += node(32 + index * 136, 102, letter, word, tone, 122); });
      return svg;
    }),
    scene('Two decisions, not one', 'If the network is partitioned, availability versus consistency. Otherwise latency versus consistency.', 245, () => heading('PACELC in two lines') + box(32, 93, 370, 108, 'During a partition', 'A: answer  /  C: preserve consistency', 'red') + box(460, 93, 370, 108, 'Else: normal operation', 'L: respond sooner  /  C: coordinate', 'blue')),
    scene('Decode PA/EL and PC/EC', 'Read the left half as behavior during a partition and the right half as behavior in normal operation.', 295, () => heading('Partition behavior / Else behavior') + badge(32, 103, 'PA / EL', 'teal', 172) + box(260, 89, 260, 77, 'Partition: Availability', '', 'teal') + box(555, 89, 275, 77, 'Else: Latency', '', 'blue') + badge(32, 217, 'PC / EC', 'blue', 172) + box(260, 203, 260, 77, 'Partition: Consistency', '', 'blue') + box(555, 203, 275, 77, 'Else: Consistency', '', 'blue')),
    choice,
    scene('Availability-first on the isolated side', 'An availability-first model accepts a write on an isolated node and reconciles later. Whether a real database permits this depends on its configuration and acknowledgment requirements.', 290, () => heading('Illustrative Dynamo-style availability choice') + node(32, 119, 'Client', 'Add item', 'gray', 160) + node(320, 119, 'Node 1', 'Accept; sync later', 'teal', 210) + node(658, 119, 'Nodes 2, 3', 'Unreachable', 'red', 170) + arrow(195, 160, 314, 160, 'Write') + arrow(533, 160, 651, 160, 'Partition', red, true) + text(32, 257, 'Actual products and consistency levels do not all accept isolated writes.', 16, red)),
    asyncFlow,
    scene('Fan out to five, wait for three', 'For N=5 and W=3, the coordinator sends the write to all replicas and acknowledges success after the first three responses. The other two may catch up later.', 390, () => {
      let svg = heading('N = 5  /  W = 3') + box(265, 92, 330, 68, 'Request coordinator', 'Not a permanent master', 'gray');
      for (let slot = 0; slot < 5; slot++) {
        svg += arrow(430, 164, 104 + slot * 166, 225);
        svg += node(32 + slot * 166, 234, `Node ${slot + 1}`, [0, 2, 3].includes(slot) ? 'ACK received' : 'Still catching up', [0, 2, 3].includes(slot) ? 'teal' : 'gold');
      }
      return svg + text(430, 358, 'Node 1 + Node 3 + Node 4 acknowledge: client receives SUCCESS.', 18, teal, 'middle');
    }),
    scene('The inequality must be strict', 'With N=5, W=3 and R=2, the sum equals five and does not guarantee overlap. R=3 makes the sum six and guarantees at least one common replica.', 270, () => heading('Correction: 3 + 2 = 5, not greater than 5') + box(32, 100, 375, 125, 'W = 3, R = 2, N = 5', '3 + 2 = 5|No guaranteed overlap', 'red') + box(454, 100, 375, 125, 'W = 3, R = 3, N = 5', '3 + 3 = 6 > 5|At least one replica overlaps', 'teal')),
    scene('Possible overlap is not guaranteed overlap', 'A write set {1,2,3} and read set {4,5} are disjoint, disproving a guarantee for W=3,R=2,N=5. Increasing R to three forces at least one shared replica.', 400, () => {
      let svg = heading('Choose the worst case, not a convenient example.');
      const rows = [['Write: W = 3', [1, 2, 3], 'teal'], ['Read: R = 2', [4, 5], 'red'], ['Read: R = 3', [3, 4, 5], 'blue']];
      rows.forEach(([label, members, tone], row) => {
        svg += text(32, 135 + row * 86, label, 18);
        for (let replica = 1; replica <= 5; replica++) svg += box(214 + (replica - 1) * 122, 101 + row * 86, 100, 51, String(replica), '', members.includes(replica) ? tone : 'gray');
      });
      return svg + text(32, 374, 'Fixed replica sets + strict W + R > N guarantee intersection, not linearizability alone.', 16);
    })
  ],
  concurrency: [
    timeline,
    scene('Ready, running, blocked', 'A ready task runs when assigned CPU time. It blocks while waiting on I/O. Completion of that I/O makes it ready again. A running task can also be preempted back to ready.', 390, () => heading('Waiting does not consume the CPU') + box(300, 83, 255, 65, 'READY', '', 'blue') + box(300, 203, 255, 65, 'RUNNING', '', 'teal') + box(300, 321, 255, 55, 'BLOCKED', '', 'gold') + arrow(390, 151, 390, 197, 'CPU assigned') + arrow(390, 271, 390, 315, 'Needs I/O') + route([[558, 349], [720, 349], [720, 115], [561, 115]], blue) + lines(736, 208, ['I/O', 'complete'], 16, blue) + route([[296, 235], [167, 235], [167, 115], [293, 115]]) + text(150, 177, 'Preempted', 15, ink, 'end')),
    scene('An event loop uses the waiting time', 'A and B dispatch database queries without blocking the event loop. C runs CPU work while those queries are in flight. Completed results enqueue callbacks so A and B can resume.', 365, () => {
      let svg = heading('One JavaScript thread. Multiple requests in flight.');
      const steps = [['A', 'Dispatch DB query', 'teal'], ['B', 'Dispatch DB query', 'blue'], ['C', 'Run CPU work', 'gold'], ['A', 'DB result: resume', 'teal'], ['B', 'DB result: resume', 'blue']];
      steps.forEach(([label, detail, tone], index) => { svg += badge(40, 86 + index * 51, label, tone, 56) + text(127, 112 + index * 51, detail, 18); });
      return svg + box(520, 122, 280, 150, 'Database I/O', 'A and B wait outside|the JS execution thread.|Callbacks resume when ready.', 'gray');
    }),
    scene('The visible switch and its hidden costs', 'Switching from A to B saves registers, selects another task, and restores its state. B may miss in caches populated by A, adding workload-dependent memory cost.', 305, () => heading('A context switch is more than register bookkeeping') + box(32, 99, 175, 78, 'Task A', 'Save registers', 'teal') + box(343, 99, 175, 78, 'Scheduler', 'Select next task', 'gray') + box(654, 99, 175, 78, 'Task B', 'Restore registers', 'blue') + arrow(211, 138, 336, 138) + arrow(522, 138, 647, 138) + box(158, 221, 545, 59, 'Cold working set -> cache misses -> memory access', '', 'gold')),
    scene('Too many runnable tasks can reduce useful work', 'An illustrative curve rises as concurrency helps utilization, then falls as contention and scheduling overhead dominate. It is a conceptual shape, not measured data.', 360, () => heading('Illustrative throughput curve', 'More tasks help only until the bottleneck shifts.') + arrow(100, 292, 810, 292) + arrow(100, 292, 100, 92) + `<path d="M103 287 C170 230 215 120 330 119 C480 116 563 190 800 253" stroke="${teal}" fill="none" stroke-width="5"/><path d="M330 119 L330 292" stroke="${gold}" stroke-dasharray="5 5"/>` + text(118, 102, 'Useful work / time', 15) + text(330, 99, 'Saturation region', 16, gold, 'middle') + text(606, 165, 'Contention / overhead', 16, red) + text(450, 329, 'Number of runnable tasks', 17, ink, 'middle')),
    scene('Four partitions, four active consumers', 'Within a consumer group, four partitions can be assigned to four consumers. Independent work executes in parallel; ideal speedup depends on balanced work and downstream capacity.', 375, () => {
      let svg = heading('Kafka: partitions define available consumer parallelism');
      for (let slot = 0; slot < 4; slot++) svg += badge(60, 95 + slot * 65, `Partition ${slot}`, 'teal', 240) + badge(560, 95 + slot * 65, `Consumer ${slot + 1}`, 'blue', 240) + arrow(303, 114 + slot * 65, 554, 114 + slot * 65, 'Independent stream');
      return svg + text(430, 364, 'Up to ~4x in an ideal balanced case; not a throughput guarantee.', 16, ink, 'middle');
    }),
    scene('Media requests need both execution models', 'An async handler handles authentication and DRM I/O. A bounded queue hands CPU-heavy transcoding to a parallel worker pool, allowing the request layer to remain responsive.', 380, () => heading('I/O-bound at the edge. CPU-bound in the workers.') + box(32, 117, 220, 112, 'Async handler', 'Authentication + DRM|Concurrent network I/O', 'teal') + box(322, 117, 220, 112, 'Bounded queue', 'Backpressure|Independent scaling', 'gold') + box(612, 117, 220, 112, 'Worker pool', 'Transcode resolutions|Parallel CPU work', 'blue') + arrow(255, 173, 316, 173) + arrow(545, 173, 606, 173) + lines(32, 297, ['1. Accept request and await auth without blocking the event loop.', '2. Queue the transcode job; workers split CPU-heavy work across cores.', '3. Bound the queue so overload does not exhaust memory.'], 17))
  ],
  processes: [
    scene('Processes isolate. Threads share.', 'Each process has an isolated address space. Threads inside one process share code, heap, data, and file handles but have separate stacks and execution state.', 425, () => heading('One machine, two memory boundaries') + `<rect x="32" y="89" width="795" height="288" rx="8" fill="#f6f8f8" stroke="#c7d6d7"/>` + box(52, 111, 375, 240, '', '', 'teal') + box(452, 111, 355, 240, '', '', 'blue') + text(240, 145, 'PROCESS A', 19, teal, 'middle', 700) + text(630, 145, 'PROCESS B', 19, blue, 'middle', 700) + node(78, 176, 'Thread 1', 'Own stack + PC', 'gray', 153) + node(245, 176, 'Thread 2', 'Own stack + PC', 'gray', 153) + node(540, 176, 'Thread 1', 'Own stack + PC', 'gray', 180) + text(240, 294, 'Shared code / data / heap / handles', 16, ink, 'middle') + text(630, 294, 'Own code / data / heap / handles', 16, ink, 'middle') + text(430, 406, 'Memory protection separates A from B, not threads within A.', 17, ink, 'middle')),
    scene('Switching address spaces adds work', 'A process switch changes execution state and may change address-space translation context. A thread switch within one process shares the address space. Modern tagged TLBs can avoid a full flush.', 330, () => heading('Process switch vs same-process thread switch') + text(32, 94, 'PROCESS', 15, teal, 'start', 700) + box(32, 119, 175, 83, 'P0', 'Address space A', 'teal') + box(280, 119, 175, 83, 'Scheduler', 'Switch context', 'gray') + box(644, 119, 185, 83, 'P1', 'Address space B', 'blue') + arrow(211, 159, 274, 159) + arrow(459, 159, 638, 159, 'New memory map') + text(32, 247, 'THREAD', 15, blue, 'start', 700) + badge(32, 269, 'T1', 'teal', 175) + badge(280, 269, 'Scheduler', 'gray', 175) + badge(644, 269, 'T2', 'blue', 185) + arrow(211, 288, 274, 288) + arrow(459, 288, 638, 288, 'Same memory map')),
    scene('Thread-per-request vs event-driven I/O', 'A platform-thread-per-request model parks threads while waiting. Event loops multiplex pending I/O and dispatch heavy work to a separate pool.', 385, () => {
      let svg = heading('Where do waiting requests live?') + text(32, 90, 'THREAD PER REQUEST', 15, teal, 'start', 700) + text(469, 90, 'EVENT-DRIVEN', 15, blue, 'start', 700);
      for (let slot = 0; slot < 3; slot++) svg += text(32, 144 + slot * 65, `Req ${slot + 1}`, 17) + arrow(95, 138 + slot * 65, 159, 138 + slot * 65) + box(164, 113 + slot * 65, 240, 49, `Thread ${slot + 1}: waits`, '', 'gold');
      svg += box(470, 113, 355, 60, 'Event loop', '', 'blue') + arrow(648, 176, 648, 211, 'Register / resume') + box(470, 217, 355, 55, 'Non-blocking I/O', '', 'teal') + arrow(648, 276, 648, 312, 'Heavy work') + box(470, 317, 355, 48, 'Bounded worker pool', '', 'gold');
      return svg + lines(32, 333, ['Waiting threads still carry a stack', 'and runtime / scheduler overhead.'], 16);
    })
  ],
  failures: [
    scene('Failure domains grow in blast radius', 'Component failures affect a small scope. Node, rack, data center, and region failures affect progressively more shared infrastructure. Replicas must be placed across the failure domains you intend to survive.', 420, () => {
      let svg = heading('Replicas need independent failure domains');
      const levels = [['REGION', 'Geographic outage', 220], ['DATA CENTER', 'Building / site', 330], ['RACK', 'Shared power / network', 440], ['NODE', 'One machine', 550], ['COMPONENT', 'Disk / RAM / PSU / NIC', 660]];
      levels.forEach(([title, detail, width], index) => {
        const left = 385 - width / 2, top = 83 + index * 60;
        svg += `<path d="M${left + 28} ${top} H${left + width - 28} L${left + width} ${top + 50} H${left} Z" fill="${tones[index < 2 ? 'red' : index < 4 ? 'blue' : 'teal'][0]}" stroke="#c6d2d7"/>` + text(385, top + 23, title, 16, ink, 'middle', 700) + text(385, top + 42, detail, 13, ink, 'middle');
      });
      return svg + arrow(790, 365, 790, 100, '', red) + lines(727, 240, ['Larger', 'blast', 'radius'], 15, red);
    }),
    scene('A downstream failure travels upstream', 'Checkout calls Payment, which calls Fraud Detection. A fraud timeout causes payment failure and then a failed checkout. Retries can amplify the load.', 325, () => heading('The dependency chain is the failure path') + node(32, 110, 'Checkout', 'User clicks Pay', 'teal', 205) + node(329, 110, 'Payment', 'Needs fraud score', 'blue', 205) + node(626, 110, 'Fraud detection', 'Timeout / failure', 'red', 205) + arrow(241, 145, 323, 145, 'Call') + arrow(538, 145, 620, 145, 'Call') + arrow(622, 224, 540, 224, 'Error', red) + arrow(324, 224, 243, 224, 'Error', red) + text(430, 287, 'One failed dependency can exhaust callers and fail the whole request.', 17, red, 'middle')),
    stateMachine(false),
    stateMachine(true),
    scene('Three places to enforce a breaker', 'A library holds breaker state inside each app instance. A sidecar enforces policy outside the app but still keeps local state. A gateway is a coarser point of enforcement. Central configuration is not shared runtime state.', 400, () => heading('Policy placement changes the failure boundary') + text(32, 110, 'IN PROCESS', 15, teal, 'start', 700) + box(238, 78, 280, 85, 'Payment process', 'Library + local breaker state', 'teal') + text(550, 125, '100 pods = 100 local decisions', 15) + text(32, 227, 'SIDECAR', 15, blue, 'start', 700) + box(238, 191, 190, 68, 'Payment', '', 'gray') + box(537, 191, 290, 68, 'Envoy / mesh policy', '', 'blue') + arrow(432, 226, 531, 226) + text(32, 345, 'GATEWAY', 15, gold, 'start', 700) + box(238, 307, 230, 68, 'Gateway + breaker', '', 'gold') + box(617, 307, 210, 68, 'Service', '', 'gray') + arrow(472, 341, 611, 341)),
    partitionScene
  ]
};

let topics = [
  { id: 'processes', file: 'processes-vs-threads.md', tab: 'Processes & threads', title: 'Processes & threads', subtitle: 'Isolation, shared memory, and the cost of execution.', icon: 'cpu', index: '01', corrections: 'Technical context: modern CPUs can retain tagged TLB entries across process switches. Thread-per-request has no universal 10K limit; platform threads, virtual threads, workload, and hardware change the economics. CPU-bound work can run in threads or processes. Redis AOF rewriting traditionally uses a forked child process, not a background thread. Envoy uses a multi-threaded worker model, unlike Nginx\'s usual multi-process workers.' },
  { id: 'concurrency', file: 'concurrency-vs-parallelism.md', tab: 'Concurrency & parallelism', title: 'Concurrency & parallelism', subtitle: 'Many tasks in progress. Multiple tasks executing at once.', icon: 'git-branch', index: '02', corrections: 'Diagram corrections: completed I/O moves BLOCKED -> READY; preemption moves RUNNING -> READY. The overload curve is illustrative useful throughput, not a measured CPU-utilization curve. Parallelism does not guarantee linear speedup. Kafka partitions can be added later, but doing so can change key mapping and ordering assumptions. Cache costs are workload-dependent; switching does not inherently invalidate every cache entry.' },
  { id: 'failures', file: 'types-of-failures-distributed-systems.md', tab: 'Failure modes', title: 'Failure modes', subtitle: 'What breaks, how you notice, and how damage spreads.', icon: 'unplug', index: '03', corrections: 'Diagram correction: OPEN -> HALF-OPEN follows a cooldown, not a successful test call. Probes then decide whether to close or reopen. Hardware can also fail intermittently or corrupt data silently. An Availability Zone can contain multiple data centers. Envoy connection-limit circuit breaking and outlier detection are distinct from a conventional three-state application breaker.' },
  { id: 'availability', file: 'availability-fault-tolerance-distributed-systems.md', tab: 'Availability & resilience', title: 'Availability & fault tolerance', subtitle: 'Keep serving, preserve correctness, and recover deliberately.', icon: 'shield-check', index: '04', corrections: 'Technical context: an HTTP response with incorrect results does not satisfy a correctness-based availability SLI; mere reachability is not availability. Active-active still has health-detection delays, in-flight failures, and capacity requirements. Read/write quorum intersection alone does not establish linearizability. The original Dynamo paper describes Amazon Dynamo, not the complete modern DynamoDB architecture. ZooKeeper uses Zab; etcd uses Raft. The fencing example is a toy: production token issuance needs durable coordination, and a token may normally authorize multiple writes, so equal-token handling depends on the resource protocol.' },
  { id: 'consistency', file: 'cap-pacelc-quorum.md', tab: 'CAP, PACELC & quorum', title: 'CAP, PACELC & quorum', subtitle: 'Make the trade-off explicit. Check the overlap math.', icon: 'network', index: '05', corrections: 'Correction: for N=5, W=3 and R=2, W+R=N, so overlap is not guaranteed. W=3 and R=3 guarantees intersection over a fixed replica set, not linearizability by itself; version resolution, concurrent writes, failed writes, and sloppy quorums matter. CAP consistency means linearizability, not general application correctness. Dynamo is not interchangeable with modern DynamoDB: DynamoDB does not expose configurable N/W/R and should not be described categorically as leaderless. PACELC labels depend on operation, deployment, and consistency settings; Cassandra QUORUM cannot accept a write on a lone isolated replica when the required acknowledgments are unavailable.' }
];

const explanationFiles = fs.readdirSync(root).filter(file => file.endsWith('.md')).sort();
topics = topics.filter(topic => explanationFiles.includes(topic.file));
for (const file of explanationFiles.filter(file => !topics.some(topic => topic.file === file))) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const title = source.match(/^# (.+)/m)?.[1] || file.replace(/\.md$/, '').replaceAll('-', ' ');
  topics.push({ id: `explanation-${encodeURIComponent(file.slice(0, -3))}`, file, tab: title, title, subtitle: 'System design explanation', icon: 'file-text', index: String(topics.length + 1).padStart(2, '0'), additional: true });
}
const cheatsheetRoot = path.resolve(root, '../cheatsheets');
const cheatsheetFiles = fs.readdirSync(cheatsheetRoot).filter(file => file.endsWith('.md')).sort();
for (const file of cheatsheetFiles) {
  const source = fs.readFileSync(path.join(cheatsheetRoot, file), 'utf8');
  const isIndex = file === 'cheatsheet-index.md';
  const group = file.match(/cheatsheet-(g\d)-/i)?.[1];
  const title = isIndex ? 'Keyword index' : (source.match(/^# (.+)/m)?.[1] || file.replace(/\.md$/, '').replaceAll('-', ' ')).replace(/^G\d\s*·\s*/, '');
  topics.push({ id: isIndex ? 'cheatsheet-index' : group ? `cheatsheet-${group}` : `reference-${encodeURIComponent(file.slice(0, -3))}`, file: `../cheatsheets/${file}`, tab: group ? `${group.toUpperCase()} · ${title}` : title, title, subtitle: isIndex ? 'Topics and their reference sections.' : 'System design reference', icon: isIndex ? 'list' : 'book-open', index: isIndex ? 'INDEX' : group?.toUpperCase() || 'REFERENCE', reference: true, isIndex });
}
assert(topics.length > 0, 'No Markdown documents found');
assert.equal(new Set(topics.map(topic => topic.id)).size, topics.length, 'Duplicate document IDs');
const sectionLookup = new Map();
const normalizeSection = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
for (const topic of topics.filter(topic => topic.reference && !topic.isIndex)) {
  const source = fs.readFileSync(path.join(root, topic.file), 'utf8');
  const sections = [...source.matchAll(/^#{2,6} (.+)$/gm)].map((match, index) => ({ title: match[1].replace(/^§\s*/, ''), id: `${topic.id}-section-${index + 1}` }));
  sectionLookup.set(path.basename(topic.file), sections);
}
function resolveSection(file, title) {
  const sections = sectionLookup.get(file) || [];
  const normalized = normalizeSection(title);
  return sections.find(section => normalizeSection(section.title) === normalized) || sections.find(section => normalizeSection(section.title).startsWith(normalized));
}

function figure(spec, topic, index) {
  const id = `diagram-${topic}-${index}`;
  currentMarker = `${id}-arrow`;
  const drawing = spec.draw();
  return `<figure id="${id}" class="diagram" aria-labelledby="${id}-caption"><button type="button" class="diagram-open" aria-label="Enlarge diagram: ${esc(spec.title)}" data-diagram="${id}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 ${spec.height}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(spec.title)}</title><desc id="${id}-desc">${esc(spec.description)}</desc><defs><marker id="${currentMarker}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8Z" fill="#71868c"/></marker></defs>${drawing}</svg><span class="expand-mark">${icon('maximize-2')}</span></button><figcaption id="${id}-caption"><span class="figure-number">FIG ${String(++sequence).padStart(2, '0')}</span><span>${esc(spec.title)}</span></figcaption></figure>`;
}

function convertTables(markdown) {
  return markdown.replace(/^╔[^\n]+\n[\s\S]*?^╚[^\n]+/gm, block => {
    const rows = [];
    let header = true;
    for (const line of block.split('\n')) {
      if (line.startsWith('╠')) { header = false; continue; }
      if (!line.startsWith('║')) continue;
      const cells = line.split('║').slice(1, -1).map(cell => cell.trim());
      const continuation = !cells[0] || /^(Failures\)|partition$|no partition$|\(again\)$|\(majority\)$|\(disk\/|\(bug\/|nodes$)/.test(cells[0]);
      if (continuation && rows.length && rows.at(-1).header === header) {
        cells.forEach((cell, index) => { if (cell) rows.at(-1).cells[index] += ` ${cell}`; });
      } else rows.push({ cells, header });
    }
    assert(rows.length > 1, 'Table conversion lost rows');
    return '\n<div class="comparison" role="region" aria-label="Comparison table" tabindex="0"><table>' + rows.map(row => `<${row.header ? 'thead' : 'tbody'}><tr>${row.cells.map(cell => `<${row.header ? 'th scope="col"' : 'td'}>${esc(cell)}</${row.header ? 'th' : 'td'}>`).join('')}</tr></${row.header ? 'thead' : 'tbody'}>`).join('') + '</table></div>\n';
  });
}

const report = [];
const rendered = topics.map(topic => {
  const original = fs.readFileSync(path.join(root, topic.file), 'utf8');
  let source = original.replace(/^# .+\n/, '').replace(/### ASCII diagram /g, '### Diagram ');
  if (topic.isIndex) {
    let currentFile = '';
    source = source.split('\n').map(line => {
      const group = line.match(/^## .+\((cheatsheet-[\w-]+\.md)\)/);
      if (group) { currentFile = group[1]; return line; }
      if (line.startsWith('# ')) return line.slice(2);
      const entry = line.match(/^(.*?)\s*→\s*§\s*(.+)$/);
      if (!entry) return line;
      const target = resolveSection(currentFile, entry[2]) || (entry[2] === 'POWER OF 2 / STORAGE UNITS' ? resolveSection(currentFile, 'POWER OF 2') : null);
      const reference = topics.find(candidate => path.basename(candidate.file) === currentFile);
      if (!reference) return `<p class="keyword-entry">${esc(entry[1].trim())}<span>${esc(entry[2])} (source document unavailable)</span></p>`;
      return `<p class="keyword-entry"><a href="#${target ? target.id : reference.id}"${target ? '' : ` data-topic="${reference.id}"`}>${esc(entry[1].trim())}</a><span>${esc(entry[2])}${target ? '' : ' (section absent from source; opens cheatsheet)'}</span></p>`;
    }).join('\n');
  }
  const headings = [];
  let blockIndex = 0;
  let diagrams = 0;
  const parser = new Marked({ gfm: true });
  parser.use({ renderer: {
    heading({ tokens, depth }) {
      const value = this.parser.parseInline(tokens);
      const plain = value.replace(/<[^>]+>/g, '');
      const id = `${topic.id}-section-${headings.length + 1}`;
      headings.push({ depth, id, title: plain });
      return `<h${depth} id="${id}">${value}</h${depth}>`;
    },
    code({ text: code, lang }) {
      const fingerprint = createHash('sha256').update(code).digest('hex');
      const originalBlock = diagramSources[topic.file]?.find(block => block.sha256 === fingerprint);
      const spec = originalBlock ? scenes[topic.id]?.[originalBlock.sceneIndex] : null;
      blockIndex++;
      if (spec) { diagrams++; return figure(spec, topic.id, blockIndex); }
      const needsRedraw = !lang && !originalBlock && (Boolean(scenes[topic.id]) || /[┌┐└┘│─]|[-=]{2,}>/.test(code));
      if (needsRedraw) warnings.push(`${topic.file}: block ${blockIndex} needs an SVG redraw; current source shown`);
      const notice = needsRedraw ? '<p class="diagram-warning" role="status">Diagram source changed or added. SVG redraw pending; current source shown below.</p>' : '';
      return `${notice}<div class="code-sample"><div class="code-label">${lang === 'java' ? 'JAVA' : topic.reference ? 'REFERENCE' : 'SOURCE'}</div><pre tabindex="0"><code${lang ? ` class="language-${esc(lang)}"` : ''}>${esc(code)}</code></pre></div>`;
    }
  } });
  source = convertTables(source);
  let content = parser.parse(source);
  const digest = createHash('sha256').update(original).digest('hex');
  content = content.replace(/@notes\/(cheatsheets|explanations)\/([\w-]+\.md)/g, (_match, folder, file) => {
    const relative = folder === 'explanations' ? file : `../cheatsheets/${file}`;
    const linked = topics.find(candidate => path.basename(candidate.file) === file);
    return `<a href="${linked ? '#' + linked.id : relative}"${linked ? ` data-topic="${linked.id}"` : ''}>${esc(file.replace('.md', '').replaceAll('-', ' '))}</a>`;
  });
  const words = original.split(/\s+/).length;
  const toc = headings.filter(item => item.depth === 2).map(item => `<a href="#${item.id}">${esc(item.title.replace(/^(?:Section )?\d+[a-z]?[.\s]*[—-]?\s*/, ''))}</a>`).join('');
  const introEnd = content.indexOf('<hr>');
  const metadata = introEnd >= 0 && content.slice(0, introEnd).includes('Saved:') ? content.slice(0, introEnd) : '';
  if (metadata) content = content.slice(introEnd + 4);
  report.push({ topic: topic.id, file: topic.file, headings: headings.length, diagrams, codeBlocks: blockIndex - diagrams, sha256: digest });
  const next = topics[topics.indexOf(topic) + 1];
  return `<section id="panel-${topic.id}" class="chapter-panel${topic.reference ? ' reference-panel' : ''}" role="region" aria-labelledby="heading-${topic.id}" data-topic="${topic.id}" ${topic !== topics[0] ? 'hidden' : ''}>
    <aside class="chapter-index" id="index-${topic.id}"><div class="chapter-number">${topic.reference ? 'CHEATSHEET' : 'EXPLANATION'} / ${topic.index}</div><h2>In this ${topic.reference ? 'reference' : 'chapter'}</h2><nav aria-label="Sections in ${esc(topic.title)}">${toc}</nav><a class="source-link" href="${topic.file}">${icon('file-text')} Markdown source</a></aside>
    <article class="chapter" data-source="${topic.file}" data-sha256="${digest}"><header class="chapter-header"><div class="chapter-meta"><span>${topic.reference ? 'CHEATSHEETS' : 'FIELD NOTES'} / ${topic.index}</span><span>${Math.ceil(words / 220)} MIN READ</span>${diagrams ? `<span>${diagrams} FIGURES</span>` : ''}</div><h1 id="heading-${topic.id}" tabindex="-1">${esc(topic.title)}</h1><p class="chapter-subtitle">${esc(topic.subtitle)}</p>${metadata ? `<details class="source-meta"><summary>Source details</summary>${metadata}</details>` : ''}</header>
    ${topic.corrections ? `<aside class="accuracy-note"><strong>${icon('info')} Reading note</strong><p>${esc(topic.corrections)}</p></aside>` : ''}
    <div class="note-body">${content}</div><footer class="chapter-footer"><span>${topic.reference ? 'END OF REFERENCE' : 'END OF CHAPTER'} ${topic.index}</span>${next ? `<button class="next-chapter" data-topic="${next.id}">Next: ${esc(next.tab)} ${icon('arrow-right')}</button>` : `<a href="#${topics[0].id}" data-topic="${topics[0].id}">Back to foundations</a>`}</footer></article>
  </section>`;
}).join('\n');

const css = `
:root{color-scheme:light;--paper:#fff;--ground:#f4f7f6;--ink:#253c42;--muted:#5b6e73;--line:#dce5e3;--teal:#087f73;--blue:#2866b5;--red:#b84d46;--soft:#e5f4ef;--reading:Georgia,'Palatino Linotype',serif;--ui:'Avenir Next',Avenir,'Trebuchet MS',sans-serif}
*{box-sizing:border-box;letter-spacing:0}html{scroll-behavior:smooth;scroll-padding-top:110px}body{margin:0;color:var(--ink);background:var(--paper);font:16px/1.7 var(--ui)}button,a,input{touch-action:manipulation}button{font:inherit;cursor:pointer}a{color:var(--teal);text-underline-offset:4px}button svg,a svg{width:20px;height:20px;flex:none}button:focus-visible,a:focus-visible,summary:focus-visible,[tabindex]:focus-visible{outline:3px solid var(--blue);outline-offset:4px}button:hover{color:var(--teal)}[hidden]{display:none!important}
.masthead{border-top:5px solid var(--teal);background:linear-gradient(115deg,#eff7f4 0%,#fff 50%,#f2f5fb 100%);border-bottom:1px solid var(--line)}.masthead-inner{max-width:1370px;padding:26px 44px 28px;margin:auto;display:flex;justify-content:space-between;gap:24px;align-items:center}.identity{display:flex;gap:18px;align-items:center}.brand-mark{height:48px;width:48px;background:var(--teal);display:grid;place-items:center;color:#fff;border-radius:6px}.brand-mark svg{width:29px;height:29px}.eyebrow{font-size:10px;font-weight:700;color:var(--teal);margin-bottom:3px}.brand-title{font:700 25px/1.3 var(--ui);margin:0}.edition{text-align:right;font-size:11px;color:var(--muted)}.edition strong{display:block;color:var(--ink);font-weight:600}.tab-shell{position:sticky;top:0;z-index:10;border-bottom:1px solid var(--line);background:rgba(255,255,255,.97)}.tabs{display:flex;max-width:1370px;margin:auto;padding:0 44px;overflow-x:auto;scrollbar-width:thin}.tab{border:0;background:none;border-bottom:3px solid transparent;min-height:67px;padding:0 21px;color:var(--muted);display:flex;align-items:center;justify-content:center;gap:10px;white-space:nowrap;flex:1;font-size:13px;font-weight:650}.tab:first-child{padding-left:0}.tab[aria-selected=true]{border-color:var(--teal);color:var(--teal)}.tab svg{width:18px;height:18px}.tab:hover{background:#f5faf8}.tab-count{font:11px/1 var(--ui);color:#8c9b9e}.progress-track{height:2px;position:absolute;bottom:-2px;left:0;right:0}.progress-track span{display:block;height:100%;width:0;background:var(--teal);transition:width .15s}
main{max-width:1370px;margin:auto;padding:44px}section[role=tabpanel]{display:grid;grid-template-columns:224px minmax(0,1fr);gap:60px;align-items:start}.chapter-index{position:sticky;top:109px;max-height:calc(100vh - 135px);overflow:auto;padding-right:8px;font-size:13px}.chapter-number{font-size:10px;color:var(--teal);font-weight:700}.chapter-index h2{font-size:15px;margin:14px 0}.chapter-index nav{border-left:1px solid var(--line);display:flex;flex-direction:column}.chapter-index nav a{padding:9px 0 9px 15px;margin-left:-1px;border-left:2px solid transparent;text-decoration:none;line-height:1.5;color:var(--muted)}.chapter-index nav a:hover,.chapter-index nav a[aria-current=location]{color:var(--teal);border-left-color:var(--teal);background:linear-gradient(90deg,#edf7f3,transparent)}.source-link{display:flex;gap:8px;align-items:center;margin:28px 0;text-decoration:none;font-size:12px;color:var(--muted)}.source-link svg{width:16px;height:16px}.chapter{min-width:0;max-width:910px}.chapter-meta{display:flex;gap:18px;flex-wrap:wrap;font-size:10px;font-weight:700;color:var(--muted)}.chapter-meta span:first-child{color:var(--teal)}.chapter-header h1{font:700 42px/1.15 var(--reading);margin:17px 0;color:#203c3d;overflow-wrap:break-word}.chapter-subtitle{font-size:17px;color:var(--muted);margin:0 0 14px}.source-meta{font-size:12px;color:var(--muted);margin-top:20px}.source-meta summary{cursor:pointer;width:max-content}.source-meta p{margin:10px 0}.accuracy-note{border-left:3px solid #b89b61;margin:28px 0 36px;padding:13px 18px;background:#faf8f2;font-size:12px;line-height:1.7}.accuracy-note strong{display:flex;align-items:center;gap:7px;color:#705324;font-size:12px}.accuracy-note strong svg{width:15px;height:15px}.accuracy-note p{margin:6px 0 0;color:#645d4c}.note-body{font:18px/1.85 var(--reading);overflow-wrap:break-word}.note-body p{margin:18px 0}.note-body strong{color:#263e42}.note-body h2{font:700 27px/1.3 var(--ui);margin:52px 0 20px;padding-top:16px;border-top:1px solid var(--line);scroll-margin-top:110px}.note-body h2:first-child{margin-top:0}.note-body h3{font:650 19px/1.4 var(--ui);margin:30px 0 14px;scroll-margin-top:110px}.note-body hr{border:0;border-top:1px solid var(--line);margin:38px 0}.note-body ul,.note-body ol{padding-left:25px}.note-body li{padding-left:6px;margin:10px 0}.note-body code{font:13px/1.7 'SFMono-Regular',Consolas,monospace;background:#eff3f3;padding:3px 5px;border-radius:3px;overflow-wrap:anywhere}.note-body blockquote{border-left:3px solid var(--teal);padding:8px 22px;margin:26px 0;background:var(--soft)}.diagram{margin:30px 0;background:linear-gradient(130deg,#fcfefd,#f6f9fa);border:1px solid var(--line);border-radius:6px;overflow:hidden}.diagram-open{position:relative;display:block;width:100%;border:0;padding:14px 9px 3px;background:transparent;cursor:zoom-in;color:var(--ink)}.diagram svg{display:block;width:100%;height:auto;font-family:var(--ui);text-align:left;letter-spacing:0}.expand-mark{position:absolute;right:10px;top:10px;display:grid;place-items:center;width:30px;height:30px;border-radius:4px;background:white;border:1px solid var(--line);color:var(--muted)}.expand-mark svg{width:15px;height:15px}.diagram-open:hover .expand-mark{color:var(--teal);border-color:var(--teal)}figcaption{display:flex;align-items:baseline;gap:14px;padding:12px 18px;background:#fff;border-top:1px solid var(--line);font:12px/1.5 var(--ui);color:var(--muted)}.figure-number{font-size:9px;color:var(--teal);font-weight:700;white-space:nowrap}.comparison{overflow:auto;margin:25px 0;border-top:2px solid var(--teal);border-bottom:1px solid var(--line);font:13px/1.65 var(--ui)}table{border-collapse:collapse;width:100%;min-width:520px}th,td{text-align:left;vertical-align:top;padding:12px 14px;border-bottom:1px solid var(--line)}th{background:#edf4f1;color:#25534d;font-size:12px;font-weight:700}td:first-child{font-weight:600}tbody:nth-child(even){background:#fafcfb}tr:last-child td{border-bottom:1px solid var(--line)}.formula{display:flex;flex-direction:column;padding:24px 28px;background:#edf7f3;border-left:3px solid var(--teal);font-family:var(--ui);gap:5px}.formula span{font-size:10px;color:var(--teal);font-weight:700}.formula strong{font-size:20px}.code-sample{background:#f3f6f6;border:1px solid var(--line);border-radius:6px;margin:28px 0;overflow:hidden}.code-label{border-bottom:1px solid var(--line);padding:8px 18px;font:10px var(--ui);color:var(--muted);font-weight:700}.code-sample pre{overflow:auto;margin:0;padding:20px;line-height:1.7;font-size:13px}.code-sample code{padding:0;background:none;white-space:pre;overflow-wrap:normal}.chapter-footer{margin-top:55px;padding:25px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:20px;font-size:11px;color:var(--muted)}.next-chapter{border:0;background:none;display:flex;gap:10px;align-items:center;color:var(--teal);text-align:right;font-size:13px}.site-footer{border-top:1px solid var(--line);max-width:1282px;margin:10px auto 0;padding:22px 0 35px;display:flex;justify-content:space-between;font-size:11px;color:var(--muted)}.site-footer a{text-decoration:none}.skip{position:fixed;top:-80px;left:16px;background:#fff;padding:10px;z-index:50}.skip:focus{top:10px}.jump-top{position:fixed;right:20px;bottom:20px;width:40px;height:40px;background:white;border:1px solid var(--line);border-radius:6px;display:grid;place-items:center;box-shadow:0 2px 12px #203c3d0a;z-index:9}
dialog{width:min(1440px,96vw);max-width:none;height:94vh;height:94dvh;max-height:none;padding:0;border:1px solid #c7d6d7;border-radius:8px;color:var(--ink);background:#f6f9f8;overflow:hidden}dialog::backdrop{background:#192f3c99;backdrop-filter:blur(4px)}.viewer-head{display:flex;gap:15px;justify-content:space-between;align-items:center;padding:15px 22px;background:white;border-bottom:1px solid var(--line);min-height:80px}.viewer-head h2{font:650 16px/1.4 var(--ui);margin:0;max-width:750px}.viewer-tools{display:flex;gap:5px;align-items:center;flex-shrink:0}.icon-button{height:38px;width:38px;display:grid;place-items:center;background:white;border:1px solid var(--line);border-radius:5px;position:relative;color:var(--ink)}.icon-button:disabled{opacity:.35;cursor:default}.icon-button:hover:not(:disabled){background:var(--soft);color:var(--teal)}.icon-button::after{content:attr(aria-label);position:absolute;top:calc(100% + 8px);right:0;background:#253c42;color:#fff;padding:6px 9px;font-size:11px;white-space:nowrap;border-radius:4px;opacity:0;pointer-events:none;z-index:2}.icon-button:hover::after,.icon-button:focus-visible::after{opacity:1}.zoom-value{width:53px;text-align:center;font-size:12px;font-variant-numeric:tabular-nums}.viewer-stage{height:calc(100% - 80px);overflow:auto;overscroll-behavior:contain;touch-action:pan-x pan-y;cursor:grab;background-image:radial-gradient(#d8e4e0 .8px,transparent .8px);background-size:20px 20px}.viewer-stage.dragging{cursor:grabbing;user-select:none}.viewer-canvas{min-width:100%;min-height:100%;display:flex;justify-content:center;align-items:center;padding:28px}.viewer-canvas svg{display:block;flex:none;width:var(--diagram-width);height:var(--diagram-height);font-family:var(--ui);background:#fff;box-shadow:0 8px 45px #253c4210;touch-action:pan-x pan-y}.tab-panel-enter{animation:enter .25s ease-out}@keyframes enter{from{opacity:.5;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@media(min-width:1550px){.chapter{max-width:930px}}@media(max-width:1100px){.tabs{padding:0 22px}.tab{padding:0 14px;font-size:12px}.tab-count{display:none}main{padding:35px 26px}section[role=tabpanel]{grid-template-columns:185px minmax(0,1fr);gap:30px}.chapter-header h1{font-size:36px}.masthead-inner{padding:22px 26px}.site-footer{margin:0 26px}}
@media(max-width:760px){.masthead-inner{padding:20px;align-items:flex-start}.brand-title{font-size:20px;max-width:290px}.brand-mark{width:39px;height:39px;flex-shrink:0}.identity{gap:11px}.edition{display:none}.tabs{padding:0 18px}.tab{min-height:58px;font-size:12px;flex:none;padding:0 16px}.tab:first-child{padding-left:4px}.tab svg{width:16px;height:16px}main{padding:24px 20px}section[role=tabpanel]{display:block}.chapter-index{position:static;max-height:none;padding:0 0 24px;margin-bottom:26px;border-bottom:1px solid var(--line)}.chapter-number{display:none}.chapter-index h2{margin:0 0 10px;font-size:12px}.chapter-index nav{flex-direction:row;overflow:auto;border-left:0;gap:18px;padding:0 2px 8px}.chapter-index nav a{white-space:nowrap;border-left:0;border-bottom:2px solid transparent;padding:6px 0;font-size:11px}.chapter-index nav a[aria-current=location]{border-bottom-color:var(--teal)}.source-link{display:none}.chapter-header h1{font-size:32px;line-height:1.2}.chapter-subtitle{font-size:15px}.chapter-meta{gap:12px;font-size:9px}.note-body{font-size:17px;line-height:1.85}.note-body h2{font-size:23px;margin-top:36px}.note-body h3{font-size:18px}.accuracy-note{margin:23px 0 29px;padding:12px 15px}.diagram{margin:23px -4px}.diagram-open{padding:12px 2px 3px}figcaption{font-size:11px;gap:10px;padding:10px}.expand-mark{height:26px;width:26px;top:5px;right:5px}.formula{padding:16px}.formula strong{font-size:16px}.chapter-footer{align-items:flex-start;flex-direction:column}.site-footer{margin:0 20px;gap:20px;font-size:10px}.viewer-head{flex-wrap:wrap;padding:12px;gap:9px;height:125px}.viewer-head h2{font-size:13px;flex-basis:100%;padding-right:4px}.viewer-tools{margin-left:auto}.viewer-stage{height:calc(100% - 125px)}.viewer-canvas{padding:18px}.icon-button{width:34px;height:34px}.jump-top{right:12px;bottom:12px;width:35px;height:35px}dialog{width:98vw;height:96dvh}.comparison{font-size:12px}.chapter-index nav a:hover{background:none}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}@media print{.masthead,.tab-shell,.chapter-index,.accuracy-note,.jump-top,.chapter-footer,.site-footer,dialog{display:none!important}main{padding:0;max-width:none}section[role=tabpanel]{display:block}section[hidden]{display:block!important;break-before:page}.chapter{max-width:none}.diagram{break-inside:avoid}.note-body{font-size:11pt}.note-body h2{font-size:18pt}.note-body h3{font-size:14pt}.chapter-header h1{font-size:28pt}.source-meta{display:none}.expand-mark{display:none}table{min-width:0}}
`;

const navigationCss = `
.diagram-open > svg{max-height:320px}
@media(max-width:760px){.diagram-open > svg{max-height:240px}}
.diagram-warning{padding:12px 16px;border-left:3px solid #b89b61;background:#faf8f2;font:13px/1.6 var(--ui);color:#705324}
.header-actions{display:flex;align-items:center;gap:22px}.mobile-bar .search-open{margin-left:auto;flex-shrink:0}.collection-label{font-size:10px;font-weight:700;color:var(--muted);margin:22px 0 10px;border-top:1px solid var(--line);padding-top:18px}.reference-links{gap:2px}.reference-links .topic-link{font-size:12px;padding:9px 7px}.reference-panel .note-body{font:15px/1.85 var(--ui)}.reference-panel .note-body h2{font-size:22px}.reference-panel .chapter-header{margin-bottom:28px}.reference-panel .comparison{font-size:13px}.keyword-entry{padding:13px 0;border-bottom:1px solid var(--line)}.keyword-entry a{display:block;font-weight:600;text-decoration:none}.keyword-entry span{display:block;font-size:11px;color:var(--muted);margin-top:5px}.search-dialog{width:min(800px,94vw);height:min(760px,90dvh);background:#fff}.search-head{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid var(--line)}.search-head h2{font-size:18px;margin:0}.search-field{display:flex;gap:12px;align-items:center;margin:20px 22px 10px;border:1px solid #9cbab3;border-radius:6px;padding:9px 12px}.search-field>svg{width:20px;height:20px;flex-shrink:0;color:var(--teal)}.search-field input{min-width:0;flex:1;font:16px/1.5 var(--ui);border:0;background:transparent;color:var(--ink);outline-offset:2px}.search-field input::-webkit-search-cancel-button{display:none}.search-field .icon-button{width:30px;height:30px;border:0}.search-status{margin:0;padding:0 22px 12px;font-size:12px;color:var(--muted)}.search-results{overflow:auto;margin:0;padding:0 22px 22px;list-style:none;flex:1;min-height:0}.search-dialog[open]{display:flex;flex-direction:column}.search-result{display:block;text-decoration:none;padding:17px 5px;border-top:1px solid var(--line);color:var(--ink)}.search-result:hover{background:#f3f9f6}.search-result strong{display:block;font-size:15px;line-height:1.5;color:var(--teal)}.search-result .result-path{display:block;font-size:11px;color:var(--muted);margin-bottom:5px}.search-result p{font:13px/1.7 var(--ui);margin:7px 0 0;color:var(--muted);overflow-wrap:anywhere}.search-result mark{background:#fff0ad;color:#45380e;padding:0 1px}.search-results:empty{display:none}.search-target{animation:found-section 1.4s ease-out}@keyframes found-section{from{background:#fff0ad}to{background:transparent}}@media(max-width:760px){.header-actions{display:none}.search-dialog{width:96vw;height:92dvh}.search-head{padding:14px 16px}.search-field{margin:16px 16px 10px}.search-status{padding:0 16px 10px}.search-results{padding:0 16px 20px}.reference-panel .note-body{font-size:14px}.reference-panel .note-body h2{font-size:20px}}@media print{.header-actions,.search-dialog{display:none!important}}
.library-layout{max-width:1600px;margin:auto;padding:38px 32px;display:grid;grid-template-columns:220px minmax(0,1fr);gap:36px;align-items:start}
main{min-width:0;max-width:none;width:100%;margin:0;padding:0}
.chapter-panel{display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:34px;align-items:start}
.chapter{grid-column:1;grid-row:1;max-width:none}.chapter-index{grid-column:2;grid-row:1;top:28px;max-height:calc(100dvh - 56px)}
.topic-sidebar{position:sticky;top:28px;max-height:calc(100dvh - 56px);overflow:auto;padding:0 16px 16px 0;border-right:1px solid var(--line)}
.navigation-heading{font-size:11px;font-weight:700;color:var(--muted);margin:0 0 20px}.topic-group{margin-bottom:23px}.topic-group summary{display:flex;align-items:center;justify-content:space-between;gap:12px;list-style:none;cursor:pointer;font-size:13px;font-weight:700;padding:6px 0;color:var(--ink)}
.topic-group summary::-webkit-details-marker{display:none}.topic-group summary svg{width:15px;height:15px;transition:transform .15s}.topic-group:not([open]) summary svg{transform:rotate(-90deg)}
.topic-links{display:flex;flex-direction:column;gap:4px;margin-top:8px}.topic-link{display:flex;gap:10px;align-items:flex-start;padding:11px 10px;border-left:3px solid transparent;border-radius:0 5px 5px 0;text-decoration:none;color:var(--muted);font-size:13px;line-height:1.5;overflow-wrap:anywhere}.topic-link svg{width:17px;height:17px;margin-top:2px}.topic-link:hover{background:#f3f7f6;color:var(--teal)}.topic-link[aria-current=page]{background:var(--soft);border-left-color:var(--teal);color:var(--teal);font-weight:650}
.mobile-bar{display:none}.progress-track{position:fixed;top:0;bottom:auto;z-index:15}.menu-drawer{width:min(350px,92vw);height:100dvh;max-height:100dvh;margin:0 auto 0 0;border:0;border-radius:0;background:#fff;padding:0}.drawer-head{display:flex;align-items:center;justify-content:space-between;padding:19px 22px;border-bottom:1px solid var(--line)}.drawer-head h2{font-size:16px;margin:0}.drawer-content{padding:24px 22px;overflow:auto;height:calc(100% - 79px)}.drawer-content .navigation-heading{display:none}
@media(max-width:1279px){.library-layout{grid-template-columns:200px minmax(0,1fr);gap:28px;padding:32px 26px}.chapter-panel{display:flex;flex-direction:column;gap:0}.chapter-index{position:static;max-height:none;width:100%;padding:0 0 20px;margin:0 0 28px;border-bottom:1px solid var(--line)}.chapter-index h2{margin:0 0 8px;font-size:12px}.chapter-number,.chapter-index .source-link{display:none}.chapter-index nav{flex-direction:row;overflow:auto;gap:18px;border:0;padding-bottom:5px}.chapter-index nav a{white-space:nowrap;border-left:0;border-bottom:2px solid transparent;padding:7px 0;font-size:11px}.chapter-index nav a[aria-current=location]{border-bottom-color:var(--teal);background:none}.chapter{width:100%}}
@media(max-width:1000px){.topic-sidebar{display:none}.library-layout{display:block;padding:28px 24px}.mobile-bar{display:flex;align-items:center;gap:13px;position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid var(--line);padding:10px 20px;min-height:60px}.current-chapter{font-size:13px;font-weight:600;line-height:1.4;min-width:0;overflow-wrap:anywhere}.chapter-index{margin-bottom:24px}html{scroll-padding-top:85px}}
@media(max-width:760px){.library-layout{padding:24px 20px}.chapter-index nav a{border-bottom:2px solid transparent}.chapter-index nav a[aria-current=location]{border-bottom-color:var(--teal)}.menu-drawer{width:min(350px,92vw);height:100dvh}.masthead-inner{padding-bottom:18px}.mobile-bar{padding:9px 20px}}
.mobile-bar{display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid var(--line);padding:9px 20px;min-height:60px}.current-chapter{font-size:13px;font-weight:600;line-height:1.4;min-width:0;overflow-wrap:anywhere}.mobile-bar .icon-button{flex-shrink:0}.mobile-bar [aria-expanded=true]:not(#menu-open){background:var(--soft);color:var(--teal)}
.index-hidden .chapter-index{display:none}.topic-sidebar,.chapter-index{top:88px;max-height:calc(100dvh - 116px)}
@media(min-width:1001px){#menu-open{display:none}.navigation-hidden .topic-sidebar{display:none}.navigation-hidden .library-layout{grid-template-columns:minmax(0,1fr)}}
@media(min-width:1280px){.index-hidden .chapter-panel{grid-template-columns:minmax(0,1fr)}}
@media(max-width:1279px){.chapter-index{max-height:none}}
@media(max-width:1000px){#navigation-toggle{display:none}}
@media print{.library-layout,.chapter-panel{display:block!important;padding:0}.topic-sidebar,.mobile-bar,.menu-drawer,.progress-track{display:none!important}.chapter-panel[hidden]{display:block!important;break-before:page}}
`;

const groups = [
  { title: 'Execution', topics: ['processes', 'concurrency'] },
  { title: 'Reliability', topics: ['failures', 'availability'] },
  { title: 'Consistency', topics: ['consistency'] },
  { title: 'More explanations', topics: topics.filter(topic => topic.additional).map(topic => topic.id) }
].map(group => ({ ...group, topics: group.topics.filter(id => topics.some(topic => topic.id === id)) })).filter(group => group.topics.length);
const navigation = `<nav id="topic-navigation" aria-label="Foundation chapters"><p class="navigation-heading">LIBRARY / ${topics.length} DOCUMENTS</p><p class="collection-label">EXPLANATIONS</p>${groups.map(group => `<details class="topic-group" open><summary>${group.title}${icon('chevron-down')}</summary><div class="topic-links">${group.topics.map(id => {
  const topic = topics.find(candidate => candidate.id === id);
  return `<a href="#${topic.id}" class="topic-link" id="topic-${topic.id}" data-topic="${topic.id}"${topic === topics[0] ? ' aria-current="page"' : ''}>${icon(topic.icon)}<span>${esc(topic.tab)}</span></a>`;
}).join('')}</div></details>`).join('')}<details class="topic-group" open><summary>Cheatsheets${icon('chevron-down')}</summary><div class="topic-links reference-links">${topics.filter(topic => topic.reference).map(topic => `<a href="#${topic.id}" class="topic-link" id="topic-${topic.id}" data-topic="${topic.id}">${icon(topic.icon)}<span>${esc(topic.tab)}</span></a>`).join('')}</div></details></nav>`;

const js = `
const topicLinks = [...document.querySelectorAll('.topic-link')];
const panels = [...document.querySelectorAll('.chapter-panel')];
const topicNavigation = document.querySelector('#topic-navigation');
const topicSidebar = document.querySelector('.topic-sidebar');
const menuDrawer = document.querySelector('#menu-drawer');
const menuButton = document.querySelector('#menu-open');
const mobileLayout = matchMedia('(max-width: 1000px)');
const panelPreferencesKey = 'hld-notes-panel-preferences';
let panelPreferences = { navigation: true, index: true };
try {
  const stored = JSON.parse(localStorage.getItem(panelPreferencesKey));
  for (const name of ['navigation', 'index']) {
    if (typeof stored?.[name] === 'boolean') panelPreferences[name] = stored[name];
  }
} catch {}
function applyPanelPreferences() {
  for (const name of ['navigation', 'index']) {
    const visible = panelPreferences[name];
    document.documentElement.classList.toggle(name + '-hidden', !visible);
    const control = document.querySelector('#' + name + '-toggle');
    const label = (visible ? 'Hide ' : 'Show ') + (name === 'navigation' ? 'left navigation' : 'section index');
    control.setAttribute('aria-expanded', String(visible));
    control.setAttribute('aria-label', label);
    control.title = label;
  }
}
for (const name of ['navigation', 'index']) {
  document.querySelector('#' + name + '-toggle').addEventListener('click', () => {
    panelPreferences[name] = !panelPreferences[name];
    applyPanelPreferences();
    try { localStorage.setItem(panelPreferencesKey, JSON.stringify(panelPreferences)); } catch {}
    updateProgress();
  });
}
applyPanelPreferences();
let menuReturnFocus = menuButton;
const dialog = document.querySelector('#diagram-viewer');
const searchDialog = document.querySelector('#search-dialog');
const searchInput = document.querySelector('#library-search');
const searchResults = document.querySelector('#search-results');
const searchStatus = document.querySelector('#search-status');
let searchReturnFocus = null;
let searchDestination = null;
const stage = document.querySelector('.viewer-stage');
const canvas = document.querySelector('.viewer-canvas');
const zoomValue = document.querySelector('.zoom-value');
const positions = new Map();
const defaultTopic = panels[0].dataset.topic;
let activeTopic = defaultTopic;
let returnFocus = null;
let zoom = 1;
let baseWidth = 0;
let aspect = 1;
let drag = null;
function selectTopic(topic, { focus = false, preserveHash = false } = {}) {
  const panel = document.querySelector('#panel-' + topic);
  if (!panel) return;
  const changed = activeTopic !== topic;
  if (changed) positions.set(activeTopic, scrollY);
  activeTopic = topic;
  document.querySelector('#index-toggle').setAttribute('aria-controls', 'index-' + topic);
  topicLinks.forEach(link => {
    if (link.dataset.topic === topic) { link.setAttribute('aria-current', 'page'); if (link.closest('details')) link.closest('details').open = true; }
    else link.removeAttribute('aria-current');
  });
  panels.forEach(candidate => { candidate.hidden = candidate !== panel; });
  const heading = panel.querySelector('h1');
  if (menuDrawer.open) { menuReturnFocus = heading; menuDrawer.close(); }
  else if (focus) heading.focus({ preventScroll: true });
  document.querySelector('.current-chapter').textContent = heading.textContent;
  if (!preserveHash && location.hash !== '#' + topic) history.pushState(null, '', '#' + topic);
  if (changed) {
    panel.classList.remove('tab-panel-enter');
    void panel.offsetWidth;
    panel.classList.add('tab-panel-enter');
    scrollTo({ top: positions.get(topic) || 0, behavior: 'instant' });
  }
  document.title = panel.querySelector('h1').textContent + ' | Distributed Systems Foundations';
  updateProgress();
}
document.querySelectorAll('[data-topic]:not(.chapter-panel)').forEach(control => {
  control.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectTopic(control.dataset.topic, { focus: true });
  });
});
function placeNavigation() {
  if (mobileLayout.matches) document.querySelector('.drawer-content').append(topicNavigation);
  else {
    if (menuDrawer.open) { menuReturnFocus = document.querySelector('#topic-' + activeTopic); menuDrawer.close(); }
    topicSidebar.append(topicNavigation);
  }
}
menuButton.addEventListener('click', () => {
  menuReturnFocus = menuButton;
  menuDrawer.showModal();
  menuButton.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  const activeGroup = document.querySelector('#topic-' + activeTopic).closest('details');
  if (activeGroup) activeGroup.open = true;
  document.querySelector('#menu-close').focus();
});
document.querySelector('#menu-close').addEventListener('click', () => menuDrawer.close());
menuDrawer.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); menuDrawer.close(); }
  if (event.key === 'Tab') {
    const controls = [...menuDrawer.querySelectorAll('button, summary, a[href]')].filter(control => control.getClientRects().length);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
menuDrawer.addEventListener('click', event => { if (event.target === menuDrawer) menuDrawer.close(); });
menuDrawer.addEventListener('close', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  if (!dialog.open && !searchDialog.open) document.body.style.overflow = '';
  menuReturnFocus.focus({ preventScroll: true });
});
mobileLayout.addEventListener('change', placeNavigation);
placeNavigation();
const normalizeSearch = value => value.normalize('NFKC').toLowerCase().replace(/\\s+/g, ' ').trim();
function searchableText(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const chunks = [];
  while (walker.nextNode()) chunks.push(walker.currentNode.textContent);
  return chunks.join(' ').replace(/\\s+/g, ' ').trim();
}
const searchEntries = [];
for (const panel of panels) {
  const title = panel.querySelector('h1').textContent;
  const collection = panel.classList.contains('reference-panel') ? 'Cheatsheets' : 'Explanations';
  let entry = { topic: panel.dataset.topic, title, collection, section: title, target: panel.querySelector('h1').id, text: searchableText(panel.querySelector('.chapter-header')) };
  const accuracy = panel.querySelector('.accuracy-note');
  if (accuracy) entry.text += ' ' + searchableText(accuracy);
  searchEntries.push(entry);
  for (const block of panel.querySelector('.note-body').children) {
    if (/^H[2-6]$/.test(block.tagName)) {
      entry = { topic: panel.dataset.topic, title, collection, section: block.textContent, target: block.id, text: '' };
      searchEntries.push(entry);
    }
    entry.text += ' ' + searchableText(block);
  }
}
for (const entry of searchEntries) entry.normalized = normalizeSearch(entry.title + ' ' + entry.section + ' ' + entry.text);
function highlightText(container, value, terms) {
  const lower = value.toLowerCase();
  let cursor = 0;
  while (cursor < value.length) {
    let match = -1;
    let length = 0;
    for (const term of terms) {
      const found = lower.indexOf(term, cursor);
      if (found >= 0 && (match < 0 || found < match || (found === match && term.length > length))) { match = found; length = term.length; }
    }
    if (match < 0) { container.append(document.createTextNode(value.slice(cursor))); break; }
    container.append(document.createTextNode(value.slice(cursor, match)));
    const mark = document.createElement('mark');
    mark.textContent = value.slice(match, match + length);
    container.append(mark);
    cursor = match + length;
  }
}
function renderSearch() {
  const query = normalizeSearch(searchInput.value);
  const terms = query.split(' ').filter(Boolean);
  const matches = terms.length ? searchEntries.filter(entry => terms.every(term => entry.normalized.includes(term))).map(entry => ({ entry, score: (normalizeSearch(entry.section).includes(query) ? 8 : 0) + (normalizeSearch(entry.text).includes(query) ? 4 : 0) + (entry.topic === 'cheatsheet-index' ? -10 : 0) })).sort((left, right) => right.score - left.score).map(match => match.entry) : searchEntries.filter(entry => entry.target.startsWith('heading-'));
  searchResults.replaceChildren();
  searchStatus.textContent = terms.length ? matches.length ? matches.length + ' matching sections' : 'No matching sections' : panels.length + ' documents';
  document.querySelector('#search-clear').disabled = !searchInput.value;
  for (const entry of matches) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'search-result';
    link.href = '#' + entry.target;
    const path = document.createElement('span');
    path.className = 'result-path';
    path.textContent = entry.collection + ' / ' + entry.title;
    const title = document.createElement('strong');
    highlightText(title, entry.section.replace(/^§\\s*/, ''), terms);
    link.append(path, title);
    if (terms.length) {
      const snippet = document.createElement('p');
      const text = entry.text.replace(/\\s+/g, ' ').trim();
      const offsets = terms.map(term => text.toLowerCase().indexOf(term)).filter(offset => offset >= 0);
      const start = Math.max(0, (offsets.length ? Math.min(...offsets) : 0) - 55);
      const end = Math.min(text.length, start + 245);
      highlightText(snippet, (start ? '... ' : '') + text.slice(start, end) + (end < text.length ? ' ...' : ''), terms);
      link.append(snippet);
    }
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      searchDestination = entry;
      searchDialog.close();
    });
    item.append(link);
    searchResults.append(item);
  }
}
function openSearch(opener) {
  searchReturnFocus = opener;
  searchDestination = null;
  if (menuDrawer.open) { menuReturnFocus = searchInput; menuDrawer.close(); }
  searchDialog.showModal();
  document.body.style.overflow = 'hidden';
  renderSearch();
  searchInput.focus();
  searchInput.select();
}
document.querySelectorAll('.search-open').forEach(button => button.addEventListener('click', () => openSearch(button)));
searchInput.addEventListener('input', renderSearch);
document.querySelector('#search-clear').addEventListener('click', () => { searchInput.value = ''; renderSearch(); searchInput.focus(); });
document.querySelector('#search-close').addEventListener('click', () => searchDialog.close());
searchDialog.addEventListener('click', event => { if (event.target === searchDialog) searchDialog.close(); });
searchDialog.addEventListener('close', () => {
  if (!menuDrawer.open && !dialog.open) document.body.style.overflow = '';
  if (searchDestination) {
    const entry = searchDestination;
    searchDestination = null;
    selectTopic(entry.topic, { preserveHash: true });
    if (location.hash !== '#' + entry.target) history.pushState(null, '', '#' + entry.target);
    const target = document.getElementById(entry.target);
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    target.classList.remove('search-target');
    void target.offsetWidth;
    target.classList.add('search-target');
  } else if (searchReturnFocus?.getClientRects().length) searchReturnFocus.focus({ preventScroll: true });
  else document.querySelector('#heading-' + activeTopic).focus({ preventScroll: true });
});
searchDialog.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); searchDialog.close(); }
  const links = [...searchResults.querySelectorAll('a')];
  const activeIndex = links.indexOf(document.activeElement);
  if (event.key === 'ArrowDown') { event.preventDefault(); links[Math.min(activeIndex + 1, links.length - 1)]?.focus(); }
  if (event.key === 'ArrowUp') { event.preventDefault(); if (activeIndex > 0) links[activeIndex - 1].focus(); else searchInput.focus(); }
  if (event.key === 'Enter' && document.activeElement === searchInput) { event.preventDefault(); links[0]?.click(); }
  if (event.key === 'Tab') {
    const controls = [...searchDialog.querySelectorAll('button:not(:disabled), input, a[href]')].filter(control => control.getClientRects().length);
    if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
  }
});
addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !dialog.open) {
    event.preventDefault();
    if (searchDialog.open) searchInput.focus(); else openSearch(document.activeElement);
  }
});
function resolveHash() {
  const id = location.hash.slice(1);
  const topic = panels.find(panel => panel.dataset.topic === id);
  const target = document.getElementById(id);
  if (!id) selectTopic(defaultTopic, { preserveHash: true });
  else if (topic) selectTopic(topic.dataset.topic, { preserveHash: true });
  else if (target?.closest('.chapter-panel')) {
    selectTopic(target.closest('.chapter-panel').dataset.topic, { preserveHash: true });
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  else selectTopic(defaultTopic);
}
addEventListener('hashchange', resolveHash);
function updateProgress() {
  const article = document.querySelector('#panel-' + activeTopic + ' article');
  const start = article.getBoundingClientRect().top + scrollY;
  const available = Math.max(1, article.offsetHeight - innerHeight + 100);
  const progress = Math.max(0, Math.min(1, (scrollY - start + 100) / available));
  document.querySelector('.progress-track span').style.width = (progress * 100) + '%';
  const headers = [...article.querySelectorAll('.note-body h2')];
  const current = headers.filter(header => header.getBoundingClientRect().top < 150).at(-1) || headers[0];
  document.querySelectorAll('#panel-' + activeTopic + ' .chapter-index nav a').forEach(link => {
    if (current && link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
let scrollQueued = false;
addEventListener('scroll', () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => { updateProgress(); scrollQueued = false; });
}, { passive: true });
document.querySelector('.jump-top').addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
function fitDiagram() {
  const availableWidth = stage.clientWidth - 56;
  const availableHeight = stage.clientHeight - 56;
  baseWidth = Math.max(100, Math.min(availableWidth, availableHeight * aspect));
  zoom = 1;
  renderZoom();
  stage.scrollTo(0, 0);
}
function renderZoom() {
  canvas.style.setProperty('--diagram-width', (baseWidth * zoom) + 'px');
  canvas.style.setProperty('--diagram-height', (baseWidth * zoom / aspect) + 'px');
  canvas.style.width = Math.max(stage.clientWidth, baseWidth * zoom + 56) + 'px';
  canvas.style.height = Math.max(stage.clientHeight, baseWidth * zoom / aspect + 56) + 'px';
  zoomValue.textContent = Math.round(zoom * 100) + '%';
  document.querySelector('#zoom-out').disabled = zoom <= 0.5;
  document.querySelector('#zoom-in').disabled = zoom >= 6;
}
function adjustZoom(factor) {
  const oldZoom = zoom;
  const centerX = (stage.scrollLeft + stage.clientWidth / 2) / Math.max(canvas.offsetWidth, 1);
  const centerY = (stage.scrollTop + stage.clientHeight / 2) / Math.max(canvas.offsetHeight, 1);
  zoom = Math.max(0.5, Math.min(6, zoom * factor));
  if (zoom === oldZoom) return;
  renderZoom();
  stage.scrollLeft = canvas.offsetWidth * centerX - stage.clientWidth / 2;
  stage.scrollTop = canvas.offsetHeight * centerY - stage.clientHeight / 2;
}
document.querySelectorAll('.diagram-open').forEach(button => button.addEventListener('click', () => {
  returnFocus = button;
  const original = button.querySelector('svg');
  const copy = original.cloneNode(true);
  copy.querySelectorAll('[id]').forEach(element => { element.id += '-viewer'; });
  copy.querySelectorAll('*').forEach(element => {
    for (const attribute of [...element.attributes]) {
      if (attribute.value.includes('url(#')) element.setAttribute(attribute.name, attribute.value.replace(/url\\(#([^)]*)\\)/g, 'url(#$1-viewer)'));
    }
  });
  copy.setAttribute('aria-labelledby', original.getAttribute('aria-labelledby').split(' ').map(id => id + '-viewer').join(' '));
  canvas.replaceChildren(copy);
  document.querySelector('#viewer-title').textContent = original.querySelector('title').textContent;
  aspect = original.viewBox.baseVal.width / original.viewBox.baseVal.height;
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  fitDiagram();
  document.querySelector('#viewer-close').focus();
}));
document.querySelector('#zoom-in').addEventListener('click', () => adjustZoom(1.25));
document.querySelector('#zoom-out').addEventListener('click', () => adjustZoom(0.8));
document.querySelector('#zoom-reset').addEventListener('click', fitDiagram);
document.querySelector('#viewer-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => { document.body.style.overflow = ''; canvas.replaceChildren(); returnFocus?.focus({ preventScroll: true }); });
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
  if (event.key === '+' || event.key === '=') { event.preventDefault(); adjustZoom(1.25); }
  if (event.key === '-') { event.preventDefault(); adjustZoom(0.8); }
  if (event.key === '0') { event.preventDefault(); fitDiagram(); }
});
stage.addEventListener('wheel', event => { if (event.ctrlKey || event.metaKey) { event.preventDefault(); adjustZoom(event.deltaY < 0 ? 1.1 : 1 / 1.1); } }, { passive: false });
stage.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  drag = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop };
  stage.setPointerCapture(event.pointerId);
  stage.classList.add('dragging');
});
stage.addEventListener('pointermove', event => {
  if (!drag) return;
  stage.scrollLeft = drag.left - (event.clientX - drag.x);
  stage.scrollTop = drag.top - (event.clientY - drag.y);
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) stage.addEventListener(type, () => { drag = null; stage.classList.remove('dragging'); });
addEventListener('resize', () => { if (dialog.open) fitDiagram(); updateProgress(); });
resolveHash();
updateProgress();
`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="description" content="Five illustrated field notes on distributed systems: processes, concurrency, failures, availability, and consistency."><title>Distributed Systems Foundations</title><style>${css}${navigationCss}</style></head>
<body><a class="skip" href="#reading">Skip to notes</a><header class="masthead"><div class="masthead-inner"><div class="identity"><div class="brand-mark">${icon('network')}</div><div><div class="eyebrow">SYSTEM DESIGN / FIELD NOTES</div><p class="brand-title">Distributed Systems Foundations</p></div></div><div class="header-actions"><div class="edition"><strong>THE FOUNDATIONS SERIES</strong>${topics.length} documents / ${sequence} figures</div><button class="icon-button search-open" aria-label="Search all content" aria-haspopup="dialog" aria-controls="search-dialog" title="Search all content">${icon('search')}</button></div></div></header>
<div class="mobile-bar"><button id="menu-open" class="icon-button" aria-label="Open chapter menu" aria-haspopup="dialog" aria-controls="menu-drawer" aria-expanded="false" title="Open chapter menu">${icon('menu')}</button><button id="navigation-toggle" class="icon-button" aria-label="Hide left navigation" aria-controls="topic-sidebar" aria-expanded="true" title="Hide left navigation">${icon('panel-left')}</button><span class="current-chapter">${esc(topics[0].title)}</span><button class="icon-button search-open" aria-label="Search all content" aria-haspopup="dialog" aria-controls="search-dialog" title="Search all content">${icon('search')}</button><button id="index-toggle" class="icon-button" aria-label="Hide section index" aria-controls="index-${topics[0].id}" aria-expanded="true" title="Hide section index">${icon('panel-right')}</button></div><div class="progress-track" aria-hidden="true"><span></span></div>
<div class="library-layout"><aside class="topic-sidebar" id="topic-sidebar" aria-label="Topic navigation">${navigation}</aside><main id="reading" tabindex="-1">${rendered}</main></div><footer class="site-footer"><span>Distributed Systems Foundations</span><span>Source notes: September 2026</span></footer><button class="jump-top" aria-label="Back to top" title="Back to top">${icon('arrow-up')}</button>
<dialog id="menu-drawer" class="menu-drawer" aria-labelledby="menu-title"><div class="drawer-head"><h2 id="menu-title">Chapters</h2><button id="menu-close" class="icon-button" aria-label="Close chapter menu" title="Close chapter menu">${icon('x')}</button></div><div class="drawer-content"></div></dialog>
<dialog id="search-dialog" class="search-dialog" aria-labelledby="search-title"><header class="search-head"><h2 id="search-title">Search the library</h2><button id="search-close" class="icon-button" aria-label="Close search">${icon('x')}</button></header><div class="search-field">${icon('search')}<input id="library-search" type="search" aria-label="Search all explanations and cheatsheets" aria-controls="search-results" placeholder="Search all content" autocomplete="off" spellcheck="false"><button id="search-clear" class="icon-button" aria-label="Clear search">${icon('x')}</button></div><p id="search-status" class="search-status" role="status" aria-live="polite"></p><ol id="search-results" class="search-results" aria-label="Search results"></ol></dialog>
<dialog id="diagram-viewer" aria-labelledby="viewer-title"><div class="viewer-head"><h2 id="viewer-title">Diagram</h2><div class="viewer-tools"><button id="zoom-out" class="icon-button" aria-label="Zoom out">${icon('minus')}</button><output class="zoom-value" aria-live="polite" aria-label="Diagram zoom">100%</output><button id="zoom-in" class="icon-button" aria-label="Zoom in">${icon('plus')}</button><button id="zoom-reset" class="icon-button" aria-label="Fit diagram">${icon('scan')}</button><button id="viewer-close" class="icon-button" aria-label="Close diagram">${icon('x')}</button></div></div><div class="viewer-stage" tabindex="0" aria-label="Diagram canvas"><div class="viewer-canvas"></div></div></dialog>
<script>${js}</script></body></html>`;
assert.equal(report.length, explanationFiles.length + cheatsheetFiles.length);
assert.equal(sequence, report.reduce((sum, entry) => sum + entry.diagrams, 0));
assert(!/<script[^>]*\bsrc=|<link[^>]*\bhref=/.test(html), 'Unexpected external runtime dependency');
new Function(js);
const temporary = path.join(root, `.distributed-systems-foundations.${process.pid}.tmp`);
try {
  fs.writeFileSync(temporary, html);
  fs.renameSync(temporary, output);
} finally {
  fs.rmSync(temporary, { force: true });
}
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
console.log(`Built ${report.length} documents, ${sequence} SVGs: ${output}`);