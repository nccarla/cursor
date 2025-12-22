
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: 'linear-gradient(135deg, var(--color-brand-blue) 0%, var(--color-brand-blue) 75%, var(--color-accent-darkred) 100%)'}}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-200/50 animate-in zoom-in-95 fade-in">
          <Link 
            to="/login" 
            className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-700 mb-8 transition-colors px-3 py-2 rounded-xl hover:bg-slate-50 animate-in fade-in slide-in-from-left"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Login
          </Link>

          <div className="mb-8 animate-in fade-in slide-in-from-top">
            <div className="w-16 h-16 bg-gradient-brand-blue rounded-2xl flex items-center justify-center mb-6 shadow-brand-blue-lg animate-in scale-in fade-in animate-float">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-semibold text-slate-900 leading-tight mb-3 animate-in slide-in-from-bottom fade-in" style={{animationDelay: '100ms'}}>¿Problemas para entrar?</h2>
            <p className="text-slate-600 mt-2 font-medium leading-relaxed animate-in slide-in-from-bottom fade-in" style={{animationDelay: '200ms'}}>
              Ingresa tu correo institucional y te enviaremos un código para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 tracking-normal mb-2">Correo Institucional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@intelfon.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-accent-light bg-accent-light focus:outline-none focus:bg-white transition-all font-medium"
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-accent-blue)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(16, 122, 180, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-accent-light)';
                    e.target.style.boxShadow = '';
                  }}
                />
              </div>
            </div>

            {status === 'success' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 p-4 rounded-2xl flex items-center gap-3 border-2 border-green-200 animate-in fade-in duration-300 shadow-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{color: 'var(--color-accent-blue-2)'}} />
                <p className="text-sm font-bold text-center flex-1">Código enviado. Redirigiendo...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-700 p-4 rounded-2xl flex items-center gap-3 border-2 border-red-200 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0" style={{color: 'var(--color-brand-red)'}} />
                <p className="text-sm font-bold">No pudimos procesar la solicitud. Intenta de nuevo.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || status === 'success'}
              className="w-full text-white font-semibold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-2xl"
              style={{background: 'linear-gradient(to right, var(--color-brand-blue) 0%, var(--color-brand-blue) 75%, var(--color-accent-darkred) 100%)'}}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-blue-2), var(--color-accent-blue))';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, var(--color-brand-blue) 0%, var(--color-brand-blue) 75%, var(--color-accent-darkred) 100%)';
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
