import { useSettings } from "@/contexts/SettingsContext";
import { generateEmailReply } from "@/lib/emailGeneration";

export interface EmailFormData {
  date: Date;
  senderName: string;
  signature?: string; // Make signature optional
  receivedMessage: string;
  responseOutline: string;
}

export function useEmailGeneration() {
  const { model, systemPrompt, apiKeys } = useSettings();

  const generateEmail = async (formData: EmailFormData) => {
    try {
      const response = await generateEmailReply({
        date: formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : formData.date,
        signatures: formData.signature || "", // Use empty string if signature is undefined
        sender_name: formData.senderName,
        recipient_name: "様", // デフォルト値を設定
        received_message: formData.receivedMessage,
        response_outline: formData.responseOutline,
        model, // 選択されたモデルを使用
        systemPrompt,
      }, apiKeys.openai);

      // Add additional validation to ensure content exists
      if (response.success && !response.content) {
        console.error("API returned success but content is empty");
        return {
          content: "メール生成は成功しましたが、返信内容が空でした。もう一度お試しください。",
          success: false,
          error: "EMPTY_CONTENT"
        };
      }

      return response;
    } catch (error) {
      console.error("Error in useEmailGeneration hook:", error);
      return {
        content: "メール生成中にエラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。",
        success: false,
        error: "GENERATION_ERROR"
      };
    }
  };

  return { generateEmail };
}
