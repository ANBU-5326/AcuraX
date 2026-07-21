"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search, BookOpen, ShieldCheck, Monitor, Users, HelpCircle,
  Star, ChevronRight, ArrowLeft, ThumbsUp, ThumbsDown,
  RefreshCw, AlertCircle, X, Clock, FileText,
  Plus, Globe, Folder, Database as DbIcon,
  Sparkles, CheckCircle,
} from "lucide-react";

const SyncIcon = RefreshCw;
import { client, KnowledgeBase } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type Category = "All" | "HR Policies" | "IT Support" | "Onboarding" | "Guides" | "FAQs";

interface Article {
  id: string;
  title: string;
  summary: string;
  category: Exclude<Category, "All">;
  lastUpdated: string;
  content: string;
  readTime: string;
}

// ── Mock articles ─────────────────────────────────────────────────────────────

const ARTICLES: Article[] = [
  {
    id: "art-001",
    title: "Remote Work & Flexible Hours Policy",
    summary: "Guidelines for working from home, core hours expectations, and equipment reimbursement for full-time remote employees.",
    category: "HR Policies",
    lastUpdated: "Jun 18, 2026",
    readTime: "4 min read",
    content: `## Remote Work Policy

AcuraX supports flexible working arrangements for eligible employees. This policy outlines expectations and entitlements.

### Core Hours
All employees are expected to be reachable between **10:00 AM – 3:00 PM** in their local timezone. Outside these hours, flexible scheduling applies.

### Equipment Reimbursement
- **Monitor**: Up to $400 reimbursed upon HR approval
- **Keyboard & Mouse**: Up to $100
- **Desk Chair**: Up to $300
- **Home Internet**: $50/month stipend

### Expectations
1. Respond to messages within 2 hours during core hours.
2. Keep your calendar up to date with your working hours.
3. Attend scheduled team standups via video with camera on.
4. Notify your manager at least 24 hours in advance of any schedule changes.

### Eligibility
Employees who have completed their 90-day probation period may apply for remote work. Approval is at manager discretion and reviewed quarterly.

For questions, contact **hr@acurax.ai**.`,
  },
  {
    id: "art-002",
    title: "Getting Started with AcuraX Playground",
    summary: "A step-by-step guide to your first AI chat session — choosing an agent, writing good prompts, and interpreting responses.",
    category: "Onboarding",
    lastUpdated: "Jun 20, 2026",
    readTime: "6 min read",
    content: `## Getting Started with Playground Chat

The Playground is your main workspace for interacting with AI agents. Here's how to get started.

### Step 1: Choose an Agent
From the sidebar, navigate to **Playground Chat**. You'll see a list of shared agents on the right panel. Each agent is configured for a specific purpose:

- **Acura Core Coordinator** — General-purpose queries, summaries, and Q&A
- **Market Analyst Agent** — Competitive research and market insights

### Step 2: Write Your First Prompt
Click on an agent to activate it. Type your question in the message box at the bottom and press **Enter** or click **Send**.

**Tips for better results:**
- Be specific: "Summarise the Q3 2026 strategic plan" beats "tell me about Q3"
- Add context: mention the department or project you're referencing
- Ask for format: "bullet points", "a one-paragraph summary", etc.

### Step 3: Read the Response
The agent's reply appears in the chat. Responses may cite sources from your company's document library.

### Need Help?
Contact IT Support via the helpdesk portal or ask in **#ai-tools** on Slack.`,
  },
  {
    id: "art-003",
    title: "How to Reset Your Password",
    summary: "Step-by-step instructions to reset your AcuraX account password via the self-service portal or by contacting IT.",
    category: "IT Support",
    lastUpdated: "Jun 10, 2026",
    readTime: "2 min read",
    content: `## Password Reset Guide

If you've forgotten your password or need to reset it for security reasons, follow these steps.

### Self-Service Reset (Recommended)
1. Go to **https://auth.acurax.ai/reset**
2. Enter your company email address
3. Check your inbox for a reset link (expires in 15 minutes)
4. Click the link and enter your new password
5. Password must be at least **12 characters** with one uppercase letter, one number, and one symbol

### Contact IT Support
If the self-service portal doesn't work:
- **Email**: support@acurax.ai
- **Slack**: DM **@IT-Support** in your workspace
- **Hours**: Monday–Friday, 8 AM – 6 PM IST

### Password Requirements
- Minimum 12 characters
- At least 1 uppercase (A–Z)
- At least 1 number (0–9)
- At least 1 symbol (!@#$%)
- Cannot reuse your last 5 passwords

Passwords expire every **90 days**. You'll receive a reminder email 7 days before expiry.`,
  },
  {
    id: "art-004",
    title: "Leave & Time-Off Request Process",
    summary: "How to submit a leave request, approval workflows, types of leave available, and carryover rules for unused days.",
    category: "HR Policies",
    lastUpdated: "Jun 5, 2026",
    readTime: "5 min read",
    content: `## Leave & Time-Off Policy

AcuraX offers several leave types to support employee wellbeing.

### Leave Types
| Type | Days per Year | Notes |
|---|---|---|
| Annual Leave | 20 days | Carry up to 5 days into next year |
| Sick Leave | 12 days | Doctor's note required after 3 consecutive days |
| Public Holidays | Per local calendar | |
| Maternity/Paternity | 90 / 30 days | Paid at full salary |
| Compassionate Leave | Up to 5 days | Immediate family bereavement |

### How to Request Leave
1. Open the **HR Portal** at hr.acurax.ai
2. Select **My Leave** → **Request New Leave**
3. Choose leave type, start date, end date, and add a note
4. Submit — your manager will receive a notification for approval
5. You'll receive an email confirmation once approved or declined

### Advance Notice Required
- Annual leave: minimum **5 business days** notice
- Long leave (>5 days): minimum **3 weeks** notice
- Sick leave: notify your manager by 9 AM on the day

For urgent queries, contact **hr@acurax.ai**.`,
  },
  {
    id: "art-005",
    title: "VPN Setup & Secure Remote Access",
    summary: "How to install and configure the company VPN client on Windows, macOS, and Linux for secure access to internal resources.",
    category: "IT Support",
    lastUpdated: "Jun 14, 2026",
    readTime: "5 min read",
    content: `## VPN Setup Guide

The AcuraX VPN secures your connection to internal tools and resources when working outside the office.

### Download the VPN Client
Download the client from the IT Portal: **https://it.acurax.ai/vpn**

Available for:
- **Windows** (10/11)
- **macOS** (12+)
- **Ubuntu/Debian** Linux

### Installation Steps (Windows)
1. Run the downloaded installer as Administrator
2. Accept the terms of service
3. On first launch, enter the server address: **vpn.acurax.ai**
4. Log in with your AcuraX email and password
5. Approve the MFA push notification on your phone

### Troubleshooting
**Can't connect?**
- Check your internet connection
- Try switching from UDP to TCP in settings
- Restart the VPN client

**MFA not working?**
- Ensure the Authenticator app's time is synced
- Contact IT if you've lost access to your MFA device

For help: **support@acurax.ai** or Slack **#it-support**`,
  },
  {
    id: "art-006",
    title: "Employee Expense Reimbursement Guide",
    summary: "Submit expenses for business travel, meals, software tools, and training — including receipt requirements and processing times.",
    category: "Guides",
    lastUpdated: "May 28, 2026",
    readTime: "3 min read",
    content: `## Expense Reimbursement Guide

AcuraX reimburses reasonable business-related expenses. Here's how to submit a claim.

### What Can Be Reimbursed?
- **Business travel**: flights, hotels, ground transport (economy class, up to $200/night)
- **Client meals**: up to $75/person, requires names of attendees
- **Software & tools**: up to $50/month without pre-approval; above $50 requires manager sign-off
- **Training & conferences**: up to $1,000/year with manager approval

### How to Submit
1. Keep all receipts (photos or PDFs)
2. Open the Expense Portal: **expenses.acurax.ai**
3. Click **+ New Expense Report**
4. Upload receipts, categorise each item, add business justification
5. Submit for manager approval

### Timelines
- Submit within **30 days** of the expense
- Approved expenses are reimbursed in the next payroll cycle
- International expenses: submit in local currency; reimbursed in INR at bank rate on submission date

### Questions?
Email **finance@acurax.ai** with subject line "Expense Query — [Your Name]".`,
  },
  {
    id: "art-007",
    title: "New Hire Checklist: Your First Week",
    summary: "Everything you need to complete in your first 5 days: accounts setup, team introductions, mandatory training, and tool access.",
    category: "Onboarding",
    lastUpdated: "Jun 1, 2026",
    readTime: "4 min read",
    content: `## New Hire — First Week Checklist

Welcome to AcuraX! Here's what to complete in your first five days.

### Day 1
- [ ] Attend onboarding call with HR (9 AM)
- [ ] Set up your laptop using the IT setup guide
- [ ] Log in to AcuraX dashboard and change your default password
- [ ] Install the VPN client
- [ ] Join Slack and introduce yourself in **#team-general**

### Day 2–3
- [ ] Complete mandatory Security Awareness Training (link sent to email)
- [ ] Meet your manager for a 1:1 session
- [ ] Get added to your team's Slack channels
- [ ] Set up Google Workspace (Calendar, Meet, Drive)
- [ ] Request access to tools you need from IT

### Day 4–5
- [ ] Shadow a team member on a current project
- [ ] Attend your first team standup
- [ ] Review your 30-60-90 day plan with your manager
- [ ] Set up your LinkedIn and update company details

### Key Contacts
- **HR**: hr@acurax.ai
- **IT Helpdesk**: support@acurax.ai
- **Your Buddy**: Assigned during onboarding call

We're glad you're here — don't hesitate to ask questions!`,
  },
  {
    id: "art-008",
    title: "Frequently Asked Questions: Payroll & Benefits",
    summary: "Answers to the most common questions about pay dates, salary slips, health insurance, provident fund, and annual appraisals.",
    category: "FAQs",
    lastUpdated: "Jun 12, 2026",
    readTime: "4 min read",
    content: `## Payroll & Benefits FAQ

### When is payday?
Salaries are credited on the **last working day of each month**. If month-end falls on a weekend or holiday, payment is processed on the preceding Friday.

### How do I access my salary slip?
Log in to the **HR Portal** (hr.acurax.ai) → **Payroll** → **Payslips**. Slips are generated by the 5th of each following month.

### What health insurance do I get?
All full-time employees are enrolled in the company's **Group Health Policy (GMC)** from Day 1. Coverage includes:
- Self, spouse, and up to 2 children
- Sum insured: ₹5 lakh per family per year
- Cashless at 5,000+ network hospitals

To add dependants, email hr@acurax.ai within 30 days of joining.

### What is the PF contribution?
AcuraX contributes **12% of your basic salary** to your Provident Fund each month, matching your contribution. UAN activation details are shared in your offer documents.

### When are appraisals?
Performance reviews happen twice yearly:
- **Mid-year**: July
- **Annual**: January (with salary revisions effective February)

More questions? Browse hr.acurax.ai/faq or email **hr@acurax.ai**.`,
  },
];

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES: Category[] = ["All", "HR Policies", "IT Support", "Onboarding", "Guides", "FAQs"];

const CATEGORY_CONFIG: Record<Exclude<Category, "All">, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  badgeClass: string;
}> = {
  "HR Policies": {
    icon: <Users className="h-4 w-4" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/15 border-blue-500/20",
    badgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  },
  "IT Support": {
    icon: <Monitor className="h-4 w-4" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/15 border-orange-500/20",
    badgeClass: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  },
  "Onboarding": {
    icon: <Star className="h-4 w-4" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15 border-emerald-500/20",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  "Guides": {
    icon: <BookOpen className="h-4 w-4" />,
    color: "text-violet-400",
    bgColor: "bg-violet-500/15 border-violet-500/20",
    badgeClass: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  },
  "FAQs": {
    icon: <HelpCircle className="h-4 w-4" />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15 border-amber-500/20",
    badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
};

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 animate-pulse space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-800 rounded w-3/4" />
          <div className="h-3 bg-slate-800 rounded w-full" />
          <div className="h-3 bg-slate-800 rounded w-5/6" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
        <div className="h-5 w-20 bg-slate-800 rounded-full" />
        <div className="h-3 w-24 bg-slate-800 rounded" />
      </div>
    </div>
  );
}

// ── Article Card ──────────────────────────────────────────────────────────────

function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  const config = CATEGORY_CONFIG[article.category];
  return (
    <button
      onClick={onClick}
      tabIndex={0}
      aria-label={`Read article: ${article.title}`}
      className={cn(
        "group text-left w-full rounded-xl border border-slate-800 bg-slate-900/40",
        "p-6 transition-all duration-200 cursor-pointer",
        "hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-900/15 hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
      )}
    >
      {/* Icon + Title */}
      <div className="flex items-start gap-4 mb-4">
        <div className={cn(
          "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110",
          config.bgColor,
        )}>
          <span className={config.color}>{config.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-100 leading-snug group-hover:text-violet-300 transition-colors line-clamp-2">
            {article.title}
          </h3>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-5">
        {article.summary}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide",
          config.badgeClass,
        )}>
          <span className={config.color}>{config.icon}</span>
          {article.category}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{article.lastUpdated}</span>
        </div>
      </div>
    </button>
  );
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function ArticleDetailPanel({
  article,
  onClose,
}: {
  article: Article | null;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    setFeedback(null);
  }, [article]);

  // Handle ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!article) return null;

  const config = CATEGORY_CONFIG[article.category];

  // Parse simple markdown-ish content
  function renderContent(content: string) {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-base font-bold text-slate-100 mt-6 mb-3 first:mt-0">
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="text-sm font-bold text-slate-200 mt-5 mb-2">
            {line.slice(4)}
          </h3>
        );
      }
      if (line.startsWith("- [ ] ")) {
        return (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <div className="h-4 w-4 mt-0.5 rounded border border-slate-700 shrink-0" />
            <span className="text-sm text-slate-300">{line.slice(6)}</span>
          </div>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="text-sm text-slate-300 ml-4 py-0.5 list-disc">
            {line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}
          </li>
        );
      }
      if (line.match(/^\d+\./)) {
        return (
          <li key={i} className="text-sm text-slate-300 ml-4 py-0.5 list-decimal">
            {line.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
          </li>
        );
      }
      if (line.startsWith("| ") && line.includes("|")) {
        const cells = line.split("|").filter(c => c.trim());
        if (line.includes("---")) {
          return <div key={i} className="border-b border-slate-800 my-1" />;
        }
        return (
          <div key={i} className="flex text-xs">
            {cells.map((cell, ci) => (
              <div key={ci} className={cn(
                "flex-1 py-1.5 px-2 text-slate-300 border-b border-slate-800/40",
                ci === 0 && "font-semibold text-slate-200",
              )}>
                {cell.trim()}
              </div>
            ))}
          </div>
        );
      }
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      // Bold text inline
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-sm text-slate-300 leading-relaxed">
          {parts.map((part, pi) =>
            pi % 2 === 1
              ? <strong key={pi} className="text-slate-200 font-semibold">{part}</strong>
              : part
          )}
        </p>
      );
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-slate-950 border-l border-slate-800 z-50 flex flex-col shadow-2xl shadow-black/60 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors group"
            aria-label="Back to Knowledge Base"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <span className="text-xs text-slate-500 truncate">Knowledge Base</span>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Category badge + meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide",
              config.badgeClass,
            )}>
              <span className={config.color}>{config.icon}</span>
              {article.category}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{article.lastUpdated}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <FileText className="h-3 w-3" />
              <span>{article.readTime}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-extrabold text-slate-100 leading-tight tracking-tight">
            {article.title}
          </h1>

          {/* Divider */}
          <div className="border-t border-slate-800" />

          {/* Article content */}
          <div className="space-y-1.5">
            {renderContent(article.content)}
          </div>
        </div>

        {/* Feedback footer */}
        <div className="shrink-0 border-t border-slate-800 px-6 py-4 bg-slate-950/80">
          {feedback === null ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400 font-medium">Was this article helpful?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFeedback("up")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
                  aria-label="Mark as helpful"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  Yes
                </button>
                <button
                  onClick={() => setFeedback("down")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all"
                  aria-label="Mark as not helpful"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  No
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">
                {feedback === "up" ? "Thanks for the feedback! 🎉" : "Got it — we'll work to improve this."}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Manager View (unchanged functionality) ────────────────────────────────────

function ManagerKnowledgeBaseView() {
  const { success, error } = useToast();
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [kbName, setKbName] = useState("");
  const [kbType, setKbType] = useState<"file" | "web" | "database">("web");
  const [kbSource, setKbSource] = useState("");
  const [creating, setCreating] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const loadKBs = async () => {
    setLoading(true);
    try {
      const data = await client.getKnowledgeBases();
      setKbs(data);
    } catch {
      error("Error query failed", "Could not fetch vector index groupings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadKBs(); }, []);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    setKbs(prev => prev.map(k => k.id === id ? { ...k, status: "syncing" } : k));
    try {
      const updated = await client.syncKB(id);
      setKbs(prev => prev.map(k => k.id === id ? updated : k));
      success("Sync Complete", `${updated.name} updated: vector database records synchronized.`);
    } catch {
      error("Sync Failed", "Could not synchronize indices.");
      setKbs(prev => prev.map(k => k.id === id ? { ...k, status: "failed" } : k));
    } finally {
      setSyncingId(null);
    }
  };

  const handleCreateKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbName || !kbSource) { error("Validation Error", "Name and Source target are required."); return; }
    setCreating(true);
    try {
      const newKB = await client.createKnowledgeBase(kbName, kbType, kbSource);
      setKbs(prev => [...prev, newKB]);
      success("Connector Configured", `${newKB.name} initialized. Triggering initial ingestion...`);
      setKbName(""); setKbSource(""); setModalOpen(false);
      handleSync(newKB.id);
    } catch {
      error("Deploy error", "Could not add connector.");
    } finally {
      setCreating(false);
    }
  };

  const typeIcons = {
    file: <Folder className="h-4.5 w-4.5 text-violet-400" />,
    web: <Globe className="h-4.5 w-4.5 text-blue-400" />,
    database: <DbIcon className="h-4.5 w-4.5 text-emerald-400" />,
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Querying local connector registries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">Vector Databases & Syncer</h1>
          <p className="text-slate-400 text-xs mt-1">Synchronize external databases, web scraper URLs, and directories into semantic embeddings.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="h-10 text-xs font-bold shadow-md shadow-violet-900/20">
          <Plus className="h-4 w-4 mr-1.5" />Add Data Connector
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kbs.map((kb) => {
          const isSyncing = syncingId === kb.id || kb.status === "syncing";
          return (
            <Card key={kb.id} className="relative overflow-hidden border-slate-800 hover:border-slate-700/60" glass>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg">{typeIcons[kb.type]}</div>
                  <div>
                    <CardTitle className="text-sm font-bold">{kb.name}</CardTitle>
                    <CardDescription className="capitalize text-[10px] mt-0.5">{kb.type} integration</CardDescription>
                  </div>
                </div>
                <span className={cn(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-semibold border",
                  kb.status === "synced" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  kb.status === "failed" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                  "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}>
                  {kb.status}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Source Path</span>
                    <span className="text-slate-300 truncate max-w-[150px] font-bold">{kb.source}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Document Count</span>
                    <span className="text-slate-300 font-bold">{kb.docCount} collections</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Synced</span>
                    <span className="text-slate-400 font-bold">{kb.lastSync || "—"}</span>
                  </div>
                </div>
                <div className="border-t border-slate-800/60 pt-3 flex justify-between items-center gap-3">
                  <span className="text-[10px] text-slate-500 italic">pgvector backend mapping</span>
                  <Button size="sm" variant="outline" onClick={() => handleSync(kb.id)} disabled={isSyncing} className="h-8 text-[10px] px-2.5 border-slate-850 hover:bg-slate-900">
                    <SyncIcon className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin text-violet-400" : ""}`} />
                    Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Configure Data Sync Connector">
        <form onSubmit={handleCreateKB} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Connector Identifier Name</label>
            <Input placeholder="e.g. Acura Documentation Wiki" value={kbName} onChange={(e) => setKbName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Integration Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "web", name: "Web Crawler", icon: <Globe className="h-4 w-4" /> },
                { id: "file", name: "File Directory", icon: <Folder className="h-4 w-4" /> },
                { id: "database", name: "SQL Database", icon: <DbIcon className="h-4 w-4" /> },
              ].map((t) => (
                <button key={t.id} type="button" onClick={() => setKbType(t.id as any)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${kbType === t.id ? "bg-violet-600/10 border-violet-500/40 text-slate-100 font-bold" : "bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-800"}`}>
                  {t.icon}
                  <span className="text-[9px]">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {kbType === "web" && "Target Crawler URL"}
              {kbType === "file" && "Target directory path"}
              {kbType === "database" && "Target Database SQL Connection String"}
            </label>
            <Input
              placeholder={kbType === "web" ? "https://docs.acurax.ai" : kbType === "file" ? "C:\\Users\\workspace\\documents" : "postgresql://user:pass@host:5432/db"}
              value={kbSource}
              onChange={(e) => setKbSource(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-3 border-t border-slate-800/60 mt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>
              <Sparkles className="h-4 w-4 mr-2" />
              Ingest & Index Target
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

// ── Employee View ─────────────────────────────────────────────────────────────

function EmployeeKnowledgeBaseView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const filteredArticles = ARTICLES.filter((article) => {
    const matchesCategory = activeCategory === "All" || article.category === activeCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      article.title.toLowerCase().includes(query) ||
      article.summary.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const handleClosePanel = useCallback(() => setSelectedArticle(null), []);

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
            Knowledge Base
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Browse articles, company policies, and guides.
          </p>
        </div>

        {/* Search + filter */}
        <div className="space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              id="kb-search"
              type="text"
              placeholder="Search knowledge base articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search knowledge base articles"
              className={cn(
                "w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/60",
                "text-sm text-slate-200 placeholder-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50",
                "transition-all duration-150",
              )}
            />
          </div>

          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={isActive}
                  aria-label={`Filter by ${cat}`}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
                    isActive
                      ? "bg-violet-600 border-violet-500 text-white shadow-sm shadow-violet-900/30"
                      : "bg-transparent border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-slate-900/50",
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Article grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Search className="h-7 w-7 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">No articles found</p>
              <p className="text-xs text-slate-500 mt-1">Try a different search term or select a different category.</p>
            </div>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-2 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">
                {filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"}
                {activeCategory !== "All" && ` in ${activeCategory}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onClick={() => setSelectedArticle(article)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Article detail slide-in panel */}
      {selectedArticle && (
        <ArticleDetailPanel article={selectedArticle} onClose={handleClosePanel} />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const role = useUserRole();

  if (role === "manager") {
    return <ManagerKnowledgeBaseView />;
  }

  return <EmployeeKnowledgeBaseView />;
}
