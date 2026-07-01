# Agua NFC

PWA para iPhone que registra `600 ml` en Supabase cada vez que el NFC abre la URL con `?tap=1`.

## Como funciona

- La app guarda los registros en una tabla de Supabase compartida.
- Si el iPhone abre `https://tu-dominio/?tap=1`, la app inserta automaticamente `600 ml` en Supabase.
- Tambien puedes sumar manualmente y exportar los datos.

## Configuracion de Supabase

1. Abre el editor SQL de Supabase.
2. Pega el contenido de [supabase/setup.sql](/Users/ruben/Desktop/Inventos/Agua NFC/supabase/setup.sql).
3. Ejecuta el script.
4. Publica de nuevo la app en GitHub Pages.

La app ya lleva integrada esta configuracion:

- `SUPABASE_URL`: `https://sexfmvdjosqzyatmopyy.supabase.co`
- `PROFILE_ID`: `agua-personal-bf4f2e8d9a0647d8b7e0cfe6b0f4c7a1`

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

En iPhone, el NFC no escribe directamente dentro de una app web instalada. Lo que hace esta solucion es abrir la URL de la app, insertar `600 ml` en Supabase y mostrar el panel ya actualizado.
