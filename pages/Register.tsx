import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAgent } from '../services/roundRobinService';
import { UserPlus, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

// Lista de países
const PAISES = [
  'El Salvador',
  'Guatemala',
  'Otro'
];

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pais, setPais] = useState('El Salvador');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setGeneratedPassword('');

    try {
      // Crear agente usando el webhook de Round Robin (genera contraseña automáticamente)
      const result = await createAgent(name, email, pais);
      
      if (result.success && result.password) {
        // Si llegamos aquí, el agente fue creado exitosamente
        setSuccess(true);
        setGeneratedPassword(result.password);
        
        // Después de 5 segundos, volver a gestión de agentes
        setTimeout(() => {
          navigate('/app/agentes');
        }, 5000);
      } else {
        throw new Error('No se pudo crear el agente. Intenta de nuevo.');
      }
    } catch (err: any) {
      // Mejorar mensajes de error
      const errorMessage = err.message || 'Error al crear el agente. Intenta de nuevo.';
      if (errorMessage.includes('ya existe') || errorMessage.includes('409')) {
        setError('El agente ya existe. Este correo electrónico ya está registrado en el sistema.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="rounded-2xl p-8 border animate-in fade-in slide-in-from-top" style={{backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: 'rgba(148, 163, 184, 0.15)'}}>
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/app/agentes')}
            className="p-2 rounded-xl transition-colors"
            style={{color: '#94a3b8'}}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#cbd5e1';
              e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand-blue flex items-center justify-center shadow-brand-blue-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold" style={{color: '#ffffff'}}>Crear Nueva Cuenta</h2>
              <p className="text-sm font-normal" style={{color: '#94a3b8'}}>Registrar nuevo colaborador en el sistema</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {success && generatedPassword && (
            <div className="bg-green-500/10 text-green-400 p-6 rounded-2xl flex flex-col gap-3 border-2 border-green-500/20 animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold tracking-normal text-green-400 mb-2">¡Agente creado exitosamente!</p>
                  <p className="text-xs font-normal text-green-300/80 mb-3">La contraseña temporal generada es:</p>
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-green-500/30">
                    <p className="text-2xl font-bold text-center text-green-400 font-mono tracking-wider">
                      {generatedPassword}
                    </p>
                  </div>
                  <p className="text-xs font-normal text-green-300/80 mt-3">
                    El agente puede iniciar sesión con esta contraseña. Se recomienda cambiarla después del primer acceso.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && !success && (
            <div className="bg-accent-red/10 text-brand-red p-4 rounded-2xl flex items-start gap-3 border-2 border-accent-red/20 animate-in slide-in-from-top duration-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-brand-red" />
              <p className="text-sm font-normal tracking-normal text-brand-red">{error}</p>
            </div>
          )}

            <div className="space-y-2">
              <label className="block text-sm font-normal tracking-normal ml-1 mb-2" style={{color: '#cbd5e1'}}>Nombre Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-2 transition-all font-normal text-base placeholder:text-slate-500"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                  color: '#ffffff',
                  '--tw-ring-color': 'var(--color-accent-blue)',
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent-blue)';
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-normal tracking-normal ml-1 mb-2" style={{color: '#cbd5e1'}}>Correo Institucional</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@intelfon.com"
                className="w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-2 transition-all font-normal text-base placeholder:text-slate-500"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                  color: '#ffffff',
                  '--tw-ring-color': 'var(--color-accent-blue)',
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent-blue)';
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-normal tracking-normal ml-1 mb-2" style={{color: '#cbd5e1'}}>País de Origen</label>
              <select
                required
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border focus:outline-none focus:ring-2 transition-all font-normal text-base"
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  borderColor: 'rgba(148, 163, 184, 0.2)',
                  color: '#ffffff',
                  '--tw-ring-color': 'var(--color-accent-blue)',
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent-blue)';
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                  e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                }}
              >
                {PAISES.map((p) => (
                  <option key={p} value={p} style={{backgroundColor: 'rgb(30, 41, 59)', color: '#ffffff'}}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/app/agentes')}
              className="flex-1 px-6 py-3 border-2 font-semibold rounded-xl transition-all"
              style={{
                borderColor: 'rgba(148, 163, 184, 0.3)',
                color: '#cbd5e1',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
              }}
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
