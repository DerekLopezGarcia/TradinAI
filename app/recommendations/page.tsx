'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { NavBar } from '@/components/NavBar';
import { RecommendationsPanel } from '@/components/RecommendationsPanel';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function RecommendationsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header />
      <NavBar selectedType={selectedType} onTypeChange={setSelectedType} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="p-4 md:p-6 space-y-6">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('page.backToCharts')}
        </button>

        <RecommendationsPanel />
      </main>
    </div>
  );
}

