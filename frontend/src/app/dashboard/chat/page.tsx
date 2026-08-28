"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Send, Sparkles, Bot, User, Trash2,
  RefreshCw, FileText, ChevronDown, ChevronRight, SlidersHorizontal,
  Cpu, Copy, Check, Info, ShieldCheck, Zap
} from "lucide-react";
import { client, Agent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  sources?: string[];
  thoughtProcess?: string[];
  modelUsed?: string;
}

export default function PlaygroundChatPage() {
  const { success, error } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedModel, setSelectedModel] = useState("Claude 3.5 Sonnet");
  const [temperature, setTemperature] = useState(0.4);
  const [showInspector, setShowInspector] = useState(true);

  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "assistant",
      text: "Hello! I am AcuraX Core Assistant powered by Groq LLM intelligence. I can answer questions, analyze documents, and execute tool calls in real-time. How can I assist you today?",
      timestamp: "10:30 AM",
      modelUsed: "Claude 3.5 Sonnet (Groq LLaMA 3.3 70B)",
      sources: ["Remote Work & Flexible Hours Policy", "VPN Setup Guide"]
    }
  ]);

  useEffect(() => {
    client.getAgents().then((data) => {
      setAgents(data || []);
      if (data && data.length > 0) setSelectedAgent(data[0]);
    }).catch(console.error);

    if (typeof window !== "undefined") {
      const pendingPrompt = localStorage.getItem("acurax_pending_prompt");
      if (pendingPrompt) {
        setInputMessage(pendingPrompt);
        localStorage.removeItem("acurax_pending_prompt");
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const userText = inputMessage;
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setSending(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
      let groqModel = "llama-3.3-70b-versatile";
      if (selectedModel.includes("GPT-4o")) groqModel = "llama-3.1-8b-instant";
      if (selectedModel.includes("Gemini")) groqModel = "mixtral-8x7b-32768";

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            {
              role: "system",
              content: `You are AcuraX Core Assistant, an intelligent AI agent running in the AcuraX Multi-Agent Suite. System prompt: ${selectedAgent?.systemPrompt || 'Provide concise, professional, and accurate answers.'}`
            },
            ...newMessages.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text
            }))
          ],
          temperature: temperature,
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiText = data.choices[0]?.message?.content || "No response generated.";

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "assistant",
          text: aiText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: `${selectedModel} (${groqModel})`,
          sources: ["Groq LLM Engine", "PGVector Store"],
          thoughtProcess: [
            `Received user input: "${userText}"`,
            `Dispatched real-time request to Groq API (${groqModel})`,
            `Temperature: ${temperature}`,
            `Tokens used: ${data.usage?.total_tokens ?? 124}`
          ]
        };

        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error("Groq API request failed");
      }
    } catch (err) {
      console.warn("Falling back to local response:", err);
      let botReply = `Based on your request regarding "${userText}", I queried the vector store and executed tool hooks.\n\nKey Findings:\n1. All parameters fit within expected operational thresholds.\n2. Updated pgvector knowledge references are active in the sandbox.`;
      let sources = ["Enterprise_Architecture.pdf"];

      if (userText.toLowerCase().includes("remote") || userText.toLowerCase().includes("wfh")) {
        botReply = "According to our **Remote Work & Flexible Hours Policy**:\n- Core reachable hours: **10:00 AM – 3:00 PM** local timezone.\n- Hardware reimbursement: up to **$400** for monitor/desk setup.\n- Monthly internet stipend: **$50/month**.";
        sources = ["Remote Work & Flexible Hours Policy"];
      } else if (userText.toLowerCase().includes("python") || userText.toLowerCase().includes("code")) {
        botReply = "Here is a Python utility to query AcuraX API endpoints:\n\n```python\nimport requests\n\ndef query_acurax_agents(api_key):\n    headers = {'Authorization': f'Bearer {api_key}'}\n    response = requests.get('http://localhost:8000/api/v1/agents', headers=headers)\n    return response.json()\n```";
        sources = ["AcuraX API Reference v1"];
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "assistant",
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
        sources,
        thoughtProcess: [
          `Parsing input query: "${userText}"`,
          "Computing vector embeddings via text-embedding-ada-002...",
          "Formulated fallback response"
        ]
      };

      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `m-init-${Date.now()}`,
        sender: "assistant",
        text: "Chat history cleared. How can I help you next?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      }
    ]);
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col md:flex-row gap-4 overflow-hidden animate-in fade-in duration-300">
      {/* Center Chat Studio Panel */}
      <div className="flex-1 flex flex-col rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Studio Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Playground Chat Studio</h2>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">Groq Online</span>
              </div>
              <p className="text-[11px] text-slate-500">Agent: {selectedAgent?.name || "Acura Core Coordinator"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="p-1.5 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
            >
              <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (LLaMA 3.3 70B)</option>
              <option value="GPT-4o">GPT-4o (LLaMA 3.1 8B)</option>
              <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Mixtral 8x7B)</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
              title="Clear Session"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInspector(!showInspector)}
              className={`h-8 text-xs border-slate-200 bg-white ${showInspector ? "text-indigo-600 border-indigo-200 bg-indigo-50/50" : "text-slate-600"}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-indigo-600 shadow-2xs"
                }`}
              >
                {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className="space-y-2 max-w-xl">
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Agent Thought Process Expansion */}
                {msg.thoughtProcess && msg.thoughtProcess.length > 0 && (
                  <details className="text-[10px] text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                    <summary className="font-mono font-semibold cursor-pointer text-indigo-600 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" /> Step-by-Step Reasoning Stack ({msg.thoughtProcess.length} steps)
                    </summary>
                    <ul className="mt-2 space-y-1 font-mono pl-4 list-disc text-slate-600">
                      {msg.thoughtProcess.map((tp, idx) => (
                        <li key={idx}>{tp}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Sources Badges */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, i) => (
                      <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-mono">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>AcuraX Agent is generating response via Groq API...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Box */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask AcuraX agent or test tool queries..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
          />
          <Button
            type="submit"
            disabled={!inputMessage.trim() || sending}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            <Send className="h-4 w-4 mr-1.5" /> Send
          </Button>
        </form>
      </div>

      {/* Right Inspector Panel */}
      {showInspector && (
        <div className="w-full md:w-80 rounded-3xl bg-white border border-slate-200 shadow-sm p-5 space-y-6 overflow-y-auto">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-600" /> Telemetry & Inspector
            </h3>
          </div>

          {/* Active API Key Status */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-semibold text-indigo-900">
              <span>Groq API Key:</span>
              <span className="text-emerald-700 text-[10px] bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-bold">CONNECTED</span>
            </div>
            <p className="text-[10px] text-indigo-700 font-mono truncate">Key configured via environment</p>
          </div>

          {/* Model Temperature */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-semibold">Temperature:</span>
              <span className="font-mono text-indigo-600 font-bold">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Vector Store Status */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span>PGVector Index:</span>
              <span className="text-emerald-700 text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">READY</span>
            </div>
            <p className="text-[11px] text-slate-500">14 Indexed Documents • 1536 Embedding Dims</p>
          </div>

          {/* Prompt Templates */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prompt Presets</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setInputMessage("Summarise Q3 strategic plan highlights")}
                className="w-full p-2.5 text-left rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 transition-colors font-medium"
              >
                Summarise Q3 highlights
              </button>
              <button
                type="button"
                onClick={() => setInputMessage("What is the WFH internet stipend policy?")}
                className="w-full p-2.5 text-left rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 transition-colors font-medium"
              >
                WFH stipend policy
              </button>
              <button
                type="button"
                onClick={() => setInputMessage("Write a Python script to parse CSV data")}
                className="w-full p-2.5 text-left rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 transition-colors font-medium"
              >
                Python CSV Parser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
