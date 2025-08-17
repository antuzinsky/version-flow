// src/types/change.ts
export interface Change {
  id: number;
  type: "added" | "removed";
  content: string;
  status: "pending" | "accepted" | "rejected";
}
