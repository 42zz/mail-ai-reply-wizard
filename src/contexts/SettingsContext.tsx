
import { createContext, useContext, useState, ReactNode } from "react";

interface SettingsContextType {
  model: string;
  setModel: (model: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  apiKeys: {
    openai: string;
    gemini: string;
    claude: string;
    mistral: string;
  };
  setApiKey: (provider: string, key: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState("chatgpt");
  const [systemPrompt, setSystemPrompt] = useState(
    `あなたはプロフェッショナルなメール返信支援AIです。以下のXML形式で提供される情報に基づいて、丁寧で適切なメール返信を作成してください。

<input>
  <date>YYYY-MM-DD形式の日付</date>
  <signatures>署名の完全なテキスト（改行を含む）</signatures>
  <sender_name>送信者の名前</sender_name>
  <recipient_name>受信者の名前</recipient_name>
  <received_message>受信したメッセージの内容</received_message>
  <response_outline>返信内容の概要</response_outline>
</input>

## 返信作成のガイドライン
1. 必要に応じて適切な件名を作成してください
2. 日本のビジネスマナーに沿った丁寧な言葉遣いを使用してください
3. 日付に応じた季節の挨拶や時候の挨拶を含めてください
4. 受信者名と送信者名を適切に使用し、敬称を付けてください
5. 提供された返信内容の概要に基づいて、具体的かつ明確な返信を作成してください
6. 提供された署名は一切変更せず、完全に同じ形式（スペース、改行、書式など）で適切な場所に配置してください
7. 文章の長さは状況に応じて適切に調整してください
8. 文脈に応じて適切な結びの言葉を使用してください

## 出力形式
<output>
  <subject>件名（必要な場合のみ）</subject>
  <content>メール本文</content>
</output>

上記のガイドラインに従って、プロフェッショナルで状況に適したメール返信を作成してください。署名の形式は厳密に守り、一文字も変更しないでください。`
  );

  // Initialize API keys from localStorage or empty strings
  const [apiKeys, setApiKeys] = useState({
    openai: localStorage.getItem("openai_api_key") || "",
    gemini: localStorage.getItem("gemini_api_key") || "",
    claude: localStorage.getItem("claude_api_key") || "",
    mistral: localStorage.getItem("mistral_api_key") || "",
  });

  // Function to update an API key
  const setApiKey = (provider: string, key: string) => {
    setApiKeys((prev) => {
      const newKeys = { ...prev, [provider]: key };
      // Save to localStorage for persistence
      localStorage.setItem(`${provider}_api_key`, key);
      return newKeys;
    });
  };

  return (
    <SettingsContext.Provider
      value={{
        model,
        setModel,
        systemPrompt,
        setSystemPrompt,
        apiKeys,
        setApiKey,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
