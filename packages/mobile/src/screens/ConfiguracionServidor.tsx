// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\ConfiguracionServidor.tsx
// Historial de cambios:
// | Fecha       | Versión | Descripción del cambio |
// |-------------|---------|------------------------|
// | 17/10/2026  | 1.0.0   | Versión inicial de la pantalla de configuración. |
// | 22/10/2026  | 1.1.0   | Agregado Switch para sincronización automática y Modal tipo combo. |
// | 22/10/2026  | 1.1.2   | Corrección crítica: Uso de useNavigation() para evitar error "goBack of undefined". |

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // ✅ Hook de navegación infalible
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  CLAVE_GLOBAL,
  construirUrlServidor,
  guardarConfiguracion,
  obtenerConfiguracion,
  restablecerConfiguracion,
  type ConfiguracionServidor,
} from '../servicios/ConfiguracionServidor';

// ==============================================================
// CONSTANTES
// ==============================================================
const OPCIONES_INTERVALO_MINUTOS = [10, 20, 30, 60, 120, 240, 360, 480, 600];

// ==============================================================
// COMPONENTE PRINCIPAL
// ==============================================================
// ✅ Se elimina la prop 'navegacion' y se usa el hook interno
export default function PantallaConfiguracionServidor() {
  const navegacion = useNavigation<any>(); // ✅ Esto garantiza que navegacion NUNCA sea undefined

  const [claveIngresada, setClaveIngresada] = useState('');
  const [accesoConcedido, setAccesoConcedido] = useState(false);

  const [ip, setIp] = useState('');
  const [puerto, setPuerto] = useState('');
  const [carpeta, setCarpeta] = useState('');
  
  const [sincronizacionAuto, setSincronizacionAuto] = useState(false);
  const [intervaloSincro, setIntervaloSincro] = useState(60);
  const [modalIntervaloVisible, setModalIntervaloVisible] = useState(false);

  // ==============================================================
  // FUNCIÓN: cargarConfiguracion
  // ==============================================================
  const cargarConfiguracion = async () => {
    const config = await obtenerConfiguracion();
    setIp(config.ip);
    setPuerto(config.puerto);
    setCarpeta(config.carpeta);
    setSincronizacionAuto(config.sincronizacionAutomatica);
    setIntervaloSincro(config.intervaloSincronizacion);
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  // ==============================================================
  // FUNCIÓN: validarClave
  // ==============================================================
  const validarClave = () => {
    if (claveIngresada === CLAVE_GLOBAL) {
      setAccesoConcedido(true);
      cargarConfiguracion();
    } else {
      Alert.alert('🔒 Acceso denegado', 'La clave ingresada no es correcta', [
        { text: 'Reintentar' },
      ]);
    }
  };

  // ==============================================================
  // FUNCIÓN: guardarCambios
  // ==============================================================
  const guardarCambios = async () => {
    if (!ip.trim()) {
      Alert.alert('⚠️ Falta dato', 'Ingresa la dirección IP del servidor', [{ text: 'Entendido' }]);
      return;
    }
    if (!puerto.trim()) {
      Alert.alert('⚠️ Falta dato', 'Ingresa el puerto de conexión', [{ text: 'Entendido' }]);
      return;
    }

    const nuevaConfig: ConfiguracionServidor = {
      ip: ip.trim(),
      puerto: puerto.trim(),
      carpeta: carpeta.trim(),
      sincronizacionAutomatica: sincronizacionAuto,
      intervaloSincronizacion: intervaloSincro,
    };

    try {
      await guardarConfiguracion(nuevaConfig);
      const urlGenerada = await construirUrlServidor();

      Alert.alert(
        '✅ Configuración guardada',
        `IP: ${nuevaConfig.ip}\nPuerto: ${nuevaConfig.puerto}\nCarpeta: ${nuevaConfig.carpeta || '(ninguna)'}\nAuto-Sync: ${nuevaConfig.sincronizacionAutomatica ? 'SÍ' : 'NO'}\nIntervalo: ${nuevaConfig.sincronizacionAutomatica ? `${nuevaConfig.intervaloSincronizacion} min` : 'N/A'}\n\n→ ${urlGenerada}`,
        [
          {
            text: 'Aceptar',
            onPress: () => {
              if (navegacion.canGoBack()) {
                navegacion.goBack();
              } else {
                navegacion.navigate('Inicio'); // Fallback por seguridad
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo guardar la configuración', [{ text: 'Aceptar' }]);
    }
  };

  // ==============================================================
  // FUNCIÓN: restablecer
  // ==============================================================
  const restablecer = async () => {
    Alert.alert(
      '⚠️ Restablecer',
      '¿Volver a los valores originales de configuración?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            await restablecerConfiguracion();
            await cargarConfiguracion();
            Alert.alert('✅ Restablecido', 'Se restauraron los valores por defecto', [{ text: 'Aceptar' }]);
          },
        },
      ]
    );
  };

  // ==============================================================
  // RENDERIZADO: Pantalla de Clave de Acceso
  // ==============================================================
  if (!accesoConcedido) {
    return (
      <View style={estilos.contenedorClave}>
        <Ionicons name="lock-closed" size={60} color="#4A90D9" />
        <Text style={estilos.tituloClave}>Acceso Restringido</Text>
        <Text style={estilos.descripcionClave}>
          Ingresa la clave de administración para configurar el servidor
        </Text>
        <TextInput
          style={estilos.inputClave}
          placeholder="Escribe la clave..."
          placeholderTextColor="#667788"
          secureTextEntry
          value={claveIngresada}
          onChangeText={setClaveIngresada}
          autoCapitalize="none"
        />
        <TouchableOpacity style={estilos.botonClave} onPress={validarClave}>
          <Text style={estilos.textoBotonClave}>Verificar Acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==============================================================
  // RENDERIZADO: Formulario de Configuración
  // ==============================================================
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={estilos.contenedor}>
        <View style={estilos.cabecera}>
          <TouchableOpacity style={estilos.botonVolver} onPress={() => navegacion.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={estilos.titulo}>Configuración del Servidor</Text>
        </View>

        <ScrollView contentContainerStyle={estilos.contenido}>
          <View style={estilos.grupoCampo}>
            <Text style={estilos.etiqueta}>Dirección IP del Servidor</Text>
            <TextInput style={estilos.input} placeholder="Ej: 192.168.1.53" placeholderTextColor="#556677" value={ip} onChangeText={setIp} keyboardType="numeric" autoCapitalize="none" />
          </View>

          <View style={estilos.grupoCampo}>
            <Text style={estilos.etiqueta}>Puerto</Text>
            <TextInput style={estilos.input} placeholder="Ej: 8000" placeholderTextColor="#556677" value={puerto} onChangeText={setPuerto} keyboardType="numeric" autoCapitalize="none" />
          </View>

          <View style={estilos.grupoCampo}>
            <Text style={estilos.etiqueta}>Carpeta / Ruta (opcional)</Text>
            <TextInput style={estilos.input} placeholder="Ej: /rumi/api/sincronizar" placeholderTextColor="#556677" value={carpeta} onChangeText={setCarpeta} autoCapitalize="none" />
          </View>

          <View style={estilos.grupoCampo}>
            <Text style={estilos.etiqueta}>¿Desea sincronizar automáticamente?</Text>
            <View style={estilos.filaSwitch}>
              <Text style={[estilos.textoSwitch, sincronizacionAuto ? estilos.textoActivo : estilos.textoInactivo]}>
                {sincronizacionAuto ? 'SÍ' : 'NO'}
              </Text>
              <Switch
                value={sincronizacionAuto}
                onValueChange={setSincronizacionAuto}
                trackColor={{ false: '#1E3A5F', true: '#2E7D32' }}
                thumbColor={sincronizacionAuto ? '#4ADE80' : '#94A3B8'}
              />
            </View>
          </View>

          <View style={estilos.grupoCampo}>
            <Text style={[estilos.etiqueta, !sincronizacionAuto && estilos.etiquetaDeshabilitada]}>
              Intervalo de Sincronización (minutos)
            </Text>
            <TouchableOpacity 
              style={[estilos.input, estilos.inputCombo, !sincronizacionAuto && estilos.inputDeshabilitado]} 
              onPress={() => setModalIntervaloVisible(true)}
              disabled={!sincronizacionAuto}
            >
              <Text style={[estilos.textoInput, !sincronizacionAuto && estilos.textoDeshabilitado]}>
                {sincronizacionAuto ? `${intervaloSincro} minutos` : 'Desactivado'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={!sincronizacionAuto ? '#556677' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={estilos.botonGuardar} onPress={guardarCambios}>
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={estilos.textoBotonGuardar}>Guardar Cambios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.botonVolverMenu} onPress={() => navegacion.goBack()}>
            <Ionicons name="arrow-undo" size={18} color="#4A90D9" />
            <Text style={estilos.textoBotonSecundario}>Retornar al Menú Principal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={estilos.botonRestablecer} onPress={restablecer}>
            <Ionicons name="refresh" size={18} color="#FF6B6B" />
            <Text style={estilos.textoBotonRestablecer}>Restablecer por Defecto</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal visible={modalIntervaloVisible} transparent animationType="fade" onRequestClose={() => setModalIntervaloVisible(false)}>
        <View style={estilos.fondoModal}>
          <View style={estilos.contenidoModal}>
            <Text style={estilos.tituloModal}>Seleccionar Intervalo (minutos)</Text>
            <ScrollView style={estilos.listaOpciones}>
              {OPCIONES_INTERVALO_MINUTOS.map((minutos) => (
                <TouchableOpacity
                  key={minutos}
                  style={[estilos.filaOpcion, intervaloSincro === minutos && estilos.filaSeleccionada]}
                  onPress={() => {
                    setIntervaloSincro(minutos);
                    setModalIntervaloVisible(false);
                  }}
                >
                  <Text style={[estilos.textoFila, intervaloSincro === minutos && estilos.textoSeleccionado]}>
                    {intervaloSincro === minutos ? '✅ ' : '   '}{minutos} minutos
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={estilos.botonCancelarModal} onPress={() => setModalIntervaloVisible(false)}>
              <Text style={estilos.textoCancelarModal}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ==============================================================
// ESTILOS
// (Se mantienen idénticos a la versión anterior)
// ==============================================================
const estilos = StyleSheet.create({
  contenedorClave: { flex: 1, backgroundColor: '#0A1629', justifyContent: 'center', alignItems: 'center', padding: 30 },
  tituloClave: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginTop: 20, marginBottom: 10 },
  descripcionClave: { fontSize: 14, color: '#8899AA', textAlign: 'center', marginBottom: 30 },
  inputClave: { width: '100%', backgroundColor: '#132744', color: '#FFFFFF', fontSize: 16, padding: 14, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#1E3A5F' },
  botonClave: { backgroundColor: '#4A90D9', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10 },
  textoBotonClave: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  contenedor: { flex: 1, backgroundColor: '#0A1629' },
  cabecera: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#0F213D' },
  botonVolver: { padding: 8, marginRight: 8 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  contenido: { padding: 20 },
  grupoCampo: { marginBottom: 20 },
  etiqueta: { fontSize: 15, color: '#B0C4DE', marginBottom: 8, fontWeight: '500' },
  etiquetaDeshabilitada: { color: '#556677' },
  input: { backgroundColor: '#132744', color: '#FFFFFF', fontSize: 15, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F' },
  inputCombo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputDeshabilitado: { backgroundColor: '#0F1A2E', borderColor: '#1A2A45' },
  textoInput: { fontSize: 15, color: '#FFFFFF' },
  textoDeshabilitado: { color: '#556677' },
  filaSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#132744', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1E3A5F' },
  textoSwitch: { fontSize: 15, fontWeight: 'bold' },
  textoActivo: { color: '#4ADE80' },
  textoInactivo: { color: '#94A3B8' },
  botonGuardar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 14, marginTop: 10, marginBottom: 12 },
  textoBotonGuardar: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  botonVolverMenu: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A3358', borderRadius: 10, paddingVertical: 12, marginBottom: 10 },
  textoBotonSecundario: { color: '#4A90D9', fontSize: 15, marginLeft: 8 },
  botonRestablecer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10 },
  textoBotonRestablecer: { color: '#FF6B6B', fontSize: 14, marginLeft: 8 },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 16 },
  contenidoModal: { backgroundColor: '#0F1E39', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)', maxHeight: '70%' },
  tituloModal: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },
  listaOpciones: { maxHeight: 300, marginBottom: 16 },
  filaOpcion: { paddingVertical: 12, paddingHorizontal: 16, marginBottom: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'transparent' },
  filaSeleccionada: { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)' },
  textoFila: { fontSize: 14, color: '#CBD5E1' },
  textoSeleccionado: { color: '#FFFFFF', fontWeight: '700' },
  botonCancelarModal: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  textoCancelarModal: { color: '#CBD5E1', fontWeight: '600' },
});