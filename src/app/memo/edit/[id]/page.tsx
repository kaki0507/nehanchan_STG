'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { client } from '@/lib/client';

interface Character {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
}

const DEFAULT_CATEGORIES = [
  '確定反撃',
  'しゃがめる連携',
  '割れない連携',
  '潜る連携',
  'ファジー',
  '立ち回り',
  'その他'
];

export default function MemoEditPage() {
  const params = useParams();
  const router = useRouter();
  const memoId = params.id as string;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [importance, setImportance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // 分類管理
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [categorySettingsId, setCategorySettingsId] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [newCategoryValue, setNewCategoryValue] = useState('');

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    fetchCharacters();
    loadCategories();
    loadMemoData();
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await client.models.CategorySettings.list({ authMode: 'userPool' });
      
      if (data && data.length > 0 && data[0]) {
        const settings = data[0];
        setCategorySettingsId(settings.id);
        
        if (settings.categories && settings.categories.length > 0) {
          const validCategories = settings.categories.filter((c): c is string => c !== null);
          setCategories(validCategories);
        }
      } else {
        // 初回は空なので、デフォルト分類をDBに保存
        await saveCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error('分類の読み込みエラー:', error);
    }
  };

  const saveCategories = async (newCategories: string[]) => {
    try {
      if (categorySettingsId) {
        // 更新
        const result = await client.models.CategorySettings.update({
          id: categorySettingsId,
          categories: newCategories
        }, { authMode: 'userPool' });
        
        if (result.data) {
          setCategories(newCategories);
        }
      } else {
        // 新規作成
        const result = await client.models.CategorySettings.create({
          categories: newCategories
        }, { authMode: 'userPool' });
        
        if (result.data) {
          setCategorySettingsId(result.data.id);
          setCategories(newCategories);
        }
      }
    } catch (error) {
      console.error('分類の保存エラー:', error);
      alert('分類の保存に失敗しました');
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryValue.trim()) {
      alert('分類名を入力してください');
      return;
    }
    if (categories.includes(newCategoryValue.trim())) {
      alert('この分類は既に存在します');
      return;
    }
    const newCategories = [...categories, newCategoryValue.trim()];
    saveCategories(newCategories);
    setNewCategoryValue('');
  };

  const handleStartEdit = (index: number) => {
    setEditingCategoryIndex(index);
    setEditingCategoryValue(categories[index]);
  };

  const handleSaveEdit = () => {
    if (editingCategoryIndex === null) return;
    if (!editingCategoryValue.trim()) {
      alert('分類名を入力してください');
      return;
    }
    
    const otherCategories = categories.filter((_, i) => i !== editingCategoryIndex);
    if (otherCategories.includes(editingCategoryValue.trim())) {
      alert('この分類は既に存在します');
      return;
    }
    
    const newCategories = [...categories];
    const oldValue = newCategories[editingCategoryIndex];
    newCategories[editingCategoryIndex] = editingCategoryValue.trim();
    saveCategories(newCategories);
    
    // 選択中の分類も更新
    setSelectedCategories(selectedCategories.map(c => c === oldValue ? editingCategoryValue.trim() : c));
    
    setEditingCategoryIndex(null);
    setEditingCategoryValue('');
  };

  const handleCancelEdit = () => {
    setEditingCategoryIndex(null);
    setEditingCategoryValue('');
  };

  const handleDeleteCategory = (index: number) => {
    const categoryName = categories[index];
    if (!confirm(`「${categoryName}」を削除しますか？`)) return;
    
    const deletedCategory = categories[index];
    const newCategories = categories.filter((_, i) => i !== index);
    saveCategories(newCategories);
    
    // 選択中の分類から削除
    setSelectedCategories(selectedCategories.filter(c => c !== deletedCategory));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newCategories = [...categories];
    [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    saveCategories(newCategories);
  };

  const handleMoveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const newCategories = [...categories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    saveCategories(newCategories);
  };

  const handleResetCategories = () => {
    if (!confirm('分類をデフォルトに戻しますか？')) return;
    saveCategories(DEFAULT_CATEGORIES);
  };

  const loadMemoData = async () => {
    setInitialLoading(true);
    try {
      const { data } = await client.models.Memo.get({ id: memoId }, { authMode: 'userPool' });
      
      if (!data) {
        alert('メモが見つかりませんでした');
        router.push('/memo/list');
        return;
      }

      setSelectedCharacter(data.character_id);
      setTitle(data.title || '');
      setContent(data.content || '');
      setImportance(data.importance || 0);
      setSelectedCategories(data.categories?.filter((c): c is string => c !== null) || []);
    } catch (error) {
      console.error('❌ メモデータ取得エラー:', error);
      alert('メモデータの取得に失敗しました');
      router.push('/memo/list');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchCharacters = async () => {
    try {
      const { data } = await client.models.Character.list({ authMode: 'apiKey' });
      const validCharacters = (data || []).filter(c => c !== null) as Character[];
      const sorted = validCharacters.sort((a, b) => {
        const idA = String(a.character_id).padStart(3, '0');
        const idB = String(b.character_id).padStart(3, '0');
        return idA.localeCompare(idB);
      });
      setCharacters(sorted);
    } catch (error) {
      console.error('キャラクター取得エラー:', error);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSave = async () => {
    if (!selectedCharacter) {
      alert('キャラクターを選択してください');
      return;
    }
    if (!title.trim()) {
      alert('メモを入力してください');
      return;
    }

    setLoading(true);
    
    try {
      const selectedChar = characters.find(c => c.character_id === selectedCharacter);
      const characterName = selectedChar 
        ? (selectedChar.display_name || selectedChar.character_name_jp || selectedChar.character_name_en)
        : selectedCharacter;

      const memoData = {
        id: memoId,
        character_id: selectedCharacter,
        character_name: characterName || selectedCharacter,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        title: title.trim(),
        content: content.trim() || undefined,
        importance: importance > 0 ? importance : undefined
      };

      console.log('メモ更新データ:', memoData);

      const result = await client.models.Memo.update(memoData, {
        authMode: 'userPool'
      });

      console.log('更新結果:', result);

      if (result.data) {
        alert('メモを更新しました！');
        router.push('/memo/list');
      } else {
        throw new Error('データの更新に失敗しました');
      }
      
    } catch (error) {
      console.error('更新エラー詳細:', error);
      
      if (error instanceof Error) {
        alert(`更新に失敗しました: ${error.message}`);
      } else {
        alert('更新に失敗しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (character: Character): string => {
    if (character.display_name) return character.display_name;
    return character.character_name_jp || character.character_name_en;
  };

  if (initialLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundImage: `
          linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),
          url('/backgrounds/background.jpg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#fca5a5', fontSize: '18px', fontWeight: 'bold' }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `
        linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),
        url('/backgrounds/background.jpg')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      overflow: 'hidden'
    }}>
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
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* ヘッダー */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
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
              メモ編集
            </h1>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div style={{
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            padding: '3px',
            borderRadius: '8px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.7)'
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
            padding: isMobile ? '20px' : '40px'
          }}>
            {/* キャラクター選択 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fca5a5',
                marginBottom: '12px',
                letterSpacing: '1px'
              }}>
                キャラクター
              </label>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(185, 28, 28, 0.4)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">選択してください</option>
                {characters.map(char => (
                  <option key={char.id} value={char.character_id}>
                    {getDisplayName(char)}
                  </option>
                ))}
              </select>
            </div>

            {/* 分類選択 */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <label style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#fca5a5',
                  letterSpacing: '1px'
                }}>
                  分類
                </label>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    background: 'rgba(59, 130, 246, 0.3)',
                    border: '2px solid rgba(59, 130, 246, 0.5)',
                    borderRadius: '6px',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                  }}
                >
                  ⚙ 分類を管理
                </button>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                {categories.map(category => (
                  <label
                    key={category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      background: selectedCategories.includes(category)
                        ? 'rgba(185, 28, 28, 0.3)'
                        : 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid',
                      borderColor: selectedCategories.includes(category)
                        ? 'rgba(248, 113, 113, 0.5)'
                        : 'rgba(185, 28, 28, 0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: selectedCategories.includes(category) ? '#fca5a5' : '#e5e7eb'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* メモ入力 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fca5a5',
                marginBottom: '12px',
                letterSpacing: '1px'
              }}>
                メモ <span style={{ color: '#f87171', fontSize: '14px' }}>*必須</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: LPRPはガード後12F確定反撃"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(185, 28, 28, 0.4)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>

            {/* 補足入力 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fca5a5',
                marginBottom: '12px',
                letterSpacing: '1px'
              }}>
                補足 <span style={{ color: '#9ca3af', fontSize: '14px' }}>任意</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="詳細な説明や補足情報を入力してください（任意）"
                rows={10}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '2px solid rgba(185, 28, 28, 0.4)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: '1.6'
                }}
              />
            </div>

            {/* 重要度選択 */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fca5a5',
                marginBottom: '12px',
                letterSpacing: '1px'
              }}>
                重要度
              </label>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setImportance(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '32px',
                      color: star <= importance ? '#fbbf24' : '#4b5563',
                      transition: 'all 0.2s',
                      padding: '4px'
                    }}
                  >
                    ★
                  </button>
                ))}
                <button
                  onClick={() => setImportance(0)}
                  style={{
                    marginLeft: '16px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'rgba(107, 114, 128, 0.3)',
                    border: '2px solid rgba(107, 114, 128, 0.5)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(107, 114, 128, 0.3)';
                  }}
                >
                  クリア
                </button>
              </div>
            </div>

            {/* ボタン */}
            <div style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              

              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '14px 40px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: loading 
                    ? 'rgba(107, 114, 128, 0.3)'
                    : 'linear-gradient(135deg, #dc2626, #991b1b)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                  minWidth: '140px'
                }}
              >
                {loading ? '更新中...' : '更新'}
              </button>

              <a
                href="/memo/list"
                style={{
                  padding: '14px 40px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                  minWidth: '140px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  textAlign: 'center'
                }}
              >
                一覧を見る
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 分類管理モーダル（メモ作成ページと同じ） */}
      {showCategoryModal && (
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
              setShowCategoryModal(false);
              setEditingCategoryIndex(null);
              setEditingCategoryValue('');
              setNewCategoryValue('');
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#fef2f2',
                  margin: 0
                }}>
                  分類管理
                </h2>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategoryIndex(null);
                    setEditingCategoryValue('');
                    setNewCategoryValue('');
                  }}
                  style={{
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
              </div>

              {/* 新規追加フォーム */}
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                border: '1px solid rgba(185, 28, 28, 0.2)'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#fca5a5',
                  marginBottom: '8px'
                }}>
                  新しい分類を追加
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={newCategoryValue}
                    onChange={(e) => setNewCategoryValue(e.target.value)}
                    placeholder="分類名を入力"
                    disabled={editingCategoryIndex !== null}
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '14px',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '2px solid rgba(185, 28, 28, 0.4)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && editingCategoryIndex === null) {
                        handleAddCategory();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={editingCategoryIndex !== null}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      background: editingCategoryIndex !== null 
                        ? 'rgba(107, 114, 128, 0.3)'
                        : 'rgba(34, 197, 94, 0.3)',
                      border: '2px solid',
                      borderColor: editingCategoryIndex !== null
                        ? 'rgba(107, 114, 128, 0.5)'
                        : 'rgba(34, 197, 94, 0.5)',
                      borderRadius: '6px',
                      color: editingCategoryIndex !== null ? '#6b7280' : '#86efac',
                      cursor: editingCategoryIndex !== null ? 'not-allowed' : 'pointer'
                    }}
                  >
                    追加
                  </button>
                </div>
              </div>

              {/* 分類リスト */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#fca5a5',
                  marginBottom: '10px'
                }}>
                  分類一覧 ({categories.length}件)
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {categories.map((category, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(185, 28, 28, 0.2)',
                        borderRadius: '6px'
                      }}
                    >
                      {editingCategoryIndex === index ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={editingCategoryValue}
                            onChange={(e) => setEditingCategoryValue(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              fontSize: '14px',
                              background: 'rgba(0, 0, 0, 0.6)',
                              border: '2px solid rgba(185, 28, 28, 0.4)',
                              borderRadius: '4px',
                              color: '#ffffff',
                              outline: 'none'
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit();
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            style={{
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: 'rgba(34, 197, 94, 0.3)',
                              border: '2px solid rgba(34, 197, 94, 0.5)',
                              borderRadius: '4px',
                              color: '#86efac',
                              cursor: 'pointer'
                            }}
                          >
                            保存
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              padding: '8px 12px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: 'rgba(107, 114, 128, 0.3)',
                              border: '2px solid rgba(107, 114, 128, 0.5)',
                              borderRadius: '4px',
                              color: '#9ca3af',
                              cursor: 'pointer'
                            }}
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{
                            flex: 1,
                            fontSize: '14px',
                            color: '#e5e7eb',
                            fontWeight: '500'
                          }}>
                            {category}
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                background: index === 0 ? 'rgba(107, 114, 128, 0.2)' : 'rgba(59, 130, 246, 0.3)',
                                border: '1px solid',
                                borderColor: index === 0 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(59, 130, 246, 0.5)',
                                borderRadius: '4px',
                                color: index === 0 ? '#6b7280' : '#60a5fa',
                                cursor: index === 0 ? 'not-allowed' : 'pointer'
                              }}
                              title="上に移動"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={index === categories.length - 1}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                background: index === categories.length - 1 ? 'rgba(107, 114, 128, 0.2)' : 'rgba(59, 130, 246, 0.3)',
                                border: '1px solid',
                                borderColor: index === categories.length - 1 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(59, 130, 246, 0.5)',
                                borderRadius: '4px',
                                color: index === categories.length - 1 ? '#6b7280' : '#60a5fa',
                                cursor: index === categories.length - 1 ? 'not-allowed' : 'pointer'
                              }}
                              title="下に移動"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => handleStartEdit(index)}
                              disabled={editingCategoryIndex !== null}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                background: editingCategoryIndex !== null ? 'rgba(107, 114, 128, 0.2)' : 'rgba(251, 146, 60, 0.3)',
                                border: '1px solid',
                                borderColor: editingCategoryIndex !== null ? 'rgba(107, 114, 128, 0.3)' : 'rgba(251, 146, 60, 0.5)',
                                borderRadius: '4px',
                                color: editingCategoryIndex !== null ? '#6b7280' : '#fb923c',
                                cursor: editingCategoryIndex !== null ? 'not-allowed' : 'pointer'
                              }}
                              title="編集"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(index)}
                              disabled={editingCategoryIndex !== null}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                background: editingCategoryIndex !== null ? 'rgba(107, 114, 128, 0.2)' : 'rgba(239, 68, 68, 0.3)',
                                border: '1px solid',
                                borderColor: editingCategoryIndex !== null ? 'rgba(107, 114, 128, 0.3)' : 'rgba(239, 68, 68, 0.5)',
                                borderRadius: '4px',
                                color: editingCategoryIndex !== null ? '#6b7280' : '#fca5a5',
                                cursor: editingCategoryIndex !== null ? 'not-allowed' : 'pointer'
                              }}
                              title="削除"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* フッターボタン */}
              <div style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                paddingTop: '20px',
                borderTop: '1px solid rgba(185, 28, 28, 0.3)'
              }}>
                <button
                  onClick={handleResetCategories}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    background: 'rgba(239, 68, 68, 0.3)',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    cursor: 'pointer'
                  }}
                >
                  デフォルトに戻す
                </button>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategoryIndex(null);
                    setEditingCategoryValue('');
                    setNewCategoryValue('');
                  }}
                  style={{
                    padding: '10px 20px',
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
      )}
    </div>
  );
}
