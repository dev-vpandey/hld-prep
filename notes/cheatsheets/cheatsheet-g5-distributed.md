# G5 · Distributed Systems

---

## § CAP THEOREM

**In a network partition you must choose:**
- **CP** (Consistency + Partition tolerance): return error rather than stale data (HBase, ZooKeeper)
- **AP** (Availability + Partition tolerance): return potentially stale data (Cassandra, DynamoDB)

**CA doesn't exist** in a distributed system — partitions happen.
**Staff framing:** don't just state CAP — explain *which operations* need which guarantee in your system.

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

## § CONSENSUS

**Why needed:** distributed nodes must agree on leader, config, or a value
**Raft:** leader election + log replication; easier to understand than Paxos
**Flow:** candidate → election → leader → log entries replicated → committed when majority acks
**Used in:** etcd, ZooKeeper, CockroachDB, Kafka (KRaft mode)
**Watch out for:** split-brain (two leaders) → prevented by requiring majority quorum

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
