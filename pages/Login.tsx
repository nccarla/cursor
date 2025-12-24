
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { LogIn, Loader2, AlertCircle, ShieldCheck, Mail, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await api.authenticate(email, password);
      
      // Mapeo de roles para redirección
      let targetPath = '/app/agente';
      if (user.role === 'SUPERVISOR') targetPath = '/app/supervisor';
      if (user.role === 'GERENTE') targetPath = '/app/gerencia';
      
      navigate(targetPath);
    } catch (err: any) {
      // Mostrar mensaje de error específico del webhook
      const errorMessage = err.message || 'Error de conexión con el servidor corporativo.';
      
      // Mensajes específicos para diferentes tipos de error
      if (errorMessage.includes('no encontrado') || 
          errorMessage.includes('no está almacenado') ||
          errorMessage.includes('no registrada') ||
          errorMessage.includes('404')) {
        setError('Usuario no encontrado. El usuario no está almacenado en el sistema. Contacta a tu supervisor para crear una cuenta.');
      } else if (errorMessage.includes('Credenciales inválidas') ||
          errorMessage.includes('401') ||
          errorMessage.includes('403')) {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else if (errorMessage.includes('Timeout') || errorMessage.includes('tiempo')) {
        setError('El servidor no respondió a tiempo. Verifica tu conexión e intenta nuevamente.');
      } else if (errorMessage.includes('conexión') || errorMessage.includes('Error de conexión')) {
        setError('Error de conexión con el servidor. Verifica tu conexión a internet.');
      } else {
        setError('No se pudo autenticar. La cuenta debe estar registrada en el sistema. Contacta a tu supervisor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black relative overflow-hidden">
      {/* Fondo animado con triángulos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="triangle-bg">
          <div className="triangle triangle-1"></div>
          <div className="triangle triangle-2"></div>
          <div className="triangle triangle-3"></div>
          <div className="triangle triangle-4"></div>
          <div className="triangle triangle-5"></div>
          <div className="triangle triangle-6"></div>
        </div>
      </div>
      <div className="max-w-md w-full relative z-10">
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-10 border border-slate-800 animate-in zoom-in-95 fade-in">
          {/* Logo y Nombre de la Empresa */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 transform -rotate-3 animate-in scale-in fade-in animate-float" style={{background: 'linear-gradient(135deg, var(--color-brand-red), var(--color-accent-red))', boxShadow: '0 12px 30px rgba(200, 21, 27, 0.25)'}}>
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-semibold leading-tight mb-2 animate-in slide-in-from-bottom fade-in" style={{animationDelay: '100ms', letterSpacing: '-0.02em', color: 'var(--color-brand-red)'}}>INTELFON</h1>
            <p className="text-slate-300 font-medium leading-relaxed animate-in slide-in-from-bottom fade-in" style={{animationDelay: '200ms', letterSpacing: '0'}}>
              Sistema de Gestión SAC
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 border-2 border-red-200 shadow-sm animate-in slide-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 shrink-0" style={{color: 'var(--color-brand-red)'}} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

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
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:bg-slate-750 transition-all font-medium"
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-medium text-slate-300 tracking-normal">Contraseña</label>
                <Link to="/forgot-password" className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">
                  ¿Olvidaste el acceso?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:bg-slate-750 transition-all font-medium"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-2xl"
              style={{background: 'linear-gradient(to right, var(--color-brand-red) 0%, var(--color-brand-red) 75%, var(--color-accent-darkred) 100%)'}}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-red), var(--color-brand-red))';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, var(--color-brand-red) 0%, var(--color-brand-red) 75%, var(--color-accent-darkred) 100%)';
              }}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Entrar al Sistema
                  <LogIn className="w-4 h-4 ml-3" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700 text-center">
            <p className="text-xs text-slate-300 font-medium tracking-normal mb-3">Acceso Rápido Demo</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button 
                onClick={() => setEmail('agente@intelfon.com')} 
                className="px-4 py-2 bg-slate-800 text-xs font-medium text-slate-300 rounded-full border border-slate-700 hover:bg-slate-700 hover:text-white hover:border-red-600 transition-colors"
              >
                Agente
              </button>
              <button 
                onClick={() => setEmail('supervisor@intelfon.com')} 
                className="px-4 py-2 bg-slate-800 text-xs font-medium text-slate-300 rounded-full border border-slate-700 hover:bg-slate-700 hover:text-white hover:border-red-600 transition-colors"
              >
                Supervisor
              </button>
              <button 
                onClick={() => setEmail('gerente@intelfon.com')} 
                className="px-4 py-2 bg-slate-800 text-xs font-medium text-slate-300 rounded-full border border-slate-700 hover:bg-slate-700 hover:text-white hover:border-red-600 transition-colors"
              >
                Gerente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
