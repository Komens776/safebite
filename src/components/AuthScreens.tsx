import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ShieldAlert, LogIn, UserPlus, Mail, Lock, User, Sparkles } from 'lucide-react';

interface AuthScreensProps {
  onLoginSuccess: (userId: string) => void;
}

export default function AuthScreens({ onLoginSuccess }: AuthScreensProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const credential = await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess(credential.user.uid);
      } else {
        // Sign Up
        if (!name.trim()) {
          throw new Error('Please enter your name');
        }
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Write initial empty user profile to Firestore
        await setDoc(doc(db, 'users', credential.user.uid), {
          uid: credential.user.uid,
          email: email.trim(),
          name: name.trim(),
          allergies: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        onLoginSuccess(credential.user.uid);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'An error occurred during authentication';
      if (err.code === 'auth/wrong-password') errMsg = 'Incorrect password. Please try again.';
      if (err.code === 'auth/user-not-found') errMsg = 'No account found with this email.';
      if (err.code === 'auth/email-already-in-use') errMsg = 'This email is already registered.';
      if (err.code === 'auth/weak-password') errMsg = 'Password should be at least 6 characters.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      
      {/* Visual background decorations */}
      <div className="absolute top-24 left-1/4 w-72 h-72 bg-blue-100/10 rounded-full blur-3xl" />
      <div className="absolute bottom-24 right-1/4 w-72 h-72 bg-emerald-100/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xs relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-xl mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 id="auth-title" className="text-3xl font-bold tracking-tight text-slate-800">
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isLogin 
              ? 'Sign in to check your food safely.' 
              : 'Sign up to SafeBite GH to set custom allergy filters.'}
          </p>
        </div>

        {error && (
          <div id="auth-error-alert" className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-2xl text-xs sm:text-sm animate-shake">
            <ShieldAlert className="w-5 h-5 opacity-80 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="h-5 w-5" />
                </span>
                <input
                  id="reg-input-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kofi Mensah"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="auth-input-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                id="auth-input-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-sm"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In Safely</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Create SafeBite Profile</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            id="auth-toggle-screen-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline decoration-dotted underline-offset-4"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
