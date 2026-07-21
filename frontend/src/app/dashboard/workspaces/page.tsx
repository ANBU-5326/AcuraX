"use client";

import React, { useState, useEffect } from "react";
import { 
  Building, Users, CreditCard, Plus, Trash2, 
  RefreshCw, CheckCircle2, Shield, Calendar, Sparkles
} from "lucide-react";
import { client, Workspace } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function WorkspacesAdmin() {
  const { success, error } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWSName, setNewWSName] = useState("");
  const [creating, setCreating] = useState(false);

  // Mock members lists
  const members = [
    { name: "John Doe", email: "admin@acurax.ai", role: "Workspace Owner", status: "active" },
    { name: "Sarah Connor", email: "sarah@acurax.ai", role: "Developer Coordinator", status: "active" },
    { name: "David Lightman", email: "david@sandbox.net", role: "Audit Tester", status: "invited" }
  ];

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const data = await client.getWorkspaces();
      setWorkspaces(data);
    } catch {
      error("Error", "Could not load workspaces.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreateWS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWSName) return;
    
    setCreating(true);
    try {
      const added = await client.createWorkspace(newWSName);
      setWorkspaces(prev => [...prev, added]);
      success("Workspace Initialized", `Tenant "${added.name}" is now live.`);
      setNewWSName("");
    } catch {
      error("Failed to create", "Could not initialize new workspace container.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[40vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-violet-500 animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Querying workspaces registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
          Multi-Tenancy Workspaces
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Switch active developer containers, add team members, and check billing parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workspaces list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active containers */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building className="h-4.5 w-4.5 text-violet-400" />
                Active Tenant Registry
              </CardTitle>
              <CardDescription>Multi-tenancy developer nodes mapped to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/30 border border-slate-900 hover:border-slate-800 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/15 flex items-center justify-center font-extrabold text-sm shrink-0">
                        {ws.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{ws.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Role: {ws.role} • Registered on {ws.created_at}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-[9px]">{ws.tier} Plan</Badge>
                      <span className="text-xs text-slate-500">{ws.members} users</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Members list */}
          <Card glass>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-violet-400" />
                Collaborators & Roles
              </CardTitle>
              <CardDescription>Auditors, developers, and owners allowed inside this cockpit.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-900 font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Workspace Role</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {members.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-bold text-slate-200">{m.name}</td>
                        <td className="p-3 text-slate-400">{m.email}</td>
                        <td className="p-3">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-slate-500" />
                            {m.role}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant={m.status === "active" ? "success" : "outline"} className="text-[9px]">
                            {m.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Create and Subscription sidebar */}
        <div className="space-y-6">
          {/* Create new WS form */}
          <Card className="p-5" glass>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-4">
              <Plus className="h-4 w-4 text-violet-400" />
              Launch New Tenant
            </h3>

            <form onSubmit={handleCreateWS} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Workspace Identifier Name</label>
                <Input
                  placeholder="e.g. Production Team C"
                  value={newWSName}
                  onChange={(e) => setNewWSName(e.target.value)}
                  disabled={creating}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-10 mt-1" loading={creating}>
                <Building className="h-4 w-4 mr-2" />
                Spin Up Workspace
              </Button>
            </form>
          </Card>

          {/* Subscription info */}
          <Card className="p-5" glass>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-900 pb-2 mb-4">
              <CreditCard className="h-4 w-4 text-violet-400" />
              Subscription Status
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border border-violet-900/30 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-violet-400 uppercase font-bold tracking-widest">Active Plan</span>
                  <h4 className="text-sm font-black text-slate-100 mt-0.5">Developer Pro Sandbox</h4>
                </div>
                <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/20">PRO</Badge>
              </div>

              <div className="divide-y divide-slate-800/60 font-semibold space-y-2.5">
                <div className="flex justify-between pt-2.5 first:pt-0">
                  <span className="text-slate-500">Monthly invoice charge</span>
                  <span className="text-slate-200 font-bold">$12.00 / month</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-slate-500">Maximum connected members</span>
                  <span className="text-slate-200 font-bold">15 users max</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-slate-500">Index storage limit</span>
                  <span className="text-slate-200 font-bold">50 MB max</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-slate-500">Renewal timeline</span>
                  <span className="text-slate-400 flex items-center gap-1 font-bold">
                    <Calendar className="h-3.5 w-3.5" />
                    July 10, 2026
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800/60 pt-4 flex justify-end">
                <span className="text-[10px] text-violet-400 font-bold cursor-pointer hover:underline flex items-center gap-1">
                  Upgrade to Enterprise
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </span>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
