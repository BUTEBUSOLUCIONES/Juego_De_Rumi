# Reglas de negocio

Reglas oficiales de **Partidas_de_Rumi**. Este documento es la **fuente de
verdad** del comportamiento del sistema.

> **Regla**: ningún código, contrato o documento puede introducir reglas
> que no estén aquí. Si una regla cambia, se actualiza este archivo **primero**,
> y luego se refleja en el código.

---

## Resumen

| ID | Regla |
|----|-------|
| RN-01 | Una sesión dura un solo día |
| RN-02 | La sesión define: fecha, hora inicio, hora fin, participantes y valor de apuesta |
| RN-03 | Mínimo 3, máximo 5 participantes activos, tanto en la sesión como en cada partida |
| RN-04 | Cada partida selecciona un subconjunto de los participantes de la sesión |
| RN-05 | Todos los participantes de una partida apuestan el mismo valor |
| RN-06 | El ganador recibe `n × valor_apuesta` (total completo, sin resta) |
| RN-07 | El perdedor pierde su apuesta completa |
| RN-08 | Empate: la partida se registra como terminada y se juega una nueva |
| RN-09 | El administrador es un participante más; se elige al inicio de la sesión |
| RN-10 | Los participantes pueden entrar y salir; su historial se mantiene |
| RN-11 | Una sesión cerrada es de solo lectura |
| RN-12 | El historial guarda: partidas jugadas, ganadas, perdidas, empatadas, valores ganados y perdidos |
| RN-13 | Las estadísticas y balances **se persisten** en la base de datos para optimizar consultas |
| RN-14 | Los filtros son: por mes (`YYYY-MM`), por año (`YYYY`) y general |
| RN-15 | Local-first (primero local): el registro ocurre en el móvil; la sincronización es posterior |
| RN-16 | Al cerrar sesión, se persisten los totales de la sesión como captura instantánea (snapshot) histórica |
| RN-17 | Se guardan y actualizan las métricas de cada participante (jugadas, ganadas, perdidas, empatadas, totales y balance) |
| RN-18 | Los datos derivados persistidos deben mantenerse siempre coherentes con las partidas registradas |

---

## Detalle de cada regla

### RN-01 — Duración de la sesión

Una **sesión** está asociada a **un solo día**. No puede abarcar varios días.

**Motivo**: el dominio del juego es por jornadas. Mezclar días complicaría
las estadísticas y no corresponde al uso real.

---

### RN-02 — Datos que definen la sesión

Toda sesión define, como mínimo:

| Dato | Tipo | Descripción |
|------|------|-------------|
| `fecha` | fecha | Día de la sesión |
| `hora_inicio` | hora | Cuándo se abrió |
| `hora_fin` | hora | Cuándo se cerró |
| `participantes` | lista | Quiénes están activos |
| `valor_apuesta` | número | Cuánto se apuesta por partida |

**Nota**: `hora_fin` se completa al cerrar la sesión (RN-11).

---

### RN-03 — Cantidad de participantes

**Mínimo 3, máximo 5 participantes activos**.

Esta regla aplica a:
- La **sesión** (no se puede abrir con menos de 3 ni con más de 5)
- **Cada partida** (no se puede registrar con menos de 3 ni con más de 5)

**Participante activo**: aquel que no está suspendido en el momento
de la validación.

**Excepción**: un participante suspendido no cuenta para el mínimo
ni para el máximo, pero conserva su historial.

---

### RN-04 — Selección de participantes por partida

En cada partida se **seleccionan** los participantes que juegan.

No es obligatorio que jueguen todos los de la sesión. Puede ser un
subconjunto, siempre que respete RN-03 (mínimo 3, máximo 5).

**Motivo**: en una sesión puede haber partidas donde algunos
participantes no jueguen (descanso, otras mesas, etc.).

---

### RN-05 — Valor de la apuesta

Todas las partidas de una sesión usan **el mismo valor de apuesta**,
definido en la sesión.

El valor:
- Se establece al abrir la sesión
- **No se puede cambiar** durante la sesión
- **No se puede cambiar** por partida
- Aplica a **todos** los participantes de cada partida

---

### RN-06 — Lo que recibe el ganador

El ganador de una partida recibe:

**Ejemplo**: 4 participantes, apuesta $0.25 → ganador recibe **$1.00**.

**Sin resta**: el ganador **no recupera su apuesta restándola del total**.
Recibe el total completo. Su balance refleja tanto lo que puso como lo
que recibió.

**Balance del ganador**:

---

### RN-07 — Lo que pierde el perdedor

El perdedor de una partida pierde **su apuesta completa**.

**Balance del perdedor**:

---

### RN-08 — Empate

Cuando hay empate en una partida:

1. La partida **se registra como terminada** con resultado `empate`
2. Se registra **quiénes empataron** (para trazabilidad)
3. **No se generan transacciones** de dinero por esa partida
4. Se juega una **nueva partida** hasta que exista un ganador único

**No se acumula nada** entre la partida empatada y la nueva. Son
partidas independientes.

**Cada partida tiene su propia fecha y hora de inicio**. La partida
repetida no es la misma que la empatada.

---

### RN-09 — Administrador

El **administrador** es un **participante más** de la sesión. Se elige
al inicio de la sesión.

**Responsabilidades** (pendiente de detallar en `flujos.md`):
- Abrir la sesión
- Cerrar la sesión
- (Otros permisos por definir)

**Importante**: el administrador **juega** como cualquier participante.
No es un rol externo.

---

### RN-10 — Entrada y salida de participantes

Un participante puede:

- **Entrar** a la sesión después de que haya comenzado
- **Salir** antes de que la sesión termine

**Historial**:
- Al entrar, empieza a acumular historial desde ese momento
- Al salir, **conserva** todo el historial acumulado durante la sesión
- El historial **se acumula dentro de la sesión** (no se pierde al salir)

**Datos del historial por participante** (dentro de una sesión):
- Partidas jugadas
- Partidas ganadas
- Partidas perdidas
- Partidas empatadas
- Total ganado ($)
- Total perdido ($)
- Balance ($) — calculado como ganado − perdido

---

### RN-11 — Sesión cerrada

Una vez que la sesión se **cierra**:

- No se pueden agregar partidas
- No se pueden modificar partidas existentes
- No se pueden agregar participantes
- No se pueden modificar participantes
- No se puede cambiar el valor de apuesta
- La sesión pasa a **solo lectura**

**Hora de cierre**: al cerrar la sesión, se registra `hora_fin`.

---

### RN-12 — Historial

El historial es el **registro permanente** de la actividad de cada
participante.

**Persiste**:
- Aunque el participante se suspenda
- Aunque el participante salga de la sesión
- Aunque la sesión se cierre
- A través de múltiples sesiones

**Contenido por participante**:
- Partidas jugadas
- Partidas ganadas
- Partidas perdidas
- Partidas empatadas
- Total ganado ($)
- Total perdido ($)
- Balance ($)

---

### RN-13 — Persistencia de Estadísticas

Las estadísticas y balances **se persisten** en la base de datos (database) para optimizar las consultas y garantizar un acceso rápido. Estos datos se actualizan automáticamente con cada partida registrada, tanto a nivel de sesión como a nivel global del participante.

**Motivo**: aunque los datos derivados se pueden calcular desde las partidas, persistirlos mejora significativamente el rendimiento de las consultas de estadísticas, especialmente cuando hay muchas sesiones y partidas.

---

### RN-14 — Filtros

Las estadísticas y el historial se pueden filtrar por:

| Filtro | Formato | Ejemplo |
|--------|---------|---------|
| Por mes | `YYYY-MM` | `2026-10` |
| Por año | `YYYY` | `2026` |
| General | (sin filtro) | todo el historial |

---

### RN-15 — Local-first (primero local)

El registro de partidas ocurre en el **móvil**, incluso sin conexión.

**Flujo**:
1. El móvil registra la partida localmente (sin conexión - offline)
2. Cuando hay red, sincroniza con el servidor (backend)
3. El servidor (backend) **almacena** y actualiza los datos derivados
4. La web y el escritorio (desktop) son **solo lectura**: consultan al servidor

**Motivo**: el uso real del juego ocurre en un contexto sin conexión
confiable. La aplicación (app) debe funcionar siempre.

---

### RN-16 — Datos derivados de la sesión

Al cerrar una sesión, el sistema persiste los totales de la misma como una captura instantánea (snapshot) histórica inmutable. Esto incluye:

- Número total de partidas jugadas en la sesión
- Monto total apostado en la sesión
- Cantidad de participantes que intervinieron

**Motivo**: estos totales permiten consultas rápidas sobre sesiones pasadas sin necesidad de recorrer todas las partidas.

---

### RN-17 — Datos derivados del participante

El sistema guarda y mantiene actualizadas las siguientes métricas por cada participante:

- Partidas jugadas, ganadas, perdidas y empatadas
- Total ganado ($) y total perdido ($)
- Balance final ($)

Estas métricas se calculan y actualizan de forma incremental cada vez que se registra el resultado de una partida.

**Motivo**: persistir estas métricas permite mostrar estadísticas de forma inmediata sin calcularlas en tiempo real.

---

### RN-18 — Consistencia de datos derivados

El sistema debe garantizar que los datos derivados persistidos sean siempre coherentes con las partidas registradas (fuente de verdad). Esta consistencia se asegura mediante lógica de aplicación robusta o desencadenantes (triggers) en la base de datos que se ejecutan al registrar, modificar o anular una partida.

**Motivo**: aunque los datos derivados se persisten, deben mantenerse sincronizados con la fuente de verdad (las partidas) para evitar inconsistencias.

---

## Invariantes

Estas condiciones deben cumplirse **siempre**, en todo momento:

| ID | Invariante |
|----|-----------|
| INV-01 | Toda sesión tiene entre 3 y 5 participantes activos |
| INV-02 | Toda partida tiene entre 3 y 5 participantes |
| INV-03 | Todas las partidas de una sesión usan el mismo `valor_apuesta` |
| INV-04 | El `valor_apuesta` no cambia dentro de una sesión |
| INV-05 | Una sesión cerrada no puede modificarse |
| INV-06 | El balance de un participante es siempre `ganado − perdido` |
| INV-07 | Una partida termina con ganador único o con empate declarado |
| INV-08 | Un empate no genera transacciones de dinero |
| INV-09 | Los datos derivados persistidos son coherentes con las partidas registradas |

---

## Términos prohibidos

Los siguientes términos **no aplican** al dominio y no deben usarse
en código, documentación ni contratos:

| Término | Por qué no aplica |
|---------|-------------------|
| **pozo** | No hay acumulación de apuestas entre partidas |
| **neto** | El término correcto es `balance` |
| **apuestas acumuladas** | Los empates no acumulan apuestas |
| **ganancia neta** | El ganador recibe el total, sin restar su apuesta |

---

## Referencias

- Glosario: [`glosario.md`](glosario.md)
- Modelo de datos: [`modelo.md`](modelo.md)
- Flujos: [`flujos.md`](flujos.md)