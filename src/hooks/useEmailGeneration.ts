
import { useSettings } from "@/contexts/SettingsContext";
import { generateEmailReply } from "@/lib/emailGeneration";

interface EmailFormData {
  date: string;
  signatures: string;
  sender_name: string;
  received_message: string;
  response_outline: string;
}

export function useEmailGeneration() {
  const { model, systemPrompt, apiKeys } = useSettings();

  // Get the appropriate API key based on selected model
  const getApiKey = () => {
    switch (model) {
      case "chatgpt": return apiKeys.openai;
      case "gemini": return apiKeys.gemini;
      case "claude": return apiKeys.claude;
      case "mistral": return apiKeys.mistral;
      default: return apiKeys.openai;
    }
  };

  const generateEmail = async (formData: EmailFormData) => {
    return generateEmailReply({
      ...formData,
      recipient_name: "様", // デフォルト値を設定
      model,
      systemPrompt,
    }, getApiKey());
  };

  return { generateEmail };
}
