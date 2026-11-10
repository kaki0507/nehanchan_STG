// src/app/combo/ComboSequence.tsx
// コンボ（技の並び）を「アイコン ▶ アイコン ▶ …」の形で表示する
'use client';

import { StepView } from './CommandIcons';
import type { ComboStep } from './types';

// counterHit が true のとき、最初のパーツの背景を赤くする
export default function ComboSequence({ steps, counterHit = false }: { steps: ComboStep[]; counterHit?: boolean }) {
  if (steps.length === 0) {
    return <span style={{ color: '#6b7280', fontSize: '13px' }}>技が登録されていません</span>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <span style={{ color: '#ef4444', fontSize: '12px' }}>▶</span>}
          <span
            title={i === 0 && counterHit ? `カウンターヒット始動：${step.type === 'free' ? '自由入力' : step.moveName}` : step.type === 'free' ? '自由入力' : step.moveName}
            style={
              i === 0 && counterHit
                ? { background: 'rgba(220, 38, 38, 0.85)', borderRadius: '4px', padding: '3px 6px', display: 'inline-flex', alignItems: 'center' }
                : undefined
            }
          >
            <StepView step={step} />
          </span>
        </div>
      ))}
    </div>
  );
}
