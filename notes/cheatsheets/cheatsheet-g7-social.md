# G7 · Feed & Social Systems

---

## § FAN-OUT WRITE

**What:** on post, pre-compute and push post into every follower's feed (write time)
**Read:** just read pre-built feed from cache/DB → very fast
**Cost:** N followers = N writes per post → expensive for high-follower users
**Storage:** feed table per user (userId, postId, timestamp) or cached list in Redis

---

## § FAN-OUT READ

**What:** don't pre-build feeds; at read time, fetch posts from all followed users and merge
**Read:** expensive (N followed users × fetch + merge + sort)
**Write:** cheap — just write the post once
**Good for:** low-follower counts, infrequent reads, or when recency ranking is complex

---

## § HYBRID FAN-OUT

**Problem:** fan-out write breaks for celebrities (10M followers = 10M writes per post)
**Solution:**
- Normal users (<threshold, e.g., 10K followers) → fan-out write (push)
- Celebrity users (>threshold) → fan-out read (pull at read time)
- At feed load time: merge pre-built feed + live-fetched celebrity posts
**Who uses it:** Twitter (Flock), Instagram

---

## § NOTIFICATIONS

**Channels:** push (APNs/FCM), SMS, email, in-app
**Flow:** event → notification service → channel router → third-party provider → device
**Reliability:** queue-backed (Kafka/SQS) — never fire-and-forget; retry on failure
**Deduplication:** idempotency key on notification to avoid duplicate sends
**User preferences:** respect opt-out per channel per notification type — check before send
**Rate limiting:** batch digest notifications to avoid spamming (e.g., "5 people liked your post")

---

## § FEED RANKING

**Simple:** reverse chronological (timestamp DESC)
**Scored:** weighted score = recency_weight × time_decay + engagement_score + social_graph_weight
**ML ranking:** feature vector → model inference → score → sort (Instagram, TikTok)
**Pagination:** cursor-based on (score, postId) — not offset (offset breaks with new inserts)
**Cache strategy:** cache top N items per user; re-rank on cache miss or TTL expiry
