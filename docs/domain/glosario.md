# Glosario del dominio

Términos oficiales de **Partidas_de_Rumi**. Este documento es la fuente
de verdad para nombrar conceptos en código, base de datos (database), contratos e interfaz de usuario (user interface).

> **Regla**: el dominio se nombra en **español**. Los términos técnicos
> estándar (marco de trabajo o framework, biblioteca o library, protocolo) permanecen en inglés.

---

## Términos del dominio

### sesion

Agrupación de partidas asociada a **un solo día**.

**Datos mínimos**:
- `fecha` — día de la sesión
- `hora_inicio` — cuándo se abrió
- `hora_fin` — cuándo se cerró
- `participantes` — quiénes están activos en la sesión
- `valor_apuesta` — cuánto se apuesta por partida (heredado por todas las partidas)
- `total_partidas` — cantidad total de partidas jugadas (dato derivado persistido)
- `total_apostado_sesion` — monto total apostado en la sesión (dato derivado persistido)

**Estados**:
- **Abierta** — se pueden registrar partidas
- **Cerrada** — solo lectura

**Ciclo de vida**: se abre cuando comienza, se cierra cuando termina.
Al cerrarse, no se puede modificar y sus totales se consolidan como una captura instantánea (snapshot) histórica.

**Restricciones**:
- Mínimo 3 participantes activos, máximo 5
- Una sesión no puede abarcar varios días

---

### partida

Secuencia de repeticiones o juegos **dentro de una sesión**.

Cada partida:
- Involucra a un subconjunto de participantes de la sesión (seleccionados para esa partida)
- Termina cuando existe un resultado: ganador único o empate declarado
- Tiene fecha y hora de inicio
- Registra el `monto_total_apuestas` de esa partida específica

**Restricciones**:
- Cantidad ilimitada por sesión
- Todas las partidas de una sesión usan el **mismo valor de apuesta**
- El valor de apuesta **nunca** se cambia por partida

**Regla del empate**: si hay empate, la partida se **repite** hasta que
haya un ganador. No se acumula nada entre partidas.

---

### apuesta

Valor que cada participante pone en juego **por partida**.

**Características**:
- Se define **una sola vez en la sesión**
- Todas las partidas de esa sesión heredan el mismo valor
- **No se puede cambiar** durante la sesión ni por partida
- Todos los participantes de la partida apuestan

**Ejemplo**: si la sesión define $0.25, todas las partidas de esa sesión
tienen apuesta de $0.25.

---

### participante

Persona que participa en una sesión.

**Características**:
- Mínimo 3, máximo 5 activos por sesión
- Puede **entrar** o **salir** durante una sesión
- Conserva su **historial** aunque se suspenda o reactive
- Cada participante tiene un identificador único

**Nota**: un participante suspendido no cuenta para el mínimo/máximo
activo, pero su historial y estadísticas globales permanecen.

---

### ganador

Participante que gana una partida.

**Qué recibe**: el **total de apuestas de la partida**.

**Fórmula**: `n × valor_apuesta` (donde `n` es la cantidad de participantes en esa partida).

**Ejemplo**: 4 participantes, apuesta $0.25 → ganador recibe **$1.00**

**Balance del ganador en esa partida**:
El ganador **no recupera su apuesta restándola del total**. Recibe el
total completo, y su balance refleja tanto lo que puso como lo que recibió.

---

### perdedor

Participante que pierde una partida.

**Qué pierde**: su apuesta completa.

**Balance del perdedor en esa partida**:
`0 - valor_apuesta` (balance negativo).

---

### empate

Situación en la que dos o más participantes de una partida no obtienen
un ganador único.

**Qué pasa**:
- La partida **no se contabiliza** como ganada por nadie
- La partida se **repite** hasta que exista un ganador
- **No se acumula nada** entre la partida empatada y la repetida
- Los participantes que empataron se registran para trazabilidad

**Importante**: el empate **no genera transacciones** de dinero. Solo se
registra que ocurrió, y se repite la partida.

---

### valor_apuesta

Monto en dólares que cada participante apuesta por partida.

**Características**:
- Se define en la sesión
- Es único por sesión
- Aplica a todas las partidas de esa sesión
- No se modifica durante la sesión

---

### balance

Resultado de un participante en una partida o en una sesión.

**Por partida**:
- Si ganó: `recibido > 0`, `apostado > 0` → balance positivo
- Si perdió: `recibido = 0`, `apostado > 0` → balance negativo
- Si empató: no hay transacción → balance 0 en esa partida

**Por sesión**:
`total_ganado - total_perdido`

**Nota**: el balance **se persiste** en la base de datos (database) para optimizar las consultas y el rendimiento, pero su fuente de verdad sigue siendo el historial de partidas. Se actualiza de forma incremental para garantizar la coherencia.

---

### sesion_cerrada

Estado final de una sesión. Una vez cerrada:
- No se pueden agregar ni modificar partidas
- No se pueden agregar ni modificar participantes
- No se puede cambiar el valor de apuesta
- Solo lectura
- Los totales de la sesión se consolidan como una captura instantánea (snapshot) histórica inmutable.

---

### historial

Registro permanente de todas las partidas y resultados de un participante.

**Características**:
- Persiste aunque el participante se suspenda
- Persiste aunque la sesión se cierre
- Incluye las métricas derivadas persistidas (partidas jugadas, ganadas, perdidas, empatadas, total ganado, total perdido y balance) para consultas eficientes.
- Es la fuente de verdad para validar cualquier cálculo.

---

## Términos que NO existen en este dominio

Los siguientes términos **no forman parte** del dominio de Partidas_de_Rumi.
Si aparecen en algún documento, código o conversación, deben corregirse:

| Término | Por qué no aplica |
|---------|-------------------|
| **pozo** | No hay acumulación de apuestas entre partidas |
| **neto** | El término correcto es `balance` |
| **apuestas acumuladas** | Los empates no acumulan apuestas |
| **ganancia neta** | No se resta la apuesta del total recibido; se calcula `balance` |

---

## Referencias

- Reglas de negocio: [`reglas-negocio.md`](reglas-negocio.md)
- Modelo de datos: [`modelo.md`](modelo.md)
- Flujos: [`flujos.md`](flujos.md)