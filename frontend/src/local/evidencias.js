/*
Registro del código con el que el alumno superó cada paso del curso.

Sirve como evidencia para el profesor: cada paso completado en el archivo de avance
va acompañado del código que se ejecutó y la fecha. Un archivo fabricado fuera de la app
tendría que incluir soluciones reales para cada ejercicio, y el profesor puede revisarlas.
*/

import localforage from "localforage";

const almacen = localforage.createInstance({name: "reallearningpy"});
const MAX_CODIGO = 4000;

// Mientras se reemplazan los datos locales (importar archivo, cambiar de alumno)
// no se debe volver a guardar el estado actual del curso.
export const bloqueoGuardado = {activo: false};

let cola = Promise.resolve();

export function registrarPasoSuperado({slug, paso, codigo}) {
  if (bloqueoGuardado.activo || !slug || !paso || slug === "loading_placeholder") {
    return;
  }
  const fecha = new Date().toISOString();
  cola = cola.then(async () => {
    const evidencias = (await almacen.getItem("evidencias")) || {};
    const clave = `${slug}/${paso}`;
    if (evidencias[clave] || bloqueoGuardado.activo) {
      return;
    }
    evidencias[clave] = {codigo: (codigo || "").slice(0, MAX_CODIGO), fecha};
    await almacen.setItem("evidencias", evidencias);
  }).catch(e => console.error(e));
}

export async function cargarEvidencias() {
  await cola;
  return (await almacen.getItem("evidencias")) || {};
}

export async function guardarEvidencias(evidencias) {
  await almacen.setItem("evidencias", evidencias || {});
}

export async function borrarEvidencias() {
  await almacen.removeItem("evidencias");
}
