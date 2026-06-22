import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, AlternativeMeal } from './types';
import Navigation from './components/Navigation';
import AuthScreens from './components/AuthScreens';
import MealScanner from './components/MealScanner';
import HistoryDashboard from './components/HistoryDashboard';
import IngredientChecker from './components/IngredientChecker';
import AlternativeRecommendations from './components/AlternativeRecommendations';
import ProfileSettings from './components/ProfileSettings';
import { ShieldCheck, LogIn, HeartIcon, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('scan');
  
  // Scan log triggers
  const [scanSavedCount, setScanSavedCount] = useState(0);

  // Alternative recommendations state transferred from scanner
  const [alternativeData, setAlternativeData] = useState<{
    foodName: string;
    allergens: string[];
    alternatives: AlternativeMeal[];
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        return;
      }

      if (userSnap.exists()) {
        const d = userSnap.data();
        setProfile({
          uid: d.uid,
          email: d.email || '',
          displayName: d.name || d.displayName || 'Friend',
          allergies: d.allergies || [],
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString()
        });
      } else {
        // Fallback document write if somehow register didn't do it
        const fallbackProfile = {
          uid,
          email: auth.currentUser?.email || '',
          displayName: 'Friend',
          allergies: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        try {
          await setDoc(userRef, fallbackProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
          return;
        }
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.error('Error of retrieving user profile:', err);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out from SafeBite GH?')) {
      await signOut(auth);
      setActiveTab('scan');
      setAlternativeData(null);
    }
  };

  const handleScanSaved = () => {
    setScanSavedCount(prev => prev + 1);
  };

  const renderActiveTab = () => {
    if (activeTab === 'scan') {
      return (
        <MealScanner
          user={user}
          profile={profile}
          onScanSaved={handleScanSaved}
          setActiveTab={setActiveTab}
          setAlternativeData={setAlternativeData}
        />
      );
    }
    if (activeTab === 'ingredients') {
      return <IngredientChecker profile={profile} />;
    }
    if (activeTab === 'history') {
      return (
        <HistoryDashboard
          user={user}
          profile={profile}
          scanCount={scanSavedCount}
          onClearHistory={handleScanSaved}
        />
      );
    }
    if (activeTab === 'profile') {
      return (
        <ProfileSettings
          user={user}
          profile={profile}
          onProfileUpdated={() => fetchUserProfile(user.uid)}
        />
      );
    }
    if (activeTab === 'alternatives' && alternativeData) {
      return (
        <AlternativeRecommendations
          foodName={alternativeData.foodName}
          allergens={alternativeData.allergens}
          alternatives={alternativeData.alternatives}
          userAllergies={profile?.allergies || []}
          onBackToScan={() => {
            setActiveTab('scan');
            setAlternativeData(null);
          }}
        />
      );
    }
    // Fallback if Tab doesn't exist
    return <div className="py-20 text-center text-neutral-400">Loading requested screen view...</div>;
  };

  if (loading) {
    return (
      <div id="app-loading-pnl" className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-xs mb-4 animate-pulse">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <p className="font-bold text-slate-800 tracking-tight text-lg">SafeBite GH</p>
        <p className="text-xs text-slate-400 mt-1 font-mono">CONVERSION PENDING...</p>
      </div>
    );
  }

  // Redirect to Auth if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Simple Brand Header for Login Page */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
          <div className="max-w-md mx-auto flex items-center justify-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">
              SafeBite <span className="text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">GH 🇬🇭</span>
            </span>
          </div>
        </header>

        <main className="flex-1">
          <AuthScreens onLoginSuccess={(uid) => fetchUserProfile(uid)} />
        </main>
      </div>
    );
  }

  return (
    <div id="full-app-root" className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Dynamic sticky header navigation */}
      <Navigation
        user={user}
        profile={profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Panel Viewport with desktop content container */}
      <main id="app-viewport-container" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {/* Onboarding hint widget if they just logged in with zero allergies set */}
        {profile && profile.allergies.length === 0 && activeTab === 'scan' && (
          <div id="onboarding-nag-infobox" className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Your allergy profile is currently empty!</p>
              <p className="text-[11px] text-amber-700 mt-1">
                To activate scanning, click on the <button onClick={() => setActiveTab('profile')} className="font-bold underline cursor-pointer hover:text-blue-600">Allergy Profile</button> tab to configure groundnuts, grains or custom food warnings.
              </p>
            </div>
          </div>
        )}

        {renderActiveTab()}
      </main>

      {/* Sticky footer labels */}
      <footer className="hidden md:block bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-auto font-mono">
        <p className="flex items-center justify-center gap-1">
          Designed with <span className="text-red-500">♥</span> for Ghana 🇬🇭. Secured via Google Cloud &amp; Gemini AI.
        </p>
      </footer>
    </div>
  );
}
