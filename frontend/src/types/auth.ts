export type UserRole = "employee" | "manager";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
}
