// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\ConfiguracionServidor.tsx
// Fecha última modificación: 17/10/2026
// Propósito: Pantalla de configuración de conexión al servidor
// Funcionalidades: Ingreso de IP, puerto y carpeta; validación y guardado

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react'; // ✅ Agregado useEffect
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// ✅ Importamos las funciones del servicio (lógica separada de la interfaz)
import {
    CLAVE_GLOBAL,
    construirUrlServidor,
    guardarConfiguracion,
    obtenerConfiguracion,
    restablecerConfiguracion,
    type ConfiguracionServidor,
} from '../servicios/ConfiguracionServidor';

export default function PantallaConfiguracionServidor({ navegacion }: any) {
  // ==============================================================
  // ESTADOS DEL FORMULARIO
  // Almacenan lo que el usuario escribe en cada campo
  // ==============================================================
  const [claveIngresada, setClaveIngresada] = useState('');
  const [accesoConcedido, setAccesoConcedido] = useState(false);

  const [ip, setIp] = useState('');
  const [puerto, setPuerto] = useState('');
  const [carpeta, setCarpeta] = useState('');

  // ==============================================================
  // CARGAR CONFIGURACIÓN AL ENTRAR A LA PANTALLA
  // Lee los valores guardados y los muestra en los campos
  // ==============================================================
    const cargarConfiguracion = async () => {
        const config = await obtenerConfiguracion();
            setIp(config.ip);
            setPuerto(config.puerto);
            setCarpeta(config.carpeta);
        };

  // ✅ Ejecutar al cargar la pantalla — forma correcta con useEffect
  useEffect(() => {
        cargarConfiguracion();
    }, []);


  // ==============================================================
  // VALIDAR CLAVE DE ACCESO
  // Comprueba que la clave ingresada coincida con la autorizada
  // ==============================================================
  const validarClave = () => {
    if (claveIngresada === CLAVE_GLOBAL) {
      setAccesoConcedido(true);
      cargarConfiguracion(); // Cargar datos tras autorización
    } else {
      Alert.alert('🔒 Acceso denegado', 'La clave ingresada no es correcta', [
        { text: 'Reintentar' },
      ]);
    }
  };

  // ==============================================================
  // GUARDAR CAMBIOS
  // Valida, guarda y vuelve al menú principal
  // ==============================================================
  const guardarCambios = async () => {
    // Validaciones básicas
    if (!ip.trim()) {
      Alert.alert('⚠️ Falta dato', 'Ingresa la dirección IP del servidor', [
        { text: 'Entendido' },
      ]);
      return;
    }

    if (!puerto.trim()) {
      Alert.alert('⚠️ Falta dato', 'Ingresa el puerto de conexión', [
        { text: 'Entendido' },
      ]);
      return;
    }

    // Crear objeto con los nuevos valores
    const nuevaConfig: ConfiguracionServidor = {
      ip: ip.trim(),
      puerto: puerto.trim(),
      carpeta: carpeta.trim(),
    };

    try {
      // Guardar en el almacenamiento
      await guardarConfiguracion(nuevaConfig);

      // Mostrar la URL que se generará para confirmar
      const urlGenerada = await construirUrlServidor();

      Alert.alert(
        '✅ Configuración guardada',
        `IP: ${nuevaConfig.ip}\nPuerto: ${nuevaConfig.puerto}\nCarpeta: ${
          nuevaConfig.carpeta || '(ninguna)'
        }\n\n→ ${urlGenerada}`,
        [
          {
            text: 'Aceptar',
            onPress: () => navegacion.goBack(), // Volver tras guardar
          },
        ]
      );
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo guardar la configuración', [
        { text: 'Aceptar' },
      ]);
    }
  };

  // ==============================================================
  // RESTABLECER VALORES POR DEFECTO
  // Borra lo guardado y vuelve a la configuración inicial
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
            await cargarConfiguracion(); // Recargar valores por defecto
            Alert.alert('✅ Restablecido', 'Se restauraron los valores por defecto', [
              { text: 'Aceptar' },
            ]);
          },
        },
      ]
    );
  };

  // ==============================================================
  // PANTALLA DE CLAVE DE ACCESO
  // Primera vista: solicita contraseña para continuar
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
  // FORMULARIO DE CONFIGURACIÓN
  // Vista principal: campos para editar los datos del servidor
  // ==============================================================
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={estilos.contenedor}>
        {/* Cabecera con botón de retorno */}
        <View style={estilos.cabecera}>
          <TouchableOpacity style={estilos.botonVolver} onPress={() => navegacion.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={estilos.titulo}>Configuración del Servidor</Text>
        </View>

        <ScrollView contentContainerStyle={estilos.contenido}>
          {/* Campo: Dirección IP */}
          <View style={estilos.grupoCampo}>
            <Text style={estilos.etiqueta}>Dirección IP del Servidor</Text>
            <TextInput
              style={estilos.input}
              placeholder="Ej: 192.168.1.53"
              placeholderTextColor="#556677"
              value={ip}
              onChangeText={setIp}
              keyboardType="numeric"
              autoCapitalize="none"
            />
          </View>

          {/* Campo: Puerto */}
          <View style={estilos.grupoCampo}>
            <Text style={estilos.etiqueta}>Puerto</Text>
            <TextInput
              style={estilos.input}
              placeholder="Ej: 8000"
              placeholderTextColor="#556677"
              value={puerto}
              onChangeText={setPuerto}
              keyboardType="numeric"
              autoCapitalize="none"
            />
          </View>

          {/* Campo: Carpeta/Ruta */}
          <View style={estilos.grupoCampo}>
            <Text style={estilos.etiqueta}>Carpeta / Ruta (opcional)</Text>
            <TextInput
              style={estilos.input}
              placeholder="Ej: /rumi/api/sincronizar/"
              placeholderTextColor="#556677"
              value={carpeta}
              onChangeText={setCarpeta}
              autoCapitalize="none"
            />
          </View>

          {/* Botón: Guardar Cambios → vuelve al menú automáticamente */}
          <TouchableOpacity style={estilos.botonGuardar} onPress={guardarCambios}>
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={estilos.textoBotonGuardar}>Guardar Cambios</Text>
          </TouchableOpacity>

          {/* Botón: Volver sin guardar */}
          <TouchableOpacity
            style={estilos.botonVolverMenu}
            onPress={() => navegacion.goBack()}
          >
            <Ionicons name="arrow-undo" size={18} color="#4A90D9" />
            <Text style={estilos.textoBotonSecundario}>Retornar al Menú Principal</Text>
          </TouchableOpacity>

          {/* Botón: Restablecer valores */}
          <TouchableOpacity style={estilos.botonRestablecer} onPress={restablecer}>
            <Ionicons name="refresh" size={18} color="#FF6B6B" />
            <Text style={estilos.textoBotonRestablecer}>Restablecer por Defecto</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==============================================================
// ESTILOS
// Diseño visual de la pantalla
// ==============================================================
const estilos = StyleSheet.create({
  contenedorClave: {
    flex: 1,
    backgroundColor: '#0A1629',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  tituloClave: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  descripcionClave: {
    fontSize: 14,
    color: '#8899AA',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputClave: {
    width: '100%',
    backgroundColor: '#132744',
    color: '#FFFFFF',
    fontSize: 16,
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  botonClave: {
    backgroundColor: '#4A90D9',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  textoBotonClave: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  grupoCampo: {
    marginBottom: 20,
  },
  etiqueta: {
    fontSize: 15,
    color: '#B0C4DE',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#132744',
    color: '#FFFFFF',
    fontSize: 15,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  botonGuardar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 12,
  },
  textoBotonGuardar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  botonVolverMenu: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A3358',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },
  textoBotonSecundario: {
    color: '#4A90D9',
    fontSize: 15,
    marginLeft: 8,
  },
  botonRestablecer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  textoBotonRestablecer: {
    color: '#FF6B6B',
    fontSize: 14,
    marginLeft: 8,
  },
});