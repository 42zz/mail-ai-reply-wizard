
import { Input } from "@/components/ui/input";

interface RecipientSectionProps {
  recipientName: string;
  setRecipientName: (name: string) => void;
}

const RecipientSection = ({
  recipientName,
  setRecipientName,
}: RecipientSectionProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="recipient-name" className="block text-sm font-medium">
        受信者名
      </label>
      <Input
        id="recipient-name"
        value={recipientName}
        onChange={(e) => setRecipientName(e.target.value)}
        placeholder="例: 佐藤次郎"
        className="w-full"
      />
    </div>
  );
};

export default RecipientSection;
