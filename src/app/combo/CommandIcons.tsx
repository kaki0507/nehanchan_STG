// src/app/combo/CommandIcons.tsx
// コマンド文字列・自由入力をアイコン付きで表示する（Tailwindに依存しないインラインスタイル版）
'use client';

import { useState } from 'react';
import { parseCommandToElements, getIconPath } from '@/utils/commandIcons';
import type { ComboStep, FreeToken } from './types';

export const TEXT_COLOR = '#e5e7eb';

export function Icon({ code, size = 22 }: { code: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span style={{ fontSize: '11px', fontFamily: 'monospace', background: '#e5e7eb', color: '#111827', padding: '1px 4px', borderRadius: '3px' }}>
        {code}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getIconPath(code)}
      alt={code}
      title={code}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
}

const rowStyle = { display: 'inline-flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: '3px', color: TEXT_COLOR, fontSize: '13px' };

// コマンド文字列（"fo rp" や "ヒート発動可能状態でlprp" など）を表示
export function CommandIcons({ command, size }: { command?: string | null; size?: number }) {
  if (!command) return null;
  const elements = parseCommandToElements(command);
  return (
    <span style={rowStyle}>
      {elements.map((el, i) =>
        el.type === 'icon' ? <Icon key={i} code={el.value} size={size} /> : <span key={i}>{el.value}</span>
      )}
    </span>
  );
}

// 自由入力のトークン列を表示
export function FreeTokens({ tokens, size }: { tokens?: FreeToken[]; size?: number }) {
  if (!tokens?.length) return null;
  return (
    <span style={rowStyle}>
      {tokens.map((t, i) =>
        t.kind === 'icon' ? <Icon key={i} code={t.code} size={size} /> : <span key={i}>{t.text}</span>
      )}
    </span>
  );
}

// コンボの1手を表示（技ならコマンド、自由入力ならトークン列）
export function StepView({ step, size }: { step: ComboStep; size?: number }) {
  if (step.type === 'free') return <FreeTokens tokens={step.tokens} size={size} />;
  return step.command ? (
    <CommandIcons command={step.command} size={size} />
  ) : (
    <span style={{ color: TEXT_COLOR, fontSize: '13px' }}>{step.moveName}</span>
  );
}
