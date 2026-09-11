// src/app/admin/page.tsx (管理者概要ページ)
'use client';

import { useState, useEffect } from 'react';
import { client } from '@/lib/client';
import { AuthWrapper } from '@/components/AuthWrapper';

export default function AdminPage() {
  const [stats, setStats] = useState({
    characters: 0,
    categories: 0,
    moves: 0,
    effects: 0,
    loading: true
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [charactersResult, categoriesResult, movesResult, effectsResult] = await Promise.all([
        client.models.Character.list({ authMode: 'apiKey' }),
        client.models.MoveCategory.list({ authMode: 'apiKey' }),
        client.models.Move.list({ authMode: 'apiKey', limit: 1000 }),
        client.models.Effect.list({ authMode: 'apiKey' })
      ]);

      setStats({
        characters: (charactersResult.data || []).filter(c => c !== null).length,
        categories: (categoriesResult.data || []).filter(c => c !== null).length,
        moves: (movesResult.data || []).filter(m => m !== null).length,
        effects: (effectsResult.data || []).filter(e => e !== null).length,
        loading: false
      });
    } catch (error) {
      console.error('統計データ取得エラー:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <AuthWrapper>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
          <a 
            href="/"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            トップページへ
          </a>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">キャラクター</h3>
            <div className="text-3xl font-bold text-blue-600">
              {stats.loading ? '...' : stats.characters}
            </div>
            <p className="text-sm text-gray-500">登録済み</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">技分類</h3>
            <div className="text-3xl font-bold text-green-600">
              {stats.loading ? '...' : stats.categories}
            </div>
            <p className="text-sm text-gray-500">カテゴリ数</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">技データ</h3>
            <div className="text-3xl font-bold text-purple-600">
              {stats.loading ? '...' : stats.moves}
            </div>
            <p className="text-sm text-gray-500">総技数</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">エフェクト</h3>
            <div className="text-3xl font-bold text-orange-600">
              {stats.loading ? '...' : stats.effects}
            </div>
            <p className="text-sm text-gray-500">マスタ数</p>
          </div>
        </div>

        {/* 管理機能 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* エフェクト管理 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              エフェクト管理
            </h3>
            <p className="text-gray-600 mb-4">
              技の属性アイコンマスタデータの管理
            </p>
            <a 
              href="/admin/effects"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition-colors"
            >
              管理画面へ
            </a>
          </div>

          {/* データベース状態 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              データベース状態
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>キャラクター密度:</span>
                <span className="font-semibold">
                  {stats.moves > 0 && stats.characters > 0 
                    ? Math.round(stats.moves / stats.characters) + '技/人' 
                    : '計算中'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>エフェクト使用率:</span>
                <span className="font-semibold">
                  {stats.effects > 0 ? Math.round((stats.effects / 8) * 100) + '%' : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* システム情報 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              システム情報
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>データ更新:</span>
                <span className="text-green-600 font-semibold">正常</span>
              </div>
              <div className="flex justify-between">
                <span>認証状態:</span>
                <span className="text-green-600 font-semibold">有効</span>
              </div>
            </div>
          </div>
        </div>

        {/* コマンドラインツール案内 */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            コマンドラインツール
          </h3>
          <p className="text-gray-600 mb-4">
            データの一括操作は以下のコマンドで実行できます：
          </p>
          
          <div className="space-y-3">
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
              <div className="mb-2 text-gray-300"># キャラクターデータ</div>
              <div>npm run character-csv validate character.csv</div>
              <div>npm run character-csv import character.csv --replace-all</div>
            </div>
            
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
              <div className="mb-2 text-gray-300"># 技分類マスタ</div>
              <div>npm run move-category import categories.csv</div>
            </div>
            
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
              <div className="mb-2 text-gray-300"># 技データ</div>
              <div>npm run move-csv import moves.csv --replace-all</div>
            </div>
            
            <div className="bg-black text-green-400 p-3 rounded font-mono text-sm">
              <div className="mb-2 text-gray-300"># エフェクトマスタ</div>
              <div>npm run create-effect-master</div>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            ⚠️ 重要な注意事項
          </h3>
          <ul className="list-disc list-inside text-yellow-700 space-y-1">
            <li>--replace-all オプションは既存データを完全に削除します</li>
            <li>本番環境でのデータ操作前には必ずバックアップを作成してください</li>
            <li>CSVファイルは UTF-8 エンコーディングで保存してください</li>
            <li>エフェクトアイコンは /public/effect-icons/ に配置してください</li>
          </ul>
        </div>
      </div>
    </AuthWrapper>
  );
}