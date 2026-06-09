import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global Premium Alert Dialog Helper
window.showAlert = (message, title = 'Notification', callback = null) => {
    const isStaff = window.location.pathname.includes('staff');
    const isSysadmin = window.location.pathname.includes('sysadmin');
    const lowerTitle = title.toLowerCase();
    const lowerMsg = (message || '').toLowerCase();
    
    let type = 'info';
    if (lowerTitle.includes('success') || lowerTitle.includes('saved') || lowerTitle.includes('approved') || lowerTitle.includes('claimed') || lowerTitle.includes('action') || lowerMsg.includes('success') || lowerMsg.includes('successfully')) {
        type = 'success';
    } else if (lowerTitle.includes('error') || lowerTitle.includes('fail') || lowerTitle.includes('delete') || lowerTitle.includes('remove') || lowerTitle.includes('invalid') || lowerMsg.includes('fail') || lowerMsg.includes('error') || lowerMsg.includes('invalid')) {
        type = 'error';
    } else if (lowerTitle.includes('warning') || lowerTitle.includes('caution') || lowerTitle.includes('attention') || lowerMsg.includes('warning')) {
        type = 'warning';
    }

    let iconBg = '';
    let iconBorder = '';
    let iconText = '';
    let iconSvg = '';
    let btnGradient = '';

    if (type === 'success') {
        iconBg = 'bg-emerald-50';
        iconBorder = 'border-emerald-100/80';
        iconText = 'text-emerald-600';
        iconSvg = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>`;
        btnGradient = 'from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 shadow-emerald-600/10';
    } else if (type === 'error') {
        iconBg = 'bg-rose-50';
        iconBorder = 'border-rose-100/80';
        iconText = 'text-rose-600';
        
        const isDeleteAction = lowerTitle.includes('delete') || lowerTitle.includes('remove') || lowerMsg.includes('delete') || lowerMsg.includes('remove');
        if (isDeleteAction) {
            iconSvg = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>`;
        } else {
            iconSvg = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
        }
        btnGradient = 'from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-600/10';
    } else if (type === 'warning') {
        iconBg = 'bg-amber-50';
        iconBorder = 'border-amber-100/80';
        iconText = 'text-amber-600';
        iconSvg = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>`;
        btnGradient = 'from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-600/10';
    } else {
        if (isStaff) {
            iconBg = 'bg-purple-50';
            iconBorder = 'border-purple-100/80';
            iconText = 'text-purple-600';
            btnGradient = 'from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-purple-600/10';
        } else if (isSysadmin) {
            iconBg = 'bg-blue-50';
            iconBorder = 'border-blue-100/80';
            iconText = 'text-blue-600';
            btnGradient = 'from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-blue-600/10';
        } else {
            iconBg = 'bg-indigo-50';
            iconBorder = 'border-indigo-100/80';
            iconText = 'text-indigo-600';
            btnGradient = 'from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-indigo-600/10';
        }
        iconSvg = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`;
    }

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 transition-all duration-300 opacity-0 font-sans';
    
    overlay.innerHTML = `
        <div class="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_-15px_rgba(99,102,241,0.15)] w-full max-w-md transform scale-95 transition-all duration-300 relative select-none flex flex-col items-center text-center">
            <div class="p-3 ${iconBg} border ${iconBorder} rounded-full ${iconText} mb-4 animate-bounce">
                ${iconSvg}
            </div>
            <div class="mb-5 w-full">
                <h3 class="text-lg font-black text-slate-800 tracking-tight">${title}</h3>
                <p class="text-slate-600 text-sm font-semibold mt-3 whitespace-pre-line leading-relaxed font-sans">${message}</p>
            </div>
            <div class="w-full pt-4 border-t border-slate-100">
                <button id="alert-confirm-btn" class="w-full py-2.5 bg-gradient-to-r ${btnGradient} text-white rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 duration-150 shadow-md">
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

// Override native window.alert to automatically use our premium alert box
window.alert = (message) => {
    let title = 'Notification';
    const lowerMsg = (message || '').toLowerCase();
    if (lowerMsg.includes('failed') || lowerMsg.includes('error') || lowerMsg.includes('invalid') || lowerMsg.includes('not a valid')) {
        title = 'Error';
    } else if (lowerMsg.includes('success') || lowerMsg.includes('successfully') || lowerMsg.includes('saved') || lowerMsg.includes('added')) {
        title = 'Success';
    } else if (lowerMsg.includes('warning') || lowerMsg.includes('attention') || lowerMsg.includes('caution')) {
        title = 'Warning';
    }
    window.showAlert(message, title);
};

// Global Premium Confirm Dialog Helper
window.showConfirm = (message, title = 'Confirmation', onConfirm = null, onCancel = null) => {
    const isStaff = window.location.pathname.includes('staff');
    const isSysadmin = window.location.pathname.includes('sysadmin');
    const lowerTitle = title.toLowerCase();
    const lowerMsg = (message || '').toLowerCase();
    
    let type = 'warning'; // Confirmations default to warning / action
    if (lowerTitle.includes('delete') || lowerTitle.includes('remove') || lowerMsg.includes('delete') || lowerMsg.includes('remove')) {
        type = 'error'; // Error colors for deletion confirmations
    } else if (lowerTitle.includes('success') || lowerTitle.includes('approve') || lowerMsg.includes('approve')) {
        type = 'success';
    }

    let iconBg = '';
    let iconBorder = '';
    let iconText = '';
    let iconSvg = '';
    let btnGradient = '';

    if (type === 'success') {
        iconBg = 'bg-emerald-50';
        iconBorder = 'border-emerald-100/80';
        iconText = 'text-emerald-600';
        iconSvg = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>`;
        btnGradient = 'from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 shadow-emerald-600/10';
    } else if (type === 'error') {
        iconBg = 'bg-rose-50';
        iconBorder = 'border-rose-100/80';
        iconText = 'text-rose-600';
        iconSvg = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>`;
        btnGradient = 'from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-600/10';
    } else {
        iconBg = 'bg-amber-50';
        iconBorder = 'border-amber-100/80';
        iconText = 'text-amber-600';
        iconSvg = `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>`;
        
        if (isStaff) {
            btnGradient = 'from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 shadow-purple-600/10';
        } else if (isSysadmin) {
            btnGradient = 'from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 shadow-blue-600/10';
        } else {
            btnGradient = 'from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 shadow-indigo-600/10';
        }
    }

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 transition-all duration-300 opacity-0 font-sans';
    
    overlay.innerHTML = `
        <div class="bg-white/95 border border-slate-200/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_-15px_rgba(99,102,241,0.15)] w-full max-w-md transform scale-95 transition-all duration-300 relative select-none flex flex-col items-center text-center">
            <div class="p-3 ${iconBg} border ${iconBorder} rounded-full ${iconText} mb-4 animate-bounce">
                ${iconSvg}
            </div>
            <div class="mb-5 w-full">
                <h3 class="text-lg font-black text-slate-800 tracking-tight">${title}</h3>
                <p class="text-slate-600 text-sm font-semibold mt-3 whitespace-pre-line leading-relaxed font-sans">${message}</p>
            </div>
            <div class="flex space-x-3 w-full pt-4 border-t border-slate-100">
                <button id="confirm-cancel-btn" class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 duration-150 shadow-sm border border-slate-200/40">
                    Cancel
                </button>
                <button id="confirm-ok-btn" class="flex-1 py-2.5 bg-gradient-to-r ${btnGradient} text-white rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 duration-150 shadow-md">
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