## 2024-05-19 - Debounce Search Input to Reduce API Calls
**Learning:** Typing in a search box triggering immediate API calls on every keystroke causes a flood of requests.
**Action:** Use a debounced state to delay the API request until the user pauses typing.
