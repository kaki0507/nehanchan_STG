'use client';

import { useEffect, useState } from 'react';
import { client } from '@/lib/client';

// キャラクター型定義
interface Character {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
  nickname?: string | null;
  height?: string | null;
  weight?: string | null;
  nationality?: string | null;
  martial_arts?: string | null;
  character_description?: string | null;
}

// ニュース型定義
interface NewsItem {
  date: string;
  tag: string;
  content: string;
}

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [screenScale, setScreenScale] = useState(1);
  const [menuOpen, setMenuOpen] = useState(true);

  useEffect(() => {
    fetchCharacters();
    loadNews();
    checkScreenSize();
    
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const checkScreenSize = () => {
    const width = window.innerWidth;
    const mobile = width < 768;
    setIsMobile(mobile);
    
    // モバイルの場合はメニューを閉じる、デスクトップの場合は開く
    if (!mobile) {
      setMenuOpen(true);
    } else {
      setMenuOpen(false);
    }
    
    if (width >= 1400) {
      setScreenScale(1);
    } else if (width >= 1200) {
      setScreenScale(0.9);
    } else if (width >= 1000) {
      setScreenScale(0.8);
    } else if (width >= 768) {
      setScreenScale(0.7);
    } else {
      setScreenScale(1);
    }
  };

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data } = await client.models.Character.list({ 
        authMode: 'apiKey' 
      });
      
      const validCharacters = (data || []).filter(character => character !== null) as Character[];
      
      const sortedCharacters = validCharacters.sort((a, b) => {
        const idA = String(a.character_id).padStart(3, '0');
        const idB = String(b.character_id).padStart(3, '0');
        return idA.localeCompare(idB);
      });
      
      setCharacters(sortedCharacters);
    } catch (error) {
      console.error('Error fetching characters:', error);
      setError('キャラクターの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadNews = () => {
    const savedNews = localStorage.getItem('tekkenNews');
    if (savedNews) {
      setNewsItems(JSON.parse(savedNews));
    } else {
      const defaultNews: NewsItem[] = [
        { date: '2025.11.30', tag: '新着', content: '鉄拳攻略サイト公開開始！　メモ・コンボメーカー機能を今後実装予定です' },
      ];
      setNewsItems(defaultNews);
      localStorage.setItem('tekkenNews', JSON.stringify(defaultNews));
    }
  };

  const getDisplayName = (character: Character): string => {
    if (character.display_name) {
      return character.display_name;
    }
    return character.character_name_jp || character.character_name_en;
  };

  const MobileCharacterButton = ({ character }: { character: Character }) => {
    return (
      <a
        href={`/character/${character.character_id}`}
        style={{
          position: 'relative',
          display: 'block',
          textDecoration: 'none',
          width: '100%',
          height: '120px',
          cursor: 'pointer'
        }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '2px'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            padding: '2px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src={`/character-faces-mobile/${character.character_id}.png`}
                  alt={getDisplayName(character)}
                  style={{
                    width: 'auto',
                    height: '100%',
                    maxWidth: '130%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    opacity: 0.85,
                    filter: 'brightness(0.9) contrast(1.0)'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.fallbackAttempted) {
                      target.dataset.fallbackAttempted = 'true';
                      target.src = `/character-faces/${character.character_id}.png`;
                    } else {
                      target.style.display = 'none';
                    }
                  }}
                />
              </div>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.8) 100%)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '4px',
                left: '0',
                right: '0',
                padding: '0 8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
                  lineHeight: '1.2',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {getDisplayName(character)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </a>
    );
  };

  const DesktopCharacterButton = ({ character }: { character: Character }) => {
    const isHovered = hoveredCharacter === character.id;

    return (
      <a
        href={`/character/${character.character_id}`}
        onMouseEnter={() => setHoveredCharacter(character.id)}
        onMouseLeave={() => setHoveredCharacter(null)}
        style={{
          position: 'relative',
          display: 'block',
          textDecoration: 'none',
          width: `${240 * screenScale}px`,
          height: `${170 * screenScale}px`,
          transform: isHovered ? 'scale(1.05) translateY(-3px)' : 'scale(1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer'
        }}
      >
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: 'skewX(-15deg)',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: isHovered
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : 'linear-gradient(135deg, #dc2626, #991b1b)',
            padding: `${3 * screenScale}px`,
            boxShadow: isHovered
              ? '0 0 20px rgba(220, 38, 38, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.5)'
              : '0 5px 15px rgba(0, 0, 0, 0.7), inset 0 0 10px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src={`/character-faces/${character.character_id}.png`}
                  alt={getDisplayName(character)}
                  style={{
                    width: 'auto',
                    height: '100%',
                    maxWidth: '150%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    transform: 'skewX(15deg)',
                    opacity: isHovered ? 0.9 : 0.7,
                    transition: 'opacity 0.3s',
                    filter: isHovered
                      ? 'brightness(1.1) contrast(1.1)'
                      : 'brightness(0.8) contrast(1.0)'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.9) 100%)',
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                bottom: `${10 * screenScale}px`,
                left: '0',
                right: '0',
                padding: `0 ${20 * screenScale}px`,
                transform: 'skewX(15deg)',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: `${16 * screenScale}px`,
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8)',
                  letterSpacing: '0.5px',
                  lineHeight: '1.2',
                  marginBottom: `${3 * screenScale}px`,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {getDisplayName(character)}
                </div>
                <div style={{
                  fontSize: `${11 * screenScale}px`,
                  color: 'rgba(252, 165, 165, 0.9)',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  letterSpacing: '0.3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {character.character_name_en}
                </div>
              </div>
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  background: 'rgba(255, 255, 255, 0.08)',
                  boxShadow: 'inset 0 0 40px rgba(220, 38, 38, 0.5), 0 0 20px rgba(220, 38, 38, 0.3)',
                  pointerEvents: 'none'
                }} />
              )}
            </div>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: isMobile ? '20px' : (menuOpen ? '320px' : '20px'),
          zIndex: 999,
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
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: menuOpen ? 0 : '-300px',
          width: '300px',
          height: '100vh',
          background: 'linear-gradient(to bottom, #000000, #1a0505, #000000)',
          boxShadow: menuOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
          zIndex: 998,
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
            { label: 'コンボ', href: '/combo/list', isLink: true }
          ].map((item, index) => (
            item.isLink ? (
              <a
                key={index}
                href={item.href}
                onClick={() => setMenuOpen(false)}
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

      {/* モバイル用オーバーレイ */}
      {isMobile && menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 997,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* メインコンテンツ */} 
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
        marginLeft: isMobile ? '0' : (menuOpen ? '300px' : '0'),
        transition: 'margin-left 0.3s ease-in-out',
        width: isMobile ? '100%' : (menuOpen ? 'calc(100% - 300px)' : '100%'),
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23991b1b' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1
        }}>    
    
          {/* ロゴセクション */}
          <div style={{
            width: '100%',
            background: `
              linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
              url('/backgrounds/background-title1.jpg')
            `,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: isMobile ? '40px 20px' : '60px 20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '0'
          }}>
            <img 
              src="/backgrounds/TEKKEN8_LOGO.png"
              alt="TEKKEN 8"
              style={{
                maxWidth: isMobile ? '80%' : '600px',
                width: '100%',
                height: 'auto',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))'
              }}
            />
          </div>
        <div style={{
          padding: '40px 20px',
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          {/* NEWSセクション */}
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto 60px',
            padding: '0 20px'
          }}>
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
                
                <h2 style={{
                  position: 'relative',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                  padding: '10px 40px'
                }}>
                  NEWS
                </h2>
              </div>
            </div>

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
                borderRadius: '4px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.7)'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0, 0, 0, 0.85)',
                  borderRadius: '2px'
                }} />
              </div>
              
              <div style={{
                position: 'relative',
                padding: isMobile ? '10px 15px' : '20px 30px'
              }}>
                {newsItems.map((news, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: isMobile ? '10px 0' : '15px 0',
                      borderBottom: index < newsItems.length - 1 ? '1px solid rgba(185, 28, 28, 0.2)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '8px' : '20px',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(185, 28, 28, 0.1)';
                      e.currentTarget.style.paddingLeft = isMobile ? '5px' : '10px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.paddingLeft = '0';
                    }}
                  >
                    <div style={{
                      fontSize: isMobile ? '11px' : '16px',
                      color: '#9ca3af',
                      minWidth: isMobile ? '80px' : '110px',
                      fontFamily: 'monospace',
                      letterSpacing: '1px'
                    }}>
                      {news.date}
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                      color: '#ffffff',
                      padding: isMobile ? '2px 6px' : '2px 10px',
                      fontSize: isMobile ? '10px' : '13px',
                      fontWeight: 'bold',
                      borderRadius: '2px',
                      minWidth: isMobile ? '40px' : '50px',
                      textAlign: 'center',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                    }}>
                      {news.tag}
                    </div>
                    
                    <div style={{
                      fontSize: isMobile ? '11px' : '16px',
                      color: '#e5e7eb',
                      flex: 1,
                      letterSpacing: '0.5px'
                    }}>
                      {news.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* キャラクターセクションヘッダー */}
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto 40px',
            padding: '0 20px'
          }}>
            <div style={{
              textAlign: 'center'
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
                
                <h2 style={{
                  position: 'relative',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  letterSpacing: '4px',
                  textTransform: 'uppercase',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                  padding: '10px 40px'
                }}>
                  CHARACTER LIST
                </h2>
              </div>
            </div>
          </div>

          {/* キャラクターグリッド */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              fontSize: '24px',
              color: '#fca5a5',
              marginTop: '100px'
            }}>
              Loading...
            </div>
          ) : error ? (
            <div style={{
              textAlign: 'center',
              padding: '100px 20px'
            }}>
              <p style={{
                fontSize: '24px',
                color: '#ef4444',
                marginBottom: '20px'
              }}>
                {error}
              </p>
              <button
                onClick={fetchCharacters}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                再読み込み
              </button>
            </div>
          ) : characters.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile 
                ? 'repeat(4, 1fr)'
                : `repeat(auto-fill, ${240 * screenScale}px)`,
              gap: isMobile ? '4px' : `${15 * screenScale}px`,
              padding: isMobile ? '10px 4px' : '20px',
              justifyContent: 'center',
              maxWidth: '1400px',
              margin: '0 auto'
            }}>
              {isMobile ? (
                characters.map((character) => (
                  <MobileCharacterButton key={character.id} character={character} />
                ))
              ) : (
                characters.map((character) => (
                  <DesktopCharacterButton key={character.id} character={character} />
                ))
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '100px 20px'
            }}>
              <p style={{
                fontSize: '24px',
                color: '#9ca3af',
                marginBottom: '20px'
              }}>
                キャラクターデータがありません
              </p>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                marginBottom: '20px'
              }}>
                CSVインポート機能を使用してキャラクターデータを追加してください
              </p>
              <a
                href="/import"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                CSVインポートへ
              </a>
            </div>
          )}
        </div>

        {/* フッター */}
        <footer style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          padding: 0,
          margin: 0,
          width: '100%'
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
      </div>
    </div>

    </div>
  );
}
