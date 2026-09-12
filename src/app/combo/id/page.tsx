// src/app/combo/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { client } from '@/lib/client';
import { TextWithIcons } from '@/components/CommandDisplay';

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

interface TreeData {
  rootId: string;
  nodes: ComboNode[];
}

interface Combo {
  id: string;
  character_id: string;
  character_name?: string | null;
  title: string;
  description?: string | null;
  difficulty?: number | null;
  damage?: number | null;
  importance?: number | null;
  nodes: string;
  display_mode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ComboDetailPage() {
  const params = useParams();
  const comboId = params.id as string;
  
  const [combo, setCombo] = useState<Combo | null>(null);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [nodesMap, setNodesMap] = useState<Map<string, ComboNode>>(new Map());
  const [displayMode, setDisplayMode] = useState<'move_name' | 'command'>('move_name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCombo();
  }, [comboId]);

  const fetchCombo = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Combo.get(
        { id: comboId },
        { authMode: 'apiKey' }
      );

      if (data) {
        setCombo(data as Combo);
        
        // ツリーデータをパース
        const parsedTree: TreeData = JSON.parse(data.nodes);
        setTreeData(parsedTree);
        
        // ノードマップを作成
        const map = new Map<string, ComboNode>();
        parsedTree.nodes.forEach(node => {
          map.set(node.id, node);
        });
        setNodesMap(map);
        
        // 表示モードを設定
        if (data.display_mode) {
          setDisplayMode(data.display_mode as 'move_name' | 'command');
        }
      }
    } catch (error) {
      console.error('コンボ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTree = (nodeId: string, depth: number = 0): JSX.Element | null => {
    const node = nodesMap.get(nodeId);
    if (!node) return null;

    const displayText = displayMode === 'move_name' 
      ? (node.moveName || node.freeText || '未設定')
      : (node.command || node.freeText || '未設定');

    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? '40px' : '0' }}>
        <div
          style={{
            padding: '12px 16px',
            margin: '8px 0',
            backgroundColor: node.backgroundColor,
            border: '2px solid #6b7280',
            borderRadius: '8px',
            color: '#000000',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <TextWithIcons 
            text={displayText}
            size="sm"
            textClassName="font-semibold text-gray-900"
            showFallback={false}
            enableIconReplacement={true}
          />
          {node.type === 'move' && node.moveId && (
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              技ID: {node.moveId}
            </div>
          )}
        </div>

        {node.children.map(childId => renderTree(childId, depth + 1))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#ffffff', fontSize: '18px' }}>読み込み中...</div>
      </div>
    );
  }

  if (!combo || !treeData) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#ffffff', fontSize: '18px' }}>コンボが見つかりませんでした</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* ヘッダー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#ffffff',
            letterSpacing: '2px'
          }}>
            コンボ詳細
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/combo/list" style={{
              padding: '10px 20px',
              background: 'rgba(59, 130, 246, 0.3)',
              border: '2px solid rgba(59, 130, 246, 0.5)',
              borderRadius: '6px',
              color: '#60a5fa',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}>
              一覧に戻る
            </a>
            <a href="/" style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}>
              トップ
            </a>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
          {/* 左パネル - コンボ情報 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid rgba(185, 28, 28, 0.3)',
            borderRadius: '8px',
            padding: '20px'
          }}>
            {/* キャラクター */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '4px'
              }}>
                キャラクター
              </div>
              <div style={{
                fontSize: '16px',
                color: '#60a5fa',
                fontWeight: 'bold'
              }}>
                {combo.character_name || `ID: ${combo.character_id}`}
              </div>
            </div>

            {/* タイトル */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '4px'
              }}>
                タイトル
              </div>
              <div style={{
                fontSize: '20px',
                color: '#fca5a5',
                fontWeight: 'bold'
              }}>
                {combo.title}
              </div>
            </div>

            {/* 説明 */}
            {combo.description && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '12px',
                  color: '#9ca3af',
                  marginBottom: '4px'
                }}>
                  説明
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#d1d5db',
                  lineHeight: '1.6'
                }}>
                  {combo.description}
                </div>
              </div>
            )}

            <hr style={{ border: '1px solid rgba(185, 28, 28, 0.3)', margin: '20px 0' }} />

            {/* メタ情報 */}
            <div style={{ marginBottom: '20px' }}>
              {combo.difficulty && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>難易度</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          background: level <= combo.difficulty! ? '#ef4444' : 'rgba(107, 114, 128, 0.3)',
                          border: '1px solid rgba(185, 28, 28, 0.5)'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {combo.damage && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>ダメージ</span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#fbbf24'
                  }}>
                    {combo.damage}
                  </span>
                </div>
              )}

              {combo.importance && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>重要度</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {Array.from({ length: combo.importance }).map((_, i) => (
                      <span key={i} style={{ color: '#fbbf24', fontSize: '18px' }}>★</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <hr style={{ border: '1px solid rgba(185, 28, 28, 0.3)', margin: '20px 0' }} />

            {/* 表示モード切り替え */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '8px'
              }}>
                表示モード
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setDisplayMode('move_name')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: displayMode === 'move_name' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.4)',
                    border: `2px solid ${displayMode === 'move_name' ? '#3b82f6' : 'rgba(185, 28, 28, 0.3)'}`,
                    borderRadius: '4px',
                    color: displayMode === 'move_name' ? '#60a5fa' : '#9ca3af',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  技名
                </button>
                <button
                  onClick={() => setDisplayMode('command')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: displayMode === 'command' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.4)',
                    border: `2px solid ${displayMode === 'command' ? '#3b82f6' : 'rgba(185, 28, 28, 0.3)'}`,
                    borderRadius: '4px',
                    color: displayMode === 'command' ? '#60a5fa' : '#9ca3af',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  コマンド
                </button>
              </div>
            </div>

            {/* 日付情報 */}
            <div>
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                作成日: {new Date(combo.createdAt).toLocaleString('ja-JP')}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6b7280'
              }}>
                更新日: {new Date(combo.updatedAt).toLocaleString('ja-JP')}
              </div>
            </div>
          </div>

          {/* 右パネル - ツリー表示 */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid rgba(185, 28, 28, 0.3)',
            borderRadius: '8px',
            padding: '20px',
            maxHeight: 'calc(100vh - 140px)',
            overflowY: 'auto'
          }}>
            <h3 style={{
              color: '#fca5a5',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '20px'
            }}>
              コンボツリー
            </h3>

            <div>
              {renderTree(treeData.rootId)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
