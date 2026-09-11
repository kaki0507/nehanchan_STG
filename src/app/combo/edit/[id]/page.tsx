// src/app/combo/edit/[id]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { client } from '@/lib/client';
import { TextWithIcons } from '@/components/CommandDisplay';

interface Character {
  id: string;
  character_id: string;
  character_name_en: string;
  character_name_jp?: string | null;
  display_name?: string | null;
}

interface Move {
  id: string;
  move_id: string;
  move_name: string;
  move_name_kana?: string | null;
  command?: string | null;
  character_id: string;
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

const BACKGROUND_COLORS = {
  blue: '#60a5fa',
  orange: '#ff9500',
  red: '#ff8787',
  green: '#69db7c',
  yellow: '#ffd700',
  gray: '#ced4da',
  purple: '#cc9dff',
  cyan: '#66d9e8',
};

const COMBO_CATEGORIES = [
  { value: '', label: '未選択' },
  { value: 'normal', label: '通常コンボ' },
  { value: 'carry', label: '運び重視コンボ' },
  { value: 'okizeme', label: '起き攻め重視コンボ' },
  { value: 'damage', label: '火力重視コンボ' },
  { value: 'counter', label: 'カウンターヒットコンボ' },
  { value: 'stage', label: 'ステージギミックコンボ' },
  { value: 'basic', label: '基本コンボ' },
  { value: 'advanced', label: '高難度コンボ' },
  { value: 'setup', label: 'セットアップ' },
  { value: 'wakeup', label: '起き攻め' },
];

const COMMAND_ICONS = {
  directions: [
    { code: 'bj', label: '↖ (7)' },
    { code: 'ju', label: '↑ (8)' },
    { code: 'fj', label: '↗ (9)' },
    { code: 'ba', label: '← (4)' },
    { code: 'nt', label: 'N (5)' },
    { code: 'fo', label: '→ (6)' },
    { code: 'bc', label: 'バックチャージ' },
    { code: 'cr', label: '↓ (2)' },
    { code: 'fc', label: 'フロントチャージ' },
    { code: 'qy', label: 'クイック' },
    { code: 'wu', label: 'ウェイクアップ' },
    { code: 'ei', label: 'EX技' },
    { code: 'ah', label: 'エアヒット' },
    { code: null, label: '' },
    { code: 'dk', label: '↙ (1)' },
    { code: 'zb', label: 'ZB' },
    { code: 'xn', label: 'XN' },
    { code: 'cm', label: 'カウンター' },
  ],
  buttons: [
    { code: 'lp', label: '弱P' },
    { code: 'rp', label: '強P' },
    { code: 'wp', label: 'ウォークパンチ' },
    { code: 'lk', label: '弱K' },
    { code: 'rk', label: '強K' },
    { code: 'wk', label: 'ウォークキック' },
    { code: 'ij', label: 'インジャンプ' },
    { code: 'uk', label: 'UK' },
    { code: null, label: '' },
  ],
  others: [
    { code: 'all', label: '全ボタン' },
    { code: 'ng', label: '↘ (3)' },
    { code: 'nh', label: 'NH' },
    { code: 'nv', label: 'ノーマルヒット' },
    { code: 'nb', label: 'ニュートラル' },
  ],
  modifiers: [
    { code: '+', label: '同時押し' },
    { code: 'or', label: 'または' },
    { code: '~', label: '最速' },
    { code: '>', label: 'ディレイ' },
  ],
  effects: [
    { code: 'TR', label: 'トルネード' },
    { code: 'FB', label: 'ファウンドバウンド' },
    { code: 'KS', label: 'KS' },
    { code: 'GV', label: 'GV' },
    { code: 'HO', label: 'ホーミング' },
    { code: 'HT', label: 'ヒート' },
    { code: 'PC', label: 'パワークラッシュ' },
    { code: 'WB', label: 'ウォールバウンド' },
    { code: 'wn', label: 'WN' },
    { code: 'wl', label: 'ホワイルラン' },
    { code: 'mp', label: '中P' },
    { code: 'mk', label: '中K' },
  ]
};

export default function ComboEditPage() {
  const params = useParams();
  const router = useRouter();
  const comboId = params.id as string;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [moves, setMoves] = useState<Move[]>([]);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState(0);
  const [damage, setDamage] = useState('');
  const [importance, setImportance] = useState(0);
  const [displayMode, setDisplayMode] = useState<'move_name' | 'command'>('move_name');
  
  const [nodes, setNodes] = useState<Map<string, ComboNode>>(new Map());
  const [rootNodeIds, setRootNodeIds] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [showNodePopup, setShowNodePopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupNodeId, setPopupNodeId] = useState<string | null>(null);
  
  const [searchMode, setSearchMode] = useState<'name' | 'command'>('name');
  const [moveSearchQuery, setMoveSearchQuery] = useState('');
  const [selectedCommandIcons, setSelectedCommandIcons] = useState<string[]>([]);
  const [filteredMoves, setFilteredMoves] = useState<Move[]>([]);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchCharacters();
    loadComboData();
  }, []);

  useEffect(() => {
    if (selectedCharacterId) {
      fetchMoves(selectedCharacterId);
    } else {
      setMoves([]);
      setFilteredMoves([]);
    }
  }, [selectedCharacterId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowNodePopup(false);
      }
    };

    if (showNodePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNodePopup]);

  useEffect(() => {
    if (searchMode === 'name' && moveSearchQuery.trim()) {
      const normalizeString = (str: string) => {
        return str
          .toLowerCase()
          .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
          .replace(/　/g, ' ')
          .replace(/[\u30A1-\u30F6]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0x60));
      };
      
      const query = normalizeString(moveSearchQuery);
      const filtered = moves.filter(m => {
        const moveName = normalizeString(m.move_name);
        const moveNameKana = m.move_name_kana ? normalizeString(m.move_name_kana) : '';
        const command = m.command ? normalizeString(m.command) : '';
        return moveName.includes(query) || moveNameKana.includes(query) || command.includes(query);
      });
      setFilteredMoves(filtered);
    } else if (searchMode === 'name') {
      setFilteredMoves([]);
    }
  }, [moveSearchQuery, moves, searchMode]);

  useEffect(() => {
    if (searchMode === 'command' && selectedCommandIcons.length > 0) {
      const searchPattern = selectedCommandIcons.join(' ');
      const filtered = moves.filter(m => {
        if (!m.command) return false;
        const normalizedCommand = m.command.replace(/\s+/g, ' ').toLowerCase();
        const normalizedPattern = searchPattern.toLowerCase();
        return normalizedCommand.includes(normalizedPattern);
      });
      setFilteredMoves(filtered);
      setShowMoveDropdown(true);
    } else if (searchMode === 'command') {
      setFilteredMoves([]);
      setShowMoveDropdown(false);
    }
  }, [selectedCommandIcons, moves, searchMode]);

  const loadComboData = async () => {
    setInitialLoading(true);
    try {
      // ✅ userPool に変更（自分のコンボを取得するため）
      const { data } = await client.models.Combo.get({ id: comboId }, { authMode: 'userPool' });
      
      if (!data) {
        alert('コンボが見つかりませんでした');
        router.push('/combo/list');
        return;
      }

      setSelectedCharacterId(data.character_id);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setCategory(data.category || '');
      setDifficulty(data.difficulty || 0);
      setDamage(data.damage ? String(data.damage) : '');
      setImportance(data.importance || 0);
      setDisplayMode((data.display_mode as 'move_name' | 'command') || 'move_name');

      if (data.nodes) {
        try {
          const treeData = JSON.parse(data.nodes);
          const nodesMap = new Map<string, ComboNode>();
          
          Object.entries(treeData.nodes).forEach(([nodeId, nodeData]: [string, any]) => {
            nodesMap.set(nodeId, {
              id: nodeData.id,
              type: nodeData.type,
              moveId: nodeData.moveId,
              moveName: nodeData.moveName,
              command: nodeData.command,
              freeText: nodeData.freeText,
              backgroundColor: nodeData.backgroundColor,
              children: nodeData.children
            });
          });
          
          setNodes(nodesMap);
          setRootNodeIds(treeData.rootIds);
        } catch (error) {
          console.error('ノードデータの復元エラー:', error);
        }
      }
    } catch (error) {
      console.error('❌ コンボデータ取得エラー:', error);
      alert('コンボデータの取得に失敗しました');
      router.push('/combo/list');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchCharacters = async () => {
    try {
      const { data } = await client.models.Character.list({ authMode: 'apiKey' });
      const validChars = (data || []).filter(c => c !== null) as Character[];
      const sorted = validChars.sort((a, b) => {
        const idA = String(a.character_id).padStart(3, '0');
        const idB = String(b.character_id).padStart(3, '0');
        return idA.localeCompare(idB);
      });
      setCharacters(sorted);
    } catch (error) {
      console.error('❌ キャラクター取得エラー:', error);
    }
  };

  const fetchMoves = async (characterId: string) => {
    try {
      let allMoves: Move[] = [];
      let nextToken: string | null | undefined = undefined;
      
      do {
        const response: { data: any[]; nextToken?: string | null } = await client.models.Move.list({ 
          authMode: 'apiKey',
          limit: 1000,
          nextToken: nextToken
        });
        const pageMoves = (response.data || []).filter((m: any) => m !== null) as Move[];
        allMoves = [...allMoves, ...pageMoves];
        nextToken = response.nextToken;
      } while (nextToken);
      
      const charIdStr = String(characterId).trim();
      const validMoves = allMoves.filter(m => {
        const moveCharId = String(m.character_id).trim();
        const exactMatch = charIdStr === moveCharId;
        const numericMatch = parseInt(charIdStr) === parseInt(moveCharId);
        const paddedMatch = charIdStr.padStart(3, '0') === moveCharId.padStart(3, '0');
        return exactMatch || numericMatch || paddedMatch;
      });
      
      const sorted = validMoves.sort((a, b) => a.move_name.localeCompare(b.move_name));
      setMoves(sorted);
      setFilteredMoves([]);
    } catch (error) {
      console.error('❌ 技取得エラー:', error);
    }
  };

  const addCommandIcon = (code: string) => {
    setSelectedCommandIcons([...selectedCommandIcons, code]);
  };

  const removeLastCommandIcon = () => {
    setSelectedCommandIcons(selectedCommandIcons.slice(0, -1));
  };

  const clearCommandIcons = () => {
    setSelectedCommandIcons([]);
  };

  const generateNodeId = () => {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addRootNode = () => {
    const newNodeId = generateNodeId();
    const newNode: ComboNode = {
      id: newNodeId,
      type: 'move',
      backgroundColor: BACKGROUND_COLORS.blue,
      children: []
    };
    setNodes(new Map(nodes.set(newNodeId, newNode)));
    setRootNodeIds([...rootNodeIds, newNodeId]);
    setSelectedNodeId(newNodeId);
  };

  const addChildNode = () => {
    if (!selectedNodeId) {
      alert('親ノードを選択してください');
      return;
    }
    const parentNode = nodes.get(selectedNodeId);
    if (!parentNode) return;

    const newNodeId = generateNodeId();
    const newNode: ComboNode = {
      id: newNodeId,
      type: 'move',
      backgroundColor: BACKGROUND_COLORS.blue,
      children: []
    };

    const updatedParent = {
      ...parentNode,
      children: [...parentNode.children, newNodeId]
    };

    const newNodes = new Map(nodes);
    newNodes.set(newNodeId, newNode);
    newNodes.set(selectedNodeId, updatedParent);
    setNodes(newNodes);
    setSelectedNodeId(newNodeId);
  };

  const updateNodeType = (nodeId: string, type: 'move' | 'freetext') => {
    const node = nodes.get(nodeId);
    if (!node) return;
    const updatedNode: ComboNode = {
      ...node,
      type,
      moveId: undefined,
      moveName: undefined,
      command: undefined,
      freeText: undefined
    };
    setNodes(new Map(nodes.set(nodeId, updatedNode)));
  };

  const updateNodeMove = (nodeId: string, moveId: string) => {
    const node = nodes.get(nodeId);
    if (!node) return;
    const move = moves.find(m => m.id === moveId);
    if (!move) return;
    const updatedNode: ComboNode = {
      ...node,
      type: 'move',
      moveId: move.id,
      moveName: move.move_name,
      command: move.command || undefined,
      freeText: undefined
    };
    setNodes(new Map(nodes.set(nodeId, updatedNode)));
    setMoveSearchQuery('');
    setShowMoveDropdown(false);
  };

  const updateNodeFreeText = (nodeId: string, text: string) => {
    const node = nodes.get(nodeId);
    if (!node) return;
    const updatedNode: ComboNode = {
      ...node,
      type: 'freetext',
      moveId: undefined,
      moveName: undefined,
      command: undefined,
      freeText: text
    };
    setNodes(new Map(nodes.set(nodeId, updatedNode)));
  };

  const updateNodeColor = (nodeId: string, color: string) => {
    const node = nodes.get(nodeId);
    if (!node) return;
    const updatedNode = {
      ...node,
      backgroundColor: BACKGROUND_COLORS[color as keyof typeof BACKGROUND_COLORS]
    };
    setNodes(new Map(nodes.set(nodeId, updatedNode)));
  };

  const deleteNode = (nodeId: string) => {
    if (!confirm('このノードとその子孫を削除しますか?')) return;
    const deleteRecursive = (id: string, nodesToDelete: Set<string>) => {
      nodesToDelete.add(id);
      const node = nodes.get(id);
      if (node) {
        node.children.forEach(childId => deleteRecursive(childId, nodesToDelete));
      }
    };
    const nodesToDelete = new Set<string>();
    deleteRecursive(nodeId, nodesToDelete);
    const newNodes = new Map(nodes);
    nodesToDelete.forEach(id => newNodes.delete(id));
    newNodes.forEach((node, id) => {
      if (node.children.includes(nodeId)) {
        newNodes.set(id, {
          ...node,
          children: node.children.filter(cid => cid !== nodeId)
        });
      }
    });
    
    if (rootNodeIds.includes(nodeId)) {
      setRootNodeIds(rootNodeIds.filter(id => id !== nodeId));
    }
    
    setNodes(newNodes);
    setSelectedNodeId(null);
    setShowNodePopup(false);
  };

  const handleNodeClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setSelectedNodeId(nodeId);
    
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupPosition({
      x: rect.right + 10,
      y: rect.top
    });
    
    setPopupNodeId(nodeId);
    setShowNodePopup(true);
    
    const node = nodes.get(nodeId);
    if (node && node.moveName) {
      setMoveSearchQuery(node.moveName);
    } else {
      setMoveSearchQuery('');
    }
    setSelectedCommandIcons([]);
    setFilteredMoves([]);
  };

  const renderNode = (nodeId: string): React.ReactElement | null => {
    const node = nodes.get(nodeId);
    if (!node) return null;
    const isSelected = selectedNodeId === nodeId;
    const displayText = displayMode === 'move_name' 
      ? (node.moveName || node.freeText || '未設定')
      : (node.command || node.freeText || '未設定');
    
    const baseColor = node.backgroundColor || BACKGROUND_COLORS.blue;
    const rgbMatch = baseColor.match(/^#([A-Fa-f0-9]{6})$/);
    let backgroundColor = 'rgba(59, 130, 246, 0.5)';
    let borderColor = 'rgba(59, 130, 246, 0.4)';
    
    if (rgbMatch) {
      const hex = rgbMatch[1];
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      backgroundColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
      borderColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
    }
    
    return (
      <div 
        onClick={(e) => handleNodeClick(node.id, e)}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: backgroundColor,
          border: isSelected ? '3px solid #ef4444' : `2px solid ${borderColor}`, 
          borderRadius: '30px',
          cursor: 'pointer', 
          boxShadow: isSelected ? '0 4px 12px rgba(239, 68, 68, 0.4)' : '0 2px 6px rgba(0,0,0,0.2)', 
          transition: 'all 0.2s', 
          color: '#ffffff',
          fontWeight: '600', 
          fontSize: '14px',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          userSelect: 'none'
        }}
      >
        <TextWithIcons text={displayText} size="sm" textClassName="font-semibold text-white" showFallback={false} enableIconReplacement={true} />
      </div>
    );
  };

  const renderTree = (nodeId: string, depth: number = 0): React.ReactElement | null => {
    const node = nodes.get(nodeId);
    if (!node) return null;
    
    if (node.children.length === 1) {
      return (
        <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: depth === 0 ? '20px' : '0' }}>
          {renderNode(node.id)}
          <div style={{ color: '#6b7280', fontSize: '24px', fontWeight: 'bold' }}>＜</div>
          {renderTree(node.children[0], depth + 1)}
        </div>
      );
    }
    
    if (node.children.length > 1) {
      return (
        <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: depth === 0 ? '20px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {renderNode(node.id)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {node.children.map((childId) => (
              <div key={childId} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#6b7280', fontSize: '24px', fontWeight: 'bold' }}>＜</div>
                {renderTree(childId, depth + 1)}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div key={node.id} style={{ marginBottom: depth === 0 ? '20px' : '0' }}>
        {renderNode(node.id)}
      </div>
    );
  };

  const saveCombo = async () => {
    if (!selectedCharacterId) {
      alert('キャラクターを選択してください');
      return;
    }
    if (rootNodeIds.length === 0) {
      alert('コンボツリーを作成してください');
      return;
    }
    setLoading(true);
    try {
      const character = characters.find(c => c.character_id === selectedCharacterId);
      const characterName = character?.display_name || character?.character_name_jp || character?.character_name_en || '';
      const nodesObject: { [key: string]: any } = {};
      nodes.forEach((node, id) => {
        nodesObject[id] = {
          id: node.id,
          type: node.type,
          moveId: node.moveId,
          moveName: node.moveName,
          command: node.command,
          freeText: node.freeText,
          backgroundColor: node.backgroundColor,
          children: node.children
        };
      });
      
      const treeData = { 
        rootIds: rootNodeIds,
        nodes: nodesObject 
      };
      
      // ✅ userPool に変更（Combo モデルは owner 認証が必要）
      await client.models.Combo.update({
        id: comboId,
        character_id: selectedCharacterId,
        character_name: characterName,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        category: category || undefined,
        difficulty: difficulty > 0 ? difficulty : undefined,
        damage: damage ? parseInt(damage) : undefined,
        importance: importance > 0 ? importance : undefined,
        nodes: JSON.stringify(treeData),
        display_mode: displayMode
      }, { authMode: 'userPool' });
      
      alert('コンボを更新しました!');
      router.push('/combo/list');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (char: Character) => {
    return char.display_name || char.character_name_jp || char.character_name_en;
  };

  const popupNode = popupNodeId ? nodes.get(popupNodeId) : null;

  if (initialLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ffffff', fontSize: '18px' }}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #1a0505 50%, #000000 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '2px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>コンボ編集</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href="/combo/list" style={{ padding: '10px 20px', background: 'rgba(59, 130, 246, 0.3)', border: '2px solid rgba(59, 130, 246, 0.5)', borderRadius: '6px', color: '#60a5fa', textDecoration: 'none', fontWeight: 'bold' }}>一覧</a>
            <a href="/" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '6px', color: '#ffffff', textDecoration: 'none', fontWeight: 'bold' }}>トップ</a>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px' }}>
          {/* 左パネル */}
          <div style={{ background: 'rgba(0, 0, 0, 0.8)', border: '2px solid rgba(185, 28, 28, 0.3)', borderRadius: '8px', padding: '20px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>キャラクター *</label>
              <select value={selectedCharacterId} onChange={(e) => setSelectedCharacterId(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '14px' }}>
                <option value="">選択してください</option>
                {characters.map(char => <option key={char.id} value={char.character_id}>{getDisplayName(char)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>タイトル</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: 右アッパー始動" style={{ width: '100%', padding: '10px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>分類</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '14px' }}>
                {COMBO_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>説明</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '14px', resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>難易度</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(level => (
                  <button key={level} onClick={() => setDifficulty(level)} style={{ padding: '8px 16px', background: difficulty === level ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${difficulty === level ? '#ef4444' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: difficulty === level ? '#fca5a5' : '#9ca3af', fontWeight: 'bold', cursor: 'pointer' }}>{level}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>ダメージ</label>
              <input type="number" value={damage} onChange={(e) => setDamage(e.target.value)} placeholder="数値" style={{ width: '100%', padding: '10px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>重要度</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map(level => (
                  <button key={level} onClick={() => setImportance(level)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '28px', color: level <= importance ? '#fbbf24' : '#4b5563', padding: '4px' }}>★</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fca5a5', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>表示モード</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setDisplayMode('move_name')} style={{ flex: 1, padding: '10px', background: displayMode === 'move_name' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${displayMode === 'move_name' ? '#3b82f6' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: displayMode === 'move_name' ? '#60a5fa' : '#9ca3af', fontWeight: 'bold', cursor: 'pointer' }}>技名</button>
                <button onClick={() => setDisplayMode('command')} style={{ flex: 1, padding: '10px', background: displayMode === 'command' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${displayMode === 'command' ? '#3b82f6' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: displayMode === 'command' ? '#60a5fa' : '#9ca3af', fontWeight: 'bold', cursor: 'pointer' }}>コマンド</button>
              </div>
            </div>
            <hr style={{ border: '1px solid rgba(185, 28, 28, 0.3)', margin: '20px 0' }} />
            <button onClick={saveCombo} disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? 'rgba(107, 114, 128, 0.3)' : 'linear-gradient(135deg, #dc2626, #991b1b)', border: 'none', borderRadius: '6px', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>{loading ? '保存中...' : '更新'}</button>
          </div>
          
          {/* 右パネル */}
          <div style={{ background: 'rgba(0, 0, 0, 0.8)', border: '2px solid rgba(185, 28, 28, 0.3)', borderRadius: '8px', padding: '20px', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#fca5a5', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>コンボツリー</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={addRootNode} style={{ padding: '8px 16px', background: 'rgba(34, 197, 94, 0.3)', border: '2px solid rgba(34, 197, 94, 0.5)', borderRadius: '4px', color: '#86efac', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>+ ルート</button>
                <button onClick={addChildNode} disabled={!selectedNodeId} style={{ padding: '8px 16px', background: selectedNodeId ? 'rgba(34, 197, 94, 0.3)' : 'rgba(107, 114, 128, 0.3)', border: '2px solid rgba(34, 197, 94, 0.5)', borderRadius: '4px', color: selectedNodeId ? '#86efac' : '#6b7280', fontSize: '13px', fontWeight: 'bold', cursor: selectedNodeId ? 'pointer' : 'not-allowed' }}>+ 子ノード</button>
              </div>
            </div>
            {rootNodeIds.length > 0 ? (
              <div>
                {rootNodeIds.map(rootId => renderTree(rootId, 0))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280', fontSize: '16px' }}>「+ ルート」ボタンでノードを追加してください</div>
            )}
          </div>
        </div>
      </div>

      {/* ポップアップ */}
      {showNodePopup && popupNode && popupNodeId && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed',
            left: `${Math.min(popupPosition.x, window.innerWidth - 450)}px`,
            top: `${Math.min(popupPosition.y, window.innerHeight - 600)}px`,
            width: '400px',
            maxHeight: '550px',
            background: 'rgba(0, 0, 0, 0.95)',
            border: '2px solid rgba(185, 28, 28, 0.5)',
            borderRadius: '8px',
            padding: '20px',
            zIndex: 1000,
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ color: '#fca5a5', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>ノード編集</h4>
            <button onClick={() => setShowNodePopup(false)} style={{ background: 'rgba(185, 28, 28, 0.3)', border: '1px solid rgba(185, 28, 28, 0.5)', borderRadius: '50%', width: '28px', height: '28px', color: '#fca5a5', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>タイプ</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => updateNodeType(popupNodeId, 'move')} style={{ flex: 1, padding: '8px', background: popupNode.type === 'move' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${popupNode.type === 'move' ? '#22c55e' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: popupNode.type === 'move' ? '#86efac' : '#9ca3af', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>技</button>
              <button onClick={() => updateNodeType(popupNodeId, 'freetext')} style={{ flex: 1, padding: '8px', background: popupNode.type === 'freetext' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${popupNode.type === 'freetext' ? '#22c55e' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: popupNode.type === 'freetext' ? '#86efac' : '#9ca3af', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>自由入力</button>
            </div>
          </div>
          {popupNode.type === 'move' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>技検索</label>
              {!selectedCharacterId ? (
                <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#fca5a5', fontSize: '13px', textAlign: 'center' }}>キャラクターを選択してください</div>
              ) : moves.length === 0 ? (
                <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#fca5a5', fontSize: '13px', textAlign: 'center' }}>このキャラクターの技が見つかりません</div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button onClick={() => setSearchMode('name')} style={{ flex: 1, padding: '6px', background: searchMode === 'name' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${searchMode === 'name' ? '#3b82f6' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: searchMode === 'name' ? '#60a5fa' : '#9ca3af', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>技名で探す</button>
                    <button onClick={() => setSearchMode('command')} style={{ flex: 1, padding: '6px', background: searchMode === 'command' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.4)', border: `2px solid ${searchMode === 'command' ? '#3b82f6' : 'rgba(185, 28, 28, 0.3)'}`, borderRadius: '4px', color: searchMode === 'command' ? '#60a5fa' : '#9ca3af', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>コマンドで探す</button>
                  </div>
                  {searchMode === 'name' ? (
                    <div style={{ position: 'relative' }}>
                      <input ref={searchInputRef} type="text" value={moveSearchQuery} onChange={(e) => { setMoveSearchQuery(e.target.value); setShowMoveDropdown(true); }} placeholder="技名またはコマンドで検索..." style={{ width: '100%', padding: '8px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '13px' }} />
                      {showMoveDropdown && moveSearchQuery.trim() && filteredMoves.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.95)', border: '2px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', marginTop: '4px', zIndex: 1001, boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                          {filteredMoves.map(move => (
                            <div key={move.id} onClick={() => updateNodeMove(popupNodeId, move.id)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid rgba(185, 28, 28, 0.2)', transition: 'background 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                              <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>{move.move_name}</div>
                              {move.command && <div style={{ color: '#9ca3af', fontSize: '11px' }}><TextWithIcons text={move.command} size="sm" showFallback={false} enableIconReplacement={true} /></div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ padding: '8px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', marginBottom: '8px', minHeight: '36px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        {selectedCommandIcons.length === 0 ? <span style={{ color: '#6b7280', fontSize: '13px' }}>アイコンを選択...</span> : <TextWithIcons text={selectedCommandIcons.join(' ')} size="sm" showFallback={false} enableIconReplacement={true} />}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        <button onClick={removeLastCommandIcon} disabled={selectedCommandIcons.length === 0} style={{ flex: 1, padding: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', color: '#fca5a5', fontSize: '11px', cursor: selectedCommandIcons.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedCommandIcons.length === 0 ? 0.5 : 1 }}>← 戻る</button>
                        <button onClick={clearCommandIcons} disabled={selectedCommandIcons.length === 0} style={{ flex: 1, padding: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', color: '#fca5a5', fontSize: '11px', cursor: selectedCommandIcons.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedCommandIcons.length === 0 ? 0.5 : 1 }}>クリア</button>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>方向</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          {COMMAND_ICONS.directions.map((icon, index) => (
                            icon.code ? <button key={icon.code} onClick={() => addCommandIcon(icon.code!)} style={{ padding: '8px 4px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={icon.label}><TextWithIcons text={icon.code} size="sm" showFallback={true} enableIconReplacement={true} /></button> : <div key={`empty-${index}`} style={{ padding: '8px 4px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(185, 28, 28, 0.2)', borderRadius: '4px' }}></div>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>攻撃ボタン</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          {COMMAND_ICONS.buttons.map((icon, index) => (
                            icon.code ? <button key={icon.code} onClick={() => addCommandIcon(icon.code!)} style={{ padding: '8px 4px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={icon.label}><TextWithIcons text={icon.code} size="sm" showFallback={true} enableIconReplacement={true} /></button> : <div key={`empty-btn-${index}`} style={{ padding: '8px 4px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(185, 28, 28, 0.2)', borderRadius: '4px' }}></div>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>その他</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                          {COMMAND_ICONS.others.map(icon => (
                            <button key={icon.code} onClick={() => addCommandIcon(icon.code)} style={{ padding: '8px 4px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '9px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={icon.label}><TextWithIcons text={icon.code} size="sm" showFallback={true} enableIconReplacement={true} /></button>
                          ))}
                        </div>
                      </div>
                      {filteredMoves.length > 0 && (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.95)', border: '2px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', marginTop: '8px' }}>
                          <div style={{ padding: '8px', background: 'rgba(185, 28, 28, 0.2)', borderBottom: '1px solid rgba(185, 28, 28, 0.4)', color: '#fca5a5', fontSize: '11px', fontWeight: 'bold' }}>{filteredMoves.length}件の技が見つかりました</div>
                          {filteredMoves.map(move => (
                            <div key={move.id} onClick={() => updateNodeMove(popupNodeId, move.id)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid rgba(185, 28, 28, 0.2)', transition: 'background 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                              <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold', marginBottom: '2px' }}>{move.move_name}</div>
                              {move.command && <div style={{ color: '#9ca3af', fontSize: '11px' }}><TextWithIcons text={move.command} size="sm" showFallback={false} enableIconReplacement={true} /></div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {popupNode.type === 'freetext' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>テキスト</label>
              <input type="text" value={popupNode.freeText || ''} onChange={(e) => updateNodeFreeText(popupNodeId, e.target.value)} placeholder="自由入力" style={{ width: '100%', padding: '8px', background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(185, 28, 28, 0.4)', borderRadius: '4px', color: '#ffffff', fontSize: '13px' }} />
            </div>
          )}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '13px', marginBottom: '6px' }}>背景色</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {Object.entries(BACKGROUND_COLORS).map(([colorName, colorHex]) => {
                const rgbMatch = colorHex.match(/^#([A-Fa-f0-9]{6})$/);
                let displayColor = 'rgba(59, 130, 246, 0.5)';
                if (rgbMatch) {
                  const hex = rgbMatch[1];
                  const r = parseInt(hex.substr(0, 2), 16);
                  const g = parseInt(hex.substr(2, 2), 16);
                  const b = parseInt(hex.substr(4, 2), 16);
                  displayColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
                }
                const isSelected = popupNode.backgroundColor === colorHex;
                return (
                  <button key={colorName} onClick={() => updateNodeColor(popupNodeId, colorName)} style={{ width: '100%', height: '32px', background: displayColor, border: `3px solid ${isSelected ? '#3b82f6' : '#6b7280'}`, borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }} title={colorName} />
                );
              })}
            </div>
          </div>
          <button onClick={() => deleteNode(popupNodeId)} style={{ width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.3)', border: '2px solid rgba(239, 68, 68, 0.5)', borderRadius: '4px', color: '#fca5a5', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>ノードを削除</button>
          <button onClick={() => setShowNodePopup(false)} style={{ width: '100%', padding: '10px', background: 'rgba(107, 114, 128, 0.3)', border: '2px solid rgba(107, 114, 128, 0.5)', borderRadius: '4px', color: '#9ca3af', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>閉じる</button>
        </div>
      )}
    </div>
  );
}
