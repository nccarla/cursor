
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-blue-600 text-white mb-6 shadow-2xl shadow-blue-500/30 transform -rotate-3">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase">INTELFON</h1>
          <p className="mt-2 text-slate-400 font-bold uppercase tracking-widest text-xs">Sistema de Gestión SAC</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start gap-3 border border-red-100 animate-in slide-in-from-top duration-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Institucional</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@intelfon.com"
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
                {/* Fixed: removed 'size' prop which is not valid for react-router-dom Link */}
                <Link to="/forgot-password" className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                  ¿Olvidaste el acceso?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all font-medium"
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

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Acceso Rápido Demo</p>
            <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => setEmail('agente@intelfon.com')} className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-full border border-slate-100 hover:bg-blue-50">Agente</button>
                <button onClick={() => setEmail('supervisor@intelfon.com')} className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-full border border-slate-100 hover:bg-blue-50">Supervisor</button>
                <button onClick={() => setEmail('gerente@intelfon.com')} className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-full border border-slate-100 hover:bg-blue-50">Gerente</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
