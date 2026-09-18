# CAP, PACELC & Quorum — Explain Mode Deep Dive
Saved: 2026-09-11
Source: Explain Mode session (Grokking Fundamentals course lesson + follow-up deep dives)
Related cheatsheet: @notes/cheatsheets/cheatsheet-g5-distributed.md § CAP THEOREM, § PACELC THEOREM, § QUORUM (N/W/R)

---

## 1. CAP vs PACELC — Explained Simple

### Plain words first

When you spread data across many machines, sometimes those machines can't talk to each other (network breaks). When that happens, each machine has 2 choices: answer with maybe-old data (stay available), or refuse to answer until it's sure it has the newest data (stay correct). Can't do both at once. That's **CAP**.

But networks break rarely. Most of the time everything's connected fine — yet system *still* has to choose: answer fast with maybe-slightly-old data, or wait a bit to make sure data is 100% fresh. That's the **PACELC** extra part — it covers the "everything's fine" case too, which CAP stays silent on.

So: CAP = only talks about crisis mode. PACELC = talks about crisis mode AND everyday mode.

### Analogy

You're coordinating a surprise party with friends over text vs phone calls:

- **Group text** = fast, but you're not 100% sure everyone saw it in the same moment (low latency, weaker consistency).
- **Calling each person one by one** = slow, but you know for certain everyone got the message (high latency, strong consistency).

That tension exists **even when nobody's phone is broken** — that's the PACELC "normal operation" trade-off. If someone's phone dies mid-plan (network partition), now you face the *harder* CAP choice: proceed without them (availability) or pause everything until they're reachable (consistency).

### Worked example (dry run)

Two nodes, A and B, both hold `x = 10`. Network between them breaks (partition).

```
Step 1: Client writes x = 15 to Node A.       ✅ A now has x=15
Step 2: Client reads x from Node B.           B still has x=10 (can't reach A)

Node B's choice:
  Option 1 (favor Availability): reply "x=10"   → answered, but WRONG/stale
  Option 2 (favor Consistency):  refuse/error    → correct, but unavailable
```

No third option exists during the break. That's the proof of CAP in one dry run.

Now, no partition, everything connected — PACELC's "Else" branch kicks in:

```
Step 1: Client writes x = 15 to Node A.
Step 2: Node A can reply "done" immediately (fast, but B not updated yet)
     OR wait for B to confirm it got x=15 too (slower, but both consistent)
```

### Picture

```
                NORMAL OPERATION                    DURING PARTITION
                (PACELC "Else" branch)                 (CAP branch)

  Client                                       Client
    │  write x=15                                │  write x=15
    ▼                                             ▼
 ┌─────┐   sync? async?      ┌─────┐          ┌─────┐   ✂ network broken
 │  A  │ ───────────────────▶│  B  │          │  A  │        │
 └─────┘   (Latency vs        └─────┘          └─────┘        ✂
            Consistency)                          x=15      ┌─────┐
                                                              │  B  │ ← read x?
                                                              └─────┘  x=10 (stale)
                                                                        or refuse
```

### Comparison table

╔═══════════════════════╦══════════════════════════════╦══════════════════════════════════╗
║ Aspect                ║ CAP Theorem                   ║ PACELC Theorem                    ║
╠═══════════════════════╬══════════════════════════════╬══════════════════════════════════╣
║ Covers                ║ Only behavior during a        ║ Behavior during partition AND     ║
║                       ║ network partition             ║ normal operation                  ║
║ Trade-off during      ║ Consistency vs Availability   ║ Consistency vs Availability       ║
║ partition             ║                                ║                                    ║
║ Trade-off when         ║ (says nothing)                 ║ Latency vs Consistency             ║
║ no partition          ║                                ║                                    ║
║ Real system examples  ║ —                              ║ DynamoDB = PA/EL, Spanner = PC/EC ║
╚═══════════════════════╩══════════════════════════════╩══════════════════════════════════╝

### Common myths (quick debunk)

- ❌ "Pick 2 of 3 (C, A, P)" — wrong, P (partition tolerance) isn't optional in a distributed system; real choice is only C vs A, and only *during* a partition.
- ❌ "It's one static choice for whole system" — wrong, can differ per-operation (password write = strong consistency, profile bio read = availability-first).
- ❌ "It's binary" — wrong, there's a whole spectrum between strong and eventual consistency.

### The one sentence to remember

**CAP tells you what to sacrifice when the network breaks; PACELC also tells you what you're sacrificing even when it doesn't.**

Where used in practice: every distributed DB design decision — DynamoDB/Cassandra lean AP+EL (availability & speed), Spanner/HBase lean CP+EC (correctness first) — interviewers expect the PACELC classification (e.g. "PA/EL") when justifying a DB choice in deep dives, not just "it's CAP-compliant."

---

## 2. PACELC Full Form — Letter by Letter

### Expand the acronym

```
P  A  C  E  L  C
```
= **"if P, then A-or-C, Else E, then L-or-C"** — that literally *is* the theorem, spelled out as letters.

╔═══════╦═══════════════════╦════════════════════════════════════════════════╗
║ Letter║ Stands for        ║ Meaning                                        ║
╠═══════╬═══════════════════╬════════════════════════════════════════════════╣
║ P     ║ Partition         ║ IF a network partition happens...              ║
║ A     ║ Availability      ║ ...system picks Availability (answer fast,    ║
║       ║                   ║ maybe stale)...                                ║
║ C     ║ Consistency        ║ ...OR system picks Consistency (correct,       ║
║       ║                   ║ maybe refuse to answer)                        ║
║ E     ║ Else               ║ ELSE (no partition, network is fine)...       ║
║ L     ║ Latency            ║ ...system picks Latency (answer fast, maybe   ║
║       ║                   ║ slightly stale)...                             ║
║ C     ║ Consistency        ║ ...OR system picks Consistency (wait, make    ║
║       ║ (again)           ║ sure it's fresh, slower)                       ║
╚═══════╩═══════════════════╩════════════════════════════════════════════════╝

Two mini-decisions chained together:
```
Decision 1 (only if network broken):   A  vs  C
Decision 2 (always, normal times):     L  vs  C
```

### What "PA/EL" or "PC/EC" notation means

```
   PA / EL
   │    │
   │    └─ during normal (Else) times → picks Latency
   └────── during a Partition → picks Availability

   PC / EC
   │    │
   │    └─ during normal (Else) times → picks Consistency
   └────── during a Partition → picks Consistency
```
Read left-to-right as: "**P**artition behavior slash **E**lse behavior."

╔═════════╦══════════════════════╦══════════════════════════╦═════════════════════════════════╗
║ Label   ║ During partition     ║ During normal times       ║ Example DB                       ║
╠═════════╬══════════════════════╬══════════════════════════╬═════════════════════════════════╣
║ PA/EL   ║ Availability          ║ Latency (fast)            ║ DynamoDB, Cassandra              ║
║ PC/EC   ║ Consistency           ║ Consistency (correctness)║ Google Spanner, HBase            ║
║ PA/EC   ║ Availability          ║ Consistency               ║ rare/uncommon combo              ║
║ PC/EL   ║ Consistency           ║ Latency                   ║ MongoDB (tunable, roughly here) ║
╚═════════╩══════════════════════╩══════════════════════════╩═════════════════════════════════╝

### Analogy for the whole word

```
                 ┌─────────────────────────┐
                 │ Is network partitioned? │
                 └────────────┬────────────┘
                     yes ◀────┴────▶ no
                      │                │
              ┌───────▼──────┐  ┌──────▼────────┐
              │ favor A or C? │  │ favor L or C?  │
              │ (CAP's rule)  │  │ (PACELC's      │
              │               │  │  extra rule)   │
              └───────────────┘  └────────────────┘
```
CAP only asks the left branch's question. PACELC asks both.

### DynamoDB & Cassandra — why they're PA/EL

**Setup:** distributed key-value / wide-column stores, replicated across nodes/regions, no permanent master (classic Dynamo-style design).

**Why "PA" (Partition → Availability):** 3 replicas Node1/2/3, partition isolates Node1.
```
Client writes "add item" → hits Node1 (isolated side)
Node1: "I can't reach Node2/Node3 right now, but I'll still
        accept this write and answer you. I'll sync up later."
```
Node1 stays **available** rather than refusing. Deliberate design from the original Dynamo paper — "add to cart" should never fail, since a failed cart = lost sale. Business priority drove the technical choice.

**Why "EL" (Else → Latency):** even with a healthy network, writes aren't held for every replica to confirm. Async replication:
```
Client write → Node1 ──ack fast──▶ Client sees "success" (low latency)
                  │
                  └───(background, async)───▶ Node2, Node3 catch up shortly after
```
Trade-off: brief window where Node2/Node3 are stale → **eventual consistency**. Chose speed over waiting for full replica confirmation, especially important across cross-region replicas.

**Contrast — Spanner (PC/EC):** atomic clocks + 2PC/Paxos majority confirmation on every transaction, both during partitions and normal times → correctness over speed, fits global financial ledgers.

### The one sentence to remember

**PACELC = "if Partition → Availability-or-Consistency, Else → Latency-or-Consistency" — and DynamoDB/Cassandra are PA/EL because they'd rather answer fast with slightly-stale data than ever say "no" or make you wait.**

---

## 3. Quorum Deep Dive (N/W/R)

### Correction on mental model

Dynamo-style systems (DynamoDB, Cassandra) are **leaderless / masterless** — no permanent master node. Whichever node receives the client request becomes the **coordinator** for that one request only, forwards the write to all replicas, and waits for a threshold of acks — not "N replicas report to 1 master."

### The three numbers: N, W, R

╔═══════╦════════════════════════════════════════════════════════════════╗
║ Symbol║ Meaning                                                        ║
╠═══════╬════════════════════════════════════════════════════════════════╣
║ N     ║ Total number of replica nodes that hold a copy of this data   ║
║ W     ║ Write quorum — # replicas that must ack BEFORE coordinator    ║
║       ║ tells client "write successful"                               ║
║ R     ║ Read quorum — # replicas that must respond BEFORE coordinator║
║       ║ returns a value to client on a read                           ║
╚═══════╩════════════════════════════════════════════════════════════════╝

Configured **per keyspace/table**, not system-wide.

### Worked example — N=5, W=3

```
Client → sends WRITE(x=15) to Coordinator (whichever node client hit,
          or hashed to — not a fixed master)

Coordinator → forwards write to ALL 5 replica nodes in parallel:

     Node1  Node2  Node3  Node4  Node5
       │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼
     write  write  write  write  write

Coordinator does NOT wait for all 5 — waits for FIRST 3 acks (W=3):

     Node1 ✅ ack (fast, was coordinator)
     Node3 ✅ ack
     Node4 ✅ ack           ← 3 acks reached → quorum met
     ─────────────────────────────────────────────
     Coordinator → tells client "write SUCCESS" ✅

     Node2, Node5 → still writing / acking, arrive a moment later
     (this is the "eventually trickles down" part — correct instinct,
      just not from a "master")
```

### Why quorum, not "wait for all N"?

- W=5 (wait for all): one slow/dead node blocks every write — bad for availability.
- W=1 (wait for just one): max speed, weak durability — only 1 copy might have it if that node dies right after.
- W=3 of 5 (quorum): survives some node failures, doesn't need every node up, fast because coordinator only waits for the majority, not laggards.

### The correctness rule: W + R > N

This is what makes reads see the latest write **without needing full strong-consistency waits**.

```
Rule: if W + R > N, every read quorum and every write quorum
      OVERLAP on at least 1 node → that overlapping node has the latest value.

N=5, W=3, R=2   →  W+R = 5  >  N=5  ✅ (satisfies rule, barely)
N=5, W=3, R=3   →  W+R = 6  >  N=5  ✅ (stronger overlap, safer)
```

```
  5 nodes total:  [1] [2] [3] [4] [5]

  Write touched (W=3):     [1] [2] [3]
  Read touches (R=2):                [3] [4]
                                       ▲
                              overlap node — has latest write,
                              read is guaranteed to see it
```

If W=2, R=2 (W+R=4, NOT > N=5) → possible write hits {1,2}, read hits {4,5} → **zero overlap** → read could return stale data. That's plain eventual consistency (faster, weaker) rather than quorum consistency.

### Common configs

╔═══════════════╦════════════╦════════════╦══════════════════════════════════════╗
║ Config (N=5)   ║ Write cost ║ Read cost  ║ What you get                          ║
╠═══════════════╬════════════╬════════════╬══════════════════════════════════════╣
║ W=1, R=1       ║ fastest    ║ fastest    ║ PA/EL extreme — reads may be stale    ║
║ W=3, R=3       ║ moderate   ║ moderate   ║ "quorum consistency" — balanced       ║
║ (majority)    ║            ║            ║                                        ║
║ W=5, R=1       ║ slowest    ║ fastest    ║ writes always safe, reads super fast  ║
║ W=1, R=5       ║ fastest    ║ slowest    ║ writes fast, reads always fresh       ║
╚═══════════════╩════════════╩════════════╩══════════════════════════════════════╝

Cassandra: tunable per query (`ONE`, `QUORUM`, `ALL`, `LOCAL_QUORUM`...). DynamoDB: simpler knob — "eventually consistent read" (cheap, fast, R≈1) vs "strongly consistent read" (waits for latest, R≈majority).

### Catch-up mechanism for unacked nodes

Unacked nodes (N−W) catch up later via:
- **Hinted handoff** — coordinator stores a "hint" for a down node, replays the write once it's back up.
- **Read repair** — a later read notices a stale replica and patches it.

### Subtlety: quorum ≠ majority

W=3 of N=5 happens to be a majority, but you could set W=2 (not a majority) for faster, weaker writes. "Quorum" just means "the threshold count configured" — majority is the common/recommended choice because it cleanly guarantees the W+R>N overlap math.

### The one sentence to remember

**Quorum = coordinator (not a master) fans a write out to all N replicas but only waits for W acks to call it done; correctness comes from the math rule W+R>N, which forces every read to overlap at least one node that has the latest write.**

Where used in practice: cite W+R>N when asked "how does Dynamo/Cassandra give tunable consistency" — standard follow-up after the PA/EL classification, since interviewers want to see quorum understood as an overlap guarantee, not just "majority vote."
