// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\EncerarTablas.tsx
// Pantalla para encerar (vaciar) las tablas locales de la aplicación
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    encerarTablas,
    obtenerResumenTablas,
    type OpcionesEncerado,
    type ResumenTablas,
} from '../servicios/BaseDatos';

// ==============================================================
// CONSTANTES
// ==============================================================
const PALABRA_CONFIRMACION = 'ENCERAR';

const RESUMEN_VACIO: ResumenTablas = {
  sesiones: 0,
  participantesGeneral: 0,
  participantesSesion: 0,
  partidas: 0,
  historialParticipantes: 0,
  historialSincronizacion: 0,
};

const OPCIONES_VACIAS: OpcionesEncerado = {
  datosDeJuego: false,
  participantes: false,
  historialSincronizacion: false,
};

type DefinicionOpcion = {
  clave: keyof OpcionesEncerado;
  titulo: string;
  descripcion: string;
  detalle: (r: ResumenTablas) => string;
};

const DEFINICIONES: DefinicionOpcion[] = [
  {
    clave: 'datosDeJuego',
    titulo: 'Sesiones y partidas',
    descripcion:
      'Sesiones, participantes por sesión, partidas e historial individual de cada participante.',
    detalle: r =>
      `${r.sesiones} sesiones, ${r.participantesSesion} asignaciones, ${r.partidas} partidas, ${r.historialParticipantes} historiales`,
  },
  {
    clave: 'participantes',
    titulo: 'Participantes generales',
    descripcion: 'La lista de participantes registrados en la app.',
    detalle: r => `${r.participantesGeneral} participantes`,
  },
  {
    clave: 'historialSincronizacion',
    titulo: 'Registros de sincronización',
    descripcion: 'El historial de envíos al servidor.',
    detalle: r => `${r.historialSincronizacion} registros`,
  },
];

// ==============================================================
// COMPONENTE: EncerarTablas
// ==============================================================
const EncerarTablas = () => {
  const [resumen, setResumen] = useState<ResumenTablas>(RESUMEN_VACIO);
  const [opciones, setOpciones] = useState<OpcionesEncerado>(OPCIONES_VACIAS);
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const cargarResumen = useCallback(async () => {
    try {
      setResumen(await obtenerResumenTablas());
    } catch (error) {
      console.log('Error al leer el resumen de tablas:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarResumen();
      setTexto('');
    }, [cargarResumen])
  );

  const hayOpcionSeleccionada = useMemo(
    () => Object.values(opciones).some(Boolean),
    [opciones]
  );
  const confirmacionCorrecta = texto.trim().toUpperCase() === PALABRA_CONFIRMACION;
  const puedeEncerar = hayOpcionSeleccionada && confirmacionCorrecta && !ocupado;

  const alternar = (clave: keyof OpcionesEncerado) =>
    setOpciones(anterior => ({ ...anterior, [clave]: !anterior[clave] }));

  const ejecutar = async () => {
    setOcupado(true);
    try {
      await encerarTablas(opciones);
      setTexto('');
      setOpciones(OPCIONES_VACIAS);
      await cargarResumen();
      Alert.alert('Tablas en cero ✅', 'Las tablas seleccionadas quedaron vacías.');
    } catch (error) {
      console.log('Error al encerar tablas:', error);
      Alert.alert('No se pudo encerar', 'Ocurrió un error al borrar los datos. Inténtelo de nuevo.');
    } finally {
      setOcupado(false);
    }
  };

  const pedirConfirmacionFinal = () => {
    const nombres = DEFINICIONES.filter(d => opciones[d.clave])
      .map(d => `• ${d.titulo}`)
      .join('\n');
    Alert.alert(
      'Confirmación final',
      `Se borrarán de este dispositivo:\n\n${nombres}\n\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Encerar', style: 'destructive', onPress: ejecutar },
      ]
    );
  };

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <View style={estilos.tarjetaAdvertencia}>
        <Ionicons name="warning" size={22} color="#F59E0B" />
        <View style={estilos.columnaTexto}>
          <Text style={estilos.tituloAdvertencia}>Borra datos de este dispositivo</Text>
          <Text style={estilos.textoAdvertencia}>
            Los datos del servidor no se tocan. Si el servidor ya tiene sesiones guardadas y aquí
            vuelve a numerar desde 1, la próxima sincronización puede sobrescribir las sesiones del
            servidor que tengan el mismo número. Sincronice antes y, si hace falta, vacíe también el
            servidor.
          </Text>
        </View>
      </View>

      <Text style={estilos.subtitulo}>¿Qué desea encerar?</Text>

      {DEFINICIONES.map(def => {
        const activa = opciones[def.clave];
        return (
          <TouchableOpacity
            key={def.clave}
            style={[estilos.tarjetaOpcion, activa && estilos.tarjetaOpcionActiva]}
            onPress={() => alternar(def.clave)}
            disabled={ocupado}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activa ? 'checkbox' : 'square-outline'}
              size={24}
              color={activa ? '#EF4444' : '#94A3B8'}
            />
            <View style={estilos.columnaTexto}>
              <Text style={estilos.tituloOpcion}>{def.titulo}</Text>
              <Text style={estilos.descripcionOpcion}>{def.descripcion}</Text>
              <Text style={estilos.detalleOpcion}>Ahora: {def.detalle(resumen)}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <Text style={estilos.subtitulo}>Confirmación</Text>
      <Text style={estilos.ayuda}>
        Escriba {PALABRA_CONFIRMACION} para habilitar el botón.
      </Text>
      <TextInput
        style={estilos.entrada}
        value={texto}
        onChangeText={setTexto}
        placeholder={PALABRA_CONFIRMACION}
        placeholderTextColor="#475569"
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!ocupado}
      />

      <TouchableOpacity
        style={[estilos.botonEncerar, !puedeEncerar && estilos.botonDeshabilitado]}
        onPress={pedirConfirmacionFinal}
        disabled={!puedeEncerar}
      >
        <Ionicons name="trash" size={18} color="#fff" />
        <Text style={estilos.textoBoton}>{ocupado ? 'Encerando...' : 'Encerar tablas seleccionadas'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EncerarTablas;

// ==============================================================
// ESTILOS
// ==============================================================
const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#0A1629' },
  contenido: { padding: 16, paddingBottom: 40 },
  columnaTexto: { flex: 1 },
  tarjetaAdvertencia: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  tituloAdvertencia: { color: '#FBBF24', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  textoAdvertencia: { color: '#E2E8F0', fontSize: 13, lineHeight: 19 },
  subtitulo: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 22, marginBottom: 10 },
  tarjetaOpcion: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#12203A',
    borderColor: '#1E3350',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  tarjetaOpcionActiva: { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.10)' },
  tituloOpcion: { color: '#fff', fontSize: 15, fontWeight: '600' },
  descripcionOpcion: { color: '#94A3B8', fontSize: 13, marginTop: 2, lineHeight: 18 },
  detalleOpcion: { color: '#CBD5E1', fontSize: 12, marginTop: 6 },
  ayuda: { color: '#94A3B8', fontSize: 13, marginBottom: 8 },
  entrada: {
    backgroundColor: '#12203A',
    borderColor: '#1E3350',
    borderWidth: 1,
    borderRadius: 10,
    color: '#fff',
    fontSize: 16,
    letterSpacing: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  botonEncerar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
  },
  botonDeshabilitado: { backgroundColor: '#4B5563', opacity: 0.6 },
  textoBoton: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
