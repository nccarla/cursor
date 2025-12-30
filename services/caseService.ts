import { API_CONFIG } from '../config';
import { Case, CaseStatus, Channel } from '../types';
import { calculateBusinessDaysElapsed, calculateSLADelayDays } from '../utils/slaUtils';

// URL del webhook de n8n para gestión de casos
const WEBHOOK_CASOS_URL = API_CONFIG.WEBHOOK_CASOS_URL || 'https://n8n.red.com.sv/webhook-test/97a6c0f7-ea50-4542-b99e-710b96b58652';

// Tipos para las acciones del webhook
type CaseAction = 'case.create' | 'case.update' | 'case.read' | 'case.delete';

interface Actor {
  user_id: string;
  email: string;
}

interface ClienteData {
  cliente_id: string;
  email: string;
}

interface CategoriaData {
  categoria_id: string;
}

interface CaseWebhookPayload {
  action: CaseAction;
  actor: Actor;
  data: {
    case_id?: string;
    canal_origen?: string;
    canal_notificacion?: string;
    asunto?: string;
    descripcion?: string;
    cliente?: ClienteData;
    categoria?: CategoriaData;
    estado?: string;
    [key: string]: any; // Para campos adicionales que pueda retornar el webhook
  };
}

interface CaseWebhookResponse {
  success?: boolean;
  error?: boolean;
  message?: string;
  case?: any;
  cases?: any[];
  [key: string]: any;
}

/**
 * Obtiene la información del actor (usuario autenticado)
 */
const getActor = (): Actor | null => {
  try {
    const userStr = localStorage.getItem('intelfon_user');
    const userEmail = localStorage.getItem('intelfon_user_email');
    
    if (!userStr) {
      return null;
    }
    
    const user = JSON.parse(userStr);
    const email = userEmail || `${user.role?.toLowerCase()}@intelfon.com`;
    
    return {
      user_id: user.id || 'unknown',
      email: email
    };
  } catch (error) {
    console.error('Error obteniendo actor:', error);
    return null;
  }
};

/**
 * Mapea el canal de contacto a formato esperado por el webhook
 */
const mapChannel = (channel: Channel | string): string => {
  const channelMap: Record<string, string> = {
    [Channel.EMAIL]: 'Email',
    [Channel.WHATSAPP]: 'WhatsApp',
    [Channel.TELEFONO]: 'Teléfono',
    [Channel.WEB]: 'Web',
    [Channel.REDES_SOCIALES]: 'Redes Sociales'
  };
  
  return channelMap[channel] || channel.toString();
};

/**
 * Mapea un caso de la UI al formato esperado por el webhook para crear/actualizar
 */
const mapCaseToWebhookData = (caseData: any): CaseWebhookPayload['data'] => {
  const data: CaseWebhookPayload['data'] = {};
  
  if (caseData.case_id || caseData.id) {
    data.case_id = caseData.case_id || caseData.id;
  }
  
  if (caseData.contactChannel || caseData.origin) {
    data.canal_origen = mapChannel(caseData.contactChannel || caseData.origin);
  }
  
  if (caseData.subject || caseData.asunto) {
    data.asunto = caseData.subject || caseData.asunto;
  }
  
  if (caseData.description || caseData.descripcion) {
    data.descripcion = caseData.description || caseData.descripcion;
  }
  
  if (caseData.clienteId || caseData.clientId) {
    data.cliente = {
      cliente_id: caseData.clienteId || caseData.clientId,
      email: caseData.clientEmail || caseData.email || ''
    };
  }
  
  if (caseData.categoriaId || caseData.categoryId) {
    data.categoria = {
      categoria_id: caseData.categoriaId || caseData.categoryId
    };
  }
  
  if (caseData.status || caseData.estado) {
    data.estado = caseData.status || caseData.estado;
  }
  
  if (caseData.canal_notificacion) {
    data.canal_notificacion = caseData.canal_notificacion;
  }
  
  return data;
};

/**
 * Mapea la respuesta del webhook a un objeto Case de la UI
 */
const mapWebhookResponseToCase = (webhookData: any): Case | null => {
  if (!webhookData) return null;
  
  try {
    // El webhook puede retornar el caso en diferentes formatos
    // Intentamos normalizar a la estructura Case
    const caseData = webhookData.case || webhookData;
    
    return {
      id: caseData.case_id || caseData.id || caseData.ticketNumber || '',
      ticketNumber: caseData.case_id || caseData.id || caseData.ticketNumber || '',
      clientId: caseData.cliente?.cliente_id || caseData.clientId || '',
      clientName: caseData.cliente?.nombre || caseData.clientName || '',
      category: caseData.categoria?.nombre || caseData.category || '',
      origin: caseData.canal_origen || caseData.origin || Channel.WEB,
      subject: caseData.asunto || caseData.subject || '',
      description: caseData.descripcion || caseData.description || '',
      status: caseData.estado || caseData.status || CaseStatus.NUEVO,
      priority: caseData.prioridad || caseData.priority || 'Media',
      agentId: caseData.agente_id || caseData.agentId || '',
      agentName: caseData.agente_nombre || caseData.agentName || '',
      createdAt: caseData.fecha_creacion || caseData.createdAt || new Date().toISOString(),
      history: caseData.historial || caseData.history || [],
      clientEmail: caseData.cliente?.email || caseData.clientEmail || '',
      clientPhone: caseData.cliente?.telefono || caseData.clientPhone || '',
      agenteAsignado: caseData.agenteAsignado || null as any,
      categoria: caseData.categoria || null as any,
      cliente: caseData.cliente || null as any,
      // Calcular diasAbierto y slaExpired usando días hábiles
      ...(() => {
        try {
          const createdAt = new Date(caseData.fecha_creacion || caseData.createdAt || new Date().toISOString());
          const categoria = caseData.categoria || null;
          const slaDays = categoria?.slaDias || categoria?.sla_dias || 5; // Default 5 si no hay categoría
          const diasAbierto = calculateBusinessDaysElapsed(createdAt);
          const delayDays = calculateSLADelayDays(createdAt, slaDays);
          const slaExpired = delayDays > 0;
          
          return {
            diasAbierto,
            slaExpired
          };
        } catch (error) {
          console.warn('Error calculando días hábiles, usando valores por defecto:', error);
          return {
            diasAbierto: caseData.dias_abierto || caseData.diasAbierto || 0,
            slaExpired: caseData.sla_vencido || caseData.slaExpired || false
          };
        }
      })()
    };
  } catch (error) {
    console.error('Error mapeando respuesta del webhook:', error);
    return null;
  }
};

/**
 * Mapea un array de casos del webhook a un array de Case
 */
const mapWebhookResponseToCases = (webhookData: any): Case[] => {
  if (!webhookData) {
    console.warn('⚠️ mapWebhookResponseToCases: webhookData es null o undefined');
    return [];
  }
  
  try {
    // Intentar extraer el array de casos
    let cases: any[] = [];
    
    if (Array.isArray(webhookData)) {
      // Si es un array directo
      cases = webhookData;
    } else if (webhookData.cases && Array.isArray(webhookData.cases)) {
      // Si tiene propiedad "cases"
      cases = webhookData.cases;
    } else if (webhookData.casos && Array.isArray(webhookData.casos)) {
      // Si tiene propiedad "casos"
      cases = webhookData.casos;
    } else if (webhookData.data && Array.isArray(webhookData.data)) {
      // Si tiene propiedad "data" que es un array
      cases = webhookData.data;
    } else {
      console.warn('⚠️ No se pudo extraer array de casos de:', webhookData);
      console.warn('⚠️ Claves disponibles:', Object.keys(webhookData));
      return [];
    }
    
    console.log(`📋 Mapeando ${cases.length} casos del webhook...`);
    
    const mappedCases = cases
      .map((caseData, index) => {
        console.log(`  📝 Mapeando caso ${index + 1}/${cases.length}:`, caseData);
        const mapped = mapWebhookResponseToCase(caseData);
        if (!mapped) {
          console.warn(`  ⚠️ No se pudo mapear el caso ${index + 1}`);
        }
        return mapped;
      })
      .filter((c): c is Case => c !== null);
    
    console.log(`✅ ${mappedCases.length} casos mapeados exitosamente de ${cases.length} casos recibidos`);
    
    return mappedCases;
  } catch (error) {
    console.error('❌ Error mapeando array de casos del webhook:', error);
    console.error('❌ Datos recibidos:', webhookData);
    return [];
  }
};

/**
 * Llama al webhook de casos con el payload especificado
 */
const callCaseWebhook = async (payload: CaseWebhookPayload): Promise<CaseWebhookResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    console.log('📤 Enviando petición al webhook de casos:', {
      url: WEBHOOK_CASOS_URL,
      action: payload.action,
      payload
    });
    
    const response = await fetch(WEBHOOK_CASOS_URL, {
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
      if (response.status === 0) {
        throw new Error('Error de CORS: El servidor no está permitiendo peticiones desde este origen.');
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // Intentar parsear JSON
    let result: CaseWebhookResponse;
    try {
      const text = await response.text();
      if (text.trim() === '') {
        result = { success: true };
      } else {
        result = JSON.parse(text);
      }
    } catch (parseError) {
      if (response.ok) {
        console.log('Respuesta no-JSON recibida, considerando como éxito');
        result = { success: true };
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    }
    
    console.log('📥 Respuesta del webhook de casos:', result);
    
    // Verificar si hay error en la respuesta
    if (result && result.error === true) {
      throw new Error(result.message || 'Error en la operación');
    }
    
    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: El servidor no respondió a tiempo. Verifica tu conexión.');
    }
    
    if (error.message && (
      error.message.includes('CORS') || 
      error.message.includes('cors') ||
      error.message.includes('fetch') ||
      error.message.includes('NetworkError')
    )) {
      throw new Error('Error de CORS: El servidor n8n necesita permitir peticiones desde este dominio. Contacta al administrador.');
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Error de conexión con el servidor.');
  }
};

/**
 * Crea un nuevo caso
 */
export const createCase = async (caseData: {
  clienteId: string;
  categoriaId: string;
  contactChannel: Channel | string;
  subject: string;
  description: string;
  clientEmail?: string;
  [key: string]: any;
}): Promise<Case> => {
  const actor = getActor();
  
  if (!actor) {
    throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
  }
  
  if (!caseData.clienteId || !caseData.categoriaId || !caseData.subject || !caseData.description) {
    throw new Error('Faltan campos requeridos: cliente, categoría, asunto y descripción son obligatorios.');
  }
  
  const payload: CaseWebhookPayload = {
    action: 'case.create',
    actor,
    data: mapCaseToWebhookData(caseData)
  };
  
  const response = await callCaseWebhook(payload);
  
  // Si el webhook retorna un caso, mapearlo
  if (response.case) {
    const mappedCase = mapWebhookResponseToCase(response.case);
    if (mappedCase) {
      return mappedCase;
    }
  }
  
  // Si no retorna caso, crear uno básico desde los datos enviados
  // Esto es un fallback en caso de que el webhook no retorne el caso creado
  const fallbackCase: Case = {
    id: `CASO-${Date.now()}`,
    ticketNumber: `CASO-${Date.now()}`,
    clientId: caseData.clienteId,
    clientName: caseData.clientName || '',
    category: caseData.category || '',
    origin: caseData.contactChannel as Channel,
    subject: caseData.subject,
    description: caseData.description,
    status: CaseStatus.NUEVO,
    priority: 'Media',
    agentId: '',
    agentName: '',
    createdAt: new Date().toISOString(),
    slaExpired: false,
    history: [],
    clientEmail: caseData.clientEmail || '',
    diasAbierto: 0,
    agenteAsignado: null as any,
    categoria: null as any,
    cliente: null as any
  };
  
  return fallbackCase;
};

/**
 * Obtiene todos los casos
 */
export const getCases = async (): Promise<Case[]> => {
  const actor = getActor();
  
  if (!actor) {
    throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
  }
  
  const payload: CaseWebhookPayload = {
    action: 'case.read',
    actor,
    data: {}
  };
  
  const response = await callCaseWebhook(payload);
  
  console.log('📥 Respuesta completa del webhook getCases:', JSON.stringify(response, null, 2));
  
  // Intentar diferentes formatos de respuesta
  // Formato 1: Array directo
  if (Array.isArray(response)) {
    console.log('✅ Respuesta es un array directo, mapeando casos...');
    return mapWebhookResponseToCases(response);
  }
  
  // Formato 2: { cases: [...] } o { casos: [...] }
  if (response.cases && Array.isArray(response.cases)) {
    console.log('✅ Respuesta tiene propiedad "cases", mapeando casos...');
    return mapWebhookResponseToCases(response);
  }
  
  if (response.casos && Array.isArray(response.casos)) {
    console.log('✅ Respuesta tiene propiedad "casos", mapeando casos...');
    return mapWebhookResponseToCases(response);
  }
  
  // Formato 3: { data: [...] } o { data: { cases: [...] } }
  if (response.data) {
    if (Array.isArray(response.data)) {
      console.log('✅ Respuesta tiene propiedad "data" como array, mapeando casos...');
      return mapWebhookResponseToCases(response.data);
    }
    if (response.data.cases && Array.isArray(response.data.cases)) {
      console.log('✅ Respuesta tiene "data.cases", mapeando casos...');
      return mapWebhookResponseToCases(response.data);
    }
    if (response.data.casos && Array.isArray(response.data.casos)) {
      console.log('✅ Respuesta tiene "data.casos", mapeando casos...');
      return mapWebhookResponseToCases(response.data);
    }
  }
  
  // Formato 4: Un solo caso { case: {...} }
  if (response.case) {
    console.log('✅ Respuesta tiene un solo caso, convirtiendo a array...');
    const mappedCase = mapWebhookResponseToCase(response.case);
    return mappedCase ? [mappedCase] : [];
  }
  
  // Si no se reconoce el formato, loguear y retornar vacío
  console.warn('⚠️ No se pudo identificar el formato de la respuesta del webhook:', response);
  console.warn('⚠️ Estructura recibida:', Object.keys(response || {}));
  
  return [];
};

/**
 * Obtiene un caso por ID
 */
export const getCaseById = async (caseId: string): Promise<Case | null> => {
  const actor = getActor();
  
  if (!actor) {
    throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
  }
  
  if (!caseId) {
    throw new Error('ID de caso requerido.');
  }
  
  const payload: CaseWebhookPayload = {
    action: 'case.read',
    actor,
    data: {
      case_id: caseId
    }
  };
  
  const response = await callCaseWebhook(payload);
  
  // Mapear la respuesta a un Case
  if (response.case) {
    return mapWebhookResponseToCase(response.case);
  }
  
  // Si retorna un array, buscar el caso por ID
  if (response.cases || response.casos || Array.isArray(response)) {
    const cases = mapWebhookResponseToCases(response);
    return cases.find(c => c.id === caseId || c.ticketNumber === caseId) || null;
  }
  
  return null;
};

/**
 * Actualiza el estado de un caso
 */
export const updateCaseStatus = async (
  caseId: string,
  newStatus: string,
  detail?: string
): Promise<Case> => {
  const actor = getActor();
  
  if (!actor) {
    throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
  }
  
  if (!caseId || !newStatus) {
    throw new Error('ID de caso y nuevo estado son requeridos.');
  }
  
  const payload: CaseWebhookPayload = {
    action: 'case.update',
    actor,
    data: {
      case_id: caseId,
      estado: newStatus,
      detalle: detail || `Cambio de estado a ${newStatus}`
    }
  };
  
  const response = await callCaseWebhook(payload);
  
  // Si el webhook retorna el caso actualizado, mapearlo
  if (response.case) {
    const mappedCase = mapWebhookResponseToCase(response.case);
    if (mappedCase) {
      return mappedCase;
    }
  }
  
  // Fallback: obtener el caso actualizado
  return await getCaseById(caseId) || ({} as Case);
};

/**
 * Elimina un caso
 */
export const deleteCase = async (caseId: string): Promise<boolean> => {
  const actor = getActor();
  
  if (!actor) {
    throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
  }
  
  if (!caseId) {
    throw new Error('ID de caso requerido.');
  }
  
  const payload: CaseWebhookPayload = {
    action: 'case.delete',
    actor,
    data: {
      case_id: caseId
    }
  };
  
  const response = await callCaseWebhook(payload);
  
  return response.success !== false && !response.error;
};

