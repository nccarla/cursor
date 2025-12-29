
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';

const ForgotPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const forceNew = searchParams.get('forceNew') === 'true';
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();

  // Actualizar email cuando cambie el parámetro de la URL
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');
    try {
      // Si viene con forceNew=true, forzar un nuevo código
      await api.requestPasswordReset(email, forceNew);
      
      // El código se genera automáticamente en el servicio y se muestra solo en la consola
      // No se muestra en pantalla por seguridad
      
      setStatus('success');
      
      // Animación de salida suave antes de navegar
      setTimeout(() => {
        setIsExiting(true);
        // Esperar a que termine la animación de salida antes de navegar
        setTimeout(() => {
          navigate(`/verify-code?email=${encodeURIComponent(email)}`);
        }, 400); // Duración de la animación de salida
      }, 1500); // Mostrar mensaje de éxito por 1.5 segundos
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'No pudimos procesar la solicitud. Intenta de nuevo.');
      console.error('Error al solicitar código de recuperación:', err);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-black">
      {/* Fondo dinámico animado */}
      <AnimatedBackground />
      
      {/* Contenedor del formulario con overlay para legibilidad */}
      <div className="max-w-sm w-full relative z-10">
        <div 
          className="rounded-3xl p-6 transition-all duration-400 ease-in-out animate-in zoom-in-95 fade-in"
          style={{
            background: 'rgba(15, 15, 15, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(100, 0, 0, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(200, 21, 27, 0.05)',
            opacity: isExiting ? 0 : 1,
            transform: isExiting ? 'scale(0.95) translateY(-30px)' : 'scale(1) translateY(0)',
          }}
        >
          <Link 
            to="/login" 
            className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-300 mb-8 transition-colors px-3 py-2 rounded-xl hover:bg-slate-800 animate-in fade-in slide-in-from-left"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Login
          </Link>

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

          <div className="mb-8 animate-in fade-in slide-in-from-top">
            <h2 className="text-3xl font-semibold leading-tight mb-4 animate-in slide-in-from-bottom fade-in" style={{animationDelay: '100ms', color: 'var(--color-brand-red)'}}>¿Problemas para entrar?</h2>
            <p className="text-slate-300 mt-2 font-medium leading-relaxed animate-in slide-in-from-bottom fade-in" style={{animationDelay: '200ms'}}>
              Ingresa tu correo institucional y te enviaremos un código para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 tracking-normal mb-2">Correo Institucional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@intelfon.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border text-white placeholder:text-slate-500 focus:outline-none transition-all font-medium border-slate-600"
                  style={{
                    background: 'rgba(30, 30, 30, 0.9)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(200, 21, 27, 0.6)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(200, 21, 27, 0.15), 0 0 12px rgba(200, 21, 27, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgb(71, 85, 105)';
                    e.target.style.boxShadow = '';
                  }}
                />
              </div>
            </div>

            {status === 'success' && (
              <div 
                className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 p-4 rounded-2xl flex items-start gap-3 border-2 border-green-200 shadow-sm transition-all duration-300"
                style={{
                  animation: 'fadeInScale 0.4s ease-out',
                }}
              >
                <CheckCircle2 
                  className="w-5 h-5 shrink-0 mt-0.5 transition-transform duration-300" 
                  style={{
                    color: 'var(--color-accent-blue-2)',
                    animation: 'scaleIn 0.3s ease-out 0.1s both',
                  }}
                />
                <div className="flex-1">
                  <p 
                    className="text-sm font-bold mb-1 transition-all duration-300"
                    style={{
                      animation: 'slideInFromRight 0.4s ease-out 0.2s both',
                    }}
                  >
                    Código enviado exitosamente
                  </p>
                  <p 
                    className="text-xs text-green-600 transition-all duration-300"
                    style={{
                      animation: 'fadeIn 0.4s ease-out 0.3s both',
                    }}
                  >
                    Si el correo está registrado, recibirás un código de recuperación. Revisa tu bandeja de entrada y spam.
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-700 p-4 rounded-2xl flex items-start gap-3 border-2 border-red-200 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{color: 'var(--color-brand-red)'}} />
                <div className="flex-1">
                  <p className="text-sm font-bold mb-1">{errorMessage || 'No pudimos procesar la solicitud. Intenta de nuevo.'}</p>
                  <p className="text-xs text-red-600">Verifica que el correo esté registrado en el sistema. Si el problema persiste, contacta al administrador.</p>
                </div>
              </div>
            )}

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
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enviar Código de Recuperación'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
