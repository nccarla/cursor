
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, Loader2, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

const VerifyCode: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const navigate = useNavigate();

  // Validación de contraseña
  const validatePassword = (passwordValue: string): boolean => {
    return passwordValue.length >= 8;
  };

  useEffect(() => {
    // Animación de entrada suave
    const timer = setTimeout(() => setIsEntering(false), 100);
    return () => clearTimeout(timer);
  }, []);

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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Validaciones
    if (code.length < 6) {
      setError('El código debe tener 6 dígitos.');
      return;
    }
    
    if (!validatePassword(password)) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      // Enviar código y contraseña al webhook
      await api.resetPasswordWithCode(email.trim(), password.trim(), code.trim());
      
      // Si es exitoso, mostrar mensaje y redirigir al login
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña.');
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
          className="rounded-3xl p-6 text-center transition-all duration-300 animate-in zoom-in-95 fade-in"
          style={{
            background: 'rgba(15, 15, 15, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(100, 0, 0, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(200, 21, 27, 0.05)',
            opacity: isEntering ? 0 : 1,
            transform: isEntering ? 'scale(0.9) translateY(30px)' : 'scale(1) translateY(0)',
          }}
        >
          {/* Logo de la Empresa */}
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
              animation: isEntering ? 'none' : 'fadeIn 0.5s ease-out 0.4s both',
            }}
          >
            Ingresa el código enviado a <b className="text-white">{email}</b> y tu nueva contraseña
          </p>

          <form 
            onSubmit={handleVerify} 
            className="mt-10 space-y-5 text-left transition-all duration-500"
            style={{
              animation: isEntering ? 'none' : 'fadeIn 0.5s ease-out 0.5s both',
            }}
          >
            {/* Campo de código */}
            <div>
              <label 
                className="block text-xs font-medium text-slate-300 tracking-normal mb-3 text-center transition-all duration-300"
                style={{
                  animation: isEntering ? 'none' : 'slideInFromBottom 0.4s ease-out 0.6s both',
                }}
              >
                Código de 6 dígitos
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-4xl font-semibold tracking-[0.5em] py-4 rounded-2xl border-2 text-white focus:outline-none transition-all duration-300 border-slate-600"
                style={{
                  background: 'rgba(30, 30, 30, 0.9)',
                  animation: isEntering ? 'none' : 'scale-in 0.4s ease-out 0.7s both',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(200, 21, 27, 0.6)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(200, 21, 27, 0.15), 0 0 12px rgba(200, 21, 27, 0.1)';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgb(71, 85, 105)';
                  e.target.style.boxShadow = '';
                  e.target.style.transform = 'scale(1)';
                }}
                autoFocus
              />
            </div>

            {/* Campo de nueva contraseña */}
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
                    if (passwordError) setPasswordError('');
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

            {/* Campo de confirmar contraseña */}
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
                    if (confirmPasswordError) setConfirmPasswordError('');
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

            {success && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border-2 border-green-200 shadow-sm animate-in fade-in duration-300">
                <ShieldCheck className="w-5 h-5 shrink-0" style={{color: 'var(--color-accent-blue-2)'}} />
                <div className="flex-1">
                  <p className="text-sm font-bold">¡Contraseña actualizada!</p>
                  <p className="text-xs text-green-600 mt-1">Redirigiendo al login...</p>
                </div>
              </div>
            )}

            {error && !success && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border-2 border-red-200 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0" style={{color: 'var(--color-brand-red)'}} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6 || !validatePassword(password) || password !== confirmPassword || success}
              className="w-full text-white font-semibold py-5 rounded-2xl transition-all flex items-center justify-center disabled:cursor-not-allowed"
              style={{
                background: loading || code.length < 6 || !validatePassword(password) || password !== confirmPassword || success
                  ? 'linear-gradient(to right, rgba(100, 100, 100, 0.4), rgba(120, 120, 120, 0.4))'
                  : 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))',
                boxShadow: loading || code.length < 6 || !validatePassword(password) || password !== confirmPassword || success
                  ? 'none'
                  : '0 4px 14px rgba(200, 21, 27, 0.3), 0 0 20px rgba(200, 21, 27, 0.15)',
                opacity: loading || code.length < 6 || !validatePassword(password) || password !== confirmPassword || success ? 0.5 : 1,
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
                  e.currentTarget.style.boxShadow = loading || code.length < 6 || !validatePassword(password) || password !== confirmPassword || success
                    ? 'none'
                    : '0 4px 14px rgba(200, 21, 27, 0.3), 0 0 20px rgba(200, 21, 27, 0.15)';
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                'Restablecer Contraseña'
              )}
            </button>

            <button 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                // Regresar a la página de forgot-password para solicitar un nuevo código
                // Forzar un nuevo código al regresar
                if (email) {
                  navigate(`/forgot-password?email=${encodeURIComponent(email)}&forceNew=true`);
                } else {
                  navigate('/forgot-password');
                }
              }}
              className="w-full text-sm font-bold py-3 px-4 rounded-xl transition-all"
              style={{
                color: 'var(--color-accent-blue)',
                backgroundColor: 'transparent',
                border: '1px solid rgba(100, 116, 139, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-brand-red)';
                e.currentTarget.style.backgroundColor = 'rgba(200, 21, 27, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(200, 21, 27, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-accent-blue)';
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.2)';
              }}
            >
              Solicitar un nuevo código
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
