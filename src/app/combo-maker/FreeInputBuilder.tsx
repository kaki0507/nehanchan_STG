// src/app/combo-maker/FreeInputBuilder.tsx
// 自由入力：アイコン（複数）とテキストボックスを組み合わせて1手を作る
'use client';

import { useRef, useState } from 'react';
import { Icon, TEXT_COLOR } from './CommandIcons';
import { ICON_GROUPS } from './iconPalette';
import type { FreeToken } from './types';
import { inputStyle, labelStyle, smallButtonStyle } from './styles';

const paletteButtonStyle = {
  padding: '4px',
  background: 'rgba(0, 0, 0, 0.6)',
  border: '1px solid rgba(185, 28, 28, 0.4)',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '32px',
};

export default function FreeInputBuilder({ onAdd }: { onAdd: (tokens: FreeToken[]) => void }) {
  const [tokens, setTokens] = useState<FreeToken[]>([]);
  const textRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addIcon = (code: string) => setTokens((prev) => [...prev, { kind: 'icon', code }]);

  const addText = () => {
    setTokens((prev) => {
      const next: FreeToken[] = [...prev, { kind: 'text', text: '' }];
      // 追加したテキストボックスにフォーカス
      setTimeout(() => textRefs.current[next.length - 1]?.focus(), 0);
      return next;
    });
  };

  const updateText = (index: number, text: string) =>
    setTokens((prev) => prev.map((t, i) => (i === index && t.kind === 'text' ? { kind: 'text', text } : t)));

  const removeToken = (index: number) => setTokens((prev) => prev.filter((_, i) => i !== index));

  // 空のテキストボックスは除いて追加
  const cleaned = tokens.filter((t) => t.kind === 'icon' || t.text.trim() !== '');

  const submit = () => {
    if (cleaned.length === 0) return;
    onAdd(cleaned.map((t) => (t.kind === 'text' ? { kind: 'text', text: t.text.trim() } : t)));
    setTokens([]);
  };

  return (
    <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(185, 28, 28, 0.3)' }}>
      <label style={labelStyle}>自由入力</label>

      {/* 組み立て中の内容 */}
      <div
        style={{
          ...inputStyle,
          minHeight: '46px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '10px',
        }}
      >
        {tokens.length === 0 ? (
          <span style={{ color: '#6b7280', fontSize: '13px' }}>下のアイコン・テキストを選んで組み立て</span>
        ) : (
          tokens.map((t, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '2px 4px' }}>
              {t.kind === 'icon' ? (
                <Icon code={t.code} />
              ) : (
                <input
                  ref={(el) => { textRefs.current[i] = el; }}
                  type="text"
                  value={t.text}
                  onChange={(e) => updateText(i, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="テキスト"
                  style={{ width: `${Math.max(6, t.text.length + 2)}em`, maxWidth: '100%', padding: '2px 6px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(59,130,246,0.5)', borderRadius: '3px', color: TEXT_COLOR, fontSize: '13px' }}
                />
              )}
              <button
                onClick={() => removeToken(i)}
                title="削除"
                style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* アイコン・テキスト選択 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {ICON_GROUPS.map((group) => (
          <div key={group.title}>
            <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>{group.title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${group.columns}, minmax(32px, 44px))`, gap: '4px' }}>
              {group.icons.map((icon) => (
                <button key={icon.code} onClick={() => addIcon(icon.code)} title={icon.label} style={paletteButtonStyle}>
                  <Icon code={icon.code} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button
          onClick={addText}
          style={{ ...smallButtonStyle, padding: '8px 14px', fontSize: '13px', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.5)' }}
        >
          ＋ テキスト
        </button>
        <button
          onClick={() => setTokens([])}
          disabled={tokens.length === 0}
          style={{ ...smallButtonStyle, padding: '8px 14px', fontSize: '13px' }}
        >
          リセット
        </button>
        <button
          onClick={submit}
          disabled={cleaned.length === 0}
          style={{
            ...smallButtonStyle,
            padding: '8px 14px',
            fontSize: '13px',
            marginLeft: 'auto',
            color: cleaned.length ? '#86efac' : '#6b7280',
            border: `1px solid ${cleaned.length ? 'rgba(34,197,94,0.6)' : 'rgba(107,114,128,0.4)'}`,
            cursor: cleaned.length ? 'pointer' : 'not-allowed',
          }}
        >
          コンボに追加
        </button>
      </div>
    </div>
  );
}
