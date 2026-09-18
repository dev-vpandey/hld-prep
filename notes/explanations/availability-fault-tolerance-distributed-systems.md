# Availability and Fault Tolerance in Distributed Systems

Saved: 2026-09-12
Related cheatsheet: @notes/cheatsheets/cheatsheet-g5-distributed.md (§ QUORUM (N/W/R), § CONSENSUS, § COORDINATION PRIMITIVES (ZOOKEEPER/ETCD), § CAP THEOREM, § RESILIENCE PATTERNS)

---

Two words, constantly confused, that mean different things:

- **Availability** = "is the door open right now?" (uptime)
- **Fault tolerance** = "if a wall falls down, does the building still stand?" (correctness under damage)

You can have one without the other. A system can be "up" but returning garbage data (available, not fault-tolerant). A system can refuse new writes during a partition but never corrupt data (fault-tolerant, briefly unavailable). Interviewers love making you draw this line.

---

## 1. Availability

**Plain words:** Availability is just the percentage of time your system actually answers requests correctly, measured over some period.

**Analogy:** A 24-hour convenience store. If it's locked for 4 hours a year for "restocking," it's still "available" 99.95% of the time. Customers don't care why the door was locked — they only remember whether they could get in.

**The formula:**

```
Availability = Uptime / (Uptime + Downtime) × 100
```

**Timeline picture:**

```
Time ───────────────────────────────────────────────▶
     [ UP ][ UP ][ UP ][ DOWN ][ UP ][ UP ][ UP ][ UP ]
                        ▲
                  outage window
             (this is what eats your SLA)
```

**The metrics that matter:**

╔═══════════════════════════════╦══════════════════════════════════════════════════╗
║ Metric                        ║ Meaning                                            ║
╠═══════════════════════════════╬══════════════════════════════════════════════════╣
║ Uptime                        ║ % of time system is correctly serving requests    ║
║ MTBF (Mean Time Between       ║ Avg time between failures — higher = more reliable║
║ Failures)                     ║                                                    ║
║ MTTR (Mean Time To Recovery)  ║ Avg time to fix a failure — lower = better        ║
╚═══════════════════════════════╩══════════════════════════════════════════════════╝

**Worked example — the "nines" table** (memorize this, interviewers ask it cold):

╔═════════════╦═══════════════════╦════════════════════╗
║ Availability ║ Downtime / year   ║ Downtime / month   ║
╠═════════════╬═══════════════════╬════════════════════╣
║ 99%          ║ ~3.65 days        ║ ~7.3 hours         ║
║ 99.9%        ║ ~8.76 hours       ║ ~43.8 minutes      ║
║ 99.99%       ║ ~52.6 minutes     ║ ~4.4 minutes       ║
║ 99.999%      ║ ~5.26 minutes     ║ ~26 seconds        ║
╚═════════════╩═══════════════════╩════════════════════╝

**Interview angle:** When someone says "design a highly available X," the first thing a good candidate does is *pin a number* — "let's target 99.99%" — because "highly available" is meaningless without a target. It also tells you your error budget: at 99.99% you get ~52 min/year to spend on deploys, incidents, maintenance — combined.

**Staff-level angle:** The number isn't free — going from 99.9% → 99.99% often costs 5-10x more infra/ops investment for each additional nine (multi-AZ → multi-region → active-active global routing → chaos testing). Staff engineers are expected to say "do we actually need five nines for this internal reporting service, or is three nines fine and we spend that budget elsewhere?" — matching the SLA to the business criticality, not maximizing it blindly.

**Real world:** AWS's own SLA for EC2 is 99.99% (multi-AZ). Netflix famously targets near-five-nines for the *core streaming path* (can you press play) while tolerating much lower availability on secondary features (e.g., "download for offline," recommendations refresh) — a staff-level move: not all of "the system" needs the same bar.

---

## 2. Achieving High Availability — Redundancy

**Plain words:** The only way to survive a component dying is to have already had a spare. That's it — that's the whole idea. Everything else (health checks, load balancers, failover) is just machinery to detect death and switch to the spare fast.

**Analogy:** Think of a hospital. Active-passive is like having one on-call doctor and a second doctor asleep at home who only gets paged if the first one collapses — there's a delay (someone has to notice, call, wake them up) before care resumes. Active-active is like having two doctors already in the ER seeing patients side by side — if one collapses, the other just keeps working, and a triage nurse (load balancer) stops sending new patients to the one on the floor.

### Active-Passive

```
        ┌──────────────┐
Client ─▶│ ACTIVE node  │──▶ serves 100% of traffic
        └──────────────┘
               │ heartbeat / health check
               ▼
        ┌──────────────┐
        │ PASSIVE node │  (idle, kept in sync, waiting)
        └──────────────┘

  Active dies ──▶ passive promoted ──▶ becomes new active
                  (brief "failover gap" while this happens)
```

### Active-Active

```
                 ┌── Load Balancer ──┐
                 │                    │
         ┌───────▼──────┐    ┌───────▼──────┐
         │ Node A (live) │    │ Node B (live) │
         └───────────────┘    └───────────────┘
   Both serve real traffic right now.
   Node A dies → LB just stops routing to it;
   Node B absorbs 100% load. No failover step, no promotion delay.
```

╔════════════════╦═══════════════════════════════╦══════════════════════════╦═══════════════════════════╗
║ Model          ║ Best for                       ║ Pros                     ║ Cons                       ║
╠════════════════╬═══════════════════════════════╬══════════════════════════╬═══════════════════════════╣
║ Active-Passive ║ Stateful, single-source-of-    ║ Simple consistency,      ║ Idle spare = wasted spend, ║
║                ║ truth systems (primary DB)     ║ low conflict risk        ║ brief failover gap         ║
║ Active-Active  ║ Stateless services              ║ Full utilization, no     ║ Harder state/consistency   ║
║                ║ (web/app servers)               ║ downtime on failure      ║ management                 ║
╚════════════════╩═══════════════════════════════╩══════════════════════════╩═══════════════════════════╝

**Health checks + replication picture:**

```
Load Balancer ──ping every 5s──▶ Node A  (200 OK) → keep routing
              ──ping every 5s──▶ Node B  (timeout×3) → mark unhealthy, stop routing

Primary DB ──replicate rows──▶ Replica DB
  (if Primary dies, data still exists on Replica → promote it)
```

**Interview angle:** "How would you make this stateless API tier highly available?" → active-active behind a load balancer with health checks, deployed across ≥2 AZs. "How would you make the primary database highly available?" → usually active-passive with a standby + automated failover (or a quorum-replicated system, see below).

**Staff-level angle:** Redundancy is never free — it's a cost/complexity dial, not a switch. A staff engineer explicitly states the trade-off: "we're paying for N+1 (or N+2) capacity we don't normally use, in exchange for surviving a zone loss without customer impact — here's the $/month delta." They also know redundancy without *diversity* is fake redundancy — three replicas on the same rack, same power circuit, same availability zone, or same vendor's payment API is still one blast radius.

**Real world:**
- **Netflix**: active-active across multiple AWS regions for the streaming control plane; famous for **Chaos Monkey** (randomly kills instances in production) and **Chaos Kong** (simulates an entire AWS region going dark) specifically to prove active-active redundancy actually works, not just that it's configured.
- **PostgreSQL with streaming replication**: classic active-passive — one primary accepts writes, a standby replays the WAL and can be promoted.
- **Aurora / Spanner**: blur the line — active-active at the compute tier, quorum-replicated storage underneath (more on this in section 4).

---

## 3. Fault Tolerance

**Plain words:** Fault tolerance is what happens *after* something breaks — can the system notice, contain the damage, and keep giving correct answers, instead of crashing or lying.

**Analogy:** A commercial airplane has multiple engines. If one fails mid-flight, the plane doesn't fall out of the sky — sensors detect the failure (detection), the failed engine is shut off and fuel to it cut (isolation), and the flight computer rebalances thrust/control to the working engines (recovery). The plane keeps flying — degraded, but correct and safe.

```
     Engine 1 (failed) ✗          Engine 2 (running) ✓
              \                          /
               \________________________/
                       Aircraft
              (still flies — detected fault,
               isolated it, rerouted control
               to what's still healthy)
```

**Three design principles, in order:**

1. **Failure detection** — continuous health monitoring (the plane's sensors / your health checks).
2. **Isolation** — stop the fault from spreading (cut fuel to that engine / circuit breaker pattern stopping a failing downstream service from taking down callers).
3. **Recovery / self-healing** — reroute or restore automatically (rebalance thrust / auto-restart a crashed pod, promote a replica).

**Interview angle:** When asked "what's the single point of failure here?" (this is a stock Staff-round question), you're being tested on whether you instinctively separate "will it stay up" (availability) from "will it stay correct" (fault tolerance) — a payment service that fails open and double-charges a customer is "available" but definitely not fault-tolerant.

**Staff-level angle:** Fault tolerance requires *deliberately practicing failure*, not just architecting for it on paper. This is why chaos engineering exists as a discipline — untested failover code is a hypothesis, not a guarantee.

**Real world:** Netflix's Simian Army (Chaos Monkey, Chaos Kong, Latency Monkey) is the textbook production implementation of "actually verify fault tolerance." AWS's own internal philosophy of "everything fails all the time" (Werner Vogels) drives S3/DynamoDB's design toward tolerating disk, node, rack, and AZ failure as a *normal operating condition*, not an edge case.

---

## 4. Achieving Fault Tolerance — Consensus and Quorum

**Plain words:** In a single machine, "did this write succeed" has one obvious answer. Across many machines, nodes can crash or be unreachable, so the system needs a rule for "how many nodes have to agree before we call something official." That rule is quorum, and the algorithms that implement it safely are consensus algorithms (Raft, Paxos).

**Analogy:** A jury verdict. You don't need all 12 jurors reachable to reach a valid verdict in every justice system, but you do need a *majority* to agree, so that two contradictory verdicts can never both be legitimate. If jurors split into two rooms and each room votes separately without a majority, no valid verdict exists in either room.

```
5 nodes, quorum = majority = 3

  N1 ✓    N2 ✓    N3 ✓     N4 ✗ (down)   N5 ✗ (down)
   \_______|_______/
      3 votes = QUORUM REACHED → write is committed

If only N1, N2 are reachable (2 votes) → NO quorum
→ write is blocked/rejected, NOT silently allowed
   (this is exactly what prevents split-brain)
```

**Interview angle:** "How do you make sure two nodes don't both think they're the leader?" → majority quorum. This is one of the most commonly under-explained concepts by candidates — they know the word "quorum" but can't explain *why* majority (not just "more than one") is what prevents two disjoint groups from both succeeding.

**Staff-level angle:** Quorum size is a tunable trade-off, not a fixed law — this connects directly to the N/W/R model (see `§ QUORUM (N/W/R)` in the linked cheatsheet). W+R>N gives strong consistency; smaller W/R gives more availability under partition at the cost of possibly stale reads. A staff answer names this trade-off explicitly instead of treating "quorum" as a single fixed concept.

**Real world:** **Google Spanner** uses Paxos per shard for consensus with TrueTime for global ordering. **etcd/ZooKeeper** (used by Kubernetes, Kafka's older versions) use Raft/ZAB for leader election and config consensus. **DynamoDB**'s original Dynamo paper introduced sloppy quorum + hinted handoff as a deliberate *weaker* alternative, favoring availability over strict consensus.

---

## 5. Replication and Recovery Patterns

**Plain words:** Replication = keep more than one copy of the data on more than one machine, so one machine dying doesn't mean the data dying. Recovery = when a dead node comes back, how does it catch up to reality.

**Analogy:** Keeping a backup photocopy of an important contract in a second building. If the original office burns down, the copy still exists — but *how current* that copy is depends on whether you re-copied it after every single edit (synchronous) or only every night (asynchronous).

```
SYNCHRONOUS REPLICATION:
Client ──write──▶ Primary ──replicate──▶ Replica
                     │                       │
                     └────── wait for ACK ───┘
Client only gets "OK" AFTER the replica confirms.
Safer (no data loss if primary dies right after), slower.

ASYNCHRONOUS REPLICATION:
Client ──write──▶ Primary ──"OK"──▶ Client
                     │
                     └── replicate later ──▶ Replica
Faster response, but if Primary dies before replicating,
that last write is GONE.
```

**Interview angle:** "Would you use sync or async replication here?" is really asking "does this data type tolerate loss of the last few seconds of writes?" Payment ledger → sync. Activity feed "like" counter → async is fine.

**Staff-level angle:** Recovery isn't just "bring the node back" — it's "how does a node that missed N minutes of writes safely rejoin without corrupting quorum or serving stale reads in the meantime" (catch-up replication, read barriers until caught up). This is the part junior designs skip and staff designs call out explicitly.

**Real world:** MySQL/Postgres semi-sync replication for financial-grade durability; most feed/timeline stores (Cassandra, DynamoDB) default to async/eventual for throughput.

---

## 6. Network Partitions and Split-Brain

**Plain words:** A network partition is when part of the cluster can't talk to another part — not because anyone crashed, but because the network between them broke. The danger is each side assuming *it's* the one still in charge.

**Analogy:** Two regional managers whose phone line to HQ goes dead at the same time. Each assumes HQ is unreachable because HQ died, not because the phone line died — so each independently declares themselves "acting CEO" and starts signing contracts. Now you have two CEOs signing conflicting deals simultaneously. That's split-brain.

```
Before partition:
        [Leader L1] ── controls writes ── {N2, N3, N4, N5}

Network splits:
   Side A: {L1, N2}              Side B: {N3, N4, N5}
        │                              │
   L1 still thinks it's leader    N3/N4/N5 see no leader,
   (still accepting writes!)      elect NEW leader L2
                                  (also accepting writes!)

           ⚠ TWO LEADERS = SPLIT BRAIN ⚠

Fix via quorum: Side A has 2/5 nodes → no majority →
L1 MUST step down / refuse writes.
Side B has 3/5 nodes → majority → L2 is the legitimate leader.
```

**Fencing** is the extra safety net on top of quorum: even after L2 is elected, the old leader L1 might still think it's boss and try to write to shared storage once the network heals for a split second. Fencing physically/logically blocks L1 from touching shared resources (e.g., revoking its storage access token) until it acknowledges it's no longer leader.

**Analogy for fencing:** Deactivating a fired employee's badge the moment they're let go — even if they still *believe* they work there and walk up to the door, the badge simply won't open it anymore.

**Code — fencing tokens in action (Java):**

```java
import java.util.concurrent.atomic.AtomicLong;

class LockService {
    private final AtomicLong tokenCounter = new AtomicLong(0);

    long acquireLock(String clientName) {
        long token = tokenCounter.incrementAndGet();
        System.out.println(clientName + " acquired lock, fencing token = " + token);
        return token;
    }
}

class FencedStorage {
    private long highestTokenSeen = 0;
    private String value;

    synchronized boolean write(long token, String newValue) {
        if (token <= highestTokenSeen) {
            System.out.println("REJECTED write from token=" + token
                + " (storage already saw token=" + highestTokenSeen + ")");
            return false;
        }
        highestTokenSeen = token;
        value = newValue;
        System.out.println("ACCEPTED write from token=" + token + " -> value=" + newValue);
        return true;
    }
}

public class FencingDemo {
    public static void main(String[] args) throws InterruptedException {
        LockService lockService = new LockService();
        FencedStorage storage = new FencedStorage();

        // Client A gets the lock first
        long tokenA = lockService.acquireLock("Client A");

        // Client A stalls (GC pause) long enough for its lock to expire —
        // simulated with a sleep instead of a real lock-expiry timer.
        Thread clientA = new Thread(() -> {
            try { Thread.sleep(500); } catch (InterruptedException ignored) {}
            storage.write(tokenA, "A's stale write");
        });

        // Client B thinks A is dead, takes over, writes immediately.
        Thread clientB = new Thread(() -> {
            long tokenB = lockService.acquireLock("Client B");
            storage.write(tokenB, "B's fresh write");
        });

        clientB.start();
        clientB.join();
        clientA.start();
        clientA.join();
    }
}
```

**Output:**
```
Client B acquired lock, fencing token = 2
ACCEPTED write from token=2 -> value=B's fresh write
REJECTED write from token=1 (storage already saw token=2)
```

**Dry run:**

╔═══════╦═══════════════════════════════════╦═══════════════════╦══════════════════════════════════╗
║ Step  ║ Actor                              ║ Token              ║ Storage decision                  ║
╠═══════╬═══════════════════════════════════╬═══════════════════╬══════════════════════════════════╣
║ 1     ║ Client A acquires lock             ║ token = 1          ║ (no write yet)                    ║
║ 2     ║ Client A stalls (GC pause)         ║ —                  ║ —                                 ║
║ 3     ║ Client B acquires lock             ║ token = 2          ║ (no write yet)                    ║
║ 4     ║ Client B writes                    ║ token = 2          ║ ACCEPTED, highestTokenSeen = 2    ║
║ 5     ║ Client A wakes, writes             ║ token = 1          ║ REJECTED, 1 ≤ 2                   ║
╚═══════╩═══════════════════════════════════╩═══════════════════╩══════════════════════════════════╝

**The part people miss:** the `token <= highestTokenSeen` check must live inside the storage/resource layer itself, not the client. A client checking its own "am I still leader?" status before writing is exactly as stale as the lock that already expired on it — only the resource being written to can be the final referee, because it's the only party a zombie client can't lie to.

**Interview angle:** This is the single most common "gotcha" follow-up after a candidate says "we'll just elect a new leader" — the interviewer asks "what stops the old leader from still writing?" Candidates who don't know fencing usually go quiet here.

**Staff-level angle:** Real split-brain incidents almost always trace back to a misconfigured or absent quorum setting, not a missing "algorithm." A staff engineer reviewing a design asks "what is your actual minimum-quorum config, and have you tested a network partition against it," not "do you have Raft."

**Real world:** Early Elasticsearch clusters had well-documented split-brain incidents caused by a `minimum_master_nodes` setting that wasn't set to a true majority — fixed in later versions with quorum-aware defaults. MongoDB replica sets use majority-based elections specifically to avoid this. ZooKeeper/etcd (Raft-based) are frequently reached for by other systems (Kafka, Kubernetes) precisely to outsource this exact problem to a battle-tested consensus layer instead of reinventing it.

---

## 7. Case Study — Always-On E-Commerce Checkout

**Architecture:**

```
                          ┌─────────────────────┐
                          │  Global Load Balancer │
                          └───────────┬──────────┘
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
        ┌───────────┐            ┌───────────┐            ┌───────────┐
        │   AZ-1     │            │   AZ-2     │            │   AZ-3     │
        │ Regional LB│            │ Regional LB│            │ Regional LB│
        │  App nodes │            │  App nodes │            │  App nodes │
        │  DB replica│◀──sync────▶│  DB replica│◀──sync────▶│  DB replica│
        └───────────┘   quorum   └───────────┘   quorum   └───────────┘
                       write needs majority (2 of 3) to ack
```

**Worked dry run — what actually happens when 2 of 3 zones go down** (this is the source article's own quiz question, traced step by step):

1. **Normal state:** all 3 AZs healthy. Global LB spreads traffic evenly. DB write quorum = 2 of 3 acks required.
2. **AZ-2 and AZ-3 both fail** (say, correlated outage — same cloud region-wide network event).
3. Global LB's health checks fail 3 consecutive pings (~15s) against AZ-2 and AZ-3's regional LBs → both marked unhealthy.
4. **100% of traffic now routes to AZ-1.** If AZ-1 was only provisioned with ~40% headroom (typical for 3-way active-active), it now gets ~3x its normal load — risk of cascading overload on the *survivor*, not just "reduced redundancy."
5. **The database is the sharper problem:** write quorum needs 2 of 3 replicas to ack. With AZ-2 and AZ-3 down, only AZ-1's replica is reachable — **1 of 3, no quorum.** Synchronous writes (i.e., completing a checkout / charging a card) start **failing or blocking**, not just running slow. Reads may still work locally from AZ-1's replica (depending on read quorum config), so browsing/cart-viewing might look fine while actual checkout silently breaks.
6. **This is CAP theorem in the wild:** the system is explicitly choosing consistency over availability for the write path the moment quorum is lost — which is *correct* for a payment system (better to reject a charge than double-charge or lose it), but it means "always-on checkout across 3 zones" quietly becomes "checkout degrades to read-only" the instant you lose a majority of zones, regardless of how good your load balancer is.

The source article's own answer mentions increased load, lost redundancy, higher latency, and "possible" consistency/write impact — the sharper staff-level point is that it isn't "possible," it's **guaranteed** if the write quorum is a true majority: 1 surviving zone out of 3 mathematically cannot reach a 2-of-3 quorum. That's a concrete, falsifiable fact worth stating in an interview instead of hedging with "might."

**The dependency-chain pitfall** (also from the article, worth repeating because it's exactly the kind of thing that separates Staff from Senior): you can build a fully redundant, multi-AZ, quorum-replicated checkout service and still go down completely because it calls a single, non-redundant third-party payment processor API. Redundancy analysis has to walk the *entire* call graph, including vendors you don't control — this is often the actual root cause in real production outages, not the infra you built yourself.

---

## The one sentence to remember

**Availability is about removing single points of failure so the door stays open; fault tolerance is about quorum, replication, and fencing making sure that even when the door is being kicked in, the system never lies about what's true inside — and real production systems (Netflix, Spanner, Dynamo, Aurora) are all just different specific trade-off points on those two dials.**

Used in practice: every SRE on-call runbook, every cloud provider's "Well-Architected Framework" reliability pillar, and — very directly — every "design a highly available X" system design interview, where naming your target nines, your redundancy model, and your quorum size explicitly is what separates a Senior answer from a Staff one.
