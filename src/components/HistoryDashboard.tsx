import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ScanItem, UserProfile } from '../types';
import { ALLERGENS } from '../data/allergenMap';
import { Search, Filter, Trash2, Calendar, ShieldCheck, ShieldAlert, ChevronRight, FileSpreadsheet, Sparkles, Smile, MessageSquareWarning } from 'lucide-react';

interface HistoryDashboardProps {
  user: any;
  profile: UserProfile | null;
  scanCount: number;
  onClearHistory: () => void;
}

export default function HistoryDashboard({ user, profile, scanCount, onClearHistory }: HistoryDashboardProps) {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'safe' | 'unsafe'>('all');
  const [selectedScan, setSelectedScan] = useState<ScanItem | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [user, scanCount]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'scanHistory'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'scanHistory');
        return;
      }
      const items: ScanItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: d.userId,
          foodDetected: d.foodDetected || 'Unknown',
          itemsOnPlate: d.ingredients ? d.ingredients.join(', ') : '',
          allergensFound: d.allergensFound || [],
          isSafe: d.isSafe !== undefined ? d.isSafe : true,
          timestamp: d.timestamp || Date.now()
        });
      });
      setScans(items);
    } catch (err) {
      console.error('Failed to get scan log:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear your entire scan history? This action is irreversible.')) {
      return;
    }
    try {
      const batch = writeBatch(db);
      scans.forEach((scan) => {
        batch.delete(doc(db, 'scanHistory', scan.id));
      });
      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'scanHistory');
        return;
      }
      setScans([]);
      onClearHistory();
    } catch (err) {
      console.error('Failed to clear entire history:', err);
    }
  };

  const handleDeleteOne = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this scan entry from your logs?')) return;
    try {
      try {
        await deleteDoc(doc(db, 'scanHistory', scanId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `scanHistory/${scanId}`);
        return;
      }
      setScans(scans.filter(s => s.id !== scanId));
      onClearHistory();
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalChecks = scans.length;
  const safeCount = scans.filter(s => s.isSafe).length;
  const unsafeCount = totalChecks - safeCount;

  // Search & Filter
  const filteredScans = scans.filter((scan) => {
    const matchesSearch = 
      scan.foodDetected.toLowerCase().includes(search.toLowerCase()) ||
      scan.itemsOnPlate.toLowerCase().includes(search.toLowerCase()) ||
      scan.allergensFound.some(a => a.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'safe' && scan.isSafe) ||
      (filterType === 'unsafe' && !scan.isSafe);

    return matchesSearch && matchesFilter;
  });

  return (
    <div id="history-wrapper" className="space-y-8 pb-12">
      {/* Metrics Banner cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div id="metric-total-box" className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest">Total Monitored</p>
            <p id="metric-total" className="text-3xl font-bold text-slate-850 mt-1">{totalChecks}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        <div id="metric-safe-box" className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest font-mono">Safe Meals</p>
            <p id="metric-safe" className="text-3xl font-bold text-emerald-600 mt-1">{safeCount}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-500">
            <Smile className="w-6 h-6" />
          </div>
        </div>

        <div id="metric-warning-box" className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest font-mono">Warnings Avoided</p>
            <p id="metric-warning" className="text-3xl font-bold text-red-500 mt-1">{unsafeCount}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-xl text-red-550 text-red-500">
            <MessageSquareWarning className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
        {/* Controls Layout */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center pb-6 border-b border-slate-100">
          <h2 id="history-details-title" className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-650" />
            Historical Scan Database Logs
          </h2>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="history-search-input"
                type="text"
                placeholder="Search food or allergen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-150">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {[
                { id: 'all', label: 'All' },
                { id: 'safe', label: 'Safe' },
                { id: 'unsafe', label: 'Unsafe' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  id={`btn-filter-${btn.id}`}
                  onClick={() => setFilterType(btn.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === btn.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-550 hover:text-slate-800'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Clear All Button */}
            {scans.length > 0 && (
              <button
                id="btn-clear-all-history"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-red-650 hover:text-red-750 font-bold text-xs bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition-all border border-red-150 cursor-pointer text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Reset Log
              </button>
            )}
          </div>
        </div>

        {/* LOG TABLE LIST */}
        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <span className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-mono">RETRIEVING RECORDS...</p>
          </div>
        ) : filteredScans.length === 0 ? (
          <div id="history-empty-message" className="py-20 text-center text-slate-400 space-y-2">
            <Sparkles className="w-12 h-12 stroke-1 mx-auto mb-4 opacity-50 text-blue-600" />
            <p className="font-bold text-sm text-slate-700">No recorded scan logs found</p>
            <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-400">
              When you scan Ghanaian food plates or type in manual recipe checks, logs register here automatically.
            </p>
          </div>
        ) : (
          <div id="history-logs-table" className="divide-y divide-slate-105 divide-slate-100">
            {filteredScans.map((scan) => (
              <div
                key={scan.id}
                id={`history-row-${scan.id}`}
                onClick={() => setSelectedScan(scan)}
                className="py-4 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl cursor-pointer transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Safe/Unsafe check circle */}
                  <div className="mt-1 shrink-0">
                    {scan.isSafe ? (
                      <div className="bg-emerald-50 text-emerald-500 p-1.5 rounded-full border border-emerald-100">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="bg-red-50 text-red-600 p-1.5 rounded-full border border-red-100">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm capitalize truncate flex items-center gap-2">
                      {scan.foodDetected}
                      <span className="text-[10px] text-slate-400 font-normal font-mono normal-case">
                        {new Date(scan.timestamp).toLocaleDateString()} at {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                    <p className="text-xs text-slate-550 truncate mt-0.5 leading-tight font-sans">
                      <span className="font-bold text-slate-400 text-[10px] uppercase font-mono mr-1">FOUND:</span> 
                      {scan.itemsOnPlate || 'No specific ingredients indexed.'}
                    </p>
                    
                    {/* Tiny badges for active warning allergens */}
                    {scan.allergensFound.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {scan.allergensFound.map((allg) => {
                          const conf = ALLERGENS.find(a => a.key === allg);
                          return (
                            <span key={allg} className="text-[9px] font-bold bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md flex items-center gap-0.5 text-slate-600">
                              <span>{conf?.emoji || '•'}</span>
                              <span>{conf?.label || allg}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    scan.isSafe 
                      ? 'bg-emerald-500/10 text-emerald-700' 
                      : 'bg-red-500/10 text-red-700'
                  }`}>
                    {scan.isSafe ? 'Safe' : 'Unsafe Warning'}
                  </span>

                  <button
                    id={`btn-delete-row-${scan.id}`}
                    onClick={(e) => handleDeleteOne(scan.id, e)}
                    className="p-2 text-slate-405 hover:text-red-650 hover:bg-neutral-100 rounded-lg transition-all text-slate-400"
                    title="Delete Scan Log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* EXPANDED MODAL DETAIL OF INDIVIDUAL HIGHLIGHT LOGS */}
      {selectedScan && (
        <div id="scan-detail-modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-205 max-w-xl w-full p-6 space-y-6 shadow-xs relative border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  selectedScan.isSafe 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {selectedScan.isSafe ? 'Verified Safe Meal' : 'Allergens Warning Alert'}
                </span>
                <h3 id="modal-scan-title" className="text-2xl font-bold text-slate-800 capitalize mt-2">
                  {selectedScan.foodDetected}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Database reference scan logged on {new Date(selectedScan.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                id="btn-close-scan-modal"
                onClick={() => setSelectedScan(null)}
                className="bg-slate-50 text-slate-400 hover:text-slate-600 p-2 rounded-full cursor-pointer hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identified Plate Components</p>
                <p className="text-xs text-slate-600 leading-normal font-medium capitalize font-sans">
                  {selectedScan.itemsOnPlate || 'No accompaniments matched. Custom check.'}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allergen Risk Profiles</p>
                {selectedScan.allergensFound.length === 0 ? (
                  <p className="text-xs text-emerald-650 font-bold font-sans">No hazardous allergen components detected. Completely Safe!</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedScan.allergensFound.map((key) => {
                      const c = ALLERGENS.find(a => a.key === key);
                      const isDanger = profile?.allergies.includes(key);
                      return (
                        <div key={key} className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 ${
                          isDanger 
                            ? 'bg-red-500 text-white border-red-350' 
                            : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          <span>{c?.emoji || '•'}</span>
                          <span>{c?.label || key}</span>
                          {isDanger && <span className="text-[9px] uppercase px-1.5 py-0.25 bg-white text-red-650 rounded-full font-black ml-1 text-red-600">Danger</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end border-t border-slate-100 pt-5">
              <button
                id="btn-modal-delete-record"
                onClick={(e) => {
                  handleDeleteOne(selectedScan.id, e as any);
                  setSelectedScan(null);
                }}
                className="bg-red-50 text-red-600 hover:bg-red-105 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 text-center transition-all cursor-pointer hover:bg-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Erase Record Entry
              </button>
              <button
                id="btn-modal-done"
                onClick={() => setSelectedScan(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
