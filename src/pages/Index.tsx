import { useState } from "react";
import EmailReplyForm, { EmailFormData } from "@/components/EmailReplyForm";
import EmailReplyResult from "@/components/EmailReplyResult";
import { useEmailGeneration } from "@/hooks/useEmailGeneration";
import { useToast } from "@/hooks/use-toast";
import { Mail, Sparkles, AlertTriangle, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { toast } = useToast();
  const { apiKeys } = useSettings();
  const { generateEmail } = useEmailGeneration();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState<string | undefined>(undefined);
  const [generatedContent, setGeneratedContent] = useState("");
  const [currentFormData, setCurrentFormData] = useState<EmailFormData | undefined>(undefined);
  
  const hasApiKey = !!apiKeys.openai && apiKeys.openai.trim() !== "";

  const handleFormSubmit = async (formData: EmailFormData) => {
    setIsLoading(true);
    try {
      if (!hasApiKey) {
        toast({
          title: "APIキーエラー",
          description: "OpenAI APIキーが設定されていません。設定画面で追加してください。",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Save the current form data for potential editing later
      setCurrentFormData(formData);

      const response = await generateEmail(formData);

      if (response.success) {
        setGeneratedSubject(response.subject);
        setGeneratedContent(response.content);
      } else {
        // エラーの種類に基づいたメッセージを表示
        let errorMessage = "メール生成中にエラーが発生しました。もう一度お試しください。";
        
        if (response.error === "API_KEY_MISSING") {
          errorMessage = "OpenAI APIキーが設定されていません。設定画面で追加してください。";
        } else if (response.error === "INVALID_API_KEY") {
          errorMessage = "OpenAI APIキーが無効です。設定画面で正しいAPIキーを設定してください。";
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
    setCurrentFormData(undefined);
    setGeneratedSubject(undefined);
    setGeneratedContent("");
    // EmailReplyFormコンポーネントのリセット機能を呼び出す
    const formElement = document.querySelector('form') as HTMLFormElement;
    if (formElement) {
      // フォームのリセットイベントを発火
      const resetEvent = new Event('reset', { bubbles: true });
      formElement.dispatchEvent(resetEvent);
    }
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-6">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mr-3 shadow-inner">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              リプライマスター
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </h1>
            <p className="text-sm text-gray-600">
              必要な情報を入力するだけで、AIが適切なビジネスメールの返信文を生成します。
            </p>
          </div>
        </div>
        
        {!hasApiKey && (
          <Alert variant="warning" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>OpenAI APIキーが設定されていません。右上の設定ボタンからAPIキーを設定してください。</span>
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
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Input form */}
          <div className="animate-fade-in">
            <EmailReplyForm 
              onSubmit={handleFormSubmit} 
              isLoading={isLoading} 
              initialData={currentFormData}
            />
          </div>
          
          {/* Right column - Results */}
          <div className="animate-fade-in">
            <EmailReplyResult
              subject={generatedSubject}
              content={generatedContent}
              onReset={handleReset}
              onEdit={() => {/* Editing happens in the left panel */}}
            />
          </div>
        </div>
        
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2025 メール返信AI作成ツール</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
