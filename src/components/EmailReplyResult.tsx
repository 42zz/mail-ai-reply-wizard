
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, RefreshCcw, Check, Edit } from "lucide-react";

interface EmailReplyResultProps {
  subject?: string;
  content: string;
  onReset: () => void;
  onEdit: () => void;
}

const EmailReplyResult = ({ subject, content, onReset, onEdit }: EmailReplyResultProps) => {
  const { toast } = useToast();
  const [isSubjectCopied, setIsSubjectCopied] = useState(false);
  const [isContentCopied, setIsContentCopied] = useState(false);
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [editableContent, setEditableContent] = useState(content);

  const copyToClipboard = async (text: string, type: "subject" | "content" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === "subject") {
        setIsSubjectCopied(true);
        setTimeout(() => setIsSubjectCopied(false), 2000);
      } else if (type === "content") {
        setIsContentCopied(true);
        setTimeout(() => setIsContentCopied(false), 2000);
      } else {
        setIsAllCopied(true);
        setTimeout(() => setIsAllCopied(false), 2000);
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

  const copyAllToClipboard = async () => {
    const allText = subject ? `${subject}\n\n${editableContent}` : editableContent;
    await copyToClipboard(allText, "all");
  };

  return (
    <div className="w-full animate-fade-in">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">生成されたメール返信</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {subject && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="subject" className="block text-sm font-medium">
                  件名
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => copyToClipboard(subject, "subject")}
                >
                  {isSubjectCopied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  コピー
                </Button>
              </div>
              <Input id="subject" value={subject} readOnly className="w-full" />
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

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onReset}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              新規作成
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              入力を編集
            </Button>
            <Button
              variant="default"
              className="flex-1"
              onClick={copyAllToClipboard}
            >
              {isAllCopied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              全文コピー
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailReplyResult;
