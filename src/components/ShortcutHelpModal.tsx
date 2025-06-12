import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getShortcutText } from "@/lib/platform";
import { ShortcutAction } from "@/hooks/useShortcuts";
import { Keyboard } from "lucide-react";

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutAction[];
}

const ShortcutHelpModal = ({ isOpen, onClose, shortcuts }: ShortcutHelpModalProps) => {
  const shortcutCategories = [
    {
      title: "📧 メイン機能",
      shortcuts: shortcuts.filter(s => 
        s.key === 'Enter' || s.key === 'Backspace'
      )
    },
    {
      title: "📋 コピー・編集",
      shortcuts: shortcuts.filter(s => 
        s.key === 'c' || s.key === 'e'
      )
    },
    {
      title: "🧭 タブ切替",
      shortcuts: shortcuts.filter(s => 
        s.key === '1' || s.key === '2'
      )
    },
    {
      title: "❓ ヘルプ",
      shortcuts: shortcuts.filter(s => 
        s.key === 'h'
      )
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            ショートカットキー一覧
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {shortcutCategories.map((category, categoryIndex) => (
            category.shortcuts.length > 0 && (
              <div key={categoryIndex} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">{category.title}</h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {getShortcutText(shortcut.key, {
                          ctrl: shortcut.ctrl,
                          shift: shortcut.shift,
                          alt: shortcut.alt
                        })}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">💡 使い方のコツ</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 入力フィールドにフォーカスがある場合、一部のショートカットは無効になります</li>
              <li>• メール生成（Ctrl/Cmd + Enter）とヘルプ（Ctrl/Cmd + H）は入力フィールド内でも使用できます</li>
              <li>• メール情報リセット（Ctrl/Cmd + Delete）は受信メッセージと返信概要のみクリアします</li>
              <li>• ショートカットは大文字・小文字を区別しません</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutHelpModal;