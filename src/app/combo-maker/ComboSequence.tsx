// src/app/combo-maker/ComboSequence.tsx
// コンボ（技の並び）を「アイコン ▶ アイコン ▶ …」の形で表示する
'use client';

import CommandDisplay from '@/components/CommandDisplay';
import type { ComboStep } from './types';

export default function ComboSequence({ steps }: { steps: ComboStep[] }) {
  if (steps.length === 0) {
    return <span style={{ color: '#6b7280', fontSize: '13px' }}>技が登録されていません</span>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
      {steps.map((step, i) => (
        <div key={`${step.moveId}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <span style={{ color: '#ef4444', fontSize: '12px' }}>▶</span>}
          <span title={step.moveName}>
            <CommandDisplay command={step.command || step.moveName} size="sm" />
          </span>
        </div>
      ))}
    </div>
  );
}
