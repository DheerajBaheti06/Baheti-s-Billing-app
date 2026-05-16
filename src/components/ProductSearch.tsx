import React, { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import { Search, Plus, X } from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';
import { useScrollLock } from '../hooks/useScrollLock';

interface ProductSearchProps {
  products: Product[];
  currentItems: string[]; // List of product IDs already in the basket
  onSelect: (product: Product) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ products, currentItems, onSelect }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  // Lock background scroll when search results are open
  useScrollLock(isOpen && query.length > 0);

  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: [
        { name: 'nameHi', weight: 0.7 },
        { name: 'nameEn', weight: 0.7 },
        { name: 'category', weight: 0.3 }
      ],
      threshold: 0.2, // More precise
      minMatchCharLength: 2,
      location: 0,
      distance: 100,
      includeMatches: true,
      useExtendedSearch: true,
    });
  }, [products]);

  const results = useMemo(() => {
    if (!query) return [];
    const fuseResults = fuse.search(query);
    return fuseResults
      .sort((a, b) => {
        const aName = a.item.nameHi.toLowerCase();
        const bName = b.item.nameHi.toLowerCase();
        const aEn = a.item.nameEn.toLowerCase();
        const bEn = b.item.nameEn.toLowerCase();
        const q = query.toLowerCase();

        const aStarts = aName.startsWith(q) || aEn.startsWith(q);
        const bStarts = bName.startsWith(q) || bEn.startsWith(q);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return (a.score || 0) - (b.score || 0);
      })
      .map(r => r.item)
      .slice(0, 8);
  }, [fuse, query]);

  return (
    <div className="relative w-full">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('productSearch')}
          className="w-full bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm dark:text-white dark:placeholder:text-gray-600"
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 max-h-80 overflow-y-auto overflow-x-hidden">
          {results.map((product) => {
            const isAdded = currentItems.includes(product.id);
            return (
              <button
                key={product.id}
                disabled={isAdded}
                onClick={() => {
                  onSelect(product);
                  setQuery('');
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex flex-col p-4 text-left border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors",
                  isAdded ? "opacity-60 bg-gray-50 cursor-not-allowed" : "hover:bg-primary/5 active:bg-primary/10"
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">{product.nameHi}</span>
                      {isAdded && (
                        <span className="text-[8px] font-black uppercase bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
                          Added
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none block mt-0.5">{product.nameEn}</span>
                  </div>
                  <span className="text-primary font-black shrink-0">₹{product.price}</span>
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{product.category}</span>
                  <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase shrink-0">per {product.unit}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
