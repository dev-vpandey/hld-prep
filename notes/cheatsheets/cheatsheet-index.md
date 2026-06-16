# Cheatsheet Index — Coach lookup only
# keyword → file § section · solved card (optional)

## G0 · Back-of-Envelope Estimation  (cheatsheet-g0-estimation.md)
power of 2, power of 10, storage units, bytes kb mb gb tb pb     → § POWER OF 2 / STORAGE UNITS
latency numbers, l1 cache, ssd, hdd, memory, network             → § LATENCY NUMBERS
availability, nines, 99.9, 99.99, downtime                       → § AVAILABILITY NUMBERS
qps, dau, requests per second, peak traffic, 86400               → § QPS ESTIMATION
storage estimation, retention, record size, media storage         → § STORAGE ESTIMATION
rounding rules, approximation, back-of-envelope                  → § ROUNDING RULES

## G1 · Building Blocks  (cheatsheet-g1-building-blocks.md)
rate limiter, token bucket, leaky bucket, sliding window log   → § RATE LIMITER
url shortener, hash, base62, redirect                          → § URL SHORTENER
key-value store, get put delete, storage engine                → § KEY-VALUE STORE
unique id generator, snowflake, clock skew                     → § ID GENERATION
top-k, heavy hitters, count-min sketch                         → § TOP-K / HEAVY HITTERS

## G2 · Storage & Databases  (cheatsheet-g2-storage.md)
sql vs nosql, when to use which                                → § SQL vs NOSQL
sharding, horizontal partition, shard key, hotspot             → § SHARDING
replication, leader follower, multi-leader, leaderless         → § REPLICATION
indexing, b-tree, lsm-tree, sstable                            → § INDEXING
consistent hashing, virtual nodes, ring                        → § CONSISTENT HASHING
blob storage, s3, object store                                 → § BLOB STORAGE

## G3 · Caching  (cheatsheet-g3-caching.md)
cache aside, read through, write through, write behind         → § CACHE STRATEGIES
eviction, lru, lfu, ttl                                        → § EVICTION
redis, in-memory, data structures                              → § REDIS PATTERNS
cdn, edge cache, cache-control, invalidation                   → § CDN
hot key, thundering herd, cache stampede, dogpile              → § CACHE FAILURE MODES

## G4 · Messaging & Async  (cheatsheet-g4-messaging.md)
message queue, producer consumer, ack, dlq                     → § MESSAGE QUEUE
kafka, partition, offset, consumer group, at-least-once        → § KAFKA
pub sub, fanout, topic, subscriber                             → § PUB-SUB
async processing, job queue, worker, retry, backoff            → § ASYNC WORKERS
event sourcing, event log, replay                              → § EVENT SOURCING

## G5 · Distributed Systems  (cheatsheet-g5-distributed.md)
cap theorem, consistency availability partition                → § CAP
consistency models, strong, eventual, linearizable, causal     → § CONSISTENCY MODELS
consensus, raft, paxos, leader election                        → § CONSENSUS
distributed transactions, 2pc, saga, outbox pattern            → § DISTRIBUTED TRANSACTIONS
clock, vector clock, lamport, ntp skew                         → § CLOCKS
circuit breaker, retry, timeout, bulkhead                      → § RESILIENCE PATTERNS

## G6 · Scale & Infrastructure  (cheatsheet-g6-scale.md)
load balancing, round robin, least connections, consistent hash → § LOAD BALANCING
horizontal vs vertical scaling                                  → § SCALING STRATEGY
microservices, service mesh, api gateway, sidecar              → § MICROSERVICES
service discovery, dns, heartbeat, health check                → § SERVICE DISCOVERY
back-of-envelope, qps, storage, bandwidth estimation           → § ESTIMATION FORMULAS

## G7 · Feed & Social Systems  (cheatsheet-g7-social.md)
fan-out on write, push model, precompute feed                  → § FAN-OUT WRITE
fan-out on read, pull model, merge at read time                → § FAN-OUT READ
hybrid fan-out, celebrity problem, follower threshold          → § HYBRID FAN-OUT
notification system, push, pull, email, sms                    → § NOTIFICATIONS
activity feed, ranking, recency, engagement score              → § FEED RANKING

## G8 · Search & Analytics  (cheatsheet-g8-search-analytics.md)
search, inverted index, tf-idf, elasticsearch                  → § SEARCH
typeahead, trie, prefix search, autocomplete                   → § TYPEAHEAD
analytics pipeline, batch vs stream, lambda architecture       → § ANALYTICS
time series, metrics, aggregation, downsampling                → § TIME SERIES
data warehouse, olap vs oltp, columnar storage                 → § DATA WAREHOUSE
