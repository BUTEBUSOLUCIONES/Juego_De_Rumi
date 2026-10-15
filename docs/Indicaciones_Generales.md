# D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\docs\Indicaciones_Generales.md

# INDICACIONES GENERALES — PROYECTO RUMI V3

## 1. NOMENCLATURA Y LENGUAJE
Todo el contenido del proyecto se desarrolla ÚNICAMENTE en español, sin mezcla con otros idiomas.

### 1.1 Nombres de archivos
- Deben estar escritos exclusivamente en español
- No se utilizan términos, sufijos ni abreviaturas en inglés
- Ejemplo válido: `PantallaInicio.tsx`
- Ejemplo inválido: `HomeScreen.tsx`

### 1.2 Código y lógica
- Nombres de variables, métodos, funciones, atributos → solo en español
- Nombres de tablas, estructuras y datos → solo en español
- Comentarios y documentación interna → solo en español

Ejemplo válido:
```typescript
const totalApuestas = 0;
function calcularGanador() { }

Ejemplo inválido:
typescriptRunconst totalBets = 0;
function getWinner() { }

2. ESTRUCTURA OBLIGATORIA EN CADA ARCHIVO
2.1 Encabezado — Aplicable a TODOS los archivos
La primera línea de TODO archivo generado incluye comentario con ruta absoluta completa + nombre completo del archivo:
// D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\packages\mobile\src\screens\NombreArchivo.tsx

2.2 Descripción de funcionalidad — Archivos ejecutablesEn archivos que contienen lógica que se ejecuta (pantallas, componentes, servicios, utilidades), inmediatamente después del encabezado se agrega comentario que describe qué hace el archivo:
// D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\packages\mobile\src\screens\SesionActiva.tsx
// Pantalla principal: gestiona la sesión activa, visualización de participantes,
// acumulación de apuestas y resultados de cada partida

2.3 Comentario por cada función
Cada función o método incluye comentario previo que explica qué realiza:
// Calcula el monto total acumulado de apuestas en la sesión
// No suma valores cuando el resultado es empate
function calcularTotalApuestas(listaParticipantes, resultado) {
  // ...
}

// Devuelve el texto a mostrar en resumen según el resultado:
// - Si hay ganador → nombre y monto ganado
// - Si empate → mensaje de partida empatada
// Solo muestra uno de los dos estados, nunca ambos
function obtenerTextoResumen(partida) {
  // ...
}

2.4 Documentar la funcion 
// ==============================================================
// FUNCIÓN: NombreDeLaFuncion
// INICIO — Línea: XXX
// Propósito: Qué hace exactamente
// ==============================================================
const NombreDeLaFuncion = () => {
  // ... código interno ...
};
// ==============================================================
// FIN: NombreDeLaFuncion
// ==============================================================
. FUNCIONAMIENTO GENERAL DE LA APLICACIÓN
3.1 Principios de operación
Trabajo sin conexión: La aplicación funciona siempre con los datos almacenados en el dispositivo móvil, sin requerir conexión al servidor para operar.
Sincronización automática: Cuando el servidor está disponible, los datos se envían y reciben sin que el usuario realice ninguna acción.
Recuperación ante falta de conexión: Si el servidor no está accesible, la aplicación continúa normal; al restablecerse la conexión, se completa la sincronización en segundo plano.
Verificación al iniciar: Al abrir la aplicación, se comprueba el estado del servidor y se sincronizan los datos pendientes antes de mostrar la interfaz.
3.2 Configuración del servidor de base de dato
Parámetro	Valor
Dirección del servidor	192.168.1.53
Puerto	5432
Nombre de la base de datos	rumi
Usuario	postgres
Contraseña	postgres

3.3 Flujo de almacenamiento y sincronización
Al finalizar una partida en Sesión Activa, los resultados se guardan de inmediato en el dispositivo.
Si el servidor está disponible, los datos se envían automáticamente en segundo plano.
Historial y Estadísticas muestran siempre los datos locales, actualizándose cuando se reciben cambios del servidor.
Cada sesión y cada partida se registran de forma independiente, permitiendo ver detalle por sesión, por partida y por participante.


4. DOCUMENTACIÓN COMPLEMENTARIA
4.1. Instalacion_Base_Datos.md — Creación de la base de datos en PostgreSQL con DBeaver, estructura de tablas y configuración de acceso
Pruebas_y_Sincronizacion.md — Pasos para probar en el dispositivo, verificar conexión al servidor y comprobar la sincronización automática

4.2 Instalacion de sqllite 
npx expo install expo-sqlite
npx expo start --clear probar la aplicacion movil Escanear el código QR con Expo Go

4.3 Subir a Github 
https://github.com/login/device
facilitar:
Usuario: butebu_soluciones@gmx.es
Clave: 


git add .
git commit -m "Lo que cambiaste"
git push
https://github.com/BUTEBUSOLUCIONES

Ejecutar aplicacion 
npx expo start --clear 

Antes de generar el APK EN ANDROID STUDIO Ubicarte en 
D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\mobile
luego ejecuta este comando que genera toda la informacion para que se pueda crear el apk desde Android studio
npx expo prebuild --platform android --no-install
Qué hace este comando:
✅ Lee tus archivos actualizados (App.tsx, Sincronizacion.ts)
✅ Actualiza la carpeta android/ con los cambios nuevos
✅ NO reinstala paquetes — solo refresca lo necesario
✅ Cuando termine verás: "Finished prebuild"

Levantar Servidor web de Python 
# Activa el entorno virtual (si lo tienes)
venv\Scripts\activate

# Inicia el servidor
D:\PROYECTOS_2026\PROYECTOS_VS\Juego_de_Rumi\packages\server
uvicorn main:app --reload --host 0.0.0.0 --port 8000


5. HISTORIAL DE CAMBIOS
Fecha	Versión	Cambio realizado
2026-10-07	Inicial	Creación del documento: reglas de nomenclatura en español, estructura de carpetas y reglas de trabajo
2026-10-08	Actualización 1	Adicionadas reglas obligatorias: 
• Encabezado con ruta absoluta en TODOS los archivos 
• Comentario de funcionalidad en archivos ejecutables 
• Comentario descriptivo por cada función

2026-10-08  Actualización 2  Adicionados:
• Funcionamiento general: modo sin conexión + sincronización automática
• Datos de conexión al servidor PostgreSQL
• Flujo de guardado y sincronización de sesiones y partidas
• Referencia a documentos complementarios
2026-10-09  Documentar inicio y fin de funciones