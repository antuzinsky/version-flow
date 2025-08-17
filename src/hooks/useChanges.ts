// src/hooks/useChanges.ts
import { useState } from "react";
import { Change } from "@/types/change";

export function useChanges(initial: Change[]) {
  const [changes, setChanges] = useState<Change[]>(initial);

  const updateChange = (id: number, status: Change["status"]) => {
    setChanges(prev => prev.map(c => (c.id === id ? { ...c, status } : c)));
  };

  const acceptAll = () => setChanges(prev => prev.map(c => ({ ...c, status: "accepted" })));
  const rejectAll = () => setChanges(prev => prev.map(c => ({ ...c, status: "rejected" })));
  const resetAll = () => setChanges(prev => prev.map(c => ({ ...c, status: "pending" })));

  return { changes, updateChange, acceptAll, rejectAll, resetAll };
}
