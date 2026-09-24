# G5 · Distributed Systems

---

## § CAP THEOREM

**In a network partition you must choose:**
- **CP** (Consistency + Partition tolerance): return error rather than stale data (HBase, ZooKeeper)
- **AP** (Availability + Partition tolerance): return potentially stale data (Cassandra, DynamoDB)

**CA doesn't exist** in a distributed system — partitions happen.
**Staff framing:** don't just state CAP — explain *which operations* need which guarantee in your system.

---

## § PACELC THEOREM

**Extends CAP to also cover normal operation (no partition):**
`if Partition → choose A or C (CAP's rule), Else → choose L(atency) or C(onsistency)`

**Notation `PA/EL` or `PC/EC`** = left of slash is the partition-time choice, right is the else(normal)-time choice.

╔═════════╦══════════════════════╦═════════════════════╦══════════════════════════╗
║ Label   ║ During partition     ║ During normal times  ║ Example                  ║
╠═════════╬══════════════════════╬═════════════════════╬══════════════════════════╣
║ PA/EL   ║ Availability          ║ Latency (fast)       ║ DynamoDB, Cassandra      ║
║ PC/EC   ║ Consistency           ║ Consistency          ║ Google Spanner, HBase    ║
║ PC/EL   ║ Consistency           ║ Latency              ║ MongoDB (tunable)        ║
╚═════════╩══════════════════════╩═════════════════════╩══════════════════════════╝

**Why it exists:** CAP is silent on the common case (network healthy). PACELC's "Else" branch captures that even with no partition, sync-replicate-before-ack (safe, slower) vs ack-then-replicate-async (fast, briefly stale) is a real, constant trade-off.

**Interview cue:** don't just say "it's AP" — state the full PACELC label (e.g. "PA/EL") and justify *both* halves: why availability wins during a partition, and why latency wins day-to-day.

---

## § QUORUM (N/W/R)

**Leaderless replication (Dynamo-style: DynamoDB, Cassandra).** No permanent master — whichever node gets the client request becomes the **coordinator** for that one request, fans the write out to all replicas, and only waits for a threshold to ack.

╔═══════╦════════════════════════════════════════════════════════════╗
║ Symbol║ Meaning                                                    ║
╠═══════╬════════════════════════════════════════════════════════════╣
║ N     ║ total replica nodes holding this key                      ║
║ W     ║ write quorum — # replicas that must ack before "success"  ║
║ R     ║ read quorum — # replicas that must respond before return  ║
╚═══════╩════════════════════════════════════════════════════════════╝

**Flow:** coordinator sends write to all N replicas in parallel → returns success to client after first W acks → remaining (N−W) replicas catch up async via **hinted handoff** (coordinator stores a hint, replays once the down node is back) or **read repair** (a later read notices stale replica, patches it).

**Correctness rule: `W + R > N`** → every write quorum and every read quorum are guaranteed to overlap on ≥1 node → that node has the latest value → read is never stale. If `W + R ≤ N`, overlap isn't guaranteed → pure eventual consistency (faster, weaker).

╔════════════╦════════════╦════════════╦══════════════════════════════════════╗
║ Config (N=5)║ Write cost ║ Read cost  ║ What you get                          ║
╠════════════╬════════════╬════════════╬══════════════════════════════════════╣
║ W=1, R=1   ║ fastest    ║ fastest    ║ PA/EL extreme — reads may be stale    ║
║ W=3, R=3   ║ moderate   ║ moderate   ║ majority quorum — balanced            ║
║ W=5, R=1   ║ slowest    ║ fastest    ║ writes always safe, reads instant     ║
║ W=1, R=5   ║ fastest    ║ slowest    ║ writes instant, reads always fresh    ║
╚════════════╩════════════╩════════════╩══════════════════════════════════════╝

**Quorum ≠ majority** — majority (e.g. 3-of-5) is just the common choice because it cleanly satisfies W+R>N with the smallest W and R together; you can pick a smaller, weaker W if you want.

**Interview cue:** "how does Dynamo/Cassandra give tunable consistency?" → per-request N/W/R knobs + the W+R>N overlap guarantee, not "majority vote."

---

## § CONSISTENCY MODELS

╔════════════════════════╦══════════════════════════════════════════════════════════════╗
║ Model                  ║ What it guarantees                                           ║
╠════════════════════════╬══════════════════════════════════════════════════════════════╣
║ Linearizability        ║ Reads always see latest write; single global order           ║
║ Sequential consistency ║ All nodes see same order, not necessarily real-time          ║
║ Causal consistency     ║ Causally related ops seen in order; concurrent ops can differ ║
║ Eventual consistency   ║ All replicas converge eventually; no timing guarantee        ║
║ Read-your-writes       ║ After a write, same client always reads that write           ║
╚════════════════════════╩══════════════════════════════════════════════════════════════╝

**Default to eventual consistency** unless you can justify the cost of stronger models.

---

## § EVENT ORDERING MODELS (DEEP DIVE)

**Relation to consistency:** ordering = policy for *events*; consistency = promise to *readers*. Total ordering → strong consistency. Causal ordering → causal consistency. No ordering → eventual consistency.

**happens-before (`A → B`):** A,B same node & A first; OR A=send, B=receive of same msg; OR chains transitively. Neither `A→B` nor `B→A` → **concurrent**. Lamport/vector clocks (§ CLOCKS) are the *detection* mechanism; ordering models are the *policy* built on top.

╔═══════════════════╦════════════════════════╦═════════════════════════════╦════════════════════════╗
║ Model             ║ What's ordered         ║ Coordination cost           ║ Concurrent events       ║
╠═══════════════════╬════════════════════════╬═════════════════════════════╬════════════════════════╣
║ Total ordering    ║ ALL pairs of events    ║ High (consensus / leader)   ║ Still forced into order ║
║ Partial ordering  ║ Only causal pairs      ║ Low                         ║ Any order per node      ║
║ Causal ordering   ║ Only causal pairs,     ║ Medium (track + buffer via  ║ Any order per node      ║
║                   ║ enforced on delivery   ║ vector clocks)              ║                        ║
╚═══════════════════╩════════════════════════╩═════════════════════════════╩════════════════════════╝

**Total ordering:** every node replays one single global sequence, even for unrelated ops — as if all writes funnel through one queue. Example: distributed counter with `+1` and `×2` — every replica must apply them in the *same* order or diverge (2 vs 1). Needs consensus/atomic broadcast → high latency, low availability. Used in: Raft/Paxos replicated logs, Kafka partition offsets, Spanner.

**Partial ordering:** only enforce causal pairs (`writeH → writeI`), concurrent ops (`goBold` vs `writeH`) applied in any order per replica, still converge. Used in: CRDTs, collaborative editors, git (commit parents = happens-before, branches = concurrent).

**Causal ordering:** delivery is *held back* until causal predecessors are applied — prevents the classic "reply visible before the post it replies to" bug. Node receiving Bob's reply checks its attached vector clock, sees it depends on Alice's post it hasn't applied yet → buffers reply, pulls the post, then releases both in order. Used in: COPS, causal-consistent Mongo/Cosmos sessions, chat/social feeds.

**Interview cue:** "does every read need to agree on order, or just the caused-by chain?" → if just causal chain, causal ordering gets you most of strong consistency's guarantees at a fraction of the coordination cost.

---

## § SESSION / CLIENT-CENTRIC GUARANTEES

Bolted onto a weaker (usually eventual) store so one client isn't confused, without paying for cluster-wide strong consistency.

╔═══════════════════════╦══════════════════════════════════════════════════════════╗
║ Guarantee             ║ Promise to one client                                    ║
╠═══════════════════════╬══════════════════════════════════════════════════════════╣
║ Read-your-writes      ║ After you write X, your own later reads see X or newer   ║
║ Monotonic reads       ║ Once you've seen a value, you never see an older one     ║
║ Monotonic writes      ║ Your writes are applied in the order you issued them     ║
║ Writes-follow-reads   ║ If you read X then write Y, everyone sees X before Y     ║
╚═══════════════════════╩══════════════════════════════════════════════════════════╝

**How implemented:** pin the client's session to one replica, or attach the client's last-seen version/vector clock to each request and route/wait accordingly.
**Interview cue:** "user posts a comment then refreshes and it's gone" → missing read-your-writes → sticky sessions or version-cookie routing.

---

## § CONSENSUS

**Why needed:** distributed nodes must agree on leader, config, or a value
**Raft:** leader election + log replication; easier to understand than Paxos
**Flow:** candidate → election → leader → log entries replicated → committed when majority acks
**Used in:** etcd, ZooKeeper, CockroachDB, Kafka (KRaft mode)
**Watch out for:** split-brain (two leaders) → prevented by requiring majority quorum

---

## § FENCING TOKENS

**Problem:** a new leader gets elected via quorum, but the *old* leader (GC pause, slow network) may still believe it's in charge and try to write once the network blips back — election alone doesn't stop this.

**Fix:** every lock/leader grant carries a monotonically increasing token. The **resource being written to** (not the client) rejects any write whose token is ≤ the highest token it has already seen.

```java
synchronized boolean write(long token, String value) {
    if (token <= highestTokenSeen) return false;   // REJECTED — stale leader
    highestTokenSeen = token;
    apply(value);                                  // ACCEPTED
    return true;
}
```

**Dry run:** Client A gets token=1, stalls (GC pause). Lock expires. Client B gets token=2, writes → accepted, `highestTokenSeen=2`. Client A wakes, writes with token=1 → rejected (1 ≤ 2).

**Key rule:** the check must live at the storage/resource layer, not the client — a client checking its own "am I still leader?" is exactly as stale as the lock that already expired on it.

**Interview cue:** "we'll just elect a new leader" → "what stops the old leader from still writing?" → fencing tokens enforced at the resource, not the client.
**Used in:** ZooKeeper/etcd lock recipes (the `zxid`/revision number IS the fencing token), Chubby, S3/GCS conditional writes (`If-Match` ETag acting as a fencing token).

---

## § COORDINATION PRIMITIVES (ZOOKEEPER / ETCD)

**4 primitives, every coordination tool = these assembled:**

╔════════════════════╦══════════════════════════════════════════╗
║ Primitive          ║ Solves                                   ║
╠════════════════════╬══════════════════════════════════════════╣
║ Leader election    ║ who's in charge (Bully, Ring algos)      ║
║ Distributed locks  ║ who touches the resource right now       ║
║ Consensus          ║ agreeing on one value, permanently       ║
║ Service discovery  ║ finding who's currently alive + address  ║
╚════════════════════╩══════════════════════════════════════════╝

**ZooKeeper vs etcd:**

╔═══════════════════╦═══════════════════════════════╦══════════════════════════╗
║ Feature           ║ ZooKeeper                     ║ etcd                     ║
╠═══════════════════╬═══════════════════════════════╬══════════════════════════╣
║ Consensus         ║ ZAB                            ║ Raft                     ║
║ Data model        ║ hierarchical (znodes, file-tree)║ flat key-value          ║
║ Primary use       ║ Hadoop ecosystem (HBase, Kafka)║ Kubernetes, cloud-native ║
║ Fault tolerance   ║ needs quorum                  ║ needs quorum             ║
╚═══════════════════╩═══════════════════════════════╩══════════════════════════╝

**In practice:** leader election/locks = race to create the same **ephemeral key**. Winner = leader/lock holder. Key tied to the client's session → dies with it → auto-released, someone else grabs it. This is how a distributed lock gives **exactly-once** job execution across redundant schedulers (N schedulers race for the lock, 1 wins, runs job, others no-op).

**Why reliable in prod:** runs as its own quorum-backed cluster (kept *separate* from the app — else an app outage could drag down the coordination system needed for recovery).

**Watch mechanism (config broadcast):** client opens a long-lived stream on a key/prefix → no polling. Every write gets a global **revision number** (MVCC). On PUT/DELETE, etcd pushes `{type, key, value, rev}` down every matching open stream instantly. A *new* key added = same PUT event type, just on a previously-absent key — watch the **prefix**, not one exact key, to catch additions.

**Leader dies mid-broadcast:**
- Write not yet at quorum when leader dies → discarded, never broadcast, client retries (nothing lost because nothing was ever "official").
- Write already committed (quorum acked) → durable on survivors regardless of leader death. Remaining majority runs Raft election (~100ms–1s) → new leader already has it. Broken watch streams auto-reconnect (client lib) to a survivor and resume **from last-seen revision** → replayed, zero lost updates.

**Interview cue:** "how does Kubernetes roll out a ConfigMap change to every kubelet without polling?" → etcd watch on the resource prefix, revision-based resume on reconnect, committed writes survive leader failure because they're already on a Raft quorum.

---

## § DISTRIBUTED TRANSACTIONS

╔═══════════════════════╦══════════════════════════════════════════════════════════════════╗
║ Pattern               ║ How + trade-off                                                  ║
╠═══════════════════════╬══════════════════════════════════════════════════════════════════╣
║ 2PC (Two-Phase Commit)║ Coordinator asks all to prepare, then commit — blocking if coord dies ║
║ Saga                  ║ Chain of local transactions with compensating rollbacks — eventual ║
║ Outbox pattern        ║ Write event to same DB as state change — relay picks it up async ║
╚═══════════════════════╩══════════════════════════════════════════════════════════════════╝

**Prefer Saga + Outbox** over 2PC for microservices — 2PC creates tight coupling and blocking risk.

---

## § CLOCKS

**Wall clock:** time of day; can go backward (NTP sync) → never use for ordering events
**Monotonic clock:** always increases; safe for measuring durations; not comparable across machines
**Lamport timestamp:** logical clock; increments on each event and communication → establishes causal order
**Vector clock:** one counter per node → detects concurrent vs causally related events
**Hybrid Logical Clock (HLC):** combines wall clock + logical — used in CockroachDB

---

## § VECTOR CLOCKS (DEEP DIVE)

**What it is:** per-object dictionary `{node: writes_that_node_coordinated}`. Missing key = 0.
Travels attached to every version of the object.

**Write rule:** coordinator node `S` accepting a write does
`new_vc = elementwise_max(all versions the client saw)` then `new_vc[S] += 1`
→ the `max` inherits history (makes new version supersede what it saw); the `+1` records "S did one new write". **Two ops, two jobs.** Only the coordinator's own slot is bumped, once. Reads never increment.

**Compare two vectors A, B:**

╔══════════════════════════════════════╦═══════════════════════════════════════╗
║ Condition                            ║ Conclusion                            ║
╠══════════════════════════════════════╬═══════════════════════════════════════╣
║ A ≤ B in every slot, A ≠ B           ║ B descends from A → keep B, drop A    ║
║ B ≤ A in every slot, A ≠ B           ║ A descends from B → keep A, drop B    ║
║ A bigger in one slot, B in another   ║ CONCURRENT → conflict, keep BOTH      ║
╚══════════════════════════════════════╩═══════════════════════════════════════╝

**Dry run — replicated shopping cart, servers Sx/Sy/Sz:**
```
D1 {milk}              {Sx:1}            Sx coordinates "add milk"
D2 {milk,eggs}         {Sx:1,Sy:1}       Sy coordinates "add eggs"; D2 ≥ D1 → clean
D3 {milk,bread}        {Sx:1,Sz:1}       Sz coordinates "add bread" during partition,
                                         only knew D1
compare D2 {Sx:1,Sy:1,Sz:0} vs D3 {Sx:1,Sy:0,Sz:1}
  → D2 ahead in Sy, D3 ahead in Sz → CONCURRENT → store both as siblings
read → client gets [{milk,eggs},{milk,bread}] + context {Sx:1,Sy:1,Sz:1}
client merges CONTENTS by its own rule (cart = union) → {milk,eggs,bread}
write-back lands on Sx: new_vc = max = {Sx:1,Sy:1,Sz:1}, then Sx+1
D4 {milk,eggs,bread}   {Sx:2,Sy:1,Sz:1}
  Sx=2: Sx coordinated D1 and D4 (two writes)
  Sy=1, Sz=1: inherited via max; neither coordinated D4
  D4 ≥ D2 and D4 ≥ D3 in every slot → both siblings now safely dropped → converged
```

**Key point:** the DB only *detects* conflicts and hands back siblings. **Merging the values is the application's job** (union for carts, LWW for some fields, CRDT merge, or prompt the user). Vector clock merge (max + self-increment) is separate and automatic.

**Used in:** Dynamo, Riak, Voldemort (return siblings); Automerge/Yjs CRDTs; anti-entropy repair.
**Cost:** O(nodes) size per object → prune stale entries, or use dotted version vectors.
**Interview cue:** any leaderless / multi-master design → "how do you detect two clients wrote the same key concurrently?" → version vectors + sibling reconciliation.

---

## § GLOBAL STATE / SNAPSHOTS

**Goal:** one coherent photo of the whole system = every node's local state + every message in flight on the channels. Used for checkpoint/restart, deadlock & distributed-GC detection, invariant auditing (e.g. "total money constant").

**Why hard:** no synced clock → can't tell all nodes "freeze now". Each node records at a slightly different instant; glued together carelessly → a global state that never existed (message received but never sent).

**Cut:** pick one moment per process = its local snapshot instant. Event is INSIDE the snapshot if it happened at/before that process's moment.

╔══════════════════════╦════════════════════════════════════════════════════════╗
║ Message vs the cut   ║ Meaning                                                ║
╠══════════════════════╬════════════════════════════════════════════════════════╣
║ send IN,  recv IN    ║ fully captured — fine                                  ║
║ send OUT, recv OUT   ║ entirely in the future — fine                          ║
║ send IN,  recv OUT   ║ IN-FLIGHT → record as channel state — fine             ║
║ send OUT, recv IN    ║ received but never sent → IMPOSSIBLE → cut inconsistent ║
╚══════════════════════╩════════════════════════════════════════════════════════╝

**Consistent cut rule (one line):** every message whose RECEIVE is in the snapshot must have its SEND in the snapshot too. (Staircase intuition: message arrows only go downstairs; a consistent cut has no arrow poking back upstairs into it.)

**Bank check ($100 total, A sends $20 to B):**
```
m1 fully inside      → A=$80  B=$20  chan=$0    total $100 ✓
m1 in-flight         → A=$80  B=$0   chan=$20   total $100 ✓  (only balances if channel captured)
m1 recv-in/send-out  → A=$100 B=$20             total $120 ✗  (inconsistent — $20 from nowhere)
```

**Chandy–Lamport algorithm** (assumes FIFO channels, no loss):
1. Initiator: record own state → send MARKER on every outgoing channel → start recording all incoming channels.
2. Node on **first** MARKER: record own state → that channel's state = ∅ → send MARKER on all its outgoing channels → start recording its other incoming channels.
3. Node on a **later** MARKER (channel already recording): stop recording it → channel state = data msgs that arrived between "recorded my state" and "this marker" (= the in-flight set).
4. Ends when every node got a MARKER on every incoming channel. Snapshot = ⋃ local states + ⋃ channel states.

Marker = dye pulse flushed through every pipe: cleanly splits before/after; system never stops running. Result may match no real wall-clock instant but is always a state the system **could** have passed through.

**Used in:** Flink checkpointing (markers = "barriers", async barrier snapshotting → exactly-once); Spark Structured Streaming / Kafka Streams checkpoints; distributed deadlock detection, distributed GC.
**Interview cue:** "how do you checkpoint / get a consistent global view without stopping the system?" → Chandy–Lamport marker sweep + capture in-flight messages as channel state.

---

## § RESILIENCE PATTERNS

╔════════════════════╦══════════════════════════════════════════════════════════════════╗
║ Pattern            ║ What it does                                                     ║
╠════════════════════╬══════════════════════════════════════════════════════════════════╣
║ Circuit breaker    ║ Open circuit after N failures → fail fast → half-open to retry   ║
║ Retry + backoff    ║ Retry with exponential backoff + jitter to avoid thundering herd  ║
║ Timeout            ║ Bound how long to wait — prevents cascade hang                   ║
║ Bulkhead           ║ Isolate failure domains — one slow service can't exhaust all threads ║
║ Fallback           ║ Serve degraded response when dependency fails (stale cache, default) ║
╚════════════════════╩══════════════════════════════════════════════════════════════════╝

### Jitter Types (for retry + backoff)

Base wait time grows each retry (exponential backoff). Jitter changes that wait a bit, so many clients don't retry at the exact same moment.

╔══════════════════════╦══════════════════════════════════════════╦═══════════════════════════════════════════╗
║ Type                 ║ Formula                                   ║ Example (base=1s, attempt=3 → base=4s)    ║
╠══════════════════════╬════════════════════════════════════════════╬═══════════════════════════════════════════╣
║ Fixed jitter         ║ wait = base + constant                    ║ 4s + 0.2s = 4.2s, every time, same add-on ║
║ Full jitter          ║ wait = random(0, base)                    ║ random(0, 4s) → could be 0.1s or 3.9s     ║
║ Equal jitter         ║ wait = base/2 + random(0, base/2)         ║ 2s + random(0, 2s) → 2.0s to 4.0s         ║
║ Decorrelated jitter  ║ wait = random(base_floor, prev_wait × 3)  ║ prev=4s → random(1s, 12s)                 ║
╚══════════════════════╩════════════════════════════════════════════╩═══════════════════════════════════════════╝

**Fixed jitter** — every retry gets the same small add-on, no randomness. Weakest option: if 1,000 clients fail at the same second, they still retry within the same narrow window (base + constant), just shifted slightly. Rarely used alone in production; mentioned here mainly as the baseline to contrast against.

**Interview cue:** "how do you stop retries from syncing up (thundering herd)?" → name full jitter or decorrelated jitter as the strong answer (AWS's own backoff research recommends these); fixed jitter barely helps because the spread is too narrow.
