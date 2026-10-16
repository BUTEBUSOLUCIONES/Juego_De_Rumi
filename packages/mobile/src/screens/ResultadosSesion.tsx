// D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile\src\screens\ResultadosSesion.tsx
// PANTALLA DE RESULTADOS — Resumen final de sesión cerrada
// Muestra totales, desglose y estadísticas por participante
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { EstadisticaParticipanteSesion } from '../servicios/BaseDatos';

type RutasNavegacion = {
  Inicio: undefined;
  ConsultarSesiones: undefined;
};

type Parametros = {
  numeroSesion: number;
  descripcion: string;
  valorApuesta: number;
  totalPartidas: number;
  partidasConGanador: number;
  partidasEmpatadas: number;
  partidasAnuladas: number;
  totalApuestasGanador: number; // Solo con ganador
  estadisticas: EstadisticaParticipanteSesion[];
  origen?: 'Consulta' | 'SesionActiva'; // ✅ Nuevo: de dónde vengo
};

const ResultadosSesion = () => {
  const navegacion = useNavigation<NavigationProp<RutasNavegacion>>();
  const route = useRoute();
  const {
    numeroSesion,
    descripcion,
    valorApuesta,
    totalPartidas,
    partidasConGanador,
    partidasEmpatadas,
    partidasAnuladas,
    totalApuestasGanador,
    estadisticas,
    origen, // ✅ Ahora sí existe
  } = (route.params || {}) as Parametros;

    // ==============================================================
  // GUARDIÁN: Verificar que llegaron los parámetros necesarios
  // Propósito: Evitar que la app se caiga si se entra sin datos
  // ==============================================================
  if (!numeroSesion || !estadisticas || !Array.isArray(estadisticas)) {
    return (
      <View style={estilos.pantalla}>
        <View style={estilos.mensajeVacio}>
          <Ionicons name="information-circle-outline" size={48} color="#94A3B8" />
          <Text style={estilos.tituloVacio}>Sin datos de sesión</Text>
          <Text style={estilos.textoVacio}>
            Para ver los resultados, debes seleccionar una sesión desde
            {'\n'}
            "Consultar Sesiones".
          </Text>
          <TouchableOpacity
            style={estilos.botonVacio}
            onPress={() => navegacion.navigate('ConsultarSesiones')}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={estilos.textoBoton}>Ir a Consultar Sesiones</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ✅ Definir a dónde volver
  const volver = () => {
    if (origen === 'Consulta') {
      navegacion.navigate('ConsultarSesiones'); // Vuelve a la lista ✅
    } else {
      navegacion.navigate('Inicio'); // Vuelve al Menú Principal ✅
    }
  };

  // Total Apuestas = SOLO partidas con ganador
  const totalActivos = estadisticas.length || 0;
  const valorPorPartida = totalActivos * valorApuesta;
  const totalApuestas = partidasConGanador * valorPorPartida;
  const partidasSinGanador = partidasEmpatadas + partidasAnuladas;
  const montoSinGanador = partidasSinGanador * valorPorPartida;

  const formatear = (v: number) => `${v >= 0 ? '$' : '-$'}${Math.abs(v).toFixed(2)}`;
  const colorSaldo = (s: number) => s > 0 ? '#22C55E' : s < 0 ? '#EF4444' : '#94A3B8';

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenedor}>
        <View style={estilos.encabezado}>
          <Ionicons name="trophy" size={36} color="#FBBF24" />
          <Text style={estilos.titulo}>Sesión Finalizada ✅</Text>
          <Text style={estilos.subtitulo}>Sesión Nº {numeroSesion}</Text>
          <Text style={estilos.descripcion}>{descripcion || 'Sin descripción'}</Text>
        </View>

        {/* Resumen de la Sesión */}
        <View style={estilos.tarjetaResumen}>
          <Text style={estilos.etiquetaSeccion}>Resumen de la Sesión</Text>
          
          <View style={estilos.filaDato}>
            <Text style={estilos.textoEtiqueta}>Valor Apuesta por participante:</Text>
            <Text style={estilos.textoValor}>{formatear(valorApuesta)}</Text>
          </View>

          <View style={estilos.lineaDivisoria} />

          <View style={estilos.filaDato}>
            <Text style={estilos.textoEtiqueta}>Total Partidas Jugadas:</Text>
            <Text style={estilos.textoValorPrincipal}>{totalPartidas}</Text>
          </View>
          
          <View style={estilos.filaDesglose}>
            <Text style={estilos.textoDesglose}>• Con Ganador:</Text>
            <Text style={estilos.valorDesglose}>{partidasConGanador}</Text>
          </View>
          <View style={estilos.filaDesglose}>
            <Text style={estilos.textoDesglose}>• Empatadas:</Text>
            <Text style={estilos.valorDesglose}>{partidasEmpatadas}</Text>
          </View>
          <View style={estilos.filaDesglose}>
            <Text style={estilos.textoDesglose}>• Anuladas:</Text>
            <Text style={estilos.valorDesglose}>{partidasAnuladas}</Text>
          </View>

          <View style={estilos.lineaDivisoria} />

          {/* Total Apuestas = SOLO con ganador */}
          <View style={estilos.filaDato}>
            <Text style={estilos.textoEtiquetaDestacada}>Total Apuestas:</Text>
            <Text style={estilos.textoValorDestacado}>{formatear(totalApuestas)}</Text>
          </View>
          <Text style={estilos.textoAyuda}>
            ({partidasConGanador} partidas con ganador × {totalActivos} participantes × {formatear(valorApuesta)})
          </Text>

          {/* Otras jugadas */}
          {partidasSinGanador > 0 && (
            <>
              <View style={[estilos.filaDato, { marginTop: 12 }]}>
                <Text style={estilos.textoEtiqueta}>Otras jugadas (Emp/Anul):</Text>
                <Text style={estilos.textoValor}>{formatear(montoSinGanador)}</Text>
              </View>
              <Text style={estilos.textoAyuda}>
                ({partidasSinGanador} partidas sin ganador)
              </Text>
            </>
          )}
        </View>

        {/* Estadísticas por Participante — Ordenadas y con colores */}
        <View style={estilos.tarjetaEstadisticas}>
          <Text style={estilos.etiquetaSeccion}>Estadísticas por Participante</Text>
          
          <View style={estilos.filaEncabezado}>
            <Text style={estilos.encNombre}>Participante</Text>
            <Text style={estilos.encNum}>G</Text>
            <Text style={estilos.encNum}>P</Text>
            <Text style={estilos.encVal}>Ganado</Text>
            <Text style={estilos.encVal}>Perdido</Text>
            <Text style={estilos.encSaldo}>Saldo</Text>
          </View>
          <View style={estilos.lineaCabecera} />
          
          {estadisticas
            .slice()
            .sort((a, b) => b.valoresGanados - a.valoresGanados)
            .map((est, indice) => {
              const colorPosicion = 
                indice === 0 ? '#FBBF24' : // 🟡 1° Amarillo
                indice === 1 ? '#22D3EE' : // 🔵 2° Cian
                indice === 2 ? '#C084FC' : // 🟣 3° Magenta
                '#34D399';                // 🟢 4° Verde
              
              return (
                <View key={est.participanteId} style={estilos.filaParticipante}>
                  <Text style={[estilos.nombre, { color: colorPosicion, fontWeight: '600' }]} numberOfLines={1}>
                    {est.nombre}
                  </Text>
                  <Text style={[estilos.numero, { color: colorPosicion }]}>{est.partidasGanadas}</Text>
                  <Text style={[estilos.numero, { color: colorPosicion }]}>{est.partidasPerdidas}</Text>
                  <Text style={[estilos.valor, { color: colorPosicion, fontWeight: '700' }]}>{formatear(est.valoresGanados)}</Text>
                  <Text style={estilos.valor}>{formatear(est.valoresPerdidos)}</Text>
                  <Text style={[estilos.saldo, { color: colorSaldo(est.saldo) }]}>{formatear(est.saldo)}</Text>
                </View>
              );
            })}
        </View>

        {/* ✅ Botón corregido: solo "Retornar" */}
        <TouchableOpacity
          style={estilos.botonPrincipal}
          onPress={volver}
        >
          <Ionicons name={origen === 'Consulta' ? 'arrow-back' : 'home'} size={20} color="#fff" />
          <Text style={estilos.textoBoton}>Retornar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const estilos = StyleSheet.create({
    mensajeVacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  tituloVacio: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
  },
  textoVacio: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  botonVacio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  pantalla: {
    flex: 1,
    backgroundColor: '#0A1629',
  },
  contenedor: {
    padding: 16,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  subtitulo: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  descripcion: {
    fontSize: 14,
    color: '#60A5FA',
    marginTop: 4,
    fontStyle: 'italic',
  },
  tarjetaResumen: {
    backgroundColor: 'rgba(30,64,175,0.15)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
  },
  etiquetaSeccion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#818CF8',
    marginBottom: 16,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  textoEtiqueta: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  textoEtiquetaDestacada: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FBBF24',
  },
  textoValor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textoValorPrincipal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textoValorDestacado: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FBBF24',
  },
  filaDesglose: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 16,
    marginBottom: 2,
  },
  textoDesglose: {
    fontSize: 13,
    color: '#94A3B8',
  },
  valorDesglose: {
    fontSize: 13,
    color: '#CBD5E1',
  },
  textoAyuda: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'right',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  lineaDivisoria: {
    height: 1,
    backgroundColor: 'rgba(96,165,250,0.2)',
    marginVertical: 12,
  },
  tarjetaEstadisticas: {
    backgroundColor: 'rgba(17,24,39,0.9)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  filaEncabezado: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  encNombre: { flex: 2, fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  encNum: { width: 30, fontSize: 11, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encVal: { width: 75, fontSize: 11, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  encSaldo: { width: 75, fontSize: 11, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  lineaCabecera: {
    height: 1,
    backgroundColor: 'rgba(99,102,241,0.2)',
    marginBottom: 8,
  },
  filaParticipante: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
  },
  nombre: { flex: 2, fontSize: 13 },
  numero: { width: 30, fontSize: 13, textAlign: 'center' },
  valor: { width: 75, fontSize: 12, textAlign: 'center' },
  saldo: { width: 75, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  botonPrincipal: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.6)',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 30,
  },
  textoBoton: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ResultadosSesion;