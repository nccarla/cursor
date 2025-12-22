
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ROLE_HOMEPAGE } from '../constants';
import { ShieldAlert, Home } from 'lucide-react';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const user = api.getUser();
  const homePath = user ? ROLE_HOMEPAGE[user.role] : '/login';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Acceso No Autorizado</h1>
        <p className="text-slate-500 mb-8 font-medium">No tienes los permisos necesarios para ver esta sección del sistema.</p>
        <button
          onClick={() => navigate(homePath)}
          className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-700 transition-all shadow-xl shadow-slate-200 inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" /> Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
