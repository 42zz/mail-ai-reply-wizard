
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";

interface SenderSectionProps {
  senderName: string;
  setSenderName: (name: string) => void;
  signature: string;
  setSignature: (signature: string) => void;
}

const SenderSection = ({
  senderName,
  setSenderName,
  signature,
  setSignature,
}: SenderSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 flex items-center space-x-2 text-sm text-blue-700 mb-4">
        <Info className="h-5 w-5 flex-shrink-0" />
        <p>送信者情報は、ブラウザに一時的に保存されます。次回利用時に入力が自動的に引き継がれます。</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="sender-name" className="block text-sm font-medium">
          送信者名
        </label>
        <Input
          id="sender-name"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="例: 山田太郎"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signature" className="block text-sm font-medium">
          署名
        </label>
        <Textarea
          id="signature"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="例: 株式会社〇〇&#10;営業部 山田太郎&#10;TEL: 03-xxxx-xxxx"
          className="min-h-[100px] w-full"
        />
      </div>
    </div>
  );
};

export default SenderSection;
