# ADR-001: Nomenclatura en español y persistencia de datos derivados

- **Estado**: Aceptada
- **Fecha**: 2026-10-06
- **Decisores**: Equipo de desarrollo de Partidas_de_Rumi

---

## Contexto

Partidas_de_Rumi es un sistema de registro de partidas de Rumi (juego de apuestas) con arquitectura multiplataforma y local-first (primero local). El dominio del juego tiene términos propios en español (`sesion`, `partida`, `participante`, `balance`, `apuesta`) que son la base de toda la comunicación del equipo y de la documentación.

Durante la fase de definición del dominio, surgieron dos decisiones arquitectónicas fundamentales que afectan directamente cómo se escribe el código y cómo se diseña la base de datos (database):

1. **Nomenclatura del código**: ¿Los identificadores (funciones, variables, tablas, campos, interfaces, tipos) se escriben en español o en inglés?
2. **Datos derivados**: ¿Los balances, estadísticas y contadores se calculan en tiempo real desde las partidas (fuente de verdad) o se persisten en la base de datos (database) para optimizar el rendimiento?

---

## Decisión 1: Nomenclatura estricta en español

Todos los identificadores del código se escriben en **español**. Esto incluye:

| Categoría | Ejemplo correcto (español) | Ejemplo incorrecto (inglés) |
|-----------|---------------------------|-----------------------------|
| Funciones (functions) | `calcularBalance()` | `calculateBalance()` |
| Métodos (methods) | `obtenerPartidas()` | `getMatches()` |
| Variables (variables) | `totalGanado` | `totalWon` |
| Objetos (objects) | `participanteActivo` | `activePlayer` |
| Tablas (tables) | `participante`, `sesion`, `partida` | `player`, `session`, `match` |
| Campos (fields) | `valor_apuesta`, `hora_inicio` | `bet_value`, `start_time` |
| Atributos (attributes) | `activo`, `estado` | `active`, `status` |
| Parámetros (parameters) | `participanteId` | `playerId` |
| Interfaces (interfaces) | `ResultadoPartida` | `MatchResult` |
| Tipos (types) | `EstadoSesion` | `SessionStatus` |

**Excepción**: Solo los términos técnicos estándar que no tienen traducción de uso común permanecen en inglés: nombres de marcos de trabajo (frameworks), bibliotecas (libraries), protocolos, comandos de terminal y palabras reservadas del lenguaje TypeScript (`interface`, `type`, `const`, `function`, etc.).

### Motivación

- El dominio se nombra en español; mezclar idiomas crea fricción cognitiva.
- La documentación, los contratos y el código usan los mismos términos, eliminando la necesidad de un "diccionario de traducción" interno.
- Reduce errores de mapeo entre el modelo conceptual y la implementación.
- Facilita la incorporación de nuevos desarrolladores hispanohablantes.

### Consecuencias

- **Positiva**: Coherencia total entre documentación y código.
- **Positiva**: Menor carga cognitiva al navegar entre documentos y código fuente.
- **Negativa**: Posibles conflictos con bibliotecas (libraries) o APIs externas que usan inglés. Se resuelve con capas de adaptación (adaptadores) que traducen entre el dominio en español y las APIs externas en inglés.
- **Negativa**: Herramientas de análisis estático o convenciones de la comunidad TypeScript que asumen inglés. Se resuelve configurando las herramientas para aceptar español.

---

## Decisión 2: Persistencia de datos derivados

Los datos derivados (balances, estadísticas, contadores) **se persisten** en la base de datos (database) y se actualizan de forma incremental con cada partida registrada.

### Qué se persiste

| Dato derivado | Entidad donde se guarda | Referencia |
|---------------|------------------------|------------|
| Estadísticas por participante en una sesión | `EstadisticaSesionParticipante` | RN-17 |
| Estadísticas globales del participante | `EstadisticaGlobalParticipante` | RN-17 |
| Total de partidas y monto apostado en la sesión | Campos `total_partidas` y `total_apostado_sesion` en `Sesion` | RN-16 |
| Monto total de apuestas en una partida | Campo `monto_total_apuestas` en `Partida` | Modelo de datos |

### Cómo se mantiene la coherencia

- Las estadísticas se actualizan **incrementalmente** cada vez que se registra el resultado de una partida (RN-17).
- Al cerrar la sesión, los totales se consolidan como una **captura instantánea (snapshot) histórica inmutable** (RN-16).
- La coherencia entre los datos derivados y la fuente de verdad (las partidas) se garantiza mediante lógica de aplicación robusta o desencadenantes (triggers) en la base de datos (RN-18).
- La fuente de verdad sigue siendo **siempre** las partidas registradas. Los datos derivados son una optimización de rendimiento, no una fuente de verdad alternativa.

### Motivación

- Consultas de estadísticas más rápidas, especialmente con muchas sesiones y partidas.
- La aplicación (app) móvil y el servidor (backend) pueden leer estadísticas directamente sin cálculos pesados en tiempo real.
- Mejora la experiencia del usuario (user experience) al mostrar estadísticas de forma inmediata.

### Consecuencias

- **Positiva**: Rendimiento significativamente mejor en consultas de estadísticas.
- **Positiva**: Consultas simples sin necesidad de agregaciones complejas.
- **Negativa**: Mayor complejidad en la lógica de registro de partidas (hay que actualizar múltiples entidades).
- **Negativa**: Riesgo de desincronización si la lógica de actualización falla. Se mitiga con la regla RN-18 (consistencia garantizada) y validaciones transversales (VAL-09).
- **Negativa**: Mayor uso de espacio en la base de datos (database). Impacto mínimo dado el volumen esperado de datos.

---

## Documentos afectados

Esta decisión impacta directamente los siguientes documentos:

| Documento | Cambio |
|-----------|--------|
| `README.md` | Principio rector #8 (nomenclatura en español) |
| `reglas-negocio.md` | RN-13 modificada, RN-16 a RN-18 añadidas, INV-09 añadido |
| `modelo.md` | Nuevas entidades `EstadisticaSesionParticipante` y `EstadisticaGlobalParticipante`, campos derivados en `Sesion` y `Partida` |
| `glosario.md` | Definiciones de `balance`, `historial` y `sesion_cerrada` actualizadas |
| `flujos.md` | Pasos de actualización incremental añadidos en flujos 2 a 8 |

---

## Referencias

- Reglas de negocio: [`../domain/reglas-negocio.md`](../domain/reglas-negocio.md)
- Modelo de datos: [`../domain/modelo.md`](../domain/modelo.md)
- Glosario: [`../domain/glosario.md`](../domain/glosario.md)
- Flujos: [`../domain/flujos.md`](../domain/flujos.md)