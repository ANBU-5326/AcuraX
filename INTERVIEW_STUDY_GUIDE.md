# AcuraX — Master Interview & Technical Study Guide

---

## 📋 Table of Contents
1. [Project Overview & Elevator Pitch](#1-project-overview--elevator-pitch)
2. [System Architecture & Data Flow](#2-system-architecture--data-flow)
3. [Technology Stack Breakdown](#3-technology-stack-breakdown)
4. [Database Models & Schema Relationships](#4-database-models--schema-relationships)
5. [Security & Authentication Architecture](#5-security--authentication-architecture)
6. [Multi-Role Access Control (RBAC)](#6-multi-role-access-control-rbac)
7. [Agent Orchestration Engine](#7-agent-orchestration-engine)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Top 15 Technical Interview Questions & Answers](#9-top-15-technical-interview-questions--answers)
10. [System Design & Production Scaling Roadmap](#10-system-design--production-scaling-roadmap)

---

## 1. Project Overview & Elevator Pitch

### What is AcuraX?
**AcuraX** is an enterprise-grade **Multi-Agent AI Orchestration & Productivity Suite** designed to bridge team workflows with LLM-powered agentic automation. It enables organizations to create, configure, schedule, and run specialized AI agents equipped with custom system prompts, temperature settings, and tool definitions—all protected by role-based access controls.

### 30-Second Elevator Pitch
> *"AcuraX is a full-stack Enterprise Multi-Agent AI Orchestration platform built with Next.js 14, FastAPI, PostgreSQL, and Redis. It allows managers to configure custom LLM agents with tool bindings and cron schedules, while employees run shared agents and interact via RAG-enabled chat interfaces. Security is enforced end-to-end via OAuth2 JWT token rotation, Redis token blacklisting, and role-based access control."*

---

## 2. System Architecture & Data Flow

```
                                ┌───────────────────────────────────────────┐
                                │           Next.js 14 Frontend             │
                                │  (App Router, TypeScript, TailwindCSS)    │
                                └─────────────────────┬─────────────────────┘
                                                      │ REST API / JSON
                                                      ▼
                                ┌───────────────────────────────────────────┐
                                │           FastAPI Python Backend          │
                                │    (OAuth2 + JWT, Pydantic, SQLAlchemy)   │
                                └──────────────┬──────────────┬─────────────┘
                                               │              │
                                       SQL queries            │ Cache / Tasks
                                               ▼              ▼
                                ┌──────────────────────┐   ┌─────────────────┐
                                │ PostgreSQL Database  │   │   Redis Cache   │
                                │  (pgvector Ready)    │   │ & Celery Queue  │
                                └──────────────────────┘   └─────────────────┘
```

### End-to-End Execution Flow:
1. **User Authentication**: User logs in at `/api/v1/auth/login`. FastAPI validates credentials using `bcrypt` and returns an HTTP Bearer Access Token (60 min) + Refresh Token (7 days).
2. **Role Verification**: Requests to protected endpoints pass through custom FastAPI dependencies (`get_current_user`, `require_manager`).
3. **Agent Management**: Managers create or update AI Agents (`model`, `temperature`, `system_prompt`, `tools`).
4. **Agent Run Trigger**: An Employee or Manager invokes `POST /api/v1/agents/{id}/run`. The backend validates authorization, creates an `AgentRun` log, updates token telemetry, and returns execution status.
5. **Analytics Aggregation**: The dashboard fetches real-time stats via `/api/v1/analytics/overview` aggregating team token consumption and active agent runs.

---

## 3. Technology Stack Breakdown

| Component | Technology | Rationale & Responsibility |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) | Server-Side Rendering (SSR), efficient route handling, modern React architecture. |
| **Frontend Language** | TypeScript | Strong static typing, compile-time error prevention, interface contracts. |
| **Styling** | TailwindCSS | Modern utility-first CSS, responsive layouts, dynamic theme styling. |
| **Backend Framework** | FastAPI (Python 3.11+) | Asynchronous execution (`async/await`), high throughput, auto OpenAPI docs. |
| **Data Validation** | Pydantic v2 | Strict request/response schema validation and type coercion. |
| **ORM & Database** | SQLAlchemy 2.0 + PostgreSQL | Relational persistence, declarative models, index optimization, UUID keys. |
| **Migrations** | Alembic | Version-controlled, trackable database schema evolutions. |
| **Caching & Queue** | Redis | Token blacklisting (logout), session cache, task broker for Celery. |
| **Auth & Encryption** | `python-jose` + `passlib[bcrypt]` | Cryptographic JWT verification, salted password hashing. |
| **Containerization** | Docker & Docker Compose | Uniform dev/prod environment deployment. |

---

## 4. Database Models & Schema Relationships

```
[Team] 1 ──── N [User] 1 ──── N [Agent] 1 ──── N [AgentRun]
                 │
                 ├────── N [ChatSession] 1 ──── N [ChatMessage]
                 │
                 └────── N [Document]
```

### Key Models (Defined in `backend/app/models/`):

1. **User (`user.py`)**:
   - `id` (UUID string), `email`, `full_name`, `hashed_password`, `role` (`manager` / `employee`), `team_id` (FK to `teams.id`).

2. **Team (`user.py`)**:
   - `id` (UUID string), `name`, `created_at`. Grouping boundary for multi-tenancy.

3. **Agent (`agent.py`)**:
   - `id`, `team_id`, `name`, `description`, `trigger_type` (`manual`, `scheduled`, `event`), `schedule_cron`, `status`, `is_shared_with_team`, `model`, `temperature`, `system_prompt`, `tools` (JSON array), `tokens_used`.

4. **AgentRun (`agent.py`)**:
   - `id`, `agent_id`, `triggered_by`, `status` (`running`, `completed`, `failed`), `started_at`, `completed_at`, `result_summary`.

5. **Document (`document.py`)**:
   - `id`, `team_id`, `uploaded_by`, `filename`, `file_path`, `file_type`, `file_size`, `status`.

---

## 5. Security & Authentication Architecture

### 1. Dual JWT Token Rotation
- **Access Token**: Short-lived (60 minutes). Contains `sub` (user_id), `role`, `type="access"`, `exp`. Used in HTTP Authorization headers (`Bearer <token>`).
- **Refresh Token**: Long-lived (7 days). Used to request new access tokens without requiring re-entry of password.

### 2. Redis Token Blacklisting
Upon calling `POST /api/v1/auth/logout`, the access token is added to Redis with an expiration matching the token's remaining TTL. Every incoming API request checks `is_token_blacklisted(token)` in `backend/app/core/security.py`. Revoked tokens are immediately rejected.

---

## 6. Multi-Role Access Control (RBAC)

AcuraX implements **Defense-in-Depth** security:

### Backend Enforcement (`backend/app/dependencies.py`)
```python
class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user

require_manager = RoleChecker(["manager"])
```

### Frontend Enforcement (`frontend/src/components/layout/RoleGate.tsx`)
```tsx
export default function RoleGate({ allow, children }: RoleGateProps) {
  const role = useUserRole();
  if (!allow.includes(role)) return null; // Stripped completely from DOM
  return <>{children}</>;
}
```

---

## 7. Agent Orchestration Engine

Agents in AcuraX are designed as modular, configurable micro-executors:

- **System Prompting**: Configurable persona, guardrails, and context windows.
- **Model Selection**: Flexible support for multiple LLMs (Claude 3.5 Sonnet, GPT-4o, Llama 3).
- **Temperature Control**: Fine-tune creativity (0.0 for deterministic tasks, 0.7+ for creative tasks).
- **Tool Bindings**: JSON schema defining dynamic actions (e.g. web search, database lookup, email dispatch).
- **Telemetry & Cost Tracking**: Token usage accumulates on every run to monitor ROI and budget limits.

---

## 8. API Endpoints Reference

| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register user & create new team workspace |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & return JWT tokens |
| `POST` | `/api/v1/auth/logout` | Authenticated | Blacklist token & invalidate session |
| `GET` | `/api/v1/auth/me` | Authenticated | Fetch authenticated user profile |
| `GET` | `/api/v1/agents` | Employee / Manager | List team agents (Employees see shared agents) |
| `POST` | `/api/v1/agents` | Manager Only | Create a new AI agent |
| `PATCH`| `/api/v1/agents/{id}` | Manager Only | Update agent configuration or tools |
| `DELETE`| `/api/v1/agents/{id}` | Manager Only | Delete an agent |
| `POST` | `/api/v1/agents/{id}/run` | Employee / Manager | Execute an agent run |
| `GET` | `/api/v1/analytics/overview`| Manager Only | Fetch workspace analytics & token usage |
| `GET` | `/api/v1/search?query=...` | Employee / Manager | Unified search across docs and articles |

---

## 9. Top 15 Technical Interview Questions & Answers

### Q1: *"Can you walk me through the high-level architecture of AcuraX?"*
> **Answer**: AcuraX is built as an asynchronous decoupled architecture. The frontend is a Next.js 14 App Router application written in TypeScript and styled with TailwindCSS. The backend is a Python FastAPI service leveraging SQLAlchemy 2.0 and Pydantic v2, connected to a PostgreSQL database for structured relational data and Redis for token blacklisting, caching, and background job queuing.

### Q2: *"How did you handle security and authentication in AcuraX?"*
> **Answer**: Authentication relies on OAuth2 with JWT access and refresh token rotation. Password security is handled with `bcrypt`. We implemented token blacklisting in Redis so that logged-out tokens are immediately revoked. Authorization uses role-based dependencies (`require_manager`, `get_current_user`) at the API layer, while the frontend uses `RoleGate` components to ensure non-authorized UI controls are removed from the DOM.

### Q3: *"How do you isolate data between different teams (Multi-tenancy)?"*
> **Answer**: Multi-tenancy is enforced at the database and query level. Each user belongs to a `Team`. Every resource (Agents, Documents, Chat Sessions) includes a mandatory `team_id` foreign key. All database queries automatically filter by `current_user.team_id`, preventing any cross-tenant data leakage.

### Q4: *"Why did you choose FastAPI over Flask or Django?"*
> **Answer**: FastAPI provides native asynchronous capability (`async/await`), automatic request/response data validation via Pydantic, high performance comparable to Node.js/Go, and automated interactive OpenAPI (Swagger) documentation out-of-the-box.

### Q5: *"How are AI Agents configured and executed in the project?"*
> **Answer**: Agents are represented as flexible entities containing model names, temperature values, system prompts, cron schedules, and tool binding schemas stored as JSON. When triggered via `POST /api/v1/agents/{id}/run`, the engine validates permissions, logs an `AgentRun` record, executes the agent lifecycle, and updates token consumption metrics.

### Q6: *"How do you handle database migrations?"*
> **Answer**: We use Alembic, integrated with SQLAlchemy declarative metadata. Migrations are stored as version scripts in `backend/app/db/migrations/`, allowing team members to upgrade or downgrade database schemas deterministically across dev, staging, and production environments.

### Q7: *"How would you integrate a real RAG (Retrieval-Augmented Generation) pipeline into AcuraX?"*
> **Answer**: 
> 1. Document Upload: User uploads PDF/Word documents via `/api/v1/documents`.
> 2. Parsing & Chunking: Celery background worker extracts text and splits it into chunks (e.g. 512 tokens with 50-token overlap).
> 3. Embedding Generation: Generate vector embeddings using `text-embedding-3-small` or HuggingFace models.
> 4. Storage: Store chunks and vector embeddings in PostgreSQL using the `pgvector` extension (`Vector(1536)` column type).
> 5. Retrieval: When querying, perform cosine similarity vector search (`<=>` operator in pgvector) to retrieve top-k chunks and pass them into the LLM system prompt.

### Q8: *"How do you handle token cost tracking?"*
> **Answer**: Every agent execution tracks prompt tokens, completion tokens, and total tokens. These metrics are accumulated in `Agent.tokens_used` and logged per `AgentRun`, enabling managers to monitor cost trends and set budget thresholds on the analytics dashboard.

### Q9: *"What is the difference between Manager and Employee roles in AcuraX?"*
> **Answer**: Managers have administrative rights: creating/modifying/deleting agents, managing tools, inviting team members, and viewing workspace-wide token analytics. Employees have execution rights: running shared agents, searching documents, and interacting with chat interfaces.

### Q10: *"How do you handle error management in FastAPI?"*
> **Answer**: We use HTTP Exception handlers and custom exceptions defined in `backend/app/core/exceptions.py`. Standardized error responses return JSON objects containing explicit status codes and error messages.

### Q11: *"How does Next.js 14 App Router benefit this project?"*
> **Answer**: App Router provides efficient server and client component separation, built-in layout nesting (`layout.tsx`), route handlers (`route.ts`), fast page load speeds, and intuitive directory-based routing.

### Q12: *"How do you manage configuration settings across environments?"*
> **Answer**: We use Pydantic `BaseSettings` in `backend/app/config.py`. Environment variables are loaded from `.env` files or system environment variables, ensuring secrets like `DATABASE_URL` and `JWT_SECRET` are never hardcoded.

### Q13: *"What strategy do you use for background jobs?"*
> **Answer**: Asynchronous tasks such as scheduled agent runs, document processing, and email notifications are delegated to Celery workers using Redis as the message broker (`celery_app.py`).

### Q14: *"How would you scale AcuraX to handle 100,000 active users?"*
> **Answer**:
> - **Database**: Use PgBouncer for connection pooling, set up read-replicas for analytics read queries, and partition `agent_runs` by date.
> - **Caching**: Cache user authorization sessions and agent definitions in Redis.
> - **Workers**: Horizontally scale Celery worker nodes for asynchronous background agent processing.
> - **Frontend**: Deploy Next.js to CDN edge locations (e.g., Vercel/Cloudflare Pages) for low latency assets.

### Q15: *"What was the most challenging technical problem solved in this project?"*
> **Answer**: Designing a flexible, secure multi-tenant architecture where agents, tools, and token tracking are strictly isolated per team workspace while maintaining dynamic, role-gated UI and API execution without performance degradation.

---

## 10. System Design & Production Scaling Roadmap

```
                                  ┌─────────────────────────────┐
                                  │   Cloudflare CDN / Edge     │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │    Nginx Load Balancer      │
                                  └──────────────┬──────────────┘
                                                 │
                         ┌───────────────────────┴───────────────────────┐
                         ▼                                               ▼
         ┌───────────────────────────────┐               ┌───────────────────────────────┐
         │     FastAPI Container 1       │               │     FastAPI Container 2       │
         └──────────────┬────────────────┘               └──────────────┬────────────────┘
                        │                                               │
        ┌───────────────┼───────────────────────────────┬───────────────┘
        ▼               ▼                               ▼
┌──────────────┐ ┌──────────────┐               ┌──────────────┐
│  PgBouncer   │ │ Redis Cache  │               │ Celery Queue │
└───────┬──────┘ └──────────────┘               └───────┬──────┘
        ▼                                               ▼
┌──────────────┐                                ┌──────────────┐
│  PostgreSQL  │                                │ Worker Nodes │
└──────────────┘                                └──────────────┘
```

1. **PgBouncer Integration**: Prevents database connection exhaustion during high-concurrency burst traffic.
2. **Celery Worker Auto-Scaling**: Dynamic worker scaling based on queue depth for heavy document parsing & AI agent executions.
3. **OpenTelemetry Telemetry**: Centralized logging, distributed tracing (Jaeger/Datadog), and Prometheus metrics for monitoring system health.
