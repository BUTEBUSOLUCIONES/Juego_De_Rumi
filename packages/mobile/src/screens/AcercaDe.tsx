// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\AcercaDe.tsx
// Pantalla de información general de la aplicación, créditos y opción de retorno
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AcercaDe({ navigation }: { navigation?: any }) {
  const retornarAlMenu = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    } else if (navigation && navigation.navigate) {
      // Ajusta 'MenuPrincipal' al nombre exacto de tu ruta principal si es necesario
      navigation.navigate('MenuPrincipal');
    }
  };

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.tituloApp}>Juego de Rumi</Text>
        <Text style={estilos.subtituloApp}>Gestor de Partidas y Sincronización</Text>

        <View style={estilos.divisor} />

        <View style={estilos.filaInfo}>
          <Text style={estilos.etiqueta}>Autor:</Text>
          <Text style={estilos.valor}>Butebusoluciones</Text>
        </View>

        <View style={estilos.filaInfo}>
          <Text style={estilos.etiqueta}>Versión:</Text>
          <Text style={estilos.valor}>1.22</Text>
        </View>

        <View style={estilos.filaInfoVertical}>
          <Text style={estilos.etiqueta}>Última actualización:</Text>
          <Text style={estilos.valorFecha}>
            Miércoles 12 de Octubre del 2026 10h23
          </Text>
        </View>

        <View style={estilos.divisor} />

        <TouchableOpacity style={estilos.botonRetornar} onPress={retornarAlMenu}>
          <Text style={estilos.textoBotonRetornar}>⬅️ Retornar al Menú</Text>
        </TouchableOpacity>

        <Text style={estilos.piePagina}>
          © 2026 Butebusoluciones. Todos los derechos reservados.
        </Text>
      </View>
    </ScrollView>
  );
}

// ==============================================================
// ESTILOS
// ==============================================================
const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#0A1629',
  },
  contenido: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  tarjeta: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tituloApp: {
    fontSize: 26,
    fontWeight: '800',
    color: '#22C55E',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtituloApp: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  divisor: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  filaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filaInfoVertical: {
    marginBottom: 12,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  valor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  valorFecha: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  botonRetornar: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  textoBotonRetornar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  piePagina: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});