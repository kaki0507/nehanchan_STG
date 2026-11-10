// src/app/combo/ComboMakerEditor.tsx
// コンボメーカー：技リストから選んで一列に並べる作成・編集画面（新規/編集共通）
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { client } from '@/lib/client';
import ComboSequence from './ComboSequence';
import FreeInputBuilder from './FreeInputBuilder';
import { CommandIcons, StepView } from './CommandIcons';
import {
  type ComboStep,
  type FreeToken,
  type CharacterOption,
  getCharacterName,
  isSameCharacterId,
} from './types';
import {
  pageStyle,
  containerStyle,
  panelStyle,
  labelStyle,
  inputStyle,
  primaryButtonStyle,
  subButtonStyle,
  smallButtonStyle,
} from './styles';

interface MoveOption {
  id: string;
  move_id: string;
  move_num?: number | null;
  move_name: string;
  move_name_kana?: string | null;
  command?: string | null;
  character_id: string;
}

export interface ComboMakerInitial {
  id: string;
  character_id: string;
  title: string;
  memo: string;
  steps: ComboStep[];
  counterHit: boolean;
  damage: number | null;
}

export default function ComboMakerEditor({ initial }: { initial?: ComboMakerInitial }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [allMoves, setAllMoves] = useState<MoveOption[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [saving, setSaving] = useState(false);

  const [characterId, setCharacterId] = useState(initial?.character_id ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [steps, setSteps] = useState<ComboStep[]>(initial?.steps ?? []);
  const [counterHit, setCounterHit] = useState(initial?.counterHit ?? false);
  const [damage, setDamage] = useState(initial?.damage != null ? String(initial.damage) : '');
  const [keyword, setKeyword] = useState('');
  const [showStepList, setShowStepList] = useState(true); // 手順リスト（技名ごとの欄）の開閉

  // キャラクター・技マスタの取得
  useEffect(() => {
    const load = async () => {
      try {
        const { data: chars } = await client.models.Character.list({ authMode: 'apiKey', limit: 1000 });
        const sortedChars = (chars || [])
          .filter((c) => c !== null)
          .sort((a, b) =>
            String(a.character_id).padStart(3, '0').localeCompare(String(b.character_id).padStart(3, '0'))
          ) as CharacterOption[];
        setCharacters(sortedChars);

        // DynamoDBの取得件数制限があるため nextToken で全件取得する
        let moves: MoveOption[] = [];
        let nextToken: string | null | undefined = undefined;
        do {
          const res: { data: MoveOption[]; nextToken?: string | null } = await client.models.Move.list({
            authMode: 'apiKey',
            limit: 1000,
            nextToken,
          });
          moves = moves.concat((res.data || []).filter((m) => m !== null));
          nextToken = res.nextToken;
        } while (nextToken);
        setAllMoves(moves);
      } catch (error) {
        console.error('マスタ取得エラー:', error);
        alert('キャラクター・技データの取得に失敗しました');
      } finally {
        setLoadingMaster(false);
      }
    };
    load();
  }, []);

  // 選択中キャラの技（表示順：move_num → move_id）
  const characterMoves = useMemo(() => {
    if (!characterId) return [];
    return allMoves
      .filter((m) => isSameCharacterId(m.character_id, characterId))
      .sort((a, b) => {
        const na = a.move_num ?? Number.MAX_SAFE_INTEGER;
        const nb = b.move_num ?? Number.MAX_SAFE_INTEGER;
        if (na !== nb) return na - nb;
        return String(a.move_id).localeCompare(String(b.move_id));
      });
  }, [allMoves, characterId]);

  // キーワードで絞り込み（技名・かな・コマンド）
  const filteredMoves = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return characterMoves;
    return characterMoves.filter((m) =>
      [m.move_name, m.move_name_kana, m.command].some((v) => (v ?? '').toLowerCase().includes(kw))
    );
  }, [characterMoves, keyword]);

  const selectedCharacter = characters.find((c) => isSameCharacterId(c.character_id, characterId));

  const handleCharacterChange = (value: string) => {
    if (steps.length > 0 && !confirm('キャラクターを変更すると、並べた技はクリアされます。よろしいですか？')) {
      return;
    }
    setCharacterId(value);
    setSteps([]);
    setKeyword('');
  };

  const addStep = (move: MoveOption) => {
    setSteps((prev) => [...prev, { type: 'move', moveId: move.id, moveName: move.move_name, command: move.command ?? '' }]);
  };

  const addFreeStep = (tokens: FreeToken[]) => {
    setSteps((prev) => [...prev, { type: 'free', tokens }]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    setSteps((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = async () => {
    if (!characterId) return alert('キャラクターを選択してください');
    if (steps.length === 0) return alert('技を1つ以上追加してください');
    if (damage.trim() !== '' && !/^\d+$/.test(damage.trim())) return alert('ダメージは0以上の整数で入力してください');

    setSaving(true);
    try {
      const payload = {
        character_id: characterId,
        character_name: selectedCharacter ? getCharacterName(selectedCharacter) : undefined,
        title: title.trim() || undefined,
        memo: memo.trim() || undefined,
        steps: JSON.stringify(steps),
        counter_hit: counterHit,
        damage: damage.trim() === '' ? null : parseInt(damage.trim(), 10), // 空欄なら未設定
      };
      // ComboRecipe は owner 認証のため userPool で保存する
      const { errors } = isEdit
        ? await client.models.ComboRecipe.update({ id: initial!.id, ...payload }, { authMode: 'userPool' })
        : await client.models.ComboRecipe.create(payload, { authMode: 'userPool' });
      if (errors?.length) throw errors;

      alert('コンボを保存しました');
      router.push('/combo/list');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '2px', margin: 0 }}>
            {isEdit ? 'コンボメーカー（編集）' : 'コンボメーカー'}
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/combo/list" style={subButtonStyle}>一覧</a>
            <a href="/" style={primaryButtonStyle}>トップ</a>
          </div>
        </div>

        {/* 完成イメージ（並べた技） */}
        <div style={{ ...panelStyle, marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ ...labelStyle, marginBottom: 0 }}>コンボ（{steps.length}手）</span>
            {steps.length > 0 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setShowStepList((v) => !v)} style={smallButtonStyle}>
                  {showStepList ? '▲ 手順を閉じる' : '▼ 手順を開く'}
                </button>
                <button
                  onClick={() => confirm('並べた技をすべてクリアしますか？') && setSteps([])}
                  style={smallButtonStyle}
                >
                  クリア
                </button>
              </div>
            )}
          </div>

          <ComboSequence steps={steps} counterHit={counterHit} />

          {/* 並べ替え・削除 */}
          {steps.length > 0 && showStepList && (
            <ol style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {steps.map((step, i) => (
                <li
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}
                >
                  <span style={{ color: '#9ca3af', fontSize: '12px', width: '24px' }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#ffffff', fontSize: '13px', marginBottom: '2px' }}>
                      {step.type === 'free' ? '自由入力' : step.moveName}
                    </div>
                    {(step.type === 'free' || step.command) && <StepView step={step} />}
                  </div>
                  <button onClick={() => moveStep(i, -1)} disabled={i === 0} style={smallButtonStyle} title="前へ">↑</button>
                  <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} style={smallButtonStyle} title="後ろへ">↓</button>
                  <button onClick={() => removeStep(i)} style={{ ...smallButtonStyle, color: '#fca5a5' }} title="削除">×</button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* 左：基本情報 */}
          <div style={panelStyle}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>キャラクター *</label>
              <select
                value={characterId}
                onChange={(e) => handleCharacterChange(e.target.value)}
                disabled={loadingMaster}
                style={inputStyle}
              >
                <option value="">{loadingMaster ? '読み込み中...' : '選択してください'}</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.character_id}>{getCharacterName(c)}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 右アッパー始動 壁なし"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={counterHit}
                  onChange={(e) => setCounterHit(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#dc2626', cursor: 'pointer' }}
                />
                カウンターヒット始動
              </label>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>ダメージ（任意）</label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={damage}
                onChange={(e) => setDamage(e.target.value)}
                placeholder="例: 72"
                style={{ ...inputStyle, maxWidth: '160px' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>メモ</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
                placeholder="入力のコツ、ダメージ、状況など"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <button
              onClick={save}
              disabled={saving}
              style={{ ...primaryButtonStyle, width: '100%', padding: '14px', fontSize: '16px', opacity: saving ? 0.5 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>

          {/* 右：技リスト */}
          <div style={panelStyle}>
            <FreeInputBuilder onAdd={addFreeStep} />

            <label style={labelStyle}>技リスト（クリックで末尾に追加）</label>
            {!characterId ? (
              <div style={{ color: '#6b7280', fontSize: '14px', padding: '40px 0', textAlign: 'center' }}>
                先にキャラクターを選択してください
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="技名・かな・コマンドで検索"
                  style={{ ...inputStyle, marginBottom: '12px' }}
                />
                <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredMoves.length === 0 ? (
                    <div style={{ color: '#6b7280', fontSize: '14px', padding: '20px 0', textAlign: 'center' }}>該当する技がありません</div>
                  ) : (
                    filteredMoves.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => addStep(m)}
                        style={{ textAlign: 'left', padding: '8px 10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(185, 28, 28, 0.25)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <div style={{ color: '#ffffff', fontSize: '13px', marginBottom: '2px' }}>{m.move_name}</div>
                        {m.command && <CommandIcons command={m.command} />}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
