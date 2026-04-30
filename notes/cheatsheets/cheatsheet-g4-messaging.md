# G4 · Messaging & Async

---

## § MESSAGE QUEUE

**Why:** decouple producer and consumer; absorb traffic spikes; enable async processing
**Core concepts:** producer → queue → consumer → ack → delete
**At-least-once delivery:** message redelivered if no ack within timeout → consumers must be idempotent
**Dead letter queue (DLQ):** messages that fail N times go here for inspection

**When to use:** any time producer and consumer can't be tightly coupled or have different throughput

---

## § KAFKA

**Core model:** topics → partitions → offsets; consumers track their own offset
**Ordering:** guaranteed within a partition, not across partitions
**Partition key:** determines which partition a message goes to → use userId for per-user ordering
**Consumer group:** each partition consumed by exactly one consumer in a group (parallelism = # partitions)
**Retention:** messages kept for configurable time (not deleted on consume) → replay is possible

╔══════════════════════════╦════════════════════════════════════════════════════╗
║ Use case                 ║ Why Kafka fits                                     ║
╠══════════════════════════╬════════════════════════════════════════════════════╣
║ Event log / audit        ║ Immutable ordered log, replayable                  ║
║ Fan-out to many services ║ Multiple consumer groups read independently        ║
║ Stream processing        ║ Integrate with Flink/Spark for real-time pipelines ║
║ High-throughput ingestion║ Millions of events/s with minimal latency          ║
╚══════════════════════════╩════════════════════════════════════════════════════╝

**Watch out for:** consumer lag (consumer too slow) · partition hotspot (bad partition key) · exactly-once = complex (use idempotent producers + transactions)

---

## § PUB-SUB

**Model:** publishers emit to topics; subscribers receive all messages on subscribed topics
**vs Queue:** queue = one consumer gets a message; pub-sub = all subscribers get it
**Fan-out problem:** high-follower users publishing → millions of messages per post
**Solutions:** hybrid (push to normal users, pull for celebrities)

---

## § ASYNC WORKERS

**Pattern:** API → enqueue job → worker pool pulls and processes → update status in DB
**Retry:** exponential backoff with jitter (avoid thundering herd on retry)
**Idempotency:** worker must handle duplicate delivery — use job ID as idempotency key
**Visibility timeout:** job hidden from queue while being processed; re-enqueued if not acked in time
**Monitoring:** queue depth is the key metric — spike = workers falling behind

---

## § EVENT SOURCING

**What:** store state as a sequence of events, not current state
**Replay:** rebuild current state by replaying all events from the log
**Pros:** full audit trail, can rebuild any past state, decouples read/write models (CQRS)
**Cons:** query complexity, event schema evolution is hard, storage grows unbounded
**When:** audit-critical systems (payments, inventory), CQRS architectures
