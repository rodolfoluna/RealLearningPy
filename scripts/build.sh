#!/bin/bash
# Compila RealLearningPy (curso en español, 100% local) en la carpeta dist/
#
# Uso:  ./scripts/build.sh
# Opcional: REACT_APP_CLAVE_PUBLICA_PROFESOR="..." ./scripts/build.sh

set -eux

export FUTURECODER_LANGUAGE=${FUTURECODER_LANGUAGE:-es}

rm -rf dist || true
mkdir -p dist

# Genera el curso (textos, ejercicios y código Python) dentro de frontend/src
poetry run python -m translations.extra.apply_extra_es
poetry run python -m translations.generate_po_file
poetry run python -m scripts.generate_static_files

# Compila la app web (PWA con caché para funcionar sin conexión)
cd frontend
REACT_APP_PRECACHE=1 REACT_APP_LANGUAGE=$FUTURECODER_LANGUAGE CI=false npm run build
cd ..
cp -r frontend/course/* dist/
touch dist/.nojekyll
