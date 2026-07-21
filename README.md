# AcuraX — Multi-Agent AI Orchestration Suite

## Project Overview

AcuraX is a full-stack AI agent orchestration platform with a FastAPI backend, PostgreSQL database (pgvector-ready), and a Next.js 14 frontend.

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local dev without Docker)
- Node.js 18+

### Using Docker (Recommended)

```bash
# Start all services (postgres, redis, backend)
docker-compose up -d

# Wait for postgres to be ready, then seed the database
docker-compose exec backend python seed.py
```

The backend API will be available at: **http://localhost:8000**  
API docs (Swagger UI): **http://localhost:8000/docs**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be at: **http://localhost:3000**

---

## Local Python Development (Without Docker)

```bash
# 1. Set up a virtual environment
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy environment file
copy ..\\.env.example .env  # Windows
# cp ../.env.example .env  # macOS/Linux
# Edit .env with your local PostgreSQL/Redis connection strings

# 4. Run database migrations (optional if using startup auto-create)
alembic upgrade head

# 5. Seed demo data
python seed.py

# 6. Start the backend
uvicorn main:app --reload --port 8000
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Manager | admin@acurax.ai | AcuraXPassword2026! |
| Employee | jane@acurax.ai | AcuraXPassword2026! |
| Employee | arun@acurax.ai | AcuraXPassword2026! |

---

## Architecture

```
AcuraX/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── api/v1/   # REST route controllers
│   │   ├── core/     # Security, JWT, Redis
│   │   ├── db/       # Session, models, migrations
│   │   ├── models/   # SQLAlchemy models
│   │   └── schemas/  # Pydantic schemas
│   ├── main.py       # FastAPI entry point
│   ├── seed.py       # Database seeder script
│   └── requirements.txt
├── frontend/         # Next.js 14 frontend
│   ├── src/
│   │   ├── app/      # App Router pages
│   │   ├── components/
│   │   ├── lib/api.ts # API client (connects to backend)
│   │   └── store/
│   └── .env.local
├── docker-compose.yml
└── .env.example
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user + team |
| POST | `/api/v1/auth/login` | Login, get JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Invalidate refresh token |
| GET | `/api/v1/auth/me` | Get current user |
| GET | `/api/v1/users/me` | User profile |
| PATCH | `/api/v1/users/me` | Update profile |
| PATCH | `/api/v1/users/me/password` | Change password |
| GET | `/api/v1/users/team/members` | List team members (manager) |
| POST | `/api/v1/users/team/invite` | Invite member (manager) |
| GET | `/api/v1/agents` | List agents |
| POST | `/api/v1/agents` | Create agent (manager) |
| PATCH | `/api/v1/agents/{id}` | Update agent (manager) |
| DELETE | `/api/v1/agents/{id}` | Delete agent (manager) |
| POST | `/api/v1/agents/{id}/run` | Trigger agent run |
| GET | `/api/v1/agents/{id}/runs` | Run history |
| GET | `/api/v1/documents` | List documents |
| POST | `/api/v1/documents` | Upload document |
| GET | `/api/v1/knowledge-articles` | List knowledge articles |
| POST | `/api/v1/knowledge-articles` | Create article (manager) |
| GET | `/api/v1/chats` | List chats |
| POST | `/api/v1/chats` | Create chat |
| POST | `/api/v1/chats/{id}/messages` | Send message |
| GET | `/api/v1/analytics/overview` | Analytics (manager) |
| GET | `/api/v1/search?query=...` | Search docs/articles |
| GET | `/api/v1/settings` | Get settings |
| POST | `/api/v1/settings` | Save settings |

---

## Future Work (Not Implemented Yet)

- [ ] Real LLM calls (OpenAI/Anthropic/Claude)
- [ ] Semantic search with pgvector embeddings
- [ ] Document parsing and chunking (PyPDF2, python-docx)
- [ ] Celery workers for scheduled jobs
- [ ] Real cost/token tracking
- [ ] Email invitation flow
