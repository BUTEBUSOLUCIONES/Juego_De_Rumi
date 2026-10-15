// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\SesionActiva.tsx
// Pantalla de Sesión Activa — Versión Completa
// ✅ Desactivar ganador tocando nuevamente
// ✅ Empate y Anulada se ocultan cuando hay ganador
// ✅ Historial por participante registrado
// ✅ Estadísticas integradas
// ✅ Finalizar Sesión → envía datos a ResultadosSesion
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  guardarSesion,
  obtenerParticipantesPorSesion,
  obtenerPartidasPorSesion,
  obtenerSesiones,
  actualizarParticipanteSesion,
  actualizarPartida,
  agregarHistorialParticipante,
  obtenerEstadisticasPorSesion,
  type Sesion,
  type ParticipanteEnSesion,
  type Partida,
  type EstadisticaParticipanteSesion,
} from '../servicios/BaseDatos';

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
    totalApuestas: number;
    estadisticas: EstadisticaParticipanteSesion[];
  };
};

type SesionDatos = {
  numero: number;
  descripcion: string;
  valorApuesta: number;
  estado: 'Activa' | 'Finalizada' | 'Cerrada';
  totalPartidas: number;
  partidasConGanador: number;
  partidasEmpatadas: number;
  partidasAnuladas: number;
  totalApuestas: number;
};

const SesionActiva = ({ route }: { route?: { params?: { numeroSesion?: number } } } = {}) => {
  const numeroSesion = route?.params?.numeroSesion;
  const navegacion = useNavigation<NavigationProp<RutasNavegacion>>();
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState<SesionDatos>({
    numero: numeroSesion ?? 0,
    descripcion: '',
    valorApuesta: 0.5,
    estado: 'Activa',
    totalPartidas: 0,
    partidasConGanador: 0,
    partidasEmpatadas: 0,
    partidasAnuladas: 0,
    totalApuestas: 0,
  });
  const [participantes, setParticipantes] = useState<ParticipanteEnSesion[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticaParticipanteSesion[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [modalPartidaVisible, setModalPartidaVisible] = useState(false);
  const [ganadorSeleccionado, setGanadorSeleccionado] = useState<string | null>(null);
  const [esEmpate, setEsEmpate] = useState(false);
  const [esAnulada, setEsAnulada] = useState(false);
  const [finalizarSesionTambien, setFinalizarSesionTambien] = useState(false);
  const [verEstadisticas, setVerEstadisticas] = useState(false);

  const partidaActiva = useMemo(() =>
    partidas.find(p => p.estado === 'EnCurso'),
    [partidas]
  );

  const participantesActivos = useMemo(() =>
    participantes.filter(p => p.estadoEnSesion === 'Activo'),
    [participantes]
  );

  const totalParticipantesActivos = participantesActivos.length;
  const valorTotalApuestaPartida = totalParticipantesActivos * sesion.valorApuesta;

  const ultimaPartidaFinalizada = useMemo(() =>
    partidas
      .filter(p => p.estado !== 'EnCurso')
      .sort((a, b) => b.numero - a.numero)[0] || null,
    [partidas]
  );

  const textoUltimoResultado = useMemo((): string | null => {
    if (!ultimaPartidaFinalizada) return null;
    if (ultimaPartidaFinalizada.estado === 'Empatada') return 'Última Partida EMPATADA';
    if (ultimaPartidaFinalizada.estado === 'Anulada') return 'Última Partida ANULADA';
    const ganador = participantes.find(p => p.participanteId === ultimaPartidaFinalizada.identificadorGanador);
    return `Último: ${ganador?.nombre || 'Desconocido'} — Ganó $${ultimaPartidaFinalizada.montoGanado?.toFixed(2) || '0.00'}`;
  }, [ultimaPartidaFinalizada, participantes]);

  const cargarDatos = async () => {
    setCargando(true);
    const sesionesGuardadas = await obtenerSesiones();
    let sesionSeleccionada: Sesion | undefined;
    if (numeroSesion) {
      sesionSeleccionada = sesionesGuardadas.find(s => s.numero === numeroSesion);
    } else {
      sesionSeleccionada = sesionesGuardadas
        .filter(s => s.estado === 'Activa')
        .sort((a, b) => b.numero - a.numero)[0];
    }
    if (!sesionSeleccionada) {
      Alert.alert('Sin sesión activa', 'Crea una desde Sesiones.');
      navegacion.navigate('Sesiones');
      return;
    }
    setSesion({
      numero: sesionSeleccionada.numero,
      descripcion: sesionSeleccionada.descripcion,
      valorApuesta: sesionSeleccionada.valorApuestaBase,
      estado: sesionSeleccionada.estado === 'Finalizada' ? 'Finalizada' : 'Activa',
      totalPartidas: 0,
      partidasConGanador: 0,
      partidasEmpatadas: 0,
      partidasAnuladas: 0,
      totalApuestas: 0,
    });
    const participantesSesion = await obtenerParticipantesPorSesion(sesionSeleccionada.numero);
    setParticipantes(participantesSesion);
    const partidasSesion = await obtenerPartidasPorSesion(sesionSeleccionada.numero);
    setPartidas(partidasSesion);
    setSesion(anterior => ({
      ...anterior,
      totalPartidas: partidasSesion.filter(p => p.estado !== 'EnCurso').length,
      partidasConGanador: partidasSesion.filter(p => p.estado === 'Finalizada').length,
      partidasEmpatadas: partidasSesion.filter(p => p.estado === 'Empatada').length,
      partidasAnuladas: partidasSesion.filter(p => p.estado === 'Anulada').length,
      totalApuestas: partidasSesion.filter(p => p.estado === 'Finalizada').reduce((suma, p) => suma + (p.montoGanado || 0), 0),
    }));
    setEstadisticas(await obtenerEstadisticasPorSesion(sesionSeleccionada.numero));
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [numeroSesion, navegacion]);

  useEffect(() => {
    const crearSiguiente = async () => {
      if (!partidaActiva && participantesActivos.length >= 3 && sesion.estado === 'Activa') {
        const nueva: Partida = {
          identificador: `partida-${Date.now()}`,
          numeroSesion: sesion.numero,
          numero: sesion.totalPartidas + 1,
          estado: 'EnCurso',
          montoGanado: 0,
          fechaHoraInicio: new Date().toISOString(),
        };
        setPartidas(anterior => [...anterior, nueva]);
      }
    };
    crearSiguiente();
  }, [partidaActiva, participantesActivos.length, sesion.numero, sesion.totalPartidas, sesion.estado]);

  const alternarEstadoParticipante = async (id: string) => {
    const participante = participantes.find(p => p.participanteId === id);
    if (!participante) return;
    if (participante.estadoEnSesion === 'Activo') {
      if (participantesActivos.length <= 3) {
        Alert.alert('No permitido', 'Mínimo 3 participantes activos.');
        return;
      }
      await actualizarParticipanteSesion(sesion.numero, id, { estadoEnSesion: 'Suspendido' });
      setParticipantes(anterior => anterior.map(p =>
        p.participanteId === id ? { ...p, estadoEnSesion: 'Suspendido' as const } : p
      ));
    } else {
      await actualizarParticipanteSesion(sesion.numero, id, { estadoEnSesion: 'Activo' });
      setParticipantes(anterior => anterior.map(p =>
        p.participanteId === id ? { ...p, estadoEnSesion: 'Activo' as const } : p
      ));
    }
    setEstadisticas(await obtenerEstadisticasPorSesion(sesion.numero));
  };

  const abrirModalFinalizar = () => {
    if (!partidaActiva) { Alert.alert('Sin partida en curso'); return; }
    setGanadorSeleccionado(null);
    setEsEmpate(false);
    setEsAnulada(false);
    setFinalizarSesionTambien(false);
    setModalPartidaVisible(true);
  };

  const seleccionarEmpate = () => {
    if (ganadorSeleccionado) return;
    setEsEmpate(anterior => !anterior);
    setEsAnulada(false);
  };

  const seleccionarAnulada = () => {
    if (ganadorSeleccionado) return;
    setEsAnulada(anterior => !anterior);
    setEsEmpate(false);
  };

  const seleccionarGanador = (participanteId: string) => {
    if (ganadorSeleccionado === participanteId) {
      setGanadorSeleccionado(null);
    } else {
      setGanadorSeleccionado(participanteId);
      setEsEmpate(false);
      setEsAnulada(false);
    }
  };

  const alternarFinalizarSesion = () => {
    setFinalizarSesionTambien(anterior => !anterior);
  };

  const confirmarFinalizarPartida = async () => {
    if (!partidaActiva) return;

    const conteoActivos = (esEmpate ? 1 : 0) + (esAnulada ? 1 : 0) + (ganadorSeleccionado ? 1 : 0);
    if (conteoActivos === 0) {
      Alert.alert(
        'Dato requerido',
        'Seleccione UNA opción:\n• Empate\n• Anulada\n• Un participante Ganador'
      );
      return;
    }
    if (conteoActivos > 1) {
      Alert.alert('Una sola opción', 'No puede combinar dos o más.');
      return;
    }

    const valorApuesta = sesion.valorApuesta;
    const cantidadActivos = participantesActivos.length;
    const ahora = new Date().toISOString();

    let estadoPartida: 'Finalizada' | 'Empatada' | 'Anulada';
    let montoGanadoPorGanador = 0;

    if (esEmpate) {
      estadoPartida = 'Empatada';
      montoGanadoPorGanador = 0;
    } else if (esAnulada) {
      estadoPartida = 'Anulada';
      montoGanadoPorGanador = 0;
    } else {
      estadoPartida = 'Finalizada';
      montoGanadoPorGanador = valorApuesta * (cantidadActivos - 1);
    }

    await actualizarPartida(partidaActiva.identificador!, {
      estado: estadoPartida,
      identificadorGanador: estadoPartida === 'Finalizada' ? ganadorSeleccionado! : undefined,
      montoGanado: montoGanadoPorGanador,
      fechaHoraFinalizacion: ahora,
    });

    setPartidas(anterior => anterior.map(p =>
      p.identificador === partidaActiva.identificador
        ? {
            ...p,
            estado: estadoPartida,
            identificadorGanador: estadoPartida === 'Finalizada' ? ganadorSeleccionado! : undefined,
            montoGanado: montoGanadoPorGanador,
            fechaHoraFinalizacion: ahora,
          }
        : p
    ));

    if (estadoPartida === 'Finalizada') {
      for (const p of participantesActivos) {
        const esGanador = p.participanteId === ganadorSeleccionado;
        await actualizarParticipanteSesion(sesion.numero, p.participanteId, {
          partidasGanadas: p.partidasGanadas + (esGanador ? 1 : 0),
          partidasPerdidas: p.partidasPerdidas + (esGanador ? 0 : 1),
          valoresGanados: p.valoresGanados + (esGanador ? montoGanadoPorGanador : 0),
          valoresPerdidos: p.valoresPerdidos + (esGanador ? 0 : valorApuesta),
        });
        await agregarHistorialParticipante(p.participanteId, {
          numeroSesion: sesion.numero,
          numeroPartida: partidaActiva.numero,
          fechaHora: ahora,
          tipoResultado: esGanador ? 'Ganó' : 'Perdió',
          monto: esGanador ? montoGanadoPorGanador : -valorApuesta,
        });
      }
    } else if (estadoPartida === 'Empatada') {
      for (const p of participantesActivos) {
        await agregarHistorialParticipante(p.participanteId, {
          numeroSesion: sesion.numero,
          numeroPartida: partidaActiva.numero,
          fechaHora: ahora,
          tipoResultado: 'Empató',
          monto: 0,
        });
      }
    } else if (estadoPartida === 'Anulada') {
      for (const p of participantesActivos) {
        await agregarHistorialParticipante(p.participanteId, {
          numeroSesion: sesion.numero,
          numeroPartida: partidaActiva.numero,
          fechaHora: ahora,
          tipoResultado: 'Anulada',
          monto: 0,
        });
      }
    }

    const participantesActualizados = await obtenerParticipantesPorSesion(sesion.numero);
    setParticipantes(participantesActualizados);
    const estadisticasActualizadas = await obtenerEstadisticasPorSesion(sesion.numero);
    setEstadisticas(estadisticasActualizadas);

    const sesionActualizada = {
      ...sesion,
      totalPartidas: sesion.totalPartidas + 1,
      partidasConGanador: sesion.partidasConGanador + (estadoPartida === 'Finalizada' ? 1 : 0),
      partidasEmpatadas: sesion.partidasEmpatadas + (estadoPartida === 'Empatada' ? 1 : 0),
      partidasAnuladas: sesion.partidasAnuladas + (estadoPartida === 'Anulada' ? 1 : 0),
      totalApuestas: sesion.totalApuestas + (estadoPartida === 'Finalizada' ? valorApuesta * cantidadActivos : 0),
    };

    setSesion(sesionActualizada);
    setModalPartidaVisible(false);

    if (finalizarSesionTambien) {
      const sesiones = await obtenerSesiones();
      const sesionEnLista = sesiones.find(s => s.numero === sesion.numero);
      if (sesionEnLista) {
        sesionEnLista.estado = 'Finalizada';
        await guardarSesion(sesionEnLista);
      }
      // ✅ Navegar a Resultados con TODOS los datos
      navegacion.navigate('ResultadosSesion', {
        numeroSesion: sesion.numero,
        descripcion: sesion.descripcion,
        valorApuesta: sesion.valorApuesta,
        totalPartidas: sesionActualizada.totalPartidas,
        partidasConGanador: sesionActualizada.partidasConGanador,
        partidasEmpatadas: sesionActualizada.partidasEmpatadas,
        partidasAnuladas: sesionActualizada.partidasAnuladas,
        totalApuestas: sesionActualizada.totalApuestas,
        estadisticas: estadisticasActualizadas,
      });
      return;
    }

    setTimeout(() => {
      const numeroSiguiente = sesionActualizada.totalPartidas + 1;
      const nueva: Partida = {
        identificador: `partida-${Date.now()}`,
        numeroSesion: sesion.numero,
        numero: numeroSiguiente,
        estado: 'EnCurso',
        montoGanado: 0,
        fechaHoraInicio: new Date().toISOString(),
      };
      setPartidas(anterior => [...anterior, nueva]);
      Alert.alert('Partida registrada ✅', `Siguiente: Nº ${numeroSiguiente}`);
    }, 400);
  };

  const cerrarSesion = async () => {
    if (partidaActiva) {
      Alert.alert('No se puede cerrar', 'Finalice la partida primero.');
      return;
    }
    Alert.alert('Cerrar Sesión', '¿Confirmar cierre y volver al Menú Principal?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar', style: 'destructive', onPress: async () => {
          const sesiones = await obtenerSesiones();
          const sesionActual = sesiones.find(s => s.numero === sesion.numero);
          if (sesionActual) {
            sesionActual.estado = 'Finalizada';
            await guardarSesion(sesionActual);
          }
          setSesion(anterior => ({ ...anterior, estado: 'Finalizada' }));
          Alert.alert('Sesión cerrada ✅', '', [{ text: 'Aceptar', onPress: () => navegacion.navigate('Inicio') }]);
        },
      },
    ]);
  };

  const formatearMonto = (v: number) => `${v >= 0 ? '$' : '-$'}${Math.abs(v).toFixed(2)}`;
  const colorEstado = (e: string) => e === 'Activo' ? '#22C55E' : '#F59E0B';
  const colorSaldo = (saldo: number) => saldo > 0 ? '#22C55E' : saldo < 0 ? '#EF4444' : '#94A3B8';
  const valorApuestaFila = (e: string) => e === 'Activo' ? sesion.valorApuesta : 0;

  if (cargando) return <View style={estilos.pantalla}><Text style={{color:'#fff',textAlign:'center',marginTop:40}}>Cargando...</Text></View>;

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navegacion.navigate('Sesiones')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={estilos.tituloCentro}>
          <Text style={estilos.tituloPrincipal}>Sesión: {sesion.numero}</Text>
          <Text style={estilos.descripcionSesion} numberOfLines={1}>{sesion.descripcion || 'Sin descripción'}</Text>
          <Text style={estilos.subtituloApuesta}>Apuesta: {formatearMonto(sesion.valorApuesta)}</Text>
          {partidaActiva && <View style={estilos.etiquetaActiva}><Text style={estilos.textoEtiqueta}>Partida {partidaActiva.numero} en curso</Text></View>}
          {sesion.estado === 'Finalizada' && <View style={estilos.etiquetaCerrada}><Text style={estilos.textoEtiquetaCerrada}>Sesión Cerrada</Text></View>}
        </View>
        <TouchableOpacity onPress={cerrarSesion} disabled={sesion.estado === 'Finalizada'}>
          <Ionicons name="log-out" size={22} color={sesion.estado === 'Finalizada' ? '#4B5563' : '#EF4444'} />
        </TouchableOpacity>
      </View>

      <View style={estilos.tarjetaSesion}>
        <Text style={estilos.etiquetaTarjeta}>Resumen de Sesión</Text>
        <View style={estilos.filaResumen}>
          <View style={estilos.elementoResumen}><Text style={estilos.valorResumen}>{sesion.totalPartidas}</Text><Text style={estilos.etiquetaDato}>Partidas</Text></View>
          <View style={estilos.elementoResumen}><Text style={estilos.valorResumen}>{sesion.partidasConGanador}</Text><Text style={estilos.etiquetaDato}>Ganadas</Text></View>
          <View style={estilos.elementoResumen}><Text style={estilos.valorResumen}>{sesion.partidasEmpatadas}</Text><Text style={estilos.etiquetaDato}>Empates</Text></View>
          <View style={estilos.elementoResumen}><Text style={estilos.valorResumen}>{sesion.partidasAnuladas}</Text><Text style={estilos.etiquetaDato}>Anuladas</Text></View>
          <View style={estilos.elementoResumen}><Text style={estilos.valorResumen}>{formatearMonto(sesion.totalApuestas)}</Text><Text style={estilos.etiquetaDato}>Total</Text></View>
        </View>
        {textoUltimoResultado && <View style={estilos.lineaResultado}><Text style={estilos.textoResultadoFinal}>{textoUltimoResultado}</Text></View>}
      </View>

      <TouchableOpacity
        style={estilos.botonEstadisticas}
        onPress={() => setVerEstadisticas(!verEstadisticas)}
      >
        <Ionicons name={verEstadisticas ? 'bar-chart' : 'bar-chart-outline'} size={18} color="#fff" />
        <Text style={estilos.textoBotonEstadisticas}>
          {verEstadisticas ? 'Ocultar Estadísticas' : 'Ver Estadísticas'}
        </Text>
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
              <Text style={estilos.valDin}>{formatearMonto(est.valoresGanados)}</Text>
              <Text style={estilos.valDin}>{formatearMonto(est.valoresPerdidos)}</Text>
              <Text style={[estilos.valSaldo, { color: colorSaldo(est.saldo) }]}>
                {formatearMonto(est.saldo)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[estilos.botonPrincipal, !partidaActiva && estilos.botonDeshabilitado]}
        onPress={abrirModalFinalizar}
        disabled={!partidaActiva}
      >
        <Ionicons name="flag" size={18} color="#fff" />
        <Text style={estilos.textoBotonPrincipal}>Finalizar Partida</Text>
      </TouchableOpacity>

      <View style={estilos.filaEncabezado}>
        <Text style={estilos.encabezadoNombre}>Participante</Text>
        <Text style={estilos.encabezadoEstado}>Est</Text>
        <Text style={estilos.encabezadoNumero}>G</Text>
        <Text style={estilos.encabezadoNumero}>P</Text>
        <Text style={estilos.encabezadoApuesta}>Apuesta</Text>
        <Text style={estilos.encabezadoAcciones}></Text>
      </View>
      <View style={estilos.lineaSeparacionCabecera} />

      <FlatList
        data={participantes}
        keyExtractor={p => p.participanteId}
        ItemSeparatorComponent={() => <View style={estilos.lineaDivisoria} />}
        style={estilos.listaParticipantes}
        renderItem={({ item: p }) => (
          <View style={estilos.filaParticipante}>
            <Text style={estilos.nombreFila} numberOfLines={1}>{p.nombre}</Text>
            <View style={estilos.columnaEstado}><View style={[estilos.puntoIndicador, { backgroundColor: colorEstado(p.estadoEnSesion) }]} /></View>
            <Text style={estilos.columnaNumero}>{p.partidasGanadas}</Text>
            <Text style={estilos.columnaNumero}>{p.partidasPerdidas}</Text>
            <Text style={[estilos.columnaApuesta, p.estadoEnSesion !== 'Activo' && estilos.textoCero]}>
              {formatearMonto(valorApuestaFila(p.estadoEnSesion))}
            </Text>
            <TouchableOpacity
              style={estilos.botonFila}
              onPress={() => alternarEstadoParticipante(p.participanteId)}
              disabled={sesion.estado === 'Finalizada'}
            >
              <Text style={[estilos.textoBotonFila, sesion.estado === 'Finalizada' && estilos.textoDeshabilitado]}>
                {p.estadoEnSesion === 'Activo' ? 'Susp' : 'React'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={estilos.pieGrilla}>
        <Text style={estilos.textoPieGrilla}>
          Activos: {totalParticipantesActivos} | Total Apuesta: {formatearMonto(valorTotalApuestaPartida)}
        </Text>
      </View>

      <Modal visible={modalPartidaVisible} transparent animationType="fade" onRequestClose={() => setModalPartidaVisible(false)}>
        <View style={estilos.fondoModal}>
          <ScrollView contentContainerStyle={estilos.contenidoModal}>
            <Text style={estilos.tituloModal}>Finalizar Partida N° {partidaActiva?.numero}</Text>

            {!ganadorSeleccionado && (
              <>
                <TouchableOpacity
                  style={[estilos.opcionGeneral, esEmpate && estilos.opcionActiva]}
                  onPress={seleccionarEmpate}
                >
                  <Ionicons
                    name={esEmpate ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={esEmpate ? '#22C55E' : '#94A3B8'}
                  />
                  <Text style={estilos.textoOpcion}>
                    Empate {esEmpate ? '(tocar para desactivar)' : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[estilos.opcionGeneral, esAnulada && estilos.opcionActiva]}
                  onPress={seleccionarAnulada}
                >
                  <Ionicons
                    name={esAnulada ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={esAnulada ? '#EF4444' : '#94A3B8'}
                  />
                  <Text style={estilos.textoOpcion}>
                    Anulada {esAnulada ? '(tocar para desactivar)' : ''}
                  </Text>
                </TouchableOpacity>

                <View style={estilos.separadorOpciones}>
                  <Text style={estilos.textoSeparador}>— o —</Text>
                </View>
              </>
            )}

            <Text style={estilos.etiquetaSeleccion}>
              {ganadorSeleccionado
                ? 'Ganador seleccionado — toca de nuevo para desactivar'
                : 'Seleccione ganador:'}
            </Text>

            {participantesActivos.map(p => (
              <TouchableOpacity
                key={p.participanteId}
                style={[estilos.opcionGanador, ganadorSeleccionado === p.participanteId && estilos.opcionActiva]}
                onPress={() => seleccionarGanador(p.participanteId)}
              >
                <Ionicons
                  name={ganadorSeleccionado === p.participanteId ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={ganadorSeleccionado === p.participanteId ? '#22C55E' : '#94A3B8'}
                />
                <Text style={estilos.nombreOpcion}>
                  {p.nombre}
                  {ganadorSeleccionado === p.participanteId && ' (tocar para desactivar)'}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[estilos.opcionFinalizarSesion, finalizarSesionTambien && estilos.opcionActivaSesion]}
              onPress={alternarFinalizarSesion}
            >
              <Ionicons
                name={finalizarSesionTambien ? 'checkbox' : 'square-outline'}
                size={20}
                color={finalizarSesionTambien ? '#FBBF24' : '#94A3B8'}
              />
              <Text style={estilos.textoOpcionFinalizarSesion}>
                Finalizar también la Sesión {finalizarSesionTambien ? '(tocar para desactivar)' : ''}
              </Text>
            </TouchableOpacity>

            <View style={estilos.filaBotonesModal}>
              <TouchableOpacity style={estilos.botonCancelar} onPress={() => setModalPartidaVisible(false)}>
                <Text style={estilos.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={estilos.botonConfirmar} onPress={confirmarFinalizarPartida}>
                <Text style={estilos.textoConfirmar}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

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
  filaResumen: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  elementoResumen: { alignItems: 'center', minWidth: 50 },
  valorResumen: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  etiquetaDato: { fontSize: 10, color: '#64748B', marginTop: 2 },
  lineaResultado: { paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(96,165,250,0.15)', alignItems: 'center' },
  textoResultadoFinal: { fontSize: 14, fontWeight: '700', color: '#FBBF24' },
  botonEstadisticas: { flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.5)', borderRadius: 10, paddingVertical: 10, marginBottom: 10 },
  textoBotonEstadisticas: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  tarjetaEstadisticas: { backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  tituloEstadisticas: { fontSize: 14, fontWeight: '700', color: '#818CF8', marginBottom: 10, textAlign: 'center' },
  filaEncabezadoEst: { flexDirection: 'row', paddingBottom: 6 },
  encNom: { flex: 2.2, fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  encNum: { width: 24, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encVal: { width: 65, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encSaldo: { width: 70, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  lineaDivisoriaEst: { height: 1, backgroundColor: 'rgba(99,102,241,0.2)', marginBottom: 6 },
  filaEstadistica: { flexDirection: 'row', paddingVertical: 6, alignItems: 'center' },
  nombreEst: { flex: 2.2, fontSize: 12, color: '#FFFFFF' },
  valNum: { width: 24, fontSize: 12, color: '#CBD5E1', textAlign: 'center' },
  valDin: { width: 65, fontSize: 11, color: '#E5E7EB', textAlign: 'center' },
  valSaldo: { width: 70, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  botonPrincipal: { flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(59,130,246,0.5)', borderRadius: 10, paddingVertical: 12, marginBottom: 14 },
  botonDeshabilitado: { backgroundColor: 'rgba(100,116,139,0.3)' },
  textoBotonPrincipal: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  filaEncabezado: { flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 4 },
  encabezadoNombre: { flex: 2.5, fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  encabezadoEstado: { width: 24, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoNumero: { width: 26, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoApuesta: { width: 75, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encabezadoAcciones: { width: 55 },
  lineaSeparacionCabecera: { height: 1, backgroundColor: 'rgba(96,165,250,0.3)', marginBottom: 4 },
  listaParticipantes: { flexGrow: 0, marginBottom: 12 },
  filaParticipante: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  nombreFila: { flex: 2.5, fontSize: 12, color: '#FFFFFF' },
  columnaEstado: { width: 24, alignItems: 'center' },
  puntoIndicador: { width: 7, height: 7, borderRadius: 4 },
  columnaNumero: { width: 26, fontSize: 12, color: '#CBD5E1', textAlign: 'center' },
  columnaApuesta: { width: 75, fontSize: 12, color: '#22C55E', textAlign: 'center', fontWeight: '600' },
  textoCero: { color: '#6B7280', fontStyle: 'italic' },
  botonFila: { width: 55, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, paddingVertical: 4, alignItems: 'center' },
  textoBotonFila: { fontSize: 10, color: '#E2E8F0' },
  textoDeshabilitado: { color: '#4B5563' },
  pieGrilla: { paddingVertical: 14, paddingHorizontal: 14, backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)', alignItems: 'center' },
  lineaDivisoria: { height: 1, backgroundColor: '#2A3342' },
  textoPieGrilla: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 16 },
  contenidoModal: { backgroundColor: '#0F1E39', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  tituloModal: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },
  opcionGeneral: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 8 },
  opcionActiva: { backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' },
  textoOpcion: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  separadorOpciones: { alignItems: 'center', marginVertical: 8 },
  textoSeparador: { fontSize: 12, color: '#64748B' },
  etiquetaSeleccion: { fontSize: 12, color: '#94A3B8', marginBottom: 8, textAlign: 'center' },
  opcionGanador: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  nombreOpcion: { fontSize: 13, color: '#FFFFFF' },
  opcionFinalizarSesion: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)', marginTop: 12, marginBottom: 8 },
  opcionActivaSesion: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.4)' },
  textoOpcionFinalizarSesion: { fontSize: 14, color: '#FBBF24', fontWeight: '600' },
  filaBotonesModal: { flexDirection: 'row', gap: 10, marginTop: 16 },
  botonCancelar: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  textoCancelar: { color: '#CBD5E1', fontWeight: '600' },
  botonConfirmar: { flex: 1, backgroundColor: 'rgba(34,197,94,0.6)', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  textoConfirmar: { color: '#FFFFFF', fontWeight: '600' },
});

export default SesionActiva;