// src/types/change.ts
export interface Change {
  id: number;
  type: "added" | "removed" | null;
  content: string;
  status: "pending" | "accepted" | "rejected" | "edited";
}
