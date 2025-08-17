// src/demo/fakeChanges.ts
import { Change } from "@/types/change";

export const fakeChanges: Change[] = [
  { id: 1, type: "added", content: "Добавлен пункт 1.2", status: "pending" },
  { id: 2, type: "removed", content: "Удалён пункт 3.1", status: "pending" },
  { id: 3, type: "added", content: "Изменён срок действия договора", status: "pending" },
];
