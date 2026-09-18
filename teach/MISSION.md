# Mission: System Design Fundamentals (Grokking, Educative)

## Why
Pass Staff-level System Design interviews at MAANG. The bar there is not "name the components" — it is failure-mode reasoning and defensible trade-offs under scale. This workspace builds the fundamentals layer (consistency, CAP/PACELC, replication, partitioning, coordination, communication) so the hld-prep coaching sessions have solid ground to push depth from.

## Success looks like
- Given any storage/coordination choice in a design, state the exact trade-off it makes and what the other direction would buy.
- Reason correctly about behaviour under network partition, node loss, and clock skew without hedging.
- Use CAP and PACELC precisely (not as slogans) to justify a data-store pick.
- Explain consistency models (linearizable / causal / eventual / read-your-writes) with concrete client-visible effects.

## Constraints
- Prep is time-boxed inside a 4-month MAANG plan (see [[project_prep_schedule]]). Lessons must be short — one tangible win each.
- Java / strong DSA background. Skip language basics, OS threading basics can go fast.
- Caveman-ultra comms in chat; lessons themselves are full-prose HTML.

## Out of scope (for now)
- Full end-to-end design walkthroughs — that is what the hld-prep coach (`/start-hld`) is for.
- Security section of the course.
- SRS/revision mechanics — handled by `/review-hld`.
