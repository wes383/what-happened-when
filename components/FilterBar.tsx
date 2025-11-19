import React from 'react';
import { Check, EyeOff } from 'lucide-react';
import { EntityConfig } from '../types';

interface FilterBarProps {
  entityConfigs: EntityConfig[];
  onToggle: (name: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ entityConfigs, onToggle }) => {
  if (entityConfigs.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {entityConfigs.map((config) => (
        <button
          key={config.name}
          onClick={() => onToggle(config.name)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border shadow-sm
            ${config.isVisible 
              ? `${config.color.bg} ${config.color.text} ${config.color.border}` 
              : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
            }
          `}
        >
          <div className={`w-3 h-3 rounded-full flex items-center justify-center ${config.isVisible ? 'bg-white/50' : 'bg-slate-200'}`}>
            {config.isVisible ? <Check size={8} /> : <EyeOff size={8} />}
          </div>
          {config.name}
        </button>
      ))}
    </div>
  );
};