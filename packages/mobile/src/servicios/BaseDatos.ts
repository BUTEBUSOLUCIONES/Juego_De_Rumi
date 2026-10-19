// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\servicios\BaseDatos.ts
// Almacenamiento local en AsyncStorage — Definición de tipos, funciones de lectura,
// escritura y marcado de estado de sincronización para sesiones, participantes, partidas
// ==============================================================
// IMPORTACIÓN — Librería de almacenamiento local
// ==============================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==============================================================
// TIPO: Sesion
// Propósito: Estructura de datos de sesión de juego con estado y sincronización
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

// ==============================================================
// TIPO: ParticipanteGeneral
// Propósito: Datos personales del participante independiente de sesión
// ==============================================================
export type ParticipanteGeneral = {
  id: string;
  nombre: string;
  estado: 'Activo' | 'Suspendido' | 'Inactivo';
  fechaRegistro: string;
  sincronizado: 'Pendiente' | 'Sincronizado';
};

// ==============================================================
// TIPO: ParticipanteEnSesion
// Propósito: Asignación de participante a una sesión con estadísticas
// ==============================================================
export type ParticipanteEnSesion = {
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
// TIPO: Partida
// Propósito: Registro de cada partida dentro de una sesión
// ==============================================================
export type Partida = {
  identificador?: string;
  numeroSesion: number;
  numero: number;
  estado: 'EnCurso' | 'Finalizada' | 'Anulada' | 'Empatada';
  identificadorGanador?: string;
  montoGanado: number;
  fechaHoraInicio: string;
  fechaHoraFinalizacion?: string;
  sincronizado: 'Pendiente' | 'Sincronizado';
};

// ==============================================================
// TIPO: HistorialSincronizacion
// Propósito: Registro del historial de procesos de sincronización local
// ==============================================================
export type HistorialSincronizacion = {
  id?: string;
  fechaInicio: string;
  fechaFin?: string;
  nombreTabla: string;
  registrosEnviados: number;
  registrosRecibidos: number;
  mensaje: string;
  estado: 'En proceso' | 'Completado' | 'Error';
  sincronizado: 'Pendiente' | 'Sincronizado';
};

// ==============================================================
// CONSTANTE: HISTORIAL_SINCRONIZACION_KEY
// Propósito: Clave de almacenamiento del historial de sincronización
// ==============================================================
const HISTORIAL_SINCRONIZACION_KEY = '@historial_sincronizacion';

// ==============================================================
// CONSTANTE: CLAVES
// Propósito: Definición de claves únicas para cada colección en AsyncStorage
// ==============================================================
const CLAVES = {
  SESIONES: '@Rumi_Sesiones',
  PARTICIPANTES_GENERAL: '@Rumi_Participantes_General',
  PARTICIPANTES_SESION: '@Rumi_Participantes_Sesion',
  PARTIDAS: '@Rumi_Partidas',
} as const;

// ==============================================================
// FUNCIÓN: obtenerSesiones
// Propósito: Devuelve listado completo de sesiones almacenadas localmente
// ==============================================================
export async function obtenerSesiones(): Promise<Sesion[]> {
  const datos = await AsyncStorage.getItem(CLAVES.SESIONES);
  return datos ? JSON.parse(datos) : [];
}
// ==============================================================
// FIN: obtenerSesiones
// ==============================================================

// ==============================================================
// FUNCIÓN: guardarSesion
// Propósito: Agrega o actualiza sesión; establece sincronizado = Pendiente por defecto
// ==============================================================
export async function guardarSesion(sesion: Sesion): Promise<void> {
  const lista = await obtenerSesiones();
  const indice = lista.findIndex(s => s.numero === sesion.numero);
  
  // Asegura valor por defecto en sincronizado
  const datoCompleto: Sesion = {
    ...sesion,
    sincronizado: sesion.sincronizado || 'Pendiente'
  };
  
  if (indice >= 0) {
    lista[indice] = datoCompleto;
  } else {
    lista.push(datoCompleto);
  }
  await AsyncStorage.setItem(CLAVES.SESIONES, JSON.stringify(lista));
}
// ==============================================================
// FIN: guardarSesion
// ==============================================================

// ==============================================================
// FUNCIÓN: obtenerTodosLosParticipantes
// Propósito: Devuelve listado completo de participantes generales
// ==============================================================
export async function obtenerTodosLosParticipantes(): Promise<ParticipanteGeneral[]> {
  const datos = await AsyncStorage.getItem(CLAVES.PARTICIPANTES_GENERAL);
  return datos ? JSON.parse(datos) : [];
}
// ==============================================================
// FIN: obtenerTodosLosParticipantes
// ==============================================================

// ==============================================================
// FUNCIÓN: guardarParticipanteGeneral
// Propósito: Crea participante; genera ID si falta, asigna fecha y marca Pendiente
// ==============================================================
export async function guardarParticipanteGeneral(
  participante: Omit<ParticipanteGeneral, 'id' | 'fechaRegistro'> & {
    id?: string;
    fechaRegistro?: string;
    sincronizado?: 'Pendiente' | 'Sincronizado';
  }
): Promise<ParticipanteGeneral> {
  const lista = await obtenerTodosLosParticipantes();
  const nuevoId = participante.id || `part-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Valida que el estado tenga un valor permitido
  const estadoValido = (participante.estado || 'Activo') as 'Activo' | 'Suspendido' | 'Inactivo';

  const nuevo: ParticipanteGeneral = {
    id: nuevoId,
    nombre: participante.nombre,
    estado: estadoValido,
    fechaRegistro: participante.fechaRegistro || new Date().toISOString(),
    sincronizado: participante.sincronizado || 'Pendiente'
  };

  lista.push(nuevo);
  await AsyncStorage.setItem(CLAVES.PARTICIPANTES_GENERAL, JSON.stringify(lista));
  return nuevo;
}
// ==============================================================
// FIN: guardarParticipanteGeneral
// ==============================================================

// ==============================================================
// FUNCIÓN: obtenerParticipantesPorSesion
// Propósito: Filtra y devuelve participantes asignados a una sesión específica
// ==============================================================
export async function obtenerParticipantesPorSesion(numeroSesion: number): Promise<ParticipanteEnSesion[]> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTICIPANTES_SESION);
  const lista: ParticipanteEnSesion[] = todos ? JSON.parse(todos) : [];
  return lista.filter(p => p.numeroSesion === numeroSesion);
}
// ==============================================================
// FIN: obtenerParticipantesPorSesion
// ==============================================================

// ==============================================================
// FUNCIÓN: guardarAsignacionParticipanteSesion
// Propósito: Asigna participante a sesión; inicializa contadores en cero y marca Pendiente
// ==============================================================
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
    sincronizado: asignacion.sincronizado || 'Pendiente'
  };
  lista.push(nueva);
  await AsyncStorage.setItem(CLAVES.PARTICIPANTES_SESION, JSON.stringify(lista));
  return nueva;
}
// ==============================================================
// FIN: guardarAsignacionParticipanteSesion
// ==============================================================

// ==============================================================
// FUNCIÓN: actualizarParticipanteSesion
// Propósito: Modifica campos de asignación sin alterar identificadores
// ==============================================================
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
// FIN: actualizarParticipanteSesion
// ==============================================================

// ==============================================================
// FUNCIÓN: obtenerPartidasPorSesion
// Propósito: Devuelve todas las partidas pertenecientes a una sesión
// ==============================================================
export async function obtenerPartidasPorSesion(numeroSesion: number): Promise<Partida[]> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTIDAS);
  const lista: Partida[] = todos ? JSON.parse(todos) : [];
  return lista.filter(p => p.numeroSesion === numeroSesion);
}
// ==============================================================
// FIN: obtenerPartidasPorSesion
// ==============================================================

// ==============================================================
// FUNCIÓN: guardarPartida
// Propósito: Registra partida nueva; genera identificador y marca como Pendiente
// ==============================================================
export async function guardarPartida(
  partida: Omit<Partida, 'identificador'> & { identificador?: string }
): Promise<Partida> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTIDAS);
  const lista: Partida[] = todos ? JSON.parse(todos) : [];
  const nuevoId = partida.identificador || `partida-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const nuevo: Partida = {
    ...partida,
    identificador: nuevoId,
    sincronizado: partida.sincronizado || 'Pendiente'
  } as Partida;
  lista.push(nuevo);
  await AsyncStorage.setItem(CLAVES.PARTIDAS, JSON.stringify(lista));
  return nuevo;
}
// ==============================================================
// FIN: guardarPartida
// ==============================================================

// ==============================================================
// FUNCIÓN: actualizarPartida
// Propósito: Modifica datos de partida existente por su identificador
// ==============================================================
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
// FIN: actualizarPartida
// ==============================================================

// ==============================================================
// FUNCIÓN: marcarSesionSincronizada
// Propósito: Cambia estado a Sincronizado tras confirmación del servidor
// ==============================================================
export async function marcarSesionSincronizada(numero: number): Promise<void> {
  const lista = await obtenerSesiones();
  const sesion = lista.find(s => s.numero === numero);
  if (sesion) {
    sesion.sincronizado = 'Sincronizado';
    await AsyncStorage.setItem(CLAVES.SESIONES, JSON.stringify(lista));
  }
}
// ==============================================================
// FIN: marcarSesionSincronizada
// ==============================================================

// ==============================================================
// FUNCIÓN: marcarParticipanteSincronizado
// Propósito: Marca participante general como ya sincronizado
// ==============================================================
export async function marcarParticipanteSincronizado(id: string): Promise<void> {
  const lista = await obtenerTodosLosParticipantes();
  const idx = lista.findIndex(p => p.id === id);
  if (idx >= 0) {
    lista[idx].sincronizado = 'Sincronizado';
    await AsyncStorage.setItem(CLAVES.PARTICIPANTES_GENERAL, JSON.stringify(lista));
  }
}
// ==============================================================
// FIN: marcarParticipanteSincronizado
// ==============================================================

// ==============================================================
// FUNCIÓN: marcarParticipanteEnSesionSincronizado
// Propósito: Marca asignación sesión-participante como sincronizada
// ==============================================================
export async function marcarParticipanteEnSesionSincronizado(
  numeroSesion: number,
  participanteId: string
): Promise<void> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTICIPANTES_SESION);
  const lista: ParticipanteEnSesion[] = todos ? JSON.parse(todos) : [];
  const idx = lista.findIndex(p =>
    p.numeroSesion === numeroSesion && p.participanteId === participanteId
  );
  if (idx >= 0) {
    lista[idx].sincronizado = 'Sincronizado';
    await AsyncStorage.setItem(CLAVES.PARTICIPANTES_SESION, JSON.stringify(lista));
  }
}
// ==============================================================
// FIN: marcarParticipanteEnSesionSincronizado
// ==============================================================

// ==============================================================
// FUNCIÓN: marcarPartidaSincronizada
// Propósito: Actualiza estado de partida tras envío exitoso
// ==============================================================
export async function marcarPartidaSincronizada(identificador: string): Promise<void> {
  const todos = await AsyncStorage.getItem(CLAVES.PARTIDAS);
  const lista: Partida[] = todos ? JSON.parse(todos) : [];
  const idx = lista.findIndex(p => p.identificador === identificador);
  if (idx >= 0) {
    lista[idx].sincronizado = 'Sincronizado';
    await AsyncStorage.setItem(CLAVES.PARTIDAS, JSON.stringify(lista));
  }
}
// ==============================================================
// FIN: marcarPartidaSincronizada
// ==============================================================

// ==============================================================
// FUNCIÓN: inicializarBaseDatos
// Propósito: Verifica disponibilidad de almacenamiento al arrancar la app
// ==============================================================
export async function inicializarBaseDatos(): Promise<{ mensaje: string }> {
  try {
    await obtenerSesiones();
    await obtenerTodosLosParticipantes();
    return { mensaje: 'Base de datos local inicializada' };
  } catch (error) {
    console.log('Error en inicialización:', error);
    return { mensaje: 'Base de datos lista' };
  }
}
// ==============================================================
// FIN: inicializarBaseDatos
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
// Propósito: Inserta nuevo resultado en historial individual del participante
// ==============================================================
export const agregarHistorialParticipante = async (
  participanteId: string,
  registro: RegistroHistorial
): Promise<void> => {
  const clave = `historial:${participanteId}`;
  const existente = await AsyncStorage.getItem(clave);
  const historial = existente ? JSON.parse(existente) : [];
  historial.unshift(registro);
  await AsyncStorage.setItem(clave, JSON.stringify(historial));
};
// ==============================================================
// FIN: agregarHistorialParticipante
// ==============================================================

// ==============================================================
// TIPO: EstadisticaParticipanteSesion
// Propósito: Resumen de estadísticas para cálculo de saldo
// ==============================================================
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
// FUNCIÓN: obtenerEstadisticasPorSesion
// Propósito: Calcula saldo = ganado - perdido para cada participante de la sesión
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
// FIN: obtenerEstadisticasPorSesion
// ==============================================================

// ==============================================================
// FUNCIÓN: guardarRegistroSincronizacion
// Propósito: Agrega entrada nueva al historial del proceso de sincronización
// ==============================================================
export async function guardarRegistroSincronizacion(
  registro: Omit<HistorialSincronizacion, 'id'>
): Promise<HistorialSincronizacion> {
  const historial = await obtenerHistorialSincronizacion();
  const nuevo: HistorialSincronizacion = {
    ...registro,
    id: Date.now().toString(),
  };
  historial.unshift(nuevo);
  await AsyncStorage.setItem(
    HISTORIAL_SINCRONIZACION_KEY,
    JSON.stringify(historial)
  );
  return nuevo;
}
// ==============================================================
// FIN: guardarRegistroSincronizacion
// ==============================================================

// ==============================================================
// FUNCIÓN: actualizarRegistroSincronizacion
// Propósito: Modifica estado o mensaje de un registro del historial
// ==============================================================
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
// ==============================================================
// FIN: actualizarRegistroSincronizacion
// ==============================================================

// ==============================================================
// FUNCIÓN: obtenerHistorialSincronizacion
// Propósito: Devuelve todo el historial de procesos de sincronización
// ==============================================================
export async function obtenerHistorialSincronizacion(): Promise<HistorialSincronizacion[]> {
  const guardado = await AsyncStorage.getItem(HISTORIAL_SINCRONIZACION_KEY);
  return guardado ? JSON.parse(guardado) : [];
}
// ==============================================================
// FIN: obtenerHistorialSincronizacion
// ==============================================================

// ==============================================================
// FUNCIÓN: limpiarHistorialSincronizacion
// Propósito: Elimina entradas con antigüedad superior al límite indicado
// ==============================================================
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
// ==============================================================
// FIN: limpiarHistorialSincronizacion
// ==============================================================