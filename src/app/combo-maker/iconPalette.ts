// src/app/combo-maker/iconPalette.ts
// 自由入力で選べるアイコン（public/command-icons, public/effect-icons に画像があるもの）

export interface PaletteIcon {
  code: string;
  label: string;
}

export const ICON_GROUPS: { title: string; columns: number; icons: PaletteIcon[] }[] = [
  {
    title: '方向',
    columns: 3, // テンキー配置
    icons: [
      { code: 'bj', label: '↖ (7)' },
      { code: 'ju', label: '↑ (8)' },
      { code: 'fj', label: '↗ (9)' },
      { code: 'ba', label: '← (4)' },
      { code: 'nt', label: 'N (5)' },
      { code: 'fo', label: '→ (6)' },
      { code: 'dk', label: '↙ (1)' },
      { code: 'cr', label: '↓ (2)' },
      { code: 'ng', label: '↘ (3)' },
    ],
  },
  {
    title: 'ボタン',
    columns: 5,
    icons: [
      { code: 'lp', label: 'LP' },
      { code: 'rp', label: 'RP' },
      { code: 'lk', label: 'LK' },
      { code: 'rk', label: 'RK' },
      { code: 'all', label: '全ボタン' },
      { code: 'wp', label: 'WP' },
      { code: 'wk', label: 'WK' },
      { code: 'wl', label: 'WL' },
      { code: 'wr', label: 'WR' },
    ],
  },
  {
    title: 'その他',
    columns: 7,
    icons: [
      { code: 'bc', label: 'バックチャージ' },
      { code: 'fc', label: 'フロントチャージ' },
      { code: 'qy', label: 'クイック' },
      { code: 'wu', label: 'ウェイクアップ' },
      { code: 'ei', label: 'EX技' },
      { code: 'ah', label: 'エアヒット' },
      { code: 'cm', label: 'カウンター' },
      { code: 'ij', label: 'インジャンプ' },
      { code: 'uk', label: 'UK' },
      { code: 'zb', label: 'ZB' },
      { code: 'xn', label: 'XN' },
      { code: 'nh', label: 'NH' },
      { code: 'nv', label: 'NV' },
      { code: 'nb', label: 'NB' },
    ],
  },
  {
    title: '効果',
    columns: 8,
    icons: [
      { code: 'TR', label: 'トルネード' },
      { code: 'FB', label: 'フロアブレイク' },
      { code: 'KS', label: 'KS' },
      { code: 'GV', label: 'GV' },
      { code: 'HO', label: 'ホーミング' },
      { code: 'HT', label: 'ヒート' },
      { code: 'PC', label: 'パワークラッシュ' },
      { code: 'WB', label: 'ウォールバウンド' },
    ],
  },
];
