
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const tempToken = searchParams.get('tempToken') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const navigate = useNavigate();

  // Validación de contraseña
  const validatePassword = (passwordValue: string): boolean => {
    return passwordValue.length >= 8;
  };

  // Agregar animaciones del logo si no existen
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes logoFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes logoPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.9; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    let hasError = false;
    setPasswordError('');
    setConfirmPasswordError('');
    
    if (!validatePassword(password)) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      hasError = true;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden.');
      hasError = true;
    }
    
    if (hasError) {
      setStatus('error');
      return;
    }
    
    setLoading(true);
    setStatus('idle');
    setErrorMsg('');
    try {
      await api.finalizePasswordReset(email, tempToken, password);
      setStatus('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al restablecer contraseña.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-black">
      {/* Fondo dinámico animado */}
      <AnimatedBackground />
      
      {/* Contenedor del formulario con overlay para legibilidad */}
      <div className="max-w-sm w-full relative z-10">
        <div 
          className="rounded-3xl p-6 animate-in zoom-in-95 fade-in"
          style={{
            background: 'rgba(15, 15, 15, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(100, 0, 0, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(200, 21, 27, 0.05)',
          }}
        >
          {/* Logo y Nombre de la Empresa */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="https://static.wixstatic.com/media/98a19d_504d5e7478054d2484448813ac235267~mv2.png/v1/fill/w_192,h_176,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/red256.png"
                alt="INTELFON Logo"
                className="w-24 h-24 object-contain animate-in scale-in fade-in"
                style={{
                  filter: 'drop-shadow(0 12px 30px rgba(200, 21, 27, 0.25))',
                  animation: 'logoFloat 3s ease-in-out infinite, logoPulse 2s ease-in-out infinite',
                  animationDelay: '0.2s, 0s'
                }}
              />
            </div>
            <h2 
              className="text-3xl font-semibold mb-4 animate-in slide-in-from-bottom fade-in transition-all duration-500"
              style={{
                color: 'var(--color-brand-red)',
                animationDelay: '100ms',
              }}
            >
              Nueva contraseña
            </h2>
            <p 
              className="text-slate-300 mt-2 font-medium transition-all duration-500"
              style={{
                animationDelay: '200ms',
              }}
            >
              Crea una contraseña segura que no hayas usado antes.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            {status === 'success' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 border-2 border-green-200 animate-in fade-in duration-300 shadow-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{color: 'var(--color-accent-blue-2)'}} />
                <p className="text-sm font-bold flex-1">¡Contraseña actualizada! Volviendo al login...</p>
              </div>
            )}

            {status === 'error' && errorMsg && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 border-2 border-red-200 shadow-sm animate-in slide-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 shrink-0" style={{color: 'var(--color-brand-red)'}} />
                <p className="text-sm font-bold">{errorMsg}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 tracking-normal mb-2">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) {
                      setPasswordError('');
                    }
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-4 rounded-2xl border text-white placeholder:text-slate-500 focus:outline-none transition-all font-medium ${
                    passwordError ? 'border-red-500' : 'border-slate-600'
                  }`}
                  style={{
                    background: 'rgba(30, 30, 30, 0.9)',
                  }}
                  onFocus={(e) => {
                    if (!passwordError) {
                      e.target.style.borderColor = 'rgba(200, 21, 27, 0.6)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(200, 21, 27, 0.15), 0 0 12px rgba(200, 21, 27, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!passwordError) {
                      e.target.style.borderColor = 'rgb(71, 85, 105)';
                      e.target.style.boxShadow = '';
                    }
                    if (password && !validatePassword(password)) {
                      setPasswordError('La contraseña debe tener al menos 8 caracteres');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 rounded p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {passwordError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 tracking-normal mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) {
                      setConfirmPasswordError('');
                    }
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-4 rounded-2xl border text-white placeholder:text-slate-500 focus:outline-none transition-all font-medium ${
                    confirmPasswordError ? 'border-red-500' : 'border-slate-600'
                  }`}
                  style={{
                    background: 'rgba(30, 30, 30, 0.9)',
                  }}
                  onFocus={(e) => {
                    if (!confirmPasswordError) {
                      e.target.style.borderColor = 'rgba(200, 21, 27, 0.6)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(200, 21, 27, 0.15), 0 0 12px rgba(200, 21, 27, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!confirmPasswordError) {
                      e.target.style.borderColor = 'rgb(71, 85, 105)';
                      e.target.style.boxShadow = '';
                    }
                    if (confirmPassword && password !== confirmPassword) {
                      setConfirmPasswordError('Las contraseñas no coinciden.');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 rounded p-1"
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={0}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || status === 'success'}
              className="w-full text-white font-semibold py-5 rounded-2xl transition-all flex items-center justify-center disabled:cursor-not-allowed"
              style={{
                background: loading || status === 'success'
                  ? 'linear-gradient(to right, rgba(100, 100, 100, 0.4), rgba(120, 120, 120, 0.4))'
                  : 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))',
                boxShadow: loading || status === 'success'
                  ? 'none'
                  : '0 4px 14px rgba(200, 21, 27, 0.3), 0 0 20px rgba(200, 21, 27, 0.15)',
                opacity: loading || status === 'success' ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled && !loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(200, 21, 27, 0.4), 0 0 25px rgba(200, 21, 27, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = loading || status === 'success'
                    ? 'none'
                    : '0 4px 14px rgba(200, 21, 27, 0.3), 0 0 20px rgba(200, 21, 27, 0.15)';
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Actualizando...
                </>
              ) : (
                'Restablecer Contraseña'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
