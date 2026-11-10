// src/app/combo-maker/page.tsx
// コンボメーカー：一覧（キャラ・最初のコマンドで絞り込み、↑↓で並び替え）
'use client';

import { useEffect, useMemo, useState } from 'react';
import { client } from '@/lib/client';
import type { Schema } from '../../../amplify/data/resource';
import ComboSequence from './ComboSequence';
import IconPalette from './IconPalette';
import { Icon } from './CommandIcons';
import { type ComboStep, parseSteps, startsWithIcons } from './types';
import { pageStyle, containerStyle, panelStyle, inputStyle, labelStyle, primaryButtonStyle, smallButtonStyle } from './styles';

interface ComboRow {
  id: string;
  character_id: string;
  character_name: string;
  title: string;
  memo: string;
  steps: ComboStep[];
  sort_order: number | null;
  createdAt: string;
}

// 並び順：sort_order 未設定（並び替え前に作ったもの）を新しい順で先頭に、その後 sort_order 順
const compareCombos = (a: ComboRow, b: ComboRow) => {
  if (a.sort_order == null && b.sort_order == null) return b.createdAt.localeCompare(a.createdAt);
  if (a.sort_order == null) return -1;
  if (b.sort_order == null) return 1;
  return a.sort_order - b.sort_order;
};

export default function ComboMakerListPage() {
  const [combos, setCombos] = useState<ComboRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [characterFilter, setCharacterFilter] = useState('');
  const [commandPrefix, setCommandPrefix] = useState<string[]>([]);
  const [showPalette, setShowPalette] = useState(false);

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
            sort_order: c.sort_order ?? null,
            createdAt: c.createdAt,
          }))
        );
        nextToken = res.nextToken;
      } while (nextToken);
      setCombos(rows.sort(compareCombos));
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

  const visible = combos.filter(
    (c) => (!characterFilter || c.character_id === characterFilter) && startsWithIcons(c.steps, commandPrefix)
  );

  // 表示中の一覧で隣のコンボと入れ替え、全体の並び順を振り直して保存する
  const moveCombo = async (combo: ComboRow, direction: -1 | 1) => {
    const visibleIndex = visible.findIndex((c) => c.id === combo.id);
    const neighbor = visible[visibleIndex + direction];
    if (!neighbor) return;

    const next = [...combos];
    const a = next.findIndex((c) => c.id === combo.id);
    const b = next.findIndex((c) => c.id === neighbor.id);
    [next[a], next[b]] = [next[b], next[a]];

    const renumbered = next.map((c, i) => ({ ...c, sort_order: i }));
    const changed = renumbered.filter((c, i) => c.sort_order !== combos.find((o) => o.id === next[i].id)?.sort_order);

    const before = combos;
    setCombos(renumbered); // 先に画面へ反映
    setReordering(true);
    try {
      const results = await Promise.all(
        changed.map((c) => client.models.ComboRecipe.update({ id: c.id, sort_order: c.sort_order }, { authMode: 'userPool' }))
      );
      if (results.some((r) => r.errors?.length)) throw results.flatMap((r) => r.errors ?? []);
    } catch (error) {
      console.error('並び替えエラー:', error);
      alert('並び順の保存に失敗しました');
      setCombos(before);
    } finally {
      setReordering(false);
    }
  };

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

        {/* 絞り込み */}
        <div style={{ ...panelStyle, marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ minWidth: '240px' }}>
            <label style={labelStyle}>キャラクター</label>
            <select value={characterFilter} onChange={(e) => setCharacterFilter(e.target.value)} style={inputStyle}>
              <option value="">すべてのキャラクター</option>
              {characterOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '260px' }}>
            <label style={labelStyle}>最初のコマンド</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...inputStyle, width: 'auto', flex: 1, minHeight: '42px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
                {commandPrefix.length === 0 ? (
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>指定なし</span>
                ) : (
                  commandPrefix.map((code, i) => <Icon key={i} code={code} />)
                )}
              </div>
              <button onClick={() => setShowPalette((v) => !v)} style={{ ...smallButtonStyle, padding: '8px 12px', fontSize: '13px' }}>
                {showPalette ? '▲ 閉じる' : '▼ アイコン選択'}
              </button>
              <button
                onClick={() => setCommandPrefix((prev) => prev.slice(0, -1))}
                disabled={commandPrefix.length === 0}
                style={{ ...smallButtonStyle, padding: '8px 12px', fontSize: '13px' }}
              >
                1つ戻す
              </button>
              <button
                onClick={() => setCommandPrefix([])}
                disabled={commandPrefix.length === 0}
                style={{ ...smallButtonStyle, padding: '8px 12px', fontSize: '13px' }}
              >
                クリア
              </button>
            </div>
            {showPalette && (
              <div style={{ marginTop: '12px' }}>
                <IconPalette onSelect={(code) => setCommandPrefix((prev) => [...prev, code])} />
              </div>
            )}
          </div>
        </div>

        {!loading && (
          <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '10px' }}>
            {visible.length}件{visible.length !== combos.length && ` / 全${combos.length}件`}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '60px 0' }}>読み込み中...</div>
        ) : visible.length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: '60px 0' }}>
            {combos.length === 0 ? 'コンボがまだありません。「＋ 新規作成」から作成してください。' : '条件に合うコンボがありません。'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visible.map((combo, index) => (
              <div key={combo.id} style={panelStyle}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <span style={{ color: '#fca5a5', fontSize: '12px', marginRight: '10px' }}>{combo.character_name}</span>
                    <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{combo.title || '無題のコンボ'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => moveCombo(combo, -1)} disabled={reordering || index === 0} style={smallButtonStyle} title="上へ">↑</button>
                    <button onClick={() => moveCombo(combo, 1)} disabled={reordering || index === visible.length - 1} style={smallButtonStyle} title="下へ">↓</button>
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
