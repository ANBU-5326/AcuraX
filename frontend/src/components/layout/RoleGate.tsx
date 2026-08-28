"use client";

import React from "react";
import { useUserRole } from "@/hooks/useUserRole";
import type { UserRole } from "@/types/auth";

interface RoleGateProps {
  /** Roles that are allowed to see the children. */
  allow: UserRole[];
  children: React.ReactNode;
}

/**
 * <RoleGate allow={["manager"]}>
 *   <SomeManagerOnlyComponent />
 * </RoleGate>
 *
 * Renders children ONLY when the current user's role is in the `allow` list.
 * If access is denied, returns null — nothing is rendered or put into the DOM.
 */
export default function RoleGate({ allow, children }: RoleGateProps) {
  const role = useUserRole();
  if (!allow.includes(role)) return null;
  return <>{children}</>;
}
