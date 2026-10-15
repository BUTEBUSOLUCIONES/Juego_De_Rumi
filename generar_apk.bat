@echo off
cls
chcp 65001 >nul
title Generar Rumi.apk
color 0A

set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot"
set "ANDROID_HOME=C:\Android-SDK_2025_06"
set "ANDROID_NDK_HOME=C:\Android-SDK_2025_06\ndk\27.1.12297006"
set "ANDROID_NDK_ROOT=%ANDROID_NDK_HOME%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo ==================================================
echo   GENERADOR DE APK - PARTIDAS DE RUMI
echo ==================================================
echo.

echo [1/5] Verificando JDK 17...
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo    ERROR: No se encuentra JDK 17 en: %JAVA_HOME%
    pause & exit /b 1
)
echo    OK

echo [2/5] Verificando Android SDK...
if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo    ERROR: No se encuentra el Android SDK en: %ANDROID_HOME%
    pause & exit /b 1
)
echo    OK

echo.
echo [3/5] Limpiando carpetas anteriores...
if exist android rmdir /s /q android
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo 2>nul
if exist Rumi.apk del /q Rumi.apk
echo    OK

echo.
echo [4/5] Regenerando proyecto Android (expo prebuild)...
call npx expo prebuild --platform android --clean
if %ERRORLEVEL% NEQ 0 (
    echo    ERROR en expo prebuild
    pause & exit /b 1
)
echo    OK

echo.
echo [5/5] Compilando APK con Gradle (esto tarda 5-15 min)...
echo    Inicio: %TIME%
cd android
call gradlew.bat assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
echo gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a --console=plain
echo call gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a 2>&1 | findstr /V "IDLE Download https"
if %ERRORLEVEL% NEQ 0 (
    echo    ERROR en la compilacion
    cd ..
    pause & exit /b 1
)
cd ..
echo    Fin: %TIME%
echo    OK

REM --- Copiar APK a la raiz ---
if not exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo    ERROR: No se encontro el APK generado
    pause & exit /b 1
)
copy /Y "android\app\build\outputs\apk\release\app-release.apk" "Rumi.apk" >nul

echo.
echo ==================================================
echo   ✅ ¡APK LISTO!
echo ==================================================
echo.
echo Archivo: %CD%\Rumi.apk
echo.
echo Abriendo carpeta...
start "" explorer /select,"%CD%\Rumi.apk"

echo.
pause