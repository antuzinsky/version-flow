import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { diffLines } from "diff";
import { Bot, Send, FileText, Plus, Minus } from "lucide-react";

interface ChangesPanelProps {
  version1Content: string;
  version2Content: string;
  onClose: () => void;
}

const ChangesPanel: React.FC<ChangesPanelProps> = ({ version1Content, version2Content, onClose }) => {
  const [aiQuestion, setAiQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'ai', message: string }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const diff = diffLines(version1Content, version2Content);
  
  const changes = diff.filter(part => part.added || part.removed).map((part, index) => ({
    id: index,
    type: part.added ? 'added' : 'removed',
    content: part.value.trim(),
    lineCount: part.value.split('\n').length - 1
  }));

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
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Сводка изменений:</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Plus className="h-3 w-3 mr-1" />
              {changes.filter(c => c.type === 'added').length} добавлено
            </Badge>
            <Badge variant="outline" className="text-red-600 border-red-200">
              <Minus className="h-3 w-3 mr-1" />
              {changes.filter(c => c.type === 'removed').length} удалено
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Changes List */}
        <div className="flex-1">
          <h3 className="font-medium text-sm mb-3">Список изменений:</h3>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className={`p-2 rounded border text-xs ${
                    change.type === 'added'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="font-medium mb-1">
                    {change.type === 'added' ? 'Добавлено:' : 'Удалено:'}
                  </div>
                  <div className="text-xs opacity-80 line-clamp-3">
                    {change.content.substring(0, 100)}
                    {change.content.length > 100 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChangesPanel;