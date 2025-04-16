import { Cog, KeyRound, ExternalLink, RotateCcw } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const SettingsSheet = () => {
  const { model, setModel, systemPrompt, setSystemPrompt, apiKeys, setApiKey } = useSettings();
  const [showApiKeys, setShowApiKeys] = useState(false);
  const { toast } = useToast();

  // デフォルトのシステムプロンプト
  const defaultSystemPrompt = `あなたはプロフェッショナルなメール返信支援AIです。以下のXML形式で提供される情報に基づいて、丁寧で適切なメール返信を作成してください。

<input>
  <current_date>YYYY-MM-DD形式の日付</current_date>
  <signatures>署名の完全なテキスト（改行を含む）</signatures>
  <sender_name>送信者の名前</sender_name>
  <received_message>受信したメッセージの内容</received_message>
  <response_outline>返信内容の概要</response_outline>
</input>

## 返信作成のガイドライン
1. 必要に応じて適切な件名を作成してください
2. 日本のビジネスマナーに沿った丁寧な言葉遣いを使用してください
3. 送信者名を適切に使用し、敬称を付けてください
4. 提供された返信内容の概要に基づいて、具体的かつ明確な返信を作成してください
5. 提供された署名は一切変更せず、完全に同じ形式（スペース、改行、書式など）で適切な場所に配置してください
6. 署名が提供されていない場合は、署名を使用しないでください。
7. 文章の長さは状況に応じて適切に調整してください
8. 文脈に応じて適切な結びの言葉を使用してください

## 出力形式
<output>
  <subject>件名（必要な場合のみ）</subject>
  <content>メール本文</content>
</output>

上記のガイドラインに従って、プロフェッショナルで状況に適したメール返信を作成してください。署名の形式は厳密に守り、一文字も変更しないでください。`;

  // システムプロンプトをリセットする関数
  const resetSystemPrompt = () => {
    setSystemPrompt(defaultSystemPrompt);
    toast({
      title: "リセット完了",
      description: "システムプロンプトをデフォルトに戻しました",
    });
  };

  // APIプロバイダーのドキュメントへのリンク
  const getApiDocLink = () => {
    return "https://platform.openai.com/api-keys";
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
      <SheetContent className="overflow-y-auto sm:max-w-md md:max-w-xl">
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
                <SelectItem value="gpt-4.1">GPT-4o</SelectItem>
                <SelectItem value="gpt-4.1-mini">GPT-4o-mini</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              メール生成に使用するAIモデルを選択します。
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
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="system-prompt">システムプロンプト</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={resetSystemPrompt}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                デフォルトに戻す
              </Button>
            </div>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <Textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[300px] border-0 focus-visible:ring-0 p-0 shadow-none resize-none"
                  autoResize={true}
                  placeholder="AIモデルに与える指示文を入力してください"
                />
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              AIモデルに与える指示文です。メール生成の性質を決定します。編集後は自動的に保存されます。
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
