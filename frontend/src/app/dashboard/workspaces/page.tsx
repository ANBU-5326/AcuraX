"use client";

import React, { useState, useEffect } from "react";
import { 
  Building, Plus, Users, ShieldCheck, CheckCircle2, 
  Trash2, Mail, ExternalLink, RefreshCw, Key
} from "lucide-react";
import { client, Workspace } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const MEMBERS = [
  { name: "John Doe", email: "admin@acurax.ai", role: "Owner", status: "active" },
  { name: "Jane Smith", email: "jane@acurax.ai", role: "Member", status: "active" },
  { name: "Arun Kumar", email: "arun@acurax.ai", role: "Member", status: "active" },
  { name: "Sofia Torres", email: "sofia@acurax.ai", role: "Member", status: "pending" },
];

export default function WorkspacesManager() {
  const { success, error } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const [newWsName, setNewWsName] = useState("");
  const [newWsTier, setNewWsTier] = useState("Enterprise");
  const [creating, setCreating] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    client.getWorkspaces().then((data) => {
      setWorkspaces(data);
      if (data.length > 0) setSelectedWs(data[0]);
    }).catch(() => error("Error", "Could not fetch workspaces.")).finally(() => setLoading(false));
  }, [error]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName) return;

    setCreating(true);
    try {
      const created = await client.createWorkspace({ name: newWsName, tier: newWsTier });
      setWorkspaces((prev) => [...prev, created]);
      setSelectedWs(created);
      success("Workspace Created", `Tenant ${created.name} provisioned.`);
      setNewWsName("");
    } catch {
      error("Creation error", "Could not provision workspace.");
    } finally {
      setCreating(false);
    }
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    setTimeout(() => {
      setInviting(false);
      success("Invitation Sent", `Team invite dispatched to ${inviteEmail}.`);
      setInviteEmail("");
    }, 600);
  };

  if (loading) {
    return (
      <div className="h-[40vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-bold">Querying workspace tenants...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl flex items-center gap-2.5">
            <Building className="h-7 w-7 text-indigo-600" />
            Multi-Tenant Workspaces
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            Manage organization tenants, member access controls, and resource quotas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Selector */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-white border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">
              Organization Tenants ({workspaces.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {workspaces.map((ws) => {
                const isSelected = selectedWs?.id === ws.id;
                return (
                  <div
                    key={ws.id}
                    onClick={() => setSelectedWs(ws)}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-200 text-indigo-950 font-bold shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {ws.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{ws.name}</h4>
                        <p className="text-[10px] text-slate-500">{ws.tier} Tenant</p>
                      </div>
                    </div>
                    <Badge variant={isSelected ? "default" : "secondary"}>
                      {ws.tier}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Members Table */}
          <Card className="p-0 overflow-hidden bg-white border-slate-200 shadow-sm">
            <CardHeader className="p-6 border-b border-slate-100 bg-slate-50">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-indigo-600" />
                Team Members Access ({MEMBERS.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Users with access to {selectedWs?.name || "AcuraX Enterprise"}.</CardDescription>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Member</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {MEMBERS.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{m.name}</td>
                      <td className="p-4 text-slate-600">{m.email}</td>
                      <td className="p-4 font-semibold text-slate-800">{m.role}</td>
                      <td className="p-4">
                        <Badge variant={m.status === "active" ? "default" : "secondary"}>
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Side Provisioning Cards */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <Plus className="h-4 w-4 text-indigo-600" />
              Provision New Workspace
            </h3>

            <form onSubmit={handleCreateWorkspace} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Workspace Name</label>
                <Input
                  placeholder="e.g. Finance AI Lab"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  disabled={creating}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Plan Tier</label>
                <select
                  value={newWsTier}
                  onChange={(e) => setNewWsTier(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="Free">Free Sandbox</option>
                  <option value="Developer Pro">Developer Pro</option>
                  <option value="Enterprise">Enterprise Dedicated</option>
                </select>
              </div>

              <Button type="submit" disabled={creating} className="w-full h-10 bg-indigo-600 text-white font-bold">
                {creating ? "Provisioning..." : "Provision Tenant"}
              </Button>
            </form>
          </Card>

          <Card className="p-5 bg-white border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-4">
              <Mail className="h-4 w-4 text-indigo-600" />
              Invite Team Member
            </h3>

            <form onSubmit={handleInviteUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Colleague Email</label>
                <Input
                  type="email"
                  placeholder="colleague@acurax.ai"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviting}
                  required
                />
              </div>

              <Button type="submit" disabled={inviting} className="w-full h-10 bg-indigo-600 text-white font-bold">
                {inviting ? "Sending..." : "Dispatch Invitation"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
