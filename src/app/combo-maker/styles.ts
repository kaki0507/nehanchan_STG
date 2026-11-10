// src/app/combo-maker/styles.ts
// コンボメーカー共通のスタイル定義
import type { CSSProperties } from 'react';

export const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)',
  padding: '20px',
};

export const containerStyle: CSSProperties = { maxWidth: '1400px', margin: '0 auto' };

export const panelStyle: CSSProperties = {
  background: 'rgba(0, 0, 0, 0.8)',
  border: '2px solid rgba(185, 28, 28, 0.3)',
  borderRadius: '8px',
  padding: '20px',
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
