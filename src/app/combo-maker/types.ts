// src/app/combo-maker/types.ts
// コンボメーカー共通の型と関数

// 自由入力の1要素（アイコン or テキスト）
export type FreeToken =
  | { kind: 'icon'; code: string }
  | { kind: 'text'; text: string };

// コンボの1手
// type 未設定のデータ（初期版で保存したもの）は 'move' として扱う
export interface ComboStep {
  type?: 'move' | 'free';
  // 技（type: 'move'）
  moveId?: string;   // Move.id
  moveName?: string; // 保存時点の技名
  command?: string;  // 保存時点のコマンド（アイコン表示用）
  // 自由入力（type: 'free'）
  tokens?: FreeToken[];
}

export const isFreeStep = (step: ComboStep) => step.type === 'free';

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
