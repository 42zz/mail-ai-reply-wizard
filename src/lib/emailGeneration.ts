
import { useSettings } from "@/contexts/SettingsContext";

interface EmailGenerationRequest {
  date: string;
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
}

export const generateEmailReply = async (
  formData: EmailGenerationRequest
): Promise<EmailGenerationResponse> => {
  try {
    console.log("Sending request to AI API with data:", formData);

    // Format the date in Japanese style for the prompt
    const dateObj = new Date(formData.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    
    // Create a prompt for the AI model
    const prompt = `
あなたは優れたビジネスメール作成の専門家です。
以下の情報を元に、日本語の丁寧なビジネスメールの返信を作成してください。

日付: ${year}年${month}月${day}日
送信者: ${formData.sender_name}
署名: ${formData.signatures}
受信者: ${formData.recipient_name}
受信したメッセージ: ${formData.received_message}
返信の要点: ${formData.response_outline}

日本の季節や社会的なマナーに合わせた適切な挨拶から始め、受信メッセージへの応答と返信要点を含む本文、
そして丁寧な締めの言葉と署名を含めてください。

メールの件名と本文を分けて出力してください。フォーマットは以下の通りです:
件名: [ここに件名]
本文:
[ここに本文]
`;

    // Call to OpenAI's API (or similar)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: formData.model || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: formData.systemPrompt || "You are a professional business email writer who specializes in Japanese business correspondence."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("AI API error:", errorData);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI API response:", data);
    
    const aiResponse = data.choices[0].message.content;
    
    // Parse the API response to extract subject and content
    let subject = "";
    let content = "";
    
    if (aiResponse.includes("件名:")) {
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
    } else {
      // Fallback if format is not as expected
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
    };
  }
};
