// src/app/combo-maker/ComboSequence.tsx
// コンボ（技の並び）を「アイコン ▶ アイコン ▶ …」の形で表示する
'use client';

import { StepView } from './CommandIcons';
import type { ComboStep } from './types';

export default function ComboSequence({ steps }: { steps: ComboStep[] }) {
  if (steps.length === 0) {
    return <span style={{ color: '#6b7280', fontSize: '13px' }}>技が登録されていません</span>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <span style={{ color: '#ef4444', fontSize: '12px' }}>▶</span>}
          <span title={step.type === 'free' ? '自由入力' : step.moveName}>
            <StepView step={step} />
          </span>
        </div>
      ))}
    </div>
  );
}
