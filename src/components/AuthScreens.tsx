import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
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

  const handleGuestSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      // 1. Attempt anonymous sign-in first
      const credential = await signInAnonymously(auth);
      const userRef = doc(db, 'users', credential.user.uid);
      
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        console.warn('Anonymous profile get error, will back-create:', err);
      }

      if (!userSnap?.exists()) {
        try {
          await setDoc(userRef, {
            uid: credential.user.uid,
            email: 'guest@safebite.gh',
            name: 'Guest Traveler 🇬🇭',
            allergies: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${credential.user.uid}`);
          return;
        }
      }
      onLoginSuccess(credential.user.uid);
    } catch (anonErr: any) {
      console.warn('signInAnonymously failed or not enabled, using fallback generator:', anonErr);
      
      // 2. Fallback to generating a unique secure email-password guest credential
      try {
        const randomId = Math.floor(100000 + Math.random() * 900000);
        const guestEmail = `guest_${randomId}@safebite.gh`;
        const guestPassword = `safebiteGuest${randomId}`;
        const guestName = `Guest User #${randomId}`;

        const credential = await createUserWithEmailAndPassword(auth, guestEmail, guestPassword);
        
        try {
          await setDoc(doc(db, 'users', credential.user.uid), {
            uid: credential.user.uid,
            email: guestEmail,
            name: guestName,
            allergies: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${credential.user.uid}`);
          return;
        }

        onLoginSuccess(credential.user.uid);
      } catch (fallbackErr: any) {
        console.error('Guest email generation failed:', fallbackErr);
        setError(fallbackErr.message || 'Could not log in as physical guest. Try conventional fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', credential.user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${credential.user.uid}`);
        return;
      }

      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            uid: credential.user.uid,
            email: credential.user.email || '',
            name: credential.user.displayName || 'Google User',
            allergies: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${credential.user.uid}`);
          return;
        }
      }
      onLoginSuccess(credential.user.uid);
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'An error occurred during Google Sign-In';
      if (err.code === 'auth/popup-blocked') {
        errMsg = 'Login popup was blocked by your browser. Please allow popups for this site or open the app in a new tab.';
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

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
        try {
          await setDoc(doc(db, 'users', credential.user.uid), {
            uid: credential.user.uid,
            email: email.trim(),
            name: name.trim(),
            allergies: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${credential.user.uid}`);
          return;
        }

        onLoginSuccess(credential.user.uid);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || 'An error occurred during authentication';
      if (err.code === 'auth/wrong-password') errMsg = 'Incorrect password. Please try again.';
      if (err.code === 'auth/user-not-found') errMsg = 'No account found with this email.';
      if (err.code === 'auth/email-already-in-use') errMsg = 'This email is already registered.';
      if (err.code === 'auth/weak-password') errMsg = 'Password should be at least 6 characters.';
      if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'Email/Password authentication provider is currently disabled in your Firebase console. Please enable Email/Password under Authentication > Sign-in method, or simply click "Continue with Google" below!';
      }
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

        <div className="bg-blue-50/60 border border-blue-100 p-5 rounded-2xl text-center space-y-3">
          <p className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            Testing / Demo Mode Active
          </p>
          <button
            id="auth-guest-quick-btn"
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer active:translate-y-0"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5 animate-pulse" />
                <span>⚡ Instant 1-Click Guest Access</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-slate-400 font-medium">Bypasses credentials to log you in securely in 1 second.</p>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white">or sign in with password</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form className="mt-4 space-y-5" onSubmit={handleSubmit}>
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

        <div className="relative my-6 flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-widest bg-white">or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button
          id="auth-google-btn"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-slate-700 font-semibold text-sm bg-white border border-slate-200 hover:bg-slate-50 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.63-.94-1.39-.94-2.2z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>Continue with Google</span>
        </button>

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
