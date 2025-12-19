
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

const VerifyCode: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.verifyResetCode(email, code);
      if (response.ok) {
        navigate(`/reset-password?email=${encodeURIComponent(email)}&tempToken=${response.tempToken}`);
      } else {
        setError('Código inválido o expirado.');
      }
    } catch (err) {
      setError('Error al verificar el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 font-sans">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-200/50">
          <div className="w-16 h-16 bg-gradient-brand-blue text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-brand-blue-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">Verifica tu identidad</h2>
          <p className="text-slate-600 mt-2 font-medium">Hemos enviado un código a <b className="text-slate-900">{email}</b></p>

          <form onSubmit={handleVerify} className="mt-10 space-y-6 text-left">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Código de 6 dígitos</label>
              <input
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-4xl font-black tracking-[0.5em] py-4 rounded-2xl border-2 border-accent-light bg-accent-light focus:outline-none focus:bg-white transition-all"
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-accent-blue)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-accent-light)';
                }}
              />
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border-2 border-red-200 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0" style={{color: 'var(--color-brand-red)'}} />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-2xl"
              style={{background: 'linear-gradient(to right, var(--color-accent-darkred), var(--color-brand-blue))'}}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-blue), var(--color-accent-blue-2))';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-darkred), var(--color-brand-blue))';
              }}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verificar Código'}
            </button>

            <button 
              type="button" 
              onClick={() => navigate('/forgot-password')} 
              className="w-full text-sm font-bold text-slate-500 hover:text-slate-700 py-3 px-4 rounded-xl hover:bg-slate-50 transition-all"
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
