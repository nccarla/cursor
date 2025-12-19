
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Caso, CaseStatus } from '../types';
import { STATE_COLORS } from '../constants';
import { ShieldAlert, Clock, ChevronRight, AlertTriangle } from 'lucide-react';

const AlertasCriticas: React.FC = () => {
  const [criticos, setCriticos] = useState<Caso[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCases().then(list => {
      const filtered = list.filter(c => c.diasAbierto >= c.categoria.slaDias || c.status === CaseStatus.ESCALADO);
      setCriticos(filtered);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-red-900">Monitoreo de SLA en Tiempo Real</h3>
          <p className="text-red-700 text-sm">Mostrando casos que requieren intervención inmediata por vencimiento o escalamiento.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {criticos.length > 0 ? criticos.map(caso => (
          <div 
            key={caso.id}
            onClick={() => navigate(`/app/casos/${caso.id}`)}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2 bg-slate-50 rounded-lg">
                <AlertTriangle className={`w-5 h-5 ${caso.status === CaseStatus.ESCALADO ? 'text-red-500' : 'text-amber-500'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black text-slate-900">{caso.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATE_COLORS[caso.status]}`}>
                    {caso.status}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800">{caso.subject}</h4>
                <p className="text-xs text-slate-400">Cliente: <span className="font-semibold text-slate-600">{caso.clientName}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-8 pl-12 md:pl-0">
               <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tiempo Abierto</p>
                  <div className="flex items-center gap-1 text-red-600 font-black">
                     <Clock className="w-4 h-4" />
                     <span>{caso.diasAbierto} días</span>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Agente</p>
                  <p className="text-sm font-bold text-slate-700">{caso.agenteAsignado.nombre}</p>
               </div>
               <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        )) : (
          <div className="bg-white p-20 text-center rounded-2xl border border-dashed border-slate-200">
             <p className="text-slate-400 font-medium">No se detectan casos críticos en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertasCriticas;
