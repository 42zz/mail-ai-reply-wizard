
import { useSettings } from "@/contexts/SettingsContext";
import { generateEmailReply } from "@/lib/emailGeneration";

interface EmailFormData {
  date: string;
  signatures: string;
  sender_name: string;
  recipient_name: string;
  received_message: string;
  response_outline: string;
}

export function useEmailGeneration() {
  const { model, systemPrompt } = useSettings();

  const generateEmail = async (formData: EmailFormData) => {
    return generateEmailReply({
      ...formData,
      model,
      systemPrompt,
    });
  };

  return { generateEmail };
}
