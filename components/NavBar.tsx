'use client';

import { useState } from 'react';
import { Search, Plus, X, Heart, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { Asset } from '@/lib/types';

interface NavBarProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function NavBar({
  selectedType,
  onTypeChange,
  searchQuery,
  onSearchChange,
}: NavBarProps) {
  const { assets, addAsset, toggleFavorite } = useMarketStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('stock');
  const [showFavorites, setShowFavorites] = useState(false);

  const assetTypes = [
    { value: 'crypto', label: '🪙 Criptos', color: 'from-purple-500 to-purple-600' },
    { value: 'stock', label: '📈 Acciones', color: 'from-blue-500 to-blue-600' },
    { value: 'index', label: '📊 Índices', color: 'from-green-500 to-green-600' },
    { value: 'forex', label: '💱 Forex', color: 'from-orange-500 to-orange-600' },
    { value: 'commodity', label: '🛢️ Materiales', color: 'from-yellow-500 to-yellow-600' },
  ];

  const favoriteAssets = assets.filter(a => a.isFavorite);

  const handleAddAsset = () => {
    if (newSymbol.trim() && newName.trim()) {
      addAsset({
        symbol: newSymbol.toUpperCase(),
        name: newName,
        type: newType,
      });
      setNewSymbol('');
      setNewName('');
      setNewType('stock');
      setShowAddModal(false);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-cyan-500/20 px-6 py-4">
        {/* Primera fila: Título y botón agregar */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Mercados</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg transition-all shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            Agregar Valor
          </button>
        </div>

        {/* Segunda fila: Búsqueda */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar símbolo o nombre..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Tercera fila: Filtros por tipo */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => onTypeChange(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-semibold ${
              selectedType === null
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📋 Todos ({assets.length})
          </button>

          {assetTypes.map((type) => {
            const count = assets.filter(a => a.type === type.value).length;
            return (
              <button
                key={type.value}
                onClick={() => onTypeChange(type.value)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all text-sm font-semibold ${
                  selectedType === type.value
                    ? `bg-gradient-to-r ${type.color} text-white shadow-lg`
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {type.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Sección de Favoritos - Mostrable */}
      {favoriteAssets.length > 0 && (
        <div className="bg-slate-900/50 border-b border-cyan-500/10 px-6 py-3">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold mb-2"
          >
            ⭐ Favoritos ({favoriteAssets.length})
            <span className={`transition-transform ${showFavorites ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showFavorites && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
              {favoriteAssets.map((asset) => {
                const isPositive = asset.changePercent >= 0;
                return (
                  <div
                    key={asset.id}
                    className="bg-slate-800/50 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-white text-sm">{asset.symbol}</p>
                      <button
                        onClick={() => toggleFavorite(asset.symbol)}
                        className="p-1 hover:bg-slate-700/50 rounded"
                      >
                        <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-1 truncate">{asset.name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">${asset.price.toFixed(2)}</p>
                      <p className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal para agregar nuevo activo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Agregar Nuevo Valor</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-cyan-400 mb-2">Símbolo</label>
                <input
                  type="text"
                  placeholder="Ej: TSLA, NVDA, BTC"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-cyan-400 mb-2">Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: Tesla Inc., NVIDIA, Bitcoin"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-cyan-400 mb-2">Tipo</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="stock">📈 Acción</option>
                  <option value="crypto">🪙 Criptomoneda</option>
                  <option value="index">📊 Índice</option>
                  <option value="forex">💱 Forex</option>
                  <option value="commodity">🛢️ Material</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddAsset}
                  disabled={!newSymbol.trim() || !newName.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

