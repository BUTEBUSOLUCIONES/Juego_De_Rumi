import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Encabezado from '../components/Encabezado';
import { tema } from '../theme';

interface PlantillaPantallaProps {
  children: React.ReactNode;
  sinEncabezado?: boolean;
}

const PlantillaPantalla: React.FC<PlantillaPantallaProps> = ({
  children,
  sinEncabezado = false,
}) => {
  return (
    <SafeAreaView style={estilos.superficie}>
      {!sinEncabezado && <Encabezado />}
      <ScrollView contentContainerStyle={estilos.contenido}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const estilos = StyleSheet.create({
  superficie: {
    flex: 1,
    backgroundColor: tema.colores.fondo,
  },
  contenido: {
    padding: tema.espaciado.md,
    flexGrow: 1,
  },
});

export default PlantillaPantalla;