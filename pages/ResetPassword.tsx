
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const tempToken = searchParams.get('tempToken') || '';
  const code = searchParams.get('code') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isEntering, setIsEntering] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Animación de entrada suave
    const timer = setTimeout(() => setIsEntering(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      setStatus('error');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      setStatus('error');
      return;
    }
    
    setLoading(true);
    setStatus('idle');
    setErrorMsg('');
    try {
      // Enviar solo el código al webhook (sin la contraseña nueva)
      await api.finalizePasswordReset(email, tempToken, password, code);
      setStatus('success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al restablecer contraseña.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 font-sans transition-all duration-500 ease-out"
      className="bg-black"
      style={{
        opacity: isEntering ? 0 : 1,
        transform: isEntering ? 'scale(1.05) translateY(20px)' : 'scale(1) translateY(0)',
      }}
    >
      <div className="max-w-md w-full">
        <div 
          className="bg-slate-900 rounded-3xl shadow-2xl p-10 border border-slate-800 transition-all duration-500 ease-out"
          style={{
            opacity: isEntering ? 0 : 1,
            transform: isEntering ? 'scale(0.9) translateY(30px)' : 'scale(1) translateY(0)',
          }}
        >
          <div 
            className="w-16 h-16 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-500"
            style={{background: 'linear-gradient(135deg, var(--color-brand-red), var(--color-accent-red))', boxShadow: '0 12px 30px rgba(200, 21, 27, 0.25)'}}
            style={{
              animation: isEntering ? 'none' : 'scaleInRotate 0.6s ease-out 0.2s both',
            }}
          >
            <Lock className="w-8 h-8" />
          </div>
          <h2 
            className="text-3xl font-semibold leading-tight mb-3 text-center transition-all duration-500"
            style={{color: 'var(--color-brand-red)'}}
            style={{
              animation: isEntering ? 'none' : 'slideInFromBottom 0.5s ease-out 0.3s both',
            }}
          >
            Nueva contraseña
          </h2>
          <p 
            className="text-slate-300 mt-2 font-medium text-center transition-all duration-500"
            style={{
              animation: isEntering ? 'none' : 'fadeIn 0.5s ease-out 0.4s both',
            }}
          >
            Crea una contraseña segura que no hayas usado antes.
          </p>

          <form 
            onSubmit={handleReset} 
            className="mt-10 space-y-6 transition-all duration-500"
            style={{
              animation: isEntering ? 'none' : 'fadeIn 0.5s ease-out 0.5s both',
            }}
          >
            <div>
              <label className="block text-xs font-medium text-slate-400 tracking-normal mb-2">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-600 focus:bg-slate-750 transition-all font-medium"
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-brand-red)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(200, 21, 27, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgb(51, 65, 85)';
                    e.target.style.boxShadow = '';
                  }}
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 ml-1">Mínimo 6 caracteres</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 tracking-normal mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-600 focus:bg-slate-750 transition-all font-medium"
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-brand-red)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(200, 21, 27, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgb(51, 65, 85)';
                    e.target.style.boxShadow = '';
                  }}
                />
              </div>
            </div>

            {status === 'success' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 border-2 border-green-200 animate-in fade-in duration-300 shadow-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{color: 'var(--color-accent-blue-2)'}} />
                <p className="text-sm font-bold flex-1">¡Contraseña actualizada! Volviendo al login...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 border-2 border-red-200 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0" style={{color: 'var(--color-brand-red)'}} />
                <p className="text-sm font-bold">{errorMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || status === 'success' || password.length < 6 || password !== confirmPassword}
              className="w-full text-white font-semibold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center hover:-translate-y-0.5 hover:shadow-2xl"
              style={{
                background: loading || status === 'success' || password.length < 6 || password !== confirmPassword
                  ? 'linear-gradient(to right, var(--color-accent-gray), var(--color-brand-gray))'
                  : 'linear-gradient(to right, var(--color-brand-red) 0%, var(--color-brand-red) 75%, var(--color-accent-darkred) 100%)',
                cursor: loading || status === 'success' || password.length < 6 || password !== confirmPassword ? 'not-allowed' : 'pointer',
                opacity: loading || status === 'success' || password.length < 6 || password !== confirmPassword ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled && !loading && password.length >= 6 && password === confirmPassword) {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-red), var(--color-brand-red))';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled && !loading) {
                  e.currentTarget.style.background = loading || status === 'success' || password.length < 6 || password !== confirmPassword
                    ? 'linear-gradient(to right, var(--color-accent-gray), var(--color-brand-gray))'
                    : 'linear-gradient(to right, var(--color-brand-red) 0%, var(--color-brand-red) 75%, var(--color-accent-darkred) 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Restablecer Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
