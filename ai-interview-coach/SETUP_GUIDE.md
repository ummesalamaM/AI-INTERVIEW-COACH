# AI Mock Interview Coach — Complete Build Guide

## What This Project Does

A full-stack AI-powered interview simulator where users:
1. Choose their target role, company, difficulty, and interview type
2. Answer 5 AI-generated questions by **voice** (mic) or **text**
3. Get real-time feedback: score, filler words, WPM, relevance, depth, clarity
4. See a radar chart + bar chart results dashboard
5. **Download a professional PDF report** with per-question analysis

**Tech Stack:**
- Backend: Python · FastAPI · Anthropic Claude API · Deepgram (speech-to-text) · ReportLab (PDF)
- Frontend: React · TypeScript · Vite · TailwindCSS · Recharts
- Real-time: WebM audio streaming via browser MediaRecorder API

---

## Project Structure

```
ai-interview-coach/
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── api/
│   │   │   ├── interview.py          # POST /api/interview/start
│   │   │   ├── feedback.py           # POST /api/feedback/audio  /text
│   │   │   └── report.py             # GET  /api/report/summary  /pdf
│   │   ├── core/
│   │   │   ├── config.py             # Env vars via pydantic-settings
│   │   │   └── session_store.py      # In-memory session management
│   │   ├── models/
│   │   │   └── schemas.py            # Pydantic request/response models
│   │   └── services/
│   │       ├── llm_service.py        # Claude API: question gen + analysis
│   │       ├── transcription_service.py  # Deepgram speech-to-text
│   │       └── report_service.py     # ReportLab PDF generation
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── main.tsx                  # React entry point + router
    │   ├── index.css                 # Global styles + animations
    │   ├── pages/
    │   │   ├── Home.tsx              # Setup form
    │   │   ├── Interview.tsx         # Recording + feedback page
    │   │   └── Results.tsx           # Charts + PDF download
    │   ├── components/
    │   │   └── FeedbackCard.tsx      # Per-answer feedback UI
    │   ├── hooks/
    │   │   └── useAudioRecorder.ts   # Browser MediaRecorder hook
    │   └── utils/
    │       └── api.ts                # Axios API client
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    └── package.json
```

---

## Step 1 — Get API Keys (Free Tiers Available)

### Anthropic Claude API (Required)
1. Go to https://console.anthropic.com
2. Sign up / log in → click **API Keys** → **Create Key**
3. Copy the key — starts with `sk-ant-...`
4. Free $5 credit on signup (enough for 100+ interviews)

### Deepgram (Required for voice mode)
1. Go to https://console.deepgram.com
2. Sign up → **API Keys** → **Create a New API Key**
3. Copy the key
4. Free 12,000 minutes/year on free tier

---

## Step 2 — Backend Setup

```bash
# Navigate to backend
cd ai-interview-coach/backend

# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in your .env file
cp .env.example .env
```

Open `.env` and add your keys:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
DEEPGRAM_API_KEY=your-deepgram-key-here
```

Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

You should see: `Uvicorn running on http://127.0.0.1:8000`

Test it works:
```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

---

## Step 3 — Frontend Setup

Open a **new terminal** (keep backend running):

```bash
cd ai-interview-coach/frontend

# Install all packages
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 in your browser.

The Vite proxy forwards `/api/*` → `http://localhost:8000` so no CORS issues.

---

## Step 4 — Run Your First Interview

1. Open http://localhost:5173
2. Select: Role → **Software Engineer**, Company → **Google**, Type → **Technical**, Difficulty → **Medium**
3. Click **Start Interview** — questions are generated via Claude
4. On the interview page, click the **mic button** to record your answer
5. Click **stop** → click **Analyze**
6. See your score, filler words, WPM, and detailed feedback
7. After 5 questions → **View Full Report** for charts and PDF download

---

## Step 5 — Build for Production

```bash
# Build frontend
cd frontend
npm run build
# Output in frontend/dist/

# Serve backend in production
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Free Deployment Options

**Backend → Render.com**
1. Push to GitHub
2. Go to render.com → New → Web Service → connect repo
3. Set: Build Command = `pip install -r requirements.txt`
4. Set: Start Command = `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env vars: `ANTHROPIC_API_KEY`, `DEEPGRAM_API_KEY`

**Frontend → Vercel**
1. `npm install -g vercel`
2. `cd frontend && vercel`
3. Set env var: `VITE_API_URL=https://your-backend.onrender.com`
4. Update `vite.config.ts` proxy target to your Render URL

---

## How to Explain This in an Interview

**"Tell me about a project you're proud of"**

> "I built an end-to-end AI mock interview coach from scratch. The system uses the Anthropic Claude API to generate role-specific questions, Deepgram's Nova-2 model for real-time speech-to-text transcription via WebSockets, and a custom NLP pipeline to detect filler words and measure speaking pace. On the backend I used FastAPI with a session-based architecture. The frontend is React with TypeScript, featuring a live recording interface using the browser's MediaRecorder API. The system generates personalized PDF reports using ReportLab. I deployed it on Render and Vercel."

**Key talking points:**
- "Real-time audio processing pipeline using MediaRecorder → Deepgram → Claude"
- "Stateless session store — designed to swap with Redis for scale"
- "LLM prompt engineering to get structured JSON output from Claude"
- "Radar chart + bar chart analytics built with Recharts"
- "End-to-end: from mic input to PDF download in under 60 seconds"

---

## Extending This Project (for extra resume points)

| Feature | How |
|---|---|
| User auth + history | Add JWT auth + PostgreSQL with SQLAlchemy |
| Live transcription | WebSocket + Deepgram streaming API |
| Video recording | Replace audio with MediaRecorder video/webm |
| Leaderboard | Store scores in DB, add rankings page |
| Email report | SendGrid API to email PDF after session |
| Docker | Add Dockerfile + docker-compose.yml |
| Deploy on AWS | EC2 + S3 for audio storage + RDS for DB |

---

## Troubleshooting

**"Failed to generate questions"**
→ Check ANTHROPIC_API_KEY in `.env`, make sure the venv is activated

**"Could not transcribe audio"**
→ Check DEEPGRAM_API_KEY, or switch to Text Mode to bypass transcription

**Mic not working**
→ Browser needs HTTPS for mic in production. On localhost it works on HTTP.

**CORS error**
→ Make sure backend is running on port 8000 and frontend proxy is set correctly in `vite.config.ts`

**"Module not found" errors**
→ Run `pip install -r requirements.txt` again with venv activated
