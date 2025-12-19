
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    try {
      await api.requestPasswordReset(email);
      setStatus('success');
      setTimeout(() => navigate(`/verify-code?email=${encodeURIComponent(email)}`), 2000);
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 font-sans text-slate-900">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <Link to="/login" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-slate-600 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Login
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">¿Problemas para entrar?</h2>
            <p className="text-slate-500 mt-2 font-medium leading-relaxed">
              Ingresa tu correo institucional y te enviaremos un código para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Correo Institucional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@intelfon.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            {status === 'success' && (
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 border border-green-100 animate-in fade-in duration-300">
                <CheckCircle2 className="w-5 h-5" />
                <p className="text-sm font-bold text-center flex-1">Código enviado. Redirigiendo...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-bold">No pudimos procesar la solicitud. Intenta de nuevo.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || status === 'success'}
              className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all flex items-center justify-center disabled:opacity-50"
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
