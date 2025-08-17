// src/hooks/useDocumentDiff.ts
import { useState, useMemo } from "react";
import { diffWords } from "diff";
import { Change } from "@/types/change";

/**
 * Хук для вычисления diff и управления изменениями
 */
export function useDocumentDiff(oldText: string, newText: string) {
  const [changes, setChanges] = useState<Change[]>([]);

  // Вычисляем diff
  const computedChanges = useMemo(() => {
    const result = diffWords(oldText || "", newText || "");
    console.log("diffWords result:", result);

    return result.map((part, index) => {
      let type: "added" | "removed" | null = null;
      if (part.added) type = "added";
      if (part.removed) type = "removed";

      return {
        id: index,
        type,
        content: part.value,
        status: "pending" as const,
      };
    });
  }, [oldText, newText]);

  // Инициализируем изменения только один раз
  useState(() => {
    setChanges(computedChanges);
  });

  const applyChange = (id: number, action: "accept" | "reject") => {
    setChanges((prev) =>
      prev.map((ch) =>
        ch.id === id
          ? { ...ch, status: action === "accept" ? "accepted" : "rejected" }
          : ch
      )
    );
  };

  const applyAll = () => {
    setChanges((prev) =>
      prev.map((ch) =>
        ch.status === "pending" ? { ...ch, status: "accepted" } : ch
      )
    );
  };

  const rejectAll = () => {
    setChanges((prev) =>
      prev.map((ch) =>
        ch.status === "pending" ? { ...ch, status: "rejected" } : ch
      )
    );
  };

  const resetAll = () => {
    setChanges(computedChanges);
  };

  const stats = useMemo(() => {
    return {
      total: changes.length,
      accepted: changes.filter((c) => c.status === "accepted").length,
      rejected: changes.filter((c) => c.status === "rejected").length,
      edited: changes.filter((c) => c.status === "edited").length,
      pending: changes.filter((c) => c.status === "pending").length,
    };
  }, [changes]);

  return {
    changes,
    applyChange,
    applyAll,
    rejectAll,
    resetAll,
    stats,
  };
}
