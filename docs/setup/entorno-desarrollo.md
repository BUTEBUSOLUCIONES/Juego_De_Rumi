# Configuración del entorno de desarrollo

Documento verificado, paso a paso, para dejar un PC con Windows listo
para desarrollar **Partidas_de_Rumi**.

> **Filosofía**: todo el flujo debe poder ejecutarse desde VS Code.
> No se salta al navegador salvo para lo estrictamente necesario.

---

## 1. Contexto de referencia

Estos son los datos del PC donde se verificó este documento. Sirven
como referencia; si tu PC difiere, adapta las rutas.

| Dato | Valor |
|------|-------|
| Sistema operativo | Windows 11 |
| Usuario de Windows | `CANTARILLA\Administrador` |
| Carpeta de proyectos | `D:\PROYECTOS_2026\PROYECTOS_VS\` |
| Proyecto actual | `D:\PROYECTOS_2026\PROYECTOS_VS\Partidas_de_Rumi\` |
| Carpeta de claves SSH | `D:\PROYECTOS_2026\PROYECTOS_VS\.ssh\` |
| Carpeta de programas | `D:\Archivos_de_Programa\` |

### Decisión arquitectónica: todo vive en `D:\`

**Por qué**: `C:\` se pierde al reinstalar Windows. `D:\` sobrevive.
Las claves SSH, los programas, los proyectos y el monorepo viven en `D:\`.

---

## 2. Software requerido

| Herramienta | Versión verificada | Cómo se instaló |
|-------------|-------------------|-----------------|
| Node.js | 22.14.0 | Instalador desde nodejs.org |
| npm | 11.21.0 | `npm install -g npm@11` (actualización) |
| Git | 2.56.0.windows.1 | Instalador desde git-scm.com |
| GitHub CLI (`gh`) | 2.102.0 | `winget install --id GitHub.cli --location "D:\Archivos_de_Programa\GitHubCLI"` |
| ADB (platform-tools) | 1.0.41 (37.0.1) | Descarga manual desde developer.android.com |
| PostgreSQL | 12.19 | Instalador desde postgresql.org |
| VS Code | Última | Instalador desde code.visualstudio.com |

---

## 3. Verificación del entorno

Antes de empezar a desarrollar, verifica que todo responde:

```powershell
node -v       # v22.14.0
npm -v        # 11.21.0
git --version # git version 2.56.0.windows.1
gh --version  # gh version 2.102.0
adb version   # Android Debug Bridge version 1.0.41
psql --version # psql (PostgreSQL) 12.19

4. Configuración del PATH en Windows
Regla de oro
Cualquier modificación al PATH requiere reiniciar VS Code por completo
(no basta con cerrar la terminal). VS Code cachea el entorno al abrirse.

Cómo añadir una carpeta al PATH de usuario
NO usar setx directamente. setx trunca el valor a 1024 caracteres
y puede corromper el PATH si ya era largo.

Forma recomendada: al instalar con winget, usar --add-to-path:

winget install --id <paquete> --location "D:\ruta" --add-to-path

Forma manual correcta (si winget no lo soporta):

powershell
$ruta = "D:\ruta\a\anadir"
$pathActual = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$pathActual;$ruta", "User")
Verificar el PATH después de modificarlo
powershell
# Ver el PATH guardado del usuario
[Environment]::GetEnvironmentVariable("Path", "User")

# Ver el PATH activo de la terminal actual
$env:PATH -split ';'
Si el PATH guardado tiene la ruta pero el activo no, reinicia VS Code.

5. Claves SSH para GitHub
Decisión arquitectónica
Las claves SSH viven en D:\PROYECTOS_2026\PROYECTOS_VS\.ssh\:

Fuera de los repositorios: nunca se suben a GitHub por accidente.

Junto a los proyectos: portables, sobreviven a reinstalaciones.

Única carpeta para todos los proyectos: reutilizables.

Generar una clave nueva (sin passphrase)
powershell
ssh-keygen -t ed25519 `
  -f "D:\PROYECTOS_2026\PROYECTOS_VS\.ssh\id_ed25519" `
  -C "tu_email@ejemplo.com" `
  -N '""'
-t ed25519: algoritmo moderno, seguro y corto.

-f: ruta exacta donde guardar (no pregunta).

-C: comentario (queda al final de la clave pública).

-N '""': passphrase vacía (no pregunta contraseña).

Restringir permisos (obligatorio en Windows)
Windows por defecto da permisos demasiado abiertos y OpenSSH se niega
a usar la clave. Hay que restringirla:

powershell
$clave = "D:\PROYECTOS_2026\PROYECTOS_VS\.ssh\id_ed25519"

# Quitar herencia de permisos
icacls $clave /inheritance:r

# Dar lectura solo al usuario actual
icacls $clave /grant:r "$($env:USERNAME):R"

# Quitar permisos de Administradores y SYSTEM (los añade Windows por defecto)
icacls $clave /remove "BUILTIN\Administradores" "NT AUTHORITY\SYSTEM"

# Verificar resultado (debe aparecer solo el usuario con (R))
icacls $clave
Subir la clave pública a GitHub
Opción A — Manual (una sola vez):

Copiar el contenido de id_ed25519.pub al portapapeles:

powershell
Get-Content "D:\PROYECTOS_2026\PROYECTOS_VS\.ssh\id_ed25519.pub" | Set-Clipboard
Ir a https://github.com/settings/keys

New SSH key → título → pegar → Add SSH key

Opción B — Automática con gh:

powershell
gh auth login
# En el asistente:
#   - GitHub.com
#   - SSH
#   - ¿Generar nueva clave SSH? → No (si ya existe)
Verificar la conexión
powershell
ssh -T git@github.com -i "D:\PROYECTOS_2026\PROYECTOS_VS\.ssh\id_ed25519"
Resultado esperado:

text
Hi TU_USERNAME! You've successfully authenticated, but GitHub does not provide shell access.
6. GitHub CLI (gh)
Instalación
powershell
winget install --id GitHub.cli --location "D:\Archivos_de_Programa\GitHubCLI"
Problema conocido: winget no respeta --location en algunos casos
Verificar dónde quedó gh.exe:

powershell
Get-ChildItem -Path "D:\Archivos_de_Programa","C:\Program Files" -Recurse -Filter "gh.exe" -ErrorAction SilentlyContinue
Si quedó en D:\Archivos_de_Programa\GitHubCLI\gh.exe, hay que añadir esa
carpeta al PATH (ver sección 4).

Autenticación
powershell
gh auth login
Asistente interactivo:

Pregunta	Respuesta
Where do you use GitHub?	GitHub.com
Preferred protocol for Git operations?	SSH
Generate a new SSH key?	No (si ya existe una)
How to authenticate GitHub CLI?	Login with a web browser
Te mostrará un código de un solo uso. Pulsa Enter para abrir el navegador,
pega el código en la página de GitHub y autoriza gh.

Alternativa sin navegador: Personal Access Token (PAT)
Si quieres evitar el navegador por completo, usa un PAT:

Una sola vez: crear el token en https://github.com/settings/tokens

Scopes necesarios: repo, read:org, gist

Guardarlo como variable de entorno:

powershell

# ⚠️ NO ejecutar esta línea tal cual. Sustituir el valor por tu token real.
$env:GH_TOKEN = "<TU_TOKEN_REAL>"
Autenticar gh con el token:

powershell
"<TU_TOKEN_REAL>" | gh auth login --with-token
Verificar autenticación
powershell
gh auth status
Resultado esperado:

text
github.com
  ✓ Logged in to github.com account TU_USERNAME (keyring)
  - Active account: true
  - Git operations protocol: ssh
  - Token scopes: 'gist', 'read:org', 'repo'
7. Crear un repositorio en GitHub desde la terminal
Un solo comando hace todo: crea el repo, lo enlaza como origin, y sube la rama:

powershell
gh repo create NombreDelRepo --private --source=. --remote=origin --push
Flags:

--private o --public: visibilidad

--source=.: usa el directorio actual como fuente

--remote=origin: lo enlaza como origin

--push: sube la rama actual

Cambiar visibilidad después
powershell
gh repo edit USUARIO/REPO --visibility public --accept-visibility-change-consequences
O volver a privado:

powershell
gh repo edit USUARIO/REPO --visibility private --accept-visibility-change-consequences
8. Flujo típico de trabajo diario
powershell
# Ver estado del repo
git status

# Ver qué cambió
git diff

# Añadir y commitear
git add .
git commit -m "Descripción del cambio"

# Subir al remoto
git push

# Ver issues / PRs
gh issue list
gh pr list
9. Errores comunes y sus soluciones
gh: command not found tras instalarlo
Causa: VS Code cachea el PATH.
Solución: cerrar VS Code completamente y volver a abrirlo.

Bad permissions. Try removing permissions for user: \\Todos (SSH)
Causa: la clave privada tiene permisos demasiado abiertos.
Solución: ver sección 5, restricción de permisos con icacls.

Permission denied (publickey) al hacer SSH a GitHub
Causas posibles:

La clave pública no está añadida en GitHub → añadirla

La clave privada tiene permisos incorrectos → ver sección 5

gh o Git no saben dónde buscar la clave → configurar:

powershell
git config core.sshCommand "ssh -i D:/PROYECTOS_2026/PROYECTOS_VS/.ssh/id_ed25519"
npm error Cannot read properties of null (reading 'edgesOut')
Causa: bug conocido de npm 10.x.
Solución: actualizar npm:

powershell
npm install -g npm@11
setx corrompe el PATH
Causa: setx trunca a 1024 caracteres.
Solución: no usar setx para el PATH. Ver sección 4.

10. Notas para adaptar este documento a otro PC
Las rutas D:\PROYECTOS_2026\... y D:\Archivos_de_Programa\... son
específicas del PC de referencia. Sustituir por las rutas equivalentes.

El usuario CANTARILLA\Administrador es específico. Sustituir.

Las versiones de software son las verificadas. Versiones más recientes
deberían funcionar igual, pero conviene verificar.

El correo butebu_soluciones@gmx.es es específico. Sustituir.

11. Referencias
Documento de migración: docs/00-indice.md

Reglas de negocio: docs/domain/reglas-negocio.md

Decisiones arquitectónicas: docs/adr/

text

Guarda (`Ctrl + S`).

**Dime LISTO cuando esté guardado.** No avanzo hasta entonces.
