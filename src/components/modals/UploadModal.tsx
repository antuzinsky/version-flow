import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docTitle: string;
  docFile: File | null;
  onDocTitleChange: (title: string) => void;
  onDocFileChange: (file: File | null) => void;
  onUploadDocument: (e: React.FormEvent) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  open,
  onOpenChange,
  docTitle,
  docFile,
  onDocTitleChange,
  onDocFileChange,
  onUploadDocument,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Document</Label>
            <Input 
              placeholder="Document title" 
              value={docTitle} 
              onChange={(e) => onDocTitleChange(e.target.value)} 
            />
            <Input 
              type="file" 
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
              onChange={(e) => onDocFileChange(e.target.files?.[0] ?? null)} 
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={onUploadDocument}
              disabled={!docFile || !docTitle.trim()}
            >
              Upload Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};