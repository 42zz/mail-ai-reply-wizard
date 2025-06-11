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
import { Loader2, User, MessageSquare, Trash2, Info, Wand2 } from "lucide-react";
import AdjustmentSection from "./AdjustmentSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface EmailReplyFormProps {
  onSubmit: (formData: EmailFormData) => void;
  isLoading: boolean;
  initialData?: EmailFormData;
}

export interface EmailFormData {
  date: Date;
  senderName: string;
  signature?: string; // Make signature optional
  receivedMessage: string;
  responseOutline: string;
  // Advanced adjustment options
  tone?: number; // 0-100: 0=formal, 100=casual
  length?: number; // 0-100: 0=concise, 100=detailed
}

const EmailReplyForm = ({ onSubmit, isLoading, initialData }: EmailReplyFormProps) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(initialData?.date || new Date());
  const [senderName, setSenderName] = useState(initialData?.senderName || "");
  const [signature, setSignature] = useState(initialData?.signature || "");
  const [receivedMessage, setReceivedMessage] = useState(initialData?.receivedMessage || "");
  const [responseOutline, setResponseOutline] = useState(initialData?.responseOutline || "");
  const [tone, setTone] = useState(initialData?.tone !== undefined ? initialData.tone : 25); // Default to formal/polite
  const [length, setLength] = useState(initialData?.length !== undefined ? initialData.length : 50); // Default to standard length
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("sender");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setSenderName(initialData.senderName);
      setSignature(initialData.signature || "");
      setReceivedMessage(initialData.receivedMessage);
      setResponseOutline(initialData.responseOutline);
      setTone(initialData.tone !== undefined ? initialData.tone : 25);
      setLength(initialData.length !== undefined ? initialData.length : 50);
    } else {
      const savedSenderName = localStorage.getItem('senderName');
      const savedSignature = localStorage.getItem('signature');
      const savedTone = localStorage.getItem('tone');
      const savedLength = localStorage.getItem('length');

      if (savedSenderName) setSenderName(savedSenderName);
      if (savedSignature) setSignature(savedSignature);
      if (savedTone !== null) setTone(parseInt(savedTone));
      if (savedLength !== null) setLength(parseInt(savedLength));
    }
  }, [initialData]);

  useEffect(() => {
    const handleReset = () => {
      setDate(new Date());
      setSenderName("");
      setSignature("");
      setReceivedMessage("");
      setResponseOutline("");
      setTone(25);
      setLength(50);
      setErrors([]);
      setShowErrors(false);
      setActiveTab("sender");
    };

    const formElement = document.querySelector('form');
    if (formElement) {
      formElement.addEventListener('reset', handleReset);
      return () => {
        formElement.removeEventListener('reset', handleReset);
      };
    }
  }, []);

  useEffect(() => {
    if (senderName) {
      localStorage.setItem('senderName', senderName);
    }
    if (signature !== undefined) {
      localStorage.setItem('signature', signature);
    }
  }, [senderName, signature]);

  useEffect(() => {
    localStorage.setItem('tone', tone.toString());
    localStorage.setItem('length', length.toString());
  }, [tone, length]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!senderName.trim()) newErrors.push("送信者名を入力してください");
    if (!receivedMessage.trim()) newErrors.push("受信メッセージ内容を入力してください");
    if (!responseOutline.trim()) newErrors.push("返信内容の概要を入力してください");

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    
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
      signature: signature.trim() ? signature : undefined, // Only include signature if it's not empty
      receivedMessage,
      responseOutline,
      tone,
      length,
    };

    onSubmit(formData);
  };

  const clearField = (field: "sender" | "message" | "response") => {
    switch (field) {
      case "sender":
        setDate(new Date());
        setSenderName("");
        setSignature("");
        // トーンと長さの設定は保持する
        break;
      case "message":
        setReceivedMessage("");
        break;
      case "response":
        setResponseOutline("");
        break;
    }

    const clearMessages = {
      "sender": "送信者情報をクリアしました",
      "message": "受信メッセージをクリアしました",
      "response": "返信概要をクリアしました"
    };

    toast({
      title: "クリアしました",
      description: clearMessages[field],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full animate-fade-in">
      <Card className="w-full border-none shadow-lg overflow-hidden glass-card">
        <CardContent className="p-6 sm:p-8">
          {showErrors && errors.length > 0 && (
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
            <TabsList className="grid grid-cols-2 mb-6 w-full">
              <TabsTrigger value="sender" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">送信設定</span>
              </TabsTrigger>
              <TabsTrigger value="message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">メール情報</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sender" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">送信設定</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => clearField("sender")}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  送信者情報をクリア
                </Button>
              </div>
              
              <Accordion type="multiple" defaultValue={[]} className="w-full">
                <AccordionItem value="date">
                  <AccordionTrigger className="text-sm font-medium">
                    日付設定
                  </AccordionTrigger>
                  <AccordionContent>
                    <DateSection date={date} setDate={setDate} />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="adjustment">
                  <AccordionTrigger className="text-sm font-medium">
                    返信スタイル調整
                  </AccordionTrigger>
                  <AccordionContent>
                    <AdjustmentSection
                      tone={tone}
                      setTone={setTone}
                      length={length}
                      setLength={setLength}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sender">
                  <AccordionTrigger className="text-sm font-medium">
                    送信者情報
                  </AccordionTrigger>
                  <AccordionContent>
                    <SenderSection
                      senderName={senderName}
                      setSenderName={setSenderName}
                      signature={signature}
                      setSignature={setSignature}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="style">
                  <AccordionTrigger className="text-sm font-medium">
                    文面例
                  </AccordionTrigger>
                  <AccordionContent>
                    <SenderSection
                      senderName=""
                      setSenderName={() => {}}
                      signature=""
                      setSignature={() => {}}
                      hideSenderName={true}
                      hideSignature={true}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  onClick={() => setActiveTab("message")}
                >
                  次へ
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="message" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">メール情報</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => clearField("message")}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    受信メッセージをクリア
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => clearField("response")}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    返信概要をクリア
                  </Button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 flex items-center space-x-2 text-sm text-blue-700">
                  <Info className="h-5 w-5 flex-shrink-0" />
                  <p>受信メッセージと返信概要を入力してください。両方の情報を基に、AIが適切な返信を作成します。</p>
                </div>

                <div className="space-y-4">
                  <MessageSection
                    receivedMessage={receivedMessage}
                    setReceivedMessage={setReceivedMessage}
                  />
                  <div className="border-t border-gray-200 pt-4">
                    <ResponseOutlineSection
                      responseOutline={responseOutline}
                      setResponseOutline={setResponseOutline}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("sender")}
                >
                  戻る
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      返信を生成
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </form>
  );
};

export default EmailReplyForm;
