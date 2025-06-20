import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCcw, Check, AlertTriangle, History, Clock, Trash2, X, Wand2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getShortcutText } from "@/lib/platform";
import { HistoryEntry } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import TextAdjustmentModal from "@/components/TextAdjustmentModal";

interface EmailReplyResultProps {
  subject?: string;
  content: string;
  onReset: () => void;
  onEdit: () => void;
  onHistorySelect: (entry: HistoryEntry) => void;
  onTextAdjustment: (customPrompt: string) => void;
  isAdjusting: boolean;
}

const EmailReplyResult = ({ 
  subject, 
  content, 
  onReset, 
  onHistorySelect, 
  onTextAdjustment, 
  isAdjusting 
}: EmailReplyResultProps) => {
  const { toast } = useToast();
  const [isSubjectCopied, setIsSubjectCopied] = useState(false);
  const [isContentCopied, setIsContentCopied] = useState(false);
  const [editableContent, setEditableContent] = useState(content);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("emailHistory");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load email generation history:", error);
    }
  }, [content]);

  useEffect(() => {
    setEditableContent(content);
  }, [content]);

  const copyToClipboard = async (text: string, type: "subject" | "content" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === "subject") {
        setIsSubjectCopied(true);
        setTimeout(() => setIsSubjectCopied(false), 2000);
      } else if (type === "content") {
        setIsContentCopied(true);
        setTimeout(() => setIsContentCopied(false), 2000);
      }

      toast({
        title: "コピーしました",
        description: "クリップボードにコピーされました",
      });
    } catch (err) {
      toast({
        title: "エラー",
        description: "コピーに失敗しました",
        variant: "destructive",
      });
    }
  };


  const formatHistoryTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute:'2-digit' });
  };

  const handleDeleteHistory = (idToDelete: string) => {
    try {
      const currentHistoryString = localStorage.getItem("emailHistory");
      if (!currentHistoryString) return;

      const currentHistory: HistoryEntry[] = JSON.parse(currentHistoryString);
      const updatedHistory = currentHistory.filter(entry => entry.id !== idToDelete);

      localStorage.setItem("emailHistory", JSON.stringify(updatedHistory));
      setHistory(updatedHistory);

      toast({
        title: "履歴削除完了",
        description: "選択された履歴を削除しました。",
      });
    } catch (error) {
      console.error("Failed to delete email generation history item:", error);
      toast({
        title: "エラー",
        description: "履歴の削除に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const handleTextAdjustment = (customPrompt: string) => {
    setIsAdjustmentModalOpen(false);
    onTextAdjustment(customPrompt);
  };

  if (!content) {
    return (
      <Card className="w-full h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">生成されたメール</CardTitle>
          {history.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <History className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem disabled className="text-xs text-gray-500">
                  生成履歴 (直近{history.length}件)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {history.map((entry) => (
                  <DropdownMenuItem
                    key={entry.id}
                    onClick={() => onHistorySelect(entry)}
                    className="cursor-pointer flex justify-between items-center pr-2"
                  >
                    <div className="flex items-center overflow-hidden">
                      <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="mr-2 flex-shrink-0">{formatHistoryTimestamp(entry.timestamp)}</span>
                      <span className="truncate text-gray-600">
                        {entry.response.subject || "(件名なし)"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2 flex-shrink-0 text-gray-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistory(entry.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="subject" className="block text-sm font-medium">
                件名
              </label>
            </div>
            <Input id="subject" placeholder="件名がここに表示されます" readOnly className="w-full" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="block text-sm font-medium">
                本文
              </label>
            </div>
            <Textarea
              id="content"
              placeholder="左側で情報を入力して「メール生成」ボタンを押すと、AIが生成したメール本文がここに表示されます"
              readOnly
              className="min-h-[300px] w-full font-mono text-sm"
            />
          </div>

          <div className="flex pt-2">
            <Button
              variant="outline"
              className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200"
              disabled
            >
              <Wand2 className="h-4 w-4 mr-2" />
              文章調整
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-full">
      <Card className="w-full h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">生成されたメール返信</CardTitle>
          {history.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <History className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem disabled className="text-xs text-gray-500">
                  生成履歴 (直近{history.length}件)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {history.map((entry) => (
                  <DropdownMenuItem
                    key={entry.id}
                    onClick={() => onHistorySelect(entry)}
                    className="cursor-pointer flex justify-between items-center pr-2"
                  >
                    <div className="flex items-center overflow-hidden">
                      <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="mr-2 flex-shrink-0">{formatHistoryTimestamp(entry.timestamp)}</span>
                      <span className="truncate text-gray-600">
                        {entry.response.subject || "(件名なし)"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2 flex-shrink-0 text-gray-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistory(entry.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {subject !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="subject" className="block text-sm font-medium">
                  件名
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => subject && copyToClipboard(subject, "subject")}
                  disabled={!subject}
                >
                  {isSubjectCopied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  コピー
                </Button>
              </div>
              <Input id="subject" value={subject || ""} readOnly className="w-full" />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="block text-sm font-medium">
                本文
              </label>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => copyToClipboard(editableContent, "content")}
              >
                {isContentCopied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                コピー
              </Button>
            </div>
            <Textarea
              id="content"
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="min-h-[300px] w-full font-mono text-sm"
            />
          </div>

          <div className="flex pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200"
                    onClick={() => setIsAdjustmentModalOpen(true)}
                    disabled={isAdjusting}
                    data-adjustment-button
                  >
                    {isAdjusting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        調整中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        文章調整
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getShortcutText('e', { ctrl: true })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <TextAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onAdjust={handleTextAdjustment}
        isLoading={isAdjusting}
      />
    </div>
  );
};

export default EmailReplyResult;
