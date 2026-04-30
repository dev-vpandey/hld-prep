# G6 · Scale & Infrastructure

---

## § LOAD BALANCING

╔═══════════════════════════╦══════════════════════════════════════════════════════╗
║ Algorithm                 ║ Best for                                             ║
╠═══════════════════════════╬══════════════════════════════════════════════════════╣
║ Round robin               ║ Homogeneous servers, stateless requests              ║
║ Least connections         ║ Variable request duration (long-lived connections)   ║
║ Weighted round robin      ║ Heterogeneous server capacity                        ║
║ IP hash / consistent hash ║ Session stickiness, cache locality                  ║
╚═══════════════════════════╩══════════════════════════════════════════════════════╝

**L4 vs L7:** L4 routes on IP/TCP (faster), L7 routes on HTTP headers/path (smarter, SSL termination)
**Health checks:** LB removes unhealthy nodes from rotation automatically

---

## § SCALING STRATEGY

**Vertical:** bigger machine → simpler but has a ceiling and single point of failure
**Horizontal:** more machines → requires stateless services or external session store

**Stateless is the prerequisite for horizontal scale** — move session/state to Redis or DB.

**Scale bottlenecks in order:**
1. App servers → horizontal scale behind LB
2. DB reads → read replicas + cache
3. DB writes → sharding
4. Hot data → caching layer
5. Static assets → CDN

---

## § MICROSERVICES

**API Gateway:** single entry point — auth, rate limiting, routing, SSL termination
**Service mesh:** sidecar proxy (Envoy) handles inter-service mTLS, retries, tracing
**Service discovery:** services register on startup; clients query registry (Consul, Eureka) or use DNS
**When NOT to use:** early-stage product, small team — monolith first, extract services at seams

---

## § ESTIMATION FORMULAS

```
QPS    = DAU × actions_per_day / 86400
Peak   = QPS × 2–3× (peak multiplier)

Storage (1 yr) = writes_per_day × record_size × 365
Bandwidth      = peak_reads_per_s × avg_response_size

1 KB = 10^3 B  |  1 MB = 10^6 B  |  1 GB = 10^9 B  |  1 TB = 10^12 B
1M req/day ≈ 12 req/s  |  1B req/day ≈ 12K req/s
```

**Useful numbers:**
- SSD random read: ~0.1ms · Network round trip same DC: ~0.5ms · Cross-region: ~150ms
- MySQL: ~1K–5K writes/s (single leader) · Kafka: millions/s · Redis: ~100K ops/s
