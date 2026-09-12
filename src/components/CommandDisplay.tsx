'use client';

import React from 'react';
import { parseCommandToElements, getIconPath } from '@/utils/commandIcons';

interface CommandDisplayProps {
  command?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showFallback?: boolean;
}

interface CommandElement {
  type: 'text' | 'icon';
  value: string;
  iconType?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8'
};

export default function CommandDisplay({ 
  command, 
  size = 'md', 
  className = '',
  showFallback = true 
}: CommandDisplayProps) {
  // コマンドが空またはnullの場合
  if (!command || command.trim() === '') {
    return showFallback ? (
      <span className={`text-gray-400 text-sm ${className}`}>-</span>
    ) : null;
  }

  const elements = parseCommandToElements(command);

  // 解析できなかった場合（全て文字列だった場合など）はテキストで表示
  if (elements.length === 0) {
    return (
      <span className={`text-sm font-mono text-gray-200 ${className}`}>
        {command}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1 justify-start ${className}`}>
      {elements.map((element: CommandElement, index: number) => {
        if (element.type === 'text') {
          return (
            <span 
              key={`text-${index}`} 
              className="text-sm text-gray-200 whitespace-nowrap"
            >
              {element.value}
            </span>
          );
        } else {
          return (
            <img
              key={`icon-${element.value}-${index}`}
              src={getIconPath(element.value, element.iconType)}
              alt={element.value}
              className={`${sizeClasses[size]} object-contain flex-shrink-0`}
              onError={(e) => {
                // 画像が見つからない場合はテキストに置換
                const target = e.target as HTMLImageElement;
                const span = document.createElement('span');
                span.textContent = element.value;
                span.className = 'text-xs font-mono bg-gray-200 text-gray-800 px-1 py-0.5 rounded';
                target.parentNode?.replaceChild(span, target);
              }}
              title={element.value} // ホバー時にアイコン名を表示
            />
          );
        }
      })}
    </div>
  );
}

// 技一覧専用のテキスト置換コンポーネント（限定的な使用のみ）
interface TextWithIconsProps {
  text?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showFallback?: boolean;
  textClassName?: string; // テキスト部分のスタイル
  enableIconReplacement?: boolean; // アイコン置換を有効にするかどうか
}

export function TextWithIcons({ 
  text, 
  size = 'md', 
  className = '',
  showFallback = true,
  textClassName = 'text-sm text-gray-200',
  enableIconReplacement = false // デフォルトは無効
}: TextWithIconsProps) {
  // テキストが空またはnullの場合
  if (!text || text.trim() === '') {
    return showFallback ? (
      <span className={`text-gray-400 text-sm ${className}`}>-</span>
    ) : null;
  }

  // アイコン置換が無効な場合は通常のテキスト表示
  if (!enableIconReplacement) {
    return (
      <span className={`${textClassName} ${className}`}>
        {text}
      </span>
    );
  }

  const elements = parseCommandToElements(text);

  // 解析できなかった場合（全て文字列だった場合など）はテキストで表示
  if (elements.length === 0 || elements.every(el => el.type === 'text')) {
    return (
      <span className={`${textClassName} ${className}`}>
        {text}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 flex-wrap ${className}`}>
      {elements.map((element: CommandElement, index: number) => {
        if (element.type === 'text') {
          return (
            <span 
              key={`text-${index}`} 
              className={`${textClassName} whitespace-nowrap`}
              style={{ lineHeight: 1 }}
            >
              {element.value}
            </span>
          );
        } else {
          return (
            <img
              key={`icon-${element.value}-${index}`}
              src={getIconPath(element.value)}
              alt={element.value}
              className={`${sizeClasses[size]} object-contain flex-shrink-0`}
              onError={(e) => {
                // 画像が見つからない場合はテキストに置換
                const target = e.target as HTMLImageElement;
                const span = document.createElement('span');
                span.textContent = element.value;
                span.className = 'text-xs font-mono bg-gray-200 text-gray-800 px-1 py-0.5 rounded';
                target.parentNode?.replaceChild(span, target);
              }}
              title={element.value} // ホバー時にアイコン名を表示
            />
          );
        }
      })}
    </div>
  );
}

// 通常のテキスト表示（アイコン置換なし）
export function PlainText({ 
  text, 
  className = '',
  showFallback = true 
}: { 
  text?: string | null; 
  className?: string; 
  showFallback?: boolean; 
}) {
  if (!text || text.trim() === '') {
    return showFallback ? (
      <span className={`text-gray-400 text-sm ${className}`}>-</span>
    ) : null;
  }

  return (
    <span className={className}>
      {text}
    </span>
  );
}

interface CommandDisplayDetailedProps {
  command?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showOriginal?: boolean;
  showDebug?: boolean;
}

export function CommandDisplayDetailed({ 
  command, 
  size = 'md',
  className = '',
  showOriginal = false,
  showDebug = false
}: CommandDisplayDetailedProps) {
  const elements = command ? parseCommandToElements(command) : [];

  return (
    <div className={`space-y-2 ${className}`}>
      <CommandDisplay 
        command={command} 
        size={size} 
        showFallback={true}
      />
      
      {showOriginal && command && (
        <div className="text-xs text-gray-500 font-mono">
          原文: {command}
        </div>
      )}
      
      {showDebug && command && (
        <div className="text-xs text-gray-400 space-y-1">
          <div>要素数: {elements.length}</div>
          <div>解析結果: [
            {elements.map(el => `${el.type}:"${el.value}"`).join(', ')}
          ]</div>
        </div>
      )}
    </div>
  );
}