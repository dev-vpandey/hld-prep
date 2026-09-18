# Teaching Notes

## User preferences
- Comms in chat: caveman-ultra (global CLAUDE.md). Lessons/docs: normal full prose.
- Staff Engineer @ MAANG target. Java + strong DSA. Do not re-teach data structures, big-O, basic threading.
- Learns well from: concrete client-visible effects, failure scenarios, trade-off tables. Wants to be pushed ("desirable difficulty").
- Tables: user's formatting rule wants Unicode box-drawing in *chat*. In HTML lessons use real `<table>`.

## Workspace
- Lives at `hld-prep/teach/`. Separate from the `notes/` coaching cards and SRS.
- Complements the hld-prep coach: fundamentals here, full designs via `/start-hld`, revision via `/review-hld`.

## Lesson design
- Keep to ~1 win each, <10 min. Retrieval quiz every lesson. Space + interleave old concepts into new quizzes.
- Every lesson: 1 primary source, citations inline, "ask your teacher" reminder.

## Sequencing plan
User wants to follow the Educative course order lesson-by-lesson, one teach lesson per course lesson.
CAP/PACELC was pulled forward as 0001 (highest leverage). Then course order resumed from Section 1.

Section 1 — DONE (0002–0005): what is SD · SD vs architecture · monolith/micro · FR vs NFR.
Section 2 — NEXT: time/clocks · event ordering & consistency models · coordination · failure types ·
  availability & fault tolerance · retries/backoff/idempotency · partitions · processes/threads · observability.
Sections 3–7 after. Skip Section 5 (security) per MISSION out-of-scope.

Working method: WebFetch each course lesson URL (returns a compressed summary, not verbatim — fine for
grounding), cross-check against DDIA / primary source, then write a tight Staff-framed teach lesson.
Do one section per turn, check in after each.
