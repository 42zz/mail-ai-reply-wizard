import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wand2 } from "lucide-react";

interface TextAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdjust: (customPrompt: string) => void;
  isLoading: boolean;
}

const TextAdjustmentModal = ({ 
  isOpen, 
  onClose, 
  onAdjust, 
  isLoading 
}: TextAdjustmentModalProps) => {
  const [customPrompt, setCustomPrompt] = useState("");

  const handleSubmit = () => {
    if (customPrompt.trim()) {
      onAdjust(customPrompt.trim());
      setCustomPrompt("");
    }
  };

  const handleClose = () => {
    setCustomPrompt("");
    onClose();
  };

  const suggestedPrompts = [
    "もっと柔らかい文面にして",
    "より丁寧な表現に変更して",
    "簡潔にまとめて",
    "詳細な説明を追加して",
    "カジュアルなトーンに変更して",
    "感謝の気持ちを強調して"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            文章調整
          </DialogTitle>
          <DialogDescription>
            現在の文章をどのように調整したいか指示してください。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="customPrompt" className="text-sm font-medium">
              調整指示
            </Label>
            <Textarea
              id="customPrompt"
              placeholder="例: もっと柔らかい文面にして、感謝の気持ちを強調してください"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="mt-1 min-h-[100px]"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-2 block">
              よく使われる調整指示（クリックで入力）
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2 px-3 text-xs text-left justify-start whitespace-normal"
                  onClick={() => setCustomPrompt(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!customPrompt.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                調整中...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                調整実行
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TextAdjustmentModal;