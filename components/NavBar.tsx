'use client';

import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { AssetToolbar } from '@/components/AssetToolbar';
import type { AssetType } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface NavBarProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function NavBar({ searchQuery, onSearchChange }: NavBarProps) {
  const { t } = useTranslation();
  const { addAsset } = useMarketStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol]       = useState('');
  const [newName, setNewName]           = useState('');
  const [newType, setNewType]           = useState<AssetType>('stock');

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

          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('navbar.search')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>

          <AssetToolbar selectedType={null} onTypeChange={() => {}} />

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('navbar.add')}
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">{t('navbar.addAsset')}</h3>
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
                <select value={newType} onChange={(e) => setNewType(e.target.value as AssetType)}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="crypto">🪙 {t('navbar.crypto')}</option>
                  <option value="stock">📈 {t('navbar.stocks')}</option>
                  <option value="forex">💱 {t('navbar.forex')}</option>
                  <option value="index">📊 {t('navbar.indices')}</option>
                  <option value="commodity">🛢️ {t('navbar.commodities')}</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors">{t('navbar.cancel')}</button>
                <button onClick={handleAddAsset} disabled={!newSymbol.trim() || !newName.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">{t('navbar.add')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
