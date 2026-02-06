# JobZoid (HireGuard)

**GitHub Repository:** [https://github.com/hishamaliasad7-cloud/fake-job-detection](https://github.com/hishamaliasad7-cloud/fake-job-detection)

## 🚀 Project Overview

**JobZoid** is an AI/ML powered **Applicant Protection System** that utilizes Machine Learning for **Job Authenticity Prediction** and behavioral analysis for **Energy Sink Detection**. It empowers job seekers to distinguish between real opportunities and deceptive "Ghost Jobs" or scams.

## 🚀 Deployment

### Backend (Python/FastAPI) - Recommended: [Render](https://render.com)

1.  Connect your GitHub repo to Render.
2.  Choose **Web Service**.
3.  Language: **Python**.
4.  Build Command: `pip install -r requirements.txt`
5.  Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (React/Vite) - Recommended: [Vercel](https://vercel.com)

1.  Connect your GitHub repo to Vercel.
2.  Project Type: **Vite**.
3.  Build Command: `npm run build`
4.  Output Directory: `dist`
5.  **Important**: Set Environment Variable `VITE_API_URL` to your Render backend URL.

### Chrome Extension (Manual Update)

Before using the extension in production:

1.  Open `extension/src/content.js`.
2.  Update the URL from `http://localhost:8000` to your **Render app URL**.
3.  Reload the extension in Chrome.

### 🛡 Impact

This system restores the balance of power in the hiring market, saving job seekers hundreds of hours of wasted effort and protecting them from the emotional toll of ghost jobs and recruitment scams.

## 🛠 Tech Stack

### Frontend

- **React + Vite / Vanilla JavaScript**: React for the dashboard, Vanilla JS for the extension.
- **Tailwind CSS**: Modern utility-first styling.
- **Chrome Extension (Manifest V3)**: ATS signal detection.

### Backend

- **Python with FastAPI**: High-performance core API and scoring engine.
- **SQLAlchemy**: Robust ORM for data persistence.
- **PostgreSQL / SQLite**: Scalable structured data storage.

## 📂 Project Structure

```text
JobZoid/
├── extension/           # HireGuard Chrome Extension
├── fastapi-backend/     # Python FastAPI API & Scoring Engine
├── frontend/            # React Dashboard UI
└── report/
    └── REPORT.md        # Comprehensive Project Report
```

## ⚙️ How it Works

1. **Passive Tracking:** The HireGuard extension listens for anonymized events (form inputs, submission signals) on ATS platforms (Greenhouse, Workday, etc.).
2. **Signal Aggregation:** Signals are hashed and sent to the backend to protect user privacy. No PII is stored.
3. **Scoring:** The backend calculates an **Energy Sink Score (0-100)**:
   - **0-30 (Apply Confidently):** Healthy hiring feedback loops.
   - **31-60 (Apply Cautiously):** Slower response patterns detected.
   - **61-100 (Avoid):** High effort required with minimal hiring signals.

## 🏃 Installation & Usage

### 1. Backend Setup (FastAPI)

```bash
cd fastapi-backend
# Recommended: Create a virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
python main.py
```

_Server will run at `http://localhost:8000`_

### 2. Chrome Extension

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer Mode".
3. Click "Load unpacked" and select the `extension/` folder.

### 3. Frontend Dashboard

```bash
cd frontend
npm install
npm run dev
```

## 🔐 Privacy Promise

- **No Resume Storage**: File contents are never accessed.
- **Anonymized Signals**: We track patterns, not individuals.
- **Minimal Retention**: Only metadata required for scoring is persisted.

---

**Project Mission:** “To empower job seekers with evidence-based data, making the global hiring market more efficient and transparent.”
