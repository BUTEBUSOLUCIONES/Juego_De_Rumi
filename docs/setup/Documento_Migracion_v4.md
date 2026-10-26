--- INICIO DEL DOCUMENTO DE MIGRACIÓN ---

# DOCUMENTO MAESTRO DE CONTEXTO Y MIGRACIÓN — JUEGO DE RUMI V3
**Fecha de generación:** 25 de octubre de 2026
**Propósito:** Transferir el estado actual, reglas de negocio definitivas y código validado a un nuevo entorno de chat para continuar el desarrollo sin regresiones.

## 1. ARQUITECTURA DEL SISTEMA
- **Frontend:** Expo / React Native / TypeScript.
- **Base de Datos Local:** SQLite (expo-sqlite) + AsyncStorage.
- **Backend:** Python FastAPI (Windows 11, Puerto 8000, montado en `/rumi`).
- **Base de Datos Central:** PostgreSQL 14+ (Base de datos: `partidas_rumi`).

## 2. REGLAS DE CODIFICACIÓN OBLIGATORIAS (NO NEGOCIABLES)
1. **Idioma:** Todo el código, comentarios, nombres de funciones/variables y documentación deben estar en **español**.
2. **Nomenclatura:** 
   - Funciones/Variables: `camelCase` descriptivo (ej. `obtenerSesiones`, `numeroSesion`).
   - Constantes: `MAYÚSCULAS_CON_GUIONES` (ej. `RUTA_BASE_SINCRONIZACION`).
3. **Documentación:** Cada función DEBE tener este bloque exacto:
   ```javascript
   // ==============================================================
   // FUNCIÓN: nombreFuncion
   // INICIO
   // Propósito: ...
   // Parámetros: ...
   // Retorna: ...
   // ==============================================================
   // (código)
   // ==============================================================
   // FIN: nombreFuncion
   // ==============================================================

   Historial de Cambios: Cada archivo debe iniciar con una tabla Markdown de versiones.
Integridad en el Origen: No parchar el servidor para corregir datos corruptos del cliente. El cliente (TypeScript) debe garantizar que los datos sean válidos antes de enviar.
Respuestas: Una sola solución por respuesta, puntual y concreta. No dar "dos opciones".
3. REGLAS DE NEGOCIO CRÍTICAS (YA RESUELTAS, NO MODIFICAR SIN AVISAR)
A. Estados de la Partida
Los estados válidos de una partida son: 'EnCurso', 'Empatada', 'Anulada', 'Ganador'.
NUNCA una partida debe tener el estado 'Finalizada'. Ese estado es exclusivo de la Sesión.
B. Integridad de Campos en partidas
fecha_hora_finalizacion: NUNCA puede ser NULL. Si no existe, se inyecta new Date().toISOString().
identificador_ganador:
DEBE ser NULL si el estado es 'Empatada' o 'Anulada'.
DEBE tener un valor string válido si el estado es 'Ganador'. El sistema lanza error si se intenta guardar 'Ganador' sin ganador.
monto_ganado: Debe ser 0 en empate/anulada, y un número > 0 en 'Ganador'.
C. Cierre de Sesión
Una sesión NO puede cerrarse si existe una partida en estado 'EnCurso'.
Al cerrar la sesión, el sistema ejecuta un DELETE FROM partidas WHERE numero_sesion = ? AND estado = 'EnCurso' para limpiar residuos antes de marcar la sesión como 'Finalizada'.
D. Sincronización
Las rutas POST son explícitas: ${baseUrl}/rumi/api/sincronizar/sesiones-lote, etc.
La verificación de vida del servidor (GET) se hace contra ${baseUrl}/rumi/docs para evitar errores 405 Method Not Allowed.
El payload de partidas-lote envía todos los campos (identificadorGanador, montoGanado, fechaHoraInicio, fechaHoraFinalizacion), no solo los básicos.
Se bloquea silenciosamente la sincronización de partidas 'EnCurso' si la sesión asociada no está 'Activa'.
E. Sincronización Automática
Configurada desde la UI. Lee sincronizacionAutomatica (boolean) e intervaloSincronizacion (número en minutos: 10, 20, 30, 60, 120, 240, 360, 480, 600) desde ConfiguracionServidor.
4. ESTADO ACTUAL DEL CÓDIGO CLAVE (RESUMEN DE IMPLEMENTACIÓN)
4.1. BaseDatos.ts (Tipo Partida y Funciones)

export type Partida = {
  identificador: string;
  numeroSesion: number;
  numero: number;
  estado: 'EnCurso' | 'Empatada' | 'Anulada' | 'Ganador';
  identificadorGanador: string | null; // OBLIGATORIO: string o null explícito
  montoGanado: number;
  fechaHoraInicio: string;
  fechaHoraFinalizacion: string; // OBLIGATORIO: string, nunca undefined
  sincronizado: 'Pendiente' | 'Sincronizado';
};
// Las funciones guardarPartida y actualizarPartida fuerzan estas reglas con validaciones typeof y lanzan errores si 'Ganador' no tiene ID.

4.2. Sincronizacion.ts (Verificación y Payload)

const RUTA_BASE_SINCRONIZACION = '/rumi/api/sincronizar';

async function verificarServidor(baseUrl: string): Promise<boolean> {
  try {
    const urlVerificacion = `${baseUrl}/rumi/docs`; // GET válido
    const respuesta = await fetch(urlVerificacion, { method: 'GET', signal: AbortSignal.timeout(5000) });
    return respuesta.ok;
  } catch (error) { return false; }
}
// El payload de partidas incluye explícitamente: identificadorGanador: p.identificadorGanador || null, montoGanado: Number(p.montoGanado) || 0, etc.

4.3. App.tsx (Sincronización Dinámica)

// El useEffect de sincronización periódica ahora lee:
const config = await obtenerConfiguracion();
if (config.sincronizacionAutomatica) {
  const milisegundos = config.intervaloSincronizacion * 60 * 1000;
  intervalo = setInterval(() => sincronizarTodo(), milisegundos);
}

5. PRÓXIMOS PASOS / TAREAS PENDIENTES
Incluir acciones de voz en opcion SesionActiva.tsx
5.1 Al momento de ejecutar esta opcion se debe activar el microfono para receptar acciones de voz
5.2 Para activar o simular el repsionar el boton Finalizar Partida, debe enviar la sieguinte Orden: Partida Finalizar, selecionar el nombre del Ganador por ejemplo Jose o seleionar Empate o Anulada y opcional activar o no el check box Finalizar Sesion.

5.4 Necesito que no se pierdan los datos que estan registrados en el movil, por lo tanto cualquier actualizacion a la aplciacion NUNCA se debe eliminar los datos de la aplciacion en el movil

5.5 Requiero como ultimo paso sincronizar la informacion con el servidor de datos

### ¿Por qué este documento es efectivo?
1. **Bloquea regresiones:** Al establecer las "Reglas de Negocio Críticas" como "NO NEGOCIABLES", el nuevo asistente no intentará "corregir" algo que ya funcionaba (como cambiar 'Ganador' por 'Finalizada').
2. **Proporciona la "Verdad Única":** Incluye los fragmentos de código exactos que funcionan, evitando que el asistente alucine soluciones viejas.
3. **Mantiene el estilo:** Refuerza las reglas de comentarios, nomenclatura y formato de historial de cambios desde el primer segundo.

Copia el bloque, pégalo en el nuevo chat, y estaremos listos para continuar con la siguiente mejora. ¡Quedo a la espera de tu confirmación!