'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { NavBar } from '@/components/NavBar';
import { RecommendationsPanel } from '@/components/RecommendationsPanel';

export default function RecommendationsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header onMenuClick={() => {}} />
      <NavBar selectedType={selectedType} onTypeChange={setSelectedType} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="p-4 md:p-6">
        <RecommendationsPanel />
      </main>
    </div>
  );
}

