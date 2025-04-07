
import { createContext, useContext, useState, ReactNode } from "react";

interface SettingsContextType {
  model: string;
  setModel: (model: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState("chatgpt");
  const [systemPrompt, setSystemPrompt] = useState(
    `あなたはプロフェッショナルなメール返信支援AIです。以下の情報に基づいて、丁寧で適切なメール返信を作成してください。

## 入力情報
- 日付: {date}
- 署名: {signatures}
- 送信者名: {sender_name}
- 受信者名: {recipient_name}
- 受信したメッセージ内容: {received_message}
- 返信内容の概要: {response_outline}

## 返信作成のガイドライン
1. 必要に応じて適切な件名を作成してください
2. 日本のビジネスマナーに沿った丁寧な言葉遣いを使用してください
3. 日付に応じた季節の挨拶や時候の挨拶を含めてください
4. 受信者名と送信者名を適切に使用し、敬称を付けてください
5. 提供された返信内容の概要に基づいて、具体的かつ明確な返信を作成してください
6. 提供された署名を適切な場所に配置してください
7. 文章の長さは状況に応じて適切に調整してください
8. 文脈に応じて適切な結びの言葉を使用してください

## 出力形式
【件名】（必要な場合のみ）
【本文】

上記のガイドラインに従って、プロフェッショナルで状況に適したメール返信を作成してください。`
  );

  return (
    <SettingsContext.Provider
      value={{
        model,
        setModel,
        systemPrompt,
        setSystemPrompt,
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
