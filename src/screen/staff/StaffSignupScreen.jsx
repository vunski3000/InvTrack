import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function StaffSignupScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!username || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const { data, error: signupError } = await supabase.auth.signUp({
        email: `${username.toLowerCase()}@invtrack.local`,
        password,
        options: {
          data: {
            role: 'staff',
          },
        },
      });

      if (signupError) throw signupError;

      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-purple-50/20 to-indigo-50/40 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Animated Pastel Glowing Orbs in the background */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-200/40 rounded-full blur-[90px] animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-200/30 rounded-full blur-[110px] animate-pulse" style={{ animationDuration: '12s' }}></div>

      {/* Subtle Tech Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#a855f705_1px,transparent_1px),linear-gradient(to_bottom,#a855f705_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* Back Button */}
      <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 left-6 flex items-center text-slate-500 hover:text-purple-600 transition-colors font-semibold text-sm z-20 group"
      >
          <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
      </button>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white/90 border border-white backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center transform transition-all">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Registration Success</h3>
            <p className="text-slate-500 text-sm mb-6">Your staff personnel account has been successfully registered.</p>
            <button
              onClick={() => navigate('/staff-login')}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-bold py-3 rounded-xl shadow-md transition transform active:scale-95 shadow-purple-600/10"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

      {/* Signup Card */}
      <div className="w-full max-w-md bg-white/75 border border-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_20px_50px_-15px_rgba(168,85,247,0.12)] relative z-10 transition-all duration-300 hover:shadow-[0_25px_60px_-12px_rgba(99,102,241,0.18)]">
        <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-100 rounded-full text-[10px] font-bold tracking-wider uppercase text-purple-600 mb-4 shadow-sm">
                Access Provisioning
            </div>
            <h1 className="text-3xl font-black tracking-tight select-none">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900">
                    Staff Sign Up
                </span>
            </h1>
            <p className="text-slate-500 text-sm mt-2">Create a new staff personnel node.</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSignup}>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Staff Number / Personnel ID</label>
            <div className="mt-1.5">
              <input 
                type="text" 
                required
                className="block w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition duration-150 ease-in-out text-slate-800" 
                placeholder="e.g. 2026-0501" 
                value={username} 
                onChange={(e) => setUsername(e.target.value.replace(/[^0-9-]/g, ''))} 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Password</label>
            <div className="mt-1.5">
              <input 
                type="password" 
                required
                className="block w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition duration-150 ease-in-out text-slate-800" 
                placeholder="Create a password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Confirm Password</label>
            <div className="mt-1.5">
              <input 
                type="password" 
                required
                className="block w-full px-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition duration-150 ease-in-out text-slate-800" 
                placeholder="Confirm your password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>
          </div>
          
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100 text-center font-semibold">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 shadow-purple-600/10"
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        
        <p className="text-center text-xs text-slate-500 mt-8 select-none border-t border-slate-100/80 pt-6">
          Already have an account?{' '}
          <Link to="/staff-login" className="font-bold text-purple-600 hover:text-purple-800 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default StaffSignupScreen;