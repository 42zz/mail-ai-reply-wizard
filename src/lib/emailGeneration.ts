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

interface EmailGenerationResponse {
  subject?: string;
  content: string;
  success: boolean;
  error?: string;
}

export const generateEmailReply = async (
  formData: EmailGenerationRequest,
  apiKey: string
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

    // Ensure date is in string format
    const date = formData.date instanceof Date 
      ? formData.date.toISOString().split('T')[0]
      : formData.date;

    console.log("Sending request to AI API with data:", {...formData, date});
    
    // Create XML formatted input - updated to match the new system prompt format
    const xmlInput = `
<input>
  <current_date>${date}</current_date>
  <signatures>${formData.signatures}</signatures>
  <sender_name>${formData.sender_name}</sender_name>
  <received_message>${formData.received_message}</received_message>
  <response_outline>${formData.response_outline}</response_outline>
  <style_examples>
    ${formData.style_examples?.map(example => `<example>${example}</example>`).join('\n') || ''}
  </style_examples>
</input>
`;

    // Map the selected model to OpenAI model or handle other APIs based on selection
    const apiEndpoint = "https://api.openai.com/v1/chat/completions";
    let requestBody: any = {};
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // メイン処理ロジック - OpenAI APIを使用
    headers.Authorization = `Bearer ${apiKey}`;
    requestBody = {
      model: formData.model || "gpt-4.1",
      messages: [
        {
          role: "system",
          content: formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence."
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

    console.log(`Sending request to ${apiEndpoint}`, { headers: { ...headers, Authorization: "[REDACTED]" }, body: requestBody });

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
          return {
            content: "APIキーの認証に失敗しました。設定画面から正しいAPIキーを設定してください。",
            success: false,
            error: "INVALID_API_KEY"
          };
        } else if (response.status === 429) {
          return {
            content: "APIリクエスト制限に達しました。しばらく時間をおいてから再試行してください。",
            success: false,
            error: "RATE_LIMIT_EXCEEDED"
          };
        }
        
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("AI API response:", data);
      
      // JSON形式のレスポンスを解析
      try {
        const jsonResponse = typeof data.choices[0].message.content === 'string' 
          ? JSON.parse(data.choices[0].message.content) 
          : data.choices[0].message.content;
          
        // 内容がない場合はエラーとして処理
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
        console.error("Error parsing GPT JSON response:", error);
        // JSONが解析できない場合は、生のレスポンスを返す
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
      throw error; // 他のエラーは外側のcatchブロックで処理
    }
  } catch (error) {
    console.error("Email generation error:", error);
    return {
      content: "メール生成中にエラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。",
      success: false,
      error: "GENERATION_ERROR"
    };
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
