
import { useSettings } from "@/contexts/SettingsContext";
import { generateEmailReply } from "@/lib/emailGeneration";

// Update the interface to match what's being used in EmailReplyForm.tsx
export interface EmailFormData {
  date: Date;
  senderName: string;
  signature: string;
  receivedMessage: string;
  responseOutline: string;
}

export function useEmailGeneration() {
  const { model, systemPrompt, apiKeys } = useSettings();

  const generateEmail = async (formData: EmailFormData) => {
    return generateEmailReply({
      date: formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : formData.date,
      signatures: formData.signature,
      sender_name: formData.senderName,
      recipient_name: "様", // デフォルト値を設定
      received_message: formData.receivedMessage,
      response_outline: formData.responseOutline,
      model: "gpt4o", // Force GPT-4o
      systemPrompt,
    }, apiKeys.openai);
  };

  return { generateEmail };
}
