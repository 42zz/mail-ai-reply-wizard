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
      saveHistory(formData, result);
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
    
    // Create XML formatted input
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

    // Determine mode
    const isMessageMode = formData.mode === "message";

    // Construct system prompt including style examples if they exist
    let systemPromptContent = formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence.";

    // Add specific instructions based on mode
    if (isMessageMode) {
      systemPromptContent += isNewEmail
        ? "\n\n新規メッセージ作成タスク: 返信概要に基づいて、SlackやChatworkなどのチャットツールに適したメッセージを作成してください。件名は不要で、本文のみを生成してください。自然で読みやすく、チームコミュニケーションに適したトーンで書いてください。"
        : "\n\nチャットメッセージ返信タスク: 受信したチャットメッセージと返信概要に基づいて、SlackやChatworkなどのチャットツールに適した返信メッセージを作成してください。件名は不要で、本文のみを生成してください。自然で読みやすく、チームコミュニケーションに適したトーンで書いてください。";
    } else if (isNewEmail) {
      systemPromptContent += "\n\n新規メール作成タスク: 提供されたメール内容の概要に基づいて、適切なビジネスメールを作成してください。件名と本文の両方を生成してください。";
    } else {
      systemPromptContent += "\n\nメール返信タスク: 受信したメッセージと返信概要に基づいて、適切なビジネスメール返信を作成してください。";
    }
    
    if (formData.style_examples && formData.style_examples.length > 0) {
      systemPromptContent += "\n\nFollow these style examples:\n";
      formData.style_examples.forEach((example, index) => {
        systemPromptContent += `Example ${index + 1}:\n${example}\n`;
      });
    }

    // Determine JSON output format based on mode
    const jsonFormatInstruction = isMessageMode
      ? `{\n  "content": "本文"\n}`
      : `{\n  "subject": "件名",\n  "content": "本文"\n}`;

    // Call the appropriate API based on provider
    result = await callAIProvider({
      xmlInput,
      systemPromptContent,
      jsonFormatInstruction,
      isMessageMode,
      isNewEmail,
      model: formData.model || "gpt-4o",
      apiKey,
    });

    saveHistory(formData, result);
    return result;
  } catch (error) {
    console.error("Email generation error:", error);
    result = {
      content: "メール生成中に予期せぬエラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。",
      success: false,
      error: "GENERATION_ERROR"
    };
    return result;
  }
};

// Provider function to call appropriate AI API
async function callAIProvider(params: {
  xmlInput: string;
  systemPromptContent: string;
  jsonFormatInstruction: string;
  isMessageMode: boolean;
  isNewEmail: boolean;
  model: string;
  apiKey: string;
}): Promise<EmailGenerationResponse> {
  const { xmlInput, systemPromptContent, jsonFormatInstruction, isMessageMode, model, apiKey } = params;

  // Determine provider from model
  let provider: 'openai' | 'gemini' | 'anthropic';
  if (model.startsWith('gpt') || model.startsWith('o3')) {
    provider = 'openai';
  } else if (model.startsWith('gemini')) {
    provider = 'gemini';
  } else if (model.startsWith('claude')) {
    provider = 'anthropic';
  } else {
    provider = 'openai'; // Default
  }

  // Call appropriate provider
  switch (provider) {
    case 'openai':
      return callOpenAI({ xmlInput, systemPromptContent, jsonFormatInstruction, model, apiKey });
    case 'gemini':
      return callGemini({ xmlInput, systemPromptContent, jsonFormatInstruction, model, apiKey });
    case 'anthropic':
      return callAnthropic({ xmlInput, systemPromptContent, jsonFormatInstruction, model, apiKey });
    default:
      return callOpenAI({ xmlInput, systemPromptContent, jsonFormatInstruction, model, apiKey });
  }
}

// OpenAI API call
async function callOpenAI(params: {
  xmlInput: string;
  systemPromptContent: string;
  jsonFormatInstruction: string;
  model: string;
  apiKey: string;
}): Promise<EmailGenerationResponse> {
  const { xmlInput, systemPromptContent, jsonFormatInstruction, model, apiKey } = params;

  const apiEndpoint = "https://api.openai.com/v1/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };

  const requestBody = {
    model,
    messages: [
      {
        role: "system",
        content: systemPromptContent
      },
      {
        role: "user",
        content: `${xmlInput}\n\n返信内容は以下のJSON形式で提供してください：\n${jsonFormatInstruction}`
      }
    ],
    max_completion_tokens: 4000,
    response_format: { type: "json_object" },
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    seed: Math.floor(Math.random() * 1000000)
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

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
      return handleOpenAIError(response, errorData);
    }

    const data = await response.json();
    
    try {
      const jsonResponse = typeof data.choices[0].message.content === 'string' 
        ? JSON.parse(data.choices[0].message.content) 
        : data.choices[0].message.content;
        
      if (!jsonResponse.content || jsonResponse.content.trim() === "") {
        return {
          content: "AIが空の返信を生成しました。もう一度お試しください。",
          success: false,
          error: "EMPTY_RESPONSE"
        };
      }
      
      return {
        subject: jsonResponse.subject || "",
        content: jsonResponse.content || "",
        success: true
      };
    } catch (error) {
      console.error("Error parsing OpenAI JSON response:", error);
      return {
        content: data.choices[0].message.content || "返信文の生成に失敗しました。",
        success: true
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        content: "リクエストがタイムアウトしました。ネットワーク接続を確認して、もう一度お試しください。",
        success: false,
        error: "TIMEOUT"
      };
    }
    return {
      content: "メール生成中に内部エラーが発生しました。",
      success: false,
      error: "INTERNAL_ERROR"
    };
  }
}

// Gemini API call
async function callGemini(params: {
  xmlInput: string;
  systemPromptContent: string;
  jsonFormatInstruction: string;
  model: string;
  apiKey: string;
}): Promise<EmailGenerationResponse> {
  const { xmlInput, systemPromptContent, jsonFormatInstruction, model, apiKey } = params;

  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${systemPromptContent}\n\n${xmlInput}\n\n返信内容は以下のJSON形式で提供してください：\n${jsonFormatInstruction}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4000,
      responseMimeType: "application/json"
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      return handleGeminiError(response, errorData);
    }

    const data = await response.json();
    
    try {
      const jsonResponse = JSON.parse(data.candidates[0].content.parts[0].text);
      
      if (!jsonResponse.content || jsonResponse.content.trim() === "") {
        return {
          content: "AIが空の返信を生成しました。もう一度お試しください。",
          success: false,
          error: "EMPTY_RESPONSE"
        };
      }
      
      return {
        subject: jsonResponse.subject || "",
        content: jsonResponse.content || "",
        success: true
      };
    } catch (error) {
      console.error("Error parsing Gemini JSON response:", error);
      const rawText = data.candidates[0]?.content?.parts?.[0]?.text;
      return {
        content: rawText || "返信文の生成に失敗しました。",
        success: true
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        content: "リクエストがタイムアウトしました。ネットワーク接続を確認して、もう一度お試しください。",
        success: false,
        error: "TIMEOUT"
      };
    }
    return {
      content: "メール生成中に内部エラーが発生しました。",
      success: false,
      error: "INTERNAL_ERROR"
    };
  }
}

// Anthropic API call
async function callAnthropic(params: {
  xmlInput: string;
  systemPromptContent: string;
  jsonFormatInstruction: string;
  model: string;
  apiKey: string;
}): Promise<EmailGenerationResponse> {
  const { xmlInput, systemPromptContent, jsonFormatInstruction, model, apiKey } = params;

  const apiEndpoint = "https://api.anthropic.com/v1/messages";
  
  const requestBody = {
    model,
    system: systemPromptContent,
    messages: [
      {
        role: "user",
        content: `${xmlInput}\n\n返信内容は以下のJSON形式で提供してください：\n${jsonFormatInstruction}`
      }
    ],
    max_tokens: 4000
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // CORSエラーを検出
      if (response.status === 0 || response.type === 'opaque') {
        return {
          content: "Anthropic APIはブラウザから直接呼ぶとCORSエラーが発生します。\n\n解決策:\n- OpenAIまたはGeminiを使用してください\n- バックエンドサーバーを経由してAPIを呼ぶ必要があります",
          success: false,
          error: "CORS_ERROR"
        };
      }
      const errorData = await response.json();
      return handleAnthropicError(response, errorData);
    }

    const data = await response.json();
    
    try {
      const jsonResponse = JSON.parse(data.content[0].text);
      
      if (!jsonResponse.content || jsonResponse.content.trim() === "") {
        return {
          content: "AIが空の返信を生成しました。もう一度お試しください。",
          success: false,
          error: "EMPTY_RESPONSE"
        };
      }
      
      return {
        subject: jsonResponse.subject || "",
        content: jsonResponse.content || "",
        success: true
      };
    } catch (error) {
      console.error("Error parsing Anthropic JSON response:", error);
      const rawText = data.content?.[0]?.text;
      return {
        content: rawText || "返信文の生成に失敗しました。",
        success: true
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        content: "リクエストがタイムアウトしました。ネットワーク接続を確認して、もう一度お試しください。",
        success: false,
        error: "TIMEOUT"
      };
    }
    return {
      content: "メール生成中に内部エラーが発生しました。",
      success: false,
      error: "INTERNAL_ERROR"
    };
  }
}

// Error handling functions
function handleOpenAIError(response: Response, errorData: { error?: { code?: string } }): EmailGenerationResponse {
  if (response.status === 401) {
    return {
      content: "OpenAI APIキーの認証に失敗しました。設定画面から正しいAPIキーを設定してください。",
      success: false,
      error: "INVALID_API_KEY"
    };
  }
  
  if (response.status === 429) {
    return {
      content: "OpenAIのレート制限に達しました。しばらく時間をおいてから再試行してください。",
      success: false,
      error: "RATE_LIMIT_EXCEEDED"
    };
  }
  
  return {
    content: `OpenAI APIエラーが発生しました (${response.status})`,
    success: false,
    error: `OPENAI_API_ERROR_${response.status}`
  };
}

function handleGeminiError(response: Response, errorData: any): EmailGenerationResponse {
  if (response.status === 400) {
    // Bad Request - APIキーの形式やリクエスト内容に問題がある可能性
    return {
      content: "Google Gemini APIリクエストエラーが発生しました。\n\n確認してください:\n- APIキーの形式が正しいか確認してください（GeminiのAPIキーは「AIza...」で始まります）\n- 現在のAPIキー: sk-ant-api03-... これはOpenAI形式で、Geminiでは使用できません\n\nGoogle AI Studio (https://aistudio.google.com/app/apikey) からGemini用のAPIキーを取得してください\n- APIキーの権限設定で「Generate Content API」が有効になっているか確認してください\n- ネットワーク接続を確認してください",
      success: false,
      error: "BAD_REQUEST"
    };
  }

  if (response.status === 404) {
    return {
      content: "Google Gemini APIエンドポイントが見つかりません。\n\n確認してください:\n- ネットワーク接続を確認してください\n- APIエンドポイントのURLが正しいか確認してください\n- モデル名が正しいか確認してください\n- 一時的なAPIの問題の可能性があります",
      success: false,
      error: "NOT_FOUND"
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      content: "Google Gemini APIキーの認証に失敗しました。\n\nAPIキーが正しいか確認してください（「AIza...」で始まるGemini形式ですか？）\n\n正しいAPIキーを取得するには:\n- Google AI Studio (https://aistudio.google.com/app/apikey) にアクセス\n- 新しいAPIキーをクリート\n- プロジェクトで「Generative Language Client API」が有効になっていることを確認",
      success: false,
      error: "INVALID_API_KEY"
    };
  }
  
  if (response.status === 429) {
    return {
      content: "Google Geminiのレート制限に達しました。しばらく時間をおいてから再試行してください。",
      success: false,
      error: "RATE_LIMIT_EXCEEDED"
    };
  }
  
  if (response.status === 500 || response.status === 503 || response.status === 504) {
    return {
      content: "Google Gemini APIのサーバーエラーが発生しました。\n\nしばらく時間をおいてから再試行してください。エラーが続く場合は、Google AIのステータスページ（https://status.cloud.google.com/）を確認してください。",
      success: false,
      error: "SERVER_ERROR"
    };
  }

  if (response.status === 502 || response.status === 503) {
    return {
      content: "Google Gemini APIのレート制限に達しました。\n\nしばらく時間をおいてから再試行してください。Google Cloudプロジェクトのレート制限設定を確認してください。",
      success: false,
      error: "RATE_LIMIT_EXCEEDED"
    };
  }

  if (response.status >= 400 && response.status < 500) {
    return {
      content: `Google Gemini APIリクエストエラーが発生しました (${response.status})。\n\n詳細なエラー情報がコンソールに出力されています。`,
      success: false,
      error: `GEMINI_REQUEST_ERROR_${response.status}`
    };
  }

  return {
    content: `Google Gemini APIエラーが発生しました (${response.status})`,
    success: false,
    error: `GEMINI_API_ERROR_${response.status}`
  };
}

function handleAnthropicError(response: Response, errorData: any): EmailGenerationResponse {
  if (response.status === 401) {
    return {
      content: "Anthropic APIキーの認証に失敗しました。設定画面から正しいAPIキーを設定してください。\n\n注: Anthropic APIはブラウザから直接呼ぶとCORSエラーが発生します。OpenAIまたはGeminiを使用してください。",
      success: false,
      error: "INVALID_API_KEY"
    };
  }
  
  if (response.status === 429) {
    return {
      content: "Anthropicのレート制限に達しました。しばらく時間をおいてから再試行してください。",
      success: false,
      error: "RATE_LIMIT_EXCEEDED"
    };
  }
  
  return {
    content: `Anthropic APIエラーが発生しました (${response.status})`,
    success: false,
    error: `ANTHROPIC_API_ERROR_${response.status}`
  };
}

// 文章調整機能
// 文章調整機能 (exported function)
export const adjustEmailText = async (
  currentText: string,
  customPrompt: string,
  tone?: number,
  length?: number,
  model?: string,
  systemPrompt?: string,
  apiKey?: string
): Promise<EmailGenerationResponse> => {
  try {
    // APIキーが空の場合はエラーを返す
    if (!apiKey || apiKey.trim() === "") {
      return {
        content: "APIキーが設定されていません。設定画面から適切なAPIキーを設定してください。",
        success: false,
        error: "API_KEY_MISSING"
      };
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

    // Construct system prompt for text adjustment
    let systemPromptContent = systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence.";
    systemPromptContent += "\n\n現在のテキストを調整してください。ユーザーの調整依頼に基づいて、より適切で効果的な文章に改善してください。";

    // Determine provider from model
    let provider: 'openai' | 'gemini' | 'anthropic';
    if ((model || "").startsWith('gpt') || (model || "").startsWith('o3')) {
      provider = 'openai';
    } else if ((model || "").startsWith('gemini')) {
      provider = 'gemini';
    } else if ((model || "").startsWith('claude')) {
      provider = 'anthropic';
    } else {
      provider = 'openai';
    }

    // Call appropriate provider
    switch (provider) {
      case 'openai':
        return await callOpenAIAdjustment({ xmlInput, systemPromptContent, model: model || "gpt-4o", apiKey });
      case 'gemini':
        return await callGeminiAdjustment({ xmlInput, systemPromptContent, model: model || "gpt-4o", apiKey });
      case 'anthropic':
        return await callAnthropicAdjustment({ xmlInput, systemPromptContent, model: model || "gpt-4o", apiKey });
      default:
        return await callOpenAIAdjustment({ xmlInput, systemPromptContent, model: model || "gpt-4o", apiKey });
    }
  } catch (error) {
    console.error("Text adjustment error:", error);
    return {
      content: "文章調整中に予期せぬエラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。",
      success: false,
      error: "ADJUSTMENT_ERROR"
    };
  }
}

// OpenAI adjustment call
async function callOpenAIAdjustment(params: {
  xmlInput: string;
  systemPromptContent: string;
  model: string;
  apiKey: string;
}): Promise<EmailGenerationResponse> {
  const { xmlInput, systemPromptContent, model, apiKey } = params;

  const apiEndpoint = "https://api.openai.com/v1/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };

  const requestBody = {
    model,
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

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
      return handleOpenAIError(response, errorData);
    }

    const data = await response.json();

    try {
      const jsonResponse = typeof data.choices[0].message.content === 'string'
        ? JSON.parse(data.choices[0].message.content)
        : data.choices[0].message.content;

      if (!jsonResponse.content || jsonResponse.content.trim() === "") {
        return {
          content: "AIが空の調整結果を生成しました。もう一度お試しください。",
          success: false,
          error: "EMPTY_RESPONSE"
        };
      }

      return {
        subject: jsonResponse.subject || undefined,
        content: jsonResponse.content || "",
        success: true
      };
    } catch (error) {
      console.error("Error parsing OpenAI JSON response:", error);
      return {
        content: data.choices[0].message.content || "文章調整に失敗しました。",
        success: true
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        content: "リクエストがタイムアウトしました。ネットワーク接続を確認して、もう一度お試しください。",
        success: false,
        error: "TIMEOUT"
      };
    }
    return {
      content: "文章調整中に内部エラーが発生しました。",
      success: false,
      error: "INTERNAL_ERROR"
    };
  }
}

// Gemini adjustment call
async function callGeminiAdjustment(params: {
  xmlInput: string;
  systemPromptContent: string;
  model: string;
  apiKey: string;
}): Promise<EmailGenerationResponse> {
  const { xmlInput, systemPromptContent, model, apiKey } = params;

  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `${systemPromptContent}\n\n${xmlInput}\n\n調整された文章は以下のJSON形式で提供してください：\n{\n  "subject": "件名（変更がある場合のみ）",\n  "content": "調整された本文"\n}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4000,
      responseMimeType: "application/json"
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      return handleGeminiError(response, errorData);
    }

    const data = await response.json();

    try {
      const jsonResponse = JSON.parse(data.candidates[0].content.parts[0].text);

      if (!jsonResponse.content || jsonResponse.content.trim() === "") {
        return {
          content: "AIが空の調整結果を生成しました。もう一度お試しください。",
          success: false,
          error: "EMPTY_RESPONSE"
        };
      }

      return {
        subject: jsonResponse.subject || undefined,
        content: jsonResponse.content || "",
        success: true
      };
    } catch (error) {
      console.error("Error parsing Gemini JSON response:", error);
      const rawText = data.candidates[0]?.content?.parts?.[0]?.text;
      return {
        content: rawText || "文章調整に失敗しました。",
        success: true
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        content: "リクエストがタイムアウトしました。ネットワーク接続を確認して、もう一度お試しください。",
        success: false,
        error: "TIMEOUT"
      };
    }
    return {
      content: "文章調整中に内部エラーが発生しました。",
      success: false,
      error: "INTERNAL_ERROR"
    };
  }
}

// Anthropic adjustment call
async function callAnthropicAdjustment(params: {
  xmlInput: string;
  systemPromptContent: string;
  model: string;
  apiKey: string;
}): Promise<EmailGenerationResponse> {
  const { xmlInput, systemPromptContent, model, apiKey } = params;

  const apiEndpoint = "https://api.anthropic.com/v1/messages";

  const requestBody = {
    model,
    system: systemPromptContent,
    messages: [
      {
        role: "user",
        content: `${xmlInput}\n\n調整された文章は以下のJSON形式で提供してください：\n{\n  "subject": "件名（変更がある場合のみ）",\n  "content": "調整された本文"\n}`
      }
    ],
    max_tokens: 4000
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // CORSエラーを検出
      if (response.status === 0 || response.type === 'opaque') {
        return {
          content: "Anthropic APIはブラウザから直接呼ぶとCORSエラーが発生します。\n\n解決策:\n- OpenAIまたはGeminiを使用してください\n- バックエンドサーバーを経由してAPIを呼ぶ必要があります",
          success: false,
          error: "CORS_ERROR"
        };
      }
      const errorData = await response.json();
      return handleAnthropicError(response, errorData);
    }

    const data = await response.json();

    try {
      const jsonResponse = JSON.parse(data.content[0].text);

      if (!jsonResponse.content || jsonResponse.content.trim() === "") {
        return {
          content: "AIが空の調整結果を生成しました。もう一度お試しください。",
          success: false,
          error: "EMPTY_RESPONSE"
        };
      }

      return {
        subject: jsonResponse.subject || undefined,
        content: jsonResponse.content || "",
        success: true
      };
    } catch (error) {
      console.error("Error parsing Anthropic JSON response:", error);
      const rawText = data.content?.[0]?.text;
      return {
        content: rawText || "文章調整に失敗しました。",
        success: true
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        content: "リクエストがタイムアウトしました。ネットワーク接続を確認して、もう一度お試しください。",
        success: false,
        error: "TIMEOUT"
      };
    }
    return {
      content: "文章調整中に内部エラーが発生しました。",
      success: false,
      error: "INTERNAL_ERROR"
    };
  }
}
