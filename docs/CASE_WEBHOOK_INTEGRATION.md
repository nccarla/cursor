# Integración del Webhook de Casos

## Resumen

Se ha integrado el sistema de casos con el webhook de n8n ubicado en:
`https://n8n.red.com.sv/webhook-test/97a6c0f7-ea50-4542-b99e-710b96b58652`

## Estructura del Webhook

El webhook espera un JSON con esta estructura:

```json
{
  "action": "case.create | case.update | case.read | case.delete",
  "actor": {
    "user_id": string,
    "email": string
  },
  "data": {
    "case_id"?: string,
    "canal_origen"?: string,
    "canal_notificacion"?: string,
    "asunto"?: string,
    "descripcion"?: string,
    "cliente"?: {
      "cliente_id": string,
      "email": string
    },
    "categoria"?: {
      "categoria_id": string
    },
    "estado"?: string
  }
}
```

## Servicio: `caseService.ts`

El servicio centraliza todas las llamadas al webhook de casos. Proporciona las siguientes funciones:

### `createCase(caseData)`

Crea un nuevo caso en el sistema.

**Parámetros:**
```typescript
{
  clienteId: string;
  categoriaId: string;
  contactChannel: Channel | string;
  subject: string;
  description: string;
  clientEmail?: string;
  clientName?: string;
  contactName?: string;
  phone?: string;
}
```

**Ejemplo de uso:**
```typescript
import * as caseService from './services/caseService';

try {
  const newCase = await caseService.createCase({
    clienteId: 'CL001234',
    categoriaId: 'CAT-001',
    contactChannel: 'Web',
    subject: 'Error en sistema',
    description: 'El sistema no responde correctamente',
    clientEmail: 'cliente@empresa.com',
    clientName: 'Empresa SA',
    contactName: 'Juan Pérez',
    phone: '+503 2222-3333'
  });
  console.log('Caso creado:', newCase);
} catch (error) {
  console.error('Error al crear caso:', error);
}
```

### `getCases()`

Obtiene todos los casos del sistema.

**Ejemplo de uso:**
```typescript
import * as caseService from './services/caseService';

try {
  const cases = await caseService.getCases();
  console.log('Casos obtenidos:', cases);
} catch (error) {
  console.error('Error al obtener casos:', error);
}
```

### `getCaseById(caseId)`

Obtiene un caso específico por su ID.

**Parámetros:**
- `caseId: string` - ID del caso a obtener

**Ejemplo de uso:**
```typescript
import * as caseService from './services/caseService';

try {
  const caso = await caseService.getCaseById('CASO-0001');
  if (caso) {
    console.log('Caso encontrado:', caso);
  } else {
    console.log('Caso no encontrado');
  }
} catch (error) {
  console.error('Error al obtener caso:', error);
}
```

### `updateCaseStatus(caseId, newStatus, detail?)`

Actualiza el estado de un caso.

**Parámetros:**
- `caseId: string` - ID del caso a actualizar
- `newStatus: string` - Nuevo estado del caso
- `detail?: string` - Detalle opcional del cambio

**Ejemplo de uso:**
```typescript
import * as caseService from './services/caseService';
import { CaseStatus } from '../types';

try {
  const updatedCase = await caseService.updateCaseStatus(
    'CASO-0001',
    CaseStatus.EN_PROCESO,
    'Caso asignado a agente'
  );
  console.log('Caso actualizado:', updatedCase);
} catch (error) {
  console.error('Error al actualizar caso:', error);
}
```

### `deleteCase(caseId)`

Elimina un caso del sistema.

**Parámetros:**
- `caseId: string` - ID del caso a eliminar

**Ejemplo de uso:**
```typescript
import * as caseService from './services/caseService';

try {
  const deleted = await caseService.deleteCase('CASO-0001');
  if (deleted) {
    console.log('Caso eliminado exitosamente');
  }
} catch (error) {
  console.error('Error al eliminar caso:', error);
}
```

## Integración en Componentes

### BandejaCasos.tsx

El componente `BandejaCasos` ahora usa el servicio a través de `api.getCases()` y `api.createCase()`:

```typescript
// Cargar casos
const loadCasos = async () => {
  setLoading(true);
  try {
    const data = await api.getCases(); // Usa caseService internamente
    setCasos([...data]);
    setLastUpdate(new Date());
  } catch (error: any) {
    console.error('Error al cargar casos:', error);
  } finally {
    setLoading(false);
  }
};

// Crear caso
const handleCreateCase = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await api.createCase({
      clienteId: newCase.clienteId,
      categoriaId: newCase.categoriaId,
      contactChannel: newCase.contactChannel,
      subject: newCase.subject,
      description: newCase.description,
      clientEmail: newCase.email,
      // ... otros campos
    });
    setShowModal(false);
    await loadCasos();
  } catch (err: any) {
    alert(err?.message || 'Error al crear el caso');
  }
};
```

### CaseDetail.tsx

El componente `CaseDetail` ahora usa el servicio a través de `api.getCasoById()` y `api.updateCaseStatus()`:

```typescript
// Cargar caso
const loadCaso = async (caseId: string) => {
  try {
    const data = await api.getCasoById(caseId); // Usa caseService internamente
    if (data) {
      setCaso(data);
    }
  } catch (error: any) {
    console.error('Error al cargar caso:', error);
  }
};

// Actualizar estado
const handleStateChange = async (newState: string, extraData?: any) => {
  if (!caso) return;
  setTransitionLoading(true);
  try {
    await api.updateCaseStatus(caso.id, newState, `Transición a ${newState}`, extraData);
    await loadCaso(caso.id);
  } catch (err: any) {
    alert(err?.message || 'Error al actualizar el estado');
  } finally {
    setTransitionLoading(false);
  }
};
```

## Manejo de Errores

El servicio incluye manejo robusto de errores:

1. **Errores de CORS**: Se detectan y muestran mensajes claros
2. **Timeouts**: Se manejan con mensajes descriptivos
3. **Fallback a localStorage**: Si el webhook falla, se usa localStorage como respaldo
4. **Validaciones**: Se validan campos requeridos antes de enviar al webhook

## Mapeo de Campos

### Crear Caso

| Campo UI | Campo Webhook | Notas |
|----------|---------------|-------|
| `clienteId` | `data.cliente.cliente_id` | Requerido |
| `email` | `data.cliente.email` | Email del cliente |
| `categoriaId` | `data.categoria.categoria_id` | Requerido |
| `subject` | `data.asunto` | Requerido |
| `description` | `data.descripcion` | Requerido |
| `contactChannel` | `data.canal_origen` | Mapeado automáticamente |

### Actualizar Estado

| Campo UI | Campo Webhook | Notas |
|----------|---------------|-------|
| `caseId` | `data.case_id` | Requerido |
| `newStatus` | `data.estado` | Requerido |
| `detail` | `data.detalle` | Opcional |

## Configuración

La URL del webhook se configura en `config.ts`:

```typescript
export const API_CONFIG = {
  WEBHOOK_CASOS_URL: import.meta.env.VITE_WEBHOOK_CASOS_URL || 
    'https://n8n.red.com.sv/webhook-test/97a6c0f7-ea50-4542-b99e-710b96b58652',
  TIMEOUT: 30000
};
```

Puedes sobrescribir la URL usando la variable de entorno `VITE_WEBHOOK_CASOS_URL`.

## Notas Importantes

1. **Autenticación**: El servicio obtiene automáticamente el usuario autenticado desde `localStorage`
2. **Actor**: Se incluye automáticamente en todas las peticiones
3. **Fallback**: Si el webhook falla, se usa localStorage para mantener la funcionalidad
4. **Logging**: Todas las peticiones se registran en la consola para debugging

