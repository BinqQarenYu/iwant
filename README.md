# KainTayo - Urdaneta City Food Delivery Simulator

![KainTayo Banner](https://img.shields.io/badge/Status-Development-orange?style=for-the-badge) ![Tech-FastAPI](https://img.shields.io/badge/Backend-FastAPI-green?style=for-the-badge) ![Tech-React](https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge)

**KainTayo** is a high-fidelity logistics and food delivery simulation platform tailored for Urdaneta City. It allows users to simulate the entire lifecycle of an order—from customer selection to rider delivery—with built-in simulation tools for "Pabili" requests and "Ghost Orders".

---

## 🚀 Features

### 👤 Multi-Role Dashboard
- **Customer**: Browse 50+ hyper-local stores, enjoy "Sulong Promos," and place orders or "Pabili" requests.
- **Merchant**: Manage virtual menus, track incoming orders, and simulate store preparation.
- **Rider (Driver)**: Accept delivery or pabili requests, simulate real-time route updates, and track earnings.

### 🛠️ Simulation Engine (SimHUD)
- **Ghost Order Injection**: Create synthetic orders to test peak-load rider performance.
- **Pabili Simulator**: Inject custom errands (e.g., "Buy medicine at Mercury Drug") directly into the driver queue.
- **Magic OTP**: Authentication bypass for development (Code: `123456`).

### 🍱 Localized Experience
- **Curated Stores**: Pre-seeded with 50 local establishments and authentic menus.
- **Coverage Areas**: Configured for Urdaneta City (Primary), Binalonan, Villasis, Manaoag, and more.
- **Bilingual Interface**: Foundations for English and Tagalog support.

---

## 🏗️ Project Structure

```text
iwant/
├── backend/                # FastAPI Order & Simulation Engine
│   ├── server.py           # Main entry point (Routes, Models, DB Logic)
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Database & Secret configurations
├── frontend/               # React / Tailwind CSS Web App
│   ├── src/
│   │   ├── components/     # UI Kit (SimHUD, Toaster, Layouts)
│   │   ├── pages/          # Role-specific dashboards (Customer, Driver, etc.)
│   │   ├── services/       # API Integration (Axios)
│   │   └── App.js          # Main Router & Provider setup
│   ├── public/             # Static assets
│   └── package.json        # Frontend scripts & dependencies
└── README.md               # You are here
```

---

## 🛠️ Setup & Local Development

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **MongoDB** (Running locally or on Atlas)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows
venv\Scripts\activate 
pip install -r requirements.txt
# Ensure .env is set with MONGO_URL
python -m uvicorn server:app --reload --port 8000
```
*Run `/seed` endpoint via Swagger docs at `http://localhost:8000/docs` to populate 50 stores.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
*The app will be available at `http://localhost:3000`.*

---

## 📋 TODO List / Roadmap

- [ ] **Real-Time Tracking**: Integrate WebSockets for live rider location on a map.
- [ ] **Payment Integration**: Implement GCash/Maya sandboxes.
- [ ] **Merchant Analytics**: Add revenue charts and "Hottest Dishes" tracking.
- [ ] **AI-Driven ETA**: Use simple heuristics to calculate delivery time based on rider density.
- [ ] **Mobile Responsive**: Optimize all dashboards for the "KainTayo App" feel on mobile.

---

## 🌐 GitHub Pages Simulation

To host the **frontend only** for UI demonstrations on GitHub Pages:

1.  **Install gh-pages**: `npm install gh-pages --save-dev` in the `frontend` directory.
2.  **Add Homepage**: Add `"homepage": "https://<your-username>.github.io/<repo-name>"` to `frontend/package.json`.
3.  **Deploy**: 
    ```bash
    npm run build
    npm run deploy
    ```
*Note: Since the backend is external, the simulation HUD can be updated in a future PR to use "Mock Mode" (LocalStorage) if no backend URL is detected.*

---

## 📄 License
Created by Likha Tech with Antigravity for the Urdaneta Logistics Initiative.
