'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCategories } from '@/lib/scannerAssets';

interface CategoryScrollProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function CategoryScroll({ selectedCategory, onCategoryChange }: CategoryScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const categories = getCategories();

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  React.useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  return (
    <div className="flex items-center gap-2 bg-card/50 px-3 py-2 rounded-lg border border-border/50">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="p-1 hover:bg-muted/50 rounded transition-colors flex-shrink-0"
          title="Desplazar izquierda"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
        onScroll={checkScroll}
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(selectedCategory === category ? null : category)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors flex-shrink-0 font-medium ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 text-foreground hover:bg-muted/80'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="p-1 hover:bg-muted/50 rounded transition-colors flex-shrink-0"
          title="Desplazar derecha"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

