# System Design Fundamentals Resources

## Knowledge

- [Course: Grokking the Fundamentals of System Design (Educative)](https://www.educative.io/courses/grokking-system-design-fundamentals)
  The course this workspace tracks. 40 lessons / ~8h. Strong on distributed-systems theory: time, event ordering, consistency models, CAP/PACELC, failure types, retries/backoff/idempotency. Use for: lesson sequencing and the "fundamentals" scope.
- [Book: _Designing Data-Intensive Applications_ by Martin Kleppmann (O'Reilly)](https://dataintensive.net/)
  The primary source for almost everything in Section 2 & 4. Ch. 5 replication, Ch. 6 partitioning, Ch. 7 transactions, Ch. 8 trouble with distributed systems, Ch. 9 consistency & consensus. Use for: the authoritative version of any claim a lesson makes.
- [GitHub: donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer)
  Broad, well-reviewed reference. Use for: quick definitions, CAP summary, back-of-envelope numbers, Anki decks.
- [GitHub: ashishps1/awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources)
  Curated link farm. Use for: finding a deeper article on one narrow concept.
- [Article: "Please stop calling databases CP or AP" — Martin Kleppmann](https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html)
  Why CAP is narrower than people think, and why PACELC exists. Primary source for lesson 0001.
- [Paper: "CAP Twelve Years Later" — Eric Brewer (IEEE)](https://sites.cs.washington.edu/tcss558/2020/assets/papers/week5-brewer-cap-12-years.pdf)
  Brewer's own walk-back of the "pick 2 of 3" framing. Use for: the nuance that C and A are not binary.
- [Note: "PACELC theorem" — Daniel Abadi](https://dbmsmusings.blogspot.com/2010/04/problems-with-cap-and-yahoos-little.html)
  Origin of PACELC. Use for: the latency-vs-consistency half that CAP ignores.

## Wisdom (Communities)

- [r/ExperiencedDevs](https://reddit.com/r/ExperiencedDevs) and [r/cscareerquestions](https://reddit.com/r/cscareerquestions) (SD interview threads)
  Use for: what MAANG Staff loops actually probe, calibration on real debriefs.
- [Hello Interview — System Design](https://www.hellointerview.com/learn/system-design) community + written guides
  Ex-MAANG interviewers. Use for: Staff-vs-Senior bar calibration, mock partners.
- [Discord/Blind] system design interview groups
  Use for: live mock partners. (User to confirm whether they want to join.)

## Gaps
- No vetted resource yet on clock skew / hybrid logical clocks at interview depth — find one before lesson on "Time in Distributed Systems".
- Need a good single source on quorum math (R + W > N) tuned for interviews.
