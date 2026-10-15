import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { tema } from '../theme';

type RootNavegacion = {
  Inicio: undefined;
  Participantes: undefined;
  Partida: { sesionId: string };
  Historial: undefined;
  Estadisticas: undefined;
};

const Encabezado = () => {
  const navigation = useNavigation<NavigationProp<RootNavegacion>>();

  const confirmarSalida = () => {
    Alert.alert(
      'Salir de la aplicación',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Inicio' }],
          }),
        },
      ]
    );
  };

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Partidas de Rumi</Text>
      <TouchableOpacity
        onPress={confirmarSalida}
        style={estilos.botonSalir}
        activeOpacity={0.75}
      >
        <Text style={estilos.textoSalir}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tema.espaciado.md,
    paddingVertical: tema.espaciado.md,
    backgroundColor: tema.colores.superficie,
    borderBottomWidth: tema.bordes.grosor,
    borderBottomColor: tema.colores.borde,
  },
  titulo: {
    fontSize: tema.tipografia.tamano.grande,
    fontWeight: '700',
    color: tema.colores.primario,
  },
  botonSalir: {
    paddingHorizontal: tema.espaciado.md,
    paddingVertical: tema.espaciado.sm,
    borderRadius: tema.bordes.radio,
    backgroundColor: `${tema.colores.peligro}10`,
  },
  textoSalir: {
    fontSize: tema.tipografia.tamano.normal,
    fontWeight: '600',
    color: tema.colores.peligro,
  },
});

export default Encabezado;