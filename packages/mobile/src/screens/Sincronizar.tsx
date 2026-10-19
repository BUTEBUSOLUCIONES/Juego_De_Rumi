// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\Sincronizar.tsx
// Fecha última modificación: 17/10/2026

import { Ionicons } from '@expo/vector-icons';
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

// ✅ Importación correcta desde el servicio
import {
  obtenerConfiguracion,
  guardarConfiguracion,
  construirUrlServidor,
  CLAVE_GLOBAL,
} from '../servicios/ConfiguracionServidor';

// ✅ Importamos la función de sincronización
import { sincronizarTodo, ResultadoSincronizacion } from '../servicios/Sincronizacion';

export default function PantallaSincronizar({ navegacion }: any) {
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [detalles, setDetalles] = useState<ResultadoSincronizacion['detalles'] | null>(null);
  const [servidorOk, setServidorOk] = useState<boolean | null>(null);

  const iniciarSincronizacion = async () => {
    setSincronizando(true);
    setMensaje('Verificando conexión con el servidor...');
    setDetalles(null);
    setServidorOk(null);

    try {
      // PASO 1: Verificar disponibilidad PRIMERO
      const { verificarServidor } = require('../servicios/Sincronizacion');
      const servidorDisponible = await verificarServidor();
      
      setServidorOk(servidorDisponible);
      
      // 🛑 DETENERSE AQUÍ si no está disponible
      if (!servidorDisponible) {
        setMensaje('❌ El servidor no está disponible. Verifica la IP, puerto o la red.');
        Alert.alert(
          'Servidor inaccesible',
          'No se puede conectar al servidor.\n\nComprueba que:\n- La IP es correcta\n- El equipo está encendido\n- Estás en la misma red Wi-Fi',
          [{ text: 'Entendido' }]
        );
        setSincronizando(false);
        return; // ⛔ NO continúa
      }

      // ✅ Solo si está disponible → proceder
      setMensaje('Servidor conectado ✅ Iniciando sincronización...');
      
      const resultado = await sincronizarTodo();

      setDetalles(resultado.detalles);
      setMensaje(resultado.mensaje);

      if (resultado.exito) {
        Alert.alert('✅ Éxito', resultado.mensaje, [
          { text: 'Aceptar', onPress: () => navegacion.goBack() },
        ]);
      } else {
        Alert.alert(
          '⚠️ Sincronización con observaciones',
          resultado.mensaje + '\n\n' + resultado.errores.join('\n'),
          [{ text: 'Entendido' }]
        );
      }
    } catch (error) {
      setMensaje('Error inesperado: ' + String(error));
      Alert.alert('❌ Error', String(error), [{ text: 'Aceptar' }]);
    } finally {
      setSincronizando(false);
    }
  };

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

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabecera}>
        <TouchableOpacity style={estilos.botonVolver} onPress={() => navegacion.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Sincronización con Servidor</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.tarjeta}>
          <Text style={estilos.etiqueta}>Estado del servidor:</Text>
          <View style={estilos.filaEstado}>
            {servidorOk === null ? (
              <Text style={estilos.textoInfo}>Sin verificar</Text>
            ) : servidorOk ? (
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

        {detalles && (
          <View style={estilos.tarjeta}>
            <Text style={estilos.subtitulo}>Resumen del proceso:</Text>
            {Object.entries(detalles).map(([nombre, res]) => (
              <View key={nombre} style={estilos.filaResumen}>
                <Text style={estilos.nombreTabla}>
                  {nombre.charAt(0).toUpperCase() + nombre.slice(1).replace(/[A-Z]/g, ' $&')}:
                </Text>
                <Text style={estilos.datosResumen}>
                  {res.nuevos} nuevos | {res.actualizados} act. | {res.noEnviados} fallidos
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={estilos.botonVolverMenu}
          onPress={() => navegacion.navigate('MenuPrincipal')}
        >
          <Ionicons name="home" size={18} color="#fff" />
          <Text style={estilos.textoBoton}> Volver al Menú Principal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#0A1629',
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0F213D',
  },
  botonVolver: {
    padding: 8,
    marginRight: 8,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  contenido: {
    padding: 20,
  },
  tarjeta: {
    backgroundColor: '#132744',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  etiqueta: {
    fontSize: 15,
    color: '#B0C4DE',
    marginBottom: 8,
  },
  filaEstado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  textoInfo: {
    color: '#8899AA',
    fontSize: 15,
  },
  textoOk: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: '600',
  },
  textoError: {
    color: '#F44336',
    fontSize: 15,
    fontWeight: '600',
  },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A3358',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  textoBotonSecundario: {
    color: '#4A90D9',
    fontSize: 14,
  },
  botonPrincipal: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 20,
  },
  botonDesactivado: {
    backgroundColor: '#265A29',
    opacity: 0.7,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tarjetaMensaje: {
    backgroundColor: '#1A3358',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  textoMensaje: {
    color: '#E0E6ED',
    fontSize: 15,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A5F',
  },
  nombreTabla: {
    color: '#B0C4DE',
    fontSize: 13,
  },
  datosResumen: {
    color: '#90EE90',
    fontSize: 13,
  },
  botonVolverMenu: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
  },
});