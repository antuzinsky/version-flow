// src/hooks/useDocumentDiff.ts
import { useEffect, useMemo, useState } from "react";
import { diffWords } from "diff";
import { Change } from "@/types/change";

/**
 * Считает diff между двумя строками и даёт утилиты для управления изменениями.
 * Защищено от неожиданных форматов, синхронизирует локальное состояние
 * при пересчёте diff через useEffect.
 */
export function useDocumentDiff(oldText: string, newText: string) {
  /** Пересчитываем diff при изменении текста */
  const computedChanges: Change[] = useMemo(() => {
    const result = diffWords(oldText || "", newText || "");

    // На случай, если библиотека по каким-то причинам вернёт не массив
    const arr = Array.isArray(result) ? result : [];

    const mapped: Change[] = arr.map((part, idx) => ({
      id: idx,
      type: part.added ? "added" : part.removed ? "removed" : null,
      content: part.value ?? "",
      status: "pending",
    }));

    return mapped;
  }, [oldText, newText]);

  /** Живые изменения, с которыми работает пользователь */
  const [changes, setChanges] = useState<Change[]>(computedChanges);

  /**
   * ВАЖНО: когда diff пересчитался (поменялись входы), синхронизируем локальное
   * состояние — иначе в UI останутся старые изменения.
   */
  useEffect(() => {
    setChanges(computedChanges);
  }, [computedChanges]);

  /** Принять/отклонить/сбросить конкретное изменение */
  const applyChange = (
    id: number,
    status: "accepted" | "rejected" | "pending" | "edited"
  ) => {
    setChanges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  /** Пометить все изменения как принятые */
  const applyAll = () => {
    setChanges((prev) => prev.map((c) => ({ ...c, status: "accepted" })));
  };

  /** Пометить все изменения как отклонённые */
  const rejectAll = () => {
    setChanges((prev) => prev.map((c) => ({ ...c, status: "rejected" })));
  };

  /** Сбросить к исходному diff */
  const resetAll = () => {
    setChanges(computedChanges);
  };

  /** Статистика по изменениям */
  const stats = useMemo(() => {
    return {
      accepted: changes.filter((c) => c.status === "accepted").length,
      rejected: changes.filter((c) => c.status === "rejected").length,
      pending: changes.filter((c) => c.status === "pending").length,
      edited: changes.filter((c) => c.status === "edited").length,
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
