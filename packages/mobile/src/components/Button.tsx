import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { tema } from '../theme';

type TipoBoton = 'primario' | 'secundario' | 'peligro' | 'exito';

interface ButtonPropiedades {
  titulo: string;
  onPress: () => void;
  tipo?: TipoBoton;
  deshabilitado?: boolean;
  anchoCompleto?: boolean;
  estilo?: ViewStyle;
  estiloTexto?: TextStyle;
}

const Button: React.FC<ButtonPropiedades> = ({
  titulo,
  onPress,
  tipo = 'primario',
  deshabilitado = false,
  anchoCompleto = false,
  estilo,
  estiloTexto,
}) => {
  const colorFondo = {
    primario: tema.colores.primario,
    secundario: tema.colores.textoSecundario,
    peligro: tema.colores.peligro,
    exito: tema.colores.secundario,
  };

  return (
    <TouchableOpacity
      style={[
        estilos.base,
        { backgroundColor: colorFondo[tipo] },
        anchoCompleto && estilos.anchoCompleto,
        deshabilitado && estilos.deshabilitado,
        estilo,
      ]}
      onPress={onPress}
      disabled={deshabilitado}
      activeOpacity={0.75}
    >
      <Text
        style={[
          estilos.texto,
          deshabilitado && estilos.textoDeshabilitado,
          estiloTexto,
        ]}
      >
        {titulo}
      </Text>
    </TouchableOpacity>
  );
};

const estilos = StyleSheet.create({
  base: {
    minWidth: tema.dimensiones.anchoBotonMinimo,
    height: tema.dimensiones.altoBoton,
    borderRadius: tema.bordes.radio,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tema.espaciado.lg,
  },
  anchoCompleto: {
    width: '100%',
  },
  deshabilitado: {
    opacity: 0.45,
  },
  texto: {
    color: '#FFFFFF',
    fontSize: tema.tipografia.tamano.normal,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textoDeshabilitado: {
    opacity: 0.8,
  },
});

export default Button;