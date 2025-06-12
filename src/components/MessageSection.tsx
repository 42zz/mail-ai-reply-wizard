
import { Textarea } from "@/components/ui/textarea";

interface MessageSectionProps {
  receivedMessage: string;
  setReceivedMessage: (message: string) => void;
}

const MessageSection = ({
  receivedMessage,
  setReceivedMessage,
}: MessageSectionProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="received-message" className="block text-sm font-medium">
        受信メッセージ内容 <span className="text-gray-500 text-xs">(返信メールの場合のみ)</span>
      </label>
      <Textarea
        id="received-message"
        value={receivedMessage}
        onChange={(e) => setReceivedMessage(e.target.value)}
        placeholder="返信メールの場合は、受信したメッセージの内容を入力してください。新規メールの場合は空欄のままにしてください。"
        className="min-h-[150px] w-full"
        autoResize={true}
      />
    </div>
  );
};

export default MessageSection;
