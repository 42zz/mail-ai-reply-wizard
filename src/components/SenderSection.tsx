
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Info, PlusCircle, Signature, Save, Edit, Trash } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
  const { signatureTemplates, addSignatureTemplate, updateSignatureTemplate, deleteSignatureTemplate } = useSettings();
  const { toast } = useToast();
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleAddTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "エラー",
        description: "テンプレート名を入力してください",
        variant: "destructive",
      });
      return;
    }

    if (!templateContent.trim()) {
      toast({
        title: "エラー",
        description: "署名内容を入力してください",
        variant: "destructive",
      });
      return;
    }

    addSignatureTemplate(templateName, templateContent);
    setTemplateName("");
    setTemplateContent("");
    setIsAddingTemplate(false);
    
    toast({
      title: "登録完了",
      description: "署名テンプレートを追加しました",
    });
  };

  const handleEditTemplate = () => {
    if (!selectedTemplateId) return;
    
    if (!templateName.trim()) {
      toast({
        title: "エラー",
        description: "テンプレート名を入力してください",
        variant: "destructive",
      });
      return;
    }

    if (!templateContent.trim()) {
      toast({
        title: "エラー",
        description: "署名内容を入力してください",
        variant: "destructive",
      });
      return;
    }

    updateSignatureTemplate(selectedTemplateId, templateName, templateContent);
    setTemplateName("");
    setTemplateContent("");
    setSelectedTemplateId(null);
    setIsEditingTemplate(false);
    
    toast({
      title: "更新完了",
      description: "署名テンプレートを更新しました",
    });
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplateId) return;
    
    deleteSignatureTemplate(selectedTemplateId);
    setSelectedTemplateId(null);
    setIsEditingTemplate(false);
    
    toast({
      title: "削除完了",
      description: "署名テンプレートを削除しました",
    });
  };

  const startEditTemplate = (id: string) => {
    const template = signatureTemplates.find(t => t.id === id);
    if (template) {
      setSelectedTemplateId(id);
      setTemplateName(template.name);
      setTemplateContent(template.content);
      setIsEditingTemplate(true);
    }
  };

  const selectTemplate = (content: string) => {
    setSignature(content);
    toast({
      title: "適用完了",
      description: "署名テンプレートを適用しました",
    });
  };

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
        <div className="flex justify-between items-center">
          <label htmlFor="signature" className="block text-sm font-medium">
            署名
          </label>
          <div className="flex space-x-2">
            <Dialog open={isAddingTemplate} onOpenChange={setIsAddingTemplate}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  <span>新規テンプレート</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>署名テンプレートを作成</DialogTitle>
                  <DialogDescription>
                    新しい署名テンプレートを作成します。名前と署名内容を入力してください。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="template-name" className="text-sm font-medium">
                      テンプレート名
                    </label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="例: 会社署名"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="template-content" className="text-sm font-medium">
                      署名内容
                    </label>
                    <Textarea
                      id="template-content"
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                      placeholder="例: 株式会社〇〇&#10;営業部 山田太郎&#10;TEL: 03-xxxx-xxxx"
                      className="min-h-[100px]"
                      autoResize={true}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">キャンセル</Button>
                  </DialogClose>
                  <Button onClick={handleAddTemplate}>
                    <Save className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditingTemplate} onOpenChange={setIsEditingTemplate}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>署名テンプレートを編集</DialogTitle>
                  <DialogDescription>
                    テンプレートの名前と署名内容を編集します。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-template-name" className="text-sm font-medium">
                      テンプレート名
                    </label>
                    <Input
                      id="edit-template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-template-content" className="text-sm font-medium">
                      署名内容
                    </label>
                    <Textarea
                      id="edit-template-content"
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                      className="min-h-[100px]"
                      autoResize={true}
                    />
                  </div>
                </div>
                <DialogFooter className="flex justify-between items-center">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteTemplate}
                    className="mr-auto"
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                  <div className="flex space-x-2">
                    <DialogClose asChild>
                      <Button variant="outline">キャンセル</Button>
                    </DialogClose>
                    <Button onClick={handleEditTemplate}>
                      <Save className="h-4 w-4 mr-1" />
                      更新
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center" disabled={signatureTemplates.length === 0}>
                  <Signature className="h-4 w-4 mr-1" />
                  <span>テンプレート</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>署名テンプレート</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {signatureTemplates.length === 0 ? (
                  <DropdownMenuItem disabled>
                    テンプレートがありません
                  </DropdownMenuItem>
                ) : (
                  signatureTemplates.map((template) => (
                    <div key={template.id} className="px-1 py-1">
                      <div className="flex items-center justify-between">
                        <DropdownMenuItem onClick={() => selectTemplate(template.content)} className="flex-1">
                          {template.name}
                        </DropdownMenuItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditTemplate(template.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Textarea
          id="signature"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="例: 株式会社〇〇&#10;営業部 山田太郎&#10;TEL: 03-xxxx-xxxx"
          className="min-h-[100px] w-full"
          autoResize={true}
        />
      </div>
    </div>
  );
};

export default SenderSection;
