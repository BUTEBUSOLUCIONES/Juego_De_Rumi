export function calcularBalancePartida(
  esGanador: boolean,
  esPerdedor: boolean,
  valorApuesta: number,
  cantidadParticipantes: number
): number {
  if (esGanador) {
    return (cantidadParticipantes * valorApuesta) - valorApuesta;
  }
  if (esPerdedor) {
    return -valorApuesta;
  }
  return 0;
}