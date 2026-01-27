import { HistoryEntry } from "@/types";

interface EmailGenerationRequest {
  date: string | Date;
  signatures: string;
  sender_name: string;
  recipient_name?: string;
  received_message?: string; // Make optional for new email creation
  response_outline: string;
  model?: string;
  systemPrompt?: string;
  style_examples?: string[];
  tone?: number; // 0-100: 0=formal, 100=casual
  length?: number; // 0-100: 0=concise, 100=detailed
  mode?: "email" | "message"; // Add mode for chat/message support
}

// EmailFormData をインポート (HistoryEntry で使用)
import { EmailFormData } from "@/components/EmailReplyForm";

// GPT-5 APIリクエストボディの型
interface GPT5ChatCompletionRequest {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  temperature?: number;
  max_completion_tokens?: number;
  response_format: { type: string };
  frequency_penalty?: number;
  presence_penalty?: number;
  seed?: number;
}

// HistoryEntryのrequestの型を修正
interface CorrectedHistoryEntry {
  id: string;
  request: Omit<EmailGenerationRequest, 'date'> & { date: string | Date }; // date を string | Date に
  response: EmailGenerationResponse;
  timestamp: number;
}

interface EmailGenerationResponse {
  subject?: string;
  content: string;
  success: boolean;
  error?: string;
}

const MAX_HISTORY_ITEMS = 5;

const saveHistory = (request: EmailGenerationRequest, response: EmailGenerationResponse) => {
  try {
    const historyString = localStorage.getItem("emailHistory");
    const history: CorrectedHistoryEntry[] = historyString ? JSON.parse(historyString) : [];

    const newEntry: CorrectedHistoryEntry = {
      id: crypto.randomUUID(),
      request: {
        ...request,
        date: request.date
      },
      response,
      timestamp: Date.now(),
    };

    history.unshift(newEntry);

    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem("emailHistory", JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error("Failed to save email generation history:", error);
  }
};

export const generateEmailReply = async (
  formData: EmailGenerationRequest,
  apiKey: string
): Promise<EmailGenerationResponse> => {
  let result: EmailGenerationResponse;
  try {
    // APIキーが空の場合はエラーを返す
    if (!apiKey || apiKey.trim() === "") {
      result = {
        content: "APIキーが設定されていません。設定画面から適切なAPIキーを設定してください。",
        success: false,
        error: "API_KEY_MISSING"
      };
      saveHistory(formData, result); // 失敗履歴も保存
      return result;
    }

    // Ensure date is in string format
    const date = formData.date instanceof Date
      ? formData.date.toISOString().split('T')[0]
      : formData.date;

    // Generate tone and length instructions based on parameters
    const getToneInstruction = (tone?: number) => {
      if (tone === undefined) return "";
      if (tone <= 25) return "非常に丁寧で正式なビジネストーンを使用してください。敬語を厳密に使い分け、「いつもお世話になっております」などの定型的な表現を含めてください。";
      if (tone <= 50) return "丁寧なビジネストーンを使用してください。適切な敬語を使いつつ、親しみやすさも感じられるように書いてください。";
      if (tone <= 75) return "親しみやすく適度にカジュアルなトーンを使用してください。敬語は使いますが、堅苦しくない表現を心がけてください。";
      return "フレンドリーでカジュアルなトーンを使用してください。「です・ます」調は維持しつつ、「〜ですね」「〜していただけると嬉しいです」など親近感のある表現を使い、絵文字や感嘆符も適度に使用して温かみのある文章にしてください。";
    };

    const getLengthInstruction = (length?: number) => {
      if (length === undefined) return "";
      if (length <= 25) return "簡潔で要点を絞った返信にしてください。";
      if (length <= 50) return "適度な長さで必要な情報を含む返信にしてください。";
      if (length <= 75) return "詳細な説明を含む丁寧な返信にしてください。";
      return "非常に詳細で包括的な返信にしてください。";
    };

    // Determine if this is a new email or reply based on received_message
    const isNewEmail = !formData.received_message || formData.received_message.trim() === "";
    
    // Create XML formatted input - updated to match the new system prompt format
    const xmlInput = isNewEmail ? `
<input>
  <current_date>${date}</current_date>
  <signatures>${formData.signatures}</signatures>
  <sender_name>${formData.sender_name}</sender_name>
  <email_content_outline>${formData.response_outline}</email_content_outline>
</input>

<style_adjustments>
${getToneInstruction(formData.tone)}
${getLengthInstruction(formData.length)}
</style_adjustments>
` : `
<input>
  <current_date>${date}</current_date>
  <signatures>${formData.signatures}</signatures>
  <sender_name>${formData.sender_name}</sender_name>
  <received_message>${formData.received_message}</received_message>
  <response_outline>${formData.response_outline}</response_outline>
</input>

<style_adjustments>
${getToneInstruction(formData.tone)}
${getLengthInstruction(formData.length)}
</style_adjustments>
`;

    // Map the selected model to OpenAI model or handle other APIs based on selection
    const apiEndpoint = "https://api.openai.com/v1/chat/completions";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };

    // Determine mode
    const isMessageMode = formData.mode === "message";

    // Construct system prompt including style examples if they exist
    let systemPromptContent = formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence.";

    // Add specific instructions based on mode
    if (isMessageMode) {
      systemPromptContent += "\n\nチャットメッセージ返信タスク: 受信したチャットメッセージと返信概要に基づいて、SlackやChatworkなどのチャットツールに適した返信メッセージを作成してください。件名は不要で、本文のみを生成してください。自然で読みやすく、チームコミュニケーションに適したトーンで書いてください。";
    } else if (isNewEmail) {
      systemPromptContent += "\n\n新規メール作成タスク: 提供されたメール内容の概要に基づいて、適切なビジネスメールを作成してください。件名と本文の両方を生成してください。";
    } else {
      systemPromptContent += "\n\nメール返信タスク: 受信したメッセージと返信概要に基づいて、適切なビジネスメール返信を作成してください。";
    }
    
    if (formData.style_examples && formData.style_examples.length > 0) {
      systemPromptContent += "\n\nFollow these style examples:\n";
      formData.style_examples.forEach((example, index) => {
        // Assuming example is a string like "Input: [input text] Output: [output text]"
        // If the format is different, adjust parsing accordingly.
        // For now, treating the whole string as one example block.
        systemPromptContent += `Example ${index + 1}:\n${example}\n`;
      });
    }

    // メイン処理ロジック - GPT-5 APIを使用
    headers.Authorization = `Bearer ${apiKey}`;

    // Determine JSON output format based on mode
    const jsonFormatInstruction = isMessageMode
      ? `{\n  "content": "本文"\n}`
      : `{\n  "subject": "件名",\n  "content": "本文"\n}`;

    const requestBody: GPT5ChatCompletionRequest = {
      model: formData.model || "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: systemPromptContent
        },
        {
          role: "user",
          content: `${xmlInput}\n\n${isMessageMode ? 'メッセージ内容' : isNewEmail ? 'メール内容' : '返信内容'}は以下のJSON形式で提供してください：\n${jsonFormatInstruction}`
        }
      ],
      max_completion_tokens: 4000,
      response_format: { type: "json_object" },
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      seed: Math.floor(Math.random() * 1000000)
    };

    // Call to OpenAI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒タイムアウト

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("GPT-5 API error:", errorData);
        
        // GPT-5専用のエラーハンドリングを使用
        result = handleGPT5Error(response, errorData);

        saveHistory(formData, result); // 失敗履歴も保存
        return result;
      }

      const data = await response.json();
      
      // JSON形式のレスポンスを解析
      try {
        const jsonResponse = typeof data.choices[0].message.content === 'string' 
          ? JSON.parse(data.choices[0].message.content) 
          : data.choices[0].message.content;
          
        // 内容がない場合はエラーとして処理
        if (!jsonResponse.content || jsonResponse.content.trim() === "") {
          result = {
            content: "AIが空の返信を生成しました。もう一度お試しください。",
            success: false,
            error: "EMPTY_RESPONSE"
          };
        } else {
            result = {
                subject: jsonResponse.subject || "",
                content: jsonResponse.content || "",
                success: true
            };
        }
        saveHistory(formData, result); // 成功履歴も保存
        return result;
      } catch (error) {
        console.error("Error parsing GPT JSON response:", error);
        // JSONが解析できない場合は、生のレスポンスを返す
        result = {
          content: data.choices[0].message.content || "返信文の生成に失敗しました。",
          success: true // Parsing error, but generation might have been successful textually
        };
        saveHistory(formData, result);
        return result;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        result = {
          content: "リクエストがタイムアウトしました。ネットワーク接続を確認して、もう一度お試しください。",
          success: false,
          error: "TIMEOUT"
        };
      } else {
         console.error("Inner email generation error:", error);
         result = {
            content: "メール生成中に内部エラーが発生しました。",
            success: false,
            error: "INTERNAL_ERROR"
         };
      }
      saveHistory(formData, result);
      return result;
    }
  } catch (error) {
    console.error("Email generation error:", error);
    result = {
      content: "メール生成中に予期せぬエラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。",
      success: false,
      error: "GENERATION_ERROR"
    };
    // Consider if saving history here makes sense - request data might be unavailable
    // saveHistory(formData, result); // formData may not be defined here
    return result;
  }
};

// 文章調整機能
export const adjustEmailText = async (
  currentText: string,
  customPrompt: string,
  tone?: number,
  length?: number,
  model?: string,
  systemPrompt?: string,
  apiKey?: string
): Promise<EmailGenerationResponse> => {
  let result: EmailGenerationResponse;
  try {
    // APIキーが空の場合はエラーを返す
    if (!apiKey || apiKey.trim() === "") {
      result = {
        content: "APIキーが設定されていません。設定画面から適切なAPIキーを設定してください。",
        success: false,
        error: "API_KEY_MISSING"
      };
      return result;
    }

    // Generate tone and length instructions based on parameters
    const getToneInstruction = (tone?: number) => {
      if (tone === undefined) return "";
      if (tone <= 25) return "非常に丁寧で正式なビジネストーンを使用してください。敬語を厳密に使い分け、「いつもお世話になっております」などの定型的な表現を含めてください。";
      if (tone <= 50) return "丁寧なビジネストーンを使用してください。適切な敬語を使いつつ、親しみやすさも感じられるように書いてください。";
      if (tone <= 75) return "親しみやすく適度にカジュアルなトーンを使用してください。敬語は使いますが、堅苦しくない表現を心がけてください。";
      return "フレンドリーでカジュアルなトーンを使用してください。「です・ます」調は維持しつつ、「〜ですね」「〜していただけると嬉しいです」など親近感のある表現を使い、絵文字や感嘆符も適度に使用して温かみのある文章にしてください。";
    };

    const getLengthInstruction = (length?: number) => {
      if (length === undefined) return "";
      if (length <= 25) return "簡潔で要点を絞った返信にしてください。";
      if (length <= 50) return "適度な長さで必要な情報を含む返信にしてください。";
      if (length <= 75) return "詳細な説明を含む丁寧な返信にしてください。";
      return "非常に詳細で包括的な返信にしてください。";
    };

    // Create XML formatted input for text adjustment
    const xmlInput = `
<text_adjustment>
  <current_text>${currentText}</current_text>
  <adjustment_request>${customPrompt}</adjustment_request>
</text_adjustment>

<style_adjustments>
${getToneInstruction(tone)}
${getLengthInstruction(length)}
</style_adjustments>
`;

    const apiEndpoint = "https://api.openai.com/v1/chat/completions";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };

    // Construct system prompt for text adjustment
    let systemPromptContent = systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence.";
    systemPromptContent += "\n\n現在のテキストを調整してください。ユーザーの調整依頼に基づいて、より適切で効果的な文章に改善してください。";

    const requestBody: GPT5ChatCompletionRequest = {
      model: model || "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: systemPromptContent
        },
        {
          role: "user",
          content: `${xmlInput}\n\n調整された文章は以下のJSON形式で提供してください：\n{\n  "subject": "件名（変更がある場合のみ）",\n  "content": "調整された本文"\n}`
        }
      ],
      max_completion_tokens: 4000,
      response_format: { type: "json_object" },
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      seed: Math.floor(Math.random() * 1000000)
    };

    // Call to OpenAI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒タイムアウト

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("GPT-5 API error:", errorData);
        
        // GPT-5専用のエラーハンドリングを使用
        result = handleGPT5Error(response, errorData);
        return result;
      }

      const data = await response.json();
      
      // JSON形式のレスポンスを解析
      try {
        const jsonResponse = typeof data.choices[0].message.content === 'string' 
          ? JSON.parse(data.choices[0].message.content) 
          : data.choices[0].message.content;
          
        // 内容がない場合はエラーとして処理
        if (!jsonResponse.content || jsonResponse.content.trim() === "") {
          result = {
            content: "AIが空の調整結果を生成しました。もう一度お試しください。",
            success: false,
            error: "EMPTY_RESPONSE"
          };
        } else {
            result = {
                subject: jsonResponse.subject || undefined,
                content: jsonResponse.content || "",
                success: true
            };
        }
        return result;
      } catch (error) {
        console.error("Error parsing GPT JSON response:", error);
        // JSONが解析できない場合は、生のレスポンスを返す
        result = {
          content: data.choices[0].message.content || "文章調整に失敗しました。",
          success: true // Parsing error, but generation might have been successful textually
        };
        return result;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        result = {
          content: "リクエストがタイムアウトしました。ネットワーク接続を確認して、もう一度お試しください。",
          success: false,
          error: "TIMEOUT"
        };
      } else {
         console.error("Inner text adjustment error:", error);
         result = {
            content: "文章調整中に内部エラーが発生しました。",
            success: false,
            error: "INTERNAL_ERROR"
         };
      }
      return result;
    }
  } catch (error) {
    console.error("Text adjustment error:", error);
    result = {
      content: "文章調整中に予期せぬエラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。",
      success: false,
      error: "ADJUSTMENT_ERROR"
    };
    return result;
  }
};

// GPT-5専用のエラーハンドリング関数
function handleGPT5Error(response: Response, errorData: { error?: { code?: string } }): EmailGenerationResponse {
  // GPT-5固有のエラーコードに対応
  if (response.status === 400 && errorData.error?.code === 'invalid_model') {
    return {
      content: "GPT-5モデルが利用できません。OpenAIの最新のAPIキーを使用してください。",
      success: false,
      error: "INVALID_MODEL"
    };
  }
  
  if (response.status === 429 && errorData.error?.code === 'rate_limit_exceeded') {
    return {
      content: "GPT-5のレート制限に達しました。しばらく時間をおいてから再試行してください。",
      success: false,
      error: "RATE_LIMIT_EXCEEDED"
    };
  }
  
  if (response.status === 401) {
    return {
      content: "GPT-5のAPIキーの認証に失敗しました。設定画面から正しいAPIキーを設定してください。",
      success: false,
      error: "INVALID_API_KEY"
    };
  }
  
  return {
    content: `GPT-5 APIエラーが発生しました (${response.status})`,
    success: false,
    error: `GPT5_API_ERROR_${response.status}`
  };
}
