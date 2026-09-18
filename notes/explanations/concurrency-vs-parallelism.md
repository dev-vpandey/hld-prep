# Concurrency vs. Parallelism in Distributed Systems

Saved: 2026-09-18
Related note: @notes/explanations/processes-vs-threads.md (threads are the primitive concurrency/parallelism are built on)
Related cheatsheet: none yet directly covers this — candidate for a future addition to @notes/cheatsheets/cheatsheet-g6-scale.md (§ SCALING STRATEGY) and @notes/cheatsheets/cheatsheet-g4-messaging.md (§ ASYNC WORKERS, Kafka partition parallelism)

---

## 1. The Core Idea — Structure vs. Execution

**Plain words:** Concurrency is *juggling* — one pair of hands, many balls in the air, switching fast enough that it looks simultaneous. Parallelism is *hiring more jugglers* — each ball genuinely has its own hands on it at the same instant.

**Analogy:** One cashier serving 5 customers by rapidly hopping between their orders (concurrency) vs. 5 cashiers each serving one customer at the same time (parallelism).

```
CONCURRENCY (1 core, task-switching)      PARALLELISM (N cores, simultaneous)

Core1: [A][B][A][C][B][A][C]              Core1: [A][A][A][A][A][A]
                                            Core2: [B][B][B][B][B][B]
Time ─────────────────────────►            Core3: [C][C][C][C][C][C]
progress on A,B,C interleaved              Time ─────────────────────────►
                                            A,B,C truly overlap in time
```

**Staff-level angle:** Interviewers use this exact framing to test whether you reach for threads/async reflexively or reason from the workload. The correct opening move in an interview is always: *"Is this I/O-bound or CPU-bound?"* — that single question determines whether you propose an event loop, a thread pool, or a cluster of workers. Answering with a specific technology before naming the bottleneck is a Senior-level tell, not a Staff-level one.

---

## 2. Concurrency in Distributed Systems

**Plain words:** On one core, only one thing truly runs at a time, but the OS swaps tasks in and out so fast it *feels* simultaneous. This is a huge win when tasks spend most of their time *waiting* (for a DB, a disk, a network call) rather than *computing*.

**Task states:**

```
        ┌────────────────────┐
        │       READY        │◄───────────┐
        └─────────┬──────────┘            │
                   │ CPU assigned          │ I/O done /
                   ▼                       │ resource free
        ┌────────────────────┐            │
        │       RUNNING      │────────────┘
        └─────────┬──────────┘
                   │ needs I/O / waits on DB
                   ▼
        ┌────────────────────┐
        │       BLOCKED       │
        └────────────────────┘
```

**Dry run — Node.js style event loop:**
```
Request A arrives → needs DB query → dispatched, thread freed
Request B arrives → needs DB query → dispatched, thread freed
Request C arrives → CPU-only work  → runs immediately
...A's DB result returns → callback queued → A resumes
...B's DB result returns → callback queued → B resumes
```
One thread, thousands of "in-flight" requests — because none of them are *actually* using the CPU while waiting.

**Staff-level angle:** A Staff answer doesn't stop at "Node uses an event loop." It explains *why* this scales: the cost of an idle thread (stack memory, scheduler bookkeeping) versus the cost of a pending callback (a few bytes in a queue). You should be able to say: *"If I have 50,000 concurrent connections, a thread-per-connection model needs ~50,000 stacks (megabytes of RAM each) — an event loop needs one thread and 50,000 lightweight continuations."* That's the number an interviewer wants to hear, not just the vocabulary.

---

## 3. Challenges of Concurrency

**Plain words + everyday analogy for each:**

- **Race condition** — Two roommates both check "milk carton has some left" then both decide not to buy more → nobody bought milk, fridge is now empty. Order of checks mattered and nobody coordinated.
- **Deadlock** — Two cars meet on a single-lane bridge, each waiting for the other to back up first. Forever.
- **Starvation** — The quiet kid in class who never gets called on because louder hands keep going first.
- **Complex debugging** — A ghost that only appears when you're not filming it — race conditions vanish under a debugger because the timing changes.
- **Context-switch overhead** — Every time you put down one book and pick up another, you lose a few seconds re-finding your place. Do that too often and you spend more time flipping pages than reading.

**Staff-level angle:** Staff interviews probe whether you can *design away* these bugs rather than just detect them. Expected vocabulary: lock ordering (fixed acquisition order prevents deadlock), optimistic concurrency control / CAS instead of locks (avoids blocking), and bounded queues + backpressure instead of unbounded task spawning (avoids starvation under load). Naming "use a mutex" alone reads as Mid-level; naming *which* class of bug a specific primitive prevents, and its cost, reads as Staff.

---

## 4. Context Switching

**Plain words:** Switching tasks isn't free — you pay in three currencies: saving/restoring CPU state, the scheduler's decision time, and (the expensive one) your CPU cache going cold for the new task.

```
Task A running ──► [SAVE A's registers] ──► [scheduler picks next] ──► [LOAD B's registers] ──► Task B running
                         cheap                    cheap                      cheap
                                     but: L1/L2 cache now full of A's data,
                                     B causes cache MISSES → fetch from RAM (slow)
                                     = the real cost, hidden from the "switch time" number
```

**Dry run — thrashing:**
```
CPU Utilization
   │        ___________
   │      /'            `--___
   │    /                      `--___          ← thrashing: adding more
   │  /                                `--___     tasks now HURTS throughput
   │/______________________________________`--►
                Degree of multiprogramming (# tasks)
      ↑ optimal point           ↑ overload — mostly switching, not working
```

**Staff-level angle:** This is where Staff candidates distinguish themselves with *mechanism*, not metaphor: cache invalidation is the dominant cost, not register save/restore. The mitigation vocabulary an interviewer wants: **thread pools** (bound concurrency to avoid thrashing), **async I/O** (avoid parking a whole thread — and its stack + cache footprint — just to wait), and **CPU pinning / core affinity** in latency-sensitive systems (keep a thread's working set warm in a specific core's cache). If asked "why not just spawn a thread per request," the thrashing curve above *is* your answer.

---

## 5. Parallelism in Distributed Systems

**Plain words:** Parallelism only exists when you have multiple actual execution units — cores, GPUs, or machines — and you split one big job into independent pieces so they finish faster together than one piece would alone.

**Analogy:** Five people mowing five sections of one lawn at once vs. one person mowing all five sections in sequence.

**Dry run — Kafka partition parallelism:**
```
Topic "orders" split into 4 partitions
                     ┌───────────┐
Partition 0 ───────► │ Consumer 1 │
Partition 1 ───────► │ Consumer 2 │   ← consumer group, each instance
Partition 2 ───────► │ Consumer 3 │     reads its own partition in parallel
Partition 3 ───────► │ Consumer 4 │
                     └───────────┘
4x ingestion throughput vs. 1 consumer reading everything serially
```

**Staff-level angle:** Staff-level framing ties parallelism to **Amdahl's Law** even when the source text doesn't name it explicitly: speedup is capped by the fraction of work that *can't* be parallelized. If an interviewer asks "how many partitions should this topic have," the wrong answer is a number pulled from thin air — the right answer walks through: peak throughput target ÷ per-partition consumer throughput, then flags that partition count is a **scaling ceiling decided at topic-creation time** (repartitioning is expensive), so you provision headroom, not just today's number.

---

## 6. Challenges of Parallelism

**Plain words + analogy:**

- **Data dependency** — You can't frost the cake before it's baked, no matter how many bakers you have.
- **Load imbalance** — Splitting a group project into "chapters," but one chapter is 3x longer than the others — that person is still working while everyone else is done.
- **Synchronization cost** — A relay race where every runner has to wait at each handoff point for the others to arrive, even if they finished their leg early.
- **Memory contention** — Five people trying to write on the same whiteboard at once — someone has to wait, whiteboard or not.
- **Scalability limits** — Adding more cooks doesn't help once the kitchen only has one stove — the stove (serial bottleneck) caps you no matter the headcount.

**Staff-level angle:** This section is a direct gateway to **Amdahl's Law** discussions and to **sharding hot-spot** discussions (memory contention → the distributed-systems analogue is a hot partition/hot key). A Staff candidate should proactively connect "load imbalance" here to "consistent hashing" and "celebrity/hot-key problem" (see @notes/cheatsheets/cheatsheet-g2-storage.md § CONSISTENT HASHING and @notes/cheatsheets/cheatsheet-g7-social.md § HYBRID FAN-OUT) — interviewers reward connecting a CPU-level concept to its distributed-systems cousin without being prompted.

---

## 7. Concurrency vs. Parallelism — Comparison

╔═══════════════╦════════════════════════════════════╦══════════════════════════════════════╗
║ Characteristic ║ Concurrency                         ║ Parallelism                           ║
╠═══════════════╬════════════════════════════════════╬══════════════════════════════════════╣
║ Definition     ║ Managing multiple tasks at once     ║ Executing multiple tasks simultaneously ║
║ Hardware       ║ Works on a single core              ║ Needs multiple cores/processors       ║
║ Goal           ║ Responsiveness, resource utilization║ Speed, throughput for CPU-bound work  ║
║ Mechanism      ║ Interleaving via context switching  ║ True simultaneous execution           ║
║ Use Cases      ║ Web servers, GUIs, I/O-bound apps   ║ Data processing, rendering, science    ║
╚═══════════════╩════════════════════════════════════╩══════════════════════════════════════╝

---

## 8. Practical Scenarios

- **High-traffic web server (I/O-bound)** → concurrency wins. Event-driven, non-blocking I/O.
- **Video transcoding (CPU-bound)** → parallelism wins. Split segments across cores.
- **Real-time analytics pipeline** → hybrid: parallel ingestion across consumers, concurrent async I/O *within* each consumer for enrichment.

**Staff-level angle:** This is precisely the shape of the media-server test question below — and the shape of a huge fraction of real Staff-level design interviews: *"here's a workload with two different bottleneck types stapled together, design the execution model."* The Staff answer is never "concurrency" or "parallelism" in isolation — it's naming which sub-task gets which model and *why the boundary is drawn there*.

### Test-your-knowledge — worked example (media server: auth check + 4K transcode)

```
Request in
   │
   ▼
[Event loop / async handler]  ← CONCURRENT: auth + DRM check (I/O-bound,
   │                              fast DB query) — never blocks a thread
   │
   ▼
dispatch transcode job ──► [Worker pool, 1 worker per core] ← PARALLEL:
                              5 resolutions split across cores, CPU-bound
```
Auth/DRM is fast and I/O-bound → handle it concurrently so the server stays responsive to *other* incoming requests while waiting on the DB. Transcoding is slow and CPU-bound → hand it to a dedicated parallel worker pool so it doesn't stall the concurrent request-handling layer, and so multiple cores chew through the 5 resolutions at once instead of serially.

**Staff-level angle — the follow-up an interviewer will ask next:** "What happens when transcode jobs pile up faster than workers can drain them?" This is your cue to bring in **backpressure / bounded queue** (reject or shed load rather than let the worker pool's queue grow unbounded and exhaust memory) and **decoupling via a message queue** (Kafka/SQS) so the request-handling tier and the transcode tier can scale independently — this is @notes/cheatsheets/cheatsheet-g4-messaging.md § ASYNC WORKERS territory intersecting with this lesson.

---

## The One Sentence to Remember

**Concurrency is about structure (dealing with many things over time on possibly one core); parallelism is about execution (doing many things at the exact same instant on multiple cores) — and the Staff-level move is always to split a workload along its I/O-bound/CPU-bound seam and assign each side its own model.**

Where it's used in practice: every high-throughput backend that mixes network calls with real computation — web servers dispatching to worker pools, stream processors (Kafka consumer groups) doing parallel ingestion with concurrent per-record enrichment, and ML serving layers that queue requests concurrently but batch/parallelize the actual GPU inference.
