
import { useState } from "react";
import EmailReplyForm, { EmailFormData } from "@/components/EmailReplyForm";
import EmailReplyResult from "@/components/EmailReplyResult";
import { generateEmailReply } from "@/lib/emailGeneration";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState<string | undefined>(undefined);
  const [generatedContent, setGeneratedContent] = useState("");

  const handleFormSubmit = async (formData: EmailFormData) => {
    setIsLoading(true);
    try {
      const requestData = {
        date: format(formData.date, "yyyy-MM-dd"),
        signatures: formData.signature,
        sender_name: formData.senderName,
        recipient_name: formData.recipientName,
        received_message: formData.receivedMessage,
        response_outline: formData.responseOutline,
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">メール返信AI作成ツール</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            必要な情報を入力するだけで、AIが適切なビジネスメールの返信文を生成します。
          </p>
        </div>
        
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
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2025 メール返信AI作成ツール</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
