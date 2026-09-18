# Processes vs. Threads for Scalable Distributed Systems

Saved: 2026-09-13
Related cheatsheet: none yet directly covers concurrency models — candidate for a future addition to @notes/cheatsheets/cheatsheet-g6-scale.md

---

## Plain words first

Think of a big office building (the machine). Each **department** (process) has its own locked room, its own filing cabinets, its own budget — nobody outside can just walk in and touch another department's files. Inside a department, several **employees** (threads) share the same room, same filing cabinets, same coffee machine. They can pass a document to each other in two seconds flat — but if one employee spills coffee on the shared filing cabinet, everyone in that room is affected.

Jargon version: a **process** is an isolated unit of execution with its own address space; a **thread** is a unit of execution that shares its parent process's address space, differing only in its own stack + program counter.

```
             MACHINE (physical RAM + CPU cores)
   ┌───────────────────────┬───────────────────────┐
   │      PROCESS A        │      PROCESS B         │
   │  (own memory space)   │   (own memory space)   │
   │  ┌───────┐ ┌───────┐  │   ┌───────┐            │
   │  │Thread1│ │Thread2│  │   │Thread1│            │
   │  │ stack │ │ stack │  │   │ stack │            │
   │  └───────┘ └───────┘  │   └───────┘            │
   │  shared: code/data/   │   shared: code/data/   │
   │  heap/file handles    │   heap/file handles    │
   └───────────────────────┴───────────────────────┘
        ▲ crash in A doesn't touch B (MMU-enforced)
```

## Section 1 — OS-level execution models

- **Process** = independent factory (Chrome: 1 tab = 1 process → one tab crashing doesn't kill the browser).
- **Thread** = worker inside the factory (word processor: one thread takes keystrokes, another spell-checks in background).

Staff angle: the isolation isn't a convention, it's hardware-enforced. The **MMU (Memory Management Unit)** translates each process's virtual addresses to physical RAM and refuses cross-process access. This is *why* a JVM crash in one microservice pod doesn't corrupt the sidecar proxy sitting next to it in the same pod but different container/process.

## Section 2 — Distinguishing processes and threads

### Memory allocation & isolation

╔══════════════════════╦═══════════════════════════╦═══════════════════════════╗
║ Aspect                ║ Process                    ║ Thread                     ║
╠══════════════════════╬═══════════════════════════╬═══════════════════════════╣
║ Address space          ║ Own, isolated               ║ Shared with parent process ║
║ Unique per-unit state  ║ Everything                  ║ Stack + program counter    ║
║ Crash blast radius     ║ Contained to itself         ║ Whole process              ║
║ Comms to sibling units ║ IPC (pipes, sockets, shm)   ║ Direct shared memory read  ║
╚══════════════════════╩═══════════════════════════╩═══════════════════════════╝

Distributed-systems examples of this exact trade-off:
- **Nginx worker processes** — each worker is a separate OS process so one worker segfaulting doesn't take the whole server down; master process just respawns it.
- **PostgreSQL** — one OS process per client connection (classic, pre-pooling) for strong fault isolation between client sessions; that's *why* PgBouncer (connection pooling) exists — process-per-connection got too expensive at scale.
- **JVM inside a microservice** — many threads inside one process (Netty event-loop threads, Tomcat worker threads) sharing heap; a memory leak or `OutOfMemoryError` in one thread's object graph can bring the whole JVM down.
- **Kubernetes pod with sidecar (Envoy)** — app container and Envoy proxy run as separate OS processes (in separate containers) specifically so a crash in Envoy doesn't crash the app, and vice versa. This is process-level isolation used as an architectural pattern (sidecar pattern).

### Resource ownership & overhead

```
CONTEXT SWITCH: process vs thread

Process switch (heavy):                Thread switch (light):
┌─────┐  save full PCB   ┌─────┐       ┌─────┐ save regs+stack ┌─────┐
│ P0  │ ───────────────▶ │ OS  │       │ T1  │ ──────────────▶ │ OS  │
│(mem │  flush TLB       │sched│       │(same│  TLB stays warm │sched│
│ map)│ ◀─────────────── │     │       │ mem │ ◀────────────── │     │
└─────┘  restore PCB P1  └─────┘       │ map)│  restore T2 ctx │     │
                                        └─────┘                 └─────┘
   P1 resumes, P0 idle                    T2 resumes, T1 idle
```

- **Creation cost**: process = `fork()` — copy page tables, allocate PCB, init file descriptors. Thread = just a new stack + entry in the existing process's thread table. This is *why* thread pools (Tomcat, `java.util.concurrent.ThreadPoolExecutor`) exist — reusing threads avoids paying creation cost per request, while process pools (Gunicorn/uWSGI pre-fork workers) pay a bigger one-time cost for stronger isolation.
- **Context switch cost**: process switch flushes the TLB (translation lookaside buffer) since the address space changed; thread switch within the same process keeps the TLB warm. At high concurrency (10K+ connections), this cost compounds — directly motivating the next section.

## Section 3 — Concurrency models in real servers

```
THREAD-PER-REQUEST                    EVENT-DRIVEN (single/few loops)

Req1 ──▶[Thread1: blocks on I/O]      Req1 ─┐
Req2 ──▶[Thread2: blocks on I/O]      Req2 ─┼─▶[Event Loop]──▶[non-blocking I/O]
Req3 ──▶[Thread3: blocks on I/O]      Req3 ─┘        │
   ...                                                ▼
ReqN ──▶[ThreadN: blocks on I/O]           heavy work → [Thread Pool]

N threads, N stacks, N context           1 (or few) threads handle
switches. Simple code, doesn't           thousands of connections.
scale past ~10K conns (C10k problem).    Complex async code (callbacks/
Apache mpm_worker.                       promises/coroutines). Nginx, Node.js.
```

Staff-level framing — this is **the C10k problem**, and naming it in an interview signals you know the history: thread-per-request hits a wall because OS-level thread stacks (default ~1-8MB each) and scheduler overhead don't scale linearly with connection count, especially when most connections are *idle* (e.g., WebSocket keep-alives, long-polling). Event-driven flips the model: one thread never blocks, it just registers interest in an fd (via `epoll`/`kqueue`) and moves on.

More distributed-systems examples worth dropping in an interview:
- **Redis** — single-threaded event loop for command execution (avoids locking overhead entirely) but uses background threads for slow ops like `UNLINK`/AOF rewriting — a hybrid.
- **Node.js** — single JS thread + libuv event loop + a hidden thread pool for blocking syscalls (DNS, file I/O).
- **Go** — goroutines are neither OS threads nor raw callbacks; the Go runtime multiplexes M goroutines onto N OS threads (M:N scheduling), giving thread-per-request *ergonomics* with event-loop *efficiency*. Good one to mention if asked "is there a third way?"
- **Erlang/BEAM (WhatsApp)** — "processes" here are actually lightweight, isolated, per-request green threads with no shared memory (message-passing only) — proves isolation and lightweight-ness aren't mutually exclusive if you control the runtime.
- **Envoy/Nginx** — event-driven, multi-process (a handful of worker processes, each running its own event loop) — combining both models: process-level isolation across a small number of workers, event-loop concurrency within each.

## Section 4 — Linking to System Design decisions (the part interviewers actually score)

╔═══════════════════════╦════════════════════════════════════╦═══════════════════════════════════════╗
║ Decision axis          ║ Favors Processes                    ║ Favors Threads / Event-loop            ║
╠═══════════════════════╬════════════════════════════════════╬═══════════════════════════════════════╣
║ Workload type          ║ CPU-bound (video encode, ML infer)  ║ I/O-bound (API gateway, DB proxy)      ║
║ Isolation need         ║ Multi-tenant, untrusted code        ║ Trusted, tightly-coupled tasks         ║
║ Data sharing           ║ Rare, coarse-grained (via IPC)      ║ Frequent, fine-grained (shared memory) ║
║ Scalability target     ║ 10s–100s of workers (cores-bound)   ║ 10K–1M idle connections                ║
╚═══════════════════════╩════════════════════════════════════╩═══════════════════════════════════════╝

**Worked dry run (chat app, walked like a Staff candidate would):**

1. Day 1, MVP: thread-per-request. Simple, each connection handler is linear code, easy to reason about, easy to onboard new engineers. Fine at 500 concurrent users.
2. Scale to 1M concurrent WebSocket connections: thread-per-request would need ~1M threads → OS can't schedule that, memory for stacks alone (1M × even 512KB) = 512GB. Switch justification: most of those connections are *idle* 99% of the time (waiting for a message), which is the textbook case for event-driven.
3. Architecture becomes: event-driven gateway (Nginx/Envoy or a Node.js/Netty layer) accepts and multiplexes connections → CPU-heavy work (message encoding, image processing) gets *handed off* to a bounded worker/process pool so the event loop is never blocked.
4. Isolation call: keep the WebSocket gateway and message-persistence service as **separate processes/pods**, not threads in one process — so a bug in message persistence (e.g., a slow DB call panicking) can't take down the live connection layer. Same reasoning as the Envoy sidecar example above.

**Embedded quiz answer** ("why prefer multi-process over multi-threaded despite overhead?") — the Staff-level answer: fault containment and security boundary. If a task runs untrusted or third-party code (plugins, user-submitted functions — think AWS Lambda's per-invocation isolation, or a browser's per-tab sandboxing), a shared-memory crash or a security exploit in one thread can compromise the entire process's memory, including other tenants' data. Paying `fork()`/IPC cost buys you a hard wall that a shared address space cannot.

## The one sentence to remember

**Processes buy you isolation at the cost of memory and switch time; threads buy you speed and shared state at the cost of shared blast radius — and at internet scale, the same trade-off resurfaces one level up as thread-per-request (simple, doesn't scale past ~10K idle connections) vs event-driven (complex, scales to millions).**

Where it shows up in practice: literally every server you've named in a design interview — Nginx/Envoy (event-driven, multi-process), Redis (single-threaded event loop), Node.js (event loop + hidden thread pool), Go (M:N goroutines), Postgres/PgBouncer (process-per-connection → pooled), Kubernetes sidecar pattern (process isolation as architecture).
