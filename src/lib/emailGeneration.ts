import { HistoryEntry } from "@/types";

interface EmailGenerationRequest {
  date: string | Date;
  signatures: string;
  sender_name: string;
  recipient_name?: string;
  received_message: string;
  response_outline: string;
  model?: string;
  systemPrompt?: string;
  style_examples?: string[];
}

// EmailFormData をインポート (HistoryEntry で使用)
import { EmailFormData } from "@/components/EmailReplyForm";

// OpenAI APIリクエストボディの型
interface OpenAIChatCompletionRequest {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  temperature: number;
  max_tokens: number;
  response_format: { type: string };
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

    // Create XML formatted input - updated to match the new system prompt format
    const xmlInput = `
<input>
  <current_date>${date}</current_date>
  <signatures>${formData.signatures}</signatures>
  <sender_name>${formData.sender_name}</sender_name>
  <received_message>${formData.received_message}</received_message>
  <response_outline>${formData.response_outline}</response_outline>
</input>
`;

    // Map the selected model to OpenAI model or handle other APIs based on selection
    const apiEndpoint = "https://api.openai.com/v1/chat/completions";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };

    // Construct system prompt including style examples if they exist
    let systemPromptContent = formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence.";
    if (formData.style_examples && formData.style_examples.length > 0) {
      systemPromptContent += "\n\nFollow these style examples:\n";
      formData.style_examples.forEach((example, index) => {
        // Assuming example is a string like "Input: [input text] Output: [output text]"
        // If the format is different, adjust parsing accordingly.
        // For now, treating the whole string as one example block.
        systemPromptContent += `Example ${index + 1}:\n${example}\n`;
      });
    }

    // メイン処理ロジック - OpenAI APIを使用
    headers.Authorization = `Bearer ${apiKey}`;
    const requestBody: OpenAIChatCompletionRequest = {
      model: formData.model || "gpt-4.1",
      messages: [
        {
          role: "system",
          content: systemPromptContent
        },
        {
          role: "user",
          content: `${xmlInput}\n\n返信内容は以下のJSON形式で提供してください：\n{\n  "subject": "件名",\n  "content": "本文"\n}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    };

    // Call to OpenAI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト

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
        console.error("AI API error:", errorData);
        
        // APIエラーの種類に基づいたメッセージを返す
        if (response.status === 401) {
          result = {
            content: "APIキーの認証に失敗しました。設定画面から正しいAPIキーを設定してください。",
            success: false,
            error: "INVALID_API_KEY"
          };
        } else if (response.status === 429) {
          result = {
            content: "APIリクエスト制限に達しました。しばらく時間をおいてから再試行してください。",
            success: false,
            error: "RATE_LIMIT_EXCEEDED"
          };
        } else {
           result = { content: `APIエラーが発生しました (${response.status})`, success: false, error: `API_ERROR_${response.status}` };
        }

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

// Claude APIを呼び出す分離関数（現在はCORSの問題で使用されていない）
async function callClaudeAPI(apiKey: string, systemPrompt: string, xmlInput: string): Promise<EmailGenerationResponse> {
  // ここでは、実際にClaudeのAPIを呼び出さず、CORSエラーを避けるために直接GPT-4oにフォールバック
  throw new Error("Claude API currently unavailable due to CORS restrictions");
  
  // 注意: 以下のコードはブラウザからは実行できないため、コメントアウトしています
  /*
  const apiEndpoint = "https://api.anthropic.com/v1/messages";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "anthropic-version": "2023-06-01"
  };
  
  const requestBody = {
    model: "claude-3-haiku-20240307",
    system: systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence.",
    messages: [
      {
        role: "user",
        content: `${xmlInput}\n\n返信内容は以下の形式で提供してください：\n<output>\n  <subject>件名（必要な場合のみ）</subject>\n  <content>メール本文</content>\n</output>`
      }
    ],
    max_tokens: 1000,
    temperature: 0.7
  };
  
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }
  
  const data = await response.json();
  const aiResponse = data.content[0].text;
  
  // Parse XML output format
  let subject = "";
  let content = "";
  
  if (aiResponse.includes("<output>") && aiResponse.includes("</output>")) {
    // Extract subject if available
    if (aiResponse.includes("<subject>") && aiResponse.includes("</subject>")) {
      const subjectMatch = aiResponse.match(/<subject>([\s\S]*?)<\/subject>/);
      if (subjectMatch && subjectMatch[1]) {
        subject = subjectMatch[1].trim();
      }
    }
    
    // Extract content
    const contentMatch = aiResponse.match(/<content>([\s\S]*?)<\/content>/);
    if (contentMatch && contentMatch[1]) {
      content = contentMatch[1].trim();
    } else {
      // Fallback if content tag is not found
      content = aiResponse;
    }
  } else {
    // Fallback
    subject = "ご連絡いただきありがとうございます";
    content = aiResponse;
  }
  
  return {
    subject,
    content,
    success: true
  };
  */
}
