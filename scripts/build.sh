#!/bin/bash
# Compila RealLearningPy (curso en español, 100% local) en la carpeta dist/:
#   dist/            app del alumno (el curso)
#   dist/profesor/   app del profesor (revisar archivos de avance)
#
# Uso:  ./scripts/build.sh
# Opcional: REACT_APP_CLAVE_PUBLICA_PROFESOR="..." ./scripts/build.sh

set -eux

export FUTURECODER_LANGUAGE=${FUTURECODER_LANGUAGE:-es}
# Regenerar la lista de librerías de Python que se empaquetan según el entorno actual
# (evita fallos por archivos propios del entorno virtual, como _virtualenv.py)
export FIX_CORE_IMPORTS=1

rm -rf dist || true
mkdir -p dist

# Genera el curso (textos, ejercicios y código Python) dentro de frontend/src
poetry run python -m translations.extra.apply_extra_es
poetry run python -m translations.generate_po_file
poetry run python -m scripts.generate_static_files

cd frontend

# App del alumno (PWA con caché para funcionar sin conexión)
REACT_APP_MODO=alumno REACT_APP_TITULO="RealLearningPy - Aprende Python" \
  REACT_APP_PRECACHE=1 REACT_APP_LANGUAGE=$FUTURECODER_LANGUAGE CI=false npm run build
cp -r course/* ../dist/

# App del profesor
REACT_APP_MODO=profesor REACT_APP_TITULO="RealLearningPy - Profesor" \
  REACT_APP_PRECACHE=1 REACT_APP_LANGUAGE=$FUTURECODER_LANGUAGE CI=false npm run build
mkdir -p ../dist/profesor
cp -r course/* ../dist/profesor/
# birdseye sólo se usa en el curso (la carpeta public/ se copia a ambas apps)
rm -rf ../dist/profesor/birdseye
cat > ../dist/profesor/manifest.json <<'MANIFEST'
{
  "short_name": "RLPy Profesor",
  "name": "RealLearningPy - Profesor",
  "description": "Revisa los archivos de avance de tus alumnos, sin conexión a internet",
  "lang": "es",
  "icons": [
    {"src": "favicon.ico", "sizes": "64x64 32x32 24x24 16x16", "type": "image/x-icon"},
    {"src": "192x192.png", "type": "image/png", "sizes": "192x192"},
    {"src": "512x512.png", "type": "image/png", "sizes": "512x512"}
  ],
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "theme_color": "#343a40",
  "background_color": "#f4f6f8"
}
MANIFEST

cd ..
touch dist/.nojekyll
