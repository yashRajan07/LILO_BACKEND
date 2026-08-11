# 🪄 LILO Voice Assistant & Parent Portal

Modular repository containing the **LILO Backend** (FastAPI & Pipecat AI server) and **LILO Frontend** (Vite + React Parent Portal).

---

## 📁 Repository Structure

```
lilo/
├── lilo-backend/             # FastAPI voice pipeline & parent REST API
│   ├── main.py               # Application entry point
│   ├── websocket_handler.py   # Handshake protocol & connection lifecycle
│   ├── parent_api.py         # Parent portal REST API router
│   ├── database.py           # SQLite database persistence layer
│   ├── config/               # System settings & prompts
│   ├── pipeline/             # Pipecat processing graph & custom blocks
│   ├── services/             # STT (Sarvam), LLM (OpenAI), TTS (Sarvam/ElevenLabs)
│   ├── transports/           # ESP32 WebSocket transport implementation
│   └── utils/                # Audio rate controller & Opus encoder utilities
└── lilo-frontend/            # Vite + React Parent Portal SPA
    ├── src/
    │   ├── pages/            # Dashboard, Child Profile, Learning Controls, Schedules, Reports
    │   ├── components/       # Shared glassmorphic Layout & Sidebar
    │   ├── api.ts            # REST API client
    │   └── index.css         # Tailwind CSS design system
    ├── vite.config.ts        # Vite configuration & /api proxy to backend
    └── package.json          # Node dependencies
```

---

## 🚀 Running the Project

### 1. Start the Backend Server (`lilo-backend`)
```bash
cd lilo-backend
python -m venv venv
.\venv\Scripts\activate      # On Windows
# source venv/bin/activate    # On Linux/macOS
pip install -r requirements.txt
python main.py
```
*The FastAPI backend will start on `http://localhost:8000`.*

### 2. Start the Parent Portal Frontend (`lilo-frontend`)
```bash
cd lilo-frontend
npm install
npm run dev
```
*The Vite React app will start on `http://localhost:5173`.*

---

## 🐳 Docker Deployment (Both Frontend & Backend)

Run both the FastAPI voice backend and the React Parent Portal together with a single command:

```bash
docker compose up --build
```

- **Parent Portal Frontend**: `http://localhost:5173`
- **FastAPI Backend & API**: `http://localhost:8000`
- **ESP32 WebSocket Endpoint**: `ws://localhost:8000/ws`

