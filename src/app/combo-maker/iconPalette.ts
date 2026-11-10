// src/app/combo-maker/iconPalette.ts
// 自由入力で選べるアイコン（public/command-icons, public/effect-icons に画像があるもの）
// groups → blocks（横に並ぶまとまり）→ rows（行）→ セル（null は空きマス）

export interface PaletteIcon {
  code: string;
  label: string;
}

type Cell = PaletteIcon | null;

export interface IconGroup {
  title: string;
  blocks: Cell[][][];
}

export const ICON_GROUPS: IconGroup[] = [
  {
    title: '方向',
    blocks: [
      // 白矢印（テンキー配置・中央は☆）
      [
        [{ code: 'bj', label: '↖ (7)' }, { code: 'ju', label: '↑ (8)' }, { code: 'fj', label: '↗ (9)' }],
        [{ code: 'ba', label: '← (4)' }, { code: 'nt', label: '☆ (5)' }, { code: 'fo', label: '→ (6)' }],
        [{ code: 'bc', label: '↙ (1)' }, { code: 'cr', label: '↓ (2)' }, { code: 'fc', label: '↘ (3)' }],
      ],
      // 黒矢印（中央は空き）
      [
        [{ code: 'qy', label: '↖ (7) 黒' }, { code: 'wu', label: '↑ (8) 黒' }, { code: 'ei', label: '↗ (9) 黒' }],
        [{ code: 'ah', label: '← (4) 黒' }, null, { code: 'dk', label: '→ (6) 黒' }],
        [{ code: 'zb', label: '↙ (1) 黒' }, { code: 'xn', label: '↓ (2) 黒' }, { code: 'cm', label: '↘ (3) 黒' }],
      ],
    ],
  },
  {
    title: '攻撃ボタン',
    blocks: [
      [
        [{ code: 'lp', label: 'LP' }, { code: 'rp', label: 'RP' }, { code: 'wp', label: 'WP' }],
        [{ code: 'lk', label: 'LK' }, { code: 'rk', label: 'RK' }, { code: 'wk', label: 'WK' }],
        [{ code: 'wl', label: 'WL' }, { code: 'wr', label: 'WR' }],
      ],
    ],
  },
  {
    title: 'その他',
    blocks: [
      [
        [{ code: 'ij', label: 'IJ' }, { code: 'uk', label: 'UK' }],
        [
          { code: 'ng', label: 'NG' },
          { code: 'nh', label: 'NH' },
          { code: 'nb', label: 'NB' },
          { code: 'nv', label: 'NV' },
          { code: 'all', label: 'ALL' },
        ],
      ],
    ],
  },
  {
    title: '効果',
    blocks: [
      [
        [
          { code: 'TR', label: 'トルネード' },
          { code: 'FB', label: 'フロアブレイク' },
          { code: 'KS', label: 'KS' },
          { code: 'GV', label: 'GV' },
          { code: 'HO', label: 'ホーミング' },
          { code: 'HT', label: 'ヒート' },
          { code: 'PC', label: 'パワークラッシュ' },
          { code: 'WB', label: 'ウォールバウンド' },
        ],
      ],
    ],
  },
];
