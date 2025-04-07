
import { useState } from "react";
import EmailReplyForm, { EmailFormData } from "@/components/EmailReplyForm";
import EmailReplyResult from "@/components/EmailReplyResult";
import { generateEmailReply } from "@/lib/emailGeneration";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Mail, Sparkles, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/contexts/SettingsContext";

const Index = () => {
  const { toast } = useToast();
  const { model } = useSettings();
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState<string | undefined>(undefined);
  const [generatedContent, setGeneratedContent] = useState("");
  
  // Check for appropriate API key based on selected model
  const getApiKeyName = () => {
    switch (model) {
      case "chatgpt": return "VITE_OPENAI_API_KEY";
      case "gemini": return "VITE_GEMINI_API_KEY";
      case "claude": return "VITE_CLAUDE_API_KEY";
      case "mistral": return "VITE_MISTRAL_API_KEY";
      default: return "VITE_OPENAI_API_KEY";
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
  
  const hasApiKey = !!import.meta.env[getApiKeyName()];

  const handleFormSubmit = async (formData: EmailFormData) => {
    setIsLoading(true);
    try {
      if (!hasApiKey) {
        toast({
          title: "APIキーエラー",
          description: `${getApiKeyDisplayName()} APIキーが設定されていません。環境変数を確認してください。`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const requestData = {
        date: format(formData.date, "yyyy-MM-dd"),
        signatures: formData.signature,
        sender_name: formData.senderName,
        recipient_name: formData.recipientName,
        received_message: formData.receivedMessage,
        response_outline: formData.responseOutline,
        model,
      };

      const response = await generateEmailReply(requestData);

      if (response.success) {
        setGeneratedSubject(response.subject);
        setGeneratedContent(response.content);
        setShowResult(true);
      } else {
        toast({
          title: "エラー",
          description: "メール生成中にエラーが発生しました。もう一度お試しください。",
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
            <AlertDescription>
              {getApiKeyDisplayName()} APIキーが設定されていません。環境変数「{getApiKeyName()}」にAPIキーを設定してください。
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
