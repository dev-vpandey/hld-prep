# G3 · Caching

---

## § CACHE STRATEGIES

╔═════════════════════╦══════════════════════════════════════════════════════╦═══════════════════════════════╗
║ Strategy            ║ Flow                                                 ║ Best for                      ║
╠═════════════════════╬══════════════════════════════════════════════════════╬═══════════════════════════════╣
║ Cache-aside         ║ App checks cache → miss → read DB → write cache      ║ Read-heavy, general purpose   ║
║ Read-through        ║ Cache fetches from DB on miss (cache library does it) ║ Simpler app code              ║
║ Write-through       ║ Write to cache AND DB synchronously                  ║ Consistency critical           ║
║ Write-behind        ║ Write to cache → async flush to DB                   ║ Write-heavy, tolerate lag     ║
║ Refresh-ahead       ║ Proactively refresh before TTL expires                ║ Predictable access patterns   ║
╚═════════════════════╩══════════════════════════════════════════════════════╩═══════════════════════════════╝

---

## § EVICTION

- **LRU** — evict least recently used; good for recency-based access
- **LFU** — evict least frequently used; good for stable popularity
- **TTL** — time-based expiry; simple, avoids stale data buildup
- **FIFO** — evict oldest inserted; rarely optimal

**In practice:** TTL + LRU is the most common combo (Redis default)

---

## § REDIS PATTERNS

**Data structures:** String, Hash, List, Set, Sorted Set, Stream
**Rate limiting:** INCR + EXPIRE in Lua script (atomic)
**Leaderboard:** Sorted Set (ZADD, ZRANGE, ZRANK)
**Session store:** Hash with TTL per session key
**Pub-sub:** PUBLISH/SUBSCRIBE — at-most-once, no persistence
**Distributed lock:** SET key value NX PX ttl → Redlock for multi-node

---

## § CDN

**What:** geographically distributed cache of static assets (images, JS, CSS, video)
**Push vs pull CDN:**
- Push: you upload content to CDN proactively (good for known, stable assets)
- Pull: CDN fetches from origin on first miss, caches (good for dynamic content mix)

**Cache-Control headers:** `max-age`, `s-maxage`, `no-cache`, `no-store`
**Invalidation:** by URL, by tag (surrogate keys), or versioning (cache-busting via filename hash)
**Use for:** any read-heavy static or semi-static content; reduces origin load and latency

---

## § CACHE FAILURE MODES

╔═══════════════════════════╦═══════════════════════════════════════════════════╦══════════════════════════════════╗
║ Problem                   ║ What happens                                      ║ Mitigation                       ║
╠═══════════════════════════╬═══════════════════════════════════════════════════╬══════════════════════════════════╣
║ Cache stampede / dogpile  ║ Many requests miss simultaneously → DB overwhelmed ║ Mutex lock on first miss; jitter ║
║ Thundering herd           ║ Cache restarts → all requests hit DB at once       ║ Warm-up cache before cut-over   ║
║ Hot key                   ║ Single key takes disproportionate traffic          ║ Local in-process cache; replicas ║
║ Cache penetration         ║ Queries for non-existent keys bypass cache always  ║ Cache null responses with short TTL; bloom filter ║
║ Cache avalanche           ║ Many keys expire at same time → DB spike           ║ Randomize TTL values             ║
╚═══════════════════════════╩═══════════════════════════════════════════════════╩══════════════════════════════════╝
