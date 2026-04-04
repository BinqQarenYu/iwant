## 2024-04-04 - [React Render Optimization]
**Learning:** In React, passing derived data like `menuByCategory` (which uses O(N) `Array.reduce`) directly into the component body causes it to be recalculated every single time the component re-renders (e.g. state changes like updating item quantity, or entering special instructions).
**Action:** Use `useMemo` to cache the result of expensive categorizations or filtering operations so they only re-run when the source array (e.g., `menu`) actually changes.
