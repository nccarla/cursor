
import { Case, CaseStatus, KPI, User, Role } from '../types';
import { MOCK_CASOS, MOCK_AGENTES, MOCK_USERS } from './mockData';
import { API_CONFIG } from '../config';

// Inicializar datos en localStorage si no existen
const initStorage = () => {
  if (!localStorage.getItem('intelfon_cases')) {
    localStorage.setItem('intelfon_cases', JSON.stringify(MOCK_CASOS));
  }
  if (!localStorage.getItem('intelfon_agents')) {
    localStorage.setItem('intelfon_agents', JSON.stringify(MOCK_AGENTES));
  }
};

// Función auxiliar para autenticación con webhook
const authenticateWithWebhook = async (email: string, password: string): Promise<User> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(API_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error de autenticación' }));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // El webhook debe retornar: { token: string, user: { id, name, role, avatar? } }
    if (!data.token || !data.user) {
      throw new Error('Respuesta del webhook inválida: falta token o información de usuario');
    }

    // Almacenar el token JWT para futuras peticiones
    localStorage.setItem('intelfon_token', data.token);
    
    // Verificar si el correo tiene un rol específico asignado y sobrescribir si es necesario
    const emailLower = email.toLowerCase().trim();
    const assignedRole = EMAIL_ROLE_MAPPING[emailLower];
    const assignedName = EMAIL_NAME_MAPPING[emailLower];
    const finalRole = assignedRole || data.user.role;
    
    // Almacenar información del usuario
    const user: User = {
      id: data.user.id,
      name: assignedName || data.user.name,
      role: finalRole,
      avatar: data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=0f172a&color=fff`
    };

    localStorage.setItem('intelfon_user', JSON.stringify(user));
    return user;
  } catch (error: any) {
    // Si es un error de red o timeout, lanzar el error
    if (error.name === 'AbortError') {
      throw new Error('Timeout: El servidor no respondió a tiempo');
    }
    if (error.message) {
      throw error;
    }
    throw new Error('Error de conexión con el servidor');
  }
};

// Mapeo de correos específicos a roles
const EMAIL_ROLE_MAPPING: Record<string, Role> = {
  'jromero@red.com.sv': 'GERENTE',
  'testredintelfon034@outlook.com': 'AGENTE',
  'testredintelfon035@outlook.com': 'SUPERVISOR',
};

// Mapeo de correos específicos a nombres mostrados
const EMAIL_NAME_MAPPING: Record<string, string> = {
  'jromero@red.com.sv': 'Javier Romero',
};

// Función auxiliar para autenticación en modo demo (fallback)
const authenticateDemo = (email: string): User => {
  initStorage();
  
  const emailLower = (email || '').toLowerCase().trim();
  
  // Verificar primero si el correo tiene un rol asignado específicamente
  let role: Role = EMAIL_ROLE_MAPPING[emailLower] || 'AGENTE';
  
  // Si no está en el mapeo específico, usar lógica genérica como fallback
  if (!EMAIL_ROLE_MAPPING[emailLower]) {
    if (emailLower.includes('supervisor')) role = 'SUPERVISOR';
    else if (emailLower.includes('gerente')) role = 'GERENTE';
    else role = 'AGENTE';
  }
  
  // Generar nombre del usuario basado en el correo o rol
  const emailPrefix = emailLower.split('@')[0];
  const userMatch = MOCK_USERS.find(u => u.name.toLowerCase().includes(emailPrefix));
  
  let userName: string;
  if (userMatch) {
    userName = userMatch.name;
  } else if (EMAIL_NAME_MAPPING[emailLower]) {
    userName = EMAIL_NAME_MAPPING[emailLower];
  } else {
    userName = role.charAt(0) + role.slice(1).toLowerCase() + ' Demo';
  }

  const user: User = {
    id: userMatch?.id || Math.random().toString(),
    name: userName,
    role: role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0f172a&color=fff`
  };

  localStorage.setItem('intelfon_user', JSON.stringify(user));
  return user;
};

export const api = {
  getUser(): User | null {
    const data = localStorage.getItem('intelfon_user');
    return data ? JSON.parse(data) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('intelfon_token');
  },

  async authenticate(email: string, pass: string): Promise<User> {
    // Intentar autenticación con webhook primero
    try {
      return await authenticateWithWebhook(email, pass);
    } catch (error: any) {
      // Si falla y el modo demo está habilitado, usar fallback
      if (API_CONFIG.DEMO_MODE_FALLBACK) {
        console.warn('Webhook no disponible, usando modo demo:', error.message);
        return authenticateDemo(email);
      }
      // Si el modo demo está deshabilitado, lanzar el error
      throw error;
    }
  },

  async getCases(): Promise<Case[]> {
    initStorage();
    const data = localStorage.getItem('intelfon_cases');
    const cases = data ? JSON.parse(data) : [];
    
    // Si es agente, solo ve sus casos
    const user = this.getUser();
    if (user?.role === 'AGENTE') {
      // Filtrar por ID de agente demo '1' o nombre
      return cases.filter((c: any) => 
        (c.agenteAsignado?.idAgente === '1') || 
        (c.agentId === '1') ||
        (c.agentName === user.name)
      );
    }
    return cases;
  },

  async getCasoById(id: string): Promise<Case | undefined> {
    const cases = await this.getCases();
    return cases.find(c => c.id === id || c.idCaso === id || c.ticketNumber === id);
  },

  async updateCaseStatus(id: string, status: string, detail: string, extra?: any): Promise<boolean> {
    const cases = await this.getCases();
    const idx = cases.findIndex((c: any) => (c.id === id || c.idCaso === id || c.ticketNumber === id));
    
    if (idx !== -1) {
      cases[idx].estado = status;
      cases[idx].status = status;
      if (!cases[idx].historial) cases[idx].historial = [];
      
      cases[idx].historial.unshift({
        fechaHora: new Date().toISOString(),
        detalle: detail || `Cambio de estado a ${status}`,
        usuario: this.getUser()?.name || 'Sistema'
      });

      if (extra?.resolucion) cases[idx].resolucion = extra.resolucion;
      
      localStorage.setItem('intelfon_cases', JSON.stringify(cases));
      return true;
    }
    return false;
  },

  async createCase(caseData: any): Promise<boolean> {
    const cases = await this.getCases();
    const newId = `CASO-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry = {
      ...caseData,
      idCaso: newId,
      id: newId,
      ticketNumber: newId,
      agenteAsignado: MOCK_AGENTES[0],
      agentId: MOCK_AGENTES[0].idAgente,
      agentName: MOCK_AGENTES[0].nombre,
      categoria: { nombre: 'General', slaDias: 2 },
      category: 'General',
      diasAbierto: 0,
      createdAt: new Date().toISOString(),
      historial: [{
        fechaHora: new Date().toISOString(),
        detalle: 'Caso creado manualmente en sistema',
        usuario: this.getUser()?.name || 'Sistema'
      }]
    };
    cases.unshift(newEntry);
    localStorage.setItem('intelfon_cases', JSON.stringify(cases));
    return true;
  },

  async getKPIs(): Promise<KPI> {
    const cases = await this.getCases();
    return {
      totalCases: cases.length,
      slaCompliance: 85,
      csatScore: 4.2
    };
  },

  async validateSession(): Promise<boolean> {
    return this.getUser() !== null;
  },

  async getAgentes(): Promise<any[]> {
    initStorage();
    const data = localStorage.getItem('intelfon_agents');
    return data ? JSON.parse(data) : MOCK_AGENTES;
  },

  async updateAgente(id: string, data: any): Promise<boolean> {
    const agentes = await this.getAgentes();
    const idx = agentes.findIndex(a => a.idAgente === id);
    if (idx !== -1) {
      agentes[idx] = { ...agentes[idx], ...data };
      localStorage.setItem('intelfon_agents', JSON.stringify(agentes));
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem('intelfon_user');
    localStorage.removeItem('intelfon_token');
    window.location.href = '#/login';
  },

  // Mocks para recuperación (sin uso real en demo)
  async requestPasswordReset(email: string) { return true; },
  async verifyResetCode(email: string, code: string) { return { ok: true, tempToken: 'demo' }; },
  async finalizePasswordReset(email: string, token: string, pass: string) { return true; }
};
