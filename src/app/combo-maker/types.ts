// src/app/combo-maker/types.ts
// コンボメーカー共通の型と関数

export interface ComboStep {
  moveId: string;   // Move.id
  moveName: string; // 保存時点の技名
  command: string;  // 保存時点のコマンド（アイコン表示用）
}

export interface CharacterOption {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
}

export const getCharacterName = (c: CharacterOption) =>
  c.display_name || c.character_name_jp || c.character_name_en;

// character_id の表記ゆれ（"10" と "010" など）を吸収して比較する
export const isSameCharacterId = (a: string, b: string) =>
  String(a).trim().padStart(3, '0') === String(b).trim().padStart(3, '0');

// DBのJSON文字列を安全に配列へ変換する
export const parseSteps = (json?: string | null): ComboStep[] => {
  try {
    const parsed = JSON.parse(json ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
