## 2025-02-18 - [Offload Computation & Parallelize DB Queries]
**Learning:** Fetching thousands of documents into application memory (e.g., using `.to_list(10000)`) just to calculate a sum causes high memory usage and latency. Executing multiple independent database queries sequentially significantly increases the total round-trip time.
**Action:** Use MongoDB aggregation pipelines (like `$group` and `$sum`) to offload computation to the database. Use `asyncio.gather` to execute independent queries concurrently, reducing latency.
