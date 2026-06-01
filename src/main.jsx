import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global Premium Alert Dialog Helper
window.showAlert = (message, title = 'Notification', callback = null) => {
    const isStaff = window.location.pathname.includes('staff');
    const isSysadmin = window.location.pathname.includes('sysadmin');
    
    let dotColor = 'bg-indigo-500';
    let btnGradient = 'from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-indigo-600/10';
    
    if (isStaff) {
        dotColor = 'bg-purple-500';
        btnGradient = 'from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-purple-600/10';
    } else if (isSysadmin) {
        dotColor = 'bg-blue-500';
        btnGradient = 'from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-blue-600/10';
    }

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 transition-all duration-300 opacity-0 font-sans';
    
    overlay.innerHTML = `
        <div class="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_-15px_rgba(99,102,241,0.15)] w-full max-w-md transform scale-95 transition-all duration-300 relative select-none">
            <div class="mb-5">
                <h3 class="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full ${dotColor} animate-pulse"></span>
                    ${title}
                </h3>
                <p class="text-slate-600 text-sm font-semibold mt-3 whitespace-pre-line leading-relaxed font-sans">${message}</p>
            </div>
            <div class="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button id="alert-confirm-btn" class="px-5 py-2 bg-gradient-to-r ${btnGradient} text-white rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 duration-150">
                    OK
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate in
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        overlay.querySelector('div').classList.remove('scale-95');
    }, 10);
    
    const closeAlert = () => {
        overlay.classList.add('opacity-0');
        overlay.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
            overlay.remove();
            if (callback) callback();
        }, 300);
    };
    
    overlay.querySelector('#alert-confirm-btn').addEventListener('click', closeAlert);
};

// Global Premium Confirm Dialog Helper
window.showConfirm = (message, title = 'Confirmation', onConfirm = null, onCancel = null) => {
    const isStaff = window.location.pathname.includes('staff');
    const isSysadmin = window.location.pathname.includes('sysadmin');
    
    let dotColor = 'bg-amber-500';
    let btnGradient = 'from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-indigo-600/10';
    
    if (isStaff) {
        btnGradient = 'from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-purple-600/10';
    } else if (isSysadmin) {
        btnGradient = 'from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-blue-600/10';
    }

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 transition-all duration-300 opacity-0 font-sans';
    
    overlay.innerHTML = `
        <div class="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_-15px_rgba(99,102,241,0.15)] w-full max-w-md transform scale-95 transition-all duration-300 relative select-none">
            <div class="mb-5">
                <h3 class="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full ${dotColor} animate-pulse"></span>
                    ${title}
                </h3>
                <p class="text-slate-600 text-sm font-semibold mt-3 whitespace-pre-line leading-relaxed font-sans">${message}</p>
            </div>
            <div class="flex justify-end space-x-2.5 pt-4 border-t border-slate-100">
                <button id="confirm-cancel-btn" class="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-500 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95 duration-150">
                    Cancel
                </button>
                <button id="confirm-ok-btn" class="px-5 py-2 bg-gradient-to-r ${btnGradient} text-white rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 duration-150">
                    Confirm
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate in
    setTimeout(() => {
        overlay.classList.remove('opacity-0');
        overlay.querySelector('div').classList.remove('scale-95');
    }, 10);
    
    const handleAction = (isConfirmed) => {
        overlay.classList.add('opacity-0');
        overlay.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
            overlay.remove();
            if (isConfirmed) {
                if (onConfirm) onConfirm();
            } else {
                if (onCancel) onCancel();
            }
        }, 300);
    };
    
    overlay.querySelector('#confirm-ok-btn').addEventListener('click', () => handleAction(true));
    overlay.querySelector('#confirm-cancel-btn').addEventListener('click', () => handleAction(false));
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);