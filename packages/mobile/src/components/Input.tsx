import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { tema } from '../theme';

interface InputPropiedades extends TextInputProps {
  etiqueta?: string;
  anchoCompleto?: boolean;
}

const Input: React.FC<InputPropiedades> = ({
  etiqueta,
  anchoCompleto = false,
  style,
  ...resto
}) => {
  return (
    <View style={estilos.contenedor}>
      {etiqueta && <Text style={estilos.etiqueta}>{etiqueta}</Text>}
      <TextInput
        style={[
          estilos.campo,
          anchoCompleto && estilos.anchoCompleto,
          style
        ]}
        placeholderTextColor={tema.colores.textoSecundario}
        {...resto}
      />
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: {
    marginBottom: tema.espaciado.md,
  },
  etiqueta: {
    fontSize: tema.tipografia.tamano.normal,
    color: tema.colores.texto,
    marginBottom: tema.espaciado.sm,
    fontWeight: '500',
  },
  campo: {
    width: tema.dimensiones.anchoCampo,
    height: 44,
    borderWidth: tema.bordes.grosor,
    borderColor: tema.colores.borde,
    borderRadius: tema.bordes.radio,
    paddingHorizontal: tema.espaciado.md,
    fontSize: tema.tipografia.tamano.normal,
    color: tema.colores.texto,
    backgroundColor: tema.colores.superficie,
  },
  anchoCompleto: {
    width: '100%',
  },
});

export default Input;