// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\servicios\BaseDatos.ts
// Almacenamiento local en SQLite — Definición de tipos, funciones de lectura,
// escritura y marcado de estado de sincronización para sesiones, participantes, partidas.
// Versión blindada: protege contra retornos 'undefined' de expo-sqlite usando '|| []'.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerConexion } from './ConexionSQLite';

// ==============================================================
// TIPOS (Sin cambios, mantenidos para compatibilidad con el resto de la app)
// ==============================================================
export type Sesion = {
  identificador?: string;
  numero: number;
  fechaHora: string;
  descripcion: string;
  valorApuestaBase: number;
  estado: 'Activa' | 'Finalizada' | 'Archivada' | 'Suspendida';
  sincronizado: 'Pendiente' | 'Sincronizado';
};

export type ParticipanteGeneral = {
  id: string;
  nombre: string;
  estado: 'Activo' | 'Suspendido' | 'Inactivo';
  fechaRegistro: string;
  sincronizado: 'Pendiente' | 'Sincronizado';
};

export type ParticipanteEnSesion = {
  id?: string;
  participanteId: string;
  numeroSesion: number;
  nombre: string;
  estadoEnSesion: 'Activo' | 'Suspendido';
  partidasGanadas: number;
  partidasPerdidas: number;
  valoresGanados: number;
  valoresPerdidos: number;
  sincronizado: 'Pendiente' | 'Sincronizado';
};

// ==============================================================
// TIPO: Partida (CORREGIDO: campos OBLIGATORIOS)
// INICIO
// Propósito: Definir estructura de partida con validación estricta.
// REGLAS:
// - fechaHoraFinalizacion: OBLIGATORIO (string, nunca undefined)
// - identificadorGanador: string | null (explícito, nunca undefined)
// - estado: solo 'EnCurso', 'Empatada', 'Anulada', 'Ganador'
// ==============================================================
export type Partida = {
  identificador: string;
  numeroSesion: number;
  numero: number;
  estado: 'EnCurso' | 'Empatada' | 'Anulada' | 'Ganador';
  identificadorGanador: string | null; // ✅ OBLIGATORIO: string o null explícito
  montoGanado: number;
  fechaHoraInicio: string;
  fechaHoraFinalizacion: string; // ✅ OBLIGATORIO: string, nunca undefined
  sincronizado: 'Pendiente' | 'Sincronizado';
};
// ==============================================================
// FIN: Tipo Partida
// ==============================================================

export type HistorialSincronizacion = {
  id: string;
  fechaInicio: string;
  fechaFin?: string;
  nombreTabla: string;
  registrosEnviados: number;
  registrosRecibidos: number;
  mensaje: string;
  estado: 'En proceso' | 'Completado' | 'Error';
};

export type EstadisticaParticipanteSesion = {
  participanteId: string;
  nombre: string;
  partidasGanadas: number;
  partidasPerdidas: number;
  valoresGanados: number;
  valoresPerdidos: number;
  saldo: number;
};

// ==============================================================
// FUNCIÓN: obtenerSesiones
// INICIO
// Propósito: Devuelve listado completo de sesiones almacenadas localmente.
// Blindado con '|| []' para evitar errores si la DB devuelve undefined.
// ==============================================================
export async function obtenerSesiones(): Promise<Sesion[]> {
  try {
    const db = obtenerConexion();
    const resultado = await db.getAllAsync<any>(
      `SELECT numero, fecha_hora as fechaHora, descripcion, valor_apuesta_base as valorApuestaBase, estado, sincronizado 
       FROM sesiones ORDER BY numero DESC`
    ) || [];
    
    return (resultado || []).map((row: any) => ({
      numero: row.numero,
      fechaHora: row.fechaHora,
      descripcion: row.descripcion,
      valorApuestaBase: row.valorApuestaBase,
      estado: row.estado,
      sincronizado: row.sincronizado
    }));
  } catch (error) {
    console.error('Error en obtenerSesiones:', error);
    return [];
  }
}
// ==============================================================
// FIN: obtenerSesiones
// ==============================================================

// ==============================================================
// FUNCIÓN: guardarSesion
// INICIO
// Propósito: Agrega o actualiza sesión; establece sincronizado = Pendiente por defecto.
// Usa UPSERT (INSERT ... ON CONFLICT) para ser atómico y rápido.
// ==============================================================
export async function guardarSesion(sesion: Sesion): Promise<void> {
  const db = obtenerConexion();
  const sincronizado = sesion.sincronizado || 'Pendiente';
  
  await db.runAsync(
    `INSERT INTO sesiones (numero, fecha_hora, descripcion, valor_apuesta_base, estado, sincronizado)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(numero) DO UPDATE SET
       fecha_hora = excluded.fecha_hora,
       descripcion = excluded.descripcion,
       valor_apuesta_base = excluded.valor_apuesta_base,
       estado = excluded.estado,
       sincronizado = excluded.sincronizado`,
    [sesion.numero, sesion.fechaHora, sesion.descripcion, sesion.valorApuestaBase, sesion.estado, sincronizado]
  );
}
// ==============================================================
// FIN: guardarSesion
// ==============================================================

// ==============================================================
// FUNCIÓN: obtenerTodosLosParticipantes
// INICIO
// Propósito: Devuelve listado completo de participantes generales.
// Blindado con '|| []'.
// ==============================================================
export async function obtenerTodosLosParticipantes(): Promise<ParticipanteGeneral[]> {
  try {
    const db = obtenerConexion();
    const resultado = await db.getAllAsync<any>(
      `SELECT id, nombre, estado, fecha_registro as fechaRegistro, sincronizado 
       FROM participantes ORDER BY nombre ASC`
    ) || [];
    
    return (resultado || []).map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      estado: row.estado,
      fechaRegistro: row.fechaRegistro,
      sincronizado: row.sincronizado
    }));
  } catch (error) {
    console.error('Error en obtenerTodosLosParticipantes:', error);
    return [];
  }
}
// ==============================================================
// FIN: obtenerTodosLosParticipantes
// ==============================================================

// ==============================================================
// FUNCIÓN: guardarParticipanteGeneral
// INICIO
// Propósito: Crea participante; genera ID si falta, asigna fecha y marca Pendiente.
// ==============================================================
export async function guardarParticipanteGeneral(
  participante: Omit<ParticipanteGeneral, 'id' | 'fechaRegistro'> & {
    id?: string;
    fechaRegistro?: string;
    sincronizado?: 'Pendiente' | 'Sincronizado';
  }
): Promise<ParticipanteGeneral> {
  const db = obtenerConexion();
  const nuevoId = participante.id || `part-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const estadoValido = (participante.estado || 'Activo') as 'Activo' | 'Suspendido' | 'Inactivo';
  const fechaRegistro = participante.fechaRegistro || new Date().toISOString();
  const sincronizado = participante.sincronizado || 'Pendiente';

  await db.runAsync(
    `INSERT INTO participantes (id, nombre, estado, fecha_registro, sincronizado)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nombre = excluded.nombre,
       estado = excluded.estado,
       fecha_registro = excluded.fecha_registro,
       sincronizado = excluded.sincronizado`,
    [nuevoId, participante.nombre, estadoValido, fechaRegistro, sincronizado]
  );

  return {
    id: nuevoId,
    nombre: participante.nombre,
    estado: estadoValido,
    fechaRegistro,
    sincronizado
  };
}
// ==============================================================
// FIN: guardarParticipanteGeneral
// ==============================================================

// ==============================================================
// FUNCIÓN: obtenerParticipantesPorSesion
// INICIO
// Propósito: Filtra y devuelve participantes asignados a una sesión específica.
// Blindado con '|| []'.
// ==============================================================
export async function obtenerParticipantesPorSesion(numeroSesion: number): Promise<ParticipanteEnSesion[]> {
  try {
    const db = obtenerConexion();
    const resultado = await db.getAllAsync<any>(
      `SELECT id, participante_id as participanteId, sesion_numero as numeroSesion, nombre, 
              estado_en_sesion as estadoEnSesion, partidas_ganadas as partidasGanadas, 
              partidas_perdidas as partidasPerdidas, valores_ganados as valoresGanados, 
              valores_perdidos as valoresPerdidos, sincronizado
       FROM participantes_sesion 
       WHERE sesion_numero = ?`,
      [numeroSesion]
    ) || [];
    
    return (resultado || []).map((row: any) => ({
      id: row.id,
      participanteId: row.participanteId,
      numeroSesion: row.numeroSesion,
      nombre: row.nombre,
      estadoEnSesion: row.estadoEnSesion,
      partidasGanadas: row.partidasGanadas,
      partidasPerdidas: row.partidasPerdidas,
      valoresGanados: row.valoresGanados,
      valoresPerdidos: row.valoresPerdidos,
      sincronizado: row.sincronizado
    }));
  } catch (error) {
    console.error('Error en obtenerParticipantesPorSesion:', error);
    return [];
  }
}
// ==============================================================
// FIN: obtenerParticipantesPorSesion
// ==============================================================

// ==============================================================
// FUNCIÓN: guardarAsignacionParticipanteSesion
// INICIO
// Propósito: Asigna participante a sesión. Blindada para garantizar 
// que el nombre NUNCA se guarde en blanco, consultando directamente 
// la fuente de verdad en SQLite.
// ==============================================================
export async function guardarAsignacionParticipanteSesion(
  asignacion: Omit<ParticipanteEnSesion, 'partidasGanadas' | 'partidasPerdidas' | 'valoresGanados' | 'valoresPerdidos' | 'id'> & { id?: string }
): Promise<ParticipanteEnSesion> {
  const db = obtenerConexion();
  const nuevoId = asignacion.id || `ps-${asignacion.numeroSesion}-${asignacion.participanteId}`;
  const sincronizado = asignacion.sincronizado || 'Pendiente';

  let nombreReal = asignacion.nombre || "Desconocido";
  try {
    // Intento 1: Buscar en la tabla 'participantes'
    let resultado = await db.getFirstAsync<{ nombre: string }>(
      `SELECT nombre FROM participantes WHERE id = ?`,
      [asignacion.participanteId]
    );
    // Intento 2: Si falla (ej. la tabla en SQLite aún se llama participantes_general), buscar ahí
    if (!resultado || !resultado.nombre) {
      resultado = await db.getFirstAsync<{ nombre: string }>(
        `SELECT nombre FROM participantes_general WHERE id = ?`,
        [asignacion.participanteId]
      );
    }
    if (resultado && resultado.nombre) {
      nombreReal = resultado.nombre;
    }
  } catch (e) {
    console.warn("No se pudo verificar el nombre del participante en SQLite, usando fallback.");
  }

  await db.runAsync(
    `INSERT INTO participantes_sesion 
     (id, sesion_numero, participante_id, nombre, estado_en_sesion, partidas_ganadas, partidas_perdidas, valores_ganados, valores_perdidos, sincronizado)
     VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       nombre = excluded.nombre,
       estado_en_sesion = excluded.estado_en_sesion,
       sincronizado = excluded.sincronizado`,
    [nuevoId, asignacion.numeroSesion, asignacion.participanteId, nombreReal, asignacion.estadoEnSesion, sincronizado]
  );

  return {
    id: nuevoId,
    participanteId: asignacion.participanteId,
    numeroSesion: asignacion.numeroSesion,
    nombre: nombreReal,
    estadoEnSesion: asignacion.estadoEnSesion,
    partidasGanadas: 0,
    partidasPerdidas: 0,
    valoresGanados: 0,
    valoresPerdidos: 0,
    sincronizado
  };
}
// ==============================================================
// FIN: guardarAsignacionParticipanteSesion
// ==============================================================

// ==============================================================
// FUNCIÓN: actualizarParticipanteSesion
// INICIO
// Propósito: Modifica campos de asignación sin alterar identificadores.
// ==============================================================
export async function actualizarParticipanteSesion(
  numeroSesion: number,
  participanteId: string,
  cambios: Partial<Omit<ParticipanteEnSesion, 'participanteId' | 'numeroSesion'>>
): Promise<void> {
  const db = obtenerConexion();
  const campos = Object.keys(cambios);
  if (campos.length === 0) return;

  if (!cambios.sincronizado) {
    cambios.sincronizado = 'Pendiente';
  }

  const mapCamelToSnake: Record<string, string> = {
    estadoEnSesion: 'estado_en_sesion',
    partidasGanadas: 'partidas_ganadas',
    partidasPerdidas: 'partidas_perdidas',
    valoresGanados: 'valores_ganados',
    valoresPerdidos: 'valores_perdidos',
    sincronizado: 'sincronizado'
  };

  const setClause = campos.map(campo => {
    const nombreColumna = mapCamelToSnake[campo] || campo;
    return `${nombreColumna} = ?`;
  }).join(', ');

  const valores = campos.map(campo => {
    const nombreColumna = mapCamelToSnake[campo] || campo;
    return (cambios as any)[nombreColumna] !== undefined ? (cambios as any)[nombreColumna] : (cambios as any)[campo];
  });

  valores.push(numeroSesion, participanteId);

  await db.runAsync(
    `UPDATE participantes_sesion SET ${setClause} WHERE sesion_numero = ? AND participante_id = ?`,
    valores
  );
}
// ==============================================================
// FIN: actualizarParticipanteSesion
// ==============================================================

// ==============================================================
// FUNCIÓN: obtenerPartidasPorSesion
// INICIO
// Propósito: Devuelve todas las partidas pertenecientes a una sesión.
// Blindado con '|| []'.
// ==============================================================
export async function obtenerPartidasPorSesion(numeroSesion: number): Promise<Partida[]> {
  try {
    const db = obtenerConexion();
    const resultado = await db.getAllAsync<any>(
      `SELECT identificador, numero_sesion as numeroSesion, numero, estado, 
              identificador_ganador as identificadorGanador, monto_ganado as montoGanado, 
              fecha_hora_inicio as fechaHoraInicio, fecha_hora_finalizacion as fechaHoraFinalizacion, sincronizado
       FROM partidas 
       WHERE numero_sesion = ? ORDER BY numero ASC`,
      [numeroSesion]
    ) || [];
    
    return (resultado || []).map((row: any) => ({
      identificador: row.identificador,
      numeroSesion: row.numeroSesion,
      numero: row.numero,
      estado: row.estado,
      identificadorGanador: row.identificadorGanador,
      montoGanado: row.montoGanado,
      fechaHoraInicio: row.fechaHoraInicio,
      fechaHoraFinalizacion: row.fechaHoraFinalizacion,
      sincronizado: row.sincronizado
    }));
  } catch (error) {
    console.error('Error en obtenerPartidasPorSesion:', error);
    return [];
  }
}
// ==============================================================
// FIN: obtenerPartidasPorSesion
// ==============================================================


// ==============================================================
// FUNCIÓN: guardarPartida
// INICIO
// Propósito: Registra partida nueva con validación ESTRICTA.
// REGLA: Si estado='Ganador', identificadorGanador DEBE tener valor.
// REGLA: fechaHoraFinalizacion NUNCA es NULL.
// ==============================================================
export async function guardarPartida(
  partida: Omit<Partida, 'identificador'> & { identificador?: string }
): Promise<Partida> {
  const db = obtenerConexion();
  const nuevoId = partida.identificador || `partida-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const sincronizado = partida.sincronizado || 'Pendiente';

  let numeroSesionValido = partida.numeroSesion;
  if (!numeroSesionValido || numeroSesionValido === 0) {
    const sesionActiva = await db.getFirstAsync<{ numero: number }>(
      `SELECT numero FROM sesiones WHERE estado = 'Activa' ORDER BY numero DESC LIMIT 1`
    );
    numeroSesionValido = sesionActiva?.numero || 1;
  }

  //  VALIDACIÓN: Bloquear si la sesión no está Activa
  const sesionCheck = await db.getFirstAsync<{ estado: string }>(
    `SELECT estado FROM sesiones WHERE numero = ?`,
    [numeroSesionValido]
  );
  
  if (sesionCheck && sesionCheck.estado !== 'Activa') {
    console.error(`🚫 BLOQUEO: Sesión ${numeroSesionValido} está en estado: ${sesionCheck.estado}`);
    throw new Error("No se puede crear partida en sesión no activa.");
  }

  // 🔥 VALIDACIÓN ESTRICTA: Si estado es 'Ganador', debe tener identificadorGanador
  if (partida.estado === 'Ganador') {
    if (!partida.identificadorGanador || partida.identificadorGanador === '' || partida.identificadorGanador === 'null' || partida.identificadorGanador === 'undefined') {
      console.error('🚫 ERROR: Partida Ganador sin identificadorGanador', partida);
      throw new Error("Partida 'Ganador' requiere identificadorGanador válido.");
    }
  }

  // 🔥 VALIDACIÓN: Si estado es 'Empatada' o 'Anulada', forzar ganador a null y monto a 0
  let ganadorFinal: string | null = null;
  let montoFinal: number = 0;
  
  if (partida.estado === 'Empatada' || partida.estado === 'Anulada') {
    ganadorFinal = null;
    montoFinal = 0;
  } else if (partida.estado === 'Ganador') {
    ganadorFinal = String(partida.identificadorGanador);
    montoFinal = Number(partida.montoGanado) || 0;
  } else {
    // EnCurso: ganador null, monto 0
    ganadorFinal = null;
    montoFinal = 0;
  }

  // 🔥 FECHAS: NUNCA NULL
  const fechaInicio = typeof partida.fechaHoraInicio === 'string' && partida.fechaHoraInicio.trim() !== '' 
    ? partida.fechaHoraInicio 
    : new Date().toISOString();

  const fechaFin = typeof partida.fechaHoraFinalizacion === 'string' && partida.fechaHoraFinalizacion.trim() !== '' 
    ? partida.fechaHoraFinalizacion 
    : new Date().toISOString();

  console.log('💾 GUARDAR PARTIDA:', {
    identificador: nuevoId,
    estado: partida.estado,
    ganador: ganadorFinal,
    monto: montoFinal,
    fechaFin: fechaFin
  });

  await db.runAsync(
    `INSERT INTO partidas 
     (identificador, numero_sesion, numero, estado, identificador_ganador, monto_ganado, fecha_hora_inicio, fecha_hora_finalizacion, sincronizado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nuevoId, numeroSesionValido, partida.numero, partida.estado, ganadorFinal, montoFinal, fechaInicio, fechaFin, sincronizado]
  );

  return {
    identificador: nuevoId,
    numeroSesion: numeroSesionValido,
    numero: partida.numero,
    estado: partida.estado,
    identificadorGanador: ganadorFinal,
    montoGanado: montoFinal,
    fechaHoraInicio: fechaInicio,
    fechaHoraFinalizacion: fechaFin,
    sincronizado
  };
}
// ==============================================================
// FIN: guardarPartida
// ==============================================================

// ==============================================================
// FUNCIÓN: actualizarPartida
// INICIO
// Propósito: Modifica partida con validación ESTRICTA de reglas de negocio.
// REGLA: Si estado='Ganador', identificadorGanador DEBE tener valor.
// REGLA: Si estado='Empatada' o 'Anulada', identificadorGanador DEBE ser NULL.
// REGLA: fechaHoraFinalizacion NUNCA es NULL.
// ==============================================================
export async function actualizarPartida(
  identificador: string,
  cambios: Partial<Omit<Partida, 'identificador'>>
): Promise<void> {
  const db = obtenerConexion();
  const campos = Object.keys(cambios);
  if (campos.length === 0) return;

  if (!cambios.sincronizado) {
    cambios.sincronizado = 'Pendiente';
  }

  // 🔥 VALIDACIÓN ESTRICTA: Si estado es 'Ganador', debe tener identificadorGanador
  if (cambios.estado === 'Ganador') {
    if (!cambios.identificadorGanador || cambios.identificadorGanador === '' || cambios.identificadorGanador === 'null' || cambios.identificadorGanador === 'undefined') {
      console.error('🚫 ERROR: Intento de guardar Ganador sin identificadorGanador', { identificador, cambios });
      throw new Error("Partida 'Ganador' requiere identificadorGanador válido.");
    }
  }

  // 🔥 FORZAR: Si estado es 'Empatada' o 'Anulada', ganador=null y monto=0
  if (cambios.estado === 'Empatada' || cambios.estado === 'Anulada') {
    cambios.identificadorGanador = null;
    cambios.montoGanado = 0;
  }

  const mapCamelToSnake: Record<string, string> = {
    numeroSesion: 'numero_sesion',
    identificadorGanador: 'identificador_ganador',
    montoGanado: 'monto_ganado',
    fechaHoraInicio: 'fecha_hora_inicio',
    fechaHoraFinalizacion: 'fecha_hora_finalizacion',
    sincronizado: 'sincronizado',
    estado: 'estado'
  };

  const setClause = campos.map(campo => {
    const nombreColumna = mapCamelToSnake[campo] || campo;
    return `${nombreColumna} = ?`;
  }).join(', ');

  const valores: (string | number | null)[] = campos.map(campo => {
    let valor = (cambios as any)[campo];
    
    // 🔥 FECHA: NUNCA NULL
    if (campo === 'fechaHoraFinalizacion' || campo === 'fechaHoraInicio') {
      if (typeof valor !== 'string' || valor.trim() === '' || valor === 'null' || valor === 'undefined' || valor === null || valor === undefined) {
        return new Date().toISOString();
      }
      return String(valor);
    }
    
    // 🔥 GANADOR: null si Empatada/Anulada, string si Ganador
    if (campo === 'identificadorGanador') {
      if (cambios.estado === 'Empatada' || cambios.estado === 'Anulada') {
        return null;
      }
      if (valor === undefined || valor === null || valor === '' || valor === 'null' || valor === 'undefined') {
        return null;
      }
      return String(valor);
    }
    
    // 🔥 MONTO
    if (campo === 'montoGanado') {
      const num = Number(valor);
      return isNaN(num) ? 0 : num;
    }
    
    // 🔥 SINCRONIZADO Y ESTADO
    if (campo === 'sincronizado' || campo === 'estado') {
      return (valor === undefined || valor === null) ? (campo === 'sincronizado' ? 'Pendiente' : String(valor)) : String(valor);
    }
    
    return valor === undefined || valor === null ? null : valor;
  });
  
  valores.push(identificador);

  console.log(' ACTUALIZAR PARTIDA:', { identificador, cambios, valores });

  await db.runAsync(
    `UPDATE partidas SET ${setClause} WHERE identificador = ?`,
    valores
  );
}
// ==============================================================
// FIN: actualizarPartida
// ==============================================================

// ==============================================================
// FUNCIONES DE MARCADO DE SINCRONIZACIÓN
// INICIO
// Propósito: Cambian el estado a 'Sincronizado' tras confirmación del servidor.
// ==============================================================
export async function marcarSesionSincronizada(numero: number): Promise<void> {
  const db = obtenerConexion();
  await db.runAsync(`UPDATE sesiones SET sincronizado = 'Sincronizado' WHERE numero = ?`, [numero]);
}

export async function marcarParticipanteSincronizado(id: string): Promise<void> {
  const db = obtenerConexion();
  await db.runAsync(`UPDATE participantes SET sincronizado = 'Sincronizado' WHERE id = ?`, [id]);
}

export async function marcarParticipanteEnSesionSincronizado(numeroSesion: number, participanteId: string): Promise<void> {
  const db = obtenerConexion();
  await db.runAsync(`UPDATE participantes_sesion SET sincronizado = 'Sincronizado' WHERE sesion_numero = ? AND participante_id = ?`, [numeroSesion, participanteId]);
}

export async function marcarPartidaSincronizada(identificador: string): Promise<void> {
  const db = obtenerConexion();
  await db.runAsync(`UPDATE partidas SET sincronizado = 'Sincronizado' WHERE identificador = ?`, [identificador]);
}
// ==============================================================
// FIN: FUNCIONES DE MARCADO DE SINCRONIZACIÓN
// ==============================================================

// ==============================================================
// FUNCIÓN: obtenerEstadisticasPorSesion
// INICIO
// Propósito: Calcula saldo = ganado - perdido para cada participante de la sesión.
// ==============================================================
export const obtenerEstadisticasPorSesion = async (numeroSesion: number): Promise<EstadisticaParticipanteSesion[]> => {
  const participantesSesion = await obtenerParticipantesPorSesion(numeroSesion);
  return participantesSesion.map(p => ({
    participanteId: p.participanteId,
    nombre: p.nombre,
    partidasGanadas: p.partidasGanadas,
    partidasPerdidas: p.partidasPerdidas,
    valoresGanados: p.valoresGanados,
    valoresPerdidos: p.valoresPerdidos,
    saldo: p.valoresGanados - p.valoresPerdidos,
  }));
};
// ==============================================================
// FIN: obtenerEstadisticasPorSesion
// ==============================================================

// ==============================================================
// FUNCIONES DE HISTORIAL DE SINCRONIZACIÓN
// INICIO
// Propósito: Gestionan el registro local del historial de procesos de sync.
// ==============================================================
export async function guardarRegistroSincronizacion(registro: Omit<HistorialSincronizacion, 'id'>): Promise<HistorialSincronizacion> {
  const db = obtenerConexion();
  const nuevoId = Date.now().toString();
  
  await db.runAsync(
    `INSERT INTO historial_sincronizacion (id, fecha_inicio, fecha_fin, nombre_tabla, registros_enviados, registros_recibidos, mensaje, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nuevoId, registro.fechaInicio, registro.fechaFin || null, registro.nombreTabla, registro.registrosEnviados, registro.registrosRecibidos, registro.mensaje, registro.estado]
  );
  
  return { ...registro, id: nuevoId };
}

export async function actualizarRegistroSincronizacion(id: string, datos: Partial<Omit<HistorialSincronizacion, 'id'>>): Promise<void> {
  const db = obtenerConexion();
  const campos = Object.keys(datos);
  if (campos.length === 0) return;

  const mapCamelToSnake: Record<string, string> = {
    fechaInicio: 'fecha_inicio', fechaFin: 'fecha_fin', nombreTabla: 'nombre_tabla',
    registrosEnviados: 'registros_enviados', registrosRecibidos: 'registros_recibidos',
    mensaje: 'mensaje', estado: 'estado'
  };

  const setClause = campos.map(campo => `${mapCamelToSnake[campo] || campo} = ?`).join(', ');
  const valores = campos.map(campo => {
    const nombreColumna = mapCamelToSnake[campo] || campo;
    return (datos as any)[nombreColumna] !== undefined ? (datos as any)[nombreColumna] : (datos as any)[campo];
  });
  valores.push(id);

  await db.runAsync(`UPDATE historial_sincronizacion SET ${setClause} WHERE id = ?`, valores);
}

export async function obtenerHistorialSincronizacion(): Promise<HistorialSincronizacion[]> {
  const db = obtenerConexion();
  const resultado = await db.getAllAsync<any>(
    `SELECT id, fecha_inicio as fechaInicio, fecha_fin as fechaFin, nombre_tabla as nombreTabla, 
            registros_enviados as registrosEnviados, registros_recibidos as registrosRecibidos, 
            mensaje, estado
     FROM historial_sincronizacion ORDER BY fecha_inicio DESC`
  ) || [];
  
  return resultado.map((row: any) => ({
    id: row.id, fechaInicio: row.fechaInicio, fechaFin: row.fechaFin, nombreTabla: row.nombreTabla,
    registrosEnviados: row.registrosEnviados, registrosRecibidos: row.registrosRecibidos,
    mensaje: row.mensaje, estado: row.estado
  }));
}

export async function limpiarHistorialSincronizacion(antiguedadDias: number = 30): Promise<void> {
  const db = obtenerConexion();
  const fechaLimite = new Date(Date.now() - antiguedadDias * 24 * 60 * 60 * 1000).toISOString();
  await db.runAsync(`DELETE FROM historial_sincronizacion WHERE fecha_inicio < ?`, [fechaLimite]);
}
// ==============================================================
// FIN: FUNCIONES DE HISTORIAL DE SINCRONIZACIÓN
// ==============================================================

   // ==============================================================
   // TIPO: RegistroHistorial
   // Propósito: Estructura de historial individual de resultados por participante
   // ==============================================================
   export type RegistroHistorial = {
     numeroSesion: number;
     numeroPartida: number;
     fechaHora: string;
     tipoResultado: 'Ganó' | 'Perdió' | 'Empató' | 'Anulada';
     monto: number;
   };

   // ==============================================================
   // FUNCIÓN: agregarHistorialParticipante
   // INICIO
   // Propósito: Inserta nuevo resultado en el historial individual del participante.
   // Se mantiene en AsyncStorage por ser un dato auxiliar de solo lectura local.
   // ==============================================================
   export const agregarHistorialParticipante = async (
     participanteId: string,
     registro: RegistroHistorial
   ): Promise<void> => {
     try {
       const clave = `historial:${participanteId}`;
       const existente = await AsyncStorage.getItem(clave);
       const historial = existente ? JSON.parse(existente) : [];
       historial.unshift(registro);
       await AsyncStorage.setItem(clave, JSON.stringify(historial));
     } catch (error) {
       console.error('Error al guardar historial de participante:', error);
     }
   };
   // ==============================================================
   // FIN: agregarHistorialParticipante
   // ==============================================================