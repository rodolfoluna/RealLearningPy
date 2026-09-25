// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from "worker-loader!./Worker.js";
import {makeChannel} from "sync-message";
import * as Comlink from 'comlink';
import {PyodideClient} from "pyodide-worker-runner";

// URL absoluta de la carpeta de la app (funciona en cualquier ruta del servidor)
const appScope = new URL("./", window.location.href).href;
const channel = makeChannel({serviceWorker: {scope: appScope}});

export const taskClient = new PyodideClient(() => new Worker(), channel);

export async function runCodeTask(entry, outputCallback, inputCallback) {
  let running = true;

  function wrappedOutputCallback(...args) {
    if (running) {
      outputCallback(...args);
    }
  }

  try {
    return await taskClient.call(
      taskClient.workerProxy.runCode,
      entry,
      Comlink.proxy(wrappedOutputCallback),
      Comlink.proxy(inputCallback),
    );
  } catch (e) {
    if (e.type === "InterruptError") {
      return {
        interrupted: true,
        error: null,
        passed: false,
        message_sections: [],
      }
    }
    throw e;
  } finally {
    running = false;
  }
}
