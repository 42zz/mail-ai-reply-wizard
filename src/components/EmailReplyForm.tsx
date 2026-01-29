import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DateSection from "./DateSection";
import SenderSection from "./SenderSection";
import MessageSection from "./MessageSection";
import ResponseOutlineSection from "./ResponseOutlineSection";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Loader2, User, MessageSquare, Trash2, Info, Wand2, Mail } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getShortcutText } from "@/lib/platform";
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
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export interface EmailFormData {
  date: Date;
  senderName: string;
  signature?: string; // Make signature optional
  receivedMessage?: string; // Make receivedMessage optional for new email creation
  responseOutline: string;
  // Advanced adjustment options
  tone?: number; // 0-100: 0=formal, 100=casual
  length?: number; // 0-100: 0=concise, 100=detailed
  mode?: "email" | "message"; // Add mode for chat/message support
}

interface EmailReplyFormRef extends HTMLFormElement {
  resetMessageTab: () => void;
}

const EmailReplyForm = forwardRef<EmailReplyFormRef, EmailReplyFormProps>(({ 
  onSubmit, 
  isLoading, 
  initialData, 
  activeTab: externalActiveTab, 
  onTabChange
}, ref) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(initialData?.date || new Date());
  const [senderName, setSenderName] = useState(initialData?.senderName || "");
  const [signature, setSignature] = useState(initialData?.signature || "");
  const [receivedMessage, setReceivedMessage] = useState(initialData?.receivedMessage || "");
  const [responseOutline, setResponseOutline] = useState(initialData?.responseOutline || "");
  const [tone, setTone] = useState(initialData?.tone !== undefined ? initialData.tone : 25); // Default to formal/polite
  const [length, setLength] = useState(initialData?.length !== undefined ? initialData.length : 50); // Default to standard length
  const [mode, setMode] = useState<"email" | "message">(initialData?.mode || "email"); // Add mode state
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(externalActiveTab || "sender");
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
      setMode(initialData.mode || "email");
    } else {
      const savedSenderName = localStorage.getItem('senderName');
      const savedSignature = localStorage.getItem('signature');
      const savedTone = localStorage.getItem('tone');
      const savedLength = localStorage.getItem('length');
      const savedMode = localStorage.getItem('mode') as "email" | "message" | null;

      if (savedSenderName) setSenderName(savedSenderName);
      if (savedSignature) setSignature(savedSignature);
      if (savedTone !== null) setTone(parseInt(savedTone));
      if (savedLength !== null) setLength(parseInt(savedLength));
      if (savedMode) setMode(savedMode);
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
      setMode("email"); // Reset to email mode
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
    localStorage.setItem('mode', mode);
  }, [tone, length, mode]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    let shouldSwitchToMessageTab = false;

    if (!senderName.trim()) newErrors.push("送信者名を入力してください");
    if (!responseOutline.trim()) {
      newErrors.push(mode === "message" ? "メッセージ内容の概要を入力してください" : "メール内容の概要を入力してください");
      shouldSwitchToMessageTab = true;
    }

    setErrors(newErrors);

    // メール情報タブの項目でエラーがある場合、そのタブに遷移
    if (shouldSwitchToMessageTab && newErrors.length > 0) {
      setActiveTab("message");
    }

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
      receivedMessage: receivedMessage.trim() ? receivedMessage : undefined,
      responseOutline,
      tone,
      length,
      mode,
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

  // メール情報タブをリセット
  const resetMessageTab = () => {
    setReceivedMessage("");
    setResponseOutline("");
    if (onTabChange) {
      onTabChange('message');
    }
  };

  // 外部からのリセット要求を処理
  useImperativeHandle(ref, () => ({
    resetMessageTab
  }), []);

  // externalActiveTabが変更されたときに内部のstateを更新
  useEffect(() => {
    if (externalActiveTab) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  // タブ変更時の処理
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (onTabChange) {
      onTabChange(value);
    }
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="w-full animate-fade-in">
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

          <Tabs defaultValue="sender" value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 w-full">
              <TabsTrigger value="sender" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">送信設定</span>
              </TabsTrigger>
              <TabsTrigger value="message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">{mode === "message" ? "メッセージ情報" : "メール情報"}</span>
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
                    メールスタイル調整
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

                <AccordionItem value="mode">
                  <AccordionTrigger className="text-sm font-medium">
                    出力モード設定
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium">モード切り替え</p>
                            <p className="text-xs text-gray-500">チャットメッセージ or ビジネスメール</p>
                          </div>
                        </div>
                        <Switch
                          checked={mode === "message"}
                          onCheckedChange={(checked) => setMode(checked ? "message" : "email")}
                        />
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-500">
                        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className={mode === "message" ? "font-medium text-blue-600" : ""}>
                            チャットモード: SlackやChatwork向け（件名なし）
                          </p>
                          <p className={mode === "email" ? "font-medium text-blue-600" : ""}>
                            メールモード: ビジネスメール向け（件名あり）
                          </p>
                        </div>
                      </div>
                    </div>
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
                  <p>
                    {mode === "message"
                      ? "新規メッセージ作成の場合は返信概要のみ、返信メッセージの場合は受信メッセージと返信概要を入力してください。"
                      : "新規メール作成の場合は返信概要のみ、返信メールの場合は受信メッセージと返信概要を入力してください。"}
                  </p>
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

            </TabsContent>
          </Tabs>
          
          <div className="mt-8">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        メール生成
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getShortcutText('Enter', { ctrl: true })}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </form>
  );
});

EmailReplyForm.displayName = "EmailReplyForm";

export default EmailReplyForm;
