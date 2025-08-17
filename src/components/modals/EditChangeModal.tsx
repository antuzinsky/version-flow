import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Change } from "@/types/change";

interface EditChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  change: Change | null;
  onSave: (content: string) => void;
}

export function EditChangeModal({ open, onOpenChange, change, onSave }: EditChangeModalProps) {
  const [content, setContent] = useState("");

  React.useEffect(() => {
    if (change) {
      setContent(change.content);
    }
  }, [change]);

  const handleSave = () => {
    onSave(content);
    onOpenChange(false);
  };

  if (!change) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Редактировать {change.type === "added" ? "добавление" : "удаление"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Содержимое:</label>
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2 min-h-[200px]"
              placeholder="Введите новый текст..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            Сохранить изменения
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}