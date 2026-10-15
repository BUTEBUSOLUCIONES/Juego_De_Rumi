// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\Estadisticas.tsx
// ESTADÍSTICAS CON GRÁFICOS — Versión sin dependencias externas
// Cada gráfico muestra: Nombre + Cantidad + Valor | Solo sesiones Finalizadas
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  obtenerEstadisticasPorSesion,
  obtenerSesiones,
  type Sesion,
} from '../servicios/BaseDatos';

type RutasNavegacion = { Inicio: undefined };
type ModoFiltro = 'mes' | 'anio' | 'todos';

type DatoParticipante = {
  participanteId: string;
  nombre: string;
  cantidadGanadas: number;
  valorGanado: number;
  cantidadPerdidas: number;
  valorPerdido: number;
  saldo: number;
};

type ResumenPeriodo = {
  totalSesiones: number;
  totalPartidas: number;
  totalGanadas: number;
  totalPerdidas: number;
  montoGanadoGeneral: number;
  montoPerdidoGeneral: number;
  participantes: number;
};

const { width } = Dimensions.get('window');
const colores = ['#FBBF24', '#22D3EE', '#C084FC', '#34D399', '#F87171', '#60A5FA'];
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const Estadisticas = () => {
  const navegacion = useNavigation<NavigationProp<RutasNavegacion>>();
  const ahora = new Date();
  
  const [cargando, setCargando] = useState(true);
  const [modoFiltro, setModoFiltro] = useState<ModoFiltro>('mes');
  const [mesSeleccionado, setMesSeleccionado] = useState(ahora.getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(ahora.getFullYear());
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);
  const [modoVisualizacion, setModoVisualizacion] = useState<'todos' | 'ganadores'>('todos');
  const [datos, setDatos] = useState<DatoParticipante[]>([]);
  const [resumen, setResumen] = useState<ResumenPeriodo>({
    totalSesiones: 0, totalPartidas: 0, totalGanadas: 0, totalPerdidas: 0,
    montoGanadoGeneral: 0, montoPerdidoGeneral: 0, participantes: 0,
  });
  const [mensaje, setMensaje] = useState('');

  const formatearValor = (v: number) => `$${v.toFixed(2)}`;
  const colorSaldo = (s: number) => s > 0 ? '#22C55E' : s < 0 ? '#EF4444' : '#94A3B8';

  const parsearFecha = (texto: string) => {
    const soloFecha = texto.split(' ')[0];
    const [d, m, a] = soloFecha.split('-').map(Number);
    return new Date(a, m - 1, d);
  };

  const cargarAniosDisponibles = async () => {
    const todas = await obtenerSesiones();
    const anios = new Set<number>();
    todas.forEach(s => {
      if (s.estado === 'Finalizada' && s.fechaHora) {
        anios.add(parsearFecha(s.fechaHora).getFullYear());
      }
    });
    const lista = Array.from(anios).sort((a, b) => b - a);
    setAniosDisponibles(lista);
    if (lista.length > 0 && !lista.includes(anioSeleccionado)) {
      setAnioSeleccionado(lista[0]);
    }
  };

  const filtrarSesiones = (todas: Sesion[]) => {
    return todas.filter(s => {
      if (s.estado !== 'Finalizada' || !s.fechaHora) return false;
      const fecha = parsearFecha(s.fechaHora);
      switch (modoFiltro) {
        case 'mes': return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
        case 'anio': return fecha.getFullYear() === anioSeleccionado;
        case 'todos': return true;
      }
    });
  };

  const cargarDatos = async () => {
    setCargando(true);
    setMensaje('Cargando...');
    try {
      const todasSesiones = await obtenerSesiones();
      const sesionesFiltradas = filtrarSesiones(todasSesiones);
      
      if (sesionesFiltradas.length === 0) {
        setDatos([]);
        setResumen({
          totalSesiones: 0, totalPartidas: 0, totalGanadas: 0, totalPerdidas: 0,
          montoGanadoGeneral: 0, montoPerdidoGeneral: 0, participantes: 0,
        });
        setMensaje('Sin datos para este período');
        setCargando(false);
        return;
      }

      const mapa = new Map<string, DatoParticipante>();
      let totalGanadas = 0, totalPerdidas = 0;
      let montoGanadoTotal = 0, montoPerdidoTotal = 0;

      for (const sesion of sesionesFiltradas) {
        const estadisticas = await obtenerEstadisticasPorSesion(sesion.numero);
        for (const est of estadisticas) {
          const p = mapa.get(est.participanteId) || {
            participanteId: est.participanteId,
            nombre: est.nombre,
            cantidadGanadas: 0, valorGanado: 0,
            cantidadPerdidas: 0, valorPerdido: 0, saldo: 0,
          };
          p.cantidadGanadas += est.partidasGanadas;
          p.valorGanado += est.valoresGanados;
          p.cantidadPerdidas += est.partidasPerdidas;
          p.valorPerdido += est.valoresPerdidos;
          p.saldo = p.valorGanado - p.valorPerdido;
          mapa.set(est.participanteId, p);
        }
        const cant = estadisticas.length || 1;
        totalGanadas += estadisticas.reduce((s, p) => s + p.partidasGanadas, 0) / cant;
        totalPerdidas += estadisticas.reduce((s, p) => s + p.partidasPerdidas, 0) / cant;
        montoGanadoTotal += estadisticas.reduce((s, p) => s + p.valoresGanados, 0);
        montoPerdidoTotal += estadisticas.reduce((s, p) => s + p.valoresPerdidos, 0);
      }

      let resultado = Array.from(mapa.values());
      if (modoVisualizacion === 'ganadores') resultado = resultado.filter(p => p.saldo > 0);
      resultado.sort((a, b) => b.saldo - a.saldo);

      setDatos(resultado);
      setResumen({
        totalSesiones: sesionesFiltradas.length,
        totalPartidas: Math.round(totalGanadas + totalPerdidas),
        totalGanadas: Math.round(totalGanadas),
        totalPerdidas: Math.round(totalPerdidas),
        montoGanadoGeneral: montoGanadoTotal,
        montoPerdidoGeneral: montoPerdidoTotal,
        participantes: resultado.length,
      });
      
      const etiqueta = modoFiltro === 'mes' ? `${meses[mesSeleccionado]} ${anioSeleccionado}`
        : modoFiltro === 'anio' ? `Año ${anioSeleccionado}` : 'Todos los períodos';
      setMensaje(`✅ ${etiqueta} — ${sesionesFiltradas.length} sesiones | ${resultado.length} participantes`);
    } catch (error) {
      setMensaje(`Error: ${error}`);
    }
    setCargando(false);
  };

  useEffect(() => { cargarAniosDisponibles(); }, []);
  useEffect(() => {
    if (aniosDisponibles.length > 0 && !aniosDisponibles.includes(anioSeleccionado)) {
      setAnioSeleccionado(aniosDisponibles[0]);
    }
    cargarDatos();
  }, [modoFiltro, mesSeleccionado, anioSeleccionado, modoVisualizacion, aniosDisponibles]);

  // Componente de gráfico completo con Nombre + Cantidad + Valor
  const GraficoCompleto = ({ 
    titulo, 
    datosLista, 
    colorBase,
    campoCantidad,
    campoValor,
  }: { 
    titulo: string; 
    datosLista: DatoParticipante[]; 
    colorBase: string;
    campoCantidad: 'cantidadGanadas' | 'cantidadPerdidas';
    campoValor: 'valorGanado' | 'valorPerdido';
  }) => {
    const maxCantidad = datosLista.length > 0 ? Math.max(...datosLista.map(d => d[campoCantidad])) : 1;
    
    return (
      <View style={estilos.tarjetaGrafico}>
        <Text style={estilos.tituloGrafico}>{titulo}</Text>
        
        {/* Barras */}
        <View style={estilos.contenedorBarras}>
          {datosLista.map((d, i) => (
            <View key={d.participanteId} style={estilos.filaBarra}>
              <Text style={estilos.nombreParticipante} numberOfLines={1}>
                {d.nombre.length > 9 ? d.nombre.substring(0, 9) + '…' : d.nombre}
              </Text>
              <View style={estilos.fondoBarra}>
                <View
                  style={[
                    estilos.rellenoBarra,
                    {
                      width: `${Math.max((d[campoCantidad] / maxCantidad) * 100, 8)}%`,
                      backgroundColor: colorBase === 'multicolor' ? colores[i % colores.length] : colorBase,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Tabla de datos: Nombre | Cantidad | Valor */}
        <View style={estilos.tablaDatos}>
          <View style={estilos.encabezadoTabla}>
            <Text style={estilos.encNombre}>Participante</Text>
            <Text style={estilos.encCant}>Cantidad</Text>
            <Text style={estilos.encValor}>Valor</Text>
          </View>
          {datosLista.map((d, i) => (
            <View key={d.participanteId} style={estilos.filaTabla}>
              <Text style={[estilos.datNombre, {color: colorBase === 'multicolor' ? colores[i % colores.length] : colorBase}]} numberOfLines={1}>
                {d.nombre}
              </Text>
              <Text style={estilos.datCant}>{d[campoCantidad]}</Text>
              <Text style={estilos.datValor}>{formatearValor(d[campoValor])}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Datos para cada gráfico — Top 6 ordenados
  const topGanadoresCant = [...datos].sort((a, b) => b.cantidadGanadas - a.cantidadGanadas).slice(0, 6);
  const topGanadoresVal = [...datos].sort((a, b) => b.valorGanado - a.valorGanado).slice(0, 6);
  const topPerdedoresCant = [...datos].sort((a, b) => b.cantidadPerdidas - a.cantidadPerdidas).slice(0, 6);
  const topPerdedoresVal = [...datos].sort((a, b) => b.valorPerdido - a.valorPerdido).slice(0, 6);

  if (cargando) {
    return (
      <View style={estilos.pantalla}>
        <ActivityIndicator size="large" color="#22C55E" style={{marginTop: 60}} />
        <Text style={estilos.textoMensaje}>{mensaje}</Text>
      </View>
    );
  }

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.cabecera}>
        <TouchableOpacity onPress={() => navegacion.navigate('Inicio')}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={estilos.titulo}>Estadísticas</Text>
        <TouchableOpacity onPress={cargarDatos}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={estilos.contenedor}>
        <Text style={estilos.textoMensaje}>{mensaje}</Text>

        {/* 🔘 FILTRO */}
        <View style={estilos.tarjeta}>
          <Text style={estilos.etiqueta}>Filtrar por</Text>
          <View style={estilos.filaModoFiltro}>
            {[
              { valor: 'mes' as ModoFiltro, etiqueta: 'Mes' },
              { valor: 'anio' as ModoFiltro, etiqueta: 'Año' },
              { valor: 'todos' as ModoFiltro, etiqueta: 'Todos' },
            ].map(op => (
              <TouchableOpacity
                key={op.valor}
                style={[estilos.botonFiltro, modoFiltro === op.valor && estilos.botonFiltroActivo]}
                onPress={() => setModoFiltro(op.valor)}
              >
                <Text style={[estilos.textoFiltro, modoFiltro === op.valor && estilos.textoFiltroActivo]}>
                  {op.etiqueta}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 📅 Mes + Año */}
        {modoFiltro === 'mes' && (
          <View style={estilos.tarjeta}>
            <Text style={estilos.etiqueta}>Mes y Año</Text>
            <View style={estilos.filaFiltro}>
              <TouchableOpacity onPress={() => setMesSeleccionado(p => p === 0 ? 11 : p - 1)}>
                <Ionicons name="chevron-back" size={20} color="#CBD5E1" />
              </TouchableOpacity>
              <View style={estilos.valorCentral}>
                <Text style={estilos.textoMes}>{meses[mesSeleccionado]}</Text>
                <View style={{flexDirection: 'row', gap: 20}}>
                  <TouchableOpacity onPress={() => setAnioSeleccionado(p => p - 1)}>
                    <Text style={estilos.flechaTexto}>←</Text>
                  </TouchableOpacity>
                  <Text style={estilos.textoAnio}>{anioSeleccionado}</Text>
                  <TouchableOpacity onPress={() => setAnioSeleccionado(p => p + 1)}>
                    <Text style={estilos.flechaTexto}>→</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => setMesSeleccionado(p => p === 11 ? 0 : p + 1)}>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 📅 Solo Año */}
        {modoFiltro === 'anio' && (
          <View style={estilos.tarjeta}>
            <Text style={estilos.etiqueta}>Año</Text>
            <View style={estilos.filaFiltro}>
              <TouchableOpacity
                onPress={() => {
                  const idx = aniosDisponibles.indexOf(anioSeleccionado);
                  if (idx < aniosDisponibles.length - 1) setAnioSeleccionado(aniosDisponibles[idx + 1]);
                }}
              >
                <Ionicons name="chevron-back" size={20} color={aniosDisponibles.indexOf(anioSeleccionado) < aniosDisponibles.length - 1 ? '#CBD5E1' : '#374151'} />
              </TouchableOpacity>
              <View style={estilos.valorCentral}>
                <Text style={estilos.textoMes}>{anioSeleccionado}</Text>
                <Text style={estilos.textoSub}>{aniosDisponibles.length} año{aniosDisponibles.length !== 1 ? 's' : ''} disponible{aniosDisponibles.length !== 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const idx = aniosDisponibles.indexOf(anioSeleccionado);
                  if (idx > 0) setAnioSeleccionado(aniosDisponibles[idx - 1]);
                }}
              >
                <Ionicons name="chevron-forward" size={20} color={aniosDisponibles.indexOf(anioSeleccionado) > 0 ? '#CBD5E1' : '#374151'} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 👥 Visualización */}
        <View style={estilos.tarjeta}>
          <Text style={estilos.etiqueta}>Mostrar</Text>
          <View style={estilos.filaModoVisual}>
            <TouchableOpacity
              style={[estilos.botonModoVis, modoVisualizacion === 'todos' && estilos.botonVisActivo]}
              onPress={() => setModoVisualizacion('todos')}
            >
              <Text style={[estilos.textoModoVis, modoVisualizacion === 'todos' && estilos.textoVisActivo]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[estilos.botonModoVis, modoVisualizacion === 'ganadores' && estilos.botonVisActivo]}
              onPress={() => setModoVisualizacion('ganadores')}
            >
              <Text style={[estilos.textoModoVis, modoVisualizacion === 'ganadores' && estilos.textoVisActivo]}>Solo Ganadores</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 📊 RESUMEN */}
        {resumen.totalSesiones > 0 && (
          <View style={estilos.tarjetaResumen}>
            <Text style={estilos.etiqueta}>Resumen del Período</Text>
            <View style={estilos.filaResumen}>
              <View style={estilos.datoPrincipal}>
                <Text style={estilos.datoEtiqueta}>Sesiones</Text>
                <Text style={estilos.datoValor}>{resumen.totalSesiones}</Text>
              </View>
              <View style={estilos.datoPrincipal}>
                <Text style={estilos.datoEtiqueta}>Total Partidas</Text>
                <Text style={estilos.datoValor}>{resumen.totalPartidas}</Text>
              </View>
            </View>
            <View style={estilos.linea} />
            <View style={estilos.filaResumen}>
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 12, color: '#22C55E'}}>Ganadas</Text>
                <Text style={{fontSize: 16, fontWeight: '700', color: '#22C55E'}}>{resumen.totalGanadas}</Text>
                <Text style={{fontSize: 11, color: '#FBBF24'}}>{formatearValor(resumen.montoGanadoGeneral)}</Text>
              </View>
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 12, color: '#EF4444'}}>Perdidas</Text>
                <Text style={{fontSize: 16, fontWeight: '700', color: '#EF4444'}}>{resumen.totalPerdidas}</Text>
                <Text style={{fontSize: 11, color: '#FBBF24'}}>{formatearValor(resumen.montoPerdidoGeneral)}</Text>
              </View>
            </View>
            <View style={estilos.linea} />
            <View style={estilos.filaSaldoGeneral}>
              <Text style={estilos.etiquetaSaldoGeneral}>Saldo Neto:</Text>
              <Text style={[estilos.valorSaldoGeneral, {color: colorSaldo(resumen.montoGanadoGeneral - resumen.montoPerdidoGeneral)}]}>
                {formatearValor(resumen.montoGanadoGeneral - resumen.montoPerdidoGeneral)}
              </Text>
            </View>
          </View>
        )}

        {/* 📈 GRÁFICO — PARTIDAS GANADAS */}
        {datos.length > 0 && (
          <GraficoCompleto 
            titulo="📈 PARTIDAS GANADAS — Cantidad por participante"
            datosLista={topGanadoresCant}
            colorBase="multicolor"
            campoCantidad="cantidadGanadas"
            campoValor="valorGanado"
          />
        )}

        {/* 💰 GRÁFICO — VALOR GANADO */}
        {datos.length > 0 && (
          <GraficoCompleto 
            titulo="💰 VALOR GANADO — Monto total por participante"
            datosLista={topGanadoresVal}
            colorBase="#22C55E"
            campoCantidad="cantidadGanadas"
            campoValor="valorGanado"
          />
        )}

        {/* 📉 GRÁFICO — PARTIDAS PERDIDAS */}
        {datos.length > 0 && (
          <GraficoCompleto 
            titulo="📉 PARTIDAS PERDIDAS — Cantidad por participante"
            datosLista={topPerdedoresCant}
            colorBase="#EF4444"
            campoCantidad="cantidadPerdidas"
            campoValor="valorPerdido"
          />
        )}

        {/* 💸 GRÁFICO — VALOR PERDIDO */}
        {datos.length > 0 && (
          <GraficoCompleto 
            titulo="💸 VALOR PERDIDO — Monto total por participante"
            datosLista={topPerdedoresVal}
            colorBase="#F97316"
            campoCantidad="cantidadPerdidas"
            campoValor="valorPerdido"
          />
        )}

        {/* 📋 TABLA DETALLADA GENERAL */}
        <View style={estilos.tarjetaTabla}>
          <Text style={estilos.etiqueta}>Detalle Completo por Participante</Text>
          {datos.length === 0 ? (
            <View style={estilos.vacio}>
              <Ionicons name="bar-chart-outline" size={50} color="#374151" />
              <Text style={estilos.textoVacio}>Sin datos para este período</Text>
              <Text style={estilos.subVacio}>Finaliza sesiones primero</Text>
            </View>
          ) : (
            <>
              <View style={estilos.cabeceraTabla}>
                <Text style={estilos.titPos}>#</Text>
                <Text style={estilos.titNombre}>Participante</Text>
                <View style={{alignItems: 'center', width: 90}}>
                  <Text style={{fontSize: 10, color: '#22C55E', fontWeight: '700'}}>GANADAS</Text>
                  <View style={{flexDirection: 'row', gap: 4}}>
                    <Text style={{fontSize: 9, color: '#6B7280'}}>Cant</Text>
                    <Text style={{fontSize: 9, color: '#6B7280'}}>$</Text>
                  </View>
                </View>
                <View style={{alignItems: 'center', width: 90}}>
                  <Text style={{fontSize: 10, color: '#EF4444', fontWeight: '700'}}>PERDIDAS</Text>
                  <View style={{flexDirection: 'row', gap: 4}}>
                    <Text style={{fontSize: 9, color: '#6B7280'}}>Cant</Text>
                    <Text style={{fontSize: 9, color: '#6B7280'}}>$</Text>
                  </View>
                </View>
                <Text style={{width: 60, fontSize: 10, color: '#FBBF24', fontWeight: '700', textAlign: 'center'}}>Saldo</Text>
              </View>
              <View style={estilos.lineaCab} />
              {datos.map((d, i) => (
                <View key={d.participanteId} style={estilos.fila}>
                  <Text style={[estilos.colPos, {color: colores[i % colores.length]}]}>{i+1}</Text>
                  <Text style={[estilos.colNombre, {color: colores[i % colores.length]}]} numberOfLines={1}>{d.nombre}</Text>
                  <View style={{flexDirection: 'row', width: 90, justifyContent: 'center', gap: 6}}>
                    <Text style={{fontSize: 11, color: '#CBD5E1'}}>{d.cantidadGanadas}</Text>
                    <Text style={{fontSize: 11, color: '#22C55E', fontWeight: '700'}}>{formatearValor(d.valorGanado)}</Text>
                  </View>
                  <View style={{flexDirection: 'row', width: 90, justifyContent: 'center', gap: 6}}>
                    <Text style={{fontSize: 11, color: '#CBD5E1'}}>{d.cantidadPerdidas}</Text>
                    <Text style={{fontSize: 11, color: '#EF4444'}}>{formatearValor(d.valorPerdido)}</Text>
                  </View>
                  <Text style={{width: 60, fontSize: 12, textAlign: 'center', color: colorSaldo(d.saldo), fontWeight: '700'}}>
                    {formatearValor(d.saldo)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#0A1629' },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  titulo: { fontSize: 18, fontWeight: '700', color: '#fff' },
  textoMensaje: { fontSize: 12, color: '#FBBF24', textAlign: 'center', marginBottom: 12 },
  contenedor: { padding: 16, paddingBottom: 50 },
  etiqueta: { fontSize: 15, fontWeight: '700', color: '#818CF8', marginBottom: 12 },
  tarjeta: { backgroundColor: 'rgba(30,64,175,0.15)', borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(96,165,250,0.25)' },
  filaModoFiltro: { flexDirection: 'row', gap: 8 },
  botonFiltro: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  botonFiltroActivo: { backgroundColor: '#3B82F6' },
  textoFiltro: { fontSize: 14, color: '#94A3B8' },
  textoFiltroActivo: { color: '#fff', fontWeight: '700' },
  filaFiltro: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valorCentral: { alignItems: 'center', flex: 1 },
  textoMes: { fontSize: 20, fontWeight: '700', color: '#fff' },
  textoAnio: { fontSize: 16, color: '#94A3B8' },
  flechaTexto: { fontSize: 18, color: '#60A5FA' },
  textoSub: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  filaModoVisual: { flexDirection: 'row', gap: 10 },
  botonModoVis: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  botonVisActivo: { backgroundColor: '#22C55E' },
  textoModoVis: { fontSize: 13, color: '#94A3B8' },
  textoVisActivo: { color: '#fff', fontWeight: '700' },
  tarjetaResumen: { backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  filaResumen: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  datoPrincipal: { alignItems: 'center' },
  datoEtiqueta: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  datoValor: { fontSize: 22, fontWeight: '700', color: '#fff' },
  linea: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  filaSaldoGeneral: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12 },
  etiquetaSaldoGeneral: { fontSize: 15, fontWeight: '600', color: '#E5E7EB' },
  valorSaldoGeneral: { fontSize: 18, fontWeight: '700' },
  
  tarjetaGrafico: { backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  tituloGrafico: { fontSize: 14, fontWeight: '700', color: '#E5E7EB', marginBottom: 16 },
  
  contenedorBarras: { gap: 12, marginBottom: 16 },
  filaBarra: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nombreParticipante: { width: 100, fontSize: 12, color: '#CBD5E1' },
  fondoBarra: { flex: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 13, overflow: 'hidden' },
  rellenoBarra: { height: '100%', borderRadius: 13 },
  
  tablaDatos: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12 },
  encabezadoTabla: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  encNombre: { flex: 2, fontSize: 11, fontWeight: '700', color: '#818CF8' },
  encCant: { width: 80, fontSize: 11, fontWeight: '700', color: '#818CF8', textAlign: 'center' },
  encValor: { width: 100, fontSize: 11, fontWeight: '700', color: '#FBBF24', textAlign: 'center' },
  filaTabla: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  datNombre: { flex: 2, fontSize: 12 },
  datCant: { width: 80, fontSize: 12, color: '#CBD5E1', textAlign: 'center' },
  datValor: { width: 100, fontSize: 12, color: '#FBBF24', textAlign: 'center', fontWeight: '600' },
  
  tarjetaTabla: { backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  vacio: { alignItems: 'center', paddingVertical: 40 },
  textoVacio: { fontSize: 15, color: '#94A3B8', marginTop: 12 },
  subVacio: { fontSize: 12, color: '#64748B', marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  cabeceraTabla: { flexDirection: 'row', paddingBottom: 8, alignItems: 'center' },
  titPos: { width: 25, fontSize: 11, fontWeight: '700', color: '#64748B', textAlign: 'center' },
  titNombre: { flex: 1.5, fontSize: 11, fontWeight: '700', color: '#64748B' },
  lineaCab: { height: 1, backgroundColor: 'rgba(99,102,241,0.2)', marginBottom: 8 },
  fila: { flexDirection: 'row', paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  colPos: { width: 25, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  colNombre: { flex: 1.5, fontSize: 13 },
});

export default Estadisticas;