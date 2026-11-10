// src/app/combo-maker/styles.ts
// コンボメーカー共通のスタイル定義
import type { CSSProperties } from 'react';

// 背景はトップページ・対策メモと同じ（模様 ＋ 暗めのグラデーション ＋ 背景画像）
const CROSS_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23991b1b' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

export const pageStyle: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000000',
  backgroundImage: `${CROSS_PATTERN}, linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url('/backgrounds/background.jpg')`,
  backgroundSize: '60px 60px, cover, cover',
  backgroundRepeat: 'repeat, no-repeat, no-repeat',
  backgroundPosition: 'top left, center, center',
  backgroundAttachment: 'fixed',
  padding: '20px',
};

export const containerStyle: CSSProperties = { maxWidth: '1400px', margin: '0 auto' };

export const panelStyle: CSSProperties = {
  background: 'rgba(0, 0, 0, 0.8)',
  border: '2px solid rgba(185, 28, 28, 0.3)',
  borderRadius: '8px',
  padding: '20px',
  color: '#e5e7eb', // Tailwind未適用のため文字色を明示
};

export const labelStyle: CSSProperties = {
  display: 'block',
  color: '#fca5a5',
  fontSize: '14px',
  fontWeight: 'bold',
  marginBottom: '8px',
};

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px',
  background: 'rgba(0, 0, 0, 0.6)',
  border: '1px solid rgba(185, 28, 28, 0.4)',
  borderRadius: '4px',
  color: '#ffffff',
  fontSize: '14px',
  boxSizing: 'border-box',
};

export const primaryButtonStyle: CSSProperties = {
  padding: '10px 20px',
  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
  border: 'none',
  borderRadius: '6px',
  color: '#ffffff',
  fontWeight: 'bold',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
};

export const subButtonStyle: CSSProperties = {
  padding: '10px 20px',
  background: 'rgba(59, 130, 246, 0.3)',
  border: '2px solid rgba(59, 130, 246, 0.5)',
  borderRadius: '6px',
  color: '#60a5fa',
  fontWeight: 'bold',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
};

export const smallButtonStyle: CSSProperties = {
  padding: '2px 8px',
  background: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(185, 28, 28, 0.4)',
  borderRadius: '4px',
  color: '#d1d5db',
  fontSize: '12px',
  cursor: 'pointer',
};
