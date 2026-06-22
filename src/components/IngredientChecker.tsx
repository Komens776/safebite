import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ALLERGENS, getAllergensForIngredient } from '../data/allergenMap';
import { SearchCode, HelpCircle, CheckCircle, AlertOctagon, RefreshCw, Layers, ListChecks, HeartCrack } from 'lucide-react';

interface IngredientCheckerProps {
  profile: UserProfile | null;
}

export default function IngredientChecker({ profile }: IngredientCheckerProps) {
  const [activeCheckTab, setActiveCheckTab] = useState<'single' | 'multiple'>('single');

  // Single Check State
  const [singleInput, setSingleInput] = useState('');
  const [singleResult, setSingleResult] = useState<{
    name: string;
    allergens: string[];
    isSafe: boolean;
    userWarnings: string[];
  } | null>(null);

  // Multiple Check State
  const [multiInput, setMultiInput] = useState('');
  const [multiResults, setMultiResults] = useState<{
    originalList: string[];
    details: { name: string; allergens: string[]; isSafe: boolean }[];
    dangerousItems: string[];
    allMatchedAllergens: string[];
    isSafeOverall: boolean;
  } | null>(null);

  const handleSingleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const query = singleInput.trim();
    if (!query) return;

    const detected = getAllergensForIngredient(query);
    const userAllergies = profile?.allergies || [];
    const matchedWarnings = detected.filter(a => userAllergies.includes(a));
    const isSafe = matchedWarnings.length === 0;

    setSingleResult({
      name: query,
      allergens: detected,
      isSafe,
      userWarnings: matchedWarnings
    });
  };

  const handleMultiCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const query = multiInput.trim();
    if (!query) return;

    // Split and clean ingredients list
    const items = query.split(',').map(i => i.trim()).filter(i => i.length > 0);
    const details: { name: string; allergens: string[]; isSafe: boolean }[] = [];
    const dangerousItems: string[] = [];
    const allMatchedAllergensSet = new Set<string>();

    const userAllergies = profile?.allergies || [];

    items.forEach((item) => {
      const matchAllergens = getAllergensForIngredient(item);
      const matchedWarnings = matchAllergens.filter(a => userAllergies.includes(a));
      const isItemSafe = matchedWarnings.length === 0;

      if (!isItemSafe) {
        dangerousItems.push(item);
        matchedWarnings.forEach(a => allMatchedAllergensSet.add(a));
      }

      details.push({
        name: item,
        allergens: matchAllergens,
        isSafe: isItemSafe
      });
    });

    const isSafeOverall = dangerousItems.length === 0;
    const allMatchedAllergens = Array.from(allMatchedAllergensSet);

    setMultiResults({
      originalList: items,
      details,
      dangerousItems,
      allMatchedAllergens,
      isSafeOverall
    });
  };

  const resetSingle = () => {
    setSingleInput('');
    setSingleResult(null);
  };

  const resetMulti = () => {
    setMultiInput('');
    setMultiResults(null);
  };

  return (
    <div id="checker-wrapper" className="space-y-8 pb-12">
      {/* Banner Area */}
      <div className="bg-white border border-slate-200 p-8 rounded-2xl text-slate-800 shadow-2xs">
        <h1 id="checker-header-title" className="text-3xl font-bold tracking-tight text-slate-900">
          Manual Ingredient & Recipe Checker <span className="text-base font-normal text-slate-400">🔍🧪</span>
        </h1>
        <p className="mt-2 text-slate-500 leading-relaxed text-sm max-w-2xl font-medium">
          Not sure about an ingredient like "momone", "koobi", "shito" or "nkatie"? Instantly search its contents or enter a full comma-separated recipe list to gauge meal compliance.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          id="btn-checker-tab-single"
          onClick={() => setActiveCheckTab('single')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeCheckTab === 'single'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <SearchCode className="w-4 h-4" />
          Single Local Ingredient Search
        </button>
        <button
          id="btn-checker-tab-multiple"
          onClick={() => setActiveCheckTab('multiple')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeCheckTab === 'multiple'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" />
          Batch Recipe check (Comma-separated)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* CHECK CONTROLS COLUMN */}
        <div className="md:col-span-5">
          {activeCheckTab === 'single' ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                <SearchCode className="w-4 h-4 text-blue-600" />
                Query Component
              </h2>
              <form onSubmit={handleSingleCheck} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Ingredient Name</label>
                  <input
                    id="checker-single-input"
                    type="text"
                    required
                    placeholder="e.g. Shito, Koobi, Peanut Oil, Gari, Milo..."
                    value={singleInput}
                    onChange={(e) => setSingleInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all capitalize"
                  />
                </div>
                <button
                  id="btn-submit-single-check"
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  Verify Safety
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Query Batch Recipe
              </h2>
              <form onSubmit={handleMultiCheck} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Enter Comma-Separated List</label>
                  <textarea
                    id="checker-multi-textarea"
                    required
                    rows={4}
                    placeholder="e.g. Spaghetti, shito, beef cubes, boiled egg, cassava grits"
                    value={multiInput}
                    onChange={(e) => setMultiInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                    Enter the ingredients separated by commas. We'll identify warning zones on each item.
                  </p>
                </div>
                <button
                  id="btn-submit-multi-check"
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  Batch Check Recipe
                </button>
              </form>
            </div>
          )}
        </div>

        {/* DETAILS / RESULTS PANEL */}
        <div className="md:col-span-7">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs min-h-[300px] flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Safety Analysis report
              </h2>

              {/* EMPTY DEFAULT SCREEN */}
              {((activeCheckTab === 'single' && !singleResult) || (activeCheckTab === 'multiple' && !multiResults)) && (
                <div className="py-16 text-center text-slate-400">
                  <HelpCircle className="w-12 h-12 stroke-1 mx-auto mb-4 opacity-50 text-blue-600" />
                  <p className="font-bold text-sm text-slate-600">No analysis to display</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Type your ingredients on the left and submit to verify their safety.
                  </p>
                </div>
              )}

              {/* SINGLE RESULT CARD */}
              {activeCheckTab === 'single' && singleResult && (
                <div id="single-result-card" className="space-y-6">
                  {/* SAFE OR UNSAFE SPLASH INDICATION */}
                  {singleResult.isSafe ? (
                    <div id="single-safe-pnl" className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                      <div>
                        <h3 className="font-bold text-emerald-950 text-xs sm:text-sm">INGREDIENT SAFE FOR YOU</h3>
                        <p className="text-xs text-emerald-700 font-medium mt-1">
                          No matching allergens found in <span className="font-bold capitalize">"{singleResult.name}"</span> that conflict with your active warnings profile.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div id="single-unsafe-pnl" className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                      <AlertOctagon className="w-6 h-6 text-red-500 shrink-0" />
                      <div>
                        <h3 className="font-bold text-red-950 text-xs sm:text-sm">SAFETY WARNING</h3>
                        <p className="text-xs text-red-700 font-medium mt-1">
                          The ingredient <span className="font-bold capitalize">"{singleResult.name}"</span> contains allergens that match your active profile warnings!
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Queried Ingredient</p>
                    <p id="single-checked-name" className="text-2xl font-bold capitalize text-slate-850">
                      {singleResult.name}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Identified Allergen Profiles</p>
                    {singleResult.allergens.length === 0 ? (
                      <p className="text-xs text-emerald-600 font-bold font-sans">No standard hazardous allergens flagged for this ingredient.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {singleResult.allergens.map((key) => {
                          const c = ALLERGENS.find(a => a.key === key);
                          const userMatch = profile?.allergies.includes(key);
                          return (
                            <span 
                              key={key} 
                              className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                                userMatch 
                                  ? 'bg-red-500 text-white shadow-2xs' 
                                  : 'bg-slate-100 text-slate-655 text-slate-600 font-medium'
                              }`}
                            >
                              <span>{c?.emoji || '•'}</span>
                              <span>{c?.label || key}</span>
                              {userMatch && <span className="text-[8px] bg-white text-red-600 px-1 py-0.25 rounded-md font-black">MATCH</span>}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BATCH RESULTS LIST */}
              {activeCheckTab === 'multiple' && multiResults && (
                <div id="multi-result-card" className="space-y-6">
                  {multiResults.isSafeOverall ? (
                    <div id="multi-safe-pnl" className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                      <div>
                        <h3 className="font-bold text-emerald-950 text-xs sm:text-sm">ALL RECIPE ITEMS VERIFIED SAFE</h3>
                        <p className="text-xs text-emerald-700 font-medium mt-1">
                          Glorious news! Our allergen checker analyzed all {multiResults.originalList.length} items and verified they contain no elements matching your configurations.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div id="multi-unsafe-pnl" className="bg-red-50 border border-red-105 rounded-2xl p-4 flex items-start gap-3 border-red-100">
                      <HeartCrack className="w-6 h-6 text-red-500 shrink-0" />
                      <div>
                        <h3 className="font-bold text-red-950 text-xs sm:text-sm">UNSAFE INGREDIENTS DETECTED</h3>
                        <p className="text-xs text-red-750 font-medium mt-1">
                          Warnings detected. {multiResults.dangerousItems.length} of {multiResults.originalList.length} parsed items contain elements matching your profile: (<span className="font-bold">{multiResults.dangerousItems.join(', ')}</span>).
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                      <ListChecks className="w-4 h-4" />
                      Individual Item Breakdown ({multiResults.details.length})
                    </p>
                    <div id="multi-breakdown-rows-list" className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
                      {multiResults.details.map((item, idx) => (
                        <div key={idx} className="pt-2 flex items-center justify-between text-xs sm:text-sm font-medium">
                          <span className="capitalize text-slate-800">{item.name}</span>
                          <div className="flex items-center gap-2">
                            {item.allergens.length === 0 ? (
                              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">✓ Clean</span>
                            ) : (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                                item.isSafe 
                                  ? 'bg-slate-100 text-slate-600' 
                                  : 'bg-red-500 text-white animate-pulse'
                              }`}>
                                {item.isSafe ? '⚠️ Neutral:' : '✖ Danger:'} {item.allergens.map(a => ALLERGENS.find(al => al.key === a)?.emoji || a).join(' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {((activeCheckTab === 'single' && singleResult) || (activeCheckTab === 'multiple' && multiResults)) && (
              <div className="mt-8 border-t border-slate-100 pt-5">
                <button
                  id="btn-checker-reset-fields"
                  onClick={activeCheckTab === 'single' ? resetSingle : resetMulti}
                  className="w-full flex items-center justify-center gap-1.5 border border-slate-205 hover:bg-slate-50 text-slate-650 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-slate-200"
                >
                  <RefreshCw className="w-4  h-4" />
                  Clear & Check New Ingredients
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
