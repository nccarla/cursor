
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
      <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-2 border-red-200 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 bg-brand-red text-white rounded-xl flex items-center justify-center shadow-brand-red-lg">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-black mb-1" style={{color: 'var(--color-accent-darkred)'}}>Monitoreo de SLA en Tiempo Real</h3>
          <p className="text-sm font-medium" style={{color: 'var(--color-brand-red)'}}>Mostrando casos que requieren intervención inmediata por vencimiento o escalamiento.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border-2" style={{borderColor: 'rgba(200, 21, 27, 0.2)'}}>
          <p className="text-xs font-black uppercase tracking-wider mb-0.5" style={{color: 'var(--color-brand-red)'}}>Total</p>
          <p className="text-2xl font-black" style={{color: 'var(--color-accent-red)'}}>{criticos.length}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {criticos.length > 0 ? criticos.map(caso => (
          <div 
            key={caso.id}
            onClick={() => navigate(`/app/casos/${caso.id}`)}
            className="bg-white p-6 rounded-2xl border-2 border-slate-200/50 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 hover:-translate-y-0.5"
            style={{borderLeftColor: 'var(--color-brand-red)'}}
            onMouseEnter={(e) => e.currentTarget.style.borderLeftColor = 'var(--color-accent-red)'}
            onMouseLeave={(e) => e.currentTarget.style.borderLeftColor = 'var(--color-brand-red)'}
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="mt-1 p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100 shadow-sm">
                <AlertTriangle className={`w-6 h-6 ${caso.status === CaseStatus.ESCALADO ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-base font-black text-slate-900 transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-brand-red)'} onMouseLeave={(e) => e.currentTarget.style.color = ''}>{caso.id}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${STATE_COLORS[caso.status]}`}>
                    {caso.status}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-lg mb-1 truncate">{caso.subject}</h4>
                <p className="text-sm text-slate-600">Cliente: <span className="font-bold text-slate-800">{caso.clientName}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-6 pl-12 md:pl-0">
               <div className="text-right bg-red-50 px-4 py-2.5 rounded-xl border border-red-200">
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{color: 'var(--color-brand-red)'}}>Tiempo Abierto</p>
                  <div className="flex items-center gap-1.5 font-black" style={{color: 'var(--color-accent-red)'}}>
                     <Clock className="w-4 h-4" />
                     <span className="text-lg">{caso.diasAbierto} días</span>
                  </div>
               </div>
               <div className="text-right bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Agente</p>
                  <p className="text-sm font-bold text-slate-800">{caso.agenteAsignado.nombre}</p>
               </div>
               <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        )) : (
          <div className="bg-white p-20 text-center rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-10 h-10" style={{color: 'var(--color-accent-blue-2)'}} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No hay casos críticos</h3>
            <p className="text-slate-500 font-medium">Todos los casos están bajo control.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertasCriticas;
