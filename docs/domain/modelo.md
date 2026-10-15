# Modelo de datos

Modelo conceptual de **Partidas_de_Rumi**. Se deriva del
[glosario](glosario.md) y de las [reglas de negocio](reglas-negocio.md).

> **Regla**: este modelo es la fuente para los contratos
> (docs/contracts/) y para el esquema de base de datos.
> Si cambia una entidad, se actualiza primero este archivo.

---

## Entidades

| Entidad | Descripcion |
|---------|-------------|
| **Participante** | Persona que juega. Identificada por nombre unico global |
| **Sesion** | Agrupacion de un solo dia. Define participantes, valor de apuesta y administrador |
| **Partida** | Cada juego dentro de una sesion. Termina con ganador o empate |
| **ResultadoPartida** | Registro del resultado de una partida: ganador unico o empate |
| **EstadisticaSesionParticipante** | Resumen persistido del rendimiento de un participante en una sesion especifica |
| **EstadisticaGlobalParticipante** | Resumen persistido del rendimiento acumulado de un participante en todas las sesiones |

---

## Participante

Persona que juega en el sistema.

| Campo | Tipo | Descripcion | Obligatorio |
|-------|------|-------------|-------------|
| id | texto (UUID) | Identificador unico interno | Si |
| nombre | texto | Nombre unico global. Ej: "Carlos" | Si |
| activo | booleano | Si esta disponible para jugar | Si |

**Restricciones**:
- nombre es unico en todo el sistema
- Un participante puede participar en multiples sesiones

**Notas**:
- No se elimina un participante; se marca activo = falso (falso) (RN-10, historial)
- Sus estadisticas globales se mantienen actualizadas de forma incremental (RN-17)

---

## Sesion

Agrupacion de partidas de un solo dia (RN-01, RN-02).

| Campo | Tipo | Descripcion | Obligatorio |
|-------|------|-------------|-------------|
| id | texto (UUID) | Identificador unico interno | Si |
| fecha | fecha (AAAA-MM-DD) | Dia de la sesion | Si |
| hora_inicio | fecha y hora | Cuando se abrio | Si |
| hora_fin | fecha y hora o nulo | Cuando se cerro | No (nulo hasta cerrar) |
| valor_apuesta | numero | Monto por partida. Inmutable tras crear la sesion | Si |
| administrador_id | texto (UUID) | Participante que administra | Si |
| estado | texto | abierta o cerrada | Si |
| participantes_ids | lista de texto (UUID) | Lista de participantes de la sesion | Si |
| total_partidas | numero | Cantidad total de partidas jugadas en la sesion | Si (derivado persistido, RN-16) |
| total_apostado_sesion | numero | Monto total apostado en la sesion | Si (derivado persistido, RN-16) |

**Restricciones**:
- fecha es de un solo dia (RN-01)
- valor_apuesta > 0
- valor_apuesta no cambia una vez creada la sesion (RN-05)
- administrador_id debe apuntar a un participante de la sesion (RN-09)
- participantes_ids debe tener entre 3 y 5 elementos activos (RN-03)
- Si estado = cerrada, no se puede modificar (RN-11)

**Notas**:
- hora_fin se completa al cerrar la sesion
- Los totales (total_partidas, total_apostado_sesion) se recalculan y fijan al cerrar la sesion (captura instantánea o snapshot)

---

## Partida

Cada juego dentro de una sesion (RN-04).

| Campo | Tipo | Descripcion | Obligatorio |
|-------|------|-------------|-------------|
| id | texto (UUID) | Identificador unico interno | Si |
| sesion_id | texto (UUID) | Sesion a la que pertenece | Si |
| hora_inicio | fecha y hora | Cuando comenzo la partida | Si |
| hora_fin | fecha y hora | Cuando termino (ganador o empate) | Si |
| participantes_ids | lista de texto (UUID) | Participantes de esa partida | Si |
| monto_total_apuestas | numero | Suma de las apuestas de los participantes en esta partida | Si (derivado persistido) |
| resultado | ResultadoPartida | Resultado de la partida | Si |

**Restricciones**:
- sesion_id debe apuntar a una sesion existente
- participantes_ids debe tener entre 3 y 5 elementos (RN-03)
- participantes_ids debe ser subconjunto de los participantes de la sesion (RN-04)
- La partida no existe sin resultado: se crea y termina con ganador o empate
- hora_fin > hora_inicio
- monto_total_apuestas = cantidad de participantes en la partida × valor_apuesta de la sesion

**Notas**:
- Cada partida usa el valor_apuesta de su sesion (RN-05)
- No hay partidas "en curso": o terminan con ganador o terminan con empate

---

## ResultadoPartida

Resultado de una partida. Es un tipo, no una entidad independiente.

| Tipo | Descripcion | Campos adicionales |
|------|-------------|-------------------|
| Ganador | Un participante gano | ganador_id (UUID) |
| Empate | Dos o mas participantes empataron | empatados_ids (lista de UUID) |

**Restricciones**:
- Si es Ganador, ganador_id debe estar en participantes_ids de la partida
- Si es Empate, empatados_ids debe tener al menos 2 elementos
- Si es Empate, todos los empatados_ids deben estar en participantes_ids

**Notas**:
- El empate no genera transacciones de dinero (RN-08)
- Cada partida tiene exactamente un resultado: ganador o empate

---

## EstadisticaSesionParticipante

Resumen persistido del rendimiento de un participante en una sesion especifica (RN-17).

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| sesion_id | texto (UUID) | Sesion de referencia |
| participante_id | texto (UUID) | Participante de referencia |
| partidas_jugadas | numero | Cantidad de partidas en las que participo |
| partidas_ganadas | numero | Cantidad de partidas que gano |
| partidas_perdidas | numero | Cantidad de partidas que perdio |
| partidas_empatadas | numero | Cantidad de partidas que empato |
| total_ganado | numero | Suma de montos recibidos en partidas ganadas |
| total_perdido | numero | Suma de montos apostados en partidas perdidas |
| balance | numero | total_ganado - total_perdido |

**Notas**:
- Esta entidad se actualiza de forma incremental cada vez que se registra una partida.
- Permite consultas rapidas de estadisticas por sesion sin recorrer todas las partidas.

---

## EstadisticaGlobalParticipante

Resumen persistido del rendimiento acumulado de un participante en todas las sesiones (RN-17).

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| participante_id | texto (UUID) | Participante de referencia |
| sesiones_jugadas | numero | Cantidad de sesiones en las que participo |
| partidas_jugadas | numero | Cantidad total de partidas jugadas |
| partidas_ganadas | numero | Cantidad total de partidas ganadas |
| partidas_perdidas | numero | Cantidad total de partidas perdidas |
| partidas_empatadas | numero | Cantidad total de partidas empatadas |
| total_ganado | numero | Suma total de montos recibidos |
| total_perdido | numero | Suma total de montos apostados y perdidos |
| balance | numero | total_ganado - total_perdido |

**Notas**:
- Se actualiza incrementalmente al cerrar una sesion o al registrar una partida (segun la estrategia de sincronizacion).

---

## Relaciones

    Participante 1 --- N Sesion (como participante)
    Participante 1 --- N Sesion (como administrador)
    Sesion       1 --- N Partida
    Partida      1 --- 1 ResultadoPartida
    Sesion       1 --- N EstadisticaSesionParticipante
    Participante 1 --- N EstadisticaSesionParticipante
    Participante 1 --- 1 EstadisticaGlobalParticipante

**Notas**:
- Un participante puede ser administrador de varias sesiones
- Un participante puede ser administrador de una sesion y jugador en otra
- Una sesion tiene un solo administrador
- Una partida tiene un solo resultado

---

## Validaciones transversales

Estas validaciones se aplican siempre, en cualquier operacion:

| ID | Validacion | Referencia |
|----|------------|------------|
| VAL-01 | Una sesion tiene entre 3 y 5 participantes activos | RN-03 |
| VAL-02 | Una partida tiene entre 3 y 5 participantes | RN-03 |
| VAL-03 | Los participantes de la partida pertenecen a la sesion | RN-04 |
| VAL-04 | El valor de apuesta es el mismo en toda la sesion | RN-05 |
| VAL-05 | El administrador es participante de la sesion | RN-09 |
| VAL-06 | No se modifica una sesion cerrada | RN-11 |
| VAL-07 | El resultado de una partida es ganador o empate | RN-08 |
| VAL-08 | Un empate tiene al menos 2 empatados | RN-08 |
| VAL-09 | Los datos derivados (totales, balances) son coherentes con las partidas | RN-18 |

---

## Datos derivados que SÍ se guardan (Persistencia)

A diferencia de versiones anteriores del diseño, los siguientes datos **SÍ se persisten** en la base de datos para optimizar el rendimiento de las consultas, manteniendo la coherencia mediante actualizaciones incrementales o desencadenantes (triggers):

| Dato | Donde se guarda | Motivo |
|------|-----------------|--------|
| Balance y totales por participante en una sesion | `EstadisticaSesionParticipante` | Consultas rapidas de historial por sesion |
| Balance y totales globales del participante | `EstadisticaGlobalParticipante` | Consultas rapidas de estadisticas generales |
| Total de partidas y monto apostado en la sesion | Campos en `Sesion` | Resumen rapido de la jornada (snapshot) |
| Monto total de apuestas en una partida | Campo en `Partida` | Trazabilidad economica inmediata |

**Motivo**: persistir estos datos derivados mejora significativamente el rendimiento de la aplicación (app) y el servidor (backend), evitando cálculos pesados en tiempo real, siempre que se garantice su coherencia con la fuente de verdad (las partidas).

---

## Referencias

- Glosario: [glosario.md](glosario.md)
- Reglas de negocio: [reglas-negocio.md](reglas-negocio.md)
- Flujos: [flujos.md](flujos.md)
- Contratos: ../contracts/