import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, AllergenKey } from '../types';
import AllergyChips from './AllergyChips';
import { normalizeAllergen, ALLERGENS } from '../data/allergenMap';
import { UserRound, Plus, ShieldCheck, RefreshCw, AlertCircle, Sparkles, Smile, Info } from 'lucide-react';

interface ProfileSettingsProps {
  user: any;
  profile: UserProfile | null;
  onProfileUpdated: () => void;
  isFirstTimeOnboarding?: boolean;
}

export default function ProfileSettings({ user, profile, onProfileUpdated, isFirstTimeOnboarding = false }: ProfileSettingsProps) {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customAllergies, setCustomAllergies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      // Split into standard allergens and custom ones
      const standardKeys = ALLERGENS.map(a => a.key as string);
      const standard = profile.allergies.filter(a => standardKeys.includes(a));
      const custom = profile.allergies.filter(a => !standardKeys.includes(a));

      setSelectedAllergies(standard);
      setCustomAllergies(custom);
    }
  }, [profile]);

  const handleChipToggle = (allergyKey: string) => {
    if (selectedAllergies.includes(allergyKey)) {
      setSelectedAllergies(selectedAllergies.filter(a => a !== allergyKey));
    } else {
      setSelectedAllergies([...selectedAllergies, allergyKey]);
    }
    setSaveSuccess(false);
  };

  const handleAddCustomAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaveSuccess(false);

    const term = customInput.trim().toLowerCase();
    if (!term) return;

    if (term.length < 2) {
      setError('Please enter a valid allergen name.');
      return;
    }

    // Port over key normalization logic from Kotlin ProfileActivity
    const normalized = normalizeAllergen(term);
    const standardKeys = ALLERGENS.map(a => a.key as string);

    if (standardKeys.includes(normalized)) {
      // It normalized to a standard allergy. Add standard chip if not present
      if (!selectedAllergies.includes(normalized)) {
        setSelectedAllergies([...selectedAllergies, normalized]);
      }
      
      const readableStd = ALLERGENS.find(a => a.key === normalized)?.label || normalized;
      alert(`"${customInput}" is categorized as "${readableStd}" in our system. We have activated this rating for you! ✓`);
    } else {
      // It is a custom new allergen (e.g. mango, garlic, ginger)
      if (customAllergies.includes(normalized)) {
        setError(`"${customInput}" has already been indexed on your list.`);
        return;
      }
      setCustomAllergies([...customAllergies, normalized]);
    }

    setCustomInput('');
  };

  const handleRemoveCustom = (term: string) => {
    setCustomAllergies(customAllergies.filter(a => a !== term));
    setSaveSuccess(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setSaveSuccess(false);

    try {
      // Combine selections
      const finalAllergies = [...selectedAllergies, ...customAllergies];

      // Update Firestore document `/users/{userId}`
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, {
          allergies: finalAllergies,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
        return;
      }

      setSaveSuccess(true);
      onProfileUpdated();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update preferences. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="profile-settings-wrapper" className="space-y-8 pb-12">
      {/* Banner Onboarding Header Area */}
      <div className="bg-white border border-slate-200 p-8 rounded-2xl text-slate-800 shadow-2xs relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-blue-50/5 rounded-full blur-2xl" />
        
        <h1 id="profile-header-title" className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          {isFirstTimeOnboarding ? 'Set Up Your Profile 📝' : 'Manage Allergy Profile 🛡️'}
        </h1>
        <p className="mt-2 text-slate-500 leading-relaxed text-sm max-w-2xl font-medium">
          Select standard Ghanaian food allergen filters or write custom ingredients. Our system keeps you guarded during scan checks.
        </p>
      </div>

      {error && (
        <div id="profile-error-alert" className="bg-red-50 border border-red-100 p-4 rounded-2xl text-xs sm:text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div id="profile-success-alert" className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-start gap-2 animate-fadeIn">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold">Preferences Updated Successfully!</p>
            <p className="text-[11px] text-emerald-700 mt-1">Your local allergy filters have been fully logged in our system.</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-8">
        
        {/* SECTION 1: STANDARD PREVALENT CHIPS */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <UserRound className="w-5 h-5 text-blue-600" />
            <h2 id="section-std-title" className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Select Prevalent Allergens
            </h2>
          </div>
          <AllergyChips selectedAllergies={selectedAllergies} onChange={handleChipToggle} />
        </div>

        {/* SECTION 2: CUSTOM TYPE-IN */}
        <div className="border-t border-slate-100 pt-8 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-blue-600" />
            <h2 id="section-custom-title" className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Introduce Custom Allergies
            </h2>
          </div>

          <form onSubmit={handleAddCustomAllergy} className="max-w-md flex gap-2.5">
            <input
              id="custom-allergy-input"
              type="text"
              placeholder="e.g. Ginger, Avocado, Mango, Almond..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-neutral-800 focus:outline-none focus:border-blue-600 focus:bg-white text-xs sm:text-sm transition-all"
            />
            <button
              id="btn-add-custom-allergen"
              type="submit"
              className="bg-slate-800 hover:bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl font-bold text-white text-xs sm:text-sm cursor-pointer shrink-0 transition-all shadow-2xs"
            >
              Add Item
            </button>
          </form>

          {/* LIST CUSTOM CHIPS */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Custom Allergy entries</p>
            {customAllergies.length === 0 ? (
              <p className="text-xs text-slate-500 font-sans italic opacity-85">None added yet. Stand-alone custom recipes apply.</p>
            ) : (
              <div id="custom-allergies-list" className="flex flex-wrap gap-2">
                {customAllergies.map((item) => (
                  <span
                    key={item}
                    className="text-xs font-semibold font-sans bg-slate-55 bg-slate-50 text-slate-700 border border-slate-200 pl-3 pr-2 py-1 rounded-full flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleRemoveCustom(item)}
                    title="Tap to remove"
                  >
                    <span className="capitalize">{item}</span>
                    <span className="text-[10px] text-slate-400 font-bold hover:text-slate-600">✕</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ONBOARDING ADVICE CARD */}
        <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-xl flex items-start gap-2.5 text-xs">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800 leading-relaxed font-sans font-medium">
            <span className="font-bold text-amber-900">System Normalizer Alert:</span> Typing in specific sub-items (such as "almond" or "shrimp") is recognized and matched safely by our underlying Ghanaian food dictionary rules to secure standard groupings.
          </p>
        </div>

        {/* SUBMIT BUTTON */}
        <div id="profile-submit-footer" className="flex justify-end pt-6 border-t border-slate-100">
          <button
            id="btn-save-profile"
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>{isFirstTimeOnboarding ? 'Continue to SafeBite GH' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
