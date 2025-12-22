
import { User, CaseStatus, Agente, Cliente, Categoria, Channel, NotificationChannel } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Juan Agente', role: 'AGENTE', avatar: 'https://ui-avatars.com/api/?name=Juan+Agente' },
  { id: '2', name: 'Maria Supervisor', role: 'SUPERVISOR', avatar: 'https://ui-avatars.com/api/?name=Maria+Supervisor' },
  { id: '3', name: 'Carlos Gerente', role: 'GERENTE', avatar: 'https://ui-avatars.com/api/?name=Carlos+Gerente' },
];

export const MOCK_AGENTES: Agente[] = [
  { idAgente: '1', nombre: 'Juan Agente', email: 'agente@intelfon.com', estado: 'Activo', ordenRoundRobin: 1, ultimoCasoAsignado: '2023-10-25T10:00:00Z', casosActivos: 5 },
  { idAgente: '4', nombre: 'Ana Agente', email: 'ana@intelfon.com', estado: 'Activo', ordenRoundRobin: 2, ultimoCasoAsignado: '2023-10-25T09:30:00Z', casosActivos: 3 },
  { idAgente: '5', nombre: 'Luis Agente', email: 'luis@intelfon.com', estado: 'Vacaciones', ordenRoundRobin: 3, ultimoCasoAsignado: '2023-10-20T15:00:00Z', casosActivos: 0 },
];

const MOCK_CLIENTE: Cliente = {
  idCliente: 'C-001',
  nombreEmpresa: 'TecnoCorp SA',
  contactoPrincipal: 'Roberto Gomez',
  email: 'roberto@tecnocorp.com',
  telefono: '+503 2222-3333',
  pais: 'El Salvador',
  estado: 'Activo'
};

const MOCK_CATEGORIA: Categoria = {
  idCategoria: 'CAT-001',
  nombre: 'Falla Técnica',
  slaDias: 2,
  diasAlertaSupervisor: 1,
  diasAlertaGerente: 2,
  activa: true
};

export const MOCK_CASOS: any[] = [
  {
    id: 'CASO-0001',
    idCaso: 'CASO-0001',
    ticketNumber: 'CASO-0001',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    fechaCreacion: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    fechaActualizacion: new Date().toISOString(),
    cliente: MOCK_CLIENTE,
    clientName: MOCK_CLIENTE.nombreEmpresa,
    clientEmail: 'soporte@tecnocorp.com',
    clientPhone: '+503 2222-3333',
    categoria: MOCK_CATEGORIA,
    category: MOCK_CATEGORIA.nombre,
    status: CaseStatus.EN_PROCESO,
    estado: CaseStatus.EN_PROCESO,
    agenteAsignado: MOCK_AGENTES[0],
    agentId: MOCK_AGENTES[0].idAgente,
    agentName: MOCK_AGENTES[0].nombre,
    canalOrigen: Channel.EMAIL,
    origin: Channel.EMAIL,
    subject: 'Error en router principal',
    asunto: 'Error en router principal',
    description: 'El router del piso 3 no entrega direccionamiento IP.',
    descripcion: 'El router del piso 3 no entrega direccionamiento IP.',
    canalNotificacion: NotificationChannel.AMBOS,
    diasAbierto: 3,
    slaExpired: true,
    priority: 'Alta',
    historial: [
      { idHistorial: 'H1', idCaso: 'CASO-0001', fechaHora: '2023-10-22T08:00:00Z', accion: 'Creación', estadoAnterior: null, estadoNuevo: CaseStatus.NUEVO, usuario: 'Sistema', detalle: 'Caso creado vía Email' },
      { idHistorial: 'H2', idCaso: 'CASO-0001', fechaHora: '2023-10-22T08:05:00Z', accion: 'Asignación', estadoAnterior: null, estadoNuevo: null, usuario: 'Sistema', detalle: 'Asignado automáticamente a Juan Agente (Round Robin)' }
    ]
  },
  {
    id: 'CASO-0002',
    idCaso: 'CASO-0002',
    ticketNumber: 'CASO-0002',
    createdAt: new Date().toISOString(),
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    cliente: MOCK_CLIENTE,
    clientName: MOCK_CLIENTE.nombreEmpresa,
    clientEmail: 'admin@tecnocorp.com',
    clientPhone: '+503 2222-3334',
    categoria: MOCK_CATEGORIA,
    category: MOCK_CATEGORIA.nombre,
    status: CaseStatus.NUEVO,
    estado: CaseStatus.NUEVO,
    agenteAsignado: MOCK_AGENTES[1],
    agentId: MOCK_AGENTES[1].idAgente,
    agentName: MOCK_AGENTES[1].nombre,
    canalOrigen: Channel.TELEFONO,
    origin: Channel.TELEFONO,
    subject: 'Consulta de facturación',
    asunto: 'Consulta de facturación',
    description: 'El cliente solicita detalle del cargo de octubre.',
    descripcion: 'El cliente solicita detalle del cargo de octubre.',
    canalNotificacion: NotificationChannel.EMAIL,
    diasAbierto: 0,
    slaExpired: false,
    priority: 'Media',
    historial: []
  },
  {
    id: 'CASO-0003',
    idCaso: 'CASO-0003',
    ticketNumber: 'CASO-0003',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    fechaCreacion: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    fechaActualizacion: new Date().toISOString(),
    cliente: MOCK_CLIENTE,
    clientName: MOCK_CLIENTE.nombreEmpresa,
    clientEmail: 'ceo@tecnocorp.com',
    clientPhone: '+503 2222-3335',
    categoria: MOCK_CATEGORIA,
    category: MOCK_CATEGORIA.nombre,
    status: CaseStatus.ESCALADO,
    estado: CaseStatus.ESCALADO,
    agenteAsignado: MOCK_AGENTES[0],
    agentId: MOCK_AGENTES[0].idAgente,
    agentName: MOCK_AGENTES[0].nombre,
    canalOrigen: Channel.WHATSAPP,
    origin: Channel.WHATSAPP,
    subject: 'Interrupción masiva de servicio',
    asunto: 'Interrupción masiva de servicio',
    description: 'Reportan caída total en la zona norte.',
    descripcion: 'Reportan caída total en la zona norte.',
    canalNotificacion: NotificationChannel.WHATSAPP,
    diasAbierto: 5,
    slaExpired: true,
    priority: 'Alta',
    historial: []
  }
];
