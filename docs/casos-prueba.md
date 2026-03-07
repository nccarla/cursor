
# Casos de Prueba Funcionales - INTELFON SAC

Este documento detalla los escenarios críticos para validar el sistema de gestión de casos.

## Módulo: Autenticación y RBAC (Control de Acceso)
1.  **Login Agente**: Ingresar con `agente@intelfon.com`. Resultado esperado: Redirección automática a `/app/agente`.
2.  **Login Supervisor**: Ingresar con `supervisor@intelfon.com`. Resultado esperado: Redirección automática a `/app/supervisor`.
3.  **Login Gerente**: Ingresar con `gerente@intelfon.com`. Resultado esperado: Redirección automática a `/app/gerencia`.
4.  **Acceso no autorizado**: Un `AGENTE` intenta entrar manualmente a `/app/agentes`. Resultado esperado: Mostrar pantalla "Acceso No Autorizado".
5.  **Persistencia**: Tras refrescar el navegador (F5), el sistema debe mantener la sesión activa sin pedir login nuevamente.
6.  **Recuperación**: Solicitar código en "Olvidé mi contraseña" y validar que se solicita el código de 6 dígitos.

## Módulo: Gestión de Casos
7.  **Creación de Caso**: Un Agente crea un caso vía formulario. Resultado esperado: Aparece en la bandeja con estado "Nuevo" y ticket auto-generado.
8.  **Asignación Round-Robin**: Crear 3 casos seguidos. Resultado esperado (en n8n): Se deben repartir entre los agentes activos de forma equitativa.
9.  **Transición de Estado (Flujo Feliz)**: Pasar un caso de "Nuevo" a "En Proceso". Resultado esperado: El botón de estado cambia y se registra en la línea de tiempo.
10. **Bloqueo de Transición**: Verificar que un caso en estado "Nuevo" NO permite pasar directamente a "Cerrado" (regla de negocio).
11. **Registro de Resolución**: Al pasar a "Resuelto", el sistema debe obligar a ingresar el detalle de la solución.

## Módulo: Supervisor y SLAs
12. **Detección de Alerta**: Un caso que supera las 48h sin cambios debe aparecer con el indicador "Vencido" o en la vista de Alertas Críticas.
13. **Gestión de Disponibilidad**: Cambiar un agente a estado "Vacaciones". Resultado esperado: El agente deja de recibir casos nuevos en el round-robin (lógica n8n).
14. **Dashboard Ejecutivo**: El Gerente debe visualizar el KPI de "SLA Compliance" calculado sobre el total de casos del mes.

## Módulo: Conectividad e Infraestructura
15. **Preflight CORS (PNA)**: Ejecutar una petición desde el navegador. Resultado esperado: El servidor NGINX debe responder con `Access-Control-Allow-Private-Network: true` para evitar el error `Failed to fetch`.
