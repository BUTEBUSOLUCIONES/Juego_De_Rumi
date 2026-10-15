// D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\packages\mobile\src\screens\PantallaInicio.tsx
// Pantalla de Inicio: presenta menú principal con tarjetas en rejilla
// Orden de acceso: Participantes → Sesiones → Sesión Activa → Consultar → Estadísticas → Historial

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Definición de rutas disponibles desde esta pantalla
type RutasNavegacion = {
  Inicio: undefined;
  Participantes: undefined;
  GestionSesiones: undefined;
  SesionActiva: undefined;
  ConsultarSesiones: undefined;
  Estadisticas: undefined;
  Historial: undefined;
};

// ==============================================================
// FUNCIÓN: PantallaInicio
// INICIO — Línea: 20
// Propósito: Renderiza el menú principal con tarjetas navegables
// Orden visual: Participantes, Sesiones, Sesión Activa, Consultar Sesiones, Estadísticas, Historial
// Cada tarjeta incluye ícono, título y descripción breve
// ==============================================================
const PantallaInicio = () => {
  const navegacion = useNavigation<NavigationProp<RutasNavegacion>>();

  // Lista de opciones del menú — orden definido por el usuario
  const opcionesMenu = [
    {
      id: 'Participantes',
      titulo: 'Participantes',
      subtitulo: 'Registro de participantes',
      icono: 'people' as const
    },
    {
      id: 'GestionSesiones',
      titulo: 'Sesiones',
      subtitulo: 'Control de sesiones',
      icono: 'calendar' as const
    },
    {
      id: 'SesionActiva',
      titulo: 'Sesión Activa',
      subtitulo: 'Iniciar o gestionar partida',
      icono: 'time' as const
    },
    {
      id: 'ConsultarSesiones',
      titulo: 'Consultar Sesiones',
      subtitulo: 'Resultados de sesiones cerradas',
      icono: 'list-circle' as const
    },
    {
      id: 'Estadisticas',
      titulo: 'Estadísticas',
      subtitulo: 'Consulta de estadísticas',
      icono: 'bar-chart' as const
    },
    {
      id: 'Historial',
      titulo: 'Historial',
      subtitulo: 'Historial de sesiones',
      icono: 'document-text' as const
    },
  ];

  return (
    <View style={estilos.pantallaCompleta}>
      <View style={estilos.contenedor}>
        <Text style={estilos.tituloPrincipal}>Partidas de Rumi</Text>
        <Text style={estilos.subtituloGeneral}>Sistema de Registro y Control</Text>
        {/* Rejilla de tarjetas — navegación al presionar cada opción */}
        <View style={estilos.rejillaTarjetas}>
          {opcionesMenu.map((opcion) => (
            <TouchableOpacity
              key={opcion.id}
              style={estilos.tarjetaMenu}
              onPress={() => navegacion.navigate(opcion.id as never)}
            >
              <View style={estilos.franjaSuperior}>
                <Ionicons
                  name={opcion.icono}
                  size={18}
                  color="#FFFFFF"
                  style={estilos.iconoTarjeta}
                />
                <Text style={estilos.tituloTarjeta}>{opcion.titulo}</Text>
              </View>
              <Text style={estilos.subtituloTarjeta}>{opcion.subtitulo}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};
// ==============================================================
// FIN: PantallaInicio
// ==============================================================

// Estilos de la pantalla — colores y dimensiones consistentes con el diseño
const estilos = StyleSheet.create({
  pantallaCompleta: {
    flex: 1,
    backgroundColor: '#0A1629',
  },
  contenedor: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  tituloPrincipal: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtituloGeneral: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 36,
  },
  rejillaTarjetas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tarjetaMenu: {
    width: '48%',
    backgroundColor: 'rgba(30, 64, 175, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  franjaSuperior: {
    backgroundColor: 'rgba(30, 64, 175, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconoTarjeta: {
    marginRight: 8,
  },
  tituloTarjeta: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtituloTarjeta: {
    fontSize: 13,
    color: '#CBD5E1',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
  },
});

export default PantallaInicio;