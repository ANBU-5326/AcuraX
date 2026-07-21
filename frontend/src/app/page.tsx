import Link from "next/link";
import { Sparkles, Cpu, Layers, Activity, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const features = [
    { icon: <Cpu className="h-6 w-6 text-violet-500" />, title: "Autonomous Agents", desc: "Instantiate stateful, tool-augmented agents using Claude 3.5 or GPT-4o." },
    { icon: <Layers className="h-6 w-6 text-indigo-500" />, title: "DAG Workflows", desc: "Drag & drop canvas builder to design parallel execution steps and alerts." },
    { icon: <Activity className="h-6 w-6 text-cyan-500" />, title: "Analytics cockpit", desc: "Real-time latency, usage logs, token rates, and budget cost reporting." },
    { icon: <Search className="h-6 w-6 text-emerald-500" />, title: "Semantic Search", desc: "Compute embeddings, index markdown/PDF files, query vector stores." }
  ];

  return (
    <div className="relative min-h-screen bg-neutral-950 text-slate-100 overflow-hidden flex flex-col justify-between">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-violet-600/10 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header navbar */}
      <header className="border-b border-slate-900/60 glassmorphism-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center border border-violet-500/20 shadow-md shadow-violet-950/40">
              <Cpu className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">
              Acura<span className="text-violet-500 font-medium">X</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="hover:border-slate-700">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto py-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          AcuraX Sandbox Core is Live
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-100 to-slate-400 bg-clip-text text-transparent leading-[1.15] mb-6">
          The Multi-Agent <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            AI Operations Suite
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Design visual execution graphs, orchestrate context-aware models with custom Python scrapers, and monitor API parameters in real-time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 justify-center">
          <Link href="/auth/login">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 font-semibold text-sm">
              Enter Cockpit
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-sm border-slate-800">
              Explore Architecture
            </Button>
          </a>
        </div>

        {/* Features grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left scroll-mt-24">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 glassmorphism-light hover:border-slate-800 transition-all duration-300 group"
            >
              <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-950 bg-black/40 py-8 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-violet-500" />
            <span>Secure TLS Sandbox environment</span>
          </div>
          <span>&copy; 2026 AcuraX Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
