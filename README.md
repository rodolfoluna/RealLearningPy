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
- **App del profesor separada** (`/profesor/`): abre los archivos de todos los alumnos a la vez, muestra el
  avance por alumno y por lección (con fechas), descarga un reporte **CSV para Excel** y permite **restablecer la
  contraseña** de un alumno. La app del alumno no incluye nada de esta parte.
- **Llave del profesor basada en una frase secreta**: no existe ningún archivo de llave que se pueda descargar,
  copiar o perder; la llave se calcula cada vez a partir de la frase que sólo conoce el profesor.
- Se quitó el "modo desarrollador" para que los alumnos no puedan saltarse pasos.

## Guía para el profesor

La app del profesor está en `https://<usuario>.github.io/<repositorio>/profesor/` (o en `dist/profesor/` si la
compilas tú). También funciona sin conexión después de abrirla una vez.

### 1. Crear tu frase secreta (una sola vez)

1. Abre la app del profesor. Mientras la app de los alumnos no tenga configurada tu llave, verás
   **Crea tu frase secreta**.
2. Escribe una frase de **al menos 4 palabras sin relación entre sí** (por ejemplo, *nopal bicicleta lunes marimba
   ventana*) y repítela. No distingue mayúsculas ni espacios extra.
3. La app calcula tu llave y te muestra la **llave pública** (no es secreta).

> **Importante:** la frase no se guarda en ningún lugar. Memorízala o guárdala en un lugar seguro. Si la olvidas,
> no podrás abrir los archivos de los alumnos; si alguien más la conoce, podrá abrirlos.

### 2. Configurar la llave pública en la app de los alumnos

En GitHub ve a *Settings → Secrets and variables → Actions → Variables*, crea la variable
`CLAVE_PUBLICA_PROFESOR` con la llave pública y vuelve a publicar (pestaña *Actions → Publicar en GitHub Pages →
Run workflow*). También puedes pegarla en `frontend/src/config/profesor.json` o compilar con
`REACT_APP_CLAVE_PUBLICA_PROFESOR`.

Hazlo **antes** de que los alumnos empiecen: los archivos creados sin llave de profesor sólo los puede abrir el
alumno (basta con que el alumno vuelva a descargar su archivo cuando la llave ya esté configurada).

### 3. Revisar el avance de los alumnos

1. Abre la app del profesor y escribe tu frase secreta. Si la escribes mal, la app te avisa que no corresponde a
   la llave configurada (huella, p. ej. `2E79-5259-4B3E`).
2. Elige (o arrastra) los archivos `.rlpy` de los alumnos. Puedes abrir muchos a la vez; si hay varios del mismo
   alumno se muestra el más reciente.
3. *Ver detalle* muestra el avance por capítulo y lección, las fechas y el código que tenía en el editor.
4. *Descargar reporte (CSV/Excel)* genera una hoja con todos los alumnos.
5. *Restablecer contraseña*: si un alumno olvidó su contraseña, crea una copia de su archivo con una contraseña
   nueva. El alumno la carga con *Ya tengo mi archivo de avance*.

La llave sólo existe en memoria mientras la app del profesor está abierta; nada se envía a ningún servidor.

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

La app del alumno queda en `https://<usuario>.github.io/<repositorio>/` y la del profesor en
`https://<usuario>.github.io/<repositorio>/profesor/`. Cada alumno necesita internet **sólo la primera
vez** que la abre (descarga unos 25 MB); después puede instalarla (menú del navegador → *Instalar app* /
*Agregar a pantalla de inicio*) y usarla sin conexión.

### Opción B: en una computadora, sin internet

```bash
./scripts/install_deps.sh       # una vez (requiere Python 3.12.1, poetry y Node 22)
./scripts/build.sh              # genera dist/ (alumno) y dist/profesor/ (profesor)
python scripts/servir_local.py  # alumno: http://localhost:8000  profesor: http://localhost:8000/profesor/
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
  - esa clave se guarda cifrada con la contraseña del alumno (**scrypt**) y con la llave pública del profesor
    (**X25519** + HKDF);
  - la llave privada del profesor se deriva de su frase secreta con **scrypt** (N=2^16) y nunca se guarda.
- Perfil y avance del alumno: `frontend/src/local/perfil.js` (IndexedDB en el dispositivo).
- Pantallas nuevas: `frontend/src/local/Acceso.jsx`, `MiAvance.jsx` (alumno) y `PanelProfesor.jsx` (profesor).
- Las dos apps salen del mismo código: `frontend/src/index.js` elige la app según `REACT_APP_MODO`
  (`alumno` o `profesor`), y cada compilación sólo incluye el código de su app.
- La traducción al español de la lección *Crear pares clave-valor*, que faltaba en futurecoder, está en
  `translations/extra/` y se aplica con `python -m translations.extra.apply_extra_es`.
- **Protección contra modificaciones del archivo de avance:**
  - Todo el archivo está **sellado** (cifrado autenticado con la cabecera incluida): si se cambia cualquier
    carácter fuera de la app (con un editor de texto, por ejemplo), el archivo ya no se abre y la app del profesor
    lo reporta como *modificado fuera de la aplicación o dañado*.
  - La app guarda el **código con el que el alumno superó cada paso** y su fecha. El profesor lo ve en *Ver detalle*.
  - La app del profesor revisa la coherencia de cada archivo (pasos sin código registrado, fechas imposibles,
    resumen que no cuadra) y muestra **✔ Íntegro** o **⚠ Revisar** en la columna *Verificación* y en el CSV.
  - Límite honesto: sin un servidor, ninguna app puede impedir al 100 % que un alumno con conocimientos avanzados de
    programación use su propia contraseña para fabricar un archivo con un programa. Estas medidas hacen que tendría
    que escribir soluciones reales para cada paso con fechas coherentes, y el profesor puede revisar ese código.

## Créditos y licencia

Basado en [futurecoder](https://futurecoder.io) de Alex Hall y colaboradores, con la traducción al español de su
comunidad. Licencia MIT (ver `LICENSE.txt`).
