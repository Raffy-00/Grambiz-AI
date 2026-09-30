# GramBiz AI — Hyper-Local Business Advisory & Smart Scheme Assistant

**AI-Powered Hyper-Local Business Feasibility & Financial Advisory Platform for Rural Entrepreneurs**

GramBiz AI is a full-stack, production-quality platform designed for first-time rural and semi-urban entrepreneurs. It answers the fundamental question:

> **“I have this much money, I live in this location, and I want to start this business. Is this business financially feasible and locally viable, and what loan structure may apply?”**

---

## 🌟 Key Features

1. **AI Business Feasibility Engine**: Evaluates local market potential, catchment population reach (5km & 10km radius), competitor density, tailored SWOT analysis, and local risk threats with concrete mitigations.
2. **7-Dimensional Feasibility Score (0–100)**: Rates ventures across Market Potential, Competition Level, Capital Adequacy, Profit Margin, Risk Resilience, Experience Fit, and Scalability.
3. **Smart Scheme Router**: Automatically routes project costs to matching concessional government schemes:
   - **Micro Finance Scheme** (Project cost ≤ ₹1.40 Lakh): 6.5% interest, 3-yr tenure, 3-mo moratorium.
   - **Term Loan Scheme** (Project cost > ₹1.40 Lakh to ₹50 Lakh): 8.0% interest, 7-yr tenure, 6-mo moratorium.
4. **EMI & Repayment Calculator**: Exact monthly installment calculation, interest breakdowns, total repayment figures, and moratorium relief schedules.
5. **Working Capital Reserve Estimator**: Itemizes monthly operating costs (rent, raw materials, electricity, labour, transport, marketing) and recommends a 3-month cash cushion.
6. **Business Budget Allocator**: Visual pie chart allocation for equipment, inventory, infrastructure, working capital, marketing, and contingency.
7. **20-Section Printable PDF Feasibility Report**: Printable/downloadable business feasibility report formatted for bank presentations and district industry officers.
8. **Context-Aware AI Assistant**: Conversational advisor with pre-set prompt chips and multilingual support (English, Hindi, Tamil).
9. **Hackathon Demo Mode**: 1-click quick-launch demo scenarios for Dairy, Textile, Food Processing, and Retail Kirana businesses.

---

## 🛡️ Financial Disclaimer

> **“Estimated financial structure based on the provided scheme parameters. Final loan eligibility and sanction are subject to the applicable authority, eligibility criteria, documentation, verification, and approval.”**

---

## 🏗️ Technical Architecture

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Vanilla CSS + Tailwind CSS (Custom palette, responsive grid, print styles)
- **Charts**: Recharts (Radar/Bar score metrics, Donut budget allocations)
- **Icons**: Lucide React
- **i18n**: Built-in multilingual engine (English, Hindi, Tamil)

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy + SQLite (PostgreSQL production compatible)
- **Calculators**: Custom Python financial engine handling margin allocation, scheme routing, loan caps, EMI formulas, working capital, and budget validation.
- **Testing**: Pytest automated unit & API test suite.

---

## 📁 Clean Monorepo Architecture

```text
GramBiz AI/
├── run.py                    # Unified Single-Port Launcher (builds UI + serves API & frontend on :8000)
├── requirements.txt          # Python dependencies (FastAPI, Uvicorn, SQLAlchemy, Groq, Pytest)
├── vercel.json               # Root cloud deployment configuration (Fullstack + SPA rewrites)
├── .env.example              # Environment variables template
├── .gitignore                # Global git ignore rules
├── README.md                 # Project documentation
│
├── api/                      # Vercel Serverless Function entrypoint
│   └── index.py              # Serverless bridge to backend/app/main.py
│
├── backend/                  # FastAPI Application & Business Engines
│   ├── requirements.txt      # Backend Python dependencies (synchronized with root)
│   ├── grambiz.db            # Canonical persistent SQLite database (73+ assessments)
│   ├── app/
│   │   ├── main.py           # FastAPI server entrypoint & SPA static asset mounter
│   │   ├── api/routers/      # AI, Assessment, Business, Financial, Location, Schemes
│   │   ├── calculators/      # Financial structures, schemes routing, and EMIs
│   │   ├── database/         # Database models, connection sessions, and migrations
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Feasibility engine, demographic & places services, Groq AI
│   └── tests/                # Automated pytest suite (21 unit & endpoint tests)
│       ├── test_api.py
│       └── test_calculators.py
│
├── frontend/                 # React 18 + Vite + TypeScript Client
│   ├── package.json          # Node dependencies & build scripts
│   ├── vite.config.ts        # Vite bundle & proxy configuration
│   ├── tailwind.config.js    # Tailwind theme & design tokens
│   ├── tsconfig.json         # TypeScript compiler configuration
│   ├── public/               # Static assets, Web App Manifest & Service Worker
│   └── src/
│       ├── components/       # UI Pages, Guided Flows, Radar Charts & Chatbot
│       │   └── mobile/       # Native-feel Mobile UX Views
│       ├── services/         # Backend API client with intelligent client fallback
│       ├── i18n/             # Multilingual translations (English, Hindi, Tamil, Telugu, etc.)
│       ├── data/             # Business catalog, demo scenarios, schemes registry
│       └── types/            # TypeScript domain interfaces
│
└── scratch/                  # Temporary developer scripts & migration tools (git-ignored)
    └── README.md
```

---

## 🚀 Quick Setup & Running

### Option A: Unified Full-Stack Server (Recommended)
Run both the React frontend and FastAPI backend on a single port (`http://localhost:8000`):

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the unified launcher
python run.py
```
This automatically verifies/builds the frontend bundle and starts the unified server at `http://localhost:8000/`.

---

### Option B: Separate Development Servers

#### 1. Backend Server (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m pytest -o pythonpath=backend backend/tests
uvicorn app.main:app --reload --port 8000
```
- API Documentation: `http://localhost:8000/docs`
- AI Status Endpoint: `http://localhost:8000/api/ai/status`

#### 2. Frontend Server (Vite Dev Server)
```bash
cd frontend
npm install
npm run dev
```
- Frontend Dev URL: `http://localhost:5173` (or configured port)

---

## 🧪 Testing & Verification

Run the complete automated backend test suite:
```bash
python -m pytest -o pythonpath=backend backend/tests
```

Run frontend build & TypeScript verification:
```bash
cd frontend
npm run build
```

