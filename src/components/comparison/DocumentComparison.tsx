import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { diffLines } from "diff";

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
}

const DocumentComparison: React.FC<DocumentComparisonProps> = ({ version1, version2 }) => {
  const diff = diffLines(version1.content, version2.content);

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

  const renderDiffContent = (content: string, type: 'old' | 'new' | 'unchanged') => {
    const lines = content.split('\n');
    
    return lines.map((line, index) => (
      <div
        key={index}
        className={`px-3 py-1 text-sm leading-relaxed ${
          type === 'old' 
            ? 'bg-red-50 border-l-4 border-red-300 text-red-800' 
            : type === 'new'
            ? 'bg-green-50 border-l-4 border-green-300 text-green-800'
            : 'text-foreground'
        }`}
        dangerouslySetInnerHTML={{ __html: line || '\u00A0' }}
      />
    ));
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
                return (
                  <div key={index}>
                    {renderDiffContent(part.value, 'old')}
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
                return (
                  <div key={index}>
                    {renderDiffContent(part.value, 'new')}
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