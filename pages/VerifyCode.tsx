
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 font-sans">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Verifica tu identidad</h2>
          <p className="text-slate-500 mt-2 font-medium">Hemos enviado un código a <b>{email}</b></p>

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
                className="w-full text-center text-4xl font-black tracking-[0.5em] py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verificar Código'}
            </button>

            <button type="button" onClick={() => navigate('/forgot-password')} className="w-full text-sm font-bold text-slate-400 hover:text-slate-600 py-2">
              Solicitar un nuevo código
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
