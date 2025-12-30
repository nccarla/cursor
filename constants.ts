
import { CaseStatus, Role, UserRole } from './types';

export const STATE_TRANSITIONS: Record<string, CaseStatus[]> = {
  [CaseStatus.NUEVO]: [CaseStatus.EN_PROCESO],
  [CaseStatus.EN_PROCESO]: [CaseStatus.PENDIENTE_CLIENTE, CaseStatus.ESCALADO, CaseStatus.RESUELTO],
  [CaseStatus.PENDIENTE_CLIENTE]: [CaseStatus.EN_PROCESO],
  [CaseStatus.ESCALADO]: [CaseStatus.EN_PROCESO, CaseStatus.PENDIENTE_CLIENTE],
  [CaseStatus.RESUELTO]: [CaseStatus.CERRADO, CaseStatus.EN_PROCESO],
  [CaseStatus.CERRADO]: []
};

export const ROLE_HOMEPAGE: Record<Role, string> = {
  'AGENTE': '/app/agente',
  'SUPERVISOR': '/app/supervisor',
  'GERENTE': '/app/gerencia'
};

export const STATE_COLORS: Record<string, string> = {
  // Nuevo: Azul
  [CaseStatus.NUEVO]: 'bg-blue-500 text-white border-blue-600',
  // En Proceso: Amarillo
  [CaseStatus.EN_PROCESO]: 'bg-yellow-500 text-white border-yellow-600',
  // Pendiente Cliente: Naranja
  [CaseStatus.PENDIENTE_CLIENTE]: 'bg-orange-500 text-white border-orange-600',
  // Escalado: Rojo
  [CaseStatus.ESCALADO]: 'bg-red-500 text-white border-red-600',
  // Resuelto: Verde
  [CaseStatus.RESUELTO]: 'bg-green-500 text-white border-green-600',
  // Cerrado: Gris
  [CaseStatus.CERRADO]: 'bg-gray-500 text-white border-gray-600'
};
