// src/app/combo-maker/edit/page.tsx
// /combo-maker/edit?id=xxx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { client } from '@/lib/client';
import ComboMakerEditor, { type ComboMakerInitial } from '../ComboMakerEditor';
import { parseSteps } from '../types';
import { pageStyle } from '../styles';

function EditContent() {
  const id = useSearchParams().get('id');
  const [initial, setInitial] = useState<ComboMakerInitial | null>(null);
  const [message, setMessage] = useState('読み込み中...');

  useEffect(() => {
    if (!id) {
      setMessage('コンボIDが指定されていません');
      return;
    }
    const load = async () => {
      try {
        const { data } = await client.models.ComboRecipe.get({ id }, { authMode: 'userPool' });
        if (!data) {
          setMessage('コンボが見つかりません');
          return;
        }
        setInitial({
          id: data.id,
          character_id: data.character_id,
          title: data.title ?? '',
          memo: data.memo ?? '',
          steps: parseSteps(data.steps),
          counterHit: data.counter_hit ?? false,
        });
      } catch (error) {
        console.error('取得エラー:', error);
        setMessage('コンボの取得に失敗しました');
      }
    };
    load();
  }, [id]);

  if (!initial) {
    return (
      <div style={{ ...pageStyle, color: '#9ca3af', textAlign: 'center', paddingTop: '80px' }}>
        {message}
        <div style={{ marginTop: '16px' }}><a href="/combo-maker" style={{ color: '#60a5fa' }}>一覧へ戻る</a></div>
      </div>
    );
  }
  return <ComboMakerEditor initial={initial} />;
}

export default function ComboMakerEditPage() {
  return (
    <Suspense fallback={<div style={pageStyle} />}>
      <EditContent />
    </Suspense>
  );
}
