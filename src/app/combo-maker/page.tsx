// src/app/combo-maker/page.tsx
// コンボメーカー：一覧
'use client';

import { useEffect, useMemo, useState } from 'react';
import { client } from '@/lib/client';
import type { Schema } from '../../../amplify/data/resource';
import ComboSequence from './ComboSequence';
import { type ComboStep, parseSteps } from './types';
import { pageStyle, containerStyle, panelStyle, inputStyle, primaryButtonStyle, smallButtonStyle } from './styles';

interface ComboRow {
  id: string;
  character_id: string;
  character_name: string;
  title: string;
  memo: string;
  steps: ComboStep[];
  updatedAt: string;
}

export default function ComboMakerListPage() {
  const [combos, setCombos] = useState<ComboRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [characterFilter, setCharacterFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      let rows: ComboRow[] = [];
      let nextToken: string | null | undefined = undefined;
      do {
        const res: { data: Schema['ComboRecipe']['type'][]; nextToken?: string | null } =
          await client.models.ComboRecipe.list({ authMode: 'userPool', limit: 1000, nextToken });
        rows = rows.concat(
          (res.data || []).filter((c) => c !== null).map((c) => ({
            id: c.id,
            character_id: c.character_id,
            character_name: c.character_name ?? c.character_id,
            title: c.title ?? '',
            memo: c.memo ?? '',
            steps: parseSteps(c.steps),
            updatedAt: c.updatedAt,
          }))
        );
        nextToken = res.nextToken;
      } while (nextToken);
      rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); // 新しい順
      setCombos(rows);
    } catch (error) {
      console.error('一覧取得エラー:', error);
      alert('コンボの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 絞り込み用のキャラ一覧（登録済みコンボから作成）
  const characterOptions = useMemo(() => {
    const map = new Map<string, string>();
    combos.forEach((c) => map.set(c.character_id, c.character_name));
    return Array.from(map.entries()).sort((a, b) => a[0].padStart(3, '0').localeCompare(b[0].padStart(3, '0')));
  }, [combos]);

  const visible = characterFilter ? combos.filter((c) => c.character_id === characterFilter) : combos;

  const remove = async (combo: ComboRow) => {
    if (!confirm(`「${combo.title || '無題のコンボ'}」を削除しますか？`)) return;
    try {
      await client.models.ComboRecipe.delete({ id: combo.id }, { authMode: 'userPool' });
      setCombos((prev) => prev.filter((c) => c.id !== combo.id));
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '2px', margin: 0 }}>コンボメーカー</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/combo-maker/new" style={primaryButtonStyle}>＋ 新規作成</a>
            <a href="/" style={{ ...primaryButtonStyle, background: 'rgba(107,114,128,0.4)' }}>トップ</a>
          </div>
        </div>

        <div style={{ marginBottom: '20px', maxWidth: '320px' }}>
          <select value={characterFilter} onChange={(e) => setCharacterFilter(e.target.value)} style={inputStyle}>
            <option value="">すべてのキャラクター</option>
            {characterOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '60px 0' }}>読み込み中...</div>
        ) : visible.length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0' }}>
            コンボがまだありません。「＋ 新規作成」から作成してください。
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visible.map((combo) => (
              <div key={combo.id} style={panelStyle}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <span style={{ color: '#fca5a5', fontSize: '12px', marginRight: '10px' }}>{combo.character_name}</span>
                    <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{combo.title || '無題のコンボ'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a href={`/combo-maker/edit?id=${combo.id}`} style={{ ...smallButtonStyle, textDecoration: 'none', color: '#60a5fa' }}>編集</a>
                    <button onClick={() => remove(combo)} style={{ ...smallButtonStyle, color: '#fca5a5' }}>削除</button>
                  </div>
                </div>
                <ComboSequence steps={combo.steps} />
                {combo.memo && (
                  <p style={{ color: '#9ca3af', fontSize: '13px', margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>{combo.memo}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
