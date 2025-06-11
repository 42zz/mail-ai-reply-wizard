import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AdjustmentSectionProps {
  tone: number;
  setTone: (value: number) => void;
  length: number;
  setLength: (value: number) => void;
}

const AdjustmentSection = ({ tone, setTone, length, setLength }: AdjustmentSectionProps) => {
  const getToneLabel = (value: number) => {
    if (value <= 25) return "とても丁寧";
    if (value <= 50) return "丁寧";
    if (value <= 75) return "親しみやすい";
    return "フレンドリー";
  };

  const getLengthLabel = (value: number) => {
    if (value <= 25) return "簡潔";
    if (value <= 50) return "標準";
    if (value <= 75) return "詳細";
    return "とても詳細";
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">返信スタイル調整</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="tone-slider" className="text-sm font-medium">
              トーン
            </Label>
            <Badge variant="outline" className="text-xs">
              {getToneLabel(tone)}
            </Badge>
          </div>
          <Slider
            id="tone-slider"
            min={0}
            max={100}
            step={5}
            value={[tone]}
            onValueChange={(value) => setTone(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>丁寧・フォーマル</span>
            <span>フレンドリー・カジュアル</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="length-slider" className="text-sm font-medium">
              返信の長さ
            </Label>
            <Badge variant="outline" className="text-xs">
              {getLengthLabel(length)}
            </Badge>
          </div>
          <Slider
            id="length-slider"
            min={0}
            max={100}
            step={5}
            value={[length]}
            onValueChange={(value) => setLength(value[0])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>簡潔</span>
            <span>詳細</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-700">
          <p className="font-medium mb-1">調整のヒント</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>トーン: ビジネス関係では丁寧側を、親しい関係では親しみやすい側を推奨</li>
            <li>長さ: 要点のみ伝える場合は簡潔に、詳しく説明する場合は詳細に設定</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdjustmentSection;