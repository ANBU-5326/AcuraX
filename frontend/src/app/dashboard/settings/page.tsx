"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Settings2, ShieldAlert, Key, Save, RefreshCw,
  Sliders, ToggleLeft, ToggleRight, Users, UserCircle2,
  Plug, Mail, Lock, Camera, CheckCircle
} from "lucide-react";
import { client } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import RoleGate from "@/components/layout/RoleGate";
import { useAuth, useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

type Tab = "personal" | "team" | "integrations";

// Mock team members for the Team tab (manager only)
const TEAM_MEMBERS = [
  { id: "usr-mgr-001", name: "John Doe",    email: "admin@acurax.ai", role: "Manager",  status: "active" },
  { id: "usr-emp-002", name: "Jane Smith",  email: "jane@acurax.ai",  role: "Employee", status: "active" },
  { id: "usr-emp-003", name: "Arun Kumar",  email: "arun@acurax.ai",  role: "Employee", status: "active" },
  { id: "usr-emp-004", name: "Sofia Torres",email: "sofia@acurax.ai", role: "Employee", status: "pending" },
];

// ── Manager Settings View (Original) ──────────────────────────────────────────

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
    await new Promise((r) => setTimeout(r, 800));
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
        <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Checking settings hashes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">System Preferences</h1>
        <p className="text-slate-400 text-xs mt-1">Configure API credential binders, team roster, and default execution parameters.</p>
      </div>

      <div className="flex gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/60"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "personal" && (
        <form onSubmit={handleSavePersonal} className="space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Camera className="h-4.5 w-4.5 text-violet-400" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white border-2 border-violet-500/30 shadow-lg">
                {displayName.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">{displayName || "Your Name"}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{displayEmail}</p>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 inline-block bg-violet-600/20 text-violet-450 border border-violet-500/30">
                  Manager
                </span>
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UserCircle2 className="h-4.5 w-4.5 text-violet-400" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your display name and email address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </label>
                <Input type="email" value={displayEmail} onChange={(e) => setDisplayEmail(e.target.value)} placeholder="your@email.com" />
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-violet-400" />
                Change Password
              </CardTitle>
              <CardDescription>Leave blank if you don't want to change your password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Current Password</label>
                <Input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">New Password</label>
                <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving} className="h-10 px-6">
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </form>
      )}

      {activeTab === "team" && (
        <div className="space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-violet-400" />
                Team Members
              </CardTitle>
              <CardDescription>Manage members, assign roles, and invite new colleagues.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TEAM_MEMBERS.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800 hover:bg-slate-900/60 transition-all">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm border ${
                      member.role === "Manager"
                        ? "bg-violet-600/20 text-violet-350 border-violet-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200">{member.name}</p>
                      <p className="text-[10px] text-slate-500">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        member.role === "Manager"
                          ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                          : "bg-slate-800 text-slate-500 border border-slate-700"
                      }`}>
                        {member.role}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        member.status === "active" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                      }`}>
                        {member.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/60">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Invite New Member</h4>
                <div className="flex gap-2">
                  <Input placeholder="colleague@acurax.ai" className="flex-1" />
                  <Button className="h-10 text-xs">
                    <Mail className="h-3.5 w-3.5 mr-2" />
                    Send Invite
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "integrations" && (
        <form onSubmit={handleSaveIntegrations} className="space-y-6">
          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-violet-400" />
                API Provider Keys
              </CardTitle>
              <CardDescription>Keys are securely encrypted and cached locally inside sandbox context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">OpenAI Api Key</label>
                <Input type="password" placeholder="sk-proj-••••••••••••••••" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Anthropic Api Key</label>
                <Input type="password" placeholder="sk-ant-••••••••••••••••" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-violet-400" />
                Workspace Defaults
              </CardTitle>
              <CardDescription>Set fallback agent configuration parameters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Fallback AI Model</label>
                <select value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Recommended)</option>
                  <option value="GPT-4o">GPT-4o</option>
                  <option value="Llama 3.1 70B">Llama 3.1 70B</option>
                  <option value="GPT-3.5 Turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
              <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Telemetry Auto-Save</span>
                  <span className="text-[10px] text-slate-500 block">Cache model token counts instantly</span>
                </div>
                <button type="button" onClick={() => setAutoSave(!autoSave)} className="text-slate-400 hover:text-white transition-colors">
                  {autoSave ? <ToggleRight className="h-6 w-6 text-emerald-400" /> : <ToggleLeft className="h-6 w-6 text-slate-600" />}
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="p-3 bg-rose-950/15 border border-rose-900/30 text-[10px] rounded-lg text-rose-300 leading-relaxed flex items-start gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
            <span>
              <strong>Attention:</strong> De-authenticating keys will disconnect active agent routing scripts. Be sure to double-check key formats (sk-...) before submitting changes.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving} className="h-10 px-6">
              <Save className="h-4 w-4 mr-2" />
              Save Parameters
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Employee Settings View (New Polished Single-Column Layout) ─────────────────

function EmployeeSettingsView() {
  const { success, error } = useToast();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [displayEmail, setDisplayEmail] = useState(user?.email ?? "");
  const [avatarChar, setAvatarChar] = useState(user?.name?.charAt(0) ?? "U");
  
  // Passwords
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPw, setUpdatingPw] = useState(false);

  // Notification Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  // Track initial values to disable Save button unless dirty
  const [initialName, setInitialName] = useState(user?.name ?? "");
  const [initialEmailPrefs, setInitialEmailPrefs] = useState(true);
  const [initialInAppPrefs, setInitialInAppPrefs] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name ?? "");
      setDisplayEmail(user.email ?? "");
      setAvatarChar(user.name?.charAt(0) ?? "U");
      setInitialName(user.name ?? "");
    }
  }, [user]);

  // Check if fields are modified
  const isProfileDirty = 
    displayName !== initialName ||
    emailNotifications !== initialEmailPrefs ||
    inAppNotifications !== initialInAppPrefs;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      success("Photo Uploaded", "Your profile photo has been updated successfully.");
      // Simulating avatar character update to first char of loaded file name or similar
      const name = e.target.files[0].name;
      setAvatarChar(name.charAt(0).toUpperCase());
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProfileDirty) return;
    setSavingProfile(true);
    
    // Simulate API update
    await new Promise((r) => setTimeout(r, 800));
    setInitialName(displayName);
    setInitialEmailPrefs(emailNotifications);
    setInitialInAppPrefs(inAppNotifications);
    setSavingProfile(false);
    success("Profile Updated", "Your profile preferences were successfully saved.");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      error("Field Validation", "Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      error("Match Error", "New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      error("Complexity Requirement", "Password must be at least 8 characters long.");
      return;
    }

    setUpdatingPw(true);
    await new Promise((r) => setTimeout(r, 1000));
    setUpdatingPw(false);
    
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    success("Password Updated", "Your authentication keys were successfully rotated.");
  };

  return (
    <div className="max-w-[640px] mx-auto space-y-8 pb-24 animate-fade-in relative">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
          Personal Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your profile details, secure credentials, and preferences.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* PROFILE PICTURE CARD */}
        <Card className="border-white/10 bg-white/[0.02] p-6 rounded-xl" glass>
          <CardContent className="p-0 flex flex-col sm:flex-row items-center gap-6">
            <div 
              onClick={handleAvatarClick}
              className={cn(
                "group relative h-20 w-20 rounded-full cursor-pointer flex items-center justify-center font-black text-3xl text-white select-none border-2 border-violet-500/20",
                "bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-xl shadow-violet-900/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              )}
              tabIndex={0}
              aria-label="Upload a new profile photo"
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleAvatarClick(); }}
            >
              <div className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold gap-1 text-slate-100">
                <Camera className="h-4.5 w-4.5 text-white" />
                <span>Upload</span>
              </div>
              {avatarChar}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              className="hidden" 
              accept="image/*"
            />

            <div className="text-center sm:text-left">
              <h3 className="text-sm font-bold text-slate-200">{displayName || "Loading..."}</h3>
              <p className="text-xs text-slate-500 mt-1">Click the profile photo to upload a new JPG or PNG. Recommended size: 250x250px.</p>
            </div>
          </CardContent>
        </Card>

        {/* GENERAL PROFILE INFO */}
        <Card className="border-white/10 bg-white/[0.02] p-6 rounded-xl" glass>
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-900">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserCircle2 className="h-5 w-5 text-violet-400" />
              General Details
            </CardTitle>
            <CardDescription className="text-xs">Update your corporate presentation details.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-355">Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full Name"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-550/40",
                  "transition-all duration-150"
                )}
                aria-label="Full Name"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-355 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={displayEmail}
                  readOnly
                  className={cn(
                    "w-full pl-3.5 pr-28 py-2.5 rounded-lg border border-slate-900 bg-slate-950/65 text-xs text-slate-500 select-none cursor-not-allowed font-medium"
                  )}
                  aria-label="Email Address (read-only)"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 px-2 py-1 rounded text-[9px] font-bold text-slate-400 uppercase select-none">
                  <Lock className="h-3 w-3 text-slate-500" />
                  <span>SSO Managed</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-550 mt-1">Managed via workspace enterprise Single Sign-On credentials.</p>
            </div>
          </CardContent>
        </Card>

        {/* NOTIFICATION PREFERENCES */}
        <Card className="border-white/10 bg-white/[0.02] p-6 rounded-xl" glass>
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-900">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-violet-400" />
              Notification Preferences
            </CardTitle>
            <CardDescription className="text-xs">Adjust how you receive alerts and communications.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            
            {/* Email preference */}
            <div className="flex items-center justify-between py-2 border-b border-slate-900/60">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Email Notifications</span>
                <span className="text-[10px] text-slate-500 block">Receive workspace summaries and security logs.</span>
              </div>
              <button 
                type="button" 
                onClick={() => setEmailNotifications(!emailNotifications)} 
                className="text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg p-1"
                aria-label="Toggle email notifications"
              >
                {emailNotifications ? <ToggleRight className="h-6.5 w-6.5 text-emerald-450" /> : <ToggleLeft className="h-6.5 w-6.5 text-slate-700" />}
              </button>
            </div>

            {/* In-app preference */}
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-bold text-slate-200 block">In-app Notifications</span>
                <span className="text-[10px] text-slate-500 block">Receive instant telemetry status inside AcuraX workspace.</span>
              </div>
              <button 
                type="button" 
                onClick={() => setInAppNotifications(!inAppNotifications)} 
                className="text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg p-1"
                aria-label="Toggle in-app notifications"
              >
                {inAppNotifications ? <ToggleRight className="h-6.5 w-6.5 text-emerald-450" /> : <ToggleLeft className="h-6.5 w-6.5 text-slate-700" />}
              </button>
            </div>

          </CardContent>
        </Card>

        {/* STICKY SAVE PROFILE FOOTER */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-slate-950/85 backdrop-blur-md border-t border-slate-900 p-4 flex justify-end z-30">
          <div className="max-w-[640px] w-full mx-auto flex justify-end">
            <Button 
              type="submit" 
              loading={savingProfile} 
              disabled={!isProfileDirty || savingProfile}
              className="h-10 px-8 text-xs font-bold bg-violet-650 hover:bg-violet-600 active:bg-violet-700 text-white disabled:opacity-40 disabled:hover:bg-violet-650"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Profile Settings
            </Button>
          </div>
        </div>

      </form>

      {/* CHANGE PASSWORD */}
      <form onSubmit={handleUpdatePassword} className="space-y-6 pt-4">
        <Card className="border-white/10 bg-white/[0.02] p-6 rounded-xl" glass>
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-900">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Key className="h-5 w-5 text-violet-400" />
              Change Password
            </CardTitle>
            <CardDescription className="text-xs">Update your security keys periodically to protect your credentials.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            
            {/* Current Pw */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-355">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-550/40",
                  "transition-all duration-150"
                )}
                aria-label="Current Password"
              />
            </div>

            {/* New Pw */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-355">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-550/40",
                  "transition-all duration-150"
                )}
                aria-label="New Password"
              />
            </div>

            {/* Confirm Pw */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-355">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-200",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-550/40",
                  "transition-all duration-150"
                )}
                aria-label="Confirm New Password"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                loading={updatingPw}
                disabled={!currentPassword || !newPassword || !confirmPassword || updatingPw}
                className="h-10 px-6 text-xs font-bold"
              >
                Update Password
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>

    </div>
  );
}

// ── Default Export ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const role = useUserRole();

  if (role === "manager") {
    return <ManagerSettingsView />;
  }

  return <EmployeeSettingsView />;
}
