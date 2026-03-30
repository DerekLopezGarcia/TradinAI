'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, X, Heart, ChevronDown, Loader2 } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { getCategories, getAssetsByCategory, getAssetDescription } from '@/lib/scannerAssets';
import { priceCache } from '@/lib/services/priceCache';
import { validateSymbol, createSafeParams } from '@/lib/services/validationService';

interface NavBarProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Favoritos': '⭐',
  'Criptomonedas': '₿',
  'Acciones': '📈',
  'Índices': '📊',
  'Forex': '💱',
  'Commodities': '🛢️',
  'Tecnología': '💻',
  'Bancos': '🏦',
  'Consumo': '🛒',
  'Salud': '⚕️',
  'Energía': '⚡',
  'Inmobiliario': '🏠',
  'Utilities': '🔌',
  'Telecomunicaciones': '📡',
  'Industriales': '🏭',
};

const ASSET_TYPES = [
  { value: 'favorites', label: 'Favoritos', emoji: '⭐', isScanner: false },
];

// Usar dinámicamente las categorías del scanner
const SCANNER_CATEGORIES = getCategories()
  .map(cat => ({
    value: `scanner_${cat.toLowerCase().replace(/\s+/g, '_')}`,
    label: cat,
    emoji: CATEGORY_ICONS[cat] || '📊',
    isScanner: true,
  }));

const ALL_ASSET_TYPES = [...ASSET_TYPES, ...SCANNER_CATEGORIES];

export function NavBar({ selectedType, searchQuery, onSearchChange }: NavBarProps) {
  const router = useRouter();
  const { assets, addAsset, toggleFavorite, setSelectedAsset, updateAssetPrice, addOrUpdateAssetPrice } = useMarketStore();
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


  // Estado para rastrear cuáles símbolos fallaron en la carga
  const [failedSymbols, setFailedSymbols] = useState<Set<string>>(new Set());
  const failedSymbolsRef = useRef<Map<string, Set<string>>>(new Map());

  // Cargar precios de los activos de un tipo cuando se abre su dropdown
  const fetchPricesForType = useCallback(async (type: string) => {
    if (loadedTypes.current.has(type)) return; // ya cargado, no refetch
    setLoadingType(type);
    const store = useMarketStore.getState();
    
    // Timeout de 18 segundos para la carga
    const timeoutId = setTimeout(() => {
      console.warn(`⏱️ Timeout en carga de ${type}`);
      setLoadingType(null);
      loadedTypes.current.add(type);
    }, 18000);

    try {
      const currentFailed = new Set<string>();
      failedSymbolsRef.current.set(type, currentFailed);

      if (type === 'favorites') {
        const list = store.assets.filter(a => a.isFavorite);
        await Promise.allSettled(list.map(async (asset) => {
          try {
            if (!validateSymbol(asset.symbol)) {
              currentFailed.add(asset.symbol);
              return;
            }
            
            const params = createSafeParams({
              symbol: asset.symbol.toUpperCase(),
              type: 'price'
            });
            
            const res = await fetch(`/api/market?${params.toString()}`);
            if (!res.ok) {
              currentFailed.add(asset.symbol);
              return;
            }
            const d = await res.json();
            
            // Validar que tenemos precio válido - más permisivo
            if (d?.price !== undefined && d?.price !== null && d?.price !== '') {
              const price = parseFloat(String(d.price));
              if (!isNaN(price)) {
                const change = parseFloat(String(d.change ?? 0));
                const changePercent = parseFloat(String(d.changePercent ?? 0));
                updateAssetPrice(asset.symbol, price, isNaN(change) ? 0 : change, isNaN(changePercent) ? 0 : changePercent);
              } else {
                currentFailed.add(asset.symbol);
              }
            } else {
              currentFailed.add(asset.symbol);
            }
          } catch { 
            currentFailed.add(asset.symbol);
          }
        }));
      } else if (type.startsWith('scanner_')) {
        // Es una categoría del scanner, cargar precios para esos símbolos con batching y caché
        const categoryName = ALL_ASSET_TYPES.find(t => t.value === type)?.label || '';
        const symbols = getAssetsByCategory(categoryName);
        
        // Separar en símbolos con caché y sin caché
        const symbolsToFetch: string[] = [];
        const cachedSymbols: [string, any][] = [];
        
        for (const symbol of symbols) {
          if (!validateSymbol(symbol)) {
            currentFailed.add(symbol);
            continue;
          }
          const cached = priceCache.get(symbol);
          if (cached) {
            cachedSymbols.push([symbol, cached]);
          } else {
            symbolsToFetch.push(symbol);
          }
        }
        
        // Actualizar los símbolos en caché primero
        for (const [symbol, data] of cachedSymbols) {
          addOrUpdateAssetPrice(symbol, symbol, data.price, data.change, data.changePercent, 'crypto');
        }
        
        // Cargar en lotes de 5 para evitar rate limiting
        const batchSize = 5;
        for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
          const batch = symbolsToFetch.slice(i, i + batchSize);
          
          await Promise.allSettled(batch.map(async (symbol: string) => {
            try {
              const params = createSafeParams({
                symbol: symbol.toUpperCase(),
                type: 'price'
              });
              
              const res = await fetch(`/api/market?${params.toString()}`);
              if (!res.ok) {
                currentFailed.add(symbol);
                return;
              }
              const d = await res.json();
              
              // Validar que tenemos precio válido - más permisivo
              if (d?.price !== undefined && d?.price !== null && d?.price !== '') {
                const price = parseFloat(String(d.price));
                if (!isNaN(price)) {
                  const change = parseFloat(String(d.change ?? 0));
                  const changePercent = parseFloat(String(d.changePercent ?? 0));
                  
                  // Guardar en caché
                  priceCache.set(symbol, price, isNaN(change) ? 0 : change, isNaN(changePercent) ? 0 : changePercent);
                  addOrUpdateAssetPrice(symbol, symbol, price, isNaN(change) ? 0 : change, isNaN(changePercent) ? 0 : changePercent, 'crypto');
                } else {
                  currentFailed.add(symbol);
                }
              } else {
                currentFailed.add(symbol);
              }
            } catch { 
              currentFailed.add(symbol);
            }
          }));
          
          // Delay entre lotes
          if (i + batchSize < symbolsToFetch.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } else {
        const list = store.assets.filter(a => a.type === type);
        
        await Promise.allSettled(list.map(async (asset) => {
          try {
            if (!validateSymbol(asset.symbol)) {
              currentFailed.add(asset.symbol);
              return;
            }
            
            const params = createSafeParams({
              symbol: asset.symbol.toUpperCase(),
              type: 'price'
            });
            
            const res = await fetch(`/api/market?${params.toString()}`);
            if (!res.ok) {
              currentFailed.add(asset.symbol);
              return;
            }
            const d = await res.json();
            
            // Validar que tenemos precio válido - más permisivo
            if (d?.price !== undefined && d?.price !== null && d?.price !== '') {
              const price = parseFloat(String(d.price));
              if (!isNaN(price)) {
                const change = parseFloat(String(d.change ?? 0));
                const changePercent = parseFloat(String(d.changePercent ?? 0));
                updateAssetPrice(asset.symbol, price, isNaN(change) ? 0 : change, isNaN(changePercent) ? 0 : changePercent);
              } else {
                currentFailed.add(asset.symbol);
              }
            } else {
              currentFailed.add(asset.symbol);
            }
          } catch { 
            currentFailed.add(asset.symbol);
          }
        }));
      }

      setFailedSymbols(currentFailed);
      loadedTypes.current.add(type);
      setLoadingType(null);
    } finally {
      clearTimeout(timeoutId);
    }
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
    // Buscar primero en el store
    let asset = assets.find(a => a.id === assetId);
    
    // Si no existe (es un activo del scanner), crearlo
    if (!asset) {
      // Extraer símbolo del ID (formato: scanner_CategoryName_SYMBOL)
      const parts = assetId.split('_');
      const symbol = parts[parts.length - 1]; // Último elemento es el símbolo
      
      if (symbol) {
        // Crear un asset temporal con los datos disponibles
        const existingAsset = assets.find(a => a.symbol === symbol);
        asset = {
          id: assetId,
          symbol,
          name: symbol,
          type: 'crypto', // tipo por defecto para activos del scanner
          price: existingAsset?.price ?? 0,
          change: existingAsset?.change ?? 0,
          changePercent: existingAsset?.changePercent ?? 0,
          isFavorite: existingAsset?.isFavorite ?? false,
        };
      }
    }
    
    if (asset) {
      setSelectedAsset(asset);
      setOpenDropdown(null);
      
      // Si estamos en otra página (como /recommendations), navegar a home
      const currentPath = window.location.pathname;
      if (currentPath !== '/') {
        router.push('/');
      }
    }
  };

  // Obtener activos del scanner para una categoría
  const getScannerAssets = useCallback((categoryName: string) => {
    const symbols = getAssetsByCategory(categoryName);
    const uniqueSymbols = Array.from(new Set(symbols));
    return uniqueSymbols.map((symbol: string, index: number) => {
      const existingAsset = assets.find(a => a.symbol === symbol);
      const assetInfo = getAssetDescription(symbol);
      return {
        id: `scanner_${categoryName.toLowerCase().replace(/\s+/g, '_')}_${index}_${symbol}`,
        symbol,
        name: assetInfo?.name || symbol,
        description: assetInfo?.description,
        type: 'scanner',
        price: existingAsset?.price ?? 0,
        change: existingAsset?.change ?? 0,
        changePercent: existingAsset?.changePercent ?? 0,
        isFavorite: existingAsset?.isFavorite ?? false,
      };
    });
  }, [assets]);

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
            {ALL_ASSET_TYPES.map((type) => {
              const list = type.value === 'favorites'
                ? assets.filter(a => a.isFavorite)
                : type.isScanner
                ? getScannerAssets(type.label)
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
                    {isLoading && !type.isScanner
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
                            filteredList.map((asset) => {
                              const isFailed = failedSymbolsRef.current.get(type.value)?.has(asset.symbol) ?? false;
                              return (
                                <div key={asset.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors group"
                                  onClick={() => !isFailed && handleSelectAsset(asset.id)}>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">{asset.symbol}</p>
                                    <p className="text-xs text-muted-foreground">{asset.name}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <div className="text-right">
                                      {isFailed ? (
                                        <p className="text-xs text-destructive font-medium">No cargó</p>
                                      ) : asset.price > 0 ? (
                                        <>
                                          <p className="text-xs font-mono font-bold text-foreground">${asset.price.toFixed(2)}</p>
                                          <p className={`text-xs font-bold ${asset.changePercent >= 0 ? 'price-up' : 'price-down'}`}>
                                            {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                                          </p>
                                        </>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">--</p>
                                      )}
                                    </div>
                                    {type.value === 'favorites' && (
                                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(asset.symbol); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all">
                                        <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
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
                  <option value="crypto">🪙 Criptomonedas</option>
                  <option value="stock">📈 Acciones</option>
                  <option value="forex">💱 Forex</option>
                  <option value="index">📊 Índices</option>
                  <option value="commodity">🛢️ Commodities</option>
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
