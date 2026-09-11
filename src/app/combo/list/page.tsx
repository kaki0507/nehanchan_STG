'use client';

import React, { useState, useEffect } from 'react';
import { client } from '@/lib/client';
import { TextWithIcons } from '@/components/CommandDisplay';
import Link from 'next/link';

interface Character {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
}

interface Combo {
  id: string;
  character_id: string;
  character_name?: string;
  combo_name?: string;
  title?: string;
  damage?: number;
  difficulty?: number;
  notes?: string;
  description?: string;
  category?: string;
  importance?: number;
  nodes?: string;
  display_mode?: 'move_name' | 'command';
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

interface ComboNode {
  id: string;
  type: 'move' | 'freetext';
  moveId?: string;
  moveName?: string;
  command?: string;
  freeText?: string;
  backgroundColor: string;
  children: string[];
}

// 背景色定義
const BACKGROUND_COLORS = {
  blue: '#60a5fa',
  orange: '#ff9500',
  red: '#ff8787',
  green: '#69db7c',
  yellow: '#ffd700',
  gray: '#4b5563',
  purple: '#cc9dff',
  cyan: '#66d9e8',
};

const hexToRgba = (hex: string, alpha: number = 0.5): { bg: string; border: string } => {
  const rgbMatch = hex.match(/^#([A-Fa-f0-9]{6})$/);
  if (rgbMatch) {
    const hexValue = rgbMatch[1];
    const r = parseInt(hexValue.substr(0, 2), 16);
    const g = parseInt(hexValue.substr(2, 2), 16);
    const b = parseInt(hexValue.substr(4, 2), 16);
    return {
      bg: `rgba(${r}, ${g}, ${b}, ${alpha})`,
      border: `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`
    };
  }
  return { bg: 'rgba(96, 165, 250, 0.5)', border: 'rgba(96, 165, 250, 0.4)' };
};

// カテゴリラベル変換
const CATEGORY_LABELS: { [key: string]: string } = {
  normal: '通常コンボ',
  carry: '運び重視コンボ',
  okizeme: '起き攻め重視コンボ',
  damage: '火力重視コンボ',
  counter: 'カウンターヒットコンボ',
  stage: 'ステージギミックコンボ',
  basic: '基本コンボ',
  advanced: '高難度コンボ',
  setup: 'セットアップ',
  wakeup: '起き攻め',
};

export default function ComboListPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [characters, setCharacters] = useState<{ [key: string]: Character }>({});
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'damage' | 'difficulty'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // モーダル
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const charactersResponse = await client.models.Character.list({ authMode: 'apiKey' });
      const charactersList = (charactersResponse.data || []).filter(c => c !== null) as Character[];
      const charactersMap: { [key: string]: Character } = {};
      charactersList.forEach((char: Character) => {
        charactersMap[char.character_id] = char;
      });
      setCharacters(charactersMap);

      const combosResponse = await client.models.Combo.list({ authMode: 'apiKey' });
      const combosList = (combosResponse.data || []).filter(c => c !== null) as Combo[];
      setCombos(combosList);
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  // ツリーをノードリストに平坦化
  const flattenTreeNodes = (treeData: any): { nodeId: string; node: any }[] => {
    const result: { nodeId: string; node: any }[] = [];
    const flatten = (nodeId: string) => {
      const node = treeData.nodes[nodeId];
      if (!node) return;
      result.push({ nodeId, node });
      if (node.children && node.children.length > 0) {
        node.children.forEach((childId: string) => flatten(childId));
      }
    };
    (treeData.rootIds || []).forEach((rootId: string) => flatten(rootId));
    return result;
  };

  // コンボプレビュー（一覧用・短縮）
  const renderComboPreview = (combo: Combo) => {
    try {
      if (!combo.nodes) return <span style={{ color: '#6b7280', fontSize: '12px' }}>ノードなし</span>;
      const treeData = JSON.parse(combo.nodes);
      const displayMode = combo.display_mode || 'move_name';
      const allNodes = flattenTreeNodes(treeData);

      return (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: '2px', overflow: 'hidden' }}>
          {allNodes.slice(0, 5).map(({ nodeId, node }, index) => {
            const text = displayMode === 'move_name'
              ? (node.moveName || node.freeText || '未設定')
              : (node.command || node.freeText || '未設定');
            const colors = hexToRgba(node.backgroundColor || BACKGROUND_COLORS.blue, 0.5);
            return (
              <React.Fragment key={nodeId}>
                {index > 0 && <span style={{ color: '#6b7280', fontSize: '12px', flexShrink: 0 }}>＜</span>}
                <span style={{
                  padding: '2px 6px',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#ffffff',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-block'
                }}>
                  <TextWithIcons text={text} size="sm" showFallback={false} enableIconReplacement={true} />
                </span>
              </React.Fragment>
            );
          })}
          {allNodes.length > 5 && (
            <span style={{ color: '#9ca3af', fontSize: '11px', flexShrink: 0, marginLeft: '4px' }}>
              +{allNodes.length - 5}
            </span>
          )}
        </div>
      );
    } catch {
      return <span style={{ color: '#ef4444', fontSize: '12px' }}>エラー</span>;
    }
  };

  // モーダル内のツリー表示
  const renderModalTree = (combo: Combo) => {
    try {
      if (!combo.nodes) return <span style={{ color: '#6b7280' }}>ノードなし</span>;
      const treeData = JSON.parse(combo.nodes);
      const displayMode = combo.display_mode || 'move_name';

      const renderNode = (nodeId: string, depth: number = 0): React.ReactElement | null => {
        const node = treeData.nodes[nodeId];
        if (!node) return null;
        const text = displayMode === 'move_name'
          ? (node.moveName || node.freeText || '未設定')
          : (node.command || node.freeText || '未設定');
        const colors = hexToRgba(node.backgroundColor || BACKGROUND_COLORS.blue, 0.5);

        if (node.children && node.children.length === 1) {
          return (
            <div key={nodeId} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: depth === 0 ? '12px' : '0' }}>
              <span style={{ padding: '6px 12px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '20px', color: '#ffffff', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>
                <TextWithIcons text={text} size="sm" textClassName="font-semibold text-white" showFallback={false} enableIconReplacement={true} />
              </span>
              <span style={{ color: '#6b7280', fontSize: '18px' }}>＜</span>
              {renderNode(node.children[0], depth + 1)}
            </div>
          );
        }

        if (node.children && node.children.length > 1) {
          return (
            <div key={nodeId} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: depth === 0 ? '12px' : '0' }}>
              <span style={{ padding: '6px 12px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '20px', color: '#ffffff', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>
                <TextWithIcons text={text} size="sm" textClassName="font-semibold text-white" showFallback={false} enableIconReplacement={true} />
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {node.children.map((childId: string) => (
                  <div key={childId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#6b7280', fontSize: '18px' }}>＜</span>
                    {renderNode(childId, depth + 1)}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={nodeId} style={{ marginBottom: depth === 0 ? '12px' : '0' }}>
            <span style={{ padding: '6px 12px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '20px', color: '#ffffff', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>
              <TextWithIcons text={text} size="sm" textClassName="font-semibold text-white" showFallback={false} enableIconReplacement={true} />
            </span>
          </div>
        );
      };

      return (
        <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
          {(treeData.rootIds || []).map((rootId: string) => renderNode(rootId, 0))}
        </div>
      );
    } catch {
      return <span style={{ color: '#ef4444' }}>表示エラー</span>;
    }
  };

  const getDifficultyLabel = (difficulty?: number) => {
    if (!difficulty) return '未設定';
    if (difficulty <= 2) return '簡単';
    if (difficulty <= 4) return '普通';
    return '難しい';
  };

  const getDifficultyColor = (difficulty?: number) => {
    if (!difficulty) return '#6b7280';
    if (difficulty <= 2) return '#10b981';
    if (difficulty <= 4) return '#f59e0b';
    return '#ef4444';
  };

  const getDisplayName = (char: Character) => {
    return char.display_name || char.character_name_jp || char.character_name_en;
  };

  const getCharacterName = (characterId: string) => {
    const char = characters[characterId];
    return char ? getDisplayName(char) : '不明';
  };

  const getComboTitle = (combo: Combo) => {
    return combo.title || combo.combo_name || '無題のコンボ';
  };

  const getComboDate = (combo: Combo) => {
    const dateStr = combo.createdAt || combo.created_at;
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('ja-JP');
  };

  const handleDelete = async (comboId: string) => {
    if (!confirm('このコンボを削除してもよろしいですか?')) return;
    try {
      await client.models.Combo.delete({ id: comboId }, { authMode: 'apiKey' });
      setCombos(combos.filter(combo => combo.id !== comboId));
      setShowModal(false);
      setSelectedCombo(null);
    } catch (error) {
      console.error('コンボの削除に失敗しました:', error);
      alert('コンボの削除に失敗しました');
    }
  };

  const filteredAndSortedCombos = combos
    .filter(combo => {
      if (selectedCharacter === 'all') return true;
      return String(combo.character_id) === String(selectedCharacter);
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'created_at') {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'damage') {
        comparison = (a.damage || 0) - (b.damage || 0);
      } else if (sortBy === 'difficulty') {
        comparison = (a.difficulty || 0) - (b.difficulty || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#fca5a5', fontSize: '18px', fontWeight: 'bold' }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-5px', left: '-30px', right: '-30px', bottom: '-5px', background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '3px', borderRadius: '2px', boxShadow: '0 5px 15px rgba(0,0,0,0.7)' }}>
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(127,29,29,0.15))', borderRadius: '1px' }} />
            </div>
            <h1 style={{ position: 'relative', fontSize: '32px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '4px', textTransform: 'uppercase', textShadow: '2px 2px 4px rgba(0,0,0,0.9)', padding: '10px 40px', margin: 0 }}>
              コンボ一覧
            </h1>
          </div>
        </div>

        {/* フィルター */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {[
              { label: 'キャラクター:', value: selectedCharacter, onChange: setSelectedCharacter, options: [{ value: 'all', label: 'すべて' }, ...Object.values(characters).map(c => ({ value: c.character_id, label: getDisplayName(c) }))] },
              { label: '並び替え:', value: sortBy, onChange: (v: any) => setSortBy(v), options: [{ value: 'created_at', label: '作成日時' }, { value: 'damage', label: 'ダメージ' }, { value: 'difficulty', label: '難易度' }] },
              { label: '順序:', value: sortOrder, onChange: (v: any) => setSortOrder(v), options: [{ value: 'desc', label: '降順' }, { value: 'asc', label: '昇順' }] },
            ].map(({ label, value, onChange, options }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', color: '#fca5a5', fontWeight: '600', whiteSpace: 'nowrap' }}>{label}</label>
                <select value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '8px 12px', fontSize: '13px', background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(185,28,28,0.4)', borderRadius: '6px', color: '#ffffff', cursor: 'pointer', outline: 'none', minWidth: '150px' }}>
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', color: '#9ca3af' }}>
              {filteredAndSortedCombos.length > 0 && <>全{filteredAndSortedCombos.length}件</>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/combo/create" style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '6px', color: '#ffffff', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                ＋ 新規作成
              </Link>
              <a href="/" style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 'bold', background: 'rgba(107,114,128,0.3)', border: '2px solid rgba(107,114,128,0.5)', borderRadius: '6px', color: '#ffffff', textDecoration: 'none', display: 'inline-block' }}>
                トップへ
              </a>
            </div>
          </div>
        </div>

        {/* コンボリスト */}
        {filteredAndSortedCombos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '3px', borderRadius: '8px' }}>
                <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', borderRadius: '6px' }} />
              </div>
              <div style={{ position: 'relative', padding: '40px 60px', color: '#9ca3af', fontSize: '16px' }}>
                コンボが見つかりませんでした
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredAndSortedCombos.map(combo => (
              <div
                key={combo.id}
                onClick={() => { setSelectedCombo(combo); setShowModal(true); }}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                {/* 赤いボーダー */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, #dc2626, #991b1b)', padding: '1px', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', transition: 'all 0.2s' }}>
                  <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', borderRadius: '3px' }} />
                </div>

                {/* コンテンツ */}
                <div style={{ position: 'relative', padding: '14px 10px', display: 'flex', gap: '10px', alignItems: 'center' }}
                  onMouseEnter={(e) => { (e.currentTarget.previousElementSibling as HTMLElement).style.background = 'linear-gradient(135deg, #ef4444, #dc2626)'; }}
                  onMouseLeave={(e) => { (e.currentTarget.previousElementSibling as HTMLElement).style.background = 'linear-gradient(135deg, #dc2626, #991b1b)'; }}
                >
                  {/* キャラクター画像 */}
                  <div style={{ width: '50px', minWidth: '50px', height: '50px', flexShrink: 0, border: '1px solid rgba(185,28,28,0.4)', borderRadius: '3px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={`/character-faces/${combo.character_id}.png`}
                      alt={getCharacterName(combo.character_id)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center bottom' }}
                      onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        if (!t.dataset.fallback) { t.dataset.fallback = 'true'; t.src = `/character-faces-mobile/${combo.character_id}.png`; }
                        else { t.style.display = 'none'; }
                      }}
                    />
                  </div>

                  {/* キャラクター名 */}
                  <div style={{ width: '100px', minWidth: '100px', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getCharacterName(combo.character_id)}
                    </div>
                    {combo.damage && <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>{combo.damage}ダメージ</div>}
                  </div>

                  {/* 難易度・重要度 */}
                  <div style={{ width: '100px', minWidth: '100px', flexShrink: 0 }}>
                    {combo.difficulty && (
                      <div style={{ fontSize: '11px', color: getDifficultyColor(combo.difficulty), fontWeight: '600' }}>
                        難易度: {getDifficultyLabel(combo.difficulty)}
                      </div>
                    )}
                    {combo.importance && (
                      <div style={{ display: 'flex', gap: '1px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s} style={{ fontSize: '11px', color: s <= combo.importance! ? '#fbbf24' : '#4b5563' }}>★</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* タイトル */}
                  <div style={{ width: '200px', minWidth: '200px', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fef2f2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getComboTitle(combo)}
                    </div>
                    {combo.category && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                        {CATEGORY_LABELS[combo.category] || combo.category}
                      </div>
                    )}
                  </div>

                  {/* コンボプレビュー（短縮） */}
                  <div style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
                    {renderComboPreview(combo)}
                  </div>

                  {/* クリックヒント */}
                  <div style={{ flexShrink: 0, fontSize: '11px', color: '#60a5fa' }}>
                    タップで詳細 ▶
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* モーダル */}
      {showModal && selectedCombo && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setSelectedCombo(null); } }}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
        >
          <div style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.97), rgba(127,29,29,0.2))', border: '2px solid rgba(185,28,28,0.5)', borderRadius: '12px', padding: '28px', maxWidth: '700px', width: '100%', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.8)', position: 'relative' }}>

            {/* モーダルヘッダー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid rgba(185,28,28,0.3)', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '600', marginBottom: '4px' }}>
                  {getCharacterName(selectedCombo.character_id)}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fef2f2' }}>
                  {getComboTitle(selectedCombo)}
                </div>
                {selectedCombo.category && (
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    {CATEGORY_LABELS[selectedCombo.category] || selectedCombo.category}
                  </div>
                )}
              </div>
              <button
                onClick={() => { setShowModal(false); setSelectedCombo(null); }}
                style={{ background: 'rgba(185,28,28,0.3)', border: '1px solid rgba(185,28,28,0.5)', borderRadius: '50%', width: '32px', height: '32px', color: '#fca5a5', cursor: 'pointer', fontSize: '18px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>

            {/* メタ情報 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {selectedCombo.damage && (
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(185,28,28,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>ダメージ</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>{selectedCombo.damage}</div>
                </div>
              )}
              {selectedCombo.difficulty && (
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(185,28,28,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>難易度</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: getDifficultyColor(selectedCombo.difficulty) }}>
                    {getDifficultyLabel(selectedCombo.difficulty)}
                    <span style={{ fontSize: '11px', marginLeft: '4px', color: '#9ca3af' }}>({selectedCombo.difficulty}/5)</span>
                  </div>
                </div>
              )}
              {selectedCombo.importance && (
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(185,28,28,0.2)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>重要度</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '16px', color: s <= selectedCombo.importance! ? '#fbbf24' : '#4b5563' }}>★</span>)}
                  </div>
                </div>
              )}
            </div>

            {/* 説明 */}
            {selectedCombo.description && (
              <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(185,28,28,0.2)' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>説明</div>
                <div style={{ fontSize: '14px', color: '#e5e7eb', lineHeight: '1.6' }}>{selectedCombo.description}</div>
              </div>
            )}

            {/* コンボツリー */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#fca5a5', fontWeight: 'bold', marginBottom: '12px' }}>コンボツリー</div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '6px', border: '1px solid rgba(185,28,28,0.2)' }}>
                {renderModalTree(selectedCombo)}
              </div>
            </div>

            {/* 作成日 */}
            {getComboDate(selectedCombo) && (
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '20px' }}>
                作成: {getComboDate(selectedCombo)}
              </div>
            )}

            {/* ボタン */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link
                href={`/combo/edit/${selectedCombo.id}`}
                style={{ padding: '10px 28px', background: 'rgba(59,130,246,0.3)', border: '2px solid rgba(59,130,246,0.5)', borderRadius: '6px', color: '#60a5fa', fontWeight: 'bold', fontSize: '14px', textDecoration: 'none', display: 'inline-block' }}
              >
                編集
              </Link>
              <button
                onClick={() => handleDelete(selectedCombo.id)}
                style={{ padding: '10px 28px', background: 'rgba(239,68,68,0.3)', border: '2px solid rgba(239,68,68,0.5)', borderRadius: '6px', color: '#fca5a5', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                削除
              </button>
              <button
                onClick={() => { setShowModal(false); setSelectedCombo(null); }}
                style={{ padding: '10px 28px', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '6px', color: '#ffffff', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
