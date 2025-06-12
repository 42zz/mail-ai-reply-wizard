// プラットフォーム検出とショートカットキー関連ユーティリティ

export const isMac = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

export const getModifierKey = () => {
  return isMac() ? 'metaKey' : 'ctrlKey';
};

export const getModifierText = () => {
  return isMac() ? 'Cmd' : 'Ctrl';
};

// ショートカットキーの組み合わせをチェック
export const checkShortcut = (
  event: KeyboardEvent,
  key: string,
  options: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  } = {}
): boolean => {
  const { ctrl = false, shift = false, alt = false } = options;
  
  // キーが一致するかチェック
  if (event.key.toLowerCase() !== key.toLowerCase()) {
    return false;
  }
  
  // モディファイアキーのチェック
  const modifierPressed = isMac() ? event.metaKey : event.ctrlKey;
  if (ctrl && !modifierPressed) return false;
  if (!ctrl && modifierPressed) return false;
  
  if (shift && !event.shiftKey) return false;
  if (!shift && event.shiftKey) return false;
  
  if (alt && !event.altKey) return false;
  if (!alt && event.altKey) return false;
  
  return true;
};

// ショートカットキーの表示テキストを生成
export const getShortcutText = (
  key: string,
  options: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  } = {}
): string => {
  const { ctrl = false, shift = false, alt = false } = options;
  const parts: string[] = [];
  
  if (ctrl) parts.push(getModifierText());
  if (shift) parts.push('Shift');
  if (alt) parts.push(isMac() ? 'Option' : 'Alt');
  
  // キーの表示名を調整
  const keyDisplayName = key === 'Enter' ? 'Enter' : 
                        key === ' ' ? 'Space' :
                        key === 'Backspace' ? 'Delete' :
                        key.toUpperCase();
  
  parts.push(keyDisplayName);
  
  return parts.join(' + ');
};