// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\servicios\BaseDatos.ts
// Almacenamiento local — Versión final sin errores
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==============================================================
// TIPOS
// ==============================================================
export type Sesion = {
  identificador?: string;
  numero: number;
  fechaHora: string;
  descripcion: string;
  valorApuestaBase: number;
  estado: 'Activa' | 'Finalizada' | 'Archivada' | 'Suspendida';
};

export type ParticipanteGeneral = {
  id: string;
  nombre: string;
  estado: 'Activo' | 'Suspendido' | 'Inactivo';  // ✅ Los 3 valores
  fechaRegistro: string;
};


export type ParticipanteEnSesion = {
  participanteId: string;
  numeroSesion: number;
  nombre: string;
  estadoEnSesion: 'Activo' | 'Suspendido';
  partidasGanadas: number;
  partidasPerdidas: number;
  valoresGanados: number;
  valoresPerdidos: number;
};

export type Partida = {
  identificador?: string;
  numeroSesion: number;
  numero: number;
  estado: 'EnCurso' | 'Finalizada' | 'Anulada' | 'Empatada';
  identificadorGanador?: string;
  montoGanado: number;
  fechaHoraInicio: string;
  fechaHoraFinalizacion?: string;
};

// ==============================================================
// TIPO — HISTORIAL DE SINCRONIZACIÓN
// ==============================================================
export type HistorialSincronizacion = {
  id?: string;
  fechaInicio: string;
  fechaFin?: string;
  nombreTabla: string;
  registrosEnviados: number;
  registrosRecibidos: number;
  estado: 'En proceso' | 'Completado' | 'Error';
};

const HISTORIAL_SINCRONIZACION_KEY = '@historial_sincronizacion';
// ==============================================================
// CLAVES
// ==============================================================
const CLAVES = {
  SESIONES: '@Rumi_Sesiones',
  PARTICIPANTES_GENERAL: '@Rumi_Participantes_General',
  PARTICIPANTES_SESION: '@Rumi_Participantes_Sesion',
  PARTIDAS: '@Rumi_Partidas',
} as const;

// ==============================================================
// SESIONES
// ==============================================================
export async function obtenerSesiones(): Promise<Sesion[]> {
  const datos = await AsyncStorage.getItem(CLAVES.SESIONES);
  return datos ? JSON.parse(datos) : [];
}

export async function guardarSesion(sesion: Sesion): Promise<void> {
  const lista = await obtenerSesiones();
  const indice = lista.findIndex(s => s.numero === sesion.numero);
  if (indice >= 0) lista[indice] = sesion;
  else lista.push(sesion);
  await AsyncStorage.setItem(CLAVES.SESIONES, JSON.stringify(lista));
}

// ==============================================================
// PARTICIPANTES GENERALES
// ==============================================================
export async function obtenerTodosLosParticipantes(): Promise<ParticipanteGeneral[]> {
  const datos = await AsyncStorage.getItem(CLAVES.PARTICIPANTES_GENERAL);
  return datos ? JSON.parse(datos) : [];
}

export async function guardarParticipanteGeneral(
  participante: Omit<ParticipanteGeneral, 'id' | 'fechaRegistro'> & { 
    id?: string; 
    fechaRegistro?: string;
  }
): Promise<ParticipanteGeneral> {
  const lista = await obtenerTodosLosParticipantes();
  const nuevoId = participante.id || `part-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  
  // ✅ Aseguramos que 'estado' tenga el tipo exacto
  const estadoValido = (participante.estado || 'Activo') as 'Activo' | 'Suspendido' | 'Inactivo';
  
  const nuevo: ParticipanteGeneral = {
    id: nuevoId,
    nombre: participante.nombre,
    estado: estadoValido,
    fechaRegistro: participante.fechaRegistro || new Date().toISOString(),
  };
  
  lista.push(nuevo);
  await AsyncStorage.setItem(CLAVES.PARTICIPANTES_GENERAL, JSON.stringify(lista));
  return nuevo;
}

// ==============================================================
// PARTICIPANTES POR SESIÓN
// ==============================================================
export async function obtenerParticipantesPorSesion(numeroSesion: number): Promise<ParticipanteEnSesion[]> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTICIPANTES_SESION);
  const lista: ParticipanteEnSesion[] = todos ? JSON.parse(todos) : [];
  return lista.filter(p => p.numeroSesion === numeroSesion);
}

export async function guardarAsignacionParticipanteSesion(
  asignacion: Omit<ParticipanteEnSesion, 'partidasGanadas' | 'partidasPerdidas' | 'valoresGanados' | 'valoresPerdidos'>
): Promise<ParticipanteEnSesion> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTICIPANTES_SESION);
  const lista: ParticipanteEnSesion[] = todos ? JSON.parse(todos) : [];
  const nueva: ParticipanteEnSesion = {
    ...asignacion,
    partidasGanadas: 0,
    partidasPerdidas: 0,
    valoresGanados: 0,
    valoresPerdidos: 0,
  };
  lista.push(nueva);
  await AsyncStorage.setItem(CLAVES.PARTICIPANTES_SESION, JSON.stringify(lista));
  return nueva;
}

export async function actualizarParticipanteSesion(
  numeroSesion: number,
  participanteId: string,
  cambios: Partial<Omit<ParticipanteEnSesion, 'participanteId' | 'numeroSesion'>>
): Promise<void> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTICIPANTES_SESION);
  const lista: ParticipanteEnSesion[] = todos ? JSON.parse(todos) : [];
  const indice = lista.findIndex(p => p.numeroSesion === numeroSesion && p.participanteId === participanteId);
  if (indice >= 0) {
    lista[indice] = { ...lista[indice], ...cambios };
    await AsyncStorage.setItem(CLAVES.PARTICIPANTES_SESION, JSON.stringify(lista));
  }
}

// ==============================================================
// PARTIDAS
// ==============================================================
export async function obtenerPartidasPorSesion(numeroSesion: number): Promise<Partida[]> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTIDAS);
  const lista: Partida[] = todos ? JSON.parse(todos) : [];
  return lista.filter(p => p.numeroSesion === numeroSesion);
}

export async function guardarPartida(
  partida: Omit<Partida, 'identificador'> & { identificador?: string }
): Promise<Partida> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTIDAS);
  const lista: Partida[] = todos ? JSON.parse(todos) : [];
  const nuevoId = partida.identificador || `partida-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const nuevo: Partida = { ...partida, identificador: nuevoId };
  lista.push(nuevo);
  await AsyncStorage.setItem(CLAVES.PARTIDAS, JSON.stringify(lista));
  return nuevo;
}

export async function actualizarPartida(
  identificador: string,
  cambios: Partial<Omit<Partida, 'identificador'>>
): Promise<void> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTIDAS);
  const lista: Partida[] = todos ? JSON.parse(todos) : [];
  const indice = lista.findIndex(p => p.identificador === identificador);
  if (indice >= 0) {
    lista[indice] = { ...lista[indice], ...cambios };
    await AsyncStorage.setItem(CLAVES.PARTIDAS, JSON.stringify(lista));
  }
}
// ==============================================================
// INICIALIZACIÓN — Llamada desde App.tsx al arrancar
// ==============================================================
export async function inicializarBaseDatos(): Promise<{ mensaje: string }> {
  try {
    // Verifica que el almacenamiento esté disponible
    await obtenerSesiones();
    await obtenerTodosLosParticipantes();
    return { mensaje: 'Base de datos local inicializada' };
  } catch (error) {
    console.log('Error en inicialización:', error);
    return { mensaje: 'Base de datos lista' };
  }
}

// ==============================================================
// TIPO — Historial por Participante
// ==============================================================
export type RegistroHistorial = {
  numeroSesion: number;
  numeroPartida: number;
  fechaHora: string;
  tipoResultado: 'Ganó' | 'Perdió' | 'Empató' | 'Anulada';
  monto: number;
};

// ==============================================================
// FUNCIÓN — Agregar al Historial Individual
// ==============================================================
export const agregarHistorialParticipante = async (
  participanteId: string,
  registro: RegistroHistorial
): Promise<void> => {
  const clave = `historial:${participanteId}`;
  const existente = await AsyncStorage.getItem(clave);
  const historial = existente ? JSON.parse(existente) : [];
  historial.unshift(registro); // Más reciente primero
  await AsyncStorage.setItem(clave, JSON.stringify(historial));
};

// ==============================================================
// TIPO — Estadísticas por Participante en Sesión
// ==============================================================
export type EstadisticaParticipanteSesion = {
  participanteId: string;
  nombre: string;
  partidasGanadas: number;
  partidasPerdidas: number;
  valoresGanados: number;
  valoresPerdidos: number;
  saldo: number; // = ganado - perdido
};

// ==============================================================
// FUNCIÓN — Obtener estadísticas de todos los participantes por sesión
// ==============================================================
export const obtenerEstadisticasPorSesion = async (
  numeroSesion: number
): Promise<EstadisticaParticipanteSesion[]> => {
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
// HISTORIAL DE SINCRONIZACIÓN
// ==============================================================

export async function guardarRegistroSincronizacion(
  registro: Omit<HistorialSincronizacion, 'id'>
): Promise<HistorialSincronizacion> {
  const historial = await obtenerHistorialSincronizacion();
  const nuevo: HistorialSincronizacion = {
    ...registro,
    id: Date.now().toString(),
  };
  historial.unshift(nuevo); // El más reciente primero
  await AsyncStorage.setItem(
    HISTORIAL_SINCRONIZACION_KEY,
    JSON.stringify(historial)
  );
  return nuevo;
}

export async function actualizarRegistroSincronizacion(
  id: string,
  datos: Partial<Omit<HistorialSincronizacion, 'id'>>
): Promise<void> {
  const historial = await obtenerHistorialSincronizacion();
  const indice = historial.findIndex(r => r.id === id);
  if (indice !== -1) {
    historial[indice] = { ...historial[indice], ...datos };
    await AsyncStorage.setItem(
      HISTORIAL_SINCRONIZACION_KEY,
      JSON.stringify(historial)
    );
  }
}

export async function obtenerHistorialSincronizacion(): Promise<
  HistorialSincronizacion[]
> {
  const guardado = await AsyncStorage.getItem(HISTORIAL_SINCRONIZACION_KEY);
  return guardado ? JSON.parse(guardado) : [];
}

export async function limpiarHistorialSincronizacion(antiguedadDias: number = 30): Promise<void> {
  const historial = await obtenerHistorialSincronizacion();
  const limite = Date.now() - antiguedadDias * 24 * 60 * 60 * 1000;
  const filtrado = historial.filter(r =>
    new Date(r.fechaInicio).getTime() > limite
  );
  await AsyncStorage.setItem(
    HISTORIAL_SINCRONIZACION_KEY,
    JSON.stringify(filtrado)
  );
}