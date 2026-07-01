# Agua NFC

PWA para iPhone que registra `600 ml` cada vez que el NFC abre la URL con `?tap=1`.

## Como funciona

- La app guarda los registros en `localStorage` del dispositivo.
- Si el iPhone abre `https://tu-dominio/?tap=1`, la app suma automaticamente `600 ml`.
- Tambien puedes sumar manualmente, exportar los datos y deshacer el ultimo registro.

## Publicacion gratis con GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube estos archivos al repositorio.
3. Activa GitHub Pages desde `Settings > Pages`.
4. Publica desde la rama principal y la carpeta `/root`.
5. Tu URL quedara como `https://tuusuario.github.io/nombre-del-repo/`.

## Grabar el NFC

Usa la URL publica de la app terminada en:

```text
?tap=1
```

Ejemplo:

```text
https://tuusuario.github.io/agua-nfc/?tap=1
```

## Nota importante sobre iPhone

En iPhone, el NFC no puede escribir directamente en una app nativa propia sin App Store. La forma mas fiable y gratuita es usar el NFC para abrir esta PWA instalada en pantalla de inicio.
