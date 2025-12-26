
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

const VerifyCode: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const navigate = useNavigate();

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
    
    // Validaciones
    if (code.length < 6) {
      setError('El código debe tener 6 dígitos.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      // Solo verificar el código
      const response = await api.verifyResetCode(email, code);
      if (response.ok && response.tempToken) {
        // Si el código es válido, redirigir a la pantalla de nueva contraseña
        setSuccess(true);
        
        // Redirigir a reset-password con el token y código
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}&tempToken=${encodeURIComponent(response.tempToken || '')}&code=${encodeURIComponent(code)}`);
        }, 1000);
      } else {
        setError('Código inválido o expirado.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al verificar el código.');
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
          className="bg-black/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 text-center border border-black/50 transition-all duration-300 animate-in zoom-in-95 fade-in"
          style={{
            opacity: isEntering ? 0 : 1,
            transform: isEntering ? 'scale(0.9) translateY(30px)' : 'scale(1) translateY(0)',
          }}
        >
          {/* Logo de la Empresa */}
          <div className="text-center mb-6 animate-in fade-in slide-in-from-top">
            <div className="inline-flex items-center justify-center mb-6">
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
            className="text-3xl font-semibold mb-3 animate-in slide-in-from-bottom fade-in transition-all duration-500"
            style={{
              color: 'var(--color-brand-red)',
              animationDelay: '100ms',
            }}
          >
            Verifica tu identidad
          </h2>
          <p 
            className="text-slate-300 mt-2 font-medium transition-all duration-500"
            style={{
              animation: isEntering ? 'none' : 'fadeIn 0.5s ease-out 0.4s both',
            }}
          >
            Hemos enviado un código a <b className="text-white">{email}</b>
          </p>

          <form 
            onSubmit={handleVerify} 
            className="mt-10 space-y-6 text-left transition-all duration-500"
            style={{
              animation: isEntering ? 'none' : 'fadeIn 0.5s ease-out 0.5s both',
            }}
          >
            {/* Campo de código */}
            <div>
              <label 
                className="block text-xs font-medium text-slate-400 tracking-normal mb-3 text-center transition-all duration-300"
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
                className="w-full text-center text-4xl font-semibold tracking-[0.5em] py-4 rounded-2xl border-2 border-slate-700 bg-slate-800 text-white focus:outline-none focus:bg-slate-750 transition-all duration-300"
                style={{
                  animation: isEntering ? 'none' : 'scale-in 0.4s ease-out 0.7s both',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-brand-red)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(200, 21, 27, 0.1)';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgb(51, 65, 85)';
                  e.target.style.boxShadow = '';
                  e.target.style.transform = 'scale(1)';
                }}
                autoFocus
              />
            </div>

            {success && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border-2 border-green-200 shadow-sm animate-in fade-in duration-300">
                <ShieldCheck className="w-5 h-5 shrink-0" style={{color: 'var(--color-accent-blue-2)'}} />
                <div className="flex-1">
                  <p className="text-sm font-bold">Código verificado exitosamente</p>
                  <p className="text-xs text-green-600 mt-1">Redirigiendo para establecer nueva contraseña...</p>
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
              disabled={loading || code.length < 6}
              className="w-full text-white font-semibold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center hover:-translate-y-0.5 hover:shadow-2xl"
              style={{
                background: loading || code.length < 6
                  ? 'linear-gradient(to right, var(--color-accent-gray), var(--color-brand-gray))'
                  : 'linear-gradient(to right, var(--color-brand-red) 0%, var(--color-brand-red) 75%, var(--color-accent-darkred) 100%)',
                cursor: loading || code.length < 6 ? 'not-allowed' : 'pointer',
                opacity: loading || code.length < 6 ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled && !loading && code.length >= 6) {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-red), var(--color-brand-red))';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled && !loading) {
                  e.currentTarget.style.background = loading || code.length < 6
                    ? 'linear-gradient(to right, var(--color-accent-gray), var(--color-brand-gray))'
                    : 'linear-gradient(to right, var(--color-brand-red) 0%, var(--color-brand-red) 75%, var(--color-accent-darkred) 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verificar Código'}
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-brand-red)';
                e.currentTarget.style.backgroundColor = 'rgba(16, 122, 180, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-accent-blue)';
                e.currentTarget.style.backgroundColor = 'transparent';
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
