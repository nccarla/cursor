
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Case, CaseStatus } from '../types';
import { STATE_COLORS } from '../constants';
import { Search, Plus, Filter, ChevronRight, X } from 'lucide-react';

const BandejaCasos: React.FC = () => {
  const [casos, setCasos] = useState<Case[]>([]);
  const [filtered, setFiltered] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  
  const [newCase, setNewCase] = useState({
    subject: '',
    description: '',
    clientName: '',
    email: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadCasos();
  }, []);

  const loadCasos = async () => {
    const data = await api.getCases();
    setCasos([...data]);
  };

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    let result = casos.filter(c => {
      const id = (c.id || c.ticketNumber || '').toLowerCase();
      const client = (c.clientName || '').toLowerCase();
      const subject = (c.subject || '').toLowerCase();
      
      return id.includes(term) || client.includes(term) || subject.includes(term);
    });

    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter || (c as any).estado === statusFilter);
    }

    setFiltered(result);
  }, [searchTerm, statusFilter, casos]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCase({
        subject: newCase.subject,
        description: newCase.description,
        clientName: newCase.clientName,
        clientEmail: newCase.email,
        status: CaseStatus.NUEVO,
        createdAt: new Date().toISOString(),
      });
      setShowModal(false);
      setNewCase({ subject: '', description: '', clientName: '', email: '' });
      loadCasos();
    } catch (err) {
      alert('Error al crear el caso');
    }
  };

  return (
    <div className="space-y-6">
      <div 
        className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-6 rounded-3xl shadow-xl border backdrop-blur-sm bg-white"
        style={{
          borderColor: 'rgba(226, 232, 240, 0.6)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por ID, Cliente o Asunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:bg-white transition-all text-sm font-medium shadow-sm hover:shadow-md"
            style={{
              '--tw-ring-color': 'var(--color-accent-blue)',
              '--tw-ring-opacity': '0.2'
            } as React.CSSProperties & { '--tw-ring-color': string, '--tw-ring-opacity': string }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-accent-blue)';
              e.target.style.boxShadow = '0 0 0 4px rgba(16, 122, 180, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(226, 232, 240, 0.6)';
              e.target.style.boxShadow = '';
            }}
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none transition-colors" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-14 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none transition-all text-sm font-medium appearance-none cursor-pointer shadow-sm hover:bg-white hover:shadow-md"
              style={{color: 'var(--color-slate-700)'}}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-accent-blue)';
                e.target.style.boxShadow = '0 0 0 4px rgba(16, 122, 180, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                e.target.style.boxShadow = '';
              }}
            >
              <option value="all">Todos los Estados</option>
              {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="text-white px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            style={{background: 'linear-gradient(135deg, var(--color-brand-red), var(--color-accent-red))'}}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-accent-red), var(--color-brand-red))';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-brand-red), var(--color-accent-red))';
              e.currentTarget.style.transform = '';
            }}
          >
            <Plus className="w-5 h-5" /> Nuevo Caso
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl border p-16 text-center" style={{borderColor: 'rgba(226, 232, 240, 0.6)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}>
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Search className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No se encontraron casos</h3>
          <p className="text-slate-500 text-sm font-medium">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-xl border overflow-hidden" style={{borderColor: 'rgba(226, 232, 240, 0.6)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-slate-50 via-slate-50 to-slate-100/80 border-b" style={{borderColor: 'rgba(226, 232, 240, 0.6)'}}>
                <tr>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">ID Caso</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">Cliente</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">Categoría</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase">Estado</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-700 tracking-wide uppercase text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{borderColor: 'rgba(226, 232, 240, 0.3)'}}>
                {filtered.map((caso, idx) => (
                  <tr 
                    key={caso.id} 
                    className={`transition-all duration-300 cursor-pointer group border-l-4 border-transparent animate-in slide-in-from-left fade-in hover:bg-slate-50/50`}
                    style={{
                      animationDelay: `${idx * 30}ms`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(16, 122, 180, 0.04)';
                      e.currentTarget.style.borderLeftColor = 'var(--color-accent-blue)';
                      e.currentTarget.style.transform = 'translateX(2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(16, 122, 180, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.borderLeftColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '';
                    }} 
                    onClick={() => navigate(`/app/casos/${caso.id}`)}
                  >
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-accent-blue transition-colors">{caso.ticketNumber || (caso as any).idCaso}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-slate-800">{caso.clientName || caso.cliente?.nombreEmpresa}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center text-xs font-semibold px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 shadow-sm">
                        {caso.category || caso.categoria?.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center text-xs font-bold px-3.5 py-2 rounded-xl border shadow-sm ${STATE_COLORS[(caso.status || (caso as any).estado) as CaseStatus]}`}>
                        {caso.status || (caso as any).estado}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end">
                        <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-accent-blue/10 transition-all">
                          <ChevronRight className="w-5 h-5 transition-all" style={{color: 'var(--color-slate-400)'}} onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent-blue)'; e.currentTarget.style.transform = 'translateX(4px)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-slate-400)'; e.currentTarget.style.transform = ''; }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" style={{backgroundColor: 'rgba(20, 84, 120, 0.7)'}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 scale-in duration-300 border" style={{borderColor: 'rgba(226, 232, 240, 0.6)', boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.25)'}}>
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-slate-50 via-white to-slate-50" style={{borderColor: 'rgba(226, 232, 240, 0.6)'}}>
              <div>
                <h3 className="text-2xl font-bold text-slate-900" style={{letterSpacing: '-0.02em'}}>Crear Nuevo Caso SAC</h3>
                <p className="text-sm text-slate-500 mt-1.5 font-medium">Completa los datos del caso</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 tracking-normal mb-2.5">Empresa / Cliente</label>
                <input 
                  type="text" required 
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue transition-all bg-slate-50 focus:bg-white font-medium shadow-sm hover:shadow-md"
                  placeholder="Nombre de la empresa"
                  value={newCase.clientName}
                  onChange={e => setNewCase({...newCase, clientName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 tracking-normal mb-2.5">Asunto</label>
                <input 
                  type="text" required 
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue transition-all bg-slate-50 focus:bg-white font-medium shadow-sm hover:shadow-md"
                  placeholder="Resumen del caso"
                  value={newCase.subject}
                  onChange={e => setNewCase({...newCase, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 tracking-normal mb-2.5">Descripción</label>
                <textarea 
                  required rows={4}
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue transition-all bg-slate-50 focus:bg-white font-medium resize-none shadow-sm hover:shadow-md"
                  placeholder="Detalles del caso..."
                  value={newCase.description}
                  onChange={e => setNewCase({...newCase, description: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 tracking-normal mb-2.5">Email Cliente</label>
                <input 
                  type="email" required 
                  className="w-full px-5 py-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-accent-blue/20 focus:border-accent-blue transition-all bg-slate-50 focus:bg-white font-medium shadow-sm hover:shadow-md"
                  placeholder="cliente@empresa.com"
                  value={newCase.email}
                  onChange={e => setNewCase({...newCase, email: e.target.value})}
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-4 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200 shadow-sm hover:shadow-md"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-gradient-brand-blue text-white text-sm font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  style={{background: 'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-blue-2))'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-brand-blue), var(--color-accent-blue))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-blue-2))';
                  }}
                >
                  Registrar Caso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BandejaCasos;
