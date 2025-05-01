import { EmailFormData } from "@/components/EmailReplyForm";

export interface HistoryEntry {
  id: string; // Unique ID for the history item
  request: EmailFormData;
  response: {
    subject?: string;
    content: string;
    success: boolean;
  };
  timestamp: number; // Unix timestamp
} 