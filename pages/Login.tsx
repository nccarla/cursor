
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { LogIn, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

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
      if (errorMessage.includes('no está registrada') || 
          errorMessage.includes('Credenciales inválidas') ||
          errorMessage.includes('401') ||
          errorMessage.includes('403')) {
        setError('Credenciales inválidas o cuenta no registrada en el sistema. Contacta a tu supervisor para crear una cuenta.');
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: 'linear-gradient(135deg, var(--color-brand-blue) 0%, var(--color-brand-blue) 75%, var(--color-accent-darkred) 100%)'}}>
      <div className="max-w-md w-full">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-brand-red text-white mb-6 shadow-brand-red-lg transform -rotate-3 animate-in scale-in fade-in animate-float">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight animate-in slide-in-from-bottom fade-in" style={{animationDelay: '100ms'}}>INTELFON</h1>
          <p className="mt-2 text-white/80 font-normal text-sm tracking-normal animate-in slide-in-from-bottom fade-in" style={{animationDelay: '200ms'}}>Sistema de Gestión SAC</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10 relative overflow-hidden animate-in zoom-in-95 fade-in" style={{animationDelay: '300ms'}}>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-red"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-accent-red/10 text-brand-red p-4 rounded-2xl flex items-start gap-3 border-2 border-accent-red/20 animate-in slide-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-brand-red" />
                <p className="text-sm font-normal tracking-normal text-brand-red">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-normal text-accent-gray tracking-normal ml-1 mb-2">Correo Institucional</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@intelfon.com"
                className="w-full px-5 py-4 rounded-2xl border border-accent-light bg-accent-light focus:outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue focus:bg-white transition-all font-normal text-base placeholder:text-slate-400"
                style={{'--tw-ring-color': 'var(--color-accent-blue)'} as React.CSSProperties}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-sm font-normal text-accent-gray tracking-normal">Contraseña</label>
                <Link to="/forgot-password" className="text-sm font-normal text-accent-blue hover:text-brand-blue tracking-normal transition-colors">
                  ¿Olvidaste el acceso?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-accent-light bg-accent-light focus:outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue focus:bg-white transition-all font-normal text-base placeholder:text-slate-400"
                style={{'--tw-ring-color': 'var(--color-accent-blue)'} as React.CSSProperties}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-brand font-semibold py-5 rounded-2xl transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group tracking-normal text-base"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Entrar al Sistema
                  <LogIn className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
