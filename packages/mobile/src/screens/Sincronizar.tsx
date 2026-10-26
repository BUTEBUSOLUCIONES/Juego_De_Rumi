// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\Sincronizar.tsx
// Pantalla de sincronización manual con el servidor.
// Muestra el estado de la conexión, permite probar la URL y ejecuta el proceso por lotes.

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // <-- Hook seguro de navegación
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  construirUrlServidor,
  obtenerConfiguracion,
} from '../servicios/ConfiguracionServidor';

import { ResultadoSincronizacion, sincronizarTodo } from '../servicios/Sincronizacion';

// ==============================================================
// COMPONENTE: PantallaSincronizar
// INICIO
// ==============================================================
export default function PantallaSincronizar() {
  // Usamos el hook oficial de React Navigation (evita errores de props undefined)
  const navigation = useNavigation<any>();
  
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [resultado, setResultado] = useState<ResultadoSincronizacion | null>(null);

  // ==============================================================
  // FUNCIÓN: iniciarSincronizacion
  // INICIO
  // ==============================================================
  const iniciarSincronizacion = async () => {
    setSincronizando(true);
    setMensaje('Verificando conexión e iniciando sincronización...');
    setResultado(null);

    try {
      const res = await sincronizarTodo();
      
      setResultado(res);
      setMensaje(res.mensaje);

      if (res.exito) {
        Alert.alert('✅ Éxito', res.mensaje, [
          { text: 'Aceptar', onPress: () => navigation.goBack() }, // <-- Corregido
        ]);
      } else {
        const erroresTexto = res.errores.length > 0 ? '\n\n' + res.errores.join('\n') : '';
        Alert.alert(
          '⚠️ Sincronización con observaciones',
          res.mensaje + erroresTexto,
          [{ text: 'Entendido' }]
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setMensaje('Error inesperado: ' + errorMsg);
      Alert.alert('❌ Error', errorMsg, [{ text: 'Aceptar' }]);
    } finally {
      setSincronizando(false);
    }
  };
  // ==============================================================
  // FIN: iniciarSincronizacion
  // ==============================================================

  // ==============================================================
  // FUNCIÓN: probarUrl
  // INICIO
  // ==============================================================
  const probarUrl = async () => {
    try {
      const url = await construirUrlServidor();
      const config = await obtenerConfiguracion();
      Alert.alert(
        '🔗 URL del Servidor',
        `IP: ${config.ip}\nPuerto: ${config.puerto}\nCarpeta: ${config.carpeta || '(ninguna)'}\n\n→ ${url}`,
        [{ text: 'Cerrar' }]
      );
    } catch (error) {
      Alert.alert('❌ Error', String(error), [{ text: 'Aceptar' }]);
    }
  };
  // ==============================================================
  // FIN: probarUrl
  // ==============================================================

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabecera}>
        <TouchableOpacity style={estilos.botonVolver} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Sincronización con Servidor</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.tarjeta}>
          <Text style={estilos.etiqueta}>Estado del servidor:</Text>
          <View style={estilos.filaEstado}>
            {resultado === null ? (
              <Text style={estilos.textoInfo}>Sin verificar</Text>
            ) : resultado.servidorActivo ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={estilos.textoOk}> Disponible</Text>
              </>
            ) : (
              <>
                <Ionicons name="alert-circle" size={20} color="#F44336" />
                <Text style={estilos.textoError}> No responde</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={estilos.botonSecundario} onPress={probarUrl}>
            <Ionicons name="link" size={18} color="#4A90D9" />
            <Text style={estilos.textoBotonSecundario}> Ver URL generada</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[estilos.botonPrincipal, sincronizando && estilos.botonDesactivado]}
          onPress={iniciarSincronizacion}
          disabled={sincronizando}
        >
          {sincronizando ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={estilos.textoBoton}> Sincronizando...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={estilos.textoBoton}> Iniciar Sincronización</Text>
            </>
          )}
        </TouchableOpacity>

        {mensaje ? (
          <View style={estilos.tarjetaMensaje}>
            <Text style={estilos.textoMensaje}>{mensaje}</Text>
          </View>
        ) : null}

        {resultado && resultado.resumen && (
          <View style={estilos.tarjeta}>
            <Text style={estilos.subtitulo}>Resumen del proceso:</Text>
            <View style={estilos.filaResumen}>
              <Text style={estilos.nombreTabla}>Total procesado:</Text>
              <Text style={estilos.datosResumen}>{resultado.resumen.total}</Text>
            </View>
            <View style={estilos.filaResumen}>
              <Text style={estilos.nombreTabla}>Nuevos:</Text>
              <Text style={estilos.datosResumen}>{resultado.resumen.nuevos}</Text>
            </View>
            <View style={estilos.filaResumen}>
              <Text style={estilos.nombreTabla}>Actualizados:</Text>
              <Text style={estilos.datosResumen}>{resultado.resumen.actualizados}</Text>
            </View>
            <View style={estilos.filaResumen}>
              <Text style={estilos.nombreTabla}>Errores:</Text>
              <Text style={[estilos.datosResumen, resultado.resumen.errores > 0 && { color: '#F44336' }]}>
                {resultado.resumen.errores}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={estilos.botonVolverMenu}
          onPress={() => navigation.navigate('Inicio')} // <-- Corregido
        >
          <Ionicons name="home" size={18} color="#fff" />
          <Text style={estilos.textoBoton}> Volver al Menú Principal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
// ==============================================================
// FIN: PantallaSincronizar
// ==============================================================

// ==============================================================
// ESTILOS
// INICIO
// ==============================================================
const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#0A1629' },
  cabecera: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#0F213D' },
  botonVolver: { padding: 8, marginRight: 8 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  contenido: { padding: 20 },
  tarjeta: { backgroundColor: '#132744', borderRadius: 12, padding: 18, marginBottom: 20 },
  etiqueta: { fontSize: 15, color: '#B0C4DE', marginBottom: 8 },
  filaEstado: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  textoInfo: { color: '#8899AA', fontSize: 15 },
  textoOk: { color: '#4CAF50', fontSize: 15, fontWeight: '600' },
  textoError: { color: '#F44336', fontSize: 15, fontWeight: '600' },
  botonSecundario: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A3358', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginTop: 8 },
  textoBotonSecundario: { color: '#4A90D9', fontSize: 14 },
  botonPrincipal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 14, marginBottom: 20 },
  botonDesactivado: { backgroundColor: '#265A29', opacity: 0.7 },
  textoBoton: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  tarjetaMensaje: { backgroundColor: '#1A3358', borderRadius: 10, padding: 16, marginBottom: 20 },
  textoMensaje: { color: '#E0E6ED', fontSize: 15, textAlign: 'center' },
  subtitulo: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  filaResumen: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1E3A5F' },
  nombreTabla: { color: '#B0C4DE', fontSize: 14 },
  datosResumen: { color: '#90EE90', fontSize: 14, fontWeight: '600' },
  botonVolverMenu: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4A90D9', borderRadius: 10, paddingVertical: 12, marginTop: 10 },
});
// ==============================================================
// FIN: ESTILOS
// ==============================================================
//0902028003000