import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertCircle, Sparkles, CheckCircle2, RefreshCw, HelpCircle, Utensils, HeartHandshake } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, ScanItem, AlternativeMeal } from '../types';
import { GHANAIAN_FOODS_DB, getAllergensForIngredient, getSafeAlternatives, getAllergenInfoTip, ALLERGENS } from '../data/allergenMap';

// Custom SVG-based base64 mock images for easy testing of Ghanaian food classifications
import { MOCK_FOODS } from './mockFoods';

interface MealScannerProps {
  user: any;
  profile: UserProfile | null;
  onScanSaved: () => void;
  setActiveTab: (tab: string) => void;
  setAlternativeData: (data: { foodName: string; allergens: string[]; alternatives: AlternativeMeal[] } | null) => void;
}

export default function MealScanner({ user, profile, onScanSaved, setActiveTab, setAlternativeData }: MealScannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Scanned results
  const [result, setResult] = useState<{
    foodDetected: string;
    itemsOnPlate: string;
    allergensFound: string[];
    isSafe: boolean;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError('');
    setImage(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not access front/rear camera. Please use file upload fallback or presets.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
        processMeal(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        setResult(null);
        setError('');
        processMeal(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Preset Selection (No real camera needed to test!)
  const handlePresetSelect = (presetKey: string) => {
    const preset = MOCK_FOODS[presetKey as keyof typeof MOCK_FOODS];
    if (preset) {
      setImage(preset.image);
      setResult(null);
      setError('');
      processMeal(preset.image, preset.hint);
    }
  };

  const processMeal = async (base64Image: string, localHint: string = '') => {
    setLoading(true);
    setError('');
    try {
      // 1. Post image base64 data to Server Proxy Route
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, localHint })
      });

      if (!response.ok) {
        throw new Error('Server returned error parsing ingredients');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const foodDetected = data.foodDetected || 'unknown';
      const itemsOnPlate = data.itemsOnPlate || '';

      // 2. Identify All Allergens in detected dish and accessories
      const allergensFoundSet = new Set<string>();

      // Standard lookups in items found
      const ingredientsList = itemsOnPlate.split(',').map(i => i.trim().toLowerCase());
      ingredientsList.forEach((ing) => {
        // Run rule matcher
        const found = getAllergensForIngredient(ing);
        found.forEach(a => allergensFoundSet.add(a));
      });

      // Double-check standard Ghanaian food DB for main category allergens (fallback)
      if (GHANAIAN_FOODS_DB[foodDetected]) {
        GHANAIAN_FOODS_DB[foodDetected].allergens.forEach(a => allergensFoundSet.add(a));
      }

      const allergensFound = Array.from(allergensFoundSet);

      // 3. Compare with User Registered active profile allergies
      const userAllergies = profile?.allergies || [];
      const intersection = allergensFound.filter(a => userAllergies.includes(a));
      const isSafe = intersection.length === 0;

      // 4. Save results to state
      setResult({
        foodDetected,
        itemsOnPlate,
        allergensFound,
        isSafe
      });

      // 5. Save History item to Firebase
      if (user) {
        try {
          await addDoc(collection(db, 'scanHistory'), {
            userId: user.uid,
            foodDetected: foodDetected.charAt(0).toUpperCase() + foodDetected.slice(1),
            allergensFound: allergensFound,
            isSafe: isSafe,
            timestamp: Date.now(),
            ingredients: ingredientsList
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'scanHistory');
          return;
        }
        onScanSaved();
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AI engine was unable to analyze ingredients. Check network and refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        setResult(null);
        setError('');
        processMeal(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct redirection to the details card or alternatives
  const handleViewAlternatives = () => {
    if (!result) return;
    const alternatives = getSafeAlternatives(result.foodDetected, profile?.allergies || []);
    setAlternativeData({
      foodName: result.foodDetected,
      allergens: result.allergensFound,
      alternatives: alternatives
    });
    setActiveTab('alternatives');
  };

  const resetAll = () => {
    setImage(null);
    setResult(null);
    setError('');
    stopCamera();
  };

  return (
    <div id="scanner-wrapper" className="space-y-8 pb-12">
      {/* Banner / Headline Header */}
      <div className="bg-white border border-slate-200 p-8 rounded-2xl text-slate-800 shadow-2xs">
        <h1 id="scanner-header-title" className="text-3xl font-bold tracking-tight text-slate-900">
          Ghanaian Food AI Scanner 🍽️🇬🇭
        </h1>
        <p className="mt-2 text-slate-500 leading-relaxed text-sm max-w-2xl font-medium">
          Take a photo of your Waakye, Banku, Gobe, Jollof or local soups. The Gemini AI model inspects sides, toppings, and proteins to cross-check allergens in your active profile.
        </p>

        {profile && (
          <div id="scanner-profile-pill" className="mt-4 inline-flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active Warning Profile: {profile.allergies.length === 0 
              ? 'None (Edit Profile to filter)' 
              : profile.allergies.map(a => a.toUpperCase()).join(', ')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Camera Feed / Upload / presets */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <h2 id="scanner-viewport-title" className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Capture or Select Meal
            </h2>

            {/* ERROR ALERT */}
            {error && (
              <div id="scanner-alert-box" className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* VIDEO FEED / PREVIEW PORTAL */}
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="relative w-full aspect-video md:aspect-[4/3] bg-neutral-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center border-4 border-neutral-100 group"
            >
              {cameraActive ? (
                <>
                  <video 
                    ref={videoRef} 
                    referrerPolicy="no-referrer"
                    playsInline 
                    muted 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
                    <button
                      id="btn-scanner-capture"
                      onClick={capturePhoto}
                      className="bg-emerald-650 bg-emerald-600 text-white font-bold px-5 py-3 rounded-full hover:bg-emerald-700 shadow-md flex items-center gap-2 text-sm transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Take Photo
                    </button>
                    <button
                      id="btn-scanner-cancel-cam"
                      onClick={stopCamera}
                      className="bg-black/60 text-white px-4 py-2 rounded-full hover:bg-black/80 font-medium text-xs backdrop-blur-md cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : image ? (
                <>
                  <img 
                    src={image} 
                    referrerPolicy="no-referrer"
                    alt="Captured Scan Preview" 
                    className="w-full h-full object-cover" 
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white p-4">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="font-bold text-center animate-pulse">Gemini Scanning Plate ingredients...</p>
                      <p className="text-xs text-neutral-300 mt-2 text-center max-w-sm">
                        Classifying main Ghanaian components (Jollof, Gari, Talia, Shito, Tilapia)
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-6 flex flex-col items-center">
                  <div className="bg-slate-50 p-4 rounded-full text-slate-500 mb-4 group-hover:scale-105 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-neutral-300">Drag & Drop plate photo here</p>
                  <p className="text-xs text-neutral-400 mt-1">or select options below</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                  <div className="flex gap-2.5 mt-6">
                    <button
                      id="btn-scanner-activate-cam"
                      onClick={startCamera}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Live Camera
                    </button>
                    <button
                      id="btn-scanner-trigger-upload"
                      onClick={triggerUploadClick}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PRESETS CAROUSEL SECTION */}
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1">
                <Utensils className="w-4 h-4" />
                No ingredients? Scan a Pre-made Ghanaian Plate Preset
              </h3>
              <div id="presets-carousel" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'waakye', label: 'Waakye Plate', icon: '🍛', notes: 'Rice, shito, gari, fish, eggs' },
                  { key: 'banku', label: 'Banku & Tilapia', icon: '🐟', notes: 'Fermented dough, fish' },
                  { key: 'groundnut', label: 'Groundnut Soup', icon: '🥣', notes: 'Nut pasta, beef soup' },
                  { key: 'gobe', label: 'Gobe / Red Red', icon: '🍌', notes: 'Beans, plantain' },
                  { key: 'kelewele', label: 'Kelewele', icon: '🌶️', notes: 'Spicy plantain' },
                  { key: 'hoko', label: 'Hausa Koko', icon: '🥛', notes: 'Millet, spicy porridge' }
                ].map((item) => (
                  <button
                    key={item.key}
                    id={`preset-btn-${item.key}`}
                    onClick={() => handlePresetSelect(item.key)}
                    disabled={loading || cameraActive}
                    className="flex items-center gap-2.5 p-2 bg-slate-50/50 border border-slate-150 rounded-xl hover:bg-slate-50 hover:border-slate-200 text-left transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 truncate">{item.label}</p>
                      <p className="text-[9px] text-slate-400 truncate font-mono">{item.notes}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: AI Analysis Results Card */}
        <div id="scanner-results-container" className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs h-full flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Inspection & Ingredient Analysis
              </h2>

              {!result && !loading && (
                <div id="scanner-empty-status" className="py-16 text-center text-slate-400">
                  <HelpCircle className="w-12 h-12 stroke-1 mx-auto mb-4 opacity-50" />
                  <p className="font-medium text-sm text-slate-600">Waiting for a scan...</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Click "Live Camera", upload a photo, or choose a 🇬🇭 food preset to run immediate Gemini cross-testing.
                  </p>
                </div>
              )}

              {loading && (
                <div id="scanner-loading-placeholder" className="py-12 space-y-4">
                  <div className="h-6 w-32 bg-slate-100 rounded-md animate-pulse" />
                  <div className="h-20 w-full bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-6 w-40 bg-slate-100 rounded-md animate-pulse" />
                  <div className="h-24 w-full bg-slate-100 rounded-xl animate-pulse" />
                </div>
              )}

              {result && !loading && (
                <div id="scanner-result-success-box" className="space-y-6">
                  {/* SAFE OR UNSAFE SPLASH INDICATION */}
                  {result.isSafe ? (
                    <div id="scanner-allergy-safe-card" className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                      <div>
                        <h3 className="font-bold text-emerald-950 text-sm">SAFE TO CONSUME</h3>
                        <p className="text-xs text-emerald-700 font-medium mt-1">
                          No matching allergens found in this Ghanaian meal! Eat with peace of mind.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div id="scanner-allergy-unsafe-card" className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                      <div>
                        <h3 className="font-bold text-red-950 text-sm">WARNING: UNSAFE MEAL</h3>
                        <p className="text-xs text-red-700 font-medium mt-1">
                          Our Gemini AI detected ingredients that trigger warning alerts based on your allergy settings.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* IDENTIFIED MAIN FOOD */}
                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Main Food Identified</p>
                    <p id="scanned-food-classification-name" className="text-2xl font-bold capitalize text-slate-800">
                      {result.foodDetected}
                    </p>
                  </div>

                  {/* ITEMS DETECTED ON PLATE */}
                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Items & Accompaniments on plate</p>
                    <p id="scanned-plate-items-list" className="text-xs text-slate-600 leading-relaxed font-sans border border-slate-150 p-3 rounded-xl bg-slate-50">
                      {result.itemsOnPlate}
                    </p>
                  </div>

                  {/* ALLERGENS DETECTED */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Detected Allergens</p>
                    {result.allergensFound.length === 0 ? (
                      <p className="text-xs text-slate-500 font-medium font-sans">No known top allergen vectors detected in this setup.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {result.allergensFound.map((key) => {
                          const config = ALLERGENS.find(a => a.key === key);
                          const activeMatch = profile?.allergies.includes(key);
                          return (
                            <span 
                              key={key} 
                              className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                                activeMatch 
                                  ? 'bg-red-500 text-white shadow-2xs' 
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span>{config?.emoji || '⚠️'}</span>
                              <span>{config?.label || key}</span>
                              {activeMatch && <span className="text-[9px] uppercase px-1.5 py-0.25 bg-white text-red-650 text-red-600 rounded-full font-black">MATCH</span>}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SPECIFIC ALLERGEN TIPS IF UNSAFE */}
                  {!result.isSafe && (
                    <div className="bg-red-50/50 border border-red-150 p-4 rounded-xl space-y-2 mt-4 text-red-950">
                      <h4 className="text-xs font-bold flex items-center gap-1">
                        <HeartHandshake className="w-4 h-4 text-red-500" />
                        Ghana Allergy Advisory Tips:
                      </h4>
                      <p className="text-[11px] text-red-800 font-sans leading-relaxed">
                        {result.allergensFound
                          .filter(a => profile?.allergies.includes(a))
                          .map(a => getAllergenInfoTip(a))
                          .join(' ')}
                      </p>
                    </div>
                  )}

                </div>
              )}
            </div>

            {result && !loading && (
              <div className="mt-8 flex flex-col sm:flex-row gap-3 border-t border-slate-100 pt-6">
                <button
                  id="btn-scan-again-reset"
                  onClick={resetAll}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Scan New Plate
                </button>
                
                {!result.isSafe && (
                  <button
                    id="btn-view-safe-alternatives"
                    onClick={handleViewAlternatives}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer animate-pulse"
                  >
                    View Safe Options
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
