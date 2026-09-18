# Starting point: strong DSA, interview-framed, fundamentals layer thin

User is a MAANG Staff-Engineer candidate with a strong Java/DSA background and an existing hld-prep coaching setup (SRS cards, cheatsheets G0–G8). Prior knowledge: back-of-envelope estimation (own cheatsheet, SRS stage 2). Everyday algorithms/data-structures/big-O and basic OS threading do not need teaching.

Gap this workspace targets: the distributed-systems fundamentals that Staff loops probe for — precise consistency/CAP/PACELC reasoning, replication and partitioning failure modes, coordination, retries/idempotency. Cheatsheet G5 has a bare "CAP" bullet but nothing on PACELC or precise linearizability definitions — treat that as the true floor.

Implication: start at Section 2 of the course (highest interview leverage), teach around client-visible effects and trade-off costs, push hard (user wants desirable difficulty). Full end-to-end designs stay with the `/start-hld` coach, not here. See [[MISSION]].
