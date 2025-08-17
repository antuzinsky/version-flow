import React from "react";
import { Change } from "@/types/change";
import { Button } from "@/components/ui/button";

interface PreviewPanelProps {
  changes: Change[];
  finalContent: string;
  onAcceptVersion: () => void;
  onCancelPreview: () => void;
  isCreating?: boolean;
}

export default function PreviewPanel({
  changes,
  finalContent,
  onAcceptVersion,
  onCancelPreview,
  isCreating = false,
}: PreviewPanelProps) {
  const acceptedChanges = changes.filter(c => c.status === "accepted" && c.type !== null);
  const rejectedChanges = changes.filter(c => c.status === "rejected" && c.type !== null);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold mb-4">Превью новой версии</h2>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div className="bg-green-50 p-3 rounded">
            <h3 className="font-medium text-green-800 mb-2">Принятые изменения</h3>
            <p className="text-green-600">✅ {acceptedChanges.length} изменений</p>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <h3 className="font-medium text-red-800 mb-2">Отклонённые изменения</h3>
            <p className="text-red-600">❌ {rejectedChanges.length} изменений</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onAcceptVersion}
            disabled={isCreating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreating ? "Создание версии..." : "Создать новую версию"}
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancelPreview}
            disabled={isCreating}
          >
            Вернуться к правкам
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <h3 className="font-semibold mb-3">Итоговый документ:</h3>
        <div className="border rounded p-4 bg-white min-h-[400px]">
          <div className="whitespace-pre-wrap leading-7 text-[15px]">
            {finalContent}
          </div>
        </div>
      </div>
    </div>
  );
}