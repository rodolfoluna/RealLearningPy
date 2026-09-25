# RealLearningPy

Curso interactivo de **Python en español** para principiantes, que funciona **sin conexión a internet**
en computadoras, tabletas y celulares. Está basado en [futurecoder](https://github.com/alexmojaki/futurecoder)
(licencia MIT), adaptado para usarse en escuelas con mala o nula conectividad.

## ¿Qué cambia respecto a futurecoder?

- **Todo en español**: temas, ejercicios, pistas e interfaz. El código Python (palabras clave como
  `print`, `for`, `def`, `if`) se mantiene igual; sólo se traducen los nombres de variables y los textos.
- **100% local**: sin cuentas, sin inicio de sesión, sin servidor ni base de datos. Python se ejecuta
  dentro del navegador (Pyodide) con archivos incluidos en la propia app.
- **PWA instalable**: después de abrirla una vez, queda guardada en el dispositivo y funciona sin internet.
- **Responsive**: en celulares y tabletas en vertical se alterna entre las pestañas *Lección* y *Código*.
- **Perfil del alumno**: la primera vez, el alumno escribe su **número de control**, su **nombre** y una
  **contraseña**. El avance se guarda automáticamente en el dispositivo.
- **Archivo de avance cifrado (`.rlpy`)**: desde el botón *Mi avance* el alumno lo descarga (o lo comparte
  por WhatsApp, correo, etc. en el celular) para entregarlo al profesor o continuar en otro dispositivo.
  - Sólo lo pueden abrir **el propio alumno** (con su contraseña) y **el profesor** (con su clave privada).
  - Un alumno no puede abrir el archivo de otro alumno.
  - Si el archivo se modifica, deja de poder abrirse.
- **Panel del profesor**: abre los archivos de todos los alumnos a la vez, muestra el avance por alumno y por
  lección (con fechas), descarga un reporte **CSV para Excel** y permite **restablecer la contraseña** de un alumno.
- Se quitó el "modo desarrollador" para que los alumnos no puedan saltarse pasos.

## Guía para el profesor

### 1. Crear tus claves (una sola vez)

1. Abre la app y en la pantalla inicial elige **Soy profesor** (o *Menú → Panel del profesor*).
2. En **Generar claves del profesor** escribe una contraseña (mínimo 8 caracteres) y pulsa *Generar claves*.
3. Se descarga `clave_privada_profesor.json`. **Guárdalo en un lugar seguro con su contraseña y no lo compartas.**
   Si lo pierdes no podrás abrir los archivos creados para esa clave.
4. Copia la **clave pública** que aparece en pantalla y configúrala en la app (paso 2).

### 2. Configurar la clave pública en la app

Elige una opción y vuelve a publicar la app:

- **GitHub Pages (recomendado)**: en el repositorio ve a *Settings → Secrets and variables → Actions →
  Variables* y crea la variable `CLAVE_PUBLICA_PROFESOR` con el valor de la clave pública.
- O edita `frontend/src/config/profesor.json` y pega la clave en el campo `clavePublica`.
- O compila con la variable de entorno `REACT_APP_CLAVE_PUBLICA_PROFESOR`.

Haz esto **antes** de que los alumnos empiecen: los archivos creados sin clave de profesor sólo los puede abrir
el alumno (basta con que el alumno vuelva a descargar su archivo cuando la clave ya esté configurada).
En el panel verás la **huella** de la clave configurada (p. ej. `8742-339D-94E7`) para comprobar que coincide.

### 3. Revisar el avance de los alumnos

1. *Panel del profesor → Abrir mi clave de profesor*: elige `clave_privada_profesor.json` y escribe su contraseña.
2. Elige (o arrastra) los archivos `.rlpy` de los alumnos. Puedes abrir muchos a la vez; si hay varios del mismo
   alumno se muestra el más reciente.
3. *Ver detalle* muestra el avance por capítulo y lección, las fechas y el código que tenía en el editor.
4. *Descargar reporte (CSV/Excel)* genera una hoja con todos los alumnos.
5. *Restablecer contraseña*: si un alumno olvidó su contraseña, crea una copia de su archivo con una contraseña
   nueva. El alumno la carga con *Ya tengo mi archivo de avance*.

La clave privada sólo se usa en memoria mientras el panel está abierto; nada se envía a ningún servidor.

## Guía para el alumno

- **Primera vez**: *Soy alumno nuevo* → número de control, nombre y contraseña.
- **Al volver a abrir la app** en el mismo dispositivo: escribe tu contraseña.
- **Guardar / entregar tu avance**: botón con tu nombre (arriba) → *Descargar mi archivo de avance*
  (o *Compartir / enviar* en el celular). Un **!** amarillo indica que tienes avance que aún no está en tu archivo.
- **Continuar en otro dispositivo**: en la pantalla inicial elige *Ya tengo mi archivo de avance*, selecciona tu
  archivo `.rlpy` y escribe tu contraseña.
- **Dispositivo compartido**: al terminar, descarga tu archivo y usa *Mi avance → Cambiar de alumno*, que borra tu
  avance de ese dispositivo.

## Publicar la aplicación

### Opción A: GitHub Pages (recomendada)

El flujo `.github/workflows/publicar.yml` compila y publica la app automáticamente al actualizar la rama `main`.

1. En GitHub: *Settings → Pages → Source → GitHub Actions* (una sola vez).
2. (Opcional) crea la variable `CLAVE_PUBLICA_PROFESOR` (ver arriba).
3. Haz *push* a `main` o ejecuta el flujo manualmente desde la pestaña *Actions*.

La app queda en `https://<usuario>.github.io/<repositorio>/`. Cada alumno necesita internet **sólo la primera
vez** que la abre (descarga unos 25 MB); después puede instalarla (menú del navegador → *Instalar app* /
*Agregar a pantalla de inicio*) y usarla sin conexión.

### Opción B: en una computadora, sin internet

```bash
./scripts/install_deps.sh       # una vez (requiere Python 3.12.1, poetry y Node 22)
./scripts/build.sh              # genera la carpeta dist/
python scripts/servir_local.py  # abre http://localhost:8000
```

La carpeta `dist/` se puede copiar a otra computadora y servir con `python scripts/servir_local.py`
(sólo se necesita Python). También se puede alojar en cualquier servidor web estático, en cualquier subcarpeta.

> **Importante:** los navegadores sólo permiten instalar la PWA, trabajar sin conexión y usar `input()` en páginas
> servidas por **HTTPS** o desde **localhost**. Una dirección tipo `http://192.168.x.x` en la red local no sirve para
> celulares; en ese caso usa GitHub Pages (u otro hosting con HTTPS) para la primera descarga.

## Detalles técnicos

- Cifrado del archivo de avance (`frontend/src/local/cripto.js`, librerías [@noble](https://paulmillr.com/noble/)
  en JavaScript puro, funcionan sin conexión):
  - los datos se cifran con una clave aleatoria usando **XChaCha20-Poly1305**;
  - esa clave se guarda cifrada con la contraseña del alumno (**scrypt**) y con la clave pública del profesor
    (**X25519** + HKDF).
- Perfil y avance del alumno: `frontend/src/local/perfil.js` (IndexedDB en el dispositivo).
- Pantallas nuevas: `frontend/src/local/Acceso.jsx`, `MiAvance.jsx`, `PanelProfesor.jsx`.
- La traducción al español de la lección *Crear pares clave-valor*, que faltaba en futurecoder, está en
  `translations/extra/` y se aplica con `python -m translations.extra.apply_extra_es`.
- Limitaciones conocidas: al no haber servidor, un alumno con conocimientos técnicos podría inspeccionar o
  alterar los datos guardados en su propio navegador. El cifrado protege los archivos frente a otros alumnos,
  pero no es un sistema antitrampas.

## Créditos y licencia

Basado en [futurecoder](https://futurecoder.io) de Alex Hall y colaboradores, con la traducción al español de su
comunidad. Licencia MIT (ver `LICENSE.txt`).
