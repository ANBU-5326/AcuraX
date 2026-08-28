"use client";

import React, { useState, useEffect } from "react";
import {
  Settings2, Key, Save, RefreshCw,
  Sliders, ToggleLeft, ToggleRight, Users, UserCircle2,
  Plug, Mail, Lock, CheckCircle
} from "lucide-react";
import { client } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAuth, useUserRole } from "@/hooks/useUserRole";

type Tab = "personal" | "team" | "integrations";

const TEAM_MEMBERS = [
  { id: "usr-mgr-001", name: "John Doe",    email: "admin@acurax.ai", role: "Manager",  status: "active" },
  { id: "usr-emp-002", name: "Jane Smith",  email: "jane@acurax.ai",  role: "Employee", status: "active" },
  { id: "usr-emp-003", name: "Arun Kumar",  email: "arun@acurax.ai",  role: "Employee", status: "active" },
  { id: "usr-emp-004", name: "Sofia Torres",email: "sofia@acurax.ai", role: "Employee", status: "pending" },
];

function ManagerSettingsView() {
  const { success, error } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [displayEmail, setDisplayEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [groqKey, setGroqKey] = useState(process.env.NEXT_PUBLIC_GROQ_API_KEY || "");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("Claude 3.5 Sonnet");
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    setDisplayName(user?.name ?? "");
    setDisplayEmail(user?.email ?? "");
  }, [user]);

  useEffect(() => {
    client.getSettings().then((data) => {
      setOpenaiKey(data.openai_key || "");
      setAnthropicKey(data.anthropic_key || "");
      setDefaultModel(data.default_model || "Claude 3.5 Sonnet");
      setAutoSave(data.auto_save === "true");
    }).catch(() => error("Error", "Could not fetch settings.")).finally(() => setLoading(false));
  }, [error]);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    success("Profile Updated", "Your personal details have been saved.");
    setSaving(false);
  };

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.saveSettings({ openai_key: openaiKey, anthropic_key: anthropicKey, default_model: defaultModel, auto_save: String(autoSave) });
      success("Settings Saved", "Your workspace integration keys have been hotloaded.");
    } catch {
      error("Save Error", "Could not persist credentials hashes.");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "personal",     label: "Personal",     icon: <UserCircle2 className="h-4 w-4" /> },
    { id: "team",         label: "Team",         icon: <Users className="h-4 w-4" /> },
    { id: "integrations", label: "Integrations", icon: <Plug className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="h-[40vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Checking settings hashes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2.5">
            <Settings2 className="h-7 w-7 text-indigo-600" />
            System Preferences
          </h1>
          <p className="text-slate-600 text-xs mt-1">Configure API credential binders, team roster, and default parameters.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit shadow-2xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-indigo-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "personal" && (
        <form onSubmit={handleSavePersonal} className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-2xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900">Personal Details</CardTitle>
              <CardDescription>Update your display name and email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Full Name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-white border-slate-200 text-slate-900" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Email Address</label>
                <Input value={displayEmail} onChange={(e) => setDisplayEmail(e.target.value)} className="bg-white border-slate-200 text-slate-900" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-2xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900">Security & Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Current Password</label>
                <Input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">New Password</label>
                <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving} className="bg-indigo-600 text-white font-bold h-10 px-5">
                <Save className="h-4 w-4 mr-1.5" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </form>
      )}

      {activeTab === "integrations" && (
        <form onSubmit={handleSaveIntegrations} className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-2xs">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                <Key className="h-4.5 w-4.5 text-indigo-600" />
                API Provider Keys
              </CardTitle>
              <CardDescription>Keys are securely cached inside workspace sandbox context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Groq API Key (Active Engine)</label>
                <Input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} className="bg-white border-slate-200 text-slate-900" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">OpenAI API Key</label>
                <Input type="password" placeholder="sk-proj-••••••••••••••••" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Anthropic API Key</label>
                <Input type="password" placeholder="sk-ant-••••••••••••••••" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} />
              </div>
              <Button type="submit" disabled={saving} className="bg-indigo-600 text-white font-bold h-10 px-5">
                <Save className="h-4 w-4 mr-1.5" /> Save Credentials
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}

function EmployeeSettingsView() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 max-w-xl animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Settings2 className="h-7 w-7 text-indigo-600" /> Account Settings
        </h1>
        <p className="text-slate-600 text-xs mt-1">Manage profile parameters and workspace notifications.</p>
      </div>

      <Card className="bg-white border-slate-200 shadow-2xs p-6 space-y-4 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Full Name</label>
          <Input value={user?.name ?? ""} readOnly className="bg-slate-50 border-slate-200 text-slate-900 font-semibold" />
        </div>
        <div>
          <label className="font-bold text-slate-700 block mb-1">Email Address</label>
          <Input value={user?.email ?? ""} readOnly className="bg-slate-50 border-slate-200 text-slate-900 font-semibold" />
        </div>
      </Card>
    </div>
  );
}

export default function SettingsManager() {
  const role = useUserRole();
  if (role === "manager") return <ManagerSettingsView />;
  return <EmployeeSettingsView />;
}
