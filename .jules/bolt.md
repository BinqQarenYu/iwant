## 2024-04-06 - [Backend] Motor Async Aggregation Pipelines over App-Side Loops
**Learning:** In the FastAPI/Motor stack, performing application-side loops with `await find_one()` inside them (N+1 queries) creates significant bottlenecks because each iteration incurs round-trip latency to the database, even when using async methods.
**Action:** Always prefer MongoDB `$lookup` and `$unwind` aggregation pipelines offloaded to the database to combine related documents in a single O(1) query, rather than loading data and matching in application memory.
