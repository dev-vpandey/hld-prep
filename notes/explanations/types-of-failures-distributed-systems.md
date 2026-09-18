# Types of Failures in Distributed Systems

Saved: 2026-09-12
Related cheatsheet: @notes/cheatsheets/cheatsheet-g5-distributed.md (§ RESILIENCE PATTERNS, § CAP)

---

## Plain words first

One computer is simple: it works, or it's broken, and you know which. A distributed system is hundreds or thousands of computers talking to each other over wires. At that scale, something is *always* broken somewhere — a disk, a program, a network cable. The chapter's whole point: **failure isn't an edge case, it's a certainty**, so you design assuming things will break, not hoping they won't.

**Analogy:** think of a restaurant kitchen with 500 cooks instead of 1. With 1 cook, if they get sick, the kitchen closes. With 500, someone is *always* sick, always cutting their finger, always burning a dish — but the kitchen never closes because there's backup for every station. That's a distributed system: not "no failures," but "failures happen constantly and nobody notices."

The chapter splits failures into 3 buckets: **hardware**, **software**, **network**.

---

## 1. Hardware failures

**Plain words:** the physical machine breaks — disk dies, RAM corrupts, power goes out, network cable/card fails.

**Jargon:** these failures occur across a *hierarchy of failure domains* — component → node → rack → data center → region. A disk failing only kills one machine's data; a whole rack losing power kills dozens of machines at once.

**Analogy:** it's like an apartment building. One unit's plumbing can fail (component-level). A whole floor can lose water pressure (rack-level). The entire building can lose power (data-center level). The bigger the blast radius, the rarer it is, but the more it matters when it happens.

### ASCII diagram — hierarchy of hardware failure domains

```
                    ▲  rarest, biggest blast radius
                   ╱ ╲
                  ╱REGION╲          ← whole geographic region down
                 ╱─────────╲
                ╱ DATA CENTER╲      ← whole building down
               ╱───────────────╲
              ╱      RACK        ╲  ← shared power/network for a row of servers
             ╱───────────────────╲
            ╱        NODE          ╲ ← single machine down
           ╱───────────────────────╲
          ╱      COMPONENT           ╲ ← disk / RAM / PSU / NIC
         ╱───────────────────────────╲
                                        most common, smallest blast radius
```

### The fix — 3 tools, always used together

- **Replication** — keep multiple copies of data on different machines. Disk dies on one → another copy already exists elsewhere.
- **Redundancy** — duplicate *critical* components before failure even happens (RAID disks, backup power generators, UPS). Note: RAID protects against a single disk dying, *not* against the whole node or rack dying — for that you need replication across machines.
- **Failover** — automatic switch to a backup when the primary dies. A load balancer notices a server stopped responding and quietly redirects traffic to healthy ones.

**Real-world example:** AWS builds each *region* out of multiple *Availability Zones* — separate data centers with their own power/cooling/networking. Spread your app across 3 AZs, and one AZ catching fire doesn't take your service down. Google's early philosophy was the extreme version of this: assume cheap commodity machines fail constantly, and build software (like the Google File System) that shrugs it off.

### Worked dry run
Say a database has 3 replica nodes: A, B, C.
1. Node A's disk fails → I/O errors start showing up.
2. Monitoring (S.M.A.R.T. disk checks) flags it within seconds.
3. Load balancer/failover system stops routing reads/writes to A.
4. B and C keep serving — client never notices.
5. Ops replaces A's disk, resyncs data from B or C.

### Table — hardware failure types

╔═══════════════════════╦══════════════════════════════════════════╦═══════════════════════════════════════╦══════════════════════════════════════════╗
║ Failure Type          ║ Key Symptoms                              ║ Detection Mechanism                    ║ Recovery Strategy                         ║
╠═══════════════════════╬══════════════════════════════════════════╬═════════════════════════════════════════╬════════════════════════════════════════╣
║ Disk Failure          ║ I/O errors, slow I/O, node unresponsive   ║ S.M.A.R.T. monitoring, checksum fails    ║ Replace disk, restore from replica/backup ║
║ Memory (RAM) Failure  ║ Crashes, kernel panics, data corruption   ║ ECC memory detection, memory tests       ║ Replace RAM module, restart node          ║
║ Power Failure         ║ Node offline, no network response         ║ Heartbeat loss, ping monitoring          ║ Restore power, failover to standby        ║
║ Network Card Failure  ║ Node unreachable, packet loss             ║ Connectivity loss, monitoring alerts     ║ Failover to secondary NIC, replace card   ║
╚═══════════════════════╩══════════════════════════════════════════╩═══════════════════════════════════════╩════════════════════════════════════════╝

---

## 2. Software failures

**Plain words:** the hardware is fine — the *code* is the problem. Bugs, crashes, resource leaks, deadlocks, bad config, bad deploys.

**Jargon:** unlike hardware (binary: works / doesn't), software failures can be *transient*, hard to reproduce, and cause *silent data corruption* — the scariest kind, because nothing crashes, it just quietly computes wrong answers.

**Analogy:** hardware failure is like a light bulb burning out — obvious, binary. A software bug is like a chef reading a recipe wrong and salting every dish 10x — the kitchen still "works," nobody notices until customers start complaining, and by then hundreds of dishes went out wrong.

### 4 forms of software failure
1. **Process crashes** — unhandled exception, segfault, out-of-memory → process dies abruptly.
2. **Logic bugs** — no crash, but wrong output (silent, dangerous, can corrupt data quietly over time).
3. **Deadlocks** — two+ processes wait on each other forever, all stuck.
4. **Resource leaks** — memory/connections never released → slow death by exhaustion.

### Cascading failures — the dangerous part
One service's bug/slowness can make *dependent* services retry excessively (a "retry storm"), which drags the failure across the whole system.

**Worked example:** 3-tier checkout flow.

```
  User
    │
    ▼
┌──────────┐        ┌──────────┐        ┌───────────────────┐
│ Checkout │──────▶ │ Payment  │──────▶ │  Fraud Detection    │
└──────────┘        └──────────┘        └───────────────────┘
    ▲                    ▲                        │
    │                    │                        ✗ times out / fails
    │   ✗ error          │  ✗ can't get fraud
    │◀───────────────────│     score, returns error
    │
  User sees a failed checkout
```

**Dry run:**
1. User clicks "Pay."
2. Checkout → Payment → Fraud Detection.
3. Fraud Detection is down/slow.
4. Payment waits, times out, has no fraud score, returns an error.
5. Checkout gets the error, fails the user's request.
6. One dead component at the bottom broke the whole chain, top to bottom.

### The fix — Circuit Breaker pattern (basic version)

Instead of letting Payment hammer a dead Fraud service forever (making things worse), wrap the call in a circuit breaker with 3 states:

```
        failures pile up
   ┌───────────────────────┐
   ▼                       │
┌────────┐   too many   ┌────────┐   test call    ┌────────────┐
│ CLOSED │ ───failures─▶│  OPEN  │ ───succeeds───▶ │ HALF-OPEN  │
│(normal)│              │(blocks │                │(try 1 call)│
└────────┘◀──test call───│ calls) │◀───test call───└────────────┘
           succeeds      └────────┘    fails
```

- **Closed** = normal, calls go through.
- **Open** = too many failures → stop calling the dead service entirely, fail fast instead of waiting/retrying.
- **Half-open** = periodically test with one call; success → close again, failure → stay open.

This stops one broken component from dragging the whole chain down with it, and gives the failing service breathing room to recover.

**Observability matters here** — a crash is obvious, but a logic bug or slow leak isn't. That's why teams use metrics (Prometheus), tracing (Jaeger), centralized logs — to *see* the problem before it cascades.

---

## 2a. Circuit breaker, elaborated — staff-level distributed-systems view

A circuit breaker isn't one component you install — it's a **local decision-maker sitting at every call site**, deciding "should I even bother calling this dependency right now, or is it clearly dead and I should fail fast instead." The staff-level nuance: it's not one circuit breaker for the whole system, it's **thousands of tiny independent circuit breakers**, one per (caller instance × dependency), each making its own local judgment with no global coordination. That's the distributed-systems part.

**Jargon version:** each client/service instance keeps a local state machine (closed/open/half-open) *per downstream dependency it calls*, tracks a rolling error-rate window, and trips independently. There is no consensus step — that's deliberate.

### The analogy, extended

A home electrical panel breaker trips when *its own* circuit draws too much current — it doesn't know or care what other rooms' breakers are doing. That's exactly right here: **Payment instance #47's circuit breaker for Fraud-Detection doesn't know or coordinate with instance #48's breaker.** Each replica of Payment independently notices "my calls to Fraud are failing," and trips on its own. This is why circuit breakers scale — no coordination overhead — but it's also why they can behave inconsistently across a fleet.

### The state machine, with the actual knobs a staff engineer tunes

```
                     rolling window: last N calls (e.g. 20)
                     trip if failure_rate ≥ threshold (e.g. 50%)
   ┌─────────────────────────────────────────────────────┐
   │                                                       │
   ▼                                                       │
┌────────┐  failure_rate ≥ 50%   ┌────────┐  wait_duration ┌────────────┐
│ CLOSED │ ─────over 20 calls──▶ │  OPEN  │ ───elapses────▶│ HALF-OPEN  │
│        │                       │(reject │ (e.g. 10s)     │(allow K    │
│ calls  │                       │ instant│                │ probe calls│
│ pass   │◀──K probes all succeed│  -ly)  │◀───even 1 probe│ e.g. K=5)  │
│ through│      close again      └────────┘      fails      └────────────┘
└────────┘                                    reopen, reset timer
```

**The knobs that matter:**

╔═══════════════════════╦═══════════════════════════════════════════╦══════════════════════════════════════════════╗
║ Parameter             ║ What it controls                           ║ Staff-level consideration                     ║
╠═══════════════════════╬═══════════════════════════════════════════╬════════════════════════════════════════════════╣
║ Rolling window size   ║ How many recent calls to judge health on   ║ Too small → flaps on noise; too large → slow  ║
║                       ║                                             ║ to detect real outage                         ║
║ Failure threshold     ║ % failures in window that trips breaker    ║ Too low → trips on normal blips; too high →   ║
║                       ║                                             ║ retry storm builds before it trips             ║
║ Open duration         ║ How long to reject calls before probing    ║ Too short → hammers a still-dead dependency;  ║
║                       ║                                             ║ too long → slow recovery once dependency's back║
║ Half-open probe count ║ How many test calls allowed before deciding║ Too few → one flaky probe reopens it forever; ║
║                       ║                                             ║ too many → half-open itself becomes a load     ║
║                       ║                                             ║ spike on a barely-recovered service            ║
╚═══════════════════════╩═══════════════════════════════════════════╩════════════════════════════════════════════════╝

### Where the breaker actually lives (blast-radius implications)

```
1. In-process library (Hystrix / resilience4j)
   ┌─────────────┐
   │  Payment     │  circuit breaker lives INSIDE the app process
   │  ┌────────┐  │  → per-instance state, dies/restarts with the pod
   │  │Breaker │  │  → 100 Payment pods = 100 independent breakers
   │  └────────┘  │     watching the SAME Fraud service
   └─────────────┘

2. Sidecar / service mesh (Envoy, Istio)
   ┌─────────────┐  ┌────────┐
   │  Payment     │──│ Envoy  │  breaker lives in the sidecar proxy
   │  (app code)  │  │(breaker│  → uniform config across the fleet via mesh
   │              │  │  here) │     control plane, but still per-instance state
   └─────────────┘  └────────┘

3. API Gateway / edge
   [Client]──▶[Gateway w/ breaker]──▶[Service]
   → protects the whole system from ONE bad downstream,
     but is a much coarser, single point of judgment
```

**Why this matters at staff level:** with 100 Payment pods each running their own in-process breaker (option 1), here's the subtle failure — Fraud-Detection starts failing for *only* 30% of requests (say, one bad shard). Some Payment pods' rolling windows happen to sample more failures and trip open; others don't. Now you have **inconsistent behavior across the fleet** — some Payment instances are failing fast, others are still hammering the bad shard — which itself can look like a mysterious partial outage to on-call. A sidecar/mesh approach doesn't fully solve this either (state is still per-sidecar), but centralizing config makes tuning consistent, and some meshes support **outlier detection that ejects a specific bad endpoint** rather than tripping the whole dependency — a finer-grained cousin of the circuit breaker.

### Worked dry run with real numbers

Window = 20 calls, threshold = 50%, open duration = 10s, half-open probes = 5.

1. Fraud-Detection's DB connection pool exhausts. Its p99 latency jumps, causing timeouts.
2. Payment instance #12 has made 20 calls to Fraud in its rolling window; 11 timed out (55% failure rate).
3. Breaker trips → **OPEN**. For the next 10 seconds, Payment #12 doesn't even attempt the network call — it fails immediately with a fallback (e.g., "assume manual review needed" or a cached default fraud score), which is a *design decision itself*, not automatic.
4. Meanwhile, 99 other Payment instances are independently doing the same math, tripping open at slightly different times because their rolling windows sampled slightly different calls. This is the "flapping across the fleet" effect — expected, not a bug.
5. At t=10s, Payment #12 moves to **HALF-OPEN**, lets through 5 probe calls.
6. If Fraud's connection pool has recovered → all 5 succeed → breaker closes, normal traffic resumes.
7. If Fraud is still degraded → even 1 of those 5 fails → breaker reopens, timer resets to another 10s.

Note step 3's fallback — **the circuit breaker only decides "stop calling"; it does not decide "what to do instead."** That's a separate design choice (degrade gracefully, serve stale cache, queue for later, or fail the user request), and a staff interviewer will ask what your fallback is, not just "circuit breaker" as a magic word.

### Where it interacts with retries and bulkhead

A circuit breaker alone doesn't save you if retries are naive. Staff-level system design pairs 3 patterns together:

- **Retry with exponential backoff + jitter** — don't hammer a struggling dependency with instant retries (that's what causes the retry storm in the first place).
- **Circuit breaker** — stop calling entirely once it's clearly dead, so retries don't even fire.
- **Bulkhead** — isolate thread pools/connection pools *per dependency*, so a stuck Fraud call can't exhaust the thread pool Payment needs for everything else.

Without bulkheading, even a correctly-tripped-open breaker doesn't help if all your worker threads are already stuck waiting on the *slow* calls that happened right before it tripped — the breaker prevents *new* damage, not damage already in flight.

---

## 3. Network failures

**Plain words:** the machines and code are both fine — the *wire between them* is the problem. This is the hardest category because of one brutal fact: **a node can't tell the difference between "the other node crashed" and "the network between us broke."** Silence looks identical either way.

**Analogy:** you text a friend and get no reply. Did they die? Is their phone off? Is there no signal? Or did the message just get delayed? You cannot know from silence alone — you can only guess and act on a timeout.

### 3 types
1. **Network partition** — nodes split into groups; each group can talk internally but not across the split.
2. **Packet loss** — packets just vanish (congestion, bad hardware).
3. **High latency** — packets arrive so slow the node looks dead even though it's alive.

### ASCII diagram — network partition

```
   Before partition:                After partition:
                                     ┌─────────────┐   ✗   ┌─────────────┐
   [A]───[B]───[C]                  │  [A]───[B]  │  ╱╱   │    [C]      │
    │      │     │                  └─────────────┘       └─────────────┘
   all talk freely                  Group 1 talks fine    Group 2 alone
                                     internally, but NOT
                                     across the split
```

### Worked dry run — the exact scenario the chapter's quiz asks about
1. Cluster splits: Node A on one side, Node B on the other.
2. A stops getting B's heartbeat (periodic "I'm alive" ping).
3. A **cannot tell** if B crashed, or if the network between them just broke.
4. A must now decide: keep accepting writes on its side (risk: A and B's data diverge = inconsistent), or stop accepting writes until it's sure (risk: service becomes unavailable).
5. **This is the CAP theorem trade-off** — during a partition, pick Consistency or Availability, not both.

### Detection tools
- **Heartbeats** — periodic "I'm alive" signal; missing several in a row → suspect failure (but can't be 100% sure).
- **Timeouts** — if no response in X ms, treat the node as unreachable and act (even though it might just be slow).

---

## Software failures vs Network failures — side by side

╔══════════════╦═══════════════════════════════════════════╦══════════════════════════════════════════════╗
║ Characteristic ║ Software Failures                        ║ Network Failures                              ║
╠══════════════╬═══════════════════════════════════════════╬════════════════════════════════════════════════╣
║ Nature          ║ Deterministic (bugs) or resource-based   ║ Unpredictable, transient                      ║
║ Observability   ║ Visible via logs/metrics/traces          ║ Hard to tell apart from node death — only      ║
║                 ║                                           ║ inferred via timeouts/heartbeats               ║
║ System Impact   ║ Wrong data, crashes, cascading failures  ║ Partitions, consensus trouble, lower availability ║
║ Example         ║ Null pointer exception crashes a server  ║ Faulty switch isolates half the cluster        ║
╚══════════════╩═══════════════════════════════════════════╩════════════════════════════════════════════════╝

---

## Mental model — all 3 failure types at a glance

╔════════════╦══════════════════════╦═══════════════════════════╦═══════════════════════════════╗
║ Category   ║ What breaks          ║ How you know               ║ Main defense                  ║
╠════════════╬══════════════════════╬═══════════════════════════╬═══════════════════════════════╣
║ Hardware   ║ Physical component   ║ Clear signal (disk error,  ║ Replication, redundancy,      ║
║            ║ (disk/RAM/power/NIC) ║ power loss)                ║ failover                       ║
║ Software   ║ The code itself      ║ Logs/metrics/traces,       ║ Circuit breakers, observability║
║            ║ (bug/crash/leak)     ║ sometimes silent           ║                                ║
║ Network    ║ The wire between     ║ Ambiguous — timeout/       ║ Heartbeats, timeouts, accept   ║
║            ║ nodes                ║ heartbeat miss only        ║ CAP trade-off explicitly       ║
╚════════════╩══════════════════════╩═══════════════════════════╩═══════════════════════════════╝

---

## The one sentence to remember

**In a distributed system, failure isn't the exception — it's the constant background noise, and every good design assumes something is broken right now and routes around it instead of hoping nothing breaks.**

**Circuit breaker corollary:** a circuit breaker is a per-instance, per-dependency local judgment call — "stop calling, this thing is clearly failing" — and its real staff-level value isn't the state machine itself, it's pairing it with backoff and bulkheading so a decision made locally with zero coordination still protects the whole fleet from a cascading failure.

**Where it's used in practice:** this is the mental foundation under every HLD deep dive — every "single point of failure?" / "network partition?" / "10x traffic?" question in Phase 6 of the coach flow is really just asking "which of these 3 failure types did you plan for, and how." A strong Phase 6 answer on cascading failures names circuit breaker + backoff + bulkhead together with actual thresholds, not just the pattern name — naming it alone is the Senior answer, the trio + fallback design is the Staff answer. This chapter is also the direct setup for CAP vs. PACELC, since the network-partition trade-off (consistency vs. availability) walked through above is exactly what that chapter formalizes.
