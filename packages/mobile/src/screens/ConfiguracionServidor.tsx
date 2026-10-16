// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\ConfiguracionServidor.tsx
// Pantalla de configuración del servidor
// Requiere clave global para acceder. Permite editar IP, puerto y carpeta.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    CLAVE_GLOBAL,
    ConfiguracionServidor as TipoConfiguracion,
    guardarConfiguracion,
    obtenerConfiguracion,
    restablecerConfiguracion,
} from '../servicios/ConfiguracionServidor';

export default function ConfiguracionServidor() {
  // ==============================================================
  // ESTADOS
  // ==============================================================
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [claveIngresada, setClaveIngresada] = useState('');
  const [cargando, setCargando] = useState(true);
  const [configuracion, setConfiguracion] = useState<TipoConfiguracion>({
    ip: '',
    puerto: '',
    carpeta: '',
  });
  const [guardando, setGuardando] = useState(false);

  // ==============================================================
  // CARGA INICIAL
  // Propósito: Leer la configuración actual del almacenamiento
  // ==============================================================
  useEffect(() => {
    const cargar = async () => {
      const config = await obtenerConfiguracion();
      setConfiguracion(config);
      setCargando(false);
    };
    cargar();
  }, []);

  // ==============================================================
  // FUNCIÓN: verificarClave
  // Propósito: Valida la clave global ingresada
  // ==============================================================
  const verificarClave = () => {
    if (claveIngresada.trim() === CLAVE_GLOBAL) {
      setDesbloqueado(true);
      setClaveIngresada('');
    } else {
      Alert.alert('❌ Clave incorrecta', 'Verifica la clave e intenta de nuevo.');
      setClaveIngresada('');
    }
  };

  // ==============================================================
  // FUNCIÓN: guardarCambios
  // Propósito: Guarda la configuración editada
  // ==============================================================
  const guardarCambios = async () => {
    // Validaciones básicas
    if (!configuracion.ip.trim()) {
      Alert.alert('Validación', 'La IP no puede estar vacía');
      return;
    }
    if (!configuracion.puerto.trim()) {
      Alert.alert('Validación', 'El puerto no puede estar vacío');
      return;
    }
    const puertoNum = parseInt(configuracion.puerto, 10);
    if (isNaN(puertoNum) || puertoNum < 1 || puertoNum > 65535) {
      Alert.alert('Validación', 'El puerto debe ser un número entre 1 y 65535');
      return;
    }

    setGuardando(true);
    try {
      await guardarConfiguracion(configuracion);
      Alert.alert('✅ Guardado', 'La configuración se actualizó correctamente.');
    } catch (error) {
      Alert.alert('❌ Error', 'No se pudo guardar la configuración.');
      console.log(error);
    } finally {
      setGuardando(false);
    }
  };

  // ==============================================================
  // FUNCIÓN: restablecer
  // Propósito: Vuelve a la configuración por defecto
  // ==============================================================
  const restablecer = () => {
    Alert.alert(
      '⚠️ Restablecer configuración',
      '¿Seguro que quieres volver a los valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            await restablecerConfiguracion();
            const config = await obtenerConfiguracion();
            setConfiguracion(config);
            Alert.alert('✅ Restablecido', 'La configuración volvió a los valores por defecto.');
          },
        },
      ]
    );
  };

  // ==============================================================
  // FUNCIÓN: bloquear
  // Propósito: Vuelve a ocultar los datos del servidor
  // ==============================================================
  const bloquear = () => {
    setDesbloqueado(false);
  };

  // ==============================================================
  // RENDER: Cargando
  // ==============================================================
  if (cargando) {
    return (
      <View style={estilos.centrado}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={estilos.textoCargando}>Cargando configuración...</Text>
      </View>
    );
  }

  // ==============================================================
  // RENDER: Formulario bloqueado (pide clave)
  // ==============================================================
  if (!desbloqueado) {
    return (
      <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
        <View style={estilos.encabezadoBloqueo}>
          <Ionicons name="lock-closed" size={56} color="#F59E0B" />
          <Text style={estilos.titulo}>Configuración Protegida</Text>
          <Text style={estilos.descripcion}>
            Ingresa la clave global para acceder a la configuración del servidor.
          </Text>
        </View>

        <View style={estilos.tarjetaFormulario}>
          <Text style={estilos.etiquetaCampo}>Clave global:</Text>
          <TextInput
            style={estilos.entradaTexto}
            value={claveIngresada}
            onChangeText={setClaveIngresada}
            placeholder="Clave de Acceso"
            placeholderTextColor="#64748B"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity style={estilos.botonPrimario} onPress={verificarClave}>
            <Ionicons name="key" size={20} color="#FFFFFF" />
            <Text style={estilos.textoBotonPrimario}>Desbloquear</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ==============================================================
  // RENDER: Formulario desbloqueado (edita IP, puerto, carpeta)
  // ==============================================================
  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <View style={estilos.encabezadoDesbloqueado}>
        <Ionicons name="settings" size={40} color="#22C55E" />
        <Text style={estilos.titulo}>Configuración del Servidor</Text>
        <Text style={estilos.descripcion}>
          Modifica los datos de conexión. Se aplican al instante.
        </Text>
      </View>

      <View style={estilos.tarjetaFormulario}>
        <Text style={estilos.etiquetaCampo}>IP del servidor:</Text>
        <TextInput
          style={estilos.entradaTexto}
          value={configuracion.ip}
          onChangeText={(texto) => setConfiguracion({ ...configuracion, ip: texto })}
          placeholder="Ej: 192.168.1.53"
          placeholderTextColor="#64748B"
          keyboardType="decimal-pad"
          autoCapitalize="none"
        />

        <Text style={estilos.etiquetaCampo}>Puerto:</Text>
        <TextInput
          style={estilos.entradaTexto}
          value={configuracion.puerto}
          onChangeText={(texto) => setConfiguracion({ ...configuracion, puerto: texto })}
          placeholder="Ej: 8000"
          placeholderTextColor="#64748B"
          keyboardType="number-pad"
        />

        <Text style={estilos.etiquetaCampo}>Carpeta del proyecto (opcional):</Text>
        <TextInput
          style={estilos.entradaTexto}
          value={configuracion.carpeta}
          onChangeText={(texto) => setConfiguracion({ ...configuracion, carpeta: texto })}
          placeholder="Ej: api o rumi/v1"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
        />
        <Text style={estilos.textoAyuda}>
          Déjalo vacío si el servidor no usa subcarpeta.
        </Text>

        <TouchableOpacity
          style={[estilos.botonPrimario, guardando && estilos.botonDeshabilitado]}
          onPress={guardarCambios}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#FFFFFF" />
              <Text style={estilos.textoBotonPrimario}>Guardar cambios</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={estilos.botonSecundario} onPress={restablecer}>
          <Ionicons name="refresh" size={18} color="#FCA5A5" />
          <Text style={estilos.textoBotonSecundario}>Restablecer valores por defecto</Text>
        </TouchableOpacity>

        <TouchableOpacity style={estilos.botonBloquear} onPress={bloquear}>
          <Ionicons name="lock-closed" size={18} color="#94A3B8" />
          <Text style={estilos.textoBotonBloquear}>Bloquear configuración</Text>
        </TouchableOpacity>
      </View>

      <View style={estilos.aviso}>
        <Ionicons name="information-circle" size={18} color="#60A5FA" />
        <Text style={estilos.textoAviso}>
          La URL actual del servidor se construye como:
          {'\n'}
          <Text style={estilos.textoAvisoDestacado}>
            http://{configuracion.ip || '???'}:{configuracion.puerto || '???'}
            {configuracion.carpeta ? `/${configuracion.carpeta}` : ''}
          </Text>
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
    paddingBottom: 40,
  },
  centrado: {
    flex: 1,
    backgroundColor: '#0A1629',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCargando: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  encabezadoBloqueo: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  encabezadoDesbloqueado: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },
  descripcion: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  tarjetaFormulario: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  etiquetaCampo: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  entradaTexto: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textoAyuda: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  botonPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  textoBotonPrimario: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  textoBotonSecundario: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '600',
  },
  botonBloquear: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  textoBotonBloquear: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  aviso: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 10,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  textoAviso: {
    color: '#CBD5E1',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  textoAvisoDestacado: {
    color: '#60A5FA',
    fontWeight: '700',
  },
});