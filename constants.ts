
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
  [CaseStatus.NUEVO]: 'bg-blue-100 text-blue-700 border-blue-200',
  [CaseStatus.EN_PROCESO]: 'bg-amber-100 text-amber-700 border-amber-200',
  [CaseStatus.PENDIENTE_CLIENTE]: 'bg-purple-100 text-purple-700 border-purple-200',
  [CaseStatus.ESCALADO]: 'bg-red-100 text-red-700 border-red-200',
  [CaseStatus.RESUELTO]: 'bg-green-100 text-green-700 border-green-200',
  [CaseStatus.CERRADO]: 'bg-slate-100 text-slate-700 border-slate-200'
};
