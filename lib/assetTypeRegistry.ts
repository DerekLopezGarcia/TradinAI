import { getCategories, getAssetsByCategory, getAssetDescription } from '@/lib/scannerAssets';

export interface AssetTypeConfig {
  value: string;
  label: string;
  icon: string;
  isScanner: boolean;
}

export const CATEGORY_ICONS: Record<string, string> = {
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

const ASSET_TYPES: AssetTypeConfig[] = [
  { value: 'favorites', label: 'Favoritos', icon: '⭐', isScanner: false },
];

const SCANNER_CATEGORIES: AssetTypeConfig[] = getCategories().map(cat => ({
  value: `scanner_${cat.toLowerCase().replace(/\s+/g, '_')}`,
  label: cat,
  icon: CATEGORY_ICONS[cat] || '📊',
  isScanner: true,
}));

export const ALL_ASSET_TYPES: AssetTypeConfig[] = [...ASSET_TYPES, ...SCANNER_CATEGORIES];

export function getAssetsForType(
  typeConfig: AssetTypeConfig,
  assets: any[],
  getScannerAssets: (categoryName: string) => any[],
): any[] {
  if (typeConfig.value === 'favorites') {
    return assets.filter((a: any) => a.isFavorite);
  }
  if (typeConfig.isScanner) {
    return getScannerAssets(typeConfig.label);
  }
  return assets.filter((a: any) => a.type === typeConfig.value);
}

export { getAssetDescription };
