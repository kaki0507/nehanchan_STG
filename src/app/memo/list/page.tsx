'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';
import { signOut } from 'aws-amplify/auth';

interface Character {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
}

interface Memo {
  id: string;
  character_id: string;
  character_name?: string | null;
  display_name?: string | null;
  character_name_jp?: string | null;
  character_name_en?: string | null;
  categories?: (string | null)[] | null;
  title: string;
  content?: string | null;
  importance?: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function MemoListPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy1, setSortBy1] = useState<'createdAt' | 'importance' | 'category' | 'none'>('createdAt');
  const [sortBy2, setSortBy2] = useState<'createdAt' | 'importance' | 'category' | 'none'>('none');
  const [sortBy3, setSortBy3] = useState<'createdAt' | 'importance' | 'category' | 'none'>('none');
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [showSortSettings, setShowSortSettings] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // デスクトップの場合は初回メニューを開く
      if (!mobile) {
        setMenuOpen(true);
      } else {
        setMenuOpen(false);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    fetchMemos();
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    let filtered = [...memos];
    
    // キャラクターでフィルター
    if (selectedCharacter !== 'all') {
      filtered = filtered.filter(memo => memo.character_id === selectedCharacter);
    }
    
    // 分類でフィルター
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => 
        memo.categories && memo.categories.includes(selectedCategory)
      );
    }
    
    console.log('ソート設定:', { sortBy1, sortBy2, sortBy3 });
    
    // ソート関数
    const compareByType = (a: Memo, b: Memo, sortType: 'createdAt' | 'importance' | 'category' | 'none'): number => {
      if (sortType === 'none') return 0;
      
      if (sortType === 'importance') {
        const result = (b.importance || 0) - (a.importance || 0);
        return result;
      } else if (sortType === 'category') {
        // 分類順でソート
        const aCategoryFirst = a.categories && a.categories.length > 0 ? a.categories[0] : null;
        const bCategoryFirst = b.categories && b.categories.length > 0 ? b.categories[0] : null;
        
        if (!aCategoryFirst && !bCategoryFirst) return 0;
        if (!aCategoryFirst) return 1;
        if (!bCategoryFirst) return -1;
        
        const aIndex = categoryOrder.indexOf(aCategoryFirst);
        const bIndex = categoryOrder.indexOf(bCategoryFirst);
        
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      } else {
        // 作成日時順
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    };
    
    // 複数条件でソート
    filtered.sort((a, b) => {
      // 第1ソート条件
      const result1 = compareByType(a, b, sortBy1);
      if (result1 !== 0) return result1;
      
      // 第2ソート条件
      const result2 = compareByType(a, b, sortBy2);
      if (result2 !== 0) return result2;
      
      // 第3ソート条件
      return compareByType(a, b, sortBy3);
    });
    
    console.log('ソート後のメモ数:', filtered.length);
    
    setFilteredMemos(filtered);
  }, [selectedCharacter, selectedCategory, sortBy1, sortBy2, sortBy3, memos, categoryOrder]);

  const fetchMemos = async () => {
    setLoading(true);
    try {
      // メモを取得
      const { data: memoData } = await client.models.Memo.list({ authMode: 'userPool' });
      const validMemos = (memoData || []).filter(m => m !== null) as Memo[];
      
      // キャラクター情報を取得
      const { data: characterData } = await client.models.Character.list({ authMode: 'apiKey' });
      const characters = (characterData || []).filter(c => c !== null) as Character[];
      
      // 分類の順番を取得
      const { data: categoryData } = await client.models.CategorySettings.list({ authMode: 'userPool' });
      if (categoryData && categoryData.length > 0 && categoryData[0]) {
        const validCategories = (categoryData[0].categories || []).filter((c): c is string => c !== null);
        setCategoryOrder(validCategories);
      }
      
      // メモにキャラクター情報をマージ
      const memosWithCharacterInfo = validMemos.map(memo => {
        const character = characters.find(c => c.character_id === memo.character_id);
        return {
          ...memo,
          display_name: character?.display_name || null,
          character_name_jp: character?.character_name_jp || null,
          character_name_en: character?.character_name_en || null
        };
      });
      
      const sorted = memosWithCharacterInfo.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMemos(sorted);
      setFilteredMemos(sorted);
      console.log('メモ取得成功:', sorted.length, '件');
    } catch (error) {
      console.error('メモ取得エラー:', error);
      alert('メモの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memoId: string) => {
    if (!confirm('このメモを削除しますか？')) return;

    try {
      const result = await client.models.Memo.delete({ 
        id: memoId 
      }, {
        authMode: 'userPool'
      });
      
      console.log('削除結果:', result);
      
      if (result.data || !result.errors) {
        alert('メモを削除しました');
        fetchMemos();
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      if (error instanceof Error) {
        alert(`削除に失敗しました: ${error.message}`);
      } else {
        alert('削除に失敗しました');
      }
    }
  };

  const handleLogout = async () => {
    if (!confirm('ログアウトしますか？')) return;
    
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました');
    }
  };

  const renderStars = (importance: number | null | undefined) => {
    const stars = importance || 0;
    return (
      <div style={{ display: 'flex', gap: '1px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            style={{
              fontSize: '12px',
              color: star <= stars ? '#fbbf24' : '#4b5563'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const uniqueCharacters = Array.from(
    new Set(memos.map(memo => memo.character_id))
  );

  const uniqueCategories = Array.from(
    new Set(
      memos.flatMap(memo => memo.categories || []).filter(c => c !== null)
    )
  ) as string[];

  return (
    <>
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
    <div style={{
      minHeight: '100vh',
      background: `
        linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),
        url('/backgrounds/background.jpg')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: menuOpen ? '320px' : '20px',
          zIndex: 1100,
          width: '50px',
          height: '50px',
          background: 'linear-gradient(135deg, #dc2626, #991b1b)',
          border: '2px solid rgba(185, 28, 28, 0.5)',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
          transition: 'all 0.3s ease-in-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
        }}
      >
        <div style={{ width: '30px', height: '3px', background: '#ffffff', borderRadius: '2px' }} />
        <div style={{ width: '30px', height: '3px', background: '#ffffff', borderRadius: '2px' }} />
        <div style={{ width: '30px', height: '3px', background: '#ffffff', borderRadius: '2px' }} />
      </button>

      {/* サイドメニュー */}
      {isMobile && menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}
      
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: menuOpen ? 0 : '-300px',
          width: '300px',
          height: '100vh',
          background: 'linear-gradient(to bottom, #000000, #1a0505, #000000)',
          boxShadow: menuOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
          zIndex: 1000,
          transition: 'left 0.3s ease-in-out',
          overflowY: 'auto'
        }}
      >
        {/* メニューヘッダー */}
        <div style={{
          padding: '20px',
          borderBottom: '2px solid rgba(185, 28, 28, 0.3)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#fef2f2',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            MENU
          </h2>
        </div>

        {/* メニュー項目 */}
        <nav style={{ padding: '20px 0' }}>
          {[
            { label: 'TOP', href: '/', isLink: true },
            { label: '対策メモ', href: '/memo/list', isLink: true },
            { label: 'コンボ', href: '#', isLink: false }
          ].map((item, index) => (
            item.isLink ? (
              <a
                key={index}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px 30px',
                  color: '#e5e7eb',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderLeft: '4px solid transparent',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(185, 28, 28, 0.2)';
                  e.currentTarget.style.borderLeftColor = '#dc2626';
                  e.currentTarget.style.color = '#fef2f2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.color = '#e5e7eb';
                }}
              >
                <span style={{ letterSpacing: '1px' }}>{item.label}</span>
              </a>
            ) : (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px 30px',
                  color: '#6b7280',
                  fontSize: '16px',
                  fontWeight: '600',
                  borderLeft: '4px solid transparent',
                  cursor: 'default'
                }}
              >
                <span style={{ letterSpacing: '1px' }}>{item.label}</span>
              </div>
            )
          ))}
        </nav>

        {/* ログアウトボタン */}
        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '15px 30px',
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              fontSize: '16px',
              fontWeight: '600',
              textAlign: 'left',
              cursor: 'pointer',
              borderLeft: '4px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(107, 114, 128, 0.2)';
              e.currentTarget.style.borderLeftColor = '#6b7280';
              e.currentTarget.style.color = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderLeftColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            <span style={{ letterSpacing: '1px' }}>ログアウト</span>
          </button>
        </div>

        {/* メニューフッター */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px',
          borderTop: '2px solid rgba(185, 28, 28, 0.3)',
          background: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            TEKKEN 8 Database
          </div>
        </div>
      </div>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23991b1b' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: isMobile ? '20px' : '40px 20px',
        marginLeft: isMobile ? 'auto' : (menuOpen ? '300px' : 'auto'),
        marginRight: 'auto',
        transition: 'margin-left 0.3s ease',
        width: isMobile ? '100%' : (menuOpen ? 'calc(100% - 300px)' : '100%')
      }}>
        {/* ヘッダー */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            display: 'inline-block',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-5px',
              left: '-30px',
              right: '-30px',
              bottom: '-5px',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              padding: '3px',
              borderRadius: '2px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.7)'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(127, 29, 29, 0.15))',
                borderRadius: '1px'
              }} />
            </div>
            
            <h1 style={{
              position: 'relative',
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: 'bold',
              color: '#ffffff',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
              padding: '10px 40px'
            }}>
              メモ一覧
            </h1>
          </div>
        </div>

        {/* フィルター＆ソート設定 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {/* ボタン行 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowFilterSettings(!showFilterSettings)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  background: showFilterSettings 
                    ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                    : 'rgba(185, 28, 28, 0.3)',
                  border: '2px solid rgba(185, 28, 28, 0.5)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{showFilterSettings ? '▼' : '▶'}</span>
                <span>絞り込み設定</span>
              </button>

              <button
                onClick={() => setShowSortSettings(!showSortSettings)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  background: showSortSettings
                    ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                    : 'rgba(185, 28, 28, 0.3)',
                  border: '2px solid rgba(185, 28, 28, 0.5)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{showSortSettings ? '▼' : '▶'}</span>
                <span>並び替え設定</span>
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href="/memo"
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                ＋ 新規作成
              </a>
            </div>
          </div>

          {/* 絞り込み設定 */}
          {showFilterSettings && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              border: '2px solid rgba(185, 28, 28, 0.6)',
              borderRadius: '8px',
              padding: '15px',
              animation: 'slideDown 0.2s ease-out'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#fca5a5',
                marginBottom: '12px'
              }}>
                絞り込み条件
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '2px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '180px'
                  }}
                >
                  <option value="all">全キャラクター</option>
                  {uniqueCharacters.map(charId => {
                    const memo = memos.find(m => m.character_id === charId);
                    const displayName = memo?.display_name || memo?.character_name_jp || charId;
                    return (
                      <option key={charId} value={charId}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '2px solid rgba(185, 28, 28, 0.4)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '150px'
                  }}
                >
                  <option value="all">全分類</option>
                  {uniqueCategories.map(category => {
                    return (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          {/* 並び替え設定 */}
          {showSortSettings && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.7)',
            border: '2px solid rgba(185, 28, 28, 0.6)',
            borderRadius: '8px',
            padding: '15px',
            animation: 'slideDown 0.2s ease-out'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%'
            }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#fca5a5',
                  marginBottom: '4px'
                }}>
                  並び順設定（優先度順）
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#9ca3af'
                }}>
                  ※第1優先から順に適用されます。例: 第1「重要度順」→第2「分類順」の場合、重要度で並べた後、同じ重要度内を分類順に並べます
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '240px',
                  background: 'rgba(185, 28, 28, 0.2)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid rgba(185, 28, 28, 0.4)'
                }}>
                  <span style={{
                    fontSize: '13px',
                    color: '#fef2f2',
                    fontWeight: 'bold',
                    minWidth: '60px'
                  }}>
                    第1優先:
                  </span>
                  <select
                    value={sortBy1}
                    onChange={(e) => setSortBy1(e.target.value as 'createdAt' | 'importance' | 'category' | 'none')}
                    style={{
                      padding: '6px 10px',
                      fontSize: '13px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid rgba(185, 28, 28, 0.5)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                      flex: 1
                    }}
                  >
                    <option value="createdAt">作成日時順</option>
                    <option value="importance">重要度順</option>
                    <option value="category">分類順</option>
                    <option value="none">なし</option>
                  </select>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '240px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid rgba(185, 28, 28, 0.3)'
                }}>
                  <span style={{
                    fontSize: '13px',
                    color: '#e5e7eb',
                    fontWeight: 'bold',
                    minWidth: '60px'
                  }}>
                    第2優先:
                  </span>
                  <select
                    value={sortBy2}
                    onChange={(e) => setSortBy2(e.target.value as 'createdAt' | 'importance' | 'category' | 'none')}
                    style={{
                      padding: '6px 10px',
                      fontSize: '13px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid rgba(185, 28, 28, 0.4)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                      flex: 1
                    }}
                  >
                    <option value="none">なし</option>
                    <option value="createdAt">作成日時順</option>
                    <option value="importance">重要度順</option>
                    <option value="category">分類順</option>
                  </select>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '240px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '2px solid rgba(185, 28, 28, 0.3)'
                }}>
                  <span style={{
                    fontSize: '13px',
                    color: '#e5e7eb',
                    fontWeight: 'bold',
                    minWidth: '60px'
                  }}>
                    第3優先:
                  </span>
                  <select
                    value={sortBy3}
                    onChange={(e) => setSortBy3(e.target.value as 'createdAt' | 'importance' | 'category' | 'none')}
                    style={{
                      padding: '6px 10px',
                      fontSize: '13px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid rgba(185, 28, 28, 0.4)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                      flex: 1
                    }}
                  >
                    <option value="none">なし</option>
                    <option value="createdAt">作成日時順</option>
                    <option value="importance">重要度順</option>
                    <option value="category">分類順</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

          {/* メモリスト */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '100px 20px',
            color: '#fca5a5',
            fontSize: '18px'
          }}>
            読み込み中...
          </div>
        ) : filteredMemos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '100px 20px'
          }}>
            <div style={{
              position: 'relative',
              display: 'inline-block'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                padding: '3px',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0, 0, 0, 0.85)',
                  borderRadius: '6px'
                }} />
              </div>
              <div style={{
                position: 'relative',
                padding: '40px 60px',
                color: '#9ca3af',
                fontSize: '16px'
              }}>
                {memos.length === 0 ? 'メモがありません' : '条件に一致するメモがありません'}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* フィルター結果表示 */}
            <div style={{
              textAlign: 'right',
              marginBottom: '10px',
              padding: '0 10px',
              fontSize: '14px',
              color: '#9ca3af'
            }}>
              {filteredMemos.length} 件のメモを表示中 {memos.length !== filteredMemos.length && `(全 ${memos.length} 件)`}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxWidth: '1600px',
              margin: '0 auto',
              width: '100%'
            }}>
            {filteredMemos.map(memo => (
              <div
                key={memo.id}
                style={{
                  position: 'relative',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSelectedMemo(memo);
                  setShowDetail(true);
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  padding: '2px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.85)',
                    borderRadius: '4px'
                  }} />
                </div>

                <div style={{
                  position: 'relative',
                  padding: isMobile ? '6px 8px' : '8px 12px',
                  display: 'flex',
                  gap: isMobile ? '6px' : '12px',
                  alignItems: 'center'
                }}>
                  {/* 最左：キャラクター画像 */}
                  <div style={{
                    width: isMobile ? '40px' : '50px',
                    height: isMobile ? '40px' : '50px',
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                    border: '1px solid rgba(185, 28, 28, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img
                      src={`/character-faces/${memo.character_id}.png`}
                      alt={memo.display_name || memo.character_name_jp || memo.character_id}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        imageRendering: 'crisp-edges'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.fallbackAttempted) {
                          target.dataset.fallbackAttempted = 'true';
                          target.src = `/character-faces-mobile/${memo.character_id}.png`;
                        } else {
                          target.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.style.width = '100%';
                          placeholder.style.height = '100%';
                          placeholder.style.display = 'flex';
                          placeholder.style.alignItems = 'center';
                          placeholder.style.justifyContent = 'center';
                          placeholder.style.fontSize = isMobile ? '16px' : '20px';
                          placeholder.textContent = '🥊';
                          target.parentNode?.appendChild(placeholder);
                        }
                      }}
                    />
                  </div>

                  {/* キャラクター名 */}
                  <div style={{
                    width: isMobile ? '60px' : '100px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      fontSize: isMobile ? '11px' : '12px',
                      color: '#60a5fa',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {memo.display_name || memo.character_name_jp || memo.character_id}
                    </div>
                  </div>

                  {/* 分類タグ（縦並び） */}
                  <div style={{
                    width: isMobile ? '80px' : '100px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {memo.categories && memo.categories.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}>
                        {memo.categories.filter(c => c !== null).map((category, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              background: 'rgba(185, 28, 28, 0.3)',
                              border: '1px solid rgba(248, 113, 113, 0.5)',
                              borderRadius: '3px',
                              color: '#fca5a5',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'block',
                              width: isMobile ? '80px' : '100px',
                              maxWidth: isMobile ? '80px' : '100px',
                              minWidth: isMobile ? '80px' : '100px'
                            }}
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* タイトルと補足（縦並び） */}
                  <div style={{ 
                    flex: 1,
                    minWidth: 0,
                    marginLeft: isMobile ? '8px' : '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    justifyContent: memo.content ? 'flex-start' : 'center'
                  }}>
                    {/* タイトル */}
                    <h3 style={{
                      fontSize: isMobile ? '13px' : '15px',
                      fontWeight: 'bold',
                      color: '#fef2f2',
                      margin: 0,
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {memo.title}
                    </h3>

                    {/* 補足 */}
                    {memo.content && (
                      <div style={{
                        fontSize: isMobile ? '10px' : '12px',
                        color: '#9ca3af',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {memo.content}
                      </div>
                    )}
                  </div>

                  {/* 右端：重要度 */}
                  <div style={{
                    width: isMobile ? '80px' : '120px',
                    flexShrink: 0,
                    marginLeft: 'auto',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                  }}>
                    {renderStars(memo.importance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}

      </div>

      {/* スペーサー（フッターを最下部に配置） */}
      <div style={{ flex: 1 }} />

      {/* フッター */}
      <footer style={{
        backgroundColor: '#000000',
        color: '#ffffff',
        padding: 0,
        margin: 0,
        width: isMobile ? '100%' : (menuOpen ? 'calc(100% - 300px)' : '100%'),
        marginLeft: isMobile ? '0' : (menuOpen ? '300px' : '0'),
        transition: 'margin-left 0.3s ease, width 0.3s ease'
      }}>
        <div style={{
          maxWidth: '100%',
          margin: 0,
          padding: '24px 0',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            margin: 0
          }}>
            TEKKEN™8 & ©Bandai Namco Entertainment Inc.
          </p>
        </div>
      </footer>

      {/* 詳細モーダル */}
      {showDetail && selectedMemo && (() => {
        const memo = selectedMemo;
        return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetail(false);
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              padding: '3px',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.95)',
                borderRadius: '10px'
              }} />
            </div>

            <div style={{
              position: 'relative',
              padding: '30px'
            }}>
              <button
                onClick={() => setShowDetail(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(185, 28, 28, 0.3)',
                  border: '1px solid rgba(185, 28, 28, 0.5)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>

              <div style={{
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '16px',
                  color: '#60a5fa',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  {memo.display_name || memo.character_name_jp || memo.character_id}
                </div>
                {renderStars(memo.importance)}
              </div>

              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fef2f2',
                marginBottom: '20px',
                lineHeight: '1.4'
              }}>
                {memo.title}
              </h2>

              {memo.categories && memo.categories.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  {memo.categories.filter(c => c !== null).map((category, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '13px',
                        padding: '6px 12px',
                        background: 'rgba(185, 28, 28, 0.3)',
                        border: '1px solid rgba(248, 113, 113, 0.5)',
                        borderRadius: '6px',
                        color: '#fca5a5',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '150px'
                      }}
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {memo.content && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#fca5a5',
                    marginBottom: '8px'
                  }}>
                    補足
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#e5e7eb',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px',
                    border: '1px solid rgba(185, 28, 28, 0.2)'
                  }}>
                    {memo.content}
                  </div>
                </div>
              )}

              <div style={{
                fontSize: '13px',
                color: '#6b7280',
                paddingTop: '20px',
                borderTop: '1px solid rgba(185, 28, 28, 0.3)',
                marginBottom: '20px'
              }}>
                作成: {new Date(memo.createdAt).toLocaleString('ja-JP')}
                {memo.updatedAt !== memo.createdAt && (
                  <> / 更新: {new Date(memo.updatedAt).toLocaleString('ja-JP')}</>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end'
              }}>
                <a
                  href={`/memo/edit/${memo.id}`}
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'rgba(251, 146, 60, 0.3)',
                    border: '2px solid rgba(251, 146, 60, 0.5)',
                    borderRadius: '6px',
                    color: '#fb923c',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  編集
                </a>
                <button
                  onClick={() => {
                    handleDelete(memo.id);
                    setShowDetail(false);
                  }}
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'rgba(239, 68, 68, 0.3)',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    cursor: 'pointer'
                  }}
                >
                  削除
                </button>
                <button
                  onClick={() => setShowDetail(false)}
                  style={{
                    padding: '10px 24px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
    </>
  );
}
