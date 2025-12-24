
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Case, CaseStatus, Cliente, Categoria, Channel } from '../types';
import { STATE_COLORS } from '../constants';
import { Search, Plus, Filter, ChevronRight, X } from 'lucide-react';

const BandejaCasos: React.FC = () => {
  const [casos, setCasos] = useState<Case[]>([]);
  const [filtered, setFiltered] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  const [newCase, setNewCase] = useState({
    clienteId: '',
    categoriaId: '',
    contactChannel: Channel.WEB,
    subject: '',
    description: '',
    clientName: '',
    contactName: '',
    phone: '',
    email: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadCasos();
    loadClientes();
    loadCategorias();
  }, []);

  const loadClientes = async () => {
    const data = await api.getClientes();
    setClientes(data);
  };

  const loadCategorias = async () => {
    const data = await api.getCategorias();
    setCategorias(data);
  };

  const handleClienteChange = async (clienteId: string) => {
    if (!clienteId) {
      setNewCase({
        ...newCase,
        clienteId: '',
        clientName: '',
        contactName: '',
        phone: '',
        email: '',
        contactChannel: Channel.WEB,
      });
      return;
    }

    const cliente = await api.getClienteById(clienteId);
    if (cliente) {
      setNewCase({
        ...newCase,
        clienteId: cliente.idCliente,
        clientName: cliente.nombreEmpresa,
        contactName: cliente.contactoPrincipal,
        phone: cliente.telefono,
        email: cliente.email,
      });
    }
  };

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
        clienteId: newCase.clienteId,
        categoriaId: newCase.categoriaId,
        contactChannel: newCase.contactChannel,
        subject: newCase.subject,
        description: newCase.description,
        clientName: newCase.clientName,
        contactName: newCase.contactName,
        phone: newCase.phone,
        clientEmail: newCase.email,
        status: CaseStatus.NUEVO,
        createdAt: new Date().toISOString(),
      });
      setShowModal(false);
      setNewCase({ clienteId: '', categoriaId: '', contactChannel: Channel.WEB, subject: '', description: '', clientName: '', contactName: '', phone: '', email: '' });
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
        <div className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" style={{backgroundColor: 'rgba(20, 84, 120, 0.6)'}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden transform animate-in zoom-in-95 scale-in duration-300 border border-slate-200/50 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">Crear Nuevo Caso SAC</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Completa los datos del caso</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Cliente <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={newCase.clienteId}
                      onChange={(e) => handleClienteChange(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium appearance-none cursor-pointer"
                    >
                      <option value="">Seleccione un cliente...</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.idCliente} value={cliente.idCliente}>
                          {cliente.idCliente} - {cliente.nombreEmpresa}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Empresa / Cliente</label>
                    <input 
                      type="text" required 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium"
                      placeholder="Nombre de la empresa"
                      value={newCase.clientName}
                      onChange={e => setNewCase({...newCase, clientName: e.target.value})}
                      readOnly={!!newCase.clienteId}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Contacto Principal</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium"
                        placeholder="Nombre contacto"
                        value={newCase.contactName}
                        onChange={e => setNewCase({...newCase, contactName: e.target.value})}
                        readOnly={!!newCase.clienteId}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Teléfono</label>
                      <input 
                        type="tel"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium"
                        placeholder="+50370000000"
                        value={newCase.phone}
                        onChange={e => setNewCase({...newCase, phone: e.target.value})}
                        readOnly={!!newCase.clienteId}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Email Cliente</label>
                    <input 
                      type="email" required 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium"
                      placeholder="cliente@empresa.com"
                      value={newCase.email}
                      onChange={e => setNewCase({...newCase, email: e.target.value})}
                      readOnly={!!newCase.clienteId}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Medio de Contacto <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={newCase.contactChannel}
                      onChange={(e) => setNewCase({...newCase, contactChannel: e.target.value as Channel})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium appearance-none cursor-pointer"
                    >
                      <option value={Channel.WEB}>Web</option>
                      <option value={Channel.EMAIL}>Email</option>
                      <option value={Channel.WHATSAPP}>WhatsApp</option>
                      <option value={Channel.TELEFONO}>Teléfono</option>
                      <option value={Channel.REDES_SOCIALES}>Redes Sociales</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 tracking-normal mb-2">Categoría <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={newCase.categoriaId}
                      onChange={(e) => setNewCase({...newCase, categoriaId: e.target.value})}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium appearance-none cursor-pointer"
                    >
                      <option value="">Seleccione una categoría...</option>
                      {categorias.length > 0 ? (
                        categorias.map((categoria) => (
                          <option key={categoria.idCategoria} value={categoria.idCategoria}>
                            {categoria.nombre} — SLA {categoria.slaDias} días
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Cargando categorías...</option>
                      )}
                    </select>
                    {categorias.length === 0 && (
                      <p className="text-xs text-slate-400 mt-1">Cargando categorías...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Asunto <span className="text-red-500">*</span></label>
                    <input 
                      type="text" required 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium"
                      placeholder="Resumen del caso"
                      value={newCase.subject}
                      onChange={e => setNewCase({...newCase, subject: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Descripción <span className="text-red-500">*</span></label>
                    <textarea 
                      required rows={8}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all bg-slate-50 focus:bg-white font-medium resize-none"
                      placeholder="Detalles del caso..."
                      value={newCase.description}
                      onChange={e => setNewCase({...newCase, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 text-white text-sm font-bold rounded-xl transition-all"
                  style={{background: 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))', boxShadow: '0 12px 30px rgba(200, 21, 27, 0.25)'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, var(--color-accent-red), var(--color-brand-red))';
                    e.currentTarget.style.boxShadow = '0 14px 34px rgba(245, 41, 56, 0.28)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, var(--color-brand-red), var(--color-accent-red))';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(200, 21, 27, 0.25)';
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
