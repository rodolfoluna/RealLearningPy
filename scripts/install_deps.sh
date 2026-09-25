#!/bin/bash

set -eux

# Instala las dependencias de Python (poetry, Python 3.12.1) y de JavaScript (npm)
poetry --version || curl -sSL https://install.python-poetry.org | python3 -
poetry install

cd frontend
npm ci
cd ..
