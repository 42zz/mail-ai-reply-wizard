import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface SignatureTemplate {
  id: string;
  name: string;
  content: string;
}

interface SettingsContextType {
  model: string;
  setModel: (model: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  apiKeys: {
    openai: string;
  };
  setApiKey: (provider: string, key: string) => void;
  signatureTemplates: SignatureTemplate[];
  addSignatureTemplate: (name: string, content: string) => void;
  updateSignatureTemplate: (id: string, name: string, content: string) => void;
  deleteSignatureTemplate: (id: string) => void;
  styleExamples: string[];
  addStyleExample: (example: string) => void;
  updateStyleExample: (index: number, example: string) => void;
  deleteStyleExample: (index: number) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState("gpt4o");
  const [systemPrompt, setSystemPrompt] = useState(
    `あなたはプロフェッショナルなメール返信支援AIです。以下のXML形式で提供される情報に基づいて、丁寧で適切なメール返信を作成してください。

<input>
  <current_date>YYYY-MM-DD形式の日付</current_date>
  <signatures>署名の完全なテキスト（改行を含む）</signatures>
  <sender_name>送信者の名前</sender_name>
  <received_message>受信したメッセージの内容</received_message>
  <response_outline>返信内容の概要</response_outline>
</input>

## 返信作成のガイドライン
1. 必要に応じて適切な件名を作成してください
2. 日本のビジネスマナーに沿った丁寧な言葉遣いを使用してください
3. 受信者名と送信者名を適切に使用し、敬称を付けてください
4. 提供された返信内容の概要に基づいて、具体的かつ明確な返信を作成してください
5. 提供された署名は一切変更せず、完全に同じ形式（スペース、改行、書式など）で適切な場所に配置してください
6. 署名が提供されていない場合は、署名を使用しないでください。
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
  });

  // Initialize signature templates from localStorage or empty array
  const [signatureTemplates, setSignatureTemplates] = useState<SignatureTemplate[]>(() => {
    const savedTemplates = localStorage.getItem("signature_templates");
    return savedTemplates ? JSON.parse(savedTemplates) : [];
  });

  // Save signature templates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("signature_templates", JSON.stringify(signatureTemplates));
  }, [signatureTemplates]);

  // Function to update an API key
  const setApiKey = (provider: string, key: string) => {
    if (provider === "openai") {
      setApiKeys((prev) => {
        const newKeys = { ...prev, openai: key };
        localStorage.setItem("openai_api_key", key);
        return newKeys;
      });
    }
  };

  // Function to add a new signature template
  const addSignatureTemplate = (name: string, content: string) => {
    const id = Date.now().toString();
    setSignatureTemplates((prev) => [...prev, { id, name, content }]);
  };

  // Function to update an existing signature template
  const updateSignatureTemplate = (id: string, name: string, content: string) => {
    setSignatureTemplates((prev) =>
      prev.map((template) =>
        template.id === id ? { ...template, name, content } : template
      )
    );
  };

  // Function to delete a signature template
  const deleteSignatureTemplate = (id: string) => {
    setSignatureTemplates((prev) => prev.filter((template) => template.id !== id));
  };

  // Initialize style examples from localStorage or empty array
  const [styleExamples, setStyleExamples] = useState<string[]>(() => {
    const savedExamples = localStorage.getItem("style_examples");
    return savedExamples ? JSON.parse(savedExamples) : [];
  });

  // Save style examples to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("style_examples", JSON.stringify(styleExamples));
  }, [styleExamples]);

  // Function to add a new style example
  const addStyleExample = (example: string) => {
    if (styleExamples.length < 5) {
      setStyleExamples((prev) => [...prev, example]);
    }
  };

  // Function to update an existing style example
  const updateStyleExample = (index: number, example: string) => {
    setStyleExamples((prev) =>
      prev.map((ex, i) => (i === index ? example : ex))
    );
  };

  // Function to delete a style example
  const deleteStyleExample = (index: number) => {
    setStyleExamples((prev) => prev.filter((_, i) => i !== index));
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
        signatureTemplates,
        addSignatureTemplate,
        updateSignatureTemplate,
        deleteSignatureTemplate,
        styleExamples,
        addStyleExample,
        updateStyleExample,
        deleteStyleExample,
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
