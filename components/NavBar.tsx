'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, X, Heart, ChevronDown, Loader2 } from 'lucide-react';
import { useMarketStore } from '@/lib/store';

interface NavBarProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ASSET_TYPES = [
  { value: 'favorites', label: 'Favoritos', emoji: '⭐' },
  { value: 'crypto',    label: 'Criptos',   emoji: '🪙' },
  { value: 'stock',     label: 'Acciones',  emoji: '📈' },
  { value: 'index',     label: 'Índices',   emoji: '📊' },
  { value: 'forex',     label: 'Forex',     emoji: '💱' },
  { value: 'commodity', label: 'Commodities', emoji: '🛢️' },
];

export function NavBar({ selectedType, searchQuery, onSearchChange }: NavBarProps) {
  const { assets, addAsset, toggleFavorite, setSelectedAsset, updateAssetPrice } = useMarketStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol]       = useState('');
  const [newName, setNewName]           = useState('');
  const [newType, setNewType]           = useState('stock');

  // Dropdown state: cuál tipo está abierto
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // Loading de precios por tipo
  const [loadingType, setLoadingType]   = useState<string | null>(null);
  // Precios ya cargados (evita refetch innecesario)
  const loadedTypes = useRef<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cargar precios de los activos de un tipo cuando se abre su dropdown
  const fetchPricesForType = useCallback(async (type: string) => {
    if (loadedTypes.current.has(type)) return; // ya cargado, no refetch
    setLoadingType(type);
    const store = useMarketStore.getState();
    const list = type === 'favorites'
      ? store.assets.filter(a => a.isFavorite)
      : store.assets.filter(a => a.type === type);

    await Promise.allSettled(list.map(async (asset) => {
      try {
        const res = await fetch(`/api/market?symbol=${asset.symbol}&type=price`);
        if (!res.ok) return;
        const d = await res.json();
        if (!d.price || isNaN(d.price)) return;
        updateAssetPrice(asset.symbol, d.price, d.change ?? 0, d.changePercent ?? 0);
      } catch { /* ignorar */ }
    }));

    loadedTypes.current.add(type);
    setLoadingType(null);
  }, [updateAssetPrice]);

  const handleToggleDropdown = (type: string) => {
    if (openDropdown === type) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(type);
      fetchPricesForType(type);
    }
  };

  const handleSelectAsset = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) { setSelectedAsset(asset); setOpenDropdown(null); }
  };

  const handleAddAsset = () => {
    if (newSymbol.trim() && newName.trim()) {
      addAsset({ symbol: newSymbol.toUpperCase(), name: newName, type: newType });
      setNewSymbol(''); setNewName(''); setShowAddModal(false);
    }
  };

  return (
    <>
      <div className="border-b border-border bg-card/50 px-4 py-2 transition-colors duration-300">
        <div className="flex items-center gap-3 flex-wrap">

          {/* Buscador */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          {/* Dropdowns por tipo */}
          <div ref={dropdownRef} className="flex items-center gap-1.5 flex-wrap relative">
            {ASSET_TYPES.map((type) => {
              const list = type.value === 'favorites'
                ? assets.filter(a => a.isFavorite)
                : assets.filter(a => a.type === type.value);

              const filteredList = searchQuery
                ? list.filter(a =>
                    a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                : list;

              if (list.length === 0) return null;
              const isOpen    = openDropdown === type.value;
              const isLoading = loadingType === type.value;
              const hasData   = loadedTypes.current.has(type.value);

              return (
                <div key={type.value} className="relative">
                  <button
                    onClick={() => handleToggleDropdown(type.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      isOpen || selectedType === type.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted text-foreground'
                    }`}
                  >
                    <span>{type.emoji}</span>
                    <span>{type.label}</span>
                    <span className="text-xs opacity-70">({list.length})</span>
                    {isLoading
                      ? <Loader2 className="w-3 h-3 animate-spin ml-0.5" />
                      : <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    }
                  </button>

                  {isOpen && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                      {/* Spinner mientras carga */}
                      {isLoading && !hasData ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cargando precios...
                        </div>
                      ) : (
                        <div className="max-h-64 overflow-y-auto py-1">
                          {filteredList.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-3 py-3">Sin resultados</p>
                          ) : (
                            filteredList.map((asset) => (
                              <div key={asset.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors group"
                                onClick={() => handleSelectAsset(asset.id)}>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{asset.symbol}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[100px]">{asset.name}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <div className="text-right">
                                    <p className="text-xs font-mono font-bold text-foreground">${asset.price.toFixed(2)}</p>
                                    <p className={`text-xs font-bold ${asset.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                                      {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                                    </p>
                                  </div>
                                  {type.value === 'favorites' && (
                                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.symbol); }}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all">
                                      <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botón Agregar */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Agregar Activo</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Símbolo</label>
                <input type="text" placeholder="Ej: TSLA, NVDA" value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre</label>
                <input type="text" placeholder="Ej: Tesla Inc." value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tipo</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {ASSET_TYPES.filter(t => t.value !== 'favorites').map((type) => (
                    <option key={type.value} value={type.value}>{type.emoji} {type.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">Cancelar</button>
                <button onClick={handleAddAsset} disabled={!newSymbol.trim() || !newName.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">Agregar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
