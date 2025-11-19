import React, { useState, KeyboardEvent, useMemo } from 'react';
import { Plus, X, Search, History } from 'lucide-react';
import { SAMPLE_QUERIES } from '../constants';

interface InputAreaProps {
  onGenerate: (items: string[]) => void;
  isLoading: boolean;
  defaultItems?: string[];
  recentSearches?: string[][];
}

export const InputArea: React.FC<InputAreaProps> = ({
  onGenerate,
  isLoading,
  defaultItems = [],
  recentSearches = []
}) => {
  const [inputValue, setInputValue] = useState('');
  const [items, setItems] = useState<string[]>(defaultItems);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addItem();
    }
  };

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems([...items, trimmed]);
      setInputValue('');
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    if (items.length > 0) {
      onGenerate(items);
    }
  };

  const loadSample = (sample: string[]) => {
    setItems(sample);
  };

  const displaySuggestions = useMemo(() => {
    const all = [...recentSearches, ...SAMPLE_QUERIES];
    const unique: string[][] = [];
    const seen = new Set<string>();

    for (const item of all) {
      const key = [...item].sort().join('|').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique;
  }, [recentSearches]);

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">What Happened When...</h1>
        <p className="text-slate-500 text-lg">Merge histories. Discover connections.</p>
      </div>

      {/* Active Tags */}
      <div className="flex flex-wrap gap-2 mb-5 min-h-[2.5rem]">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm animate-fade-in border border-slate-200">
            <span>{item}</span>
            <button
              onClick={() => removeItem(index)}
              className="p-0.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              disabled={isLoading}
            >
              <X size={14} />
            </button>
          </div>
        ))}

      </div>

      {/* Input Field */}
      <div className="relative flex items-center mb-8 group">
        <div className="absolute left-4 text-slate-400 group-focus-within:text-slate-900 transition-colors">
          <Plus size={20} />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type and press Enter..."
          disabled={isLoading}
          className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 text-lg"
        />
        <button
          onClick={addItem}
          disabled={!inputValue.trim() || isLoading}
          className="absolute right-2.5 p-2 bg-white text-slate-400 hover:text-brand-600 rounded-lg border border-slate-200 hover:border-brand-200 transition-all disabled:opacity-50 hover:shadow-sm"
        >
          <span className="sr-only">Add</span>
          <Plus size={20} />
        </button>
      </div>

      {/* Action Button */}
      <button
        onClick={handleGenerate}
        disabled={items.length === 0 || isLoading}
        className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-lg transition-all duration-300 ${items.length > 0 && !isLoading
          ? 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-xl shadow-slate-200/50'
          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Weaving Timelines...</span>
          </>
        ) : (
          <>
            <Search size={20} />
            <span>Generate Timeline</span>
          </>
        )}
      </button>

      {/* Quick Samples / History */}
      {!isLoading && displaySuggestions.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">History</p>
          <div className="flex flex-wrap justify-center gap-2 max-h-[7.5rem] overflow-hidden">
            {displaySuggestions.map((sample, i) => (
              <button
                key={i}
                onClick={() => loadSample(sample)}
                className="text-xs flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-600 text-slate-600 rounded-lg transition-all hover:shadow-sm"
              >
                <History size={12} />
                {sample.join(' + ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};