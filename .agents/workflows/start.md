---
description: Start the KainTayo development server (Frontend and Backend) with Likha Tech Simulation HUD
---

// turbo-all
1. Ensure dependencies are present
   - Frontend: `f:\012A_Github\iwant\frontend`
   - Backend: `f:\012A_Github\iwant\backend`

2. Start the Backend (FastAPI Order/Sim Engine)
   - Open a terminal
   - Navigate to `f:\012A_Github\iwant\backend`
   - Run `python -m uvicorn server:app --reload --port 8000`
   - Check if MONGO_URL and DB_NAME are set in environment or a .env file

3. Start the Frontend (React with Magic OTP & Ghost Orders)
   - Open a terminal
   - Navigate to `f:\012A_Github\iwant\frontend`
   - Run `npm.cmd start` (uses craco)
   - Check if REACT_APP_BACKEND_URL is set in environment (default: http://localhost:8000)

4. Open the apps
   - Frontend: http://localhost:3000 (Click the top-right chevron to open Simulation HUD)
   - Backend API Docs: http://localhost:8000/docs (Simulate endpoints available)
