
interface EmailGenerationRequest {
  date: string | Date;
  signatures: string;
  sender_name: string;
  recipient_name: string;
  received_message: string;
  response_outline: string;
  model?: string;
  systemPrompt?: string;
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
    const promptTemplate = formData.systemPrompt || `あなはプロフェッショナルなメール返信支援AIです。`;
    
    // Create XML formatted input
    const xmlInput = `
<input>
  <date>${date}</date>
  <signatures>${formData.signatures}</signatures>
  <sender_name>${formData.sender_name}</sender_name>
  <recipient_name>${formData.recipient_name}</recipient_name>
  <received_message>${formData.received_message}</received_message>
  <response_outline>${formData.response_outline}</response_outline>
</input>
`;

    // Map the selected model to OpenAI model or handle other APIs based on selection
    let apiEndpoint = "https://api.openai.com/v1/chat/completions";
    let requestBody: any = {};
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Configure request based on selected model
    switch (formData.model) {
      case "gpt4o":
        headers.Authorization = `Bearer ${apiKey}`;
        requestBody = {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence."
            },
            {
              role: "user",
              content: xmlInput
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        };
        break;
        
      case "chatgpt":
        headers.Authorization = `Bearer ${apiKey}`;
        requestBody = {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence."
            },
            {
              role: "user",
              content: xmlInput
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        };
        break;
      
      case "gemini":
        apiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
        headers.Authorization = `Bearer ${apiKey}`;
        requestBody = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${formData.systemPrompt || "あなたは日本語のビジネスメール作成の専門家です。"}\n\n${xmlInput}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        };
        break;
      
      case "claude-haiku":
        apiEndpoint = "https://api.anthropic.com/v1/messages";
        headers.Authorization = `Bearer ${apiKey}`;
        headers["anthropic-version"] = "2023-06-01";
        requestBody = {
          model: "claude-3-haiku-20240307",
          system: formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence.",
          messages: [
            {
              role: "user",
              content: xmlInput
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        };
        break;
        
      case "claude":
        apiEndpoint = "https://api.anthropic.com/v1/messages";
        headers.Authorization = `Bearer ${apiKey}`;
        headers["anthropic-version"] = "2023-06-01";
        requestBody = {
          model: "claude-3-sonnet-20240229",
          system: formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence.",
          messages: [
            {
              role: "user",
              content: xmlInput
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        };
        break;
      
      case "mistral":
        apiEndpoint = "https://api.mistral.ai/v1/chat/completions";
        headers.Authorization = `Bearer ${apiKey}`;
        requestBody = {
          model: "mistral-medium",
          messages: [
            {
              role: "system",
              content: formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence."
            },
            {
              role: "user",
              content: xmlInput
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        };
        break;
        
      default:
        // Fallback to OpenAI
        headers.Authorization = `Bearer ${apiKey}`;
        requestBody = {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence."
            },
            {
              role: "user",
              content: xmlInput
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        };
    }

    console.log(`Sending request to ${apiEndpoint}`, { headers: { ...headers, Authorization: "[REDACTED]" }, body: requestBody });

    // Call to the selected AI API
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

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
    
    // Extract content based on the API response format
    let aiResponse = "";
    
    switch (formData.model) {
      case "gpt4o":
        // For GPT-4o, we're using the JSON response format
        try {
          const jsonResponse = typeof data.choices[0].message.content === 'string' 
            ? JSON.parse(data.choices[0].message.content) 
            : data.choices[0].message.content;
            
          return {
            subject: jsonResponse.subject || "",
            content: jsonResponse.content || "",
            success: true
          };
        } catch (error) {
          console.error("Error parsing GPT-4o JSON response:", error);
          aiResponse = data.choices[0].message.content;
        }
        break;
      case "gemini":
        aiResponse = data.candidates[0].content.parts[0].text;
        break;
      case "claude-haiku":
      case "claude":
        aiResponse = data.content[0].text;
        break;
      case "mistral":
        aiResponse = data.choices[0].message.content;
        break;
      case "chatgpt":
      default:
        aiResponse = data.choices[0].message.content;
    }
    
    // Parse XML output format if available
    let subject = "";
    let content = "";
    
    // Try to parse XML output format
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
    } 
    // Fallback to previous format parsing method
    else if (aiResponse.includes("件名:")) {
      const parts = aiResponse.split("本文:");
      if (parts.length >= 2) {
        const subjectLine = parts[0].split("件名:")[1].trim();
        subject = subjectLine;
        content = parts[1].trim();
      } else {
        // Fallback if parsing fails
        subject = "ご連絡いただきありがとうございます";
        content = aiResponse;
      }
    } 
    // Last resort fallback
    else {
      subject = "ご連絡いただきありがとうございます";
      content = aiResponse;
    }

    return {
      subject,
      content,
      success: true,
    };
  } catch (error) {
    console.error("Email generation error:", error);
    return {
      content: "メール生成中にエラーが発生しました。もう一度お試しください。",
      success: false,
      error: "GENERATION_ERROR"
    };
  }
};
