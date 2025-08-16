import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { diffLines } from "diff";
import { Bot, Send, FileText, Plus, Minus } from "lucide-react";

interface Change {
  id: number;
  type: 'added' | 'removed';
  content: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  modifiedContent?: string;
}

interface ChangesPanelProps {
  version1Content: string;
  version2Content: string;
  changes: Change[];
  onClose: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onReset: () => void;
  onCreateVersion: () => void;
  onNavigateToChange: (changeId: number) => void;
}

const ChangesPanel: React.FC<ChangesPanelProps> = ({ 
  version1Content, 
  version2Content, 
  changes, 
  onClose,
  onAcceptAll,
  onRejectAll,
  onReset,
  onCreateVersion,
  onNavigateToChange
}) => {
  const [aiQuestion, setAiQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'ai', message: string }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const acceptedCount = changes.filter(c => c.status === 'accepted').length;
  const rejectedCount = changes.filter(c => c.status === 'rejected').length;
  const modifiedCount = changes.filter(c => c.status === 'modified').length;
  const pendingCount = changes.filter(c => c.status === 'pending').length;
  
  const allProcessed = pendingCount === 0;

  const handleSendQuestion = () => {
    if (!aiQuestion.trim()) return;
    
    setChatHistory(prev => [
      ...prev,
      { type: 'user', message: aiQuestion },
      { type: 'ai', message: 'Это демо-ответ от AI ассистента. В реальном приложении здесь будет анализ изменений.' }
    ]);
    setAiQuestion("");
  };

  const handleAnalyzeChanges = () => {
    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        { 
          type: 'ai', 
          message: 'Анализ изменений:\n\n• Изменены ключевые пункты договора\n• Обновлены финансовые условия\n• Добавлены новые обязательства\n\nЗадайте мне вопросы для детального разбора.' 
        }
      ]);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Изменения
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* AI Assistant - moved to top */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Ассистент
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAnalyzeChanges}
              disabled={isAnalyzing}
              className="text-xs"
            >
              {isAnalyzing ? 'Анализирую...' : 'Анализировать изменения'}
            </Button>
          </div>
          
          <ScrollArea className="h-32 mb-3">
            <div className="space-y-2">
              {chatHistory.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Нажмите "Анализировать изменения" или задайте вопрос
                </div>
              ) : (
                chatHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs whitespace-pre-line ${
                      message.type === 'ai'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-primary text-primary-foreground ml-4'
                    }`}
                  >
                    {message.message}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              placeholder="Задайте вопрос об изменениях..."
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              className="text-xs resize-none min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuestion();
                }
              }}
            />
            <Button 
              size="sm" 
              onClick={handleSendQuestion}
              disabled={!aiQuestion.trim()}
              className="px-2"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Статистика:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Принято: {acceptedCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Отклонено: {rejectedCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Изменено: {modifiedCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Ожидают: {pendingCount}</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 text-xs">
            <Button variant="outline" size="sm" onClick={onAcceptAll} disabled={pendingCount === 0}>
              Принять всё
            </Button>
            <Button variant="outline" size="sm" onClick={onRejectAll} disabled={pendingCount === 0}>
              Отклонить всё
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={onReset} className="w-full text-xs">
            Сбросить
          </Button>
        </div>

        <Separator />

        {/* Changes Navigation */}
        <div className="flex-1 space-y-3">
          <h3 className="font-medium text-sm">Навигация по изменениям:</h3>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {changes.map((change, index) => (
                <div
                  key={change.id}
                  className={`p-2 rounded border text-xs cursor-pointer transition-colors ${
                    change.status === 'accepted'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : change.status === 'rejected'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : change.status === 'modified'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100'
                  }`}
                  onClick={() => onNavigateToChange(change.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      #{index + 1} {change.status === 'accepted' ? 'Принято' : change.status === 'rejected' ? 'Отклонено' : change.status === 'modified' ? 'Изменено' : 'Ожидает'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {change.type === 'added' ? '+' : '-'}
                    </Badge>
                  </div>
                  <div className="text-xs opacity-80 line-clamp-2">
                    {change.status === 'modified' && change.modifiedContent 
                      ? change.modifiedContent.substring(0, 80)
                      : change.content.substring(0, 80)}
                    {(change.status === 'modified' && change.modifiedContent ? change.modifiedContent.length > 80 : change.content.length > 80) ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Create Version Button */}
        <div className="pt-3 border-t border-border">
          <Button 
            onClick={onCreateVersion}
            disabled={!allProcessed}
            className="w-full"
            variant={allProcessed ? "default" : "outline"}
          >
            {allProcessed ? 'Создать версию' : `Осталось: ${pendingCount}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChangesPanel;