// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\servicios\Sincronizacion.ts
// Historial de cambios:
// | Fecha       | Versión | Descripción del cambio |
// |-------------|---------|------------------------|
// | 22/10/2026  | 2.0.0   | Corrección crítica: Envío completo de campos de partida al servidor. |
// | 22/10/2026  | 2.0.1   | Filtro de regla de negocio: Bloqueo silencioso de partidas 'EnCurso' en sesiones no activas. |
// | 22/10/2026  | 2.0.2   | Corrección de URLs: Construcción explícita de rutas de sincronización. |
// | 22/10/2026  | 2.0.3   | Ajuste de verificación de servidor para usar la ruta base de sincronización solicitada. |

import {
  marcarParticipanteEnSesionSincronizado,
  marcarParticipanteSincronizado,
  marcarPartidaSincronizada,
  marcarSesionSincronizada,
  obtenerParticipantesPorSesion,
  obtenerPartidasPorSesion,
  obtenerSesiones,
  obtenerTodosLosParticipantes
} from './BaseDatos';
import { obtenerConfiguracion } from './ConfiguracionServidor';
import { guardarFechaSincronizacionExitosa } from './Diagnostico';

// ==============================================================
// CONSTANTES DE RUTAS
// Propósito: Definir las rutas relativas exactas que espera el servidor FastAPI.
// ==============================================================
const RUTA_BASE_SINCRONIZACION = '/rumi/api/sincronizar';

// ==============================================================
// TIPOS
// ==============================================================
type ResumenEnvio = {
  nuevos: number;
  actualizados: number;
  errores: number;
  total: number;
};

export type ResultadoSincronizacion = {
  exito: boolean;
  mensaje: string;
  servidorActivo: boolean;
  resumen: ResumenEnvio;
  errores: string[];
};

// ==============================================================
// FUNCIÓN: convertirFechaSegura
// INICIO
// Propósito: Convierte formatos de fecha variados a ISO 8601 estándar.
// Parámetros: textoFecha (any) - La fecha en formato string o inválido.
// Retorna: string - Fecha en formato ISO válido.
// ==============================================================
function convertirFechaSegura(textoFecha: any): string {
  try {
    if (!textoFecha || typeof textoFecha !== 'string' || textoFecha.trim() === '') {
      return new Date().toISOString();
    }
    const coincidencia = textoFecha.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2})h(\d{2})/);
    if (coincidencia) {
      const [, dia, mes, anio, hora, minuto] = coincidencia;
      const fechaPrueba = new Date(`${anio}-${mes}-${dia}T${hora}:${minuto}:00`);
      if (isNaN(fechaPrueba.getTime())) return new Date().toISOString();
      return fechaPrueba.toISOString();
    }
    const fechaPrueba2 = new Date(textoFecha);
    if (isNaN(fechaPrueba2.getTime())) return new Date().toISOString();
    return fechaPrueba2.toISOString();
  } catch (error) {
    console.warn('⚠️ Fecha inválida, usando fecha actual:', textoFecha);
    return new Date().toISOString();
  }
}
// ==============================================================
// FIN: convertirFechaSegura
// ==============================================================

// ==============================================================
// FUNCIÓN: debeEnviar
// INICIO
// Propósito: Determina si un registro debe ser enviado al servidor.
// Parámetros: elemento (objeto con propiedad sincronizado).
// Retorna: boolean - True si no está sincronizado.
// ==============================================================
function debeEnviar(elemento: { sincronizado?: string | null }): boolean {
  return elemento.sincronizado !== 'Sincronizado';
}
// ==============================================================
// FIN: debeEnviar
// ==============================================================

// ==============================================================
// FUNCIÓN: verificarServidor
// INICIO
// Propósito: Verifica si el servidor FastAPI está respondiendo en la ruta solicitada.
// Parámetros: baseUrl (string) - La URL base (ej. http://192.168.1.53:8000).
// Retorna: Promise<boolean> - True si el servidor responde.
// ==============================================================
async function verificarServidor(baseUrl: string): Promise<boolean> {
  try {
    // Se utiliza la URL base de sincronización solicitada para la verificación
    const urlVerificacion = `${baseUrl}${RUTA_BASE_SINCRONIZACION}`;
    console.log('🔍 Verificando conexión con el servidor en:', urlVerificacion);
    
    const respuesta = await fetch(urlVerificacion, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 segundos de tiempo de espera
    });
    
    // Se considera activo si el servidor responde (status < 500).
    // Esto cubre tanto respuestas 200 OK como 405 Method Not Allowed (si la ruta es solo POST),
    // confirmando en ambos casos que el servidor está vivo y alcanzable.
    return respuesta.status < 500; 
  } catch (error) {
    console.log('⚠️ Verificación de servidor falló:', error);
    return false;
  }
}
// ==============================================================
// FIN: verificarServidor
// ==============================================================

// ==============================================================
// FUNCIÓN: enviarSesionesLote
// INICIO
// Propósito: Envía el lote de sesiones pendientes al servidor.
// Parámetros: baseUrl (string).
// Retorna: Promise<ResumenEnvio>
// ==============================================================
async function enviarSesionesLote(baseUrl: string): Promise<ResumenEnvio> {
  console.log('  → Preparando lote de sesiones...');
  const todas = await obtenerSesiones();
  const pendientes = (todas || []).filter(debeEnviar);
  const resumen: ResumenEnvio = { nuevos: 0, actualizados: 0, errores: 0, total: pendientes.length };

  if (pendientes.length === 0) return resumen;

  try {
    const payload = pendientes.map((s: any) => ({
      numero: s.numero,
      descripcion: s.descripcion,
      valorApuestaBase: s.valorApuestaBase,
      estado: s.estado,
      fechaCreacion: convertirFechaSegura(s.fechaHora)
    }));

    const urlFinal = `${baseUrl}${RUTA_BASE_SINCRONIZACION}/sesiones-lote`;
    const respuesta = await fetch(urlFinal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
    const datos = await respuesta.json();
    if (datos.error) throw new Error(datos.error);

    resumen.nuevos = datos.nuevos || 0;
    resumen.actualizados = datos.actualizados || 0;

    for (const s of pendientes) {
      await marcarSesionSincronizada(s.numero);
    }
    console.log('  ✅ Lote sesiones:', resumen.nuevos, 'nuevos,', resumen.actualizados, 'actualizados');
  } catch (error) {
    resumen.errores = pendientes.length;
    console.error('  ❌ Error en lote de sesiones:', error);
  }
  return resumen;
}
// ==============================================================
// FIN: enviarSesionesLote
// ==============================================================

// ==============================================================
// FUNCIÓN: enviarParticipantesLote
// INICIO
// Propósito: Envía el lote de participantes generales pendientes al servidor.
// Parámetros: baseUrl (string).
// Retorna: Promise<ResumenEnvio>
// ==============================================================
async function enviarParticipantesLote(baseUrl: string): Promise<ResumenEnvio> {
  console.log('  → Preparando lote de participantes...');
  const todos = await obtenerTodosLosParticipantes();
  const pendientes = (todos || []).filter(debeEnviar);
  const resumen: ResumenEnvio = { nuevos: 0, actualizados: 0, errores: 0, total: pendientes.length };

  if (pendientes.length === 0) return resumen;

  try {
    const payload = pendientes.map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      estado: p.estado,
      actualizadoEn: p.fechaRegistro || new Date().toISOString()
    }));

    const urlFinal = `${baseUrl}${RUTA_BASE_SINCRONIZACION}/participantes-lote`;
    const respuesta = await fetch(urlFinal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
    const datos = await respuesta.json();
    if (datos.error) throw new Error(datos.error);

    resumen.nuevos = datos.nuevos || 0;
    resumen.actualizados = datos.actualizados || 0;

    for (const p of pendientes) {
      await marcarParticipanteSincronizado(p.id);
    }
    console.log('  ✅ Lote participantes:', resumen.nuevos, 'nuevos,', resumen.actualizados, 'actualizados');
  } catch (error) {
    resumen.errores = pendientes.length;
    console.error('  ❌ Error en lote de participantes:', error);
  }
  return resumen;
}
// ==============================================================
// FIN: enviarParticipantesLote
// ==============================================================

// ==============================================================
// FUNCIÓN: enviarParticipantesSesionLote
// INICIO
// Propósito: Envía el lote de asignaciones de participantes a sesiones.
// Parámetros: baseUrl (string).
// Retorna: Promise<ResumenEnvio>
// ==============================================================
async function enviarParticipantesSesionLote(baseUrl: string): Promise<ResumenEnvio> {
  console.log('  → Preparando lote de participantes-sesión...');
  const sesiones = await obtenerSesiones();
  let todosPendientes: any[] = [];

  for (const sesion of (sesiones || [])) {
    const participantes = await obtenerParticipantesPorSesion(sesion.numero);
    const pendientes = (participantes || []).filter(debeEnviar);
    todosPendientes = [...todosPendientes, ...pendientes];
  }

  const resumen: ResumenEnvio = { nuevos: 0, actualizados: 0, errores: 0, total: todosPendientes.length };
  if (todosPendientes.length === 0) return resumen;

  try {
    const payload = todosPendientes.map((p: any) => ({
      id: p.id || `${p.numeroSesion}-${p.participanteId}`,
      sesionNumero: p.numeroSesion,
      participanteId: p.participanteId,
      estadoEnSesion: p.estadoEnSesion,
      partidasGanadas: p.partidasGanadas,
      partidasPerdidas: p.partidasPerdidas,
      valoresGanados: p.valoresGanados,
      valoresPerdidos: p.valoresPerdidos,
      actualizadoEn: new Date().toISOString(),
      estado: 'Activo'
    }));

    const urlFinal = `${baseUrl}${RUTA_BASE_SINCRONIZACION}/sesion-participante-lote`;
    const respuesta = await fetch(urlFinal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
    const datos = await respuesta.json();
    if (datos.error) throw new Error(datos.error);

    resumen.nuevos = datos.nuevos || 0;
    resumen.actualizados = datos.actualizados || 0;

    for (const p of todosPendientes) {
      await marcarParticipanteEnSesionSincronizado(p.numeroSesion, p.participanteId);
    }
    console.log('  ✅ Lote part-sesión:', resumen.nuevos, 'nuevos,', resumen.actualizados, 'actualizados');
  } catch (error) {
    resumen.errores = todosPendientes.length;
    console.error('  ❌ Error en lote de part-sesión:', error);
  }
  return resumen;
}
// ==============================================================
// FIN: enviarParticipantesSesionLote
// ==============================================================

// ==============================================================
// FUNCIÓN: enviarPartidasLote
// INICIO
// Propósito: Envía el lote de partidas al servidor con todos sus campos.
// Parámetros: baseUrl (string).
// Retorna: Promise<ResumenEnvio>
// ==============================================================
async function enviarPartidasLote(baseUrl: string): Promise<ResumenEnvio> {
  console.log('  → Preparando lote de partidas...');
  const sesiones = await obtenerSesiones();
  let todosPendientes: any[] = [];

  for (const sesion of (sesiones || [])) {
    const partidas = await obtenerPartidasPorSesion(sesion.numero);
    
    // Filtrar partidas pendientes y excluir silenciosamente las 'EnCurso' de sesiones no activas
    const pendientes = (partidas || []).filter(p => {
      if (p.sincronizado === 'Sincronizado') return false;
      if (p.estado === 'EnCurso' && sesion.estado !== 'Activa') return false;
      return true;
    });
    
    todosPendientes = [...todosPendientes, ...pendientes];
  }

  const resumen: ResumenEnvio = { nuevos: 0, actualizados: 0, errores: 0, total: todosPendientes.length };
  if (todosPendientes.length === 0) return resumen;

  try {
    // ✅ CORRECCIÓN CRÍTICA: Enviar TODOS los campos de la partida
    const payload = todosPendientes.map((p: any) => ({
      identificador: p.identificador,
      numero: p.numero,
      sesionNumero: p.numeroSesion,
      estado: p.estado,
      identificadorGanador: p.identificadorGanador || null,
      montoGanado: Number(p.montoGanado) || 0,
      fechaHoraInicio: p.fechaHoraInicio || new Date().toISOString(),
      fechaHoraFinalizacion: p.fechaHoraFinalizacion || new Date().toISOString(),
      sincronizado: true,
      actualizadoEn: new Date().toISOString()
    }));

    const urlFinal = `${baseUrl}${RUTA_BASE_SINCRONIZACION}/partidas-lote`;
    const respuesta = await fetch(urlFinal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
    const datos = await respuesta.json();
    if (datos.error) throw new Error(datos.error);

    resumen.nuevos = datos.nuevos || 0;
    resumen.actualizados = datos.actualizados || 0;

    for (const p of todosPendientes) {
      if (p.identificador) await marcarPartidaSincronizada(p.identificador);
    }
    console.log('  ✅ Lote partidas:', resumen.nuevos, 'nuevos,', resumen.actualizados, 'actualizados');
  } catch (error) {
    resumen.errores = todosPendientes.length;
    console.error('  ❌ Error en lote de partidas:', error);
  }
  return resumen;
}
// ==============================================================
// FIN: enviarPartidasLote
// ==============================================================

// ==============================================================
// FUNCIÓN: sincronizarTodo
// INICIO
// Propósito: Orquesta el proceso completo de sincronización por lotes.
// Parámetros: Ninguno.
// Retorna: Promise<ResultadoSincronizacion>
// ==============================================================
export async function sincronizarTodo(): Promise<ResultadoSincronizacion> {
  console.log('='.repeat(50));
  console.log('🔄 INICIANDO SINCRONIZACIÓN POR LOTES...');
  console.log('='.repeat(50));

  try {
    // Obtenemos la URL base limpia (ej. http://192.168.1.53:8000)
    const config = await obtenerConfiguracion();
    const baseUrl = `http://${config.ip}:${config.puerto}`;
    
    console.log('🔍 PASO 1: Verificando conexión con el servidor...');
    const servidorActivo = await verificarServidor(baseUrl);
    console.log('✅ Servidor activo:', servidorActivo);
    
    if (!servidorActivo) {
      return {
        exito: false,
        mensaje: 'No se puede conectar con el servidor',
        servidorActivo: false,
        resumen: { nuevos: 0, actualizados: 0, errores: 0, total: 0 },
        errores: [`Servidor inalcanzable en: ${baseUrl}`]
      };
    }

    console.log('🔍 PASO 2: Enviando lotes de datos...');
    
    const resumenParticipantes = await enviarParticipantesLote(baseUrl);
    const resumenSesiones = await enviarSesionesLote(baseUrl);
    const resumenParticipantesSesion = await enviarParticipantesSesionLote(baseUrl);
    const resumenPartidas = await enviarPartidasLote(baseUrl);

    const resumenFinal: ResumenEnvio = {
      nuevos: resumenParticipantes.nuevos + resumenSesiones.nuevos + resumenParticipantesSesion.nuevos + resumenPartidas.nuevos,
      actualizados: resumenParticipantes.actualizados + resumenSesiones.actualizados + resumenParticipantesSesion.actualizados + resumenPartidas.actualizados,
      errores: resumenParticipantes.errores + resumenSesiones.errores + resumenParticipantesSesion.errores + resumenPartidas.errores,
      total: resumenParticipantes.total + resumenSesiones.total + resumenParticipantesSesion.total + resumenPartidas.total
    };

    console.log('='.repeat(50));
    console.log(`🏁 SINCRONIZACIÓN COMPLETA`);
    console.log(`   Total: ${resumenFinal.total} | Nuevos: ${resumenFinal.nuevos} | Actualizados: ${resumenFinal.actualizados} | Errores: ${resumenFinal.errores}`);
    console.log('='.repeat(50));

    if (resumenFinal.errores === 0) {
      await guardarFechaSincronizacionExitosa();
    }

    return {
      exito: resumenFinal.errores === 0,
      mensaje: resumenFinal.errores === 0 ? `Sincronización completa` : `Sincronizada con ${resumenFinal.errores} errores`,
      servidorActivo: true,
      resumen: resumenFinal,
      errores: []
    };
  } catch (error) {
    console.error('❌❌❌ ERROR CRÍTICO EN SINCRONIZACIÓN ❌❌❌');
    return {
      exito: false,
      mensaje: `Error crítico: ${(error as Error).message}`,
      servidorActivo: false,
      resumen: { nuevos: 0, actualizados: 0, errores: 1, total: 0 },
      errores: [(error as Error).message]
    };
  }
}
// ==============================================================
// FIN: sincronizarTodo
// ==============================================================