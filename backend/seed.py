"""
AcuraX Database Seed Script
============================
Inserts demo data into the EXISTING acurax_db PostgreSQL database.
Tables are already created via pgAdmin — this script ONLY inserts rows.

Usage (from the backend/ directory):
    python seed.py

Demo credentials (all share the same password):
    Manager:   manager@acurax.ai  / admin123
    Employee1: jane@acurax.ai     / admin123
    Employee2: priya@acurax.ai    / admin123
"""

import sys
import os

# ── Path setup ────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.session import SessionLocal, engine
from app.models.user import Team, User
from app.models.document import Document, KnowledgeArticle
from app.models.agent import Agent
from app.core.security import get_password_hash
import uuid


def run_seed():
    db = SessionLocal()
    try:
        print("🌱 Starting AcuraX database seed...")
        print(f"   Connecting to: {engine.url}")

        # ── Verify connection ─────────────────────────────────────────────────
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("   ✅ Database connection OK\n")

        # ── Idempotency check ─────────────────────────────────────────────────
        existing = db.query(User).filter(User.email == "manager@acurax.ai").first()
        if existing:
            print("⚠️  Demo data already exists (manager@acurax.ai found).")
            print("   To re-seed, delete existing rows first, then rerun.")
            return

        # ── 1. Team ───────────────────────────────────────────────────────────
        team = Team(
            id=str(uuid.uuid4()),
            name="AcuraX Research Dev",
            plan="pro",
            settings={
                "theme": "dark",
                "default_model": "Claude 3.5 Sonnet",
                "auto_save": "true",
            },
        )
        db.add(team)
        db.flush()
        print(f"✓ Team created: '{team.name}' (id={team.id})")

        # ── 2. Users (passwords hashed with bcrypt) ───────────────────────────
        pw_hash = get_password_hash("admin123")

        manager = User(
            id=str(uuid.uuid4()),
            email="manager@acurax.ai",
            password_hash=pw_hash,
            full_name="Raj Manager",
            role="manager",
            status="active",
            team_id=team.id,
        )
        db.add(manager)

        jane = User(
            id=str(uuid.uuid4()),
            email="jane@acurax.ai",
            password_hash=pw_hash,
            full_name="Jane Smith",
            role="employee",
            status="active",
            team_id=team.id,
        )
        db.add(jane)

        priya = User(
            id=str(uuid.uuid4()),
            email="priya@acurax.ai",
            password_hash=pw_hash,
            full_name="Priya Kumar",
            role="employee",
            status="active",
            team_id=team.id,
        )
        db.add(priya)
        db.flush()
        print(f"✓ Users created: manager@acurax.ai, jane@acurax.ai, priya@acurax.ai")
        print(f"  Password for all: admin123 (stored as bcrypt hash)")

        # ── 3. Knowledge Articles ─────────────────────────────────────────────
        articles = [
            {
                "title": "Employee Handbook 2026",
                "summary": "Complete guide to company policies, benefits, and workplace expectations for 2026.",
                "category": "hr",
                "content": """## Employee Handbook 2026

Welcome to AcuraX! This handbook covers all company policies and your rights as an employee.

### Benefits
- Health Insurance: Full coverage after 30-day probation
- 401(k): 4% employer match
- Annual Leave: 20 days per year

### Code of Conduct
All employees must uphold our core values: Integrity, Innovation, and Inclusion.

### Performance Reviews
Quarterly check-ins with your manager, annual compensation review in January.

For questions, contact **hr@acurax.ai**.""",
            },
            {
                "title": "Remote Work Policy",
                "summary": "Guidelines for remote work eligibility, core hours, equipment reimbursement, and expectations.",
                "category": "hr",
                "content": """## Remote Work Policy

AcuraX supports flexible remote work arrangements for eligible employees.

### Core Hours
All employees must be reachable between **10:00 AM – 3:00 PM** in their local timezone, regardless of location.

### Eligibility
- Completed 90-day probation period
- Manager approval required
- Must maintain performance targets

### Equipment Reimbursement
| Item | Limit |
|------|-------|
| Monitor | $400 |
| Keyboard & Mouse | $100 |
| Desk Chair | $300 |
| Home Internet Stipend | $50/month |

Submit reimbursement requests to **hr@acurax.ai** with receipts attached.""",
            },
            {
                "title": "IT Support FAQ",
                "summary": "Answers to the most common IT questions: VPN setup, password reset, software requests.",
                "category": "it",
                "content": """## IT Support FAQ

### How do I reset my password?
1. Go to **https://auth.acurax.ai/reset**
2. Enter your company email
3. Click the link in your inbox (expires in 15 minutes)
4. Choose a password: min 12 chars, 1 uppercase, 1 number, 1 symbol

### How do I set up the VPN?
1. Download from **https://it.acurax.ai/vpn**
2. Set server: **vpn.acurax.ai**
3. Login with your AcuraX credentials
4. Approve the MFA push notification

### How do I request new software?
Submit a ticket at **helpdesk.acurax.ai** with the software name and business justification. Budget items over $50/month require manager approval.

### Still stuck?
Email **it-support@acurax.ai** or ping **#it-help** on Slack.""",
            },
        ]

        for art_data in articles:
            article = KnowledgeArticle(
                id=str(uuid.uuid4()),
                team_id=team.id,
                title=art_data["title"],
                summary=art_data["summary"],
                content=art_data["content"],
                category=art_data["category"],
                created_by=manager.id,
            )
            db.add(article)

        print(f"✓ Knowledge articles created: {len(articles)} articles")

        # ── 4. Agent ──────────────────────────────────────────────────────────
        agent = Agent(
            id=str(uuid.uuid4()),
            team_id=team.id,
            name="Weekly News Summarizer",
            description="Fetches top industry news every Monday morning and sends a summary digest to the team.",
            trigger_type="scheduled",
            schedule_cron="0 8 * * 1",  # Every Monday at 8 AM
            status="idle",
            is_shared_with_team=True,
            created_by=manager.id,
            model="Claude 3.5 Sonnet",
            temperature=0.3,
            system_prompt="You are a concise news analyst. Summarize industry news in bullet points. Focus on AI, enterprise software, and market trends.",
            tools=["web_search"],
            tokens_used=0,
            avatar_color="from-violet-600 to-purple-600",
        )
        db.add(agent)
        print(f"✓ Agent created: '{agent.name}'")

        # ── Commit ────────────────────────────────────────────────────────────
        db.commit()

        print("\n" + "=" * 55)
        print("✅ Seed completed successfully!")
        print("=" * 55)
        print("\n📋 Demo Login Credentials:")
        print(f"  Manager:   manager@acurax.ai  /  admin123  (role: manager)")
        print(f"  Employee1: jane@acurax.ai      /  admin123  (role: employee)")
        print(f"  Employee2: priya@acurax.ai     /  admin123  (role: employee)")
        print("\n🔗 API Docs: http://localhost:8000/docs")
        print("🔗 Health:   http://localhost:8000/api/v1/health\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
