import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Sesion, ResultadoPartida } from '@partidas/shared-core';

const CLAVES = {
  SESION_ACTUAL: 'sesion_actual',
  HISTORIAL_PARTIDAS: 'historial_partidas',
} as const;

const obtenerHistorialPartidas = async (): Promise<ResultadoPartida[]> => {
  const datos = await AsyncStorage.getItem(CLAVES.HISTORIAL_PARTIDAS);
  return datos ? JSON.parse(datos) : [];
};

export const almacenLocal = {
  async guardarSesionActual(sesion: Sesion): Promise<void> {
    await AsyncStorage.setItem(CLAVES.SESION_ACTUAL, JSON.stringify(sesion));
  },

  async obtenerSesionActual(): Promise<Sesion | null> {
    const datos = await AsyncStorage.getItem(CLAVES.SESION_ACTUAL);
    return datos ? JSON.parse(datos) : null;
  },

  async guardarPartida(partida: ResultadoPartida): Promise<void> {
    const historial = await obtenerHistorialPartidas();
    historial.push(partida);
    await AsyncStorage.setItem(CLAVES.HISTORIAL_PARTIDAS, JSON.stringify(historial));
  },

  async obtenerHistorialPartidas(): Promise<ResultadoPartida[]> {
    return obtenerHistorialPartidas();
  },
};