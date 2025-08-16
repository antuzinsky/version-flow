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
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  choice?: 'left' | 'right' | 'custom';
  resolved?: string;
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
  const diff = diffLines(version1.content || '', version2.content || '');
  
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

  const handleChangeAction = (changeId: number, action: 'accept-left' | 'accept-right' | 'edit' | 'reset', customText?: string) => {
    const updatedChanges = changes.map(change => {
      if (change.id === changeId) {
        switch (action) {
          case 'accept-left':
            return { ...change, status: 'rejected' as const, choice: 'left' as const, resolved: undefined };
          case 'accept-right':
            return { ...change, status: 'accepted' as const, choice: 'right' as const, resolved: undefined };
          case 'edit':
            return { ...change, status: 'edited' as const, choice: 'custom' as const, resolved: customText };
          case 'reset':
            return { ...change, status: 'pending' as const, choice: undefined, resolved: undefined };
          default:
            return change;
        }
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
          {side === 'left' ? 'Старая версия (✓ — оставить как было)' : 'Новая версия (✓ — применить изменения)'}
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
                ? change?.choice === 'left'
                  ? 'bg-green-100 border-green-400 text-green-900 font-medium'
                  : change?.choice === 'right'
                  ? 'bg-gray-100 border-gray-300 text-gray-500 line-through'
                  : change?.choice === 'custom'
                  ? 'bg-gray-100 border-gray-300 text-gray-500 line-through'
                  : 'bg-red-50 border-red-300 text-red-800'
                : type === 'new'
                ? change?.choice === 'right'
                  ? 'bg-green-100 border-green-400 text-green-900 font-medium'
                  : change?.choice === 'left'
                  ? 'bg-gray-100 border-gray-300 text-gray-500 line-through'
                  : change?.choice === 'custom'
                  ? 'bg-gray-100 border-gray-300 text-gray-500 line-through'
                  : 'bg-green-50 border-green-300 text-green-800'
                : 'text-foreground border-transparent'
            }`}
            dangerouslySetInnerHTML={{ 
              __html: (change?.choice === 'custom' && change.resolved) 
                ? change.resolved 
                : line || '\u00A0' 
            }}
          />
        ))}
        
        {/* Action buttons for changes */}
        {changeId !== undefined && change && (
          <div className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border rounded shadow-sm p-1 flex gap-1">
            {type === 'old' ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-6 w-6 p-0 ${change.choice === 'left' ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:bg-green-50'}`}
                  onClick={() => handleChangeAction(changeId, 'accept-left')}
                  title="Оставить старый текст"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                  onClick={() => handleChangeAction(changeId, 'reset')}
                  title="Сбросить выбор"
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    const newContent = prompt('Изменить итоговый текст блока:', change.resolved || change.content);
                    if (newContent !== null) {
                      handleChangeAction(changeId, 'edit', newContent);
                    }
                  }}
                  title="Изменить итоговый текст блока"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-6 w-6 p-0 ${change.choice === 'right' ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:bg-green-50'}`}
                  onClick={() => handleChangeAction(changeId, 'accept-right')}
                  title="Принять новое"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                  onClick={() => handleChangeAction(changeId, 'reset')}
                  title="Сбросить выбор"
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    const newContent = prompt('Изменить итоговый текст блока:', change.resolved || change.content);
                    if (newContent !== null) {
                      handleChangeAction(changeId, 'edit', newContent);
                    }
                  }}
                  title="Изменить итоговый текст блока"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </>
            )}
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