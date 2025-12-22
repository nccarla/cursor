
import { Case, CaseStatus, KPI, User, Role } from '../types';
import { MOCK_CASOS, MOCK_AGENTES, MOCK_USERS } from './mockData';
import { API_CONFIG } from '../config';
import { emailService } from './emailService';

// Inicializar datos en localStorage si no existen
const initStorage = () => {
  if (!localStorage.getItem('intelfon_cases')) {
    localStorage.setItem('intelfon_cases', JSON.stringify(MOCK_CASOS));
  }
  if (!localStorage.getItem('intelfon_agents')) {
    localStorage.setItem('intelfon_agents', JSON.stringify(MOCK_AGENTES));
  }
};

// Función auxiliar para llamar al webhook de n8n
// Solo permite operaciones si el webhook responde correctamente
// type: 'login' | 'forgot_password' | 'register'
const callWebhook = async (scenario: 'login' | 'reset_password' | 'new_account', payload: any) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  // Mapear scenario a type para n8n
  const typeMap: Record<'login' | 'reset_password' | 'new_account', string> = {
    'login': 'login',
    'reset_password': 'reset_password',
    'new_account': 'register'
  };

  const type = typeMap[scenario];

  // Preparar el payload final
  const finalPayload = {
    type,
    ...payload,
  };

  console.log('Enviando petición al webhook:', {
    url: API_CONFIG.WEBHOOK_URL,
    scenario,
    type,
    payload: finalPayload,
  });

  try {
    // Intentar la petición con CORS
    let response: Response;
    try {
      response = await fetch(API_CONFIG.WEBHOOK_URL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(finalPayload),
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      // Si hay un error de red o CORS, proporcionar un mensaje más específico
      if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
        throw new Error('Error de conexión: El servidor n8n no está permitiendo peticiones CORS. Contacta al administrador para configurar CORS en el servidor.');
      }
      throw fetchError;
    }

    clearTimeout(timeoutId);

    // Verificar si la respuesta es válida antes de intentar parsear JSON
    if (!response.ok && response.status === 0) {
      throw new Error('Error de CORS: El servidor no está permitiendo peticiones desde este origen.');
    }

    // Intentar parsear JSON, pero manejar respuestas vacías o no-JSON
    let result: any;
    try {
      const text = await response.text();
      if (text.trim() === '') {
        // Respuesta vacía se considera éxito para request_reset
        result = {};
      } else {
        result = JSON.parse(text);
      }
    } catch (parseError) {
      // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
      if (response.ok) {
        console.log('Respuesta no-JSON recibida, considerando como éxito');
        result = { success: true };
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }
    
    console.log('Respuesta del webhook (raw):', result, 'Status:', response.status);
    
    // Verificar si hay error en la respuesta (formato de Make.com/n8n)
    if (result && result.error === true) {
      throw new Error(result.message || 'Error en la operación');
    }

    // Si la respuesta no es ok, también tratar como error
    if (!response.ok) {
      throw new Error(result?.message || `Error ${response.status}: ${response.statusText}`);
    }

    // Validaciones según el escenario (formato de Make.com/n8n)
    if (scenario === 'login' || scenario === 'new_account') {
      console.log('📦 Respuesta del webhook para', scenario, ':', result);
      
      // Para login y register, el webhook puede retornar: { id, name, role, email }
      // O puede retornar un formato diferente
      
      // Verificar si hay campos faltantes y proporcionar mensajes más específicos
      const missingFields: string[] = [];
      if (!result.id) missingFields.push('id');
      if (!result.name) missingFields.push('name');
      if (!result.role) missingFields.push('role');
      
      if (missingFields.length > 0) {
        console.error('❌ Campos faltantes en la respuesta del webhook:', missingFields);
        console.error('📋 Respuesta completa recibida:', JSON.stringify(result, null, 2));
        throw new Error(`Respuesta del webhook inválida. Faltan datos del usuario: ${missingFields.join(', ')}. Verifica que el webhook esté configurado para retornar id, name y role.`);
      }
      
      // Validar que el rol sea válido
      if (!['AGENTE', 'SUPERVISOR', 'GERENTE'].includes(result.role)) {
        console.error('❌ Rol inválido recibido:', result.role);
        throw new Error(`Rol de usuario inválido: "${result.role}". El rol debe ser uno de: AGENTE, SUPERVISOR, GERENTE.`);
      }
      
      // Normalizar la respuesta al formato esperado internamente
      const normalizedResponse = {
        token: `token-${result.id}-${Date.now()}`, // Generar token local basado en el ID
        user: {
          id: result.id,
          name: result.name,
          role: result.role,
          email: result.email || payload?.email || '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.name)}&background=0f172a&color=fff`
        }
      };
      
      console.log('✅ Respuesta normalizada:', normalizedResponse);
      return normalizedResponse;
    } else if (scenario === 'reset_password') {
      // Para reset password, validar según la acción
      if (payload.action === 'verify_code') {
        // Para verificar código, debe retornar tempToken
        if (!result.tempToken) {
          throw new Error('Código de verificación inválido o expirado');
        }
      } else if (payload.action === 'request_reset') {
        // Para solicitar reset, solo lanzar error si hay error explícito
        // Cualquier otra respuesta (incluso vacía) se considera éxito
        if (result && (result.error === true || result.success === false)) {
          throw new Error(result.message || 'Error al solicitar código de recuperación. Verifica que el correo esté registrado.');
        }
        // Si no hay error explícito, considerar como éxito
        // El webhook puede retornar: {}, { success: true }, { message: "Código enviado" }, etc.
        console.log('✅ Webhook respondió exitosamente para request_reset');
        console.log('📧 Email solicitado:', payload.email);
        console.log('📦 Respuesta del webhook:', result);
        
        // Si el webhook retorna un mensaje, mostrarlo
        if (result && result.message) {
          console.log('💬 Mensaje del webhook:', result.message);
        }
      } else if (payload.action === 'finalize_reset') {
        // Para finalizar reset, validar éxito
        if (result && (result.error === true || result.success === false)) {
          throw new Error(result.message || 'Error al restablecer la contraseña');
        }
      }
      return result;
    }
    
    return result;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: El servidor no respondió a tiempo. Verifica tu conexión.');
    }
    // Detectar errores específicos de CORS
    if (error.message && (
      error.message.includes('CORS') || 
      error.message.includes('cors') ||
      error.message.includes('fetch') ||
      error.message.includes('NetworkError') ||
      error.name === 'TypeError'
    )) {
      // En desarrollo, sugerir usar el proxy
      const isDevelopment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isDevelopment) {
        throw new Error('Error de CORS detectado. El proxy de desarrollo debería manejar esto automáticamente. Verifica la configuración de Vite.');
      }
      // En producción, indicar que el servidor necesita configurar CORS
      throw new Error('Error de CORS: El servidor n8n necesita permitir peticiones desde este dominio. Contacta al administrador para configurar los headers CORS en n8n.');
    }
    if (error.message) {
      throw error;
    }
    throw new Error('Error de conexión con el servidor. La cuenta debe estar registrada en el sistema.');
  }
};

// Función auxiliar para autenticación con webhook (escenario: login)
// Solo permite acceso si el webhook de ClickUp valida la cuenta
const authenticateWithWebhook = async (email: string, password: string): Promise<User> => {
  const data = await callWebhook('login', { email, password });
  
  // El webhook debe retornar: { token: string, user: { id, name, role, avatar? } }
  // Si no hay token o usuario, significa que la cuenta no está registrada o las credenciales son inválidas
  if (!data.token || !data.user) {
    throw new Error('Credenciales inválidas o cuenta no registrada en el sistema');
  }

  // Validar que el usuario tenga un ID válido
  if (!data.user.id) {
    throw new Error('La cuenta no está correctamente registrada en el sistema');
  }

  // Validar que el token sea una cadena no vacía
  if (!data.token || typeof data.token !== 'string' || data.token.trim() === '') {
    throw new Error('Token de autenticación inválido. La cuenta no está correctamente registrada.');
  }

  // Validar que el usuario tenga nombre válido
  if (!data.user.name || typeof data.user.name !== 'string' || data.user.name.trim() === '') {
    throw new Error('Información de usuario incompleta. La cuenta no está correctamente registrada.');
  }

  // Validar que el rol sea válido y venga del webhook
  const userRole = data.user.role;
  if (!userRole || !['AGENTE', 'SUPERVISOR', 'GERENTE'].includes(userRole)) {
    throw new Error('Rol de usuario inválido. La cuenta debe tener un rol válido asignado.');
  }

  // Almacenar el token JWT para futuras peticiones
  localStorage.setItem('intelfon_token', data.token);
  
  // Almacenar información del usuario EXACTAMENTE como viene del webhook
  // NO se permite sobrescribir con mapeos locales - todo debe venir del webhook
  const user: User = {
    id: data.user.id,
    name: data.user.name.trim(),
    role: userRole,
    avatar: data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=0f172a&color=fff`
  };

  localStorage.setItem('intelfon_user', JSON.stringify(user));
  return user;
};

// Cuentas demo permitidas (solo para desarrollo/pruebas)
// Estas cuentas pueden acceder sin pasar por el webhook
const DEMO_ACCOUNTS: Record<string, { role: Role; name: string }> = {
  'agente@intelfon.com': { role: 'AGENTE', name: 'Agente Demo' },
  'supervisor@intelfon.com': { role: 'SUPERVISOR', name: 'Supervisor Demo' },
  'gerente@intelfon.com': { role: 'GERENTE', name: 'Gerente Demo' },
};

// Función auxiliar para autenticación en modo demo (solo para cuentas demo permitidas)
const authenticateDemo = (email: string): User => {
  initStorage();
  
  const emailLower = (email || '').toLowerCase().trim();
  const demoAccount = DEMO_ACCOUNTS[emailLower];
  
  if (!demoAccount) {
    throw new Error('Cuenta demo no permitida');
  }
  
  const user: User = {
    id: `demo-${demoAccount.role.toLowerCase()}`,
    name: demoAccount.name,
    role: demoAccount.role,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(demoAccount.name)}&background=0f172a&color=fff`
  };

  // Generar un token demo simple
  const demoToken = `demo-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  localStorage.setItem('intelfon_token', demoToken);
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
    // Validaciones previas
    if (!email || !email.trim()) {
      throw new Error('El correo electrónico es requerido');
    }
    if (!pass || !pass.trim()) {
      throw new Error('La contraseña es requerida');
    }
    
    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Formato de correo electrónico inválido');
    }
    
    const emailLower = email.trim().toLowerCase();
    
    // Verificar si es una cuenta demo permitida
    if (DEMO_ACCOUNTS[emailLower]) {
      // Para cuentas demo, cualquier contraseña es válida
      return authenticateDemo(emailLower);
    }
    
    // Para todas las demás cuentas, DEBEN estar registradas y almacenadas en el sistema
    // El webhook de Make.com verifica si el usuario existe en su base de datos
    // Si el usuario no está almacenado, el webhook retornará un error
    try {
      const user = await authenticateWithWebhook(email.trim(), pass);
      // Si llegamos aquí, el usuario está almacenado en el sistema y las credenciales son correctas
      return user;
    } catch (error: any) {
      // Limpiar cualquier dato previo en caso de error
      localStorage.removeItem('intelfon_user');
      localStorage.removeItem('intelfon_token');
      
      // Mejorar el mensaje de error para indicar claramente si el usuario no está almacenado
      const errorMessage = error.message || 'Error de autenticación';
      if (errorMessage.includes('no registrada') || 
          errorMessage.includes('no encontrado') || 
          errorMessage.includes('no está almacenado') ||
          errorMessage.includes('404')) {
        throw new Error('Usuario no encontrado. El usuario no está almacenado en el sistema. Contacta a tu supervisor para crear una cuenta.');
      }
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
    // Validar que exista usuario Y token
    // Si no hay token, la sesión no es válida aunque haya usuario en localStorage
    const user = this.getUser();
    const token = this.getToken();
    
    if (!user || !token) {
      // Limpiar datos inválidos
      localStorage.removeItem('intelfon_user');
      localStorage.removeItem('intelfon_token');
      return false;
    }
    
    // Validar que el usuario tenga estructura válida
    if (!user.id || !user.name || !user.role) {
      localStorage.removeItem('intelfon_user');
      localStorage.removeItem('intelfon_token');
      return false;
    }
    
    // Validar que el rol sea válido
    if (!['AGENTE', 'SUPERVISOR', 'GERENTE'].includes(user.role)) {
      localStorage.removeItem('intelfon_user');
      localStorage.removeItem('intelfon_token');
      return false;
    }
    
    return true;
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

  // Recuperación de contraseña con webhook (escenario: reset_password)
  // También usa el servicio temporal de correo para almacenar códigos localmente
  async requestPasswordReset(email: string, forceNew: boolean = false): Promise<boolean> {
    try {
      console.log('Solicitando código de recuperación para:', email);
      
      // PRIMERO verificar si ya existe un código válido pendiente
      // Si existe y no se fuerza uno nuevo, retornar sin hacer nada
      if (!forceNew) {
        const existingCode = emailService.getLatestCode(email);
        if (existingCode && existingCode.expiresAt > Date.now()) {
          console.log('ℹ️ Ya existe un código válido pendiente para este email');
          console.log('   🔑 Código existente:', existingCode.code);
          console.log('   ⏰ Expira:', new Date(existingCode.expiresAt).toLocaleString());
          console.log('   ⚠️ No se enviará un nuevo correo. Usa el código existente.');
          return true; // Retornar éxito sin generar nuevo código ni llamar al webhook
        }
      }
      
      // Si no hay código válido o se fuerza uno nuevo, proceder con el webhook y generar código
      console.log('📤 Generando nuevo código de recuperación...');
      
      // Intentar llamar al webhook primero (solo si se va a generar un código nuevo)
      // Estructura requerida: { type: "forgot_password", email: "" }
      let webhookSuccess = false;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
        
        // Llamar directamente al webhook con la estructura exacta requerida
        const payload = {
          type: 'forgot_password',
          email: email.trim().toLowerCase()
        };
        
        console.log('📤 Enviando al webhook:', payload);
        
        const response = await fetch(API_CONFIG.WEBHOOK_URL, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json().catch(() => ({}));
        console.log('📥 Respuesta del webhook:', data);
        
        // Solo lanzar error si hay un error explícito
        if (data && (data.error === true || data.success === false)) {
          throw new Error(data.message || 'Error al solicitar restablecimiento de contraseña');
        }
        
        webhookSuccess = true;
        console.log('✅ Webhook procesó la solicitud exitosamente');
      } catch (webhookError: any) {
        if (webhookError.name === 'AbortError') {
          console.warn('⚠️ Timeout al llamar al webhook, usando servicio temporal');
        } else {
          console.warn('⚠️ El webhook no pudo procesar la solicitud, usando servicio temporal:', webhookError.message);
        }
        // Continuar con el servicio temporal aunque el webhook falle
      }
      
      // Generar código localmente (forceNew = true porque ya verificamos que no hay código válido)
      const { code, expiresAt, isNew } = emailService.sendPasswordResetCode(email, true);
      
      console.log('✅ Nuevo código de recuperación generado y almacenado localmente');
      console.log('   📧 Email:', email);
      console.log('   🔑 Código:', code);
      console.log('   ⏰ Expira:', new Date(expiresAt).toLocaleString());
      
      // Si el webhook fue exitoso, retornar éxito
      // Si el webhook falló pero el servicio temporal funcionó, también retornar éxito
      return true;
    } catch (error: any) {
      console.error('Error en requestPasswordReset:', error);
      // Si el error ya tiene un mensaje, propagarlo
      if (error.message) {
        throw error;
      }
      // Si no, proporcionar un mensaje genérico
      throw new Error('No pudimos procesar la solicitud. Verifica que el correo esté registrado en el sistema.');
    }
  },

  async verifyResetCode(email: string, code: string): Promise<{ ok: boolean; tempToken?: string }> {
    // Primero intentar verificar con el servicio temporal (más confiable)
    const localVerification = emailService.verifyCode(email, code);
    
    if (localVerification.valid && localVerification.tempToken) {
      console.log('✅ Código verificado con servicio local');
      return {
        ok: true,
        tempToken: localVerification.tempToken
      };
    }
    
    // Si el servicio local falla, intentar con el webhook como respaldo
    console.log('⚠️ Código no válido en servicio local, intentando con webhook...');
    try {
      const data = await callWebhook('reset_password', {
        email,
        code,
        action: 'verify_code'
      });
      
      // El webhook debe retornar: { success: boolean, tempToken?: string, message?: string }
      if (data.success === false) {
        throw new Error(data.message || 'Código de verificación inválido');
      }
      
      if (!data.tempToken) {
        throw new Error('Token temporal no recibido del servidor');
      }
      
      console.log('✅ Código verificado con webhook');
      return { 
        ok: true, 
        tempToken: data.tempToken 
      };
    } catch (webhookError: any) {
      // Si ambos fallan, usar el mensaje del servicio local (más descriptivo)
      throw new Error(localVerification.message || webhookError.message || 'Código de verificación inválido');
    }
  },

  async finalizePasswordReset(email: string, token: string, password: string, code?: string): Promise<boolean> {
    console.log('📤 Finalizando restablecimiento de contraseña para:', email);
    
    // Obtener el código usado si no se proporciona
    let codeToSend = code;
    if (!codeToSend) {
      const latestCode = emailService.getLatestCode(email);
      if (latestCode) {
        codeToSend = latestCode.code;
        console.log('🔑 Código obtenido del servicio local:', codeToSend);
      }
    }
    
    if (!codeToSend) {
      throw new Error('Código de verificación no encontrado. Solicita un nuevo código.');
    }
    
    // Preparar el payload exacto que requiere el webhook
    // Estructura: { type: "reset_password", email: "", new_password: "", code: "" }
    // NOTA: Se envía la nueva contraseña junto con el código
    const payload = {
      email: email.trim().toLowerCase(),
      new_password: password.trim(),
      code: codeToSend
    };
    
    console.log('📤 Enviando al webhook:', {
      type: 'reset_password',
      ...payload
    });
    
    // Llamar al webhook con la estructura exacta requerida
    const data = await callWebhook('reset_password', payload);
    
    console.log('📥 Respuesta del webhook al finalizar reset:', data);
    
    // El webhook debe retornar: { success: boolean, message?: string }
    if (data && (data.error === true || data.success === false)) {
      throw new Error(data.message || 'Error al restablecer la contraseña');
    }
    
    console.log('✅ Contraseña restablecida exitosamente');
    return true;
  },

  // Crear nueva cuenta con webhook (type: register)
  // SOLO el supervisor puede crear cuentas, y DEBE pasar por el webhook de Make.com
  // El usuario se almacena directamente en el sistema a través del webhook
  async createAccount(email: string, password: string, name: string, additionalData?: any): Promise<User> {
    // Validaciones previas
    if (!email || !email.trim()) {
      throw new Error('El correo electrónico es requerido');
    }
    if (!password || !password.trim() || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
    if (!name || !name.trim()) {
      throw new Error('El nombre es requerido');
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Formato de correo electrónico inválido');
    }
    
    console.log('📤 Creando cuenta nueva:', { email: email.trim().toLowerCase(), name: name.trim() });
    
    // Llamar al webhook de n8n para crear y almacenar el usuario
    // n8n retorna: { id, name, role, email } cuando es correcto
    // O: { error: true, message: "..." } cuando hay error
    let data;
    try {
      data = await callWebhook('new_account', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        ...additionalData
      });
      
      console.log('📥 Respuesta del webhook recibida:', data);
    } catch (webhookError: any) {
      console.error('❌ Error al llamar al webhook:', webhookError);
      // Si el error ya tiene un mensaje descriptivo, propagarlo
      if (webhookError.message) {
        throw webhookError;
      }
      // Si no, proporcionar un mensaje genérico
      throw new Error('Error al comunicarse con el servidor. Verifica tu conexión y que el webhook esté disponible.');
    }
    
    // callWebhook ya normaliza la respuesta, así que esperamos { token, user }
    // Si no hay token o user, significa que el sistema no pudo crear/almacenar el usuario
    if (!data || !data.token || !data.user) {
      console.error('❌ Respuesta del webhook incompleta:', data);
      throw new Error('Error al crear la cuenta. El webhook no retornó los datos necesarios. Verifica que el webhook esté configurado para retornar id, name y role.');
    }

    // Validar estructura completa del usuario almacenado
    if (!data.user.id || !data.user.name || !data.user.role) {
      throw new Error('La cuenta fue creada pero no tiene información completa. El usuario no se almacenó correctamente en el sistema.');
    }

    // Validar que el rol sea válido
    if (!['AGENTE', 'SUPERVISOR', 'GERENTE'].includes(data.user.role)) {
      throw new Error('Rol de usuario inválido. La cuenta debe tener un rol válido asignado.');
    }

    // Almacenar el token (el usuario ya está almacenado en el sistema)
    localStorage.setItem('intelfon_token', data.token);
    
    // Almacenar información del usuario EXACTAMENTE como viene del webhook
    // Esto confirma que el usuario fue almacenado exitosamente
    const user: User = {
      id: data.user.id,
      name: data.user.name.trim(),
      role: data.user.role,
      avatar: data.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=0f172a&color=fff`
    };

    localStorage.setItem('intelfon_user', JSON.stringify(user));
    
    // Enviar datos del agente al webhook de almacenamiento de agentes
    try {
      console.log('📤 Enviando datos del agente al webhook de almacenamiento...');
      
      const agentePayload = {
        id: data.user.id,
        nombre: data.user.name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: data.user.role,
        fecha_creación: new Date().toISOString()
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(API_CONFIG.WEBHOOK_AGENTES_URL, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(agentePayload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Datos del agente enviados exitosamente al webhook de almacenamiento');
      } else {
        console.warn('⚠️ El webhook de agentes respondió con error:', response.status, response.statusText);
      }
    } catch (webhookError: any) {
      // No lanzar error, solo registrar advertencia
      // La cuenta se creó exitosamente, este es un proceso adicional
      console.warn('⚠️ No se pudieron enviar los datos al webhook de agentes:', webhookError.message);
    }
    
    // El usuario ha sido creado y almacenado exitosamente en el sistema
    return user;
  }
};
