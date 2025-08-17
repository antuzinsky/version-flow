import { useState, useMemo } from "react";

export type Change = {
  id: number;
  type: "added" | "removed";
  content: string;
  status: "pending" | "accepted" | "rejected" | "edited";
  choice?: "left" | "right" | "custom";
  resolved?: string;
};

export function useDocumentDiff(initialChanges: Change[]) {
  const [changes, setChanges] = useState<Change[]>(initialChanges);

  // --- агрегаты для статистики ---
  const stats = useMemo(() => {
    return {
      total: changes.length,
      pending: changes.filter(c => c.status === "pending").length,
      accepted: changes.filter(c => c.status === "accepted").length,
      rejected: changes.filter(c => c.status === "rejected").length,
      edited: changes.filter(c => c.status === "edited").length,
    };
  }, [changes]);

  // --- действия ---
  const applyChange = (id: number, newStatus: Change["status"], extra?: Partial<Change>) => {
    setChanges(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status: newStatus, ...extra } : c
      )
    );
  };

  const acceptAll = () => setChanges(prev => prev.map(c => ({ ...c, status: "accepted" })));
  const rejectAll = () => setChanges(prev => prev.map(c => ({ ...c, status: "rejected" })));
  const reset = () => setChanges(prev => prev.map(c => ({ ...c, status: "pending" })));

  return {
    changes,
    stats,
    applyChange,
    acceptAll,
    rejectAll,
    reset,
    setChanges // пригодится если хотим загрузить с сервера новые изменения
  };
}
