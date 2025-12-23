import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { UserPlus, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validaciones
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // Crear cuenta y almacenarla en n8n
      const user = await api.createAccount(email, password, name);
      
      // Si llegamos aquí, el usuario fue creado y almacenado exitosamente en n8n
      // Mostrar mensaje de éxito antes de redirigir
      setError('');
      
      // Después de crear la cuenta, volver a gestión de agentes
      setTimeout(() => {
        navigate('/app/agentes');
      }, 500);
    } catch (err: any) {
      // Mejorar mensajes de error para indicar problemas con n8n
      const errorMessage = err.message || 'Error al crear la cuenta. Intenta de nuevo.';
      if (errorMessage.includes('ya existe') || errorMessage.includes('409')) {
        setError('El usuario ya existe. Este correo electrónico ya está registrado en el sistema.');
      } else if (errorMessage.includes('no pudo ser almacenado') || errorMessage.includes('almacenado')) {
        setError('Error al almacenar el usuario. Verifica que el webhook esté configurado correctamente.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200/50 animate-in fade-in slide-in-from-top">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/app/agentes')}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand-blue flex items-center justify-center shadow-brand-blue-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Crear Nueva Cuenta</h2>
              <p className="text-sm text-slate-500 font-normal">Registrar nuevo colaborador en el sistema</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="bg-accent-red/10 text-brand-red p-4 rounded-2xl flex items-start gap-3 border-2 border-accent-red/20 animate-in slide-in-from-top duration-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-brand-red" />
              <p className="text-sm font-normal tracking-normal text-brand-red">{error}</p>
            </div>
          )}

            <div className="space-y-2">
              <label className="block text-sm font-normal text-accent-gray tracking-normal ml-1 mb-2">Nombre Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-5 py-4 rounded-2xl border border-accent-light bg-accent-light focus:outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue focus:bg-white transition-all font-normal text-base placeholder:text-slate-400"
                style={{'--tw-ring-color': 'var(--color-accent-blue)'} as React.CSSProperties}
              />
            </div>

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
              <label className="block text-sm font-normal text-accent-gray tracking-normal ml-1 mb-2">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full px-5 py-4 rounded-2xl border border-accent-light bg-accent-light focus:outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue focus:bg-white transition-all font-normal text-base placeholder:text-slate-400"
                style={{'--tw-ring-color': 'var(--color-accent-blue)'} as React.CSSProperties}
              />
              <p className="text-xs text-accent-gray ml-1">Mínimo 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-normal text-accent-gray tracking-normal ml-1 mb-2">Confirmar Contraseña</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full px-5 py-4 rounded-2xl border border-accent-light bg-accent-light focus:outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue focus:bg-white transition-all font-normal text-base placeholder:text-slate-400"
                style={{'--tw-ring-color': 'var(--color-accent-blue)'} as React.CSSProperties}
              />
            </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/app/agentes')}
              className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-brand font-semibold py-3 rounded-xl transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group tracking-normal"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Crear Cuenta
                  <UserPlus className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;




