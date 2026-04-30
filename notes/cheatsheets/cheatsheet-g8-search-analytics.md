# G8 · Search & Analytics

---

## § SEARCH

**Inverted index:** term → [docId, position, ...] — the core data structure behind all search
**Build:** tokenize → normalize (lowercase, stem) → index term → docId mappings
**Ranking:** TF-IDF (term frequency × inverse document frequency) or BM25
**Elasticsearch:** distributed inverted index; shards index across nodes; replica shards for read scale
**Write path:** document → index API → in-memory buffer → flush to segment → merge segments
**Read path:** query → parse → query all shards in parallel → merge + rank results → return top K

**Watch out for:** index lag (near-real-time, not real-time) · large result sets (use pagination + search_after) · hot shards (route by docId hash not user)

---

## § TYPEAHEAD / AUTOCOMPLETE

**Trie:** prefix tree — O(p) lookup where p = prefix length; memory heavy for large dictionaries
**Distributed trie:** shard by first character or consistent hash of prefix
**Ranking:** weight each node by query frequency → return top K by score
**Cache:** cache top results for common prefixes (Redis Sorted Set: ZADD prefix score suggestion)
**Updates:** rebuild trie offline (batch) + hot-patch common new terms; avoid real-time trie updates
**Latency target:** <100ms → serve from edge cache or in-memory store, not DB

---

## § ANALYTICS PIPELINE

╔══════════════════════╦═══════════════════════════════════════════════════════════════╗
║ Architecture         ║ How it works                                                  ║
╠══════════════════════╬═══════════════════════════════════════════════════════════════╣
║ Batch (Hadoop/Spark) ║ Process stored data in large chunks; high latency, high throughput ║
║ Stream (Flink/Kafka) ║ Process events as they arrive; low latency, incremental        ║
║ Lambda               ║ Both layers: stream for real-time view + batch for corrected view ║
║ Kappa                ║ Stream only; reprocess by replaying Kafka topic               ║
╚══════════════════════╩═══════════════════════════════════════════════════════════════╝

**Modern default:** Kappa architecture with Kafka + Flink — simpler than Lambda, replayable.

---

## § TIME SERIES

**Access pattern:** write-heavy, append-only, query by time range, aggregate (avg/sum/max)
**Storage:** specialized (InfluxDB, TimescaleDB, Prometheus) — columnar, compressed by time
**Downsampling:** roll up old data (1s → 1min → 1hr → 1day) to control storage growth
**Retention policy:** define TTL per resolution tier
**Use cases:** metrics, monitoring, IoT sensor data, financial ticks

---

## § DATA WAREHOUSE

**OLTP vs OLAP:**
- OLTP: row-oriented, many small transactions, normalized schema
- OLAP: column-oriented, large scans + aggregations, denormalized (star/snowflake schema)

**Columnar storage:** only read columns needed for query → massive I/O reduction for analytics
**ETL pipeline:** source DB → extract → transform → load into warehouse (Redshift, BigQuery, Snowflake)
**Partitioning:** partition warehouse tables by date → queries with date filter skip irrelevant partitions
