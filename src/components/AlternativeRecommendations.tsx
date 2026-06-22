import React from 'react';
import { AlternativeMeal } from '../types';
import { ALLERGENS, getAllergenInfoTip } from '../data/allergenMap';
import { ArrowLeft, Sparkles, CheckCircle, Lightbulb, ChefHat } from 'lucide-react';

interface AlternativeRecommendationsProps {
  foodName: string;
  allergens: string[];
  alternatives: AlternativeMeal[];
  onBackToScan: () => void;
  userAllergies: string[];
}

export default function AlternativeRecommendations({
  foodName,
  allergens,
  alternatives,
  onBackToScan,
  userAllergies
}: AlternativeRecommendationsProps) {

  // Get matching user allergies that caused the warning
  const triggeredAllergies = allergens.filter(a => userAllergies.includes(a));

  return (
    <div id="recs-wrapper" className="space-y-8 pb-12">
      {/* HEADER ROW */}
      <div className="flex items-center gap-3">
        <button
          id="btn-recs-back"
          onClick={onBackToScan}
          className="border border-slate-200 hover:bg-slate-50 text-slate-600 p-2.5 rounded-xl cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 id="recs-title" className="text-2xl font-bold text-slate-850 flex items-center gap-2 text-slate-800">
            Safe Meal Recommendations 🇬🇭
          </h1>
          <p className="text-xs text-slate-500 font-sans">
            Alternatives tailored specifically to your active allergy warnings.
          </p>
        </div>
      </div>

      {/* DISH STATEMENT BAR */}
      <div id="unwanted-source-bar" className="bg-red-50/50 border border-red-150 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none font-mono">Unsafe dish scanned</p>
          <p className="text-lg font-bold text-red-950 capitalize mt-1 class-name">{foodName}</p>
          <p className="text-xs text-red-800 leading-normal font-medium mt-1 font-sans">
            Contains: {triggeredAllergies.map(a => {
              const conf = ALLERGENS.find(al => al.key === a);
              return `${conf?.emoji || ''} ${conf?.label || a}`;
            }).join(', ')} which conflicts with your settings.
          </p>
        </div>
        <button
          id="btn-recs-scan-another"
          onClick={onBackToScan}
          className="bg-slate-800 hover:bg-slate-900 font-bold text-white text-xs px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer text-center"
        >
          Scan Another Plate
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: SAFE REC LIST */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <h2 id="recs-list-headline" className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-blue-600" />
              Nutritionally Similar Safe Alternatives
            </h2>

            {alternatives.length === 0 ? (
              <div id="recs-empty-log" className="py-12 text-center text-slate-400">
                <ChefHat className="w-12 h-12 stroke-1 mx-auto opacity-50 mb-3" />
                <p className="text-sm font-bold text-slate-700">No specific local alternatives matching this food profile</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-normal">
                  Try double-checking individual ingredients manually with our "Ingredient Checker" tool tab.
                </p>
              </div>
            ) : (
              <div id="recs-grid-list" className="space-y-4">
                {alternatives.map((alt, index) => (
                  <div
                    key={index}
                    id={`rec-item-card-${index}`}
                    className="border border-slate-100 p-5 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-350 transition-all flex flex-col sm:flex-row gap-4 items-start"
                  >
                    {/* Number Badger */}
                    <div className="bg-blue-600 text-white font-bold w-7 h-7 rounded-lg text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>

                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800 text-base font-sans">{alt.name}</h3>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border border-emerald-100 select-none">
                          ✓ Verified Safe
                        </span>
                      </div>

                      {alt.ingredients && alt.ingredients.length > 0 && (
                        <p className="text-xs text-slate-550 leading-normal font-sans">
                          <span className="font-semibold text-slate-600">Ingredients:</span> {alt.ingredients.join(', ')}
                        </p>
                      )}

                      <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-[11px] text-slate-600 leading-relaxed font-sans font-medium">
                          <span className="font-semibold text-emerald-700">How/Why Safe:</span> {alt.whySafe}
                        </p>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RELEVANT OUTSIDE ADVISORIES */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500 animate-pulse" />
              Ghana Safe-Eating Guide
            </h2>

            <div id="advice-tipcards-list" className="space-y-4">
              {triggeredAllergies.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-slate-600">General Ghana Culinary Advice:</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    Ghanaian soups (Light Soup, Palm Nut, Groundnut, Okra) frequently use smoked fish and shrimp powder for richness. Communicate allergies explicitly at any chop bar.
                  </p>
                </div>
              ) : (
                triggeredAllergies.map((allergy) => (
                  <div key={allergy} className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1.5 shadow-2xs">
                    <p className="text-xs font-bold text-amber-900 border-b border-amber-100/50 pb-1.5 uppercase tracking-wide">
                      {ALLERGENS.find(a => a.key === allergy)?.label || allergy} Advisory
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed font-sans font-medium">
                      {getAllergenInfoTip(allergy)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex flex-col items-center text-center space-y-2">
              <p className="text-xs font-bold text-slate-800">Always ask!</p>
              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                Ghanaian street food vendors (especially Waakye, Jollof and Chop bar services) share massive prep utensils. Always double check if plates contain cross-residue of groundnut oils or fish extracts.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
