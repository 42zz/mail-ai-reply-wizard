
import { useState } from "react";
import EmailReplyForm, { EmailFormData } from "@/components/EmailReplyForm";
import EmailReplyResult from "@/components/EmailReplyResult";
import { generateEmailReply } from "@/lib/emailGeneration";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Mail, Sparkles, AlertTriangle, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { toast } = useToast();
  const { model, apiKeys } = useSettings();
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState<string | undefined>(undefined);
  const [generatedContent, setGeneratedContent] = useState("");
  
  // Get the appropriate API key based on selected model
  const getApiKey = () => {
    switch (model) {
      case "chatgpt": return apiKeys.openai;
      case "gemini": return apiKeys.gemini;
      case "claude": return apiKeys.claude;
      case "mistral": return apiKeys.mistral;
      default: return apiKeys.openai;
    }
  };
  
  const getApiKeyDisplayName = () => {
    switch (model) {
      case "chatgpt": return "OpenAI";
      case "gemini": return "Gemini";
      case "claude": return "Claude";
      case "mistral": return "Mistral";
      default: return "OpenAI";
    }
  };
  
  const hasApiKey = !!getApiKey() && getApiKey().trim() !== "";

  const handleFormSubmit = async (formData: EmailFormData) => {
    setIsLoading(true);
    try {
      if (!hasApiKey) {
        toast({
          title: "APIキーエラー",
          description: `${getApiKeyDisplayName()} APIキーが設定されていません。設定画面で追加してください。`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const requestData = {
        date: format(formData.date, "yyyy-MM-dd"),
        signatures: formData.signature,
        sender_name: formData.senderName,
        recipient_name: "様", // 受信者名の代わりに敬称のみ使用
        received_message: formData.receivedMessage,
        response_outline: formData.responseOutline,
        model,
      };

      const response = await generateEmailReply(requestData, getApiKey());

      if (response.success) {
        setGeneratedSubject(response.subject);
        setGeneratedContent(response.content);
        setShowResult(true);
      } else {
        // エラーの種類に基づいたメッセージを表示
        let errorMessage = "メール生成中にエラーが発生しました。もう一度お試しください。";
        
        if (response.error === "API_KEY_MISSING") {
          errorMessage = `${getApiKeyDisplayName()} APIキーが設定されていません。設定画面で追加してください。`;
        } else if (response.error === "INVALID_API_KEY") {
          errorMessage = `${getApiKeyDisplayName()} APIキーが無効です。設定画面で正しいAPIキーを設定してください。`;
        } else if (response.error === "RATE_LIMIT_EXCEEDED") {
          errorMessage = "APIリクエスト制限に達しました。しばらく時間をおいてから再試行してください。";
        }
        
        toast({
          title: "エラー",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating email:", error);
      toast({
        title: "エラー",
        description: "メール生成中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setShowResult(false);
  };

  // Function to open settings sheet
  const openSettings = () => {
    // Find the settings button by aria-label and click it
    const settingsButton = document.querySelector('[aria-label="設定"]') as HTMLButtonElement;
    if (settingsButton) {
      settingsButton.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4 shadow-inner">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
            メール返信AI作成ツール
            <Sparkles className="h-5 w-5 text-yellow-500" />
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            必要な情報を入力するだけで、AIが適切なビジネスメールの返信文を生成します。
          </p>
        </div>
        
        {!hasApiKey && (
          <Alert variant="warning" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{getApiKeyDisplayName()} APIキーが設定されていません。右上の設定ボタンからAPIキーを設定してください。</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2 whitespace-nowrap"
                onClick={openSettings}
              >
                <Settings className="h-4 w-4 mr-1" />
                設定を開く
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mt-8">
          {showResult ? (
            <EmailReplyResult
              subject={generatedSubject}
              content={generatedContent}
              onReset={handleReset}
            />
          ) : (
            <EmailReplyForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          )}
        </div>
        
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2025 メール返信AI作成ツール</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
