import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { diffLines } from "diff";
import { Check, X, Edit } from "lucide-react";

interface Change {
  id: number;
  type: 'added' | 'removed';
  content: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  modifiedContent?: string;
}

interface DocumentComparisonProps {
  version1: {
    id: string;
    version_number?: number;
    content: string;
    created_by: string;
    created_at: string;
    isLatest?: boolean;
  };
  version2: {
    id: string;
    version_number?: number;
    content: string;
    created_by: string;
    created_at: string;
    isLatest?: boolean;
  };
  onChangesUpdate?: (changes: Change[]) => void;
}

const DocumentComparison: React.FC<DocumentComparisonProps> = ({ version1, version2, onChangesUpdate }) => {
  const diff = diffLines(version1.content, version2.content);
  
  // Create changes array from diff
  const [changes, setChanges] = useState<Change[]>(() => {
    return diff
      .filter(part => part.added || part.removed)
      .map((part, index) => ({
        id: index,
        type: part.added ? 'added' : 'removed',
        content: part.value.trim(),
        status: 'pending'
      }));
  });

  const handleChangeAction = (changeId: number, action: 'accept' | 'reject' | 'modify', modifiedContent?: string) => {
    const updatedChanges = changes.map(change => {
      if (change.id === changeId) {
        return {
          ...change,
          status: action === 'accept' ? 'accepted' as const : action === 'reject' ? 'rejected' as const : 'modified' as const,
          modifiedContent: action === 'modify' ? modifiedContent : undefined
        };
      }
      return change;
    });
    setChanges(updatedChanges);
    onChangesUpdate?.(updatedChanges);
  };

  const renderVersionHeader = (version: typeof version1, side: 'left' | 'right') => (
    <CardHeader className="pb-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">
          {version.isLatest ? 'Latest (Compiled)' : `V${version.version_number}`}
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {side === 'left' ? 'Старая версия' : 'Новая версия'}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground">
        {new Date(version.created_at).toLocaleDateString()} • {version.created_by}
      </div>
    </CardHeader>
  );

  const renderDiffContent = (content: string, type: 'old' | 'new' | 'unchanged', changeId?: number) => {
    const lines = content.split('\n');
    const change = changeId !== undefined ? changes.find(c => c.id === changeId) : null;
    
    return (
      <div className="relative group">
        {lines.map((line, index) => (
          <div
            key={index}
            className={`px-3 py-1 text-sm leading-relaxed border-l-4 ${
              type === 'old' 
                ? change?.status === 'accepted' 
                  ? 'bg-gray-100 border-gray-300 text-gray-500 line-through'
                  : change?.status === 'rejected'
                  ? 'bg-red-50 border-red-300 text-red-800'
                  : 'bg-red-50 border-red-300 text-red-800'
                : type === 'new'
                ? change?.status === 'accepted'
                  ? 'bg-green-100 border-green-400 text-green-900 font-medium'
                  : change?.status === 'rejected'
                  ? 'bg-gray-100 border-gray-300 text-gray-500 line-through'
                  : change?.status === 'modified'
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-green-50 border-green-300 text-green-800'
                : 'text-foreground border-transparent'
            }`}
            dangerouslySetInnerHTML={{ 
              __html: (change?.status === 'modified' && change.modifiedContent) 
                ? change.modifiedContent 
                : line || '\u00A0' 
            }}
          />
        ))}
        
        {/* Action buttons for changes */}
        {changeId !== undefined && change && change.status === 'pending' && (
          <div className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border rounded shadow-sm p-1 flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
              onClick={() => handleChangeAction(changeId, 'accept')}
              title="Принять"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
              onClick={() => handleChangeAction(changeId, 'reject')}
              title="Отклонить"
            >
              <X className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
              onClick={() => {
                const newContent = prompt('Введите новый текст:', change.content);
                if (newContent !== null) {
                  handleChangeAction(changeId, 'modify', newContent);
                }
              }}
              title="Изменить"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Left version */}
      <Card className="flex flex-col h-full">
        {renderVersionHeader(version1, 'left')}
        <Separator />
        <CardContent className="flex-1 overflow-auto p-0">
          <div className="font-mono text-sm">
            {diff.map((part, index) => {
              if (part.removed) {
                const changeId = changes.findIndex(c => c.type === 'removed' && c.content === part.value.trim());
                return (
                  <div key={index} id={`change-${changeId >= 0 ? changeId : index}`}>
                    {renderDiffContent(part.value, 'old', changeId >= 0 ? changeId : undefined)}
                  </div>
                );
              } else if (!part.added) {
                return (
                  <div key={index}>
                    {renderDiffContent(part.value, 'unchanged')}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </CardContent>
      </Card>

      {/* Right version */}
      <Card className="flex flex-col h-full">
        {renderVersionHeader(version2, 'right')}
        <Separator />
        <CardContent className="flex-1 overflow-auto p-0">
          <div className="font-mono text-sm">
            {diff.map((part, index) => {
              if (part.added) {
                const changeId = changes.findIndex(c => c.type === 'added' && c.content === part.value.trim());
                return (
                  <div key={index} id={`change-${changeId >= 0 ? changeId : index}`}>
                    {renderDiffContent(part.value, 'new', changeId >= 0 ? changeId : undefined)}
                  </div>
                );
              } else if (!part.removed) {
                return (
                  <div key={index}>
                    {renderDiffContent(part.value, 'unchanged')}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentComparison;