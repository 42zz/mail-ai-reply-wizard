
import { Textarea } from "@/components/ui/textarea";

interface ResponseOutlineSectionProps {
  responseOutline: string;
  setResponseOutline: (outline: string) => void;
}

const ResponseOutlineSection = ({
  responseOutline,
  setResponseOutline,
}: ResponseOutlineSectionProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="response-outline" className="block text-sm font-medium">
        メール内容の概要 <span className="text-red-500 text-xs">*必須</span>
      </label>
      <Textarea
        id="response-outline"
        value={responseOutline}
        onChange={(e) => setResponseOutline(e.target.value)}
        placeholder="送信したいメールで伝えたい要点を箇条書きや簡潔な文章で記入してください"
        className="min-h-[150px] w-full"
        autoResize={true}
      />
    </div>
  );
};

export default ResponseOutlineSection;
