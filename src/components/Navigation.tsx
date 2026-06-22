import React from 'react';
import { ShieldCheck, LogOut, History, SearchCode, UserRound, Sparkles, UtensilsCrossed } from 'lucide-react';
import { UserProfile } from '../types';

interface NavigationProps {
  user: any;
  profile: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navigation({ user, profile, activeTab, setActiveTab, onLogout }: NavigationProps) {
  return (
    <nav id="app-navigation" className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('scan')}>
            <div id="nav-logo-box" className="bg-blue-600 text-white p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span id="nav-brand-title" className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-1">
                SafeBite <span className="text-blue-600 font-bold text-xs bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">GH 🇬🇭</span>
              </span>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest font-bold">ALLERGY WATCH</p>
            </div>
          </div>

          {/* Navigation Items */}
          {user && (
            <div className="hidden md:flex space-x-1 items-center">
              {[
                { id: 'scan', label: 'Scan Meal', icon: Sparkles },
                { id: 'ingredients', label: 'Ingredient Checker', icon: SearchCode },
                { id: 'history', label: 'Scan History', icon: History },
                { id: 'profile', label: 'Allergy Profile', icon: UserRound },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Right Action Profile / Logout */}
          <div className="flex items-center gap-3">
            {profile && (
              <div id="nav-profile-summary" className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-medium text-slate-600">
                  {profile.allergies.length === 0
                    ? 'No Allergies Selected'
                    : `${profile.allergies.length} active allergy warning(s)`}
                </span>
              </div>
            )}
            
            {user && (
              <button
                id="btn-nav-logout"
                onClick={onLogout}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Screen Bottom Navigation Bar */}
      {user && (
        <div id="nav-mobile-bar" className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center shadow-[0_-4px_12px_rgba(15,23,42,0.03)] z-50">
          {[
            { id: 'scan', label: 'Scan', icon: Sparkles },
            { id: 'ingredients', label: 'Check', icon: SearchCode },
            { id: 'history', label: 'History', icon: History },
            { id: 'profile', label: 'Profile', icon: UserRound },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-mobile-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-blue-600 scale-105 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
