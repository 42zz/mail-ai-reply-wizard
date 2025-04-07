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
    
    // Format input data as XML
    const promptTemplate = formData.systemPrompt || `あなたはプロフェッショナルなメール返信支援AIです。以下のXML形式で提供される情報に基づいて、丁寧で適切なメール返信を作成してください。

<input>
  <current_date>YYYY-MM-DD形式の日付</current_date>
  <signatures>署名の完全なテキスト（改行を含む）</signatures>
  <sender_name>送信者の名前</sender_name>
  <received_message>受信したメッセージの内容</received_message>
  <response_outline>返信内容の概要</response_outline>
  <style_examples>
    ${formData.style_examples?.map(example => `<example>${example}</example>`).join('\n') || ''}
  </style_examples>
</input>

## 返信作成のガイドライン
1. 必要に応じて適切な件名を作成してください
2. 日本のビジネスマナーに沿った丁寧な言葉遣いを使用してください
3. 受信者名と送信者名を適切に使用し、敬称を付けてください
4. 提供された返信内容の概要に基づいて、具体的かつ明確な返信を作成してください
5. 提供された署名は一切変更せず、完全に同じ形式（スペース、改行、書式など）で適切な場所に配置してください
6. 署名が提供されていない場合は、署名を使用しないでください
7. 文章の長さは状況に応じて適切に調整してください
8. 文脈に応じて適切な結びの言葉を使用してください
9. スタイル例が提供されている場合は、それらの例文の文体や表現方法を参考にして、送信者の書き方に近い返信を作成してください
10. スタイル例を参考にする際も、日本のビジネスマナーは必ず守ってください

## 出力形式
<output>
  <subject>件名（必要な場合のみ）</subject>
  <content>メール本文</content>
</output>

上記のガイドラインに従って、プロフェッショナルで状況に適したメール返信を作成してください。署名の形式は厳密に守り、一文字も変更しないでください。`;
    
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
    let apiEndpoint = "https://api.openai.com/v1/chat/completions";
    let requestBody: any = {};
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // メイン処理ロジック - OpenAI APIを使用
    headers.Authorization = `Bearer ${apiKey}`;
    requestBody = {
      model: formData.model || "gpt-4o",
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
        console.error("Error parsing GPT-4o JSON response:", error);
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
