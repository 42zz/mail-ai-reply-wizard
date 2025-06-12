import { useEffect, useCallback } from 'react';
import { checkShortcut } from '@/lib/platform';

export interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
}

export function useShortcuts(shortcuts: ShortcutAction[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 入力フィールドにフォーカスがある場合は一部のショートカットを無効化
    const activeElement = document.activeElement as HTMLElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
    
    // 入力フィールドでも有効にするショートカット（メール生成、ヘルプなど）
    const allowedInInputs = ['Enter', 'h'];
    
    for (const shortcut of shortcuts) {
      if (shortcut.disabled) continue;
      
      // 入力フィールドで無効化するショートカットをチェック
      if (isInputFocused && !allowedInInputs.includes(shortcut.key)) {
        continue;
      }
      
      if (checkShortcut(event, shortcut.key, {
        ctrl: shortcut.ctrl,
        shift: shortcut.shift,
        alt: shortcut.alt
      })) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// ヘルプモーダル用のショートカット一覧を取得
export function getShortcutList(shortcuts: ShortcutAction[]) {
  return shortcuts.map(shortcut => ({
    key: shortcut.key,
    ctrl: shortcut.ctrl,
    shift: shortcut.shift,
    alt: shortcut.alt,
    description: shortcut.description
  }));
}