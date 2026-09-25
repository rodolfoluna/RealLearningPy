"""
Sirve la aplicación compilada (carpeta dist/) en esta computadora, sin internet.

    python scripts/servir_local.py            # http://localhost:8000
    python scripts/servir_local.py 8080       # otro puerto

Abre la dirección en el navegador (Chrome, Edge o Firefox). Al usar "localhost" el
navegador permite instalar la app (PWA) y guardarla para usarla sin conexión.
"""
import functools
import http.server
import sys
from pathlib import Path

carpeta = Path(__file__).resolve().parent.parent / "dist"
puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class Manejador(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".wasm": "application/wasm",
        ".js": "text/javascript",
        ".json": "application/json",
    }

    def end_headers(self):
        # El service worker debe revisarse siempre para recibir actualizaciones de la app
        if self.path.endswith("service-worker.js"):
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if not (carpeta / "index.html").exists():
    sys.exit(f"No se encontró {carpeta / 'index.html'}. Primero ejecuta ./scripts/build.sh")

print(f"RealLearningPy disponible en http://localhost:{puerto}  (Ctrl+C para detener)")
http.server.ThreadingHTTPServer(
    ("", puerto), functools.partial(Manejador, directory=str(carpeta))
).serve_forever()
