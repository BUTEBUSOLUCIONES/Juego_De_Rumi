# Flujos del dominio

Flujos de uso de **Partidas_de_Rumi**. Describen cómo interactúan los
actores con el sistema para cumplir las reglas de negocio.

Referencias:
- [Glosario](glosario.md)
- [Reglas de negocio](reglas-negocio.md)
- [Modelo de datos](modelo.md)

---

## Actores y roles

### Administrador global

- Es **un participante** (no un usuario externo)
- Hay **uno solo** en el sistema
- **No cambia** durante la operación normal del juego
- Se puede cambiar solo como **gestión de la aplicación (app)** (fuera de sesiones)
- **NO opera en sesiones**: su rol es administrativo del sistema

**Responsabilidades**:
- Crear participantes
- Transferir su propio rol (gestión de la aplicación)
- (Otras tareas administrativas por definir)

**No puede**:
- Abrir sesiones
- Registrar partidas
- Declarar ganadores o empates

### Administrador de sesión

- Es un **participante** de la sesión
- Se designa **antes de iniciar la sesión**
- **Siempre** existe uno por sesión
- Si el grupo no lo designa, se toma **el de la última sesión**
- Se puede **cambiar** por acuerdo entre participantes

**Responsabilidades**:
- Abrir la sesión
- Registrar partidas
- Declarar ganador o empate
- Cerrar la sesión

### Participante

- Juega en la sesión
- Consulta sus propias estadísticas
- Puede ser designado administrador de sesión

**No puede**:
- Abrir sesión
- Registrar partidas
- Declarar ganador o empate
- Crear participantes
- Consultar estadísticas de otros participantes

### Consulta

- Cada participante tiene la aplicación (móvil, web o escritorio)
- Desde cualquier plataforma puede consultar **sus propias** estadísticas
- El administrador de sesión puede consultar **las de todos**

---

## Flujo 1 — Gestión de participantes (administrador global)

**Quién**: administrador global

**Cuándo**: fuera de sesiones

**Pasos**:

1. El administrador global abre la aplicación (app)
2. Selecciona "Crear participante"
3. Ingresa el **nombre** del nuevo participante
4. El sistema valida que el nombre sea único
5. El sistema crea el participante con `activo = verdadero`
6. El participante queda disponible para futuras sesiones

**Reglas aplicadas**:
- Nombre único global (modelo: Participante)
- Un participante no se elimina; se marca `activo = falso`

---

## Flujo 2 — Apertura de sesión

**Quién**: administrador de sesión designado

**Precondiciones**:
- Existe un administrador de sesión designado
- Hay entre 3 y 5 participantes disponibles

**Pasos**:

1. Los participantes acuerdan quién será el administrador de sesión
   (si no acuerdan, se usa el de la última sesión)
2. El administrador de sesión abre la aplicación (app)
3. Selecciona "Abrir sesión"
4. Ingresa:
   - Fecha (un solo día)
   - Hora de inicio
   - Participantes (entre 3 y 5)
   - Valor de apuesta
5. El sistema valida:
   - Fecha es de un solo día (RN-01)
   - Participantes entre 3 y 5 (RN-03)
   - Valor de apuesta > 0
6. El sistema crea la sesión con `estado = abierta`
7. El sistema inicializa los totales de la sesión:
   - `total_partidas = 0`
   - `total_apostado_sesion = 0`
8. La sesión queda lista para registrar partidas

**Reglas aplicadas**:
- RN-01, RN-02, RN-03, RN-05, RN-09, RN-16

---

## Flujo 3 — Entrada o salida de participante

**Quién**: administrador de sesión

**Precondiciones**:
- La sesión está `abierta`

**Pasos (entrada)**:

1. El administrador de sesión selecciona "Agregar participante"
2. Elige un participante existente
3. El sistema valida que después de agregarlo sigan siendo <= 5
4. El participante se agrega a `participantes_ids`
5. Su historial empieza a contar desde ese momento

**Pasos (salida)**:

1. El administrador de sesión selecciona "Quitar participante"
2. Elige un participante de la sesión
3. El sistema valida que después de quitarlo sigan siendo >= 3
4. El participante se quita de `participantes_ids`
5. **Su historial se conserva** (las partidas ya jugadas cuentan)
6. Sus estadísticas globales (EstadisticaGlobalParticipante) permanecen intactas

**Reglas aplicadas**:
- RN-03, RN-10, RN-17

---

## Flujo 4 — Registro de partida con ganador

**Quién**: administrador de sesión

**Precondiciones**:
- La sesión está `abierta`
- Hay entre 3 y 5 participantes seleccionados para la partida

**Pasos**:

1. El administrador de sesión selecciona "Registrar partida"
2. Selecciona los participantes que jugarán (subconjunto de la sesión)
3. Confirma hora de inicio
4. Al terminar la partida, declara el resultado: **ganador**
5. Selecciona el participante ganador
6. El sistema valida:
   - Participantes entre 3 y 5 (RN-03)
   - Ganador está entre los participantes de la partida (RN-08)
7. El sistema registra la partida con `resultado = ganador`
8. El sistema calcula y persiste el `monto_total_apuestas` de la partida:
   - `monto_total_apuestas = cantidad de participantes × valor_apuesta`
9. El sistema calcula las transacciones:
   - Ganador: recibe `n × valor_apuesta`
   - Perdedores: pierden `valor_apuesta` cada uno
10. El sistema actualiza las estadísticas persistidas (RN-17):
    - **EstadisticaSesionParticipante** de cada participante:
      - `partidas_jugadas += 1`
      - Si es ganador: `partidas_ganadas += 1`, `total_ganado += monto_recibido`
      - Si es perdedor: `partidas_perdidas += 1`, `total_perdido += valor_apuesta`
      - `balance = total_ganado - total_perdido`
    - **EstadisticaGlobalParticipante** de cada participante:
      - Mismas actualizaciones incrementales
11. El sistema actualiza los totales de la sesión (RN-16):
    - `total_partidas += 1`
    - `total_apostado_sesion += monto_total_apuestas`

**Reglas aplicadas**:
- RN-03, RN-04, RN-05, RN-06, RN-07, RN-16, RN-17, RN-18

---

## Flujo 5 — Registro de partida con empate

**Quién**: administrador de sesión

**Precondiciones**:
- La sesión está `abierta`
- Hay entre 3 y 5 participantes seleccionados para la partida

**Pasos**:

1. El administrador de sesión selecciona "Registrar partida"
2. Selecciona los participantes que jugarán
3. Confirma hora de inicio
4. Al terminar la partida, declara el resultado: **empate**
5. Selecciona los participantes que empataron (mínimo 2)
6. El sistema valida:
   - Participantes entre 3 y 5 (RN-03)
   - Empatados >= 2 (RN-08)
   - Empatados están entre los participantes de la partida
7. El sistema registra la partida con `resultado = empate`
8. El sistema calcula y persiste el `monto_total_apuestas` de la partida:
   - `monto_total_apuestas = cantidad de participantes × valor_apuesta`
9. **NO se generan transacciones** de dinero (RN-08)
10. El sistema actualiza las estadísticas persistidas (RN-17):
    - **EstadisticaSesionParticipante** de cada participante:
      - `partidas_jugadas += 1`
      - Si empató: `partidas_empatadas += 1`
      - `balance` no cambia (empate no genera transacciones)
    - **EstadisticaGlobalParticipante** de cada participante:
      - Mismas actualizaciones incrementales
11. El sistema actualiza los totales de la sesión (RN-16):
    - `total_partidas += 1`
    - `total_apostado_sesion += monto_total_apuestas`
12. **Automáticamente** se crea una **nueva partida** para repetir el juego
13. Se repite el flujo hasta que haya un ganador

**Reglas aplicadas**:
- RN-08, RN-16, RN-17, RN-18

**Nota**: la nueva partida se crea automáticamente, pero el administrador
debe **declarar el resultado** de la nueva partida (ganador o empate).

---

## Flujo 6 — Cierre de sesión

**Quién**: administrador de sesión

**Precondiciones**:
- La sesión está `abierta`
- No hay partidas pendientes (toda partida terminó con ganador o empate)

**Pasos**:

1. El administrador de sesión selecciona "Cerrar sesión"
2. El sistema valida que no haya partidas sin resultado
3. El sistema registra `hora_fin`
4. El sistema cambia `estado` a `cerrada`
5. La sesión pasa a **solo lectura**
6. El sistema consolida los totales de la sesión como captura instantánea (snapshot) histórica inmutable (RN-16):
   - `total_partidas` (ya actualizado incrementalmente)
   - `total_apostado_sesion` (ya actualizado incrementalmente)
   - Estos valores quedan fijados y no pueden modificarse
7. Los totales quedan disponibles para consulta

**Reglas aplicadas**:
- RN-11, RN-16

**Nota**: no se puede cerrar una sesión con partidas "abiertas". Como
toda partida termina con ganador o empate, en la práctica esto significa
que no haya partidas en curso.

---

## Flujo 7 — Consulta de estadísticas (participante)

**Quién**: participante

**Pasos**:

1. El participante abre la aplicación (móvil, web o escritorio)
2. Selecciona "Mis estadísticas"
3. El sistema lee directamente las estadísticas persistidas (RN-13):
   - **EstadisticaSesionParticipante** (por sesión)
   - **EstadisticaGlobalParticipante** (general)
4. El sistema muestra **solo sus** estadísticas:

**Por sesión** (desde EstadisticaSesionParticipante):
- Partidas jugadas
- Partidas ganadas
- Partidas perdidas
- Partidas empatadas
- Total ganado
- Total perdido
- Balance

**General** (desde EstadisticaGlobalParticipante):
- Sesiones jugadas
- Partidas jugadas
- Partidas ganadas
- Partidas perdidas
- Partidas empatadas
- Total ganado
- Total perdido
- Balance

**Filtros**:
- Por mes (AAAA-MM)
- Por año (AAAA)
- General

**Reglas aplicadas**:
- RN-12, RN-13, RN-14, RN-17

---

## Flujo 8 — Consulta de estadísticas (administrador de sesión)

**Quién**: administrador de sesión

**Pasos**:

1. El administrador abre la aplicación (app)
2. Selecciona "Estadísticas de la sesión"
3. El sistema lee directamente las estadísticas persistidas (RN-13):
   - Totales de la sesión (desde Sesion)
   - **EstadisticaSesionParticipante** de todos los participantes
4. El sistema muestra las estadísticas de **todos** los participantes:

**Por sesión** (desde Sesion):
- Cantidad de partidas (`total_partidas`)
- Cantidad de participantes
- Fecha y duración (`hora_fin` − `hora_inicio`)
- Total apostado (`total_apostado_sesion`)

**Por participante** (desde EstadisticaSesionParticipante):
- Partidas jugadas / ganadas / perdidas / empatadas
- Total ganado / perdido
- Balance

**Filtros**:
- Por mes (AAAA-MM)
- Por año (AAAA)
- General

**Reglas aplicadas**:
- RN-13, RN-14, RN-16, RN-17

---

## Resumen de permisos

| Acción | Admin global | Admin sesión | Participante |
|--------|--------------|--------------|--------------|
| Crear participante | Sí | No | No |
| Transferir su rol | Sí | No | No |
| Abrir sesión | No | Sí | No |
| Agregar/quitar participante | No | Sí | No |
| Registrar partida | No | Sí | No |
| Declarar ganador/empate | No | Sí | No |
| Cerrar sesión | No | Sí | No |
| Consultar sus estadísticas | Sí | Sí | Sí |
| Consultar estadísticas de todos | No | Sí | No |

---

## Referencias

- Glosario: [glosario.md](glosario.md)
- Reglas de negocio: [reglas-negocio.md](reglas-negocio.md)
- Modelo de datos: [modelo.md](modelo.md)