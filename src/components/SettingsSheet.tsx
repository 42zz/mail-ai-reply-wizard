import { Cog, KeyRound, ExternalLink, RotateCcw, Download, Upload } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

const SettingsSheet = () => {
  const { model, setModel, systemPrompt, setSystemPrompt, apiKeys, setApiKey, signatureTemplates, styleExamples } =
    useSettings();
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

  // 設定をエクスポートする関数
  const exportSettings = () => {
    try {
      const settings = {
        model,
        systemPrompt,
        apiKeys,
        signatureTemplates,
        styleExamples,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };

      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mail-ai-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "エクスポート完了",
        description: "設定をファイルに保存しました。",
      });
    } catch (error) {
      toast({
        title: "エクスポートエラー",
        description: "設定のエクスポートに失敗しました。",
        variant: "destructive",
      });
    }
  };

  // 設定をインポートする関数
  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;

        const settings = JSON.parse(result);
        
        // 基本的なバリデーション
        if (!settings || typeof settings !== 'object') {
          throw new Error('Invalid settings format');
        }

        // 設定を適用
        if (settings.model && typeof settings.model === 'string') {
          setModel(settings.model);
        }
        if (settings.systemPrompt && typeof settings.systemPrompt === 'string') {
          setSystemPrompt(settings.systemPrompt);
        }
        if (settings.apiKeys && typeof settings.apiKeys === 'object') {
          if (settings.apiKeys.openai && typeof settings.apiKeys.openai === 'string') {
            setApiKey('openai', settings.apiKeys.openai);
          }
        }
        
        // signatureTemplatesとstyleExamplesはlocalStorageに直接設定
        if (Array.isArray(settings.signatureTemplates)) {
          localStorage.setItem('signature_templates', JSON.stringify(settings.signatureTemplates));
        }
        if (Array.isArray(settings.styleExamples)) {
          localStorage.setItem('style_examples', JSON.stringify(settings.styleExamples));
        }

        toast({
          title: "インポート完了",
          description: "設定を読み込みました。ページを再読み込みしてください。",
        });

        // ページをリロードして設定を反映
        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (error) {
        toast({
          title: "インポートエラー",
          description: "設定ファイルの読み込みに失敗しました。ファイル形式を確認してください。",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    // ファイル選択をリセット
    event.target.value = '';
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
                <SelectItem value="gpt-5">GPT-5</SelectItem>
                <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o-mini</SelectItem>
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
                  <Label htmlFor="openai-key" className="text-xs mb-1 block">
                    OpenAI APIキー
                  </Label>
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

          <Separator />

          <div className="space-y-3">
            <Label>設定のバックアップ</Label>
            <p className="text-xs text-muted-foreground">
              ブラウザ環境を変更する際の設定移行にご利用ください。
            </p>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={exportSettings}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                設定をエクスポート
              </Button>
              <div className="flex-1">
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                  id="import-settings"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('import-settings')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  設定をインポート
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
