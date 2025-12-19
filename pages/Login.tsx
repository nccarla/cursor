
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
      setError(err.message || 'Error de conexión con el servidor corporativo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: 'linear-gradient(135deg, var(--color-brand-blue) 0%, var(--color-accent-darkred) 100%)'}}>
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-brand-red text-white mb-6 shadow-brand-red-lg transform -rotate-3">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">INTELFON</h1>
          <p className="mt-2 text-white/80 font-bold uppercase tracking-widest text-xs">Sistema de Gestión SAC</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-red"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-accent-red/10 text-brand-red p-4 rounded-2xl flex items-start gap-3 border-2 border-accent-red/20 animate-in slide-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-brand-red" />
                <p className="text-xs font-black uppercase tracking-tight text-brand-red">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-accent-gray uppercase tracking-widest ml-1">Correo Institucional</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@intelfon.com"
                className="w-full px-5 py-4 rounded-2xl border border-accent-light bg-accent-light focus:outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue focus:bg-white transition-all font-medium"
                style={{'--tw-ring-color': 'var(--color-accent-blue)'} as React.CSSProperties}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-[10px] font-black text-accent-gray uppercase tracking-widest">Contraseña</label>
                <Link to="/forgot-password" className="text-[10px] font-black text-accent-blue hover:text-brand-blue uppercase tracking-widest transition-colors">
                  ¿Olvidaste el acceso?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-accent-light bg-accent-light focus:outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue focus:bg-white transition-all font-medium"
                style={{'--tw-ring-color': 'var(--color-accent-blue)'} as React.CSSProperties}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-brand font-black py-5 rounded-2xl transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group uppercase tracking-widest text-sm"
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

          <div className="mt-10 pt-8 border-t border-accent-light text-center">
            <p className="text-[10px] text-accent-gray font-black uppercase tracking-widest mb-3">Acceso Rápido Demo</p>
            <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => setEmail('agente@intelfon.com')} className="px-3 py-1 bg-accent-light text-[10px] font-bold text-accent-gray rounded-full border border-accent-light hover:bg-accent-blue/10 hover:text-accent-blue transition-colors">Agente</button>
                <button onClick={() => setEmail('supervisor@intelfon.com')} className="px-3 py-1 bg-accent-light text-[10px] font-bold text-accent-gray rounded-full border border-accent-light hover:bg-accent-blue/10 hover:text-accent-blue transition-colors">Supervisor</button>
                <button onClick={() => setEmail('gerente@intelfon.com')} className="px-3 py-1 bg-accent-light text-[10px] font-bold text-accent-gray rounded-full border border-accent-light hover:bg-accent-blue/10 hover:text-accent-blue transition-colors">Gerente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
