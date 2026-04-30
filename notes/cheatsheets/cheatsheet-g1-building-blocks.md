# G1 · Building Blocks

---

## § RATE LIMITER

**Algorithms:**

╔══════════════════════╦══════════════════════════════════════╦═══════════════════════════════╗
║ Algorithm            ║ How it works                         ║ Trade-off                     ║
╠══════════════════════╬══════════════════════════════════════╬═══════════════════════════════╣
║ Token bucket         ║ Tokens added at fixed rate, consumed ║ Allows bursts up to bucket sz ║
║ Leaky bucket         ║ Queue drains at fixed rate           ║ Smooth output, no burst       ║
║ Fixed window         ║ Counter reset every window           ║ Edge burst at window boundary ║
║ Sliding window log   ║ Log of timestamps, count in window   ║ Memory heavy, most accurate   ║
║ Sliding window count ║ Blend of fixed + prev window weight  ║ Low memory, approx accurate   ║
╚══════════════════════╩══════════════════════════════════════╩═══════════════════════════════╝

**Where to enforce:** Client → API Gateway → Service (prefer gateway for centralized limits)
**Storage:** Redis + Lua script for atomic increment (GET + INCR + EXPIRE in one op)
**Distributed problem:** Multiple nodes = race on shared counter → use Redis as single source of truth
**Headers to return:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, HTTP 429

---

## § URL SHORTENER

**Core flow:** longUrl → hash → store(shortCode → longUrl) → redirect 301/302
**Hash:** MD5/SHA256 → take first 7 chars of base62 encode → ~3.5T combinations
**Collision:** check DB before insert; on collision, append counter and rehash
**301 vs 302:** 301 = permanent (browser caches, fewer hits) · 302 = temporary (track every hit)
**Scale read:** cache shortCode → longUrl in Redis (read-heavy, high cache hit rate)
**Custom alias:** allow user-specified code, just check uniqueness before insert

---

## § KEY-VALUE STORE

**Storage engine choices:**
- Hash index: fast writes, range query impossible, log-structured
- LSM-tree + SSTable: write optimized, compaction cost, Cassandra/RocksDB
- B-tree: read optimized, in-place update, PostgreSQL/MySQL

**Replication:** leader-follower for read scale; eventual consistency acceptable for KV
**Partitioning:** consistent hashing to distribute keys across nodes
**Failure:** gossip protocol for node membership; quorum reads/writes for consistency (R + W > N)

---

## § ID GENERATION

**Options:**

╔════════════════════╦════════════════════════════════════════╦═══════════════════════════════╗
║ Approach           ║ How                                    ║ Watch out for                 ║
╠════════════════════╬════════════════════════════════════════╬═══════════════════════════════╣
║ DB auto-increment  ║ Single DB issues IDs                   ║ Single point of failure       ║
║ UUID               ║ Random 128-bit                         ║ Not sortable, large size      ║
║ Snowflake          ║ 41-bit timestamp + datacenter + seq    ║ Clock skew → duplicate IDs    ║
║ Ticket server      ║ Centralized DB of IDs                  ║ SPOF unless replicated        ║
╚════════════════════╩════════════════════════════════════════╩═══════════════════════════════╝

**Snowflake layout:** `[1 sign][41 timestamp ms][10 machine id][12 sequence]` = 64 bits
**Clock skew fix:** refuse to generate if clock moves backward; wait or use last known time

---

## § TOP-K / HEAVY HITTERS

**Naive:** sort + take top K → O(n log n), too slow for stream
**Heap approach:** min-heap of size K → O(n log K)
**Approximate (stream):** Count-Min Sketch → fixed size array, multiple hash functions, no false negatives on frequency
**Distributed:** each node maintains local top-K → merge at coordinator periodically
**Real-time trending:** sliding window + decay factor to weight recency over raw count
