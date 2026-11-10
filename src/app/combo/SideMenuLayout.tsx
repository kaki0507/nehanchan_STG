// src/app/combo/SideMenuLayout.tsx
// ハンバーガーメニュー付きのレイアウト（対策メモ一覧のメニューと同じ見た目・動き）
'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'aws-amplify/auth';

const MENU_ITEMS = [
  { label: 'TOP', href: '/' },
  { label: '対策メモ', href: '/memo/list' },
  { label: 'コンボ', href: '/combo/list' },
];

const MENU_WIDTH = 300;

export default function SideMenuLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // デスクトップは最初からメニューを開く
      setMenuOpen(!mobile);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px 30px',
    color: '#e5e7eb',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 600,
    borderLeft: '4px solid transparent',
    transition: 'all 0.2s',
  };

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="メニュー"
        style={{
          position: 'fixed',
          top: '20px',
          left: menuOpen ? `${MENU_WIDTH + 20}px` : '20px',
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
          transition: 'all 0.3s ease-in-out',
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

      {/* スマホでメニューを開いたときの背景（タップで閉じる） */}
      {isMobile && menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 999, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* サイドメニュー */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: menuOpen ? 0 : `-${MENU_WIDTH}px`,
          width: `${MENU_WIDTH}px`,
          height: '100vh',
          background: 'linear-gradient(to bottom, #000000, #1a0505, #000000)',
          boxShadow: menuOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
          zIndex: 1000,
          transition: 'left 0.3s ease-in-out',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '20px', borderBottom: '2px solid rgba(185, 28, 28, 0.3)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fef2f2', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
            MENU
          </h2>
        </div>

        <nav style={{ padding: '20px 0' }}>
          {MENU_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={itemStyle}
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
          ))}
        </nav>

        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={handleLogout}
            style={{ ...itemStyle, width: '100%', background: 'transparent', border: 'none', color: '#9ca3af', textAlign: 'left', cursor: 'pointer' }}
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

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px',
            borderTop: '2px solid rgba(185, 28, 28, 0.3)',
            background: 'rgba(0, 0, 0, 0.5)',
            fontSize: '12px',
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          TEKKEN 8 Database
        </div>
      </div>

      {/* 本文（デスクトップでメニューが開いているときは右へずらす） */}
      <div
        style={{
          marginLeft: !isMobile && menuOpen ? `${MENU_WIDTH}px` : 0,
          paddingTop: '70px', // ハンバーガーボタンと重ならないように
          transition: 'margin-left 0.3s ease',
        }}
      >
        {children}
      </div>
    </>
  );
}
