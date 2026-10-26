// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\SesionActiva.tsx
// Historial de cambios:
// | Fecha       | Versión | Descripción del cambio |
// |-------------|---------|------------------------|
// | 22/10/2026  | 3.1.0   | Blindaje contra numeroSesion=0 y validación estricta de datos. |
// | 22/10/2026  | 3.2.0   | Corrección de estados de partida (Ganador en lugar de Finalizada). |
// | 22/10/2026  | 3.2.1   | Regla de negocio: fechaHoraFinalizacion NUNCA es nula. Bloqueo total de partidas en curso si la sesión se finaliza. |
// | 25/10/2026  | 3.3.0   | Integración de reconocimiento de voz para finalizar partida (Comandos: "Partida Finalizar", ganador, empate, anulada, finalizar sesión). |

import Voice from '@react-native-voice/voice';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  actualizarParticipanteSesion,
  actualizarPartida,
  agregarHistorialParticipante,
  guardarPartida,
  guardarSesion,
  obtenerEstadisticasPorSesion,
  obtenerParticipantesPorSesion,
  obtenerPartidasPorSesion,
  obtenerSesiones,
  type EstadisticaParticipanteSesion,
  type ParticipanteEnSesion,
  type Partida,
  type Sesion,
} from '../servicios/BaseDatos';

// ==============================================================
// TIPOS DE NAVEGACIÓN
// ==============================================================
type RutasNavegacion = {
  Inicio: undefined;
  Sesiones: undefined;
  SesionActiva: { numeroSesion?: number };
  ResultadosSesion: {
    numeroSesion: number;
    descripcion: string;
    valorApuesta: number;
    totalPartidas: number;
    partidasConGanador: number;
    partidasEmpatadas: number;
    partidasAnuladas: number;
    totalApuestasGanador: number;
    estadisticas: EstadisticaParticipanteSesion[];
    origen?: 'Consulta' | 'SesionActiva';
  };
};

// ==============================================================
// TIPOS LOCALES
// ==============================================================
type SesionDatos = {
  numero: number;
  descripcion: string;
  valorApuesta: number;
  estado: 'Activa' | 'Finalizada' | 'Cerrada';
};

type FilaResultado = {
  id: string;
  etiqueta: string;
  tipo: 'empate' | 'anulada' | 'ganador';
  participanteId?: string;
};

// ==============================================================
// COMPONENTE PRINCIPAL
// ==============================================================
const SesionActiva = ({ route }: { route?: { params?: { numeroSesion?: number } } } = {}) => {
  const numeroSesionParam = route?.params?.numeroSesion;
  const navegacion = useNavigation<NavigationProp<RutasNavegacion>>();

  const [cargando, setCargando] = useState(true);
  const [sesionBase, setSesionBase] = useState<SesionDatos | null>(null);
  const [participantes, setParticipantes] = useState<ParticipanteEnSesion[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticaParticipanteSesion[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filaSeleccionadaId, setFilaSeleccionadaId] = useState<string | null>(null);
  const [finalizarSesion, setFinalizarSesion] = useState(false);
  const [verEstadisticas, setVerEstadisticas] = useState(false);

  // Estados para reconocimiento de voz
  const [escuchandoVoz, setEscuchandoVoz] = useState(false);
  const [errorVoz, setErrorVoz] = useState<string | null>(null);

  const sesionNumeroRef = useRef<number | null>(null);

  // ==============================================================
  // MEMOIZACIÓN DE ESTADO
  // ==============================================================
  const partidaActiva = useMemo(() => 
    partidas.find(p => p.estado === 'EnCurso'), 
    [partidas]
  );

  const ultimaPartida = useMemo(() =>
    partidas.filter(p => p.estado !== 'EnCurso').sort((a, b) => b.numero - a.numero)[0] || null,
    [partidas]
  );

  const textoUltimo = useMemo((): string | null => {
    if (!ultimaPartida) return null;
    if (ultimaPartida.estado === 'Empatada') return `Partida Anterior: Empatada`;
    if (ultimaPartida.estado === 'Anulada') return `Partida Anterior: Anulada`;
    if (ultimaPartida.estado === 'Ganador') {
      const ganador = participantes.find(p => p.participanteId === ultimaPartida.identificadorGanador);
      const monto = ultimaPartida.montoGanado ?? 0;
      return `Partida Anterior - Ganador: ${ganador?.nombre || 'Desconocido'} — Ganó: $${monto.toFixed(2)}`;
    }
    return null;
  }, [ultimaPartida, participantes]);

  const participantesActivos = useMemo(
    () => participantes.filter(p => p.estadoEnSesion === 'Activo'),
    [participantes]
  );
  const totalActivos = participantesActivos.length;

  const totales = useMemo(() => {
    const ganadas = partidas.filter(p => p.estado === 'Ganador').length;
    const empatadas = partidas.filter(p => p.estado === 'Empatada').length;
    const anuladas = partidas.filter(p => p.estado === 'Anulada').length;
    const enCurso = partidas.filter(p => p.estado === 'EnCurso').length;
    const totalPartidas = ganadas + empatadas + anuladas;
    const totalApuestas = sesionBase 
      ? ganadas * totalActivos * sesionBase.valorApuesta 
      : 0;

    return { ganadas, empatadas, anuladas, enCurso, totalPartidas, totalApuestas };
  }, [partidas, totalActivos, sesionBase]);

  const valorPorApuesta = sesionBase ? totalActivos * sesionBase.valorApuesta : 0;

  const filasGrilla = useMemo((): FilaResultado[] => [
    { id: 'empate', etiqueta: '⚖️ Empate', tipo: 'empate' },
    { id: 'anulada', etiqueta: '❌ Anulada', tipo: 'anulada' },
    ...participantesActivos.map(p => ({
      id: `ganador-${p.participanteId}`,
      etiqueta: `🏆 ${p.nombre}`,
      tipo: 'ganador' as const,
      participanteId: p.participanteId,
    })),
  ], [participantesActivos]);

  // ==============================================================
  // FUNCIONES DE CARGA Y VALIDACIÓN
  // ==============================================================

  const obtenerSiguienteNumero = useCallback(async () => {
    if (!sesionNumeroRef.current) return 1;
    const todas = await obtenerPartidasPorSesion(sesionNumeroRef.current);
    if (todas.length === 0) return 1;
    const maximo = Math.max(...todas.map(p => p.numero));
    return maximo + 1;
  }, []);

  const recargarTodo = useCallback(async (numeroSesionActual: number) => {
    const listaParticipantes = await obtenerParticipantesPorSesion(numeroSesionActual);
    let listaPartidas = await obtenerPartidasPorSesion(numeroSesionActual);

    const vistos = new Set<number>();
    listaPartidas = listaPartidas.filter(p => {
      if (vistos.has(p.numero)) return false;
      vistos.add(p.numero);
      return true;
    }).sort((a, b) => a.numero - b.numero);

    const estadisticasActuales = await obtenerEstadisticasPorSesion(numeroSesionActual);

    setParticipantes(listaParticipantes);
    setPartidas(listaPartidas);
    setEstadisticas(estadisticasActuales);

    return { listaParticipantes, listaPartidas, estadisticasActuales };
  }, []);

  const cargarDatos = useCallback(async () => {
    setCargando(true);

    const sesionesGuardadas = await obtenerSesiones();
    let sesionActiva: Sesion | undefined;

    if (numeroSesionParam) {
      sesionActiva = sesionesGuardadas.find(s => s.numero === numeroSesionParam);
    } else {
      sesionActiva = sesionesGuardadas.filter(s => s.estado === 'Activa').sort((a, b) => b.numero - a.numero)[0];
    }

    if (!sesionActiva) {
      setCargando(false);
      Alert.alert(
        'Sin sesión activa',
        'Debe crear una sesión primero desde la opción GestionSesiones.',
        [{ text: 'Aceptar', onPress: () => navegacion.navigate('Inicio') }]
      );
      return;
    }

    if (!sesionActiva.numero || sesionActiva.numero <= 0) {
      console.error("🚫 ERROR CRÍTICO DE INTEGRIDAD: La sesión activa tiene número inválido (0 o null).");
      const sesionValida = sesionesGuardadas.filter(s => s.numero > 0).sort((a, b) => b.numero - a.numero)[0];
      if (sesionValida) {
        sesionActiva = sesionValida;
        console.log(`✅ Corregido: Usando sesión válida Nº ${sesionActiva.numero}`);
      } else {
        setCargando(false);
        Alert.alert('Error de Integridad', 'No se encontró una sesión válida. Vuelva al inicio.');
        navegacion.navigate('Inicio');
        return;
      }
    }

    sesionNumeroRef.current = sesionActiva.numero;

    await recargarTodo(sesionActiva.numero);

    setSesionBase({
      numero: sesionActiva.numero,
      descripcion: sesionActiva.descripcion,
      valorApuesta: sesionActiva.valorApuestaBase,
      estado: sesionActiva.estado === 'Finalizada' ? 'Finalizada' : 'Activa',
    });
    
    setCargando(false);
  }, [numeroSesionParam, navegacion, recargarTodo]);

  useFocusEffect(useCallback(() => {
    cargarDatos();
  }, [cargarDatos]));

  // ==============================================================
  // CREACIÓN DE PARTIDAS (BLINDADA CON MANEJO DE ERRORES)
  // ==============================================================
  useEffect(() => {
    if (cargando) return;
    if (!sesionBase || sesionBase.estado !== 'Activa') return;
    if (partidaActiva) return;
    if (totalActivos < 3) return;

    (async () => {
      try {
        const numeroAsignado = await obtenerSiguienteNumero();
        const numeroSesionValido = sesionBase.numero && sesionBase.numero > 0 ? sesionBase.numero : (sesionNumeroRef.current || 0);
        
        if (numeroSesionValido <= 0) {
          console.error("🚫 BLOQUEO: Intento de crear partida con numeroSesion <= 0.");
          return;
        }

        const nuevaPartida = await guardarPartida({
          numeroSesion: numeroSesionValido,
          numero: numeroAsignado,
          estado: 'EnCurso',
          identificadorGanador: null,
          montoGanado: 0,
          fechaHoraInicio: new Date().toISOString(),
          fechaHoraFinalizacion: new Date().toISOString(), // Placeholder válido, nunca null
          sincronizado: 'Pendiente',
        });
        setPartidas(prev => [...prev, nuevaPartida]);
      } catch (error: any) {
        console.error("🚫 ERROR CRÍTICO AL CREAR PARTIDA:", error.message);
        Alert.alert("Error de Integridad", "No se pudo iniciar la partida: " + error.message);
      }
    })();
  }, [cargando, sesionBase, partidaActiva, obtenerSiguienteNumero, totalActivos]);

  // ==============================================================
  // RECONOCIMIENTO DE VOZ
  // INICIO
  // Propósito: Permitir finalizar la partida mediante comandos de voz.
  // Comandos soportados: "Partida Finalizar" + [Nombre Ganador | Empate | Anulada] + (opcional) "Finalizar Sesion".
  // ==============================================================

  useEffect(() => {
    Voice.onSpeechStart = () => {
      console.log('🎤 onSpeechStart');
      setErrorVoz(null);
    };
    Voice.onSpeechEnd = () => {
      console.log('🎤 onSpeechEnd');
      setEscuchandoVoz(false);
    };
    Voice.onSpeechError = (e: any) => {
      console.error('🎤 onSpeechError', e);
      setErrorVoz(e.error ? e.error.message : 'Error de reconocimiento de voz');
      setEscuchandoVoz(false);
    };
    Voice.onSpeechResults = (e: any) => {
      console.log('🎤 onSpeechResults', e);
      if (e.value && e.value.length > 0) {
        const transcript = e.value[0];
        procesarComandoVoz(transcript);
      }
      setEscuchandoVoz(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // ==============================================================
  // FUNCIÓN: alternarEscuchaVoz
  // INICIO
  // Propósito: Iniciar o detener la escucha del micrófono para comandos de voz.
  // ==============================================================
  const alternarEscuchaVoz = async () => {
    if (escuchandoVoz) {
      await Voice.stop();
      setEscuchandoVoz(false);
    } else {
      if (!partidaActiva) {
        Alert.alert('Sin partida en curso', 'No hay una partida activa para finalizar.');
        return;
      }
      setErrorVoz(null);
      try {
        await Voice.start('es-ES'); // Configurado para español
        setEscuchandoVoz(true);
      } catch (e: any) {
        console.error('Error al iniciar voz', e);
        Alert.alert('Error', 'No se pudo activar el micrófono. Verifique los permisos en Android.');
      }
    }
  };

  // ==============================================================
  // FUNCIÓN: procesarComandoVoz
  // INICIO
  // Propósito: Analizar el texto transcrito y simular la selección en el modal de finalización.
  // ==============================================================
  const procesarComandoVoz = useCallback((transcript: string) => {
    const texto = transcript.toLowerCase().trim();
    
    // 1. Verificar comando principal
    if (!texto.includes('partida finalizar') && !texto.includes('finalizar partida')) {
      Alert.alert('Comando incompleto', 'Debe decir "Partida Finalizar" seguido de la opción (ej: "Partida finalizar, José, finalizar sesión").');
      return;
    }

    // 2. Buscar opciones
    let tipoSeleccionado: 'empate' | 'anulada' | 'ganador' | null = null;
    let participanteIdSeleccionado: string | null = null;
    let debeFinalizarSesion = false;

    if (texto.includes('empate')) {
      tipoSeleccionado = 'empate';
    } else if (texto.includes('anulada')) {
      tipoSeleccionado = 'anulada';
    } else {
      // Buscar nombre de participante activo
      for (const p of participantesActivos) {
        if (texto.includes(p.nombre.toLowerCase())) {
          tipoSeleccionado = 'ganador';
          participanteIdSeleccionado = p.participanteId;
          break;
        }
      }
    }

    if (texto.includes('finalizar sesion') || texto.includes('finalizar sesión')) {
      debeFinalizarSesion = true;
    }

    if (!tipoSeleccionado) {
      Alert.alert('Opción no reconocida', `Se escuchó: "${transcript}". No se identificó Empate, Anulada o un participante activo.`);
      return;
    }

    // 3. Simular selección y ejecutar
    const fila = filasGrilla.find(f => {
      if (tipoSeleccionado === 'empate' && f.tipo === 'empate') return true;
      if (tipoSeleccionado === 'anulada' && f.tipo === 'anulada') return true;
      if (tipoSeleccionado === 'ganador' && f.participanteId === participanteIdSeleccionado) return true;
      return false;
    });

    if (fila) {
      setFilaSeleccionadaId(fila.id);
      setFinalizarSesion(debeFinalizarSesion);
      setModalVisible(true);
      
      // Auto-confirmar después de un breve momento para simular el flujo completo por voz
      // El timeout asegura que los estados de React se hayan propagado antes de ejecutar
      setTimeout(() => {
        confirmar();
      }, 800);
    }
  }, [participantesActivos, filasGrilla]);

  // ==============================================================
  // ACCIONES DE USUARIO
  // ==============================================================
  const alternarParticipante = async (id: string) => {
    if (!sesionBase) return;
    const p = participantes.find(x => x.participanteId === id);
    if (!p) return;
    if (p.estadoEnSesion === 'Activo') {
      if (totalActivos <= 3) {
        Alert.alert('No permitido', 'Mínimo 3 participantes activos.');
        return;
      }
      await actualizarParticipanteSesion(sesionBase.numero, id, { estadoEnSesion: 'Suspendido' });
      setParticipantes(prev => prev.map(x =>
        x.participanteId === id ? { ...x, estadoEnSesion: 'Suspendido' as const } : x
      ));
    } else {
      await actualizarParticipanteSesion(sesionBase.numero, id, { estadoEnSesion: 'Activo' });
      setParticipantes(prev => prev.map(x =>
        x.participanteId === id ? { ...x, estadoEnSesion: 'Activo' as const } : x
      ));
    }
    setEstadisticas(await obtenerEstadisticasPorSesion(sesionBase.numero));
  };

  const abrirModal = () => {
    if (!partidaActiva) {
      Alert.alert('Sin partida en curso');
      return;
    }
    setFilaSeleccionadaId(null);
    setFinalizarSesion(false);
    setModalVisible(true);
  };

  const tocarFila = (filaId: string) => {
    setFilaSeleccionadaId(anterior => anterior === filaId ? null : filaId);
  };

  // ==============================================================
  // FUNCIÓN: confirmar
  // INICIO
  // Propósito: Finaliza la partida. Estados: Empatada, Anulada, Ganador.
  // fechaHoraFinalizacion SIEMPRE tiene valor.
  // Se usa useCallback para permitir su invocación segura desde procesos asíncronos (como el timeout de voz).
  // ==============================================================
  const confirmar = useCallback(async () => {
    if (!partidaActiva || !sesionBase) return;

    if (!filaSeleccionadaId) {
      Alert.alert('Seleccione una opción', 'Toque una fila: Empate, Anulada o un participante.');
      return;
    }

    const fila = filasGrilla.find(f => f.id === filaSeleccionadaId);
    if (!fila) return;

    const ahora = new Date().toISOString();
    let estadoPartida: 'Ganador' | 'Empatada' | 'Anulada';
    let ganadorId: string | null = null;
    let montoGanado: number = 0;

    if (fila.tipo === 'empate') {
      estadoPartida = 'Empatada';
    } else if (fila.tipo === 'anulada') {
      estadoPartida = 'Anulada';
    } else {
      estadoPartida = 'Ganador'; // ✅ REGLA DE NEGOCIO: JAMÁS 'Finalizada'
      ganadorId = fila.participanteId || null;
      montoGanado = Number(sesionBase.valorApuesta * (totalActivos - 1));
      
      if (!ganadorId) {
        Alert.alert('Error', 'Debe seleccionar un ganador válido.');
        return;
      }
      if (!montoGanado || montoGanado <= 0) {
        Alert.alert('Error', 'No se pudo calcular el monto ganado.');
        return;
      }
    }

    try {
      await actualizarPartida(partidaActiva.identificador!, {
        estado: estadoPartida,
        identificadorGanador: ganadorId || null,
        montoGanado: montoGanado,
        fechaHoraFinalizacion: ahora, // 🔥 SIEMPRE TIENE VALOR
        sincronizado: 'Pendiente'
      });

      if (estadoPartida === 'Ganador' && ganadorId) {
        for (const p of participantesActivos) {
          const esGanador = p.participanteId === ganadorId;
          await actualizarParticipanteSesion(sesionBase.numero, p.participanteId, {
            partidasGanadas: p.partidasGanadas + (esGanador ? 1 : 0),
            partidasPerdidas: p.partidasPerdidas + (esGanador ? 0 : 1),
            valoresGanados: p.valoresGanados + (esGanador ? montoGanado : 0),
            valoresPerdidos: p.valoresPerdidos + (esGanador ? 0 : sesionBase.valorApuesta),
          });
          await agregarHistorialParticipante(p.participanteId, {
            numeroSesion: sesionBase.numero,
            numeroPartida: partidaActiva.numero,
            fechaHora: ahora,
            tipoResultado: esGanador ? 'Ganó' : 'Perdió',
            monto: esGanador ? montoGanado : -sesionBase.valorApuesta,
          });
        }
      } else {
        for (const p of participantesActivos) {
          await agregarHistorialParticipante(p.participanteId, {
            numeroSesion: sesionBase.numero,
            numeroPartida: partidaActiva.numero,
            fechaHora: ahora,
            tipoResultado: estadoPartida === 'Empatada' ? 'Empató' : 'Anulada',
            monto: 0,
          });
        }
      }

      const { listaPartidas, estadisticasActuales } = await recargarTodo(sesionBase.numero);
      setModalVisible(false);

      if (finalizarSesion) {
        const sesiones = await obtenerSesiones();
        const sesionEnLista = sesiones.find(s => s.numero === sesionBase.numero);
        if (sesionEnLista) {
          sesionEnLista.estado = 'Finalizada'; // La SESIÓN sí se finaliza
          await guardarSesion(sesionEnLista);
        }
        setSesionBase(prev => !prev ? null : { ...prev, estado: 'Finalizada' });
        
        const ganadasCierre = listaPartidas.filter(p => p.estado === 'Ganador').length;
        const empatadasCierre = listaPartidas.filter(p => p.estado === 'Empatada').length;
        const anuladasCierre = listaPartidas.filter(p => p.estado === 'Anulada').length;
        const totalPartidasCierre = ganadasCierre + empatadasCierre + anuladasCierre;
        const totalApuestasCierre = ganadasCierre * totalActivos * sesionBase.valorApuesta;
        
        navegacion.navigate('ResultadosSesion', {
          numeroSesion: sesionBase.numero,
          descripcion: sesionBase.descripcion,
          valorApuesta: sesionBase.valorApuesta,
          totalPartidas: totalPartidasCierre,
          partidasConGanador: ganadasCierre,
          partidasEmpatadas: empatadasCierre,
          partidasAnuladas: anuladasCierre,
          totalApuestasGanador: totalApuestasCierre,
          estadisticas: estadisticasActuales,
        });
        return;
      }

      setTimeout(async () => {
        // 🔥 REGLA 1: Si la sesión está finalizada, NO crear partida EnCurso
        if (sesionBase?.estado === 'Finalizada') {
          console.warn("⚠️ Bloqueo de seguridad: Sesión finalizada, no se crea nueva partida.");
          return;
        }

        const siguienteNumero = await obtenerSiguienteNumero();
        const numSesionSiguiente = sesionBase.numero && sesionBase.numero > 0 ? sesionBase.numero : (sesionNumeroRef.current || 1);
        
        const nuevaSiguiente = await guardarPartida({
          numeroSesion: numSesionSiguiente,
          numero: siguienteNumero,
          estado: 'EnCurso',
          identificadorGanador: null,
          montoGanado: 0,
          fechaHoraInicio: new Date().toISOString(),
          fechaHoraFinalizacion: new Date().toISOString(), // 🔥 NUNCA NULO
          sincronizado: 'Pendiente',
        });
        setPartidas(prev => [...prev, nuevaSiguiente]);        
      }, 300);
    } catch (error: any) {
      console.error("🚫 ERROR AL FINALIZAR PARTIDA:", error.message);
      Alert.alert("Error", "No se pudo finalizar la partida: " + error.message);
    }
  }, [partidaActiva, sesionBase, filaSeleccionadaId, filasGrilla, totalActivos, participantesActivos, recargarTodo, finalizarSesion, obtenerSiguienteNumero, navegacion]);
  // ==============================================================
  // FIN: confirmar
  // ==============================================================

  const cerrarSesion = async () => {
    if (!sesionBase) return;
    
    if (partidaActiva) {
      Alert.alert(
        'No se puede cerrar', 
        'Existe una partida en curso. Debe finalizarla (Ganador, Empate o Anulada) antes de cerrar la sesión.'
      );
      return;
    }
    
    Alert.alert('Cerrar Sesión', '¿Confirmar cierre y volver al Menú Principal?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar', style: 'destructive', onPress: async () => {
          const sesiones = await obtenerSesiones();
          const sesionActual = sesiones.find(s => s.numero === sesionBase.numero);
          if (sesionActual) {
            sesionActual.estado = 'Finalizada';
            await guardarSesion(sesionActual);
          }
          setSesionBase(prev => !prev ? null : { ...prev, estado: 'Finalizada' });
          Alert.alert('Sesión cerrada ✅', '', [
            { text: 'Aceptar', onPress: () => navegacion.navigate('Inicio') }
          ]);
        },
      },
    ]);
  };

  // ==============================================================
  // UTILIDADES DE FORMATO
  // ==============================================================
  const formatear = (v: number) => `${v >= 0 ? '$' : '-$'}${Math.abs(v).toFixed(2)}`;
  const colorEstado = (e: string) => e === 'Activo' ? '#22C55E' : '#F59E0B';
  const colorSaldo = (s: number) => s > 0 ? '#22C55E' : s < 0 ? '#EF4444' : '#94A3B8';

  if (cargando) return <View style={estilos.pantalla}><Text style={{color:'#fff',textAlign:'center',marginTop:40}}>Cargando...</Text></View>;
  if (!sesionBase) return <View style={estilos.pantalla}><Text style={{color:'#fff',textAlign:'center',marginTop:40}}>Cargando...</Text></View>;

  // ==============================================================
  // RENDERIZADO DE PANTALLA
  // ==============================================================
  return (
    <View style={estilos.pantalla}>
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navegacion.navigate('Sesiones')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={estilos.tituloCentro}>
          <Text style={estilos.tituloPrincipal}>Sesión: {sesionBase.numero}</Text>
          <Text style={estilos.descripcionSesion} numberOfLines={1}>{sesionBase.descripcion || 'Sin descripción'}</Text>
          <Text style={estilos.subtituloApuesta}>Apuesta: {formatear(sesionBase.valorApuesta)}</Text>
          {partidaActiva && (
            <View style={estilos.etiquetaActiva}>
              <Text style={estilos.textoEtiqueta}>Partida {partidaActiva.numero} en curso</Text>
            </View>
          )}
          {sesionBase.estado === 'Finalizada' && (
            <View style={estilos.etiquetaCerrada}>
              <Text style={estilos.textoEtiquetaCerrada}>Sesión Cerrada</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={cerrarSesion} disabled={sesionBase.estado === 'Finalizada'}>
          <Ionicons name="log-out" size={22} color={sesionBase.estado === 'Finalizada' ? '#4B5563' : '#EF4444'} />
        </TouchableOpacity>
      </View>

      <View style={estilos.tarjetaSesion}>
        <Text style={estilos.etiquetaTarjeta}>Resumen de Sesión</Text>
        <View style={estilos.filaResumen}>
          <View style={estilos.elementoResumen}>
            <Text style={estilos.valorResumen}>{totales.totalPartidas}</Text>
            <Text style={estilos.etiquetaDato}>Total Partidas</Text>
          </View>
          <View style={estilos.elementoResumen}>
            <Text style={estilos.valorResumen}>{totales.ganadas}</Text>
            <Text style={estilos.etiquetaDato}>Ganadas</Text>
          </View>
          <View style={estilos.elementoResumen}>
            <Text style={estilos.valorResumen}>{totales.empatadas}</Text>
            <Text style={estilos.etiquetaDato}>Empatadas</Text>
          </View>
          <View style={estilos.elementoResumen}>
            <Text style={estilos.valorResumen}>{totales.anuladas}</Text>
            <Text style={estilos.etiquetaDato}>Anuladas</Text>
          </View>
          <View style={estilos.elementoResumen}>
            <Text style={estilos.valorResumen}>{formatear(totales.totalApuestas)}</Text>
            <Text style={estilos.etiquetaDato}>Total Apuestas</Text>
          </View>
        </View>
        <Text style={estilos.textoVerificacion}>
          {totales.ganadas} + {totales.empatadas} + {totales.anuladas} = {totales.totalPartidas}
        </Text>
        {textoUltimo && <View style={estilos.lineaResultado}><Text style={estilos.textoResultadoFinal}>{textoUltimo}</Text></View>}
      </View>

      <TouchableOpacity style={estilos.botonEstadisticas} onPress={() => setVerEstadisticas(!verEstadisticas)}>
        <Ionicons name={verEstadisticas ? 'bar-chart' : 'bar-chart-outline'} size={18} color="#fff" />
        <Text style={estilos.textoBotonEstadisticas}>{verEstadisticas ? 'Ocultar Estadísticas' : 'Ver Estadísticas'}</Text>
      </TouchableOpacity>

      {verEstadisticas && (
        <View style={estilos.tarjetaEstadisticas}>
          <Text style={estilos.tituloEstadisticas}>Estadísticas por Participante</Text>
          <View style={estilos.filaEncabezadoEst}>
            <Text style={estilos.encNom}>Participante</Text>
            <Text style={estilos.encNum}>G</Text>
            <Text style={estilos.encNum}>P</Text>
            <Text style={estilos.encVal}>Ganado</Text>
            <Text style={estilos.encVal}>Perdido</Text>
            <Text style={estilos.encSaldo}>Saldo</Text>
          </View>
          <View style={estilos.lineaDivisoriaEst} />
          {estadisticas.map(est => (
            <View key={est.participanteId} style={estilos.filaEstadistica}>
              <Text style={estilos.nombreEst} numberOfLines={1}>{est.nombre}</Text>
              <Text style={estilos.valNum}>{est.partidasGanadas}</Text>
              <Text style={estilos.valNum}>{est.partidasPerdidas}</Text>
              <Text style={estilos.valDin}>{formatear(est.valoresGanados)}</Text>
              <Text style={estilos.valDin}>{formatear(est.valoresPerdidos)}</Text>
              <Text style={[estilos.valSaldo, { color: colorSaldo(est.saldo) }]}>{formatear(est.saldo)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={estilos.filaBotonesAccion}>
        <TouchableOpacity
          style={[estilos.botonPrincipal, !partidaActiva && estilos.botonDeshabilitado]}
          onPress={abrirModal}
          disabled={!partidaActiva}
        >
          <Ionicons name="flag" size={18} color="#fff" />
          <Text style={estilos.textoBotonPrincipal}>Finalizar Partida</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[estilos.botonVoz, escuchandoVoz && estilos.botonVozActivo, !partidaActiva && estilos.botonDeshabilitado]}
          onPress={alternarEscuchaVoz}
          disabled={!partidaActiva}
        >
          <Ionicons name={escuchandoVoz ? "mic" : "mic-outline"} size={18} color="#fff" />
          <Text style={estilos.textoBotonPrincipal}>{escuchandoVoz ? 'Escuchando...' : 'Comando de Voz'}</Text>
        </TouchableOpacity>
      </View>
      
      {errorVoz && <Text style={estilos.textoErrorVoz}>{errorVoz}</Text>}

      <View style={estilos.filaEncabezado}>
        <Text style={estilos.encabezadoNombre}>Participante</Text>
        <Text style={estilos.encabezadoEstado}>Est</Text>
        <Text style={estilos.encabezadoNumero}>G</Text>
        <Text style={estilos.encabezadoNumero}>P</Text>
        <Text style={estilos.encabezadoValores}>Ganado</Text>
        <Text style={estilos.encabezadoValores}>Perdido</Text>
        <Text style={estilos.encabezadoApuesta}>Apuesta</Text>
        <Text style={estilos.encabezadoAcciones}></Text>
      </View>
      <View style={estilos.lineaSeparacionCabecera} />

      <FlatList
        data={participantes}
        keyExtractor={p => p.participanteId}
        ItemSeparatorComponent={() => <View style={estilos.lineaDivisoria} />}
        style={estilos.listaParticipantes}
        renderItem={({ item: p }) => {
          const esUltimoGanador = 
            ultimaPartida?.estado === 'Ganador' && 
            ultimaPartida?.identificadorGanador === p.participanteId;

          return (
            <View style={[
              estilos.filaParticipante,
              esUltimoGanador && estilos.filaUltimoGanador
            ]}>
              <Text style={[
                estilos.nombreFila,
                esUltimoGanador && estilos.textoUltimoGanador
              ]} numberOfLines={1}>
                {p.nombre}
              </Text>
              <View style={estilos.columnaEstado}>
                <View style={[estilos.puntoIndicador, { backgroundColor: colorEstado(p.estadoEnSesion) }]} />
              </View>
              <Text style={[
                estilos.columnaNumero,
                esUltimoGanador && estilos.textoUltimoGanador
              ]}>{p.partidasGanadas}</Text>
              <Text style={[
                estilos.columnaNumero,
                esUltimoGanador && estilos.textoUltimoGanador
              ]}>{p.partidasPerdidas}</Text>
              <Text style={[
                estilos.columnaValores,
                esUltimoGanador && estilos.textoUltimoGanador
              ]}>{formatear(p.valoresGanados)}</Text>
              <Text style={[
                estilos.columnaValores,
                esUltimoGanador && estilos.textoUltimoGanador
              ]}>{formatear(p.valoresPerdidos)}</Text>
              <Text style={[
                estilos.columnaApuesta,
                p.estadoEnSesion !== 'Activo' && estilos.textoCero,
                esUltimoGanador && estilos.textoUltimoGanador
              ]}>
                {formatear(p.estadoEnSesion === 'Activo' ? sesionBase.valorApuesta : 0)}
              </Text>
              <TouchableOpacity
                style={estilos.botonFila}
                onPress={() => alternarParticipante(p.participanteId)}
                disabled={sesionBase.estado === 'Finalizada'}
              >
                <Text style={estilos.textoBotonFila}>
                  {p.estadoEnSesion === 'Activo' ? 'Susp' : 'React'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <View style={estilos.pieGrilla}>
        <Text style={estilos.textoPieGrilla}>
          Activos: {totalActivos} | Valor por partida: {formatear(valorPorApuesta)}
        </Text>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={estilos.fondoModal}>
          <View style={estilos.contenidoModal}>
            <Text style={estilos.tituloModal}>Finalizar Partida N° {partidaActiva?.numero}</Text>
            <Text style={estilos.subtituloModal}>Seleccione UNA opción tocando la fila</Text>

            <FlatList
              data={filasGrilla}
              keyExtractor={f => f.id}
              style={estilos.listaOpciones}
              renderItem={({ item }) => {
                const seleccionado = filaSeleccionadaId === item.id;
                return (
                  <TouchableOpacity
                    style={[estilos.filaOpcion, seleccionado && estilos.filaSeleccionada]}
                    onPress={() => tocarFila(item.id)}
                  >
                    <Text style={[estilos.textoFila, seleccionado && estilos.textoSeleccionado]}>
                      {seleccionado ? '✅ ' : '   '}{item.etiqueta}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={[estilos.opcionFinalizarSesion, finalizarSesion && estilos.opcionActivaSesion]}
              onPress={() => setFinalizarSesion(prev => !prev)}
            >
              <Ionicons
                name={finalizarSesion ? 'checkbox' : 'square-outline'}
                size={20}
                color={finalizarSesion ? '#FBBF24' : '#94A3B8'}
              />
              <Text style={estilos.textoOpcionFinalizarSesion}>
                Finalizar también la Sesión
              </Text>
            </TouchableOpacity>

            <View style={estilos.filaBotonesModal}>
              <TouchableOpacity style={estilos.botonCancelar} onPress={() => setModalVisible(false)}>
                <Text style={estilos.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={estilos.botonConfirmar} onPress={confirmar}>
                <Text style={estilos.textoConfirmar}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ==============================================================
// ESTILOS
// ==============================================================
const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#0A1629', padding: 12 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  tituloCentro: { alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  tituloPrincipal: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  descripcionSesion: { fontSize: 13, color: '#94A3B8', marginTop: 2, fontStyle: 'italic' },
  subtituloApuesta: { fontSize: 13, color: '#60A5FA', marginTop: 4, fontWeight: '600' },
  etiquetaActiva: { marginTop: 4, backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  textoEtiqueta: { fontSize: 10, color: '#22C55E', fontWeight: '600' },
  etiquetaCerrada: { marginTop: 4, backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  textoEtiquetaCerrada: { fontSize: 10, color: '#EF4444', fontWeight: '600' },
  tarjetaSesion: { backgroundColor: 'rgba(30,64,175,0.15)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(96,165,250,0.25)' },
  etiquetaTarjeta: { fontSize: 12, color: '#94A3B8', marginBottom: 10 },
  filaResumen: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  elementoResumen: { alignItems: 'center', minWidth: 55 },
  valorResumen: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  etiquetaDato: { fontSize: 10, color: '#64748B', marginTop: 2 },
  textoVerificacion: { fontSize: 11, color: '#6B7280', textAlign: 'center', marginBottom: 6, fontStyle: 'italic' },
  lineaResultado: { paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(96,165,250,0.15)', alignItems: 'center', marginTop: 4 },
  textoResultadoFinal: { fontSize: 14, fontWeight: '700', color: '#FBBF24' },
  botonEstadisticas: { flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.5)', borderRadius: 10, paddingVertical: 10, marginBottom: 10 },
  textoBotonEstadisticas: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  tarjetaEstadisticas: { backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  tituloEstadisticas: { fontSize: 14, fontWeight: '700', color: '#818CF8', marginBottom: 10, textAlign: 'center' },
  filaEncabezadoEst: { flexDirection: 'row', paddingBottom: 6 },
  encNom: { flex: 2, fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  encNum: { width: 24, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encVal: { width: 70, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encSaldo: { width: 70, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  lineaDivisoriaEst: { height: 1, backgroundColor: 'rgba(99,102,241,0.2)', marginBottom: 6 },
  filaEstadistica: { flexDirection: 'row', paddingVertical: 6, alignItems: 'center' },
  nombreEst: { flex: 2, fontSize: 12, color: '#FFFFFF' },
  valNum: { width: 24, fontSize: 12, color: '#CBD5E1', textAlign: 'center' },
  valDin: { width: 70, fontSize: 11, color: '#E5E7EB', textAlign: 'center' },
  valSaldo: { width: 70, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  
  filaBotonesAccion: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  botonPrincipal: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(59,130,246,0.5)', borderRadius: 10, paddingVertical: 12 },
  botonVoz: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(139,92,246,0.5)', borderRadius: 10, paddingVertical: 12 },
  botonVozActivo: { backgroundColor: 'rgba(239,68,68,0.6)' },
  botonDeshabilitado: { backgroundColor: 'rgba(100,116,139,0.3)' },
  textoBotonPrincipal: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  textoErrorVoz: { color: '#EF4444', fontSize: 12, textAlign: 'center', marginBottom: 10, fontStyle: 'italic' },
  
  filaEncabezado: { flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 6 },
  encabezadoNombre: { flex: 2, fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  encabezadoEstado: { width: 24, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoNumero: { width: 26, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoValores: { width: 70, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoApuesta: { width: 60, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoAcciones: { width: 50 },
  lineaSeparacionCabecera: { height: 1, backgroundColor: 'rgba(96,165,250,0.3)', marginBottom: 4 },
  listaParticipantes: { flexGrow: 0, marginBottom: 12 },
  filaParticipante: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  nombreFila: { flex: 2, fontSize: 12, color: '#FFFFFF' },
  columnaEstado: { width: 24, alignItems: 'center' },
  puntoIndicador: { width: 7, height: 7, borderRadius: 4 },
  columnaNumero: { width: 26, fontSize: 12, color: '#CBD5E1', textAlign: 'center' },
  columnaValores: { width: 70, fontSize: 11, color: '#E5E7EB', textAlign: 'center' },
  columnaApuesta: { width: 60, fontSize: 11, color: '#22C55E', textAlign: 'center', fontWeight: '600' },
  textoCero: { color: '#6B7280', fontStyle: 'italic' },
  botonFila: { width: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, paddingVertical: 4, alignItems: 'center' },
  textoBotonFila: { fontSize: 10, color: '#E2E8F0' },
  textoDeshabilitado: { color: '#4B5563' },
  pieGrilla: { paddingVertical: 14, paddingHorizontal: 14, backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)', alignItems: 'center' },
  lineaDivisoria: { height: 1, backgroundColor: '#2A3342' },
  textoPieGrilla: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 16 },
  contenidoModal: { backgroundColor: '#0F1E39', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)', maxHeight: '85%' },
  tituloModal: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 4, textAlign: 'center' },
  subtituloModal: { fontSize: 12, color: '#94A3B8', marginBottom: 16, textAlign: 'center' },
  listaOpciones: { marginBottom: 12 },
  filaOpcion: { paddingVertical: 12, paddingHorizontal: 16, marginBottom: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'transparent' },
  filaSeleccionada: { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)' },
  textoFila: { fontSize: 14, color: '#CBD5E1' },
  textoSeleccionado: { color: '#FFFFFF', fontWeight: '700' },
  opcionFinalizarSesion: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', marginTop: 8, marginBottom: 16 },
  opcionActivaSesion: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)' },
  textoOpcionFinalizarSesion: { fontSize: 14, color: '#FBBF24', fontWeight: '600' },
  filaBotonesModal: { flexDirection: 'row', gap: 10 },
  botonCancelar: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  textoCancelar: { color: '#CBD5E1', fontWeight: '600' },
  botonConfirmar: { flex: 1, backgroundColor: 'rgba(34,197,94,0.6)', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  textoConfirmar: { color: '#FFFFFF', fontWeight: '600' },
  filaUltimoGanador: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#FBBF24',
  },
  textoUltimoGanador: {
    color: '#FBBF24',
    fontWeight: '700',
  }
});

export default SesionActiva;