import { Agent } from "@/lib/api";

let selectedAgent: Agent | null = null;

export function setSelectedAgent(agent: Agent | null) {
  selectedAgent = agent;
}

export function getSelectedAgent(): Agent | null {
  return selectedAgent;
}
