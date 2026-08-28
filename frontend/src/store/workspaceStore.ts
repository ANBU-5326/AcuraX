import { Workspace } from "@/lib/api";

let currentWorkspace: Workspace | null = null;

export function setCurrentWorkspace(ws: Workspace | null) {
  currentWorkspace = ws;
}

export function getCurrentWorkspace(): Workspace | null {
  return currentWorkspace;
}
