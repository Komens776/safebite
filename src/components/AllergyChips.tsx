import React from 'react';
import { ALLERGENS } from '../data/allergenMap';
import { AllergenKey } from '../types';
import { Check } from 'lucide-react';

interface AllergyChipsProps {
  selectedAllergies: string[];
  onChange: (allergy: string) => void;
}

export default function AllergyChips({ selectedAllergies, onChange }: AllergyChipsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {ALLERGENS.map((allergen) => {
        const isSelected = selectedAllergies.includes(allergen.key);
        return (
          <button
            key={allergen.key}
            type="button"
            id={`allergy-chip-${allergen.key}`}
            onClick={() => onChange(allergen.key)}
            className={`relative flex flex-col items-center justify-between p-4 rounded-2xl border transition-all hover:scale-102 text-center cursor-pointer ${
              isSelected
                ? 'bg-blue-50 border-blue-350 text-blue-900 shadow-2xs ring-2 ring-blue-500/10'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            {/* Active Tick Badge */}
            {isSelected && (
              <span className="absolute top-2 right-2 bg-blue-600 text-white p-0.5 rounded-full">
                <Check className="w-3 h-3" />
              </span>
            )}

            <span className="text-3xl mb-2" role="img" aria-label={allergen.label}>
              {allergen.emoji}
            </span>
            <span className="text-xs font-bold font-sans tracking-tight mb-1 truncate max-w-full">
              {allergen.label}
            </span>
            <p className="text-[10px] text-neutral-400 font-sans leading-tight line-clamp-2">
              {allergen.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
