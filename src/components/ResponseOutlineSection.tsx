
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
        返信内容の概要
      </label>
      <Textarea
        id="response-outline"
        value={responseOutline}
        onChange={(e) => setResponseOutline(e.target.value)}
        placeholder="返信で伝えたい要点を箇条書きや簡潔な文章で記入してください"
        className="min-h-[150px] w-full"
        autoResize={true}
      />
    </div>
  );
};

export default ResponseOutlineSection;
