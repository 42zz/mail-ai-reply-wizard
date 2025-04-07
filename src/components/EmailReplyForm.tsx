
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DateSection from "./DateSection";
import SenderSection from "./SenderSection";
import MessageSection from "./MessageSection";
import ResponseOutlineSection from "./ResponseOutlineSection";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, User, MessageSquare, Pen } from "lucide-react";

interface EmailReplyFormProps {
  onSubmit: (formData: EmailFormData) => void;
  isLoading: boolean;
}

export interface EmailFormData {
  date: Date;
  senderName: string;
  signature: string;
  receivedMessage: string;
  responseOutline: string;
}

const EmailReplyForm = ({ onSubmit, isLoading }: EmailReplyFormProps) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [senderName, setSenderName] = useState("");
  const [signature, setSignature] = useState("");
  const [receivedMessage, setReceivedMessage] = useState("");
  const [responseOutline, setResponseOutline] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("sender");

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

          <Tabs defaultValue="sender" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 w-full">
              <TabsTrigger value="sender" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">送信者情報</span>
              </TabsTrigger>
              <TabsTrigger value="message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">受信情報</span>
              </TabsTrigger>
              <TabsTrigger value="response" className="flex items-center gap-2">
                <Pen className="h-4 w-4" />
                <span className="hidden sm:inline">返信概要</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sender" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <DateSection date={date} setDate={setDate} />
              <SenderSection
                senderName={senderName}
                setSenderName={setSenderName}
                signature={signature}
                setSignature={setSignature}
              />
            </TabsContent>

            <TabsContent value="message" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <MessageSection
                receivedMessage={receivedMessage}
                setReceivedMessage={setReceivedMessage}
              />
            </TabsContent>

            <TabsContent value="response" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <ResponseOutlineSection
                responseOutline={responseOutline}
                setResponseOutline={setResponseOutline}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-between mt-8">
            {activeTab !== "sender" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ["sender", "message", "response"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
              >
                前へ
              </Button>
            )}
            
            {activeTab !== "response" ? (
              <Button
                type="button"
                className="ml-auto"
                onClick={() => {
                  const tabs = ["sender", "message", "response"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
              >
                次へ
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="ml-auto transition-all duration-200 hover:shadow-md hover:scale-[1.01] bg-gradient-to-r from-blue-500 to-blue-600"
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
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default EmailReplyForm;
