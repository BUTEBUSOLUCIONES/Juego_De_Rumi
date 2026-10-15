# 🔧 Guía de Actualización y Mantenimiento — Laptop AMD Ryzen 7 5700U

> **Documento de referencia personal**
> Fecha de creación: Octubre 2026
> Propósito: Mantener la laptop estable, rápida y sin pantallas negras

---

## 📊 Ficha Técnica de mi Laptop

| Componente | Modelo | Estado actual | Estado deseado |
|---|---|---|---|
| **CPU** | AMD Ryzen 7 5700U with Radeon Graphics | OK | OK |
| **GPU** | AMD Radeon(TM) Graphics (integrada Vega 8) | ⚠️ Driver de 2022 | Driver 2025/2026 |
| **RAM** | 64 GB | ✅ Excelente | ✅ |
| **Almacenamiento** | SSD (interno) + HDD (externo) | ✅ | ✅ |
| **Driver GPU actual** | `31.0.12044.3` (24/10/2022) | 🚨 Muy viejo | `Adrenalin 26.5.2` (21/05/2026) |
| **Sistema Operativo** | Windows 10/11 | Verificar | Actualizado |

---

## 🚨 Problema Detectado: Pantalla Negra Intermitente

### Síntomas
- La pantalla completa se pone **negra** de forma intermitente
- Ocurre **incluso sin cargas pesadas** (navegando, escribiendo)
- No aparece mensaje de error de Windows
- Vuelve sola después de 1-5 segundos

### Causa Raíz
**Driver AMD desactualizado (octubre 2022)** con un bug conocido en el **Panel Self Refresh (PSR)** de GPUs integradas AMD en laptops Ryzen 5000U.

### Solución
Actualizar el driver a la versión más reciente (2026).

---

## ✅ PASO 1: Actualizar Driver AMD

### 🔍 Antes de empezar

1. **Verificar tu driver actual** — Abre PowerShell y ejecuta:
   ```powershell
   Get-CimInstance -ClassName Win32_VideoController | Select-Object Name, DriverVersion, DriverDate
   ```

2. **Anota la versión actual** para comparar después.

---

### 📥 Opción A: Driver oficial del fabricante (RECOMENDADO para laptops)

> ⚠️ **AMD recomienda usar los drivers del fabricante (OEM) para laptops.** Esto evita problemas de compatibilidad con el hardware específico.

**Si tu laptop es Lenovo:**
👉 [Descargar driver Lenovo (v31.0.21923.4006, 23/10/2025)](https://newsupport.lenovo.com.cn/driveDownloads_detail.html?driveId=149318)

**Si tu laptop es HP, Dell, Asus, Acer, etc.:**
Busca "drivers" + el modelo de tu laptop en la web oficial del fabricante.

---

### 📥 Opción B: Driver genérico de AMD (la más actualizada)

**Enlace directo a la página oficial de AMD para tu CPU:**
👉 **[AMD Drivers para Ryzen 7 5700U](https://www.amd.com/es/support/downloads/drivers.html/processors/ryzen/ryzen-5000-series/amd-ryzen-7-5700u.html)**

- **Versión recomendada:** `Adrenalin 26.5.2 (WHQL Recommended)` [citation:1][citation:2]
- **Fecha de lanzamiento:** 21/05/2026 [citation:1]
- **Tamaño del archivo:** ~623 MB [citation:1]

---

### 🔧 Instalación paso a paso

1. **Descarga** el archivo `.exe` del driver.
2. **Cierra** todos los programas (navegador, VS Code, etc.).
3. **Ejecuta** el instalador como administrador.
4. Cuando pregunte el tipo de instalación, elige:
   - ✅ **"Factory Reset"** o **"Instalación limpia"** [citation:6]
   - Esto elimina el driver viejo por completo.
5. **Espera** a que termine (puede tardar 5-10 min).
6. **Reinicia** la laptop.
7. **Verifica** que quedó bien:
   ```powershell
   Get-CimInstance -ClassName Win32_VideoController | Select-Object Name, DriverVersion, DriverDate
   ```

---

## ✅ PASO 2: Configuraciones Recomendadas

### 2.1 Desactivar Panel Self Refresh (PSR)

Si después de actualizar el driver aún ves pantallas negras:

1. Abre **AMD Software: Adrenalin Edition**.
2. Ve a **Configuración** → **Pantalla**.
3. Desactiva:
   - ❌ **Panel Self Refresh**
   - ❌ **Vari-Bright**
4. Reinicia.

---

### 2.2 Configuración de energía

**Windows:**
1. Panel de control → **Opciones de energía**.
2. Selecciona **"Alto rendimiento"**.
3. Clic en **"Cambiar configuración del plan"** → **"Cambiar configuración avanzada de energía"**.
4. En **"Procesador"** → **"Estado mínimo del procesador"** → **5%**.
5. En **"Gráficos"** → **"Directiva de energía de gráficos"** → **"Rendimiento máximo"**.
6. Aplicar y aceptar.

**AMD Software:**
1. Abre **AMD Software: Adrenalin Edition**.
2. Ve a **Rendimiento** → **Ajustes**.
3. Elige **"Optimizar para rendimiento"** (en vez de "Ahorro de energía").

---

### 2.3 Desactivar aceleración de hardware en navegadores

**Por qué:** El navegador usa la GPU para renderizar. Si el driver falla, el navegador se pinta en negro. Desactivando esto, la GPU se reserva para tareas críticas.

**En Chrome:**
1. `chrome://settings/system`
2. Desactiva **"Usar aceleración por hardware cuando esté disponible"**.
3. Reinicia Chrome.

**En Edge:**
1. `edge://settings/system`
2. Desactiva **"Usar aceleración por hardware cuando esté disponible"**.
3. Reinicia Edge.

**En Firefox:**
1. `about:preferences#general`
2. Baja hasta **"Rendimiento"**.
3. Desmarca **"Usar ajustes de rendimiento automáticos"**.
4. Desmarca **"Usar aceleración por hardware cuando esté disponible"**.
5. Reinicia Firefox.

---

## ✅ PASO 3: Actualizaciones de Windows

### 3.1 Windows Update
1. **Configuración** → **Windows Update**.
2. Clic en **"Buscar actualizaciones"**.
3. Instala **todas** las que aparezcan.
4. Reinicia.

### 3.2 Drivers opcionales
1. **Configuración** → **Windows Update** → **Opciones avanzadas**.
2. **"Actualizaciones opcionales"**.
3. Marca **todas** las actualizaciones de drivers.
4. Instala y reinicia.

---

## ✅ PASO 4: Limpieza y Mantenimiento

### 4.1 Limpieza de software

- **Liberador de espacio en disco:**
  ```powershell
  cleanmgr
  ```
  Marca todas las casillas → Limpiar.

- **SFC y DISM** (reparar archivos del sistema):
  ```powershell
  sfc /scannow
  DISM /Online /Cleanup-Image /RestoreHealth
  ```
  Ejecutar **como administrador**.

### 4.2 Verificar temperaturas

Descarga **HWiNFO** para monitorear:
- **Enlace de descarga (portable):** 👉 [HWiNFO Portable 8.54](https://portableapps.com/apps/utilities/hwinfo-portable) [citation:3]

**Temperaturas normales:**
- **CPU en reposo:** 40-55°C
- **CPU en carga:** 70-85°C
- **GPU en reposo:** 40-55°C
- **GPU en carga:** 65-80°C

Si supera **90°C** → problema de ventilación → limpieza urgente.

### 4.3 Verificar salud del disco

Descarga **CrystalDiskInfo** para ver el estado de tus discos:
- **Enlace de descarga (portable):** 👉 [CrystalDiskInfo Portable 9.9.1](https://portableapps.com/apps/utilities/crystaldiskinfo_portable) [citation:12]

---

## 🔗 Enlaces de Descarga Rápidos

| Recurso | URL |
|---|---|
| **AMD Drivers (Ryzen 7 5700U)** | [https://www.amd.com/es/support/downloads/drivers.html/processors/ryzen/ryzen-5000-series/amd-ryzen-7-5700u.html](https://www.amd.com/es/support/downloads/drivers.html/processors/ryzen/ryzen-5000-series/amd-ryzen-7-5700u.html) [citation:1] |
| **AMD Auto-Detect Tool** | [https://www.amd.com/es/support](https://www.amd.com/es/support) [citation:16] |
| **HWiNFO (temperaturas)** | [https://portableapps.com/apps/utilities/hwinfo-portable](https://portableapps.com/apps/utilities/hwinfo-portable) [citation:3] |
| **HWMonitor (temperaturas)** | [https://portableapps.com/apps/utilities/hwmonitor-portable](https://portableapps.com/apps/utilities/hwmonitor-portable) [citation:18] |
| **CrystalDiskInfo (discos)** | [https://portableapps.com/apps/utilities/crystaldiskinfo_portable](https://portableapps.com/apps/utilities/crystaldiskinfo_portable) [citation:12] |

---

## 📝 Historial de Cambios

| Fecha | Acción | Notas |
|---|---|---|
| Oct 2026 | Creación del documento | Driver actual: 31.0.12044.3 (2022) |
| _Pendiente_ | Actualización driver AMD | Objetivo: Adrenalin 26.5.2 o superior [citation:1] |
| _Pendiente_ | Desactivar PSR si persiste | |
| _Pendiente_ | Verificar temperaturas | |

---

**Última actualización:** Octubre 2026