import { useState, useRef } from "react";
import EmailReplyForm, { EmailFormData } from "@/components/EmailReplyForm";
import EmailReplyResult from "@/components/EmailReplyResult";
import { useEmailGeneration } from "@/hooks/useEmailGeneration";
import { useToast } from "@/hooks/use-toast";
import { Mail, Sparkles, AlertTriangle, Settings, HelpCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { HistoryEntry } from "@/types";
import { useShortcuts, ShortcutAction } from "@/hooks/useShortcuts";
import ShortcutHelpModal from "@/components/ShortcutHelpModal";

const Index = () => {
  const { toast } = useToast();
  const { apiKeys } = useSettings();
  const { generateEmail, adjustText } = useEmailGeneration();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState<string | undefined>(undefined);
  const [generatedContent, setGeneratedContent] = useState("");
  const [currentFormData, setCurrentFormData] = useState<EmailFormData | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("sender");
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const formRef = useRef<any>(null);
  
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

      setCurrentFormData(formData);

      const response = await generateEmail(formData);

      if (response.success) {
        setGeneratedSubject(response.subject);
        setGeneratedContent(response.content);
      } else {
        let errorMessage = "メール生成中にエラーが発生しました。もう一度お試しください。";
        if (response.error === "API_KEY_MISSING") {
          errorMessage = "OpenAI APIキーが設定されていません。設定画面で追加してください。";
        } else if (response.error === "INVALID_API_KEY") {
          errorMessage = "OpenAI APIキーが無効です。設定画面で正しいAPIキーを設定してください。";
        } else if (response.error === "RATE_LIMIT_EXCEEDED") {
          errorMessage = "APIリクエスト制限に達しました。しばらく時間をおいてから再試行してください。";
        } else if (response.error === "EMPTY_RESPONSE") {
          errorMessage = "AIが空の返信を生成しました。入力内容を確認して再度お試しください。";
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
        description: "メール生成中に予期せぬエラーが発生しました。ネットワーク接続などを確認してください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // メール情報タブのみリセット
  const handleResetMessageTab = () => {
    // formRefを通じてリセット関数を呼び出し
    if (formRef.current?.resetMessageTab) {
      formRef.current.resetMessageTab();
      toast({
        title: "リセット完了",
        description: "メール情報をクリアしました。",
      });
    }
  };

  // 完全リセット（右パネルから呼ばれる）
  const handleFullReset = () => {
    setCurrentFormData(undefined);
    setGeneratedSubject(undefined);
    setGeneratedContent("");
    // フォーム全体をリセット
    if (formRef.current) {
      const formElement = formRef.current.querySelector('form') as HTMLFormElement;
      if (formElement) {
        const resetEvent = new Event('reset', { bubbles: true });
        formElement.dispatchEvent(resetEvent);
      }
    }
    toast({
      title: "リセット完了",
      description: "フォームを初期状態に戻しました。",
    });
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setGeneratedSubject(entry.response.subject);
    setGeneratedContent(entry.response.content);
    toast({
      title: "履歴適用完了",
      description: "選択された履歴の内容を表示しました。",
    });
  };

  const handleTextAdjustment = async (customPrompt: string) => {
    if (!hasApiKey) {
      toast({
        title: "APIキーエラー",
        description: "OpenAI APIキーが設定されていません。設定画面で追加してください。",
        variant: "destructive",
      });
      return;
    }

    if (!generatedContent) {
      toast({
        title: "エラー",
        description: "調整する文章がありません。",
        variant: "destructive",
      });
      return;
    }

    setIsAdjusting(true);
    try {
      const response = await adjustText(
        generatedContent,
        customPrompt,
        currentFormData?.tone,
        currentFormData?.length
      );

      if (response.success) {
        if (response.subject) {
          setGeneratedSubject(response.subject);
        }
        setGeneratedContent(response.content);
        toast({
          title: "文章調整完了",
          description: "文章が正常に調整されました。",
        });
      } else {
        let errorMessage = "文章調整中にエラーが発生しました。もう一度お試しください。";
        if (response.error === "API_KEY_MISSING") {
          errorMessage = "OpenAI APIキーが設定されていません。設定画面で追加してください。";
        } else if (response.error === "INVALID_API_KEY") {
          errorMessage = "OpenAI APIキーが無効です。設定画面で正しいAPIキーを設定してください。";
        } else if (response.error === "RATE_LIMIT_EXCEEDED") {
          errorMessage = "APIリクエスト制限に達しました。しばらく時間をおいてから再試行してください。";
        } else if (response.error === "EMPTY_RESPONSE") {
          errorMessage = "AIが空の調整結果を生成しました。入力内容を確認して再度お試しください。";
        }

        toast({
          title: "エラー",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adjusting text:", error);
      toast({
        title: "エラー",
        description: "文章調整中に予期せぬエラーが発生しました。ネットワーク接続などを確認してください。",
        variant: "destructive",
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  const openSettings = () => {
    const settingsButton = document.querySelector('[aria-label="設定"]') as HTMLButtonElement;
    if (settingsButton) {
      settingsButton.click();
    }
  };

  // コピー機能
  const copyContentToClipboard = async () => {
    if (!generatedContent) {
      toast({
        title: "エラー",
        description: "コピーする内容がありません。",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(generatedContent);
      toast({
        title: "コピーしました",
        description: "本文をクリップボードにコピーしました。",
      });
    } catch (error) {
      toast({
        title: "エラー",
        description: "コピーに失敗しました。",
        variant: "destructive",
      });
    }
  };

  // 文章調整モーダルを開く
  const openAdjustmentModal = () => {
    if (!generatedContent) {
      toast({
        title: "エラー",
        description: "調整する文章がありません。",
        variant: "destructive",
      });
      return;
    }
    
    // TextAdjustmentModalを開くロジック
    const adjustmentButton = document.querySelector('[data-adjustment-button]') as HTMLButtonElement;
    if (adjustmentButton) {
      adjustmentButton.click();
    }
  };

  // タブ切り替え
  const switchToTab = (tabName: string) => {
    setActiveTab(tabName);
    const tabButton = document.querySelector(`[value="${tabName}"]`) as HTMLButtonElement;
    if (tabButton) {
      tabButton.click();
    }
  };

  // フォーム送信（メール生成）
  const triggerFormSubmit = () => {
    if (formRef.current) {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      formRef.current.dispatchEvent(event);
    }
  };

  // ショートカットの定義
  const shortcuts: ShortcutAction[] = [
    {
      key: 'Enter',
      ctrl: true,
      action: triggerFormSubmit,
      description: 'メール生成',
      disabled: isLoading || isAdjusting
    },
    {
      key: 'Backspace',
      ctrl: true,
      action: handleResetMessageTab,
      description: 'メール情報リセット',
      disabled: isLoading || isAdjusting
    },
    {
      key: 'c',
      ctrl: true,
      shift: true,
      action: copyContentToClipboard,
      description: '本文コピー',
      disabled: !generatedContent
    },
    {
      key: 'e',
      ctrl: true,
      action: openAdjustmentModal,
      description: '文章調整モーダル',
      disabled: !generatedContent || isAdjusting
    },
    {
      key: '1',
      ctrl: true,
      action: () => switchToTab('sender'),
      description: '送信者設定タブ',
      disabled: isLoading || isAdjusting
    },
    {
      key: '2',
      ctrl: true,
      action: () => switchToTab('message'),
      description: 'メール情報タブ',
      disabled: isLoading || isAdjusting
    },
    {
      key: 'h',
      ctrl: true,
      action: () => setIsHelpModalOpen(true),
      description: 'ヘルプ表示'
    }
  ];

  // ショートカットキーを有効化
  useShortcuts(shortcuts);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-6">
      <div className="container px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mr-3 shadow-inner">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              AIメールアシスタント
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </h1>
            <p className="text-sm text-gray-600">
              必要な情報を入力するだけで、AIが適切なビジネスメールを生成します。新規メール作成と返信メール作成の両方に対応。
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
              ref={formRef}
              onSubmit={handleFormSubmit} 
              isLoading={isLoading} 
              initialData={currentFormData}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
          
          {/* Right column - Results */}
          <div className="animate-fade-in">
            <EmailReplyResult
              subject={generatedSubject}
              content={generatedContent}
              onReset={handleFullReset}
              onEdit={() => {/* 実装なし */}}
              onHistorySelect={handleHistorySelect}
              onTextAdjustment={handleTextAdjustment}
              isAdjusting={isAdjusting}
              mode={currentFormData?.mode || "email"}
            />
          </div>
        </div>
        
        <div className="mt-12 text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/42zz/mail-ai-reply-wizard/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-gray-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHelpModalOpen(true)}
              className="flex items-center gap-1 hover:text-gray-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">ショートカット</span>
            </Button>
            <p>© 2025 AIメールアシスタント</p>
          </div>
        </div>
        
        {/* ショートカットヘルプモーダル */}
        <ShortcutHelpModal 
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
          shortcuts={shortcuts}
        />
      </div>
    </div>
  );
};

export default Index;
