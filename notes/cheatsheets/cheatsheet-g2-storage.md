# G2 · Storage & Databases

---

## § SQL vs NOSQL

╔══════════════════════╦══════════════════════════════════════╦══════════════════════════════════════╗
║ Dimension            ║ SQL                                  ║ NoSQL                                ║
╠══════════════════════╬══════════════════════════════════════╬══════════════════════════════════════╣
║ Schema               ║ Fixed, enforced                      ║ Flexible, schema-on-read             ║
║ Transactions         ║ ACID, multi-row                      ║ Usually single-row atomic            ║
║ Scale                ║ Vertical + limited horizontal        ║ Horizontal by design                 ║
║ Joins                ║ Native                               ║ Denormalize or application-side      ║
║ Access pattern       ║ Flexible queries                     ║ Must know access pattern up front    ║
╚══════════════════════╩══════════════════════════════════════╩══════════════════════════════════════╝

**Pick SQL when:** strong consistency required, complex queries, relational data, transactions
**Pick NoSQL when:** massive write scale, flexible schema, simple access patterns, geo-distributed

---

## § SHARDING

**What:** horizontal partition — each shard holds a subset of rows
**Shard key choice matters most:** bad key → hotspot (all writes to one shard)

╔══════════════════════╦══════════════════════════════════════╦═══════════════════════════════╗
║ Strategy             ║ How                                  ║ Watch out for                 ║
╠══════════════════════╬══════════════════════════════════════╬═══════════════════════════════╣
║ Hash sharding        ║ hash(key) % N → shard                ║ Rebalancing = full reshuffle  ║
║ Range sharding       ║ key ranges map to shards             ║ Hotspot if range is skewed    ║
║ Consistent hashing   ║ Ring, add/remove = minimal movement  ║ Virtual nodes needed for even ║
║ Directory-based      ║ Lookup table → shard                 ║ Lookup table = SPOF           ║
╚══════════════════════╩══════════════════════════════════════╩═══════════════════════════════╝

**Cross-shard joins:** avoid — denormalize or do in application layer
**Resharding:** consistent hashing + virtual nodes minimizes data movement on node add/remove

---

## § REPLICATION

╔═══════════════════════╦══════════════════════════════════════════════════════════════════════╗
║ Model                 ║ How it works + trade-off                                             ║
╠═══════════════════════╬══════════════════════════════════════════════════════════════════════╣
║ Leader-Follower       ║ One leader handles writes, replicated to followers (read scale)      ║
║ Multi-Leader          ║ Multiple leaders, conflict resolution needed (geo-distributed)       ║
║ Leaderless            ║ Write to W nodes, read from R nodes (quorum: W+R > N = consistency) ║
╚═══════════════════════╩══════════════════════════════════════╩═══════════════════════════════╝

**Replication lag:** follower reads may return stale data → read-your-writes via sticky sessions or read from leader
**Failover:** leader dies → election (Raft/Paxos) or manual promotion; risk of split-brain

---

## § CONSISTENT HASHING

**Problem it solves:** with N servers, adding/removing one causes K/N keys to remap (not K/N, actually almost all)
**Solution:** hash ring 0–2^32; servers placed on ring; key goes to next clockwise server
**Virtual nodes:** each physical server gets multiple positions → even distribution even with few nodes
**Adding a node:** only keys between new node and its predecessor move
**Use cases:** distributed cache (Memcached), Cassandra, load balancers

---

## § BLOB STORAGE

**Use for:** images, video, large files — don't store in DB rows
**Flow:** client → pre-signed URL from service → upload directly to S3 → notify service of completion
**CDN integration:** S3 as origin, CloudFront as edge cache — serve static assets from edge
**Metadata:** store in DB (object key, size, owner, created_at, status) — not in blob store itself
