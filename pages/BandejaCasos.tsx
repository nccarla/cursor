
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
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por ID, Cliente o Asunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none"
            >
              <option value="all">Todos los Estados</option>
              {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Caso
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID Caso</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((caso) => (
              <tr key={caso.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(`/app/casos/${caso.id}`)}>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-slate-900">{caso.ticketNumber || (caso as any).idCaso}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-800">{caso.clientName || caso.cliente?.nombreEmpresa}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                    {caso.category || caso.categoria?.nombre}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATE_COLORS[(caso.status || (caso as any).estado) as CaseStatus]}`}>
                    {caso.status || (caso as any).estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-slate-800">Crear Nuevo Caso SAC</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empresa / Cliente</label>
                <input 
                  type="text" required 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                  value={newCase.clientName}
                  onChange={e => setNewCase({...newCase, clientName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asunto</label>
                <input 
                  type="text" required 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                  value={newCase.subject}
                  onChange={e => setNewCase({...newCase, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                <textarea 
                  required rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                  value={newCase.description}
                  onChange={e => setNewCase({...newCase, description: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Cliente</label>
                <input 
                  type="email" required 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none"
                  value={newCase.email}
                  onChange={e => setNewCase({...newCase, email: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all">
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
