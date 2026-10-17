export type Role = "manager" | "staff";

export type Action = "view" | "receive" | "sell" | "write_off" | "transfer" | "import";

export type User = {
  id: string;
  name: string;
  initials: string;
  role: Role;
};

// Repository internal type (not part of Contracts)
export type RepoUser = User;
