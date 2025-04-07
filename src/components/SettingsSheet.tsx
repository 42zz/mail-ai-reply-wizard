
import { Cog, KeyRound, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/contexts/SettingsContext";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const SettingsSheet = () => {
  const { model, setModel, systemPrompt, setSystemPrompt, apiKeys, setApiKey } = useSettings();
  const [showApiKeys, setShowApiKeys] = useState(false);

  // APIプロバイダーのドキュメントへのリンク
  const getApiDocLink = () => {
    switch (model) {
      case "chatgpt": return "https://platform.openai.com/api-keys";
      case "gemini": return "https://ai.google.dev/tutorials/setup";
      case "claude": return "https://console.anthropic.com/settings/keys";
      case "mistral": return "https://console.mistral.ai/api-keys/";
      default: return "https://platform.openai.com/api-keys";
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          aria-label="設定"
        >
          <Cog className="h-5 w-5" />
          <span className="sr-only">設定</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>設定</SheetTitle>
          <SheetDescription>
            AIモデルとプロンプトの設定を行います。
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="ai-model">AIモデル</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="ai-model">
                <SelectValue placeholder="モデルを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chatgpt">ChatGPT</SelectItem>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="claude">Claude</SelectItem>
                <SelectItem value="mistral">Mistral</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              メール生成に使用するAIモデルを選択します。高性能なモデルほど品質が向上します。
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>APIキー設定</Label>
              <div className="flex space-x-2">
                <a
                  href={getApiDocLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 hover:underline"
                >
                  APIキーを取得 <ExternalLink className="h-3 w-3 ml-1" />
                </a>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowApiKeys(!showApiKeys)}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  {showApiKeys ? "非表示" : "表示"}
                </Button>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800">
              APIキーはお使いのブラウザのローカルストレージに保存され、サーバーには送信されません。
              当アプリはAPIキーを使ってAIモデルに直接リクエストを送信します。
            </div>
            {showApiKeys && (
              <div className="space-y-3 pt-2">
                <div>
                  <Label htmlFor="openai-key" className="text-xs mb-1 block">OpenAI APIキー</Label>
                  <Input
                    id="openai-key"
                    value={apiKeys.openai}
                    onChange={(e) => setApiKey("openai", e.target.value)}
                    placeholder="sk-..."
                    type={showApiKeys ? "text" : "password"}
                  />
                </div>
                <div>
                  <Label htmlFor="gemini-key" className="text-xs mb-1 block">Gemini APIキー</Label>
                  <Input
                    id="gemini-key"
                    value={apiKeys.gemini}
                    onChange={(e) => setApiKey("gemini", e.target.value)}
                    placeholder="API キーを入力"
                    type={showApiKeys ? "text" : "password"}
                  />
                </div>
                <div>
                  <Label htmlFor="claude-key" className="text-xs mb-1 block">Claude APIキー</Label>
                  <Input
                    id="claude-key"
                    value={apiKeys.claude}
                    onChange={(e) => setApiKey("claude", e.target.value)}
                    placeholder="API キーを入力"
                    type={showApiKeys ? "text" : "password"}
                  />
                </div>
                <div>
                  <Label htmlFor="mistral-key" className="text-xs mb-1 block">Mistral APIキー</Label>
                  <Input
                    id="mistral-key"
                    value={apiKeys.mistral}
                    onChange={(e) => setApiKey("mistral", e.target.value)}
                    placeholder="API キーを入力"
                    type={showApiKeys ? "text" : "password"}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-prompt">システムプロンプト</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              AIモデルに与える指示文です。メール生成の性質を決定します。
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
