// src/app/combo-maker/IconPalette.tsx
// アイコン選択パレット（自由入力・一覧の絞り込みで共用）
'use client';

import { Icon } from './CommandIcons';
import { ICON_GROUPS } from './iconPalette';

const cellSize = { width: '44px', height: '32px' };

const buttonStyle = {
  ...cellSize,
  padding: '4px',
  background: 'rgba(0, 0, 0, 0.6)',
  border: '1px solid rgba(185, 28, 28, 0.4)',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export default function IconPalette({ onSelect }: { onSelect: (code: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {ICON_GROUPS.map((group) => (
        <div key={group.title}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>{group.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {group.blocks.map((rows, b) => (
              <div key={b} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {rows.map((row, r) => (
                  <div key={r} style={{ display: 'flex', gap: '4px' }}>
                    {row.map((icon, c) =>
                      icon ? (
                        <button key={icon.code} onClick={() => onSelect(icon.code)} title={icon.label} style={buttonStyle}>
                          <Icon code={icon.code} />
                        </button>
                      ) : (
                        <div key={`empty-${c}`} style={cellSize} />
                      )
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
