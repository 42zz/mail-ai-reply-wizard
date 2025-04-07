
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DateSection from "./DateSection";
import SenderSection from "./SenderSection";
import RecipientSection from "./RecipientSection";
import MessageSection from "./MessageSection";
import ResponseOutlineSection from "./ResponseOutlineSection";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface EmailReplyFormProps {
  onSubmit: (formData: EmailFormData) => void;
  isLoading: boolean;
}

export interface EmailFormData {
  date: Date;
  senderName: string;
  signature: string;
  recipientName: string;
  receivedMessage: string;
  responseOutline: string;
}

const EmailReplyForm = ({ onSubmit, isLoading }: EmailReplyFormProps) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [senderName, setSenderName] = useState("");
  const [signature, setSignature] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [receivedMessage, setReceivedMessage] = useState("");
  const [responseOutline, setResponseOutline] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const savedSenderName = localStorage.getItem('senderName');
    const savedSignature = localStorage.getItem('signature');

    if (savedSenderName) setSenderName(savedSenderName);
    if (savedSignature) setSignature(savedSignature);
  }, []);

  useEffect(() => {
    if (senderName) {
      localStorage.setItem('senderName', senderName);
    }
    if (signature) {
      localStorage.setItem('signature', signature);
    }
  }, [senderName, signature]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!senderName.trim()) newErrors.push("送信者名を入力してください");
    if (!signature.trim()) newErrors.push("署名を入力してください");
    if (!recipientName.trim()) newErrors.push("受信者名を入力してください");
    if (!receivedMessage.trim()) newErrors.push("受信メッセージ内容を入力してください");
    if (!responseOutline.trim()) newErrors.push("返信内容の概要を入力してください");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "エラー",
        description: "すべての必須フィールドを入力してください",
        variant: "destructive",
      });
      return;
    }

    const formData: EmailFormData = {
      date,
      senderName,
      signature,
      recipientName,
      receivedMessage,
      responseOutline,
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full animate-fade-in">
      <Card className="w-full border-none shadow-lg overflow-hidden glass-card">
        <CardContent className="p-6 sm:p-8">
          {errors.length > 0 && (
            <Alert variant="destructive" className="mb-6 animate-slide-in">
              <AlertDescription>
                <ul className="list-disc pl-5">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <DateSection date={date} setDate={setDate} />

            <SenderSection
              senderName={senderName}
              setSenderName={setSenderName}
              signature={signature}
              setSignature={setSignature}
            />

            <RecipientSection
              recipientName={recipientName}
              setRecipientName={setRecipientName}
            />

            <MessageSection
              receivedMessage={receivedMessage}
              setReceivedMessage={setReceivedMessage}
            />

            <ResponseOutlineSection
              responseOutline={responseOutline}
              setResponseOutline={setResponseOutline}
            />

            <Button 
              type="submit" 
              className="w-full transition-all duration-200 hover:shadow-md hover:scale-[1.01] bg-gradient-to-r from-blue-500 to-blue-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                "メール返信を生成"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default EmailReplyForm;
