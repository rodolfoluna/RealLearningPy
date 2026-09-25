const path = require('path');
const {PyodidePlugin} = require("@pyodide/webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

// La app del profesor no ejecuta Python, así que no necesita Pyodide ni birdseye
const esProfesor = process.env.REACT_APP_MODO === "profesor";

module.exports = {
  webpack: {
    plugins: {
      add: esProfesor ? [] : [
        // Copia Pyodide (el intérprete de Python) dentro de la app para no depender de un CDN
        new PyodidePlugin(),
        // Los archivos de birdseye se emiten como parte de la compilación
        // para que el service worker los guarde en caché y funcionen sin conexión
        new CopyPlugin({
          patterns: [{from: "public/birdseye", to: "birdseye", noErrorOnMissing: true}],
        }),
      ]
    },
    configure: (webpackConfig, {env, paths}) => {
      // Output to ./course (instead of ./build)
      paths.appBuild = webpackConfig.output.path = path.resolve('course');

      // Rutas relativas calculadas automáticamente, tanto en la página como en el web worker,
      // para que la app funcione en cualquier carpeta o servidor (p. ej. GitHub Pages o un servidor local)
      webpackConfig.output.publicPath = 'auto';

      for (const plugin of webpackConfig.plugins) {
        if (plugin.constructor.name === 'InjectManifest') {
          // Guardar en caché también los archivos grandes (Pyodide, biblioteca estándar de Python, curso)
          // para que todo funcione sin conexión después de la primera visita
          plugin.config.maximumFileSizeToCacheInBytes = 64 * 1024 * 1024;
        }
      }
      return webpackConfig;
    },
  },
};
